export type ExamMode = 'mock' | 'exam';
export type Domain = 'technology' | 'management' | 'strategy';
export type Asset = { src: string; width: number; height: number };
export type ExamQuestion = { id: string; number: number; domain: Domain; sourcePage: number; source: string; promptText: string; prompt: Asset; options: { id: string; text: string; image: Asset }[]; answerId: string };
export type ExamPack = { schemaVersion: number; id: string; title: string; system: string; level: string; year: number; originalLanguage: string; durationSeconds: number; sourceUrl: string; questions: ExamQuestion[] };
export type Attempt = { version: 1; id: string; packId: string; mode: ExamMode; startedAt: number; deadline: number | null; index: number; answers: Record<string, string>; orders: Record<string, string[]>; status: 'active' | 'finished'; finishedAt: number | null };
export type ExamStorage = { version: 1; active: Attempt | null; history: Attempt[] };
export const STORAGE_KEY = 'kiso-official-exams-v1';

export function makeAttempt(pack: ExamPack, mode: ExamMode, now: number, random = Math.random): Attempt {
  const orders = Object.fromEntries(pack.questions.map(q => {
    const ids = q.options.map(o => o.id);
    for (let i=ids.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [ids[i],ids[j]]=[ids[j],ids[i]]; }
    return [q.id, ids];
  }));
  return {version:1,id:`${pack.id}-${now}-${Math.floor(random()*1e9)}`,packId:pack.id,mode,startedAt:now,deadline:mode==='exam'?now+pack.durationSeconds*1000:null,index:0,answers:{},orders,status:'active',finishedAt:null};
}

export function secondsRemaining(attempt: Attempt, now: number) { return attempt.deadline === null ? null : Math.max(0, Math.ceil((attempt.deadline-now)/1000)); }
export function finishAttempt(attempt: Attempt, now: number): Attempt { return {...attempt,status:'finished',finishedAt:now}; }

export function summarize(pack: ExamPack, attempt: Attempt) {
  const total=pack.questions.length;
  const answered=pack.questions.filter(q=>attempt.answers[q.id]!==undefined).length;
  const correct=pack.questions.filter(q=>attempt.answers[q.id]===q.answerId).length;
  const domains = (['technology','management','strategy'] as Domain[]).map(domain=>{
    const items=pack.questions.filter(q=>q.domain===domain);
    const right=items.filter(q=>attempt.answers[q.id]===q.answerId).length;
    return {domain,total:items.length,correct:right,percent:items.length?Math.round(right/items.length*100):0};
  });
  return {total,answered,correct,unanswered:total-answered,percent:Math.round(correct/total*100),domains,passed:correct/total>=0.6 && domains.every(d=>d.total===0||d.correct/d.total>=0.3)};
}

export function isAttempt(value: unknown, pack: ExamPack): value is Attempt {
  if (!value || typeof value!=='object') return false;
  const a=value as Attempt;
  if(a.version!==1||a.packId!==pack.id||typeof a.id!=='string'||!['mock','exam'].includes(a.mode)||!['active','finished'].includes(a.status)||!Number.isFinite(a.startedAt)||!Number.isInteger(a.index)||a.index<0||a.index>=pack.questions.length) return false;
  if(a.mode==='mock'?a.deadline!==null:!Number.isFinite(a.deadline)||a.deadline!==a.startedAt+pack.durationSeconds*1000) return false;
  if(a.status==='active'?a.finishedAt!==null:!Number.isFinite(a.finishedAt)) return false;
  if(!a.answers||typeof a.answers!=='object'||Array.isArray(a.answers)||!a.orders||typeof a.orders!=='object') return false;
  if(!Object.entries(a.answers).every(([id,option])=>pack.questions.some(q=>q.id===id&&q.options.some(o=>o.id===option)))) return false;
  return pack.questions.every(q=>Array.isArray(a.orders[q.id])&&a.orders[q.id].length===q.options.length&&new Set(a.orders[q.id]).size===q.options.length&&q.options.every(o=>a.orders[q.id].includes(o.id)));
}

export function readStorage(raw: string | null, pack: ExamPack): ExamStorage {
  try {
    const value=JSON.parse(raw??'null');
    if(value?.version!==1) throw new Error('version');
    return {version:1,active:isAttempt(value.active,pack)&&value.active.status==='active'?value.active:null,history:Array.isArray(value.history)?value.history.filter((a:unknown)=>isAttempt(a,pack)&&a.status==='finished').slice(0,30):[]};
  } catch { return {version:1,active:null,history:[]}; }
}

export function saveAttempt(storage: ExamStorage, attempt: Attempt): ExamStorage {
  return attempt.status==='active' ? {...storage,active:attempt} : {version:1,active:storage.active?.id===attempt.id?null:storage.active,history:[attempt,...storage.history.filter(a=>a.id!==attempt.id)].slice(0,30)};
}

// Call inside the browser's cross-tab lock. A stale screen must never overwrite
// newer answers or resurrect an attempt that another tab has already finished.
export function guardedSave(expected: ExamStorage, latest: ExamStorage, attempt: Attempt) {
  if (JSON.stringify(expected) !== JSON.stringify(latest)) return {storage: latest, conflict: true};
  return {storage: saveAttempt(latest, attempt), conflict: false};
}
