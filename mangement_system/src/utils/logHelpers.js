// Everything about turning a log record into something readable.
//
// Log record fields used (names as given by the backend model):
//   typeOfInvoice : "Usage" | "Invoices" | "TransactionsInvoices" | "adding"
//                   ("adding" = quantity added straight to a place, NOT a purchase:
//                    it has no invoice, so its badge is never clickable)
//   Quantity      : number
//   user          : populated user  -> user.userName
//   ProductId     : populated product -> ProductId.name
//   Place         : populated site / inventory -> Place.name
//   IncomingStock : boolean, only meaningful for "TransactionsInvoices"
//                   (every transfer writes TWO logs per product:
//                    one OUT of the source, one IN to the destination)
//   createdAt     : date (also tries created_at / date)
//
// ⚠️ Only `createdAt` is a guess; if a field is not populated (a raw id
// string, or the record was deleted) a neutral fallback word is used instead.

export const LOG_TYPE_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "Invoices", label: "شراء" },
  { value: "TransactionsInvoices", label: "نقل" },
  { value: "Usage", label: "استهلاك" },
  { value: "adding", label: "إضافة" },
];

const TYPE_LABELS = {
  Invoices: "شراء",
  TransactionsInvoices: "نقل",
  Usage: "استهلاك",
  adding: "إضافة",
};

// The new type is written "adding" in the DB; tolerate "Adding" / "added" too so a
// casing slip never turns these logs into "unknown". Other types pass through.
export function normalizeLogType(type) {
  const t = String(type ?? "").toLowerCase();
  return t === "adding" || t === "added" ? "adding" : type;
}

export const getLogTypeLabel = (type) => TYPE_LABELS[normalizeLogType(type)] ?? "غير معروف";

// Reads a display name from a populated reference; a raw id string or a
// missing value gives the fallback.
function nameOf(ref, keys, fallback) {
  if (ref && typeof ref === "object") {
    for (const key of keys) {
      const value = ref[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return fallback;
}

// "in" | "out" for transfer logs, null for every other type
// (and null for an old transfer log that has no boolean IncomingStock).
export function getLogDirection(log) {
  if (log?.typeOfInvoice !== "TransactionsInvoices") return null;
  if (typeof log.IncomingStock !== "boolean") return null;
  return log.IncomingStock ? "in" : "out";
}

export function getLogDate(log) {
  const raw = log?.createdAt ?? log?.created_at ?? log?.date;
  const time = raw ? new Date(raw).getTime() : NaN;
  return Number.isNaN(time) ? null : time;
}

// 2026-10-18 14:05 (Latin digits, fixed format)
export function formatDateTime(time) {
  if (time == null) return "—";
  const d = new Date(time);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Where the id of the document behind the log (the invoice / usage / transfer)
// lives. ⚠️ UNVERIFIED guess: the real field name was not known when this was
// written. Put the real one first (or leave only it) once you have seen a log.
// A populated object is fine too — its _id is used.
export const LOG_REF_FIELDS = [
  "InvoiceId",
  "invoiceId",
  "Invoice",
  "invoice",
  "TransactionId",
  "transactionId",
  "UsageId",
  "usageId",
  "refId",
  "RefId",
  "reference",
  "Reference",
  "document",
  "docId",
];

// Types whose details can be opened in an existing modal. "adding" is NOT here on
// purpose: it has no invoice / document to open.
export const OPENABLE_LOG_TYPES = ["Invoices", "Usage", "TransactionsInvoices"];

export function getLogRefId(log) {
  for (const key of LOG_REF_FIELDS) {
    const value = log?.[key];
    if (typeof value === "string" && value) return value;
    if (value && typeof value === "object" && typeof value._id === "string") return value._id;
  }
  return null;
}

// Place / product of a log for filtering: { id, name } or null when not populated.
function refOf(ref, nameKeys) {
  if (!ref || typeof ref !== "object") return null;
  const name = nameOf(ref, nameKeys, null);
  if (!name) return null;
  return { id: String(ref._id ?? name), name };
}
export const getLogPlace = (log) => refOf(log?.Place, ["name"]);
export const getLogProduct = (log) => refOf(log?.ProductId, ["name"]);

// The sentence as a list of parts so the page can style each kind:
//   { kind: "text" | "qty" | "unit" | "product" | "place" | "user", text, missing? }
//
//   Usage                 تم إستهلاك 5 <وحدة> <صنف> من <مكان> بواسطة <مستخدم>
//   Invoices              تم شراء 5 <وحدة> <صنف> إلى <مكان> بواسطة <مستخدم>
//   Transactions, IN      تم نقل 5 <وحدة> <صنف> إلى <مكان> بواسطة <مستخدم>
//   Transactions, OUT     تم نقل 5 <وحدة> <صنف> من <مكان> بواسطة <مستخدم>
//   Transactions, no flag تم نقل 5 <وحدة> <صنف> في <مكان> بواسطة <مستخدم>
//   Adding                تمت إضافة 5 <وحدة> <صنف> إلى <مكان> بواسطة <مستخدم>
// <وحدة> = ProductId.measurementUnit (left out when the product has none).
export function buildLogParts(log) {
  const quantity = Number(log?.Quantity ?? log?.quantity);
  const qty = Number.isFinite(quantity) ? String(quantity) : "—";

  const userName = nameOf(log?.user, ["userName", "name"], null);
  const productName = nameOf(log?.ProductId, ["name"], null);
  const unitName = nameOf(log?.ProductId, ["measurementUnit"], null);
  const placeName = nameOf(log?.Place, ["name"], null);

  const t = (text) => ({ kind: "text", text });
  const user = { kind: "user", text: userName ?? "مستخدم غير معروف", missing: !userName };
  const product = { kind: "product", text: productName ?? "صنف غير معروف", missing: !productName };
  const place = { kind: "place", text: placeName ?? "مكان غير معروف", missing: !placeName };
  // quantity, then its unit right after it
  const amount = [{ kind: "qty", text: qty }, ...(unitName ? [{ kind: "unit", text: unitName }] : [])];

  switch (normalizeLogType(log?.typeOfInvoice)) {
    case "Usage":
      return [t("تم إستهلاك"), ...amount, product, t("من"), place, t("بواسطة"), user];
    case "Invoices":
      return [t("تم شراء"), ...amount, product, t("إلى"), place, t("بواسطة"), user];
    case "adding":
      return [t("تمت إضافة"), ...amount, product, t("إلى"), place, t("بواسطة"), user];
    case "TransactionsInvoices": {
      const direction = getLogDirection(log);
      const link = direction === "in" ? "إلى" : direction === "out" ? "من" : "في";
      return [t("تم نقل"), ...amount, product, t(link), place, t("بواسطة"), user];
    }
    default:
      return [t("عملية غير معروفة بواسطة"), user];
  }
}

// Plain-text version (used for searching).
export function buildLogText(log) {
  return buildLogParts(log)
    .map((part) => part.text)
    .join(" ");
}
