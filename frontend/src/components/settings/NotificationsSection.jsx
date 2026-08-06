import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import api from "../../services/api";
import { useProfile } from "../../context/ProfileContext";
import { getCurrentUser } from "../../utils/session";

const TOGGLES = [
  {
    key: "notif_email_enabled",
    label: "Email Notifications",
    description: "General account and activity emails from CareerLens AI.",
  },
  {
    key: "notif_job_alerts_enabled",
    label: "Job & Internship Alerts",
    description: "Get notified about new matching jobs and internships.",
  },
  {
    key: "notif_weekly_summary_enabled",
    label: "Weekly Progress Summary",
    description: "A weekly recap of your skill, resume and application progress.",
  },
];

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`
        relative w-12 h-[26px] rounded-full transition-colors duration-300 flex-shrink-0
        ${checked ? "bg-gradient-to-r from-violet-600 to-cyan-500" : "bg-white/10"}
        disabled:opacity-60
      `}
    >
      <span
        className={`
          absolute top-[3px] w-5 h-5 rounded-full bg-white shadow transition-all duration-300
          ${checked ? "left-[23px]" : "left-[3px]"}
        `}
      />
    </button>
  );
}

export default function NotificationsSection() {
  const { profileData, updateProfile } = useProfile();
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState("");

  const handleToggle = async (key) => {
    const user = getCurrentUser();
    if (!user?.email) return;

    const nextValue = !profileData[key];
    const previousValue = profileData[key];

    // Optimistic update - reverted if the save fails.
    updateProfile({ [key]: nextValue });
    setSavingKey(key);
    setError("");

    try {
      await api.put("/settings/notifications", {
        email: user.email,
        notif_email_enabled:
          key === "notif_email_enabled" ? nextValue : profileData.notif_email_enabled,
        notif_job_alerts_enabled:
          key === "notif_job_alerts_enabled" ? nextValue : profileData.notif_job_alerts_enabled,
        notif_weekly_summary_enabled:
          key === "notif_weekly_summary_enabled" ? nextValue : profileData.notif_weekly_summary_enabled,
      });
    } catch (err) {
      updateProfile({ [key]: previousValue });
      setError(err?.response?.data?.detail || "Could not save your preference.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="text-violet-400" size={28} />
        <h2 className="text-2xl font-bold text-white">Notifications</h2>
      </div>

      <div className="space-y-5">
        {TOGGLES.map((toggle) => (
          <div
            key={toggle.key}
            className="flex items-center justify-between gap-4 border-b border-white/10 pb-5 last:border-b-0 last:pb-0"
          >
            <div>
              <p className="text-white font-medium">{toggle.label}</p>
              <p className="text-gray-400 text-sm mt-0.5">{toggle.description}</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {savingKey === toggle.key && (
                <Loader2 size={14} className="text-gray-400 animate-spin" />
              )}
              <Toggle
                checked={!!profileData[toggle.key]}
                disabled={savingKey === toggle.key}
                onChange={() => handleToggle(toggle.key)}
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
    </div>
  );
}
