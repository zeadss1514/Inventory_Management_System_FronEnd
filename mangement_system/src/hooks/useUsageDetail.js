import { API_ENDPOINTS } from "../config/api";
import useFetchItem from "./useFetchItem";

// GET /usage/:id  — passing a falsy id skips the fetch.
export default function useUsageDetail(id) {
  const { status, item, error, reload } = useFetchItem(id ? API_ENDPOINTS.usageDetail(id) : null);
  // The API sometimes wraps the record in an array; take the first record.
  const usage = Array.isArray(item) ? item[0] : item;
  return { status, usage, error, reload };
}
