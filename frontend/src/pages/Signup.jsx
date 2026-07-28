import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";
import api from "../services/api";
import { saveSession } from "../utils/session";
import { Check, X, Loader2 } from "lucide-react";

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const isPasswordValid = (pw) =>
  PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(pw));

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
  const [formError, setFormError] = useState("");

  const [loading, setLoading] = useState(false);

  // null while the form hasn't been successfully submitted yet.
  // "signed_in" -> email confirmation is off on this project, the
  //   account is created and the user is immediately logged in.
  // "confirmation_required" -> account created, but the user has to
  //   verify their email before they can log in.
  const [successStatus, setSuccessStatus] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const clearErrors = () => {
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setFormError("");
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
    } else if (!isPasswordValid(password)) {
      setPasswordError("Password does not meet all requirements below.");
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

    setLoading(true);

    try {
      const response = await api.post("/auth/signup", {
        full_name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      });

      const data = response.data;

      if (data.status === "signed_in" && data.session) {
        // Email confirmation is off on this project - the account is
        // real and usable right now, so treat this exactly like a
        // successful login.
        // No Remember Me choice exists on this page - preserving the
        // original behavior of always using localStorage here, just
        // now via the shared helper that also clears any stale data
        // left behind by a previous session first.
        saveSession(data.user, data.session, true);

        setSuccessStatus("signed_in");
        setSuccessMessage(
          data.message || "Account created successfully. Redirecting..."
        );

        setTimeout(() => {
          navigate("/profile-setup");
        }, 1200);
      } else {
        // Email confirmation is required - nothing is actually
        // authenticated yet, so nothing is written to storage here.
        // The user will get a real session the normal way, by logging
        // in after they confirm their email.
        setSuccessStatus("confirmation_required");
        setSuccessMessage(
          data.message ||
            "Account created. Please check your email to verify your account before logging in."
        );
      }
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (status === 409) {
        setEmailError(
          detail || "An account with this email already exists."
        );
      } else if (detail) {
        setFormError(detail);
      } else {
        setFormError("Unable to connect to the server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account 🚀"
      subtitle="Start your AI career journey with CareerLens AI."
    >

      {successStatus ? (

        <>

          {/* Success message */}

          <div
            className="
              mb-6
              rounded-xl
              border
              border-green-500/30
              bg-green-500/10
              px-4
              py-4
              text-green-300
              text-sm
              leading-6
            "
          >
            ✓ {successMessage}
          </div>

          {successStatus === "confirmation_required" && (
            <button
              onClick={() => navigate("/login")}
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
              Go to Login
            </button>
          )}

          {successStatus === "signed_in" && (
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Loader2 size={16} className="animate-spin" />
              Taking you to your profile setup...
            </div>
          )}

        </>

      ) : (

        <>

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

          {password.length > 0 && (
            <div
              className="
                mb-4
                -mt-2
                rounded-xl
                border
                border-white/10
                bg-white/5
                p-4
                space-y-1.5
              "
            >
              {PASSWORD_REQUIREMENTS.map((requirement) => {
                const met = requirement.test(password);

                return (
                  <div
                    key={requirement.label}
                    className={`
                      flex
                      items-center
                      gap-2
                      text-sm
                      ${met ? "text-green-400" : "text-gray-500"}
                    `}
                  >
                    {met ? <Check size={14} /> : <X size={14} />}
                    {requirement.label}
                  </div>
                );
              })}
            </div>
          )}

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

          {formError && (
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
              ⚠ {formError}
            </div>
          )}

          <button
            onClick={handleSignup}
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
              disabled:hover:scale-100
              flex
              items-center
              justify-center
              gap-2
            "
          >
            {loading && <Loader2 size={20} className="animate-spin" />}
            {loading ? "Creating Account..." : "Continue"}
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

        </>

      )}

    </AuthLayout>
  );
}