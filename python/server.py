import socket
from contextlib import asynccontextmanager
from fastapi import FastAPI
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"AGENT_FORM_FILLER_PORT={app.state.port}", flush=True)
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    # Bind to OS-assigned port so we know the chosen value before starting uvicorn
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(("127.0.0.1", 0))
    chosen_port = sock.getsockname()[1]
    sock.close()
    app.state.port = chosen_port
    config = uvicorn.Config(app, host="127.0.0.1", port=chosen_port, log_level="info")
    uvicorn.Server(config).run()
