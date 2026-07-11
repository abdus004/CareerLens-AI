import { useRef, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import {
  FileText,
  Upload,
  CheckCircle,
} from "lucide-react";

export default function ResumeAnalyzer() {
    const fileInputRef = useRef(null);
const [resume, setResume] = useState(null);

const handleFileChange = (e) => {
  if (e.target.files.length > 0) {
    setResume(e.target.files[0]);
  }
};
  return (
    <DashboardLayout>

      {/* Page Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-white">

          Resume Analyzer

        </h1>

        <p className="text-gray-400 mt-2">

          Upload your resume and receive an AI-powered ATS analysis with
          personalized suggestions.

        </p>

      </div>

      {/* Upload Resume */}

      <div
        className="
          rounded-3xl
          border-2
          border-dashed
          border-violet-500/40
          bg-white/5
          p-10
          text-center
        "
      >

        <Upload
          size={60}
          className="mx-auto text-violet-400"
        />

        <h2 className="text-2xl font-bold text-white mt-6">

          Upload Your Resume

        </h2>

        <p className="text-gray-400 mt-3">

          Supported formats: PDF, DOC, DOCX

        </p>

        <>
  <input
    ref={fileInputRef}
    type="file"
    accept=".pdf,.doc,.docx"
    className="hidden"
    onChange={handleFileChange}
  />

  <button
    onClick={() => fileInputRef.current.click()}
    className="
      mt-8
      px-8
      py-3
      rounded-2xl
      bg-gradient-to-r
      from-violet-600
      via-fuchsia-600
      to-cyan-500
      text-white
      font-semibold
      hover:scale-105
      transition
    "
  >
    Choose Resume
  </button>

  {resume && (
    <p className="text-green-400 mt-5 font-medium">
      📄 {resume.name}
    </p>
  )}
</>

      </div>

      {/* ATS Score */}

      <div className="grid lg:grid-cols-2 gap-6 mt-8">

        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-8
          "
        >

          <div className="flex items-center gap-3">

            <FileText
              className="text-cyan-400"
              size={30}
            />

            <h2 className="text-2xl font-bold text-white">

              ATS Resume Score

            </h2>

          </div>

          <div className="mt-8 flex justify-center">

            <div
              className="
                w-44
                h-44
                rounded-full
                border-[10px]
                border-cyan-400
                flex
                items-center
                justify-center
              "
            >

              <div>

                <h1 className="text-5xl font-black text-white text-center">

                  92%

                </h1>

                <p className="text-gray-400 text-center mt-2">

                  Excellent

                </p>

              </div>

            </div>

          </div>

        </div>

        {/* Resume Summary */}

        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-8
          "
        >

          <div className="flex items-center gap-3">

            <CheckCircle
              className="text-green-400"
              size={30}
            />

            <h2 className="text-2xl font-bold text-white">

              Resume Summary

            </h2>

          </div>

          <div className="space-y-5 mt-8">

            <div className="flex justify-between">

              <span className="text-gray-400">

                Skills Detected

              </span>

              <span className="text-white font-semibold">

                14

              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-gray-400">

                Projects

              </span>

              <span className="text-white font-semibold">

                4

              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-gray-400">

                Certifications

              </span>

              <span className="text-white font-semibold">

                3

              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-gray-400">

                Experience

              </span>

              <span className="text-white font-semibold">

                Fresher

              </span>

            </div>

          </div>

        </div>

      </div>

      {/* Next Section Starts Here */}

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
                {/* Resume Strengths */}

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

            Resume Strengths

          </h2>

          <div className="grid grid-cols-2 gap-4">

            {[
              "Python",
              "Machine Learning",
              "Data Analysis",
              "Git & GitHub",
              "Projects",
              "Problem Solving",
              "Communication",
              "Team Work",
            ].map((skill) => (

              <div
                key={skill}
                className="
                  rounded-xl
                  border
                  border-green-500/30
                  bg-green-500/10
                  px-5
                  py-4
                  text-green-300
                  font-medium
                "
              >

                ✓ {skill}

              </div>

            ))}

          </div>

        </div>

        {/* Missing Skills */}

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

            Missing Skills

          </h2>

                    <div className="flex flex-wrap gap-4">

            {[
              "SQL",
              "Docker",
              "React",
              "System Design",
              "AWS",
              "CI/CD",
              "REST APIs",
              "Testing",
            ].map((skill) => (

              <span
                key={skill}
                className="
                  px-5
                  py-3
                  rounded-xl
                  border
                  border-red-500/30
                  bg-red-500/10
                  text-red-300
                  font-medium
                "
              >
                {skill}
              </span>

            ))}

          </div>

        </div>

      </div>

      {/* Resume Suggestions */}

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
            "Add measurable achievements to your projects.",
            "Include SQL and database-related projects.",
            "Highlight internships and certifications prominently.",
            "Use ATS-friendly keywords based on your target role.",
            "Keep your resume to one page with consistent formatting.",
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

      {/* Download Report */}

      <div className="mt-8 flex justify-end">

        <button
          className="
            px-8
            py-3
            rounded-2xl
            bg-gradient-to-r
            from-violet-600
            via-fuchsia-600
            to-cyan-500
            text-white
            font-semibold
            hover:scale-105
            transition
          "
        >
          Download Analysis Report
        </button>

      </div>

    </DashboardLayout>
  );
}