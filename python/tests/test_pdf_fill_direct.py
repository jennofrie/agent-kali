import tempfile
from pathlib import Path
import fitz
from engines.pdf_engine import fill_pdf_direct

def test_fills_acroform_text(fillable_pdf):
    with tempfile.TemporaryDirectory() as td:
        out = Path(td) / "filled.pdf"
        fill_pdf_direct(fillable_pdf, out, {"name": "Jane Doe", "agree": True})
        doc = fitz.open(str(out))
        seen = {}
        for page in doc:
            widget = page.first_widget
            while widget:
                seen[widget.field_name] = widget.field_value
                widget = widget.next
        doc.close()
        assert seen["name"] == "Jane Doe"
        # checkbox value varies by PDF; accept truthy on-states
        assert seen["agree"] in ("Yes", "On", True, "1", "Checked")

def test_ignores_unknown_fields(fillable_pdf):
    with tempfile.TemporaryDirectory() as td:
        out = Path(td) / "filled.pdf"
        # should not raise even if a value has no matching widget
        fill_pdf_direct(fillable_pdf, out, {"name": "X", "nonexistent": "Y"})
        assert out.exists()
