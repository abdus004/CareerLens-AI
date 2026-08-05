import { motion } from "framer-motion";
import { ArrowRight, Compass } from "lucide-react";

import CTAButton from "../CTAButton";

export default function CTASection() {
  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="
            relative overflow-hidden rounded-[2.5rem]
            border border-white/10
            bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-cyan-500/20
            backdrop-blur-2xl
            px-8 py-20 md:px-16 md:py-24
            text-center
          "
        >
          {/* Inner glow accents */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-violet-500/30 blur-[120px]" aria-hidden="true" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-cyan-400/25 blur-[120px]" aria-hidden="true" />

          <div className="relative">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight max-w-3xl mx-auto">
              Start Building Your Career
              <span className="block mt-2 bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                with AI Today
              </span>
            </h2>

            <p className="mt-6 text-gray-300 text-lg max-w-xl mx-auto leading-8">
              Join CareerLens AI and turn your resume into a personalized,
              placement-ready roadmap - free to start, no credit card required.
            </p>

            <div className="mt-10 flex flex-wrap justify-center items-center gap-5">
              <CTAButton to="/signup" icon={ArrowRight}>
                Create Free Account
              </CTAButton>
              <CTAButton variant="secondary" href="#features" icon={Compass}>
                Explore Features
              </CTAButton>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
