import { getPurchasedToName } from "./invoiceHelpers";

// `useageFrom` (sic) is confirmed by the backend's populate() call. The type
// and items names are still guesses, so each logical field lists candidates
// to try, in order. Once you've seen a real response, trim each list to the one real
// name (or just put the real name first and delete the rest).
export const USAGE_FIELDS = {
  // the site / inventory the usage belongs to (populated {name} or a raw id)
  target: ["useageFrom", "usedFrom", "usageFrom", "usedIn", "usageTo", "site", "inventory"],
  // "Sites" | "Inventories"
  targetType: ["useageFromType", "usedFromType", "usageFromType", "usedInType", "usageToType", "usageType"],
  items: ["UsageItems", "usageItems"],
};

function pick(obj, keys) {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
  }
  return undefined;
}

export const getUsageTarget = (usage) => pick(usage, USAGE_FIELDS.target);
export const getUsageTargetName = (usage) => getPurchasedToName(getUsageTarget(usage));
export const getUsageTargetType = (usage) => pick(usage, USAGE_FIELDS.targetType);

export function getUsageItems(usage) {
  const items = pick(usage, USAGE_FIELDS.items);
  return Array.isArray(items) ? items : [];
}

// A line's product reference may be a string id or a populated product.
export function getLineProductId(line) {
  const ref = line?.ProductId ?? line?.productId;
  return typeof ref === "string" ? ref : ref?._id;
}

export function getLineQuantity(line) {
  return Number(line?.Quantity ?? line?.quantity) || 0;
}

// Resolves name/unit from the already-fetched product list (Map<id, product>),
// falling back to the populated object on the line itself.
export function getLineProduct(line, productMap) {
  const ref = line?.ProductId ?? line?.productId;
  const populated = ref && typeof ref === "object" ? ref : null;
  const product = productMap?.get(getLineProductId(line)) ?? populated;
  return {
    name: product?.name ?? "—",
    unit: product?.measurementUnit ?? "—",
  };
}

export function sumUsageQuantity(items) {
  return (items ?? []).reduce((sum, line) => sum + getLineQuantity(line), 0);
}

export function getUsageProductNames(usage, productMap) {
  return getUsageItems(usage).map((line) => getLineProduct(line, productMap).name);
}
