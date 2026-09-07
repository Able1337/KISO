"""Import the complete April 2026 FE A/B original PDFs without text re-typesetting.

Run after extracting https://itpec.org/pastexamqa/fe/2026S_FE.zip into work/release-import/2026S_FE.
Multi-page prompts stay in reading order; answer-table headers are repeated per shuffled row.
"""
import hashlib
import json
import re
import shutil
from pathlib import Path

import pdfplumber
import pypdfium2 as pdfium
from PIL import Image, ImageChops, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PACK = 'itpec-fe-2026-spring'
OUT = ROOT / 'public/exams' / PACK
SOURCE = ROOT / 'work/release-import/2026S_FE/2026S_FE'
QA = ROOT / 'work/release-import/fe-qa'


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)
    records, subjects = [], []
    for subject, count, minutes in [('A', 60, 90), ('B', 20, 100)]:
        source = SOURCE / f'2026S_FE-{subject}_Questions.pdf'
        keyfile = SOURCE / f'2026S_FE-{subject}_Answers.pdf'
        pdf = pdfplumber.open(source)
        render = pdfium.PdfDocument(source)
        with pdfplumber.open(keyfile) as keypdf:
            key = {int(n): letter for p in keypdf.pages for n, letter in re.findall(r'\b(\d{1,2})\s+([a-i])\b', p.extract_text())}
        assert sorted(key) == list(range(1, count + 1))
        starts = [(int(w['text'][1:-1]), i, w['top'] - 4) for i, p in enumerate(pdf.pages) if i >= 3
                  for w in p.extract_words() if re.fullmatch(r'Q\d+\.', w['text']) and w['x0'] < 100]
        assert [n for n, _, _ in starts] == list(range(1, count + 1))
        images = {}

        def clip(page_index, box):
            if page_index not in images:
                images[page_index] = render[page_index].render(scale=2).to_pil().convert('RGB')
            image = images[page_index]
            p = pdf.pages[page_index]
            return image.crop(tuple(round(v * (image.width / p.width if i % 2 == 0 else image.height / p.height)) for i, v in enumerate(box)))

        def asset(page_index, box, name, header=None):
            img = clip(page_index, box)
            if header:
                h = clip(page_index, header)
                joined = Image.new('RGB', (max(img.width, h.width), img.height + h.height), 'white')
                joined.paste(h, (0, 0)); joined.paste(img, (0, h.height)); img = joined
            bbox = ImageChops.difference(img, Image.new('RGB', img.size, 'white')).getbbox()
            assert bbox, (subject, name, 'empty crop')
            img = ImageOps.expand(img.crop(bbox), border=8, fill='white')
            img.save(OUT / name, 'WEBP', lossless=True)
            return {'src': f'exams/{PACK}/{name}', 'width': img.width, 'height': img.height}

        for offset, (number, first_page, top) in enumerate(starts):
            next_start = starts[offset + 1] if offset + 1 < len(starts) else None
            last_page = (next_start[1] if next_start and next_start[1] == first_page else next_start[1] - 1) if next_start else len(pdf.pages) - 1
            bottom = next_start[2] - 10 if next_start and next_start[1] == first_page else pdf.pages[last_page].height - 55
            p = pdf.pages[last_page]
            words = [w for w in p.extract_words() if (top if last_page == first_page else 50) <= w['top'] < bottom]
            markers = [w for w in words if re.fullmatch(r'[a-i]\)', w['text'])]
            if subject == 'A' and number == 11:
                # In the original, "a )" is spaced and extracted as two words.
                a = next(w for w in words if w['text'] == 'a' and abs(w['top'] - markers[0]['top']) < 2)
                close = next(w for w in words if w['text'] == ')' and abs(w['top'] - a['top']) < 2)
                markers.insert(0, dict(a, text='a)', x1=close['x1']))
            first_a = max(i for i, m in enumerate(markers) if m['text'] == 'a)')
            markers = markers[first_a:]
            assert [m['text'][0] for m in markers] == list('abcdefghi'[:len(markers)]), (subject, number, markers)
            assert len(markers) == 4 if subject == 'A' else 4 <= len(markers) <= 9
            assert key[number] in [m['text'][0] for m in markers]
            tables = [t for t in p.find_tables() if len(t.rows) > len(markers)
                      and t.bbox[1] < markers[0]['top'] < markers[-1]['top'] < t.bbox[3]
                      and t.bbox[1] >= (top if last_page == first_page else 45)
                      and [str(row[0]).strip() for row in t.extract()[-len(markers):]] == [m['text'] for m in markers]]
            table = tables[0] if tables else None
            groups = [w for w in words if w['text'].lower() == 'answer' and w['top'] < markers[0]['top']]
            prompt_end = groups[-1]['top'] - 4 if subject == 'B' and groups else table.bbox[1] - 4 if table else markers[0]['top'] - 5
            prompts, prompt_text = [], []
            for pi in range(first_page, last_page + 1):
                y0 = top if pi == first_page else 50
                y1 = prompt_end if pi == last_page else pdf.pages[pi].height - 55
                if y1 <= y0 + 3:
                    continue
                box = (45, y0, pdf.pages[pi].width - 40, y1)
                # An answer-only continuation page needs no empty prompt fragment.
                if not pdf.pages[pi].crop(box).extract_words():
                    continue
                prompts.append(asset(pi, box, f'{subject.lower()}{number:03}-p{pi+1:02}.webp'))
                prompt_text.append(pdf.pages[pi].crop(box).extract_text() or '')
            assert prompts, (subject, number, first_page, last_page, top, prompt_end)
            options = []
            for j, m in enumerate(markers):
                header = None
                if table:
                    header_rows = len(table.rows) - len(markers)
                    row = table.rows[j + header_rows]
                    x0 = row.cells[1][0]
                    box = (x0, row.bbox[1], table.bbox[2], row.bbox[3])
                    header = (x0, table.bbox[1], table.bbox[2], table.rows[header_rows].bbox[1])
                    value = ' | '.join(str(v or '').strip() for v in table.extract()[j + header_rows][1:])
                else:
                    columns = [v['x0'] for v in markers if abs(v['top'] - m['top']) < 8 and v['x0'] > m['x0'] + 5]
                    rows = [v['top'] for v in markers if v['top'] > m['top'] + 8]
                    y1 = min(rows) - 4 if rows else bottom
                    if subject == 'B' and number == 20:
                        y1 = min(y1, 580)  # Exclude the publisher's trademark footer.
                    box = (m['x1'] + 1, m['top'] - 4, min(columns) - 6 if columns else p.width - 40, y1)
                    value = p.crop(box).extract_text() or ''
                    if subject == 'B' and groups and not columns:
                        candidate = (box[0], groups[-1]['bottom'] + 3, box[2], markers[0]['top'] - 4)
                        if candidate[3] > candidate[1] and p.crop(candidate).extract_words():
                            header = candidate
                image = asset(last_page, box, f'{subject.lower()}{number:03}-{m["text"][0]}.webp', header)
                options.append({'id': m['text'][0], 'text': value.strip(), 'image': image})
            records.append({'id': f'{PACK}-{subject.lower()}{number:03}', 'number': number, 'part': subject,
                            'domain': 'technology' if subject == 'B' or number <= 40 else 'management' if number <= 48 else 'strategy',
                            'sourcePage': first_page + 1, 'source': f'(2026S, FE, Subject-{subject}, Q{number})',
                            'promptText': '\n\n'.join(prompt_text), 'prompt': prompts[0], 'promptPages': prompts,
                            'options': options, 'answerId': key[number]})
        for f, name in [(source, f'{subject.lower()}-questions.pdf'), (keyfile, f'{subject.lower()}-answers.pdf')]:
            shutil.copyfile(f, OUT / name)
        subjects.append({'id': subject, 'durationSeconds': minutes * 60, 'questionCount': count,
                         'questionPdf': f'exams/{PACK}/{subject.lower()}-questions.pdf', 'answerPdf': f'exams/{PACK}/{subject.lower()}-answers.pdf',
                         'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'answerSha256': hashlib.sha256(keyfile.read_bytes()).hexdigest()})
        pdf.close(); render.close()
    manifest = {'schemaVersion': 1, 'id': PACK, 'system': 'ITPEC', 'level': 'FE', 'year': 2026,
                'season': 'spring', 'title': 'April 2026', 'originalLanguage': 'en', 'durationSeconds': 5400,
                'sourceUrl': 'https://itpec.org/pastexamqa/fe.html', 'archiveUrl': 'https://itpec.org/pastexamqa/fe/2026S_FE.zip',
                'parts': subjects, 'translations': [], 'lessonsReady': True, 'questions': records,
                'editorialNotes': ['Original multi-page prompts remain in reading order.', 'Answer table headers are repeated for each independently shuffled option.', 'Source A Q11 has a spaced a ) label; normalized to a).', 'A free preparation pause separates subjects; B starts only on explicit confirmation.', 'Scores are practice percentages, not official marks.']}
    (ROOT / 'data/exams' / f'{PACK}.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    # Contact sheets show every crop boundary; inspect special table/multi-page cases at full size too.
    for start in range(0, len(records), 8):
        sheet = Image.new('RGB', (1600, 1600), '#dddddd'); draw = ImageDraw.Draw(sheet)
        for k, q in enumerate(records[start:start + 8]):
            x, y = k % 4 * 400, k // 4 * 800
            draw.text((x + 8, y + 4), f"{q['part']} Q{q['number']} [{q['answerId']}]", fill='black')
            assets = q['promptPages'] + [o['image'] for o in q['options']]
            tiles = [Image.open(ROOT / 'public' / a['src']).convert('RGB') for a in assets]
            scale = min(380 / max(t.width for t in tiles), 750 / sum(t.height for t in tiles))
            yy = y + 24
            for tile in tiles:
                tile = tile.resize((max(1, round(tile.width * scale)), max(1, round(tile.height * scale))))
                sheet.paste(tile, (x + 8, yy)); yy += tile.height
        sheet.save(QA / f'contact-{start//8+1:02}.png')
    print(f'Imported {len(records)} questions: A=60, B=20; {sum(len(q["promptPages"]) for q in records)} prompt fragments; {sum(len(q["options"]) for q in records)} options.')


if __name__ == '__main__':
    main()
