import DashboardLayout from "../components/dashboard/DashboardLayout";
import {
  BarChart3,
  TrendingUp,
  Code,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "../services/api";
import RadarSkillChart from "../components/dashboard/RadarSkillChart";
import WeakSkillsCard from "../components/dashboard/WeakSkillsCard";
import RecommendedCoursesCard from "../components/dashboard/RecommendedCoursesCard";
import LearningTimeCard from "../components/dashboard/LearningTimeCard";
import { getCurrentUser } from "../utils/session";
import { getErrorMessage } from "../utils/apiError";

// A skill the user has (whether picked in Profile Setup or detected on
// the resume) that Skill Analysis / Gemini hasn't AI-scored yet used to
// be shown flat at 0%, which read as "you have zero ability in this" -
// misleading, since the skill is genuinely on their profile, it just
// hasn't been rated. Instead it gets a small, non-zero starting value
// in the 1-30% range so the bar/card never looks empty or broken.
//
// The value is derived deterministically from the skill's own name
// (not Math.random()) so it stays stable across re-renders and page
// reloads instead of jumping around every time the component mounts -
// the same unscored skill always starts at the same baseline value
// until a real Reanalyze gives it an actual AI-scored level.
function fallbackSkillLevel(skillName) {
  let hash = 0;
  const name = String(skillName || "");
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0; // keep it a 32-bit int
  }
  return 1 + (Math.abs(hash) % 30); // 1-30 inclusive
}

