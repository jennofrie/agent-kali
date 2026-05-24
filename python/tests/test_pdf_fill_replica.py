import tempfile
from pathlib import Path
import fitz
from engines.pdf_engine import build_form_map, replicate_pdf, fill_pdf_replica

def test_replica_fill_inserts_text(flattened_pdf):
    fm = build_form_map(flattened_pdf)
    with tempfile.TemporaryDirectory() as td:
        replica = Path(td) / "replica.pdf"
        replicate_pdf(fm, replica)
        filled = Path(td) / "filled.pdf"
        schema = {"fields": [{
            "id": "name_text", "type": "text", "label": "Name",
            "location": {"page": 1, "x": 200, "y": 700, "w": 100, "h": 14},
        }]}
        fill_pdf_replica(replica, filled, schema, {"name_text": "Test Name"})
        text = fitz.open(str(filled))[0].get_text("text")
        assert "Test Name" in text

def test_replica_fill_checkbox_glyph(flattened_pdf):
    fm = build_form_map(flattened_pdf)
    with tempfile.TemporaryDirectory() as td:
        replica = Path(td) / "replica.pdf"
        replicate_pdf(fm, replica)
        filled = Path(td) / "filled.pdf"
        schema = {"fields": [{
            "id": "agree_cb", "type": "checkbox", "label": "Agree", "checkStyle": "tick",
            "location": {"page": 1, "x": 100, "y": 640, "w": 12, "h": 12},
        }]}
        fill_pdf_replica(replica, filled, schema, {"agree_cb": True})
        text = fitz.open(str(filled))[0].get_text("text")
        assert "✓" in text

def test_replica_fill_skips_unchecked(flattened_pdf):
    fm = build_form_map(flattened_pdf)
    with tempfile.TemporaryDirectory() as td:
        replica = Path(td) / "replica.pdf"
        replicate_pdf(fm, replica)
        filled = Path(td) / "filled.pdf"
        schema = {"fields": [{
            "id": "agree_cb", "type": "checkbox", "label": "Agree", "checkStyle": "tick",
            "location": {"page": 1, "x": 100, "y": 640, "w": 12, "h": 12},
        }]}
        fill_pdf_replica(replica, filled, schema, {"agree_cb": False})
        text = fitz.open(str(filled))[0].get_text("text")
        assert "✓" not in text
