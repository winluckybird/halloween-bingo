"""Run after browser.mjs using Python with pdfplumber and pypdf."""
import json
import re
from pathlib import Path
import pdfplumber
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
out = root / "test-output"
normalize = lambda s: re.sub(r"\s+", "", s.replace("’", "'").replace("“", '"').replace("”", '"'))
report = []
for grid in [3, 4, 5]:
    path = out / f"custom-{grid}.pdf"
    preview = json.loads((out / f"preview-text-{grid}.json").read_text(encoding="utf-8"))
    reader = PdfReader(path)
    assert len(reader.pages) == len(preview)
    for i, page in enumerate(reader.pages):
        assert normalize(page.extract_text()) == normalize(preview[i]), f"Preview mismatch: grid {grid}, page {i + 1}"
    with pdfplumber.open(path) as pdf:
        for i, page in enumerate(pdf.pages):
            for word in page.extract_words():
                assert word["x0"] >= 18 and word["x1"] <= page.width - 18, (path, i, word)
                assert word["top"] >= 18 and word["bottom"] <= page.height - 18, (path, i, word)
            for image in page.images:
                assert image["x0"] >= 30 and image["x1"] <= page.width - 30
                assert image["top"] >= 30 and image["bottom"] <= page.height - 30
    report.append(f"Grid {grid}: {len(reader.pages)} pages; all exported text matches preview; text and artwork stay inside margins.")
batch = json.loads((root / "dist/downloads/default-batch.json").read_text(encoding="utf-8"))
default = PdfReader(root / "dist/downloads/halloween-bingo-30-cards.pdf")
assert len(default.pages) == 34
for i, card in enumerate(batch["cards"]):
    text = normalize(default.pages[i].extract_text()).lower()
    for item in card:
        assert item.replace("-", "") in text, (i, item)
report.append("Default PDF: all 30 card layouts match the committed default-batch.json; 34 pages total.")
(out / "pdf-verification.txt").write_text("\n".join(report), encoding="utf-8")
print("\n".join(report))
