import { FileText, ArrowRight } from "lucide-react";

export default function ResumeScoreCard({

  score = 89,

  level = "Excellent",

}) {

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  const offset =
    circumference -
    (score / 100) * circumference;

  return (

    <div
      className="
        rounded-3xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-xl
        p-7
      "
    >

      {/* Heading */}

      <div className="flex justify-between items-center">

        <div>

          <h2 className="text-2xl font-bold text-white">

            Resume Score

          </h2>

          <p className="text-gray-400 mt-1">

            ATS Analysis

          </p>

        </div>

        <div
          className="
            w-12
            h-12
            rounded-xl
            bg-cyan-500/20
            flex
            items-center
            justify-center
          "
        >

          <FileText
            size={24}
            className="text-cyan-400"
          />

        </div>

      </div>

      {/* Score */}

      <div className="flex justify-center mt-8">

        <div className="relative w-40 h-40">

          <svg
            width="160"
            height="160"
            className="-rotate-90"
          >

            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#2A2E45"
              strokeWidth="12"
              fill="none"
            />

            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#06B6D4"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />

          </svg>

          <div
            className="
              absolute
              inset-0
              flex
              flex-col
              items-center
              justify-center
            "
          >

            <h1 className="text-4xl font-bold text-white">

              {score}%

            </h1>

            <p className="text-gray-400 text-sm">

              Score

            </p>

          </div>

        </div>

      </div>

      {/* Resume Level */}

      <div
        className="
          mt-8
          rounded-2xl
          bg-[#0B1023]
          border
          border-white/10
          p-5
        "
      >

        <p className="text-gray-400 text-sm">

          Resume Quality

        </p>

        <h2 className="text-white text-xl font-bold mt-2">

          {level}

        </h2>

      </div>

      {/* Button */}

      <button
        className="
          w-full
          mt-6
          py-3
          rounded-2xl
          bg-gradient-to-r
          from-cyan-500
          to-blue-600
          text-white
          font-semibold
          flex
          items-center
          justify-center
          gap-2
          hover:scale-[1.02]
          transition-all
        "
      >

        Analyze Resume

        <ArrowRight size={18} />

      </button>

    </div>

  );

}