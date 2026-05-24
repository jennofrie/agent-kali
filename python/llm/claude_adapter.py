import os
import json
import base64
from pathlib import Path
from anthropic import Anthropic
from config import load_config

def _read_oauth_token() -> str | None:
    """Read Claude Code OAuth access token from ~/.claude/ if present."""
    cfg = load_config()
    token_dir = Path(cfg.get("claude_runtime", {}).get("oauth_token_path", "~/.claude/")).expanduser()
    creds = token_dir / ".credentials.json"
    if creds.exists():
        try:
            data = json.loads(creds.read_text())
            oauth = data.get("claudeAiOauth", {})
            return oauth.get("accessToken") or data.get("accessToken")
        except Exception:
            return None
    return None

def get_client() -> Anthropic:
    cfg = load_config()
    auth_mode = cfg.get("claude_runtime", {}).get("auth", "oauth")
    if auth_mode == "oauth":
        token = _read_oauth_token()
        if token:
            return Anthropic(auth_token=token)
    key = os.environ.get(cfg["llm"]["adapters"]["claude"]["apiKeyEnv"], "")
    return Anthropic(api_key=key)

def complete_with_images(prompt: str, image_paths: list[Path], model: str | None = None) -> str:
    cfg = load_config()
    model = model or cfg["llm"]["adapters"]["claude"]["model"]
    client = get_client()
    content: list[dict] = []
    for p in image_paths:
        b64 = base64.standard_b64encode(p.read_bytes()).decode()
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/png", "data": b64},
        })
    content.append({"type": "text", "text": prompt})
    msg = client.messages.create(
        model=model, max_tokens=4096,
        messages=[{"role": "user", "content": content}],
    )
    return msg.content[0].text
