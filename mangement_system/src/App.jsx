import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import RequireAuth from "./components/RequireAuth/RequireAuth";
import PlaceholderPage from "./pages/PlaceholderPage";
import ProductsPage from "./pages/Products/ProductsPage";
import WarehousesPage from "./pages/Warehouses/WarehousesPage";
import SitesPage from "./pages/Sites/SitesPage";
import PurchasesPage from "./pages/Purchases/PurchasesPage";
import TransactionsPage from "./pages/Transactions/TransactionsPage";
import ManagementPage from "./pages/Management/ManagementPage";
import UsagePage from "./pages/Usage/UsagePage";
import HomePage from "./pages/Home/HomePage";
import LoginPage from "./pages/Login/LoginPage";
import logsPage from "./pages/Logs/LogsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Outside the layout: no sidebar on the login page. */}
        <Route path="/login" element={<LoginPage />} />

        {/* Everything below needs a signed-in user (no token -> /login),
            and is drawn inside the layout with the sidebar. */}
        <Route element={<RequireAuth />}>
          <Route element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/regions" element={<PlaceholderPage title="المناطق" />} />
            <Route path="/warehouses" element={<WarehousesPage />} />
            <Route path="/locations" element={<SitesPage />} />
            <Route path="/users" element={<PlaceholderPage title="المستخدمين" />} />
            <Route path="/transfers" element={<TransactionsPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/usage" element={<UsagePage />} />
            <Route path="/management" element={<ManagementPage />} />
            <Route path="/logs" element={<logsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
