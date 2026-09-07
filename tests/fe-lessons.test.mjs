import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {feLessonEntries,feLesson} from '../app/fe-lessons.ts';
import {lessonCoverage} from '../lib/lesson-coverage.ts';
import {makeAttempt,answerQuestion,summarize} from '../lib/exam-session.ts';
const pack=JSON.parse(readFileSync(new URL('../data/exams/itpec-fe-2026-spring.json',import.meta.url),'utf8'));
const langs=['ru','en','ja'];

test('A21 exhaustively derives exactly three minimal candidate keys',()=>{
  const attributes=[...'PQRSTY'];
  const dependencies=[['P','Q'],['QR','S'],['T','R'],['S','P']];
  function closure(seed){const result=new Set(seed);let size;do{size=result.size;for(const [left,right] of dependencies)if([...left].every(a=>result.has(a)))for(const a of right)result.add(a);}while(result.size!==size);return result;}
  const keys=[];
  for(let mask=0;mask<64;mask++){
    const set=attributes.filter((_,i)=>mask&(1<<i));
    if(closure(set).size===6&&set.every((_,i)=>closure(set.filter((_,j)=>j!==i)).size<6))keys.push(set.join(''));
  }
  assert.deepEqual(keys.sort(),['PTY','QTY','STY']);assert.equal(closure('QRY').has('T'),false);
  for(const l of langs)for(const key of keys)assert.ok(feLesson('A',21,l).core.includes(key));
});

test('A22 runs the real SQL options on an isolated in-memory fixture',()=>{
  const db=new DatabaseSync(':memory:');
  try{
    db.exec("CREATE TABLE Student (id INTEGER, name TEXT, classId INTEGER); INSERT INTO Student VALUES (1,'A',1),(2,'Al',1),(3,'Anna',2),(4,'BA',2),(5,'BAC',2),(6,'Bob',1);");
    const matches=pack.questions[21].options.map(o=>[o.id,db.prepare(o.text.replace(/[‘’]/g,"'")).all().map(r=>r.name)]);
    assert.deepEqual(matches.find(([id])=>id==='d')[1],['A','Al','Anna']);
    assert.deepEqual(matches.find(([id])=>id==='c')[1],['Al']);
    assert.ok(matches.filter(([,names])=>JSON.stringify(names)===JSON.stringify(['A','Al','Anna'])).length===1);
  }finally{db.close();}
});

test('A34 statement semantics are verified only on a disposable memory database',()=>{
  const db=new DatabaseSync(':memory:');
  try{
    db.exec("CREATE TABLE accounts (username TEXT); INSERT INTO accounts VALUES ('1'),('Alice'),('Bob');");
    const statement=pack.questions[33].promptText.match(/SELECT \* FROM accounts[\s\S]*$/)[0];
    const [select,drop]=statement.split(';').map(s=>s.trim());
    assert.equal(db.prepare(select).all().length,3);
    db.exec(drop);
    assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='accounts'").get(),undefined);
    for(const l of langs){const d=feLesson('A',34,l).detail;assert.ok(d.includes('DROP TABLE'));assert.match(d,/параметр|arameter|パラメータ/i);}
  }finally{db.close();}
});

test('A27 and A28 teach the distinctions instead of misleading absolute rules',()=>{
  for(const l of langs){
    assert.ok(feLesson('A',27,l).detail.includes('Wi-Fi'));assert.ok(feLesson('A',27,l).detail.includes('802.11'));
    assert.match(feLesson('A',28,l).detail,/фишинг|phish|フィッシング/);
    assert.ok(feLesson('A',40,l).core.includes('5'));
    assert.ok(feLesson('A',40,l).detail.includes('4'));
  }
});

test('FE coverage is honest: A1–A40, all three languages, exact official keys',()=>{
  assert.deepEqual(feLessonEntries.map(e=>e[0]),Array.from({length:40},(_,i)=>i+1));
  assert.equal(lessonCoverage[pack.id],feLessonEntries.length);
  for(const [n,key] of feLessonEntries){
    assert.equal(key,pack.questions[n-1].answerId);
    for(const lang of langs){
      const lesson=feLesson('A',n,lang);
      for(const [field,min] of [['core',15],['detail',120],['search',8],['next',15]])assert.ok(lesson[field].length>=min,`${n} ${lang} ${field}`);
      if(lang==='ru')for(const field of ['core','detail','next'])assert.match(lesson[field],/[а-яё]/i,`${n}: Russian ${field}`);
      for(const source of lesson.sources??[])assert.ok(new URL(source.url).protocol==='https:');
    }
  }
  assert.equal(new Set(feLessonEntries.flatMap(e=>e.slice(2).map(t=>t[1]))).size,120);
  assert.equal(feLesson('B',1,'ru'),null);assert.equal(feLesson('A',41,'en'),null);assert.equal(feLesson(undefined,1,'ja'),null);
});

