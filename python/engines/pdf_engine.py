from pathlib import Path
import fitz  # PyMuPDF
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.lib.colors import HexColor

Editability = str  # "fillable" | "locked" | "flattened" | "scanned"

def detect_editability(path: Path) -> Editability:
    doc = fitz.open(str(path))
    try:
        # Encrypted and we can't open with empty password => locked
        if doc.is_encrypted and not doc.authenticate(""):
            return "locked"
        # Some PDFs are encrypted but openable; if modify/form perms are blocked => locked
        if doc.is_encrypted:
            perms = doc.permissions
            if not (perms & fitz.PDF_PERM_MODIFY) or not (perms & fitz.PDF_PERM_FORM):
                return "locked"
        # Look for AcroForm widgets across all pages
        try:
            has_widgets = any(page.first_widget is not None for page in doc)
        except AttributeError:
            has_widgets = any(len(list(page.widgets())) > 0 for page in doc)
        if has_widgets:
            return "fillable"
        # No widgets — check for a text layer
        has_text = any(page.get_text("text").strip() for page in doc)
        if has_text:
            return "flattened"
        return "scanned"
    finally:
        doc.close()


def _path_from_editability(e: Editability) -> str:
    return "direct" if e == "fillable" else "replicate"


def build_form_map(path: Path) -> dict:
    editability = detect_editability(path)
    doc = fitz.open(str(path))
    try:
        # Guard: password-protected doc whose text we cannot read
        if doc.needs_pass:
            return {
                "source_path": str(path),
                "editability": editability,
                "path": _path_from_editability(editability),
                "pages": [],
            }
        pages = []
        for page_num, page in enumerate(doc, start=1):
            text_elements = []
            for block in page.get_text("dict")["blocks"]:
                if block.get("type") != 0:  # 0 = text block
                    continue
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        bbox = span["bbox"]
                        text_elements.append({
                            "text": span["text"],
                            "x": bbox[0], "y": bbox[1],
                            "w": bbox[2] - bbox[0], "h": bbox[3] - bbox[1],
                            "font": span["font"],
                            "size": span["size"],
                            "color": span["color"],
                        })
            rect = page.rect
            pages.append({
                "page": page_num,
                "width": rect.width,
                "height": rect.height,
                "text_elements": text_elements,
            })
        return {
            "source_path": str(path),
            "editability": editability,
            "path": _path_from_editability(editability),
            "pages": pages,
        }
    finally:
        doc.close()


def _int_to_hex(c: int) -> str:
    return f"#{c & 0xFFFFFF:06x}"


def fill_pdf_direct(src: Path, out: Path, values: dict) -> Path:
    doc = fitz.open(str(src))
    try:
        for page in doc:
            try:
                widget = page.first_widget
                widgets_iter = None
            except AttributeError:
                widget = None
                widgets_iter = page.widgets()
            if widgets_iter is not None:
                for widget in widgets_iter:
                    name = widget.field_name
                    if name in values:
                        v = values[name]
                        if widget.field_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
                            if v:
                                # Find the on-state string via button_states(); fall back to "Yes"
                                try:
                                    states = widget.button_states()
                                    normal_states = states.get("normal", [])
                                    on_state = next((s for s in normal_states if s != "Off"), "Yes")
                                except Exception:
                                    on_state = "Yes"
                                widget.field_value = on_state
                            else:
                                widget.field_value = "Off"
                        else:
                            widget.field_value = str(v)
                        widget.update()
            else:
                while widget:
                    name = widget.field_name
                    if name in values:
                        v = values[name]
                        if widget.field_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
                            if v:
                                try:
                                    states = widget.button_states()
                                    normal_states = states.get("normal", [])
                                    on_state = next((s for s in normal_states if s != "Off"), "Yes")
                                except Exception:
                                    on_state = "Yes"
                                widget.field_value = on_state
                            else:
                                widget.field_value = "Off"
                        else:
                            widget.field_value = str(v)
                        widget.update()
                    widget = widget.next
        doc.save(str(out))
    finally:
        doc.close()
    return out


# Glyph map for checkbox/radio overlay.
# Uses "symbol2" (Noto Sans Symbols 2, bundled in pymupdf-fonts) which carries
# all four Unicode code-points at U+2713, U+2717, U+25CF, U+2611.
CHECK_GLYPHS = {"tick": "✓", "cross": "✗", "filled": "●", "check": "☑"}
_GLYPH_FONT = "symbol2"  # requires pymupdf-fonts package


def replicate_pdf(form_map: dict, out_path: Path) -> Path:
    if not form_map["pages"]:
        raise ValueError("form_map has no pages")
    first = form_map["pages"][0]
    c = rl_canvas.Canvas(str(out_path), pagesize=(first["width"], first["height"]))
    for page in form_map["pages"]:
        c.setPageSize((page["width"], page["height"]))
        for el in page["text_elements"]:
            try:
                c.setFillColor(HexColor(_int_to_hex(el["color"])))
            except Exception:
                c.setFillColor(HexColor("#000000"))
            c.setFont("Helvetica", el["size"])
            # ReportLab Y origin is bottom-left; PyMuPDF is top-left. Flip.
            y_rl = page["height"] - el["y"] - el["h"]
            c.drawString(el["x"], y_rl, el["text"])
        c.showPage()
    c.save()
    return out_path


def fill_pdf_replica(replica: Path, out: Path, schema: dict, values: dict) -> Path:
    """Overlay text and checkbox glyphs onto a replica (flattened/scanned) PDF.

    Coordinates in schema["fields"][*]["location"] use PyMuPDF's top-left origin
    (x, y are the top-left corner of the field box; h is the box height).
    insert_text is given (x+2, y+h-2) as an approximation of the text baseline.

    Checkbox/radio glyphs are rendered using the "symbol2" font from the
    pymupdf-fonts package (Noto Sans Symbols 2), which carries U+2713 (✓),
    U+2717 (✗), U+25CF (●) and U+2611 (☑).  Base-14 fonts (Helvetica etc.)
    do NOT contain these code-points — PyMuPDF silently substitutes a bullet,
    so they would fail a round-trip get_text assertion.
    """
    doc = fitz.open(str(replica))
    try:
        for field in schema["fields"]:
            fid = field["id"]
            if fid not in values:
                continue
            v = values[fid]
            loc = field["location"]
            page = doc[loc["page"] - 1]
            ftype = field["type"]
            if ftype in ("text", "signature", "choice"):
                if v:
                    page.insert_text(
                        (loc["x"] + 2, loc["y"] + loc["h"] - 2),
                        str(v),
                        fontname="helv",
                        fontsize=10,
                    )
            elif ftype in ("checkbox", "radio"):
                if v:
                    glyph = CHECK_GLYPHS.get(field.get("checkStyle", "tick"), "✓")
                    page.insert_text(
                        (loc["x"] + 1, loc["y"] + loc["h"] - 2),
                        glyph,
                        fontname=_GLYPH_FONT,
                        fontsize=12,
                    )
        doc.save(str(out))
    finally:
        doc.close()
    return out
