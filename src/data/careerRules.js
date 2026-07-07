const careerRules = {
  skills: {
    weight: 35,
  },

  education: {
    weight: 20,
  },

  projects: {
    weight: 15,
    minimum: 3,
  },

  internships: {
    weight: 10,
    minimum: 1,
  },

  certifications: {
    weight: 10,
    minimum: 5,
  },

  careerInterest: {
    weight: 10,
  },
};

export default careerRules;