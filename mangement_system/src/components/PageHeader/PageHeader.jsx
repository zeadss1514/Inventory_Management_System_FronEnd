import { Box } from "lucide-react";
import "./PageHeader.css";

export default function PageHeader({ title, subtitle, icon: Icon = Box, action }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {action ?? (
        <div className="page-header__art" aria-hidden="true">
          <Icon size={30} strokeWidth={1.6} />
        </div>
      )}
    </header>
  );
}
