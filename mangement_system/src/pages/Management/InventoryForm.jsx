import { API_ENDPOINTS } from "../../config/api";
import LocationForm from "./LocationForm";

const CONFIG = {
  endpoints: {
    list: API_ENDPOINTS.warehouses,
    create: API_ENDPOINTS.createInventory,
    update: API_ENDPOINTS.updateInventory,
    addProduct: API_ENDPOINTS.addInventoryProduct,
  },
  labels: {
    name: "اسم المخزن",
    createBtn: "إنشاء المخزن",
    created: "تم إنشاء المخزن بنجاح.",
    updated: "تم تحديث المخزن بنجاح.",
    selectLabel: "اختر مخزناً للتعديل",
    selectPlaceholder: "اختر مخزناً...",
    dataTitle: "بيانات المخزن",
    addTitle: "إضافة منتج إلى المخزن",
    productAdded: "تمت إضافة المنتج إلى المخزن بنجاح.",
  },
};

export default function InventoryForm({ tab }) {
  return <LocationForm tab={tab} config={CONFIG} />;
}
