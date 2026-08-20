import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  FileText,
  Code2,
  Compass,
  BookOpen,
  Briefcase,
  Clock,
  Award,
  Sparkles,
  CheckCheck,
} from "lucide-react";

import { useNotifications } from "../../hooks/useNotifications";

// Maps each backend `type` (see backend/app/services/notification_service.py
// call sites) to the icon + accent shown in the dropdown. Falls back to
// a plain Bell/violet for any type not listed here, so a future event
// type never breaks rendering - it just looks a little generic until
// this map is extended.
const TYPE_STYLES = {
  resume: { icon: FileText, color: "text-cyan-400", bg: "bg-cyan-500/15" },
  skills: { icon: Code2, color: "text-green-400", bg: "bg-green-500/15" },
  career: { icon: Compass, color: "text-violet-400", bg: "bg-violet-500/15" },
  learning_path: { icon: BookOpen, color: "text-violet-400", bg: "bg-violet-500/15" },
  jobs: { icon: Briefcase, color: "text-yellow-400", bg: "bg-yellow-500/15" },
  drive_deadline: { icon: Clock, color: "text-red-400", bg: "bg-red-500/15" },
  certificate: { icon: Award, color: "text-cyan-400", bg: "bg-cyan-500/15" },
  certificate_relevance: { icon: Sparkles, color: "text-violet-400", bg: "bg-violet-500/15" },
};

function typeStyle(type) {
  return TYPE_STYLES[type] || { icon: Bell, color: "text-violet-400", bg: "bg-violet-500/15" };
}

function timeAgo(isoString) {
  if (!isoString) return "";

  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, refresh, markAsRead, markAllAsRead } =
    useNotifications();

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Closes the dropdown on any click outside it - standard pattern,
  // matches how the rest of this app doesn't rely on native <details>
  // or a portal for small popovers.
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      // Refetch the instant it's opened, on top of the hook's own
      // 60s poll - so a notification created moments ago (e.g. right
      // after clicking Reanalyze) shows up without waiting for the
      // next poll tick.
      if (next) refresh();
      return next;
    });
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      setOpen(false);
      navigate(notification.link);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
    >
      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        className="
          relative
          w-10
          h-10
          rounded-xl
          bg-white/5
          border
          border-white/10
          flex
          items-center
          justify-center
          hover:bg-white/10
          transition
        "
      >
        <Bell
          size={18}
          className="text-white"
        />

        {unreadCount > 0 && (
          <span
            className="
              absolute
              -top-1
              -right-1
              min-w-[18px]
              h-[18px]
              px-1
              rounded-full
              bg-red-500
              text-white
              text-[10px]
              font-semibold
              flex
              items-center
              justify-center
            "
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="
            absolute
            right-0
            mt-2
            w-80
            max-w-[90vw]
            max-h-[28rem]
            rounded-2xl
            bg-[#0B1120]
            border
            border-white/10
            shadow-2xl
            backdrop-blur-xl
            z-50
            flex
            flex-col
            overflow-hidden
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              px-4
              py-3
              border-b
              border-white/10
            "
          >
            <h3 className="text-white font-semibold text-sm">
              Notifications
            </h3>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="
                  flex
                  items-center
                  gap-1
                  text-xs
                  text-violet-400
                  hover:text-violet-300
                  transition
                "
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <Bell
                  size={26}
                  className="text-gray-500 mx-auto mb-2"
                />
                <p className="text-gray-500 text-sm">
                  You're all caught up.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const { icon: Icon, color, bg } = typeStyle(notification.type);

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="
                      w-full
                      text-left
                      flex
                      items-start
                      gap-3
                      px-4
                      py-3
                      border-b
                      border-white/5
                      last:border-b-0
                      hover:bg-white/5
                      transition
                    "
                  >
                    <div
                      className={`
                        w-9
                        h-9
                        rounded-lg
                        flex-shrink-0
                        flex
                        items-center
                        justify-center
                        ${bg}
                      `}
                    >
                      <Icon
                        size={16}
                        className={color}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`
                            text-sm
                            leading-snug
                            ${notification.is_read ? "text-gray-300" : "text-white font-medium"}
                          `}
                        >
                          {notification.title}
                        </p>

                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {timeAgo(notification.created_at)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
