import { FileText } from "lucide-react";
import DashboardCard from "../common/DashboardCard";

export default function ResumeScoreCard({
  score = 89,
  level = "Excellent",
}) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (circumference * score) / 100;

  return (
    <DashboardCard
      title="Resume Score"
      subtitle="ATS Resume Analysis"
      icon={<FileText size={22} />}
    >
      <div className="flex items-center justify-between mt-6">

        {/* Left Side */}
        <div className="flex flex-col items-center justify-center w-40">

          <div className="relative w-36 h-36">

            <svg
              className="w-36 h-36 -rotate-90"
              viewBox="0 0 144 144"
            >
              {/* Background Circle */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                stroke="#2B3148"
                strokeWidth="10"
                fill="none"
              />

              {/* Progress Circle */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                stroke="#22D3EE"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={progress}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <h1 className="text-4xl font-extrabold text-white">
                {score}%
              </h1>

              <p className="text-sm text-cyan-400 font-medium mt-1">
                {level}
              </p>
            </div>

          </div>

        </div>

        {/* Right Side */}
        <div className="w-44 space-y-4">

          <div className="flex justify-between items-center">
            <span className="text-gray-400">
              ATS Friendly
            </span>

            <span className="text-green-400 font-bold text-lg">
              ✓
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">
              Grammar
            </span>

            <span className="text-white font-semibold">
              90%
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">
              Keywords
            </span>

            <span className="text-white font-semibold">
              85%
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">
              Formatting
            </span>

            <span className="text-white font-semibold">
              95%
            </span>
          </div>

        </div>

      </div>
    </DashboardCard>
  );
}