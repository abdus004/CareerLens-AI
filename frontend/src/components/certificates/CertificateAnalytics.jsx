import { Award, FolderCheck, Sparkles, Layers, Clock, CheckCircle2 } from "lucide-react";

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-gray-400 text-xs mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

/**
 * Every number here is derived from data the page has already loaded
 * (My Certificates, CareerLens Certificates, Recommended Certifications)
 * - nothing is hardcoded, so this updates automatically whenever any
 * of those lists change.
 *
 * "Completed Certifications" = My Certificates rows with
 * source === "recommendation" - i.e. Recommended Certifications that
 * were actually finished and uploaded (see
 * user_certificate_service.complete_recommendation, which sets that
 * source and simultaneously removes the recommendation, so a
 * completed one is never double-counted as "Ongoing").
 */
export default function CertificateAnalytics({
  myCertificates,
  clCertificates,
  recommendations,
}) {
  const totalCertificates = myCertificates.length + clCertificates.length;
  const ongoing = recommendations.filter(
    (r) => r.progress_percent > 0 && r.progress_percent < 100
  ).length;
  const completed = myCertificates.filter((c) => c.source === "recommendation").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <StatCard
        icon={Layers}
        label="Total Certificates"
        value={totalCertificates}
        accent="bg-white/10 text-white"
      />
      <StatCard
        icon={Award}
        label="My Certificates"
        value={myCertificates.length}
        accent="bg-violet-500/15 text-violet-400"
      />
      <StatCard
        icon={FolderCheck}
        label="CareerLens Certificates"
        value={clCertificates.length}
        accent="bg-cyan-500/15 text-cyan-400"
      />
      <StatCard
        icon={Sparkles}
        label="Recommended Certifications"
        value={recommendations.length}
        accent="bg-yellow-500/15 text-yellow-400"
      />
      <StatCard
        icon={Clock}
        label="Ongoing Certifications"
        value={ongoing}
        accent="bg-orange-500/15 text-orange-400"
      />
      <StatCard
        icon={CheckCircle2}
        label="Completed Certifications"
        value={completed}
        accent="bg-green-500/15 text-green-400"
      />
    </div>
  );
}
