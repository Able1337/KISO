"""Import official sample and annual FE collections using the existing crop pipeline."""
import importlib.util
import json
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('ipa_import',ROOT/'scripts/import-ipa-2026.py')
ipa=importlib.util.module_from_spec(spec)
spec.loader.exec_module(ipa)

for year in map(int,sys.argv[1:] or [2022,2023,2024,2025]):
    sample=year==2022
    pack=f'ipa-fe-{year}-'+('sample' if sample else 'public')
    questions=[];parts=[]
    for part,count in [('A',60 if sample else 20),('B',20 if sample else 6)]:
        rows,meta=ipa.import_subject('FE',part,count,year,sample)
        questions+=rows;parts.append(meta)
    manifest=dict(schemaVersion=1,id=pack,system='IPA',level='FE',year=year,
        season='sample' if sample else 'public',originalLanguage='ja',
        title=f'{year} '+('サンプル問題セット' if sample else '公開問題'),
        durationSeconds=sum(p['durationSeconds'] for p in parts),
        sourceUrl='https://www.ipa.go.jp/shiken/syllabus/henkou/2022/20220425.html' if sample else f'https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/{year}r0{year-2018}.html',
        publishedSubset=not sample,demonstration=sample,publicationDate='2022-12-26' if sample else None,
        timingBasis='official-format' if sample else 'proportional-practice',
        translations=[],lessonsReady=True,parts=parts,questions=questions)
    (ROOT/'data/exams'/f'{pack}.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(pack,len(questions),manifest['durationSeconds'],flush=True)
