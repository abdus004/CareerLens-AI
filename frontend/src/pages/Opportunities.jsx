import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import api from "../services/api";
import { getCurrentUser } from "../utils/session";
import { getErrorMessage } from "../utils/apiError";
import {
  Building2,
  MapPin,
  IndianRupee,
  Briefcase,
  ExternalLink,
  Eye,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

// Reads the "Please complete Skill Analysis / Career Intelligence
// first" dependency errors the backend returns (see
// backend/app/routes/jobs.py:_load_user_context) and turns them into
// a specific, actionable state instead of a generic error message.
//
// Goes through getErrorMessage() (always a string) rather than the
// raw detail field directly - a 422 validation error's detail is an
// ARRAY of {type, loc, msg} objects, and calling .toLowerCase() on
// that directly would throw, not just render badly.
function detectMissingDependency(err) {
  const lower = getErrorMessage(err, "").toLowerCase();

  if (lower.includes("skill analysis")) return "skills";
  if (lower.includes("career intelligence")) return "career";
  return null;
}

export default function CareerOpportunities() {
  const navigate = useNavigate();

  // Top 3 recommendations (default view) OR filtered search results -
  // whichever is currently on screen. Both are the same card shape.
  const [jobs, setJobs] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [totalMatching, setTotalMatching] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [missingDependency, setMissingDependency] = useState(null);

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeText, setReanalyzeText] = useState("✨ Reanalyze");

  // Filters
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxExperience, setMaxExperience] = useState("");
  const [filtering, setFiltering] = useState(false);

  // Loads a job's full details (job description, required/matched/
  // missing skills, and the Gemini-written explanation - cached after
  // the first call for this job + this analysis state).
  const openDetails = useCallback(async (jobId) => {
    setSelectedJobId(jobId);
    setJobDetails(null);
    setDetailsError(null);

    const user = getCurrentUser();
    if (!user?.email) return;

    try {
      setDetailsLoading(true);
      const response = await api.get(`/jobs/${user.email}/${jobId}`);
      setJobDetails(response.data);
    } catch (err) {
      setDetailsError(
        getErrorMessage(err, "We couldn't load this job's details. Please try again.")
      );
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  // Loads the saved Top 3 recommendations. If none exist yet (404),
  // generates them automatically the first time only - same pattern
  // already used by Career Intelligence and Skill Analysis. Any other
  // failure surfaces as a visible, retryable error instead of leaving
  // the page blank.
  const loadRecommendations = useCallback(
    async (attemptedAutoGenerate = false) => {
      const user = getCurrentUser();

      if (!user?.email) {
        setError("You need to be logged in to view Job Recommendations.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/jobs/${user.email}`);
        const recommendations = response.data.recommendations || [];

        setJobs(recommendations);
        setTotalMatching(response.data.total_matching || 0);
        setIsFiltered(false);
        setError(null);
        setMissingDependency(null);

        if (recommendations.length > 0) {
          openDetails(recommendations[0].id);
        }
      } catch (err) {
        const status = err?.response?.status;

        if (status === 404 && !attemptedAutoGenerate) {
          try {
            await api.post(`/jobs/analyze/${user.email}`);
            return loadRecommendations(true);
          } catch (genErr) {
            const dependency = detectMissingDependency(genErr);

            if (dependency) {
              setMissingDependency(dependency);
              setError(null);
            } else {
              setError(
                getErrorMessage(genErr, "We couldn't generate your Job Recommendations. Please try again.")
              );
            }
          }
        } else {
          const dependency = detectMissingDependency(err);

          if (dependency) {
            setMissingDependency(dependency);
            setError(null);
          } else {
            setError(
              getErrorMessage(err, "We couldn't load your Job Recommendations. Please try again.")
            );
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [openDetails]
  );

  useEffect(() => {
    setLoading(true);
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Explicit, user-requested recomputation. Does NOT run automatically -
  // only runs when the "Reanalyze" button is clicked.
  const handleReanalyze = async () => {
    const user = getCurrentUser();
    if (!user?.email) return;

    try {
      setReanalyzing(true);
      setReanalyzeText("⏳ Reanalyzing...");

      await api.post(`/jobs/analyze/${user.email}`);
      await loadRecommendations(true);

      setReanalyzeText("✅ Recommendations Updated");

      setTimeout(() => {
        setReanalyzeText("✨ Reanalyze");
        setReanalyzing(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      setReanalyzeText("❌ Failed");

      setTimeout(() => {
        setReanalyzeText("✨ Reanalyze");
        setReanalyzing(false);
      }, 2000);
    }
  };

  // Filters run entirely against the Job Master database via
  // GET /jobs/{email}/search - no Gemini involved.
  const handleSearch = async () => {
    const user = getCurrentUser();
    if (!user?.email) return;

    const hasFilters = Boolean(search || location || minSalary || maxExperience);

    if (!hasFilters) {
      setIsFiltered(false);
      return loadRecommendations(true);
    }

    try {
      setFiltering(true);
      setError(null);

      const params = {};
      if (search) params.q = search;
      if (location) params.location = location;
      if (minSalary) params.min_salary = minSalary;
      if (maxExperience) params.max_experience = maxExperience;

      const response = await api.get(`/jobs/${user.email}/search`, { params });
      const results = response.data.jobs || [];

      setJobs(results);
      setIsFiltered(true);

      if (results.length > 0) {
        openDetails(results[0].id);
      } else {
        setSelectedJobId(null);
        setJobDetails(null);
      }
    } catch (err) {
      const dependency = detectMissingDependency(err);

      if (dependency) {
        setMissingDependency(dependency);
      } else {
        setError(
          getErrorMessage(err, "We couldn't search jobs. Please try again.")
        );
      }
    } finally {
      setFiltering(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setLocation("");
    setMinSalary("");
    setMaxExperience("");
    setIsFiltered(false);
    loadRecommendations(true);
  };

  const handleApply = (job) => {
    if (job?.apply_url) {
      window.open(job.apply_url, "_blank", "noopener,noreferrer");
    } else {
      alert("The application link for this listing isn't available yet.");
    }
  };

  const selectedJob = jobs.find((job) => job.id === selectedJobId) || null;

  return (
    <DashboardLayout>
      {/* Header */}

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white">Career Opportunities</h1>

          <p className="text-gray-400 mt-2">
            Find internships and jobs that match your profile.
          </p>
        </div>

        {!loading && !error && !missingDependency && (
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className={`
              px-5
              py-2
              rounded-xl
              transition-all
              duration-300
              whitespace-nowrap
              ${
                reanalyzing
                  ? "bg-purple-600 text-white cursor-not-allowed"
                  : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 hover:scale-105"
              }
            `}
          >
            {reanalyzeText}
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
          <RefreshCw className="text-cyan-400 animate-spin" size={36} />
          <p className="text-gray-300 text-lg">Finding your best-matching jobs...</p>
        </div>
      )}

      {/* Missing dependency state - Job Recommendations is not an
          independent AI module, it needs Skill Analysis + Career
          Intelligence to already exist. */}
      {!loading && missingDependency && (
        <div
          className="
            rounded-3xl
            border
            border-amber-500/30
            bg-amber-500/5
            p-12
            flex flex-col items-center justify-center gap-4
            text-center
          "
        >
          <p className="text-amber-300 text-lg">
            {missingDependency === "skills"
              ? "Complete Skill Analysis first so we know what you're good at."
              : "Complete Career Intelligence first so we know which roles to match you against."}
          </p>

          <button
            onClick={() =>
              navigate(
                missingDependency === "skills" ? "/skill-analysis" : "/career-intelligence"
              )
            }
            className="
              px-5 py-3
              rounded-xl
              bg-amber-500/10
              border border-amber-500/30
              text-amber-300
              font-medium
              hover:bg-amber-500/20
            "
          >
            {missingDependency === "skills"
              ? "Go to Skill Analysis"
              : "Go to Career Intelligence"}
          </button>
        </div>
      )}

      {/* Error state */}
      {!loading && !missingDependency && error && (
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
          <p className="text-red-300 text-lg text-center">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              loadRecommendations();
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

      {!loading && !missingDependency && !error && (
        <>
          {/* Filters */}

          <div
            className="
              rounded-3xl
              border
              border-white/10
              bg-white/5
              p-6
              mb-8
            "
          >
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Company or role"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-4
                    py-2.5
                    text-white
                    placeholder:text-gray-500
                    outline-none
                    focus:border-cyan-400
                  "
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-4
                    py-2.5
                    text-white
                    placeholder:text-gray-500
                    outline-none
                    focus:border-cyan-400
                  "
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  Min. Salary (₹/yr)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1000000"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-4
                    py-2.5
                    text-white
                    placeholder:text-gray-500
                    outline-none
                    focus:border-cyan-400
                  "
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  Max Experience (yrs)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2"
                  value={maxExperience}
                  onChange={(e) => setMaxExperience(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-4
                    py-2.5
                    text-white
                    placeholder:text-gray-500
                    outline-none
                    focus:border-cyan-400
                  "
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleSearch}
                disabled={filtering}
                className="
                  flex items-center gap-2
                  px-5 py-2.5
                  rounded-xl
                  bg-cyan-500/20
                  text-cyan-300
                  font-medium
                  hover:bg-cyan-500/30
                  disabled:opacity-50
                  transition
                "
              >
                <Search size={16} />
                {filtering ? "Searching..." : "Search"}
              </button>

              {isFiltered && (
                <button
                  onClick={clearFilters}
                  className="
                    flex items-center gap-2
                    px-5 py-2.5
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    text-gray-300
                    font-medium
                    hover:bg-white/10
                    transition
                  "
                >
                  <X size={16} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {!isFiltered && (
            <div className="mb-5">
              <h2 className="text-xl font-bold text-white">Top Recommended Jobs</h2>
              {jobs.length > 0 && (
                <p className="text-gray-400 text-sm mt-1">
                  Showing {jobs.length} of {totalMatching} matching jobs
                </p>
              )}
            </div>
          )}

          {/* Empty state (filtered search with no results) */}
          {jobs.length === 0 && (
            <div
              className="
                rounded-3xl
                border
                border-white/10
                bg-white/5
                p-12
                text-center
                text-gray-400
              "
            >
              No jobs match your filters right now. Try widening your search.
            </div>
          )}

          {/* Job Cards */}

          {jobs.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className={`
                    rounded-3xl
                    border
                    p-7
                    transition-all
                    duration-300

                    ${
                      selectedJobId === job.id
                        ? "border-cyan-400 bg-cyan-500/10"
                        : "border-white/10 bg-white/5 hover:border-cyan-400/40"
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {job.company_logo_url ? (
                        <img
                          src={job.company_logo_url}
                          alt={job.company_name}
                          className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <Building2 size={30} className="text-cyan-400" />
                      )}

                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {job.company_name}
                        </h2>
                        <p className="text-gray-400">{job.role_title}</p>
                      </div>
                    </div>

                    <div
                      className="
                        px-4
                        py-2
                        rounded-full
                        bg-green-500/10
                        text-green-400
                        font-bold
                        whitespace-nowrap
                      "
                    >
                      {job.match_percentage}% Match
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-7">
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin size={18} />
                      {job.location}
                    </div>

                    <div className="flex items-center gap-2 text-gray-300">
                      <IndianRupee size={18} />
                      {job.salary_display}
                    </div>

                    <div className="flex items-center gap-2 text-gray-300">
                      <Briefcase size={18} />
                      {job.job_type}
                      {job.experience_display ? ` • ${job.experience_display}` : ""}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={() => openDetails(job.id)}
                      className="
                        flex-1
                        py-3
                        rounded-xl
                        bg-violet-600
                        hover:bg-violet-700
                        transition
                        text-white
                        font-semibold
                        flex
                        justify-center
                        items-center
                        gap-2
                      "
                    >
                      <Eye size={18} />
                      View Details
                    </button>

                    <button
                      onClick={() => handleApply(job)}
                      className="
                        flex-1
                        py-3
                        rounded-xl
                        border
                        border-cyan-400
                        text-cyan-400
                        hover:bg-cyan-500/10
                        transition
                        flex
                        justify-center
                        items-center
                        gap-2
                      "
                    >
                      <ExternalLink size={18} />
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Job Details */}

          {selectedJob && (
            <div
              className="
                rounded-3xl
                border
                border-white/10
                bg-white/5
                p-8
                mt-8
              "
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    {selectedJob.company_name}
                  </h2>
                  <p className="text-gray-400 text-lg">{selectedJob.role_title}</p>
                </div>

                <div
                  className="
                    px-5
                    py-3
                    rounded-full
                    bg-green-500/10
                    text-green-400
                    font-bold
                    text-lg
                    whitespace-nowrap
                  "
                >
                  {selectedJob.match_percentage}% Match
                </div>
              </div>

              {detailsLoading && (
                <div className="flex flex-col items-center justify-center gap-4 py-10">
                  <RefreshCw className="text-cyan-400 animate-spin" size={30} />
                  <p className="text-gray-400">Loading job details...</p>
                </div>
              )}

              {!detailsLoading && detailsError && (
                <div
                  className="
                    rounded-2xl
                    border
                    border-red-500/30
                    bg-red-500/5
                    p-8
                    text-center
                  "
                >
                  <p className="text-red-300 mb-4">{detailsError}</p>
                  <button
                    onClick={() => openDetails(selectedJob.id)}
                    className="
                      px-5 py-2.5
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

              {!detailsLoading && !detailsError && jobDetails && (
                <>
                  {/* Job Description */}

                  <div className="mb-10">
                    <h3 className="text-xl font-bold text-white mb-4">
                      Job Description
                    </h3>
                    <p className="text-gray-300 leading-7">
                      {jobDetails.description || "No description provided for this role."}
                    </p>
                  </div>

                  {/* Required Skills */}

                  <div className="mb-10">
                    <h3 className="text-xl font-bold text-white mb-5">
                      Required Skills
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {(jobDetails.required_skills || []).map((skill) => (
                        <span
                          key={skill}
                          className="
                            px-4
                            py-2
                            rounded-full
                            bg-violet-500/10
                            border
                            border-violet-500/30
                            text-violet-300
                          "
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Matched vs Missing Skills */}

                  <div className="grid lg:grid-cols-2 gap-8 mb-10">
                    <div>
                      <h3 className="text-xl font-bold text-cyan-400 mb-5">
                        Skills You Already Have
                      </h3>

                      {jobDetails.matched_skills?.length > 0 ? (
                        <div className="space-y-4">
                          {jobDetails.matched_skills.map((skill) => (
                            <div
                              key={skill}
                              className="
                                rounded-xl
                                border
                                border-green-500/20
                                bg-green-500/10
                                p-4
                                text-green-300
                              "
                            >
                              ✅ {skill}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">
                          No overlapping skills detected yet - see suggested next steps
                          below.
                        </p>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-orange-400 mb-5">
                        Missing Skills
                      </h3>

                      {jobDetails.missing_skills?.length > 0 ? (
                        <div className="space-y-4">
                          {jobDetails.missing_skills.map((skill) => (
                            <div
                              key={skill}
                              className="
                                rounded-xl
                                border
                                border-orange-500/20
                                bg-orange-500/10
                                p-4
                                text-orange-300
                              "
                            >
                              📈 {skill}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">
                          You already cover every required skill for this role. 🎉
                        </p>
                      )}

                      {jobDetails.explanation?.missing_skill_explanation && (
                        <p className="text-gray-400 mt-4 leading-7">
                          {jobDetails.explanation.missing_skill_explanation}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Why This Job Matches You */}

                  <div className="mb-10">
                    <h3 className="text-xl font-bold text-white mb-5">
                      Why This Job Matches You
                    </h3>
                    <div
                      className="
                        rounded-2xl
                        border
                        border-white/10
                        bg-white/5
                        p-6
                      "
                    >
                      <p className="text-gray-300 leading-8">
                        {jobDetails.explanation?.why_this_job_matches ||
                          "Generating your personalized explanation..."}
                      </p>
                    </div>
                  </div>

                  {/* Suggested Next Steps */}

                  <div className="mb-10">
                    <h3 className="text-xl font-bold text-white mb-5">
                      Suggested Next Steps
                    </h3>

                    <div className="space-y-4">
                      {(jobDetails.explanation?.suggested_next_steps || []).map(
                        (step, index) => (
                          <div
                            key={index}
                            className="
                              flex
                              gap-4
                              items-center
                              rounded-2xl
                              border
                              border-white/10
                              bg-white/5
                              p-4
                            "
                          >
                            <div
                              className="
                                w-10
                                h-10
                                rounded-full
                                bg-gradient-to-r
                                from-violet-500
                                to-cyan-500
                                flex
                                items-center
                                justify-center
                                text-white
                                font-bold
                                flex-shrink-0
                              "
                            >
                              {index + 1}
                            </div>
                            <span className="text-gray-300">{step}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Apply */}

                  <div
                    className="
                      rounded-3xl
                      border
                      border-cyan-500/30
                      bg-gradient-to-br
                      from-cyan-500/10
                      to-violet-500/10
                      p-8
                      flex
                      flex-col
                      md:flex-row
                      items-center
                      justify-between
                      gap-6
                    "
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-white">Ready to Apply?</h2>
                      <p className="text-gray-300 mt-2 leading-7">
                        Once you feel ready, apply directly through the official
                        company careers page.
                      </p>
                    </div>

                    <button
                      onClick={() => handleApply(jobDetails)}
                      className="
                        px-8
                        py-4
                        rounded-2xl
                        bg-gradient-to-r
                        from-violet-600
                        to-cyan-500
                        text-white
                        font-bold
                        hover:scale-[1.02]
                        transition
                        whitespace-nowrap
                      "
                    >
                      Apply on Official Website
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}