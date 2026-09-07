'use client';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, BookOpenCheck, Check, ShieldCheck, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uiCopy, type UiLanguage } from './kiso-i18n';
import { loadExam } from '@/lib/exam-catalog';
import { readStorage, storageKey, summarize, type ExamMode, type ExamPack, type ExamStorage } from '@/lib/exam-session';
import type { OfficialEntry } from './official-exams';
const OfficialExams=lazy(()=>import('./official-exams'));
const emptyStorage:ExamStorage={version:1,active:null,history:[]};

export default function Page(){
  const [language,setLanguage]=useState<UiLanguage>('ru');
  const [system,setSystem]=useState('ITPEC'),[level,setLevel]=useState('IP'),[year,setYear]=useState(2026);
  const [mode,setMode]=useState<ExamMode>('learn');
  const [profilePack,setProfilePack]=useState<ExamPack|null>(null);
  const [storage,setStorage]=useState<ExamStorage>(emptyStorage);
  const [loaded,setLoaded]=useState(false),[loadError,setLoadError]=useState(false),[storageError,setStorageError]=useState(false),[retry,setRetry]=useState(0);
  const [entry,setEntry]=useState<(OfficialEntry&{pack:ExamPack})|null>(null);
  const t=uiCopy[language];
  const label=(ru:string,en:string,ja:string)=>({ru,en,ja})[language];
  const profileMatches=profilePack?.system===system&&profilePack.level===level;
  const pack=profileMatches&&profilePack?.year===year?profilePack:null;
  const modeName=(m:ExamMode)=>m==='learn'?t.learn:m==='mock'?t.mock:t.exam;
  const count=pack?.questions.length??0;
  const paperLabel=label('Апрель 2026','April 2026','2026年4月');
  const format=level==='IP'?label('100 вопросов · 120 минут · одна часть','100 questions · 120 minutes · one section','100問・120分・1科目'):label('A: 60 вопросов / 90 минут · B: 20 вопросов / 100 минут','A: 60 questions / 90 minutes · B: 20 questions / 100 minutes','A：60問・90分／B：20問・100分');
  useEffect(()=>{try{const s=localStorage.getItem('kiso-language');if(s==='ru'||s==='en'||s==='ja')setLanguage(s);}catch{}},[]);
  function changeLanguage(v:UiLanguage){setLanguage(v);try{localStorage.setItem('kiso-language',v);}catch{}}
  function refresh(p:ExamPack){try{setStorage(readStorage(localStorage.getItem(storageKey(p)),p));setStorageError(false);}catch{setStorage(emptyStorage);setStorageError(true);}}
  useEffect(()=>{
    let alive=true;setLoaded(false);setLoadError(false);setProfilePack(null);setStorage(emptyStorage);
    loadExam(system,level,2026).then(p=>{if(!alive)return;setProfilePack(p);if(p)refresh(p);setLoaded(true);}).catch(()=>{if(alive){setLoadError(true);setLoaded(true);}});
    return()=>{alive=false;};
  },[system,level,retry]);
  useEffect(()=>{function sync(){if(profilePack)refresh(profilePack);}window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[profilePack]);
  const completed=profileMatches?storage.history:[];
  const progress=profilePack?completed.reduce((s,a)=>{const r=summarize(profilePack,a);return {answered:s.answered+r.answered,correct:s.correct+r.correct};},{answered:0,correct:0}):{answered:0,correct:0};
  if(entry)return <Suspense fallback={<p className="p-8" role="status">{label('Загрузка экзамена…','Loading exam…','試験を読み込み中…')}</p>}><OfficialExams key={entry.pack.id} pack={entry.pack} language={language} onLanguage={changeLanguage} entry={entry} onExit={()=>{setEntry(null);refresh(entry.pack);}}/></Suspense>;
  return <main lang={language} className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8"><div className="flex items-center gap-3 font-bold"><BookOpenCheck className="size-7 text-primary"/><span>Kiso<small className="block text-[9px] tracking-[.2em] text-muted-foreground">IT EXAM LAB</small></span></div><div className="global-language-switch" aria-label="Interface language">{(['ru','en','ja'] as UiLanguage[]).map(l=><button key={l} className={l===language?'active':''} onClick={()=>changeLanguage(l)}>{l==='ja'?'日本語':l.toUpperCase()}</button>)}</div></div></header>
    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[1fr_370px] lg:px-8 lg:py-14">
      <div><p className="text-sm font-semibold text-primary">{t.badge}</p><h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{t.heroA}<br/><span className="text-primary">{t.heroB}</span></h1><p className="mt-5 leading-7 text-muted-foreground">{t.intro}</p>
        <div className="mt-10 space-y-8">
          <ChoiceSection number="01" title={t.system}><div className="grid gap-3 sm:grid-cols-2">{['ITPEC','IPA'].map(s=><ChoiceCard key={s} active={system===s} onClick={()=>setSystem(s)} title={s} description={s==='ITPEC'?'ITPEC Common Examination':'IPA Japan Examination'}/>)}</div><p className="mt-3 text-sm text-primary">{t.examLanguage}: {system==='ITPEC'?t.english:t.japanese}</p></ChoiceSection>
          <ChoiceSection number="02" title={t.level}><div className="grid gap-3 sm:grid-cols-2">{['IP','FE'].map(l=><ChoiceCard key={l} active={level===l} onClick={()=>setLevel(l)} title={l} description={l==='IP'?'IT Passport · Level 1':'Fundamental Engineer · Level 2'}/>)}</div><p className="mt-3 text-sm text-muted-foreground">{format}</p></ChoiceSection>
          <ChoiceSection number="03" title={t.year}><div className="grid grid-cols-3 gap-3">{[2026,2025,2024].map(y=><button key={y} className={'choice-card '+(year===y?'choice-card-active':'')} aria-pressed={year===y} onClick={()=>setYear(y)}><strong>{y}</strong></button>)}</div>
            <div className="mt-4 rounded-xl border p-4 text-sm leading-6" role="status">{!loaded?label('Загрузка…','Loading…','読み込み中…'):loadError?<>{label('Не удалось загрузить вопросы.','Could not load questions.','問題を読み込めませんでした。')} <button className="text-primary underline" onClick={()=>setRetry(v=>v+1)}>{label('Повторить','Retry','再試行')}</button></>:pack?<><strong>{paperLabel} · {count} {label('вопросов','questions','問')}</strong><p>{label('Оригинальные задания и официальный ключ.','Original questions and official answer key.','原文の問題と公式正解。')}</p><p>{level==='IP'?label('Подробные разборы: 100/100.','Detailed lessons: 100/100.','詳しい解説：100/100。'):label('Все 80 оригиналов готовы. Подробные разборы FE ещё не добавлены; обучение пока показывает официальный ответ.','All 80 originals are ready. Detailed FE lessons are not added yet; learning currently reveals the official answer.','原文80問を収録。FEの詳しい解説は未追加で、学習では公式正解を表示します。')}</p></>:label('Полные вопросы ещё не перенесены. Учебных подмен нет.','Full questions have not been imported yet. No sample is substituted.','全問題は未収録です。短いサンプルへの置換はありません。')}</div>
          </ChoiceSection>
          <ChoiceSection number="04" title={t.mode}><div className="grid gap-3 sm:grid-cols-3">{(['learn','mock','exam'] as ExamMode[]).map(m=><ChoiceCard key={m} active={mode===m} onClick={()=>setMode(m)} title={modeName(m)} description={m==='learn'?t.learnDesc:m==='mock'?t.mockDesc:t.examDesc}/>)}</div></ChoiceSection>
        </div>
      </div>
      <aside className="lg:pt-20"><div className="sticky top-28 overflow-hidden rounded-3xl border bg-card shadow-[0_25px_70px_rgba(15,35,42,.09)]"><div className="bg-[var(--ink)] p-6 text-white"><p className="text-sm">{t.session}</p><p className="mt-6 text-3xl font-bold">{system} / {level}</p><p className="mt-2 text-white/70">{year} · {modeName(mode)}</p></div><div className="space-y-5 p-6">
        <div className="flex gap-3"><ShieldCheck className="size-5 shrink-0 text-primary"/><p className="text-sm leading-6">{format}{level==='FE'&&<span className="mt-2 block">{label('Между A и B — пауза. Таймер B начнётся только после подтверждения.','Pause between A and B. B’s timer starts only after confirmation.','AとBの間は休憩。確認後にBの時計が始まります。')}</span>}</p></div>
        <div className="rounded-2xl bg-[var(--mint)] p-4"><p className="text-xs font-semibold">{t.localProgress}</p><strong className="mt-1 block text-2xl">{progress.answered}</strong><p className="text-xs">{t.answers} · {progress.answered?Math.round(progress.correct/progress.answered*100):0}% {t.correctShort}</p></div>
        {storageError&&<p role="alert" className="text-sm text-destructive">{label('Сохранение в браузере недоступно.','Browser storage is unavailable.','ブラウザに保存できません。')}</p>}
        <div><p className="mb-3 text-sm font-semibold">{t.examsByYear}</p>{[2026,2025,2024].map(y=>{const results=profilePack&&profilePack.year===y?completed.filter(a=>a.mode!=='learn').map(a=>summarize(profilePack,a)):[];return <div key={y} className="mb-2 flex justify-between rounded-xl border p-3"><div><strong>{y}</strong><p className="text-xs text-muted-foreground">{results.length?results.length+' '+t.attempts+' · '+t.best+' '+Math.max(...results.map(r=>r.percent))+'%':t.notTaken}</p></div>{results.some(r=>r.passed)&&<span className="flex gap-1 text-xs text-primary"><Trophy className="size-4"/>{t.passed}</span>}</div>;})}</div>
        <Button className="h-12 w-full" disabled={!loaded||!pack||!!storage.active} onClick={()=>{if(pack)setEntry({pack,mode});}}>{t.start}<ArrowRight/></Button>
        {pack&&storage.active&&<div className="rounded-xl border p-4"><p className="text-sm">{label('Сохранённая попытка','Saved attempt','保存済みの受験')} · {modeName(storage.active.mode)} · {Object.keys(storage.active.answers).length}/{count}{storage.active.stage&&' · '+(storage.active.stage==='break'?label('пауза','pause','休憩'):storage.active.stage)}</p><Button className="mt-3 w-full" variant="outline" onClick={()=>setEntry({pack,attemptId:storage.active!.id})}>{label('Продолжить','Resume','再開')}</Button></div>}
        {pack&&storage.history.length>0&&<details><summary className="cursor-pointer text-sm font-semibold">{label('История экзамена','Exam history','受験履歴')}</summary><div className="mt-3 space-y-2">{storage.history.map(a=><button key={a.id} className="w-full rounded-xl border p-3 text-left text-sm" onClick={()=>setEntry({pack,attemptId:a.id})}><strong>{paperLabel}</strong><span className="block">{modeName(a.mode)} · {summarize(pack,a).correct}/{count}</span><span className="text-xs text-muted-foreground">{new Date(a.finishedAt!).toLocaleString(language)}</span></button>)}</div></details>}
        <p className="text-xs leading-5 text-muted-foreground">{label('Прогресс хранится только в этом браузере. Kiso не является официальным сервисом ITPEC/IPA.','Progress stays in this browser. Kiso is not an official ITPEC/IPA service.','進捗はこのブラウザに保存されます。KisoはITPEC・IPAの公式サービスではありません。')}</p>
      </div></div></aside>
    </section>
  </main>;
}
function ChoiceSection({number,title,children}:{number:string;title:string;children:ReactNode}){return <section><div className="mb-3 flex items-center gap-3"><span className="font-mono text-xs font-bold text-primary">{number}</span><h2 className="text-sm font-semibold uppercase tracking-[.12em]">{title}</h2></div>{children}</section>;}
function ChoiceCard({active,onClick,title,description}:{active:boolean;onClick:()=>void;title:string;description:string}){return <button aria-pressed={active} onClick={onClick} className={'choice-card '+(active?'choice-card-active':'')}><span><strong>{title}</strong><small>{description}</small></span><span className="choice-check">{active&&<Check className="size-4"/>}</span></button>;}
