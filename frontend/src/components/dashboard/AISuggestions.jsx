import {
  Sparkles,
  ArrowRight,
} from "lucide-react";

import DashboardCard from "../common/DashboardCard";

export default function AISuggestions({ suggestions }) {

  const items = suggestions || [];

  return (

    <DashboardCard
      title="AI Suggestions"
      subtitle="Personalized recommendations"
      icon={<Sparkles size={22} />}
    >

      {items.length === 0 ? (

        <p className="text-gray-500 text-sm py-6 text-center">
          Upload your resume to get personalized suggestions.
        </p>

      ) : (

        <div className="space-y-4">

          {items.map((item, index) => (

            <div
              key={index}
              className="
                rounded-xl
                bg-white/5
                border
                border-white/10
                p-4
              "
            >

              <div className="flex justify-between">

                <h3 className="text-white font-medium">

                  {item.title}

                </h3>

                <span
                  className={`
                    text-xs
                    px-2
                    py-1
                    rounded-full

                    ${
                      item.priority === "High"
                        ? "bg-red-500/20 text-red-400"

                        : item.priority === "Medium"
                        ? "bg-yellow-500/20 text-yellow-400"

                        : "bg-green-500/20 text-green-400"
                    }
                  `}
                >

                  {item.priority}

                </span>

              </div>

              <p className="text-sm text-gray-400 mt-2">

                {item.description}

              </p>

            </div>

          ))}

        </div>

      )}

      <div
        className="
          mt-6
          pt-4
          border-t
          border-white/10
          flex
          justify-end
        "
      >

        <button
          className="
            flex
            items-center
            gap-2
            text-violet-400
            hover:text-violet-300
            transition-all
          "
        >

          View All

          <ArrowRight size={16} />

        </button>

      </div>

    </DashboardCard>

  );

}