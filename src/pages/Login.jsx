import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (!savedUser) {
      setError("No account found. Please create an account first.");
      return;
    }

    if (
      email === savedUser.email &&
      password === savedUser.password
    ) {
      setError("");
      navigate("/dashboard");
    } else {
      setError("Invalid email or password.");
    }
  };

  return (
    <AuthLayout
      title="Welcome Back 👋"
      subtitle="Sign in to continue your AI career journey."
    >
      <InputField
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
      />

      <InputField
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError("");
        }}
      />

      <div className="flex justify-end mb-4">
        <button
          className="text-violet-400 hover:text-violet-300 transition"
        >
          Forgot Password?
        </button>
      </div>

      {error && (
        <div
          className="
            mb-5
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

      <button
        onClick={handleLogin}
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
        Sign In
      </button>

      <p className="text-center text-gray-400 mt-4">
        Don't have an account?

        <button
          onClick={() => navigate("/signup")}
          className="
            ml-2
            text-violet-400
            font-semibold
            hover:text-violet-300
            transition
          "
        >
          Create Account
        </button>
      </p>
    </AuthLayout>
  );
}