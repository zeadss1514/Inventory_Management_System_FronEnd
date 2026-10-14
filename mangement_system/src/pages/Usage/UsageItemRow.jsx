import { Check, Loader2, Minus, Plus, Trash2 } from "lucide-react";

// One editable line in the create-usage wizard.
// item.status: "draft" -> "saving" -> "saved" | "error"
// `available` = stock left for the chosen product (null when unknown).
export default function UsageItemRow({ item, products, available, onChange, onConfirm, onRemove }) {
  const locked = item.status === "saving" || item.status === "saved";
  const product = products.find((p) => p._id === item.productId);
  const qty = Number(item.quantity) || 0;
  const hasLimit = available !== null && available !== undefined;
  const overLimit = hasLimit && qty > available;
  const atLimit = hasLimit && qty >= available;

  const confirmClass =
    item.status === "saving"
      ? "uw-confirm uw-confirm--saving"
      : item.status === "saved"
        ? "uw-confirm uw-confirm--saved"
        : item.status === "error"
          ? "uw-confirm uw-confirm--error"
          : "uw-confirm";

  return (
    <tr>
      <td>
        <select
          value={item.productId}
          onChange={(e) => onChange({ productId: e.target.value, status: "draft", error: null })}
          disabled={locked}
          aria-label="الصنف"
        >
          <option value="">اختر صنفاً...</option>
          {products.map((p) => {
            const hasStock = typeof p.stock === "number";
            return (
              <option key={p._id} value={p._id} disabled={hasStock && p.stock <= 0}>
                {hasStock ? `${p.name} — المتوفر: ${p.stock}` : p.name}
              </option>
            );
          })}
        </select>
      </td>

      <td className="uw-unit">{product?.measurementUnit ?? "—"}</td>

      <td>
        <div className="uw-qty">
          <button
            type="button"
            onClick={() => onChange({ quantity: Math.max(1, qty - 1), status: "draft", error: null })}
            disabled={locked || qty <= 1}
            aria-label="إنقاص الكمية"
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            min="1"
            max={hasLimit ? available : undefined}
            value={item.quantity}
            className={overLimit ? "uw-qty__input--invalid" : undefined}
            aria-invalid={overLimit}
            onChange={(e) => onChange({ quantity: e.target.value, status: "draft", error: null })}
            disabled={locked}
            aria-label="الكمية"
          />
          <button
            type="button"
            onClick={() => onChange({ quantity: qty + 1, status: "draft", error: null })}
            disabled={locked || atLimit || !item.productId}
            aria-label="زيادة الكمية"
          >
            <Plus size={14} />
          </button>
        </div>
        {item.productId && hasLimit && (
          <p className={`uw-qty-hint${overLimit ? " uw-qty-hint--error" : ""}`}>
            {overLimit ? `الكمية أكبر من المتوفر (${available})` : `المتوفر: ${available}`}
          </p>
        )}
      </td>

      <td>
        <div className="uw-row-actions">
          <button
            type="button"
            className={confirmClass}
            onClick={onConfirm}
            disabled={locked || overLimit}
            aria-label="حفظ الصنف"
            title={item.status === "saved" ? "تم الحفظ" : overLimit ? "الكمية أكبر من المتوفر" : "حفظ الصنف"}
          >
            {item.status === "saving" ? <Loader2 size={16} className="uw-spin" /> : <Check size={16} />}
          </button>
          <button type="button" className="uw-delete" onClick={onRemove} aria-label="حذف الصنف">
            <Trash2 size={15} />
          </button>
        </div>
        {item.error && <p className="uw-row-error">{item.error}</p>}
      </td>
    </tr>
  );
}
