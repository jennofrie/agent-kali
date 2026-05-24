import { useStore } from "../../store";

export function AmbiguityModal() {
  const { ambiguousQueue, resolveAmbiguous } = useStore();
  if (ambiguousQueue.length === 0) return null;
  const { field, sourceContext } = ambiguousQueue[0];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-neutral-900 p-6 rounded-lg w-[480px] space-y-4">
        <h2 className="text-lg font-semibold">Ambiguity ({ambiguousQueue.length} pending)</h2>
        <div className="text-sm space-y-1">
          <div><span className="text-neutral-400">Field:</span> {field.label}</div>
          {field.instructions && (
            <div><span className="text-neutral-400">Instructions:</span> {field.instructions}</div>
          )}
          <div className="text-neutral-400 mt-2">Source context:</div>
          <div className="bg-neutral-800 p-2 rounded text-xs">{sourceContext}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {field.type === "checkbox" ? (
            <>
              <button onClick={() => resolveAmbiguous(field.id, true)}
                      className="bg-emerald-700 hover:bg-emerald-600 px-3 py-2 rounded">Tick ✓</button>
              <button onClick={() => resolveAmbiguous(field.id, false)}
                      className="bg-red-700 hover:bg-red-600 px-3 py-2 rounded">Cross ✗</button>
              <button onClick={() => resolveAmbiguous(field.id, null)}
                      className="bg-neutral-700 hover:bg-neutral-600 px-3 py-2 rounded">Leave blank</button>
            </>
          ) : field.type === "radio" && field.options ? (
            field.options.map((opt) => (
              <button key={opt} onClick={() => resolveAmbiguous(field.id, opt)}
                      className="bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded">{opt}</button>
            ))
          ) : null}
          <button onClick={() => resolveAmbiguous(field.id, null)}
                  className="bg-neutral-600 hover:bg-neutral-500 px-3 py-2 rounded">Skip</button>
        </div>
      </div>
    </div>
  );
}
