import { API_ENDPOINTS } from "../config/api";
import useFetchList from "./useFetchList";

// GET /logs — goes through useFetchList -> apiFetch, so the Bearer token is
// sent and a 401 redirects to /login.
export default function useLogs() {
  const { items, ...rest } = useFetchList(API_ENDPOINTS.logs);
  return { logs: items, ...rest };
}
