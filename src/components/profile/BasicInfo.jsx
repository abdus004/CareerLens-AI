import { useState } from "react";
import InputField from "../InputField";

export default function BasicInfo({ onNext, onBack }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!age) {
      setError("Please enter your age.");
      return;
    }

    if (Number(age) < 16 || Number(age) > 100) {
      setError("Please enter a valid age.");
      return;
    }

    if (!gender) {
      setError("Please select your gender.");
      return;
    }

    setError("");
    onNext();
  };

  return (
    <div>

      <InputField
        label="Full Name"
        type="text"
        placeholder="Enter your full name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError("");
        }}
      />

      <InputField
        label="Age"
        type="number"
        placeholder="Enter your age"
        value={age}
        onChange={(e) => {
          setAge(e.target.value);
          setError("");
        }}
      />

      <InputField
        label="Phone Number (Optional)"
        type="tel"
        placeholder="Enter your phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <h3 className="text-white font-semibold mt-6 mb-4">
        Gender
      </h3>

      <div className="grid grid-cols-3 gap-4">

        {["Male", "Female", "Other"].map((item) => (

          <button
            type="button"
            key={item}
            onClick={() => {
              setGender(item);
              setError("");
            }}
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

      {error && (
        <div
          className="
            mt-5
            rounded-xl
            border
            border-red-500/30
            bg-red-500/10
            px-4
            py-3
            text-red-300
            text-sm
          "
        >
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