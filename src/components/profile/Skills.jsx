import { useState } from "react";
import InputField from "../InputField";

export default function Skills({ onNext, onBack }) {

  const defaultSkills = [
    "Python",
    "Java",
    "C",
    "C++",
    "JavaScript",
    "React",
    "Node.js",
    "SQL",
    "MongoDB",
    "HTML",
    "CSS",
    "Git",
    "GitHub",
    "Machine Learning",
    "Deep Learning",
    "Data Structures",
    "Problem Solving",
    "Communication"
  ];

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillLevels, setSkillLevels] = useState({});
  const [showOther, setShowOther] = useState(false);

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const setLevel = (skill, level) => {
    setSkillLevels({
      ...skillLevels,
      [skill]: level,
    });
  };

  return (
    <div>

      <h3 className="text-white text-xl font-semibold mb-6">
        Select Your Skills
      </h3>

      <div className="grid md:grid-cols-2 gap-4">

        {defaultSkills.map((skill) => (

          <button
            key={skill}
            onClick={() => toggleSkill(skill)}
            className={`
              rounded-xl
              border
              py-3
              transition-all

              ${
                selectedSkills.includes(skill)
                  ? "border-violet-500 bg-violet-500/20 text-white"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-violet-400"
              }
            `}
          >
            {skill}
          </button>

        ))}

      </div>

      {/* Selected Skills */}

      {selectedSkills.length > 0 && (

        <div className="mt-10">

          <h3 className="text-white text-lg font-semibold mb-5">
            Skill Level
          </h3>

          {selectedSkills.map((skill) => (

            <div key={skill} className="mb-6">

              <div className="flex justify-between mb-2">

                <span className="text-white">

                  {skill}

                </span>

                <span className="text-violet-400">

                  {skillLevels[skill] || 1}/5

                </span>

              </div>

              <input
                type="range"
                min="1"
                max="5"
                value={skillLevels[skill] || 1}
                onChange={(e) =>
                  setLevel(skill, e.target.value)
                }
                className="w-full accent-violet-500"
              />

            </div>

          ))}

        </div>

      )}

      {/* Other Skill */}

      <button
        onClick={() => setShowOther(!showOther)}
        className="text-violet-400 mt-6"
      >
        + Add Other Skill
      </button>

      {showOther && (

        <div className="mt-4">

          <InputField
            label="Other Skill"
            type="text"
            placeholder="Example: Flutter"
          />

        </div>

      )}

      {/* Navigation */}

      <div className="flex justify-between mt-10">

        <button
          onClick={onBack}
          className="
            px-8
            py-3
            rounded-xl
            border
            border-white/10
            bg-white/5
            text-white
            hover:bg-white/10
            transition
          "
        >
          ← Back
        </button>

        <button
          onClick={onNext}
          className="
            px-8
            py-3
            rounded-xl
            bg-gradient-to-r
            from-violet-600
            to-fuchsia-600
            text-white
            font-semibold
            hover:scale-105
            transition
          "
        >
          Next →
        </button>

      </div>

    </div>
  );
}