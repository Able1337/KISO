import type { EjuLanguage, EjuQuestion } from '../lib/eju-types';
import { isCorrect } from '../lib/eju-session';
import EjuQuestionSources from './eju-question-sources';

export default function EjuQuestionView({
  q,
  language,
  values,
  onChange,
  disabled = false,
  reveal = false,
  audioOnly = false,
}: {
  q: EjuQuestion;
  language: EjuLanguage;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  reveal?: boolean;
  audioOnly?: boolean;
}) {
  const label = (ru: string, en: string, ja: string) =>
    ({ ru, en, ja })[language];
  return (
    <article className="space-y-5">
      <p className="text-xs font-bold tracking-wider text-primary">
        {q.group} · {q.id.toUpperCase()}
      </p>
      {q.passage && (
        <div
          lang="ja"
          className="whitespace-pre-line rounded-2xl bg-background p-5 text-base leading-9"
        >
          {q.passage}
        </div>
      )}
      {q.visual && (
        <div className="overflow-x-auto">
          <table lang="ja" className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                {q.visual.headings.map((h) => (
                  <th key={h} className="border bg-background p-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.visual.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((v, j) => (
                    <td key={j} className="border p-3">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h2
        lang="ja"
        className="whitespace-pre-line text-lg font-semibold leading-8"
      >
        {audioOnly && !reveal
          ? '音声を聞いて、答えを一つ選んでください。'
          : q.prompt}
      </h2>
      {q.kind === 'choice' ? (
        <fieldset
          aria-label={label('Ответ', 'Answer', '解答')}
          className="grid gap-3"
        >
          {q.options!.map((option, i) => (
            <button
              key={i}
              type="button"
              disabled={disabled}
              aria-pressed={values[0] === String(i + 1)}
              onClick={() => onChange([String(i + 1)])}
              className={`answer-option ${values[0] === String(i + 1) ? 'answer-selected' : ''} ${reveal && q.answers[0] === String(i + 1) ? 'answer-correct' : ''} ${reveal && values[0] === String(i + 1) && values[0] !== q.answers[0] ? 'answer-wrong' : ''}`}
            >
              <span className="answer-letter">{i + 1}</span>
              <span lang="ja">
                {audioOnly && !reveal ? `${i + 1}番` : option}
              </span>
            </button>
          ))}
        </fieldset>
      ) : (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            {label(
              'Одна цифра или минус в каждой ячейке. A1, A2… вместе образуют число A.',
              'One digit or minus per cell. A1, A2… together form A.',
              '各欄に数字またはマイナスを一つ。A1、A2…で数Aを表す。',
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            {q.answers.map((_, i) => (
              <label key={i} className="grid gap-1 text-center text-sm">
                <span>{q.labels?.[i] ?? i + 1}</span>
                <input
                  aria-label={`${q.id} ${q.labels?.[i] ?? i + 1}`}
                  disabled={disabled}
                  autoComplete="off"
                  className={`h-12 w-12 rounded-lg border bg-background text-center text-xl ${reveal ? (values[i] === q.answers[i] ? 'border-teal-600' : 'border-red-500') : ''}`}
                  value={values[i] ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                      .normalize('NFKC')
                      .replace(/[−–]/g, '-');
                    if (!/^[-0-9]?$/.test(v)) return;
                    const next = [...values];
                    next[i] = v;
                    onChange(next);
                  }}
                />
              </label>
            ))}
          </div>
        </div>
      )}
      {reveal && (
        <section
          className={`rounded-2xl border p-5 ${isCorrect(q, values) ? 'explanation-correct' : 'explanation-wrong'}`}
        >
          <h3 className="font-bold">
            {isCorrect(q, values)
              ? label('Верно', 'Correct', '正解')
              : label('Разбор ответа', 'Answer review', '解答の確認')}
          </h3>
          <p className="mt-2 font-mono">
            {label('Ответ', 'Answer', '正解')}:{' '}
            {q.kind === 'choice'
              ? `${q.answers[0]}. ${q.options![Number(q.answers[0]) - 1]}`
              : q.answers
                  .map((a, i) => `${q.labels?.[i] ?? i + 1}=${a}`)
                  .join(' · ')}
          </p>
          <p className="mt-3 whitespace-pre-line leading-7">
            {q.explanation[language]}
          </p>
          {q.audioText && (
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">
                {label(
                  'Скрипт записи',
                  'Recording transcript',
                  '音声スクリプト',
                )}
              </summary>
              <p lang="ja" className="mt-3 leading-8">
                {q.audioText}
              </p>
            </details>
          )}
        </section>
      )}
      <EjuQuestionSources language={language} section={q.section} />
    </article>
  );
}
