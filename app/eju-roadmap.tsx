import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ejuStages,
  ejuRoadmapTopics,
  ejuPracticeCourse,
  ejuRoadmapSources,
} from '../data/eju-roadmap-plan';
import { readEjuRoadmapProgress } from '../lib/eju-roadmap-progress';
import { ejuCurriculum, type EjuUnit } from '../data/eju-curriculum';
import { loadEjuPack } from '../lib/eju-catalog';
import {
  ejuNames,
  type EjuCourse,
  type EjuLanguage,
  type EjuPack,
  type EjuQuestion,
} from '../lib/eju-types';
import EjuQuestionView from './eju-question';
import EjuMaterials from './eju-materials';

export default function EjuRoadmap({
  course,
  language,
}: {
  course: EjuCourse;
  language: EjuLanguage;
}) {
  const l = (ru: string, en: string, ja: string) => ({ ru, en, ja })[language];
  const topics = useMemo(() => ejuRoadmapTopics(course), [course]);
  const stages = ejuStages(course);
  const allUnits = useMemo(
    () => topics.flatMap((t) => ejuCurriculum[t.id]),
    [topics],
  );
  const [done, setDone] = useState<string[]>([]),
    [ready, setReady] = useState(false),
    [error, setError] = useState(false);
  const [query, setQuery] = useState(''),
    [status, setStatus] = useState('all'),
    [opened, setOpened] = useState<string | null>(null);
  const [variant, setVariant] = useState(1),
    [packs, setPacks] = useState<Partial<Record<EjuCourse, EjuPack>>>({}),
    [loadError, setLoadError] = useState(false);
  const key = `kiso-eju-roadmap-v1:${course}`;
  const read = useCallback(
    (raw: string | null) => {
      return readEjuRoadmapProgress(raw, allUnits);
    },
    [allUnits],
  );
  useEffect(() => {
    const sync = () => {
      try {
        setDone(read(localStorage.getItem(key)));
        setError(false);
      } catch {
        setError(true);
      }
      setReady(true);
    };
    queueMicrotask(sync);
    const listener = (e: StorageEvent) => {
      if (e.key === key || e.key === null) sync();
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, [key, read]);
  useEffect(() => {
    let alive = true;
    queueMicrotask(() => {
      if (alive) {
        setPacks({});
        setLoadError(false);
      }
    });
    Promise.all(
      (course === 'math2' ? (['math1', 'math2'] as const) : [course]).map((c) =>
        loadEjuPack(c, variant),
      ),
    )
      .then((loaded) => {
        if (alive)
          setPacks(Object.fromEntries(loaded.map((p) => [p.course, p])));
      })
      .catch(() => {
        if (alive) setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, [course, variant]);
  function mark(ids: string[], checked: boolean) {
    let current = done;
    try {
      current = read(localStorage.getItem(key));
    } catch {
      setError(true);
    }
    const next = checked
      ? [...new Set([...current, ...ids])]
      : current.filter((x) => !ids.includes(x));
    setDone(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setError(false);
    } catch {
      setError(true);
    }
  }
  const search = query.normalize('NFKC').toLowerCase().trim();
  const visible = topics
    .map((t) => ({
      ...t,
      units: ejuCurriculum[t.id].filter(
        (u) =>
          [...Object.values(t.title), u.title, u.study, u.example]
            .join(' ')
            .normalize('NFKC')
            .toLowerCase()
            .includes(search) &&
          (status === 'all' ||
            (status === 'done' ? done.includes(u.id) : !done.includes(u.id))),
      ),
    }))
    .filter((t) => t.units.length);
  return (
    <section className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="text-3xl font-bold">
        {ejuNames[course]} · {l('Роадмап', 'Roadmap', 'ロードマップ')}
      </h1>
      <p className="mt-4 max-w-4xl leading-7 text-muted-foreground">
        {l(
          'Учебный маршрут: тема → подтемы → объяснение метода → пример → практика на заданиях. Порядок рекомендованный, все темы доступны.',
          'Study route: topic → subtopics → method → worked example → exam practice. All topics are unlocked.',
          'テーマ→小項目→解法→例題→試験練習。すべてのテーマにアクセスできます。',
        )}
      </p>
      {course === 'math2' && (
        <p className="mt-3 text-sm">
          {l(
            'Здесь включена вся база Math 1: программа Course 2 охватывает разделы 1–20. Базовые задания берутся из Math 1, отметки этого маршрута сохраняются отдельно.',
            'Math 1 foundations are included: Course 2 covers topics 1–20. Foundation practice uses Math 1 papers; roadmap marks remain separate.',
            'コース2は項目1〜20を含むため、Math 1の基礎も掲載しています。基礎練習はMath 1から、学習記録はコース別です。',
          )}
        </p>
      )}
      <div className="mt-5 rounded-2xl border bg-card p-5 leading-7">
        <p className="text-sm">
          {l(
            'Сверено с JASSO · 04.10.2026: ',
            'Reviewed against JASSO · 2026-10-04: ',
            'JASSO確認 · 2026-10-04：',
          )}
          <a
            className="text-primary underline"
            href={
              course === 'japanese'
                ? ejuRoadmapSources.japanese
                : ejuRoadmapSources.mathematics
            }
            target="_blank"
            rel="noreferrer"
          >
            {l(
              course === 'japanese'
                ? 'навыки Japanese'
                : 'программа математики с 2026 года',
              'Official syllabus',
              '公式シラバス',
            )}
          </a>
          {' · '}
          <a
            className="text-primary underline"
            href={ejuRoadmapSources.papers}
            target="_blank"
            rel="noreferrer"
          >
            JASSO 2018 ·{' '}
            {l('задания и ответы', 'papers and answers', '問題・解答')}
          </a>
          {course === 'japanese' && (
            <>
              {' · '}
              <a
                className="text-primary underline"
                href={ejuRoadmapSources.writing}
                target="_blank"
                rel="noreferrer"
              >
                {l('Критерии сочинения', 'Writing criteria', '記述の採点基準')}
              </a>
            </>
          )}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {l(
            'Прочитайте урок → решите пример без подсказки → выполните самопроверку → выберите другой вариант практики. Отмечайте тему, когда можете объяснить решение и исправить ошибку. Уроки и порядок — авторские; банк практики пока не проверяет каждый пункт программы. Дополнительные упражнения отмечены отдельно.',
            'Read → solve without hints → self-check → try another paper. Mark a topic when you can explain the solution and correct mistakes. Lessons and ordering are authored; the practice bank does not yet test every syllabus point. Extra exercises are labelled separately.',
            '教材→ヒントなしで解く→自己確認→別セットで練習。解法と誤りを説明できたらチェックします。教材と順序は独自で、問題集は全項目を網羅していません。追加演習は別表示です。',
          )}
        </p>
      </div>
      <nav
        aria-label={l('Этапы EJU', 'EJU stages', 'EJU学習段階')}
        className="mt-5 grid gap-3 sm:grid-cols-2"
      >
        {stages.map((stage, i) => (
          <button
            key={stage.id}
            className="rounded-xl border bg-card p-4 text-left"
            onClick={() => {
              setQuery('');
              setStatus('all');
              requestAnimationFrame(() =>
                document
                  .getElementById(`eju-stage-${stage.id}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
              );
            }}
          >
            <span className="text-xs text-primary">
              {l('Этап', 'Stage', '段階')} {i + 1}
            </span>
            <strong lang="ru" className="mt-1 block">
              {stage.title}
            </strong>
            <span className="mt-2 block text-xs text-muted-foreground">
              {
                stage.topics
                  .flatMap((id) => ejuCurriculum[id])
                  .filter((u) => done.includes(u.id)).length
              }
              /{stage.topics.flatMap((id) => ejuCurriculum[id]).length}{' '}
              {l('изучено', 'studied', '学習済み')}
            </span>
          </button>
        ))}
      </nav>
      <div className="my-6 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap justify-between gap-3">
          <strong>
            {l('Изучено подтем', 'Subtopics studied', '学習済み小項目')}:{' '}
            {done.length}/{allUnits.length}
          </strong>
          <span>
            {topics.length} {l('тем', 'topics', 'テーマ')} · 10{' '}
            {l('вариантов практики', 'practice papers', '練習セット')}
          </span>
        </div>
        <progress
          aria-label={l('Прогресс изучения', 'Study progress', '学習進捗')}
          className="mt-4 h-2 w-full accent-teal-700"
          max={allUnits.length}
          value={done.length}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          {l(
            'Отметки — ваша самооценка. Сохраняются отдельно от результатов экзаменов.',
            'Checkboxes are self-assessment, saved separately from exam results.',
            'チェックは自己評価で、試験結果とは別に保存されます。',
          )}
        </p>
      </div>
      {error && (
        <p role="alert">
          {l(
            'Сохранение недоступно. Отметки останутся в памяти до закрытия страницы.',
            'Storage unavailable. Marks remain in memory until the page closes.',
            '保存できません。このページ内のみ保持されます。',
          )}
        </p>
      )}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          aria-label={l('Поиск темы', 'Search topics', 'テーマ検索')}
          placeholder={l(
            'Тема или подтема: логарифмы, условие, касательная…',
            'Topic or subtopic…',
            'テーマ・小項目…',
          )}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border bg-card p-3"
        />
        <select
          aria-label={l('Статус изучения', 'Study status', '学習状態')}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border bg-card p-3"
        >
          <option value="all">{l('Все', 'All', 'すべて')}</option>
          <option value="todo">
            {l('Не изучено', 'Not studied', '未学習')}
          </option>
          <option value="done">{l('Изучено', 'Studied', '学習済み')}</option>
        </select>
        <label className="flex items-center gap-2 rounded-xl border bg-card px-3 text-sm">
          {l('Практика', 'Practice', '練習')}
          <select
            aria-label={l('Вариант практики', 'Practice paper', '練習セット')}
            value={variant}
            onChange={(e) => setVariant(Number(e.target.value))}
            className="bg-card py-3"
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i} value={i + 1}>
                {String(i + 1).padStart(2, '0')}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loadError && (
        <p role="alert">
          {l(
            'Не удалось загрузить задания. Переключите вариант и повторите.',
            'Could not load questions. Switch papers to retry.',
            '問題を読み込めません。セットを切り替えて再試行してください。',
          )}
        </p>
      )}
      <div className="space-y-7 border-l-2 border-primary/20 pl-5">
        {visible.map((t, i) => {
          const stage = stages.find((s) => s.topics.includes(t.id))!;
          const firstInStage =
            i === 0 || !stage.topics.includes(visible[i - 1].id);
          const pack = packs[ejuPracticeCourse(t.id)];
          const children = ejuCurriculum[t.id],
            count = children.filter((u) => done.includes(u.id)).length;
          return (
            <div key={t.id}>
              {firstInStage && (
                <div
                  id={`eju-stage-${stage.id}`}
                  className="mb-5 scroll-mt-24"
                  lang="ru"
                >
                  <h2 className="text-2xl font-bold">
                    {stages.indexOf(stage) + 1}. {stage.title}
                  </h2>
                  <p className="mt-3 max-w-4xl leading-7 text-muted-foreground">
                    {stage.goal}
                  </p>
                </div>
              )}
              <article
                key={t.id}
                className="min-w-0 rounded-2xl border bg-card p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-bold">
                    <span className="mr-3 text-primary">
                      {String(
                        topics.findIndex((item) => item.id === t.id) + 1,
                      ).padStart(2, '0')}
                    </span>
                    {t.title[language]}
                  </h2>
                  <label className="flex shrink-0 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      disabled={!ready}
                      checked={count === children.length}
                      aria-label={
                        l('Весь блок: ', 'Entire topic: ', '全項目：') +
                        t.title[language]
                      }
                      onChange={(e) =>
                        mark(
                          children.map((u) => u.id),
                          e.target.checked,
                        )
                      }
                      className="size-5 accent-teal-700"
                    />
                    {count}/{children.length}
                  </label>
                </div>
                <p className="mt-4 leading-7 text-muted-foreground">
                  {t.lesson[language]}
                </p>
                <h3 className="mt-5 text-sm font-semibold">
                  {l('Что изучать', 'What to study', '学習項目')}
                </h3>
                {language !== 'ru' && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {l(
                      '',
                      'Detailed lessons below are in Russian; overviews and practice controls follow your interface language.',
                      '以下の詳しい教材はロシア語です。概要・練習操作は選択した言語で表示します。',
                    )}
                  </p>
                )}
                <div className="mt-3 space-y-3">
                  {t.units.map((u) => (
                    <div key={u.id} className="rounded-xl border p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          aria-label={u.title}
                          disabled={!ready}
                          checked={done.includes(u.id)}
                          onChange={(e) => mark([u.id], e.target.checked)}
                          className="mt-1 size-5 shrink-0 accent-teal-700"
                        />
                        <button
                          className="min-w-0 flex-1 text-left font-semibold leading-6"
                          aria-expanded={opened === u.id}
                          onClick={() =>
                            setOpened(opened === u.id ? null : u.id)
                          }
                          lang="ru"
                        >
                          {u.title}
                          <span className="mt-1 block text-xs font-normal text-primary">
                            {l(
                              'Открыть урок и связанные задания',
                              'Open lesson and linked questions',
                              '教材と関連問題を開く',
                            )}{' '}
                            {opened === u.id ? '−' : '+'}
                          </span>
                        </button>
                      </div>
                      {opened === u.id && (
                        <div className="mt-4 border-t pt-4">
                          <div lang="ru" className="space-y-4 leading-7">
                            <p>{u.study}</p>
                            <div className="rounded-xl bg-primary/5 p-4">
                              <h4 className="font-semibold">
                                Разобранный пример
                              </h4>
                              <p className="mt-2">{u.example}</p>
                            </div>
                            <p>
                              <strong>Типичная ошибка. </strong>
                              {u.pitfall}
                            </p>
                            {u.selfCheck && (
                              <div className="rounded-xl border p-4">
                                <h4 className="font-semibold">
                                  Самопроверка · дополнительное упражнение
                                </h4>
                                <p className="mt-2">{u.selfCheck.prompt}</p>
                                <details className="mt-3">
                                  <summary className="cursor-pointer text-primary">
                                    Показать решение
                                  </summary>
                                  <p className="mt-2">{u.selfCheck.answer}</p>
                                </details>
                                <p className="mt-3 text-xs text-muted-foreground">
                                  Это отдельная учебная задача. Прямое
                                  соответствие заданию экзаменационного варианта
                                  пока не задано.
                                </p>
                              </div>
                            )}
                          </div>
                          {pack ? (
                            <UnitPractice
                              key={pack.id + u.id}
                              unit={u}
                              topic={t.id}
                              pack={pack}
                              language={language}
                            />
                          ) : (
                            <p className="mt-4">
                              {l(
                                'Загрузка практики…',
                                'Loading practice…',
                                '練習を読み込み中…',
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            </div>
          );
        })}
      </div>
      {!visible.length && (
        <p aria-live="polite" className="p-6">
          {l(
            'Темы не найдены',
            'No topics found',
            '該当するテーマはありません',
          )}
        </p>
      )}
      <EjuMaterials language={language} />
    </section>
  );
}
function UnitPractice({
  unit,
  topic,
  pack,
  language,
}: {
  unit: EjuUnit;
  topic: string;
  pack: EjuPack;
  language: EjuLanguage;
}) {
  const l = (ru: string, en: string, ja: string) => ({ ru, en, ja })[language];
  const questions = pack.questions.filter(
    (q, i) =>
      q.topic === topic &&
      (!unit.questionNumbers.length || unit.questionNumbers.includes(i + 1)),
  );
  const [selected, setSelected] = useState<string | null>(null);
  if (unit.selfCheck) return null;
  if (topic === 'jp-writing' && pack.writing)
    return (
      <section className="mt-5 border-t pt-4">
        <h4 className="font-semibold">
          {l('Практика: сочинение', 'Writing practice', '記述練習')}
        </h4>
        {pack.writing.prompts.map((p, i) => (
          <details key={p} className="mt-3 rounded-xl border p-4">
            <summary lang="ja" className="cursor-pointer leading-7">
              {p}
            </summary>
            <p className="my-3 text-sm">{pack.writing!.guidance[language]}</p>
            <p lang="ja" className="whitespace-pre-line leading-8">
              {pack.writing!.models[i]}
            </p>
          </details>
        ))}
      </section>
    );
  return (
    <section className="mt-5 border-t pt-4">
      <h4 className="font-semibold">
        {l('Связанные задания', 'Linked questions', '関連問題')} ·{' '}
        {pack.title[language]}
      </h4>
      <p className="mt-2 text-xs text-muted-foreground">
        {l(
          'Здесь тренируются навыки этой темы. Для дополнительных разделов урока пример может закреплять необходимую основу. Самопроверка не меняет попытку экзамена.',
          'Practice targets this topic’s skills; some examples reinforce prerequisites. Self-check does not modify an exam attempt.',
          'テーマの技能や基礎を練習します。受験データは変更しません。',
        )}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {questions.map((q) => (
          <button
            key={q.id}
            aria-pressed={selected === q.id}
            onClick={() => setSelected(q.id)}
            className={
              'rounded-lg border px-3 py-2 text-sm ' +
              (selected === q.id ? 'bg-primary text-primary-foreground' : '')
            }
          >
            {q.id.toUpperCase()}
          </button>
        ))}
      </div>
      {selected && questions.some((q) => q.id === selected) && (
        <PracticeQuestion
          key={selected}
          q={questions.find((q) => q.id === selected)!}
          language={language}
        />
      )}
    </section>
  );
}
function PracticeQuestion({
  q,
  language,
}: {
  q: EjuQuestion;
  language: EjuLanguage;
}) {
  const [values, setValues] = useState(q.answers.map(() => '')),
    [reveal, setReveal] = useState(false);
  const l = (ru: string, en: string, ja: string) => ({ ru, en, ja })[language];
  return (
    <div className="mt-5">
      {q.audio && (
        <audio
          controls
          preload="none"
          className="mb-4 w-full"
          src={`${import.meta.env.BASE_URL}${q.audio}`}
        >
          <track
            kind="captions"
            srcLang="ja"
            label="日本語"
            src={`${import.meta.env.BASE_URL}${q.audio.replace('.mp3', '.vtt')}`}
          />
        </audio>
      )}
      <EjuQuestionView
        q={q}
        language={language}
        values={values}
        onChange={setValues}
        reveal={reveal}
        disabled={reveal}
      />
      <button
        disabled={!values.every(Boolean)}
        className="mt-4 rounded-xl bg-primary px-4 py-2 text-primary-foreground disabled:opacity-40"
        onClick={() => {
          if (reveal) {
            setValues(q.answers.map(() => ''));
            setReveal(false);
          } else setReveal(true);
        }}
      >
        {reveal
          ? l('Повторить', 'Retry', 'もう一度')
          : l('Проверить', 'Check', '確認')}
      </button>
    </div>
  );
}