test('every wrong FE answer stays wrong after shuffle and selects the same question lesson',()=>{
  for(const q of pack.questions.slice(0,40))for(const option of q.options.filter(o=>o.id!==q.answerId)){
    const attempt=makeAttempt(pack,'learn',1000);
    const answered=answerQuestion(pack,attempt,q.id,option.id,2000);
    assert.equal(summarize(pack,answered).correct,0);
    assert.equal(answerQuestion(pack,answered,q.id,q.answerId,3000),answered);
    assert.ok(answered.orders[q.id].includes(q.answerId));
    for(const lang of langs)assert.equal(feLesson(q.part,q.number,lang).core,feLessonEntries[q.number-1][lang==='ru'?2:lang==='en'?3:4][0]);
  }
});

test('A1/A5 notation preserves the tree and operand order',()=>{
  const values={a:2,b:3,c:4,d:5,e:6};
  const op=(s,a,b)=>s==='+'?a+b:s==='−'?a-b:s==='/'?a/b:s==='^'?a**b:a*b;
  function prefix(s){let i=0;function read(){const token=s[i++];return token in values?values[token]:op(token,read(),read());}const result=read();assert.equal(i,s.length);return result;}
  function postfix(s){const stack=[];for(const token of s){if(token in values)stack.push(values[token]);else{const b=stack.pop(),a=stack.pop();assert.ok(a!==undefined&&b!==undefined);stack.push(op(token,a,b));}}assert.equal(stack.length,1);return stack[0];}
  const prefixKey=pack.questions[0].options.find(o=>o.id===pack.questions[0].answerId).text;
  const postfixKey=pack.questions[4].options.find(o=>o.id===pack.questions[4].answerId).text;
  assert.equal(prefix(prefixKey),((2-3)/(4+5))**6);assert.equal(postfix(postfixKey),44);
  for(const l of langs){assert.ok(feLesson('A',1,l).core.includes(prefixKey));assert.ok(feLesson('A',5,l).core.includes(postfixKey));}
});

test('A2 octal fraction and reverse conversion, A4 regex, A7 gcd, A11 bandwidth',()=>{
  const decimal=[1,2,3,4,2].reduce((sum,d,i)=>sum+d*8**(3-i),0);
  assert.equal(decimal,668.25);assert.equal((668).toString(8),'1234');assert.equal(0.25*8,2);
  assert.deepEqual(pack.questions[3].options.filter(o=>/^\d{2,4}-\d+-\d{3,4}$/.test(o.text)).map(o=>o.id),['c']);
  const trace=[];let x=231,y=15;while(y){trace.push([x,y]);[x,y]=[y,x%y];}trace.push([x,y]);
  assert.deepEqual(trace,[[231,15],[15,6],[6,3],[3,0]]);assert.equal(x,3);
  assert.equal((64/8)*(64e6/4)/1e6,128);
  for(const l of langs){assert.ok(feLesson('A',2,l).detail.includes('0.25'));assert.ok(feLesson('A',7,l).detail.includes('F(3,0)'));assert.ok(feLesson('A',11,l).core.includes('128'));}
});

test('A14 independence caveat, A15 full Round Robin waiting, A18 check-digit edge',()=>{
  assert.equal(Math.round((1-0.3**3)*100),97);
  const remaining=[5,13,4,8],burst=[...remaining],queue=[0,1,2,3],finished=[],schedule=[];let time=0;
  while(queue.length){const id=queue.shift(),duration=Math.min(5,remaining[id]);schedule.push([id+1,time,time+duration]);time+=duration;remaining[id]-=duration;if(remaining[id])queue.push(id);else finished[id]=time;}
  assert.deepEqual(schedule,[[1,0,5],[2,5,10],[3,10,14],[4,14,19],[2,19,24],[4,24,27],[2,27,30]]);
  const waiting=finished.map((end,i)=>end-burst[i]);assert.deepEqual(waiting,[0,17,10,19]);assert.equal(waiting.reduce((a,b)=>a+b)/4,11.5);
  const weighted=[7,3,9,4].reduce((sum,d,i)=>sum+d*(i+1),0);assert.equal(weighted,56);assert.equal((11-weighted%11)%10,0);
  for(const l of langs){assert.match(feLesson('A',14,l).detail,/независим|independen|独立/);assert.ok(feLesson('A',15,l).detail.includes('27'));assert.ok(feLesson('A',15,l).core.includes('11.5'));assert.ok(feLesson('A',18,l).core.includes('73940'));}
});
