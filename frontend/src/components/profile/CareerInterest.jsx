import { useState } from "react";
import {
  Brain,
  Database,
  Server,
  Monitor,
  Layers,
  Cloud,
  Shield,
  Settings,
  Plus,
} from "lucide-react";
import InputField from "../InputField";

export default function CareerInterest({ onNext, onBack }) {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [showOther, setShowOther] = useState(false);
  const [otherCareer, setOtherCareer] = useState("");
  const [error, setError] = useState("");

  const roles = [
    { name: "AI Engineer", icon: Brain },
    { name: "Data Scientist", icon: Database },
    { name: "Backend Developer", icon: Server },
    { name: "Frontend Developer", icon: Monitor },
    { name: "Full Stack Developer", icon: Layers },
    { name: "Cloud Engineer", icon: Cloud },
    { name: "Cyber Security", icon: Shield },
    { name: "DevOps Engineer", icon: Settings },
  ];

  const toggleRole = (role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }

    setError("");
  };

  const handleNext = () => {
    if (
      selectedRoles.length === 0 &&
      otherCareer.trim() === ""
    ) {
      setError("Please select at least one career interest.");
      return;
    }

    setError("");
    onNext();
  };

  return (
    <div>

      <h3 className="text-white text-xl font-semibold mb-6">
        Select your career interests
      </h3>

      <div className="grid md:grid-cols-2 gap-5">

        {roles.map((role) => {

          const Icon = role.icon;

          return (

            <button
              type="button"
              key={role.name}
              onClick={() => toggleRole(role.name)}
              className={`
                p-5
                rounded-2xl
                border
                flex
                items-center
                gap-4
                transition-all

                ${
                  selectedRoles.includes(role.name)
                    ? "border-violet-500 bg-violet-500/15 shadow-[0_0_25px_rgba(139,92,246,.35)]"
                    : "border-white/10 bg-white/5 hover:border-violet-400"
                }
              `}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center">
                <Icon size={24} className="text-white" />
              </div>

              <span className="text-white font-medium">
                {role.name}
              </span>

            </button>

          );

        })}

      </div>

      <button
        type="button"
        onClick={() => setShowOther(!showOther)}
        className="mt-6 flex items-center gap-3 text-violet-400 hover:text-violet-300"
      >
        <Plus size={20} />
        Add Other Career
      </button>

      {showOther && (

        <div className="mt-4">

          <InputField
            label="Other Career"
            type="text"
            placeholder="Example: Blockchain Developer"
            value={otherCareer}
            onChange={(e) => {
              setOtherCareer(e.target.value);
              setError("");
            }}
          />

        </div>

      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

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
    transition-all
    duration-300
    shadow-[0_0_30px_rgba(139,92,246,.35)]
  "
>
  Continue →
</button>

      </div>

    </div>
  );
}