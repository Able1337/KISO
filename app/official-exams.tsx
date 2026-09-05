'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, CheckCircle2, Clock3, ExternalLink, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import packData from '@/data/exams/itpec-ip-2026-spring.json';
import { finishAttempt, guardedSave, makeAttempt, readStorage, secondsRemaining, STORAGE_KEY, summarize, type Attempt, type ExamMode, type ExamPack, type ExamStorage } from '@/lib/exam-session';
import type { UiLanguage } from './kiso-i18n';

const pack = packData as ExamPack;
const text = {
  ru: {
    paper:'ITPEC IP · апрель 2026', sync:'Попытка обновлена в другой вкладке. Показаны последние сохранённые ответы; повторите действие, если оно ещё нужно.',
    home:'К учебным вопросам', title:'Полные экзамены', intro:'Первый официальный вариант для подготовки к релизу.', language:'Язык экзамена: английский',
    ready:'Оригинал и ключ: 100 / 100', pending:'Переводы и учебные разборы готовятся. Этот вариант пока доступен на английском в пробном и экзаменационном режимах.',
    description:'ITPEC IP · апрель 2026 · 100 вопросов · 120 минут', source:'Официальный источник', notes:'Формулировки, таблицы и схемы перенесены из официального PDF. Буквы вариантов нормализованы, порядок ответов перемешивается. В оригинале Q64 содержит e вместо d, а Q71 — d вместо b; привязка проверена по официальному ключу.',
    mock:'Пробный экзамен', exam:'Экзамен с таймером', resume:'Продолжить', active:'Незавершённая попытка', saved:'Ответы сохраняются на этом устройстве. Таймер продолжает идти при закрытии страницы.',
    original:'Оригинал', interface:'Интерфейс', unavailable:'Перевод этого официального вопроса ещё не проверен. Показан английский оригинал.',
    question:'Вопрос', of:'из', answered:'Ответов', previous:'Назад', next:'Дальше', finish:'Завершить экзамен', confirm:'Завершить и показать результат', cancel:'Продолжить отвечать',
    finishWarning:'После завершения ответы изменить нельзя. Пропущенные вопросы считаются неверными.', leave:'Сохранить и выйти', reference:'Оригинальный PDF и справочник',
    navigation:'Навигация по вопросам', review:'Разбор всех ответов', correct:'Верно', incorrect:'Неверно', skipped:'Нет ответа', your:'Ваш ответ', right:'Правильный ответ',
    passed:'Учебный порог достигнут', failed:'Учебный порог не достигнут', grading:'Учебный расчёт: не менее 60% в целом и 30% в каждой области. Распределение вопросов по областям размечено по темам; результат не является официальной оценкой ITPEC.',
    technology:'Технологии', management:'Управление', strategy:'Стратегия', history:'Пройденные варианты', empty:'Завершённых попыток пока нет.', view:'Посмотреть результат', newAttempt:'К вариантам',
    storageError:'Браузер не разрешил сохранение. Ответы доступны только до закрытия этой страницы.', lostStorage:'Сохранение на этом устройстве', option:'Вариант', diagram:'Схема ответа', answerKey:'Официальный ключ',
  },
  en: {
    paper:'ITPEC IP · April 2026', sync:'This attempt changed in another tab. The latest saved answers are shown; repeat your action if still needed.',
    home:'Back to practice', title:'Full exams', intro:'The first official paper for the upcoming release.', language:'Exam language: English',
    ready:'Original and answer key: 100 / 100', pending:'Translations and learning explanations are in preparation. This paper is currently available in English in mock and timed modes.',
    description:'ITPEC IP · April 2026 · 100 questions · 120 minutes', source:'Official source', notes:'Wording, tables and figures come from the official PDF. Answer labels are normalized and options are shuffled. Source Q64 uses e instead of d; Q71 uses d instead of b. Answers are matched to the official key.',
    mock:'Mock exam', exam:'Timed exam', resume:'Resume', active:'Unfinished attempt', saved:'Answers are saved on this device. The timer continues when the page is closed.',
    original:'Original', interface:'Interface', unavailable:'A checked translation of this official question is not yet available. The English original is shown.',
    question:'Question', of:'of', answered:'Answered', previous:'Previous', next:'Next', finish:'Finish exam', confirm:'Finish and show results', cancel:'Keep answering',
    finishWarning:'Answers cannot be changed after finishing. Unanswered questions count as incorrect.', leave:'Save and exit', reference:'Original PDF and reference appendix',
    navigation:'Question navigation', review:'Review all answers', correct:'Correct', incorrect:'Incorrect', skipped:'Unanswered', your:'Your answer', right:'Correct answer',
    passed:'Practice threshold reached', failed:'Practice threshold not reached', grading:'Practice calculation: at least 60% overall and 30% in each field. Field assignments are editorial topic classifications; this is not an official ITPEC score.',
    technology:'Technology', management:'Management', strategy:'Strategy', history:'Completed papers', empty:'No completed attempts yet.', view:'View result', newAttempt:'Back to papers',
    storageError:'The browser could not save progress. Answers will only remain until this page is closed.', lostStorage:'Saved on this device', option:'Option', diagram:'Answer diagram', answerKey:'Official answer key',
  },
  ja: {
    paper:'ITPEC IP · 2026年4月', sync:'別のタブで受験データが更新されました。最新の保存済み解答を表示しています。必要に応じて操作を繰り返してください。',
    home:'練習問題へ戻る', title:'全問試験', intro:'正式リリースに向けた最初の公式問題セットです。', language:'試験言語：英語',
    ready:'原文・正解：100 / 100', pending:'翻訳と学習解説は準備中です。現在は英語での模擬試験と時間制限付き試験に対応しています。',
    description:'ITPEC IP · 2026年4月 · 100問 · 120分', source:'公式出典', notes:'問題文・表・図は公式PDFから取り込みました。選択肢の記号を正規化し、順序をシャッフルします。原本Q64のeはd、Q71の2番目のdはbに対応します。公式正解表と照合済みです。',
    mock:'模擬試験', exam:'時間制限付き試験', resume:'再開', active:'未完了の受験', saved:'解答はこの端末に保存されます。ページを閉じてもタイマーは進みます。',
    original:'原文', interface:'画面言語', unavailable:'この公式問題の確認済み翻訳は準備中のため、英語の原文を表示しています。',
    question:'問題', of:'/', answered:'解答済み', previous:'前へ', next:'次へ', finish:'試験を終了', confirm:'終了して結果を見る', cancel:'解答を続ける',
    finishWarning:'終了後は解答を変更できません。未解答は不正解として計算します。', leave:'保存して戻る', reference:'原本PDF・付録',
    navigation:'問題ナビゲーション', review:'全解答の確認', correct:'正解', incorrect:'不正解', skipped:'未解答', your:'あなたの解答', right:'正解',
    passed:'学習上の基準を達成', failed:'学習上の基準未達', grading:'学習用計算：総合60%以上かつ各分野30%以上。分野は問題内容に基づく編集上の分類であり、ITPECの公式採点結果ではありません。',
    technology:'テクノロジ', management:'マネジメント', strategy:'ストラテジ', history:'完了した試験', empty:'完了した受験はありません。', view:'結果を見る', newAttempt:'問題セットへ',
    storageError:'ブラウザーに保存できませんでした。解答はページを閉じるまで保持されます。', lostStorage:'この端末に保存', option:'選択肢', diagram:'解答の図', answerKey:'公式正解表',
  },
};

