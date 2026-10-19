import { API_ENDPOINTS } from "../config/api";
import useFetchList from "./useFetchList";

// GET /logs/<productId>/<placeId> — the logs of one product in one place.
// Goes through useFetchList -> apiFetch (token sent, 401 -> /login).
export default function useProductLogs(productId, placeId) {
  const { items, ...rest } = useFetchList(API_ENDPOINTS.productLogs(productId, placeId));
  return { logs: items, ...rest };
}
