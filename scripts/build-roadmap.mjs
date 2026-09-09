// Derived index only: lesson search topics, never question answers or full lessons.
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {ipaLesson} from '../app/ipa-lessons.ts';
import {feLesson} from '../app/fe-lessons.ts';
import {itpecArchiveLesson} from '../app/itpec-archive-lessons.ts';
import {classifyTopic} from '../lib/roadmap-topics.ts';
function moduleUrl(file,imports={}){
 let code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 for(const [name,url]of Object.entries(imports))code=code.replaceAll(`'${name}'`,`'${url}'`);
 return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}
const {officialLesson}=await import(moduleUrl('../app/official-lessons.ts',{'./kiso-i18n':moduleUrl('../app/kiso-i18n.ts'),'./official-lesson-bank':moduleUrl('../app/official-lesson-bank.ts')}));
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function buildRoadmap(){
 const topics=new Map();let questionCount=0;
 const packs=readdirSync(new URL('../data/exams/',import.meta.url)).filter(f=>f.endsWith('.json')).sort().map(f=>JSON.parse(readFileSync(new URL('../data/exams/'+f,import.meta.url),'utf8')));
 for(const p of packs)for(const q of p.questions){
  const translations=Object.fromEntries(['ru','en','ja'].map(lang=>{
   const lesson=p.system==='IPA'?ipaLesson(p.level,q.part,q.number,lang,p.id):p.year!==2026?itpecArchiveLesson(p.id,q.part,q.number,lang):p.level==='FE'?feLesson(q.part,q.number,lang):officialLesson(q.number,lang);
   if(!lesson?.search?.trim())throw new Error(`Missing topic ${p.id} ${q.id} ${lang}`);
   return [lang,lesson.search.trim()];
  }));
  const key=normalize(translations.en);const id='topic-'+createHash('sha256').update(key).digest('hex').slice(0,20);
  let group=classifyTopic(translations.en,q.domain);
  if(group.endsWith('-other'))group=classifyTopic(translations.ru,q.domain);
  let t=topics.get(key);if(!t){t={id,group,...translations,refs:[]};topics.set(key,t);}
  t.refs.push({pack:p.id,question:q.id,number:q.number,...(q.part?{part:q.part}:{}),system:p.system,level:p.level,year:p.year});questionCount++;
 }
 return {version:1,questionCount,packCount:packs.length,topics:[...topics.values()].sort((a,b)=>a.id.localeCompare(b.id))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const output=JSON.stringify(buildRoadmap(),null,2)+'\n';const target=new URL('../data/roadmap-index.json',import.meta.url);
 if(process.argv.includes('--check')){if(readFileSync(target,'utf8')!==output)throw new Error('Roadmap index is stale; run node --experimental-strip-types scripts/build-roadmap.mjs');}
 else writeFileSync(target,output);
 const index=JSON.parse(output);console.log(JSON.stringify({questions:index.questionCount,packs:index.packCount,subtopics:index.topics.length,groups:Object.fromEntries([...new Set(index.topics.map(t=>t.group))].map(g=>[g,index.topics.filter(t=>t.group===g).length]))},null,2));
}
