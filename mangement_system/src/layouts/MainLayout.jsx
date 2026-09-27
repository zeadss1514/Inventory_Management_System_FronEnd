import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";

// Every page that should show the sidebar renders inside this layout.
export default function MainLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
