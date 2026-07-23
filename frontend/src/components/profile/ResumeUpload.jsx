import { useState } from "react";
import InputField from "../InputField";
import { useProfile } from "../../context/ProfileContext";
import api from "../../services/api";

export default function Portfolio({ onNext, onBack }) {

  const [projectName, setProjectName] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [liveLink, setLiveLink] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const [internshipRole, setInternshipRole] = useState("");
  const [company, setCompany] = useState("");
  const [duration, setDuration] = useState("");
  const [internshipCertificate, setInternshipCertificate] =
    useState(null);

  const [certificateName, setCertificateName] =
    useState("");
  const [organization, setOrganization] =
    useState("");
  const [issueYear, setIssueYear] =
    useState("");
  const [certificateFile, setCertificateFile] =
    useState(null);

  const [resume, setResume] =
    useState(null);
  const { updateProfile, profileData } = useProfile();

  const handleFinish = async () => {
  try {
    // -------------------------------
    // STEP 1 - Save Profile
    // -------------------------------
    const finalProfile = {
      ...profileData,
      resume_url: "",
    };

    await api.post("/profile/", finalProfile);

    let fileUrl = "";

    // -------------------------------
    // STEP 2 - Upload Resume (Optional)
    // -------------------------------
    if (resume) {
      const formData = new FormData();

      formData.append("email", profileData.email);
      formData.append("file", resume);

      const uploadResponse = await api.post(
        "/resume/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      fileUrl =
        uploadResponse.data.resume_url ||
        uploadResponse.data.file_url ||
        "";

      finalProfile.resume_url = fileUrl;
    }

    // -------------------------------
    // STEP 3 - Update Context
    // -------------------------------
    updateProfile(finalProfile);

    // -------------------------------
    // STEP 4 - Go Dashboard
    // -------------------------------
    onNext();

  } catch (error) {
    console.error("Resume Upload Error:", error);

    if (error.response) {
      alert(error.response.data.detail);
    } else {
      alert("Something went wrong. Please try again.");
    }
  }
};

  return (

    <div className="space-y-10">

      <p className="text-gray-400">

        Everything on this page is optional.
        You can always update your portfolio later.

      </p>

      {/* ================= PROJECT ================= */}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">

        <h2 className="text-2xl font-bold text-white mb-6">

          📁 Project

        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          <InputField
            label="Project Name"
            type="text"
            placeholder="AI Resume Analyzer"
            value={projectName}
            onChange={(e)=>
              setProjectName(e.target.value)
            }
          />

          <InputField
            label="GitHub Repository"
            type="url"
            placeholder="https://github.com/..."
            value={githubLink}
            onChange={(e)=>
              setGithubLink(e.target.value)
            }
          />

        </div>

        <div className="mt-6">

          <InputField
            label="Live Demo Link"
            type="url"
            placeholder="https://yourproject.com"
            value={liveLink}
            onChange={(e)=>
              setLiveLink(e.target.value)
            }
          />

        </div>

        <div className="mt-6">

          <label className="block text-white mb-2">

            Project Description

          </label>

          <textarea

            rows="4"

            placeholder="Describe your project..."

            value={projectDescription}

            onChange={(e)=>
              setProjectDescription(e.target.value)
            }

            className="
              w-full
              rounded-2xl
              border
              border-white/10
              bg-white/5
              px-5
              py-4
              text-white
              placeholder:text-gray-500
              outline-none
              focus:border-violet-500
            "
          />

        </div>

      </div>

      {/* ================= INTERNSHIP ================= */}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">

        <h2 className="text-2xl font-bold text-white mb-6">

          💼 Internship

        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          <InputField
            label="Internship Role"
            type="text"
            placeholder="AI Intern"
            value={internshipRole}
            onChange={(e)=>
              setInternshipRole(e.target.value)
            }
          />

          <InputField
            label="Company"
            type="text"
            placeholder="Infosys"
            value={company}
            onChange={(e)=>
              setCompany(e.target.value)
            }
          />

          <InputField
            label="Duration"
            type="text"
            placeholder="2 Months"
            value={duration}
            onChange={(e)=>
              setDuration(e.target.value)
            }
          />

        </div>

        <div className="mt-6">

          <label
            className="
              flex
              justify-center
              items-center
              border-2
              border-dashed
              border-violet-500/30
              rounded-3xl
              py-10
              bg-white/5
              cursor-pointer
              hover:border-violet-500
              transition
            "
          >

            <input

              type="file"

              accept=".pdf,.jpg,.jpeg,.png"

              className="hidden"

              onChange={(e)=>{

                if(e.target.files.length>0){

                  setInternshipCertificate(
                    e.target.files[0]
                  );

                }

              }}

            />

            <span className="text-gray-300">

              Upload Internship Certificate

            </span>

          </label>

          {internshipCertificate && (

            <p className="text-green-400 mt-4">

              ✅ {internshipCertificate.name}

            </p>

          )}

        </div>

      </div>      {/* ================= CERTIFICATIONS ================= */}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">

        <h2 className="text-2xl font-bold text-white mb-6">
          🏆 Certification
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          <InputField
            label="Certificate Name"
            type="text"
            placeholder="Google Data Analytics"
            value={certificateName}
            onChange={(e) =>
              setCertificateName(e.target.value)
            }
          />

          <InputField
            label="Issued By"
            type="text"
            placeholder="Google"
            value={organization}
            onChange={(e) =>
              setOrganization(e.target.value)
            }
          />

          <InputField
            label="Issue Year"
            type="number"
            placeholder="2026"
            value={issueYear}
            onChange={(e) =>
              setIssueYear(e.target.value)
            }
          />

        </div>

        <div className="mt-6">

          <label
            className="
              flex
              justify-center
              items-center
              border-2
              border-dashed
              border-violet-500/30
              rounded-3xl
              py-10
              bg-white/5
              cursor-pointer
              hover:border-violet-500
              transition
            "
          >

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {

                if (e.target.files.length > 0) {

                  setCertificateFile(
                    e.target.files[0]
                  );

                }

              }}
            />

            <span className="text-gray-300">
              Upload Certificate
            </span>

          </label>

          {certificateFile && (

            <p className="text-green-400 mt-4">

              ✅ {certificateFile.name}

            </p>

          )}

        </div>

      </div>

      {/* ================= RESUME ================= */}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">

        <h2 className="text-2xl font-bold text-white mb-6">
          📄 Resume
        </h2>

        <label
          className="
            flex
            justify-center
            items-center
            border-2
            border-dashed
            border-violet-500/30
            rounded-3xl
            py-12
            bg-white/5
            cursor-pointer
            hover:border-violet-500
            transition
          "
        >

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {

              if (e.target.files.length > 0) {

                setResume(
                  e.target.files[0]
                );

              }

            }}
          />

          <span className="text-gray-300">

            Upload Resume

          </span>

        </label>

        {resume && (

          <p className="text-green-400 mt-4">

            ✅ {resume.name}

          </p>

        )}

      </div>

      {/* ================= BUTTONS ================= */}

      <div className="flex justify-between pt-4">

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
          onClick={handleFinish}
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
          Finish →
        </button>

      </div>

    </div>

  );

}