import { useState } from "react";
import InputField from "../InputField";

export default function Education({
  userType,
  onNext,
  onBack,
}) {
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("");
  const [otherDegree, setOtherDegree] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [error, setError] = useState("");

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
      setError(
        userType === "Student"
          ? "Please enter your college name."
          : "Please enter your qualification."
      );
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

    if (!branch.trim()) {
      setError("Please enter your branch.");
      return;
    }

    if (!year) {
      setError(
        userType === "Student"
          ? "Please enter your current year."
          : "Please enter your graduation year."
      );
      return;
    }

    if (!cgpa) {
      setError("Please enter your CGPA.");
      return;
    }

    setError("");
    onNext();
  };

  return (
    <div>

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
        value={college}
        onChange={(e) => {
          setCollege(e.target.value);
          setError("");
        }}
      />

      <h3 className="text-white font-semibold mt-6 mb-4">
        Degree
      </h3>

      <div className="grid grid-cols-3 gap-3">

        {degrees.map((item) => (

          <button
            type="button"
            key={item}
            onClick={() => {
              setDegree(item);
              setError("");
            }}
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

      {degree === "Other" && (

        <div className="mt-5">

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

      )}

      <InputField
        label="Branch / Department"
        type="text"
        placeholder="Example: AI & DS"
        value={branch}
        onChange={(e) => {
          setBranch(e.target.value);
          setError("");
        }}
      />

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
        value={year}
        onChange={(e) => {
          setYear(e.target.value);
          setError("");
        }}
      />

      <InputField
        label="CGPA"
        type="number"
        placeholder="Example: 8.45"
        value={cgpa}
        onChange={(e) => {
          setCgpa(e.target.value);
          setError("");
        }}
      />

      {error && (
        <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

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
          onClick={handleNext}
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