export default function SkillAnalysis() {
  const [skills, setSkills] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [buttonText, setButtonText] = useState("Edit");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeText, setReanalyzeText] = useState("✨ Reanalyze");

  // Loads the dashboard profile + Skill Analysis for the logged in user.
  // If no analysis exists yet (first-time user), this automatically
  // generates one via Gemini instead of showing fake placeholder values.
  // If an analysis already exists, it is loaded as-is - this function
  // never regenerates on its own; only reanalyzeSkills() (the Reanalyze
  // button) does that, on explicit user request.
  const loadSkillData = async (attemptedAutoGenerate = false) => {
    const user = getCurrentUser();

    if (!user?.email) {
      setError("You need to be logged in to view Skill Analysis.");
      setLoading(false);
      return;
    }

    try {
      // Routed through the shared api client (services/api.js) instead
      // of a raw `axios` import hitting a hardcoded
      // http://127.0.0.1:8000 directly - that bypassed the
      // Authorization-header interceptor entirely (no interceptor
      // exists on the raw axios import, only on the shared client),
      // which is exactly why these requests showed up with no
      // `authorization` header at all and 401'd once any backend route
      // in the request chain started requiring one. It also meant this
      // page would only ever work on localhost, same as the Login.jsx
      // bug fixed earlier. `api` already knows the right base URL
      // (VITE_API_URL), so these are relative paths now, not full URLs.
      const dashboardResponse = await api.get(`/dashboard/${user.email}`);

      const profile = dashboardResponse.data.data;
      const detectedSkills = profile.skills || [];
      const skillLevels = profile.skill_levels || {};

      let analysisData = null;

      try {
        const analysisResponse = await api.get(`/skills/${user.email}`);
        analysisData = analysisResponse.data;
      } catch (err) {
        if (err?.response?.status === 404 && !attemptedAutoGenerate) {
          // No Skill Analysis exists yet for this user - generate one
          // now, automatically, the first time only. Reload everything
          // from the database afterward so what's shown always matches
          // what's actually persisted (rather than trusting the POST
          // response shape to exactly match the GET response shape).
          await api.post(`/skills/analyze/${user.email}`);
          return loadSkillData(true);
        }
        throw err;
      }

      // Every skill on the profile - whether hand-picked in Profile
      // Setup or detected on the resume - gets an initial level here.
      // A skill Gemini has actually AI-scored uses that real score;
      // one that hasn't been scored yet gets a small deterministic
      // 1-30% starting value (see fallbackSkillLevel above) instead of
      // a flat, misleading 0%.
      const formattedSkills = detectedSkills.map((skill) => ({
        name: skill,
        level: skillLevels[skill] ?? fallbackSkillLevel(skill),
      }));

      setSkills(formattedSkills);
      setAnalysis(analysisData);
      setError(null);
    } catch (err) {
      console.error("Error fetching skills:", err);
      setError(
        getErrorMessage(err, "We couldn't load your Skill Analysis. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const reanalyzeSkills = async () => {
    const user = getCurrentUser();
    if (!user?.email) return;

    try {
      setReanalyzing(true);
      setReanalyzeText("⏳ Reanalyzing...");

      await api.post(`/skills/analyze/${user.email}`);

      // We already know an analysis exists now (we just created/updated
      // it) - skip the auto-generate-if-missing branch and just reload.
      await loadSkillData(true);

      setReanalyzeText("✅ Analysis Updated");

      setTimeout(() => {
        setReanalyzeText("✨ Reanalyze");
        setReanalyzing(false);
      }, 2000);

    } catch (error) {
      console.error(error);

      setReanalyzeText("❌ Failed");

      setTimeout(() => {
        setReanalyzeText("✨ Reanalyze");
        setReanalyzing(false);
      }, 2000);
    }
  };

  const saveSkill = async () => {
    if (!isEditing) {
      setIsEditing(true);
      setButtonText("Save Changes");
      return;
    }

    try {
      setIsSaving(true);
      setButtonText("Saving...");

      const user = getCurrentUser();
      if (!user?.email) return;

      const skillLevels = {};

      skills.forEach((skill) => {
        skillLevels[skill.name] = skill.level;
      });

      await api.put(`/skills/${user.email}`, {
        skill_levels: skillLevels,
      });

      setHasChanges(false);
      setButtonText("✓ Saved");

      setTimeout(() => {
        setButtonText("Edit");
        setIsEditing(false);
        setIsSaving(false);
      }, 500);

    } catch (error) {
      console.error(error);

      setButtonText("Save Changes");
      setIsSaving(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadSkillData();
  }, []);

  return (
    <DashboardLayout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-white">

          Skill Analysis

        </h1>

        <p className="text-gray-400 mt-2">

          Analyze your technical skills and identify areas
          for improvement.

        </p>

      </div>

      {/* Loading state (initial load, or first-time auto-generation) */}
      {loading && (
        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-12
            flex flex-col items-center justify-center gap-4
          "
        >
          <RefreshCw className="text-cyan-400 animate-spin" size={36} />
          <p className="text-gray-300 text-lg">
            Loading your Skill Analysis...
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div
          className="
            rounded-3xl
            border
            border-red-500/30
            bg-red-500/5
            p-12
            flex flex-col items-center justify-center gap-4
          "
        >
          <p className="text-red-300 text-lg text-center">
            {error}
          </p>
          <button
            onClick={() => {
              setLoading(true);
              loadSkillData();
            }}
            className="
              px-5 py-3
              rounded-xl
              bg-red-500/10
              border border-red-500/30
              text-red-300
              font-medium
              hover:bg-red-500/20
            "
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>

          {/* Skill Analysis Card */}

          <div
            className="
              rounded-3xl
              border
              border-white/10
              bg-white/5
              p-8
            "
          >

            <div className="flex items-center justify-between mb-8">

              <h2 className="text-2xl font-bold text-white">

                Skill Analysis

              </h2>

              <div className="flex items-center gap-3">

                <button
                  onClick={reanalyzeSkills}
                  disabled={reanalyzing}
                  className={`
                    px-5
                    py-2
                    rounded-xl
                    transition-all
                    duration-300
                    ${
                      reanalyzing
                        ? "bg-purple-600 text-white cursor-not-allowed"
                        : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 hover:scale-105"
                    }
                  `}
                >
                  {reanalyzeText}
                </button>

                <button
                  onClick={saveSkill}
                  disabled={isSaving}
                  className={`
                      px-5
                      py-2
                      rounded-xl
                      font-semibold
                      transition-all
                      duration-300

                      ${
                          isEditing
                              ? "bg-cyan-500 text-white"
                              : "bg-cyan-500/20 text-cyan-300"
                      }

                      ${
                          isSaving
                              ? "opacity-70 cursor-not-allowed"
                              : "hover:scale-105"
                      }
                  `}
                >
                  {buttonText}
                </button>

              </div>

            </div>

            <div className="space-y-8">

              {(showAll ? skills : skills.slice(0, 5)).map((skill) => (

                <div
                  key={skill.name}
                  className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:border-cyan-400/40 transition-all duration-300"
                >

                  <div className="flex justify-between items-center mb-3">

                    <h3 className="text-white font-semibold text-lg">
                      {skill.name}
                    </h3>

                    <span className="text-cyan-400 font-bold text-lg">
                      {skill.level}%
                    </span>

                  </div>

                  {isEditing ? (

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={skill.level}
                      onChange={(e) => {
                        const value = Number(e.target.value);

                        setHasChanges(true);

                        setSkills((prev) =>
                            prev.map((s) =>
                                s.name === skill.name
                                    ? { ...s, level: value }
                                    : s
                            )
                        );
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />

                  ) : (

                    <div className="w-full h-4 rounded-full bg-gray-700 overflow-hidden">

                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-500"
                        style={{
                          width: `${skill.level}%`,
                        }}
                      />

                    </div>

                  )}

                </div>

              ))}

            </div>

            <button
              onClick={() => setShowAll(!showAll)}
              className="
                mt-8
                text-cyan-400
                hover:text-cyan-300
                font-semibold
              "
            >
              {showAll ? "▲ Show Less" : "▼ View All Skills"}
            </button>

          </div>

          {/* Skill Intelligence */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

            <RadarSkillChart
              technicalSkills={
                // radar_skills is computed and persisted server-side
                // (routes/skills.py) as the top 5 technical skills
                // required for the user's actual TOP CAREER MATCH,
                // scored against their real, stored skill levels - a
                // skill the user doesn't have yet still appears at 0
                // rather than being dropped. Falls back to the older
                // important-skills-matched-against-owned-skills
                // approach only for analyses generated before this
                // field existed (pre-Reanalyze).
                analysis?.radar_skills?.length
                  ? analysis.radar_skills
                  : analysis?.important_skills
                      ?.map((importantSkill) => {
                        const matchedSkill = skills.find(
                          (skill) =>
                            skill.name.toLowerCase() === importantSkill.toLowerCase()
                        );

                        return {
                          skill: matchedSkill ? matchedSkill.name : importantSkill,
                          score: matchedSkill ? matchedSkill.level : 0,
                        };
                      })
                      .slice(0, 5) || []
              }
            />

            <WeakSkillsCard
              weakSkills={analysis?.weak_skills || []}
            />

          </div>

          {/* Courses */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

            <RecommendedCoursesCard
              courses={analysis?.recommended_courses || []}
            />

            <LearningTimeCard
              time={analysis?.estimated_learning_time}
            />

          </div>

        </>
      )}

    </DashboardLayout>
  );
}