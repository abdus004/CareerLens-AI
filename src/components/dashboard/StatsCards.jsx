import {
  FolderOpen,
  Award,
  Code2,
  UserCircle2,
} from "lucide-react";

const cards = [
  {
    title: "Projects",
    value: 4,
    subtitle: "+1 this month",
    icon: FolderOpen,
    color: "from-cyan-500 to-blue-500",
  },
  {
    title: "Certificates",
    value: 7,
    subtitle: "+2 this month",
    icon: Award,
    color: "from-yellow-500 to-orange-500",
  },
  {
    title: "Skills",
    value: 15,
    subtitle: "Advanced",
    icon: Code2,
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Profile Strength",
    value: "87%",
    subtitle: "Excellent",
    icon: UserCircle2,
    color: "from-violet-600 to-fuchsia-600",
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

      {cards.map((card) => {

        const Icon = card.icon;

        return (

          <div
            key={card.title}
            className="
              rounded-3xl
              border
              border-white/10
              bg-white/5
              backdrop-blur-xl
              p-6
              transition-all
              duration-300
              hover:border-violet-500
              hover:-translate-y-1
            "
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-gray-400 text-sm">

                  {card.title}

                </p>

                <h2 className="text-4xl font-bold text-white mt-2">

                  {card.value}

                </h2>

                <p className="text-sm text-violet-400 mt-3">

                  {card.subtitle}

                </p>

              </div>

              <div
                className={`
                  w-14
                  h-14
                  rounded-2xl
                  bg-gradient-to-r
                  ${card.color}
                  flex
                  items-center
                  justify-center
                `}
              >

                <Icon
                  size={28}
                  className="text-white"
                />

              </div>

            </div>

          </div>

        );

      })}

    </div>
  );
}