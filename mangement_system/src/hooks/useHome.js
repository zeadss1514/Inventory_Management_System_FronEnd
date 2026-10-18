import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";
import { authHeader, clearSession } from "../utils/auth";

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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, status: "loading", error: null }));

    (async () => {
      try {
        const res = await fetch(API_ENDPOINTS.home, {
          signal: controller.signal,
          headers: authHeader(), // Authorization: Bearer <token>
        });
        // Missing / expired / invalid token -> back to the login page.
        if (res.status === 401) {
          clearSession();
          navigate("/login", { replace: true, state: { from: location } });
          return;
        }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- location is only read when a 401 happens
  }, [nonce, navigate]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
