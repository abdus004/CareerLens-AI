import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { getCurrentUser } from "../utils/session";

const INTERVIEW_TYPES = ["Technical", "HR", "Behavioral", "Mixed"];

const TARGET_ROLES = [
  "None (General Interview)",
  "Software Engineer",
  "AI Engineer",
  "Machine Learning Engineer",
  "Backend Developer",
  "Frontend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "Cloud Engineer",
  "Cybersecurity Engineer",
  "Other",
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const QUESTION_COUNTS = [5, 10, 15, 20];

const SELECT_CLASS =
  "mt-2 w-full rounded-xl bg-[#0B1120] border border-white/10 p-3 text-white outline-none focus:border-cyan-500 transition";

function FieldLabel({ children, optional }) {
  return (
    <label className="text-gray-400">
      {children}
      {optional && <span className="text-gray-500"> (Optional)</span>}
    </label>
  );
}

export default function MockInterview() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [interviewType, setInterviewType] = useState("Technical");
  const [targetRole, setTargetRole] = useState("None (General Interview)");
  const [customRole, setCustomRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [numQuestions, setNumQuestions] = useState(10);
  const [formError, setFormError] = useState(null);

  const isOther = targetRole === "Other";
  const isHR = interviewType === "HR";

  const handleStart = () => {
    if (isOther && customRole.trim().length === 0) {
      setFormError("Please enter your custom role, or choose a different option.");
      return;
    }

    if (!user?.email) {
      setFormError("You need to be logged in to start an interview.");
      return;
    }

    let resolvedRole = null;
    if (targetRole === "Other") {
      resolvedRole = customRole.trim();
    } else if (targetRole !== "None (General Interview)") {
      resolvedRole = targetRole;
    }

    navigate("/mock-interview/mode", {
      state: {
        email: user.email,
        interview_type: interviewType,
        target_role: resolvedRole,
        difficulty,
        num_questions: numQuestions,
      },
    });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">AI Mock Interview</h1>
        <p className="text-gray-400 mt-2">
          Practice technical and HR interviews powered by AI.
        </p>
      </div>

      {/* Interview Setup */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-8">Interview Setup</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Interview Type */}
          <div>
            <FieldLabel>Interview Type</FieldLabel>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className={SELECT_CLASS}
            >
              {INTERVIEW_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Target Role */}
          <div>
            <FieldLabel optional={isHR}>Target Role</FieldLabel>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className={SELECT_CLASS}
            >
              {TARGET_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            {isOther && (
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Enter Custom Role"
                className={`${SELECT_CLASS} mt-3`}
              />
            )}
          </div>

          {/* Difficulty */}
          <div>
            <FieldLabel>Difficulty</FieldLabel>
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

          {/* Number of Questions */}
          <div>
            <FieldLabel>Number of Questions</FieldLabel>
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

        {formError && (
          <p className="mt-6 text-red-400 text-sm">{formError}</p>
        )}

        <button
          onClick={handleStart}
          className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold hover:opacity-90 transition"
        >
          Start Interview
        </button>
      </div>

      

      {/* Interview Guidelines */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Before You Start</h2>

        <div className="grid md:grid-cols-2 gap-5">
          {[
            "Choose a quiet place with minimal distractions.",
            "Answer naturally instead of memorizing responses.",
            "Take a moment to think before answering.",
            "For HR interviews, be honest and confident.",
            "For technical interviews, explain your thought process clearly.",
            "Review the AI feedback after every interview.",
          ].map((tip) => (
            <div
              key={tip}
              className="rounded-2xl border border-white/10 bg-[#0B1120] p-5"
            >
              <p className="text-gray-300 leading-7">✅ {tip}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}