"""Read-only asset/key checks and representative contact sheets; outputs stay in work/."""
import json,re
from pathlib import Path
import pdfplumber
from PIL import Image,ImageDraw,ImageOps
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'work/archive-qa';OUT.mkdir(parents=True,exist_ok=True)
report=[]
for path in sorted((ROOT/'data/exams').glob('itpec-*-202[45]-*.json')):
    p=json.loads(path.read_text(encoding='utf8'));seen=0
    for part in p.get('parts',[{'id':None,'answerPdf':f'exams/{p["id"]}/answers.pdf'}]):
        with pdfplumber.open(ROOT/'public'/part['answerPdf']) as pdf:
            keys={int(n):c for page in pdf.pages for n,c in re.findall(r'\b(\d{1,3})\s+([a-j])\b',page.extract_text() or '')}
        qs=[q for q in p['questions'] if q.get('part')==part['id']]
        assert len(keys)==len(qs)
        for q in qs:
            assert keys[q['number']]==q['answerId'],q['id']
            for asset in q['promptPages']+[o['image'] for o in q['options']]:
                with Image.open(ROOT/'public'/asset['src']) as im:
                    assert im.size==(asset['width'],asset['height']),asset['src']
                    im.verify();seen+=1
    # First/last of each section plus tables, diagrams and multi-page cases.
    indices=([0,4,15,19,40,59,60,65,69,73,78,79] if p['level']=='FE' else [0,9,19,29,39,49,59,69,79,89,98,99])
    sheet=Image.new('RGB',(1200,1800),'#dce3e5');draw=ImageDraw.Draw(sheet)
    for cell,index in enumerate(indices):
        q=p['questions'][index];x=(cell%3)*400;y=(cell//3)*450
        draw.text((x+8,y+5),f'{p["id"]} {q.get("part","")}{q["number"]} key={q["answerId"]}',fill='black')
        assets=q['promptPages']+[o['image'] for o in q['options']]
        panels=[]
        for a in assets:
            im=Image.open(ROOT/'public'/a['src']).convert('RGB');im.thumbnail((380,190));panels.append(im)
        combined=Image.new('RGB',(380,sum(im.height+5 for im in panels)),'white');yy=0
        for im in panels:combined.paste(im,(0,yy));yy+=im.height+5
        combined.thumbnail((380,410));sheet.paste(combined,(x+8,y+28))
    sheet.save(OUT/f'{p["id"]}.png')
    report.append({'pack':p['id'],'questions':len(p['questions']),'verifiedImages':seen,'officialKeysMatch':True})
(OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps(report,indent=2))
