import { useState } from "react";
import { useProfile } from "../../context/ProfileContext";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/apiError";

// Final step of Profile Setup. Previously named "Portfolio" and also
// collected Project / Internship / Certification details - none of
// which were ever included in the payload sent to the backend (see
// handleFinish below: it always spread `profileData`, which those
// fields were never merged into). That UI was pure dead weight: it
// looked like it saved something and didn't. Removed rather than
// wired up, because CareerLens already has a dedicated, working
// Certificates module (routes/certificates.py, the
// `user_certificates` table, and its own upload/tracking UI) - adding
// a second, competing certificate-entry path here would just
// reintroduce the "duplicated fields" problem this pass is meant to
// fix. This step now does exactly what its filename says.
export default function ResumeUpload({ onNext, onBack }) {
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { updateProfile, profileData } = useProfile();

  const handleFinish = async () => {
    setError("");
    setSubmitting(true);

    try {
      // -------------------------------
      // STEP 1 - Save Profile
      // -------------------------------
      const finalProfile = {
        ...profileData,
        resume_url: profileData.resume_url || "",
        // What Step 1 actually submits as profile-selected skills -
        // recorded here too so the context matches what the backend
        // just stored in profile_selected_skills (see routes/profile.py),
        // independent of whatever gets merged in from the resume next.
        profile_selected_skills: profileData.skills || [],
      };

      await api.post("/profile/", finalProfile);

      // -------------------------------
      // STEP 2 - Upload Resume (Optional)
      // -------------------------------
      if (resume) {
        const formData = new FormData();
        formData.append("email", profileData.email);
        formData.append("file", resume);

        const uploadResponse = await api.post("/resume/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        finalProfile.resume_url =
          uploadResponse.data.resume_url || uploadResponse.data.file_url || "";

        // The backend just merged this resume's skills with whatever
        // was profile-selected in Step 1 (see
        // services/skill_unification_service.build_unified_skills) -
        // reflect that unified result immediately, rather than leaving
        // the context holding only the pre-upload, profile-selected-
        // only skills until the next full profile reload.
        if (Array.isArray(uploadResponse.data.skills)) {
          finalProfile.skills = uploadResponse.data.skills;
        }
      }

      // -------------------------------
      // STEP 3 - Update Context
      // -------------------------------
      updateProfile(finalProfile);

      // -------------------------------
      // STEP 4 - Go Dashboard
      // -------------------------------
      onNext();
    } catch (err) {
      console.error("Profile Setup - Finish Error:", err);
      // getErrorMessage safely handles FastAPI's 422 validation error
      // shape (an array of {type, loc, msg, input} objects) instead of
      // rendering it directly, which previously crashed this whole
      // page ("Objects are not valid as a React child") the moment any
      // single field failed backend validation.
      setError(getErrorMessage(err, "Something went wrong saving your profile. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <p className="text-gray-400">
        Uploading a resume now lets CareerLens generate your Resume
        Analysis, Skill Gaps, and Job Matches right away. You can always
        upload or replace it later from Settings.
      </p>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">📄 Resume</h2>

        <label
          className="
            flex
            justify-center
            items-center
            border-2
            border-dashed
            border-violet-500/30
            rounded-3xl
            py-12
            bg-white/5
            cursor-pointer
            hover:border-violet-500
            transition
          "
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files.length > 0) {
                setResume(e.target.files[0]);
              }
            }}
          />
          <span className="text-gray-300">Upload Resume (PDF, DOC, DOCX)</span>
        </label>

        {resume && <p className="text-green-400 mt-4">✅ {resume.name}</p>}
      </div>

      {error && (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={submitting}
          className="
            px-8
            py-3
            rounded-2xl
            border
            border-white/10
            bg-white/5
            text-white
            hover:bg-white/10
            transition
            disabled:opacity-50
          "
        >
          ← Back
        </button>

        <button
          onClick={handleFinish}
          disabled={submitting}
          className="
            px-10
            py-3
            rounded-2xl
            bg-gradient-to-r
            from-violet-600
            via-fuchsia-600
            to-cyan-500
            text-white
            font-semibold
            hover:scale-[1.02]
            transition
            disabled:opacity-60
            disabled:hover:scale-100
          "
        >
          {submitting ? "Saving..." : "Finish →"}
        </button>
      </div>
    </div>
  );
}
