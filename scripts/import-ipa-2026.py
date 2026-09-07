"""Import official IPA 2026 originals. OCR is diagnostic only, never question artwork.

Inputs: six official PDFs and optional Tesseract page JSON under work/release-import/ipa-2026.
Run with the bundled Python (pdfplumber, pypdfium2, Pillow).
"""
import hashlib
import json
import re
import shutil
import unicodedata
from pathlib import Path
import pdfplumber
import pypdfium2 as pdfium
from PIL import Image, ImageChops, ImageOps, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'work/release-import/ipa-2026'
LETTERS='アイウエオカキクケコ'
# Manually checked against the scan. Coordinates are PDF points, not OCR text.
IP_LAYOUTS={
    4:([76,266],[389,409]),14:([76,266],[373,393]),16:([76,266],[132.8,152.8]),
    19:([76,266],[153,173]),22:([76,171,266,360],[393]),25:([76,171,266,360],[373]),
    26:([76,171,266,360],[590]),33:([76,171,266,360],[593]),41:([76],[134,174,214,254]),
    48:([76,171,266,360],[393]),58:([76],[134,154,174,194]),61:([76,266],[454,474]),
    63:([76,266],[395,415]),66:([76,266],[354,374]),67:([76,266],[632,652]),
    78:([76,266],[334,354]),81:([76,171,266,360],[439.6]),83:([76,171,266,360],[232.8]),
    94:([76],[314,354,394,434]),95:([76,266],[153,173]),96:([76,260],[314,334]),
}
# content left/right, header top, first data row top, row height
IP_TABLES={
    55:(105.6,310,254.8,276,21.1),68:(93.2,305.6,125.2,146,21.1),
    69:(93.2,424,391.6,412.4,21),76:(89.2,204,425.6,446.4,21),
    80:(93.2,206.8,244.8,265.6,21),85:(93.2,232,486,507.2,21),
    88:(89.2,189.2,364.8,388,23.3),89:(104.8,261.2,205.2,226.4,25.4),
    99:(89.2,306,404.8,425.6,22.4),
}
def norm(s): return unicodedata.normalize('NFKC',s)

def clean_bbox(mask):
    """Ignore tiny disconnected scan dust, preserving thin glyphs and formulas."""
    width,height=mask.size
    pixels={i for i,v in enumerate(mask.getdata()) if v}
    boxes=[]
    while pixels:
        first=pixels.pop();stack=[first];component=[first]
        while stack:
            p=stack.pop();x=p%width
            for n in (p-width,p+width,p-1 if x else -1,p+1 if x<width-1 else -1):
                if n in pixels:pixels.remove(n);stack.append(n);component.append(n)
        if len(component)>=12:
            xs=[p%width for p in component];ys=[p//width for p in component]
            boxes.append((min(xs),min(ys),max(xs)+1,max(ys)+1))
    return (min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes)) if boxes else mask.getbbox()

