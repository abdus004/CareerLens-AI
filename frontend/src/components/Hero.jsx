import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, ChevronDown } from "lucide-react";

import CTAButton from "./CTAButton";
import BrandIcon from "./BrandIcon";
import AnimatedHeadline from "./landing/AnimatedHeadline";
import TypingReveal from "./landing/TypingReveal";
import CareerLensNetwork from "./landing/CareerLensNetwork";

const headlineLines = [[{ text: "CareerLens" }, { text: "AI", gradient: true }]];

export default function Hero() {
  return (
    <section id="top" className="relative min-h-screen overflow-hidden flex items-center pt-32 pb-20">
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-14 relative z-20 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: copy + CTAs */}
        <div className="flex flex-col items-start text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-violet-500/20 backdrop-blur-xl text-violet-300 mb-8 text-sm font-medium"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-400" />
            </span>
            AI-Powered Career Platform
          </motion.div>

          <div className="flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <BrandIcon size={56} className="md:hidden" />
              <BrandIcon size={72} className="hidden md:flex" />
            </motion.div>

            <AnimatedHeadline
              lines={headlineLines}
              nowrap
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1] tracking-tight"
            />
          </div>

          <TypingReveal
            text="Discover Your Future with AI"
            className="mt-6 text-2xl md:text-3xl font-semibold text-gray-200"
            startDelay={0.9}
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.7 }}
            className="mt-6 text-gray-400 text-lg leading-8 max-w-xl"
          >
            Analyze your resume, discover the right career, identify skill
            gaps, build a personalized learning path, practice interviews,
            and prepare for opportunities - all in one AI-powered platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="mt-10 flex flex-wrap items-center gap-5"
          >
            <CTAButton to="/signup" icon={ArrowRight}>
              Get Started
            </CTAButton>
            <CTAButton variant="secondary" href="#how-it-works" icon={PlayCircle}>
              Watch Demo
            </CTAButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.1, duration: 0.7 }}
            className="mt-12 flex items-center gap-3 text-sm text-gray-500"
          >
            <span className="w-8 h-px bg-gradient-to-r from-violet-500 to-transparent" />
            Free to get started &middot; No credit card required
          </motion.div>
        </div>

        {/* Right: CareerLens ecosystem visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="relative h-[380px] md:h-[480px] lg:h-[560px] w-full"
        >
          <CareerLensNetwork />
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.a
        href="#features"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
      >
        <span className="text-xs tracking-[0.2em] uppercase">Scroll</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={18} />
        </motion.span>
      </motion.a>
    </section>
  );
}
