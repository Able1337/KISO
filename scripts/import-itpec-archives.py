"""Import 2024/2025 ITPEC originals, reusing the image-bank/session schema.

Inputs: official ZIPs extracted under work/release-import/YYYY{S,A}_{IP,FE}.
Never infer an answer: manifests are produced only with complete official keys.
Lesson readiness remains false until the independently reviewed bank is complete.
"""
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path
import pdfplumber
import pypdfium2 as pdfium
from PIL import Image, ImageChops, ImageOps

ROOT=Path(__file__).resolve().parents[1]
LETTERS='abcdefghij'

def body_bottom(page, words):
    """Exclude centered printed page numbers, whose height varies by paper."""
    limit=page.height-55
    for w in words:
        if w['top']<page.height*.82:continue
        line=sorted([x for x in words if abs(x['top']-w['top'])<2],key=lambda x:x['x0'])
        if re.fullmatch(r'[-–—]\s*\d+\s*[-–—]', ' '.join(x['text'] for x in line)):
            center=(line[0]['x0']+line[-1]['x1'])/2
            if abs(center-page.width/2)<page.width*.12:limit=min(limit,w['top']-4)
    return limit

def import_pack(code,level):
    year=int(code[:4]);season='spring' if code[-1]=='S' else 'autumn'
    pack=f'itpec-{level.lower()}-{year}-{season}'
    directory=ROOT/'work/release-import'/f'{code}_{level}'
    out=ROOT/'public/exams'/pack;out.mkdir(parents=True,exist_ok=True)
    records=[];parts=[];diagnostics=[]
    for part,count,minutes in ([('A',60,90),('B',20,100)] if level=='FE' else [(None,100,120)]):
        stem=f'{code}_{level}'+(f'-{part}' if part else '')
        source=next(directory.rglob(stem+'_Questions.pdf'))
        answer=next(directory.rglob(stem+'_Answer*.pdf'))
        with pdfplumber.open(answer) as keypdf:
            pairs=[(int(n),c) for p in keypdf.pages for n,c in re.findall(r'\b(\d{1,3})\s+([a-j])\b',p.extract_text() or '')]
        key=dict(pairs)
        assert len(key)==len(pairs) and sorted(key)==list(range(1,count+1)),(pack,part,'keys',pairs)
        pdf=pdfplumber.open(source);renderer=pdfium.PdfDocument(source)
        words=[p.extract_words() for p in pdf.pages]
        bottoms=[body_bottom(p,ws) for p,ws in zip(pdf.pages,words)]
        starts=[(int(re.match(r'Q(\d+)\.',w['text'])[1]),pi,w['top']-4) for pi,ws in enumerate(words) if pi>=2 for w in ws if re.match(r'Q\d+\.',w['text']) and w['x0']<100]
        assert [n for n,_,_ in starts]==list(range(1,count+1)),(pack,part,'starts',starts)
        images={}
        def clip(pi,box):
            p=pdf.pages[pi]
            if pi not in images:images[pi]=renderer[pi].render(scale=2).to_pil().convert('RGB')
            im=images[pi]
            return im.crop(tuple(round(v*(im.width/p.width if i%2==0 else im.height/p.height)) for i,v in enumerate(box)))
        def asset(pi,box,name,header=None):
            im=clip(pi,box)
            if header:
                h=clip(pi,header);offset=round((header[0]-box[0])*images[pi].width/pdf.pages[pi].width)
                merged=Image.new('RGB',(im.width,h.height+im.height),'white');merged.paste(h,(offset,0));merged.paste(im,(0,h.height));im=merged
            bbox=ImageChops.difference(im,Image.new('RGB',im.size,'white')).getbbox()
            assert bbox,(pack,part,name,'empty')
            im=ImageOps.expand(im.crop(bbox),border=8,fill='white');im.save(out/name,'WEBP',lossless=True)
            return dict(src=f'exams/{pack}/{name}',width=im.width,height=im.height)
        for ix,(number,first,top) in enumerate(starts):
            end=starts[ix+1] if ix+1<len(starts) else (0,len(pdf.pages),0)
            last=end[1] if end[1]==first else end[1]-1
            bounds={pi:(top if pi==first else 40,min(end[2]-7,bottoms[pi]) if pi==end[1] else bottoms[pi]) for pi in range(first,last+1)}
            markers=[]
            for pi,(y0,y1) in bounds.items():
                ws=[w for w in words[pi] if y0<=w['top']<y1]
                for wi,w in enumerate(ws):
                    if re.fullmatch(r'[a-j]\)',w['text']):markers.append(dict(w,page=pi))
                    elif code=='2025A' and level=='FE' and part=='A' and number==9 and w['text']=='c' and abs(w['top']-684.1)<2:
                        # Source prints c without its closing parenthesis.
                        markers.append(dict(w,text='c)',page=pi))
                    elif w['text'] in LETTERS and wi+1<len(ws) and ws[wi+1]['text']==')' and abs(ws[wi+1]['top']-w['top'])<3:
                        markers.append(dict(w,text=w['text']+')',x1=ws[wi+1]['x1'],page=pi))
            candidates=[]
            if code=='2024S' and level=='FE' and part=='B' and number==6:
                # i) here is the end of a function argument, not a choice label.
                markers=[m for m in markers if not (m['text']=='i)' and m['x0']>200)]
            for mi,m in enumerate(markers):
                if m['text']!='a)':continue
                group=[m]
                for following in markers[mi+1:]:
                    if following['text']!=LETTERS[len(group)]+')':break
                    group.append(following)
                    if len(group)==10:break
                if (len(group)==4 if part!='B' else 4<=len(group)<=10):candidates.append(group)
            assert len(candidates)==1,(pack,part,number,'markers',[(m['text'],m['page']+1,round(m['x0'],1),round(m['top'],1)) for m in markers])
            markers=candidates[0];op=markers[0]['page'];p=pdf.pages[op]
            assert all(m['page']==op for m in markers),(pack,part,number,'cross-page options')
            assert key[number] in [m['text'][0] for m in markers]
            table=None
            for t in p.find_tables():
                hr=len(t.rows)-len(markers)
                if hr>=1 and t.bbox[1]>=bounds[op][0] and all(t.rows[hr+j].bbox[1]<=m['top']<t.rows[hr+j].bbox[3] for j,m in enumerate(markers)):
                    table=t;break
            answer_groups=[w for w in words[op] if w['text'].lower()=='answer' and bounds[op][0]<=w['top']<markers[0]['top']]
            prompt_end=table.bbox[1]-3 if table else markers[0]['top']-5
            # Keep headings that may explain choices; row crops repeat table headers.
            prompts=[];texts=[];prefix=part.lower() if part else 'q'
            for pi in range(first,op+1):
                y0=bounds[pi][0];y1=prompt_end if pi==op else bounds[pi][1]
                if y1<=y0:continue
                box=(40,y0,pdf.pages[pi].width-35,y1)
                text=pdf.pages[pi].crop(box).extract_text() or ''
                if not text.strip():continue
                prompts.append(asset(pi,box,f'{prefix}{number:03}-p{pi+1:02}.webp'));texts.append(text)
            assert prompts,(pack,part,number,'no prompt')
            options=[]
            for j,m in enumerate(markers):
                header=None
                if table:
                    hr=len(table.rows)-len(markers);row=table.rows[hr+j]
                    cells=[c for c in row.cells if c]
                    x0=cells[1][0] if len(cells)>1 and cells[0][0]<=m['x0']<cells[0][2] else row.bbox[0]
                    box=(x0,row.bbox[1],table.bbox[2],row.bbox[3])
                    header=(x0,table.bbox[1],table.bbox[2],table.rows[hr].bbox[1])
                else:
                    cols=[v['x0'] for v in markers if abs(v['top']-m['top'])<8 and v['x0']>m['x0']+5]
                    rows=[v['top'] for v in markers if v['top']>m['top']+8]
                    bottom=min(rows)-4 if rows else bounds[op][1]
                    # Do not include publisher notices after the last question.
                    notices=[w['top'] for w in words[op] if w['top']>m['top'] and w['text'] in ('Company','Copyright','All')]
                    if notices and number==count:bottom=min(bottom,min(notices)-4)
                    box=(m['x1']+1,m['top']-4,min(cols)-6 if cols else p.width-35,bottom)
                value=p.crop(box).extract_text() or ''
                options.append(dict(id=m['text'][0],text=value.strip(),image=asset(op,box,f'{prefix}{number:03}-{m["text"][0]}.webp',header)))
            records.append(dict(id=f'{pack}-{prefix}{number:03}',number=number,**({'part':part} if part else {}),domain='technology' if part=='B' or number<=(40 if level=='FE' else 45) else 'management' if number<=(48 if level=='FE' else 65) else 'strategy',sourcePage=first+1,source=f'({code}, {level}, '+(f'Subject-{part}, ' if part else '')+f'Q{number})',promptText='\n\n'.join(texts),prompt=prompts[0],promptPages=prompts,options=options,answerId=key[number]))
            diagnostics.append(dict(part=part,number=number,pages=[first+1,op+1],table=bool(table),answerTop=markers[0]['top']))
        qp=f'{part.lower()}-questions.pdf' if part else 'questions.pdf';ap=f'{part.lower()}-answers.pdf' if part else 'answers.pdf'
        shutil.copyfile(source,out/qp);shutil.copyfile(answer,out/ap)
        parts.append(dict(id=part,durationSeconds=minutes*60,questionCount=count,questionPdf=f'exams/{pack}/{qp}',answerPdf=f'exams/{pack}/{ap}',sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),answerSha256=hashlib.sha256(answer.read_bytes()).hexdigest()))
        pdf.close();renderer.close()
    manifest=dict(schemaVersion=1,id=pack,system='ITPEC',level=level,year=year,season=season,title=f'{"April" if season=="spring" else "October"} {year}',originalLanguage='en',durationSeconds=sum(p['durationSeconds'] for p in parts),sourceUrl=f'https://itpec.org/pastexamqa/{level.lower()}.html',archiveUrl=f'https://itpec.org/pastexamqa/{level.lower()}/{code}_{level}.zip',translations=[],lessonsReady=False,questions=records,editorialNotes=['Original PDF question numbering and wording are preserved.','Options are cropped and shuffled; table headers are repeated.','Domain assignments are editorial syllabus classifications.'])
    if level=='FE':manifest['parts']=parts
    else:manifest.update({k:parts[0][k] for k in ['sourceSha256','answerSha256']})
    (ROOT/'data/exams'/f'{pack}.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    (ROOT/'work/release-import'/f'{pack}-diagnostics.json').write_text(json.dumps(diagnostics,indent=2),encoding='utf8')
    print(pack,len(records),manifest['durationSeconds'],flush=True)

if __name__=='__main__':
    for name in sys.argv[1:] or [f'{code}_{level}' for code in ['2025A','2025S','2024A','2024S'] for level in ['IP','FE']]:
        import_pack(*name.split('_'))
