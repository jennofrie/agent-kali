from schema_extractor import extract_native_schema

def test_native_extracts_acroform_text_and_checkbox(fillable_pdf):
    fields = extract_native_schema(fillable_pdf)
    types = {f["label"]: f["type"] for f in fields}
    assert types.get("name") == "text"
    assert types.get("agree") == "checkbox"

def test_native_returns_empty_for_flattened(flattened_pdf):
    fields = extract_native_schema(flattened_pdf)
    assert fields == []
