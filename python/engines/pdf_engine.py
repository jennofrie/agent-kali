from pathlib import Path
import fitz  # PyMuPDF

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
