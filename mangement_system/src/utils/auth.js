// Token / session storage. Everything that touches localStorage lives here so
// the storage choice (localStorage vs cookie) can change in one place.
// Every call is wrapped in try/catch: storage can be unavailable (private
// mode, blocked cookies) and must never crash the app.
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession({ token, user }) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // storage unavailable — the session just won't survive a reload
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

// Header to merge into any request that needs authentication.
export function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// The token's payload (what the backend sees as `req.auth`), or null.
// This only DECODES the JWT (no signature check — the server does that), so it
// is for showing/hiding UI. The backend must still enforce every permission.
export function getAuth() {
  const token = getToken();
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

// true only when the payload has `key === true`, e.g. hasPermission("doTransactions").
export function hasPermission(key) {
  return getAuth()?.[key] === true;
}

// true when the token's `role` is exactly one of the given roles,
// e.g. hasRole("admin", "superAdmin"). UI only — the server must enforce it.
export function hasRole(...roles) {
  const role = getAuth()?.role;
  return typeof role === "string" && roles.includes(role);
}
