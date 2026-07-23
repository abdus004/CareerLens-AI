import { useEffect, useState } from "react";
import api from "../services/api";

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
  const [profile, setProfile] = useState(null);
  const [career, setCareer] = useState(null);

  useEffect(() => {
    const storedUser =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(sessionStorage.getItem("user"));

    if (!storedUser) return;

    const fetchDashboard = async () => {
      try {
        const response = await api.get(
          `/dashboard/${storedUser.email}`
        );

        setProfile(response.data.data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchCareer = async () => {
      try {
        const response = await api.get(
          `/career/${storedUser.email}`
        );

        setCareer(response.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDashboard();
    fetchCareer();
  }, []);

  return (
    <DashboardLayout>
      <WelcomeCard profile={profile} />

      <StatsCards />

      <div className="grid md:grid-cols-2 gap-5">
        <CareerMatchCard
          score={career?.match_score || 0}
          career={career?.recommended_role || "Loading..."}
        />

        <ResumeScoreCard />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <SkillProgress profile={profile} />
        <RecommendedCareers />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <DailyGoals />
        <AISuggestions />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Opportunities />
        <RecentActivity />
      </div>
    </DashboardLayout>
  );
}