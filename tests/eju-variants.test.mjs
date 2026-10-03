import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { mathPack } from '../data/eju-math.ts';
import { japanesePack } from '../data/eju-japanese.ts';
import { variantPack } from '../data/eju-variants.ts';
import { ejuCurriculum } from '../data/eju-curriculum.ts';
import { ejuTopics } from '../data/eju-topics.ts';
import { selectNextEjuVariant } from '../lib/eju-variant-selection.ts';
import {
  createEjuAttempt,
  answerEju,
  finishEjuSection,
  nextEjuSection,
  saveEjuAttempt,
  emptyEjuStorage,
  readEjuStorage,
  summarizeEju,
  ejuStorageKey,
} from '../lib/eju-session.ts';
const courses = ['math1', 'math2', 'japanese'];
const all = courses.flatMap((c) =>
  Array.from({ length: 10 }, (_, i) =>
    i ? variantPack(c, i + 1) : c === 'japanese' ? japanesePack : mathPack(c),
  ),
);
const numbers = (q) => {
  const groups = {};
  q.labels.forEach(
    (label, i) => (groups[label[0]] = (groups[label[0]] ?? '') + q.answers[i]),
  );
  return Object.values(groups).map(Number);
};
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
test('next paper avoids current and active papers, prefers least-used, tolerates storage errors', () => {
  const read = (key) =>
    JSON.stringify({
      version: 1,
      active: key.includes('-02') ? { id: 'active' } : null,
      history: key.includes('-03') ? [] : [{}, {}],
    });
  assert.equal(
    selectNextEjuVariant('math1', 1, read, () => 0),
    3,
  );
  assert.notEqual(
    selectNextEjuVariant('japanese', 3, read, () => 0),
    3,
  );
  assert.equal(
    selectNextEjuVariant(
      'math2',
      1,
      () => {
        throw Error('denied');
      },
      () => 0,
    ),
    2,
  );
  let firstKey = '';
  selectNextEjuVariant(
    'math1',
    10,
    (key) => {
      firstKey ||= key;
      return null;
    },
    () => 0,
  );
  assert.ok(firstKey.endsWith('-01-r2'));
});
test('30 papers have separate persistence and meaningful content changes', () => {
  assert.equal(new Set(all.map(ejuStorageKey)).size, 30);
  for (const c of courses) {
    const packs = all.filter((p) => p.course === c);
    assert.equal(
      new Set(packs.map((p) => JSON.stringify(p.questions))).size,
      10,
    );
    for (let i = 0; i < packs.length; i++)
      for (let j = i + 1; j < packs.length; j++) {
        const key = (q) =>
          (q.passage ?? '') +
          q.prompt +
          (q.audioText ?? '') +
          JSON.stringify(q.visual ?? {});
        const texts = new Set(packs[i].questions.map(key));
        assert.ok(
          packs[j].questions.filter((q) => !texts.has(key(q))).length >=
            packs[j].questions.length * 0.8,
        );
      }
  }
  assert.ok(!JSON.stringify(all).includes('9y − 10 = 80'));
});
for (const p of all)
  test(`${p.id}: valid content, answer-all lifecycle and independent restore`, () => {
    assert.equal(p.questions.length, p.course === 'japanese' ? 52 : 20);
    assert.equal(
      new Set(p.questions.map((q) => q.id)).size,
      p.questions.length,
    );
    let a = createEjuAttempt(p, 'mock', 1000, 'id');
    let storage = emptyEjuStorage();
    for (let i = 0; i < p.sections.length; i++) {
      if (i) a = nextEjuSection(p, a, 1000 + i);
      for (const q of p.questions.filter(
        (q) => q.section === p.sections[i].id,
      )) {
        assert.ok(ejuCurriculum[q.topic]);
        if (q.kind === 'choice') {
          assert.equal(q.options.length, 4);
          assert.equal(new Set(q.options).size, 4);
          assert.ok(+q.answers[0] >= 1 && +q.answers[0] <= 4);
        } else {
          assert.equal(q.labels.length, q.answers.length);
          assert.ok(q.answers.every((x) => /^[-0-9]$/.test(x)));
        }
        a = answerEju(p, a, q.id, q.answers, 1000 + i);
      }
      a = finishEjuSection(p, a, 1001 + i);
    }
    storage = saveEjuAttempt(storage, a);
    assert.equal(summarizeEju(p, a).correct, p.questions.length);
    assert.deepEqual(readEjuStorage(JSON.stringify(storage), p), storage);
    const other = all.find((x) => x.course === p.course && x.id !== p.id);
    assert.equal(
      readEjuStorage(JSON.stringify(storage), other).history.length,
      0,
    );
    if (p.writing)
      for (const model of p.writing.models)
        assert.ok(
          model.replace(/\s/g, '').length >= 400 &&
            model.replace(/\s/g, '').length <= 500,
        );
  });
