import apiFetch from "./apiFetch";
import { readApiResponse } from "./api";

// PUT twin of postJson: goes through apiFetch (Bearer token + 401 -> login),
// throws Error(server message) on failure, returns the parsed response.
export async function putJson(url, body) {
  const res = await apiFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return readApiResponse(res);
}
