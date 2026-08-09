import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ProfileLayout from "../components/profile/ProfileLayout";
import UserType from "../components/profile/UserType";
import BasicInfo from "../components/profile/BasicInfo";
import Education from "../components/profile/Education";
import CareerInterest from "../components/profile/CareerInterest";
import Skills from "../components/profile/Skills";
import ResumeUpload from "../components/profile/ResumeUpload";
import { useProfile } from "../context/ProfileContext";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { profileData, updateProfile } = useProfile();

  const [step, setStep] = useState(1);
  const totalSteps = 6;

  const nextStep = () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    } else {
      navigate("/dashboard");
    }
  };

  const previousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <UserType
            defaultValue={profileData.user_type}
            onNext={(type) => {
              // Persisted into the shared ProfileContext (not local
              // component state) so it's actually included in the
              // payload ResumeUpload.jsx sends to POST /profile/ at
              // the end of the wizard - previously this selection was
              // only ever passed as a prop to the Education step for
              // a label swap, and was silently discarded otherwise.
              updateProfile({ user_type: type });
              nextStep();
            }}
          />
        );

      case 2:
        return <BasicInfo onNext={nextStep} onBack={previousStep} />;

      case 3:
        return (
          <Education
            userType={profileData.user_type}
            onNext={nextStep}
            onBack={previousStep}
          />
        );

      case 4:
        return <CareerInterest onNext={nextStep} onBack={previousStep} />;

      case 5:
        return <Skills onNext={nextStep} onBack={previousStep} />;

      case 6:
        return <ResumeUpload onNext={nextStep} onBack={previousStep} />;

      default:
        return null;
    }
  };

  const titles = [
    "",
    "Choose Your Profile",
    "Basic Information",
    profileData.user_type === "Job Seeker"
      ? "Professional Background"
      : "Education Details",
    "Career Interests",
    "Skills",
    "Resume Upload",
  ];

  const subtitles = [
    "",
    "Tell us who you are.",
    "Let's get to know you.",
    profileData.user_type === "Job Seeker"
      ? "Share your professional experience."
      : "Share your educational background.",
    "Select the roles you're interested in.",
    "Choose your technical skills.",
    "Upload your resume (Optional).",
  ];

  return (
    <ProfileLayout
      title={titles[step]}
      subtitle={subtitles[step]}
      step={step}
      totalSteps={totalSteps}
    >
      {renderStep()}
    </ProfileLayout>
  );
}
