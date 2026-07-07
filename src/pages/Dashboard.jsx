import { useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import Navbar from "../components/dashboard/Navbar";

import StatsCards from "../components/dashboard/StatsCards";
import CareerMatchCard from "../components/dashboard/CareerMatchCard";
import ResumeScoreCard from "../components/dashboard/ResumeScoreCard";

export default function Dashboard() {

  const [collapsed, setCollapsed] = useState(false);

  return (

    <div className="flex min-h-screen bg-[#050816]">

      {/* Sidebar */}

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main Content */}

      <div
        className="
          flex-1
          flex
          flex-col
          bg-[#050816]
        "
      >

        {/* Navbar */}

        <Navbar />

        {/* Dashboard */}

        <main
          className="
            flex-1
            p-6
            bg-[#050816]
            overflow-y-auto
          "
        >

          <div className="space-y-6">

            {/* Top Stats */}

            <StatsCards />

            {/* Main Cards */}

            <div
              className="
                grid
                grid-cols-1
                xl:grid-cols-2
                gap-6
              "
            >

              <CareerMatchCard />

              <ResumeScoreCard />

            </div>

          </div>

        </main>

      </div>

    </div>

  );

}