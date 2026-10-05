import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { roadmapGuides } from '../data/roadmap-guides.ts';
import { ejuTopicGuides } from '../data/eju-topic-guides.ts';
import { ejuUnitChecks } from '../data/eju-unit-checks.ts';
import { ejuCurriculum } from '../data/eju-curriculum.ts';
import { ejuRoadmapTopics } from '../data/eju-roadmap-plan.ts';

test('every active ITPEC/IPA block has a complete original chapter and an unambiguous checkpoint', () => {
  const index = JSON.parse(readFileSync('data/roadmap-index.json', 'utf8'));
  const active = [...new Set(index.topics.map((t) => t.group))].sort();
  assert.equal(active.length, 35);
  assert.deepEqual(Object.keys(roadmapGuides).sort(), active);
  for (const [id, g] of Object.entries(roadmapGuides)) {
    assert.ok(g.before && g.outcome && g.terms, id);
    assert.equal(g.sections.length, 2, id);
    assert.ok(
      g.sections.every(
        ([title, text]) => title.length > 5 && text.length > 150,
      ),
      id,
    );
    assert.ok(
      g.example.length > 100 &&
        g.explanation.length > 60 &&
        g.advanced.length > 80,
      id,
    );
    assert.equal(new Set(g.options).size, g.options.length, id);
    assert.ok(
      Number.isInteger(g.correct) &&
        g.correct >= 0 &&
        g.correct < g.options.length,
      id,
    );
  }
});

test('calculation checkpoints agree with independent computations and consistent units', () => {
  const chosen = (id) => roadmapGuides[id].options[roadmapGuides[id].correct];
  assert.equal(
    chosen('numbers'),
    String(parseInt('11111100', 2) - 2 ** 8).replace('-', '−'),
  );
  assert.equal(chosen('logic'), (0b1010 ^ 0b1100).toString(2).padStart(4, '0'));
  assert.equal(chosen('math'), `${(10 * 2 + 30 * 6) / 40} с`);
  assert.equal(
    chosen('hardware'),
    `${((1e8 * 2) / 1e9).toString().replace('.', ',')} с`,
  );
  assert.equal(chosen('storage'), `${(3 - 1) * 4} ТБ`);
  assert.equal(chosen('architecture'), `${(99 / (99 + 1)) * 100}%`);
  assert.equal(chosen('ai'), `${(18 / 30) * 100}%`);
  assert.equal(
    chosen('media').replaceAll(' ', ''),
    String((100 * 100 * 24) / 8),
  );
  assert.equal(chosen('networks'), String(2 ** (32 - 27) - 2));
  assert.equal(chosen('projects'), (80 / 100).toString().replace('.', ','));
  assert.equal(chosen('finance'), String(6000 / (80 - 50)));
  assert.equal(chosen('marketing'), `${(12 / 400) * 100}%`);
  assert.equal(chosen('operations'), String(12 * 0.5));
});

test('EJU prerequisite graph has no cycles or links outside its course scope', () => {
  assert.deepEqual(
    Object.keys(ejuTopicGuides).sort(),
    Object.keys(ejuCurriculum).sort(),
  );
  function visit(id, path = []) {
    assert.ok(!path.includes(id), `cycle: ${[...path, id].join(' -> ')}`);
    const guide = ejuTopicGuides[id];
    assert.ok(guide, id);
    for (const p of guide.before) visit(p, [...path, id]);
  }
  for (const id of Object.keys(ejuTopicGuides)) visit(id);
  for (const course of ['math1', 'math2', 'japanese']) {
    const ids = ejuRoadmapTopics(course).map((t) => t.id);
    for (const id of ids)
      for (const p of ejuTopicGuides[id].before)
        assert.ok(ids.includes(p), `${course}: ${id} -> ${p}`);
  }
});

test('all 64 original EJU lessons get their own retrieval exercise without losing question mappings', () => {
  const originals = Object.values(ejuCurriculum)
    .flat()
    .filter((u) => !u.standalone);
  assert.equal(originals.length, 64);
  assert.deepEqual(
    Object.keys(ejuUnitChecks).sort(),
    originals.map((u) => u.id).sort(),
  );
  for (const u of originals) {
    assert.equal(u.selfCheck, ejuUnitChecks[u.id]);
    assert.ok(u.id.startsWith('jp-') || u.questionNumbers.length > 0, u.id);
  }
  const prompts = Object.values(ejuCurriculum)
    .flat()
    .map((u) => u.selfCheck.prompt);
  assert.equal(new Set(prompts).size, 90);
});

test('new calculus self-checks agree with numerical integration and inverse slope', () => {
  function integral(f, a, b) {
    let sum = 0;
    const n = 10000;
    for (let i = 0; i < n; i++)
      sum += (f(a + ((i + 0.5) * (b - a)) / n) * (b - a)) / n;
    return sum;
  }
  const extra = Object.values(ejuCurriculum).flat();
  const answer = (id) => extra.find((u) => u.id === id).selfCheck.answer;
  assert.ok(answer('integrals/substitution').includes('19/3'));
  assert.ok(
    Math.abs(integral((x) => 3 * x * x * (x ** 3 + 2) ** 2, 0, 1) - 19 / 3) <
      1e-6,
  );
  assert.ok(answer('integrals/parts').includes('=1'));
  assert.ok(Math.abs(integral(Math.log, 1, Math.E) - 1) < 1e-6);
  const slope = (Math.sqrt(9 + 1e-4) - Math.sqrt(9 - 1e-4)) / 2e-4;
  assert.ok(answer('derivatives/inverse-higher').includes('1/6'));
  assert.ok(Math.abs(slope - 1 / 6) < 1e-7);
});
