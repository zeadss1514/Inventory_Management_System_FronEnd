// Shared input fields for both the create and edit product forms.
export default function ProductFields({ form, onChange, disabled }) {
  return (
    <>
      <label className="pf-checkbox">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => onChange({ active: e.target.checked })}
          disabled={disabled}
        />
        نشط
      </label>

      <div className="pf-field">
        <label htmlFor="pf-name">اسم المنتج</label>
        <input
          id="pf-name"
          type="text"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={disabled}
          required
        />
      </div>

      <div className="pf-field">
        <label htmlFor="pf-code">الكود</label>
        <input
          id="pf-code"
          type="number"
          value={form.code}
          onChange={(e) => onChange({ code: e.target.value })}
          disabled={disabled}
          required
        />
      </div>

      <div className="pf-field">
        <label htmlFor="pf-unit">وحدة القياس</label>
        <input
          id="pf-unit"
          list="pf-unit-list"
          type="text"
          value={form.measurementUnit}
          onChange={(e) => onChange({ measurementUnit: e.target.value })}
          disabled={disabled}
          required
        />
        <datalist id="pf-unit-list">
          <option value="قطعة" />
          <option value="كجم" />
          <option value="جرام" />
          <option value="لتر" />
          <option value="طن" />
          <option value="علبة" />
          <option value="كرتونة" />
        </datalist>
      </div>

      <div className="pf-field">
        <label htmlFor="pf-description">الوصف</label>
        <textarea
          id="pf-description"
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          disabled={disabled}
          rows={3}
        />
      </div>
    </>
  );
}
