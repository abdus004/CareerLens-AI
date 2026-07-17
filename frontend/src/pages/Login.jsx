import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    const users =
      JSON.parse(localStorage.getItem("users")) || [];

    const foundUser = users.find(
      (user) =>
        user.email.toLowerCase() ===
        email.trim().toLowerCase()
    );

    if (!foundUser) {
      setError(
        "No account found with this email. Please create an account."
      );
      return;
    }

    if (foundUser.password !== password) {
      setError("Incorrect password.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (rememberMe) {
        localStorage.setItem(
          "currentUser",
          JSON.stringify(foundUser)
        );
      } else {
        sessionStorage.setItem(
          "currentUser",
          JSON.stringify(foundUser)
        );
      }

      navigate("/dashboard");
    }, 1000);
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

      <div className="flex items-center justify-between mb-5">
        <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) =>
              setRememberMe(e.target.checked)
            }
            className="accent-violet-500"
          />
          Remember Me
        </label>

        <button
          type="button"
          onClick={() =>
            alert(
              "Forgot Password will be added in a future update."
            )
          }
          className="text-violet-400 hover:text-violet-300 transition text-sm"
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
          ⚠ {error}
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={loading}
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
          disabled:opacity-70
          disabled:cursor-not-allowed
        "
      >
        {loading ? "Signing In..." : "Sign In"}
      </button>

      <p className="text-center text-gray-400 mt-5">
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