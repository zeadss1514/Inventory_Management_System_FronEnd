import { API_ENDPOINTS } from "../config/api";
import useFetchList from "./useFetchList";

export default function useProducts() {
  const { items, ...rest } = useFetchList(API_ENDPOINTS.products);
  return { products: items, ...rest };
}
