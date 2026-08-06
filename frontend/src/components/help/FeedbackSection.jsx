import { useState } from "react";
import { MessageSquareHeart, Star, Loader2, CheckCircle2 } from "lucide-react";
import api from "../../services/api";
import { getCurrentUser } from "../../utils/session";

export default function FeedbackSection() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (rating < 1) {
      setError("Please select a star rating.");
      return;
    }

    const user = getCurrentUser();
    if (!user?.email) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/support/feedback", {
        email: user.email,
        rating,
        message,
      });

      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not submit your feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <CheckCircle2 className="text-emerald-400 mx-auto mb-3" size={40} />
        <h2 className="text-xl font-bold text-white">Thank you for your feedback!</h2>
        <p className="text-gray-400 text-sm mt-1">
          It genuinely helps us make CareerLens AI better.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setRating(0);
            setMessage("");
          }}
          className="mt-5 text-sm text-violet-400 hover:text-violet-300 transition"
        >
          Share more feedback
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquareHeart className="text-cyan-400" size={28} />
        <h2 className="text-2xl font-bold text-white">Feedback</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((value) => {
            const filled = value <= (hoverRating || rating);
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={filled ? "text-orange-400 fill-orange-400" : "text-gray-600"}
                />
              </button>
            );
          })}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your experience with CareerLens AI..."
          rows={4}
          className="
            w-full rounded-2xl border border-white/10 bg-white/5
            px-5 py-3 text-white placeholder:text-gray-500 outline-none resize-none
            transition-all duration-300 focus:border-violet-500
            focus:ring-2 focus:ring-violet-500/40 focus:bg-white/10
          "
        />

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="
            mt-4 px-6 py-3 rounded-xl
            bg-gradient-to-r from-violet-600 to-cyan-500
            hover:opacity-90 transition text-white font-semibold
            disabled:opacity-60 flex items-center gap-2
          "
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Submit Feedback
        </button>
      </form>
    </div>
  );
}
