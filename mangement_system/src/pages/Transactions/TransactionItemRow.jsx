import { Check, Loader2, Minus, Plus, Trash2 } from "lucide-react";

// item.status: "draft" | "saving" | "saved" | "error"
// `available` = stock left in the source place for the chosen product
// (null when unknown).
export default function TransactionItemRow({ item, products, available, onChange, onConfirm, onRemove }) {
  const product = products.find((p) => p._id === item.productId) ?? null;
  const unit = product?.measurementUnit || "—";
  const locked = item.status === "saving" || item.status === "saved";
  const qty = Number(item.quantity) || 0;
  const hasLimit = available !== null && available !== undefined;
  const overLimit = hasLimit && qty > available;
  const atLimit = hasLimit && qty >= available;

  return (
    <tr className={`item-row item-row--${item.status}`}>
      <td>
        <select
          value={item.productId}
          onChange={(e) => onChange({ productId: e.target.value, status: "draft", error: null })}
          disabled={locked}
          aria-label="اختر صنفاً"
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
      <td className="item-row__unit">{unit}</td>
      <td>
        <div className="qty-stepper">
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
            className={overLimit ? "qty-stepper__input qty-stepper__input--invalid" : "qty-stepper__input"}
            aria-invalid={overLimit}
            aria-label="الكمية"
            onChange={(e) => onChange({ quantity: e.target.value, status: "draft", error: null })}
            disabled={locked}
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
          <p className={`qty-hint${overLimit ? " qty-hint--error" : ""}`}>
            {overLimit ? `الكمية أكبر من المتوفر (${available})` : `المتوفر: ${available}`}
          </p>
        )}
      </td>
      <td>
        <div className="item-row__actions">
          <button
            type="button"
            className={`item-row__confirm item-row__confirm--${item.status}`}
            onClick={onConfirm}
            disabled={locked || overLimit}
            aria-label="تأكيد الصنف"
            title={overLimit ? "الكمية أكبر من المتوفر" : "تأكيد وحفظ الصنف"}
          >
            {item.status === "saving" ? (
              <Loader2 size={16} className="spin" aria-hidden="true" />
            ) : (
              <Check size={16} aria-hidden="true" />
            )}
          </button>
          <button type="button" className="item-row__delete" onClick={onRemove} aria-label="حذف الصنف" title="حذف الصنف">
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
        {item.error && <p className="item-row__error">{item.error}</p>}
      </td>
    </tr>
  );
}
