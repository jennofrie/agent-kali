export async function ragQuery(query: string, workspace?: string): Promise<string> {
  return window.api.ragQuery(query, workspace);
}
