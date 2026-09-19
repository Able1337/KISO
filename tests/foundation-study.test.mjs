import test from 'node:test';
import assert from 'node:assert/strict';
import {foundationLessons,studyText,checkStudyAnswer,readFoundationAnswers,FOUNDATION_STORAGE_KEY} from '../lib/foundation-lessons.ts';
import {readFoundationPractice,answerFoundation,retryFoundation} from '../lib/foundation-practice.ts';
const lesson=id=>foundationLessons.find(l=>l.id===id);
test('eight foundation lessons have complete original teaching content in three languages',()=>{
 assert.equal(foundationLessons.length,8);assert.equal(new Set(foundationLessons.map(l=>l.id)).size,8);
 assert.deepEqual(['numbers','logic'].map(g=>foundationLessons.filter(l=>l.group===g).length),[5,3]);
 for(const l of foundationLessons){assert.equal(l.options.length,4);assert.equal(new Set(l.options).size,4);assert.ok(l.answer>=0&&l.answer<4);assert.ok(l.example.length>25);
  for(const lang of ['ru','en','ja']){for(const v of [l.title,l.intro,...l.steps,l.explanation,l.pitfall,l.question,l.solution]){assert.equal(v.length,3);assert.ok(studyText(v,lang).length>3,l.id);assert.doesNotMatch(studyText(v,lang),/TODO|TBD/);}assert.ok(studyText(l.solution,lang).length>60);assert.ok(studyText(l.intro,lang).length>40);}
 }
});
test('independent numeric answers and every decimal/binary/octal/hex round trip to 255',()=>{
 const expected={positional:String(parseInt('101101',2)),reverse:(19).toString(2),'oct-hex':String(parseInt('2f',16)),signed:String(parseInt('11110110',2)-256),fractions:String(1/4+1/8),bits:(0b10101100&0b00001111).toString(2).padStart(8,'0')};
 for(const [id,value]of Object.entries(expected))assert.equal(lesson(id).options[lesson(id).answer].replace('−','-'),value);
 for(let n=0;n<256;n++)for(const base of [2,8,16]){let q=n,digits='';do{digits=(q%base).toString(base)+digits;q=Math.floor(q/base);}while(q);assert.equal(digits,n.toString(base));assert.equal(parseInt(digits,base),n);}
 assert.equal(parseInt('11010',2),26);assert.equal(parseInt('32',8),26);assert.equal(parseInt('1a',16),26);assert.equal(1/2+1/8,.625);
});
test('all signed 8-bit values, mask and shift examples are width-correct',()=>{
 for(let x=-128;x<128;x++){const bits=(x+256)%256;assert.equal(bits>=128?bits-256:bits,x);if(x>0)assert.equal(((~x)+1)&255,256-x);}
 assert.equal((127+1)-256,-128);assert.equal((0b10110110<<1)&255,108);assert.equal(0b10110110>>>1,91);assert.equal((-74>>1)&255,0b11011011);
 for(let n=0;n<256;n++){assert.equal(n&15,n%16);for(let k=1;k<8;k++){assert.equal(n>>>k,Math.floor(n/2**k));assert.equal((n<<k)&255,(n*2**k)%256);}}
});
test('truth tables, De Morgan and interval boundaries independently validate',()=>{
 for(const a of [false,true])for(const b of [false,true]){assert.equal(!(a&&b),!a||!b);assert.equal(!(a||b),!a&&!b);assert.equal(Number(a)^Number(b),Number(a!==b));}
 assert.equal(lesson('boolean').options[lesson('boolean').answer],'(1, 0)');
 assert.equal(lesson('demorgan').options[lesson('demorgan').answer],'x < 3 OR x > 7');
 for(const x of [-Infinity,2,2.9,3,3.1,5,6.9,7,7.1,8,Infinity])assert.equal(!(x>=3&&x<=7),x<3||x>7);
});
test('every wrong practice choice remains wrong after shuffle; retry and reload preserve identity',()=>{
 for(const l of foundationLessons)for(let wrong=0;wrong<4;wrong++)if(wrong!==l.answer){
  const base=readFoundationPractice(null,()=>.3),a=answerFoundation(base,l.id,wrong);
  assert.equal(checkStudyAnswer(l.id,a.answers[l.id]),false);assert.equal(answerFoundation(a,l.id,l.answer),a);
  assert.deepEqual(readFoundationPractice(JSON.stringify(a)),a);
  const retry=retryFoundation(a,l.id,()=>.9);assert.equal(retry.answers[l.id],undefined);assert.ok(retry.orders[l.id].every((id,i)=>id!==a.orders[l.id][i]));
  assert.equal(checkStudyAnswer(l.id,answerFoundation(retry,l.id,l.answer).answers[l.id]),true);
 }
});
test('practice storage is separate and malformed answers/orders are rejected safely',()=>{
 assert.notEqual(FOUNDATION_STORAGE_KEY,'kiso-roadmap-v1');
 for(const raw of [null,'oops','{}','{"version":2,"answers":{"bits":0}}'])assert.deepEqual(readFoundationAnswers(raw),{});
 const broken=readFoundationPractice(JSON.stringify({version:1,answers:{bits:99,boolean:-1,signed:'0',positional:1,unknown:0},orders:{bits:['0','0','0','0']}}));
 assert.deepEqual(broken.answers,{positional:1});assert.deepEqual(broken.orders.bits.slice().sort(),['0','1','2','3']);
 assert.equal(checkStudyAnswer('unknown',0),false);assert.equal(checkStudyAnswer('bits',NaN),false);
 const next=answerFoundation(broken,'bits',1);assert.equal(next.answers.positional,1);assert.equal(retryFoundation(next,'bits').answers.positional,1);
});
