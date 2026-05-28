import { dialog, ipcMain, BrowserWindow } from "electron";
import { readFileSync, existsSync, copyFileSync, mkdirSync, renameSync, unlinkSync } from "node:fs";
import path from "node:path";

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

  ipcMain.handle("file:openFolder", async () => {
    const win = BrowserWindow.getFocusedWindow();
    const opts = { properties: ["openDirectory" as const] };
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

  ipcMain.handle('replace-file', async (_event, sourcePath: string, filledPath: string) => {
    try {
      // Backup original first
      const backupPath = sourcePath + '.bak';
      if (existsSync(sourcePath)) {
        copyFileSync(sourcePath, backupPath);
      }
      // Copy filled version over original
      copyFileSync(filledPath, sourcePath);
      return { success: true, backupPath };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle('delete-file', async (_event, filePath: string) => {
    try {
      unlinkSync(filePath);
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle('move-file', async (_event, sourcePath: string, destPath: string) => {
    try {
      const destDir = path.dirname(destPath);
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      renameSync(sourcePath, destPath);
      return { success: true, destPath };
    } catch (e) {
      // If rename fails (cross-device), fallback to copy+delete
      try {
        copyFileSync(sourcePath, destPath);
        unlinkSync(sourcePath);
        return { success: true, destPath };
      } catch (e2) {
        return { success: false, error: String(e2) };
      }
    }
  });
}
