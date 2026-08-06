import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import api from "../../services/api";
import { useProfile } from "../../context/ProfileContext";
import { getCurrentUser } from "../../utils/session";

const PLACEHOLDER_AVATAR = "https://i.pravatar.cc/150";

export default function AvatarUploader() {
  const { profileData, updateProfile } = useProfile();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const avatarSrc = profileData.avatar_url || PLACEHOLDER_AVATAR;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG or WEBP).");
      return;
    }

    const user = getCurrentUser();
    if (!user?.email) return;

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("email", user.email);
      formData.append("file", file);

      const response = await api.post("/settings/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Same ProfileContext the Navbar reads from - updates everywhere
      // that shows the avatar instantly, no logout/login needed.
      updateProfile({ avatar_url: response.data.avatar_url });
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not upload your photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    const user = getCurrentUser();
    if (!user?.email || !profileData.avatar_url) return;

    setError("");
    setUploading(true);

    try {
      await api.delete("/settings/avatar", { params: { email: user.email } });
      updateProfile({ avatar_url: "" });
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not remove your photo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
      <div className="relative w-fit">
        <img
          src={avatarSrc}
          alt="Your profile picture"
          className="w-24 h-24 rounded-full object-cover border-4 border-violet-500/40"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Change profile picture"
          className="
            absolute bottom-0 right-0 w-9 h-9 rounded-full
            bg-gradient-to-r from-violet-600 to-cyan-500
            flex items-center justify-center
            border-2 border-[#050816]
            hover:opacity-90 transition disabled:opacity-60
          "
        >
          {uploading ? (
            <Loader2 size={16} className="text-white animate-spin" />
          ) : (
            <Camera size={16} className="text-white" />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div>
        <p className="text-white font-semibold">
          {profileData.full_name || "Your profile picture"}
        </p>
        <p className="text-gray-400 text-sm mt-1">
          PNG, JPG or WEBP. Square images look best.
        </p>

        <div className="flex gap-3 mt-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="
              px-4 py-2 rounded-xl text-sm
              bg-white/5 border border-white/10 text-white
              hover:bg-white/10 transition disabled:opacity-60
            "
          >
            {profileData.avatar_url ? "Replace Photo" : "Upload Photo"}
          </button>

          {profileData.avatar_url && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="
                px-4 py-2 rounded-xl text-sm
                border border-red-500/30 text-red-400
                hover:bg-red-500/10 transition disabled:opacity-60
                flex items-center gap-1.5
              "
            >
              <Trash2 size={14} />
              Remove
            </button>
          )}
        </div>

        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
}
