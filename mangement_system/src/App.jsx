import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import PlaceholderPage from "./pages/PlaceholderPage";
import ProductsPage from "./pages/Products/ProductsPage";
import WarehousesPage from "./pages/Warehouses/WarehousesPage";
import SitesPage from "./pages/Sites/SitesPage";
import PurchasesPage from "./pages/Purchases/PurchasesPage";
import TransactionsPage from "./pages/Transactions/TransactionsPage";
import ManagementPage from "./pages/Management/ManagementPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<PlaceholderPage title="الرئيسية" />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/regions" element={<PlaceholderPage title="المناطق" />} />
          <Route path="/warehouses" element={<WarehousesPage />} />
          <Route path="/locations" element={<SitesPage />} />
          <Route path="/users" element={<PlaceholderPage title="المستخدمين" />} />
          <Route path="/transfers" element={<TransactionsPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/management" element={<ManagementPage />} />
          <Route path="/logs" element={<PlaceholderPage title="logs" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
