import { useState } from "react";
import { ShieldCheck, KeyRound, Trash2 } from "lucide-react";
import ChangePasswordModal from "./ChangePasswordModal";
import DeleteAccountModal from "./DeleteAccountModal";

export default function SecuritySection() {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-cyan-400" size={28} />
        <h2 className="text-2xl font-bold text-white">Security & Account</h2>
      </div>

      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <KeyRound className="text-violet-400" size={18} />
          </div>
          <div>
            <p className="text-white font-medium">Password</p>
            <p className="text-gray-400 text-sm mt-0.5">Change your account password.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowChangePassword(true)}
          className="
            px-5 py-2.5 rounded-xl text-sm
            bg-white/5 border border-white/10 text-white
            hover:bg-white/10 transition
          "
        >
          Change Password
        </button>
      </div>

      {/* Danger Zone */}
      <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <p className="text-red-400 font-semibold text-sm tracking-wide uppercase mb-1">
          Danger Zone
        </p>
        <div className="flex items-center justify-between gap-4 mt-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Trash2 className="text-red-400" size={18} />
            </div>
            <div>
              <p className="text-white font-medium">Delete Account</p>
              <p className="text-gray-400 text-sm mt-0.5">
                Permanently delete your account and all associated data.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteAccount(true)}
            className="
              px-5 py-2.5 rounded-xl text-sm flex-shrink-0
              border border-red-500/30 text-red-400
              hover:bg-red-500/10 transition
            "
          >
            Delete Account
          </button>
        </div>
      </div>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
      {showDeleteAccount && (
        <DeleteAccountModal onClose={() => setShowDeleteAccount(false)} />
      )}
    </div>
  );
}
