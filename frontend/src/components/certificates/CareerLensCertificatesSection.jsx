import { Award, Download, RefreshCw } from "lucide-react";

const CATEGORY_LABELS = {
  Programming: "Programming",
  Aptitude: "Aptitude",
  Reasoning: "Reasoning",
  SQL: "SQL",
  Python: "Python",
  Java: "Java",
  "AI/ML": "AI / ML",
};

export default function CareerLensCertificatesSection({
  certificates,
  loading,
  error,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="text-xl font-semibold text-white">
            CareerLens Certificates
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Earned by passing a Skill Assessment with 80% or higher.
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
          <Award size={22} />
        </div>
      </div>

      <p className="text-3xl font-bold text-white mt-4">
        {loading ? "--" : certificates.length}{" "}
        <span className="text-base font-medium text-gray-400">
          {certificates.length === 1 ? "Certificate" : "Certificates"}
        </span>
      </p>

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
            <Award className="text-gray-600 mx-auto mb-3" size={36} />
            <p className="text-gray-400 text-sm">
              You haven't earned any certificates yet.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Score 80% or higher on a Skill Assessment to unlock one.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {certificates.map((cert) => {
              const categoryLabel =
                CATEGORY_LABELS[cert.category] || cert.category;
              return (
                <div
                  key={cert.id}
                  className="rounded-2xl border border-white/10 bg-[#0B1120] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold truncate">
                        {categoryLabel} Assessment
                      </h3>
                      <p className="text-gray-400 text-sm mt-0.5">
                        {cert.difficulty}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-green-400 text-xl font-bold">
                      {cert.score}%
                    </span>
                  </div>

                  <p className="text-gray-500 text-xs mt-3">
                    Issued{" "}
                    {new Date(cert.issued_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    Certificate ID: {cert.certificate_id}
                  </p>

                  <a
                    href={cert.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    Download Certificate
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
