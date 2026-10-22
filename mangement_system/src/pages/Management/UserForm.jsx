import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";
import { postJson } from "../../utils/postJson";
import "./ProductForm.css";
import "./UserForm.css";

const EMPTY_FORM = {
  userName: "",
  email: "",
  phone: "",
  password: "",
  Purchase: false,
  Usage: false,
  doTransactions: false,
};

// Key = field name the backend expects (and the permission key in the JWT).
const PERMISSIONS = [
  { key: "Purchase", label: "إنشاء فواتير الشراء" },
  { key: "Usage", label: "إنشاء عمليات الإستهلاك" },
  { key: "doTransactions", label: "إنشاء التحويلات" },
];

export default function UserForm({ tab }) {
  if (tab === "edit") {
    return <p className="pf-hint">تعديل المستخدمين غير متاح بعد.</p>;
  }
  return <CreateUserForm />;
}

function CreateUserForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setSuccess(false);
  };

  const canSubmit =
    form.userName.trim() && form.email.trim() && form.phone.trim() && form.password && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await postJson(API_ENDPOINTS.createUser, {
        userName: form.userName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        Purchase: form.Purchase,
        Usage: form.Usage,
        doTransactions: form.doTransactions,
      });
      setSuccess(true);
      setForm(EMPTY_FORM); // also clears the password from memory
      setShowPassword(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="pf-form" onSubmit={handleSubmit} autoComplete="off">
      <div className="pf-field">
        <label htmlFor="uf-username">اسم المستخدم</label>
        <input
          id="uf-username"
          type="text"
          className="uf-ltr"
          autoComplete="off"
          value={form.userName}
          onChange={(e) => update({ userName: e.target.value })}
          disabled={submitting}
          required
        />
      </div>

      <div className="uf-row">
        <div className="pf-field">
          <label htmlFor="uf-email">البريد الإلكتروني</label>
          <input
            id="uf-email"
            type="email"
            className="uf-ltr"
            autoComplete="off"
            value={form.email}
            onChange={(e) => update({ email: e.target.value })}
            disabled={submitting}
            required
          />
        </div>
        <div className="pf-field">
          <label htmlFor="uf-phone">رقم الهاتف</label>
          <input
            id="uf-phone"
            type="tel"
            className="uf-ltr"
            autoComplete="off"
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value })}
            disabled={submitting}
            required
          />
        </div>
      </div>

      <div className="pf-field">
        <label htmlFor="uf-password">كلمة المرور</label>
        <div className="uf-password">
          <input
            id="uf-password"
            type={showPassword ? "text" : "password"}
            className="uf-ltr"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => update({ password: e.target.value })}
            disabled={submitting}
            required
          />
          <button
            type="button"
            className="uf-eye"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <fieldset className="uf-perms">
        <legend>الصلاحيات</legend>
        {PERMISSIONS.map((p) => (
          <label key={p.key} className="pf-checkbox">
            <input
              type="checkbox"
              checked={form[p.key]}
              onChange={(e) => update({ [p.key]: e.target.checked })}
              disabled={submitting}
            />
            {p.label}
          </label>
        ))}
      </fieldset>

      {error && <p className="pf-error">{error}</p>}
      {success && <p className="pf-success">تم إنشاء المستخدم بنجاح.</p>}

      <div className="pf-actions">
        <button type="submit" className="pf-submit" disabled={!canSubmit}>
          {submitting && <Loader2 size={16} className="pf-spin" aria-hidden="true" />}
          إنشاء المستخدم
        </button>
      </div>
    </form>
  );
}
