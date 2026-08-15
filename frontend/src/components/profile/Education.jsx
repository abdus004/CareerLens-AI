import { useState } from "react";
import InputField from "../InputField";
import { useProfile } from "../../context/ProfileContext";
import {
  ACADEMIC_YEARS,
  validateCGPA,
  validateAcademicYear,
  validateExperienceYears,
} from "../../utils/validators";

const isJobSeeker = (userType) => userType === "Job Seeker";

export default function Education({ userType, onNext, onBack }) {
  const { profileData, updateProfile } = useProfile();

  const [college, setCollege] = useState(profileData.college || "");
  const [degree, setDegree] = useState(
    profileData.degree && degreesList().includes(profileData.degree)
      ? profileData.degree
      : profileData.degree
      ? "Other"
      : ""
  );
  const [otherDegree, setOtherDegree] = useState(
    profileData.degree && !degreesList().includes(profileData.degree)
      ? profileData.degree
      : ""
  );
  const [branch, setBranch] = useState(profileData.department || "");
  const [academicYear, setAcademicYear] = useState(
    ACADEMIC_YEARS.includes(profileData.year) ? profileData.year : ""
  );
  const [cgpa, setCgpa] = useState(profileData.cgpa || "");
  const [experienceYears, setExperienceYears] = useState(
    profileData.experience_years !== undefined && profileData.experience_years !== null
      ? String(profileData.experience_years)
      : ""
  );
  const [error, setError] = useState("");

  function degreesList() {
    return ["B.E", "B.Tech", "B.Sc", "BCA", "M.E", "M.Tech", "MCA", "M.Sc"];
  }

  const degrees = [...degreesList(), "Other"];
  const jobSeeker = isJobSeeker(userType);

  const handleNext = () => {
    if (!college.trim()) {
      setError(
        jobSeeker
          ? "Please enter your highest qualification."
          : "Please enter your college."
      );
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

    if (jobSeeker) {
      const expError = validateExperienceYears(experienceYears);
      if (expError) {
        setError(expError);
        return;
      }
    } else {
      const yearError = validateAcademicYear(academicYear);
      if (yearError) {
        setError("Please select your current academic year.");
        return;
      }

      const cgpaError = validateCGPA(cgpa);
      if (cgpaError) {
        setError(cgpaError);
        return;
      }
    }

    setError("");

    updateProfile({
      college,
      department: branch,
      degree: degree === "Other" ? otherDegree : degree,
      // Job Seekers never carry a stale CGPA/academic year - and vice
      // versa - so switching user_type earlier in the wizard (via
      // Back) can't leave a mismatched value behind.
      year: jobSeeker ? "" : academicYear,
      cgpa: jobSeeker ? "" : String(cgpa),
      experience_years: jobSeeker ? Number(experienceYears) : null,
    });

    onNext();
  };

  return (
    <div>
      {/* College/Qualification + Branch */}
      <div className="grid md:grid-cols-2 gap-6">
        <InputField
  label={jobSeeker ? "College / University *" : "College Name *"}
  type="text"
  placeholder={jobSeeker ? "Institution you graduated from" : "Enter your college"}
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
      <h3 className="text-white font-semibold mt-8 mb-4">Degree *</h3>

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
      )}

      {/* Student: Academic Year + CGPA / Job Seeker: Years of Experience */}
      {jobSeeker ? (
        <div className="mt-10">
          <InputField
            label="Years of Experience *"
            type="number"
            placeholder="Example: 2.5"
            value={experienceYears}
            onChange={(e) => {
              setExperienceYears(e.target.value);
              setError("");
            }}
          />
          <p className="text-gray-500 text-sm mt-2">
            Enter 0 if you're a fresher actively job-hunting.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <div>
            <label className="block text-white mb-2 font-medium">
              Academic Year *
            </label>
            <select
              value={academicYear}
              onChange={(e) => {
                setAcademicYear(e.target.value);
                setError("");
              }}
              className="
                w-full
                rounded-2xl
                border
                border-white/10
                bg-white/5
                px-5
                py-4
                text-white
                outline-none
                focus:border-violet-500
              "
            >
              <option value="" className="bg-[#0b0f1f]">
                Select your year
              </option>
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y} className="bg-[#0b0f1f]">
                  {y}
                </option>
              ))}
            </select>
          </div>

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
      )}

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
