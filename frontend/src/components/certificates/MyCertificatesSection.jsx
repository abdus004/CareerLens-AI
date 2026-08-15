import { useState } from "react";
import {
  Award,
  Download,
  Eye,
  Plus,
  RefreshCw,
  FileText,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";
import { getErrorMessage } from "../../utils/apiError";

function formatDate(dateString) {
  if (!dateString) return "Issue date not specified";
  return new Date(dateString).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Keeps the section from growing indefinitely as more certificates are
// uploaded - only this inner row scrolls (left/right), the
// header/count/button above it stay fixed. CAREERLENS_CARD_WIDTH
// mirrors the value used by the other two sections so all three
// sections' cards line up visually.
const CARD_WIDTH = 300;

export default function MyCertificatesSection({
  certificates,
  loading,
  error,
  onUploadClick,
  onDeleteCertificate,
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmError, setConfirmError] = useState(null);

  const pendingCert =
    certificates.find((c) => c.id === confirmDeleteId) || null;

  const closeConfirm = () => {
    if (deletingId) return;
    setConfirmDeleteId(null);
    setConfirmError(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      setDeletingId(confirmDeleteId);
      setConfirmError(null);
      await onDeleteCertificate(confirmDeleteId);
      setConfirmDeleteId(null);
    } catch (err) {
      setConfirmError(
        getErrorMessage(err, "We couldn't delete this certificate. Please try again.")
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col">
      {/* Horizontal scrollbar for the certificate row, matching the dark theme. */}
      <style>{`
        .cl-cert-hscroll::-webkit-scrollbar { height: 6px; }
        .cl-cert-hscroll::-webkit-scrollbar-track { background: transparent; }
        .cl-cert-hscroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 9999px; }
        .cl-cert-hscroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
        .cl-cert-hscroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent; }
      `}</style>

      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="text-xl font-semibold text-white">My Certificates</h2>
          <p className="text-gray-400 text-sm mt-1">
            Certifications you've earned from external providers.
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
          <Award size={22} />
        </div>
      </div>

      <p className="text-3xl font-bold text-white mt-4">
        {loading ? "--" : certificates.length}{" "}
        <span className="text-base font-medium text-gray-400">
          {certificates.length === 1 ? "Certificate" : "Certificates"}
        </span>
      </p>

      <button
        onClick={onUploadClick}
        className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Upload Certificate
      </button>

      <div className="mt-5">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-400 py-8">
            <RefreshCw className="animate-spin" size={18} />
            Loading your certificates...
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm py-4">{error}</p>
        ) : certificates.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="text-gray-600 mx-auto mb-3" size={36} />
            <p className="text-gray-400 text-sm">
              No external certificates uploaded yet.
            </p>
          </div>
        ) : (
          <div className="cl-cert-hscroll flex gap-4 overflow-x-auto overflow-y-hidden pb-2">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="rounded-2xl border border-white/10 bg-[#0B1120] p-4 flex-shrink-0"
                style={{ width: CARD_WIDTH }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold truncate">
                      {cert.certificate_name}
                    </h3>
                    <p className="text-gray-400 text-sm mt-0.5">
                      {cert.provider}
                    </p>
                  </div>
                  <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                    {cert.category}
                  </span>
                </div>

                <p className="text-gray-500 text-xs mt-3">
                  {formatDate(cert.issue_date)}
                </p>

                <div className="flex gap-2 mt-4">
                  <a
                    href={cert.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-white text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} />
                    View
                  </a>
                  <a
                    href={cert.file_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 transition text-white text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    Download
                  </a>
                  <button
                    onClick={() => {
                      setConfirmDeleteId(cert.id);
                      setConfirmError(null);
                    }}
                    title="Delete certificate"
                    className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition text-red-300 flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingCert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeConfirm}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0b0e1a] p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <button
                onClick={closeConfirm}
                disabled={Boolean(deletingId)}
                className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center flex-shrink-0 disabled:opacity-60"
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            <h2 className="text-lg font-bold text-white">
              Delete Certificate?
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              Are you sure you want to delete{" "}
              <span className="text-gray-200 font-medium">
                {pendingCert.certificate_name}
              </span>
              ? This action cannot be undone.
            </p>

            {confirmError && (
              <p className="text-red-400 text-sm mt-3">{confirmError}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeConfirm}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-white text-sm font-medium disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500/90 hover:bg-red-500 transition text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deletingId ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
                {deletingId ? "Deleting..." : "Delete Certificate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
