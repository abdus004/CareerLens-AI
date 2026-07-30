import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Calendar,
  MapPin,
  ArrowRight,
} from "lucide-react";
import api from "../../services/api";

// Derives a short status label from the real deadline instead of a
// fabricated one - "Closing Soon" only shows when it's actually true.
function statusFor(deadline) {
  if (!deadline) return "Open";

  const daysLeft = Math.round(
    (new Date(deadline).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 7) return "Closing Soon";
  return "Open";
}

function formatDate(deadline) {
  if (!deadline) return "Rolling";

  return new Date(deadline).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function UpcomingDrives() {
  const navigate = useNavigate();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadTopDrives = async () => {
      try {
        const response = await api.get("/placement-drives", {
          params: { limit: 3 },
        });

        if (!cancelled) {
          setDrives(response.data?.data || []);
        }
      } catch (err) {
        console.error("Error fetching upcoming drives:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadTopDrives();

    return () => {
      cancelled = true;
    };
  }, []);

  const goToDrives = () => navigate("/placement-drives");

  return (
    <div
      onClick={goToDrives}
      className="bg-[#161825] rounded-2xl border border-white/10 p-6 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Upcoming Drives
          </h2>
          <p className="text-gray-400 text-sm">
            Latest placement opportunities
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            goToDrives();
          }}
          className="text-cyan-400 text-sm hover:text-cyan-300 transition"
        >
          View All
        </button>
      </div>

      {/* Drive List */}
      <div className="space-y-4">
        {loading && (
          <p className="text-gray-500 text-sm py-2">Loading opportunities...</p>
        )}

        {!loading && drives.length === 0 && (
          <p className="text-gray-500 text-sm py-2">
            No active drives right now - check back soon.
          </p>
        )}

        {!loading &&
          drives.map((drive) => (
            <div
              key={drive.id}
              className="bg-[#1E2235] border border-white/10 rounded-xl p-5 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300"
            >
              <div className="flex justify-between">
                <div className="flex-1">
                  {/* Company */}
                  <div className="flex items-center gap-2">
                    <Building2
                      size={18}
                      className="text-cyan-400"
                    />

                    <h3 className="text-white font-semibold text-lg">
                      {drive.company_name}
                    </h3>

                    <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">
                      {statusFor(drive.deadline)}
                    </span>
                  </div>

                  {/* Role */}
                  <p className="text-gray-400 mt-2">
                    {drive.role}
                  </p>

                  {/* Footer */}
                  <div className="flex gap-5 mt-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={15} />
                      {formatDate(drive.deadline)}
                    </div>

                    <div className="flex items-center gap-1">
                      <MapPin size={15} />
                      {drive.location || "Not specified"}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToDrives();
                  }}
                  className="text-cyan-400 hover:text-cyan-300 self-start transition"
                >
                  <ArrowRight size={22} />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}