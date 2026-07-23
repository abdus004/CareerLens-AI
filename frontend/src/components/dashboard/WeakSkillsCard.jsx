import { TriangleAlert } from "lucide-react";

const WeakSkillsCard = ({ weakSkills = [] }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full">
      <h2 className="text-xl font-semibold text-white mb-6">
        Weak Skills
      </h2>

      <div className="space-y-3">
        {weakSkills.length > 0 ? (
          weakSkills.map((skill, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-all duration-300 hover:bg-white/10"
            >
              <TriangleAlert className="w-5 h-5 text-yellow-400 flex-shrink-0" />

              <span className="text-gray-200 font-medium">
                {typeof skill === "string" ? skill : skill.skill}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm">
            No weak skills identified.
          </p>
        )}
      </div>
    </div>
  );
};

export default WeakSkillsCard;