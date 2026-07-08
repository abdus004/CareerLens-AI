import { useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import Navbar from "../components/dashboard/Navbar";

import WelcomeCard from "../components/dashboard/WelcomeCard";
import StatsCards from "../components/dashboard/StatsCards";
import CareerMatchCard from "../components/dashboard/CareerMatchCard";
import ResumeScoreCard from "../components/dashboard/ResumeScoreCard";
import SkillProgress from "../components/dashboard/SkillProgress";
import RecommendedCareers from "../components/dashboard/RecommendedCareers";
import DailyGoals from "../components/dashboard/DailyGoals";
import AISuggestions from "../components/dashboard/AISuggestions";
import Opportunities from "../components/dashboard/Opportunities";
import RecentActivity from "../components/dashboard/RecentActivity";

export default function Dashboard() {

  const [collapsed, setCollapsed] = useState(false);

  return (

    <div className="flex h-screen bg-[#050816] overflow-hidden">

      {/* Sidebar */}

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main */}

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Navbar */}

        <Navbar />

        {/* Dashboard */}

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

            {/* Welcome */}

            <WelcomeCard />

            {/* Stats */}

            <StatsCards />

            {/* Career + Resume */}

            <div className="grid md:grid-cols-2 gap-5">

              <CareerMatchCard />

              <ResumeScoreCard />

            </div>

            {/* Skills + Careers */}

            <div className="grid md:grid-cols-2 gap-5">

              <SkillProgress />

              <RecommendedCareers />

            </div>

            {/* Goals + AI */}

            <div className="grid md:grid-cols-2 gap-5">

              <DailyGoals />

              <AISuggestions />

            </div>

            {/* Opportunities + Activity */}

            <div className="grid md:grid-cols-2 gap-5">

              <Opportunities />

              <RecentActivity />

            </div>

          </div>

        </main>

      </div>

    </div>

  );

}