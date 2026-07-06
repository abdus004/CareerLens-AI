import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";

export default function Signup() {
    const navigate = useNavigate();
  return (
    <AuthLayout
      title="Create Account 🚀"
      subtitle="Start your AI career journey with CareerLens AI."
    >
      {/* Name */}

      <InputField
        label="Full Name"
        type="text"
        placeholder="Enter your full name"
      />

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
        placeholder="Create a password"
      />

      {/* Confirm Password */}

      <InputField
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
      />

      {/* Create Account Button */}

      <button
  onClick={() => navigate("/profile-setup")}
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

      {/* Login */}

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