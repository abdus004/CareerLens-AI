import { Trophy, ArrowRight } from "lucide-react";
import DashboardCard from "../common/DashboardCard";

const careers = [
  {
    name: "AI Engineer",
    score: 91,
  },
  {
    name: "Machine Learning Engineer",
    score: 87,
  },
  {
    name: "Data Scientist",
    score: 84,
  },
  {
    name: "Backend Developer",
    score: 72,
  },
  {
    name: "Frontend Developer",
    score: 65,
  },
];

export default function RecommendedCareers() {
  return (
    <DashboardCard
      title="Recommended Careers"
      subtitle="Top matches based on your profile"
      icon={<Trophy size={22} />}
    >
      <div className="space-y-4">

        {careers.map((career, index) => (

          <div
            key={career.name}
            className="
              flex
              items-center
              justify-between
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  w-9
                  h-9
                  rounded-xl
                  bg-white/5
                  flex
                  items-center
                  justify-center
                  text-white
                  font-semibold
                "
              >

                {index + 1}

              </div>

              <div>

                <h3 className="text-white font-medium">

                  {career.name}

                </h3>

                <div
                  className="
                    w-40
                    h-2
                    rounded-full
                    bg-white/10
                    mt-2
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
                      width: `${career.score}%`,
                    }}
                  />

                </div>

              </div>

            </div>

            <span className="text-violet-400 font-semibold">

              {career.score}%

            </span>

          </div>

        ))}

      </div>

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
            transition
          "
        >

          View All

          <ArrowRight size={16} />

        </button>

      </div>

    </DashboardCard>
  );
}