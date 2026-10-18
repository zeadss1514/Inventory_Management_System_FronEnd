import { useCallback, useEffect, useState } from "react";
import apiFetch from "../utils/apiFetch";
import { toMessage } from "../utils/errorMessage";
// status: "loading" | "success" | "error"
// The API answers { data: [...] }; a bare array works too.
export default function useFetchList(url) {
  const [state, setState] = useState({ status: "loading", items: [], error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const res = await apiFetch(url, { signal: controller.signal });
        // Read the body BEFORE checking it, so the server's own message can be shown.
        let json = null;
        try {
          json = await res.json();
        } catch {
          // no body / not JSON
        }
        // The API can answer HTTP 200 with { success: false, message } too.
        if (!res.ok || json?.success === false) {
          throw new Error(toMessage(json?.message, `تعذّر تحميل البيانات (HTTP ${res.status})`));
        }
        const items = Array.isArray(json) ? json : (json?.data ?? []);
        setState({ status: "success", items, error: null });
      } catch (error) {
        if (error.name === "AbortError") return;
        setState({ status: "error", items: [], error });
      }
    }

    load();
    return () => controller.abort();
  }, [url, reloadKey]);

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, status: "loading" }));
    setReloadKey((key) => key + 1);
  }, []);

  return { ...state, reload };
}
