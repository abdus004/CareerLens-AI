import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function InputField({
  label,
  type,
  placeholder,
}) {

  const [showPassword, setShowPassword] = useState(false);

  const inputType =
    type === "password"
      ? showPassword
        ? "text"
        : "password"
      : type;

  return (
    <div className="mb-4">

      {/* Label */}

      <label
        className="
          block
          text-gray-300
          mb-2
          text-sm
          font-medium
        "
      >
        {label}
      </label>

      {/* Input */}

      <div className="relative">

        <input
          type={inputType}
          placeholder={placeholder}
          className="
            w-full
            rounded-2xl
            border
            border-white/10
            bg-white/5
            px-5
            py-3
            text-white
            placeholder:text-gray-500
            outline-none
            transition-all
            duration-300

            focus:border-violet-500
            focus:ring-2
            focus:ring-violet-500/40
            focus:bg-white/10
          "
        />

        {/* Password Toggle */}

        {type === "password" && (

          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            className="
              absolute
              right-5
              top-1/2
              -translate-y-1/2
              text-gray-400
              hover:text-white
              transition
            "
          >

            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}

          </button>

        )}

      </div>

    </div>
  );
}