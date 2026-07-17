import { FcGoogle } from "react-icons/fc";

export default function GoogleButton() {
  return (
    <button
      type="button"
      className="
        w-full
        mt-6
        flex
        items-center
        justify-center
        gap-3
        py-4
        rounded-2xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-xl
        text-white
        font-medium
        transition-all
        duration-300
        hover:bg-white/10
        hover:border-violet-500/40
        hover:scale-[1.02]
      "
    >
      <FcGoogle size={24} />

      Continue with Google

      <span className="text-xs text-gray-400">
        (Coming Soon)
      </span>

    </button>
  );
}