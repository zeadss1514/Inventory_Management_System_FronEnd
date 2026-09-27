import { useCallback, useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import { pickEntity, readApiResponse } from "../utils/api";

// status: "loading" | "success" | "error"
export default function usePurchaseDetail(id) {
  const [state, setState] = useState({ status: "loading", invoice: null, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(API_ENDPOINTS.purchaseDetail(id), { signal: controller.signal });
        const json = await readApiResponse(res);
        // Some endpoints on this API wrap the record in an array alongside a
        // related doc (seen on POST /purchase) — handle that here too.
        const invoice = pickEntity(json?.data, "purchaseToType");
        setState({ status: "success", invoice, error: null });
      } catch (error) {
        if (error.name === "AbortError") return;
        setState({ status: "error", invoice: null, error });
      }
    }

    load();
    return () => controller.abort();
  }, [id, reloadKey]);

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, status: "loading" }));
    setReloadKey((key) => key + 1);
  }, []);

  return { ...state, reload };
}
