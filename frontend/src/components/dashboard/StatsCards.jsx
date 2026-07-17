import {
  FolderOpen,
  Award,
  Code2,
  UserCircle2,
} from "lucide-react";

import DashboardCard from "../common/DashboardCard";

const stats = [
  {
    title: "Projects",
    value: "04",
    subtitle: "+1 This Month",
    icon: FolderOpen,
    color: "text-cyan-400",
  },
  {
    title: "Certificates",
    value: "07",
    subtitle: "Google • AWS",
    icon: Award,
    color: "text-yellow-400",
  },
  {
    title: "Skills",
    value: "15",
    subtitle: "Advanced",
    icon: Code2,
    color: "text-green-400",
  },
  {
    title: "Profile",
    value: "87%",
    subtitle: "Excellent",
    icon: UserCircle2,
    color: "text-violet-400",
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">

      {stats.map((item) => {

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