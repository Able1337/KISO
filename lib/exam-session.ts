export type ExamMode = 'learn' | 'mock' | 'exam';
export type Domain = 'technology' | 'management' | 'strategy';
export type Asset = { src: string; width: number; height: number };
export type ExamQuestion = { id: string; number: number; part?: 'A'|'B'; domain: Domain; sourcePage: number; source: string; promptText: string; prompt: Asset; promptPages?:Asset[]; options: { id: string; text: string; image: Asset }[]; answerId: string };
export type ExamPart = {id:'A'|'B';durationSeconds:number;questionCount:number;questionPdf:string;answerPdf:string};
export type ExamPack = { schemaVersion: number; id: string; title: string; system: string; level: string; year: number; season?:string; originalLanguage: string; durationSeconds: number; sourceUrl: string; publishedSubset?:boolean; parts?:ExamPart[]; questions: ExamQuestion[] };
export type Attempt = { version: 1; id: string; packId: string; mode: ExamMode; startedAt: number; deadline: number | null; index: number; answers: Record<string, string>; orders: Record<string, string[]>; status: 'active' | 'finished'; finishedAt: number | null; stage?:'A'|'break'|'B'; partAEndedAt?:number|null; partBStartedAt?:number|null };
export type ExamStorage = { version: 1; active: Attempt | null; history: Attempt[] };
export const STORAGE_KEY = 'kiso-official-exams-v1';
// Preserve the shipped IP storage key; new papers never overwrite another paper.
export function storageKey(pack:ExamPack) { return pack.id==='itpec-ip-2026-spring'?STORAGE_KEY:`${STORAGE_KEY}:${pack.id}`; }

// Rejection sampling of permutations with no unchanged positions.
// The bounded fallback also terminates for a constant/test RNG. Never mutate
// saved orders: they are needed to interpret answers in resumed attempts.
export function shuffleOptions(ids: string[], previous: string[] | undefined, random = Math.random) {
  const baseline=previous?.length===ids.length&&new Set(previous).size===ids.length&&ids.every(id=>previous.includes(id))?previous:ids;
  if(ids.length<2)return [...ids];
  for(let tries=0;tries<32;tries++){
    const candidate=[...ids];
    for(let i=candidate.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidate[i],candidate[j]]=[candidate[j],candidate[i]];}
    if(candidate.every((id,i)=>id!==baseline[i]))return candidate;
  }
  const shift=1+Math.floor(random()*(ids.length-1));
  return [...baseline.slice(shift),...baseline.slice(0,shift)];
}

export function makeAttempt(pack: ExamPack, mode: ExamMode, now: number, random = Math.random, previousOrders?: Attempt['orders']): Attempt {
  const orders = Object.fromEntries(pack.questions.map(q => {
    const ids = shuffleOptions(q.options.map(o => o.id),previousOrders?.[q.id],random);
    return [q.id, ids];
  }));
  return {version:1,id:`${pack.id}-${now}-${Math.floor(random()*1e9)}`,packId:pack.id,mode,startedAt:now,deadline:mode==='exam'?now+(pack.parts?.[0].durationSeconds??pack.durationSeconds)*1000:null,index:0,answers:{},orders,status:'active',finishedAt:null,...(pack.parts?{stage:'A',partAEndedAt:null,partBStartedAt:null}:{})};
}

export function secondsRemaining(attempt: Attempt, now: number) { return attempt.deadline === null ? null : Math.max(0, Math.ceil((attempt.deadline-now)/1000)); }
export function finishAttempt(attempt: Attempt, now: number): Attempt { return {...attempt,status:'finished',finishedAt:now}; }

export function completeSection(pack:ExamPack, attempt:Attempt, now:number):Attempt {
  if(attempt.status!=='active'||attempt.stage==='break')return attempt;
  const ended=attempt.deadline===null?now:Math.min(now,attempt.deadline);
  if(pack.parts&&attempt.stage==='A')return {...attempt,stage:'break',partAEndedAt:ended,deadline:null,index:pack.questions.findIndex(q=>q.part==='B')-1};
  return finishAttempt(attempt,ended);
}
export function startNextPart(pack:ExamPack,attempt:Attempt,now:number):Attempt {
  if(attempt.status!=='active'||attempt.stage!=='break'||!pack.parts||now<(attempt.partAEndedAt??Infinity))return attempt;
  return {...attempt,stage:'B',partBStartedAt:now,index:pack.questions.findIndex(q=>q.part==='B'),deadline:attempt.mode==='exam'?now+pack.parts[1].durationSeconds*1000:null};
}
export function expireAttempt(pack:ExamPack,attempt:Attempt,now:number):Attempt {
  return attempt.status==='active'&&secondsRemaining(attempt,now)===0?completeSection(pack,attempt,attempt.deadline!):attempt;
}
export function navigateQuestion(pack:ExamPack,attempt:Attempt,index:number,now:number):Attempt {
  const current=expireAttempt(pack,attempt,now);
  if(current!==attempt)return current;
  if(current.status!=='active'||current.stage==='break'||!Number.isInteger(index)||!pack.questions[index])return current;
  if(pack.parts&&pack.questions[index].part!==current.stage)return current;
  return {...current,index};
}

