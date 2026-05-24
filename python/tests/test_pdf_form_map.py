from engines.pdf_engine import build_form_map

def test_form_map_includes_editability(flattened_pdf):
    fm = build_form_map(flattened_pdf)
    assert fm["editability"] == "flattened"
    assert fm["path"] == "replicate"
    assert "pages" in fm
    assert len(fm["pages"]) >= 1

def test_form_map_for_fillable(fillable_pdf):
    fm = build_form_map(fillable_pdf)
    assert fm["editability"] == "fillable"
    assert fm["path"] == "direct"
    assert any(page["text_elements"] for page in fm["pages"])
