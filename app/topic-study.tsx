'use client';
import {useEffect,useRef,useState} from 'react';
import index from '../data/roadmap-index.json';
import {examCatalog} from '../lib/exam-catalog';
import type {ExamPack,ExamQuestion} from '../lib/exam-session';
import {answerTopic,readTopicPractice,retryTopic,topicPracticeKey,type TopicPractice} from '../lib/topic-practice';
import {roadmapTopics,type RoadmapLanguage} from '../lib/roadmap-topics';
import {officialLesson} from './official-lessons';
import {feLesson} from './fe-lessons';
import {ipaLesson} from './ipa-lessons';
import {itpecArchiveLesson} from './itpec-archive-lessons';

function Example({pack,q,language}:{pack:ExamPack;q:ExamQuestion;language:RoadmapLanguage}){
 const l=(ru:string,en:string,ja:string)=>({ru,en,ja})[language];
 const [practice,setPractice]=useState<TopicPractice|null>(null),[error,setError]=useState(false);
 const key=topicPracticeKey(pack.id,q.id);
 useEffect(()=>{function sync(){try{setPractice(readTopicPractice(localStorage.getItem(key),q));setError(false);}catch{setPractice(s=>s??readTopicPractice(null,q));setError(true);}}sync();const listener=(e:StorageEvent)=>{if(e.key===key||e.key===null)sync();};window.addEventListener('storage',listener);return()=>window.removeEventListener('storage',listener);},[key,q]);
 function update(change:(s:TopicPractice)=>TopicPractice){if(!practice)return;let current=practice;try{const raw=localStorage.getItem(key);if(raw)current=readTopicPractice(raw,q);}catch{setError(true);}const next=change(current);setPractice(next);try{localStorage.setItem(key,JSON.stringify(next));setError(false);}catch{setError(true);}}
 const lesson=pack.system==='IPA'?ipaLesson(pack.level,q.part,q.number,language,pack.id):pack.year!==2026?itpecArchiveLesson(pack.id,q.part,q.number,language):pack.level==='FE'?feLesson(q.part,q.number,language):officialLesson(q.number,language);
 const disputed=(pack.id==='itpec-ip-2025-autumn'&&q.number===42)||(pack.id==='itpec-fe-2025-spring'&&q.part==='A'&&q.number===6);
 const pdf=pack.parts?.find(p=>p.id===q.part)?.questionPdf??`exams/${pack.id}/questions.pdf`;
 if(!practice)return <p role="status">{l('Загрузка практики…','Loading practice…','練習を読み込み中…')}</p>;
 return <div className="mt-5 space-y-5">
  <p className="text-sm text-muted-foreground">{q.source} · {l('Язык оригинала','Original language','原文の言語')}: {pack.originalLanguage==='ja'?l('японский','Japanese','日本語'):l('английский','English','英語')} · <a href={pdf} target="_blank" rel="noreferrer" className="underline">PDF</a> · <a href={pack.sourceUrl} target="_blank" rel="noreferrer" className="underline">{l('Официальный источник','Official source','公式出典')}</a></p>
  <p className="text-sm">{l('Решите пример или откройте разбор сразу. Это практика без таймера; она не меняет результаты экзаменов и чекбоксы роадмапа.','Solve the example or open its explanation immediately. Untimed practice does not change exam results or roadmap checkboxes.','解答するか、すぐに解説を開けます。時間制限はなく、試験結果やロードマップのチェックには影響しません。')}</p>
  {error&&<p role="alert">{l('Сохранение недоступно: прогресс останется только до закрытия страницы.','Storage unavailable: progress lasts only until this page closes.','保存できません。進捗はページを閉じるまで保持されます。')}</p>}
  <div className="space-y-4 rounded-xl border bg-white p-3" lang={pack.originalLanguage}>{(q.promptPages??[q.prompt]).map((a,i)=><img key={a.src} src={a.src} width={a.width} height={a.height} className="exam-prompt" alt={i?`${q.source} · ${i+1}`:q.promptText} loading="lazy"/>)}</div>
  <div className="space-y-3">{practice.order.map((id,i)=>{const o=q.options.find(o=>o.id===id)!;return <button key={id} disabled={practice.revealed} onClick={()=>update(s=>answerTopic(s,id))} className={'flex w-full items-center gap-4 rounded-xl border p-4 text-left disabled:opacity-100 '+(practice.revealed&&id===q.answerId?'border-teal-600 bg-teal-50':practice.answer===id?'border-red-500 bg-red-50':'bg-white')}><span className="font-bold text-slate-900">{String.fromCharCode(65+i)}</span><img className="min-w-0 max-w-full flex-1 object-contain object-left" style={{maxHeight:260}} src={o.image.src} width={o.image.width} height={o.image.height} alt={o.text} lang={pack.originalLanguage}/>{practice.revealed&&id===q.answerId&&<span className="text-sm text-teal-900">{l('По ключу','Official key','公式正解')}</span>}{practice.answer===id&&<span className="text-sm text-slate-900">{l('Ваш ответ','Your answer','あなたの解答')}</span>}</button>;})}</div>
  {!practice.revealed?<button className="rounded-xl border px-4 py-3" onClick={()=>update(s=>({...s,revealed:true}))}>{l('Открыть разбор без ответа','Show explanation without answering','解答せずに解説を見る')}</button>:<section aria-label={l('Разбор примера','Example explanation','例題の解説')} className="rounded-xl bg-primary/5 p-5">
   <p role="status" className="font-bold">{practice.answer===undefined?l('Разобранный пример','Worked example','解説付き例題'):practice.answer===q.answerId?l('Верно по официальному ключу','Correct according to the official key','公式正解と一致'):l('Неверно по официальному ключу — изучите объяснение ниже','Incorrect according to the official key — study the explanation below','公式正解と不一致：以下の解説を確認してください')}</p>
   {disputed&&<p role="note" className="mt-3 rounded-lg bg-amber-100 p-3 text-amber-950">{l('В официальном ключе есть противоречие с условием. Здесь сохранён опубликованный ключ; см. подробности в разборе.','The official key conflicts with the question. The published key is preserved here; see the detailed explanation.','公式正解と問題文に矛盾があります。公開キーを保持しています。詳細は解説を参照してください。')}</p>}
   {lesson?<><p className="mt-4 leading-7">{lesson.core}</p><details className="mt-4" open><summary className="cursor-pointer font-semibold">{l('Подробное объяснение','Detailed explanation','詳しい解説')}</summary><p className="mt-3 whitespace-pre-line leading-7">{lesson.detail}</p></details><p className="mt-4 text-sm"><strong>{l('Что изучить дальше: ','Study next: ','次に学ぶこと：')}</strong>{lesson.next}</p><a className="mt-4 block text-primary underline" href={`https://www.google.com/search?q=${encodeURIComponent(lesson.search)}`} target="_blank" rel="noreferrer">{lesson.search} ↗</a>{lesson.sources?.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="mt-2 block text-sm underline">{s.title} ↗</a>)}</>:<p role="alert">{l('Разбор не найден.','Explanation unavailable.','解説が見つかりません。')}</p>}
   <button className="mt-5 rounded-xl border px-4 py-3" onClick={()=>update(retryTopic)}>{l('Повторить с новым порядком ответов','Retry with shuffled answers','選択肢を並べ替えて再挑戦')}</button>
  </section>}
 </div>;
}

