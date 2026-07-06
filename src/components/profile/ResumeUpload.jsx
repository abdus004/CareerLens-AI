import { useState } from "react";
import { Upload, FileText } from "lucide-react";

export default function ResumeUpload({ onNext, onBack }) {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleFinish = () => {
    // Resume is optional
    // Later we'll save everything to backend
    onNext();
  };

  return (
    <div>

      <h3 className="text-white text-xl font-semibold mb-3">
        Upload Your Resume
      </h3>

      <p className="text-gray-400 mb-8">
        Uploading a resume is optional, but it helps CareerLens AI provide
        more personalized career recommendations.
      </p>

      <label
        className="
          flex
          flex-col
          items-center
          justify-center
          border-2
          border-dashed
          border-violet-500/40
          rounded-3xl
          bg-white/5
          hover:bg-white/10
          transition-all
          cursor-pointer
          py-14
        "
      >
        <Upload
          size={48}
          className="text-violet-400 mb-5"
        />

        <h4 className="text-white text-lg font-semibold">
          Click to Upload Resume
        </h4>

        <p className="text-gray-400 mt-2 text-center">
          PDF, DOC, DOCX
          <br />
          (Optional)
        </p>

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {file && (
        <div
          className="
            mt-6
            rounded-2xl
            border
            border-violet-500/30
            bg-violet-500/10
            p-5
            flex
            items-center
            gap-4
          "
        >
          <FileText
            size={28}
            className="text-violet-400"
          />

          <div>
            <h4 className="text-white font-semibold">
              Resume Selected
            </h4>

            <p className="text-gray-400 text-sm">
              {file.name}
            </p>
          </div>

        </div>
      )}

      <div className="flex justify-between mt-10">

        <button
          onClick={onBack}
          className="
            px-8
            py-3
            rounded-xl
            border
            border-white/10
            bg-white/5
            text-white
            hover:bg-white/10
            transition
          "
        >
          ← Back
        </button>

        <button
          onClick={handleFinish}
          className="
            px-8
            py-3
            rounded-xl
            bg-gradient-to-r
            from-violet-600
            to-fuchsia-600
            text-white
            font-semibold
            hover:scale-105
            transition
          "
        >
          Finish →
        </button>

      </div>

    </div>
  );
}