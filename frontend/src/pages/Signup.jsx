import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";

const API_URL = "http://127.0.0.1:8000";

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

  const handleSignup = async () => {
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

  try {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      full_name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password,
    }),
  });

  const data = await response.json();
   
  if (!response.ok) {
    if (!response.ok) {
  console.log(data);

  if (typeof data.detail === "string") {
    if (data.detail.toLowerCase().includes("already")) {
      setEmailError("An account with this email already exists.");
      return;
    }

    alert(data.detail);
    return;
  }

  alert(JSON.stringify(data.detail));
  return;
} {
      setEmailError("An account with this email already exists.");
      return;
    }

    alert(data.detail || "Signup failed");
    return;
  }

  alert("Account created successfully!");

localStorage.setItem(
  "user",
  JSON.stringify({
    full_name: name.trim(),
    email: email.trim().toLowerCase(),
  })
);

navigate("/profile-setup");

} catch (error) {
  console.error(error);
  alert("Unable to connect to backend.");
}
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