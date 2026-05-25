import json
from llm.claude_adapter import complete_text

PROMPT_TEMPLATE = """Extract values for the following form fields from the given source text.
Return STRICT JSON: an object whose keys are the field "id" values given below, and whose
values are objects with "value" (string for text, boolean true/false for checkbox, the
selected option string for radio/choice) and "confidence" (0.0 to 1.0).

Rules:
- Use ONLY information present in the source text. Do not invent values.
- If a field cannot be determined from the source, set "confidence" below 0.7.
- For checkbox/radio, only set confidence >= 0.7 when the source clearly implies the choice.

Fields:
{schema}

Source text:
{source}

JSON only. No prose."""


def _call_claude(prompt: str) -> str:
    # Uses the configured extraction model (lighter/faster) with retry-on-rate-limit.
    return complete_text(prompt, max_tokens=4096)


def extract_field_values(schema: dict, source_text: str) -> dict:
    prompt = PROMPT_TEMPLATE.format(schema=json.dumps(schema), source=source_text)
    raw = _call_claude(prompt)
    raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)
