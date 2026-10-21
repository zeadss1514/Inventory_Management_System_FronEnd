import { NavLink, useNavigate } from "react-router-dom";
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
  ClipboardList,
  Settings2,
  FileText,
  LogOut,
  User,
} from "lucide-react";
import { clearSession, getAuth, hasRole } from "../../utils/auth";
import "./Sidebar.css";

// To add a new page to the menu, add one line here (and a <Route> in App.jsx).
// `roles` (optional): only users whose token role is listed see the item.
const navItems = [
  { to: "/", label: "الرئيسية", icon: Home, end: true },
  { to: "/products", label: "الأصناف", icon: Package },
  { to: "/warehouses", label: "المخازن", icon: Warehouse },
  { to: "/locations", label: "المواقع", icon: MapPin },
  { to: "/users", label: "المستخدمين", icon: Users },
  { to: "/transfers", label: "التنقلات", icon: ArrowLeftRight },
  { to: "/purchases", label: "المشتريات", icon: ShoppingCart },
  { to: "/usage", label: "الاستخدام", icon: ClipboardList },
  { to: "/management", label: "الإدارة", icon: Settings2, roles: ["admin", "superAdmin"] },
  { to: "/logs", label: "logs", icon: FileText },
];

// Display names for token roles; an unknown role is shown as-is.
const ROLE_LABELS = { admin: "مشرف", superAdmin: "مشرف عام" };

export default function Sidebar() {
  const navigate = useNavigate();
  // The token payload (req.auth on the server). UI only — the backend must
  // still enforce every role / permission itself.
  const auth = getAuth();
  const userName = auth?.userName;
  const role = auth?.role;
  const initial = userName?.trim()?.[0]?.toUpperCase();
  const visibleItems = navItems.filter((item) => !item.roles || hasRole(...item.roles));

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <Box className="sidebar__brand-icon" strokeWidth={1.6} aria-hidden="true" />
        <span className="sidebar__brand-name">نظام إدارة المخزون</span>
      </div>

      <nav className="sidebar__nav" aria-label="القائمة الرئيسية">
        <ul className="sidebar__list">
          {visibleItems.map(({ to, label, icon: Icon, end }) => (
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

      <div className="sidebar__user">
        <div className="sidebar__user-card">
          <span className="sidebar__user-avatar" aria-hidden="true">
            {initial || <User size={18} strokeWidth={1.8} />}
          </span>
          <div className="sidebar__user-text">
            <span className="sidebar__user-name" dir="auto" title={userName || undefined}>
              {userName || "المستخدم"}
            </span>
            {role && <span className="sidebar__user-role">{ROLE_LABELS[role] ?? role}</span>}
          </div>
        </div>

        <button type="button" className="sidebar__logout" onClick={handleLogout}>
          <LogOut size={18} strokeWidth={1.6} aria-hidden="true" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
