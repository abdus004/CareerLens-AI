import {
  Activity,
  ArrowRight,
  FileText,
  FolderOpen,
  Award,
  TrendingUp,
} from "lucide-react";

import DashboardCard from "../common/DashboardCard";

const activities = [
  {
    icon: <TrendingUp size={18} className="text-green-400" />,
    title: "Career Match increased to 91%",
    time: "10 min ago",
  },
  {
    icon: <FileText size={18} className="text-cyan-400" />,
    title: "Resume updated successfully",
    time: "2 hours ago",
  },
  {
    icon: <Award size={18} className="text-yellow-400" />,
    title: "AWS Cloud Certificate added",
    time: "Yesterday",
  },
  {
    icon: <FolderOpen size={18} className="text-violet-400" />,
    title: "CareerLens AI project uploaded",
    time: "2 days ago",
  },
];

export default function RecentActivity() {

  return (

    <DashboardCard
      title="Recent Activity"
      subtitle="Latest updates"
      icon={<Activity size={22} />}
    >

      <div className="space-y-4">

        {activities.map((item, index) => (

          <div
            key={index}
            className="
              flex
              items-center
              justify-between
              rounded-xl
              bg-white/5
              border
              border-white/10
              p-4
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-[#111827]
                  flex
                  items-center
                  justify-center
                "
              >

                {item.icon}

              </div>

              <div>

                <h3 className="text-white text-sm font-medium">

                  {item.title}

                </h3>

                <p className="text-xs text-gray-500 mt-1">

                  {item.time}

                </p>

              </div>

            </div>

          </div>

        ))}

      </div>

      <div
        className="
          mt-6
          pt-4
          border-t
          border-white/10
          flex
          justify-end
        "
      >

        <button
          className="
            flex
            items-center
            gap-2
            text-violet-400
            hover:text-violet-300
            transition-all
          "
        >

          View History

          <ArrowRight size={16} />

        </button>

      </div>

    </DashboardCard>

  );

}