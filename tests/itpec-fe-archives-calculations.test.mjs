import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {itpecArchiveLesson} from '../app/itpec-archive-lessons.ts';
const near=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
const perm=a=>a.length?a.flatMap((v,i)=>perm(a.filter((_,j)=>i!==j)).map(p=>[v,...p])):[[]];
const postfix=t=>{const s=[];for(const x of t.split(' ')){if(!['+','-','*','/'].includes(x))s.push(Number(x));else{const r=s.pop(),l=s.pop();s.push(x==='+'?l+r:x==='-'?l-r:x==='*'?l*r:l/r);}}return s[0];};
const dfs=(g,start)=>{const seen=new Set(),out=[];function walk(v){seen.add(v);out.push(v);for(const n of g[v])if(!seen.has(n))walk(n);}walk(start);return out;};

test('FE 2024 A: independent arithmetic, postfix, probabilities, CPU, disk, memory and schedules',()=>{
 assert.equal(1*16**2+2*16+3+4/16,291.25);
 const assignments=new Set(perm([0,1,2,3,4]).map(p=>[p[0],p[1]].sort().join(',')));assert.equal(assignments.size,10);
 assert.equal(postfix('100 5 6 2 + * 12 4 / - - 36 -'),27);
 assert.equal(postfix('4 3 2 * + 6 3 / 5 * -'),0);
 for(let n=1;n<50;n++){let sum=0,i=1;while(!(i>=2*n+1)){sum+=i;i+=2;}assert.equal(sum,n*n);}
 near((1.4-1)/1.4*100,28.57142857142857);
 near(4+1.25+60000/5000/2+1000/60,27.916666666666668);
 assert.equal([4,6,16,24,30].reduce((a,b)=>a+b)/5,16);
 const critical=b=>{const upper=Math.max(10+b,10),lower=Math.max(10+25,upper+10);return Math.max(upper+20,lower+15)+15;};
 assert.deepEqual([5,10,15,16].map(critical),[65,65,65,66]);
 assert.equal(100000/4/20000,1.25);
 let best=0;for(let z=0;z<=500;z++)for(let y=0;y<=900;y++){const x=Math.min(1000,Math.floor((12000-15*z-10*y)/6));if(x>=0)best=Math.max(best,18*x+25*y+30*z);}assert.equal(best,33000);
 assert.equal((140000+42000)/(17-3-4),18200);assert.equal(90000-3000*15,45000);
 let bestMix=0;for(let x=0;x<=50;x++)for(let y=0;y<=40;y++)if(2*x+y<=100&&x+2*y<=80)bestMix=Math.max(bestMix,x+1.5*y);assert.equal(bestMix,70);
 assert.equal(150000/(50*.4),7500);assert.equal(360*24/1440,6);
 near(1/(.3*.3+.6*.5+.1*.2),2.4390243902439024);
 assert.equal(.8*75+.2*1500,360);near(.94*.9*.94,.79524);
 let end=0;assert.deepEqual([[0,6],[2,4],[4,9],[5,7]].map(([arrival,burst])=>{const start=Math.max(end,arrival);end=start+burst;return start-arrival;}),[0,4,6,14]);
 assert.equal(Math.floor(512e6/11000/60),775);
 for(let mask=0;mask<8;mask++){const x=!!(mask&4),y=!!(mask&2),z=!!(mask&1);assert.equal(!(x&&y)||!z,!(x&&y&&z));}
 for(const x of [0,1])for(const y of [0,1])assert.equal(x?1-y:y,x^y);
});

test('FE archive SQL is executed on disposable memory databases',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec("CREATE TABLE MidtermTest(Class,Subject,StudentNumber,Name,Score); INSERT INTO MidtermTest VALUES(2,1,1,'A',20),(1,2,1,'B',40),(1,2,2,'C',80),(1,1,1,'D',90);");
  assert.deepEqual(db.prepare('SELECT Class,Subject,AVG(Score) AS AverageScore FROM MidtermTest GROUP BY Class,Subject ORDER BY Class,Subject').all().map(r=>Object.values(r)),[[1,1,90],[1,2,60],[2,1,20]]);
  db.exec("CREATE TABLE EMP(EID,Ename,DNO,Salary); CREATE TABLE DEPT(DNO); CREATE TABLE DEPT_LOCS(DNO,Region); INSERT INTO EMP VALUES(11,'John Bate',1,20000),(12,'Mohammed Karim',2,40000),(13,'Sadat Hossain',1,50000),(14,'Katherine Li',3,20000),(15,'Shuvashish Bose',3,40000); INSERT INTO DEPT VALUES(1),(2),(3); INSERT INTO DEPT_LOCS VALUES(1,'L1'),(1,'L3'),(2,'L2'),(3,'L3'),(3,'L2');");
  // SQLite EXCEPT is the set-difference equivalent of this source's MINUS.
  assert.deepEqual(db.prepare("SELECT Ename,Salary FROM EMP WHERE DNO IN (SELECT DNO FROM DEPT EXCEPT SELECT DNO FROM DEPT_LOCS WHERE Region='L2')").all().map(r=>Object.values(r)),[['John Bate',20000],['Sadat Hossain',50000]]);
 }finally{db.close();}
});