def import_subject(level,part,count):
    pack=f'ipa-{level.lower()}-2026-public'
    stem='2026r08_'+('ip' if level=='IP' else f'fe_kamoku_{part.lower()}')
    out=ROOT/'public/exams'/pack
    out.mkdir(parents=True,exist_ok=True)
    question=SOURCE/(stem+'_qs.pdf'); answer=SOURCE/(stem+'_ans.pdf')
    prefix=part.lower() if part else 'q'
    qp=f'{part.lower()}-questions.pdf' if part else 'questions.pdf'
    ap=f'{part.lower()}-answers.pdf' if part else 'answers.pdf'
    shutil.copyfile(question,out/qp);shutil.copyfile(answer,out/ap)
    key={}
    with pdfplumber.open(answer) as a:
        for page in a.pages:
            for n,k in re.findall(r'問\s*(\d+)\s*([アイウエオカキクケコ])',norm(page.extract_text())):
                assert int(n) not in key
                key[int(n)]=chr(97+LETTERS.index(k))
    assert sorted(key)==list(range(1,count+1))
    pdf=pdfplumber.open(question);render=pdfium.PdfDocument(question)
    starts=[]; pages=[]
    for pi,p in enumerate(pdf.pages):
        words=p.extract_words()
        if level=='IP' and pi>0 and pi<49:
            ocr=json.loads((SOURCE/f'ip-{pi+1:02}.json').read_text(encoding='utf8'))
            words=[]
            for block in ocr['blocks'] or []:
                for para in block['paragraphs']:
                    for line in para['lines']:
                        line_text=norm(line['text']).strip()
                        if re.match(r'[問間]\s*\d+',line_text) and 'から' not in line_text.replace(' ','')[:18] and line['bbox']['x0']<175:
                            starts.append((len(starts)+1,pi,line['bbox']['y0']/2.5-4))
                        for w in line['words']:
                            b=w['bbox'];words.append(dict(text=w['text'],x0=b['x0']/2.5,x1=b['x1']/2.5,top=b['y0']/2.5,bottom=b['y1']/2.5))
                            if len(w['symbols'])>1 and w['text'][0] in LETTERS and (w['symbols'][1]['bbox']['x0']-w['symbols'][0]['bbox']['x1']>10 or w['text']=='イィ') and any(abs(b['x0']/2.5-x)<6 for x in [76,171,266,360,66]):
                                sb=w['symbols'][0]['bbox'];words.append(dict(text=w['text'][0],x0=sb['x0']/2.5,x1=sb['x1']/2.5,top=sb['y0']/2.5,bottom=sb['y1']/2.5))
        pages.append(words)
        if level=='IP' or pi<3:continue
        for wi,w in enumerate(words):
            txt=norm(w['text']); m=re.fullmatch(r'問\s*(\d+)',txt)
            if not m and txt=='問' and wi+1<len(words):m=re.fullmatch(r'(\d+)',norm(words[wi+1]['text']))
            if m and w['x0']<80:starts.append((int(m[1]),pi,w['top']-4))
    assert [s[0] for s in starts]==list(range(1,count+1)),starts
    cache={}
    def crop(pi,box,name,header=None,remove_label=None):
        p=pdf.pages[pi]
        if pi not in cache:cache[pi]=render[pi].render(scale=2.5).to_pil().convert('RGB')
        img=cache[pi];sx=img.width/p.width;sy=img.height/p.height
        def cut(b):return img.crop(tuple(round(v*(sx if j%2==0 else sy)) for j,v in enumerate(b)))
        im=cut(box)
        if remove_label:
            x0,y0,x1,y1=remove_label
            ImageDraw.Draw(im).rectangle(((x0-box[0])*sx,(y0-box[1])*sy,(x1-box[0])*sx,(y1-box[1])*sy),fill='white')
        if header:
            h=cut(header);merged=Image.new('RGB',(im.width,h.height+im.height),'white');merged.paste(h);merged.paste(im,(0,h.height));im=merged
        # Near-white scan noise must not enlarge a crop to the entire page margin.
        mask=ImageChops.difference(im,Image.new('RGB',im.size,'white')).convert('L').point(lambda v:255 if v>60 else 0)
        # Remove isolated scan specks only from the bounding-box mask, never artwork.
        ink=clean_bbox(mask) if level=='IP' else mask.getbbox();assert ink,(pi,box)
        ink=(max(0,ink[0]-4),max(0,ink[1]-4),min(im.width,ink[2]+4),min(im.height,ink[3]+4))
        im=ImageOps.expand(im.crop(ink),8,'white');im.save(out/name,'WEBP',lossless=True)
        return dict(src=f'exams/{pack}/{name}',width=im.width,height=im.height)
    records=[];errors=[]
    for i,(number,pi,top) in enumerate(starts):
        end=starts[i+1] if i+1<len(starts) else (0,len(pdf.pages),0)
        last=end[1] if end[1]==pi else end[1]-1
        # Memo pages between questions are not part of the question.
        active=[j for j in range(pi,last+1) if j==pi or any(w['text']=='解答群' or 'プログラム' in w['text'] for w in pages[j])]
        bounds={j:(top if j==pi else 45,end[2]-8 if end[1]==j else pdf.pages[j].height-48) for j in active}
        markers=[]
        for j in active:
            lo,hi=bounds[j]
            for w in pages[j]:
                if lo<=w['top']<hi and w['text'] in LETTERS and len(w['text'])==1:
                    if level=='IP' and not any(abs(w['x0']-x)<6 for x in [76,171,266,360,66]):continue
                    if level=='IP' and w['x0']>90:
                        left=[v['x1'] for v in pages[j] if abs(v['top']-w['top'])<8 and v['x1']<=w['x0']]
                        if left and w['x0']-max(left)<12:continue
                    markers.append(dict(w,page=j))
        if level=='IP':
            selected=[]
            for marker in markers:
                if len(selected)<4 and marker['text']==LETTERS[len(selected)]:selected.append(marker)
            markers=selected
            if number in IP_LAYOUTS:
                xs,ys=IP_LAYOUTS[number]
                markers=[dict(text=LETTERS[k],x0=x,x1=x+9,top=y,page=pi) for k,(y,x) in enumerate((y,x) for y in ys for x in xs)]
            if number in IP_TABLES:
                left,right,ht,first,rh=IP_TABLES[number]
                markers=[dict(text=LETTERS[k],x0=left-12,x1=left-2,top=first+k*rh,page=pi) for k in range(4)]
        if not (''.join(m['text'] for m in markers)==LETTERS[:len(markers)] and 4<=len(markers)<=10):
            errors.append((number,pi+1,[(m['text'],round(m['x0'],1),round(m['top'],1)) for m in markers]));continue
        op=markers[0]['page']; option_top=min(m['top'] for m in markers)-5
        # FE B4/B5 have column headers immediately above the answer rows.
        header_top=option_top-22 if part=='B' and number in (4,5) else None
        prompt_end=header_top if header_top else option_top
        if level=='IP' and number in IP_TABLES:prompt_end=IP_TABLES[number][2]-2
        if part=='B' and number==5:prompt_end=488
        prompts=[];texts=[]
        for j in active:
            if j>op:break
            lo,hi=bounds[j];hi=prompt_end if j==op else hi
            if hi<=lo:continue
            prompts.append(crop(j,(50,lo,pdf.pages[j].width-42,hi),f'{prefix}{number:03}-p{j+1:02}.webp'))
            texts.append(' '.join(w['text'] for w in pages[j] if lo<=w['top']<hi))
        if not prompts:
            errors.append((number,pi+1,'no prompt',[(m['text'],m['x0'],m['top']) for m in markers]));continue
        options=[]
        for m in markers:
            j=m['page'];p=pdf.pages[j];same=[v for v in markers if v['page']==j and abs(v['top']-m['top'])<9]
            right=[v['x0'] for v in same if v['x0']>m['x0']+15];below=[v['top'] for v in markers if v['page']==j and v['top']>m['top']+9]
            box=(m['x0']-1,m['top']-4,min(right)-6 if right else p.width-42,min(below)-5 if below else bounds[j][1])
            remove_label=(m['x0']-1,m['top']-1,m['x1']+0.4,m.get('bottom',m['top']+11)+1)
            if level=='IP':box=(*box[:3],min(box[3],m['top']+(25 if len(same)>1 else 80)))
            oid=chr(97+LETTERS.index(m['text']));header=(box[0],header_top,box[2],option_top) if header_top else None
            if level=='IP' and number in IP_TABLES:
                left,right,ht,first,rh=IP_TABLES[number];k=LETTERS.index(m['text'])
                box=(left,first+k*rh,right,first+(k+1)*rh)
                header=(left,ht,right,first)
                remove_label=None
            if part=='B' and number==5:
                rows=[509.3,544.4,565.4,600.3,622.3];k=LETTERS.index(m['text'])
                box=(104.4,rows[k],448.3,rows[k+1]);header=(104.4,488.5,448.3,509.3);remove_label=None
            try:image=crop(j,box,f'{prefix}{number:03}-{oid}.webp',header,remove_label)
            except AssertionError:
                errors.append((number,pi+1,'empty option',oid,box));break
            text=' '.join(w['text'] for w in pages[j] if box[0]<=w['x0']<box[2] and box[1]<=w['top']<box[3] and not (w['text']==m['text'] and abs(w['top']-m['top'])<3 and abs(w['x0']-m['x0'])<3))
            options.append(dict(id=oid,text=text or f'図 {m["text"]}',image=image))
        records.append(dict(id=f'{pack}-{prefix}{number:03}',number=number,**({'part':part} if part else {}),domain=('strategy' if number<=34 else 'management' if number<=54 else 'technology') if level=='IP' else 'technology',sourcePage=pi+1,source=f'IPA 2026 公開問題 {level} {part or ""} 問{number}',promptText='\n'.join(texts),prompt=prompts[0],promptPages=prompts,options=options,answerId=key[number]))
    assert not errors,errors
    return records,dict(id=part,durationSeconds=1800,questionCount=count,questionPdf=f'exams/{pack}/{qp}',answerPdf=f'exams/{pack}/{ap}',sourceSha256=hashlib.sha256(question.read_bytes()).hexdigest(),answerSha256=hashlib.sha256(answer.read_bytes()).hexdigest())