function timeLabel(seconds:number) { return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`; }

export default function OfficialExams({language, onLanguage, onExit}: {language:UiLanguage; onLanguage:(lang:UiLanguage)=>void; onExit:()=>void}) {
  const t=text[language];
  const [storage,setStorage]=useState<ExamStorage>({version:1,active:null,history:[]});
  const [attempt,setAttempt]=useState<Attempt|null>(null);
  const [loaded,setLoaded]=useState(false);
  const [storageError,setStorageError]=useState(false);
  const [syncNotice,setSyncNotice]=useState(false);
  const [now,setNow]=useState(Date.now());
  const [confirmFinish,setConfirmFinish]=useState(false);
  const [questionLanguage,setQuestionLanguage]=useState<'original'|'interface'>('original');

  useEffect(()=>{
    try { setStorage(readStorage(localStorage.getItem(STORAGE_KEY),pack)); } catch { setStorageError(true); }
    setLoaded(true);
  },[]);
  useEffect(()=>{
    function onStorage(event:StorageEvent) {
      if(event.storageArea!==localStorage || (event.key!==null&&event.key!==STORAGE_KEY)) return;
      acceptRemote(readStorage(event.newValue,pack));
    }
    window.addEventListener('storage',onStorage);
    return ()=>window.removeEventListener('storage',onStorage);
  },[]);
  const hasTimedAttempt=storage.active?.mode==='exam';
  useEffect(()=>{
    if(!hasTimedAttempt) return;
    const timer=window.setInterval(()=>setNow(Date.now()),500);
    return ()=>window.clearInterval(timer);
  },[hasTimedAttempt]);
  useEffect(()=>{
    // An expired saved exam is completed even when its user returns to the catalogue.
    const current=attempt?.status==='active'?attempt:storage.active;
    if(current?.deadline!==null&&current?.deadline!==undefined&&secondsRemaining(current,now)===0) {
      const ended=finishAttempt(current,current.deadline);
      void update(ended,attempt?.id===current.id);
      setConfirmFinish(false);
    }
  },[now,attempt,storage.active]);

  function acceptRemote(remote:ExamStorage) {
    setStorage(remote);setSyncNotice(true);setConfirmFinish(false);
    setAttempt(previous=>previous?(remote.history.find(a=>a.id===previous.id)??(remote.active?.id===previous.id?remote.active:null)):null);
  }
  async function update(next:Attempt,showAttempt=true) {
    function commit() {
      let latest=storage;
      try { latest=readStorage(localStorage.getItem(STORAGE_KEY),pack); } catch { setStorageError(true); }
      const saved=guardedSave(storage,storageError?storage:latest,next);
      if(saved.conflict) {acceptRemote(saved.storage);return;}
      try {localStorage.setItem(STORAGE_KEY,JSON.stringify(saved.storage));} catch {setStorageError(true);}
      setStorage(saved.storage);if(showAttempt)setAttempt(next);setSyncNotice(false);
    }
    // Web Locks serializes writes across same-origin tabs. The guard also protects
    // stale event handlers and provides a fallback where Web Locks is unavailable.
    if(navigator.locks) await navigator.locks.request(STORAGE_KEY,commit);
    else commit();
  }
  function start(mode:ExamMode) { const current=Date.now(); setNow(current); setQuestionLanguage('original'); update(makeAttempt(pack,mode,current)); }
  function finish() { if(attempt) update(finishAttempt(attempt,Date.now())); setConfirmFinish(false); }
  const result=attempt?summarize(pack,attempt):null;
  const q=attempt?pack.questions[attempt.index]:null;
  const remaining=attempt?secondsRemaining(attempt,now):null;

  return <main lang={language} className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
      <button onClick={onExit} className="flex items-center gap-3 font-bold" aria-label={t.home}><BookOpenCheck className="size-6 text-primary"/>Kiso</button>
      <div className="global-language-switch" aria-label="Interface language">{(['ru','en','ja'] as UiLanguage[]).map(l=><button key={l} className={l===language?'active':''} onClick={()=>onLanguage(l)}>{l==='ja'?'日本語':l.toUpperCase()}</button>)}</div>
    </div></header>
    <section className="mx-auto max-w-6xl px-5 py-8">
      {storageError&&<p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-4">{t.storageError}</p>}
      {syncNotice&&<p role="status" className="mb-4 rounded-xl bg-[var(--warm)] p-4 text-[var(--warm-ink)]">{t.sync}</p>}
      {!attempt&&<>
        <Button variant="ghost" onClick={onExit}><ArrowLeft/>{t.home}</Button>
        <h1 className="mt-5 text-3xl font-bold">{t.title}</h1><p className="mt-2 text-muted-foreground">{t.intro}</p>
        <article className="mt-6 rounded-3xl border bg-card p-6 sm:p-8">
          <Badge>{t.ready}</Badge><h2 className="mt-4 text-2xl font-semibold">{t.description}</h2><p className="mt-3 font-semibold text-primary">{t.language}</p>
          <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{t.pending}</p>
          <div className="mt-6 flex flex-wrap gap-3"><Button disabled={!loaded||!!storage.active} onClick={()=>start('mock')}>{t.mock}</Button><Button disabled={!loaded||!!storage.active} variant="outline" onClick={()=>start('exam')}><Clock3/>{t.exam}</Button></div>
          <p className="mt-4 text-sm text-muted-foreground">{t.saved}</p>
          <details className="mt-6 border-t pt-4"><summary className="cursor-pointer text-sm text-primary">{t.source}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{t.notes}</p><a className="mt-3 inline-flex items-center gap-1 text-primary underline" href={pack.sourceUrl} target="_blank" rel="noreferrer">ITPEC.org<ExternalLink className="size-4"/></a></details>
        </article>
        {storage.active&&<div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-[var(--mint)] p-5"><div><strong>{t.active}</strong><p className="mt-1 text-sm">{Object.keys(storage.active.answers).length} / 100 · {storage.active.mode==='exam'?t.exam:t.mock}</p></div><Button onClick={()=>{setNow(Date.now());setAttempt(storage.active);setQuestionLanguage('original');}}>{t.resume}<ArrowRight/></Button></div>}
        <h2 className="mt-10 text-xl font-semibold">{t.history}</h2>{storage.history.length===0?<p className="mt-3 text-muted-foreground">{t.empty}</p>:<div className="mt-4 space-y-3">{storage.history.map(a=>{const s=summarize(pack,a);return <button className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5 text-left" key={a.id} onClick={()=>setAttempt(a)}><span><strong>{t.paper}</strong><span className="mt-1 block text-sm text-muted-foreground">{new Date(a.finishedAt!).toLocaleString(language)} · {a.mode==='exam'?t.exam:t.mock}</span></span><span>{s.correct}/100 · {s.passed?t.passed:t.failed}<span className="mt-1 block text-sm text-primary">{t.view} →</span></span></button>;})}</div>}
      </>}
      {attempt&&attempt.status==='active'&&q&&<>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><Badge>{t.paper}</Badge><p className="mt-2 text-sm text-primary">{t.language}</p></div>{remaining!==null&&<div className="rounded-xl border bg-card px-4 py-3 font-mono text-xl" aria-label={t.exam}><Clock3 className="mr-2 inline size-5"/>{timeLabel(remaining)}</div>}</div>
        <div className="mt-5 flex items-center justify-between gap-2"><h1 className="text-lg font-semibold">{t.question} {q.number} {t.of} 100</h1><span className="text-sm text-muted-foreground">{t.answered}: {result!.answered}/100</span></div>
        <details className="mt-4 rounded-xl border bg-card p-3"><summary className="cursor-pointer font-medium">{t.navigation}</summary><div className="mt-3 grid grid-cols-10 gap-1.5">{pack.questions.map((item,i)=><button key={item.id} aria-label={`${t.question} ${item.number}`} aria-current={i===attempt.index?'step':undefined} className={`exam-nav ${attempt.answers[item.id]?'answered':''} ${i===attempt.index?'current':''}`} onClick={()=>update({...attempt,index:i})}>{item.number}{attempt.answers[item.id]&&<Check className="size-3"/>}</button>)}</div></details>
        <article className="mt-5 rounded-3xl border bg-card p-4 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="language-switch"><button className={questionLanguage==='original'?'active':''} onClick={()=>setQuestionLanguage('original')}>{t.original}</button><button className={questionLanguage==='interface'?'active':''} onClick={()=>setQuestionLanguage('interface')}>{t.interface}</button></div><a className="text-sm text-primary underline" href={`exams/${pack.id}/questions.pdf#page=${q.sourcePage}`} target="_blank" rel="noreferrer">{q.source} ↗</a></div>
          {questionLanguage==='interface'&&language!=='en'&&<p role="status" className="mt-3 rounded-lg bg-[var(--warm)] p-3 text-sm text-[var(--warm-ink)]">{t.unavailable}</p>}
          <div className="exam-image-scroll mt-5"><img className="exam-prompt" src={q.prompt.src} width={q.prompt.width} height={q.prompt.height} alt={q.promptText} lang="en"/></div>
          <div className="mt-6 space-y-3">{attempt.orders[q.id].map((id,i)=>{const option=q.options.find(o=>o.id===id)!;return <button key={id} className={`official-option ${attempt.answers[q.id]===id?'selected':''}`} aria-pressed={attempt.answers[q.id]===id} aria-label={`${t.option} ${String.fromCharCode(65+i)}: ${option.text||t.diagram}`} onClick={()=>{if(secondsRemaining(attempt,Date.now())===0){update(finishAttempt(attempt,attempt.deadline!));return;} update({...attempt,answers:{...attempt.answers,[q.id]:id}});}}><span className="answer-letter">{String.fromCharCode(65+i)}</span><img src={option.image.src} width={option.image.width} height={option.image.height} alt={option.text||t.diagram} lang="en"/>{attempt.answers[q.id]===id&&<Check className="size-5 shrink-0 text-primary"/>}</button>;})}</div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t pt-5"><Button variant="outline" disabled={attempt.index===0} onClick={()=>update({...attempt,index:attempt.index-1})}><ArrowLeft/>{t.previous}</Button><Button variant="ghost" onClick={()=>setConfirmFinish(true)}>{t.finish}</Button><Button disabled={attempt.index===99} onClick={()=>update({...attempt,index:attempt.index+1})}>{t.next}<ArrowRight/></Button></div>
          {confirmFinish&&<div role="alert" className="mt-5 rounded-xl border border-primary bg-[var(--mint)] p-4"><p>{t.finishWarning}</p><p className="mt-2">{t.answered}: {result!.answered}/100 · {t.skipped}: {result!.unanswered}</p><div className="mt-4 flex flex-wrap gap-3"><Button onClick={finish}>{t.confirm}</Button><Button variant="outline" onClick={()=>setConfirmFinish(false)}>{t.cancel}</Button></div></div>}
        </article>
        <div className="mt-5 flex flex-wrap justify-between gap-3"><Button variant="ghost" onClick={()=>{setAttempt(null);setConfirmFinish(false);}}>{t.leave}</Button><a className="inline-flex items-center gap-2 text-sm text-primary underline" href={`exams/${pack.id}/questions.pdf#page=39`} target="_blank" rel="noreferrer">{t.reference}<ExternalLink className="size-4"/></a></div>
      </>}
      {attempt?.status==='finished'&&result&&<>
        <Badge>{t.paper}</Badge><h1 className="mt-4 text-3xl font-bold">{result.correct} / {result.total} · {result.percent}%</h1><p className="mt-3 text-xl font-semibold">{result.passed?t.passed:t.failed}</p><p className="mt-2 text-muted-foreground">{t.skipped}: {result.unanswered}</p><p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{t.grading}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">{result.domains.map(d=><div className="rounded-xl border bg-card p-4" key={d.domain}><p>{t[d.domain]}</p><strong className="mt-2 block text-2xl">{d.correct}/{d.total}</strong></div>)}</div>
        <h2 className="mt-9 text-2xl font-semibold">{t.review}</h2><p className="mt-2 text-sm text-muted-foreground">{t.pending}</p>
        <div className="mt-4 space-y-3">{pack.questions.map(item=>{const selected=attempt.answers[item.id];const isCorrect=selected===item.answerId;return <details key={item.id} className={`review-item ${isCorrect?'review-correct':'review-wrong'}`}><summary><span className="review-number">{item.number}</span><span className="flex-1">{t.question} {item.number} · {selected===undefined?t.skipped:isCorrect?t.correct:t.incorrect}</span>{isCorrect?<CheckCircle2 className="size-5 text-primary"/>:<XCircle className="size-5 text-destructive"/>}</summary><div className="review-body"><img className="exam-prompt" loading="lazy" src={item.prompt.src} width={item.prompt.width} height={item.prompt.height} alt={item.promptText} lang="en"/><div className="mt-4 space-y-3">{attempt.orders[item.id].map((id,i)=>{const o=item.options.find(v=>v.id===id)!;return <div className={`official-option ${id===item.answerId?'review-answer-correct':id===selected?'review-answer-wrong':''}`} key={id}><span className="answer-letter">{String.fromCharCode(65+i)}</span><div className="min-w-0 flex-1"><div className="mb-2 text-sm font-semibold">{id===selected&&`${t.your} · `}{id===item.answerId&&t.right}</div><img loading="lazy" src={o.image.src} width={o.image.width} height={o.image.height} alt={o.text||t.diagram} lang="en"/></div></div>;})}</div><p className="mt-4 text-sm text-muted-foreground">{item.source} · {t.right}: {item.answerId.toUpperCase()} ({t.original})</p></div></details>;})}</div>
        <div className="mt-8 flex flex-wrap justify-between gap-3"><a className="text-sm text-primary underline" href={`exams/${pack.id}/answers.pdf`} target="_blank" rel="noreferrer">{t.answerKey} ↗</a><Button onClick={()=>setAttempt(null)}>{t.newAttempt}</Button></div>
      </>}
    </section>
  </main>;
}
