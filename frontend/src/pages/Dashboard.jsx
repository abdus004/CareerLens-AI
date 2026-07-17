import DashboardLayout from "../components/dashboard/DashboardLayout";

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
  return (
    <DashboardLayout>

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

    </DashboardLayout>
  );
}