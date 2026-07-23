import { createContext, useContext, useState } from "react";

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profileData, setProfileData] = useState({
    userType: "",

    full_name: "",
    email: "",
    phone: "",
    gender: "",
    age: "",

    linkedin: "",
    github: "",

    college: "",
    department: "",
    degree: "",
    year: "",
    cgpa: "",

    career_goal: [],
    skills: [],
    interests: [],

    resume_url: "",
resume: null,
  });

  const updateProfile = (newData) => {
    setProfileData((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  return (
    <ProfileContext.Provider
      value={{
        profileData,
        updateProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);