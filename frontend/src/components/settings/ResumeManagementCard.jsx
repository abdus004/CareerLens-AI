import { useRef, useState, useEffect } from "react";
import { FileText, Download, RefreshCcw, CheckCircle2 } from "lucide-react";
import api from "../../services/api";
import { useProfile } from "../../context/ProfileContext";
import { getCurrentUser } from "../../utils/session";
import { getErrorMessage } from "../../utils/apiError";
import ReplaceResumeModal from "./ReplaceResumeModal";

function extractFileName(resumeUrl) {
  if (!resumeUrl) return "resume.pdf";
  try {
    const last = decodeURIComponent(resumeUrl.split("/").pop() || "resume.pdf");
    // Uploaded as `${uuid}_${originalFilename}` - uuid4 has no underscores.
    const underscoreIndex = last.indexOf("_");
    return underscoreIndex !== -1 ? last.slice(underscoreIndex + 1) : last;
  } catch {
    return "resume.pdf";
  }
}

function formatDate(isoString) {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function ResumeManagementCard() {
  const { profileData, updateProfile } = useProfile();
  const fileInputRef = useRef(null);

  const [updatedAt, setUpdatedAt] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [replaceError, setReplaceError] = useState("");
  const [replaceSuccess, setReplaceSuccess] = useState(false);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user?.email) return;

    api
      .get(`/resume/data/${encodeURIComponent(user.email)}`)
      .then((res) => setUpdatedAt(res?.data?.data?.updated_at || null))
      .catch(() => {});
  }, [profileData.resume_url]);

  const handlePickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPendingFile(file);
    setReplaceError("");
    setShowConfirm(true);
  };

  const handleConfirmReplace = async () => {
    const user = getCurrentUser();
    if (!user?.email || !pendingFile) return;

    setReplacing(true);
    setReplaceError("");

    try {
      const formData = new FormData();
      formData.append("email", user.email);
      formData.append("file", pendingFile);

      const response = await api.post("/settings/resume/replace", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      updateProfile({
        resume_url: response.data.resume_url,
        skills: response.data.skills || profileData.skills,
      });
      setWarnings(response.data.warnings || []);
      setUpdatedAt(new Date().toISOString());
      setShowConfirm(false);
      setPendingFile(null);
      setReplaceSuccess(true);
      setTimeout(() => setReplaceSuccess(false), 5000);
    } catch (err) {
      setReplaceError(
        getErrorMessage(err, "Could not replace your resume. Please try again.")
      );
    } finally {
      setReplacing(false);
    }
  };

  const handleCancel = () => {
    if (replacing) return;
    setShowConfirm(false);
    setPendingFile(null);
  };

  const fileName = extractFileName(profileData.resume_url);

  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4">Resume Management</h3>

      {profileData.resume_url ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0B1120] p-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
              <FileText className="text-cyan-400" size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium truncate">{fileName}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Last Updated: {formatDate(updatedAt)}
              </p>
            </div>
          </div>

          <div className="flex gap-3 flex-shrink-0">
            <a
              href={profileData.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="
                px-4 py-2.5 rounded-xl text-sm
                border border-white/10 text-white
                hover:bg-white/10 transition
                flex items-center gap-2
              "
            >
              <Download size={15} />
              Download
            </a>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="
                px-4 py-2.5 rounded-xl text-sm
                bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold
                hover:opacity-90 transition
                flex items-center gap-2
              "
            >
              <RefreshCcw size={15} />
              Replace Resume
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
          <p className="text-gray-400 text-sm">No resume on file yet.</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="
              mt-3 px-5 py-2.5 rounded-xl text-sm
              bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold
              hover:opacity-90 transition
            "
          >
            Upload Resume
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handlePickFile}
      />

      {replaceSuccess && (
        <div className="mt-3 flex items-start gap-2 text-emerald-400 text-sm">
          <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
          <span>
            Resume replaced. Resume-dependent modules are refreshing with your
            new resume.
            {warnings.length > 0 && (
              <span className="block text-orange-400 mt-1">
                Some modules couldn't refresh automatically ({warnings.join("; ")}) -
                you can retrigger them from their own pages.
              </span>
            )}
          </span>
        </div>
      )}

      {showConfirm && (
        <ReplaceResumeModal
          fileName={pendingFile?.name}
          submitting={replacing}
          error={replaceError}
          onConfirm={handleConfirmReplace}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
