import json
from llm.claude_adapter import complete_text

PROMPT_TEMPLATE = """You are filling out a form. Extract values for the following form fields
from the given source text and user instructions.

Return STRICT JSON: an object whose keys are the field "id" values given below, and whose
values are objects with "value" (string for text, boolean true/false for checkbox, the
selected option string for radio/choice) and "confidence" (0.0 to 1.0).

CRITICAL — User instructions override everything:
- The source text contains "USER INSTRUCTIONS" sections. These have HIGHEST PRIORITY.
- If the user says "do not fill out page 2" or "leave section X blank", then set the value
  to "" (empty string) with confidence 1.0 for ALL fields on that page/section.
- If the user says "skip field Y", set that field to "" with confidence 1.0.
- If the user says "tick X" or "check Y" or "cross Z", follow those checkbox instructions exactly.
- If the user says "for field X use value Y", use that exact value with confidence 1.0.
- User instructions ALWAYS override auto-extracted values.

Rules for auto-extraction (when no user instruction applies):
- Use ONLY information present in the source text. Do not invent values.
- If a field cannot be determined from the source, set value to "" and confidence below 0.3.
- For checkbox/radio, only set confidence >= 0.7 when the source clearly implies the choice.
- Each field has a "location" with a "page" number. Use this to respect page-level instructions.

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
