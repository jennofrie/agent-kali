from unittest.mock import patch
import json
from schema_extractor import extract_vision_schema

MOCK_RESPONSE = json.dumps({
    "fields": [
        {"id": "v1", "type": "checkbox", "label": "I agree", "instructions": "Tick if you agree",
         "checkStyle": "tick", "required": True,
         "location": {"page": 1, "x": 100, "y": 200, "w": 14, "h": 14}}
    ]
})

def test_vision_schema_parses_llm_json(flattened_pdf):
    with patch("schema_extractor._call_claude_vision", return_value=MOCK_RESPONSE):
        fields = extract_vision_schema(flattened_pdf)
        assert fields[0]["type"] == "checkbox"
        assert fields[0]["checkStyle"] == "tick"

def test_vision_schema_strips_code_fences(flattened_pdf):
    fenced = "```json\n" + MOCK_RESPONSE + "\n```"
    with patch("schema_extractor._call_claude_vision", return_value=fenced):
        fields = extract_vision_schema(flattened_pdf)
        assert fields[0]["label"] == "I agree"
