import { createContext, useContext, useState, useCallback } from "react";
import api from "../services/api";

const ProfileContext = createContext();

// Single source of truth for the logged-in user's profile, shared by:
//  - the Profile Setup wizard (original purpose of this context)
//  - the Navbar avatar/name (components/dashboard/Navbar.jsx)
//  - Settings > Profile (pages/Settings.jsx)
//
// loadProfile() is called once per session by DashboardLayout, so
// every authenticated page shares the same already-fetched profile
// instead of each page (or the Navbar) re-fetching it independently.

const DEFAULT_PROFILE = {
  // NOTE: matches the `profiles.user_type` column name exactly (not
  // camelCase `userType`) - the two were previously spelled
  // differently between this context and the API payload, which is
  // why the Student/Job Seeker selection was silently dropped and
  // never reached the backend. See components/profile/UserType.jsx.
  user_type: "",

  full_name: "",
  email: "",
  phone: "",
  gender: "",
  age: "",

  linkedin: "",
  github: "",

  college: "",
  department: "",
  degree: "",
  year: "",
  cgpa: "",
  experience_years: "", // Job Seeker only

  career_goal: [],
  skills: [],
  interests: [],

  resume_url: "",
  resume: null,

  // Settings fields
  avatar_url: "",
  theme_preference: "dark",
  notif_email_enabled: true,
  notif_job_alerts_enabled: true,
  notif_weekly_summary_enabled: true,
};

export const ProfileProvider = ({ children }) => {
  const [profileData, setProfileData] = useState(DEFAULT_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const updateProfile = (newData) => {
    setProfileData((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  // Fetches the full saved profile (GET /profile/{email}) and merges it
  // in. Safe to call multiple times - callers should check
  // `profileLoaded` first (see DashboardLayout.jsx) so this only ever
  // runs once per session unless `force` is passed (used right after
  // Settings saves a change, so the Navbar/other pages reflect it
  // immediately without needing a full page refresh).
  const loadProfile = useCallback(
    async (email, force = false) => {
      if (!email) return;
      if (profileLoaded && !force) return;

      try {
        setProfileLoading(true);
        const response = await api.get(`/profile/${encodeURIComponent(email)}`);
        const data = response?.data?.data;
        if (data) {
          updateProfile(data);
        }
        setProfileLoaded(true);
      } catch {
        // Profile may genuinely not exist yet (e.g. mid Profile Setup) -
        // fail silently, the wizard's own local state still works.
      } finally {
        setProfileLoading(false);
      }
    },
    [profileLoaded]
  );

  return (
    <ProfileContext.Provider
      value={{
        profileData,
        updateProfile,
        loadProfile,
        profileLoaded,
        profileLoading,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
