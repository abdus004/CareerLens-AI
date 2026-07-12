import DashboardLayout from "../components/dashboard/DashboardLayout";

export default function Progress() {

  const stats = [
    {
      title: "Career Readiness",
      value: "82%",
      color: "text-cyan-400",
    },
    {
      title: "Resume Score",
      value: "88%",
      color: "text-green-400",
    },
    {
      title: "Assessments Completed",
      value: "6",
      color: "text-violet-400",
    },
    {
      title: "Mock Interviews",
      value: "4",
      color: "text-orange-400",
    },
  ];

  return (

    <DashboardLayout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-white">

          Progress Dashboard

        </h1>

        <p className="text-gray-400 mt-2">

          Track your overall career growth and achievements.

        </p>

      </div>

      {/* Statistics */}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

        {stats.map((stat) => (

          <div
            key={stat.title}
            className="
              rounded-3xl
              border
              border-white/10
              bg-white/5
              p-7
            "
          >

            <p className="text-gray-400">

              {stat.title}

            </p>

            <h2 className={`text-4xl font-bold mt-4 ${stat.color}`}>

              {stat.value}

            </h2>

          </div>

        ))}

      </div>

      {/* Continue Here */}
            {/* Recent Achievements */}

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

          Recent Achievements

        </h2>

        <div className="space-y-5">

          {[
            "Completed Python Assessment",
            "Finished AI Career Roadmap Phase 1",
            "Uploaded Resume Successfully",
            "Completed Mock Interview",
          ].map((achievement) => (

            <div
              key={achievement}
              className="
                rounded-2xl
                border
                border-white/10
                bg-[#0B1120]
                p-5
              "
            >

              <p className="text-gray-300">

                🏆 {achievement}

              </p>

            </div>

          ))}

        </div>

      </div>

      {/* Daily Learning Streak */}

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

          Daily Learning Streak

        </h2>

        <div className="flex flex-col items-center justify-center h-full">

          <h1 className="text-7xl font-bold text-cyan-400">

            12

          </h1>

          <p className="text-gray-400 mt-3">

            Days in a Row 🔥

          </p>

          <div
            className="
              w-full
              bg-[#0B1120]
              rounded-full
              h-3
              mt-8
            "
          >

            <div
              className="
                bg-gradient-to-r
                from-violet-500
                to-cyan-500
                h-3
                rounded-full
              "
              style={{ width: "60%" }}
            ></div>

          </div>

          <p className="text-gray-500 mt-3">

            Keep learning daily to maintain your streak.

          </p>

        </div>

      </div>

      {/* Continue Here */}
            {/* Career Goal Progress + AI Portfolio */}

      <div className="grid lg:grid-cols-2 gap-6 mt-8">

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

          <h2 className="text-2xl font-bold text-white mb-6">

            Career Goal Progress

          </h2>

          <div className="space-y-5">

            <div className="flex justify-between">

              <span className="text-gray-400">

                Target Career

              </span>

              <span className="text-cyan-400 font-semibold">

                AI Engineer

              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-gray-400">

                Current Readiness

              </span>

              <span className="text-green-400 font-bold">

                82%

              </span>

            </div>

            <div className="w-full bg-[#0B1120] rounded-full h-3">

              <div
                className="
                  bg-gradient-to-r
                  from-violet-500
                  to-cyan-500
                  h-3
                  rounded-full
                "
                style={{ width: "82%" }}
              ></div>

            </div>

            <p className="text-gray-400">

              Keep completing assessments and mock interviews to
              improve your readiness score.

            </p>

          </div>

        </div>

        {/* AI Portfolio */}

        <div
          className="
            rounded-3xl
            border
            border-cyan-500/30
            bg-gradient-to-br
            from-violet-600/10
            to-cyan-500/10
            p-8
          "
        >

          <h2 className="text-2xl font-bold text-white mb-6">

            AI Portfolio

          </h2>

          <p className="text-gray-300 leading-8">

            Soon you'll be able to generate a professional portfolio
            automatically using your resume, projects, skills,
            certificates and achievements.

          </p>

          <button
            className="
              mt-8
              w-full
              py-4
              rounded-2xl
              border
              border-cyan-400
              text-cyan-400
              hover:bg-cyan-500/10
              transition
              font-semibold
            "
          >

            Coming Soon

          </button>

        </div>

      </div>

    </DashboardLayout>

  );

}