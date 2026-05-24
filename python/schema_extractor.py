from pathlib import Path
import fitz

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
