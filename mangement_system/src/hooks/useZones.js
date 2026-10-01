import useFetchList from "./useFetchList";
import { API_ENDPOINTS } from "../config/api";

// Thin wrapper over useFetchList: GET /zone -> { zones, status, error, reload }
export default function useZones() {
  const { items, status, error, reload } = useFetchList(API_ENDPOINTS.zones);
  return { zones: items ?? [], status, error, reload };
}
