import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

/**
 * All state and API calls shared by ChatInterview.jsx and
 * VoiceInterview.jsx live here, once - the two pages differ only in
 * how the student answers (typing vs. speaking into the same
 * textarea), not in how progress is tracked, saved, or finished. This
 * is what keeps "Save & Next" / "Skip" / "Finish Interview" as a
 * single, tested implementation instead of two copies that could
 * drift apart.
 *
 * Fetches the interview via GET /mock-interview/{id} on mount (rather
 * than trusting only React Router navigation state), so refreshing
 * mid-interview resumes correctly instead of losing progress.
 */
export function useInterviewSession(interviewId, mode) {
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [saving, setSaving] = useState(false);

  const questionStartedAt = useRef(Date.now());

  const loadInterview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/mock-interview/${interviewId}`);
      const data = response.data?.data;
      setInterview(data);

      // Resume at the first not-yet-answered question, not always Q1.
      const firstUnanswered = data.questions.findIndex(
        (q) => q.answer_text === "" && !q.skipped
      );
      const resumeIndex = firstUnanswered === -1 ? 0 : firstUnanswered;

      setCurrentIndex(resumeIndex);
      setAnswerText(data.questions[resumeIndex]?.answer_text || "");
      questionStartedAt.current = Date.now();
    } catch (err) {
      console.error("Error loading interview:", err);
      setError(
        err?.response?.data?.detail ||
          "We couldn't load this interview. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    loadInterview();
  }, [loadInterview]);

  const currentQuestion = interview?.questions?.[currentIndex] || null;
  const isLastQuestion = interview
    ? currentIndex === interview.questions.length - 1
    : false;

  const saveCurrentAnswer = useCallback(
    async (skipped) => {
      if (!currentQuestion) return;

      const timeTaken = Math.max(
        0,
        Math.round((Date.now() - questionStartedAt.current) / 1000)
      );

      await api.post(`/mock-interview/${interviewId}/answer`, {
        question_number: currentQuestion.question_number,
        question_id: currentQuestion.question_id,
        question_text: currentQuestion.question_text,
        answer_text: skipped ? "" : answerText,
        time_taken_seconds: timeTaken,
        skipped,
      });
    },
    [answerText, currentQuestion, interviewId]
  );

  const goToNext = useCallback(async () => {
    setSaving(true);
    try {
      await saveCurrentAnswer(false);
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setAnswerText(interview.questions[nextIndex]?.answer_text || "");
      questionStartedAt.current = Date.now();
    } catch (err) {
      console.error("Error saving answer:", err);
      setError("We couldn't save that answer. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [currentIndex, interview, saveCurrentAnswer]);

  const skip = useCallback(async () => {
    setSaving(true);
    try {
      await saveCurrentAnswer(true);

      if (isLastQuestion) {
        await finish();
        return;
      }

      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setAnswerText(interview.questions[nextIndex]?.answer_text || "");
      questionStartedAt.current = Date.now();
    } catch (err) {
      console.error("Error skipping question:", err);
      setError("We couldn't skip that question. Please try again.");
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, interview, isLastQuestion, saveCurrentAnswer]);

  const finish = useCallback(async () => {
    setSaving(true);
    try {
      await saveCurrentAnswer(false);
      await api.post(`/mock-interview/${interviewId}/finish`);
      navigate(`/mock-interview/result/${interviewId}`, { state: { mode } });
    } catch (err) {
      console.error("Error finishing interview:", err);
      setError("We couldn't submit your interview. Please try again.");
      setSaving(false);
    }
  }, [interviewId, navigate, saveCurrentAnswer]);

  return {
    interview,
    loading,
    error,
    setError,
    retry: loadInterview,
    currentIndex,
    currentQuestion,
    isLastQuestion,
    answerText,
    setAnswerText,
    saving,
    goToNext,
    skip,
    finish,
  };
}