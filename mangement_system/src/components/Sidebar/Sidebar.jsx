import { NavLink } from "react-router-dom";
import {
  Box,
  Home,
  Package,
  MapPinned,
  Warehouse,
  MapPin,
  Users,
  ArrowLeftRight,
  ShoppingCart,
  Settings2,
  FileText,
} from "lucide-react";
import "./Sidebar.css";

// To add a new page to the menu, add one line here (and a <Route> in App.jsx).
const navItems = [
  { to: "/", label: "الرئيسية", icon: Home, end: true },
  { to: "/products", label: "المنتجات", icon: Package },
  { to: "/regions", label: "المناطق", icon: MapPinned },
  { to: "/warehouses", label: "المخازن", icon: Warehouse },
  { to: "/locations", label: "المواقع", icon: MapPin },
  { to: "/users", label: "المستخدمين", icon: Users },
  { to: "/transfers", label: "التنقلات", icon: ArrowLeftRight },
  { to: "/purchases", label: "المشتريات", icon: ShoppingCart },
  { to: "/management", label: "الإدارة", icon: Settings2 },
  { to: "/logs", label: "logs", icon: FileText },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <Box className="sidebar__brand-icon" strokeWidth={1.6} aria-hidden="true" />
        <span className="sidebar__brand-name">نظام إدارة المخزون</span>
      </div>

      <nav className="sidebar__nav" aria-label="القائمة الرئيسية">
        <ul className="sidebar__list">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `sidebar__link${isActive ? " sidebar__link--active" : ""}`
                }
              >
                <Icon className="sidebar__icon" strokeWidth={1.6} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
