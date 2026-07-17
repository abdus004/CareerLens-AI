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
  clearErrors();

  let valid = true;

  if (!name.trim()) {
    setNameError("Full name is required.");
    valid = false;
  }

  if (!email.trim()) {
    setEmailError("Email is required.");
    valid = false;
  }

  if (!password) {
    setPasswordError("Password is required.");
    valid = false;
  }

  if (!confirmPassword) {
    setConfirmPasswordError("Please confirm your password.");
    valid = false;
  }

  if (password && confirmPassword && password !== confirmPassword) {
    setConfirmPasswordError("Passwords do not match.");
    valid = false;
  }

  if (!valid) return;

  // Get existing users
  const users = JSON.parse(localStorage.getItem("users")) || [];

  // Check if email already exists
  const existingUser = users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    setEmailError("An account with this email already exists.");
    return;
  }

  // Create new user
  const newUser = {
  id: Date.now(),
  name: name.trim(),
  email: email.trim().toLowerCase(),
  password,

  profile: {
    age: "",
    gender: "",
    phone: "",
    linkedin: "",
    github: "",

    college: "",
    department: "",
    degree: "",
    year: "",
    cgpa: "",

    careerGoal: "",
    interests: [],
    skills: [],

    resume: null,

    resumeScore: 0,
    careerMatch: [],
    profileStrength: 0,
  },
};

  // Save all users
  users.push(newUser);

  localStorage.setItem(
    "users",
    JSON.stringify(users)
  );

  // Save current logged in user
  localStorage.setItem(
    "currentUser",
    JSON.stringify(newUser)
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