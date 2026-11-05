import axios from "axios";
import { clearSession, getCurrentSession, refreshSession } from "../utils/session";

const EXCLUDED_REFRESH_PATHS = [
  "/auth/login",
  "/auth/signup",
  "/auth/refresh",
  "/auth/logout",
  "/settings/change-password",
  "/settings/account/delete",
];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

function requestPath(config) {
  return String(config?.url || "").split("?")[0];
}

export function isRefreshExcluded(config) {
  return EXCLUDED_REFRESH_PATHS.some((path) => requestPath(config).endsWith(path));
}

export function isSessionFailure(response) {
  const detail = String(response?.data?.detail || "").toLowerCase();
  return /(session|authorization|bearer|access token|jwt|token.*expired|expired.*token)/.test(detail);
}

api.interceptors.request.use((config) => {
  const token = getCurrentSession()?.access_token;
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Do not carry an Axios default/header from a previous account into an
    // unauthenticated request.
    delete config.headers.Authorization;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    const response = error?.response;
    if (
      response?.status !== 401 ||
      !config ||
      config.__sessionRetry ||
      isRefreshExcluded(config) ||
      !isSessionFailure(response)
    ) {
      return Promise.reject(error);
    }

    config.__sessionRetry = true;
    try {
      const session = await refreshSession();
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${session.access_token}`;
      return api(config);
    } catch (refreshError) {
      // Only a definitively invalid/rotated refresh token logs the browser
      // out. Service outages/rate limits leave the session in place so a
      // later request can recover without forcing an unnecessary login.
      if (refreshError?.status === 401) clearSession();
      error.sessionRefreshError = refreshError;
      return Promise.reject(error);
    }
  }
);

export default api;
