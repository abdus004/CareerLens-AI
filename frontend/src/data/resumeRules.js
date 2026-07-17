const resumeRules = {
  personalDetails: {
    weight: 10,
    required: [
      "Full Name",
      "Email",
      "Phone",
      "LinkedIn",
      "GitHub",
    ],
  },

  education: {
    weight: 10,
  },

  skills: {
    weight: 20,
    minimum: 5,
  },

  projects: {
    weight: 20,
    minimum: 3,
  },

  internships: {
    weight: 15,
    minimum: 1,
  },

  certifications: {
    weight: 10,
    minimum: 5,
  },

  resumeUpload: {
    weight: 10,
  },

  atsKeywords: {
    weight: 5,
  },
};

export default resumeRules;