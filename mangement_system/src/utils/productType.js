// Product types, as stored in `product.type` and sent to the API.
// One place for the values + Arabic labels (form radios, list filter, badges).
export const PRODUCT_TYPES = [
  { value: "product", label: "منتجات" },
  { value: "tools", label: "معدات" },
];

// Label for a stored type; "—" for older products that have no type yet.
export function getProductTypeLabel(type) {
  return PRODUCT_TYPES.find((t) => t.value === type)?.label ?? "—";
}
