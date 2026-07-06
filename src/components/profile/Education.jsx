import { useState } from "react";
import InputField from "../InputField";

export default function Education({
  userType,
  onNext,
  onBack,
}) {
  const [degree, setDegree] = useState("");

  const degrees = [
    "B.E",
    "B.Tech",
    "B.Sc",
    "BCA",
    "M.E",
    "M.Tech",
    "MCA",
    "M.Sc",
    "Other",
  ];

  return (
    <div>

      {/* First Field */}

      <InputField
        label={
          userType === "Student"
            ? "College Name"
            : "Highest Qualification"
        }
        type="text"
        placeholder={
          userType === "Student"
            ? "Enter your college name"
            : "Enter your qualification"
        }
      />

      {/* Degree */}

      <h3 className="text-white font-semibold mt-6 mb-4">
        Degree
      </h3>

      <div className="grid grid-cols-3 gap-3">

        {degrees.map((item) => (

          <button
            key={item}
            onClick={() => setDegree(item)}
            className={`
              py-3
              rounded-xl
              border
              transition-all
              ${
                degree === item
                  ? "border-violet-500 bg-violet-500/20 text-white"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-violet-400"
              }
            `}
          >
            {item}
          </button>

        ))}

      </div>

      {/* Other Degree */}

      {degree === "Other" && (

        <div className="mt-5">

          <InputField
            label="Specify Degree"
            type="text"
            placeholder="Enter your degree"
          />

        </div>

      )}

      {/* Branch */}

      <InputField
        label="Branch / Department"
        type="text"
        placeholder="Example: AI & DS"
      />

      {/* Year */}

      <InputField
        label={
          userType === "Student"
            ? "Current Year"
            : "Graduation Year"
        }
        type="number"
        placeholder={
          userType === "Student"
            ? "Enter current year"
            : "Enter graduation year"
        }
      />

      {/* CGPA */}

      <InputField
        label="CGPA"
        type="number"
        placeholder="Example: 8.45"
      />

      {/* Buttons */}

      <div className="flex justify-between mt-10">

        <button
          onClick={onBack}
          className="
            px-8
            py-3
            rounded-xl
            border
            border-white/10
            bg-white/5
            text-white
            hover:bg-white/10
            transition
          "
        >
          ← Back
        </button>

        <button
          onClick={onNext}
          className="
            px-8
            py-3
            rounded-xl
            bg-gradient-to-r
            from-violet-600
            to-fuchsia-600
            text-white
            font-semibold
            hover:scale-105
            transition
          "
        >
          Next →
        </button>

      </div>

    </div>
  );
}