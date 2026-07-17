import {
  CheckCircle2,
  Circle,
  Target,
} from "lucide-react";

import DashboardCard from "../common/DashboardCard";

const goals = [
  {
    title: "Solve 2 LeetCode Problems",
    completed: false,
  },
  {
    title: "Complete SQL Lesson",
    completed: true,
  },
  {
    title: "Upload Latest Resume",
    completed: false,
  },
  {
    title: "Add One New Project",
    completed: false,
  },
];

export default function DailyGoals() {

  const completedGoals = goals.filter(
    goal => goal.completed
  ).length;

  return (

    <DashboardCard
      title="Daily Goals"
      subtitle={`${completedGoals}/${goals.length} Completed`}
      icon={<Target size={22} />}
    >

      <div className="space-y-4">

        {goals.map((goal, index) => (

          <div
            key={index}
            className="
              flex
              items-center
              gap-3
              rounded-xl
              bg-white/5
              p-3
            "
          >

            {goal.completed ? (

              <CheckCircle2
                size={20}
                className="text-green-400"
              />

            ) : (

              <Circle
                size={20}
                className="text-gray-500"
              />

            )}

            <span
              className={`
                text-sm

                ${
                  goal.completed
                    ? "text-gray-500 line-through"
                    : "text-white"
                }
              `}
            >

              {goal.title}

            </span>

          </div>

        ))}

      </div>

      <div className="mt-6">

        <div className="flex justify-between mb-2">

          <span className="text-gray-400 text-sm">

            Today's Progress

          </span>

          <span className="text-white">

            {Math.round(
              (completedGoals / goals.length) * 100
            )}%

          </span>

        </div>

        <div
          className="
            h-2
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
              to-emerald-500
            "
            style={{
              width: `${(completedGoals / goals.length) * 100}%`,
            }}
          />

        </div>

      </div>

    </DashboardCard>

  );

}