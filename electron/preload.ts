import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  sidecar: (method: string, path: string, body?: unknown) =>
    ipcRenderer.invoke("sidecar:request", method, path, body),
  ragQuery: (query: string, workspace?: string) =>
    ipcRenderer.invoke("rag:query", query, workspace),
  openFile: () => ipcRenderer.invoke("file:open"),
  saveFile: (defaultName: string) => ipcRenderer.invoke("file:save", defaultName),
});
