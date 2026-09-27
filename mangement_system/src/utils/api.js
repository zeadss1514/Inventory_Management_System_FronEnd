export class ApiError extends Error {}

// Reads a fetch response the way this API is documented to behave: it can
// return HTTP 200 with { success: false, message, data: null } for a
// business-logic error, not just non-2xx statuses. Either way, the server's
// own "message" is what should be shown to the user — never a generic
// hardcoded string.
export async function readApiResponse(res) {
  let json = null;
  try {
    json = await res.json();
  } catch {
    // No body, or not JSON — fall through with json === null.
  }
  if (!res.ok || json?.success === false) {
    throw new ApiError(json?.message || `حدث خطأ غير متوقع (HTTP ${res.status})`);
  }
  return json;
}

// Some endpoints answer with `data` as an array holding more than one kind
// of object (e.g. [invoice, destination]) instead of just the one you asked
// for. This picks the entry that actually has the field you expect,
// falling back to the first entry, or to `data` itself if it isn't an array.
export function pickEntity(data, discriminatorKey) {
  if (Array.isArray(data)) {
    return data.find((d) => d && Object.prototype.hasOwnProperty.call(d, discriminatorKey)) ?? data[0] ?? null;
  }
  return data ?? null;
}
