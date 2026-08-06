import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "What is CareerLens AI?",
    a: "CareerLens AI is an AI-powered career readiness platform for students. It analyzes your resume and profile to give you a recommended career path, a skill breakdown, a learning path, matching job recommendations, practice mock interviews, skill assessments, and certificates - all in one place.",
  },
  {
    q: "How does Resume Analyzer work?",
    a: "Resume Analyzer is a standalone tool - upload any resume and it's scored by AI across ATS compatibility, keyword match, formatting and grammar, along with a list of strengths and weaknesses. It's separate from the resume attached to your profile.",
  },
  {
    q: "How do I replace my resume?",
    a: "Go to Settings > Profile > Resume Management and select Replace Resume. You'll be asked to confirm, since it updates several AI-generated results across the app.",
  },
  {
    q: "What happens after replacing my resume?",
    a: "Your new resume becomes the source for Resume Analysis, Career Intelligence, Skill Analysis, Learning Path, Job Recommendations and Certificate Recommendations, and each of these is refreshed to reflect it instead of your old resume.",
  },
  {
    q: "How does Career Intelligence work?",
    a: "Career Intelligence uses AI to recommend a career path and role for you based on your profile, skills and resume.",
  },
  {
    q: "How does Skill Analysis work?",
    a: "Skill Analysis scores your technical and soft skills based on your profile and resume, and highlights the most important skills for you to improve. You can trigger Reanalyze any time to regenerate it.",
  },
  {
    q: "How is Learning Path generated?",
    a: "Your Learning Path is a structured roadmap generated together with Career Intelligence, built from your recommended role and current skill levels.",
  },
  {
    q: "How do Job Recommendations work?",
    a: "Job Recommendations ranks your best-matching jobs from CareerLens AI's job listings using a scoring engine that compares your Skill Analysis, Career Intelligence, profile and resume data against each job's requirements. Skill Analysis and Career Intelligence need to be completed first.",
  },
  {
    q: "What are Upcoming Drives?",
    a: "Upcoming Drives lists active placement drives and openings - company, role, deadline and how to apply.",
  },
  {
    q: "How does AI Mock Interview work?",
    a: "Choose an interview type (Technical, HR, Behavioral or Mixed), a difficulty and a number of questions. After you finish, AI scores you on technical knowledge, communication, English, confidence and vocabulary, with feedback per question.",
  },
  {
    q: "Can I retake an interview?",
    a: "Yes - you can retake a mock interview at any time from the interview result page. There's no limit on attempts.",
  },
  {
    q: "How does Skill Assessment work?",
    a: "Skill Assessment is a timed multiple-choice test in a category and difficulty you choose, covering topics like Programming, Aptitude, SQL, Python, Java and AI/ML.",
  },
  {
    q: "What score is required to pass?",
    a: "You need a score of 80% or higher on a Skill Assessment. Below 80%, no certificate is issued for that attempt, but you're welcome to retake it.",
  },
  {
    q: "How do I earn CareerLens certificates?",
    a: "Pass a Skill Assessment with a score of 80% or higher and a CareerLens AI certificate is issued automatically - no separate application needed.",
  },
  {
    q: "How do external certificates work?",
    a: "You can upload certificates you've already earned elsewhere under Certificates > My Certificates to keep them all in one place alongside your CareerLens AI certificates.",
  },
  {
    q: "How are certificate recommendations generated?",
    a: "Once your Resume Analysis and Skill Analysis are both complete, AI recommends external certifications worth pursuing based on your profile, and tracks your progress toward them.",
  },
  {
    q: "How do I change my password?",
    a: "Go to Settings > Security & Account and select Change Password. You'll need to enter your current password to confirm it's you.",
  },
  {
    q: "How do I switch Dark/Light theme?",
    a: "Go to Settings > Appearance and choose Dark Theme or Light Theme. Your choice is saved and applied across the whole app, including after you log back in.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="text-cyan-400" size={28} />
        <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, index) => {
          const open = openIndex === index;
          return (
            <div
              key={item.q}
              className="rounded-2xl border border-white/10 bg-[#0B1120] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
              >
                <span className="text-white font-medium text-sm sm:text-base">{item.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>

              {open && (
                <div className="px-5 pb-4 -mt-1">
                  <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
