import { Palette, Moon, Sun, Check } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const OPTIONS = [
  {
    value: "dark",
    label: "Dark Theme",
    description: "The classic CareerLens AI futuristic look.",
    icon: Moon,
    preview: "bg-[#050816]",
    previewCard: "bg-white/10 border-white/10",
    previewAccent: "from-violet-600 to-cyan-500",
  },
  {
    value: "light",
    label: "Light Theme",
    description: "A premium light take on the same CareerLens AI brand.",
    icon: Sun,
    preview: "bg-[#f4f2fb]",
    previewCard: "bg-white border-[rgba(91,61,173,0.16)]",
    previewAccent: "from-violet-600 to-cyan-500",
  },
];

export default function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="flex items-center gap-3 mb-6">
        <Palette className="text-orange-400" size={28} />
        <h2 className="text-2xl font-bold text-white">Appearance</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = theme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={`
                text-left rounded-2xl border p-5 transition
                ${active
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-white/10 hover:bg-white/10"}
              `}
            >
              {/* Mini preview swatch */}
              <div className={`rounded-xl border p-3 mb-4 ${option.preview} ${active ? "border-violet-500/50" : "border-white/10"}`}>
                <div className={`rounded-lg border p-3 ${option.previewCard}`}>
                  <div className={`h-2 w-1/2 rounded-full bg-gradient-to-r ${option.previewAccent}`} />
                  <div className="h-1.5 w-3/4 rounded-full bg-current opacity-20 mt-2" />
                  <div className="h-1.5 w-1/2 rounded-full bg-current opacity-20 mt-1.5" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={18} className="text-white" />
                  <span className="text-white font-semibold">{option.label}</span>
                </div>

                {active && (
                  <span className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </span>
                )}
              </div>

              <p className="text-gray-400 text-sm mt-1.5">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
