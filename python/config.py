import json
from pathlib import Path

CONFIG_PATH = Path(__file__).parent.parent / "config" / "agent.config.json"

def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return json.load(f)

def save_config(cfg: dict) -> None:
    with open(CONFIG_PATH, "w") as f:
        json.dump(cfg, f, indent=2)
