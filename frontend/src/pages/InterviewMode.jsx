import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import api from "../services/api";
import { MessageSquare, Mic, RefreshCw } from "lucide-react";

export default function InterviewMode() {
  const location = useLocation();
  const navigate = useNavigate();
  const settings = location.state;

  const [startingMode, setStartingMode] = useState(null); // "chat" | "voice" | null
  const [error, setError] = useState(null);

  if (!settings) {
    // Reached directly (refresh, back button, bookmarked URL) with no
    // setup data to start an interview from - send the student back to
    // configure one rather than showing a broken page.
    navigate("/mock-interview", { replace: true });
    return null;
  }

  const startInterview = async (mode) => {
    try {
      setStartingMode(mode);
      setError(null);

      const response = await api.post("/mock-interview/start", {
        email: settings.email,
        interview_type: settings.interview_type,
        target_role: settings.target_role,
        difficulty: settings.difficulty,
        num_questions: settings.num_questions,
      });

      const interviewId = response.data?.data?.interview_id;
      navigate(`/mock-interview/${mode}/${interviewId}`);
    } catch (err) {
      console.error("Error starting interview:", err);
      setError(
        err?.response?.data?.detail ||
          "We couldn't start the interview. Please try again."
      );
      setStartingMode(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">Choose Interview Mode</h1>
        <p className="text-gray-400 mt-2">
          {settings.interview_type} interview
          {settings.target_role ? ` \u00b7 ${settings.target_role}` : " \u00b7 General"}
          {" \u00b7 "}
          {settings.difficulty}
          {" \u00b7 "}
          {settings.num_questions} Questions
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Chat Interview */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 flex flex-col">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6">
            <MessageSquare className="text-cyan-400" size={26} />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">Chat Interview</h2>
          <p className="text-gray-400 leading-7 flex-1">
            Answer interview questions by typing.
          </p>

          <button
            onClick={() => startInterview("chat")}
            disabled={startingMode !== null}
            className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {startingMode === "chat" && <RefreshCw className="animate-spin" size={18} />}
            {startingMode === "chat" ? "Preparing your interview..." : "Start Chat Interview"}
          </button>
        </div>

        {/* Voice Interview */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 flex flex-col">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-6">
            <Mic className="text-violet-400" size={26} />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">Voice Interview</h2>
          <p className="text-gray-400 leading-7 flex-1">
            Answer interview questions using your microphone. The AI reads
            each question aloud, and your speech is automatically converted
            into text.
          </p>

          <button
            onClick={() => startInterview("voice")}
            disabled={startingMode !== null}
            className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {startingMode === "voice" && <RefreshCw className="animate-spin" size={18} />}
            {startingMode === "voice" ? "Preparing your interview..." : "Start Voice Interview"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}