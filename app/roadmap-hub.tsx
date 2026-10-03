import { lazy, Suspense, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { EjuCourse, EjuLanguage } from '../lib/eju-types';
const StudyRoadmap = lazy(() => import('./study-roadmap'));
const EjuRoadmap = lazy(() => import('./eju-roadmap'));
type Track = 'ITPEC' | 'IPA' | EjuCourse;
export default function RoadmapHub({
  language,
  onLanguage,
  onExit,
  initial = 'ITPEC',
}: {
  language: EjuLanguage;
  onLanguage: (l: EjuLanguage) => void;
  onExit: () => void;
  initial?: Track;
}) {
  const [track, setTrack] = useState<Track>(initial);
  const names: Record<Track, string> = {
    ITPEC: 'ITPEC',
    IPA: 'IPA',
    math1: 'EJU Math 1',
    math2: 'EJU Math 2',
    japanese: 'EJU Japanese',
  };
  const l = (ru: string, en: string, ja: string) => ({ ru, en, ja })[language];
  return (
    <main
      lang={language}
      className="min-h-screen bg-background text-foreground"
    >
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <button
            onClick={onExit}
            className="flex items-center gap-2 font-semibold"
          >
            <ArrowLeft className="size-4" />
            {l('К экзаменам', 'Back to exams', '試験へ')}
          </button>
          <div className="global-language-switch">
            {(['ru', 'en', 'ja'] as const).map((v) => (
              <button
                key={v}
                className={language === v ? 'active' : ''}
                onClick={() => onLanguage(v)}
              >
                {v === 'ja' ? '日本語' : v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <nav
          aria-label={l('Система роадмапа', 'Roadmap system', '学習コース')}
          className="mx-auto flex max-w-6xl flex-wrap gap-2 px-5 pb-4"
        >
          {(Object.keys(names) as Track[]).map((t) => (
            <button
              key={t}
              aria-pressed={t === track}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold ${t === track ? 'border-primary bg-primary text-primary-foreground' : 'bg-background'}`}
              onClick={() => setTrack(t)}
            >
              {names[t]}
            </button>
          ))}
        </nav>
      </header>
      <Suspense
        fallback={
          <p aria-live="polite" className="p-8">
            {l('Загрузка…', 'Loading…', '読み込み中…')}
          </p>
        }
      >
        {track === 'ITPEC' || track === 'IPA' ? (
          <StudyRoadmap
            key={track}
            language={language}
            onLanguage={onLanguage}
            onExit={onExit}
            initialSystem={track}
            embedded
          />
        ) : (
          <EjuRoadmap key={track} course={track} language={language} />
        )}
      </Suspense>
    </main>
  );
}
