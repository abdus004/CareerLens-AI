import DashboardLayout from "../components/dashboard/DashboardLayout";
import {
  Target,
  Route,
  CheckCircle2,
  Circle,
} from "lucide-react";

export default function LearningPath() {

  const roadmap = [
    {
      title: "Python Fundamentals",
      description: "Variables, Functions, OOP",
      status: "completed",
    },
    {
      title: "Data Structures & Algorithms",
      description: "Arrays, Strings, Linked List",
      status: "completed",
    },
    {
      title: "SQL & Databases",
      description: "Joins, Queries, Normalization",
      status: "current",
    },
    {
      title: "Docker",
      description: "Containers & Deployment",
      status: "pending",
    },
    {
      title: "Machine Learning Projects",
      description: "Build real-world AI portfolio projects",
      status: "pending",
    },
    {
      title: "Resume & Portfolio",
      description: "Prepare ATS Resume & GitHub",
      status: "pending",
    },
    {
      title: "Mock Interviews",
      description: "Practice Technical & HR Interviews",
      status: "pending",
    },
    {
      title: "Apply for Jobs",
      description: "Internships & Full-Time Opportunities",
      status: "goal",
    },
  ];

  const todayTasks = [
    "Complete SQL Basics",
    "Solve 2 LeetCode Problems",
    "Update GitHub Portfolio",
  ];

  return (
    <DashboardLayout>

      {/* Header */}

      <div className="mb-10">

        <h1 className="text-4xl font-bold text-white">
          Career Roadmap
        </h1>

        <p className="text-gray-400 mt-2">
          Follow your personalized roadmap towards becoming an AI Engineer.
        </p>

      </div>

      {/* Career Goal */}

      <div
        className="
          rounded-3xl
          border
          border-white/10
          bg-white/5
          p-8
          mb-8
        "
      >

        <div className="flex items-center gap-3 mb-6">

          <Target
            size={30}
            className="text-violet-400"
          />

          <h2 className="text-2xl font-bold text-white">
            Career Goal
          </h2>

        </div>

        <div
          className="
            flex
            flex-col
            lg:flex-row
            lg:justify-between
            lg:items-center
            gap-8
          "
        >

          <div>

            <h3 className="text-3xl font-bold text-cyan-400">
              AI Engineer
            </h3>

            <p className="text-gray-400 mt-3 max-w-2xl">
              Build the right skills, complete projects, and prepare for
              technical interviews to become industry-ready.
            </p>

          </div>

          <div className="flex gap-12">

            <div>

              <p className="text-gray-400 text-sm">
                Progress
              </p>

              <h4 className="text-3xl font-bold text-green-400">
                82%
              </h4>

            </div>

            <div>

              <p className="text-gray-400 text-sm">
                Estimated Time
              </p>

              <h4 className="text-3xl font-bold text-white">
                4 Months
              </h4>

            </div>

          </div>

        </div>

      </div>
            {/* Career Roadmap Timeline */}

      <div
        className="
          rounded-3xl
          border
          border-white/10
          bg-white/5
          p-8
          mb-8
        "
      >

        <div className="flex items-center gap-3 mb-10">

          <Route
            size={30}
            className="text-cyan-400"
          />

          <h2 className="text-2xl font-bold text-white">
            Career Roadmap
          </h2>

        </div>

        <div className="space-y-2">

          {roadmap.map((step, index) => (

            <div
              key={step.title}
              className="flex gap-6"
            >

              {/* Timeline */}

              <div className="flex flex-col items-center">

                {step.status === "completed" ? (

                  <CheckCircle2
                    size={28}
                    className="text-green-400"
                  />

                ) : step.status === "current" ? (

                  <Circle
                    size={28}
                    className="text-cyan-400 fill-cyan-400"
                  />

                ) : (

                  <Circle
                    size={28}
                    className="text-gray-500"
                  />

                )}

                {index !== roadmap.length - 1 && (

                  <div
                    className="
                      w-[2px]
                      h-20
                      bg-white/10
                      mt-2
                    "
                  />

                )}

              </div>

              {/* Card */}

              <div
                className={`
                  flex-1
                  rounded-2xl
                  border
                  p-6
                  transition-all
                  duration-300

                  ${
                    step.status === "completed"
                      ? "border-green-500/30 bg-green-500/10"
                      : step.status === "current"
                      ? "border-cyan-500/30 bg-cyan-500/10"
                      : step.status === "goal"
                      ? "border-violet-500/30 bg-violet-500/10"
                      : "border-white/10 bg-white/5"
                  }
                `}
              >

                <div className="flex justify-between items-start">

                  <div>

                    <h3 className="text-xl font-semibold text-white">
                      {step.title}
                    </h3>

                    <p className="text-gray-400 mt-2">
                      {step.description}
                    </p>

                  </div>

                  {step.status === "completed" && (

                    <span
                      className="
                        px-4
                        py-2
                        rounded-full
                        bg-green-500/20
                        text-green-400
                        text-sm
                        font-semibold
                      "
                    >
                      Completed
                    </span>

                  )}

                  {step.status === "current" && (

                    <span
                      className="
                        px-4
                        py-2
                        rounded-full
                        bg-cyan-500/20
                        text-cyan-400
                        text-sm
                        font-semibold
                      "
                    >
                      Current
                    </span>

                  )}

                  {step.status === "goal" && (

                    <span
                      className="
                        px-4
                        py-2
                        rounded-full
                        bg-violet-500/20
                        text-violet-400
                        text-sm
                        font-semibold
                      "
                    >
                      Goal
                    </span>

                  )}

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>
            {/* Today's Mission */}

      <div
        className="
          rounded-3xl
          border
          border-white/10
          bg-white/5
          p-8
        "
      >

        <h2 className="text-2xl font-bold text-white mb-8">
          Today's Mission
        </h2>

        <div className="space-y-4">

          {todayTasks.map((task) => (

            <label
              key={task}
              className="
                flex
                items-center
                gap-4
                rounded-2xl
                border
                border-white/10
                bg-white/5
                px-5
                py-4
                cursor-pointer
                hover:border-cyan-500/30
                hover:bg-cyan-500/5
                transition-all
                duration-300
              "
            >

              <input
                type="checkbox"
                className="
                  w-5
                  h-5
                  accent-cyan-500
                "
              />

              <span className="text-gray-300">
                {task}
              </span>

            </label>

          ))}

        </div>

      </div>

    </DashboardLayout>
  );
}