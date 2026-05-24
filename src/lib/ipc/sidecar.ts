export const sidecar = {
  get:  <T>(path: string)                 => window.api.sidecar<T>("GET",  path),
  post: <T>(path: string, body?: unknown) => window.api.sidecar<T>("POST", path, body),
};
