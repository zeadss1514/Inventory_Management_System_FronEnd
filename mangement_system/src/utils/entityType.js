// Matches the model enum: { type: String, enum: ["Sites", "Inventories"] }
export const ENTITY_TYPE_LABELS = { Inventories: "مخزن", Sites: "موقع" };

export function getEntityTypeLabel(type) {
  return ENTITY_TYPE_LABELS[type] ?? "—";
}
