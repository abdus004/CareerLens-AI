import {
  Building2,
  Calendar,
  MapPin,
  ArrowRight,
} from "lucide-react";

const drives = [
  {
    company: "Google",
    role: "Software Engineer Intern",
    date: "15 Aug 2026",
    location: "Bangalore",
    status: "Open",
  },
  {
    company: "Microsoft",
    role: "SDE Intern",
    date: "22 Aug 2026",
    location: "Hyderabad",
    status: "Open",
  },
  {
    company: "Amazon",
    role: "Cloud Support Associate",
    date: "28 Aug 2026",
    location: "Chennai",
    status: "Soon",
  },
  {
    company: "Infosys",
    role: "Specialist Programmer",
    date: "5 Sep 2026",
    location: "Online",
    status: "Upcoming",
  },
];

export default function UpcomingDrives() {
  return (
    <div className="bg-[#161825] rounded-2xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Upcoming Drives
          </h2>
          <p className="text-gray-400 text-sm">
            Latest placement opportunities
          </p>
        </div>

        <button className="text-cyan-400 text-sm hover:text-cyan-300 transition">
          View All
        </button>
      </div>

      {/* Drive List */}
      <div className="space-y-4">
        {drives.map((drive, index) => (
          <div
            key={index}
            className="bg-[#1E2235] border border-white/10 rounded-xl p-5 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300"
          >
            <div className="flex justify-between">
              <div className="flex-1">
                {/* Company */}
                <div className="flex items-center gap-2">
                  <Building2
                    size={18}
                    className="text-cyan-400"
                  />

                  <h3 className="text-white font-semibold text-lg">
                    {drive.company}
                  </h3>

                  <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">
                    {drive.status}
                  </span>
                </div>

                {/* Role */}
                <p className="text-gray-400 mt-2">
                  {drive.role}
                </p>

                {/* Footer */}
                <div className="flex gap-5 mt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={15} />
                    {drive.date}
                  </div>

                  <div className="flex items-center gap-1">
                    <MapPin size={15} />
                    {drive.location}
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <button className="text-cyan-400 hover:text-cyan-300 self-start transition">
                <ArrowRight size={22} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}