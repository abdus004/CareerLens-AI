import DashboardCard from "../common/DashboardCard";

export default function WelcomeCard({ profile }) {

  const hour = new Date().getHours();

  let greeting = "Good Evening";

  if (hour < 12) {
    greeting = "Good Morning";
  } else if (hour < 17) {
    greeting = "Good Afternoon";
  } else if (hour < 21) {
    greeting = "Good Evening";
  } else {
    greeting = "Good Night";
  }

  return (
    <DashboardCard className="py-4">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold text-white">
            {greeting},

            <span className="text-violet-400">
              {" "}
              {profile?.full_name || "User"} 👋
            </span>

          </h1>

          <p className="text-gray-400 mt-1">
            {profile
              ? `${profile.degree} • ${profile.college}`
              : "Loading profile..."}
          </p>

        </div>

        <div className="hidden md:flex flex-col items-end">

          <span className="text-white font-semibold">
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>

          <span className="text-gray-400 text-sm">
            CGPA : {profile?.cgpa || "--"}
          </span>

        </div>

      </div>

    </DashboardCard>
  );
}