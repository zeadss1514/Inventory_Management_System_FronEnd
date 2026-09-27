import { useCallback, useEffect, useState } from "react";

// status: "loading" | "success" | "error"
// The API answers { data: [...] }; a bare array works too.
export default function useFetchList(url) {
  const [state, setState] = useState({ status: "loading", items: [], error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const items = Array.isArray(json) ? json : json.data ?? [];
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
