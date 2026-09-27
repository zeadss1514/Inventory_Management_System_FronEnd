import { useCallback, useEffect, useState } from "react";

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
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
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
