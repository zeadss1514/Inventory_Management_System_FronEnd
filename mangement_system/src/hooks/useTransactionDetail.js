import { API_ENDPOINTS } from "../config/api";
import useFetchItem from "./useFetchItem";

export default function useTransactionDetail(id) {
  const { item, ...rest } = useFetchItem(id ? API_ENDPOINTS.transactionDetail(id) : null);
  return { transaction: item, ...rest };
}
