'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, CheckCircle2, Clock3, ExternalLink, Lightbulb, Search, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { answerQuestion, completeSection, expireAttempt, navigateQuestion, startNextPart, storageKey, guardedSave, makeAttempt, readStorage, secondsRemaining, summarize, type Attempt, type ExamMode, type ExamPack, type ExamStorage, type ExamQuestion } from '@/lib/exam-session';
import { uiCopy, type UiLanguage } from './kiso-i18n';
import { officialLesson, type OfficialLesson } from './official-lessons';
import { feLesson } from './fe-lessons';
import { ipaLesson } from './ipa-lessons';
import { lessonCoverage } from '@/lib/lesson-coverage';

export type OfficialEntry={mode?:ExamMode;attemptId?:string};
const text = {
  ru: {
    learn:'Обучение', learningDone:'Обучение завершено', pendingLesson:'Подробный разбор этого вопроса ещё готовится. Показан ответ по официальному ключу.', loading:'Загрузка попытки…',
    paper:'ITPEC IP · апрель 2026', sync:'Попытка обновлена в другой вкладке. Показаны последние сохранённые ответы; повторите действие, если оно ещё нужно.',
    home:'К настройке', language:'Язык экзамена: английский',
    ready:'Оригинал и ключ: 100 / 100', pending:'Вопросы показаны в оригинале из PDF. Учебные разборы доступны для всех вопросов.',
    description:'ITPEC IP · апрель 2026 · 100 вопросов · 120 минут', source:'Официальный источник', notes:'Формулировки, таблицы и схемы перенесены из официального PDF. Буквы вариантов нормализованы, порядок ответов перемешивается. В оригинале Q64 содержит e вместо d, а Q71 — d вместо b; привязка проверена по официальному ключу.',
    mock:'Пробный экзамен', exam:'Экзамен с таймером', resume:'Продолжить', active:'Незавершённая попытка', saved:'Ответы сохраняются на этом устройстве. Таймер продолжает идти при закрытии страницы.',
    original:'Оригинал',
    question:'Вопрос', of:'из', answered:'Ответов', previous:'Назад', next:'Дальше', finish:'Завершить экзамен', confirm:'Завершить и показать результат', cancel:'Продолжить отвечать',
    finishWarning:'После завершения ответы изменить нельзя. Пропущенные вопросы считаются неверными.', leave:'Сохранить и выйти', reference:'Оригинальный PDF и справочник',
    navigation:'Навигация по вопросам', review:'Разбор всех ответов', correct:'Верно', incorrect:'Неверно', skipped:'Нет ответа', your:'Ваш ответ', right:'Правильный ответ',
    passed:'Учебный порог достигнут', failed:'Учебный порог не достигнут', grading:'Учебный расчёт: не менее 60% в целом и 30% в каждой области. Распределение вопросов по областям размечено по темам; результат не является официальной оценкой ITPEC.',
    technology:'Технологии', management:'Управление', strategy:'Стратегия', history:'Пройденные варианты', empty:'Завершённых попыток пока нет.', view:'Посмотреть результат', newAttempt:'К настройке',
    storageError:'Браузер не разрешил сохранение. Ответы доступны только до закрытия этой страницы.', lostStorage:'Сохранение на этом устройстве', option:'Вариант', diagram:'Схема ответа', answerKey:'Официальный ключ',
  },
  en: {
    learn:'Learning', learningDone:'Learning session completed', pendingLesson:'The detailed lesson for this question is in preparation. The official answer is shown.', loading:'Loading attempt…',
    paper:'ITPEC IP · April 2026', sync:'This attempt changed in another tab. The latest saved answers are shown; repeat your action if still needed.',
    home:'Back to setup', language:'Exam language: English',
    ready:'Original and answer key: 100 / 100', pending:'Questions use original PDF images. Learning explanations are available for every question.',
    description:'ITPEC IP · April 2026 · 100 questions · 120 minutes', source:'Official source', notes:'Wording, tables and figures come from the official PDF. Answer labels are normalized and options are shuffled. Source Q64 uses e instead of d; Q71 uses d instead of b. Answers are matched to the official key.',
    mock:'Mock exam', exam:'Timed exam', resume:'Resume', active:'Unfinished attempt', saved:'Answers are saved on this device. The timer continues when the page is closed.',
    original:'Original',
    question:'Question', of:'of', answered:'Answered', previous:'Previous', next:'Next', finish:'Finish exam', confirm:'Finish and show results', cancel:'Keep answering',
    finishWarning:'Answers cannot be changed after finishing. Unanswered questions count as incorrect.', leave:'Save and exit', reference:'Original PDF and reference appendix',
    navigation:'Question navigation', review:'Review all answers', correct:'Correct', incorrect:'Incorrect', skipped:'Unanswered', your:'Your answer', right:'Correct answer',
    passed:'Practice threshold reached', failed:'Practice threshold not reached', grading:'Practice calculation: at least 60% overall and 30% in each field. Field assignments are editorial topic classifications; this is not an official ITPEC score.',
    technology:'Technology', management:'Management', strategy:'Strategy', history:'Completed papers', empty:'No completed attempts yet.', view:'View result', newAttempt:'Back to papers',
    storageError:'The browser could not save progress. Answers will only remain until this page is closed.', lostStorage:'Saved on this device', option:'Option', diagram:'Answer diagram', answerKey:'Official answer key',
  },
  ja: {
    learn:'学習', learningDone:'学習を終了しました', pendingLesson:'この問題の詳しい解説は準備中です。公式正解を表示しています。', loading:'受験データを読み込み中…',
    paper:'ITPEC IP · 2026年4月', sync:'別のタブで受験データが更新されました。最新の保存済み解答を表示しています。必要に応じて操作を繰り返してください。',
    home:'設定へ戻る', language:'試験言語：英語',
    ready:'原文・正解：100 / 100', pending:'問題はPDFの原文画像です。全問に詳しい学習解説があります。',
    description:'ITPEC IP · 2026年4月 · 100問 · 120分', source:'公式出典', notes:'問題文・表・図は公式PDFから取り込みました。選択肢の記号を正規化し、順序をシャッフルします。原本Q64のeはd、Q71の2番目のdはbに対応します。公式正解表と照合済みです。',
    mock:'模擬試験', exam:'時間制限付き試験', resume:'再開', active:'未完了の受験', saved:'解答はこの端末に保存されます。ページを閉じてもタイマーは進みます。',
    original:'原文',
    question:'問題', of:'/', answered:'解答済み', previous:'前へ', next:'次へ', finish:'試験を終了', confirm:'終了して結果を見る', cancel:'解答を続ける',
    finishWarning:'終了後は解答を変更できません。未解答は不正解として計算します。', leave:'保存して戻る', reference:'原本PDF・付録',
    navigation:'問題ナビゲーション', review:'全解答の確認', correct:'正解', incorrect:'不正解', skipped:'未解答', your:'あなたの解答', right:'正解',
    passed:'学習上の基準を達成', failed:'学習上の基準未達', grading:'学習用計算：総合60%以上かつ各分野30%以上。分野は問題内容に基づく編集上の分類であり、ITPECの公式採点結果ではありません。',
    technology:'テクノロジ', management:'マネジメント', strategy:'ストラテジ', history:'完了した試験', empty:'完了した受験はありません。', view:'結果を見る', newAttempt:'問題セットへ',
    storageError:'ブラウザーに保存できませんでした。解答はページを閉じるまで保持されます。', lostStorage:'この端末に保存', option:'選択肢', diagram:'解答の図', answerKey:'公式正解表',
  },
};

