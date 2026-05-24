from pathlib import Path
import pytest

FIX = Path(__file__).parent / "fixtures"

@pytest.fixture
def fillable_pdf() -> Path:
    return FIX / "fillable_acroform.pdf"

@pytest.fixture
def locked_pdf() -> Path:
    return FIX / "locked.pdf"

@pytest.fixture
def flattened_pdf() -> Path:
    return FIX / "flattened.pdf"
