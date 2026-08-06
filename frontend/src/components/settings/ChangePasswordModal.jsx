import { useState } from "react";
import { KeyRound, Loader2, X, CheckCircle2 } from "lucide-react";
import api from "../../services/api";
import { getCurrentUser } from "../../utils/session";
import InputField from "../InputField";

const EMPTY_FORM = { current_password: "", new_password: "", confirm_password: "" };

export default function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.current_password || !form.new_password || !form.confirm_password) {
      setError("Please fill in all three fields.");
      return;
    }
    if (form.new_password.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError("New password and confirmation don't match.");
      return;
    }

    const user = getCurrentUser();
    if (!user?.email) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/settings/change-password", {
        email: user.email,
        current_password: form.current_password,
        new_password: form.new_password,
      });

      setSuccess(true);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not update your password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0e1a] p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <KeyRound className="text-violet-400" size={22} />
            </div>
            <h2 className="text-xl font-bold text-white">Change Password</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-4">
            <CheckCircle2 className="text-emerald-400 mx-auto mb-3" size={40} />
            <p className="text-white font-semibold">Password updated</p>
            <p className="text-gray-400 text-sm mt-1">
              Your password has been changed successfully.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="
                mt-6 w-full py-3 rounded-xl
                bg-gradient-to-r from-violet-600 to-cyan-500
                text-white font-semibold hover:opacity-90 transition
              "
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <InputField
              label="Current Password"
              type="password"
              value={form.current_password}
              onChange={handleChange("current_password")}
            />
            <InputField
              label="New Password"
              type="password"
              value={form.new_password}
              onChange={handleChange("new_password")}
              placeholder="At least 8 characters"
            />
            <InputField
              label="Confirm New Password"
              type="password"
              value={form.confirm_password}
              onChange={handleChange("confirm_password")}
            />

            {error && <p className="text-red-400 text-sm -mt-2 mb-4">{error}</p>}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="
                  flex-1 py-3 rounded-xl border border-white/10 text-white
                  hover:bg-white/10 transition disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="
                  flex-1 py-3 rounded-xl
                  bg-gradient-to-r from-violet-600 to-cyan-500
                  text-white font-semibold hover:opacity-90 transition
                  disabled:opacity-60 flex items-center justify-center gap-2
                "
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
