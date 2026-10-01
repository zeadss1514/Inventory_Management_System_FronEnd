import { useState } from "react";
import { Settings2 } from "lucide-react";
import PageHeader from "../../components/PageHeader/PageHeader";
import { MANAGED_ENTITIES } from "./entities";
import EntityFormModal from "./EntityFormModal";
import "./ManagementPage.css";

export default function ManagementPage() {
  const [openType, setOpenType] = useState(null);

  return (
    <div className="management-page">
      <PageHeader
        title="الإدارة"
        subtitle="إنشاء وتعديل البيانات الأساسية في النظام"
        icon={Settings2}
      />

      <div className="entity-grid">
        {Object.entries(MANAGED_ENTITIES).map(([key, entity]) => {
          const Icon = entity.icon;
          return (
            <div key={key} className="entity-card">
              <span className="entity-card__icon" aria-hidden="true">
                <Icon size={26} strokeWidth={1.6} />
              </span>
              <h3 className="entity-card__title">{entity.label}</h3>
              <p className="entity-card__subtitle">إنشاء {entity.label} جديد أو تعديل عنصر موجود</p>
              <button type="button" className="entity-card__btn" onClick={() => setOpenType(key)}>
                إنشاء / تعديل
              </button>
            </div>
          );
        })}
      </div>

      {openType && <EntityFormModal entityType={openType} onClose={() => setOpenType(null)} />}
    </div>
  );
}
