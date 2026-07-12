import DashboardLayout from "../components/dashboard/DashboardLayout";

export default function MockInterview() {
  return (
    <DashboardLayout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-white">

          AI Mock Interview

        </h1>

        <p className="text-gray-400 mt-2">

          Practice technical and HR interviews powered by AI.

        </p>

      </div>

      {/* Interview Setup */}

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

          Interview Setup

        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Interview Type */}

          <div>

            <label className="text-gray-400">

              Interview Type

            </label>

            <select
              className="
                mt-2
                w-full
                rounded-xl
                bg-[#0B1120]
                border
                border-white/10
                p-3
                text-white
                outline-none
              "
            >

              <option>Technical Interview</option>

              <option>HR Interview</option>

              <option>Mixed Interview</option>

            </select>

          </div>

          {/* Target Role */}

          <div>

            <label className="text-gray-400">

              Target Role

            </label>

            <select
              className="
                mt-2
                w-full
                rounded-xl
                bg-[#0B1120]
                border
                border-white/10
                p-3
                text-white
                outline-none
              "
            >

              <option>AI Engineer</option>

              <option>Machine Learning Engineer</option>

              <option>Data Scientist</option>

              <option>Software Engineer</option>

            </select>

          </div>

          {/* Difficulty */}

          <div>

            <label className="text-gray-400">

              Difficulty

            </label>

            <select
              className="
                mt-2
                w-full
                rounded-xl
                bg-[#0B1120]
                border
                border-white/10
                p-3
                text-white
                outline-none
              "
            >

              <option>Easy</option>

              <option selected>Medium</option>

              <option>Hard</option>

            </select>

          </div>

          {/* Duration */}

          <div>

            <label className="text-gray-400">

              Duration

            </label>

            <select
              className="
                mt-2
                w-full
                rounded-xl
                bg-[#0B1120]
                border
                border-white/10
                p-3
                text-white
                outline-none
              "
            >

              <option>10 Minutes</option>

              <option selected>15 Minutes</option>

              <option>20 Minutes</option>

              <option>30 Minutes</option>

            </select>

          </div>

        </div>

        <button
          className="
            mt-8
            w-full
            py-4
            rounded-2xl
            bg-gradient-to-r
            from-violet-600
            to-cyan-500
            text-white
            font-bold
            hover:opacity-90
            transition
          "
        >

          Start Interview

        </button>

      </div>

      {/* Continue Here */}
            {/* AI Tips */}

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

          AI Tips to Improve

        </h2>

        <div className="space-y-4">

          {[
            "Practice explaining concepts clearly instead of memorizing answers.",
            "Improve SQL and Database fundamentals before your next interview.",
            "Maintain eye contact and answer confidently during HR interviews.",
            "Solve 2 DSA problems daily to strengthen technical interviews.",
          ].map((tip) => (

            <div
              key={tip}
              className="
                rounded-2xl
                border
                border-cyan-500/20
                bg-cyan-500/10
                p-5
              "
            >

              <p className="text-gray-300 leading-7">

                💡 {tip}

              </p>

            </div>

          ))}

        </div>

      </div>

      {/* Last Interview */}

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

          Last Interview

        </h2>

        <div className="space-y-5">

          <div className="flex justify-between">

            <span className="text-gray-400">

              Interview Type

            </span>

            <span className="text-white font-semibold">

              Technical

            </span>

          </div>

          <div className="flex justify-between">

            <span className="text-gray-400">

              Target Role

            </span>

            <span className="text-white font-semibold">

              AI Engineer

            </span>

          </div>

          <div className="flex justify-between">

            <span className="text-gray-400">

              Score

            </span>

            <span className="text-green-400 font-bold">

              84%

            </span>

          </div>

          <div className="flex justify-between">

            <span className="text-gray-400">

              Date

            </span>

            <span className="text-white">

              12 July 2026

            </span>

          </div>

          <button
            className="
              mt-6
              w-full
              py-3
              rounded-xl
              border
              border-violet-500
              text-violet-400
              hover:bg-violet-500/10
              transition
            "
          >

            View Interview Report

          </button>

        </div>

      </div>

      {/* Continue Here */}
            {/* Interview Guidelines */}

      <div
        className="
          mt-8
          rounded-3xl
          border
          border-white/10
          bg-white/5
          p-8
        "
      >

        <h2 className="text-2xl font-bold text-white mb-6">

          Before You Start

        </h2>

        <div className="grid md:grid-cols-2 gap-5">

          {[
            "Choose a quiet place with minimal distractions.",
            "Answer naturally instead of memorizing responses.",
            "Take a moment to think before answering.",
            "For HR interviews, be honest and confident.",
            "For technical interviews, explain your thought process clearly.",
            "Review the AI feedback after every interview.",
          ].map((tip) => (

            <div
              key={tip}
              className="
                rounded-2xl
                border
                border-white/10
                bg-[#0B1120]
                p-5
              "
            >

              <p className="text-gray-300 leading-7">

                ✅ {tip}

              </p>

            </div>

          ))}

        </div>

      </div>

    </DashboardLayout>

  );

}