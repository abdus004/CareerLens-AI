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
const [analysis, setAnalysis] = useState(null);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");

const handleFileChange = (e) => {
  if (e.target.files.length > 0) {
    setResume(e.target.files[0]);
  }
};
const handleAnalyzeResume = async () => {
  if (!resume) {
    alert("Please choose a resume first.");
    return;
  }

  try {
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", resume);

    const response = await fetch("http://127.0.0.1:8000/resume/analyze", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    setAnalysis(data);
    setMessage("✅ Resume analyzed successfully!");

  } catch (error) {
    console.error(error);
    setMessage("❌ Failed to analyze resume.");
  } finally {
    setLoading(false);
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
{resume && (
  <button
    onClick={handleAnalyzeResume}
    disabled={loading}
    className="
      mt-5
      px-8
      py-3
      rounded-2xl
      bg-cyan-500
      text-white
      font-semibold
      hover:scale-105
      transition
      disabled:opacity-50
    "
  >
    {loading ? "Analyzing..." : "Analyze Resume"}
  </button>
)}

{message && (
  <p
    className={`mt-4 text-center font-medium ${
      message.startsWith("✅")
        ? "text-green-400"
        : "text-red-400"
    }`}
  >
    {message}
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

              Resume Score

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

                  {analysis?.resume_score ?? "--"}%

                </h1>

                <p className="text-gray-400 text-center mt-2">

                  {analysis?.resume_rating ?? "Not Analyzed"}

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

              Analysis Breakdown

            </h2>

          </div>

          <div className="space-y-5 mt-8">

  <div className="flex justify-between">
    <span className="text-gray-400">ATS Score</span>
    <span className="text-cyan-400 font-bold">{analysis?.ats_score ?? "--"}%</span>
  </div>

  <div className="flex justify-between">
    <span className="text-gray-400">Grammar Score</span>
    <span className="text-green-400 font-bold">{analysis?.grammar_score ?? "--"}%</span>
  </div>

  <div className="flex justify-between">
    <span className="text-gray-400">Keyword Score</span>
    <span className="text-yellow-400 font-bold">{analysis?.keyword_score ?? "--"}%</span>
  </div>

  <div className="flex justify-between">
    <span className="text-gray-400">Formatting Score</span>
    <span className="text-violet-400 font-bold">{analysis?.formatting_score ?? "--"}%</span>
  </div>

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

          {analysis?.suggestions?.map((item, index) => (
  <div
    key={index}
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

    </DashboardLayout>
  );
}