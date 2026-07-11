import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import CareerIntelligence from "./pages/CareerIntelligence";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import SkillAnalysis from "./pages/SkillAnalysis";
import LearningPath from "./pages/LearningPath";
import CareerOpportunities from "./pages/Opportunities";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<Landing />} />

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Profile Setup */}
      <Route path="/profile-setup" element={<ProfileSetup />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Career Intelligence */}
      <Route
        path="/career-intelligence"
        element={<CareerIntelligence />}
      />
      <Route
  path="/resume-analyzer"
  element={<ResumeAnalyzer />}
/>
<Route
  path="/skill-analysis"
  element={<SkillAnalysis />}
/>

<Route
  path="/learning-path"
  element={<LearningPath />}
/>

<Route
  path="/opportunities"
  element={<CareerOpportunities />}
/>

<Route
  path="/settings"
  element={<Settings />}
/>

    </Routes>
  );
}