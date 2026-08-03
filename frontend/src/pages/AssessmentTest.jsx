import { useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { useAssessmentSession } from "../hooks/useAssessmentSession";
import {
  RefreshCw,
  SkipForward,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Save,
} from "lucide-react";

const OPTION_KEYS = ["A", "B", "C", "D"];

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function navigatorState(questionNumber, currentQuestionNumber, answerEntry) {
  if (questionNumber === currentQuestionNumber) return "current";
  if (answerEntry?.skipped) return "skipped";
  if (answerEntry?.selected_option) return "answered";
  return "unanswered";
}

const NAV_STYLES = {
  current: "bg-gradient-to-r from-violet-600 to-cyan-500 text-white ring-2 ring-cyan-400",
  answered: "bg-green-500/20 border border-green-500/40 text-green-300",
  skipped: "bg-orange-500/20 border border-orange-500/40 text-orange-300",
  unanswered: "bg-[#0B1120] border border-white/10 text-gray-400",
};

export default function AssessmentTest() {
  const { assessmentId } = useParams();
  const {
    assessment,
    loading,
    error,
    retry,
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
  } = useAssessmentSession(assessmentId);

  const [confirmingFinish, setConfirmingFinish] = useState(false);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 flex flex-col items-center justify-center gap-4">
          <RefreshCw className="text-cyan-400 animate-spin" size={36} />
          <p className="text-gray-300 text-lg">Loading your assessment...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assessment) {
    return (
      <DashboardLayout>
        <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-12 flex flex-col items-center justify-center gap-4">
          <p className="text-red-300 text-lg text-center">
            {error || "This assessment could not be loaded."}
          </p>
          <button
            onClick={retry}
            className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 font-medium hover:bg-red-500/20"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const currentAnswer = currentQuestion
    ? answers[currentQuestion.question_number]
    : null;
  const selected = currentAnswer?.selected_option || null;

  const progressPercent =
    totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const isLowTime = secondsLeft <= 60;

  // True when the student picked an option on the last question but
  // hasn't clicked "Save Answer" yet - shown as a gentle reminder next
  // to Finish Assessment, since Finish deliberately never auto-saves.
  const hasUnsavedSelection = Boolean(selected) && currentAnswer?.saved === false;

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {assessment.category} Assessment
          </h1>
          <p className="text-gray-400 mt-2">{assessment.difficulty} &middot; {totalQuestions} Questions</p>
        </div>

        <div
          className={`flex items-center gap-2 rounded-2xl border px-5 py-3 font-mono text-xl font-bold ${
            isLowTime
              ? "border-red-500/40 bg-red-500/10 text-red-300"
              : "border-white/10 bg-[#0B1120] text-white"
          }`}
        >
          <Clock size={20} />
          {formatTime(secondsLeft)}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Main question area */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          {/* Progress */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <span className="text-cyan-400 font-semibold">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="text-green-400">Answered: {stats.answeredCount}</span>
              <span className="text-orange-400">Skipped: {stats.skippedCount}</span>
              <span>Remaining: {stats.remainingCount}</span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-8">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Question */}
          <div className="rounded-2xl border border-white/10 bg-[#0B1120] p-6 mb-6">
            <p className="text-white text-xl leading-8">
              {currentQuestion?.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {OPTION_KEYS.map((key) => {
              const optionText = currentQuestion?.[`option_${key.toLowerCase()}`];
              const isSelected = selected === key;
              return (
                <button
                  key={key}
                  onClick={() => selectOption(key)}
                  className={`w-full text-left flex items-center gap-4 rounded-2xl border p-4 transition ${
                    isSelected
                      ? "border-cyan-500/60 bg-gradient-to-r from-violet-600/20 to-cyan-500/10"
                      : "border-white/10 bg-[#0B1120] hover:border-white/20"
                  }`}
                >
                  <span
                    className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isSelected
                        ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white"
                        : "bg-white/5 text-gray-400"
                    }`}
                  >
                    {key}
                  </span>
                  <span className="text-gray-200 leading-6">{optionText}</span>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          {isLastQuestion ? (
            <div className="mt-8">
              <div className="flex gap-4">
                <button
                  onClick={skip}
                  disabled={saving || finishing}
                  className="flex-1 py-4 rounded-2xl border border-white/10 text-gray-300 hover:bg-white/5 transition disabled:opacity-60 flex items-center justify-center gap-2 font-semibold"
                >
                  <SkipForward size={18} />
                  Skip
                </button>

                <button
                  onClick={saveAnswer}
                  disabled={saving || finishing}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <RefreshCw className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  Save Answer
                </button>
              </div>

              {hasUnsavedSelection && (
                <p className="text-amber-400 text-sm text-center mt-4">
                  You've selected an answer - click "Save Answer" first, or it
                  won't be included in your submission.
                </p>
              )}

              <div className="mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => setConfirmingFinish(true)}
                  disabled={saving || finishing}
                  className="w-full py-4 rounded-2xl border-2 border-cyan-500/50 text-cyan-300 font-bold hover:bg-cyan-500/10 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  Finish Assessment
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 mt-8">
              <button
                onClick={skip}
                disabled={saving || finishing}
                className="flex-1 py-4 rounded-2xl border border-white/10 text-gray-300 hover:bg-white/5 transition disabled:opacity-60 flex items-center justify-center gap-2 font-semibold"
              >
                <SkipForward size={18} />
                Skip
              </button>

              <button
                onClick={goToNext}
                disabled={saving || finishing}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <ArrowRight size={18} />
                )}
                Save & Next
              </button>
            </div>
          )}
        </div>

        {/* Question Navigator */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 h-fit">
          <h3 className="text-white font-bold mb-5">Question Navigator</h3>

          <div className="grid grid-cols-5 gap-3 mb-6">
            {assessment.questions.map((q) => {
              const state = navigatorState(
                q.question_number,
                currentQuestion?.question_number,
                answers[q.question_number]
              );
              return (
                <button
                  key={q.question_number}
                  onClick={() => jumpToQuestion(q.question_number - 1)}
                  disabled={saving || finishing}
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold transition ${NAV_STYLES[state]}`}
                >
                  {q.question_number}
                </button>
              );
            })}
          </div>

          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500" />
              Current
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500/40 border border-green-500/60" />
              Answered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500/40 border border-orange-500/60" />
              Skipped
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white/10 border border-white/20" />
              Unanswered
            </div>
          </div>
        </div>
      </div>

      {/* Finish confirmation overlay */}
      {confirmingFinish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0B1120] p-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-orange-400" size={26} />
              <h3 className="text-xl font-bold text-white">Submit Assessment?</h3>
            </div>
            <p className="text-gray-400 leading-7 mb-8">
              You've answered {stats.answeredCount} of {totalQuestions} questions.
              Once submitted, you won't be able to change your answers.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmingFinish(false)}
                disabled={finishing}
                className="flex-1 py-3 rounded-2xl border border-white/10 text-gray-300 hover:bg-white/5 transition font-semibold disabled:opacity-60"
              >
                Go Back
              </button>
              <button
                onClick={finish}
                disabled={finishing}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {finishing ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}