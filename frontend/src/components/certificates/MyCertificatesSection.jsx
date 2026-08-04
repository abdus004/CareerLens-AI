import { Award, Download, Eye, Plus, RefreshCw, FileText } from "lucide-react";

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MyCertificatesSection({
  certificates,
  loading,
  error,
  onUploadClick,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col h-full">
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

      <div className="mt-5 flex-1 min-h-0">
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
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="rounded-2xl border border-white/10 bg-[#0B1120] p-4"
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
                  Issued {formatDate(cert.issue_date)}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
