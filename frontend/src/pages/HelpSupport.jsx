import DashboardLayout from "../components/dashboard/DashboardLayout";
import FAQSection from "../components/help/FAQSection";
import SupportAssistant from "../components/help/SupportAssistant";
import FeedbackSection from "../components/help/FeedbackSection";
import ContactSupportForm from "../components/help/ContactSupportForm";

export default function HelpSupport() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">Help & Support</h1>
        <p className="text-gray-400 mt-2">
          Find answers, chat with the CareerLens AI Support Assistant, or reach out directly.
        </p>
      </div>

      <div className="space-y-6 pb-10">
        <FAQSection />
        <SupportAssistant />

        <div className="grid lg:grid-cols-2 gap-6">
          <FeedbackSection />
          <ContactSupportForm />
        </div>
      </div>
    </DashboardLayout>
  );
}
