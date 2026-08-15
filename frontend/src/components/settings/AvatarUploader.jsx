import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import api from "../../services/api";
import { useProfile } from "../../context/ProfileContext";
import { getCurrentUser } from "../../utils/session";
import { getErrorMessage } from "../../utils/apiError";
import AvatarCropModal from "./AvatarCropModal";

const PLACEHOLDER_AVATAR = "https://i.pravatar.cc/150";
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function AvatarUploader() {
  const { profileData, updateProfile } = useProfile();
  const fileInputRef = useRef(null);

  const [pendingFile, setPendingFile] = useState(null); // file awaiting crop
  const [showCropModal, setShowCropModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const avatarSrc = profileData.avatar_url || PLACEHOLDER_AVATAR;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG or WEBP image.");
      return;
    }

    // Opens the crop modal FIRST - nothing is uploaded until the user
    // confirms the crop (see handleCropSave).
    setError("");
    setPendingFile(file);
    setShowCropModal(true);
  };

  const handleCropCancel = () => {
    if (uploading) return;
    setShowCropModal(false);
    setPendingFile(null);
  };

  const handleCropSave = async (croppedFile) => {
    const user = getCurrentUser();
    if (!user?.email) return;

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("email", user.email);
      // Existing avatar upload endpoint and Storage bucket, unchanged -
      // only the file it receives is now a pre-cropped 512x512 square
      // instead of the raw original.
      formData.append("file", croppedFile);

      const response = await api.post("/settings/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Same ProfileContext the Navbar (and anywhere else) reads from -
      // updates everywhere the avatar shows instantly, no refresh needed.
      updateProfile({ avatar_url: response.data.avatar_url });

      setShowCropModal(false);
      setPendingFile(null);
    } catch (err) {
      setError(getErrorMessage(err, "Could not upload your photo. Please try again."));
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
      setError(getErrorMessage(err, "Could not remove your photo."));
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
          <Camera size={16} className="text-white" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div>
        <p className="text-white font-semibold">
          {profileData.full_name || "Your profile picture"}
        </p>
        <p className="text-gray-400 text-sm mt-1">
          JPG, PNG or WEBP. You'll be able to crop and zoom before saving.
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

        {error && !showCropModal && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {showCropModal && (
        <AvatarCropModal
          file={pendingFile}
          saving={uploading}
          error={error}
          onCancel={handleCropCancel}
          onSave={handleCropSave}
        />
      )}
    </div>
  );
}
