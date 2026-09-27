import { API_ENDPOINTS } from "../config/api";
import useFetchList from "./useFetchList";

export default function useTransactions() {
  const { items, ...rest } = useFetchList(API_ENDPOINTS.transactions);
  return { transactions: items, ...rest };
}