export function summarize(pack: ExamPack, attempt: Attempt) {
  const total=pack.questions.length;
  const answered=pack.questions.filter(q=>attempt.answers[q.id]!==undefined).length;
  const correct=pack.questions.filter(q=>attempt.answers[q.id]===q.answerId).length;
  const domains = (['technology','management','strategy'] as Domain[]).map(domain=>{
    const items=pack.questions.filter(q=>q.domain===domain);
    const right=items.filter(q=>attempt.answers[q.id]===q.answerId).length;
    return {domain,total:items.length,correct:right,percent:items.length?Math.round(right/items.length*100):0};
  });
  const parts=(pack.parts??[]).map(part=>{const items=pack.questions.filter(q=>q.part===part.id);const right=items.filter(q=>attempt.answers[q.id]===q.answerId).length;return {part:part.id,total:items.length,correct:right,percent:Math.round(right/items.length*100),passed:right/items.length>=0.6};});
  return {total,answered,correct,unanswered:total-answered,percent:Math.round(correct/total*100),domains,parts,passed:parts.length?parts.every(p=>p.passed):correct/total>=0.6 && domains.every(d=>d.total===0||d.correct/d.total>=0.3)};
}

export function isAttempt(value: unknown, pack: ExamPack): value is Attempt {
  if (!value || typeof value!=='object') return false;
  const a=value as Attempt;
  if(a.version!==1||a.packId!==pack.id||typeof a.id!=='string'||!['learn','mock','exam'].includes(a.mode)||!['active','finished'].includes(a.status)||!Number.isFinite(a.startedAt)||!Number.isInteger(a.index)||a.index<0||a.index>=pack.questions.length) return false;
  if(pack.parts){
    if(!['A','break','B'].includes(a.stage??''))return false;
    if(a.stage==='A'&&(a.partAEndedAt!==null||a.partBStartedAt!==null))return false;
    if(a.stage!=='A'&&(!Number.isFinite(a.partAEndedAt)||a.partAEndedAt!<a.startedAt))return false;
    if(a.stage==='break'&&(a.partBStartedAt!==null||a.status!=='active'||a.index!==pack.questions.findIndex(q=>q.part==='B')-1))return false;
    if(a.stage==='B'&&(!Number.isFinite(a.partBStartedAt)||a.partBStartedAt!<a.partAEndedAt!))return false;
    if(a.stage!=='break'&&pack.questions[a.index].part!==a.stage)return false;
    const expectedDeadline=a.mode!=='exam'||a.stage==='break'?null:a.stage==='A'?a.startedAt+pack.parts[0].durationSeconds*1000:a.partBStartedAt!+pack.parts[1].durationSeconds*1000;
    if(a.deadline!==expectedDeadline)return false;
  } else if(a.mode!=='exam'?a.deadline!==null:!Number.isFinite(a.deadline)||a.deadline!==a.startedAt+pack.durationSeconds*1000) return false;
  if(a.status==='active'?a.finishedAt!==null:!Number.isFinite(a.finishedAt)) return false;
  if(!a.answers||typeof a.answers!=='object'||Array.isArray(a.answers)||!a.orders||typeof a.orders!=='object') return false;
  if(!Object.entries(a.answers).every(([id,option])=>pack.questions.some(q=>q.id===id&&q.options.some(o=>o.id===option)))) return false;
  if(pack.parts&&a.stage!=='B'&&Object.keys(a.answers).some(id=>pack.questions.find(q=>q.id===id)?.part==='B'))return false;
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

export function answerQuestion(pack: ExamPack, attempt: Attempt, questionId: string, optionId: string, now: number): Attempt {
  if(attempt.status!=='active') return attempt;
  const current=expireAttempt(pack,attempt,now);
  if(current!==attempt)return current;
  if(attempt.stage==='break')return attempt;
  const question=pack.questions.find(q=>q.id===questionId);
  if(!question?.options.some(o=>o.id===optionId)) return attempt;
  if(pack.parts&&question.part!==attempt.stage)return attempt;
  // In learning mode feedback reveals the key immediately; keep the first answer.
  if(attempt.mode==='learn'&&attempt.answers[questionId]!==undefined) return attempt;
  return {...attempt,answers:{...attempt.answers,[questionId]:optionId}};
}
