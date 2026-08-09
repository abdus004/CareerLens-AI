// Shared validation helpers for Signup + Profile Setup + Profile
// Management.
//
// Mirrors backend/app/utils/validators.py rule-for-rule - the backend
// is the actual source of truth/enforcement (never trust the client),
// these exist purely so the person gets instant, specific feedback
// instead of a round-trip to find out a field was invalid.
//
// Every validate* function returns "" when the value is valid, or a
// human-readable error string when it isn't.

const FULL_NAME_RE = /^[A-Za-z\u00C0-\u024F' \-.]+$/;

export const ACADEMIC_YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Final Year",
  "Graduated",
];

const LINKEDIN_RE = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%.]+\/?$/i;
const GITHUB_RE = /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9\-_]+\/?$/i;

export function validateFullName(value) {
  const name = (value || "").trim();

  if (!name) return "Full name is required.";
  if (name.length < 2) return "Full name is too short.";
  if (name.length > 80) return "Full name is too long.";
  if (name.includes("@")) {
    return "Full name can't contain '@'. Please enter your name, not an email address.";
  }
  if (/\d/.test(name)) return "Full name shouldn't contain numbers.";
  if (!FULL_NAME_RE.test(name)) {
    return "Full name can only contain letters, spaces, apostrophes and hyphens.";
  }
  if (!/[A-Za-z]/.test(name)) return "Full name must contain letters.";

  return "";
}

export function validateEmail(value) {
  const email = (value || "").trim();
  if (!email) return "Email is required.";

  // Deliberately simple/conservative (not a full RFC 5322 regex) -
  // matches what the backend's EmailStr will ultimately accept or
  // reject, this just avoids an obviously-wrong round trip.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(email)) return "Please enter a valid email address.";

  return "";
}

export const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export const isPasswordValid = (pw) =>
  PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(pw || ""));

export function validateCGPA(value) {
  if (value === "" || value === null || value === undefined) {
    return "Please enter your CGPA.";
  }
  const cgpa = Number(value);
  if (Number.isNaN(cgpa)) return "CGPA must be a number between 0 and 10.";
  if (cgpa < 0 || cgpa > 10) return "CGPA must be between 0.00 and 10.00.";
  return "";
}

export function validateAcademicYear(value) {
  if (!ACADEMIC_YEARS.includes(value)) {
    return `Academic year must be one of: ${ACADEMIC_YEARS.join(", ")}.`;
  }
  return "";
}

export function validateExperienceYears(value) {
  if (value === "" || value === null || value === undefined) {
    return "Please enter your years of experience.";
  }
  const years = Number(value);
  if (Number.isNaN(years)) return "Years of experience must be a number.";
  if (years < 0 || years > 60) return "Years of experience must be between 0 and 60.";
  return "";
}

export function validatePhone(value) {
  const phone = (value || "").trim();
  if (!phone) return ""; // optional

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return "Please enter a valid phone number.";
  }
  if (!/^\+?[\d\s\-().]{7,20}$/.test(phone)) {
    return "Please enter a valid phone number.";
  }
  return "";
}

export function validateLinkedIn(value) {
  const url = (value || "").trim();
  if (!url) return ""; // optional
  if (!LINKEDIN_RE.test(url)) {
    return "Please enter a valid LinkedIn profile URL (e.g. https://www.linkedin.com/in/username).";
  }
  return "";
}

export function validateGithub(value) {
  const url = (value || "").trim();
  if (!url) return ""; // optional
  if (!GITHUB_RE.test(url)) {
    return "Please enter a valid GitHub profile URL (e.g. https://github.com/username).";
  }
  return "";
}

export function validateAge(value) {
  const age = Number(value);
  if (!value || Number.isNaN(age)) return "Please enter your age.";
  if (age < 13 || age > 100) return "Please enter a realistic age.";
  return "";
}
