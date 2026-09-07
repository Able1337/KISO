// Read-only similarity suggestions, never automatically applied as lessons.
import {readFileSync,writeFileSync} from 'node:fs';
import {archiveLessonEntries,feArchiveLessonEntries} from '../app/itpec-archive-lessons.ts';
import {ipaIp} from '../app/ipa-ip-lessons.ts';
import {lessonEntries} from '../app/official-lesson-bank.ts';
const banks={...archiveLessonEntries,'ipa-ip-2026-public':ipaIp,...Object.fromEntries(Object.entries(feArchiveLessonEntries).map(([id,v])=>[id+'-A',v.A]))};
banks['itpec-ip-2026-spring']=lessonEntries;
const grams=t=>{t=t.normalize('NFKC').replace(/[\s\p{P}\p{N}]/gu,'');return new Set(Array.from({length:Math.max(0,t.length-2)},(_,i)=>t.slice(i,i+3)))};
const entries=Object.entries(banks).flatMap(([id,es])=>es.map(e=>({id,n:e[0],entry:e,g:grams(e[4].join(' '))})));
for(const year of [2024,2025]){
 const qs=JSON.parse(readFileSync(`work/release-import/ipa-ip-${year}/review/questions.json`));
 const result=qs.map(q=>{const g=grams(q.text);return {number:q.number,text:q.text,candidates:entries.map(e=>({...e,score:[...g].filter(x=>e.g.has(x)).length/Math.sqrt(g.size*e.g.size)})).sort((a,b)=>b.score-a.score).slice(0,3).map(({g,...e})=>e)}});
 writeFileSync(`work/release-import/ipa-ip-${year}/review/reuse.json`,JSON.stringify(result,null,2));
 console.log(year);for(const q of result)console.log(q.number,q.candidates.map(c=>`${c.id}:${c.n} ${c.entry[3][0]}`).join(' | '));
}
