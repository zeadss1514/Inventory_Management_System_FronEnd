import { API_ENDPOINTS } from "../config/api";
import useFetchItem from "./useFetchItem";

// GET /product/<id>  ->  data: { product, sites: [...], inventories: [...] }
// Each site / inventory carries `inSiteProducts` (this product's stock entry there).
// A falsy id skips the request.
export default function useProductDetail(id) {
  const { item, ...rest } = useFetchItem(id ? API_ENDPOINTS.productDetail(id) : null);
  return {
    product: item?.product ?? null,
    sites: Array.isArray(item?.sites) ? item.sites : [],
    inventories: Array.isArray(item?.inventories) ? item.inventories : [],
    ...rest,
  };
}
