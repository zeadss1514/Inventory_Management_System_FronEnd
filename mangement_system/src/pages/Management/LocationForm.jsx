import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import useFetchList from "../../hooks/useFetchList";
import useProducts from "../../hooks/useProducts";
import useZones from "../../hooks/useZones";
import { readApiResponse } from "../../utils/api";
import "./ProductForm.css";
import "./LocationForm.css";

const EMPTY_FORM = { active: true, name: "", zone: "", address: "" };
const EMPTY_STOCK = { productId: "", quantity: "", minStock: "", maxStock: "", notes: "" };

async function sendJson(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readApiResponse(res); // throws Error(server message) on failure
}

// The list endpoint may return zone as a populated object, an id string, or null.
function resolveZoneId(zone, zones) {
  if (!zone) return "";
  if (typeof zone === "string") return zone;
  if (zone._id) return zone._id;
  return zones.find((z) => z.name === zone.name)?._id ?? "";
}

// Only the keys that actually changed end up in the PUT body.
function diffPayload(original, current) {
  const payload = {};
  if (current.active !== original.active) payload.active = current.active;
  if (current.name.trim() !== original.name.trim()) payload.name = current.name.trim();
  if (current.zone !== original.zone) payload.zone = current.zone || null;
  if (current.address.trim() !== original.address.trim()) payload.address = current.address.trim();
  return payload;
}

// Shared create/edit form for inventories and sites (they have the same shape).
// `config` = { endpoints: { list, create, update(id), addProduct(id) }, labels: {...} }
export default function LocationForm({ tab, config }) {
  return tab === "edit" ? <EditLocationForm config={config} /> : <CreateLocationForm config={config} />;
}

function LocationFields({ form, onChange, disabled, zones, zonesLoading, nameLabel }) {
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
        <label htmlFor="inv-name">{nameLabel}</label>
        <input
          id="inv-name"
          type="text"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={disabled}
          required
        />
      </div>

      <div className="pf-field">
        <label htmlFor="inv-zone">المنطقة</label>
        <select
          id="inv-zone"
          value={form.zone}
          onChange={(e) => onChange({ zone: e.target.value })}
          disabled={disabled || zonesLoading}
        >
          <option value="">بدون منطقة</option>
          {zones.map((z) => (
            <option key={z._id} value={z._id}>
              {z.name}
            </option>
          ))}
        </select>
      </div>

      <div className="pf-field">
        <label htmlFor="inv-address">العنوان</label>
        <textarea
          id="inv-address"
          value={form.address}
          onChange={(e) => onChange({ address: e.target.value })}
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

function CreateLocationForm({ config }) {
  const { zones, status: zonesStatus, error: zonesError } = useZones();
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
      await sendJson(config.endpoints.create, "POST", {
        name: form.name.trim(),
        zone: form.zone || null,
        address: form.address.trim(),
        active: form.active,
      });
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
      <LocationFields
        form={form}
        onChange={update}
        disabled={submitting}
        zones={zones}
        zonesLoading={zonesStatus === "loading"}
        nameLabel={config.labels.name}
      />

      {zonesStatus === "error" && <p className="pf-error">{zonesError?.message ?? String(zonesError)}</p>}
      {error && <p className="pf-error">{error}</p>}
      {success && <p className="pf-success">{config.labels.created}</p>}

      <SubmitButton submitting={submitting} disabled={!canSubmit}>
        {config.labels.createBtn}
      </SubmitButton>
    </form>
  );
}

