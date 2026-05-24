type SidecarResponse<T> = { ok: boolean; status: number; data: T };

declare global {
  interface Window {
    api: { sidecar: <T>(method: string, path: string, body?: unknown) => Promise<SidecarResponse<T>> };
  }
}

export const sidecar = {
  get:  <T>(path: string)                 => window.api.sidecar<T>("GET",  path),
  post: <T>(path: string, body?: unknown) => window.api.sidecar<T>("POST", path, body),
};
