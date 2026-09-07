import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';

test('IP April: binary, recall, dice, bill, reliability, backup, critical path and profit',()=>{
 assert.equal((0b1011*0b101).toString(2),'110111');
 assert.equal(5/(5+5),.5);assert.equal(5/(5+15),.25);
 let noOne=0;for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)for(let c=1;c<=6;c++)if(a!==1&&b!==1&&c!==1)noOne++;
 assert.equal(noOne,125);
 const bill=n=>n<=100?n*10:(n-100)*15+100*10;
 assert.deepEqual([0,99,100,101,120].map(bill),[0,990,1000,1015,1300]);
 assert.equal(((1-.2**2)*.9).toFixed(2),'0.86');
 assert.equal((4*1000*3+6000*3)/10/60,50);
 assert.equal(Math.max(2+4+3,4+3,7+1)-Math.max(2+4,4+3,7+1),1);
 assert.equal((10*9/2)/(6*5/2),3);
 assert.equal((1350*1100-1000*1100)/500000*100,77);
});

test('FE October A: IEEE754, shift, seating, automaton, timings and logic',()=>{
 const bits='01000001011000000000000000000000';
 const buffer=new ArrayBuffer(4),view=new DataView(buffer);view.setUint32(0,parseInt(bits,2));assert.equal(view.getFloat32(0),14);
 for(let n=-100;n<=100;n++)assert.equal((n<<3)+n,9*n);
 let adjacent=0,total=0;
 function perm(xs,p=[]){if(!xs.length){total++;const pos=[0,1,2].map(v=>p.indexOf(v));if(Math.max(...pos)-Math.min(...pos)===2)adjacent++;return;}xs.forEach((v,i)=>perm(xs.filter((_,j)=>i!==j),[...p,v]));}
 perm([0,1,2,3,4,5,6]);assert.equal(adjacent,720);assert.equal(total,5040);
 const machine=[[[0,'0'],[1,'0']],[[0,'0'],[2,'1']],[[0,'0'],[2,'1']]];
 let state=0,out='';for(const ch of '0011001110'){let next=machine[state][Number(ch)];state=next[0];out+=next[1];}assert.equal(out,'0001000110');
 assert.equal(5-(3*.5+1.5),2);
 assert.equal(5+.1+60000/6000/2+16/1024*1000,25.725);
 let elapsed=0;assert.equal([10,6,2,8,4].map(n=>elapsed+=n).reduce((a,b)=>a+b,0)/5,20);
 for(const a of [false,true])for(const b of [false,true]){
  const upper=!(!a&&b),lower=!(a||b);assert.equal(!(upper||lower),!a&&b);
 }
 assert.equal(2000*.04*.2*.2*20000,64000);
 const afterA=15,lower=Math.max(10,afterA+15),beforeE=Math.max(afterA+10,lower);
 assert.equal(Math.max(beforeE+15+10,lower+15+5),55);
 assert.equal((50000+4*70000+120000)/6,75000);
 assert.equal(30*16*.01,4.8);
});

test('FE October SQL executes all four alternatives on isolated fixtures',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec("CREATE TABLE Departments(department_id INTEGER,department_name TEXT,location TEXT);CREATE TABLE Employees(employee_id INTEGER,employee_name TEXT,salary INTEGER,department_id INTEGER);INSERT INTO Departments VALUES(1,'A','New York'),(2,'B','New York'),(3,'C','Boston');INSERT INTO Employees VALUES(1,'Ann',100,1),(2,'Bob',200,2),(3,'Cy',300,3);");
  const query=op=>`SELECT employee_name FROM Employees WHERE department_id ${op} (SELECT department_id FROM Departments WHERE location='New York') ORDER BY employee_id`;
  assert.deepEqual(db.prepare(query('IN')).all().map(r=>r.employee_name),['Ann','Bob']);
  assert.deepEqual(db.prepare(query('NOT IN')).all().map(r=>r.employee_name),['Cy']);
  assert.throws(()=>db.prepare("SELECT employee_name FROM Employees WHERE department_id IN (SELECT department_id FROM Employees WHERE location='New York')"));
  // The fourth option also references location in Employees, absent in the supplied schema.
  assert.equal(db.prepare("SELECT count(*) AS n FROM pragma_table_info('Employees') WHERE name='location'").get().n,0);
 }finally{db.close();}
});

test('FE October B1–B5: even sums, mode, contiguous sum, digit reversal and primes',()=>{
 const even=(arr,k,m)=>{let s=0;for(let i=k-1;i<m;i++)if(arr[i]%2===0)s+=arr[i];return s;};
 assert.equal(even([7,4,3,8,2],2,4),12);
 const mode=arr=>{let m=arr[0],mc=1;for(let i=0;i<arr.length-1;i++){let c=1;for(let j=i+1;j<arr.length;j++)if(arr[i]===arr[j])c++;if(mc<c){mc=c;m=arr[i];}}return m;};
 assert.equal(mode([2,1,1,9,6,6,2,5,6]),6);assert.equal(mode([2,1,1,2]),2);assert.equal(mode([9]),9);
 const sub=(arr,target)=>{for(let s=0;s<arr.length;s++){let sum=0;for(let e=s;e<arr.length;e++){sum+=arr[e];if(sum===target)return[s+1,e+1];if(sum>target)break;}}return null;};
 assert.deepEqual(sub([6,3,2,5,1,1,7,3],14),[4,7]);assert.equal(sub([2,4],3),null);assert.deepEqual(sub([2,4],4),[2,2]);
 const reverse=n=>{let temp=n,rev=0;while(temp>0){rev=rev*10+temp%10;temp=Math.floor(temp/10);}return rev;};
 for(let n=1;n<10000;n++)if(n%10!==0)assert.equal(reverse(n),Number(String(n).split('').reverse().join('')));
 const primes=N=>{let result=[];for(let n=2;result.length<N;n++){let prime=true;for(let d=2;d<=Math.floor(Math.sqrt(n));d++)if(n%d===0){prime=false;break;}if(prime)result.push(n);}return result;};
 assert.deepEqual(primes(6),[2,3,5,7,11,13]);assert.ok(!primes(20).includes(49));
});