test('FE April 2024 B: exhaustive digit/time/bit boundaries, stack and brackets',()=>{
 const grade=s=>s>=80?'D':s>=50?'P':'F';for(let s=0;s<=100;s++)assert.equal(grade(s),s<50?'F':s<80?'P':'D');
 for(let age=0;age<=120;age++)for(const member of [false,true])assert.equal(age<=10||age>=60||member,!(age>10&&age<60&&!member));
 for(let n=0;n<10000;n++){let x=n,sum=0;while(x>0){sum+=x%10;x=Math.floor(x/10);}assert.equal(sum,[...String(n)].reduce((s,d)=>s+Number(d),0));}
 for(let n=0;n<86400;n++){const s=n%60,m=Math.floor(n/60)%60,h=Math.floor(n/3600);assert.equal(3600*h+60*m+s,n);assert.ok(m<60&&s<60&&h<24);}
 for(let b=0;b<256;b++){let count=0;for(let i=1;i<=8;i++)if(b&(1<<(i-1)))count++;assert.equal(count,[...b.toString(2)].filter(c=>c==='1').length);}
 const content=new Array(5);let index=1;const push=v=>{if(index>4)return false;content[index++]=v;return true;},pop=()=>index===1?-1:content[--index];
 assert.deepEqual([1,2,3,4,5].map(push),[true,true,true,true,false]);assert.deepEqual(Array.from({length:5},pop),[4,3,2,1,-1]);
 const balanced=s=>{const stack=[],pairs={'(':')','[':']','{':'}'};for(const c of s){if(pairs[c])stack.push(c);else if(!stack.length||pairs[stack.pop()]!==c)return false;}return stack.length===0;};
 assert.deepEqual(['','({})[]','({}[]','({)}[]','([)]',')','('].map(balanced),[true,true,false,false,false,false,false]);
 const cosine=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0)/Math.sqrt(a.reduce((s,x)=>s+x*x,0)*b.reduce((s,x)=>s+x*x,0));near(cosine([2,2,1,0,4],[3,1,1,1,2]),.85);
 const sine=x=>{let v=x,k=1,sum=v;while(Math.abs(v)>1e-7){k+=2;v=-v*x*x/((k-1)*k);sum+=v;}return sum;};for(let i=-31;i<=31;i++)near(sine(i/10),Math.sin(i/10),1e-8);
});

test('FE October 2024 B: maxima, factorisation, LCS, priority queue, DFS and sorting',()=>{
 assert.deepEqual([.7*5000+.02*100000,.3*5000+.98*100000],[5500,99500]);
 for(const a of perm([-9,-4,0,7,10])){let max1=-Infinity,max2=-Infinity;for(const x of a)if(x>max1){max2=max1;max1=x;}else if(x>max2)max2=x;assert.equal(max2,7);}
 for(let n=2;n<300;n++){let x=n,i=2,f=[];do{if(x%i===0){x=Math.floor(x/i);f.push(i);}else i++;}while(x>1);assert.equal(f.reduce((a,b)=>a*b,1),n);for(const p of f)assert.ok(!Array.from({length:p-2},(_,k)=>k+2).some(d=>p%d===0));}
 const lcs=(a,b,m=a.length,n=b.length)=>!m||!n?0:a[m-1]===b[n-1]?1+lcs(a,b,m-1,n-1):Math.max(lcs(a,b,m,n-1),lcs(a,b,m-1,n));assert.equal(lcs('ABXDZ','ABCD'),3);
 const subs=s=>Array.from({length:1<<s.length},(_,mask)=>[...s].filter((_,i)=>mask&(1<<i)).join(''));
 const strings=['',...Array.from({length:32},(_,i)=>i.toString(2).padStart(5,'0'))];for(const a of strings)for(const b of strings){const bs=new Set(subs(b));assert.equal(lcs(a,b),Math.max(...subs(a).filter(s=>bs.has(s)).map(s=>s.length)));}
 let queue=[],serial=0;const en=(s,p)=>queue.push({s,p,n:serial++}),de=()=>{queue.sort((a,b)=>a.p-b.p||a.n-b.n);return queue.shift().s;};
 en('E',3);en('F',2);en('G',1);en('H',1);de();de();en('I',1);en('J',1);de();en('K',2);en('L',3);en('M',1);assert.deepEqual(Array.from({length:6},de),['J','M','F','K','E','L']);
 assert.deepEqual(dfs({1:[2,4],2:[1,3,5],3:[2],4:[1,5],5:[2,4]},1),[1,2,3,5,4]);
 for(const input of [...perm([1,2,3,4,5]),[2,1,2,1],[-5,-8,0]]){const a=[...input];for(let i=1;i<a.length;i++){let k=i;while(k>0){if(a[k-1]<=a[k])break;[a[k],a[k-1]]=[a[k-1],a[k]];k--;}}assert.deepEqual(a,[...input].sort((a,b)=>a-b));}
});

