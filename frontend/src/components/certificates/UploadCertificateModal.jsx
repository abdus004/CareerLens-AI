import { useState } from "react";
import { X, UploadCloud, RefreshCw } from "lucide-react";

const INPUT_CLASS =
  "mt-2 w-full rounded-xl bg-[#0B1120] border border-white/10 p-3 text-white outline-none focus:border-cyan-500 transition";

const CATEGORIES = [
  "Cloud",
  "Programming",
  "Data Science",
  "AI/ML",
  "Database",
  "DevOps",
  "Web Development",
  "Cybersecurity",
  "Networking",
  "Other",
];

/**
 * Shared modal for:
 *  - Section 1 "Upload Certificate" (My Certificates) -> showCategory=true,
 *    requireDetails=false (only the file is mandatory; blank fields fall
 *    back to server-computed defaults)
 *  - Section 3 "Complete Certification" upload, once progress hits 100%
 *    -> showCategory=false, name/provider pre-filled and locked,
 *    requireDetails=true (unchanged, still fully required)
 *
 * onSubmit receives ({ certificate_name, provider, issue_date, category, file })
 * and is expected to be async - the modal shows its own submitting state
 * and surfaces onSubmit's thrown error message.
 */
export default function UploadCertificateModal({
  title = "Upload Certificate",
  showCategory = true,
  requireDetails = true,
  initialName = "",
  initialProvider = "",
  lockNameAndProvider = false,
  submitLabel = "Upload Certificate",
  onClose,
  onSubmit,
}) {
  const [certificateName, setCertificateName] = useState(initialName);
  const [provider, setProvider] = useState(initialProvider);
  const [issueDate, setIssueDate] = useState("");
  const [category, setCategory] = useState("Other");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please choose a certificate file.");
      return;
    }

    if (requireDetails && (!certificateName.trim() || !provider.trim() || !issueDate)) {
      setError("Please fill in every field and choose a file.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        certificate_name: certificateName.trim(),
        provider: provider.trim(),
        issue_date: issueDate,
        category,
        file,
      });
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "We couldn't save this certificate. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b0e1a] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center flex-shrink-0"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm">
              Certificate Name
              {!requireDetails && (
                <span className="text-gray-500"> (Optional)</span>
              )}
            </label>
            <input
              type="text"
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
              disabled={lockNameAndProvider}
              placeholder="e.g. Google Data Analytics Professional Certificate"
              className={`${INPUT_CLASS} disabled:opacity-60`}
            />
            {!requireDetails && (
              <p className="text-gray-500 text-xs mt-1.5">
                Leave blank to use the file name.
              </p>
            )}
          </div>

          <div>
            <label className="text-gray-400 text-sm">
              Provider
              {!requireDetails && (
                <span className="text-gray-500"> (Optional)</span>
              )}
            </label>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              disabled={lockNameAndProvider}
              placeholder="e.g. Google, AWS, Coursera"
              className={`${INPUT_CLASS} disabled:opacity-60`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm">
                Issue Date
                {!requireDetails && (
                  <span className="text-gray-500"> (Optional)</span>
                )}
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className={INPUT_CLASS}
              />
            </div>

            {showCategory && (
              <div>
                <label className="text-gray-400 text-sm">
                  Category
                  {!requireDetails && (
                    <span className="text-gray-500"> (Optional)</span>
                  )}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-gray-400 text-sm">
              Certificate PDF or Image
            </label>
            <label
              className="
                mt-2 flex flex-col items-center justify-center gap-2
                rounded-xl border-2 border-dashed border-white/15
                bg-white/5 py-8 px-4 cursor-pointer
                hover:border-cyan-500/50 hover:bg-white/[0.07] transition
              "
            >
              <UploadCloud className="text-cyan-400" size={26} />
              <span className="text-gray-300 text-sm text-center">
                {file ? file.name : "Click to choose a PDF, PNG, JPG or WEBP"}
              </span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <UploadCloud size={18} />
            )}
            {submitting ? "Saving..." : submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
