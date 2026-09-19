'use client';
import {useEffect,useRef,useState} from 'react';
import {foundationLessons,studyText,checkStudyAnswer,FOUNDATION_STORAGE_KEY,type StudyLanguage} from '../lib/foundation-lessons';
import {answerFoundation,readFoundationPractice,retryFoundation,type FoundationPractice} from '../lib/foundation-practice';

export default function FoundationStudy({group,language,onClose}:{group:'numbers'|'logic';language:StudyLanguage;onClose:()=>void}){
 const label=(ru:string,en:string,ja:string)=>({ru,en,ja})[language];
 const [practice,setPractice]=useState<FoundationPractice|null>(null),[storageError,setStorageError]=useState(false);
 const heading=useRef<HTMLHeadingElement>(null);
 const lessons=foundationLessons.filter(l=>l.group===group);
 useEffect(()=>{heading.current?.focus();heading.current?.scrollIntoView({block:'start'});},[group]);
 useEffect(()=>{
  function restore(){try{const state=readFoundationPractice(localStorage.getItem(FOUNDATION_STORAGE_KEY));setPractice(state);localStorage.setItem(FOUNDATION_STORAGE_KEY,JSON.stringify(state));setStorageError(false);}catch{setPractice(s=>s??readFoundationPractice(null));setStorageError(true);}}
  restore();function sync(e:StorageEvent){if(e.key===FOUNDATION_STORAGE_KEY||e.key===null){try{setPractice(readFoundationPractice(e.newValue));}catch{setStorageError(true);}}}
  window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
 },[]);
 function update(id:string,option:number|null){
  if(!practice)return;let latest=practice;
  if(!storageError){try{latest=readFoundationPractice(localStorage.getItem(FOUNDATION_STORAGE_KEY));}catch{setStorageError(true);}}
  const next=option===null?retryFoundation(latest,id):answerFoundation(latest,id,option);setPractice(next);
  try{localStorage.setItem(FOUNDATION_STORAGE_KEY,JSON.stringify(next));setStorageError(false);}catch{setStorageError(true);}
 }
 const answered=lessons.filter(l=>practice?.answers[l.id]!==undefined),correct=answered.filter(l=>checkStudyAnswer(l.id,practice!.answers[l.id]));
 return <section aria-labelledby="foundation-title" className="mx-auto mb-10 max-w-6xl px-5">
  <div className="rounded-3xl border border-primary/25 bg-card p-5 sm:p-8">
   <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-widest text-primary">{label('УЧЕБНЫЕ МАТЕРИАЛЫ · KISO','KISO · LEARNING MATERIALS','KISO・学習教材')}</p><h2 ref={heading} tabIndex={-1} id="foundation-title" className="mt-3 scroll-mt-24 text-2xl font-bold outline-none">{group==='numbers'?label('Системы счисления: от цифр к представлению данных','Number systems: from digits to data representation','数の表現：数字からデータへ'):label('Логика и битовые операции','Logic and bit operations','論理とビット演算')}</h2></div><button onClick={onClose} className="rounded-xl border px-4 py-2 text-sm">{label('Свернуть материалы','Close materials','教材を閉じる')}</button></div>
   <p className="mt-4 text-sm leading-6 text-muted-foreground">{label('Авторские учебные примеры Kiso, не официальные задания IPA/ITPEC. Проходите по порядку или раскрывайте нужный урок. Чекбоксы роадмапа остаются вашей самооценкой: ответы в упражнениях не отмечают темы автоматически.','Original Kiso teaching examples, not official IPA/ITPEC questions. Follow the sequence or open any lesson. Roadmap checkboxes remain your self-assessment: exercise answers do not mark topics automatically.','IPA・ITPECの公式問題ではなくKiso独自の学習例です。順に進めても必要な教材を開いても構いません。練習の解答でロードマップの学習済みチェックは自動変更されません。')}</p>
   <p className="mt-3 text-sm font-semibold" role="status">{label('Самопроверка','Self-check','理解度チェック')}: {answered.length}/{lessons.length} · {label('Верно','Correct','正解')}: {correct.length}</p>
   {storageError&&<p role="alert" className="mt-3 text-sm text-amber-700">{label('Не удалось сохранить упражнения. Сейчас ответы доступны только на этой странице.','Could not save exercises. Answers are available on this page only.','練習結果を保存できませんでした。このページ内のみで有効です。')}</p>}
   <div className="mt-6 space-y-4">{lessons.map((lesson,i)=>{
    const selected=practice?.answers[lesson.id],checked=selected!==undefined,isCorrect=checked&&checkStudyAnswer(lesson.id,selected);
    return <details key={lesson.id} className="rounded-2xl border p-4 sm:p-5" open={i===0?true:undefined}>
     <summary className="cursor-pointer text-lg font-bold">{i+1}. {studyText(lesson.title,language)}{checked&&<span className="ml-2 text-sm font-normal"> · {isCorrect?label('Самопроверка: верно','Self-check: correct','確認：正解'):label('Нужен повтор','Review needed','復習が必要')}</span>}</summary>
     <div className="mt-5 max-w-3xl space-y-5 text-base leading-7"><p>{studyText(lesson.intro,language)}</p><ol className="list-decimal space-y-3 pl-6">{lesson.steps.map((step,n)=><li key={n}>{studyText(step,language)}</li>)}</ol>
      <div><h3 className="mb-2 text-sm font-bold text-primary">{label('Пошаговый пример','Worked example','計算例')}</h3><pre className="overflow-x-auto rounded-xl bg-muted p-4 text-sm leading-7" tabIndex={0}><code>{lesson.example}</code></pre></div><p>{studyText(lesson.explanation,language)}</p>
      <details className="rounded-xl bg-primary/5 p-4"><summary className="cursor-pointer font-semibold">{label('Частая ошибка','Common pitfall','よくある間違い')}</summary><p className="mt-3">{studyText(lesson.pitfall,language)}</p></details>
      <fieldset className="min-w-0 rounded-xl border p-4"><legend className="px-2 text-sm font-bold">{label('Проверьте себя','Check your understanding','理解度チェック')}</legend><p className="mb-4 font-semibold">{studyText(lesson.question,language)}</p>
       <div className="grid gap-2 sm:grid-cols-2">{(practice?.orders[lesson.id]??[]).map((id,n)=>{const value=Number(id);return <button key={id} disabled={checked} aria-pressed={selected===value} onClick={()=>update(lesson.id,value)} className={'rounded-xl border p-3 text-left font-mono text-sm disabled:cursor-default '+(checked&&value===lesson.answer?'border-teal-600 bg-teal-50 text-teal-950':selected===value?'border-red-600 bg-red-50 text-red-950':'hover:border-primary')}><span className="mr-3 font-sans font-bold">{String.fromCharCode(65+n)}</span>{lesson.options[value]}{checked&&value===lesson.answer&&<span className="ml-2 font-sans">✓</span>}{selected===value&&!isCorrect&&<span className="ml-2 font-sans">✕</span>}</button>;})}</div>
       {!practice&&<p role="status">{label('Загрузка упражнения…','Loading exercise…','練習を読み込み中…')}</p>}
       {checked&&<div className="mt-4" role="status"><h4 className="font-bold">{isCorrect?label('Верно','Correct','正解'):label('Пока неверно — разберём шаги','Not quite — let’s review the steps','不正解：手順を確認しましょう')}</h4><p className="mt-2 font-semibold">{label('Правильный ответ','Correct answer','正解')}: {lesson.options[lesson.answer]}</p><p className="mt-2">{studyText(lesson.solution,language)}</p><button onClick={()=>update(lesson.id,null)} className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold">{label('Попробовать снова','Try again','もう一度試す')}</button></div>}
      </fieldset>
     </div>
    </details>;
   })}</div>
   <p className="mt-5 text-xs leading-5 text-muted-foreground">{label('Ответы сохраняются в этом браузере. Это тренировка, не оценка готовности к экзамену; после повторного прочтения попробуйте решить пример без подсказки.','Answers are saved in this browser. This is practice, not an exam readiness score; after reviewing, try solving without the explanation.','結果はこのブラウザに保存されます。試験合格の判定ではありません。復習後は解説を見ずに解いてみましょう。')}</p>
  </div>
 </section>;
}
