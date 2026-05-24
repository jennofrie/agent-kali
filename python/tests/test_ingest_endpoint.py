from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

def test_ingest_returns_form_map(fillable_pdf):
    r = client.post("/ingest", json={"file_path": str(fillable_pdf)})
    assert r.status_code == 200
    data = r.json()
    assert data["editability"] == "fillable"
    assert data["path"] == "direct"

def test_ingest_missing_file_returns_error():
    r = client.post("/ingest", json={"file_path": "/nonexistent/foo.pdf"})
    assert r.status_code == 200
    assert "error" in r.json()

def test_ingest_non_pdf_returns_error(tmp_path):
    fake = tmp_path / "foo.txt"
    fake.write_text("not a pdf")
    r = client.post("/ingest", json={"file_path": str(fake)})
    assert r.status_code == 200
    assert "error" in r.json()
