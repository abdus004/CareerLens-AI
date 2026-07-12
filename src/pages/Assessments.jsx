import DashboardLayout from "../components/dashboard/DashboardLayout";

export default function Assessments() {

  return (

    <DashboardLayout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-white">

          Assessments

        </h1>

        <p className="text-gray-400 mt-2">

          Test your skills and track your progress with AI-powered assessments.

        </p>

      </div>

      {/* Available Assessments */}

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

          Available Assessments

        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          {[
            {
              title: "Python Assessment",
              questions: "20 Questions",
              duration: "20 Minutes",
            },
            {
              title: "SQL Assessment",
              questions: "15 Questions",
              duration: "15 Minutes",
            },
            {
              title: "Machine Learning",
              questions: "25 Questions",
              duration: "30 Minutes",
            },
            {
              title: "Aptitude Test",
              questions: "20 Questions",
              duration: "20 Minutes",
            },
          ].map((assessment) => (

            <div
              key={assessment.title}
              className="
                rounded-2xl
                border
                border-white/10
                bg-[#0B1120]
                p-6
              "
            >

              <h3 className="text-xl font-bold text-white">

                {assessment.title}

              </h3>

              <p className="text-gray-400 mt-3">

                {assessment.questions}

              </p>

              <p className="text-gray-400">

                {assessment.duration}

              </p>

              <button
                className="
                  mt-6
                  w-full
                  py-3
                  rounded-xl
                  bg-gradient-to-r
                  from-violet-600
                  to-cyan-500
                  text-white
                  font-semibold
                  hover:opacity-90
                  transition
                "
              >

                Start Assessment

              </button>

            </div>

          ))}

        </div>

      </div>

      {/* Continue Here */}
            {/* Previous Assessments */}

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

          Previous Assessments

        </h2>

        <div className="space-y-5">

          {[
            {
              title: "Python Assessment",
              score: "92%",
              date: "10 July 2026",
            },
            {
              title: "SQL Assessment",
              score: "84%",
              date: "07 July 2026",
            },
            {
              title: "Machine Learning",
              score: "88%",
              date: "02 July 2026",
            },
          ].map((item) => (

            <div
              key={item.title}
              className="
                rounded-2xl
                border
                border-white/10
                bg-[#0B1120]
                p-5
                flex
                justify-between
                items-center
              "
            >

              <div>

                <h3 className="text-lg font-semibold text-white">

                  {item.title}

                </h3>

                <p className="text-gray-400 mt-1">

                  {item.date}

                </p>

              </div>

              <div className="text-right">

                <p className="text-green-400 text-2xl font-bold">

                  {item.score}

                </p>

                <button
                  className="
                    mt-2
                    text-cyan-400
                    hover:text-cyan-300
                    transition
                  "
                >

                  View Report

                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* Continue Here */}
            {/* Assessment Guidelines */}

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

          Assessment Guidelines

        </h2>

        <div className="grid md:grid-cols-2 gap-5">

          {[
            "Read each question carefully before answering.",
            "Complete the assessment within the given time.",
            "Do not refresh or close the browser during the test.",
            "Your score will be saved after submission.",
            "Review your report to identify improvement areas.",
            "Retake assessments anytime to improve your score.",
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