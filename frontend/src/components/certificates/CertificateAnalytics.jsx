import { Award, FolderCheck, Sparkles, Layers, Clock, CheckCircle2 } from "lucide-react";

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        {/* No truncation - the label is allowed to wrap onto a second
            line instead of being cut off with an ellipsis. Cards are
            wide enough (3 per row on desktop, not 6) that most labels
            fit on one line anyway; leading-snug just keeps the ones
            that do wrap tight and readable. */}
        <p className="text-gray-400 text-sm mt-1.5 leading-snug">{label}</p>
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
    // 3 columns on desktop = exactly the requested 2 rows x 3 columns
    // (Total / My / CareerLens on row 1, Recommended / Ongoing /
    // Completed on row 2), since the 6 cards below are already in
    // that exact order and grid auto-flow fills left-to-right,
    // top-to-bottom. Narrower screens step down to 2 then 1 column
    // instead of staying cramped at 3.
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
