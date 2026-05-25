import shutil
import socket
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
import fitz
import uvicorn
from pydantic import BaseModel
from config import load_config
from engines.pdf_engine import build_form_map, replicate_pdf, fill_pdf_direct, fill_pdf_replica
from schema_extractor import extract_schema
from llm.field_values import extract_field_values

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"AGENT_FORM_FILLER_PORT={app.state.port}", flush=True)
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/config")
def get_config():
    return load_config()

class IngestRequest(BaseModel):
    file_path: str

@app.post("/ingest")
def ingest(req: IngestRequest):
    p = Path(req.file_path)
    if not p.exists():
        return {"error": "file not found"}
    if p.suffix.lower() != ".pdf":
        return {"error": f"unsupported extension {p.suffix}"}
    return build_form_map(p)


class SchemaRequest(BaseModel):
    file_path: str

@app.post("/schema")
def schema(req: SchemaRequest):
    return extract_schema(Path(req.file_path))


class ReplicateRequest(BaseModel):
    form_map: dict
    out_path: str | None = None

@app.post("/replicate")
def replicate(req: ReplicateRequest):
    out = Path(req.out_path) if req.out_path else Path(tempfile.gettempdir()) / "replica.pdf"
    replicate_pdf(req.form_map, out)
    return {"replica_path": str(out)}

class ExtractRequest(BaseModel):
    schema: dict
    source_text: str

@app.post("/extract-values")
def extract(req: ExtractRequest):
    return extract_field_values(req.schema, req.source_text)

class FolderExtractRequest(BaseModel):
    folder_path: str
    schema: dict

@app.post("/extract-from-folder")
def extract_from_folder(req: FolderExtractRequest):
    from sources.folder_source import read_folder_text
    folder = Path(req.folder_path)
    if not folder.is_dir():
        return {"error": "folder not found"}
    text, files = read_folder_text(folder)
    if not text.strip():
        return {"error": "no readable documents found in folder", "files_read": files}
    values = extract_field_values(req.schema, text)
    return {"values": values, "files_read": files, "chars": len(text)}

class FillRequest(BaseModel):
    source_path: str
    out_path: str
    path: str  # "direct" | "replicate"
    schema: dict
    values: dict
    replica_path: str | None = None

@app.post("/fill")
def fill(req: FillRequest):
    src = Path(req.source_path)
    out = Path(req.out_path)
    if req.path == "direct":
        fill_pdf_direct(src, out, req.values)
    else:
        if not req.replica_path:
            return {"error": "replica_path required for replicate fill"}
        fill_pdf_replica(Path(req.replica_path), out, req.schema, req.values)
    return {"filled_path": str(out)}

class ExportRequest(BaseModel):
    source_path: str
    out_path: str
    format: str  # "pdf" only in MVP
    flatten: bool = True

@app.post("/export")
def export(req: ExportRequest):
    src = Path(req.source_path)
    out = Path(req.out_path)
    if req.format != "pdf":
        return {"error": f"format {req.format} not supported in MVP"}
    if req.flatten:
        doc = fitz.open(str(src))
        try:
            doc.save(str(out), garbage=4, deflate=True)
        finally:
            doc.close()
    else:
        shutil.copy(src, out)
    return {"export_path": str(out)}

if __name__ == "__main__":
    # Bind to OS-assigned port so we know the chosen value before starting uvicorn
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(("127.0.0.1", 0))
    chosen_port = sock.getsockname()[1]
    sock.close()
    app.state.port = chosen_port
    config = uvicorn.Config(app, host="127.0.0.1", port=chosen_port, log_level="info")
    uvicorn.Server(config).run()
