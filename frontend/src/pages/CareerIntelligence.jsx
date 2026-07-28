import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import api from "../services/api";
import IndustryDemandChart from "../components/dashboard/IndustryDemandChart";
import { getCurrentUser } from "../utils/session";

import {
  Brain,
  TrendingUp,
  Award,
  Target,
  RefreshCw,
} from "lucide-react";

export default function CareerIntelligence() {

  const [career, setCareer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);

  // Calls Gemini (via the backend) to generate a brand new Career
  // Intelligence analysis and save it, then updates the page with the result.
  const generateCareerAnalysis = useCallback(async (email) => {
    const response = await api.post(`/career/analyze/${email}`);
    setCareer(response.data);
  }, []);

  // Loads existing analysis if it exists. If none exists yet (404), this
  // automatically generates one for the first time instead of leaving the
  // page blank. Any other failure surfaces as a visible error with a retry
  // option, instead of failing silently.
  const loadCareer = useCallback(async () => {
    const storedUser = getCurrentUser();

    if (!storedUser?.email) {
      setError("You need to be logged in to view Career Intelligence.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/career/${storedUser.email}`);
      setCareer(response.data);
    } catch (err) {
      const status = err?.response?.status;

      if (status === 404) {
        // No analysis exists yet for this user - generate one now,
        // this is the very first time, not a manual "Regenerate".
        try {
          await generateCareerAnalysis(storedUser.email);
        } catch (genErr) {
          console.error(genErr);
          setError(
            genErr?.response?.data?.detail ||
              "We couldn't generate your Career Intelligence analysis. Please try again."
          );
        }
      } else {
        console.error(err);
        setError(
          err?.response?.data?.detail ||
            "We couldn't load your Career Intelligence analysis. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [generateCareerAnalysis]);

  useEffect(() => {
    loadCareer();
  }, [loadCareer]);

  // Explicit, user-requested regeneration. Does NOT run automatically -
  // only runs when the button below is clicked.
  const handleRegenerate = async () => {
    const storedUser = getCurrentUser();
    if (!storedUser?.email) return;

    setRegenerating(true);
    setError(null);

    try {
      await generateCareerAnalysis(storedUser.email);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Regeneration failed. Please try again."
      );
    } finally {
      setRegenerating(false);
    }
  };

  return (

    <DashboardLayout>

      {/* Page Header */}

      <div className="mb-8 flex items-start justify-between gap-4">

        <div>
          <h1 className="text-4xl font-bold text-white">
            Career Intelligence
          </h1>

          <p className="text-gray-400 mt-2">
            Discover the best career paths based on your profile, skills and resume.
          </p>
        </div>

        {!loading && career && !error && (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="
              flex items-center gap-2
              px-5 py-3
              rounded-xl
              bg-violet-500/10
              border border-violet-500/30
              text-violet-300
              font-medium
              hover:bg-violet-500/20
              disabled:opacity-50
              disabled:cursor-not-allowed
              whitespace-nowrap
            "
          >
            <RefreshCw
              size={18}
              className={regenerating ? "animate-spin" : ""}
            />
            {regenerating ? "Regenerating..." : "Regenerate"}
          </button>
        )}

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
          <RefreshCw className="text-violet-400 animate-spin" size={36} />
          <p className="text-gray-300 text-lg">
            Generating your Career Intelligence analysis...
          </p>
          <p className="text-gray-500 text-sm">
            This can take a few seconds the first time.
          </p>
        </div>
      )}

      {/* Error state - never leaves the page silently blank */}
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
            onClick={loadCareer}
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

      {/* Loaded content */}
      {!loading && !error && career && (
        <>

          {/* Career Matches */}

          <div
            className="
              rounded-3xl
              border
              border-white/10
              bg-white/5
              p-8
            "
          >

            <div className="flex items-center gap-3 mb-8">

              <Brain
                className="text-violet-400"
                size={30}
              />

              <h2 className="text-2xl font-bold text-white">
                Career Compatibility
              </h2>

            </div>

            <div className="space-y-6">

              {career?.top_roles?.map((role, index) => (

                <div key={index}>

                  <div className="flex justify-between mb-2">

                    <span className="text-white font-medium">
                      {role.role}
                    </span>

                    <span className="text-cyan-400 font-bold">
                      {role.score}%
                    </span>

                  </div>

                  <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">

                    <div
                      className="
                        h-full
                        rounded-full
                        bg-gradient-to-r
                        from-violet-500
                        via-fuchsia-500
                        to-cyan-400
                      "
                      style={{
                        width: `${role.score}%`,
                      }}
                    />

                  </div>

                </div>

              ))}

            </div>

          </div>

          {/* Profile Strengths + Industry Demand */}

          <div className="grid lg:grid-cols-2 gap-6 mt-8">

            {/* Profile Strengths */}

            <div
              className="
                rounded-3xl
                border
                border-white/10
                bg-white/5
                p-7
              "
            >

              <div className="flex items-center gap-3 mb-6">

                <Award
                  className="text-green-400"
                  size={28}
                />

                <h2 className="text-2xl font-bold text-white">
                  Profile Strengths
                </h2>

              </div>

              <div className="flex flex-wrap gap-4">

                {career?.profile_strengths?.map((strength, index) => (

                  <span
                    key={index}
                    className="
                      px-5
                      py-3
                      rounded-xl
                      bg-green-500/10
                      border
                      border-green-500/30
                      text-green-300
                      font-medium
                    "
                  >
                    ✓ {strength}
                  </span>

                ))}

              </div>

            </div>

            {/* Industry Demand */}

            <div
              className="
                rounded-3xl
                border
                border-white/10
                bg-white/5
                p-7
              "
            >

              <div className="flex items-center justify-between mb-6">

                <h2 className="text-2xl font-bold text-white">
                  Industry Demand
                </h2>

                <span
                  className="
                    px-4
                    py-1
                    rounded-full
                    bg-green-500/20
                    text-green-400
                    text-sm
                    font-semibold
                  "
                >
                  +{career?.growth_percentage || 0}% Growth
                </span>

              </div>

              <IndustryDemandChart
                data={career?.industry_graph || []}
                growth={career?.growth_percentage || 0}
              />

            </div>

          </div>

          {/* Career Insights */}

          <div
            className="
              mt-8
              rounded-3xl
              border
              border-white/10
              bg-white/5
              p-8
            "
          >

            <div className="flex items-center gap-3 mb-8">

              <TrendingUp
                className="text-cyan-400"
                size={30}
              />

              <h2 className="text-2xl font-bold text-white">
                Career Insights
              </h2>

            </div>

            <div className="grid md:grid-cols-4 gap-6">

              {/* Top Career */}

              <div className="rounded-2xl bg-white/5 p-6 border border-white/10">

                <p className="text-gray-400 text-sm">
                  Top Career
                </p>

                <h3 className="text-xl text-white font-bold mt-2">
                  {career?.recommended_role || "-"}
                </h3>

              </div>

              {/* Average Salary */}

              <div className="rounded-2xl bg-white/5 p-6 border border-white/10">

                <p className="text-gray-400 text-sm">
                  Average Salary
                </p>

                <h3 className="text-xl text-green-400 font-bold mt-2">
                  {career?.industry_insights?.average_salary || "-"}
                </h3>

              </div>

              {/* Job Opportunities */}

              <div className="rounded-2xl bg-white/5 p-6 border border-white/10">

                <p className="text-gray-400 text-sm">
                  Job Opportunities
                </p>

                <h3 className="text-xl text-cyan-400 font-bold mt-2">
                  {career?.job_opportunities || "-"}
                </h3>

              </div>

              {/* Future Growth */}

              <div className="rounded-2xl bg-white/5 p-6 border border-white/10">

                <p className="text-gray-400 text-sm">
                  Future Growth
                </p>

                <h3 className="text-xl text-violet-400 font-bold mt-2">
                  {career?.growth_percentage || 0}%
                </h3>

              </div>

            </div>

          </div>

          {/* Why AI Chose This Career */}

          <div
            className="
              mt-8
              rounded-3xl
              border
              border-white/10
              bg-white/5
              p-8
            "
          >

            <div className="flex items-center gap-3 mb-6">

              <Target
                className="text-cyan-400"
                size={28}
              />

              <h2 className="text-2xl font-bold text-white">

                Why AI Chose This Career

              </h2>

            </div>

            <p
              className="
                text-gray-300
                leading-8
                whitespace-pre-line
              "
            >

              {career?.reason || "Loading AI analysis..."}

            </p>

          </div>

        </>
      )}

    </DashboardLayout>
  );
}