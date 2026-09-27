import { API_ENDPOINTS } from "../config/api";
import useFetchList from "./useFetchList";

export default function useWarehouses() {
  const { items, ...rest } = useFetchList(API_ENDPOINTS.warehouses);
  return { warehouses: items, ...rest };
}
