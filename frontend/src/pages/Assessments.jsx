import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import api from "../services/api";
import { getCurrentUser } from "../utils/session";
import { getErrorMessage } from "../utils/apiError";
import {
  Code2,
  Calculator,
  Brain,
  Database,
  FileCode,
  Coffee,
  Cpu,
  Clock,
  RefreshCw,
  PlayCircle,
  Award,
  ClipboardList,
} from "lucide-react";

const CATEGORIES = [
  {
    key: "Programming",
    label: "Programming",
    icon: Code2,
    description:
      "Test your programming fundamentals - variables, loops, functions, OOP, data structures and algorithms.",
  },
  {
    key: "Aptitude",
    label: "Aptitude",
    icon: Calculator,
    description:
      "Test your quantitative aptitude across percentages, ratios, time & work, probability and more.",
  },
  {
    key: "Reasoning",
    label: "Reasoning",
    icon: Brain,
    description:
      "Test your logical reasoning across series, coding-decoding, blood relations, syllogisms and puzzles.",
  },
  {
    key: "SQL",
    label: "SQL",
    icon: Database,
    description:
      "Test your SQL knowledge across queries, joins, keys, normalization, indexes and transactions.",
  },
  {
    key: "Python",
    label: "Python",
    icon: FileCode,
    description:
      "Test your Python knowledge across core concepts and practical, real-world scenarios.",
  },
  {
    key: "Java",
    label: "Java",
    icon: Coffee,
    description:
      "Test your Java knowledge across OOP, collections, exceptions and core language fundamentals.",
  },
  {
    key: "AI/ML",
    label: "AI / ML",
    icon: Cpu,
    description:
      "Test your AI & Machine Learning knowledge across algorithms, model evaluation and core concepts.",
  },
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const QUESTION_COUNTS = [10, 15, 20];
const SECONDS_PER_QUESTION = { Easy: 60, Medium: 75, Hard: 90 };

const ASSESSMENT_INSTRUCTIONS = [
  "Read each question carefully before answering.",
  "Each question has only one correct answer.",
  "Use the Question Navigator to move between questions.",
  "You may skip questions and return later.",
  "Your assessment is timed.",
  "The assessment will automatically submit when the timer expires.",
  "Answers can be changed before final submission.",
  "Correct answers are not shown until the assessment is submitted.",
  "A minimum score of 80% is required to pass.",
  "Students scoring 80% or above unlock a downloadable CareerLens AI Certificate.",
];

const SELECT_CLASS =
  "mt-2 w-full rounded-xl bg-[#0B1120] border border-white/10 p-3 text-white outline-none focus:border-cyan-500 transition";

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (seconds === 0) return `${minutes} min`;
  return `${minutes} min ${seconds} sec`;
}

function scoreColor(passed) {
  return passed ? "text-green-400" : "text-red-400";
}

export default function Assessments() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [difficulty, setDifficulty] = useState("Medium");
  const [numQuestions, setNumQuestions] = useState(10);
  const [starting, setStarting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.email) {
        setHistoryLoading(false);
        return;
      }
      try {
        const response = await api.get("/skill-assessment/history", {
          params: { email: user.email },
        });
        setHistory(response.data?.data || []);
      } catch (err) {
        console.error("Error loading assessment history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCategory = useMemo(
    () => CATEGORIES.find((c) => c.key === selectedCategory) || null,
    [selectedCategory]
  );

  const durationSeconds = numQuestions * SECONDS_PER_QUESTION[difficulty];

  const handleSelectCategory = (key) => {
    setSelectedCategory(key);
    setFormError(null);
  };

  const handleStart = async () => {
    if (!user?.email) {
      setFormError("You need to be logged in to start an assessment.");
      return;
    }

    try {
      setStarting(true);
      setFormError(null);
      const response = await api.post("/skill-assessment/start", {
        email: user.email,
        category: selectedCategory,
        difficulty,
        num_questions: numQuestions,
      });
      const assessmentId = response.data?.data?.assessment_id;
      navigate(`/assessments/test/${assessmentId}`);
    } catch (err) {
      console.error("Error starting assessment:", err);
      setFormError(
        getErrorMessage(err, "We couldn't start this assessment. Please try again.")
      );
      setStarting(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">Skill Assessments</h1>
        <p className="text-gray-400 mt-2">
          Test your skills and identify areas to improve.
        </p>
      </div>

      {/* Categories */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-8">Choose a Topic</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => handleSelectCategory(cat.key)}
                className={`text-left rounded-2xl border p-6 transition ${
                  isActive
                    ? "border-cyan-500/60 bg-gradient-to-br from-violet-600/20 to-cyan-500/10"
                    : "border-white/10 bg-[#0B1120] hover:border-white/20"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-cyan-500"
                      : "bg-white/5"
                  }`}
                >
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="text-white font-bold">{cat.label}</h3>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assessment Instructions + Setup */}
      {activeCategory && (
        <>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <ClipboardList size={20} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                Assessment Instructions
              </h2>
            </div>

            <ul className="space-y-3">
              {ASSESSMENT_INSTRUCTIONS.map((line, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300 leading-6">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {activeCategory.label} Assessment
            </h2>
            <p className="text-gray-400 mb-8">{activeCategory.description}</p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-gray-400">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className={SELECT_CLASS}
                >
                  {DIFFICULTIES.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400">Number of Questions</label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className={SELECT_CLASS}
                >
                  {QUESTION_COUNTS.map((count) => (
                    <option key={count} value={count}>
                      {count} Questions
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0B1120] px-5 py-4">
              <Clock size={20} className="text-cyan-400 flex-shrink-0" />
              <p className="text-gray-300">
                Test duration:{" "}
                <span className="text-white font-semibold">
                  {formatDuration(durationSeconds)}
                </span>
              </p>
            </div>

            {formError && <p className="mt-6 text-red-400 text-sm">{formError}</p>}

            <button
              onClick={handleStart}
              disabled={starting}
              className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {starting ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : (
                <PlayCircle size={18} />
              )}
              Start Assessment
            </button>
          </div>
        </>
      )}

      {/* Previous Assessments */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          Previous Assessments
        </h2>

        {historyLoading ? (
          <div className="flex items-center gap-3 text-gray-400">
            <RefreshCw className="animate-spin" size={18} />
            Loading your assessment history...
          </div>
        ) : history.length === 0 ? (
          <p className="text-gray-400">
            You haven't completed any assessments yet. Pick a topic above to get
            started.
          </p>
        ) : (
          <div className="space-y-5">
            {history.map((item) => {
              const categoryLabel =
                CATEGORIES.find((c) => c.key === item.category)?.label ||
                item.category;
              return (
                <div
                  key={item.assessment_id}
                  className="rounded-2xl border border-white/10 bg-[#0B1120] p-5 flex justify-between items-center flex-wrap gap-4"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {categoryLabel} &middot; {item.difficulty}
                    </h3>
                    <p className="text-gray-400 mt-1">
                      {new Date(item.completed_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="text-right flex items-center gap-6">
                    <div>
                      <p className={`text-2xl font-bold ${scoreColor(item.passed)}`}>
                        {item.percentage}%
                      </p>
                      <p
                        className={`text-xs font-semibold ${
                          item.passed ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {item.passed ? "PASSED" : "FAILED"}
                      </p>
                    </div>

                    {item.certificate && (
                      <Award size={20} className="text-cyan-400" />
                    )}

                    <button
                      onClick={() =>
                        navigate(`/assessments/result/${item.assessment_id}`)
                      }
                      className="text-cyan-400 hover:text-cyan-300 transition font-medium"
                    >
                      View Report
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}