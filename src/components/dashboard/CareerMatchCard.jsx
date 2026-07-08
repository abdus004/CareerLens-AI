import { Briefcase, ArrowRight } from "lucide-react";
import DashboardCard from "../common/DashboardCard";

export default function CareerMatchCard({

  score = 91,

  career = "AI Engineer",

}) {

  return (

    <DashboardCard
      title="Career Match"
      subtitle="Based on your profile"
      icon={<Briefcase size={22} />}
    >

      <div className="flex justify-between items-center mt-2">

        {/* Left */}

        <div>

          <h1 className="text-5xl font-bold text-violet-400">

            {score}%

          </h1>

          <p className="text-gray-400 mt-2">

            Best Career Match

          </p>

          <h2 className="text-xl font-semibold text-white mt-1">

            {career}

          </h2>

        </div>

        {/* Right */}

        <div className="w-28">

          <div className="flex justify-between text-sm mb-2">

            <span className="text-gray-400">

              Match

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
                from-violet-500
                to-fuchsia-500
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

          ↑ Excellent Match

        </span>

        <button
          className="
            flex
            items-center
            gap-2
            text-violet-400
            hover:text-violet-300
            transition
          "
        >

          View Details

          <ArrowRight size={16} />

        </button>

      </div>

    </DashboardCard>

  );

}