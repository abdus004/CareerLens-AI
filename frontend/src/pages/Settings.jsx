import DashboardLayout from "../components/dashboard/DashboardLayout";
import ProfileSection from "../components/settings/ProfileSection";
import AppearanceSection from "../components/settings/AppearanceSection";
import NotificationsSection from "../components/settings/NotificationsSection";
import SecuritySection from "../components/settings/SecuritySection";

export default function Settings() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">
          Manage your CareerLens AI account and preferences.
        </p>
      </div>

      <div className="space-y-6 pb-10">
        <ProfileSection />
        <AppearanceSection />
        <NotificationsSection />
        <SecuritySection />
      </div>
    </DashboardLayout>
  );
}
