import {
  FolderOpen,
  Briefcase,
  Code2,
  UserCircle2,
} from "lucide-react";

import DashboardCard from "../common/DashboardCard";

export default function StatsCards({ stats }) {

  const items = [
    {
      title: "Projects",
      value: stats ? String(stats.projects_count) : "--",
      subtitle: "Portfolio + Resume",
      icon: FolderOpen,
      color: "text-cyan-400",
    },
    {
      title: "Internships",
      value: stats ? String(stats.internships_count) : "--",
      subtitle: "Portfolio + Resume",
      icon: Briefcase,
      color: "text-yellow-400",
    },
    {
      title: "Skills",
      value: stats ? String(stats.skills_count) : "--",
      subtitle: "Detected across profile",
      icon: Code2,
      color: "text-green-400",
    },
    {
      title: "Profile",
      value: stats ? `${stats.profile_strength}%` : "--",
      subtitle:
        stats && stats.profile_strength >= 80
          ? "Excellent"
          : stats && stats.profile_strength >= 50
          ? "Good"
          : "Needs Work",
      icon: UserCircle2,
      color: "text-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">

      {items.map((item) => {

        const Icon = item.icon;

        return (

          <DashboardCard
            key={item.title}
            className="p-4"
          >

            <div className="flex justify-between items-start">

              <div>

                <p className="text-gray-400 text-sm">

                  {item.title}

                </p>

                <h2 className="text-3xl font-bold text-white mt-2">

                  {item.value}

                </h2>

                <p className="text-xs text-gray-500 mt-2">

                  {item.subtitle}

                </p>

              </div>

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-white/5
                  flex
                  items-center
                  justify-center
                "
              >

                <Icon
                  size={22}
                  className={item.color}
                />

              </div>

            </div>

          </DashboardCard>

        );

      })}

    </div>
  );
}