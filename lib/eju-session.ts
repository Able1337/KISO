import type { EjuPack, EjuQuestion } from './eju-types.ts';
export type EjuMode = 'learn' | 'mock' | 'exam';
export type EjuAttempt = {
  version: 1;
  id: string;
  packId: string;
  mode: EjuMode;
  startedAt: number;
  sectionStartedAt: number;
  section: number;
  index: number;
  deadline: number | null;
  status: 'active' | 'break' | 'finished';
  finishedAt: number | null;
  answers: Record<string, string[]>;
  submitted: string[];
  essay: string;
  writingTopic: number;
  audioPlayed: string[];
};
export type EjuStorage = {
  version: 1;
  active: EjuAttempt | null;
  history: EjuAttempt[];
};
export const emptyEjuStorage = (): EjuStorage => ({
  version: 1,
  active: null,
  history: [],
});
export const ejuStorageKey = (pack: EjuPack) => `kiso-eju-v1:${pack.id}`;
export function createEjuAttempt(
  pack: EjuPack,
  mode: EjuMode,
  now: number,
  id: string,
): EjuAttempt {
  return {
    version: 1,
    id,
    packId: pack.id,
    mode,
    startedAt: now,
    sectionStartedAt: now,
    section: 0,
    index: 0,
    deadline: mode === 'exam' ? now + pack.sections[0].seconds * 1000 : null,
    status: 'active',
    finishedAt: null,
    answers: {},
    submitted: [],
    essay: '',
    writingTopic: 0,
    audioPlayed: [],
  };
}
export const sectionQuestions = (pack: EjuPack, a: EjuAttempt) =>
  pack.questions.filter((q) => q.section === pack.sections[a.section].id);
export function ejuAudioIndex(pack: EjuPack, a: EjuAttempt, now: number) {
  const count = sectionQuestions(pack, a).length;
  return Math.min(
    count - 1,
    Math.max(
      0,
      Math.floor(
        (now - a.sectionStartedAt) /
          ((pack.sections[a.section].seconds * 1000) / count),
      ),
    ),
  );
}
export const normalizeCell = (value: string) =>
  value
    .normalize('NFKC')
    .replace(/[−–]/g, '-')
    .trim();
