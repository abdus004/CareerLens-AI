import { useParams } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { useInterviewSession } from "../hooks/useInterviewSession";
import { RefreshCw, SkipForward, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ChatInterview() {
  const { interviewId } = useParams();
  const {
    interview,
    loading,
    error,
    retry,
    currentIndex,
    currentQuestion,
    isLastQuestion,
    answerText,
    setAnswerText,
    saving,
    goToNext,
    skip,
    finish,
  } = useInterviewSession(interviewId, "chat");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 flex flex-col items-center justify-center gap-4">
          <RefreshCw className="text-cyan-400 animate-spin" size={36} />
          <p className="text-gray-300 text-lg">Loading your interview...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !interview) {
    return (
      <DashboardLayout>
        <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-12 flex flex-col items-center justify-center gap-4">
          <p className="text-red-300 text-lg text-center">
            {error || "This interview could not be loaded."}
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

  const totalQuestions = interview.questions.length;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Chat Interview</h1>
        <p className="text-gray-400 mt-2">
          {interview.interview_type}
          {interview.target_role ? ` \u00b7 ${interview.target_role}` : " \u00b7 General"}
          {" \u00b7 "}
          {interview.difficulty}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-cyan-400 font-semibold">
            Question {currentIndex + 1} of {totalQuestions}
          </span>

          <div className="w-40 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="rounded-2xl border border-white/10 bg-[#0B1120] p-6 mb-6">
          <p className="text-white text-xl leading-8">{currentQuestion?.question_text}</p>
        </div>

        {/* Answer */}
        <label className="text-gray-400 text-sm">Your Answer</label>
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="Type your answer here..."
          rows={10}
          className="mt-2 w-full rounded-2xl bg-[#0B1120] border border-white/10 p-5 text-white outline-none focus:border-cyan-500 transition resize-none leading-7"
        />

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={skip}
            disabled={saving}
            className="flex-1 py-4 rounded-2xl border border-white/10 text-gray-300 hover:bg-white/5 transition disabled:opacity-60 flex items-center justify-center gap-2 font-semibold"
          >
            <SkipForward size={18} />
            Skip
          </button>

          {isLastQuestion ? (
            <button
              onClick={finish}
              disabled={saving}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Finish Interview
            </button>
          ) : (
            <button
              onClick={goToNext}
              disabled={saving}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <ArrowRight size={18} />}
              Save & Next
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}