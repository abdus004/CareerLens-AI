import { useEffect, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import api from "../services/api";
import { getCurrentUser } from "../utils/session";
import {
  Building2,
  MapPin,
  IndianRupee,
  Calendar,
  Clock,
  Briefcase,
  ExternalLink,
  X,
  RefreshCw,
  ChevronDown,
  Sparkles,
} from "lucide-react";

const EMPLOYMENT_TYPE_STYLES = {
  Internship: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  "Graduate Program": "bg-violet-500/15 text-violet-300 border-violet-500/30",
  "Full Time": "bg-green-500/15 text-green-300 border-green-500/30",
};

function formatDeadline(deadline) {
  if (!deadline) return "Rolling / Ongoing";

  return new Date(deadline).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysLeft(deadline) {
  if (!deadline) return null;

  const diffMs = new Date(deadline).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function DaysLeftBadge({ deadline }) {
  const left = daysLeft(deadline);

  if (left === null) {
    return <span className="text-gray-400 text-sm">Rolling</span>;
  }

  if (left <= 0) {
    return <span className="text-red-400 text-sm font-medium">Closes today</span>;
  }

  if (left <= 3) {
    return <span className="text-red-400 text-sm font-medium">{left} days left</span>;
  }

  if (left <= 7) {
    return <span className="text-orange-400 text-sm font-medium">{left} days left</span>;
  }

  return <span className="text-gray-400 text-sm">{left} days left</span>;
}

function CompanyLogo({ src, alt, size = 48 }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <Building2 size={size * 0.5} className="text-cyan-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="rounded-xl bg-white/5 border border-white/10 object-contain p-1.5 flex-shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

function ApplyButton({ drive, className = "" }) {
  const label = drive.url_type === "direct" ? "Apply Now" : "Visit Careers";

  return (
    <a
      href={drive.apply_url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        flex items-center justify-center gap-2
        py-3 rounded-xl font-semibold
        bg-gradient-to-r from-violet-600 to-cyan-500
        text-white hover:scale-[1.02] transition-all
        ${className}
      `}
    >
      <ExternalLink size={18} />
      {label}
    </a>
  );
}

// Same card design as before - untouched. Pulled into its own
// component purely so it can be rendered for both the Top 10
// Recommended section and the Browse More section without duplicating
// the JSX.
function DriveCard({ drive, onViewDetails }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-7 hover:border-cyan-400/40 transition-all duration-300">
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-3">
          <CompanyLogo src={drive.company_logo} alt={drive.company_name} />
          <div>
            <h2 className="text-2xl font-bold text-white">{drive.company_name}</h2>
            <p className="text-gray-400">{drive.role}</p>
          </div>
        </div>

        <span
          className={`
            px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap
            ${EMPLOYMENT_TYPE_STYLES[drive.employment_type] || EMPLOYMENT_TYPE_STYLES["Full Time"]}
          `}
        >
          {drive.employment_type}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-7">
        <div className="flex items-center gap-2 text-gray-300">
          <MapPin size={18} />
          {drive.location || "Not specified"}
        </div>

        <div className="flex items-center gap-2 text-gray-300">
          <IndianRupee size={18} />
          {drive.salary || "Not disclosed"}
        </div>

        <div className="flex items-center gap-2 text-gray-300">
          <Calendar size={18} />
          {formatDeadline(drive.deadline)}
        </div>

        <div className="flex items-center gap-2">
          <Clock size={18} className="text-gray-400" />
          <DaysLeftBadge deadline={drive.deadline} />
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => onViewDetails(drive)}
          className="
            flex-1 py-3 rounded-xl
            border border-cyan-400 text-cyan-400
            hover:bg-cyan-500/10 transition
            flex justify-center items-center gap-2 font-semibold
          "
        >
          View Details
        </button>

        <ApplyButton drive={drive} className="flex-1" />
      </div>
    </div>
  );
}

export default function UpcomingDrives() {
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDrive, setSelectedDrive] = useState(null);

  // Browse More is loaded lazily (only on click) and only ever holds
  // drives NOT already shown in the Top 10 above, so the two lists
  // never duplicate.
  const [browseMoreOpen, setBrowseMoreOpen] = useState(false);
  const [browseMoreLoading, setBrowseMoreLoading] = useState(false);
  const [browseMoreDrives, setBrowseMoreDrives] = useState(null);

  const email = getCurrentUser()?.email;

  const loadRecommended = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = email
        ? await api.get(`/placement-drives/recommended/${email}`)
        : await api.get("/placement-drives", { params: { limit: 10 } });

      setRecommended(response.data?.data || []);
    } catch (err) {
      console.error("Error fetching placement drives:", err);
      setError(
        err?.response?.data?.detail ||
          "We couldn't load Upcoming Drives. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommended();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBrowseMore = async () => {
    if (browseMoreOpen) {
      setBrowseMoreOpen(false);
      return;
    }

    setBrowseMoreOpen(true);

    if (browseMoreDrives !== null) return; // already loaded once this visit

    try {
      setBrowseMoreLoading(true);
      // Keeps the existing sorting (nearest deadline first) and the
      // existing "exclude expired" behaviour untouched - this is the
      // same endpoint the page always used, unfiltered by relevance.
      const response = await api.get("/placement-drives");
      const recommendedIds = new Set(recommended.map((d) => d.id));
      const rest = (response.data?.data || []).filter((d) => !recommendedIds.has(d.id));
      setBrowseMoreDrives(rest);
    } catch (err) {
      console.error("Error fetching remaining placement drives:", err);
      setBrowseMoreDrives([]);
    } finally {
      setBrowseMoreLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Upcoming Drives</h1>
          <p className="text-gray-400 mt-2">
            Live internships, graduate programs, and fresher openings from
            official company career pages.
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 flex flex-col items-center justify-center gap-4">
          <RefreshCw className="text-cyan-400 animate-spin" size={36} />
          <p className="text-gray-300 text-lg">Loading upcoming drives...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-12 flex flex-col items-center justify-center gap-4">
          <p className="text-red-300 text-lg text-center">{error}</p>
          <button
            onClick={loadRecommended}
            className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 font-medium hover:bg-red-500/20"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && recommended.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 flex flex-col items-center justify-center gap-2">
          <Briefcase className="text-gray-500" size={36} />
          <p className="text-gray-300 text-lg">No active drives right now.</p>
          <p className="text-gray-500 text-sm">Check back soon - this list updates automatically.</p>
        </div>
      )}

      {/* Top 10 Recommended */}
      {!loading && !error && recommended.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="text-cyan-400" size={22} />
            <h2 className="text-xl font-bold text-white">Top 10 Recommended Placement Drives</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-10">
            {recommended.map((drive) => (
              <DriveCard key={drive.id} drive={drive} onViewDetails={setSelectedDrive} />
            ))}
          </div>

          {/* Browse More - collapsed by default so the remaining drives
              don't clutter the page; loaded lazily on first click. */}
          <div className="mb-6">
            <button
              onClick={handleBrowseMore}
              className="
                flex items-center gap-2 mx-auto
                px-6 py-3 rounded-xl
                border border-white/10 bg-white/5
                text-gray-200 font-medium
                hover:bg-white/10 transition
              "
            >
              <ChevronDown
                size={18}
                className={`transition-transform ${browseMoreOpen ? "rotate-180" : ""}`}
              />
              {browseMoreOpen ? "Hide" : "Browse More Placement Drives"}
            </button>
          </div>

          {browseMoreOpen && (
            <div>
              {browseMoreLoading && (
                <div className="flex items-center justify-center gap-3 text-gray-400 py-10">
                  <RefreshCw className="animate-spin" size={20} />
                  Loading more drives...
                </div>
              )}

              {!browseMoreLoading && browseMoreDrives && browseMoreDrives.length === 0 && (
                <p className="text-gray-400 text-center py-6">
                  No additional active drives right now.
                </p>
              )}

              {!browseMoreLoading && browseMoreDrives && browseMoreDrives.length > 0 && (
                <div className="grid lg:grid-cols-2 gap-6">
                  {browseMoreDrives.map((drive) => (
                    <DriveCard key={drive.id} drive={drive} onViewDetails={setSelectedDrive} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      {selectedDrive && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedDrive(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0b0e1a] p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <CompanyLogo src={selectedDrive.company_logo} alt={selectedDrive.company_name} size={56} />
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedDrive.company_name}</h2>
                  <p className="text-gray-400 text-lg">{selectedDrive.role}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDrive(null)}
                className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center flex-shrink-0"
              >
                <X size={18} className="text-white" />
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  EMPLOYMENT_TYPE_STYLES[selectedDrive.employment_type] || EMPLOYMENT_TYPE_STYLES["Full Time"]
                }`}
              >
                {selectedDrive.employment_type}
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/10 bg-white/5 text-gray-300 flex items-center gap-1.5">
                <MapPin size={12} /> {selectedDrive.location || "Not specified"}
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/10 bg-white/5 text-gray-300 flex items-center gap-1.5">
                <IndianRupee size={12} /> {selectedDrive.salary || "Not disclosed"}
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/10 bg-white/5 text-gray-300 flex items-center gap-1.5">
                <Calendar size={12} /> {formatDeadline(selectedDrive.deadline)}
              </span>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-3">Job Description</h3>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-gray-300 leading-7 whitespace-pre-line">
                  {selectedDrive.description || "No description provided by the source."}
                </p>
              </div>
            </div>

            <ApplyButton drive={selectedDrive} className="w-full" />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
