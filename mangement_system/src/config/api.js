// Change the server address (or any path) here and the whole app follows.
export const API_BASE_URL = "http://https://inventory-management-system-one-ashen-72.vercel.app";

export const API_ENDPOINTS = {
  products: `${API_BASE_URL}/product/`,
  warehouses: `${API_BASE_URL}/inventory`,
  warehouseDetail: (id) => `${API_BASE_URL}/inventory/${id}`,
  sites: `${API_BASE_URL}/site`,
  siteDetail: (id) => `${API_BASE_URL}/site/${id}`,
  purchasesActive: `${API_BASE_URL}/invoice/active`,
  purchasesDraft: `${API_BASE_URL}/invoice/draft`,
  // Not used yet — the purchase modal is a placeholder for now, but this is
  // the endpoint it will call once it fetches the real invoice by id.
  purchaseDetail: (id) => `${API_BASE_URL}/invoice/${id}`,
  // Create-invoice wizard
  createPurchase: `${API_BASE_URL}/purchase`,
  addPurchaseItem: (invoiceId) => `${API_BASE_URL}/purchase/${invoiceId}`,
  activatePurchase: (invoiceId) => `${API_BASE_URL}/purchase/${invoiceId}/activate`,
  // Transactions (transfers between sites/warehouses)
  transactions: `${API_BASE_URL}/transact`,
  transactionDetail: (id) => `${API_BASE_URL}/transact/${id}`,
  createTransaction: `${API_BASE_URL}/transact`,
  addTransactionItem: (transactionId) => `${API_BASE_URL}/transact/${transactionId}`,
  activateTransaction: (transactionId) => `${API_BASE_URL}/transact/${transactionId}/activate`,
};
