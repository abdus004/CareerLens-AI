import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const navigate = useNavigate();
  const { profileData } = useProfile();

  // Falls back to the placeholder only until a real profile picture is
  // set - updates instantly the moment Settings saves a new one, since
  // both read from the same ProfileContext (no logout/login needed).
  const avatarSrc = profileData.avatar_url || "https://i.pravatar.cc/100";

  return (
    <header
      className="
        h-16
        border-b
        border-white/10
        bg-[#050816]
        flex
        items-center
        justify-end
        px-8
      "
    >
      <div className="flex items-center gap-4">

        {/* Notification */}

        <NotificationBell />

        {/* Profile */}

        <button
          onClick={() => navigate("/settings")}
          title={profileData.full_name || "Settings"}
          className="
            flex
            items-center
            gap-2
            rounded-xl
            px-1
            hover:bg-white/5
            transition
          "
        >

          <img
            src={avatarSrc}
            alt="profile"
            className="
              w-9
              h-9
              rounded-full
              border-2
              border-violet-500
              object-cover
            "
          />

          <ChevronDown
            size={16}
            className="text-gray-400"
          />

        </button>

      </div>
    </header>
  );
}