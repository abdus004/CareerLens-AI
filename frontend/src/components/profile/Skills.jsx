import { useState } from "react";
import InputField from "../InputField";
import { useProfile } from "../../context/ProfileContext";

export default function Skills({ onNext, onBack }) {

  const skillCategories = {
    "Programming Languages": [
      "Python",
      "Java",
      "C",
      "C++",
      "JavaScript",
    ],

    Frameworks: [
      "React",
      "Node.js",
      "Express",
      "Flask",
      "Django",
    ],

    Databases: [
      "MongoDB",
      "MySQL",
      "PostgreSQL",
      "SQLite",
    ],

    Tools: [
      "Git",
      "GitHub",
      "Docker",
      "VS Code",
      "Postman",
    ],

    "Soft Skills": [
      "Problem Solving",
      "Communication",
      "Leadership",
      "Teamwork",
    ],
  };

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showOther, setShowOther] = useState(false);
  const [otherSkill, setOtherSkill] = useState("");
  const [error, setError] = useState("");
  const { updateProfile } = useProfile();
  const toggleSkill = (skill) => {

    if (selectedSkills.includes(skill)) {

      setSelectedSkills(
        selectedSkills.filter((s) => s !== skill)
      );

    } else {

      setSelectedSkills([
        ...selectedSkills,
        skill,
      ]);

    }

    setError("");

  };

  const handleNext = () => {

  if (
    selectedSkills.length === 0 &&
    otherSkill.trim() === ""
  ) {
    setError("Please select at least one skill.");
    return;
  }

  const skills = [...selectedSkills];

  if (otherSkill.trim()) {
    skills.push(otherSkill.trim());
  }

  updateProfile({
    skills,
  });

  setError("");

  onNext();
};
  return (

    <div>

      {Object.entries(skillCategories).map(
        ([category, skills]) => (

          <div
            key={category}
            className="mb-10"
          >

            <h3 className="text-white text-xl font-bold mb-5">

              {category}

            </h3>

            <div className="grid md:grid-cols-3 gap-4">

              {skills.map((skill) => (

                <button
                  key={skill}
                  type="button"
                  onClick={() =>
                    toggleSkill(skill)
                  }
                  className={`
                    py-3
                    rounded-2xl
                    border
                    transition-all
                    duration-300

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

          </div>

        )
      )}      {/* Add Other Skill */}

      <button
        type="button"
        onClick={() => setShowOther(!showOther)}
        className="
          text-violet-400
          font-semibold
          hover:text-violet-300
          transition
          mt-2
        "
      >
        + Add Other Skill
      </button>

      {showOther && (

        <div className="mt-6">

          <InputField
            label="Other Skill (Optional)"
            type="text"
            placeholder="Example: TensorFlow"
            value={otherSkill}
            onChange={(e) => {
              setOtherSkill(e.target.value);
              setError("");
            }}
          />

        </div>

      )}

      {/* Error */}

      {error && (

        <div
          className="
            mt-8
            rounded-2xl
            border
            border-red-500/30
            bg-red-500/10
            px-5
            py-4
            text-red-300
          "
        >

          {error}

        </div>

      )}

      {/* Buttons */}

      <div className="flex justify-between mt-12">

        <button
          onClick={onBack}
          className="
            px-8
            py-3
            rounded-2xl
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
          onClick={handleNext}
          className="
            px-10
            py-3
            rounded-2xl
            bg-gradient-to-r
            from-violet-600
            via-fuchsia-600
            to-cyan-500
            text-white
            font-semibold
            hover:scale-[1.02]
            transition
          "
        >
          Continue →
        </button>

      </div>

    </div>

  );
}
