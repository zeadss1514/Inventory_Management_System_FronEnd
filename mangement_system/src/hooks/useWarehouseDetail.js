import { API_ENDPOINTS } from "../config/api";
import useFetchItem from "./useFetchItem";

export default function useWarehouseDetail(id) {
  const { item, ...rest } = useFetchItem(id ? API_ENDPOINTS.warehouseDetail(id) : null);
  return { warehouse: item, ...rest };
}
