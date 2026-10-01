import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { MANAGED_ENTITIES } from "./entities";
import ProductForm from "./ProductForm";
import InventoryForm from "./InventoryForm";
import SiteForm from "./SiteForm";
import ZoneForm from "./ZoneForm";
import "./EntityFormModal.css";

const TABS = [
  { value: "create", label: "إنشاء" },
  { value: "edit", label: "تعديل" },
];

// Entity key -> form component. Add new entities here as they get built.
// ⚠ The "inventory", "site" and "zone" keys must match the key used in MANAGED_ENTITIES (entities.js).
const FORMS = {
  product: ProductForm,
  inventory: InventoryForm,
  site: SiteForm,
  zone: ZoneForm,
};

export default function EntityFormModal({ entityType, onClose }) {
  const [tab, setTab] = useState("create");
  const entity = MANAGED_ENTITIES[entityType];
  const Icon = entity?.icon;
  const Form = FORMS[entityType];

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="efm-overlay" onClick={onClose}>
      <div
        className="efm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entity-form-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="efm-header">
          <h2 id="entity-form-modal-title" className="efm-title">
            {Icon && <Icon size={22} strokeWidth={1.8} aria-hidden="true" />}
            {entity?.label ?? ""}
          </h2>
          <button type="button" className="efm-close" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </header>

        <div className="efm-tabs" role="tablist" aria-label="إنشاء أو تعديل">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              className={`efm-tab${tab === t.value ? " efm-tab--active" : ""}`}
              onClick={() => setTab(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="efm-body">
          {Form ? (
            <Form tab={tab} />
          ) : tab === "create" ? (
            <p className="efm-hint">سيتم بناء نموذج إنشاء {entity?.label} هنا في الخطوة التالية.</p>
          ) : (
            <p className="efm-hint">
              سيتم بناء نموذج تعديل {entity?.label} هنا، بما في ذلك اختيار العنصر المطلوب تعديله.
            </p>
          )}
        </div>

        <footer className="efm-footer">
          <button type="button" className="efm-btn" onClick={onClose}>
            إغلاق
          </button>
        </footer>
      </div>
    </div>
  );
}
