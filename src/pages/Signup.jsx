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

  const handleSignup = () => {
    // Empty fields
    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill all fields.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      alert("Please enter a valid email.");
      return;
    }

    // Password length
    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    // Confirm password
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Save account locally
    const user = {
      name,
      email,
      password,
    };

    localStorage.setItem("user", JSON.stringify(user));

    alert("Account created successfully!");

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
        onChange={(e) => setName(e.target.value)}
      />

      <InputField
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <InputField
        label="Password"
        type="password"
        placeholder="Create a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <InputField
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button
        onClick={handleSignup}
        className="
          w-full
          py-3
          rounded-2xl
          bg-gradient-to-r
          from-violet-600
          to-fuchsia-600
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

      <p className="text-center text-gray-400 mt-4">
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