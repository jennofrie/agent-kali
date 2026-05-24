import { test, expect, _electron as electron } from "@playwright/test";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

test("app launches and shows sidebar", async () => {
  const electronApp = await electron.launch({
    args: [join(__dirname, "../../dist-electron/main.js")],
  });
  const window = await electronApp.firstWindow();
  await expect(window.locator("text=Open Form")).toBeVisible({ timeout: 20_000 });
  await electronApp.close();
});
