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
import MockInterview from "./pages/MockInterview";
import InterviewMode from "./pages/InterviewMode";
import ChatInterview from "./pages/ChatInterview";
import VoiceInterview from "./pages/VoiceInterview";
import InterviewResult from "./pages/InterviewResult";
import Assessments from "./pages/Assessments";
import AssessmentTest from "./pages/AssessmentTest";
import AssessmentResult from "./pages/AssessmentResult";
import Certificates from "./pages/Certificates";
import Progress from "./pages/Portfolio";
import UpcomingDrivesPage from "./pages/UpcomingDrives";
import HelpSupport from "./pages/HelpSupport";

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

<Route
  path="/mock-interview"
  element={<MockInterview />}
/>

<Route
  path="/mock-interview/mode"
  element={<InterviewMode />}
/>

<Route
  path="/mock-interview/chat/:interviewId"
  element={<ChatInterview />}
/>

<Route
  path="/mock-interview/voice/:interviewId"
  element={<VoiceInterview />}
/>

<Route
  path="/mock-interview/result/:interviewId"
  element={<InterviewResult />}
/>

<Route
  path="/assessments"
  element={<Assessments />}
/>

<Route
  path="/assessments/test/:assessmentId"
  element={<AssessmentTest />}
/>

<Route
  path="/assessments/result/:assessmentId"
  element={<AssessmentResult />}
/>

<Route
  path="/certificates"
  element={<Certificates />}
/>

<Route
  path="/portfolio"
  element={<Progress />}
/>

<Route
  path="/placement-drives"
  element={<UpcomingDrivesPage />}
/>

<Route
  path="/help-support"
  element={<HelpSupport />}
/>

    </Routes>
  );
}