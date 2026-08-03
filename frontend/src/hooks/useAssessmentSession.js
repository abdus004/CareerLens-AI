import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

/**
 * All state and API calls for the timed MCQ Assessment Test page live
 * here, mirroring useInterviewSession.js's shape so the two features
 * stay consistent - but adapted for what's actually different about
 * an assessment: answers are a selected option (not free text), the
 * student can jump to ANY question via the navigator (not just
 * linear next), and there's a real countdown timer seeded from the
 * backend's started_at/expires_at that auto-submits at zero.
 *
 * Fetches the assessment via GET /skill-assessment/{id} on mount
 * (rather than trusting only React Router navigation state), so
 * refreshing mid-assessment resumes correctly instead of losing
 * progress or resetting the timer.
 */
export function useAssessmentSession(assessmentId) {
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  // { [question_number]: { selected_option: 'A'|null, skipped: bool, saved: bool } }
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const finishingRef = useRef(false);

  const loadAssessment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/skill-assessment/${assessmentId}`);
      const data = response.data?.data;
      setAssessment(data);

      const initialAnswers = {};
      data.questions.forEach((q) => {
        initialAnswers[q.question_number] = {
          selected_option: q.selected_option || null,
          skipped: q.skipped || false,
          saved: true,
        };
      });
      setAnswers(initialAnswers);

      const firstUnanswered = data.questions.findIndex(
        (q) => !q.selected_option && !q.skipped
      );
      setCurrentIndex(firstUnanswered === -1 ? 0 : firstUnanswered);

      const expiresAt = new Date(data.expires_at).getTime();
      setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    } catch (err) {
      console.error("Error loading assessment:", err);
      setError(
        err?.response?.data?.detail ||
          "We couldn't load this assessment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  // Countdown ticks client-side every second for a smooth display, but
  // is always seeded from the backend's expires_at - the backend is
  // the one that actually validates timing when the assessment is
  // finished, so a paused tab / clock drift can't grant extra time.
  useEffect(() => {
    if (!assessment || finishing) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [assessment, finishing]);

  const totalQuestions = assessment?.questions?.length || 0;
  const currentQuestion = assessment?.questions?.[currentIndex] || null;
  const isLastQuestion = totalQuestions > 0 && currentIndex === totalQuestions - 1;

  const stats = useMemo(() => {
    let answeredCount = 0;
    let skippedCount = 0;
    Object.values(answers).forEach((a) => {
      if (a.skipped) skippedCount += 1;
      else if (a.selected_option) answeredCount += 1;
    });
    return {
      answeredCount,
      skippedCount,
      remainingCount: Math.max(0, totalQuestions - answeredCount - skippedCount),
    };
  }, [answers, totalQuestions]);

  const selectOption = useCallback((option) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.question_number]: {
        selected_option: option,
        skipped: false,
        saved: false,
      },
    }));
  }, [currentQuestion]);

  const persistAnswer = useCallback(
    async (questionNumber, questionId, selectedOption, skipped) => {
      await api.post(`/skill-assessment/${assessmentId}/answer`, {
        question_number: questionNumber,
        question_id: questionId,
        selected_option: skipped ? null : selectedOption,
        skipped,
      });
      setAnswers((prev) => ({
        ...prev,
        [questionNumber]: {
          selected_option: skipped ? null : selectedOption,
          skipped,
          saved: true,
        },
      }));
    },
    [assessmentId]
  );

  const finish = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    setSaving(true);
    try {
      await api.post(`/skill-assessment/${assessmentId}/finish`);
      navigate(`/assessments/result/${assessmentId}`);
    } catch (err) {
      console.error("Error finishing assessment:", err);
      setError("We couldn't submit your assessment. Please try again.");
      setSaving(false);
      setFinishing(false);
      finishingRef.current = false;
    }
  }, [assessmentId, navigate]);

  // Auto-submit the moment the timer hits zero. Whatever answers are
  // already saved get scored as-is; the backend treats anything never
  // saved as skipped rather than discarding the attempt.
  useEffect(() => {
    if (secondsLeft === 0 && assessment && !finishingRef.current) {
      finish();
    }
  }, [secondsLeft, assessment, finish]);

  const goToNext = useCallback(async () => {
    if (!currentQuestion) return;
    setSaving(true);
    try {
      const current = answers[currentQuestion.question_number] || {};
      await persistAnswer(
        currentQuestion.question_number,
        currentQuestion.question_id,
        current.selected_option || null,
        !current.selected_option
      );

      if (isLastQuestion) {
        setSaving(false);
        return;
      }
      setCurrentIndex((i) => Math.min(i + 1, totalQuestions - 1));
    } catch (err) {
      console.error("Error saving answer:", err);
      setError("We couldn't save that answer. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [answers, currentQuestion, isLastQuestion, persistAnswer, totalQuestions]);

  // Saves the current question's pending selection WITHOUT navigating
  // anywhere. This exists specifically for the last question, which
  // has its own "Save Answer" button separate from "Finish Assessment"
  // - Finish must never silently save a pending selection on its own,
  // so saving and submitting are two deliberate, distinct actions.
  const saveAnswer = useCallback(async () => {
    if (!currentQuestion) return;
    setSaving(true);
    try {
      const current = answers[currentQuestion.question_number] || {};
      await persistAnswer(
        currentQuestion.question_number,
        currentQuestion.question_id,
        current.selected_option || null,
        !current.selected_option
      );
    } catch (err) {
      console.error("Error saving answer:", err);
      setError("We couldn't save that answer. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [answers, currentQuestion, persistAnswer]);

  const skip = useCallback(async () => {
    if (!currentQuestion) return;
    setSaving(true);
    try {
      await persistAnswer(
        currentQuestion.question_number,
        currentQuestion.question_id,
        null,
        true
      );
      if (!isLastQuestion) {
        setCurrentIndex((i) => Math.min(i + 1, totalQuestions - 1));
      }
    } catch (err) {
      console.error("Error skipping question:", err);
      setError("We couldn't skip that question. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [currentQuestion, isLastQuestion, persistAnswer, totalQuestions]);

  const jumpToQuestion = useCallback(
    async (index) => {
      if (!assessment || index === currentIndex) return;
      const target = assessment.questions[index];
      if (!target) return;

      // Persist whatever's pending on the question we're leaving,
      // same as goToNext, so navigator jumps never silently drop a
      // selection the student already made.
      if (currentQuestion) {
        const current = answers[currentQuestion.question_number] || {};
        if (!current.saved) {
          setSaving(true);
          try {
            await persistAnswer(
              currentQuestion.question_number,
              currentQuestion.question_id,
              current.selected_option || null,
              !current.selected_option
            );
          } catch (err) {
            console.error("Error saving answer before navigating:", err);
          } finally {
            setSaving(false);
          }
        }
      }

      setCurrentIndex(index);
    },
    [answers, assessment, currentIndex, currentQuestion, persistAnswer]
  );

  return {
    assessment,
    loading,
    error,
    setError,
    retry: loadAssessment,
    currentIndex,
    currentQuestion,
    isLastQuestion,
    totalQuestions,
    answers,
    selectOption,
    saving,
    finishing,
    secondsLeft,
    stats,
    goToNext,
    saveAnswer,
    skip,
    finish,
    jumpToQuestion,
  };
}