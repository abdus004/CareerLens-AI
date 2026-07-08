import DashboardCard from "../common/DashboardCard";

export default function WelcomeCard() {

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

              {" "}Abdus Salaam 👋

            </span>

          </h1>

          <p className="text-gray-400 mt-1">

            Welcome back to CareerLens AI. Let's build your future today.

          </p>

        </div>

        <div
          className="
            hidden
            md:flex
            flex-col
            items-end
          "
        >

          <span className="text-white font-semibold">

            {new Date().toLocaleDateString("en-IN",{

              day:"numeric",

              month:"long",

              year:"numeric"

            })}

          </span>

          <span className="text-gray-400 text-sm">

            Stay Consistent 🚀

          </span>

        </div>

      </div>

    </DashboardCard>

  );

}