import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { mathPack } from '../data/eju-math.ts';
import { japanesePack } from '../data/eju-japanese.ts';
import { ejuTopics } from '../data/eju-topics.ts';
import {
  createEjuAttempt,
  answerEju,
  submitEju,
  editEjuEssay,
  navigateEju,
  expireEju,
  nextEjuSection,
  finishEjuSection,
  sectionQuestions,
  summarizeEju,
  readEjuStorage,
  saveEjuAttempt,
  emptyEjuStorage,
  ejuStorageKey,
  isCorrect,
  validEjuAttempt,
} from '../lib/eju-session.ts';
const packs = [mathPack('math1'), mathPack('math2'), japanesePack];
const now = 1000000;
test('EJU complete original practice papers have coherent IDs, answer cells, translations and topic coverage', () => {
  assert.deepEqual(
    packs.map((p) => p.questions.length),
    [20, 20, 52],
  );
  assert.deepEqual(
    japanesePack.questions
      .filter((q) => q.audio)
      .map((q) => q.group)
      .reduce((a, g) => ((a[g] = (a[g] ?? 0) + 1), a), {}),
    { 聴読解: 15, 聴解: 12 },
  );
  assert.deepEqual(
    packs.map((p) => p.sections.reduce((s, x) => s + x.seconds, 0)),
    [4800, 4800, 7500],
  );
  for (const p of packs) {
    assert.equal(
      new Set(p.questions.map((q) => q.id)).size,
      p.questions.length,
    );
    for (const q of p.questions) {
      assert.ok(p.sections.some((s) => s.id === q.section));
      assert.ok(
        ejuTopics.some((t) => t.id === q.topic && t.courses.includes(p.course)),
      );
      for (const lang of ['ru', 'en', 'ja'])
        assert.ok(q.explanation[lang].length > 15);
      assert.ok(q.prompt.length > 3);
      assert.ok(q.answers.length);
      if (q.kind === 'numeric') {
        assert.equal(q.labels.length, q.answers.length);
        assert.ok(q.answers.every((x) => /^[-0-9]$/.test(x)));
      } else {
        assert.equal(q.options.length, 4);
        assert.equal(new Set(q.options).size, 4);
        assert.ok(Number(q.answers[0]) >= 1 && Number(q.answers[0]) <= 4);
      }
    }
    for (const t of ejuTopics.filter((t) => t.courses.includes(p.course))) {
      assert.ok(
        t.id === 'jp-writing' || p.questions.some((q) => q.topic === t.id),
      );
      for (const lang of ['ru', 'en', 'ja'])
        assert.ok(t.lesson[lang].length > 35);
    }
  }
  for (const essay of japanesePack.writing.models) {
    const length = Array.from(essay.replace(/\s/g, '')).length;
    assert.ok(length >= 400 && length <= 500, length);
  }
});
// Expected values calculated independently of the bank's explanations.
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const choose = (n, k) => {
  let v = 1;
  for (let i = 1; i <= k; i++) v = (v * (n - i + 1)) / i;
  return v;
};
const roots = (fn, min, max) =>
  Array.from({ length: max - min + 1 }, (_, i) => i + min).filter(
    (x) => fn(x) === 0,
  );
const m1 = [
  [(1590 - 240) / 3],
  [...roots((x) => x * x - 7 * x + 12, 0, 10)],
  [(Math.sqrt(72) - Math.sqrt(8)) / Math.sqrt(2)],
  [23 + 21 - 12, 40 - (23 + 21 - 12)],
  [
    Array.from({ length: 18 }, (_, i) => i + 1).filter(
      (x) => x % 3 === 0 && x % 6 !== 0,
    ).length,
  ],
  [6 / 2, (6 / 2) ** 2 - 5],
  [
    Math.min(...[0, 1, 2].map((x) => x * x - 6 * x + 5)),
    Math.max(...[0, 1, 2].map((x) => x * x - 6 * x + 5)),
  ],
  roots((x) => x * x - 6 * x + 5, 0, 10),
  [-1],
  [25 + 49 - 70 * Math.cos(Math.PI / 3)],
  [(6 * 8 * Math.sin(Math.PI / 6)) / 2],
  [6 / (2 * Math.sin(Math.PI / 6))],
  [Math.sqrt(4 * 9)],
  [(10 * 6) / (6 + 9), (10 * 9) / (6 + 9)],
  [6 * 5 * 4],
  [2, 7],
  [2, 3],
  [700 / 5 - 200],
  [gcd(252, 198), (252 * 198) / gcd(252, 198)],
  [parseInt('132', 5), Number((47).toString(5))],
];
const seq = [3];
for (let i = 1; i < 5; i++) seq.push(2 * seq[i - 1] + 1);
const m2 = [
  [27 - 18 - 15 + 6, 2],
  [2, -3, Math.sqrt(12 + 4 + 9)],
  [Math.log2(48 / 3)],
  [roots((x) => (x - 1) * (x - 3) - 8, 4, 20)[0]],
  [3],
  [seq[4]],
  [
    Array.from({ length: 10 }, (_, i) => (i + 1) * (i + 2)).reduce(
      (a, b) => a + b,
      0,
    ),
  ],
  [5, 16, 5, 2],
  [1, 2],
  [2 * 1 - 1 * 2 + 2 * 2, 4, 9],
  [(1 + 2 * 7) / 3, (2 + 2 * 5) / 3],
  [2 + 3, -6 + 1],
  [-2, 1],
  [Math.sqrt(25 - 9), 2 * Math.sqrt(25)],
  [3, 2],
  [2 + 2],
  [3, 2],
  [-1, 3],
  [1, -1],
  [4, 3],
];
for (const [pi, expected] of [
  [0, m1],
  [1, m2],
])
  for (const [i, values] of expected.entries())
    test(`independent math check ${packs[pi].questions[i].id}`, () => {
      const strings = values.map((n) => String(Math.round(n)));
      assert.equal(packs[pi].questions[i].answers.join(''), strings.join(''));
    });
