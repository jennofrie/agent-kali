import { useStore } from "../../store";

export function FieldsPanel() {
  const { fields, fieldValues, setFieldValue } = useStore();
  const filledCount = fields.filter((field) => {
    const value = fieldValues[field.id];
    return value !== undefined && value !== "" && value !== false;
  }).length;

  if (fields.length === 0) {
    return (
      <div className="fields-panel empty">
        <span className="eyebrow">Field map</span>
        <h2>No fields detected</h2>
        <p>Open a form to extract fillable fields and semantic labels.</p>
      </div>
    );
  }

  return (
    <div className="fields-panel">
      <div className="fields-header">
        <div>
          <span className="eyebrow">Field map</span>
          <h2>{fields.length} fields</h2>
        </div>
        <span>{filledCount}/{fields.length}</span>
      </div>
      {fields.map((f) => (
        <div key={f.id} className="field-card">
          <div className="field-label">
            <strong>{f.label}</strong>
            <span>{f.type}</span>
            {f.instructions && (
              <p>{f.instructions}</p>
            )}
          </div>
          {f.type === "text" || f.type === "signature" ? (
            <input
              className="field-input"
              value={(fieldValues[f.id] as string) ?? ""}
              onChange={(e) => setFieldValue(f.id, e.target.value)}
            />
          ) : f.type === "checkbox" ? (
            <label className="check-row">
              <input
                type="checkbox"
                checked={Boolean(fieldValues[f.id])}
                onChange={(e) => setFieldValue(f.id, e.target.checked)}
              />
              {f.checkStyle ? `(${f.checkStyle})` : null}
            </label>
          ) : f.type === "radio" && f.options ? (
            <div className="choice-stack">
              {f.options.map((opt) => (
                <label key={opt}>
                  <input
                    type="radio"
                    name={f.id}
                    checked={fieldValues[f.id] === opt}
                    onChange={() => setFieldValue(f.id, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : f.type === "choice" && f.options ? (
            <select
              className="field-input"
              value={(fieldValues[f.id] as string) ?? ""}
              onChange={(e) => setFieldValue(f.id, e.target.value)}
            >
              <option value="">—</option>
              {f.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <div className="unsupported-field">Unsupported field type</div>
          )}
        </div>
      ))}
    </div>
  );
}
