import { spawn, ChildProcess } from "node:child_process";
import path from "node:path";
import { app } from "electron";

let sidecar: ChildProcess | null = null;
let sidecarPort: number | null = null;

const STARTUP_TIMEOUT_MS = 10_000;

export async function startSidecar(): Promise<number> {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(app.getAppPath(), "python", ".venv", "bin", "python");
    const serverPath = path.join(app.getAppPath(), "python", "server.py");
    sidecar = spawn(pythonPath, [serverPath], { cwd: path.join(app.getAppPath(), "python") });

    const timeout = setTimeout(() => {
      if (sidecarPort === null) {
        sidecar?.kill();
        reject(new Error(`sidecar did not print port within ${STARTUP_TIMEOUT_MS}ms`));
      }
    }, STARTUP_TIMEOUT_MS);

    const onData = (data: Buffer) => {
      const text = data.toString();
      const match = text.match(/AGENT_FORM_FILLER_PORT=(\d+)/);
      if (match && sidecarPort === null) {
        sidecarPort = parseInt(match[1], 10);
        clearTimeout(timeout);
        resolve(sidecarPort);
      }
      process.stdout.write(`[sidecar] ${text}`);
    };
    sidecar.stdout?.on("data", onData);
    sidecar.stderr?.on("data", onData);
    sidecar.on("error", (e) => { clearTimeout(timeout); reject(e); });
    sidecar.on("exit", (code) => {
      if (sidecarPort === null) {
        clearTimeout(timeout);
        reject(new Error(`sidecar exited early with code ${code}`));
      }
    });
  });
}

export function stopSidecar() {
  sidecar?.kill();
}

export function getSidecarPort(): number {
  if (sidecarPort === null) throw new Error("sidecar not started");
  return sidecarPort;
}
