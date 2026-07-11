import DashboardLayout from "../components/dashboard/DashboardLayout";
import {
  User,
  Lock,
  Palette,
} from "lucide-react";

export default function Settings() {

  return (

    <DashboardLayout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-white">

          Settings

        </h1>

        <p className="text-gray-400 mt-2">

          Manage your CareerLens AI account and preferences.

        </p>

      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Profile */}

        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-8
          "
        >

          <div className="flex items-center gap-3 mb-6">

            <User
              className="text-cyan-400"
              size={28}
            />

            <h2 className="text-2xl font-bold text-white">

              Profile

            </h2>

          </div>

          <div className="space-y-5">

            <div>

              <label className="text-gray-400">

                Full Name

              </label>

              <input
                type="text"
                value="Abdus Salaam"
                className="
                  mt-2
                  w-full
                  rounded-xl
                  bg-[#0B1120]
                  border
                  border-white/10
                  p-3
                  text-white
                  outline-none
                "
                readOnly
              />

            </div>

            <div>

              <label className="text-gray-400">

                Email

              </label>

              <input
                type="email"
                value="example@email.com"
                className="
                  mt-2
                  w-full
                  rounded-xl
                  bg-[#0B1120]
                  border
                  border-white/10
                  p-3
                  text-white
                  outline-none
                "
                readOnly
              />

            </div>

            <button
              className="
                mt-4
                px-6
                py-3
                rounded-xl
                bg-cyan-500
                hover:bg-cyan-600
                transition
                text-white
                font-semibold
              "
            >

              Edit Profile

            </button>

          </div>

        </div>

        {/* Account */}

        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-8
          "
        >

          <div className="flex items-center gap-3 mb-6">

            <Lock
              className="text-violet-400"
              size={28}
            />

            <h2 className="text-2xl font-bold text-white">

              Account

            </h2>

          </div>

          <div className="space-y-4">

            <button
              className="
                w-full
                py-3
                rounded-xl
                bg-violet-600
                hover:bg-violet-700
                text-white
                transition
              "
            >

              Change Password

            </button>

            <button
              className="
                w-full
                py-3
                rounded-xl
                bg-red-600
                hover:bg-red-700
                text-white
                transition
              "
            >

              Delete Account

            </button>

          </div>

        </div>

      </div>

      {/* Continue Here */}

              {/* Appearance */}

        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-8
          "
        >

          <div className="flex items-center gap-3 mb-6">

            <Palette
              className="text-orange-400"
              size={28}
            />

            <h2 className="text-2xl font-bold text-white">

              Appearance

            </h2>

          </div>

          <div className="space-y-5">

            <button
              className="
                w-full
                py-3
                rounded-xl
                bg-cyan-500
                hover:bg-cyan-600
                transition
                text-white
                font-semibold
              "
            >

              Dark Mode

            </button>

            <button
              className="
                w-full
                py-3
                rounded-xl
                border
                border-white/10
                text-white
                hover:bg-white/10
                transition
              "
            >

              Light Mode

            </button>

          </div>

        </div>

        {/* Notifications */}

        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-8
          "
        >

          <h2 className="text-2xl font-bold text-white mb-6">

            Notifications

          </h2>

          <div className="space-y-5">

            {[
              "Email Notifications",
              "Job Alerts",
              "Internship Alerts",
              "AI Tips",
            ].map((item) => (

              <div
                key={item}
                className="
                  flex
                  justify-between
                  items-center
                  border-b
                  border-white/10
                  pb-4
                "
              >

                <span className="text-gray-300">

                  {item}

                </span>

                <input
                  type="checkbox"
                  defaultChecked
                  className="
                    w-5
                    h-5
                    accent-cyan-500
                  "
                />

              </div>

            ))}

          </div>

        </div>

     

      {/* Continue Here */}      
      
      {/* AI Preferences + Data */}

      <div className="grid lg:grid-cols-2 gap-6 mt-8">

        {/* AI Preferences */}

        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-8
          "
        >

          <h2 className="text-2xl font-bold text-white mb-6">

            AI Preferences

          </h2>

          <div className="space-y-5">

            <div>

              <label className="text-gray-400">

                Target Career

              </label>

              <select
                className="
                  mt-2
                  w-full
                  rounded-xl
                  bg-[#0B1120]
                  border
                  border-white/10
                  p-3
                  text-white
                  outline-none
                "
              >

                <option>AI Engineer</option>
                <option>Machine Learning Engineer</option>
                <option>Data Scientist</option>
                <option>Software Engineer</option>

              </select>

            </div>

            <div>

              <label className="text-gray-400">

                Daily Study Goal

              </label>

              <select
                className="
                  mt-2
                  w-full
                  rounded-xl
                  bg-[#0B1120]
                  border
                  border-white/10
                  p-3
                  text-white
                  outline-none
                "
              >

                <option>1 Hour</option>
                <option>2 Hours</option>
                <option>3 Hours</option>
                <option>4+ Hours</option>

              </select>

            </div>

          </div>

        </div>

        {/* Data & Privacy */}

        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/5
            p-8
          "
        >

          <h2 className="text-2xl font-bold text-white mb-6">

            Data & Privacy

          </h2>

          <div className="space-y-4">

            <button
              className="
                w-full
                py-3
                rounded-xl
                bg-cyan-500
                hover:bg-cyan-600
                transition
                text-white
                font-semibold
              "
            >

              Upload New Resume

            </button>

            <button
              className="
                w-full
                py-3
                rounded-xl
                border
                border-white/10
                hover:bg-white/10
                transition
                text-white
              "
            >

              Download Resume

            </button>

            <button
              className="
                w-full
                py-3
                rounded-xl
                border
                border-red-500/30
                text-red-400
                hover:bg-red-500/10
                transition
              "
            >

              Clear AI History

            </button>

          </div>

        </div>

      </div>

      {/* Save Settings */}

      <div className="mt-8 flex justify-end">

        <button
          className="
            px-8
            py-4
            rounded-2xl
            bg-gradient-to-r
            from-violet-600
            to-cyan-500
            hover:opacity-90
            transition
            text-white
            font-bold
          "
        >

          Save Settings

        </button>

      </div>

    </DashboardLayout>

  );

}