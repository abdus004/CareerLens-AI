import { X, ExternalLink, BadgeCheck, ListChecks, TrendingUp, ClipboardList } from "lucide-react";

export default function CertificateDetailsModal({ recommendation, onClose }) {
  if (!recommendation) return null;

  const {
    certificate_name,
    provider,
    category,
    difficulty,
    estimated_duration,
    description,
    skills_learned = [],
    career_benefits = [],
    prerequisites = [],
    official_link,
  } = recommendation;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0b0e1a] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{certificate_name}</h2>
            <p className="text-gray-400 mt-1">
              {provider}
              {category ? ` • ${category}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center flex-shrink-0"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/15 border border-violet-500/30 text-violet-300">
            {difficulty}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
            {estimated_duration}
          </span>
        </div>

        {description && (
          <p className="text-gray-300 leading-relaxed mb-6">{description}</p>
        )}

        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="text-cyan-400" size={18} />
              <h3 className="text-white font-semibold">Skills Learned</h3>
            </div>
            {skills_learned.length > 0 ? (
              <ul className="space-y-2">
                {skills_learned.map((skill, i) => (
                  <li key={i} className="text-gray-300 text-sm flex gap-2">
                    <span className="text-cyan-400">•</span> {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">Not specified.</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="text-violet-400" size={18} />
              <h3 className="text-white font-semibold">Career Benefits</h3>
            </div>
            {career_benefits.length > 0 ? (
              <ul className="space-y-2">
                {career_benefits.map((benefit, i) => (
                  <li key={i} className="text-gray-300 text-sm flex gap-2">
                    <span className="text-violet-400">•</span> {benefit}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">Not specified.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="text-yellow-400" size={18} />
            <h3 className="text-white font-semibold">Prerequisites</h3>
          </div>
          {prerequisites.length > 0 ? (
            <ul className="space-y-2">
              {prerequisites.map((req, i) => (
                <li key={i} className="text-gray-300 text-sm flex gap-2">
                  <span className="text-yellow-400">•</span> {req}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <BadgeCheck size={16} className="text-green-400" />
              No prerequisites - open to everyone.
            </p>
          )}
        </div>

        <a
          href={official_link}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
        >
          <ExternalLink size={16} />
          Open Official Course Page
        </a>
      </div>
    </div>
  );
}
