import { logoutUser } from "../../utils/usersStorage";
import {
  Home,
  Brain,
  BarChart3,
  Route,
  FileText,
  Mic,
  Briefcase,
  ClipboardList,
  Award,
  FolderOpen,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";

const menuItems = [
  {
    icon: Home,
    title: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: Brain,
    title: "Career Intelligence",
    path: "/career-intelligence",
  },
  {
    icon: BarChart3,
    title: "Skill Analysis",
    path: "/skill-analysis",
  },
  {
    icon: Route,
    title: "Learning Path",
    path: "/learning-path",
  },
  {
    icon: FileText,
    title: "Resume Analyzer",
    path: "/resume-analyzer",
  },
  {
    icon: Mic,
    title: "Mock Interview",
    path: "/mock-interview",
  },
  {
    icon: Briefcase,
    title: "Opportunities",
    path: "/opportunities",
  },
  {
    icon: ClipboardList,
    title: "Assessments",
    path: "/assessments",
  },
  {
    icon: Award,
    title: "Certificates",
    path: "/certificates",
  },
  {
    icon: FolderOpen,
    title: "Portfolio",
    path: "/portfolio",
  },
];

export default function Sidebar({
  collapsed,
  setCollapsed,
}) {

  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => {
  logoutUser();
  navigate("/login");
};
  return (
    <aside
      className={`
        bg-[#050816]
        border-r
        border-white/10
        transition-all
        duration-300
        flex
        flex-col
        h-screen

        ${collapsed ? "w-[75px]" : "w-[240px]"}
      `}
    >

      {/* Logo */}

      <div
        className={`
          flex
          items-center
          ${collapsed ? "justify-center" : "justify-between"}
          px-5
          py-6
          flex-shrink-0
        `}
      >

        {!collapsed && (

          <div>

            <h1 className="text-3xl font-black">

              <span className="text-white">

                Career

              </span>

              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">

                Lens AI

              </span>

            </h1>

            <p className="text-xs text-gray-500 tracking-[0.3em] mt-1">

              AI POWERED

            </p>

          </div>

        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="
            w-10
            h-10
            rounded-xl
            border
            border-white/10
            bg-white/5
            hover:bg-white/10
            transition-all
            flex
            items-center
            justify-center
          "
        >

          <Menu
            size={18}
            className="text-white"
          />

        </button>

      </div>

                  {/* Navigation */}

      <div
        className="
          flex-1
          overflow-y-auto
          px-3
          py-3

          [scrollbar-width:none]
          [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
        "
      >

        <nav className="space-y-2">

          {menuItems.map((item) => {

  const Icon = item.icon;

  const isActive = location.pathname === item.path;

  return (

    <button
      key={item.title}
      onClick={() => navigate(item.path)}
      className={`
        w-full
        flex
        items-center
        ${
          collapsed
            ? "justify-center"
            : "justify-start"
        }
        gap-4
        px-4
        py-3
        rounded-2xl
        transition-all
        duration-300

        ${
          isActive
            ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 text-white shadow-lg"
            : "text-gray-400 hover:bg-white/5 hover:text-white"
        }
      `}
    >

                <Icon
                  size={20}
                  className="flex-shrink-0"
                />

                {!collapsed && (

                  <span className="font-medium">

                    {item.title === "Job Recommendations"
                      ? "Opportunities"
                      : item.title}

                  </span>

                )}

              </button>

            );

          })}

          {/* Divider */}

          <div className="border-t border-white/10 my-5"></div>

          {/* Settings */}

          <button
  onClick={() => navigate("/settings")}
  className={`
    w-full
    flex
    items-center
    ${
      collapsed
        ? "justify-center"
        : "justify-start"
    }
    gap-4
    px-4
    py-3
    rounded-2xl
    ${
      location.pathname === "/settings"
        ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 text-white"
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    }
    transition-all
  `}
>
  <Settings size={20} />

  {!collapsed && (
    <span className="font-medium">
      Settings
    </span>
  )}
</button>

          {/* Help */}

          <button
  onClick={() => navigate("/help-support")}
  className={`
    w-full
    flex
    items-center
    ${
      collapsed
        ? "justify-center"
        : "justify-start"
    }
    gap-4
    px-4
    py-3
    rounded-2xl
    ${
      location.pathname === "/help-support"
        ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 text-white"
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    }
    transition-all
  `}
>
  <HelpCircle size={20} />

  {!collapsed && (
    <span className="font-medium">
      Help & Support
    </span>
  )}
</button>

          {/* Logout */}

          <button
  onClick={handleLogout}
  className="
    w-full
    flex
    items-center
    gap-4
    px-4
    py-3
    rounded-2xl
    text-red-400
    hover:bg-red-500/10
    transition-all
  "
>
  <LogOut size={20} />

  {!collapsed && (
    <span className="font-medium">
      Logout
    </span>
  )}
</button>

        </nav>

      </div>
      
    </aside>

  );

}