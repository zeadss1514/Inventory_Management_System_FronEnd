// POSTs JSON and returns the parsed body. The API answers
// { success, message, data }, so this throws the server's own `message`
// whenever success is false or the HTTP status isn't ok — callers show
// err.message directly to the user.
//
// (Same logic as the private copies inside CreateInvoiceModal /
// CreateTransactionModal; the Usage wizard imports this shared one so we
// don't add a third copy.)
export async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // No JSON body — fine for a plain 200/204, but we have no message on failure.
  }
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || "حدث خطأ غير متوقع. حاول مرة أخرى.");
  }
  return json ?? {};
}

// The API sometimes wraps the record in an array (e.g. [record, otherDoc]).
// This always returns the first record either way.
export function firstRecord(data) {
  return Array.isArray(data) ? data[0] : data;
}
