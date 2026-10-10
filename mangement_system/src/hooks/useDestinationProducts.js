import { useCallback, useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api";

// The endpoints return stock entries:
//   { productId: { _id, name, measurementUnit, ... }, stock, minStock, maxStock, notes, _id }
// Consumers want a flat product, so this returns the product's own fields
// (so `_id` is the PRODUCT id, not the stock entry's) plus `stock`.
// A plain product (no populated productId) is passed through unchanged.
function normalizeStockEntry(entry) {
  const product = entry?.productId ?? entry?.ProductId;
  if (product && typeof product === "object") {
    return {
      ...product,
      stock: Number(entry.stock) || 0,
      minStock: entry.minStock,
      maxStock: entry.maxStock,
      notes: entry.notes,
      stockEntryId: entry._id,
    };
  }
  return entry;
}

// Products that exist in ONE place:
//   type "Sites"        -> GET /products/site/<siteId>
//   anything else       -> GET /products/inventory/<inventoryId>
// Pass an empty id and nothing is fetched (status stays "idle").
export default function useDestinationProducts(type, id) {
  const [state, setState] = useState({ status: "idle", products: [], error: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!id) {
      setState({ status: "idle", products: [], error: null });
      return undefined;
    }

    const url = type === "Sites" ? API_ENDPOINTS.productsBySite(id) : API_ENDPOINTS.productsByInventory(id);
    const controller = new AbortController();
    setState({ status: "loading", products: [], error: null });

    (async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        let json = null;
        try {
          json = await res.json();
        } catch {
          // no JSON body
        }
        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || "تعذّر تحميل قائمة المنتجات.");
        }
        const data = json?.data ?? json;
        setState({
          status: "success",
          products: (Array.isArray(data) ? data : []).map(normalizeStockEntry),
          error: null,
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        setState({ status: "error", products: [], error: err });
      }
    })();

    return () => controller.abort();
  }, [type, id, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