export default function TopicStudy({topicIds,initial,system='all',level='all',language,onClose}:{topicIds:string[];initial:string;system:string;level:string;language:RoadmapLanguage;onClose:()=>void}){
 const l=(ru:string,en:string,ja:string)=>({ru,en,ja})[language];
 const [topicId,setTopicId]=useState(initial),[refIndex,setRefIndex]=useState(0),[pack,setPack]=useState<ExamPack|null>(null),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 const heading=useRef<HTMLHeadingElement>(null);
 const topics=topicIds.map(id=>index.topics.find(t=>t.id===id)!).filter(Boolean).map(t=>({...t,refs:t.refs.filter(r=>(system==='all'||r.system===system)&&(level==='all'||r.level===level))}));
 const topic=topics.find(t=>t.id===topicId)??topics[0],reference=topic.refs[refIndex]??topic.refs[0];
 useEffect(()=>{heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:'start',behavior:'smooth'});},[]);
 useEffect(()=>{let active=true;setPack(null);setFailed(false);const entry=examCatalog.find(p=>p.id===reference.pack);if(!entry){setFailed(true);return;}entry.load().then(data=>{if(active)setPack(data.default as ExamPack);}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[reference.pack,retry]);
 const q=pack?.id===reference.pack?pack.questions.find(q=>q.id===reference.question):undefined;
 function select(id:string){setTopicId(id);setRefIndex(0);}
 const group=roadmapTopics.find(g=>g.id===topic.group)!;
 const position=topics.findIndex(t=>t.id===topic.id);
 return <section className="mx-auto mb-10 max-w-6xl rounded-2xl border bg-card p-5 sm:p-8">
  <div className="flex items-start justify-between gap-4"><h2 ref={heading} tabIndex={-1} className="scroll-mt-24 text-2xl font-bold">{group[language][0]} · {l('Примеры и практика','Examples and practice','例題と練習')}</h2><button onClick={onClose} className="underline">{l('Закрыть','Close','閉じる')}</button></div>
  <p className="mt-3 leading-7 text-muted-foreground">{group[language][1]}</p>
  <label className="mt-5 block text-sm font-semibold">{l('Тема','Topic','テーマ')}<select value={topic.id} onChange={e=>select(e.target.value)} className="mt-2 w-full rounded-xl border bg-background p-3">{topics.map(t=><option key={t.id} value={t.id}>{t[language]}</option>)}</select></label>
  <label className="mt-4 block text-sm font-semibold">{l('Официальный пример','Official example','公式例題')}<select value={refIndex} onChange={e=>setRefIndex(Number(e.target.value))} className="mt-2 w-full rounded-xl border bg-background p-3">{topic.refs.map((r,i)=><option key={r.pack+r.question} value={i}>{r.pack} · {'part' in r?r.part:'Q'}{r.number}</option>)}</select></label>
  <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><button disabled={position===0} className="underline disabled:opacity-40" onClick={()=>select(topics[position-1].id)}>{l('Предыдущая тема','Previous topic','前のテーマ')}</button><span>{position+1}/{topics.length}</span><button disabled={position===topics.length-1} className="underline disabled:opacity-40" onClick={()=>select(topics[position+1].id)}>{l('Следующая тема','Next topic','次のテーマ')}</button></div>
  {failed||pack&&!q?<p role="alert" className="mt-5">{l('Не удалось загрузить пример.','Could not load this example.','例題を読み込めませんでした。')} <button className="underline" onClick={()=>setRetry(n=>n+1)}>{l('Повторить загрузку','Retry loading','再読み込み')}</button></p>:pack&&q?<Example key={pack.id+q.id} pack={pack} q={q} language={language}/>:<p role="status" className="mt-5">{l('Загрузка примера…','Loading example…','例題を読み込み中…')}</p>}
 </section>;
}
