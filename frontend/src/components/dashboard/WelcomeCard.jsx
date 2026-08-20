import { Target, FileText, Sparkles } from "lucide-react";
import DashboardCard from "../common/DashboardCard";

// All of the extra content below (career match, resume score, AI
// suggestion line) is built entirely from props Dashboard.jsx already
// fetches for the cards further down the page (CareerMatchCard,
// ResumeScoreCard, AISuggestions) - no new API calls, no new Gemini
// calls, and never a fabricated number. Anything not yet available
// (career/resumeAnalysis/aiSuggestions still loading, or genuinely
// empty) is simply left out rather than shown as a fake placeholder
// score.
export default function WelcomeCard({ profile, career, resumeAnalysis, aiSuggestions }) {

  const hour = new Date().getHours();

  let greeting;

  if (hour < 12) {
    greeting = "Good Morning";
  } else if (hour < 17) {
    greeting = "Good Afternoon";
  } else if (hour < 21) {
    greeting = "Good Evening";
  } else {
    greeting = "Good Night";
  }

  const topCareer = career?.recommended_role;
  const matchScore = career?.match_score;
  const resumeScore = resumeAnalysis?.resume_score;

  // Reuses the same Gemini-generated content already shown in the AI
  // Suggestions card below (see AISuggestions.jsx) instead of a second,
  // duplicate call just to fill this line - the brief is explicit that
  // an existing service's output should be reused, not regenerated.
  const topSuggestion = (aiSuggestions || [])[0];

  return (
    <DashboardCard className="py-4">

      <div className="flex items-center justify-between flex-wrap gap-4">

        <div>

          <h1 className="text-2xl font-bold text-white">
            {greeting},

            <span className="text-violet-400">
              {" "}
              {profile?.full_name || "User"} 👋
            </span>

          </h1>

          <p className="text-gray-400 mt-1">
            {profile
              ? `${profile.degree} • ${profile.college}`
              : "Loading profile..."}
          </p>

        </div>

        <div className="hidden md:flex flex-col items-end">

          <span className="text-white font-semibold">
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>

          <span className="text-gray-400 text-sm">
            CGPA : {profile?.cgpa || "--"}
          </span>

        </div>

      </div>

      {(topCareer || resumeScore != null) && (
        <div className="flex flex-wrap gap-2 mt-4">

          {topCareer && (
            <div
              className="
                flex
                items-center
                gap-1.5
                rounded-full
                bg-violet-500/15
                border
                border-violet-500/30
                px-3
                py-1.5
              "
            >
              <Target
                size={14}
                className="text-violet-400"
              />
              <span className="text-xs text-gray-300">
                Top Match:
              </span>
              <span className="text-xs font-semibold text-violet-400">
                {topCareer}
                {typeof matchScore === "number" ? ` · ${matchScore}%` : ""}
              </span>
            </div>
          )}

          {resumeScore != null && (
            <div
              className="
                flex
                items-center
                gap-1.5
                rounded-full
                bg-cyan-500/15
                border
                border-cyan-500/30
                px-3
                py-1.5
              "
            >
              <FileText
                size={14}
                className="text-cyan-400"
              />
              <span className="text-xs text-gray-300">
                Resume Score:
              </span>
              <span className="text-xs font-semibold text-cyan-400">
                {resumeScore}%
              </span>
            </div>
          )}

        </div>
      )}

      <div
        className="
          flex
          items-start
          gap-2
          mt-4
          pt-4
          border-t
          border-white/10
        "
      >
        <Sparkles
          size={16}
          className="text-violet-400 flex-shrink-0 mt-0.5"
        />

        <p className="text-sm text-gray-400">
          {topSuggestion
            ? (
              <>
                <span className="text-gray-300 font-medium">
                  {topSuggestion.title ? `${topSuggestion.title}: ` : ""}
                </span>
                {topSuggestion.description}
              </>
            )
            : "Upload your resume to get personalized suggestions."}
        </p>
      </div>

    </DashboardCard>
  );
}
