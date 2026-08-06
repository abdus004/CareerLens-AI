import { AlertTriangle, Loader2, X } from "lucide-react";

const DEPENDENT_MODULES = [
  "Resume Analysis",
  "Career Intelligence",
  "Skill Analysis",
  "Learning Path",
  "Job Recommendations",
  "Certificate Recommendations",
];

export default function ReplaceResumeModal({
  fileName,
  submitting,
  error,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b0e1a] p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <AlertTriangle className="text-orange-400" size={22} />
            </div>
            <h2 className="text-xl font-bold text-white">Replace Resume?</h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="text-gray-400 hover:text-white transition disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-300 text-sm">
          You're about to replace your current resume with{" "}
          <span className="text-white font-medium">{fileName}</span>. Your new
          resume will become the source for the following, which will be
          refreshed to reflect it:
        </p>

        <ul className="mt-4 space-y-2">
          {DEPENDENT_MODULES.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              {item}
            </li>
          ))}
        </ul>

        <p className="text-gray-500 text-xs mt-4">
          This can take a little while to fully finish in the background. Your
          old resume-derived results will no longer be shown once it starts.
        </p>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="
              flex-1 py-3 rounded-xl border border-white/10 text-white
              hover:bg-white/10 transition disabled:opacity-50
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="
              flex-1 py-3 rounded-xl
              bg-gradient-to-r from-violet-600 to-cyan-500
              text-white font-semibold
              hover:opacity-90 transition disabled:opacity-60
              flex items-center justify-center gap-2
            "
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Replacing..." : "Replace Resume"}
          </button>
        </div>
      </div>
    </div>
  );
}
