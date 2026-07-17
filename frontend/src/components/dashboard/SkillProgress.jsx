import { Code2, ArrowRight } from "lucide-react";
import DashboardCard from "../common/DashboardCard";

const skills = [
  {
    name: "Python",
    progress: 95,
    level: "Expert",
  },
  {
    name: "Machine Learning",
    progress: 82,
    level: "Advanced",
  },
  {
    name: "SQL",
    progress: 74,
    level: "Intermediate",
  },
  {
    name: "React",
    progress: 60,
    level: "Intermediate",
  },
  {
    name: "Git & GitHub",
    progress: 45,
    level: "Beginner",
  },
];

export default function SkillProgress() {

  return (

    <DashboardCard
      title="Skill Progress"
      subtitle="Your current skill levels"
      icon={<Code2 size={22} />}
    >

      <div className="space-y-5">

        {skills.map((skill) => (

          <div key={skill.name}>

            <div className="flex justify-between mb-2">

              <div>

                <h3 className="text-white font-medium">

                  {skill.name}

                </h3>

                <p className="text-xs text-gray-500">

                  {skill.level}

                </p>

              </div>

              <span className="text-white font-semibold">

                {skill.progress}%

              </span>

            </div>

            <div
              className="
                h-2.5
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
                  from-green-400
                  via-cyan-400
                  to-blue-500
                  transition-all
                  duration-700
                "
                style={{
                  width: `${skill.progress}%`,
                }}
              />

            </div>

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
            text-cyan-400
            hover:text-cyan-300
            transition-all
          "
        >

          View All Skills

          <ArrowRight size={16} />

        </button>

      </div>

    </DashboardCard>

  );

}