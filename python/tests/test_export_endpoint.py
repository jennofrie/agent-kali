import tempfile
from pathlib import Path
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

def test_export_writes_pdf_flattened(fillable_pdf):
    with tempfile.TemporaryDirectory() as td:
        out = Path(td) / "exported.pdf"
        r = client.post("/export", json={
            "source_path": str(fillable_pdf),
            "out_path": str(out),
            "format": "pdf",
            "flatten": True,
        })
        assert r.status_code == 200
        assert "export_path" in r.json()
        assert out.exists() and out.stat().st_size > 0

def test_export_copy_no_flatten(fillable_pdf):
    with tempfile.TemporaryDirectory() as td:
        out = Path(td) / "exported.pdf"
        r = client.post("/export", json={
            "source_path": str(fillable_pdf),
            "out_path": str(out),
            "format": "pdf",
            "flatten": False,
        })
        assert r.status_code == 200
        assert out.exists()

def test_export_unsupported_format_returns_error(fillable_pdf):
    with tempfile.TemporaryDirectory() as td:
        out = Path(td) / "exported.docx"
        r = client.post("/export", json={
            "source_path": str(fillable_pdf),
            "out_path": str(out),
            "format": "docx",
            "flatten": True,
        })
        assert r.status_code == 200
        assert "error" in r.json()
