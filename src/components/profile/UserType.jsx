import { useState } from "react";
import { GraduationCap, Briefcase } from "lucide-react";

export default function UserType({ onNext }) {
  const [selected, setSelected] = useState("");

  const cardStyle = (value) =>
    `
    cursor-pointer
    rounded-3xl
    border
    p-8
    transition-all
    duration-300
    ${
      selected === value
        ? "border-violet-500 bg-violet-500/15 shadow-[0_0_30px_rgba(139,92,246,.35)]"
        : "border-white/10 bg-white/5 hover:border-violet-400/40 hover:bg-white/10"
    }
  `;

  return (
    <div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Student */}

        <div
          className={cardStyle("Student")}
          onClick={() => setSelected("Student")}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center">

            <GraduationCap size={32} className="text-white" />

          </div>

          <h3 className="text-white text-2xl font-bold mt-6">
            Student
          </h3>

          <p className="text-gray-400 mt-3 leading-7">
            I'm currently studying and want career guidance based on my education and skills.
          </p>

        </div>

        {/* Job Seeker */}

        <div
          className={cardStyle("Job Seeker")}
          onClick={() => setSelected("Job Seeker")}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">

            <Briefcase size={32} className="text-white" />

          </div>

          <h3 className="text-white text-2xl font-bold mt-6">
            Job Seeker
          </h3>

          <p className="text-gray-400 mt-3 leading-7">
            I'm looking for a job and want personalized career recommendations.
          </p>

        </div>

      </div>

      {/* Next Button */}

      <button
        disabled={!selected}
        onClick={() => onNext(selected)}
        className={`
          mt-10
          w-full
          py-4
          rounded-2xl
          font-semibold
          text-lg
          transition-all
          ${
            selected
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:scale-[1.02]"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }
        `}
      >
        Next →
      </button>

    </div>
  );
}