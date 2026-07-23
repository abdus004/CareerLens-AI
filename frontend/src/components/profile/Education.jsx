import { useState } from "react";
import InputField from "../InputField";
import { useProfile } from "../../context/ProfileContext";

export default function Education({
  userType,
  onNext,
  onBack,
}) {

  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("");
  const [otherDegree, setOtherDegree] = useState("");
  const [branch, setBranch] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [error, setError] = useState("");
  const { updateProfile } = useProfile();

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

const handleNext = () => {

  if (!college.trim()) {
    setError("Please enter your college.");
    return;
  }

  if (!branch.trim()) {
    setError("Please enter your department.");
    return;
  }

  if (!degree) {
    setError("Please select your degree.");
    return;
  }

  if (degree === "Other" && !otherDegree.trim()) {
    setError("Please specify your degree.");
    return;
  }

  if (!graduationYear.trim()) {
    setError("Please enter your graduation year.");
    return;
  }

  if (!cgpa.trim()) {
    setError("Please enter your CGPA.");
    return;
  }

  updateProfile({
    college,
    department: branch,
    degree: degree === "Other" ? otherDegree : degree,
    year: graduationYear,
    cgpa,
  });

  onNext();
};

  return (

    <div>

      {/* College + Branch */}

      <div className="grid md:grid-cols-2 gap-6">

        <InputField
          label={
            userType === "Student"
              ? "College Name *"
              : "Highest Qualification *"
          }
          type="text"
          placeholder={
            userType === "Student"
              ? "Enter your college"
              : "Enter your qualification"
          }
          value={college}
          onChange={(e) => {
            setCollege(e.target.value);
            setError("");
          }}
        />

        <InputField
          label="Branch / Department *"
          type="text"
          placeholder="Example: AI & DS"
          value={branch}
          onChange={(e) => {
            setBranch(e.target.value);
            setError("");
          }}
        />

      </div>

      {/* Degree */}

      <h3 className="text-white font-semibold mt-8 mb-4">

        Degree *

      </h3>

      <div className="grid md:grid-cols-5 grid-cols-3 gap-4">

        {degrees.map((item) => (

          <button
            key={item}
            type="button"
            onClick={() => {
              setDegree(item);
              setError("");
            }}
            className={`
              py-3
              rounded-2xl
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

      {degree === "Other" && (

        <div className="mt-6">

          <InputField
            label="Specify Degree"
            type="text"
            placeholder="Enter your degree"
            value={otherDegree}
            onChange={(e) => {
              setOtherDegree(e.target.value);
              setError("");
            }}
          />

        </div>

      )}      {/* Graduation Year + CGPA */}

      <div className="grid md:grid-cols-2 gap-6 mt-10">

        <InputField
          label="Graduation Year *"
          type="number"
          placeholder="Example: 2027"
          value={graduationYear}
          onChange={(e) => {
            setGraduationYear(e.target.value);
            setError("");
          }}
        />

        <InputField
          label="CGPA *"
          type="number"
          placeholder="Example: 8.75"
          value={cgpa}
          onChange={(e) => {
            setCgpa(e.target.value);
            setError("");
          }}
        />

      </div>

      {/* Error Message */}

      {error && (

        <div
          className="
            mt-8
            rounded-2xl
            border
            border-red-500/30
            bg-red-500/10
            px-5
            py-4
            text-red-300
          "
        >

          {error}

        </div>

      )}

      {/* Navigation Buttons */}

      <div className="flex justify-between mt-12">

        <button
          onClick={onBack}
          className="
            px-8
            py-3
            rounded-2xl
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
          onClick={handleNext}
          className="
            px-10
            py-3
            rounded-2xl
            bg-gradient-to-r
            from-violet-600
            via-fuchsia-600
            to-cyan-500
            text-white
            font-semibold
            hover:scale-[1.02]
            transition
          "
        >
          Continue →
        </button>

      </div>

    </div>

  );

}