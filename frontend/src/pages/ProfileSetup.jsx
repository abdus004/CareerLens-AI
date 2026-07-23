import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ProfileLayout from "../components/profile/ProfileLayout";
import UserType from "../components/profile/UserType";
import BasicInfo from "../components/profile/BasicInfo";
import Education from "../components/profile/Education";
import CareerInterest from "../components/profile/CareerInterest";
import Skills from "../components/profile/Skills";
import ResumeUpload from "../components/profile/ResumeUpload";

export default function ProfileSetup() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const totalSteps = 6;

  const [userType, setUserType] = useState("");

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
            onNext={(type) => {
              setUserType(type);
              nextStep();
            }}
          />
        );

      case 2:
        return (
          <BasicInfo
            onNext={nextStep}
            onBack={previousStep}
          />
        );

      case 3:
        return (
          <Education
            userType={userType}
            onNext={nextStep}
            onBack={previousStep}
          />
        );

      case 4:
        return (
          <CareerInterest
            onNext={nextStep}
            onBack={previousStep}
          />
        );

      case 5:
        return (
          <Skills
            onNext={nextStep}
            onBack={previousStep}
          />
        );

      case 6:
        return (
          <ResumeUpload
            onNext={nextStep}
            onBack={previousStep}
          />
        );

      default:
        return null;
    }
  };

  const titles = [
    "",
    "Choose Your Profile",
    "Basic Information",
    "Education Details",
    "Career Interests",
    "Skills",
    "Resume Upload",
  ];

  const subtitles = [
    "",
    "Tell us who you are.",
    "Let's get to know you.",
    "Share your educational background.",
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