"""Import the official 2026S IP PDF, retaining lossless layout in question/option crops.

Run with the bundled Python (pdfplumber, pypdfium2, Pillow).
The input archive is obtained from https://itpec.org/pastexamqa/ip/2026S_IP.zip.
Source PDFs are never modified. Generated public assets and manifest are reproducible.
"""
import hashlib
import json
import re
from pathlib import Path

import pdfplumber
import pypdfium2 as pdfium
from PIL import Image, ImageChops, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'work/release-import/2026S_IP/2026S_IP'
OUT = ROOT / 'public/exams/itpec-ip-2026-spring'
DATA = ROOT / 'data/exams'
PACK = 'itpec-ip-2026-spring'


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)
    question_file = SOURCE / '2026S_IP_Questions.pdf'
    answer_file = SOURCE / '2026S_IP_Answers.pdf'
    pdf = pdfplumber.open(question_file)
    renderer = pdfium.PdfDocument(question_file)
    key = {}
    with pdfplumber.open(answer_file) as answers:
        for page in answers.pages:
            for number, letter in re.findall(r'\b(\d{1,3})\s+([a-d])\b', page.extract_text()):
                assert int(number) not in key, f'Duplicate answer: {number}'
                key[int(number)] = letter
    assert sorted(key) == list(range(1, 101)), 'The key must cover all 100 questions'

    starts = []
    for page_index, page in enumerate(pdf.pages):
        if page_index < 2:
            continue  # Cover page contains an unrelated sample Q1.
        for word in page.extract_words():
            match = re.fullmatch(r'Q(\d+)\.', word['text'])
            if match and word['x0'] < 90:
                starts.append((int(match[1]), page_index, word['top'] - 3))
    assert [s[0] for s in starts] == list(range(1, 101)), 'Question sequence is incomplete'

    images = {}
    def crop(page_index, box, name, header=None):
        page = pdf.pages[page_index]
        if page_index not in images:
            images[page_index] = renderer[page_index].render(scale=2).to_pil()
        image = images[page_index]
        sx, sy = image.width / page.width, image.height / page.height
        rect = tuple(round(value * (sx if i % 2 == 0 else sy)) for i, value in enumerate(box))
        clipped = image.crop(rect).convert('RGB')
        if header:
            head_rect = tuple(round(value * (sx if i % 2 == 0 else sy)) for i, value in enumerate(header))
            head_image = image.crop(head_rect).convert('RGB')
            merged = Image.new('RGB', (clipped.width, head_image.height + clipped.height), 'white')
            merged.paste(head_image, (0,0))
            merged.paste(clipped, (0,head_image.height))
            clipped = merged
        ink = ImageChops.difference(clipped, Image.new('RGB', clipped.size, 'white')).getbbox()
        if ink:
            clipped = ImageOps.expand(clipped.crop(ink), border=8, fill='white')
        clipped.save(OUT / name, 'WEBP', lossless=True)
        return {'src': f'exams/{PACK}/{name}', 'width': clipped.width, 'height': clipped.height}

    records = []
    diagnostics = []
    for i, (number, page_index, top) in enumerate(starts):
        page = pdf.pages[page_index]
        next_start = starts[i + 1] if i + 1 < len(starts) else None
        if next_start and next_start[1] == page_index:
            bottom = next_start[2] - 10
        else:
            bottom = page.height - 47
        # The current paper has no cross-page questions; fail closed if it changes.
        if next_start:
            assert next_start[1] <= page_index + 1, f'Question {number} spans pages'
        words = [w for w in page.extract_words() if top <= w['top'] < bottom]
        markers = [w for w in words if w['text'] in ('a)', 'b)', 'c)', 'd)', 'e)')]
        # Two label misprints are present in the official PDF; preserve option content,
        # normalize option identities by position, and document the corrections below.
        if number in (64, 71):
            assert len(markers) == 4
            markers = [dict(m, text=f'{letter})') for m, letter in zip(markers, 'abcd')]
        if number == 94:
            markers = [dict(text=f'{letter})', top=y, x0=x, x1=x+10) for letter,x,y in [('a',94,109),('b',315,109),('c',94,268),('d',315,268)]]
        assert [w['text'] for w in markers] == ['a)', 'b)', 'c)', 'd)'], (number, markers)
        table_headers = {8: (435.2, 452.8), 12: (497, 515.7), 36: (191.2, 215.7)}
        option_top = 100 if number == 94 else table_headers[number][0] if number in table_headers else min(w['top'] for w in markers) - 6
        prompt = crop(page_index, (45, top, page.width - 40, option_top), f'q{number:03}-prompt.webp')
        options = []
        for marker in markers:
            same_row = [m for m in markers if abs(m['top'] - marker['top']) < 8]
            next_columns = [m['x0'] for m in same_row if m['x0'] > marker['x0'] + 5]
            next_rows = [m['top'] for m in markers if m['top'] > marker['top'] + 8]
            x0 = marker['x1'] + 1
            x1 = min(next_columns) - 6 if next_columns else page.width - 40
            y0 = marker['top'] - 4
            y1 = min(next_rows) - 4 if next_rows else bottom
            if number == 94:
                x0,y0,x1,y1 = {'a': (104,130,298,253), 'b': (330,129,519,253), 'c': (123,280,191,403), 'd': (330,276,452,403)}[marker['text'][0]]
            header = (x0, table_headers[number][0], x1, table_headers[number][1]) if number in table_headers else None
            image = crop(page_index, (x0, y0, x1, y1), f'q{number:03}-{marker["text"][0]}.webp', header=header)
            text = page.crop((x0, y0, x1, y1)).extract_text() or ''
            options.append({'id': marker['text'][0], 'text': text.strip(), 'image': image})
        full_text = page.crop((45, top, page.width - 40, option_top)).extract_text() or ''
        record = {
            'id': f'{PACK}-q{number:03}', 'number': number,
            'domain': 'technology' if number <= 45 else 'management' if number <= 65 else 'strategy',
            'sourcePage': page_index + 1, 'source': f'(2026S, IP, Q{number})',
            'promptText': full_text.strip(), 'prompt': prompt, 'options': options, 'answerId': key[number],
        }
        records.append(record)
        diagnostics.append({'number': number, 'page': page_index+1, 'rows': len({round(m['top']/8) for m in markers}), 'optionText': [o['text'] for o in options]})
    manifest = {
        'schemaVersion': 1, 'id': PACK, 'system': 'ITPEC', 'level': 'IP', 'year': 2026,
        'season': 'spring', 'originalLanguage': 'en', 'title': 'April 2026', 'durationSeconds': 7200,
        'sourceUrl': 'https://itpec.org/pastexamqa/ip.html',
        'archiveUrl': 'https://itpec.org/pastexamqa/ip/2026S_IP.zip',
        'sourceSha256': hashlib.sha256(question_file.read_bytes()).hexdigest(),
        'answerSha256': hashlib.sha256(answer_file.read_bytes()).hexdigest(),
        'translations': [], 'lessonsReady': False, 'questions': records,
        'editorialNotes': ['Source Q64 labels the fourth option e); normalized to d).', 'Source Q71 labels the second option d); normalized to b).', 'Answer IDs follow option positions and the official key; displayed option order is shuffled.', 'Domains assigned by syllabus topic: Technology 1–45, Management 46–65, Strategy 66–100.'],
    }
    (DATA / f'{PACK}.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (ROOT/'work/release-import/diagnostics.json').write_text(json.dumps(diagnostics, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Imported {len(records)} questions; matched {len(key)} official answers; {len(images)} source pages.')


if __name__ == '__main__':
    main()
