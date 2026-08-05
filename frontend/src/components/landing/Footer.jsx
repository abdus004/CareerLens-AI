import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";

const navLinks = [
  { label: "Home", href: "#top" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
];

const authLinks = [
  { label: "Sign In", to: "/login" },
  { label: "Get Started", to: "/signup" },
];

const socialLinks = [
  {
    icon: SiGithub,
    label: "GitHub",
    href: "#",
  },
  {
    icon: FaLinkedin,
    label: "LinkedIn",
    href: "#",
  },
  {
    icon: Mail,
    label: "Email",
    href: "mailto:hello@careerlens.ai",
  },
];

const APP_VERSION = "v1.0.0";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 px-6 pt-16 pb-10 overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Main Footer */}
        <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-8">

          {/* Brand */}
          <div className="max-w-sm">
            <h3 className="text-2xl font-black tracking-tight">
              <span className="text-white">
                Career
              </span>

              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Lens AI
              </span>
            </h3>

            <p className="mt-4 text-gray-500 text-sm leading-7">
              An AI-powered career platform that turns your resume into a
              personalized, placement-ready roadmap.
            </p>
          </div>

          {/* Navigation + Account */}
          <div className="flex flex-col sm:flex-row gap-12">

            {/* Navigation */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">
                Navigate
              </h4>

              <ul className="flex flex-col gap-3">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">
                Account
              </h4>

              <ul className="flex flex-col gap-3">
                {authLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">
              Connect
            </h4>

            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    target={
                      social.href.startsWith("http")
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      social.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="
                      w-10
                      h-10
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      border
                      border-white/10
                      bg-white/5
                      text-gray-400
                      hover:text-white
                      hover:border-white/25
                      hover:bg-white/10
                      transition-all
                      duration-300
                    "
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div
          className="
            mt-14
            pt-8
            border-t
            border-white/5
            flex
            flex-col
            sm:flex-row
            items-center
            justify-between
            gap-4
            text-sm
            text-gray-500
          "
        >
          <p>
            &copy; {year} CareerLens AI. All rights reserved.
          </p>

          <p className="text-gray-600">
            {APP_VERSION}
          </p>
        </div>

      </div>
    </footer>
  );
}