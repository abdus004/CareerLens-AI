import DashboardLayout from "../components/dashboard/DashboardLayout";
import {
  Target,
  TrendingUp,
  Route,
} from "lucide-react";

export default function LearningPath() {
  return (
    <DashboardLayout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-white">

          Career Roadmap

        </h1>

        <p className="text-gray-400 mt-2">

          Your personalized AI roadmap towards your dream career.

        </p>

      </div>

      {/* Top Cards */}

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Career Goal */}

        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-8
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

          <h3 className="text-3xl font-bold text-cyan-400">

            AI Engineer

          </h3>

          <div className="mt-6 space-y-4">

            <div className="flex justify-between">

              <span className="text-gray-400">

                Readiness

              </span>

              <span className="text-green-400 font-bold">

                82%

              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-gray-400">

                Estimated Time

              </span>

              <span className="text-white font-semibold">

                4 Months

              </span>

            </div>

          </div>

        </div>

        {/* Skill Gaps */}

        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-8
          "
        >

          <div className="flex items-center gap-3 mb-6">

            <TrendingUp
              size={30}
              className="text-orange-400"
            />

            <h2 className="text-2xl font-bold text-white">

              Improve Next

            </h2>

          </div>

          <div className="space-y-4">

            {[
              "SQL",
              "Docker",
              "System Design",
            ].map((skill) => (

              <div
                key={skill}
                className="
                  rounded-xl
                  border
                  border-orange-500/30
                  bg-orange-500/10
                  px-5
                  py-4
                "
              >

                <span className="text-orange-300 font-medium">

                  {skill}

                </span>

              </div>

            ))}

          </div>

        </div>

      </div>

              {/* Career Roadmap */}

        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-8
          "
        >

          <div className="flex items-center gap-3 mb-8">

            <Route
              size={30}
              className="text-cyan-400"
            />

            <h2 className="text-2xl font-bold text-white">

              AI Career Roadmap

            </h2>

          </div>

          <div className="space-y-6">

            {/* Phase 1 */}

            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/5
                p-6
              "
            >

              <div className="flex justify-between items-center">

                <div>

                  <h3 className="text-xl font-bold text-white">

                    Phase 1

                  </h3>

                  <p className="text-gray-400 mt-1">

                    SQL • Git • Linux Basics

                  </p>

                </div>

                <span
                  className="
                    px-4
                    py-2
                    rounded-full
                    bg-green-500/10
                    text-green-400
                    font-semibold
                  "
                >
                  Current
                </span>

              </div>

            </div>

            {/* Phase 2 */}

            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/5
                p-6
              "
            >

              <div className="flex justify-between items-center">

                <div>

                  <h3 className="text-xl font-bold text-white">

                    Phase 2

                  </h3>

                  <p className="text-gray-400 mt-1">

                    Machine Learning • Projects

                  </p>

                </div>

                <span
                  className="
                    px-4
                    py-2
                    rounded-full
                    bg-violet-500/10
                    text-violet-400
                    font-semibold
                  "
                >
                  Next
                </span>

              </div>

            </div>

            {/* Phase 3 */}

            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/5
                p-6
              "
            >

              <div className="flex justify-between items-center">

                <div>

                  <h3 className="text-xl font-bold text-white">

                    Phase 3

                  </h3>

                  <p className="text-gray-400 mt-1">

                    Resume • Mock Interview • Apply

                  </p>

                </div>

                <span
                  className="
                    px-4
                    py-2
                    rounded-full
                    bg-cyan-500/10
                    text-cyan-400
                    font-semibold
                  "
                >
                  Goal
                </span>

              </div>

            </div>

          </div>

        </div>

      {/* Continue Here */}      {/* Today's Mission */}

      <div
        className="
          mt-8
          grid
          lg:grid-cols-2
          gap-6
        "
      >

        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-8
          "
        >

          <h2 className="text-2xl font-bold text-white mb-6">

            Today's Mission

          </h2>

          <div className="space-y-4">

            {[
              "Complete SQL Basics",
              "Solve 2 LeetCode Problems",
              "Watch 1 ML Tutorial",
            ].map((task) => (

              <div
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

              </div>

            ))}

          </div>

        </div>

        {/* AI Mentor */}

        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-gradient-to-br
            from-violet-600/20
            to-cyan-500/20
            p-8
          "
        >

          <h2 className="text-2xl font-bold text-white mb-6">

            AI Mentor

          </h2>

          <p className="text-gray-300 leading-8">

            Your Python and Machine Learning skills are already
            strong. Focus on improving SQL first because it is one
            of the most requested skills for AI Engineer roles.
            Completing SQL Basics can significantly improve your
            career readiness.

          </p>

        </div>

      </div>

    </DashboardLayout>
  );
}


