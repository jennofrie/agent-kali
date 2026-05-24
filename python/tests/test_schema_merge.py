from schema_extractor import merge_schemas


def test_native_takes_precedence_for_matching_locations():
    native = [{"id": "n1", "type": "checkbox", "label": "agree",
               "location": {"page": 1, "x": 100, "y": 200, "w": 14, "h": 14}}]
    vision = [{"id": "v1", "type": "checkbox", "label": "I agree", "instructions": "Tick if agreed",
               "checkStyle": "tick",
               "location": {"page": 1, "x": 102, "y": 198, "w": 14, "h": 14}}]
    merged = merge_schemas(native, vision)
    field = next(f for f in merged if f["id"] == "n1")
    assert field["instructions"] == "Tick if agreed"
    assert field["checkStyle"] == "tick"
    # native field count preserved, vision duplicate not appended
    assert len(merged) == 1


def test_vision_only_fields_appended():
    native = []
    vision = [{"id": "v1", "type": "signature", "label": "Sign here",
               "location": {"page": 1, "x": 50, "y": 50, "w": 200, "h": 40}}]
    merged = merge_schemas(native, vision)
    assert len(merged) == 1
    assert merged[0]["type"] == "signature"


def test_non_overlapping_native_and_vision_both_kept():
    native = [{"id": "n1", "type": "text", "label": "name",
               "location": {"page": 1, "x": 10, "y": 10, "w": 100, "h": 20}}]
    vision = [{"id": "v1", "type": "checkbox", "label": "agree",
               "location": {"page": 1, "x": 300, "y": 400, "w": 14, "h": 14}}]
    merged = merge_schemas(native, vision)
    assert len(merged) == 2