function PromptImages({question,language}:{question:ExamQuestion;language:string}) {
  return <div className="space-y-5">{(question.promptPages??[question.prompt]).map((asset,i)=><img key={asset.src} className="exam-prompt" loading={i?'lazy':undefined} src={asset.src} width={asset.width} height={asset.height} alt={i?`${question.source} · ${i+1}`:question.promptText} lang={language}/>)}</div>;
}

function LessonSources({lesson}:{lesson:OfficialLesson}) {
  if(!lesson.sources?.length) return null;
  return <ul className="mt-4 space-y-2">{lesson.sources.map(source=><li key={source.url}><a className="text-primary underline" href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul>;
}

function timeLabel(seconds:number) { return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`; }

export default function OfficialExams({pack, language, onLanguage, onExit, entry}: {pack:ExamPack; language:UiLanguage; onLanguage:(lang:UiLanguage)=>void; onExit:()=>void; entry:OfficialEntry}) {
  const t=text[language];
  const label=(ru:string,en:string,ja:string)=>({ru,en,ja})[language];
  const key=storageKey(pack);
  const total=pack.questions.length;
  const paper=`${pack.system} ${pack.level} · ${pack.system==='IPA'?pack.id==='ipa-fe-2022-sample'?label('демонстрационный комплект 2022','demonstration set 2022','2022年サンプル問題セット'):label(`публикация ${pack.year}`,`published ${pack.year}`,`${pack.year}年度公開問題`):label(`апрель ${pack.year}`,`April ${pack.year}`,`${pack.year}年4月`)}`;
  const lessonFor=(question:ExamQuestion)=>pack.system==='IPA'?ipaLesson(pack.level,question.part,question.number,language,pack.id):pack.id==='itpec-ip-2026-spring'?officialLesson(question.number,language):pack.id==='itpec-fe-2026-spring'?feLesson(question.part,question.number,language):null;
  const lessonCount=lessonCoverage[pack.id]??0;
  const questionPdf=(question:ExamQuestion)=>pack.parts?.find(p=>p.id===question.part)?.questionPdf??`exams/${pack.id}/questions.pdf`;
  const [storage,setStorage]=useState<ExamStorage>({version:1,active:null,history:[]});
  const [attempt,setAttempt]=useState<Attempt|null>(null);
  const [loaded,setLoaded]=useState(false);
  const [storageError,setStorageError]=useState(false);
  const [syncNotice,setSyncNotice]=useState(false);
  const [now,setNow]=useState(Date.now());
  const [confirmFinish,setConfirmFinish]=useState(false);
  const initialized=useRef(false);
  const copy=uiCopy[language];

  useEffect(()=>{
    try { setStorage(readStorage(localStorage.getItem(key),pack)); } catch { setStorageError(true); }
    setLoaded(true);
  },[]);
  useEffect(()=>{
    function onStorage(event:StorageEvent) {
      if(event.storageArea!==localStorage || (event.key!==null&&event.key!==key)) return;
      acceptRemote(readStorage(event.newValue,pack));
    }
    window.addEventListener('storage',onStorage);
    return ()=>window.removeEventListener('storage',onStorage);
  },[]);
  useEffect(()=>{
    if(!loaded||initialized.current)return;
    initialized.current=true;
    if(entry.attemptId) {
      const saved=storage.history.find(a=>a.id===entry.attemptId)??(storage.active?.id===entry.attemptId?storage.active:null);
      if(saved)setAttempt(saved);else onExit();
    } else if(storage.active) {setNow(Date.now());setAttempt(storage.active);}
    else start(entry.mode??'learn');
  },[loaded,entry,storage]);
  const hasTimedAttempt=storage.active?.mode==='exam'&&storage.active.stage!=='break';
  useEffect(()=>{
    if(!hasTimedAttempt) return;
    const timer=window.setInterval(()=>setNow(Date.now()),500);
    return ()=>window.clearInterval(timer);
  },[hasTimedAttempt]);
  useEffect(()=>{
    // An expired saved exam is completed even when its user returns to the catalogue.
    const current=attempt?.status==='active'?attempt:storage.active;
    if(current?.deadline!==null&&current?.deadline!==undefined&&secondsRemaining(current,now)===0) {
      const ended=expireAttempt(pack,current,now);
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
      try { latest=readStorage(localStorage.getItem(key),pack); } catch { setStorageError(true); }
      const saved=guardedSave(storage,storageError?storage:latest,next);
      if(saved.conflict) {acceptRemote(saved.storage);return;}
      try {localStorage.setItem(key,JSON.stringify(saved.storage));} catch {setStorageError(true);}
      setStorage(saved.storage);if(showAttempt)setAttempt(next);setSyncNotice(false);
    }
    // Web Locks serializes writes across same-origin tabs. The guard also protects
    // stale event handlers and provides a fallback where Web Locks is unavailable.
    if(navigator.locks) await navigator.locks.request(key,commit);
    else commit();
  }
  function start(mode:ExamMode) { const current=Date.now(); setNow(current); update(makeAttempt(pack,mode,current,Math.random,storage.history[0]?.orders)); }
  function finish() { if(attempt) update(completeSection(pack,attempt,Date.now())); setConfirmFinish(false); }
  const result=attempt?summarize(pack,attempt):null;
  const q=attempt?pack.questions[attempt.index]:null;
  const remaining=attempt?secondsRemaining(attempt,now):null;
  const revealed=attempt?.mode==='learn'&&q!==null&&attempt.answers[q.id]!==undefined;
  const lesson=q?lessonFor(q):null;
  const partQuestions=pack.parts?pack.questions.filter(item=>item.part===attempt?.stage):pack.questions;
  const canVisit=(item:ExamQuestion)=>!pack.parts||item.part===attempt?.stage;
  const finishLabel=attempt?.stage==='A'?copy.finishA:t.finish;
  function navigate(index:number){if(attempt)update(navigateQuestion(pack,attempt,index,Date.now()));}

  return <main lang={language} className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
      <button onClick={onExit} className="flex items-center gap-3 font-bold" aria-label={t.home}><BookOpenCheck className="size-6 text-primary"/>Kiso</button>
      <div className="global-language-switch" aria-label="Interface language">{(['ru','en','ja'] as UiLanguage[]).map(l=><button key={l} className={l===language?'active':''} onClick={()=>onLanguage(l)}>{l==='ja'?'日本語':l.toUpperCase()}</button>)}</div>
    </div></header>
    <section className="mx-auto max-w-6xl px-5 py-8">
      {storageError&&<p role="alert" className="mb-4 rounded-xl bg-destructive/10 p-4">{t.storageError}</p>}
      {syncNotice&&<p role="status" className="mb-4 rounded-xl bg-[var(--warm)] p-4 text-[var(--warm-ink)]">{t.sync}</p>}
      {!attempt&&<p role="status">{t.loading}</p>}
      {attempt&&attempt.status==='active'&&attempt.stage!=='break'&&q&&<>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><Badge>{paper}</Badge> <Badge variant="outline">{attempt.mode==='learn'?t.learn:attempt.mode==='mock'?t.mock:t.exam}</Badge><p className="mt-2 text-sm text-primary">{copy.examLanguage}: {pack.originalLanguage==='ja'?copy.japanese:copy.english}</p></div>{remaining!==null&&<div className="rounded-xl border bg-card px-4 py-3 font-mono text-xl" aria-label={t.exam}><Clock3 className="mr-2 inline size-5"/>{timeLabel(remaining)}</div>}</div>
        <div className="mt-5 flex items-center justify-between gap-2"><h1 className="text-lg font-semibold">{t.question} {q.part&&`${q.part} · `}{q.number} {t.of} {partQuestions.length}</h1><span className="text-sm text-muted-foreground">{t.answered}: {result!.answered}/{total}</span></div>
        <details className="mt-4 rounded-xl border bg-card p-3"><summary className="cursor-pointer font-medium">{t.navigation}</summary><div className="mt-3 grid grid-cols-5 gap-1.5 sm:grid-cols-10">{pack.questions.map((item,i)=><button key={item.id} aria-label={`${t.question} ${item.part?`${item.part} `:''}${item.number}`} disabled={!canVisit(item)} aria-current={i===attempt.index?'step':undefined} className={`exam-nav ${attempt.answers[item.id]?'answered':''} ${i===attempt.index?'current':''}`} onClick={()=>navigate(i)}>{item.part&&`${item.part} `}{item.number}{attempt.answers[item.id]&&<Check className="size-3"/>}</button>)}</div></details>
        <article className="mt-5 rounded-3xl border bg-card p-4 sm:p-7">
          <div className="flex justify-end"><a className="text-sm text-primary underline" href={`${questionPdf(q)}#page=${q.sourcePage}`} target="_blank" rel="noreferrer">{q.source} ↗</a></div>
          <div className="exam-image-scroll mt-5"><PromptImages question={q} language={pack.originalLanguage}/></div>
          <div className="mt-6 space-y-3">{attempt.orders[q.id].map((id,i)=>{const option=q.options.find(o=>o.id===id)!;return <button key={id} disabled={revealed} className={`official-option ${revealed&&id===q.answerId?'review-answer-correct':revealed&&attempt.answers[q.id]===id?'review-answer-wrong':attempt.answers[q.id]===id?'selected':''}`} aria-pressed={attempt.answers[q.id]===id} aria-label={`${t.option} ${String.fromCharCode(65+i)}: ${option.text||t.diagram}`} onClick={()=>update(answerQuestion(pack,attempt,q.id,id,Date.now()))}><span className="answer-letter">{String.fromCharCode(65+i)}</span><img src={option.image.src} width={option.image.width} height={option.image.height} alt={option.text||t.diagram} lang={pack.originalLanguage}/>{attempt.answers[q.id]===id&&<Check className="size-5 shrink-0 text-primary"/>}</button>;})}</div>
          {revealed&&<div data-testid="explanation" className={`mt-6 rounded-2xl border p-5 ${attempt.answers[q.id]===q.answerId?'explanation-correct':'explanation-wrong'}`}>
            <h2 className="font-semibold">{attempt.answers[q.id]===q.answerId?t.correct:t.incorrect}</h2>
            <p className="mt-2 font-semibold">{t.right}: {String.fromCharCode(65+attempt.orders[q.id].indexOf(q.answerId))}</p>
            {lesson?<><p className="mt-3 leading-7">{lesson.core}</p><a className="search-topic" href={`https://www.google.com/search?q=${encodeURIComponent(lesson.search)}`} target="_blank" rel="noreferrer"><Search className="size-4"/><span><strong>{copy.searchFor}</strong>{lesson.search}</span></a><div className="study-next"><Lightbulb className="size-4"/><span><strong>{copy.studyNext}</strong>{lesson.next}</span></div><details className="lesson-details" key={q.id}><summary>{copy.learnTopic}</summary><div className="lesson-body"><p>{lesson.detail}</p><LessonSources lesson={lesson}/></div></details></>:<p className="mt-3 text-muted-foreground">{t.pendingLesson}</p>}
          </div>}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t pt-5"><Button variant="outline" disabled={!pack.questions[attempt.index-1]||!canVisit(pack.questions[attempt.index-1])} onClick={()=>navigate(attempt.index-1)}><ArrowLeft/>{t.previous}</Button><Button variant="ghost" onClick={()=>setConfirmFinish(true)}>{finishLabel}</Button><Button disabled={!pack.questions[attempt.index+1]||!canVisit(pack.questions[attempt.index+1])} onClick={()=>navigate(attempt.index+1)}>{t.next}<ArrowRight/></Button></div>
          {confirmFinish&&<div role="alert" className="mt-5 rounded-xl border border-primary bg-[var(--mint)] p-4"><p>{attempt.stage==='A'?label('После подтверждения ответы A будут зафиксированы. Затем начнётся пауза перед B.','Confirming locks your A answers and starts the break before B.','確認するとAの解答が確定し、Bの前の休憩に入ります。'):t.finishWarning}</p><p className="mt-2">{t.answered}: {result!.answered}/{total} · {t.skipped}: {result!.unanswered}</p><div className="mt-4 flex flex-wrap gap-3"><Button onClick={finish}>{attempt.stage==='A'?label('Завершить A и перейти к паузе','Finish A and pause','Aを終了して休憩'):t.confirm}</Button><Button variant="outline" onClick={()=>setConfirmFinish(false)}>{t.cancel}</Button></div></div>}
        </article>
        <details className="mt-5 rounded-xl border p-4"><summary className="cursor-pointer text-sm font-semibold">{t.source}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{pack.system==='IPA'?label('Официальные задания IPA на японском. Ответ выбирается по крупной интерфейсной букве. Метки ア・イ・ウ… внутри таблиц относятся к оригиналу; ключ привязан к содержимому, а не позиции. В табличных ответах повторены заголовки.','Official IPA questions in Japanese. Choose using the large interface letter. ア・イ・ウ… inside tables are original labels; keys follow content, not position. Table headers repeat within each answer.','IPAの原文問題です。解答は大きい画面上の記号で選びます。表内のア・イ・ウ…は原本の記号です。正解は位置でなく内容に対応します。表の選択肢には見出しを繰り返しています。'):pack.parts?label('Оригинальные многостраничные задания FE A/B. Заголовки таблиц повторены у каждого ответа; порядок ответов перемешивается. Нумерация A и B независимая.','Original multi-page FE A/B questions. Table headers repeat for each shuffled answer. A and B have separate numbering.','FE A/Bの原文を複数ページのまま収録。各選択肢に表見出しを繰り返し、順序を変更します。AとBの番号は独立です。'):t.notes}</p><a className="mt-3 block text-primary underline" href={pack.sourceUrl} target="_blank" rel="noreferrer">{pack.system} ↗</a></details>
        {pack.system==='IPA'&&pack.level==='FE'&&<p className="mt-3 text-sm text-muted-foreground">{pack.publishedSubset?label('Сокращённая архивная подборка. Расчётный учебный таймер: A — 1,5 минуты на вопрос; B — 5 минут. Это не официальная длительность экзамена.','Selected archive questions. Calculated practice timer: A — 1.5 minutes per question; B — 5 minutes. Not an official exam duration.','公開問題の一部による練習です。Aは1問1.5分、Bは1問5分で計算した時間で、公式試験の所要時間ではありません。'):label('Полный демонстрационный комплект от 26.12.2022: A — 60 вопросов / 90 минут; B — 20 / 100. Разборы Kiso не являются официальными пояснениями IPA.','Complete demonstration set published 26 December 2022: A — 60 questions / 90 minutes; B — 20 / 100. Kiso lessons are not official IPA explanations.','2022年12月26日公開の完全サンプル：A60問90分、B20問100分。Kisoの解説はIPA公式解説ではありません。')}</p>}
        <div className="mt-5 flex flex-wrap justify-between gap-3"><Button variant="ghost" onClick={onExit}>{t.leave}</Button><a className="inline-flex items-center gap-2 text-sm text-primary underline" href={`${questionPdf(q)}#page=${pack.parts?2:pack.system==='IPA'?50:39}`} target="_blank" rel="noreferrer">{t.reference}<ExternalLink className="size-4"/></a></div>
      </>}
      {attempt?.status==='active'&&attempt.stage==='break'&&<div className="mx-auto mt-10 max-w-2xl rounded-3xl border bg-card p-8 text-center"><Badge>{paper} · A → B</Badge><h1 className="mt-5 text-3xl font-bold">{copy.partDone}</h1><p className="mt-4 leading-7">{copy.breakText}</p><p className="mt-3 text-muted-foreground">{label('Пауза без ограничения времени. Часть B','Untimed break. Subject B','時間制限のない休憩。科目B')}: {pack.parts?.[1].questionCount} {label('вопросов','questions','問')} · {pack.parts![1].durationSeconds/60} {label('минут в режиме экзамена','minutes in timed mode','分（試験モード）')}</p><Button className="mt-6" onClick={()=>{const current=Date.now();setNow(current);update(startNextPart(pack,attempt,current));}}>{copy.startB}</Button><Button className="mt-6 ml-3" variant="outline" onClick={onExit}>{t.leave}</Button></div>}
      {attempt?.status==='finished'&&result&&<>
        <Badge>{paper}</Badge><h1 className="mt-4 text-3xl font-bold">{result.correct} / {result.total} · {result.percent}%</h1><p className="mt-3 text-xl font-semibold">{attempt.mode==='learn'?t.learningDone:result.passed?t.passed:t.failed}</p><p className="mt-2 text-muted-foreground">{t.skipped}: {result.unanswered}</p>{attempt.mode!=='learn'&&<p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{pack.system==='IPA'?label('Учебный процент правильных ответов, не официальный балл IPA: IRT здесь не воспроизводится. Порог: IP — 60% всего и 30% в каждой области; FE — 60% отдельно в A и B.','Practice percentage, not an official IPA score: IRT is not reproduced. Threshold: IP 60% overall and 30% per field; FE 60% in each subject.','学習用の正答率で、IPAの公式評価点ではありません。IRTは再現しません。基準はIP全体60%・各分野30%、FE各科目60%です。'):pack.parts?label('Учебный расчёт: не менее 60% отдельно в A и B. Равный вес вопросов — учебная модель, не официальный балл ITPEC.','Practice scoring: at least 60% separately in A and B. Equal question weights are a practice model, not official ITPEC marks.','学習用採点：A・Bそれぞれ60%以上。各問同配点の練習用計算で、ITPECの公式得点ではありません。'):t.grading}</p>}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">{!pack.parts&&result.domains.map(d=><div className="rounded-xl border bg-card p-4" key={d.domain}><p>{t[d.domain]}</p><strong className="mt-2 block text-2xl">{d.correct}/{d.total}</strong></div>)}</div>
        {pack.parts&&<div className="mt-6 grid gap-3 sm:grid-cols-2">{result.parts.map(p=><div key={p.part} className="rounded-xl border bg-card p-4"><p>{label('Часть','Subject','科目')} {p.part}</p><strong className="mt-2 block text-2xl">{p.correct}/{p.total} · {p.percent}%</strong><p className="mt-2 text-sm">{p.passed?t.passed:t.failed}</p></div>)}</div>}
        <h2 className="mt-9 text-2xl font-semibold">{t.review}</h2><p className="mt-2 text-sm text-muted-foreground">{label('Все вопросы и официальные ответы. Готовых подробных разборов','All questions and official answers. Detailed lessons ready','全問題と公式正解。詳しい解説の収録数')} ({lessonCount}/{total})</p>
        <div className="mt-4 space-y-3">{pack.questions.map(item=>{const reviewLesson=lessonFor(item);const selected=attempt.answers[item.id];const isCorrect=selected===item.answerId;return <details key={item.id} className={`review-item ${isCorrect?'review-correct':'review-wrong'}`}><summary><span className="review-number">{item.part&&`${item.part} `}{item.number}</span><span className="flex-1">{t.question} {item.part&&`${item.part} `}{item.number} · {selected===undefined?t.skipped:isCorrect?t.correct:t.incorrect}</span>{isCorrect?<CheckCircle2 className="size-5 text-primary"/>:<XCircle className="size-5 text-destructive"/>}</summary><div className="review-body"><PromptImages question={item} language={pack.originalLanguage}/><div className="mt-4 space-y-3">{attempt.orders[item.id].map((id,i)=>{const o=item.options.find(v=>v.id===id)!;return <div className={`official-option ${id===item.answerId?'review-answer-correct':id===selected?'review-answer-wrong':''}`} key={id}><span className="answer-letter">{String.fromCharCode(65+i)}</span><div className="min-w-0 flex-1"><div className="mb-2 text-sm font-semibold">{id===selected&&`${t.your} · `}{id===item.answerId&&t.right}</div><img loading="lazy" src={o.image.src} width={o.image.width} height={o.image.height} alt={o.text||t.diagram} lang={pack.originalLanguage}/></div></div>;})}</div>{reviewLesson&&<details className="lesson-details"><summary>{copy.learnTopic}</summary><div className="lesson-body"><p>{reviewLesson.core}</p><p className="mt-3">{reviewLesson.detail}</p><LessonSources lesson={reviewLesson}/></div></details>}<p className="mt-4 text-sm text-muted-foreground">{item.source} · {t.right}: {pack.originalLanguage==='ja'?'アイウエオカキクケコ'[item.answerId.charCodeAt(0)-97]:item.answerId.toUpperCase()} ({t.original})</p></div></details>;})}</div>
        <div className="mt-8 flex flex-wrap justify-between gap-3"><div className="flex gap-4">{(pack.parts??[{id:'IP',answerPdf:`exams/${pack.id}/answers.pdf`}]).map(p=><a key={p.id} className="text-sm text-primary underline" href={p.answerPdf} target="_blank" rel="noreferrer">{t.answerKey} · {p.id} ↗</a>)}</div><Button onClick={onExit}>{t.newAttempt}</Button></div>
      </>}
    </section>
  </main>;
}
