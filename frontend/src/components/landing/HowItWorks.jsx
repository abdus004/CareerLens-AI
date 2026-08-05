import { motion } from "framer-motion";
import {
  Upload,
  Search,
  Compass,
  BarChart3,
  Map,
  ClipboardCheck,
  MessageSquare,
  Award,
  Rocket,
} from "lucide-react";

import SectionHeading from "./SectionHeading";

const steps = [
  { icon: Upload, title: "Resume Upload", description: "Upload your resume in seconds to get started." },
  { icon: Search, title: "AI Resume Analysis", description: "Our AI scores it and surfaces concrete improvements." },
  { icon: Compass, title: "Career Intelligence", description: "Get career paths matched to your profile and goals." },
  { icon: BarChart3, title: "Skill Analysis", description: "See exactly which skills you have and which you need." },
  { icon: Map, title: "Learning Path", description: "Follow a personalized roadmap built around your gaps." },
  { icon: ClipboardCheck, title: "Skill Assessment", description: "Prove your skills with timed, topic-based assessments." },
  { icon: MessageSquare, title: "AI Mock Interview", description: "Practice with an AI interviewer and sharpen your answers." },
  { icon: Award, title: "Certificates", description: "Earn verifiable certificates as you pass assessments." },
  { icon: Rocket, title: "Placement Ready", description: "Walk into interviews and drives fully prepared." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <SectionHeading
          eyebrow="The Journey"
          title="How CareerLens AI"
          highlight="Takes You There"
          subtitle="One connected path from your resume to placement-ready, with AI guiding every step."
        />

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-[27px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-500/50 via-fuchsia-500/30 to-cyan-500/10" />

          <div className="flex flex-col gap-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.5, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex items-start gap-6"
                >
                  <div
                    className="
                      relative z-10 shrink-0 w-14 h-14 rounded-2xl
                      flex items-center justify-center
                      bg-gradient-to-br from-violet-600 to-cyan-500
                      shadow-[0_8px_25px_rgba(139,92,246,.3)]
                      border border-white/10
                    "
                  >
                    <Icon size={24} className="text-white" />
                  </div>

                  <div className="pt-2">
                    <span className="text-xs font-semibold tracking-[0.2em] uppercase text-violet-400">
                      Step {index + 1}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold text-white mt-1">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 mt-2 leading-7">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
