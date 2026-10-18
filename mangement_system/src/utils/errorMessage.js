// Turns whatever the server put in `message` into a string we can show.
// Some backends send an Error object there (e.g. a jsonwebtoken error:
// { name: "TokenExpiredError", message: "jwt expired" }), and
// `new Error(thatObject)` would print "[object Object]".
export function toMessage(value, fallback) {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    if (typeof value.message === "string" && value.message.trim()) return value.message;
    if (value.message && typeof value.message === "object") return toMessage(value.message, fallback);
    if (typeof value.error === "string" && value.error.trim()) return value.error;
    if (typeof value.name === "string" && value.name.trim()) return value.name;
  }
  return fallback;
}
