import { useCallback, useEffect, useMemo, useState } from 'react';
import { ejuTopics } from '../data/eju-topics';
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
  const topics = useMemo(
    () => ejuTopics.filter((t) => t.courses.includes(course)),
    [course],
  );
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
    [pack, setPack] = useState<EjuPack | null>(null),
    [loadError, setLoadError] = useState(false);
  const key = `kiso-eju-roadmap-v1:${course}`;
  const read = useCallback(
    (raw: string | null) => {
      try {
        const value: unknown = JSON.parse(raw ?? '[]');
        if (!Array.isArray(value)) return [];
        // Expand legacy topic marks into child lessons without touching exam attempts.
        return allUnits
          .filter(
            (u) => value.includes(u.id) || value.includes(u.id.split('/')[0]),
          )
          .map((u) => u.id);
      } catch {
        return [];
      }
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
        setPack(null);
        setLoadError(false);
      }
    });
    loadEjuPack(course, variant)
      .then((p) => {
        if (alive) setPack(p);
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
            'Перед этими темами пройдите базовые блоки Math 1: они также входят в программу Course 2.',
            'Study the Math 1 foundations first: they are also part of Course 2.',
            'Math 1の基礎を先に学びましょう。コース2の範囲にも含まれます。',
          )}
        </p>
      )}
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
          const children = ejuCurriculum[t.id],
            count = children.filter((u) => done.includes(u.id)).length;
          return (
            <article
              key={t.id}
              className="min-w-0 rounded-2xl border bg-card p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold">
                  <span className="mr-3 text-primary">
                    {String(i + 1).padStart(2, '0')}
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
                        onClick={() => setOpened(opened === u.id ? null : u.id)}
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
