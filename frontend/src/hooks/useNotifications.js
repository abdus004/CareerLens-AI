import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";
import { getCurrentUser } from "../utils/session";

// Polling interval for the bell's background refresh. Not true
// realtime - this project's frontend has no @supabase/supabase-js
// client at all (every Supabase call goes through the FastAPI backend
// only, see backend/migrations/*.sql for why), so subscribing to
// Postgres changes directly from the browser would mean adding a
// whole new client + exposing a Supabase anon key + writing RLS
// policies that don't exist anywhere in this schema today. Polling
// every 60s plus an immediate refetch whenever the dropdown is opened
// (see NotificationBell.jsx) is the "reliable refresh behavior
// instead" the brief allows for when Realtime isn't a good fit -
// simple, and reuses the exact same GET this hook already needs.
const POLL_INTERVAL_MS = 60000;

/**
 * All state and API calls for the Dashboard bell notification feed.
 * Shared shape with useAssessmentSession.js / other hooks/*.js in this
 * project: a loadX() fetcher, plain state, and small action functions
 * that optimistically update local state before confirming with the
 * backend, so the dropdown feels instant.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    const user = getCurrentUser();
    if (!user?.email) return;
    emailRef.current = user.email;

    try {
      setLoading(true);
      const response = await api.get(
        `/notifications/${encodeURIComponent(user.email)}`
      );
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unread_count || 0);
    } catch {
      // Silent - the bell just keeps showing whatever it last had.
      // Not worth an error banner for a background poll.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(loadNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    const email = emailRef.current;
    if (!email) return;

    // Optimistic - the click that opened/navigated from this
    // notification shouldn't wait on a round trip to look read.
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.patch(
        `/notifications/${encodeURIComponent(email)}/${notificationId}/read`
      );
    } catch {
      // Best-effort - a stale "read" state on a transient failure
      // self-corrects on the next poll.
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const email = emailRef.current;
    if (!email) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await api.patch(`/notifications/${encodeURIComponent(email)}/read-all`);
    } catch {
      // Best-effort, same as markAsRead above.
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    refresh: loadNotifications,
    markAsRead,
    markAllAsRead,
  };
}
