from engines.pdf_engine import detect_editability

def test_fillable_acroform(fillable_pdf):
    assert detect_editability(fillable_pdf) == "fillable"

def test_locked_pdf(locked_pdf):
    assert detect_editability(locked_pdf) == "locked"

def test_flattened_pdf(flattened_pdf):
    assert detect_editability(flattened_pdf) == "flattened"
