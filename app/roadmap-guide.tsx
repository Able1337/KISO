import { useState } from 'react';
import { roadmapGuides, guideResources } from '../data/roadmap-guides';
import type { RoadmapLanguage } from '../lib/roadmap-topics';

export default function RoadmapGuide({
  topic,
  system,
  language,
  level,
}: {
  topic: string;
  system: 'ITPEC' | 'IPA';
  language: RoadmapLanguage;
  level: string;
}) {
  const chapter = roadmapGuides[topic];
  const [answer, setAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  if (!chapter) return null;
  const l = (ru: string, en: string, ja: string) => ({ ru, en, ja })[language];
  const resources = [
    guideResources[system],
    ...(topic === 'law'
      ? [guideResources.law]
      : topic === 'ux'
        ? [guideResources.ux]
        : []),
  ];
  return (
    <details className="mt-4 rounded-xl border bg-primary/5 p-4">
      <summary className="cursor-pointer font-semibold">
        {l(
          'Учебная глава: понять тему',
          'Study chapter: understand the topic',
          'テーマの基礎教材',
        )}
      </summary>
      {language !== 'ru' && (
        <p className="mt-3 text-sm text-muted-foreground">
          {l(
            '',
            'This authored study chapter is in Russian. Exam explanations below remain multilingual.',
            'この独自教材はロシア語です。試験問題の解説は各言語で利用できます。',
          )}
        </p>
      )}
      <div lang="ru" className="mt-4 space-y-5 text-sm leading-7">
        <p>
          <strong>Перед началом. </strong>
          {chapter.before}
        </p>
        <p>
          <strong>Цель. </strong>
          {chapter.outcome}
        </p>
        <p className="break-words text-primary">{chapter.terms}</p>
        {chapter.sections.map(([title, body]) => (
          <section key={title}>
            <h4 className="font-bold">{title}</h4>
            <p className="mt-2">{body}</p>
          </section>
        ))}
        <div className="rounded-xl border bg-card p-4">
          <h4 className="font-bold">Разобранный пример</h4>
          <p className="mt-2">{chapter.example}</p>
        </div>
        <fieldset className="rounded-xl border bg-card p-4">
          <legend className="px-1 font-bold">Самопроверка</legend>
          <p>{chapter.question}</p>
          <div className="mt-3 space-y-2">
            {chapter.options.map((option, i) => (
              <label
                key={option}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${revealed && i === chapter.correct ? 'border-teal-600 bg-teal-50 text-teal-950' : ''}`}
              >
                <input
                  type="radio"
                  name={`guide-${system}-${topic}`}
                  checked={answer === i}
                  disabled={revealed}
                  onChange={() => setAnswer(i)}
                  className="mt-1 shrink-0 accent-teal-700"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          {!revealed ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-lg bg-primary px-3 py-2 text-primary-foreground disabled:opacity-40"
                disabled={answer === null}
                onClick={() => setRevealed(true)}
              >
                Проверить
              </button>
              <button
                className="text-primary underline"
                onClick={() => setRevealed(true)}
              >
                Открыть разбор без ответа
              </button>
            </div>
          ) : (
            <div className="mt-4" aria-live="polite">
              <strong>
                {answer === null
                  ? 'Разбор'
                  : answer === chapter.correct
                    ? 'Верно'
                    : 'Нужно повторить'}
              </strong>
              <p className="mt-2">{chapter.explanation}</p>
              <button
                className="mt-3 text-primary underline"
                onClick={() => {
                  setAnswer(null);
                  setRevealed(false);
                }}
              >
                Решить ещё раз
              </button>
            </div>
          )}
        </fieldset>
        <details open={level === 'FE'}>
          <summary className="cursor-pointer font-bold">
            Углубление для FE
          </summary>
          <p className="mt-2">{chapter.advanced}</p>
        </details>
        <p>
          <strong>Когда переходить дальше. </strong>Объясните метод без текста,
          решите самопроверку, затем один официальный пример ниже. При ошибке
          назовите её причину: термин, модель, вычисление или чтение условия.
          Повторите на другом задании, прежде чем отмечать подтему.
        </p>
        <p className="text-xs text-muted-foreground">
          Авторская вводная глава Kiso. Самопроверка не изменяет отметки
          изученного и результаты экзаменов.
        </p>
        <div>
          {resources.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="block text-primary underline"
            >
              {r.title} ↗
            </a>
          ))}
        </div>
      </div>
    </details>
  );
}
