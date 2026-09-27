import { API_ENDPOINTS } from "../config/api";
import useFetchItem from "./useFetchItem";

export default function useSiteDetail(id) {
  const { item, ...rest } = useFetchItem(id ? API_ENDPOINTS.siteDetail(id) : null);
  return { site: item, ...rest };
}
