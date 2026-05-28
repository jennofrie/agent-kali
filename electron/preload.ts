import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  sidecar: (method: string, path: string, body?: unknown) =>
    ipcRenderer.invoke("sidecar:request", method, path, body),
  ragQuery: (query: string, workspace?: string) =>
    ipcRenderer.invoke("rag:query", query, workspace),
  openFile: () => ipcRenderer.invoke("file:open"),
  openFolder: () => ipcRenderer.invoke("file:openFolder"),
  saveFile: (defaultName: string) => ipcRenderer.invoke("file:save", defaultName),
  readFile: (filePath: string): Promise<number[]> =>
    ipcRenderer.invoke("file:read", filePath),
  scanParticipants: () => ipcRenderer.invoke("participants:scan"),
  listParticipantFiles: (folderPath: string, subfolder?: string) =>
    ipcRenderer.invoke("participants:listFiles", folderPath, subfolder),
  importFileToParticipant: (sourcePath: string, participantFolder: string, subfolder: string) =>
    ipcRenderer.invoke("participants:importFile", sourcePath, participantFolder, subfolder),
});
