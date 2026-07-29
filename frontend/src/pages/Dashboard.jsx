import { useEffect, useState } from "react";
import api from "../services/api";
import { getCurrentUser } from "../utils/session";

import DashboardLayout from "../components/dashboard/DashboardLayout";
import WelcomeCard from "../components/dashboard/WelcomeCard";
import StatsCards from "../components/dashboard/StatsCards";
import CareerMatchCard from "../components/dashboard/CareerMatchCard";
import ResumeScoreCard from "../components/dashboard/ResumeScoreCard";
import AISuggestions from "../components/dashboard/AISuggestions";
import UpcomingDrives from "../components/dashboard/UpcomingDrives";

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [career, setCareer] = useState(null);

  useEffect(() => {
    const storedUser = getCurrentUser();

    if (!storedUser) return;

    const fetchDashboard = async () => {
      try {
        const response = await api.get(
          `/dashboard/${storedUser.email}`
        );

        setProfile(response.data.data);
        setStats(response.data.stats);
        setResumeAnalysis(response.data.resume_analysis);
        setAiSuggestions(response.data.ai_suggestions || []);
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

      <StatsCards stats={stats} />

      <div className="grid md:grid-cols-2 gap-5">
        <CareerMatchCard
          score={career?.match_score || 0}
          career={career?.recommended_role || "Loading..."}
        />

        <ResumeScoreCard analysis={resumeAnalysis} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
  <UpcomingDrives />
  <AISuggestions suggestions={aiSuggestions} />
</div>
    </DashboardLayout>
  );
}