import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { restoreSession, subscribeToSessionChanges } from "../../utils/session";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, status: "missing" });

  useEffect(() => {
    let active = true;
    const checkSession = () => restoreSession().then((result) => {
      if (active) setState({ loading: false, ...result });
    });
    checkSession();
    const unsubscribe = subscribeToSessionChanges(checkSession);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070d]">
        <RefreshCw className="text-cyan-400 animate-spin" size={36} />
      </div>
    );
  }

  if (state.status !== "authenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, sessionExpired: state.status === "expired" }}
      />
    );
  }

  return children;
}
