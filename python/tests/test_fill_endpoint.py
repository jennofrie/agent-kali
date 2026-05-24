import tempfile
from pathlib import Path
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

def test_fill_uses_direct_for_fillable(fillable_pdf):
    with tempfile.TemporaryDirectory() as td:
        out = Path(td) / "filled.pdf"
        r = client.post("/fill", json={
            "source_path": str(fillable_pdf),
            "out_path": str(out),
            "path": "direct",
            "schema": {"fields": []},
            "values": {"name": "Jane"},
        })
        assert r.status_code == 200
        assert "filled_path" in r.json()
        assert out.exists()

def test_fill_replicate_requires_replica_path(fillable_pdf):
    with tempfile.TemporaryDirectory() as td:
        out = Path(td) / "filled.pdf"
        r = client.post("/fill", json={
            "source_path": str(fillable_pdf),
            "out_path": str(out),
            "path": "replicate",
            "schema": {"fields": []},
            "values": {},
        })
        assert r.status_code == 200
        assert "error" in r.json()

def test_fill_replicate_with_replica(flattened_pdf):
    from engines.pdf_engine import build_form_map, replicate_pdf
    with tempfile.TemporaryDirectory() as td:
        replica = Path(td) / "replica.pdf"
        replicate_pdf(build_form_map(flattened_pdf), replica)
        out = Path(td) / "filled.pdf"
        r = client.post("/fill", json={
            "source_path": str(flattened_pdf),
            "out_path": str(out),
            "path": "replicate",
            "schema": {"fields": [{"id": "f1", "type": "text", "label": "N",
                       "location": {"page": 1, "x": 100, "y": 700, "w": 80, "h": 14}}]},
            "values": {"f1": "Hello"},
            "replica_path": str(replica),
        })
        assert r.status_code == 200
        assert out.exists()
