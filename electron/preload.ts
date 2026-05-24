import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  sidecar: (method: string, path: string, body?: unknown) =>
    ipcRenderer.invoke("sidecar:request", method, path, body),
});
