import { useState } from "react";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#050816] overflow-hidden">

      {/* Sidebar */}

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main Content */}

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Navbar */}

        <Navbar />

        {/* Page Content */}

        <main
          className="
            flex-1
            overflow-y-auto
            bg-[#050816]
            px-6
            py-5
          "
        >
          <div className="max-w-[1700px] mx-auto space-y-5">

            {children}

          </div>
        </main>

      </div>

    </div>
  );
}