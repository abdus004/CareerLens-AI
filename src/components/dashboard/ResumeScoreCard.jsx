import { FileText, ArrowRight } from "lucide-react";
import DashboardCard from "../common/DashboardCard";

export default function ResumeScoreCard({

  score = 89,

  level = "Excellent",

}) {

  return (

    <DashboardCard
      title="Resume Score"
      subtitle="ATS Resume Analysis"
      icon={<FileText size={22} />}
    >

      <div className="flex justify-between items-center mt-2">

        {/* Left */}

        <div>

          <h1 className="text-5xl font-bold text-cyan-400">

            {score}%

          </h1>

          <p className="text-gray-400 mt-2">

            Resume Quality

          </p>

          <h2 className="text-xl font-semibold text-white mt-1">

            {level}

          </h2>

        </div>

        {/* Right */}

        <div className="w-28">

          <div className="flex justify-between text-sm mb-2">

            <span className="text-gray-400">

              Score

            </span>

            <span className="text-white">

              {score}%

            </span>

          </div>

          <div
            className="
              h-3
              rounded-full
              bg-white/10
              overflow-hidden
            "
          >

            <div
              className="
                h-full
                rounded-full
                bg-gradient-to-r
                from-cyan-500
                to-blue-500
              "
              style={{
                width: `${score}%`,
              }}
            />

          </div>

        </div>

      </div>

      {/* Footer */}

      <div
        className="
          mt-6
          pt-4
          border-t
          border-white/10
          flex
          justify-between
          items-center
        "
      >

        <span className="text-green-400 text-sm">

          ✓ ATS Friendly

        </span>

        <button
          className="
            flex
            items-center
            gap-2
            text-cyan-400
            hover:text-cyan-300
            transition
          "
        >

          Analyze

          <ArrowRight size={16} />

        </button>

      </div>

    </DashboardCard>

  );

}