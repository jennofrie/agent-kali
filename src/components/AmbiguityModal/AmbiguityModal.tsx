import { useStore } from "../../store";

export function AmbiguityModal() {
  const { ambiguousQueue, resolveAmbiguous } = useStore();
  if (ambiguousQueue.length === 0) return null;
  const { field, sourceContext } = ambiguousQueue[0];

  return (
    <div className="modal-backdrop">
      <div className="ambiguity-card">
        <div>
          <span className="eyebrow">Review required</span>
          <h2>Ambiguity ({ambiguousQueue.length} pending)</h2>
        </div>
        <div className="modal-details">
          <div><span>Field:</span> {field.label}</div>
          {field.instructions && (
            <div><span>Instructions:</span> {field.instructions}</div>
          )}
          <div className="source-context">{sourceContext}</div>
        </div>
        <div className="modal-actions">
          {field.type === "checkbox" ? (
            <>
              <button onClick={() => resolveAmbiguous(field.id, true)}
                      className="secondary-action">Tick</button>
              <button onClick={() => resolveAmbiguous(field.id, false)}
                      className="secondary-action danger">Cross</button>
              <button onClick={() => resolveAmbiguous(field.id, null)}
                      className="secondary-action">Leave blank</button>
            </>
          ) : field.type === "radio" && field.options ? (
            field.options.map((opt) => (
              <button key={opt} onClick={() => resolveAmbiguous(field.id, opt)}
                      className="secondary-action">{opt}</button>
            ))
          ) : null}
          <button onClick={() => resolveAmbiguous(field.id, null)}
                  className="secondary-action muted">Skip</button>
        </div>
      </div>
    </div>
  );
}
