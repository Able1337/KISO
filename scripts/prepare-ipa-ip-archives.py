"""Render official scanned IP archives for diagnostic OCR; originals stay unchanged."""
from pathlib import Path
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[1]
for year in (2024, 2025):
    directory = ROOT / f'work/release-import/ipa-ip-{year}'
    document = pdfium.PdfDocument(directory / 'qs.pdf')
    for index in range(1, len(document)):
        target = directory / f'ip-{index+1:02}.png'
        if not target.exists():
            document[index].render(scale=2.5).to_pil().save(target)
    print(year, len(document), flush=True)