for (let v = 2; v <= 10; v++)
  test(`variant ${v}: independent mathematical constraints`, () => {
    const m1 = variantPack('math1', v).questions.map(numbers),
      m2 = variantPack('math2', v).questions.map(numbers);
    const n = v + 2,
      h = v + 1,
      r = v + 3,
      a = v + 2,
      b = v + 5;
    // Verify returned answers by substitution, enumeration and geometry rather than comparing serialized fixtures.
    assert.equal(n * m1[0][0] + 80 + 10 * v, n * (120 + 20 * v) + 80 + 10 * v);
    assert.equal(m1[1][0] + m1[1][1], a + b);
    assert.equal(m1[1][0] * m1[1][1], a * b);
    near(
      Math.sqrt(2 * (n + 3) ** 2) -
        Math.sqrt(2 * n * n) +
        m1[2][0] * Math.sqrt(2),
      Math.sqrt(2 * (n + 1) ** 2),
    );
    assert.equal(m1[3][0], 25 + v + 24 + v - (8 + v));
    assert.equal(m1[3][0] + m1[3][1], 60 + 3 * v);
    assert.equal(
      m1[4][0],
      Array.from({ length: 2 * n * (v + 1) }, (_, i) => i + 1).filter(
        (x) => x % n === 0 && x % (2 * n) !== 0,
      ).length,
    );
    for (const x of [-3, 0, 5])
      assert.equal(
        (x - m1[5][0]) ** 2 - m1[5][1],
        x * x - 2 * h * x + h * h - n,
      );
    const vals = Array.from({ length: 31 }, (_, i) => h - 2 + i / 10).map(
      (x) => (x - h) ** 2 - n,
    );
    near(m1[6][0], Math.min(...vals));
    near(m1[6][1], Math.max(...vals));
    for (const x of m1[7]) assert.equal(x * x - (a + b) * x + a * b, 0);
    assert.equal((2 * n) ** 2 + 4 * m1[8][0], 0);
    assert.equal(m1[8][1], n);
    near(
      m1[9][0],
      a * a +
        b * b -
        2 * a * b * Math.cos(((v % 2 ? 120 : 60) * Math.PI) / 180),
    );
    near(m1[10][0], 0.5 * 2 * n * 2 * r * Math.sin(Math.PI / 6));
    near(m1[11][0], 2 * n * Math.sin(Math.PI / 6));
    assert.equal(m1[12][0] ** 2, n * n * r * r);
    near(m1[13][0] / m1[13][1], 2 / 3);
    assert.equal(m1[13][0] + m1[13][1], 5 * h);
    let pairs = 0,
      redpairs = 0;
    for (let i = 0; i < 2 * v + 5; i++)
      for (let j = i + 1; j < 2 * v + 5; j++) {
        pairs++;
        if (i < v + 3 && j < v + 3) redpairs++;
      }
    near(m1[15][0] / m1[15][1], redpairs / pairs);
    assert.equal(m1[14][0], (n * (n - 1)) / (v % 2 ? 2 : 1));
    near(
      m1[16][0] / m1[16][1],
      Array.from({ length: n }, (_, i) => 2 * (i + 1)).filter((x) => x >= 2 * h)
        .length / n,
    );
    near(m1[17][0], (n * (70 + v)) / n - (100 + 10 * v));
    assert.equal((12 * n) % m1[18][0], 0);
    assert.equal((18 * n) % m1[18][0], 0);
    assert.equal(m1[18][0] * m1[18][1], 12 * n * 18 * n);
    assert.equal(m1[19][0], parseInt('123', n));
    assert.equal(parseInt(String(m1[19][1]), n), n * n + 3 * n + 2);
    const u = v + 1,
      w = v + 3,
      k = v + 2;
    assert.equal(m2[0][0], u ** 3 - (u + w) * u * u + u * w * u + v);
    assert.deepEqual(m2[1], [u, -w, k]);
    near((k + 1) * k ** m2[2][0], (k + 1) * k ** (v + 1));
    near(Math.log2(m2[3][0] - v) + Math.log2(m2[3][0] - v - 2), 3);
    assert.equal(m2[4][0], v * 3);
    let seq = u;
    for (let i = 1; i < 5; i++) seq = 2 * seq + v;
    assert.equal(m2[5][0], seq);
    assert.equal(
      m2[6][0],
      Array.from({ length: n }, (_, i) => (i + 1) * (i + 2)).reduce(
        (a, b) => a + b,
        0,
      ),
    );
    const outcomes = Array.from(
      { length: 2 ** (v + 3) },
      (_, i) => i.toString(2).replace(/0/g, '').length,
    );
    near(
      m2[7][0] / m2[7][1],
      outcomes.filter((x) => x === 2).length / outcomes.length,
    );
    near(
      m2[7][2] / m2[7][3],
      outcomes.reduce((a, b) => a + b) / outcomes.length,
    );
    const sample = [0, k, k, 2 * k],
      mean = sample.reduce((a, b) => a + b) / 4;
    near(
      m2[8][0] / m2[8][1],
      sample.reduce((s, x) => s + (x - mean) ** 2, 0) / 4,
    );
    assert.deepEqual(m2[9], [u * k - k * u - w, u * u + k * k + 1]);
    assert.deepEqual(m2[10], [(v + 2 * (v + 6)) / 3, (u + 2 * (u + 3)) / 3]);
    assert.deepEqual(m2[11], [u + k, 1 - u * k]);
    assert.deepEqual(m2[12], v % 2 ? [k, -u] : [-k, u]);
    assert.equal(m2[13][0] ** 2, 25 * v * v - 9 * v * v);
    assert.equal(m2[13][1] ** 2 / 4, 25 * v * v);
    const inverse = (x) => (x + m2[14][0]) / (x - m2[14][1]);
    near((u * inverse(100) + k) / (inverse(100) - 1), 100);
    near(m2[15][0], 2 * k);
    near(m2[16][0] / m2[16][1], u / w);
    for (const x of m2[17])
      assert.equal(6 * x * x - 6 * (u + w) * x + 6 * u * w, 0);
    assert.equal(m2[18][0] + m2[18][1], v);
    assert.equal(m2[18][0], k);
    // Midpoint quadrature provides an independent numerical check of the area key.
    let area = 0;
    for (let i = 0; i < 10000; i++) {
      const x = ((i + 0.5) * k) / 10000;
      area += ((k * x - x * x) * k) / 10000;
    }
    assert.ok(Math.abs(area - m2[19][0] / m2[19][1]) < 0.00001);
  });
