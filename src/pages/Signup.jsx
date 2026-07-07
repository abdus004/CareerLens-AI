import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const clearErrors = () => {
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
  };

  const handleSignup = () => {

  const user = {
    name,
    email,
    password,
  };

  localStorage.setItem(
    "user",
    JSON.stringify(user)
  );

  navigate("/profile-setup");
};

  return (
    <AuthLayout
      title="Create Account 🚀"
      subtitle="Start your AI career journey with CareerLens AI."
    >

      <InputField
        label="Full Name"
        type="text"
        placeholder="Enter your full name"
        value={name}
        error={nameError}
        onChange={(e) => {
          setName(e.target.value);
          setNameError("");
        }}
      />

      <InputField
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={email}
        error={emailError}
        onChange={(e) => {
          setEmail(e.target.value);
          setEmailError("");
        }}
      />

      <InputField
        label="Password"
        type="password"
        placeholder="Create a password"
        value={password}
        error={passwordError}
        onChange={(e) => {
          setPassword(e.target.value);
          setPasswordError("");
        }}
      />

      <InputField
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        value={confirmPassword}
        error={confirmPasswordError}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          setConfirmPasswordError("");
        }}
      />

      <button
        onClick={handleSignup}
        className="
          w-full
          py-3
          rounded-2xl
          bg-gradient-to-r
          from-violet-600
          via-fuchsia-600
          to-cyan-500
          text-white
          text-lg
          font-semibold
          hover:scale-[1.02]
          transition-all
          duration-300
          shadow-[0_0_30px_rgba(139,92,246,.35)]
        "
      >
        Continue
      </button>

      <p className="text-center text-gray-400 mt-5">

        Already have an account?

        <button
          onClick={() => navigate("/login")}
          className="
            ml-2
            text-violet-400
            font-semibold
            hover:text-violet-300
            transition
          "
        >
          Sign In
        </button>

      </p>

    </AuthLayout>
  );
}