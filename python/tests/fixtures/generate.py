"""Run once to generate fixture PDFs. Resulting files are committed."""
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import pikepdf
from pathlib import Path

OUT = Path(__file__).parent

def make_flattened():
    c = canvas.Canvas(str(OUT / "flattened.pdf"), pagesize=letter)
    c.drawString(100, 700, "Name: ____________________")
    c.drawString(100, 670, "Date: ____________________")
    c.rect(100, 640, 12, 12)
    c.drawString(120, 640, "I agree")
    c.save()

def make_fillable():
    c = canvas.Canvas(str(OUT / "fillable_acroform.pdf"), pagesize=letter)
    c.drawString(100, 700, "Name:")
    c.acroForm.textfield(name="name", x=150, y=695, width=200, height=20, fieldFlags="")
    c.drawString(100, 670, "I agree")
    c.acroForm.checkbox(name="agree", x=160, y=668, size=14)
    c.save()

def make_locked():
    make_flattened()
    flat = OUT / "flattened.pdf"
    locked = OUT / "locked.pdf"
    with pikepdf.open(flat) as pdf:
        pdf.save(
            locked,
            encryption=pikepdf.Encryption(
                owner="owner123", user="user123",
                allow=pikepdf.Permissions(modify_other=False, modify_form=False),
            ),
        )

if __name__ == "__main__":
    make_flattened()
    make_fillable()
    make_locked()
    print("Fixtures generated.")
