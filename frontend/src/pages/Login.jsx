import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";
import api from "../services/api";
import { saveSession } from "../utils/session";
import { validateEmail } from "../utils/validators";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // Routed through the shared api client (services/api.js) instead
      // of a raw fetch() against a hardcoded http://127.0.0.1:8000 -
      // that hardcoded value meant Login was the one page in the app
      // that ignored VITE_API_URL entirely and would only ever work
      // on localhost, breaking silently the moment this is deployed
      // anywhere else. Every other page (Signup, and every
      // authenticated request via the interceptor added for
      // Profile/Settings auth) already goes through this client.
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password: password,
      });

      const data = response.data;

      saveSession(data.user, data.session, rememberMe);

      navigate("/dashboard");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail || "Invalid email or password.");
    } finally {
      setLoading(false);
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