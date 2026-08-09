import { useEffect, useState } from "react";
import {
  Sparkles,
  ExternalLink,
  Info,
  RefreshCw,
  UploadCloud,
  Eye,
} from "lucide-react";

const CARD_WIDTH = 340;

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

  // Local mirror of progress so the slider handle/label track the
  // drag smoothly. Only committed to the parent (and the PUT request)
  // once the user releases the slider - not on every pixel of drag -
  // so scrubbing from 0 to 100 fires one API call, not fifty.
  const [localProgress, setLocalProgress] = useState(progress_percent);

  useEffect(() => {
    setLocalProgress(progress_percent);
  }, [progress_percent]);

  const commitProgress = () => {
    if (localProgress !== progress_percent) {
      onProgressChange(recommendation.id, localProgress);
    }
  };

  return (
    <div
      className="rounded-2xl border border-white/10 bg-[#0B1120] p-5 flex flex-col flex-shrink-0"
      style={{ width: CARD_WIDTH }}
    >
      {/* Everything that varies in length (name, description) lives in
          this block, which just grows naturally. */}
      <div>
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
              {localProgress}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-150"
              style={{ width: `${localProgress}%` }}
            />
          </div>

          <div className="mt-3">
            <label className="text-gray-500 text-xs">Update progress</label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={localProgress}
              disabled={updatingProgress}
              onChange={(e) => setLocalProgress(Number(e.target.value))}
              onMouseUp={commitProgress}
              onTouchEnd={commitProgress}
              onKeyUp={commitProgress}
              className="w-full mt-1.5 accent-cyan-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* mt-auto pins this block to the bottom of the card regardless
          of how short or long the description/content above is - so
          when several cards with different-length descriptions sit
          side by side, every "View Details / Start Course" row (and
          the "Upload Certificate to Complete" button when it appears)
          lines up at the same height instead of floating at different
          points depending on content length. This relies on the outer
          horizontal-scroll row stretching every card to equal height
          by default (flexbox align-items: stretch). */}
      <div className="mt-auto pt-4">
        <div className="flex flex-wrap gap-2">
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
          <div className="cl-cert-hscroll flex gap-5 overflow-x-auto overflow-y-hidden pb-2">
            <style>{`
              .cl-cert-hscroll::-webkit-scrollbar { height: 6px; }
              .cl-cert-hscroll::-webkit-scrollbar-track { background: transparent; }
              .cl-cert-hscroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 9999px; }
              .cl-cert-hscroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
              .cl-cert-hscroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent; }
            `}</style>
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
