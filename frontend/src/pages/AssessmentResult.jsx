import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import api from "../services/api";
import { getCurrentUser } from "../utils/session";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  MinusCircle,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  LogOut,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const CATEGORY_LABELS = {
  "Programming": "Programming",
  "Aptitude": "Aptitude",
  "Reasoning": "Reasoning",
  "SQL": "SQL",
  "Python": "Python",
  "Java": "Java",
  "AI/ML": "AI / ML",
};

function topicBarColor(percentage) {
  if (percentage >= 75) return "bg-green-500";
  if (percentage >= 50) return "bg-orange-400";
  return "bg-red-500";
}

function ScoreRing({ percentage }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg className="w-48 h-48 -rotate-90">
        <circle cx="96" cy="96" r={radius} stroke="currentColor" strokeWidth="12" fill="none" className="text-white/10" />
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="url(#assessmentScoreGradient)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id="assessmentScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-white">{percentage}</span>
        <span className="text-gray-400 text-sm">/ 100</span>
      </div>
    </div>
  );
}

export default function AssessmentResult() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retaking, setRetaking] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(false);
  const [certError, setCertError] = useState(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [review, setReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/skill-assessment/${assessmentId}/result`);
        setResult(response.data?.data);
      } catch (err) {
        console.error("Error loading assessment result:", err);
        setError(
          err?.response?.data?.detail ||
            "We couldn't load your results. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    loadResult();
  }, [assessmentId]);

  const handleRetake = async () => {
    if (!user?.email) return;
    try {
      setRetaking(true);
      const response = await api.post(`/skill-assessment/${assessmentId}/retake`, {
        email: user.email,
      });
      const newAssessmentId = response.data?.data?.assessment_id;
      navigate(`/assessments/test/${newAssessmentId}`);
    } catch (err) {
      console.error("Error retaking assessment:", err);
      setError(
        err?.response?.data?.detail ||
          "We couldn't start a new attempt. Please try again."
      );
      setRetaking(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!user?.email) return;
    try {
      setDownloadingCert(true);
      setCertError(null);
      const response = await api.post(
        `/skill-assessment/${assessmentId}/certificate`,
        { email: user.email }
      );
      const pdfUrl = response.data?.data?.pdf_url;
      if (pdfUrl) window.open(pdfUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Error generating certificate:", err);
      setCertError(
        err?.response?.data?.detail ||
          "We couldn't generate your certificate. Please try again."
      );
    } finally {
      setDownloadingCert(false);
    }
  };

  const toggleReview = async () => {
    if (reviewOpen) {
      setReviewOpen(false);
      return;
    }
    setReviewOpen(true);
    if (review) return;

    try {
      setReviewLoading(true);
      const response = await api.get(`/skill-assessment/${assessmentId}/review`);
      setReview(response.data?.data || []);
    } catch (err) {
      console.error("Error loading answer review:", err);
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 flex flex-col items-center justify-center gap-4">
          <RefreshCw className="text-cyan-400 animate-spin" size={36} />
          <p className="text-gray-300 text-lg">Loading your results...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !result) {
    return (
      <DashboardLayout>
        <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-12 flex flex-col items-center justify-center gap-4">
          <p className="text-red-300 text-lg text-center">{error}</p>
          <button
            onClick={() => navigate("/assessments")}
            className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 font-medium hover:bg-red-500/20"
          >
            Back to Assessments
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const categoryLabel = CATEGORY_LABELS[result.category] || result.category;
  const hasAiFeedback = result.ai_feedback_available;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">Skill Assessment Result</h1>
        <p className="text-gray-400 mt-2">
          {categoryLabel} &middot; {result.difficulty}
        </p>
      </div>

      {/* Overall Score */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-10 flex flex-col items-center mb-8">
        <ScoreRing percentage={result.percentage} />
        <p
          className={`mt-4 text-lg font-bold tracking-wide ${
            result.passed ? "text-green-400" : "text-red-400"
          }`}
        >
          {result.passed ? "PASSED" : "FAILED"}
        </p>
        <p className="text-gray-400 mt-1">
          {result.correct_count} correct out of {result.total_questions} questions
        </p>
      </div>

      {/* Correct / Incorrect / Skipped */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6 text-center">
          <CheckCircle2 className="text-green-400 mx-auto mb-2" size={26} />
          <p className="text-3xl font-bold text-white">{result.correct_count}</p>
          <p className="text-gray-400 text-sm mt-1">Correct</p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <XCircle className="text-red-400 mx-auto mb-2" size={26} />
          <p className="text-3xl font-bold text-white">{result.incorrect_count}</p>
          <p className="text-gray-400 text-sm mt-1">Incorrect</p>
        </div>
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6 text-center">
          <MinusCircle className="text-orange-400 mx-auto mb-2" size={26} />
          <p className="text-3xl font-bold text-white">{result.skipped_count}</p>
          <p className="text-gray-400 text-sm mt-1">Skipped</p>
        </div>
      </div>

      {/* Topic Performance */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Topic Performance</h2>
        <div className="space-y-5">
          {(result.topic_performance || []).map((topic) => (
            <div key={topic.topic}>
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">{topic.topic}</span>
                <span className="text-white font-semibold">
                  {topic.percentage}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full ${topicBarColor(topic.percentage)} transition-all`}
                  style={{ width: `${topic.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Feedback */}
      {hasAiFeedback ? (
        <>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-8">
              <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <CheckCircle2 className="text-green-400" size={22} />
                Strengths
              </h2>
              <div className="space-y-3">
                {(result.strengths || []).length === 0 ? (
                  <p className="text-gray-400">No specific strengths identified.</p>
                ) : (
                  result.strengths.map((item, i) => (
                    <p key={i} className="text-gray-300 leading-7">
                      &bull; {item}
                    </p>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-orange-500/20 bg-orange-500/5 p-8">
              <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <AlertTriangle className="text-orange-400" size={22} />
                Weak Areas
              </h2>
              <div className="space-y-3">
                {(result.weak_areas || []).length === 0 ? (
                  <p className="text-gray-400">No weak areas identified - great job!</p>
                ) : (
                  result.weak_areas.map((item, i) => (
                    <p key={i} className="text-gray-300 leading-7">
                      &bull; {item}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-8 mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="text-cyan-400" size={22} />
              Recommendations
            </h2>
            <div className="space-y-3">
              {(result.recommendations || []).map((item, i) => (
                <p key={i} className="text-gray-300 leading-7">
                  &bull; {item}
                </p>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 mb-8">
          <p className="text-gray-400">
            AI feedback isn't available for this attempt right now, but your score
            above is final and accurate.
          </p>
        </div>
      )}

      {/* Review Answers */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 mb-8">
        <button
          onClick={toggleReview}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 className="text-2xl font-bold text-white">Review Answers</h2>
          {reviewOpen ? (
            <ChevronUp className="text-gray-400" size={24} />
          ) : (
            <ChevronDown className="text-gray-400" size={24} />
          )}
        </button>

        {reviewOpen && (
          <div className="mt-6 space-y-4">
            {reviewLoading ? (
              <div className="flex items-center gap-3 text-gray-400">
                <RefreshCw className="animate-spin" size={18} />
                Loading review...
              </div>
            ) : (
              (review || []).map((q) => (
                <div
                  key={q.question_number}
                  className="rounded-2xl border border-white/10 bg-[#0B1120] p-6"
                >
                  <p className="text-cyan-400 text-sm font-semibold mb-2">
                    Question {q.question_number}
                  </p>
                  <p className="text-white mb-4 leading-7">{q.question}</p>

                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div
                      className={`rounded-xl border p-3 ${
                        q.skipped
                          ? "border-orange-500/30 bg-orange-500/5"
                          : q.is_correct
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-red-500/30 bg-red-500/5"
                      }`}
                    >
                      <p className="text-gray-400 text-xs mb-1">Your Answer</p>
                      <p className="text-white font-medium">
                        {q.skipped
                          ? "Skipped"
                          : `${q.your_answer}. ${q.your_answer_text}`}
                      </p>
                    </div>
                    <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-3">
                      <p className="text-gray-400 text-xs mb-1">Correct Answer</p>
                      <p className="text-white font-medium">
                        {q.correct_answer}. {q.correct_answer_text}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm leading-6">
                    {q.explanation}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {certError && <p className="text-red-400 text-sm mb-4">{certError}</p>}

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        {result.passed && (
          <button
            onClick={handleDownloadCertificate}
            disabled={downloadingCert}
            className="flex-1 min-w-[220px] py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {downloadingCert ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <Download size={18} />
            )}
            Download Certificate
          </button>
        )}

        <button
          onClick={handleRetake}
          disabled={retaking}
          className="flex-1 min-w-[220px] py-4 rounded-2xl border border-white/10 text-gray-300 hover:bg-white/5 transition disabled:opacity-60 flex items-center justify-center gap-2 font-semibold"
        >
          {retaking ? (
            <RefreshCw className="animate-spin" size={18} />
          ) : (
            <RotateCcw size={18} />
          )}
          Retake Assessment
        </button>

        <button
          onClick={() => navigate("/assessments")}
          className="flex-1 min-w-[220px] py-4 rounded-2xl border border-white/10 text-gray-300 hover:bg-white/5 transition flex items-center justify-center gap-2 font-semibold"
        >
          <LogOut size={18} />
          Exit
        </button>
      </div>
    </DashboardLayout>
  );
}
