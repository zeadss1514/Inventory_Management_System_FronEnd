// Basic Arabic plural rules for "منتج" (product): 0, 1, 2, 3-10, 11+ each read differently.
export function formatProductsCount(count) {
  const n = Number(count) || 0;
  if (n === 0) return "لا توجد منتجات";
  if (n === 1) return "منتج واحد";
  if (n === 2) return "منتجان";
  if (n >= 3 && n <= 10) return `${n} منتجات`;
  return `${n} منتجاً`;
}

// inSiteProducts might arrive as a number already, or as an array of product
// entries (optionally carrying their own quantity). This normalizes either shape.
export function sumInSiteProducts(inSiteProducts) {
  if (Array.isArray(inSiteProducts)) {
    return inSiteProducts.reduce((sum, item) => {
      const qty = Number(item?.quantity ?? item?.total_quantity ?? item?.count ?? 1);
      return sum + (Number.isFinite(qty) ? qty : 1);
    }, 0);
  }
  const n = Number(inSiteProducts);
  return Number.isFinite(n) ? n : 0;
}
