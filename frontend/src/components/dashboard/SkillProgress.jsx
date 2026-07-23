import { Code2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardCard from "../common/DashboardCard";

export default function SkillProgress({ profile }) {
  const navigate = useNavigate();

  const prioritySkills = [
    "Python",
    "React",
    "FastAPI",
    "JavaScript",
    "SQL",
    "PostgreSQL",
    "Node.js",
    "Docker",
    "Git",
    "GitHub",
    "Java",
    "C++",
    "C",
  ];

  const allSkills = Array.isArray(profile?.skills) ? profile.skills : [];

  let skills = prioritySkills.filter((skill) =>
    allSkills.includes(skill)
  );

  if (skills.length < 4) {
    const remaining = allSkills.filter(
      (skill) => !skills.includes(skill)
    );

    skills = [...skills, ...remaining];
  }

  skills = skills.slice(0, 10);

  return (
    <DashboardCard
      title="Detected Skills"
      subtitle="Skills extracted from your resume"
      icon={<Code2 size={22} />}
    >
      {skills.length === 0 ? (
        <p className="text-gray-400">
          No skills found. Upload a resume.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {skills.map((skill) => (
            <div
              key={skill}
              className="
                flex
                items-center
                justify-center
                rounded-xl
                border
                border-cyan-500/20
                bg-cyan-500/10
                py-3
                px-4
                text-white
                font-medium
              "
            >
              ✓ {skill}
            </div>
          ))}
        </div>
      )}

      <div
        className="
          mt-6
          pt-4
          border-t
          border-white/10
          flex
          justify-end
        "
      >
        <button
          onClick={() => navigate("/skill-analysis")}
          className="
            flex
            items-center
            gap-2
            text-cyan-400
            hover:text-cyan-300
            transition-all
          "
        >
          View All Skills
          <ArrowRight size={16} />
        </button>
      </div>
    </DashboardCard>
  );
}