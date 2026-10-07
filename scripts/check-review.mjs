import ts from 'typescript';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const src=fs.readFileSync('lib/review.ts','utf8').replace("import historical from '../data/cases.json';",`const historical = ${fs.readFileSync('data/cases.json','utf8')};`);
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const m=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
assert.equal(m.baseCases.length,6425);assert.equal(new Set(m.baseCases.map(c=>c.id)).size,6425);assert.equal(m.stats(m.baseCases).eligible,6331);
assert(m.baseCases.every(c=>c.title));
for(const query of ['Amine 배관 용접','황산 재질 변경','Caustic PWHT','WHB Economizer']){
 const r=m.prepare(m.baseCases,query);assert(r.cases.length>0);assert(r.cases.every(c=>c.eligible));console.log(query,r.cases.slice(0,3).map(c=>c.management_no+' '+c.title.replaceAll('\n',' ')));
}
assert.equal(m.searchCases(m.baseCases,'zzzzzunmatchable123',10).length,0);
assert(m.searchCases(m.baseCases,'I12-0668',1)[0].id==='RTS-00005');
const route=fs.readFileSync('app/mcp/route.ts','utf8').replace("import {allCases,saveCase} from '../../lib/store';","const allCases=async()=>[]; const saveCase=async()=>({});").replace("import {stats,searchCases,prepare,guidance} from '../../lib/review';","const stats=()=>({});const searchCases=()=>[];const prepare=()=>({});const guidance='test';");
const rmod=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(route,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const call=(body,headers={})=>rmod.POST(new Request('https://test.local/mcp',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)}));
assert.equal((await call({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'corrosion_database_stats'}})).status,401);
assert.equal((await call({jsonrpc:'2.0',id:1,method:'tools/list'},{origin:'https://evil.example'})).status,403);
const discovery=await (await call({jsonrpc:'2.0',id:1,method:'tools/list'})).json();assert.equal(discovery.result.tools.length,5);
assert.equal((await call({jsonrpc:'2.0',method:'notifications/initialized'})).status,202);
assert.equal((await rmod.GET()).status,405);
console.log('PASS: record counts, ID lookup, topic retrieval, exclusion, empty retrieval, MCP discovery and authorization boundaries');
