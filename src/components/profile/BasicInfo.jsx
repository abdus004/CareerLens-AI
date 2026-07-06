import { useState } from "react";
import InputField from "../InputField";
import { FcNext } from "react-icons/fc";

export default function BasicInfo({ onNext, onBack }) {
  const [gender, setGender] = useState("");

  return (
    <div>

      {/* Full Name */}

      <InputField
        label="Full Name"
        type="text"
        placeholder="Enter your full name"
      />

      {/* Age */}

      <InputField
        label="Age"
        type="number"
        placeholder="Enter your age"
      />

      {/* Phone */}

      <InputField
        label="Phone Number (Optional)"
        type="tel"
        placeholder="Enter your phone number"
      />

      {/* Gender */}

      <h3 className="text-white font-semibold mt-6 mb-4">
        Gender
      </h3>

      <div className="grid grid-cols-3 gap-4">

        {["Male", "Female", "Other"].map((item) => (

          <button
            key={item}
            onClick={() => setGender(item)}
            className={`
              py-4
              rounded-2xl
              border
              transition-all
              duration-300
              ${
                gender === item
                  ? "border-violet-500 bg-violet-500/20 text-white"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-violet-400"
              }
            `}
          >
            {item}
          </button>

        ))}

      </div>

      {/* Buttons */}

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