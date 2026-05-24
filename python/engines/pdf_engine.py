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