def main():
    import sys
    for level in sys.argv[1:] or ['FE','IP']:
        records=[];parts=[]
        for part,count in ([('A',20),('B',6)] if level=='FE' else [(None,100)]):
            rows,meta=import_subject(level,part,count);records+=rows;parts.append(meta)
        pack=f'ipa-{level.lower()}-2026-public'
        manifest=dict(schemaVersion=1,id=pack,system='IPA',level=level,year=2026,season='public',originalLanguage='ja',title='2026 公開問題',durationSeconds=3600 if level=='FE' else 7200,sourceUrl='https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/2026r08.html' if level=='FE' else 'https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/questions.html',publishedSubset=True,translations=[],lessonsReady=level=='FE',questions=records,editorialNotes=['Original Japanese answer labels mapped in order to stable Latin IDs; options shuffled.','Published CBT questions, not an entire CBT bank.','FE practice timing proportional to published question count: A 30 min, B 30 min; real FE A 90 min, B 100 min.'] if level=='FE' else ['Original Japanese answer labels mapped in order to stable Latin IDs; options shuffled.','100 published CBT questions, not an entire CBT bank.','OCR is diagnostic only. Original scans are displayed.'])
        if level=='FE':manifest['parts']=parts
        else:manifest.update({k:parts[0][k] for k in ['sourceSha256','answerSha256']})
        (ROOT/'data/exams'/f'{pack}.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
        print(pack,len(records))

if __name__=='__main__':main()
