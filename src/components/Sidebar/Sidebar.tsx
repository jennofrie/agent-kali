import { useStore } from "../../store";
import { sidecar } from "../../lib/ipc/sidecar";

export function Sidebar() {
  const { uploadedPath, editability, path, setUploaded, setEditability, setFormMap, setFields } = useStore();

  async function pickFile() {
    const p = await window.api.openFile();
    if (!p) return;
    setUploaded(p);
    const ingestRes = await sidecar.post<any>("/ingest", { file_path: p });
    if (ingestRes.data?.error) {
      setEditability(null, null);
      return;
    }
    setEditability(ingestRes.data.editability, ingestRes.data.path);
    setFormMap(ingestRes.data);
    const schemaRes = await sidecar.post<any>("/schema", { file_path: p });
    setFields(schemaRes.data?.fields ?? []);
  }

  const pathLabel =
    path === "direct"    ? "🟢 Filling original" :
    path === "replicate" ? "🟡 Filling replica (locked form detected)" :
    uploadedPath         ? "Analyzing…" : "No file";

  return (
    <aside className="w-72 h-full bg-neutral-900 p-4 flex flex-col gap-4 border-r border-neutral-800">
      <h1 className="text-lg font-semibold">agent-form-filler</h1>
      <button onClick={pickFile} className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded">
        Open Form
      </button>
      <div className="text-sm">
        <div className="text-neutral-400">Status</div>
        <div>{pathLabel}</div>
      </div>
      {uploadedPath && (
        <div className="text-xs text-neutral-500 break-all">{uploadedPath}</div>
      )}
      <div className="text-xs text-neutral-500 mt-auto">Editability: {editability ?? "—"}</div>
    </aside>
  );
}
