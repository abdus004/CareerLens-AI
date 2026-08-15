import { useState, useRef } from "react";
import { LifeBuoy, Paperclip, Loader2, CheckCircle2, X } from "lucide-react";
import api from "../../services/api";
import { getCurrentUser } from "../../utils/session";
import { getErrorMessage } from "../../utils/apiError";

const CATEGORIES = [
  "Account",
  "Resume Analyzer",
  "Career Intelligence",
  "Skill Analysis",
  "Learning Path",
  "Job Recommendations",
  "Upcoming Drives",
  "AI Mock Interview",
  "Skill Assessment",
  "Certificates",
  "Technical Issue",
  "Other",
];

const PRIORITIES = ["Low", "Medium", "High"];

const EMPTY_FORM = {
  subject: "",
  category: CATEGORIES[0],
  priority: "Medium",
  message: "",
};

export default function ContactSupportForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ticketReference, setTicketReference] = useState(null);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setAttachment(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.subject.trim() || !form.message.trim()) {
      setError("Please fill in a subject and a message.");
      return;
    }

    const user = getCurrentUser();
    if (!user?.email) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("email", user.email);
      formData.append("subject", form.subject.trim());
      formData.append("category", form.category);
      formData.append("priority", form.priority);
      formData.append("message", form.message.trim());
      if (attachment) formData.append("attachment", attachment);

      const response = await api.post("/support/ticket", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTicketReference(response.data.ticket_reference);
      setForm(EMPTY_FORM);
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(getErrorMessage(err, "Could not submit your request. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  if (ticketReference) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <CheckCircle2 className="text-emerald-400 mx-auto mb-3" size={40} />
        <h2 className="text-xl font-bold text-white">
          Support request submitted successfully.
        </h2>
        <p className="text-gray-400 text-sm mt-2">
          Your reference number is{" "}
          <span className="text-cyan-400 font-mono font-semibold">{ticketReference}</span>.
          Keep it handy if you follow up.
        </p>
        <button
          type="button"
          onClick={() => setTicketReference(null)}
          className="mt-5 text-sm text-violet-400 hover:text-violet-300 transition"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="flex items-center gap-3 mb-6">
        <LifeBuoy className="text-orange-400" size={28} />
        <h2 className="text-2xl font-bold text-white">Contact Support</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-gray-300 mb-2 text-sm font-medium">Subject</label>
          <input
            type="text"
            value={form.subject}
            onChange={handleChange("subject")}
            placeholder="Brief summary of your issue"
            className="
              w-full rounded-2xl border border-white/10 bg-white/5
              px-5 py-3 text-white placeholder:text-gray-500 outline-none
              transition-all duration-300 focus:border-violet-500
              focus:ring-2 focus:ring-violet-500/40 focus:bg-white/10
            "
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-gray-300 mb-2 text-sm font-medium">Category</label>
            <select
              value={form.category}
              onChange={handleChange("category")}
              className="
                w-full rounded-2xl border border-white/10 bg-white/5
                px-5 py-3 text-white outline-none transition-all duration-300
                focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40 focus:bg-white/10
              "
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#0B1120]">{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm font-medium">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, priority: p }))}
                  className={`
                    flex-1 py-3 rounded-2xl text-sm font-medium border transition
                    ${form.priority === p
                      ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-transparent"
                      : "border-white/10 text-gray-300 hover:bg-white/10"}
                  `}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-gray-300 mb-2 text-sm font-medium">Message</label>
          <textarea
            value={form.message}
            onChange={handleChange("message")}
            placeholder="Describe your issue in detail..."
            rows={5}
            className="
              w-full rounded-2xl border border-white/10 bg-white/5
              px-5 py-3 text-white placeholder:text-gray-500 outline-none resize-none
              transition-all duration-300 focus:border-violet-500
              focus:ring-2 focus:ring-violet-500/40 focus:bg-white/10
            "
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2 text-sm font-medium">
            Attachment <span className="text-gray-500 font-normal">(optional)</span>
          </label>

          {attachment ? (
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0B1120] px-5 py-3">
              <span className="text-gray-300 text-sm truncate">{attachment.name}</span>
              <button
                type="button"
                onClick={() => {
                  setAttachment(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-gray-400 hover:text-red-400 transition flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="
                w-full flex items-center justify-center gap-2 rounded-2xl
                border border-dashed border-white/15 px-5 py-3.5
                text-gray-400 hover:bg-white/5 hover:text-white transition text-sm
              "
            >
              <Paperclip size={16} />
              Attach a file
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="
            px-6 py-3 rounded-xl
            bg-gradient-to-r from-violet-600 to-cyan-500
            hover:opacity-90 transition text-white font-semibold
            disabled:opacity-60 flex items-center gap-2
          "
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Submit Request
        </button>
      </form>
    </div>
  );
}