test('FE October 2024 B: hash wrap, quantile convention, Markov product and extended Hamming',()=>{
 const table=Array(1001).fill(undefined);const insert=k=>{let i=k%1000+1;while(table[i]!==undefined)i=i===1000?1:i+1;table[i]=k;return i;};assert.deepEqual([999,1999,2999].map(insert),[1000,1,2]);
 assert.deepEqual([0,.25,.5,.75,1].map(q=>Array.from({length:10},(_,i)=>(i+1)/10)[Math.floor(q*9)]),[.1,.3,.5,.7,1]);
 const p=[[.3,.4,.3],[.2,.7,.1],[.25,.5,.25]],mul=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((s,x,k)=>s+x*b[k][j],0)));
 const p3=mul(mul(p,p),p);for(const row of p3)near(row.reduce((a,b)=>a+b),1);
 let enumeration=0;for(let i=0;i<3;i++)for(let j=0;j<3;j++)enumeration+=p[1][i]*p[i][j]*p[j][0];near(p3[1][0],enumeration);
 const h=(a,b)=>Array.from({length:Math.min(a.length,b.length)},(_,i)=>a[i]!==b[i]?1:0).reduce((s,v)=>s+v,0)+Math.abs(a.length-b.length);
 assert.equal(h('101010','111000111'),5);assert.equal(h('111000111','101010'),5);assert.equal(h('','abc'),3);
 assert.equal(Math.floor(9*Math.log2(62)),53);
});

test('FE April 2025 A: official A6 discrepancy, masked bits, timing and conditions',()=>{
 for(let x=0;x<256;x++)assert.equal(x&0xf0,Math.floor(x/16)*16);
 assert.equal(parseInt('10111',2)+.25+.125,23.375);
 assert.deepEqual(dfs({A:['B'],B:['A','C','D'],C:['B','F'],D:['B','E','F'],E:['D'],F:['C','D']},'A'),['A','B','C','F','D','E']);
 for(const lang of ['ru','en','ja']){const l=itpecArchiveLesson('itpec-fe-2025-spring','A',6,lang);assert.match(l.core+l.detail,/d/);assert.ok(l.detail.includes('A')&&l.detail.includes('F'));}
 assert.equal(800/4,200);near((90-80)/((14-80)-(12-90)),5/6);near(.99-.81,.18);
 assert.equal(6*4096+8300%4096,24684);assert.equal(1024*768*3*10/1e6,23.59296);
 assert.equal([1,0,5,5].reduce((a,b)=>a+b)/4,2.75);
 near(14*30*.005,2.1);assert.equal((126000-6000)/6,20000);
});

test('FE April 2025 B: calendar, perfect numbers, gcd, Gray code, distance and series',()=>{
 const leap=y=>y%400===0?true:y%100===0?false:y%4===0;assert.equal(Array.from({length:400},(_,i)=>2000+i).filter(leap).length,97);
 const perfect=n=>{let sum=0;for(let k=1;k<=Math.floor(n/2);k++)if(n%k===0)sum+=k;return sum===n;};assert.deepEqual([1,6,12,28].map(perfect),[false,true,false,true]);
 let a=98,b=56,trace=[];while(a!==b){if(a>b)a-=b;else b-=a;trace.push([a,b]);}assert.deepEqual(trace,[[42,56],[42,14],[28,14],[14,14]]);
 for(let bin=0;bin<256;bin++){const gray=bin^(bin>>>1);let y=gray,z=gray;while(z){z>>>=1;y^=z;}assert.equal(y,bin);}
 const maxSub=a=>{let max=a[0]-1;for(let i=0;i<a.length;i++){let s=0;for(let j=i;j<a.length;j++){s+=a[j];max=Math.max(max,s);}}return max;};assert.equal(maxSub([-4,-2,-9]),-2);assert.equal(maxSub([-2,1,-3,4,-1,2,1,-5,4]),6);
 const cosine=degrees=>{const y=degrees*Math.PI/180;let term=1,sum=1,n=0;while(Math.abs(term)>1e-9){n++;term*=-y*y/(2*n*(2*n-1));sum+=term;}return sum;};for(const deg of [0,60,90,120,-60])near(cosine(deg),Math.cos(deg*Math.PI/180));
 assert.equal([1,5,3,1].reduce((s,x)=>s+x),10);assert.equal(Math.sqrt([1,5,3,1].reduce((s,x)=>s+x*x,0)),6);
 near(8/36+2*(3/36*3/9+4/36*4/10+5/36*5/11),244/495);
});
