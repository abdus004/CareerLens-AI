import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import api from "../services/api";
import { getCurrentUser } from "../utils/session";
import { getErrorMessage } from "../utils/apiError";
import { AlertTriangle, X } from "lucide-react";

import MyCertificatesSection from "../components/certificates/MyCertificatesSection";
import CareerLensCertificatesSection from "../components/certificates/CareerLensCertificatesSection";
import RecommendedCertificationsSection from "../components/certificates/RecommendedCertificationsSection";
import UploadCertificateModal from "../components/certificates/UploadCertificateModal";
import CertificateDetailsModal from "../components/certificates/CertificateDetailsModal";
import CertificateAnalytics from "../components/certificates/CertificateAnalytics";

export default function Certificates() {
  const user = getCurrentUser();
  const email = user?.email;

  // --- Section 1: My Certificates -----------------------------------
  const [myCertificates, setMyCertificates] = useState([]);
  const [myCertsLoading, setMyCertsLoading] = useState(true);
  const [myCertsError, setMyCertsError] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // --- Section 2: CareerLens Certificates -----------------------------
  const [clCertificates, setClCertificates] = useState([]);
  const [clLoading, setClLoading] = useState(true);
  const [clError, setClError] = useState(null);

  // --- Section 3: Recommended Certifications --------------------------
  const [recReady, setRecReady] = useState(true);
  const [recMessage, setRecMessage] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [recError, setRecError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [detailsRec, setDetailsRec] = useState(null);
  const [completeRec, setCompleteRec] = useState(null);

  const [actionError, setActionError] = useState(null);

  const loadMyCertificates = useCallback(async () => {
    if (!email) {
      setMyCertsLoading(false);
      return;
    }
    try {
      setMyCertsLoading(true);
      setMyCertsError(null);
      const response = await api.get("/certificates/my", { params: { email } });
      setMyCertificates(response.data?.data || []);
    } catch (err) {
      console.error("Error loading My Certificates:", err);
      setMyCertsError(
        getErrorMessage(err, "We couldn't load your certificates. Please try again.")
      );
    } finally {
      setMyCertsLoading(false);
    }
  }, [email]);

  const loadCareerLensCertificates = useCallback(async () => {
    if (!email) {
      setClLoading(false);
      return;
    }
    try {
      setClLoading(true);
      setClError(null);
      const response = await api.get("/certificates/", { params: { email } });
      setClCertificates(response.data?.data || []);
    } catch (err) {
      console.error("Error loading CareerLens certificates:", err);
      setClError(
        getErrorMessage(err, "We couldn't load your certificates. Please try again.")
      );
    } finally {
      setClLoading(false);
    }
  }, [email]);

  const loadRecommendations = useCallback(async () => {
    if (!email) {
      setRecLoading(false);
      return;
    }
    try {
      setRecLoading(true);
      setRecError(null);
      const response = await api.get("/certificates/recommendations", {
        params: { email },
      });
      setRecReady(Boolean(response.data?.ready));
      setRecMessage(response.data?.message || null);
      setRecommendations(response.data?.recommendations || []);
    } catch (err) {
      console.error("Error loading recommendations:", err);
      setRecError(
        getErrorMessage(err, "We couldn't load your certification recommendations. Please try again.")
      );
    } finally {
      setRecLoading(false);
    }
  }, [email]);

  useEffect(() => {
    loadMyCertificates();
    loadCareerLensCertificates();
    loadRecommendations();
  }, [loadMyCertificates, loadCareerLensCertificates, loadRecommendations]);

  const handleUploadCertificate = async (fields) => {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("certificate_name", fields.certificate_name);
    formData.append("provider", fields.provider);
    formData.append("issue_date", fields.issue_date);
    formData.append("category", fields.category);
    formData.append("file", fields.file);

    await api.post("/certificates/my", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setUploadModalOpen(false);
    loadMyCertificates();
  };

  const handleDeleteCertificate = async (certificateId) => {
    // Throws on failure so MyCertificatesSection's confirm dialog can
    // show the error and keep the certificate visible - state is only
    // touched here after a real success, no page reload involved.
    await api.delete(`/certificates/my/${certificateId}`, {
      params: { email },
    });
    setMyCertificates((prev) => prev.filter((c) => c.id !== certificateId));
  };

  const handleProgressChange = async (recommendationId, progressPercent) => {
    const previous = recommendations;
    setUpdatingId(recommendationId);
    setActionError(null);

    // Optimistic update so the select feels instant.
    setRecommendations((prev) =>
      prev.map((rec) =>
        rec.id === recommendationId
          ? { ...rec, progress_percent: progressPercent }
          : rec
      )
    );

    try {
      await api.put(`/certificates/recommendations/${recommendationId}/progress`, {
        email,
        progress_percent: progressPercent,
      });
    } catch (err) {
      console.error("Error updating progress:", err);
      setRecommendations(previous);
      setActionError(
        getErrorMessage(err, "We couldn't update your progress. Please try again.")
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCompleteCertification = async (fields) => {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("certificate_name", fields.certificate_name);
    formData.append("provider", fields.provider);
    formData.append("issue_date", fields.issue_date);
    formData.append("file", fields.file);

    await api.post(
      `/certificates/recommendations/${completeRec.id}/complete`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    setCompleteRec(null);
    loadMyCertificates();
    loadRecommendations();
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white">Certificates</h1>
        <p className="text-gray-400 mt-2">
          Your certification dashboard - uploaded certificates, CareerLens
          achievements, and AI-powered recommendations, all in one place.
        </p>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-red-300 text-sm flex-1">{actionError}</p>
          <button onClick={() => setActionError(null)}>
            <X className="text-red-300" size={16} />
          </button>
        </div>
      )}

      {/* Analytics - always above the three sections, always computed
          from the real lists loaded below (never hardcoded). */}
      <CertificateAnalytics
        myCertificates={myCertificates}
        clCertificates={clCertificates}
        recommendations={recommendations}
      />

      {/* Three sections, stacked VERTICALLY (not side-by-side) - each
          one scrolls its own certificate cards horizontally. Order:
          My Certificates -> CareerLens Certificates -> Recommended
          Certifications. */}
      <div className="space-y-6">
        <MyCertificatesSection
          certificates={myCertificates}
          loading={myCertsLoading}
          error={myCertsError}
          onUploadClick={() => setUploadModalOpen(true)}
          onDeleteCertificate={handleDeleteCertificate}
        />
        <CareerLensCertificatesSection
          certificates={clCertificates}
          loading={clLoading}
          error={clError}
        />
        <RecommendedCertificationsSection
          ready={recReady}
          message={recMessage}
          recommendations={recommendations}
          loading={recLoading}
          error={recError}
          updatingId={updatingId}
          onProgressChange={handleProgressChange}
          onViewDetails={(rec) => setDetailsRec(rec)}
          onCompleteClick={(rec) => setCompleteRec(rec)}
          onRetry={loadRecommendations}
        />
      </div>

      {uploadModalOpen && (
        <UploadCertificateModal
          title="Upload Certificate"
          showCategory
          requireDetails={false}
          submitLabel="Upload Certificate"
          onClose={() => setUploadModalOpen(false)}
          onSubmit={handleUploadCertificate}
        />
      )}

      {detailsRec && (
        <CertificateDetailsModal
          recommendation={detailsRec}
          onClose={() => setDetailsRec(null)}
        />
      )}

      {completeRec && (
        <UploadCertificateModal
          title="Complete Certification"
          showCategory={false}
          initialName={completeRec.certificate_name}
          initialProvider={completeRec.provider}
          lockNameAndProvider
          submitLabel="Add to My Certificates"
          onClose={() => setCompleteRec(null)}
          onSubmit={handleCompleteCertification}
        />
      )}
    </DashboardLayout>
  );
}
