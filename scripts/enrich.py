import json,re,collections
r=json.load(open('data/cases.json'))
for a in r:
 a['review_type']='미완료·결과없음' if a['status']!='검토완료' or not a['review'] else '단순 특이사항 없음' if len(re.sub(r'\s','',a['review']))<50 and re.search(r'(특이사항|해당사항|검토사항|특별한.*사항).*없',a['review']) else '상세 검토'
 a['eligible']=a['status']=='검토완료' and bool(a['review'])
 a['tags']=[name for name,pat in [('아민','amine|아민'),('황산','sulfuric|황산'),('가성소다','caustic|가성|naoh|causic'),('냉각수','cooling water|c/w|냉각수|cw/cwr'),('열처리·용접','pwht|용접|degassing|탈수소'),('재질 변경','재질|material'),('염화물','chloride|염화|clscc'),('침식','erosion|침식'),('내화물','refractory|내화'),('수소','hydrogen|수소|htha'),('검사','검사|nde|검측')] if re.search(pat,a['title']+' '+a['review'],re.I)]
json.dump(r,open('data/cases.json','w'),ensure_ascii=False,separators=(',',':'))
print(collections.Counter(a['review_type'] for a in r));print(r[4]['title']);print('empty',sum(not a['title'] for a in r),sum(not a['review'] for a in r))