export function isCorrect(q: EjuQuestion, answer?: string[]) {
  return (
    !!answer &&
    answer.length === q.answers.length &&
    answer.every((v, i) => normalizeCell(v) === q.answers[i])
  );
}
export function finishEjuSection(
  pack: EjuPack,
  a: EjuAttempt,
  now: number,
): EjuAttempt {
  if (a.status !== 'active') return a;
  if (a.section === pack.sections.length - 1)
    return { ...a, status: 'finished', deadline: null, finishedAt: now };
  return { ...a, status: 'break', deadline: null };
}
export function expireEju(
  pack: EjuPack,
  a: EjuAttempt,
  now: number,
): EjuAttempt {
  return a.status === 'active' && a.deadline !== null && now >= a.deadline
    ? finishEjuSection(pack, a, a.deadline)
    : a;
}
export function nextEjuSection(
  pack: EjuPack,
  a: EjuAttempt,
  now: number,
): EjuAttempt {
  if (a.status !== 'break' || a.section + 1 >= pack.sections.length) return a;
  const section = a.section + 1;
  return {
    ...a,
    section,
    sectionStartedAt: now,
    index: 0,
    status: 'active',
    deadline:
      a.mode === 'exam' ? now + pack.sections[section].seconds * 1000 : null,
  };
}
export function answerEju(
  pack: EjuPack,
  a: EjuAttempt,
  id: string,
  values: string[],
  now: number,
): EjuAttempt {
  const current = expireEju(pack, a, now);
  if (current !== a || a.status !== 'active') return current;
  const q = sectionQuestions(pack, a).find((q) => q.id === id);
  if (
    !q ||
    values.length !== q.answers.length ||
    (a.mode === 'learn' && a.submitted.includes(id))
  )
    return a;
  if (
    a.mode === 'exam' &&
    pack.sections[a.section].kind === 'listening' &&
    sectionQuestions(pack, a)[ejuAudioIndex(pack, a, now)]?.id !== id
  )
    return a;
  if (
    q.kind === 'choice'
      ? !values.every(
          (v) =>
            v === '' ||
            (Number.isInteger(Number(v)) &&
              Number(v) >= 1 &&
              Number(v) <= q.options!.length),
        )
      : !values.every((v) => /^[-0-9]?$/.test(normalizeCell(v)))
  )
    return a;
  return { ...a, answers: { ...a.answers, [id]: values.map(normalizeCell) } };
}
export function submitEju(
  pack: EjuPack,
  a: EjuAttempt,
  id: string,
  now: number,
): EjuAttempt {
  const current = expireEju(pack, a, now);
  if (
    current !== a ||
    a.status !== 'active' ||
    a.mode !== 'learn' ||
    a.submitted.includes(id)
  )
    return current;
  const q = sectionQuestions(pack, a).find((q) => q.id === id);
  if (
    !q ||
    a.answers[id]?.length !== q.answers.length ||
    !a.answers[id].every(Boolean)
  )
    return a;
  return { ...a, submitted: [...a.submitted, id] };
}
export function editEjuEssay(
  pack: EjuPack,
  a: EjuAttempt,
  essay: string,
  topic: number,
  now: number,
): EjuAttempt {
  const current = expireEju(pack, a, now);
  if (
    current !== a ||
    a.status !== 'active' ||
    pack.sections[a.section].kind !== 'writing' ||
    !pack.writing?.prompts[topic]
  )
    return current;
  return { ...a, essay: essay.slice(0, 6000), writingTopic: topic };
}
export function navigateEju(
  pack: EjuPack,
  a: EjuAttempt,
  index: number,
  now: number,
): EjuAttempt {
  const current = expireEju(pack, a, now);
  if (
    current !== a ||
    a.status !== 'active' ||
    !Number.isInteger(index) ||
    !sectionQuestions(pack, a)[index]
  )
    return current;
  return { ...a, index };
}
export function summarizeEju(pack: EjuPack, a: EjuAttempt) {
  const total = pack.questions.length;
  const answered = pack.questions.filter(
    (q) =>
      a.answers[q.id]?.length === q.answers.length &&
      a.answers[q.id].every(Boolean),
  ).length;
  const correct = pack.questions.filter((q) =>
    isCorrect(q, a.answers[q.id]),
  ).length;
  return {
    total,
    answered,
    correct,
    skipped: total - answered,
    percent: Math.round((correct / total) * 100),
    sections: pack.sections
      .filter((s) => s.kind !== 'writing')
      .map((s) => {
        const qs = pack.questions.filter((q) => q.section === s.id);
        return {
          id: s.id,
          total: qs.length,
          correct: qs.filter((q) => isCorrect(q, a.answers[q.id])).length,
        };
      }),
  };
}
export function validEjuAttempt(
  value: unknown,
  pack: EjuPack,
): value is EjuAttempt {
  if (!value || typeof value !== 'object') return false;
  const a = value as EjuAttempt;
  if (
    a.version !== 1 ||
    a.packId !== pack.id ||
    typeof a.id !== 'string' ||
    !['learn', 'mock', 'exam'].includes(a.mode) ||
    !['active', 'break', 'finished'].includes(a.status)
  )
    return false;
  if (
    !Number.isFinite(a.startedAt) ||
    !Number.isFinite(a.sectionStartedAt) ||
    a.sectionStartedAt < a.startedAt ||
    (a.section === 0 && a.sectionStartedAt !== a.startedAt) ||
    !Number.isInteger(a.section) ||
    !pack.sections[a.section] ||
    !Number.isInteger(a.index) ||
    a.index < 0
  )
    return false;
  const qs = sectionQuestions(pack, a);
  if (
    a.index >= Math.max(1, qs.length) ||
    (a.status === 'break' && a.section === pack.sections.length - 1)
  )
    return false;
  if (
    a.status === 'active' && a.mode === 'exam'
      ? !Number.isFinite(a.deadline) ||
        a.deadline !==
          a.sectionStartedAt + pack.sections[a.section].seconds * 1000
      : a.deadline !== null
  )
    return false;
  if (
    a.status === 'finished'
      ? !Number.isFinite(a.finishedAt) || a.finishedAt! < a.startedAt
      : a.finishedAt !== null
  )
    return false;
  if (
    typeof a.essay !== 'string' ||
    a.essay.length > 6000 ||
    !Number.isInteger(a.writingTopic) ||
    a.writingTopic < 0 ||
    a.writingTopic >= (pack.writing?.prompts.length ?? 1)
  )
    return false;
  if (
    !a.answers ||
    typeof a.answers !== 'object' ||
    Array.isArray(a.answers) ||
    !Array.isArray(a.submitted) ||
    !Array.isArray(a.audioPlayed)
  )
    return false;
  const allowed = pack.questions.filter(
    (q) => pack.sections.findIndex((s) => s.id === q.section) <= a.section,
  );
  if (
    !Object.entries(a.answers).every(([id, values]) => {
      const q = allowed.find((q) => q.id === id);
      return (
        q &&
        Array.isArray(values) &&
        values.length === q.answers.length &&
        values.every(
          (v) =>
            typeof v === 'string' &&
            (q.kind === 'numeric'
              ? /^[-0-9]?$/.test(v)
              : v === '' ||
                (/^[1-4]$/.test(v) && Number(v) <= q.options!.length)),
        )
      );
    })
  )
    return false;
  return (
    a.submitted.every(
      (id) => allowed.some((q) => q.id === id) && a.answers[id]?.every(Boolean),
    ) &&
    a.audioPlayed.every((id) => allowed.some((q) => q.id === id && q.audio))
  );
}
export function readEjuStorage(raw: string | null, pack: EjuPack): EjuStorage {
  try {
    const v = JSON.parse(raw ?? 'null');
    if (v?.version !== 1) return emptyEjuStorage();
    return {
      version: 1,
      active:
        validEjuAttempt(v.active, pack) && v.active.status !== 'finished'
          ? v.active
          : null,
      history: Array.isArray(v.history)
        ? v.history
            .filter(
              (a: unknown) =>
                validEjuAttempt(a, pack) && a.status === 'finished',
            )
            .slice(0, 30)
        : [],
    };
  } catch {
    return emptyEjuStorage();
  }
}
export function saveEjuAttempt(s: EjuStorage, a: EjuAttempt): EjuStorage {
  return a.status === 'finished'
    ? {
        version: 1,
        active: s.active?.id === a.id ? null : s.active,
        history: [a, ...s.history.filter((h) => h.id !== a.id)].slice(0, 30),
      }
    : { ...s, active: a };
}
