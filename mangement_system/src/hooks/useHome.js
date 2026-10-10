import { useCallback, useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api";

const asArray = (v) => (Array.isArray(v) ? v : []);

// GET /  ->  { success, message, data: [invoices, transactions, usages] }
// Standalone (not useFetchList) because `data` is an array of three arrays,
// positional, and must not be flattened.
export default function useHome() {
  const [state, setState] = useState({
    status: "loading",
    invoices: [],
    transactions: [],
    usages: [],
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, status: "loading", error: null }));

    (async () => {
      try {
        const res = await fetch(API_ENDPOINTS.home, { signal: controller.signal });
        let json = null;
        try {
          json = await res.json();
        } catch {
          // no JSON body
        }
        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || "تعذّر تحميل بيانات الصفحة الرئيسية.");
        }
        const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        setState({
          status: "success",
          invoices: asArray(data[0]),
          transactions: asArray(data[1]),
          usages: asArray(data[2]),
          error: null,
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        setState((s) => ({ ...s, status: "error", error: err }));
      }
    })();

    return () => controller.abort();
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
