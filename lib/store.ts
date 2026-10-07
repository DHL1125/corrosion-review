import { env } from 'cloudflare:workers';
import { baseCases, type Case } from './review';
function db(){ const binding=(env as unknown as {DB?:D1Database}).DB; if(!binding)throw new Error('사례 저장소에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'); return binding; }
export async function allCases(user:string):Promise<Case[]>{const rows=await db().prepare('SELECT payload FROM user_cases WHERE user_id = ? ORDER BY created_at').bind(user).all<{payload:string}>();return [...baseCases,...rows.results.map(r=>JSON.parse(r.payload) as Case)];}
export async function saveCase(user:string,input:{title:string;review:string;management_no?:string;confirmed:boolean;idempotency_key:string}){
 if(input.confirmed!==true)throw new Error('사용자가 확정한 검토 결과만 등록할 수 있습니다.');
 const title=input.title?.trim(),review=input.review?.trim();if(!title||!review||title.length>2000||review.length>30000)throw new Error('제목(최대 2,000자)과 검토 결과(최대 30,000자)를 입력해 주세요.');
 if(!/^[a-zA-Z0-9_-]{8,100}$/.test(input.idempotency_key||''))throw new Error('유효한 중복 방지 키가 필요합니다.');
 const id='USR-'+user+'-'+input.idempotency_key;
 const old=await db().prepare('SELECT payload FROM user_cases WHERE id = ? AND user_id = ?').bind(id,user).first<{payload:string}>();
 if(old){const c=JSON.parse(old.payload);if(c.title!==title||c.review!==review||c.management_no!==(input.management_no||''))throw new Error('같은 저장 키로 다른 내용을 저장할 수 없습니다. 새 키를 사용해 주세요.');return c;}
 const now=new Date().toISOString();const c:Case={id,source_no:0,received_date:now.slice(0,10),management_no:input.management_no||'',title,department:'사용자 등록',completed_date:now.slice(0,10),status:'검토완료',review,corrosion_flag:'',source_page:0,source_file:'사용자 확정본',origin:'user_confirmed',extraction_status:'사용자 입력 원문',review_type:'상세 검토',eligible:true,tags:[]};
 await db().prepare('INSERT INTO user_cases (id,user_id,payload,created_at) VALUES (?,?,?,?)').bind(id,user,JSON.stringify(c),now).run();return c;
}
