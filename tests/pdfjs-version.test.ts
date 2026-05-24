import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import { dirname } from "node:path";

const require = createRequire(import.meta.url);

// Regression guard for the pdf.js "API version does not match Worker version" error.
// The worker is loaded from the top-level `pdfjs-dist`; the API comes from the copy
// react-pdf depends on. If they diverge, the PDF viewer breaks at runtime even though
// types compile and the window opens. Keep them pinned to the same version.
describe("pdfjs version alignment", () => {
  it("top-level pdfjs-dist (worker) matches react-pdf's bundled pdfjs-dist (API)", () => {
    const workerVersion = require("pdfjs-dist/package.json").version;

    const reactPdfPkg = require.resolve("react-pdf/package.json");
    const reactPdfPdfjsPkg = require.resolve("pdfjs-dist/package.json", {
      paths: [dirname(reactPdfPkg)],
    });
    const apiVersion = require(reactPdfPdfjsPkg).version;

    expect(workerVersion).toBe(apiVersion);
  });
});
