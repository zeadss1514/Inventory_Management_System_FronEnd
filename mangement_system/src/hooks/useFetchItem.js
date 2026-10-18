import { useCallback, useEffect, useState } from "react";
import apiFetch from "../utils/apiFetch";
import { toMessage } from "../utils/errorMessage";

// status: "loading" | "success" | "error"
// The API answers { data: {...} }; a bare object works too.
export default function useFetchItem(url) {
  const [state, setState] = useState({ status: "loading", item: null, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!url) return;
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
        const item = json?.data ?? json;
        setState({ status: "success", item, error: null });
      } catch (error) {
        if (error.name === "AbortError") return;
        setState({ status: "error", item: null, error });
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
