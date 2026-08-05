import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import AnimatedBackground from "../components/landing/AnimatedBackground";
import HowItWorks from "../components/landing/HowItWorks";
import WhyCareerLens from "../components/landing/WhyCareerLens";
import CTASection from "../components/landing/CTASection";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <div className="relative overflow-x-hidden">
      {/* Single shared animated backdrop for the whole page, instead
          of each section rendering its own background layer. */}
      <AnimatedBackground />

      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <WhyCareerLens />
      <CTASection />
      <Footer />
    </div>
  );
}
