import { useState } from "react";
import InputField from "../InputField";
import { useProfile } from "../../context/ProfileContext";

export default function BasicInfo({ onNext, onBack }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const { updateProfile } = useProfile();
  const storedUser =
  JSON.parse(localStorage.getItem("user")) ||
  JSON.parse(sessionStorage.getItem("user"));

const handleNext = () => {

  if (!name.trim()) {
    setError("Please enter your full name.");
    return;
  }

  if (!age.trim()) {
    setError("Please enter your age.");
    return;
  }

  if (!gender) {
    setError("Please select your gender.");
    return;
  }

  updateProfile({
  full_name: name.trim(),
  email: storedUser?.email,
  age,
  gender,
  phone,
  linkedin,
  github,
});;

  onNext();

};

  return (
    <div>

      {/* Two Column Form */}

      <div className="grid md:grid-cols-2 gap-6">

        <InputField
  label="Full Name *"
  type="text"
  placeholder="Enter your full name"
  value={name}
  error={error}
  onChange={(e) => {
    setName(e.target.value);
    setError("");
  }}
/>

        <InputField
  label="Age *"
  type="number"
  placeholder="Enter your age"
  value={age}
  error={error}
  onChange={(e) => {
    setAge(e.target.value);
    setError("");
  }}
/>

      </div>

      {/* Gender */}

      <div className="mt-8">

        <h3 className="text-white font-semibold mb-4">
          Gender *
        </h3>

        <div className="grid grid-cols-3 gap-4">

          {["Male", "Female", "Other"].map((item) => (

            <button
              key={item}
              type="button"
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

      </div>

      {/* Second Row */}

      <div className="grid md:grid-cols-2 gap-6 mt-8">

        <InputField
  label="Phone Number (Optional)"
  type="tel"
  placeholder="Enter phone number"
  value={phone}
  onChange={(e) => {
    setPhone(e.target.value);
    setError("");
  }}
/>

        <InputField
  label="LinkedIn Profile (Optional)"
  type="url"
  placeholder="https://linkedin.com/in/..."
  value={linkedin}
  onChange={(e) => {
    setLinkedin(e.target.value);
    setError("");
  }}
/>

      </div>

      {/* Third Row */}

      <div className="grid md:grid-cols-2 gap-6 mt-6">

        <InputField
  label="GitHub Profile (Optional)"
  type="url"
  placeholder="https://github.com/username"
  value={github}
  onChange={(e) => {
    setGithub(e.target.value);
    setError("");
  }}
/>

      </div>

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
      flex
      items-center
      gap-3
    "
  >
    <span className="text-lg">⚠️</span>

    <span>{error}</span>

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