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
                duration-300

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

      {/* Other */}

      <button
        onClick={() => setShowOther(!showOther)}
        className="
          mt-6
          flex
          items-center
          gap-3
          text-violet-400
          hover:text-violet-300
        "
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