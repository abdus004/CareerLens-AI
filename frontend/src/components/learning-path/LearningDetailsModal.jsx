import { useEffect, useState } from "react";
import {
  X,
  RefreshCw,
  BookOpen,
  Target,
  ListChecks,
  Map as MapIcon,
  FileText,
  Video,
  Dumbbell,
  Code2,
  MessageSquareText,
  Award,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";
import { getErrorMessage } from "../../utils/apiError";

function Section({ icon: Icon, title, children, accent = "text-cyan-400" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={accent} size={18} />
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function LinkList({ items, dotClass = "text-cyan-400" }) {
  if (!items || items.length === 0) {
    return <p className="text-gray-500 text-sm">Not specified.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => {
        const title = typeof item === "string" ? item : item.title;
        const url = typeof item === "string" ? null : item.url;
        const type = typeof item === "string" ? null : item.type;
        return (
          <li key={i} className="text-sm flex items-start gap-2">
            <span className={`${dotClass} mt-1`}>•</span>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2 flex-1"
              >
                {title}
                {type ? <span className="text-gray-500"> ({type})</span> : null}
              </a>
            ) : (
              <span className="text-gray-300 flex-1">{title}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function BulletList({ items, dotClass = "text-cyan-400" }) {
  if (!items || items.length === 0) {
    return <p className="text-gray-500 text-sm">Not specified.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="text-gray-300 text-sm flex gap-2">
          <span className={dotClass}>•</span> {item}
        </li>
      ))}
    </ul>
  );
}

export default function LearningDetailsModal({ email, skill, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/learning-path/${email}/topic-details`, {
          params: { skill: skill.skill },
        });
        if (!cancelled) setData(response.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            getErrorMessage(err, "We couldn't load this topic's learning details. Please try again.")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skill?.skill, email]);

  const details = data?.details;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0b0e1a] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{skill.skill}</h2>
            <p className="text-gray-400 mt-1">
              {skill.level}
              {skill.duration ? ` • ${skill.duration}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center flex-shrink-0"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
            <RefreshCw className="animate-spin" size={28} />
            <p>Generating your personalized learning guide...</p>
            <p className="text-gray-600 text-xs">
              This only happens once - future visits load instantly.
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 flex items-start gap-3">
            <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && details && (
          <div className="space-y-5">
            <Section icon={BookOpen} title="Overview">
              <p className="text-gray-300 text-sm leading-relaxed">{details.overview}</p>
            </Section>

            <Section icon={Target} title="Why This Skill Matters" accent="text-violet-400">
              <p className="text-gray-300 text-sm leading-relaxed">{details.why_important}</p>
            </Section>

            <div className="grid sm:grid-cols-2 gap-5">
              <Section icon={CheckCircle2} title="Prerequisites" accent="text-yellow-400">
                <BulletList items={details.prerequisites} dotClass="text-yellow-400" />
              </Section>

              <Section icon={ListChecks} title="Skills You'll Learn">
                <BulletList items={details.skills_to_learn} />
              </Section>
            </div>

            <Section icon={MapIcon} title="Learning Roadmap" accent="text-violet-400">
              {details.roadmap && details.roadmap.length > 0 ? (
                <ol className="space-y-3">
                  {details.roadmap.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-white text-sm font-medium">{step.step}</p>
                        {step.description && (
                          <p className="text-gray-400 text-sm mt-0.5">{step.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-gray-500 text-sm">Not specified.</p>
              )}
            </Section>

            <div className="grid sm:grid-cols-2 gap-5">
              <Section icon={FileText} title="Official Documentation">
                <LinkList items={details.official_documentation} />
              </Section>

              <Section icon={FileText} title="Free Resources" accent="text-green-400">
                <LinkList items={details.free_resources} dotClass="text-green-400" />
              </Section>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <Section icon={FileText} title="Paid Resources" accent="text-yellow-400">
                <LinkList items={details.paid_resources} dotClass="text-yellow-400" />
              </Section>

              <Section icon={Video} title="YouTube Resources" accent="text-red-400">
                <LinkList items={details.youtube_resources} dotClass="text-red-400" />
              </Section>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <Section icon={Code2} title="Practice Problems" accent="text-cyan-400">
                <LinkList items={details.practice_problems} />
              </Section>

              <Section icon={Dumbbell} title="Mini Projects" accent="text-violet-400">
                {details.mini_projects && details.mini_projects.length > 0 ? (
                  <ul className="space-y-2">
                    {details.mini_projects.map((p, i) => (
                      <li key={i} className="text-sm">
                        <span className="text-white font-medium">{p.title}</span>
                        {p.description && (
                          <p className="text-gray-400 mt-0.5">{p.description}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">Not specified.</p>
                )}
              </Section>
            </div>

            <Section icon={MessageSquareText} title="Interview Preparation" accent="text-orange-400">
              <BulletList items={details.interview_preparation} dotClass="text-orange-400" />
            </Section>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="text-cyan-400" size={18} />
                  <h3 className="text-white font-semibold">Estimated Duration</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  {details.estimated_duration || skill.duration || "Not specified."}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="text-yellow-400" size={18} />
                  <h3 className="text-white font-semibold">Recommended Certification</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  {details.recommended_certification || "No specific certification recommended."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
