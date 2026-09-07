import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {archiveLessonEntries,itpecArchiveLesson} from '../app/itpec-archive-lessons.ts';
import {makeAttempt,answerQuestion,summarize} from '../lib/exam-session.ts';

test('IP October 2024 arithmetic, boundaries, LRU and inventory independently recompute',()=>{
 assert.equal(parseInt('11000',2),24);
 const ways=(x,y)=>x===0||y===0?1:ways(x-1,y)+ways(x,y-1);
 assert.equal(ways(1,2)*ways(2,1),9);
 const bill=n=>Math.min(n,100)*5+Math.min(Math.max(0,n-100),200)*10+Math.max(0,n-300)*15;
 assert.deepEqual([0,100,101,300,301,350].map(bill),[0,500,510,2500,2515,3250]);
 let cache=[],evictions=[];
 for(const item of 'ABCDBAEABF'){
  if(cache.includes(item))cache.splice(cache.indexOf(item),1);
  else if(cache.length===4)evictions.push(cache.shift());
  cache.push(item);
 }
 assert.deepEqual(evictions,['C','D']);
 assert.equal(600*1.05,630);
 assert.deepEqual([9*2000,6*4000,3*7000],[18000,24000,21000]);
 assert.equal((150-8*5)/10,11);
 assert.equal((800-200)*840-300000,204000);
 let quantity=100,cost=1000;
 quantity+=100;cost+=1400;
 const removed=150*(cost/quantity);quantity-=150;cost-=removed;
 assert.deepEqual([quantity,cost],[50,600]);
 quantity+=50;cost+=800;
 assert.deepEqual([quantity,cost,cost/quantity],[100,1400,14]);
 assert.equal([1,2,3,4,5,6,7,8,9,10].find(x=>68+2*x>Math.max(79,83)),8);
 assert.equal(10*3-5,25);
 const a1=2,b1=7,a2=6,b2=4,c1=a1+b2,c2=a2+b1,a3=a1+a2,b3=b1+b2,c3=c2+b3;
 assert.deepEqual([[a1,b1,c1],[a2,b2,c2],[a3,b3,c3]],[[2,7,6],[6,4,13],[8,11,24]]);
});

test('IP October 2024 required-node route also handles revisits',()=>{
 const graph={X:{A:20,B:20,C:40},A:{B:40,C:30},B:{A:40,C:20,Y:60},C:{A:30,B:20,Y:60},Y:{}};
 const bit={A:1,B:2,C:4};const queue=[[0,'X',0]],seen=new Map();let result;
 while(queue.length){
  queue.sort((a,b)=>a[0]-b[0]);const [cost,node,mask]=queue.shift(),key=node+mask;
  if(seen.has(key))continue;seen.set(key,cost);
  if(node==='Y'&&mask===7){result=cost;break;}
  for(const [next,d]of Object.entries(graph[node]))queue.push([cost+d,next,mask|(bit[next]??0)]);
 }
 assert.equal(result,130);
});

for(const season of ['spring','autumn'])test(`IP 2024 ${season}: all 100 questions, every wrong option, three distinct lesson languages`,()=>{
 const p=JSON.parse(fs.readFileSync(`data/exams/itpec-ip-2024-${season}.json`));
 assert.equal(archiveLessonEntries[p.id].length,100);
 for(const q of p.questions){
  const lessons=['ru','en','ja'].map(lang=>itpecArchiveLesson(p.id,undefined,q.number,lang));
  assert.equal(new Set(lessons.map(l=>l.core)).size,3);
  assert.match(lessons[0].detail,/[А-Яа-яЁё]/);
  assert.doesNotMatch(lessons[0].core,/[\u3040-\u30ff]/);
  for(const wrong of q.options.filter(o=>o.id!==q.answerId)){
   const a=answerQuestion(p,makeAttempt(p,'learn',1000,()=>.4),q.id,wrong.id,2000);
   assert.equal(a.answers[q.id],wrong.id);assert.equal(summarize(p,a).correct,0);
   assert.equal(a.orders[q.id].filter(id=>id===q.answerId).length,1);
   assert.equal(answerQuestion(p,a,q.id,q.answerId,3000),a);
   for(const lang of ['ru','en','ja'])assert.ok(itpecArchiveLesson(p.id,undefined,q.number,lang).detail.length>60);
  }
 }
});

test('IP April 2024 branches, loop, stack, rotation, RLE and scheduling',()=>{
 const grade=s=>s>=80?'A':s>=65?'B':s>=50?'C':'Fail';
 assert.deepEqual([49,50,64,65,79,80].map(grade),['Fail','C','C','B','B','A']);
 let x=2,y=3;do{y--;x+=y;}while(y!==1);assert.equal(x,5);
 const outputs=new Set();
 const visit=(next,stack,out)=>{
  if(out.length===3){outputs.add(out.join(''));return;}
  if(next<3)visit(next+1,[...stack,'ABC'[next]],out);
  if(stack.length)visit(next,stack.slice(0,-1),[...out,stack.at(-1)]);
 };visit(0,[],[]);
 assert.deepEqual([...outputs].sort(),['ABC','ACB','BAC','BCA','CBA']);
 for(const size of [1,2,5,20]){
  const a=Array.from({length:size},(_,i)=>i+1),tmp=a[0];
  for(let i=1;i<size;i++)a[i-1]=a[i];a[size-1]=tmp;
  assert.deepEqual(a,[...Array.from({length:size-1},(_,i)=>i+2),1]);
 }
 const pixels=['BBBBB','BWWWW','BBBBW','BWWWW','BWWWW'].join('');
 const encoded=pixels.match(/B+|W+/g).map(run=>run[0]+(run.length>1?run.length:'')).join('');
 assert.equal(encoded,'B6W4B4WBW4BW4');assert.equal(encoded.length/pixels.length,.52);
 const decode=encoded.match(/[BW]\d*/g).map(s=>s[0].repeat(Number(s.slice(1)||1))).join('');assert.equal(decode,pixels);
 const times={A:[8,10],B:[10,5],C:[6,8]};
 const finish=order=>{let tx=0,ty=0;for(const q of order){tx+=times[q][0];ty=Math.max(tx,ty)+times[q][1];}return ty;};
 assert.deepEqual(['ABC','ACB','CAB','CBA'].map(finish),[32,31,29,34]);
 assert.equal(Math.min(...['ABC','ACB','BAC','BCA','CAB','CBA'].map(finish)),29);
 assert.equal(100*5*20*.6,6000);
 const rows=[[1500,1000,3000],[1200,1000,1000],[1700,1500,1300]];
 assert.deepEqual(rows.map(row=>row.map(n=>n<row.reduce((a,b)=>a+b)/3?'X':'O')),[['X','X','O'],['O','X','X'],['O','O','X']]);
});
