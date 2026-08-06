import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Loader2, X, ShieldAlert } from "lucide-react";
import api from "../../services/api";
import { getCurrentUser, clearSession } from "../../utils/session";
import InputField from "../InputField";

export default function DeleteAccountModal({ onClose }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = password.length > 0 && confirmText.trim().toUpperCase() === "DELETE";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!canSubmit) {
      setError('Enter your password and type "DELETE" to confirm.');
      return;
    }

    const user = getCurrentUser();
    if (!user?.email) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/settings/account/delete", {
        email: user.email,
        password,
      });

      clearSession();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not delete your account. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#0b0e1a] p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="text-red-400" size={22} />
            </div>
            <h2 className="text-xl font-bold text-white">Delete Account</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-white transition disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-300 text-sm">
          This permanently deletes your CareerLens AI account and everything
          tied to it - profile, resume, analyses, interviews, assessments and
          certificates. This cannot be undone.
        </p>

        <form onSubmit={handleSubmit} className="mt-5">
          <InputField
            label="Current Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="mb-4">
            <label className="block text-gray-300 mb-2 text-sm font-medium">
              Type <span className="text-red-400 font-semibold">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="
                w-full rounded-2xl border border-red-500/30 bg-white/5
                px-5 py-3 text-white placeholder:text-gray-500 outline-none
                transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/40
              "
            />
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <div className="flex gap-3">
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
              disabled={submitting || !canSubmit}
              className="
                flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700
                text-white font-semibold transition
                disabled:opacity-50 flex items-center justify-center gap-2
              "
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {submitting ? "Deleting..." : "Delete My Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
