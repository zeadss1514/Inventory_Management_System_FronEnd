import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";
import useProducts from "../../hooks/useProducts";
import { readApiResponse } from "../../utils/api";
import ProductFields from "./ProductFields";
import "./ProductForm.css";

const EMPTY_FORM = { active: true, name: "", code: "", description: "", measurementUnit: "" };

// Only the keys that actually changed end up in the PUT body.
function diffPayload(original, current) {
  const payload = {};
  if (current.active !== original.active) payload.active = current.active;
  if (current.name.trim() !== (original.name ?? "").trim()) payload.name = current.name.trim();
  if (Number(current.code) !== Number(original.code)) payload.code = Number(current.code);
  if (current.description.trim() !== (original.description ?? "").trim()) {
    payload.description = current.description.trim();
  }
  if (current.measurementUnit.trim() !== (original.measurementUnit ?? "").trim()) {
    payload.measurementUnit = current.measurementUnit.trim();
  }
  return payload;
}

export default function ProductForm({ tab }) {
  return tab === "edit" ? <EditProductForm /> : <CreateProductForm />;
}

function CreateProductForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setSuccess(false);
  };

  const canSubmit = form.name.trim() && form.code !== "" && form.measurementUnit.trim() && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINTS.createProduct, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: form.active,
          name: form.name.trim(),
          code: Number(form.code),
          description: form.description.trim(),
          measurementUnit: form.measurementUnit.trim(),
        }),
      });
      await readApiResponse(res);
      setSuccess(true);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="pf-form" onSubmit={handleSubmit}>
      <ProductFields form={form} onChange={update} disabled={submitting} />

      {error && <p className="pf-error">{error}</p>}
      {success && <p className="pf-success">تم إنشاء المنتج بنجاح.</p>}

      <div className="pf-actions">
        <button type="submit" className="pf-submit" disabled={!canSubmit}>
          {submitting && <Loader2 size={16} className="pf-spin" aria-hidden="true" />}
          إنشاء المنتج
        </button>
      </div>
    </form>
  );
}

function EditProductForm() {
  const { products, status } = useProducts();
  const [productId, setProductId] = useState("");
  const [original, setOriginal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function handleSelect(id) {
    setProductId(id);
    setError(null);
    setSuccess(false);
    const p = products.find((x) => x._id === id);
    if (!p) {
      setOriginal(null);
      setForm(EMPTY_FORM);
      return;
    }
    const snapshot = {
      active: !!p.active,
      name: p.name ?? "",
      code: p.code ?? "",
      description: p.description ?? "",
      measurementUnit: p.measurementUnit ?? "",
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
  const canSubmit = productId && hasChanges && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINTS.updateProduct(productId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      await readApiResponse(res);
      setSuccess(true);
      setOriginal(form); // new baseline, so further edits diff against the saved state
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="pf-form" onSubmit={handleSubmit}>
      <div className="pf-field">
        <label htmlFor="pf-select-product">اختر منتجاً للتعديل</label>
        <select
          id="pf-select-product"
          value={productId}
          onChange={(e) => handleSelect(e.target.value)}
          disabled={status === "loading"}
        >
          <option value="">اختر منتجاً...</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {productId && (
        <>
          <ProductFields form={form} onChange={update} disabled={submitting} />
          {!hasChanges && !success && <p className="pf-hint">لم يتم تغيير أي قيمة بعد.</p>}
        </>
      )}

      {error && <p className="pf-error">{error}</p>}
      {success && <p className="pf-success">تم تحديث المنتج بنجاح.</p>}

      <div className="pf-actions">
        <button type="submit" className="pf-submit" disabled={!canSubmit}>
          {submitting && <Loader2 size={16} className="pf-spin" aria-hidden="true" />}
          حفظ التعديلات
        </button>
      </div>
    </form>
  );
}
