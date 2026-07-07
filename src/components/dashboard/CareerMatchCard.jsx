import { ArrowRight, Briefcase } from "lucide-react";

export default function CareerMatchCard({

  score = 91,

  career = "AI Engineer",

}) {

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  const offset =
    circumference -
    (score / 100) * circumference;

  return (

    <div
      className="
        rounded-3xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-xl
        p-7
      "
    >

      {/* Heading */}

      <div className="flex justify-between items-center">

        <div>

          <h2 className="text-2xl font-bold text-white">

            Career Match

          </h2>

          <p className="text-gray-400 mt-1">

            Based on your profile

          </p>

        </div>

        <div
          className="
            w-12
            h-12
            rounded-xl
            bg-violet-600/20
            flex
            items-center
            justify-center
          "
        >

          <Briefcase
            className="text-violet-400"
            size={24}
          />

        </div>

      </div>

      {/* Circle */}

      <div className="flex justify-center mt-8">

        <div className="relative w-40 h-40">

          <svg
            width="160"
            height="160"
            className="-rotate-90"
          >

            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#2A2E45"
              strokeWidth="12"
              fill="none"
            />

            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#8B5CF6"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />

          </svg>

          <div
            className="
              absolute
              inset-0
              flex
              flex-col
              items-center
              justify-center
            "
          >

            <h1 className="text-4xl font-bold text-white">

              {score}%

            </h1>

            <p className="text-gray-400 text-sm">

              Match

            </p>

          </div>

        </div>

      </div>

      {/* Recommendation */}

      <div
        className="
          mt-8
          rounded-2xl
          bg-[#0B1023]
          p-5
          border
          border-white/10
        "
      >

        <p className="text-gray-400 text-sm">

          Best Career

        </p>

        <h2 className="text-white text-xl font-bold mt-2">

          {career}

        </h2>

      </div>

      {/* Button */}

      <button
        className="
          w-full
          mt-6
          py-3
          rounded-2xl
          bg-gradient-to-r
          from-violet-600
          to-fuchsia-600
          text-white
          font-semibold
          flex
          items-center
          justify-center
          gap-2
          hover:scale-[1.02]
          transition-all
        "
      >

        View Details

        <ArrowRight size={18} />

      </button>

    </div>

  );

}