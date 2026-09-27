import { API_ENDPOINTS } from "../config/api";
import useFetchList from "./useFetchList";

export default function useSites() {
  const { items, ...rest } = useFetchList(API_ENDPOINTS.sites);
  return { sites: items, ...rest };
}
