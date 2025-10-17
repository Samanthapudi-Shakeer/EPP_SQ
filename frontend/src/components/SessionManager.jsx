import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  broadcastSessionLogout,
  isTokenExpired,
  SESSION_CHECK_INTERVAL_MS,
  SESSION_IDLE_TIMEOUT_MS,
  subscribeToSessionLogout
} from "../utils/session";

const activityEvents = ["click", "keydown", "mousemove", "scroll", "touchstart"];

const SessionManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (location.pathname === "/login") {
      redirectingRef.current = false;
    }
  }, [location.pathname]);

  const redirectToLogin = useCallback(
    (reason = "expired") => {
      if (redirectingRef.current) {
        return;
      }

      redirectingRef.current = true;

      if (location.pathname !== "/login") {
        const state = reason === "expired" ? { sessionExpired: true } : undefined;
        navigate("/login", { replace: true, state });
      }
    },
    [location.pathname, navigate]
  );

  useEffect(() => {
    let lastActivity = Date.now();

    const markActivity = () => {
      lastActivity = Date.now();
    };

    activityEvents.forEach((event) => window.addEventListener(event, markActivity));

    const enforceSessionState = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      if (isTokenExpired(token)) {
        broadcastSessionLogout();
        redirectToLogin("expired");
        return;
      }

      if (Date.now() - lastActivity > SESSION_IDLE_TIMEOUT_MS) {
        broadcastSessionLogout();
        redirectToLogin("expired");
      }
    };

    const intervalId = window.setInterval(enforceSessionState, SESSION_CHECK_INTERVAL_MS);
    enforceSessionState();

    const unsubscribe = subscribeToSessionLogout(() => {
      redirectToLogin("logout");
    });

    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          broadcastSessionLogout();
          const detail = error.response?.data?.detail || "";
          const reason = /expired/i.test(detail) ? "expired" : "logout";
          redirectToLogin(reason);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      window.clearInterval(intervalId);
      activityEvents.forEach((event) => window.removeEventListener(event, markActivity));
      unsubscribe();
      axios.interceptors.response.eject(interceptorId);
    };
  }, [navigate, location.pathname]);

  return null;
};

export default SessionManager;
