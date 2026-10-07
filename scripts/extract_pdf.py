import fitz,json,re,bisect,collections
from pathlib import Path
src=Path('/workspace/scratch/600dc3d0f2f6/upload/★ Corrosion Control팀 RTSMOC 부식검토처리현황 파악.pdf')
doc=fitz.open(src); records=[]; blanks=0; anomalies=[]
for pi,p in enumerate(doc):
 rects=[it[1] for d in p.get_drawings() for it in d['items'] if it[0]=='re']
 xs=sorted(set(round((r.x0+r.x1)/2,2) for r in rects if r.height>300 and r.width<1))
 ys=sorted(set(round((r.y0+r.y1)/2,2) for r in rects if r.width>500 and r.height<1))
 if len(xs)<11:anomalies.append([pi+1,'grid',len(xs)]);continue
 cells=collections.defaultdict(list)
 for block in p.get_text('rawdict')['blocks']:
  for li,line in enumerate(block.get('lines',[])):
   for sp in line['spans']:
    sc=bisect.bisect_right(xs,sp['bbox'][0]+0.1)-1
    onecell=0<=sc<len(xs)-1 and sp['bbox'][2]<xs[sc+1]+4
    for ch in sp['chars']:
     x0,y0,x1,y1=ch['bbox']; col=bisect.bisect_right(xs,(x0+x1)/2)-1;row=bisect.bisect_right(ys,(y0+y1)/2)-1
     if onecell:col=sc
     if 0<=col<len(xs)-1 and 0<=row<len(ys)-1:cells[row,col].append((round(y0,1),x0,ch['c']))
 def val(r,c):
  lines=collections.defaultdict(list)
  for y,x,t in cells[r,c]:lines[y].append((x,t))
  return '\n'.join(''.join(t for x,t in sorted(lines[y])) for y in sorted(lines)).strip()
 # column ordering is stable; verify header
 for r in range(len(ys)-1):
  n=val(r,0)
  if not re.fullmatch(r'\d+',n):continue
  a=[val(r,c) for c in range(11)]
  if not any(a[1:]):blanks+=1;continue
  records.append(dict(id=f'RTS-{int(n):05d}',source_no=int(n),received_date=a[1],management_no=a[2],title=a[3],department=a[4],completed_date=a[7],status=a[8],review=a[9],corrosion_flag=a[10],source_page=pi+1,source_file=src.name,origin='historical_pdf',extraction_status='PDF 텍스트 추출; 원문 표의 잘림 가능성 확인 필요'))
Path('data/cases.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
print(json.dumps(dict(pages=len(doc),records=len(records),blank_rows=blanks,anomalies=anomalies,empty_title=sum(not r['title'] for r in records),empty_review=sum(not r['review'] for r in records),dates=sorted(set(r['received_date'][:4] for r in records)),status=collections.Counter(r['status'] for r in records),last=records[-3:]),ensure_ascii=False,indent=2))
