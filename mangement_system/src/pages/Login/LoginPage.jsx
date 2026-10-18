import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Box, Eye, EyeOff, Loader2, Lock, LogIn, User } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";
import { getToken, setSession } from "../../utils/auth";
import { postJson } from "../../utils/postJson";
import "./LoginPage.css";

// POST /user/login  { userName, password }
// The token is looked for in the usual places, so this works whether the
// server answers { data: { token, user } }, { data: "<token>" } or { token }.
function extractSession(json) {
  const data = json?.data;
  const token = typeof data === "string" ? data : (data?.token ?? json?.token);
  const user = data && typeof data === "object" ? (data.user ?? (({ token: _t, ...rest }) => rest)(data)) : null;
  return { token, user: user && Object.keys(user).length ? user : null };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // ProtectedRoute (next step) will pass the page the user was trying to open.
  const redirectTo = location.state?.from?.pathname ?? "/";

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Already signed in — nothing to do here.
  if (getToken()) return <Navigate to="/" replace />;

  const canSubmit = userName.trim() && password && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const json = await postJson(API_ENDPOINTS.login, { userName: userName.trim(), password }, { skipAuthRedirect: true });
      const { token, user } = extractSession(json);
      if (!token) throw new Error("لم يتم استلام رمز الدخول من الخادم.");
      setSession({ token, user });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <aside className="login-aside" aria-hidden="true">
        <Box size={56} strokeWidth={1.4} />
        <h2>نظام إدارة المخزون</h2>
        <p>تابع مشترياتك وتنقلات منتجاتك واستخدامها بين المخازن والمواقع من مكان واحد.</p>
      </aside>

      <main className="login-main">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-card__brand">
            <Box size={26} strokeWidth={1.6} aria-hidden="true" />
            <span>نظام إدارة المخزون</span>
          </div>

          <h1>تسجيل الدخول</h1>
          <p className="login-card__sub">أدخل بياناتك للمتابعة إلى النظام.</p>

          <div className="login-field">
            <label htmlFor="login-username">اسم المستخدم</label>
            <div className="login-input">
              <User size={18} className="login-input__icon" aria-hidden="true" />
              <input
                id="login-username"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                autoComplete="username"
                autoFocus
                disabled={submitting}
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password">كلمة المرور</label>
            <div className="login-input">
              <Lock size={18} className="login-input__icon" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={submitting}
              />
              <button
                type="button"
                className="login-input__toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login-submit" disabled={!canSubmit}>
            {submitting ? <Loader2 size={18} className="login-spin" aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
            {submitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>

          <p className="login-footer">
            تم التطوير بواسطة <strong dir="ltr">microSystems</strong>
          </p>
        </form>
      </main>
    </div>
  );
}
