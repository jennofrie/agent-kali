import tempfile
from pathlib import Path
from engines.pdf_engine import build_form_map, replicate_pdf

def test_replica_is_created(flattened_pdf):
    fm = build_form_map(flattened_pdf)
    with tempfile.TemporaryDirectory() as td:
        out = Path(td) / "replica.pdf"
        replicate_pdf(fm, out)
        assert out.exists() and out.stat().st_size > 0

def test_replica_preserves_text(flattened_pdf):
    import fitz
    fm = build_form_map(flattened_pdf)
    with tempfile.TemporaryDirectory() as td:
        out = Path(td) / "replica.pdf"
        replicate_pdf(fm, out)
        text = fitz.open(str(out))[0].get_text("text")
        assert "Name:" in text
