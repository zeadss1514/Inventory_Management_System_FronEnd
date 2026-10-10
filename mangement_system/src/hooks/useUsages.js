import { API_ENDPOINTS } from "../config/api";
import useFetchList from "./useFetchList";

// "active" -> GET /usage, "draft" -> GET /usage/draft
export default function useUsages(tab) {
  const url = tab === "draft" ? API_ENDPOINTS.usageDraft : API_ENDPOINTS.usageActive;
  const { status, items, error, reload } = useFetchList(url);
  return { status, usages: items, error, reload };
}
