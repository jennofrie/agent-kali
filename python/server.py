import socket
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel
from config import load_config
from engines.pdf_engine import build_form_map, replicate_pdf
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

if __name__ == "__main__":
    # Bind to OS-assigned port so we know the chosen value before starting uvicorn
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(("127.0.0.1", 0))
    chosen_port = sock.getsockname()[1]
    sock.close()
    app.state.port = chosen_port
    config = uvicorn.Config(app, host="127.0.0.1", port=chosen_port, log_level="info")
    uvicorn.Server(config).run()