test('binomial and variance fractions agree with enumerated distributions', () => {
  assert.equal(choose(5, 2) / 2 ** 5, 5 / 16);
  const outcomes = Array.from(
    { length: 32 },
    (_, i) =>
      i
        .toString(2)
        .split('')
        .filter((x) => x === '1').length,
  );
  assert.equal(outcomes.reduce((a, b) => a + b, 0) / 32, 5 / 2);
  const values = [0, 1, 1, 2];
  const mean = values.reduce((a, b) => a + b, 0) / 4;
  assert.equal(values.reduce((s, x) => s + (x - mean) ** 2, 0) / 4, 1 / 2);
});
for (const pack of packs)
  for (const mode of ['learn', 'mock', 'exam'])
    test(`${pack.course} ${mode}: complete all sections, restore, score and isolate`, () => {
      let a = createEjuAttempt(pack, mode, now, `${pack.id}-${mode}`),
        s = emptyEjuStorage();
      for (let i = 0; i < pack.sections.length; i++) {
        if (i) a = nextEjuSection(pack, a, now + i * 1000);
        if (pack.sections[i].kind === 'writing')
          a = editEjuEssay(pack, a, japanesePack.writing.models[1], 1, now);
        const questions = sectionQuestions(pack, a);
        for (const [qi, q] of questions.entries()) {
          const time =
            mode === 'exam' && pack.sections[i].kind === 'listening'
              ? a.sectionStartedAt +
                Math.ceil(
                  (qi * pack.sections[i].seconds * 1000) / questions.length,
                )
              : now + i * 1000;
          a = answerEju(pack, a, q.id, q.answers, time);
          if (mode === 'learn') a = submitEju(pack, a, q.id, time);
          s = saveEjuAttempt(s, a);
          a = readEjuStorage(JSON.stringify(s), pack).active;
          assert.ok(a);
        }
        a = finishEjuSection(pack, a, now + i * 1000 + 1);
        assert.equal(
          a.status,
          i === pack.sections.length - 1 ? 'finished' : 'break',
        );
      }
      s = saveEjuAttempt(s, a);
      assert.equal(s.active, null);
      assert.equal(s.history.length, 1);
      assert.equal(summarizeEju(pack, a).percent, 100);
      assert.equal(
        readEjuStorage(
          JSON.stringify(s),
          packs.find((p) => p.id !== pack.id),
        ).history.length,
        0,
      );
      assert.equal(saveEjuAttempt(s, a).history.length, 1);
    });
