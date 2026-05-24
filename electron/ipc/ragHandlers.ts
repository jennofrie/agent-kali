import { ipcMain, app } from "electron";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type RagConfig = { rag: { cli: string; defaultWorkspace: string; workspaces: Record<string, string> } };

function loadCfg(): RagConfig {
  const p = join(app.getAppPath(), "config", "agent.config.json");
  return JSON.parse(readFileSync(p, "utf-8"));
}

export function registerRagIPC() {
  ipcMain.handle("rag:query", async (_evt, query: string, workspace?: string) => {
    const cfg = loadCfg();
    const ws = workspace || cfg.rag.defaultWorkspace;
    return new Promise<string>((resolve, reject) => {
      const proc = spawn(cfg.rag.cli, ["query", ws, query]);
      let out = "", err = "";
      proc.stdout.on("data", (d) => (out += d.toString()));
      proc.stderr.on("data", (d) => (err += d.toString()));
      proc.on("error", reject);
      proc.on("exit", (code) => (code === 0 ? resolve(out) : reject(new Error(err || `exit ${code}`))));
    });
  });
}
