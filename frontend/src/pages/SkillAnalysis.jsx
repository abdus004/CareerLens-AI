import DashboardLayout from "../components/dashboard/DashboardLayout";
import {
  BarChart3,
  TrendingUp,
  Code,
} from "lucide-react";

const skills = [
  { name: "Python", level: 92 },
  { name: "Machine Learning", level: 88 },
  { name: "SQL", level: 72 },
  { name: "React", level: 64 },
  { name: "Git & GitHub", level: 84 },
];

export default function SkillAnalysis() {
  return (
    <DashboardLayout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-white">

          Skill Analysis

        </h1>

        <p className="text-gray-400 mt-2">

          Analyze your technical skills and identify areas
          for improvement.

        </p>

      </div>

      {/* Skill Progress */}

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

          <BarChart3
            size={30}
            className="text-cyan-400"
          />

          <h2 className="text-2xl font-bold text-white">

            Skill Progress

          </h2>

        </div>

        <div className="space-y-7">

          {skills.map((skill) => (

            <div key={skill.name}>

              <div className="flex justify-between mb-2">

                <span className="text-white font-medium">

                  {skill.name}

                </span>

                <span className="text-cyan-400 font-bold">

                  {skill.level}%

                </span>

              </div>

              <div className="h-3 rounded-full bg-white/10 overflow-hidden">

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
                    width: `${skill.level}%`,
                  }}
                ></div>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* Continue Here */}

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
                {/* Skill Statistics */}

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
              size={28}
              className="text-green-400"
            />

            <h2 className="text-2xl font-bold text-white">

              Skill Statistics

            </h2>

          </div>

          <div className="space-y-6">

            <div className="flex justify-between">

              <span className="text-gray-400">

                Skills Analyzed

              </span>

              <span className="text-white font-bold">

                18

              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-gray-400">

                Strong Skills

              </span>

              <span className="text-green-400 font-bold">

                8

              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-gray-400">

                Skills To Improve

              </span>

              <span className="text-orange-400 font-bold">

                6

              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-gray-400">

                Overall Skill Score

              </span>

              <span className="text-cyan-400 font-bold">

                84%

              </span>

            </div>

          </div>

        </div>

        {/* Strongest Skills */}

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

            <Code
              size={28}
              className="text-violet-400"
            />

            <h2 className="text-2xl font-bold text-white">

              Strongest Skills

            </h2>

          </div>

          <div className="flex flex-wrap gap-4">

            {[
              "Python",
              "Machine Learning",
              "Data Analysis",
              "Git",
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

      </div>

      {/* Skills To Learn */}

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

          Skills To Learn

        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

          {[
            "SQL",
            "Docker",
            "System Design",
            "AWS",
            "CI/CD",
            "Node.js",
            "MongoDB",
            "REST APIs",
          ].map((skill) => (

            <div
              key={skill}
              className="
                rounded-2xl
                border
                border-orange-500/30
                bg-orange-500/10
                p-5
                text-center
              "
            >

              <h3 className="text-orange-300 font-semibold">

                {skill}

              </h3>

            </div>

          ))}

        </div>

      </div>      {/* AI Skill Suggestions */}

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

          AI Suggestions

        </h2>

        <div className="space-y-5">

          {[
            "Improve your SQL skills to become industry-ready.",
            "Build 2-3 React projects to strengthen frontend development.",
            "Learn Docker for application deployment.",
            "Practice Data Structures & Algorithms daily.",
            "Complete an AWS Cloud Fundamentals certification.",
          ].map((item) => (

            <div
              key={item}
              className="
                flex
                items-start
                gap-4
                rounded-2xl
                border
                border-white/10
                bg-white/5
                p-5
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
                  flex-shrink-0
                "
              >
                ✓
              </div>

              <p className="text-gray-300">

                {item}

              </p>

            </div>

          ))}

        </div>

      </div>

      {/* Recommended Certifications */}

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

          Recommended Certifications

        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

          {[
            "Google Data Analytics",
            "AWS Cloud Practitioner",
            "Microsoft Azure AI",
            "Oracle SQL",
          ].map((certificate) => (

            <div
              key={certificate}
              className="
                rounded-2xl
                border
                border-cyan-500/30
                bg-cyan-500/10
                p-6
                text-center
              "
            >

              <h3 className="text-cyan-300 font-semibold">

                {certificate}

              </h3>

            </div>

          ))}

        </div>

      </div>

    </DashboardLayout>
  );
}