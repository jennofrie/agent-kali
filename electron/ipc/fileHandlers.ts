import { dialog, ipcMain, BrowserWindow } from "electron";
import { readFileSync } from "node:fs";

export function registerFileIPC() {
  ipcMain.handle("file:read", (_evt, filePath: string): number[] => {
    const buf = readFileSync(filePath);
    // Return as a plain number[] so it survives the IPC serialisation boundary
    return Array.from(buf);
  });

  ipcMain.handle("file:open", async () => {
    const win = BrowserWindow.getFocusedWindow();
    const opts = {
      properties: ["openFile" as const],
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    };
    const result = win
      ? await dialog.showOpenDialog(win, opts)
      : await dialog.showOpenDialog(opts);
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("file:save", async (_evt, defaultName: string) => {
    const win = BrowserWindow.getFocusedWindow();
    const opts = {
      defaultPath: defaultName,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    };
    const result = win
      ? await dialog.showSaveDialog(win, opts)
      : await dialog.showSaveDialog(opts);
    return result.canceled ? null : result.filePath ?? null;
  });
}
