import { Search, Bell, ChevronDown } from "lucide-react";

export default function Navbar() {
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

        {/* Search */}

        <div className="relative">

          <Search
            size={18}
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-gray-500
            "
          />

          <input
            type="text"
            placeholder="Search..."
            className="
              w-[240px]
              h-10
              rounded-xl
              bg-white/5
              border
              border-white/10
              pl-11
              pr-4
              text-white
              placeholder:text-gray-500
              outline-none
              transition-all
              duration-300
              focus:border-violet-500
            "
          />

        </div>

        {/* Notification */}

        <button
          className="
            relative
            w-10
            h-10
            rounded-xl
            bg-white/5
            border
            border-white/10
            flex
            items-center
            justify-center
            hover:bg-white/10
            transition
          "
        >

          <Bell
            size={18}
            className="text-white"
          />

          <span
            className="
              absolute
              top-2
              right-2
              w-2
              h-2
              rounded-full
              bg-violet-500
            "
          />

        </button>

        {/* Profile */}

        <button
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
            src="https://i.pravatar.cc/100"
            alt="profile"
            className="
              w-9
              h-9
              rounded-full
              border-2
              border-violet-500
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