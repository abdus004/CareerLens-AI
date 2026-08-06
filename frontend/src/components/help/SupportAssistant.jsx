import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";
import api from "../../services/api";

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hi! I'm the CareerLens AI Support Assistant. Ask me anything about using CareerLens AI - your resume, skill analysis, mock interviews, certificates, settings, and more.",
};

const SUGGESTIONS = [
  "Why didn't I receive a certificate?",
  "How do I replace my resume?",
  "How does Job Recommendations work?",
];

export default function SupportAssistant() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const history = messages.map(({ role, content }) => ({ role, content }));
    const nextMessages = [...messages, { role: "user", content: trimmed }];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setSending(true);

    try {
      const response = await api.post("/support/assistant", {
        message: trimmed,
        history,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.reply },
      ]);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "The support assistant is temporarily unavailable. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="flex items-center gap-3 mb-2">
        <Bot className="text-violet-400" size={28} />
        <h2 className="text-2xl font-bold text-white">CareerLens AI Support Assistant</h2>
      </div>
      <p className="text-gray-400 text-sm mb-6">
        Scoped to CareerLens AI - it can help with how to use the platform, not general questions.
      </p>

      <div
        ref={scrollRef}
        className="rounded-2xl border border-white/10 bg-[#0B1120] p-5 h-[360px] overflow-y-auto space-y-4"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`
                max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                ${message.role === "user"
                  ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white"
                  : "bg-white/5 border border-white/10 text-gray-200"}
              `}
            >
              {message.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <Loader2 size={14} className="text-gray-400 animate-spin" />
              <span className="text-gray-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => sendMessage(suggestion)}
              className="
                text-xs px-3 py-2 rounded-full
                border border-white/10 text-gray-300
                hover:bg-white/10 transition flex items-center gap-1.5
              "
            >
              <Sparkles size={12} className="text-cyan-400" />
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

      <form onSubmit={handleSubmit} className="flex items-center gap-3 mt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about using CareerLens AI..."
          disabled={sending}
          className="
            flex-1 rounded-2xl border border-white/10 bg-white/5
            px-5 py-3 text-white placeholder:text-gray-500 outline-none
            transition-all duration-300 focus:border-violet-500
            focus:ring-2 focus:ring-violet-500/40 focus:bg-white/10
            disabled:opacity-60
          "
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="
            w-12 h-12 rounded-2xl flex-shrink-0
            bg-gradient-to-r from-violet-600 to-cyan-500
            flex items-center justify-center
            hover:opacity-90 transition disabled:opacity-50
          "
        >
          <Send size={18} className="text-white" />
        </button>
      </form>
    </div>
  );
}