test('every curriculum unit has explanation, example and reachable practice in every paper', () => {
  assert.equal(Object.keys(ejuCurriculum).length, 27);
  assert.equal(Object.values(ejuCurriculum).flat().length, 64);
  for (const t of ejuTopics)
    for (const u of ejuCurriculum[t.id]) {
      assert.ok(
        u.study.length > 150 && u.example.length > 40 && u.pitfall.length > 30,
      );
      if (t.id === 'jp-writing') continue;
      for (const p of all.filter((p) => t.courses.includes(p.course)))
        assert.ok(
          p.questions.some(
            (q, i) =>
              q.topic === t.id &&
              (!u.questionNumbers.length || u.questionNumbers.includes(i + 1)),
          ),
          `${p.id} ${u.id}`,
        );
    }
});
test('270 audio scripts, recorded option numbers, captions and bytes agree', () => {
  const manifest = JSON.parse(
    readFileSync('public/eju/audio/manifest.json', 'utf8'),
  );
  assert.equal(manifest.length, 271);
  for (const p of all.filter((p) => p.course === 'japanese'))
    for (const q of p.questions.filter((q) => q.audio)) {
      const row = manifest.find((x) => x.id === q.id);
      assert.ok(row);
      assert.ok(row.seconds > 10 && row.seconds < 3300 / 27 - 10);
      assert.equal(
        createHash('sha256').update(q.audioText).digest('hex'),
        row.textSha256,
      );
      assert.equal(
        createHash('sha256')
          .update(readFileSync('public/' + q.audio))
          .digest('hex'),
        row.sha256,
      );
      assert.ok(
        readFileSync(
          'public/' + q.audio.replace('.mp3', '.vtt'),
          'utf8',
        ).includes(q.audioText),
      );
      q.options.forEach((x, i) =>
        assert.ok(q.audioText.includes(`${i + 1}番。${x}`)),
      );
    }
});
test('integrated audio answer keys satisfy displayed constraints, irrespective of option rotation', () => {
  for (let v = 2; v <= 10; v++)
    variantPack('japanese', v)
      .questions.filter((q) => q.visual)
      .forEach((q, i) => {
        const rows = q.visual.rows;
        const selected = q.options[Number(q.answers[0]) - 1];
        let expected;
        if (i % 3 === 0) expected = rows.filter((r) => r[2] === '録音可');
        else if (i % 3 === 1) {
          const limit = Number(q.audioText.match(/予算は(\d+)円/)[1]);
          expected = rows.filter((r) => +r[1] <= limit && +r[2] <= 60);
        } else {
          const max = Math.max(...rows.map((r) => +r[2] / +r[1]));
          expected = rows.filter((r) => +r[2] / +r[1] === max);
        }
        assert.equal(expected.length, 1);
        assert.equal(selected, expected[0][0]);
      });
});
