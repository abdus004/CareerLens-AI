import {
  Briefcase,
  ArrowRight,
  MapPin,
  Building2,
} from "lucide-react";

import DashboardCard from "../common/DashboardCard";

const opportunities = [
  {
    company: "Google",
    role: "AI Engineer Intern",
    location: "Bangalore",
    match: 96,
  },
  {
    company: "Microsoft",
    role: "Software Engineer Intern",
    location: "Hyderabad",
    match: 91,
  },
  {
    company: "Infosys",
    role: "Data Analyst Intern",
    location: "Chennai",
    match: 88,
  },
  {
    company: "Zoho",
    role: "Backend Developer",
    location: "Chennai",
    match: 84,
  },
];

export default function Opportunities() {

  return (

    <DashboardCard
      title="Opportunities"
      subtitle="Recommended for you"
      icon={<Briefcase size={22} />}
    >

      <div className="space-y-4">

        {opportunities.map((job) => (

          <div
            key={job.company + job.role}
            className="
              rounded-xl
              bg-white/5
              border
              border-white/10
              p-4
            "
          >

            <div className="flex justify-between">

              <div>

                <h3 className="text-white font-semibold">

                  {job.role}

                </h3>

                <div className="flex items-center gap-2 mt-1">

                  <Building2
                    size={14}
                    className="text-gray-400"
                  />

                  <span className="text-gray-400 text-sm">

                    {job.company}

                  </span>

                </div>

                <div className="flex items-center gap-2 mt-1">

                  <MapPin
                    size={14}
                    className="text-gray-400"
                  />

                  <span className="text-gray-400 text-sm">

                    {job.location}

                  </span>

                </div>

              </div>

              <div className="text-right">

                <p className="text-green-400 font-bold">

                  {job.match}%

                </p>

                <p className="text-xs text-gray-500">

                  Match

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
          "
        >

          Explore Jobs

          <ArrowRight size={16} />

        </button>

      </div>

    </DashboardCard>

  );

}