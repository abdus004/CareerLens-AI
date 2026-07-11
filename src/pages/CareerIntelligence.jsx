import DashboardLayout from "../components/dashboard/DashboardLayout";
import {
  Brain,
  TrendingUp,
  Award,
  Target,
} from "lucide-react";

const careerMatches = [
  {
    title: "AI Engineer",
    match: 91,
  },
  {
    title: "Data Scientist",
    match: 88,
  },
  {
    title: "Machine Learning Engineer",
    match: 86,
  },
  {
    title: "Software Engineer",
    match: 83,
  },
  {
    title: "Backend Developer",
    match: 80,
  },
];

export default function CareerIntelligence() {
  return (
    <DashboardLayout>

      {/* Page Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-white">

          Career Intelligence

        </h1>

        <p className="text-gray-400 mt-2">

          Discover the best career paths based on your profile,
          skills and resume.

        </p>

      </div>

      {/* Career Match Card */}

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

          <Brain className="text-violet-400" size={30} />

          <h2 className="text-2xl font-bold text-white">

            Career Matches

          </h2>

        </div>

        <div className="space-y-6">

          {careerMatches.map((career) => (

            <div key={career.title}>

              <div className="flex justify-between mb-2">

                <span className="text-white font-medium">

                  {career.title}

                </span>

                <span className="text-cyan-400 font-bold">

                  {career.match}%

                </span>

              </div>

              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">

                <div
                  className="
                    h-full
                    rounded-full
                    bg-gradient-to-r
                    from-violet-500
                    via-fuchsia-500
                    to-cyan-400
                  "
                  style={{
                    width: `${career.match}%`,
                  }}
                ></div>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* Next Section Starts Here */}

      <div className="grid lg:grid-cols-2 gap-6 mt-8">        {/* Profile Strengths */}

        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-7
          "
        >

          <div className="flex items-center gap-3 mb-6">

            <Award
              className="text-green-400"
              size={28}
            />

            <h2 className="text-2xl font-bold text-white">

              Profile Strengths

            </h2>

          </div>

          <div className="flex flex-wrap gap-4">

            {[
              "Python",
              "Machine Learning",
              "Problem Solving",
              "Communication",
            ].map((skill) => (

              <span
                key={skill}
                className="
                  px-5
                  py-3
                  rounded-xl
                  bg-green-500/10
                  border
                  border-green-500/30
                  text-green-300
                  font-medium
                "
              >
                ✓ {skill}
              </span>

            ))}

          </div>

        </div>

        {/* Skills To Improve */}

        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-7
          "
        >

          <div className="flex items-center gap-3 mb-6">

            <Target
              className="text-orange-400"
              size={28}
            />

            <h2 className="text-2xl font-bold text-white">

              Skills To Improve

            </h2>

          </div>

          <div className="flex flex-wrap gap-4">

            {[
              "SQL",
              "React",
              "Docker",
              "System Design",
            ].map((skill) => (

              <span
                key={skill}
                className="
                  px-5
                  py-3
                  rounded-xl
                  bg-orange-500/10
                  border
                  border-orange-500/30
                  text-orange-300
                  font-medium
                "
              >
                {skill}
              </span>

            ))}

          </div>

        </div>

      </div>

      {/* Career Insights */}

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

        <div className="flex items-center gap-3 mb-8">

          <TrendingUp
            className="text-cyan-400"
            size={30}
          />

          <h2 className="text-2xl font-bold text-white">

            Career Insights

          </h2>

        </div>

        <div className="grid md:grid-cols-4 gap-6">

          <div className="rounded-2xl bg-white/5 p-6 border border-white/10">

            <p className="text-gray-400 text-sm">

              Top Career

            </p>

            <h3 className="text-xl text-white font-bold mt-2">

              AI Engineer

            </h3>

          </div>

          <div className="rounded-2xl bg-white/5 p-6 border border-white/10">

            <p className="text-gray-400 text-sm">

              Average Salary

            </p>

            <h3 className="text-xl text-green-400 font-bold mt-2">

              ₹8–18 LPA

            </h3>

          </div>

          <div className="rounded-2xl bg-white/5 p-6 border border-white/10">

            <p className="text-gray-400 text-sm">

              Industry Demand

            </p>

            <h3 className="text-xl text-cyan-400 font-bold mt-2">

              Very High

            </h3>

          </div>

          <div className="rounded-2xl bg-white/5 p-6 border border-white/10">

            <p className="text-gray-400 text-sm">

              Future Growth

            </p>

            <h3 className="text-xl text-violet-400 font-bold mt-2">

              Excellent

            </h3>

          </div>

        </div>

      </div>      {/* Why These Careers + Next Steps */}

      <div className="grid lg:grid-cols-2 gap-6 mt-8">

        {/* Why These Careers */}

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

            Why These Careers?

          </h2>

          <p className="text-gray-400 leading-8">

            Based on your education, technical skills,
            career interests and resume, CareerLens AI
            predicts these careers have the highest
            potential for your profile.

          </p>

          <ul className="mt-6 space-y-4 text-gray-300">

            <li>✅ Strong programming foundation</li>

            <li>✅ High AI & Data Science relevance</li>

            <li>✅ Excellent future job demand</li>

            <li>✅ Good salary growth opportunities</li>

          </ul>

        </div>

        {/* Recommended Next Steps */}

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

            Recommended Next Steps

          </h2>

          <div className="space-y-4">

            {[
              "Master SQL",
              "Build 2 AI Projects",
              "Learn React",
              "Practice DSA Daily",
              "Improve Resume ATS Score",
              "Complete Mock Interviews",
            ].map((step) => (

              <div
                key={step}
                className="
                  flex
                  items-center
                  gap-4
                  rounded-xl
                  border
                  border-white/10
                  bg-white/5
                  px-5
                  py-4
                "
              >

                <div
                  className="
                    w-8
                    h-8
                    rounded-full
                    bg-gradient-to-r
                    from-violet-500
                    via-fuchsia-500
                    to-cyan-400
                    flex
                    items-center
                    justify-center
                    text-white
                    font-bold
                  "
                >
                  ✓
                </div>

                <span className="text-gray-200">

                  {step}

                </span>

              </div>

            ))}

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}