import DashboardLayout from "../components/dashboard/DashboardLayout";
import {
  BarChart3,
  TrendingUp,
  Code,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import RadarSkillChart from "../components/dashboard/RadarSkillChart";
import WeakSkillsCard from "../components/dashboard/WeakSkillsCard";
import RecommendedCoursesCard from "../components/dashboard/RecommendedCoursesCard";
import LearningTimeCard from "../components/dashboard/LearningTimeCard";

const skills = [
  { name: "Python", level: 92 },
  { name: "Machine Learning", level: 88 },
  { name: "SQL", level: 72 },
  { name: "React", level: 64 },
  { name: "Git & GitHub", level: 84 },
];


export default function SkillAnalysis() {
  const [skills, setSkills] = useState([]);
  const [analysis, setAnalysis] = useState(null);
const [loading, setLoading] = useState(true);
const [showAll, setShowAll] = useState(false);
const [isEditing, setIsEditing] = useState(false);
const [buttonText, setButtonText] = useState("Edit");
const [isSaving, setIsSaving] = useState(false);
const [hasChanges, setHasChanges] = useState(false);
const [reanalyzing, setReanalyzing] = useState(false);
const [reanalyzeText, setReanalyzeText] = useState("✨ Reanalyze");


const fetchSkills = async () => {
  try {
    // Get logged in user
    const user =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(sessionStorage.getItem("user"));

    if (!user) {
      console.log("User not found");
      return;
    }

    // Fetch dashboard data
    const response = await axios.get(
      `http://127.0.0.1:8000/dashboard/${user.email}`
    );

    const profile = response.data.data;

    const detectedSkills = profile.skills || [];
    const skillLevels = profile.skill_levels || {};

    // Convert to frontend format
    const formattedSkills = detectedSkills.map((skill) => ({
      name: skill,
      level: skillLevels[skill] ?? 50,
    }));

    setSkills(formattedSkills);

    // Fetch AI Skill Analysis
const analysisResponse = await axios.get(
  `http://127.0.0.1:8000/skills/${user.email}`
);

setAnalysis(analysisResponse.data);

  } catch (error) {
    console.error("Error fetching skills:", error);
  } finally {
    setLoading(false);
  }
};
const reanalyzeSkills = async () => {
  try {
    const user =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(sessionStorage.getItem("user"));

    if (!user) return;

    setReanalyzing(true);
    setReanalyzeText("⏳ Reanalyzing...");

    await axios.post(
      `http://127.0.0.1:8000/skills/analyze/${user.email}`
    );

    await fetchSkills();

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

    const user =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(sessionStorage.getItem("user"));

    if (!user) return;

    const skillLevels = {};

    skills.forEach((skill) => {
      skillLevels[skill.name] = skill.level;
    });

    await axios.put(
      `http://127.0.0.1:8000/skills/${user.email}`,
      {
        skill_levels: skillLevels,
      }
    );
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
    fetchSkills();
}, []);

console.log(skills);
console.log(analysis);
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
    analysis?.important_skills
      ?.map((importantSkill) => {
        const matchedSkill = skills.find(
          (skill) =>
            skill.name.toLowerCase() === importantSkill.toLowerCase()
        );

        return matchedSkill
          ? {
              skill: matchedSkill.name,
              score: matchedSkill.level,
            }
          : null;
      })
      .filter(Boolean) || []
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

    </DashboardLayout>
  );
}