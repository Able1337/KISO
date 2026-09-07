"""Produce per-question visual inspection sheets and compact OCR diagnostics."""
import json,re,unicodedata
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
for year in (2024,2025):
    directory=ROOT/f'work/release-import/ipa-ip-{year}'
    output=directory/'review';output.mkdir(exist_ok=True)
    starts=[];pages={}
    for file in sorted(directory.glob('ip-*.json')):
        page=int(file.stem[3:]);data=json.loads(file.read_text(encoding='utf8'));pages[page]=data
        for block in data['blocks'] or []:
            for para in block['paragraphs']:
                for line in para['lines']:
                    t=unicodedata.normalize('NFKC',line['text']).replace(' ','')
                    if re.match(r'[問間]\d+',t) and not re.match(r'[問間]\d+から[問間]\d+',t) and line['bbox']['x0']<175:
                        starts.append((page,line['bbox']['y0']-10))
    assert len(starts)==100,(year,len(starts))
    texts=[]
    for i,(page,top) in enumerate(starts):
        image=Image.open(directory/f'ip-{page:02}.png')
        bottom=starts[i+1][1]-20 if i<99 and starts[i+1][0]==page else image.height-120
        crop=image.crop((120,top,image.width-100,bottom))
        crop.save(output/f'q{i+1:03}.png')
        lines=[l['text'].strip() for b in pages[page]['blocks'] or [] for p in b['paragraphs'] for l in p['lines'] if top<=l['bbox']['y0']<bottom]
        texts.append(dict(number=i+1,page=page,top=top/2.5,bottom=bottom/2.5,text='\n'.join(lines)))
    (output/'questions.json').write_text(json.dumps(texts,ensure_ascii=False,indent=2),encoding='utf8')
    for first in range(1,101,5):
        thumbs=[]
        for n in range(first,min(first+5,101)):
            im=Image.open(output/f'q{n:03}.png');im.thumbnail((720,1000))
            tile=Image.new('RGB',(740,1040),'white');tile.paste(im,(10,35));ImageDraw.Draw(tile).text((10,8),f'{year} Q{n} page {texts[n-1]["page"]} top {texts[n-1]["top"]}',fill='black');thumbs.append(tile)
        sheet=Image.new('RGB',(740*len(thumbs),1040),'#ddd')
        for j,im in enumerate(thumbs):sheet.paste(im,(j*740,0))
        sheet.save(output/f'sheet-{first:03}.png')
    print(year,len(texts))
