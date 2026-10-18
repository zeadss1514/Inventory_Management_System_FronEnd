import { Link } from "react-router-dom";
import { ArrowRight, ShieldAlert } from "lucide-react";
import RequireAuth from "../RequireAuth/RequireAuth";
import { hasRole } from "../../utils/auth";
import "./RequireRole.css";

function AccessDenied() {
  return (
    <div className="denied-page">
      <div className="denied-card" role="alert">
        <span className="denied-card__icon" aria-hidden="true">
          <ShieldAlert size={30} strokeWidth={1.7} />
        </span>
        <h2>غير مصرّح لك بالدخول</h2>
        <p>هذه الصفحة متاحة للمشرفين فقط. إذا كنت تعتقد أن هذا خطأ فتواصل مع مسؤول النظام.</p>
        <Link to="/" className="denied-card__btn">
          <ArrowRight size={16} aria-hidden="true" />
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}

// Signed out            -> /login (via RequireAuth)
// Signed in, wrong role -> "not allowed" message, children never render, so
//                          their data hooks never fire a request.
//   <RequireRole roles={["admin", "superAdmin"]}><ManagementContent /></RequireRole>
export default function RequireRole({ roles, children }) {
  return <RequireAuth>{hasRole(...roles) ? children : <AccessDenied />}</RequireAuth>;
}
