import resumeRules from "../data/resumeRules";

export default function calculateResumeScore(user) {

  let score = 0;

  const suggestions = [];

  /* ---------------- Personal Details ---------------- */

  if (
    user.name &&
    user.email &&
    user.phone &&
    user.linkedin &&
    user.github
  ) {

    score += resumeRules.personalDetails.weight;

  } else {

    suggestions.push("Complete your personal details.");

  }

  /* ---------------- Education ---------------- */

  if (user.degree && user.branch) {

    score += resumeRules.education.weight;

  } else {

    suggestions.push("Add your education details.");

  }

  /* ---------------- Skills ---------------- */

  if (
    user.skills.length >=
    resumeRules.skills.minimum
  ) {

    score += resumeRules.skills.weight;

  } else {

    score +=
      (user.skills.length /
        resumeRules.skills.minimum) *
      resumeRules.skills.weight;

    suggestions.push(
      "Add more technical skills."
    );

  }

  /* ---------------- Projects ---------------- */

  if (
    user.projects >=
    resumeRules.projects.minimum
  ) {

    score += resumeRules.projects.weight;

  } else {

    score +=
      (user.projects /
        resumeRules.projects.minimum) *
      resumeRules.projects.weight;

    suggestions.push(
      "Complete more projects."
    );

  }

  /* ---------------- Internships ---------------- */

  if (
    user.internships >=
    resumeRules.internships.minimum
  ) {

    score += resumeRules.internships.weight;

  } else {

    score +=
      (user.internships /
        resumeRules.internships.minimum) *
      resumeRules.internships.weight;

    suggestions.push(
      "Complete at least one internship."
    );

  }

  /* ---------------- Certifications ---------------- */

  if (
    user.certifications >=
    resumeRules.certifications.minimum
  ) {

    score += resumeRules.certifications.weight;

  } else {

    score +=
      (user.certifications /
        resumeRules.certifications.minimum) *
      resumeRules.certifications.weight;

    suggestions.push(
      "Earn more certifications."
    );

  }

  /* ---------------- Resume Upload ---------------- */

  if (user.resumeUploaded) {

    score += resumeRules.resumeUpload.weight;

  } else {

    suggestions.push("Upload your resume.");

  }

  /* ---------------- ATS ---------------- */

  if (user.atsKeywords) {

    score += resumeRules.atsKeywords.weight;

  } else {

    suggestions.push(
      "Improve ATS keywords in your resume."
    );

  }

  /* ---------------- Resume Level ---------------- */

  let level = "";

  if (score >= 90) {

    level = "Excellent";

  } else if (score >= 80) {

    level = "Very Good";

  } else if (score >= 70) {

    level = "Good";

  } else if (score >= 60) {

    level = "Average";

  } else {

    level = "Needs Improvement";

  }

  return {

    score: Math.round(score),

    level,

    suggestions,

  };

}