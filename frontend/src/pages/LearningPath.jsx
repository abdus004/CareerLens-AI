import DashboardLayout from "../components/dashboard/DashboardLayout";
import { Route, PlayCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../utils/session";
import api from "../services/api";
import LearningDetailsModal from "../components/learning-path/LearningDetailsModal";

export default function LearningPath() {
  const [roadmap, setRoadmap] = useState([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSkill, setActiveSkill] = useState(null);

  const email = getCurrentUser()?.email;

  useEffect(() => {
    const fetchLearningPath = async () => {
      if (!email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/learning-path/${email}`);
        setRole(response.data.role);
        setRoadmap(Array.isArray(response.data.learning_path) ? response.data.learning_path : []);
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            "We couldn't load your Learning Path. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLearningPath();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold text-white mb-2">{role || "Your Learning Path"}</h1>
      <p className="text-gray-400 mb-10">Personalized Learning Path</p>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 mb-8">
        <div className="flex items-center gap-3 mb-8">
          <Route size={30} className="text-cyan-400" />
          <h2 className="text-2xl font-bold text-white">Learning Path</h2>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-gray-400 py-10">
            <RefreshCw className="animate-spin" size={20} />
            Loading your learning path...
          </div>
        )}

        {!loading && error && <p className="text-red-400 text-sm py-4">{error}</p>}

        {!loading && !error && roadmap.length === 0 && (
          <p className="text-gray-400 text-sm py-4">
            We couldn't find a learning path yet. Complete Career Intelligence first.
          </p>
        )}

        {/* Vertical list - one horizontal row per topic. No completion
            percentage or "Completed" label shown here by design; that
            detail lives inside the topic's own Start Learning view. */}
        {!loading && !error && roadmap.length > 0 && (
          <div className="space-y-4">
            {roadmap.map((step, index) => (
              <div
                key={index}
                className="
                  rounded-2xl border border-white/10 bg-[#0B1120]
                  p-6
                  flex flex-col sm:flex-row sm:items-center sm:justify-between
                  gap-4
                  transition-all duration-300
                  hover:border-cyan-400/40
                "
              >
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-white">{step.skill}</h3>

                  <p className="text-sm text-gray-400 mt-1">
                    <span className="text-white font-medium">{step.level}</span>
                    {step.duration ? ` • ${step.duration}` : ""}
                  </p>

                  {step.short_description && (
                    <p className="text-gray-400 text-sm mt-2 max-w-2xl">
                      {step.short_description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setActiveSkill(step)}
                  className="
                    flex-shrink-0
                    px-5 py-2.5 rounded-xl
                    bg-gradient-to-r from-violet-600 to-cyan-500
                    text-white font-semibold
                    hover:opacity-90 transition
                    flex items-center justify-center gap-2
                    self-start sm:self-center
                  "
                >
                  <PlayCircle size={18} />
                  Start Learning
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeSkill && (
        <LearningDetailsModal
          email={email}
          skill={activeSkill}
          onClose={() => setActiveSkill(null)}
        />
      )}
    </DashboardLayout>
  );
}
