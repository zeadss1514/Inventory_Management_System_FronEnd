import { authHeader, clearSession } from "./auth";

// Sends the current token as `Authorization: Bearer <token>`.
// If the server answers 401 (missing / expired / invalid token) the session is
// cleared and the browser is sent to /login. It's a hard redirect on purpose:
// this runs outside React, so there's no navigate() to call, and a fresh page
// load also drops any state belonging to the old session.
//
//   apiFetch(url, { signal })                          // normal request
//   apiFetch(loginUrl, { method:"POST", ..., skipAuthRedirect: true })
//     ^ pass skipAuthRedirect for the login request itself, otherwise a wrong
//       password (401) would reload /login in a loop.
//
// `init.headers` must be a plain object (not a Headers instance).
export function redirectToLogin() {
  clearSession();
  if (window.location.pathname !== "/login") window.location.replace("/login");
}

export default async function apiFetch(input, init = {}) {
  const { skipAuthRedirect, headers, ...rest } = init;
  const res = await fetch(input, { ...rest, headers: { ...authHeader(), ...(headers ?? {}) } });
  if (res.status === 401 && !skipAuthRedirect) redirectToLogin();
  return res;
}
