import json
from llm.claude_adapter import get_client, first_text
from config import load_config

PROMPT_TEMPLATE = """Extract values for the following form fields from the given source text.
Return STRICT JSON: an object whose keys are field IDs, and whose values are objects with
"value" (string for text, boolean for checkbox, string for radio's selected option) and
"confidence" (0.0 to 1.0).

If a checkbox/radio answer cannot be determined from the source, set "confidence" below 0.7.

Fields:
{schema}

Source text:
{source}

JSON only. No prose."""


def _call_claude(prompt: str) -> str:
    cfg = load_config()
    model = cfg["llm"]["adapters"]["claude"]["model"]
    client = get_client()
    msg = client.messages.create(
        model=model, max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    return first_text(msg)


def extract_field_values(schema: dict, source_text: str) -> dict:
    prompt = PROMPT_TEMPLATE.format(schema=json.dumps(schema), source=source_text)
    raw = _call_claude(prompt)
    raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)
