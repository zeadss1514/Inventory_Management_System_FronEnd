import apiFetch from "./apiFetch";
import { toMessage } from "./errorMessage";

// POSTs JSON (with the Bearer token) and returns the parsed body. The API
// answers { success, message, data }, so this throws the server's own
// `message` whenever success is false or the HTTP status isn't ok — callers
// show err.message directly to the user.
//
// postJson(url, body)                              normal request
// postJson(url, body, { skipAuthRedirect: true })  the login request only:
//   a wrong password is a 401 and must NOT bounce the user back to /login.
export async function postJson(url, body, { skipAuthRedirect = false } = {}) {
  const res = await apiFetch(url, {
    method: "POST",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    skipAuthRedirect,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // No JSON body — fine for a plain 200/204, but we have no message on failure.
  }
  if (!res.ok || json?.success === false) {
    throw new Error(toMessage(json?.message, "حدث خطأ غير متوقع. حاول مرة أخرى."));
  }
  return json ?? {};
}

// The API sometimes wraps the record in an array (e.g. [record, otherDoc]).
// This always returns the first record either way.
export function firstRecord(data) {
  return Array.isArray(data) ? data[0] : data;
}
