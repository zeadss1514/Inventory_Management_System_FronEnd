// Renders 1250 -> "$ 1,250.00", matching the design's currency style.
export function formatCurrency(value) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  return `$ ${safe.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Renders an ISO date string as "YYYY-MM-DD", matching the design.
export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Sums an invoice's line items into one subtotal, shown in the outer table.
// The exact item field names aren't confirmed yet, so this tries the
// common possibilities and falls back to 0 for anything it can't read.
export function sumInvoiceItemsCost(invoiceItems) {
  if (!Array.isArray(invoiceItems)) return 0;
  return invoiceItems.reduce((sum, item) => {
    if (Number.isFinite(Number(item?.totalPrice))) return sum + Number(item.totalPrice);
    if (Number.isFinite(Number(item?.subtotal))) return sum + Number(item.subtotal);
    const qty = Number(item?.quantity ?? 1);
    const price = Number(item?.price ?? item?.unitPrice ?? 0);
    return sum + (Number.isFinite(qty) && Number.isFinite(price) ? qty * price : 0);
  }, 0);
}

// `purchasedTo` is populated with the full site/warehouse (with a `name`)
// on the list endpoints, but some endpoints (e.g. right after creating the
// invoice) only return the raw id string. Handle both without crashing.
// Generalized as getEntityName since transactions have the same shape for
// TransactedTo/TransactedFrom.
export function getEntityName(entity) {
  if (!entity) return "—";
  if (typeof entity === "string") return entity;
  return entity.name?.trim() || "—";
}
export const getPurchasedToName = getEntityName;
