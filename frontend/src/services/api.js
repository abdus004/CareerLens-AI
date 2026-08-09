import axios from "axios";
import { getCurrentSession } from "../utils/session";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Attaches the logged-in user's Supabase access token to every
// request made through this client, so backend routes that check
// identity (see backend/app/utils/security.py -> get_authenticated_email)
// can verify who is actually calling, instead of trusting whatever
// `email` value happens to be in the request body/path/query.
//
// Silently sends no Authorization header when there's no session
// (e.g. Login/Signup themselves, which run before any session
// exists) - those endpoints don't require it, and routes that do
// require it will correctly respond 401 rather than fail in some
// more confusing way.
api.interceptors.request.use((config) => {
    const session = getCurrentSession();
    const token = session?.access_token;

    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;
