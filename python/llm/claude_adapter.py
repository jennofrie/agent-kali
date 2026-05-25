import os
import json
import base64
import subprocess
from pathlib import Path
from anthropic import Anthropic
from config import load_config

def _parse_token_blob(raw: str) -> str | None:
    """Extract an access token from a credentials blob (JSON or bare token)."""
    raw = (raw or "").strip()
    if not raw:
        return None
    try:
        data = json.loads(raw)
        return data.get("claudeAiOauth", {}).get("accessToken") or data.get("accessToken")
    except Exception:
        return raw  # bare token string

def _read_keychain_token() -> str | None:
    """On macOS, Claude Code stores its OAuth credentials in the Keychain
    (service 'Claude Code-credentials'), not in a file. Read it from there."""
    try:
        out = subprocess.run(
            ["security", "find-generic-password", "-s", "Claude Code-credentials", "-w"],
            capture_output=True, text=True, timeout=5,
        )
        if out.returncode == 0:
            return _parse_token_blob(out.stdout)
    except Exception:
        return None
    return None

def _read_oauth_token() -> str | None:
    """Resolve a Claude OAuth access token: file first, then macOS Keychain."""
    cfg = load_config()
    token_dir = Path(cfg.get("claude_runtime", {}).get("oauth_token_path", "~/.claude/")).expanduser()
    creds = token_dir / ".credentials.json"
    if creds.exists():
        try:
            return _parse_token_blob(creds.read_text())
        except Exception:
            pass
    return _read_keychain_token()

def get_client() -> Anthropic:
    cfg = load_config()
    auth_mode = cfg.get("claude_runtime", {}).get("auth", "oauth")
    if auth_mode == "oauth":
        token = _read_oauth_token()
        if token:
            return Anthropic(auth_token=token)
    key = os.environ.get(cfg["llm"]["adapters"]["claude"]["apiKeyEnv"])
    if not key:
        raise EnvironmentError(
            "No Claude credentials: OAuth token unavailable and "
            f"{cfg['llm']['adapters']['claude']['apiKeyEnv']} is not set."
        )
    return Anthropic(api_key=key)

def first_text(msg) -> str:
    """Return the text of the first text content block, robust to non-text blocks."""
    for block in msg.content:
        if getattr(block, "type", None) == "text":
            return block.text
    raise ValueError("Claude response contained no text block")

def complete_text(prompt: str, model: str | None = None, max_tokens: int = 2048,
                  retries: int = 3) -> str:
    """Text-only completion with retry-on-rate-limit (handles transient 429s)."""
    import time
    from anthropic import RateLimitError, APIStatusError
    cfg = load_config()
    model = model or cfg["llm"].get("extractModel") or cfg["llm"]["adapters"]["claude"]["model"]
    client = get_client()
    last_err = None
    for attempt in range(retries):
        try:
            msg = client.messages.create(
                model=model, max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            return first_text(msg)
        except (RateLimitError, APIStatusError) as e:
            last_err = e
            status = getattr(e, "status_code", None)
            if status not in (429, 529) and not isinstance(e, RateLimitError):
                raise
            time.sleep(2 ** attempt)  # 1s, 2s, 4s backoff
    raise last_err

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
    return first_text(msg)
