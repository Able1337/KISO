import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {buildRoadmap} from '../scripts/build-roadmap.mjs';
import {roadmapTopics,roadmapStages,classifyTopic} from '../lib/roadmap-topics.ts';
import {ROADMAP_STORAGE_KEY,readRoadmapProgress,updateRoadmapProgress,serializeRoadmapProgress} from '../lib/roadmap-progress.ts';
const index=JSON.parse(readFileSync('data/roadmap-index.json','utf8'));
test('roadmap index matches current lessons in every language',()=>assert.deepEqual(index,buildRoadmap()));
test('every published question occurs exactly once in the roadmap',()=>{
 const packs=readdirSync('data/exams').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync('data/exams/'+f)));
 const expected=packs.flatMap(p=>p.questions.map(q=>p.id+':'+q.id)).sort();
 const actual=index.topics.flatMap(t=>t.refs.map(r=>r.pack+':'+r.question)).sort();
 assert.deepEqual(actual,expected);assert.equal(new Set(actual).size,expected.length);
 assert.equal(index.questionCount,expected.length);assert.equal(index.packCount,packs.length);
 assert.equal(new Set(index.topics.map(t=>t.id)).size,index.topics.length);
});
test('all topic groups have trilingual descriptions and a route stage; no unclassified questions',()=>{
 for(const t of index.topics){const group=roadmapTopics.find(g=>g.id===t.group);assert.ok(group,t.id);assert.ok(!group.id.endsWith('-other'),t.en);assert.ok(roadmapStages[group.stage]);
  for(const lang of ['ru','en','ja']){assert.ok(t[lang].length>2);assert.equal(group[lang].length,2);assert.ok(group[lang][1].length>15);}
 }
});
test('classification respects concept boundaries, not substrings of business and planning',()=>{
 for(const t of index.topics.filter(t=>/\bWBS\b/.test(t.en)))assert.equal(t.group,'projects');
 for(const [s,expected]of [['ERP business process integration','operations'],['CPU cache locality','hardware'],['balance sheet assets liabilities','finance'],['WBS work breakdown structure','projects'],['binary decimal conversion','numbers'],['SQL JOIN database','databases'],['GDPR personal data','law']])assert.equal(classifyTopic(s,'technology'),expected,s);
});
test('roadmap progress toggles independently and survives serialization',()=>{
 const ids=new Set(['a','b','c']);let state=updateRoadmapProgress({},['a','b'],true);assert.deepEqual(readRoadmapProgress(serializeRoadmapProgress(state),ids),state);
 state=updateRoadmapProgress(state,['a'],false);assert.deepEqual(state,{b:true});assert.equal(ROADMAP_STORAGE_KEY,'kiso-roadmap-v1');
 const fromOtherTab=updateRoadmapProgress(state,['c'],true);assert.deepEqual(updateRoadmapProgress(fromOtherTab,['a'],true),{a:true,b:true,c:true});
});
test('roadmap storage rejects invalid versions, corrupt data and unknown ids',()=>{
 const ids=new Set(['a']);for(const raw of [null,'broken','{}','{"version":2,"completed":["a"]}','{"version":1,"completed":{}}'])assert.deepEqual(readRoadmapProgress(raw,ids),{});
 assert.deepEqual(readRoadmapProgress('{"version":1,"completed":["a","a","unknown",null,42]}',ids),{a:true});
});
