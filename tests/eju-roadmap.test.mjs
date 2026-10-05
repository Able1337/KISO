import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ejuRoadmapTopics,
  ejuStages,
  ejuPracticeCourse,
} from '../data/eju-roadmap-plan.ts';
import { ejuCurriculum } from '../data/eju-curriculum.ts';
import { readEjuRoadmapProgress } from '../lib/eju-roadmap-progress.ts';
import { mathPack } from '../data/eju-math.ts';

test('Course 2 includes all seven foundations followed by thirteen advanced topics without duplicates', () => {
  const base = ejuRoadmapTopics('math1').map((t) => t.id);
  const full = ejuRoadmapTopics('math2').map((t) => t.id);
  assert.equal(base.length, 7);
  assert.equal(full.length, 20);
  assert.equal(new Set(full).size, 20);
  assert.deepEqual(full.slice(0, 7), base);
  for (const course of ['math1', 'math2', 'japanese']) {
    for (const stage of ejuStages(course)) {
      assert.ok(stage.goal.length > 100);
      for (const id of stage.topics) assert.ok(ejuCurriculum[id]?.length);
    }
  }
});

test('foundation practice in Math 2 resolves to the Math 1 bank', () => {
  for (const topic of ejuRoadmapTopics('math2')) {
    const source = ejuPracticeCourse(topic.id);
    assert.equal(source, topic.courses[0]);
    const pack = mathPack(source);
    for (const u of ejuCurriculum[topic.id].filter((u) => !u.standalone))
      assert.ok(
        pack.questions.some(
          (q, i) => q.topic === topic.id && u.questionNumbers.includes(i + 1),
        ),
        u.id,
      );
  }
});

test('old progress expands only original lessons; new lessons stay unstudied and invalid data is ignored', () => {
  const units = ejuRoadmapTopics('math2').flatMap((t) => ejuCurriculum[t.id]);
  const original = ejuCurriculum.expressions
    .filter((u) => !u.standalone)
    .map((u) => u.id);
  assert.deepEqual(readEjuRoadmapProgress('["expressions"]', units), original);
  assert.deepEqual(
    readEjuRoadmapProgress(
      '["expressions/unit-1","unknown",null,"expressions/unit-1"]',
      units,
    ),
    ['expressions/unit-1'],
  );
  const newId = 'expressions/absolute-inequalities';
  assert.deepEqual(readEjuRoadmapProgress(JSON.stringify([newId]), units), [
    newId,
  ]);
  for (const raw of ['broken', '{}', 'null', null])
    assert.deepEqual(readEjuRoadmapProgress(raw, units), []);
  assert.equal(new Set(units.map((u) => u.id)).size, units.length);
});
