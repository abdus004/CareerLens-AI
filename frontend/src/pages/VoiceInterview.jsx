import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { useInterviewSession } from "../hooks/useInterviewSession";
import {
  RefreshCw,
  SkipForward,
  ArrowRight,
  CheckCircle2,
  Mic,
  MicOff,
  Volume2,
} from "lucide-react";

// Browser-native only, per spec - no paid speech API. Safari/Firefox
// don't implement SpeechRecognition; the page degrades to "type your
// answer" in that case rather than breaking.
const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export default function VoiceInterview() {
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
  } = useInterviewSession(interviewId, "voice");

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micSupported] = useState(!!SpeechRecognitionAPI);

  const recognitionRef = useRef(null);
  const baseAnswerRef = useRef("");

  // Read the current question aloud automatically whenever it changes.
  useEffect(() => {
    if (!currentQuestion || typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentQuestion.question_text);
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.question_number]);

  // Stop listening and cancel any speech when the question changes or
  // the page unmounts - a stray recognition/utterance must never
  // bleed into the next question.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, [currentQuestion?.question_number]);

  const startListening = () => {
    if (!SpeechRecognitionAPI) return;

    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    baseAnswerRef.current = answerText ? `${answerText} ` : "";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setAnswerText(`${baseAnswerRef.current}${transcript}`);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const replayQuestion = () => {
    if (!currentQuestion || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentQuestion.question_text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleAdvance = async (action) => {
    stopListening();
    await action();
  };

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
        <h1 className="text-3xl font-bold text-white">Voice Interview</h1>
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
          <div className="flex items-start justify-between gap-4">
            <p className="text-white text-xl leading-8">{currentQuestion?.question_text}</p>

            <button
              onClick={replayQuestion}
              title="Replay question"
              className="flex-shrink-0 w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
            >
              <Volume2 size={18} className={isSpeaking ? "text-cyan-400" : "text-gray-400"} />
            </button>
          </div>

          {isSpeaking && (
            <p className="text-cyan-400 text-sm mt-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              AI is reading the question aloud...
            </p>
          )}
        </div>

        {/* Mic control */}
        <div className="flex justify-center mb-6">
          {micSupported ? (
            <button
              onClick={isListening ? stopListening : startListening}
              className={`
                w-20 h-20 rounded-full flex items-center justify-center transition-all
                ${isListening
                  ? "bg-red-500/20 border-2 border-red-500 animate-pulse"
                  : "bg-gradient-to-r from-violet-600 to-cyan-500 hover:scale-105"}
              `}
            >
              {isListening ? <MicOff size={28} className="text-red-400" /> : <Mic size={28} className="text-white" />}
            </button>
          ) : (
            <p className="text-gray-500 text-sm text-center max-w-sm">
              Voice input isn't supported in this browser. You can still type
              your answer below.
            </p>
          )}
        </div>

        {isListening && (
          <p className="text-center text-red-400 text-sm mb-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            Listening... tap the mic again when you're done.
          </p>
        )}

        {/* Live transcript / editable answer */}
        <label className="text-gray-400 text-sm">
          Transcript {micSupported && "(edit freely before saving)"}
        </label>
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="Tap the mic and start speaking, or type your answer here..."
          rows={8}
          className="mt-2 w-full rounded-2xl bg-[#0B1120] border border-white/10 p-5 text-white outline-none focus:border-cyan-500 transition resize-none leading-7"
        />

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => handleAdvance(skip)}
            disabled={saving}
            className="flex-1 py-4 rounded-2xl border border-white/10 text-gray-300 hover:bg-white/5 transition disabled:opacity-60 flex items-center justify-center gap-2 font-semibold"
          >
            <SkipForward size={18} />
            Skip
          </button>

          {isLastQuestion ? (
            <button
              onClick={() => handleAdvance(finish)}
              disabled={saving}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Finish Interview
            </button>
          ) : (
            <button
              onClick={() => handleAdvance(goToNext)}
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