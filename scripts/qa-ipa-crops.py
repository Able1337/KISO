"""Generate local visual review sheets, not production assets."""
import json
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'work/release-import/ipa-2026/qa';out.mkdir(exist_ok=True)
for level in ['ip','fe']:
    bank=json.loads((ROOT/f'data/exams/ipa-{level}-2026-public.json').read_text(encoding='utf8'))
    for offset in range(0,len(bank['questions']),4):
        cards=[]
        for q in bank['questions'][offset:offset+4]:
            pieces=[]
            for item in q['promptPages']+[o['image'] for o in q['options']]:
                im=Image.open(ROOT/'public'/item['src']).convert('RGB')
                im.thumbnail((650,1100));pieces.append(im)
            card=Image.new('RGB',(680,50+sum(im.height+15 for im in pieces)),'#eeeeee')
            d=ImageDraw.Draw(card);d.text((10,10),f"{level.upper()} {q.get('part','')}{q['number']} / key {q['answerId']}",fill='black')
            y=45
            for im in pieces:card.paste(im,(15,y));y+=im.height+15
            cards.append(card)
        sheet=Image.new('RGB',(1360,max(c.height for c in cards[:2])+max([c.height for c in cards[2:]] or [0])),'white')
        y2=max(c.height for c in cards[:2])
        for i,c in enumerate(cards):sheet.paste(c,((i%2)*680,0 if i<2 else y2))
        sheet.save(out/f'{level}-{offset+1:03}.png')
