import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";
import useZones from "../../hooks/useZones";
import { readApiResponse } from "../../utils/api";
import "./ProductForm.css";
import "./ZoneForm.css";

const EMPTY_FORM = { active: true, name: "", city: "", code: "", notes: "" };

async function sendJson(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readApiResponse(res); // throws Error(server message) on failure
}

// Only the keys that actually changed end up in the PUT body.
function diffPayload(original, current) {
  const payload = {};
  if (current.active !== original.active) payload.active = current.active;
  for (const key of ["name", "city", "code", "notes"]) {
    if (String(current[key]).trim() !== String(original[key]).trim()) {
      payload[key] = String(current[key]).trim();
    }
  }
  return payload;
}

export default function ZoneForm({ tab }) {
  return tab === "edit" ? <EditZoneForm /> : <CreateZoneForm />;
}

function ZoneFields({ form, onChange, disabled }) {
  return (
    <>
      <label className="pf-checkbox">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => onChange({ active: e.target.checked })}
          disabled={disabled}
        />
        نشط
      </label>

      <div className="pf-field">
        <label htmlFor="zf-name">اسم المنطقة</label>
        <input
          id="zf-name"
          type="text"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={disabled}
          required
        />
      </div>

      <div className="zf-row">
        <div className="pf-field">
          <label htmlFor="zf-city">المدينة</label>
          <input
            id="zf-city"
            type="text"
            value={form.city}
            onChange={(e) => onChange({ city: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="pf-field">
          <label htmlFor="zf-code">الكود</label>
          <input
            id="zf-code"
            type="text"
            value={form.code}
            onChange={(e) => onChange({ code: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="pf-field">
        <label htmlFor="zf-notes">ملاحظات</label>
        <textarea
          id="zf-notes"
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          disabled={disabled}
          rows={3}
        />
      </div>
    </>
  );
}

function SubmitButton({ submitting, disabled, children }) {
  return (
    <div className="pf-actions">
      <button type="submit" className="pf-submit" disabled={disabled}>
        {submitting && <Loader2 size={16} className="pf-spin" aria-hidden="true" />}
        {children}
      </button>
    </div>
  );
}

function CreateZoneForm() {
  const { reload } = useZones();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setSuccess(false);
  };

  const canSubmit = form.name.trim() && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await sendJson(API_ENDPOINTS.createZone, "POST", {
        name: form.name.trim(),
        city: form.city.trim(),
        code: form.code.trim(),
        notes: form.notes.trim(),
        active: form.active,
      });
      setSuccess(true);
      setForm(EMPTY_FORM);
      reload?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="pf-form" onSubmit={handleSubmit}>
      <ZoneFields form={form} onChange={update} disabled={submitting} />

      {error && <p className="pf-error">{error}</p>}
      {success && <p className="pf-success">تم إنشاء المنطقة بنجاح.</p>}

      <SubmitButton submitting={submitting} disabled={!canSubmit}>
        إنشاء المنطقة
      </SubmitButton>
    </form>
  );
}

function EditZoneForm() {
  const { zones, status, reload } = useZones();
  const [zoneId, setZoneId] = useState("");
  const [original, setOriginal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function handleSelect(id) {
    setZoneId(id);
    setError(null);
    setSuccess(false);
    const z = zones.find((x) => x._id === id);
    if (!z) {
      setOriginal(null);
      setForm(EMPTY_FORM);
      return;
    }
    const snapshot = {
      active: !!z.active,
      name: z.name ?? "",
      city: z.city ?? "",
      code: z.code ?? "",
      notes: z.notes ?? "",
    };
    setOriginal(snapshot);
    setForm(snapshot);
  }

  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setSuccess(false);
  };

  const changes = useMemo(() => (original ? diffPayload(original, form) : {}), [original, form]);
  const hasChanges = Object.keys(changes).length > 0;
  const canSubmit = zoneId && form.name.trim() && hasChanges && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await sendJson(API_ENDPOINTS.updateZone(zoneId), "PUT", changes);
      setSuccess(true);
      setOriginal(form); // new baseline for further edits
      reload?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="pf-form" onSubmit={handleSubmit}>
      <div className="pf-field">
        <label htmlFor="zf-select">اختر منطقة للتعديل</label>
        <select
          id="zf-select"
          value={zoneId}
          onChange={(e) => handleSelect(e.target.value)}
          disabled={status === "loading"}
        >
          <option value="">اختر منطقة...</option>
          {zones.map((z) => (
            <option key={z._id} value={z._id}>
              {z.name}
            </option>
          ))}
        </select>
      </div>

      {zoneId && (
        <>
          <ZoneFields form={form} onChange={update} disabled={submitting} />
          {!hasChanges && !success && <p className="pf-hint">لم يتم تغيير أي قيمة بعد.</p>}
        </>
      )}

      {error && <p className="pf-error">{error}</p>}
      {success && <p className="pf-success">تم تحديث المنطقة بنجاح.</p>}

      <SubmitButton submitting={submitting} disabled={!canSubmit}>
        حفظ التعديلات
      </SubmitButton>
    </form>
  );
}
