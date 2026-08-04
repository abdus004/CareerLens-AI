import {
  Sparkles,
  ExternalLink,
  Info,
  RefreshCw,
  UploadCloud,
  Eye,
} from "lucide-react";

const PROGRESS_STEPS = [0, 25, 50, 75, 100];

const SELECT_CLASS =
  "rounded-lg bg-[#0B1120] border border-white/10 py-1.5 px-2 text-white text-sm outline-none focus:border-cyan-500 transition";

function RecommendationCard({
  recommendation,
  onProgressChange,
  updatingProgress,
  onViewDetails,
  onCompleteClick,
}) {
  const {
    certificate_name,
    provider,
    difficulty,
    estimated_duration,
    description,
    official_link,
    progress_percent,
  } = recommendation;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B1120] p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-white font-semibold leading-snug">
            {certificate_name}
          </h3>
          <p className="text-gray-400 text-sm mt-1">{provider}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/15 border border-violet-500/30 text-violet-300">
          {difficulty}
        </span>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
          {estimated_duration}
        </span>
      </div>

      <p className="text-gray-400 text-sm mt-3 line-clamp-3">{description}</p>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-gray-400 text-xs">Progress</span>
          <span className="text-white text-xs font-semibold">
            {progress_percent}%
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress_percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <label className="text-gray-500 text-xs">Update progress</label>
          <select
            value={progress_percent}
            disabled={updatingProgress}
            onChange={(e) =>
              onProgressChange(recommendation.id, Number(e.target.value))
            }
            className={SELECT_CLASS}
          >
            {PROGRESS_STEPS.map((step) => (
              <option key={step} value={step}>
                {step}%
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => onViewDetails(recommendation)}
          className="flex-1 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-white text-sm font-medium flex items-center justify-center gap-1.5"
        >
          <Eye size={14} />
          View Details
        </button>
        <a
          href={official_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 transition text-white text-sm font-medium flex items-center justify-center gap-1.5"
        >
          <ExternalLink size={14} />
          Start Course
        </a>
      </div>

      {progress_percent === 100 && (
        <button
          onClick={() => onCompleteClick(recommendation)}
          className="mt-2 w-full py-2 rounded-lg border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 transition text-green-300 text-sm font-semibold flex items-center justify-center gap-1.5"
        >
          <UploadCloud size={14} />
          Upload Certificate to Complete
        </button>
      )}
    </div>
  );
}

export default function RecommendedCertificationsSection({
  ready,
  message,
  recommendations,
  loading,
  error,
  updatingId,
  onProgressChange,
  onViewDetails,
  onCompleteClick,
  onRetry,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Sparkles className="text-yellow-400" size={20} />
            Recommended Certifications
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            AI-powered picks based on your resume, skills and career goal.
          </p>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-400 py-8">
            <RefreshCw className="animate-spin" size={18} />
            {message || "Loading recommendations..."}
          </div>
        ) : error ? (
          <div className="py-6">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-white text-sm font-medium flex items-center gap-2 w-fit"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        ) : !ready ? (
          <div className="rounded-2xl border border-white/10 bg-[#0B1120] p-6 flex items-start gap-3">
            <Info className="text-cyan-400 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-gray-300 text-sm">{message}</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-10">
            <Sparkles className="text-gray-600 mx-auto mb-3" size={36} />
            <p className="text-gray-400 text-sm">
              No recommendations yet.
            </p>
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-white text-sm font-medium flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                updatingProgress={updatingId === rec.id}
                onProgressChange={onProgressChange}
                onViewDetails={onViewDetails}
                onCompleteClick={onCompleteClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
