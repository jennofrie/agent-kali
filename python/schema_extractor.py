from pathlib import Path
import fitz
import json
import tempfile

WIDGET_TYPE_MAP = {
    fitz.PDF_WIDGET_TYPE_TEXT: "text",
    fitz.PDF_WIDGET_TYPE_CHECKBOX: "checkbox",
    fitz.PDF_WIDGET_TYPE_RADIOBUTTON: "radio",
    fitz.PDF_WIDGET_TYPE_LISTBOX: "choice",
    fitz.PDF_WIDGET_TYPE_COMBOBOX: "choice",
    fitz.PDF_WIDGET_TYPE_SIGNATURE: "signature",
}


def extract_native_schema(path: Path) -> list[dict]:
    doc = fitz.open(str(path))
    fields: list[dict] = []
    try:
        if doc.needs_pass:
            return fields
        for page_num, page in enumerate(doc, start=1):
            # Use first_widget/next as primary API; fall back to widgets() if unavailable.
            try:
                widget = page.first_widget
                widget_iter = []
                while widget:
                    widget_iter.append(widget)
                    widget = widget.next
            except AttributeError:
                widget_iter = list(page.widgets())
            for widget in widget_iter:
                ftype = WIDGET_TYPE_MAP.get(widget.field_type, "text")
                rect = widget.rect
                fields.append({
                    "id": f"native_{widget.field_name}",
                    "type": ftype,
                    "label": widget.field_name,
                    "required": bool(widget.field_flags & 2),
                    "location": {
                        "page": page_num,
                        "x": rect.x0,
                        "y": rect.y0,
                        "w": rect.width,
                        "h": rect.height,
                    },
                })
        return fields
    finally:
        doc.close()


VISION_PROMPT = """You are analyzing a form image. Return JSON with this exact shape:
{"fields": [{"id": "v1", "type": "text|checkbox|radio|signature|choice", "label": "...",
"instructions": "form instructions for this field if visible, else empty",
"checkStyle": "tick|cross|filled|check (only for checkboxes/radios)",
"required": true|false, "options": ["..."] (only for radio/choice),
"location": {"page": N, "x": N, "y": N, "w": N, "h": N}}]}

Only output the JSON. No prose. Coordinates are in PDF points from top-left."""


def _render_pages_to_png(pdf_path: Path, out_dir: Path, dpi: int = 200) -> list[Path]:
    doc = fitz.open(str(pdf_path))
    paths = []
    try:
        for i, page in enumerate(doc, start=1):
            pix = page.get_pixmap(dpi=dpi)
            png = out_dir / f"page_{i}.png"
            pix.save(str(png))
            paths.append(png)
        return paths
    finally:
        doc.close()


def _call_claude_vision(prompt: str, png_paths: list[Path]) -> str:
    from llm.claude_adapter import complete_with_images
    return complete_with_images(prompt, png_paths)


def extract_vision_schema(pdf_path: Path) -> list[dict]:
    with tempfile.TemporaryDirectory() as td:
        pngs = _render_pages_to_png(pdf_path, Path(td))
        raw = _call_claude_vision(VISION_PROMPT, pngs)
    raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    data = json.loads(raw)
    return data.get("fields", [])


def _overlaps(a: dict, b: dict, tol: float = 8.0) -> bool:
    la, lb = a["location"], b["location"]
    if la["page"] != lb["page"]:
        return False
    return abs(la["x"] - lb["x"]) < tol and abs(la["y"] - lb["y"]) < tol


def merge_schemas(native: list[dict], vision: list[dict]) -> list[dict]:
    merged = [dict(f) for f in native]
    for v in vision:
        match = next((n for n in merged if _overlaps(n, v)), None)
        if match:
            # Native authoritative for id/type/label/location; vision adds semantics
            for k in ("instructions", "checkStyle", "options", "required"):
                if k in v and k not in match:
                    match[k] = v[k]
        else:
            merged.append(v)
    return merged


def extract_schema(pdf_path: Path) -> dict:
    native = extract_native_schema(pdf_path)
    try:
        vision = extract_vision_schema(pdf_path)
    except Exception as e:
        print(f"[schema] vision failed: {e}; using native only", flush=True)
        vision = []
    return {"fields": merge_schemas(native, vision)}
