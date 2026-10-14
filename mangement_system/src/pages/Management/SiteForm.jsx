import { API_ENDPOINTS } from "../../config/api";
import LocationForm from "./LocationForm";

const CONFIG = {
  endpoints: {
    list: API_ENDPOINTS.sites,
    create: API_ENDPOINTS.createSite,
    update: API_ENDPOINTS.updateSite,
    addProduct: API_ENDPOINTS.addSiteProduct,
  },
  labels: {
    name: "اسم الموقع",
    createBtn: "إنشاء الموقع",
    created: "تم إنشاء الموقع بنجاح.",
    updated: "تم تحديث الموقع بنجاح.",
    selectLabel: "اختر موقعاً للتعديل",
    selectPlaceholder: "اختر موقعاً...",
    dataTitle: "بيانات الموقع",
    addTitle: "إضافة صنف إلى الموقع",
    productAdded: "تمت إضافة الصنف إلى الموقع بنجاح.",
  },
};

export default function SiteForm({ tab }) {
  return <LocationForm tab={tab} config={CONFIG} />;
}
