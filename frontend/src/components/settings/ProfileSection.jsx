import { useState, useEffect } from "react";
import { User, Loader2, CheckCircle2 } from "lucide-react";
import api from "../../services/api";
import { useProfile } from "../../context/ProfileContext";
import { getCurrentUser } from "../../utils/session";
import InputField from "../InputField";
import AvatarUploader from "./AvatarUploader";
import ResumeManagementCard from "./ResumeManagementCard";

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Final Year", "Graduated"];

const EMPTY_FORM = {
  full_name: "",
  phone: "",
  college: "",
  degree: "",
  department: "",
  year: "",
  linkedin: "",
  github: "",
};

export default function ProfileSection() {
  const { profileData, updateProfile, profileLoaded } = useProfile();

  const [form, setForm] = useState(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local editable copy is hydrated once, the first time the profile
  // finishes loading - after that it's left alone so an avatar upload
  // (which also updates ProfileContext) doesn't clobber in-progress edits.
  useEffect(() => {
    if (!profileLoaded || hydrated) return;

    setForm({
      full_name: profileData.full_name || "",
      phone: profileData.phone || "",
      college: profileData.college || "",
      degree: profileData.degree || "",
      department: profileData.department || "",
      year: profileData.year || "",
      linkedin: profileData.linkedin || "",
      github: profileData.github || "",
    });
    setHydrated(true);
  }, [profileLoaded, hydrated, profileData]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    const user = getCurrentUser();
    if (!user?.email) return;

    if (!form.full_name.trim()) {
      setSaveError("Full name can't be empty.");
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    // Reuses the existing POST /profile/ endpoint that Profile Setup
    // already uses - it requires the full profile shape, so untouched
    // fields (gender, age, cgpa, career_goal, skills, interests,
    // resume_url) are carried over unchanged from what was already
    // loaded, rather than a second "partial update" API being invented.
    const payload = {
      full_name: form.full_name.trim(),
      email: user.email,
      phone: form.phone.trim(),
      gender: profileData.gender || "",
      age: profileData.age || 0,
      linkedin: form.linkedin.trim(),
      github: form.github.trim(),
      college: form.college.trim(),
      department: form.department.trim(),
      degree: form.degree.trim(),
      year: form.year.trim(),
      cgpa: profileData.cgpa || "",
      career_goal: profileData.career_goal || [],
      skills: profileData.skills || [],
      interests: profileData.interests || [],
      resume_url: profileData.resume_url || "",
    };

    try {
      await api.post("/profile/", payload);

      updateProfile({
        full_name: payload.full_name,
        phone: payload.phone,
        college: payload.college,
        degree: payload.degree,
        department: payload.department,
        year: payload.year,
        linkedin: payload.linkedin,
        github: payload.github,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err?.response?.data?.detail || "Could not save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="flex items-center gap-3 mb-6">
        <User className="text-cyan-400" size={28} />
        <h2 className="text-2xl font-bold text-white">Profile</h2>
      </div>

      <AvatarUploader />

      <div className="grid md:grid-cols-2 gap-x-5 mt-8">
        <InputField label="Full Name" value={form.full_name} onChange={handleChange("full_name")} />

        <div className="mb-4">
          <label className="block text-gray-300 mb-2 text-sm font-medium">Email</label>
          <input
            type="email"
            value={profileData.email || ""}
            readOnly
            className="
              w-full rounded-2xl border border-white/10 bg-white/5
              px-5 py-3 text-gray-500 outline-none cursor-not-allowed
            "
          />
        </div>

        <InputField label="Phone Number" value={form.phone} onChange={handleChange("phone")} />
        <InputField label="College" value={form.college} onChange={handleChange("college")} />
        <InputField label="Degree" value={form.degree} onChange={handleChange("degree")} />
        <InputField label="Department" value={form.department} onChange={handleChange("department")} />

        <div className="mb-4">
          <label className="block text-gray-300 mb-2 text-sm font-medium">Current Year</label>
          <select
            value={form.year}
            onChange={handleChange("year")}
            className="
              w-full rounded-2xl border border-white/10 bg-white/5
              px-5 py-3 text-white outline-none transition-all duration-300
              focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40 focus:bg-white/10
            "
          >
            <option value="" className="bg-[#0B1120]">Select year</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y} className="bg-[#0B1120]">{y}</option>
            ))}
          </select>
        </div>

        <InputField label="LinkedIn URL" value={form.linkedin} onChange={handleChange("linkedin")} placeholder="https://linkedin.com/in/..." />
        <InputField label="GitHub URL" value={form.github} onChange={handleChange("github")} placeholder="https://github.com/..." />
      </div>

      <div className="flex items-center gap-4 mt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="
            px-6 py-3 rounded-xl
            bg-gradient-to-r from-violet-600 to-cyan-500
            hover:opacity-90 transition text-white font-semibold
            disabled:opacity-60 flex items-center gap-2
          "
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save Changes
        </button>

        {saveSuccess && (
          <span className="text-emerald-400 text-sm flex items-center gap-1.5">
            <CheckCircle2 size={16} /> Saved
          </span>
        )}
        {saveError && <span className="text-red-400 text-sm">{saveError}</span>}
      </div>

      <div className="mt-8 pt-8 border-t border-white/10">
        <ResumeManagementCard />
      </div>
    </div>
  );
}
