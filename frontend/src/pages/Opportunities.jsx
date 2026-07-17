import { useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import {
  Building2,
  MapPin,
  IndianRupee,
  Briefcase,
  ExternalLink,
  Eye,
} from "lucide-react";

const jobs = [
  {
    id: 1,
    company: "Google",
    role: "AI Engineer",
    location: "Bangalore",
    salary: "₹25–60 LPA",
    type: "Full Time",
    match: 91,
  },
  {
    id: 2,
    company: "Microsoft",
    role: "Machine Learning Engineer",
    location: "Hyderabad",
    salary: "₹20–45 LPA",
    type: "Full Time",
    match: 88,
  },
  {
    id: 3,
    company: "Amazon",
    role: "Data Scientist Intern",
    location: "Chennai",
    salary: "₹40K / Month",
    type: "Internship",
    match: 86,
  },
  {
    id: 4,
    company: "NVIDIA",
    role: "AI Engineer",
    location: "Pune",
    salary: "₹22–50 LPA",
    type: "Full Time",
    match: 84,
  },
];

export default function CareerOpportunities() {

  const [selectedJob, setSelectedJob] = useState(jobs[0]);

  return (

    <DashboardLayout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-white">

          Career Opportunities

        </h1>

        <p className="text-gray-400 mt-2">

          Find internships and jobs that match your profile.

        </p>

      </div>

      {/* Job Cards */}

      <div className="grid lg:grid-cols-2 gap-6">

        {jobs.map((job) => (

          <div

            key={job.id}

            className={`
              rounded-3xl
              border
              p-7
              transition-all
              duration-300

              ${
                selectedJob.id === job.id
                  ? "border-cyan-400 bg-cyan-500/10"
                  : "border-white/10 bg-white/5 hover:border-cyan-400/40"
              }
            `}

          >

            <div className="flex justify-between items-start">

              <div>

                <div className="flex items-center gap-3">

                  <Building2
                    size={30}
                    className="text-cyan-400"
                  />

                  <div>

                    <h2 className="text-2xl font-bold text-white">

                      {job.company}

                    </h2>

                    <p className="text-gray-400">

                      {job.role}

                    </p>

                  </div>

                </div>

              </div>

              <div
                className="
                  px-4
                  py-2
                  rounded-full
                  bg-green-500/10
                  text-green-400
                  font-bold
                "
              >

                {job.match}% Match

              </div>

            </div>

            <div className="grid grid-cols-2 gap-4 mt-7">

              <div className="flex items-center gap-2 text-gray-300">

                <MapPin size={18} />

                {job.location}

              </div>

              <div className="flex items-center gap-2 text-gray-300">

                <IndianRupee size={18} />

                {job.salary}

              </div>

              <div className="flex items-center gap-2 text-gray-300">

                <Briefcase size={18} />

                {job.type}

              </div>

            </div>

            <div className="flex gap-4 mt-8">

              <button

                onClick={() => setSelectedJob(job)}

                className="
                  flex-1
                  py-3
                  rounded-xl
                  bg-violet-600
                  hover:bg-violet-700
                  transition
                  text-white
                  font-semibold
                  flex
                  justify-center
                  items-center
                  gap-2
                "

              >

                <Eye size={18} />

                View Details

              </button>

              <button

                className="
                  flex-1
                  py-3
                  rounded-xl
                  border
                  border-cyan-400
                  text-cyan-400
                  hover:bg-cyan-500/10
                  transition
                  flex
                  justify-center
                  items-center
                  gap-2
                "

              >

                <ExternalLink size={18} />

                Apply

              </button>

            </div>

          </div>

        ))}

      </div>

      {/* Selected Job Details */}
              <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-8
          "
        >

          <div className="flex justify-between items-center mb-8">

            <div>

              <h2 className="text-3xl font-bold text-white">

                {selectedJob.company}

              </h2>

              <p className="text-gray-400 text-lg">

                {selectedJob.role}

              </p>

            </div>

            <div
              className="
                px-5
                py-3
                rounded-full
                bg-green-500/10
                text-green-400
                font-bold
                text-lg
              "
            >
              {selectedJob.match}% Match
            </div>

          </div>

          <div className="grid lg:grid-cols-2 gap-8">

            {/* Why You Match */}

            <div>

              <h3 className="text-xl font-bold text-cyan-400 mb-5">

                Why You're a Good Match

              </h3>

              <div className="space-y-4">

                {[
                  "Strong Python Programming",
                  "Machine Learning Knowledge",
                  "Problem Solving Skills",
                  "Git & GitHub Experience",
                ].map((item) => (

                  <div
                    key={item}
                    className="
                      rounded-xl
                      border
                      border-green-500/20
                      bg-green-500/10
                      p-4
                      text-green-300
                    "
                  >
                    ✅ {item}
                  </div>

                ))}

              </div>

            </div>

            {/* Improve */}

            <div>

              <h3 className="text-xl font-bold text-orange-400 mb-5">

                Improve To Increase Match

              </h3>

              <div className="space-y-4">

                {[
                  "SQL",
                  "Docker",
                  "System Design",
                  "TensorFlow",
                ].map((item) => (

                  <div
                    key={item}
                    className="
                      rounded-xl
                      border
                      border-orange-500/20
                      bg-orange-500/10
                      p-4
                      text-orange-300
                    "
                  >
                    📈 {item}
                  </div>

                ))}

              </div>

            </div>

          </div>

          {/* Company Overview */}

          <div className="mt-10">

            <h3 className="text-xl font-bold text-white mb-5">

              About This Opportunity

            </h3>

            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/5
                p-6
              "
            >

              <p className="text-gray-300 leading-8">

                This role focuses on building AI-powered products,
                developing machine learning models, deploying
                intelligent systems, and collaborating with software
                engineers to solve real-world problems.

              </p>

            </div>

          </div>

        </div>

      {/* Continue Here */}
            {/* Roadmap + Apply */}

      <div className="grid lg:grid-cols-2 gap-6 mt-8">

        {/* How To Achieve */}

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

            How To Achieve This Role

          </h2>

          <div className="space-y-5">

            {[
              "Master SQL & Database Design",
              "Learn Docker & Cloud Basics",
              "Build 3 Real AI Projects",
              "Practice DSA & System Design",
              "Prepare for Technical Interviews",
            ].map((step, index) => (

              <div
                key={step}
                className="
                  flex
                  gap-4
                  items-center
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/5
                  p-4
                "
              >

                <div
                  className="
                    w-10
                    h-10
                    rounded-full
                    bg-gradient-to-r
                    from-violet-500
                    to-cyan-500
                    flex
                    items-center
                    justify-center
                    text-white
                    font-bold
                  "
                >
                  {index + 1}
                </div>

                <span className="text-gray-300">

                  {step}

                </span>

              </div>

            ))}

          </div>

        </div>

        {/* Projects */}

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

            Recommended Projects

          </h2>

          <div className="space-y-4">

            {[
              "AI Resume Analyzer",
              "Chatbot using Gemini API",
              "Movie Recommendation System",
              "Face Recognition Attendance",
            ].map((project) => (

              <div
                key={project}
                className="
                  rounded-xl
                  border
                  border-cyan-500/20
                  bg-cyan-500/10
                  p-4
                  text-cyan-300
                "
              >

                💻 {project}

              </div>

            ))}

          </div>

        </div>

      </div>

      {/* Interview + Apply */}

      <div className="grid lg:grid-cols-2 gap-6 mt-8">

        {/* Interview Topics */}

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

            Interview Preparation

          </h2>

          <div className="flex flex-wrap gap-3">

            {[
              "Python",
              "SQL",
              "Machine Learning",
              "DSA",
              "OOP",
              "System Design",
              "Git",
            ].map((topic) => (

              <span
                key={topic}
                className="
                  px-4
                  py-2
                  rounded-full
                  bg-violet-500/10
                  border
                  border-violet-500/30
                  text-violet-300
                "
              >

                {topic}

              </span>

            ))}

          </div>

        </div>

        {/* Apply */}

        <div
          className="
            rounded-3xl
            border
            border-cyan-500/30
            bg-gradient-to-br
            from-cyan-500/10
            to-violet-500/10
            p-8
            flex
            flex-col
            justify-between
          "
        >

          <div>

            <h2 className="text-2xl font-bold text-white">

              Ready to Apply?

            </h2>

            <p className="text-gray-300 mt-4 leading-7">

              Once you've completed the recommended skills and
              projects, you can apply directly through the official
              company careers website.

            </p>

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
              hover:scale-[1.02]
              transition
            "
          >

            Apply on Official Website

          </button>

        </div>

      </div>

    </DashboardLayout>
  );
}


