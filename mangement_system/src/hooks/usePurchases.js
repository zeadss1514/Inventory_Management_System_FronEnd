import { API_ENDPOINTS } from "../config/api";
import useFetchList from "./useFetchList";

// tab: "active" | "draft" — each has its own endpoint, so switching tabs
// naturally refetches (useFetchList re-runs whenever the url changes).
export default function usePurchases(tab) {
  const url = tab === "draft" ? API_ENDPOINTS.purchasesDraft : API_ENDPOINTS.purchasesActive;
  const { items, ...rest } = useFetchList(url);
  return { invoices: items, ...rest };
}
