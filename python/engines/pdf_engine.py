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
