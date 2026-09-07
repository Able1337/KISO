"""Import 100 officially published IP questions for each archive year.

Diagnostic OCR supplies geometry only. Review crops before publishing; lessons
are independently authored and their ready flag is intentionally false on import.
"""
import importlib.util
import json
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('ipa_import', ROOT/'scripts/import-ipa-2026.py')
ipa=importlib.util.module_from_spec(spec)
spec.loader.exec_module(ipa)
for year in map(int, sys.argv[1:] or [2024,2025]):
    questions, meta=ipa.import_subject('IP', None, 100, year)
    for q in questions:
        q['domain']='strategy' if q['number']<=35 else 'management' if q['number']<=55 else 'technology'
    pack=f'ipa-ip-{year}-public'
    manifest=dict(schemaVersion=1,id=pack,system='IPA',level='IP',year=year,
        season='public',originalLanguage='ja',title=f'{year} 公開問題',
        durationSeconds=7200,sourceUrl='https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/questions.html',
        publishedSubset=True,translations=[],lessonsReady=False,referencePage=46 if year==2024 else 48,questions=questions,
        sourceSha256=meta['sourceSha256'],answerSha256=meta['answerSha256'],
        editorialNotes=['100 officially published CBT questions, not the entire CBT bank.',
            'Diagnostic OCR is used only for crop geometry; Japanese scans remain the question artwork.',
            'Original answer labels map to stable IDs; shuffled options retain their official key.'])
    (ROOT/'data/exams'/f'{pack}.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(pack,len(questions),flush=True)
