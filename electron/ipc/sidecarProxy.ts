import { ipcMain } from "electron";
import { getSidecarPort } from "../sidecar";

export function registerSidecarIPC() {
  ipcMain.handle("sidecar:request", async (_evt, method: string, path: string, body?: unknown) => {
    try {
      const port = getSidecarPort();
      const url = `http://127.0.0.1:${port}${path}`;
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
      catch { return { ok: res.ok, status: res.status, data: text }; }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, status: 0, data: { error: msg } };
    }
  });
}
