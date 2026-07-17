export default function profileScore(user) {
  let score = 0;

  const suggestions = [];

  if (user.name) score += 10;
  else suggestions.push("Add your full name.");

  if (user.email) score += 10;
  else suggestions.push("Add your email.");

  if (user.skills?.length > 0) score += 15;
  else suggestions.push("Add your skills.");

  if (user.projects > 0) score += 15;
  else suggestions.push("Add a project.");

  if (user.internships > 0) score += 10;
  else suggestions.push("Add an internship.");

  if (user.certifications > 0) score += 10;
  else suggestions.push("Add certifications.");

  if (user.resumeUploaded) score += 10;
  else suggestions.push("Upload your resume.");

  if (user.linkedin) score += 10;
  else suggestions.push("Add your LinkedIn profile.");

  if (user.github) score += 10;
  else suggestions.push("Add your GitHub profile.");

  if (user.profilePhoto) score += 10;
  else suggestions.push("Upload a profile photo.");

  let level = "";

  if (score >= 90) level = "Excellent";
  else if (score >= 75) level = "Strong";
  else if (score >= 60) level = "Good";
  else if (score >= 40) level = "Average";
  else level = "Weak";

  return {
    score,
    level,
    suggestions,
  };
}