test('FE October B7–B13: linked lists, stack, BFS, sorting, substring and BST',()=>{
 const list={v:1,next:{v:2,next:{v:3,next:undefined}}};
 const reverse=(head,prev)=>{const result=head.next?reverse(head.next,head):head;head.next=prev;return result;};
 const values=head=>{let out=[];for(let n=head;n;n=n.next){assert.ok(out.length<20);out.push(n.v);}return out;};
 const head=reverse(list,undefined);assert.deepEqual(values(head),[3,2,1]);
 const insert=(head,target,v)=>{for(let x=head;x;x=x.next)if(x.v===target){const y={v,next:x.next};x.next=y;break;}};
 insert(head,2,9);assert.deepEqual(values(head),[3,2,9,1]);insert(head,100,5);assert.deepEqual(values(head),[3,2,9,1]);
 let tos=0,stack=Array(11);const push=x=>{if(tos===10)return false;stack[++tos]=x;return true;};const pop=()=>tos<1?undefined:stack[tos--];
 assert.equal(pop(),undefined);for(let i=1;i<=10;i++)assert.equal(push(i),true);assert.equal(push(11),false);for(let i=10;i>=1;i--)assert.equal(pop(),i);
 const graph=[[0,1,0,1,0],[1,0,1,0,1],[0,1,0,0,0],[1,0,0,0,1],[0,1,0,1,0]],queue=[0],visited=new Set([0]),out=[];
 while(queue.length){const v=queue.shift();out.push(v+1);for(let i=0;i<5;i++)if(graph[v][i]&&!visited.has(i)){queue.push(i);visited.add(i);}}
 assert.deepEqual(out,[1,2,4,3,5]);
 const bubble=xs=>{let a=[...xs],max=a.length-1,ex=true,passes=0;while(max>0&&ex){ex=false;for(let i=0;i<max;i++)if(a[i]>a[i+1]){[a[i],a[i+1]]=[a[i+1],a[i]];ex=true;}max--;passes++;}return{a,passes};};
 const xs=[18,1,8,6,2,9,12,14,7,11];assert.deepEqual(bubble(xs).a,[...xs].sort((a,b)=>a-b));assert.equal(bubble(xs).passes,6);assert.deepEqual(bubble([2,1]).a,[1,2]);
 const contains=(s,p)=>{for(let i=0;i<=s.length-p.length;i++){let j=0;while(j<p.length&&s[i+j]===p[j])j++;if(j===p.length)return true;}return false;};
 for(const s of ['a','apple','aaaa','abab'])for(const p of ['a','e','ple','ae','applx','aa','abab','longpattern'])assert.equal(contains(s,p),s.includes(p));
 const add=(n,k)=>!n?{key:k}:k<n.key?(n.left=add(n.left,k),n):(n.right=add(n.right,k),n);
 const remove=(node,key)=>{if(!node)return undefined;if(key<node.key)node.left=remove(node.left,key);else if(key>node.key)node.right=remove(node.right,key);else if(!node.right)return node.left;else{let successor=node.right;while(successor.left)successor=successor.left;node.key=successor.key;node.right=remove(node.right,successor.key);}return node;};
 const inorder=n=>n?[...inorder(n.left),n.key,...inorder(n.right)]:[];
 for(const key of [1,2,3,4,5,6,7,99]){let root;for(const v of [4,2,6,1,3,5,7])root=add(root,v);assert.deepEqual(inorder(remove(root,key)),[1,2,3,4,5,6,7].filter(v=>v!==key));}
});

test('FE October B14–B16: magic square, exact IDF variant and all nonempty set unions',()=>{
 const magic=m=>{let rows=[0,0,0],cols=[0,0,0],d1=0,d2=0;for(let i=0;i<3;i++){for(let j=0;j<3;j++){rows[i]+=m[i][j];cols[i]+=m[j][i];}d1+=m[i][i];d2+=m[i][2-i];}return d1===d2&&rows.every((r,i)=>r===cols[i]&&r===d1);};
 assert.equal(magic([[4,9,2],[3,5,7],[8,1,6]]),true);assert.equal(magic([[9,4,2],[3,5,7],[8,1,6]]),false);
 const corpus=['ITPEC includes members from 6 countries','many students prepare for the exam','The ITPEC exam is essential for IT professionals'];
 const idf=(term,docs)=>Math.log(docs.length/(1+docs.filter(d=>d.split(' ').includes(term)).length));
 assert.equal(idf('ITPEC',corpus),0);assert.equal(idf('ITPEC',['ITPEC ITPEC','none']),0);assert.ok(idf('ITPEC',['ITPEC'])<0);
 const jac=(a,b)=>{let intersection=0,union=b.length;for(const v of a){if(b.includes(v))intersection++;else union++;}return intersection/union;};
 for(let a=0;a<16;a++)for(let b=0;b<16;b++)if(a||b){const A=[0,1,2,3].filter(n=>a&(1<<n)),B=[0,1,2,3].filter(n=>b&(1<<n));assert.equal(jac(A,B),A.filter(n=>B.includes(n)).length/new Set([...A,...B]).size);}
});
