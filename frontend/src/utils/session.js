const SESSION_EVENT = "session:logout";
const SESSION_STORAGE_KEY = "session:logout";

export const parseJwt = (token) => {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded;
  } catch (error) {
    return null;
  }
};

export const getTokenExpiry = (token) => {
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== "number") {
    return null;
  }
  return payload.exp * 1000;
};

export const isTokenExpired = (token, now = Date.now()) => {
  const expiry = getTokenExpiry(token);
  if (expiry === null) {
    return false;
  }
  return expiry <= now;
};

export const broadcastSessionLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  const timestamp = Date.now().toString();
  localStorage.setItem(SESSION_STORAGE_KEY, timestamp);
  window.dispatchEvent(new Event(SESSION_EVENT));
  // Clean up the marker asynchronously to prevent storage bloat.
  window.setTimeout(() => {
    if (localStorage.getItem(SESSION_STORAGE_KEY) === timestamp) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, 0);
};

export const subscribeToSessionLogout = (callback) => {
  const handleLogoutEvent = () => callback();
  const handleStorageEvent = (event) => {
    if (event.key === SESSION_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener(SESSION_EVENT, handleLogoutEvent);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener(SESSION_EVENT, handleLogoutEvent);
    window.removeEventListener("storage", handleStorageEvent);
  };
};

export const SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
export const SESSION_CHECK_INTERVAL_MS = 30 * 1000; // 30 seconds

export default {
  parseJwt,
  getTokenExpiry,
  isTokenExpired,
  broadcastSessionLogout,
  subscribeToSessionLogout,
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_CHECK_INTERVAL_MS
};
