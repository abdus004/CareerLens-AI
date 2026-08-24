import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import Landing from "./pages/Landing";

// Code-split every route except Landing, which stays eager so the "/"
// entry point (the very first thing almost every visitor sees) has
// zero extra network round-trip before it can render. Previously
// every one of these ~20 pages shipped in the single initial bundle
// regardless of which page a visitor actually landed on first - Vite
// itself flagged this at build time ("chunks are larger than 500 kB
// after minification").
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CareerIntelligence = lazy(() => import("./pages/CareerIntelligence"));
const ResumeAnalyzer = lazy(() => import("./pages/ResumeAnalyzer"));
const SkillAnalysis = lazy(() => import("./pages/SkillAnalysis"));
const LearningPath = lazy(() => import("./pages/LearningPath"));
const CareerOpportunities = lazy(() => import("./pages/Opportunities"));
const Settings = lazy(() => import("./pages/Settings"));
const MockInterview = lazy(() => import("./pages/MockInterview"));
const InterviewMode = lazy(() => import("./pages/InterviewMode"));
const ChatInterview = lazy(() => import("./pages/ChatInterview"));
const VoiceInterview = lazy(() => import("./pages/VoiceInterview"));
const InterviewResult = lazy(() => import("./pages/InterviewResult"));
const Assessments = lazy(() => import("./pages/Assessments"));
const AssessmentTest = lazy(() => import("./pages/AssessmentTest"));
const AssessmentResult = lazy(() => import("./pages/AssessmentResult"));
const Certificates = lazy(() => import("./pages/Certificates"));
const UpcomingDrivesPage = lazy(() => import("./pages/UpcomingDrives"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));

// Same visual language already used for in-page loading states (e.g.
// SkillAnalysis.jsx, Opportunities.jsx) - a brief, familiar spinner
// rather than a blank screen while a route's chunk downloads. Route
// chunks are small and typically cached after the first visit, so
// this shows rarely and briefly in practice.
function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070d]">
      <RefreshCw className="text-cyan-400 animate-spin" size={36} />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
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
  path="/placement-drives"
  element={<UpcomingDrivesPage />}
/>

<Route
  path="/help-support"
  element={<HelpSupport />}
/>

      </Routes>
    </Suspense>
  );
}