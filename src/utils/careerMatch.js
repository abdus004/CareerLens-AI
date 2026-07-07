import careerData from "../data/careerData";
import careerRules from "../data/careerRules";

export default function calculateCareerMatch(user) {

  return careerData
    .map((career) => {

      let score = 0;

      /* ---------------- Skills ---------------- */

      const matchedSkills = career.requiredSkills.filter((skill) =>
        user.skills.includes(skill)
      ).length;

      score +=
        (matchedSkills / career.requiredSkills.length) *
        careerRules.skills.weight;

      /* ---------------- Education ---------------- */

      if (
        career.requiredDegree.includes(user.degree) &&
        career.branches.includes(user.branch)
      ) {
        score += careerRules.education.weight;
      }

      /* ---------------- Projects ---------------- */

      score += Math.min(
        user.projects / career.preferredProjects,
        1
      ) * careerRules.projects.weight;

      /* ---------------- Internship ---------------- */

      score += Math.min(
        user.internships / career.preferredInternships,
        1
      ) * careerRules.internships.weight;

      /* ---------------- Certificates ---------------- */

      score += Math.min(
        user.certifications /
          career.preferredCertificates,
        1
      ) * careerRules.certifications.weight;

      /* ---------------- Career Interest ---------------- */

      if (user.interest === career.career) {
        score += careerRules.careerInterest.weight;
      }

      return {

        career: career.career,

        score: Math.round(score),

      };

    })

    .sort((a, b) => b.score - a.score);

}