function EditLocationForm({ config }) {
  const { items: inventories, status: invStatus, reload } = useFetchList(config.endpoints.list);
  const { zones, status: zonesStatus } = useZones();

  const [inventoryId, setInventoryId] = useState("");
  const [original, setOriginal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function handleSelect(id) {
    setInventoryId(id);
    setError(null);
    setSuccess(false);
    const inv = (inventories ?? []).find((x) => x._id === id);
    if (!inv) {
      setOriginal(null);
      setForm(EMPTY_FORM);
      return;
    }
    const snapshot = {
      active: !!inv.active,
      name: inv.name ?? "",
      zone: resolveZoneId(inv.zone, zones),
      address: inv.address ?? "",
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
  const canSubmit = inventoryId && form.name.trim() && hasChanges && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await sendJson(config.endpoints.update(inventoryId), "PUT", changes);
      setSuccess(true);
      setOriginal(form);
      reload?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="inv-section">
        <div className="pf-field">
          <label htmlFor="inv-select">{config.labels.selectLabel}</label>
          <select
            id="inv-select"
            value={inventoryId}
            onChange={(e) => handleSelect(e.target.value)}
            disabled={invStatus === "loading"}
          >
            <option value="">{config.labels.selectPlaceholder}</option>
            {(inventories ?? []).map((inv) => (
              <option key={inv._id} value={inv._id}>
                {inv.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {inventoryId && (
        <>
          <form className="pf-form inv-section" onSubmit={handleSubmit}>
            <h3 className="inv-section-title">{config.labels.dataTitle}</h3>
            <LocationFields
              form={form}
              onChange={update}
              disabled={submitting}
              zones={zones}
              zonesLoading={zonesStatus === "loading"}
        nameLabel={config.labels.name}
            />
            {!hasChanges && !success && <p className="pf-hint">لم يتم تغيير أي قيمة بعد.</p>}
            {error && <p className="pf-error">{error}</p>}
            {success && <p className="pf-success">{config.labels.updated}</p>}
            <SubmitButton submitting={submitting} disabled={!canSubmit}>
              حفظ التعديلات
            </SubmitButton>
          </form>

          <AddProductSection inventoryId={inventoryId} onAdded={() => reload?.()} config={config} />
        </>
      )}
    </>
  );
}

function AddProductSection({ inventoryId, onAdded, config }) {
  const { products, status } = useProducts();
  const [stock, setStock] = useState(EMPTY_STOCK);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const update = (patch) => {
    setStock((s) => ({ ...s, ...patch }));
    setSuccess(false);
  };

  const rangeInvalid =
    stock.minStock !== "" && stock.maxStock !== "" && Number(stock.maxStock) < Number(stock.minStock);

  const canSubmit =
    stock.productId &&
    stock.quantity !== "" &&
    stock.minStock !== "" &&
    stock.maxStock !== "" &&
    !rangeInvalid &&
    !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await sendJson(config.endpoints.addProduct(inventoryId), "POST", {
        productId: stock.productId,
        quantity: Number(stock.quantity),
        minStock: Number(stock.minStock),
        maxStock: Number(stock.maxStock),
        notes: stock.notes.trim(),
      });
      setSuccess(true);
      setStock(EMPTY_STOCK);
      onAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="pf-form inv-section" onSubmit={handleSubmit}>
      <h3 className="inv-section-title">{config.labels.addTitle}</h3>

      <div className="pf-field">
        <label htmlFor="inv-product">المنتج</label>
        <select
          id="inv-product"
          value={stock.productId}
          onChange={(e) => update({ productId: e.target.value })}
          disabled={status === "loading" || submitting}
          required
        >
          <option value="">اختر منتجاً...</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="inv-row">
        <div className="pf-field">
          <label htmlFor="inv-quantity">الكمية</label>
          <input
            id="inv-quantity"
            type="number"
            min="0"
            value={stock.quantity}
            onChange={(e) => update({ quantity: e.target.value })}
            disabled={submitting}
            required
          />
        </div>
        <div className="pf-field">
          <label htmlFor="inv-min">الحد الأدنى</label>
          <input
            id="inv-min"
            type="number"
            min="0"
            value={stock.minStock}
            onChange={(e) => update({ minStock: e.target.value })}
            disabled={submitting}
            required
          />
        </div>
        <div className="pf-field">
          <label htmlFor="inv-max">الحد الأقصى</label>
          <input
            id="inv-max"
            type="number"
            min="0"
            value={stock.maxStock}
            onChange={(e) => update({ maxStock: e.target.value })}
            disabled={submitting}
            required
          />
        </div>
      </div>

      <div className="pf-field">
        <label htmlFor="inv-notes">ملاحظات</label>
        <textarea
          id="inv-notes"
          value={stock.notes}
          onChange={(e) => update({ notes: e.target.value })}
          disabled={submitting}
          rows={2}
        />
      </div>

      {rangeInvalid && <p className="pf-error">الحد الأقصى يجب أن يكون أكبر من أو يساوي الحد الأدنى.</p>}
      {error && <p className="pf-error">{error}</p>}
      {success && <p className="pf-success">{config.labels.productAdded}</p>}

      <SubmitButton submitting={submitting} disabled={!canSubmit}>
        إضافة المنتج
      </SubmitButton>
    </form>
  );
}
