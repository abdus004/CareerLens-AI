import { useEffect, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import api from "../services/api";
import { getCurrentUser } from "../utils/session";
import { Award, Download, RefreshCw } from "lucide-react";

const CATEGORY_LABELS = {
  "Programming": "Programming",
  "Aptitude": "Aptitude",
  "Reasoning": "Reasoning",
  "SQL": "SQL",
  "Python": "Python",
  "Java": "Java",
  "AI/ML": "AI / ML",
};

export default function Certificates() {
  const user = getCurrentUser();

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCertificates = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await api.get("/certificates/", {
          params: { email: user.email },
        });
        setCertificates(response.data?.data || []);
      } catch (err) {
        console.error("Error loading certificates:", err);
        setError(
          err?.response?.data?.detail ||
            "We couldn't load your certificates. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    loadCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">Certificates</h1>
        <p className="text-gray-400 mt-2">
          Certificates you've earned by passing Skill Assessments.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-400">
            <RefreshCw className="animate-spin" size={18} />
            Loading your certificates...
          </div>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : certificates.length === 0 ? (
          <div className="text-center py-12">
            <Award className="text-gray-600 mx-auto mb-4" size={48} />
            <p className="text-gray-400">
              You haven't earned any certificates yet.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Score 80% or higher on a Skill Assessment to unlock a certificate.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {certificates.map((cert) => {
              const categoryLabel =
                CATEGORY_LABELS[cert.category] || cert.category;
              return (
                <div
                  key={cert.id}
                  className="rounded-2xl border border-white/10 bg-[#0B1120] p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 flex items-center justify-center">
                      <Award size={22} className="text-white" />
                    </div>
                    <span className="text-green-400 text-2xl font-bold">
                      {cert.score}%
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {categoryLabel} Assessment
                  </h3>
                  <p className="text-gray-400 mt-1">{cert.difficulty}</p>
                  <p className="text-gray-500 text-sm mt-3">
                    Issued{" "}
                    {new Date(cert.issued_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    Certificate ID: {cert.certificate_id}
                  </p>

                  <a
                    href={cert.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download Certificate
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
