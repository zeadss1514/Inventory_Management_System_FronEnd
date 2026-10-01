// Change the server address (or any path) here and the whole app follows.
export const API_BASE_URL = "https://inventory-management-system-one-ashen-72.vercel.app";
// export const API_BASE_URL = "http://localhost:3000";

export const API_ENDPOINTS = {
  products: `${API_BASE_URL}/product/`,
   createProduct: `${API_BASE_URL}/product`,
  updateProduct: (id) => `${API_BASE_URL}/product/${id}`,
  warehouses: `${API_BASE_URL}/inventory`,
  warehouseDetail: (id) => `${API_BASE_URL}/inventory/${id}`,
  createInventory: `${API_BASE_URL}/inventory`,
  updateInventory: (id) => `${API_BASE_URL}/inventory/${id}`,
  addInventoryProduct: (inventoryId) => `${API_BASE_URL}/inventory/${inventoryId}`,
  sites: `${API_BASE_URL}/site`,
  siteDetail: (id) => `${API_BASE_URL}/site/${id}`,
  createSite: `${API_BASE_URL}/site`,
  updateSite: (id) => `${API_BASE_URL}/site/${id}`,
  addSiteProduct: (siteId) => `${API_BASE_URL}/site/${siteId}`,
  zones: `${API_BASE_URL}/zone`,
  createZone: `${API_BASE_URL}/zone`,
  updateZone: (id) => `${API_BASE_URL}/zone/${id}`,
  purchasesActive: `${API_BASE_URL}/purchase`,
  purchasesDraft: `${API_BASE_URL}/purchase/draft`,
  purchaseDetail: (id) => `${API_BASE_URL}/purchase/${id}`,
  createPurchase: `${API_BASE_URL}/purchase`,
  addPurchaseItem: (invoiceId) => `${API_BASE_URL}/purchase/${invoiceId}`,
  activatePurchase: (invoiceId) => `${API_BASE_URL}/purchase/${invoiceId}/activate`,
  transactions: `${API_BASE_URL}/transact`,
  transactionDetail: (id) => `${API_BASE_URL}/transact/${id}`,
  createTransaction: `${API_BASE_URL}/transact`,
  addTransactionItem: (transactionId) => `${API_BASE_URL}/transact/${transactionId}`,
  activateTransaction: (transactionId) => `${API_BASE_URL}/transact/${transactionId}/activate`,
};
