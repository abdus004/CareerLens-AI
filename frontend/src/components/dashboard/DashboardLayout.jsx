import { useState, useEffect } from "react";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useProfile } from "../../context/ProfileContext";
import { useTheme } from "../../context/ThemeContext";
import { getCurrentUser } from "../../utils/session";

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { profileData, profileLoaded, loadProfile } = useProfile();
  const { theme, setTheme } = useTheme();

  // Runs once per session (profileLoaded guards it), regardless of how
  // many times DashboardLayout itself remounts across page navigations -
  // ProfileContext lives above the router in main.jsx and keeps the
  // fetched profile in memory. This single GET /profile/{email} is what
  // lets the Navbar show the real avatar/name and lets the theme picked
  // on another device restore here too (see ThemeContext.jsx).
  useEffect(() => {
    if (profileLoaded) return;

    const user = getCurrentUser();
    if (!user?.email) return;

    loadProfile(user.email);
  }, [profileLoaded, loadProfile]);

  // Reconcile theme from the profile that was just loaded - only
  // matters the first time on a device that has no localStorage value
  // yet; persist=false so this never writes the same value straight
  // back to the server.
  useEffect(() => {
    if (!profileLoaded) return;
    const remoteTheme = profileData.theme_preference;
    if ((remoteTheme === "light" || remoteTheme === "dark") && remoteTheme !== theme) {
      setTheme(remoteTheme, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoaded]);

  return (
    <div className="flex h-screen bg-[#050816] overflow-hidden">

      {/* Sidebar */}

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main Content */}

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Navbar */}

        <Navbar />

        {/* Page Content */}

        <main
          className="
            flex-1
            overflow-y-auto
            bg-[#050816]
            px-6
            py-5
          "
        >
          <div className="max-w-[1700px] mx-auto space-y-5">

            {children}

          </div>
        </main>

      </div>

    </div>
  );
}