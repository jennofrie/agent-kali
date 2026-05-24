from unittest.mock import patch
from llm.field_values import extract_field_values

SCHEMA = {"fields": [
    {"id": "f1", "type": "text",     "label": "Full Name"},
    {"id": "f2", "type": "checkbox", "label": "Has NDIS Plan", "instructions": "Tick if yes"},
]}
RAG_OUTPUT = "Client John Smith, has an active NDIS plan number 4300000123."

MOCK_LLM = '{"f1": {"value": "John Smith", "confidence": 0.95}, "f2": {"value": true, "confidence": 0.9}}'

def test_extract_field_values_parses_llm():
    with patch("llm.field_values._call_claude", return_value=MOCK_LLM):
        result = extract_field_values(SCHEMA, RAG_OUTPUT)
        assert result["f1"]["value"] == "John Smith"
        assert result["f2"]["value"] is True
        assert result["f1"]["confidence"] == 0.95

def test_extract_field_values_strips_fences():
    fenced = "```json\n" + MOCK_LLM + "\n```"
    with patch("llm.field_values._call_claude", return_value=fenced):
        result = extract_field_values(SCHEMA, RAG_OUTPUT)
        assert result["f2"]["confidence"] == 0.9
