import { Check, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "../../utils/invoiceHelpers";

// item.status: "draft" | "saving" | "saved" | "error"
export default function InvoiceItemRow({ item, products, onChange, onConfirm, onRemove }) {
  const product = products.find((p) => p._id === item.productId) ?? null;
  const unit = product?.measurementUnit || "—";
  const totalCost = (Number(item.quantity) || 0) * (Number(item.price) || 0);
  const locked = item.status === "saving" || item.status === "saved";

  return (
    <tr className={`item-row item-row--${item.status}`}>
      <td>
        <select
          value={item.productId}
          onChange={(e) => onChange({ productId: e.target.value })}
          disabled={locked}
          aria-label="اختر منتجاً"
        >
          <option value="">اختر منتجاً...</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </td>
      <td className="item-row__unit">{unit}</td>
      <td>
        <div className="qty-stepper">
          <button
            type="button"
            onClick={() => onChange({ quantity: Math.max(1, Number(item.quantity) - 1) })}
            disabled={locked}
            aria-label="إنقاص الكمية"
          >
            <Minus size={14} />
          </button>
          <span>{item.quantity}</span>
          <button
            type="button"
            onClick={() => onChange({ quantity: Number(item.quantity) + 1 })}
            disabled={locked}
            aria-label="زيادة الكمية"
          >
            <Plus size={14} />
          </button>
        </div>
      </td>
      <td>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.price}
          onChange={(e) => onChange({ price: e.target.value })}
          disabled={locked}
          className="item-row__price"
          aria-label="سعر الوحدة"
        />
      </td>
      <td className="item-row__total">{formatCurrency(totalCost)}</td>
      <td>
        <input
          type="text"
          value={item.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="ملاحظات (اختياري)"
          disabled={locked}
          className="item-row__notes"
          aria-label="ملاحظات"
        />
      </td>
      <td>
        <div className="item-row__actions">
          <button
            type="button"
            className={`item-row__confirm item-row__confirm--${item.status}`}
            onClick={onConfirm}
            disabled={locked}
            aria-label="تأكيد الصنف"
            title="تأكيد وحفظ الصنف"
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
