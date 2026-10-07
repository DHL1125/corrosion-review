import {allCases,saveCase} from '../../lib/store';
import {stats,searchCases,prepare,guidance} from '../../lib/review';
const str={type:'string'};
const readonly={readOnlyHint:true,destructiveHint:false,openWorldHint:false};
const tools=[
 {name:'corrosion_database_stats',description:'업로드한 RTS·MOC 부식검토 이력의 건수와 범위를 확인한다.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:readonly},
 {name:'search_corrosion_cases',description:'한국어·영어 키워드로 과거 부식검토 사례를 검색한다. 공정/유체/재질/손상기구를 바꾸어 재검색할 수 있다. 점수는 기술적 적합성이 아니다.',inputSchema:{type:'object',properties:{query:str,limit:{type:'integer',minimum:1,maximum:30},eligible_only:{type:'boolean'},detail_only:{type:'boolean'}},required:['query'],additionalProperties:false},annotations:readonly},
 {name:'get_corrosion_case',description:'사례 ID로 부식검토 원문과 출처 페이지를 조회한다.',inputSchema:{type:'object',properties:{id:str},required:['id'],additionalProperties:false},annotations:readonly},
 {name:'prepare_corrosion_review',description:'신규 투자 발의의 부식검토 초안 요청 시 먼저 호출한다. 발의 전문으로 유사 사례와 작성 지침을 가져온 뒤 ChatGPT가 한국어 검토 초안을 작성한다. '+guidance,inputSchema:{type:'object',properties:{proposal:{type:'string',minLength:3,maxLength:20000}},required:['proposal'],additionalProperties:false},annotations:readonly},
 {name:'save_confirmed_case',description:'사용자가 검토 결과를 확정하고 DB 등록을 요청한 경우에만 저장한다. 생성한 초안을 자동으로 확정하거나 저장하지 않는다. 재시도 시 같은 idempotency_key를 사용한다.',inputSchema:{type:'object',properties:{title:str,review:str,management_no:str,confirmed:{type:'boolean',const:true},idempotency_key:{type:'string',description:'8~100자의 고유 영문/숫자/-/_ 키; 동일 저장 재시도 시 재사용'}},required:['title','review','confirmed','idempotency_key'],additionalProperties:false},annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true,openWorldHint:false}}
];
export async function GET(){return new Response(null,{status:405,headers:{Allow:'POST'}});}
export async function POST(req:Request){
 const origin=req.headers.get('origin');const expected=new URL(req.url).origin;
 if(origin && ![expected,'https://chatgpt.com','https://chat.openai.com','https://corrosion-review-dhl.leadventure.chatgpt.site'].includes(origin))return new Response('Forbidden',{status:403});
 let body;try{const raw=await req.text();if(raw.length>100000)return new Response('Too large',{status:413});body=JSON.parse(raw);}catch{return Response.json({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}},{status:400});}
 const reply=(result:unknown)=>Response.json({jsonrpc:'2.0',id:body.id,result},{headers:{'Cache-Control':'no-store'}});
 const error=(code:number,message:string)=>Response.json({jsonrpc:'2.0',id:body.id??null,error:{code,message}},{headers:{'Cache-Control':'no-store'}});
 if(body.jsonrpc!=='2.0'||typeof body.method!=='string')return error(-32600,'Invalid Request');
 if(body.method==='initialize')return reply({protocolVersion:['2025-11-25','2025-06-18','2025-03-26'].includes(body.params?.protocolVersion)?body.params.protocolVersion:'2025-06-18',capabilities:{tools:{listChanged:false}},serverInfo:{name:'corrosion-review',version:'1.0.0'},instructions:guidance});
 if(body.id===undefined)return new Response(null,{status:202});
 if(body.method==='ping')return reply({});
 if(body.method==='tools/list')return reply({tools});
 if(body.method!=='tools/call')return error(-32601,'Method not found');
 const user=req.headers.get('oai-authenticated-user-id');if(!user)return new Response('Unauthorized',{status:401});
 try{
  const a=body.params?.arguments||{},name=body.params?.name;let result;
  if(!tools.some(t=>t.name===name))return error(-32602,'Unknown tool');
  if(name==='save_confirmed_case')result=await saveCase(user,a);
  else {const cases=await allCases(user);
   if(name==='corrosion_database_stats')result=stats(cases);
   if(name==='search_corrosion_cases'){if(typeof a.query!=='string'||a.query.length>20000)throw new Error('검색어를 확인해 주세요.');result=searchCases(cases,a.query,Math.min(30,Math.max(1,Number(a.limit)||12)),a.eligible_only!==false,a.detail_only===true);}
   if(name==='get_corrosion_case'){result=cases.find(c=>c.id===a.id);if(!result)throw new Error('사례를 찾을 수 없습니다.');}
   if(name==='prepare_corrosion_review'){if(typeof a.proposal!=='string'||a.proposal.length<3||a.proposal.length>20000)throw new Error('발의 내용은 3~20,000자로 입력해 주세요.');result=prepare(cases,a.proposal);}
  }
  return reply({content:[{type:'text',text:JSON.stringify(result)}]});
 }catch(e){return reply({isError:true,content:[{type:'text',text:e instanceof Error?e.message:'처리하지 못했습니다.'}]});}
}