test('every wrong Japanese choice is rejected by scoring; learning fixes first submitted answer', () => {
  const p = japanesePack;
  for (const q of p.questions)
    for (const choice of ['1', '2', '3', '4']) {
      if (choice === q.answers[0]) continue;
      let a = createEjuAttempt(p, 'learn', now, 'wrong');
      a = { ...a, section: p.sections.findIndex((s) => s.id === q.section) };
      a = answerEju(p, a, q.id, [choice], now);
      a = submitEju(p, a, q.id, now);
      assert.ok(!isCorrect(q, a.answers[q.id]));
      assert.deepEqual(answerEju(p, a, q.id, q.answers, now), a);
    }
});
test('numeric edits validate cells, preserve minus/leading positions and reject partial answers', () => {
  const p = packs[0],
    q = p.questions[6];
  let a = createEjuAttempt(p, 'learn', now, 'cells');
  a = answerEju(p, a, q.id, ['−', '３', '５'], now);
  assert.deepEqual(a.answers[q.id], q.answers);
  assert.ok(isCorrect(q, a.answers[q.id]));
  assert.equal(answerEju(p, a, q.id, ['x', '3', '5'], now), a);
  assert.equal(answerEju(p, a, q.id, ['3'], now), a);
  a = answerEju(p, a, q.id, ['-', '', '5'], now);
  assert.equal(submitEju(p, a, q.id, now), a);
  assert.equal(summarizeEju(p, a).answered, 0);
});
test('absolute deadlines reject late answers and essays; next section needs an explicit start', () => {
  const p = japanesePack;
  let a = createEjuAttempt(p, 'exam', now, 'clock');
  const end = a.deadline;
  a = editEjuEssay(p, a, 'late', 0, end);
  assert.equal(a.status, 'break');
  assert.equal(a.essay, '');
  assert.equal(a.deadline, null);
  assert.equal(expireEju(p, a, end + 999999), a);
  a = nextEjuSection(p, a, end + 999999);
  assert.equal(a.deadline, end + 999999 + 2400000);
  const q = p.questions[0];
  const b = answerEju(p, a, q.id, q.answers, a.deadline);
  assert.equal(b.status, 'break');
  assert.equal(b.answers[q.id], undefined);
  a = nextEjuSection(p, b, a.deadline + 100);
  a = expireEju(p, a, a.deadline);
  assert.equal(a.status, 'finished');
  assert.equal(
    a.finishedAt,
    a.startedAt + 1800000 + 999999 + 2400000 + 100 + 3300000,
  );
});
test('section locks prevent future and previous answers, navigation, or changing the essay', () => {
  const p = japanesePack;
  let a = createEjuAttempt(p, 'mock', now, 'lock');
  const r = p.questions[0],
    listen = p.questions.find((q) => q.audio);
  assert.equal(answerEju(p, a, r.id, r.answers, now), a);
  a = nextEjuSection(p, finishEjuSection(p, a, now), now);
  assert.equal(editEjuEssay(p, a, 'changed', 0, now), a);
  assert.equal(answerEju(p, a, listen.id, listen.answers, now), a);
  assert.equal(navigateEju(p, a, -1, now), a);
  assert.equal(navigateEju(p, a, 10000, now), a);
  a = nextEjuSection(p, finishEjuSection(p, a, now), now);
  assert.equal(answerEju(p, a, r.id, r.answers, now), a);
});
test('damaged storage and fabricated future answers are rejected', () => {
  const p = japanesePack,
    base = createEjuAttempt(p, 'exam', now, 'bad');
  for (const raw of ['', '{', 'null', '[]', '{"version":99}'])
    assert.deepEqual(readEjuStorage(raw, p), emptyEjuStorage());
  for (const patch of [
    { section: 999 },
    { deadline: null },
    { answers: { 'jp-r01': ['1'] } },
    { status: 'finished', finishedAt: null },
    { essay: [] },
    { writingTopic: 99 },
    { audioPlayed: ['unknown'] },
    { submitted: ['jp-r01'] },
    { index: 1.5 },
  ])
    assert.equal(validEjuAttempt({ ...base, ...patch }, p), false);
  assert.equal(new Set(packs.map(ejuStorageKey)).size, 3);
});
test('all synthetic recordings and transcripts exist, match text and fit their exam slots', () => {
  const manifest = JSON.parse(
    readFileSync('public/eju/audio/manifest.json', 'utf8'),
  );
  const qs = japanesePack.questions.filter((q) => q.audio);
  assert.ok(manifest.length >= qs.length + 1);
  for (const q of qs) {
    const file = 'public/' + q.audio;
    assert.ok(existsSync(file));
    const audio = readFileSync(file);
    assert.ok(audio.length > 10000);
    const row = manifest.find((x) => x.id === q.id);
    assert.ok(row);
    assert.equal(createHash('sha256').update(audio).digest('hex'), row.sha256);
    assert.equal(
      createHash('sha256').update(q.audioText).digest('hex'),
      row.textSha256,
    );
    assert.ok(row.seconds > 10 && row.seconds < 3300 / 27 - 10);
    assert.ok(
      readFileSync(file.replace('.mp3', '.vtt'), 'utf8').includes(q.audioText),
    );
  }
  assert.ok(existsSync('public/eju/audio/check.mp3'));
  assert.ok(existsSync('public/eju/audio/LICENSE-Mei.txt'));
});
