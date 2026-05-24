import { useStore } from "../../store";

export function FieldsPanel() {
  const { fields, fieldValues, setFieldValue } = useStore();
  if (fields.length === 0) {
    return <div className="p-4 text-neutral-500 text-sm">No fields detected yet.</div>;
  }
  return (
    <div className="p-4 overflow-auto space-y-3">
      <h2 className="font-semibold">Fields ({fields.length})</h2>
      {fields.map((f) => (
        <div key={f.id} className="bg-neutral-900 p-3 rounded">
          <div className="text-sm text-neutral-300 mb-1">
            {f.label} <span className="text-neutral-500">({f.type})</span>
            {f.instructions && (
              <div className="text-xs text-neutral-500 italic">{f.instructions}</div>
            )}
          </div>
          {f.type === "text" || f.type === "signature" ? (
            <input
              className="w-full bg-neutral-800 px-2 py-1 rounded text-sm"
              value={(fieldValues[f.id] as string) ?? ""}
              onChange={(e) => setFieldValue(f.id, e.target.value)}
            />
          ) : f.type === "checkbox" ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(fieldValues[f.id])}
                onChange={(e) => setFieldValue(f.id, e.target.checked)}
              />
              {f.checkStyle ? `(${f.checkStyle})` : null}
            </label>
          ) : f.type === "radio" && f.options ? (
            <div className="space-y-1">
              {f.options.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm">
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
              className="w-full bg-neutral-800 px-2 py-1 rounded text-sm"
              value={(fieldValues[f.id] as string) ?? ""}
              onChange={(e) => setFieldValue(f.id, e.target.value)}
            >
              <option value="">—</option>
              {f.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <div className="text-xs text-neutral-500">Unsupported field type</div>
          )}
        </div>
      ))}
    </div>
  );
}
