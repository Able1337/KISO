"""Contact sheets of shipped crops (not diagnostic OCR), retained under work/."""
import json
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
for year in (2024,2025):
    pack=json.loads((ROOT/f'data/exams/ipa-ip-{year}-public.json').read_text(encoding='utf8'))
    out=ROOT/f'work/release-import/ipa-ip-{year}/final-review'
    out.mkdir(exist_ok=True)
    for first in range(0,100,5):
        tiles=[]
        for q in pack['questions'][first:first+5]:
            tile=Image.new('RGB',(640,1500),'white');draw=ImageDraw.Draw(tile)
            draw.text((8,8),f'{year} Q{q["number"]} key={q["answerId"]}',fill='black');y=32
            for label,asset in [('prompt',a) for a in q['promptPages']]+[(o['id'],o['image']) for o in q['options']]:
                im=Image.open(ROOT/'public'/asset['src']).convert('RGB');im.thumbnail((610,850))
                draw.text((8,y),label,fill='blue');y+=16;tile.paste(im,(15,y));y+=im.height+10
            assert y<1500,(year,q['number'],y)
            tiles.append(tile)
        sheet=Image.new('RGB',(3200,1500),'#ddd')
        for i,tile in enumerate(tiles):sheet.paste(tile,(i*640,0))
        sheet.save(out/f'sheet-{first+1:03}.png')
    print(year,'20 final asset sheets')
