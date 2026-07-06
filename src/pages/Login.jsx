import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";
import GoogleButton from "../components/GoogleButton";

export default function Login() {
    const navigate = useNavigate();
  return (
    <AuthLayout
      title="Welcome Back 👋"
      subtitle="Sign in to continue your AI career journey."
    >
      {/* Email */}

      <InputField
        label="Email"
        type="email"
        placeholder="Enter your email"
      />

      {/* Password */}

      <InputField
        label="Password"
        type="password"
        placeholder="Enter your password"
      />

      {/* Forgot Password */}

      <div className="flex justify-end mb-4">

        <button
          className="
            text-sm
            text-violet-400
            hover:text-violet-300
            transition
          "
        >
          Forgot Password?
        </button>

      </div>

      {/* Sign In */}

      <button
        className="
          w-full
          py-3
          rounded-2xl
          bg-gradient-to-r
          from-violet-600
          to-fuchsia-600
          text-white
          font-semibold
          text-lg
          hover:scale-[1.02]
          transition-all
          duration-300
          shadow-[0_0_35px_rgba(139,92,246,.35)]
        "
      >
        Sign In
      </button>

      

      {/* Footer */}

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