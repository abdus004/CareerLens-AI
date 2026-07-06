import { motion } from "framer-motion";
import {
  Brain,
  Compass,
  FileText,
  GraduationCap,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Career Recommendation",
    desc: "Get intelligent career suggestions based on your interests, skills, and goals.",
  },
  {
    icon: Compass,
    title: "Career Roadmap",
    desc: "Receive a personalized learning roadmap to achieve your dream IT career.",
  },
  {
    icon: FileText,
    title: "Resume Analysis",
    desc: "Analyze your resume and discover improvements using AI.",
  },
  {
    icon: GraduationCap,
    title: "Skill Gap Analysis",
    desc: "Find missing skills and get recommendations to improve them.",
  },
];

export default function Features() {
  return (
    <section className="relative bg-[#050816] py-32 overflow-hidden">

      {/* Background Glow */}

      <div className="absolute top-0 left-0 w-80 h-80 bg-violet-600/20 blur-[140px] rounded-full"></div>

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 blur-[180px] rounded-full"></div>

      <div className="max-w-7xl mx-auto px-8">

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >

          <h2 className="text-5xl font-black text-white text-center">

            Why Choose

            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">

              {" "}CareerLens AI

            </span>

          </h2>

          <p className="text-center text-gray-400 mt-6 max-w-3xl mx-auto text-lg">

            Everything you need to discover the right IT career and build your future with confidence.

          </p>

        </motion.div>

        {/* Cards */}

        <div className="grid lg:grid-cols-2 gap-8 mt-20">

          {features.map((feature, index) => {

            const Icon = feature.icon;

            return (

              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                whileHover={{
                  y: -10,
                }}
                className="
                  group
                  rounded-3xl
                  bg-white/5
                  backdrop-blur-xl
                  border
                  border-white/10
                  p-8
                  hover:border-violet-500/40
                  transition-all
                  duration-500
                "
              >

                <div
                  className="
                    w-16
                    h-16
                    rounded-2xl
                    bg-gradient-to-br
                    from-violet-500
                    to-fuchsia-600
                    flex
                    items-center
                    justify-center
                    shadow-[0_0_25px_rgba(139,92,246,.45)]
                  "
                >

                  <Icon size={30} className="text-white" />

                </div>

                <h3 className="text-white text-2xl font-bold mt-8">

                  {feature.title}

                </h3>

                <p className="text-gray-400 mt-4 leading-8">

                  {feature.desc}

                </p>

              </motion.div>

            );

          })}

        </div>

      </div>

    </section>
  );
}