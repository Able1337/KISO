import { createPortal } from 'react-dom';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ArrowLeft, Headphones } from 'lucide-react';
import { loadEjuPack } from '../lib/eju-catalog';
import {
  ejuNames,
  type EjuCourse,
  type EjuLanguage,
  type EjuPack,
  type EjuQuestion,
} from '../lib/eju-types';
import {
  answerEju,
  createEjuAttempt,
  editEjuEssay,
  emptyEjuStorage,
  ejuStorageKey,
  expireEju,
  finishEjuSection,
  navigateEju,
  nextEjuSection,
  readEjuStorage,
  saveEjuAttempt,
  sectionQuestions,
  submitEju,
  summarizeEju,
  type EjuAttempt,
  type EjuMode,
  type EjuStorage,
} from '../lib/eju-session';
import EjuQuestionView from './eju-question';
import EjuQuestionSources from './eju-question-sources';

export function CourseWorkspace({
  course,
  language,
  variant = 1,
  selectedMode,
  setupTarget,
  onSessionChange,
}: {
  course: EjuCourse;
  language: EjuLanguage;
  variant?: number;
  selectedMode?: EjuMode;
  setupTarget: HTMLElement | null;
  onSessionChange: (active: boolean) => void;
}) {
  const [pack, setPack] = useState<EjuPack | null>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    loadEjuPack(course, variant)
      .then((p) => {
        if (alive) setPack(p);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [course, variant]);
  if (error)
    return (
      <p role="alert">
        {
          {
            ru: 'Не удалось загрузить курс. Откройте его заново.',
            en: 'Could not load the course. Reopen it.',
            ja: 'コースを読み込めません。開き直してください。',
          }[language]
        }
      </p>
    );
  if (!pack)
    return (
      <p aria-live="polite">
        {
          {
            ru: 'Загрузка курса…',
            en: 'Loading course…',
            ja: 'コースを読み込み中…',
          }[language]
        }
      </p>
    );
  return (
    <EjuWorkspace
      pack={pack}
      language={language}
      selectedMode={selectedMode}
      setupTarget={setupTarget}
      onSessionChange={onSessionChange}
    />
  );
}

function EjuWorkspace({
  pack,
  language,
  selectedMode,
  setupTarget,
  onSessionChange,
}: {
  pack: EjuPack;
  language: EjuLanguage;
  selectedMode?: EjuMode;
  setupTarget: HTMLElement | null;
  onSessionChange: (active: boolean) => void;
}) {
  const l = (ru: string, en: string, ja: string) => ({ ru, en, ja })[language];
  const [storage, setStorage] = useState<EjuStorage>(emptyEjuStorage),
    [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState(false),
    [conflict, setConflict] = useState(false);
  const storeRef = useRef(storage),
    unmounted = useRef(false),
    volatile = useRef(false);
  const [mode, setMode] = useState<EjuMode>('learn'),
    [view, setView] = useState<string | null>(null),
    [now, setNow] = useState(() => Date.now()),
    [confirm, setConfirm] = useState(false),
    [review, setReview] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(pack.course !== 'japanese');
  const key = ejuStorageKey(pack);
  const accept = useCallback((s: EjuStorage) => {
    storeRef.current = s;
    setStorage(s);
  }, []);
  useEffect(() => {
    unmounted.current = false;
    queueMicrotask(() => {
      if (unmounted.current) return;
      try {
        accept(readEjuStorage(localStorage.getItem(key), pack));
      } catch {
        setStorageError(true);
        volatile.current = true;
      }
      setReady(true);
    });
    const listener = (e: StorageEvent) => {
      if (e.key === key || e.key === null) {
        accept(readEjuStorage(e.newValue, pack));
        setConflict(true);
        setConfirm(false);
      }
    };
    window.addEventListener('storage', listener);
    return () => {
      unmounted.current = true;
      window.removeEventListener('storage', listener);
    };
  }, [key, pack, accept]);
  const persist = useCallback(
    async (
      transform: (s: EjuStorage) => EjuStorage,
    ): Promise<EjuStorage | null> => {
      let result: EjuStorage | null = null;
      const commit = () => {
        if (unmounted.current) return;
        const expected = storeRef.current;
        let latest = expected;
        try {
          latest = readEjuStorage(localStorage.getItem(key), pack);
        } catch {
          volatile.current = true;
          setStorageError(true);
        }
        if (
          !volatile.current &&
          JSON.stringify(latest) !== JSON.stringify(expected)
        ) {
          accept(latest);
          setConflict(true);
          setConfirm(false);
          return;
        }
        const next = transform(expected);
        if (next === expected) {
          result = expected;
          return;
        }
        try {
          localStorage.setItem(key, JSON.stringify(next));
          volatile.current = false;
          setStorageError(false);
        } catch {
          volatile.current = true;
          setStorageError(true);
        }
        accept(next);
        setConflict(false);
        result = next;
      };
      try {
        if (navigator.locks) await navigator.locks.request(key, commit);
        else commit();
      } catch {
        setStorageError(true);
      }
      return result;
    },
    [key, pack, accept],
  );
  const change = useCallback(
    (update: (a: EjuAttempt) => EjuAttempt) => {
      return persist((s) => {
        if (!s.active || (view && s.active.id !== view)) return s;
        const next = update(s.active);
        return next === s.active ? s : saveEjuAttempt(s, next);
      });
    },
    [persist, view],
  );
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (
      storage.active?.status === 'active' &&
      storage.active.deadline !== null &&
      now >= storage.active.deadline
    ) {
      queueMicrotask(() => {
        void persist((s) => {
          if (!s.active) return s;
          const expired = expireEju(pack, s.active, Date.now());
          return expired === s.active ? s : saveEjuAttempt(s, expired);
        }).then(() => setConfirm(false));
      });
    }
  }, [now, storage.active, pack, persist]);
  const a = view
    ? storage.active?.id === view
      ? storage.active
      : storage.history.find((h) => h.id === view)
    : null;
  const sessionId = a?.id ?? null;
  useLayoutEffect(() => {
    onSessionChange(sessionId !== null);
    window.scrollTo(0, 0);
    if (sessionId) document.getElementById('eju-session-title')?.focus();
  }, [sessionId, onSessionChange]);
  const section = a ? pack.sections[a.section] : null;
  const qs = a ? sectionQuestions(pack, a) : [];
  const timedListening =
    !!a &&
    a.status === 'active' &&
    a.mode === 'exam' &&
    section?.kind === 'listening';
  // An absolute section clock keeps audio order and progress stable across reloads.
  const audioSlot = timedListening
    ? Math.min(
        qs.length - 1,
        Math.max(
          0,
          Math.floor(
            (section!.seconds * 1000 - (a!.deadline! - now)) /
              ((section!.seconds * 1000) / qs.length),
          ),
        ),
      )
    : (a?.index ?? 0);
  const q = qs[audioSlot];
  const ended = a?.status === 'finished';
  const reveal =
    !!a && (ended || (a.mode === 'learn' && !!q && a.submitted.includes(q.id)));
  const seconds = a?.deadline
    ? Math.max(0, Math.ceil((a.deadline - now) / 1000))
    : null;
  const modeLabel = (m: EjuMode) =>
    m === 'learn'
      ? l('Обучение', 'Learning', '学習')
      : m === 'mock'
        ? l('Пробный экзамен', 'Mock exam', '模擬試験')
        : l('Экзамен', 'Exam', '試験');
  const button =
    'rounded-xl border bg-card px-4 py-3 text-sm font-semibold disabled:opacity-40';
  async function start() {
    const result = await persist((s) =>
      s.active
        ? s
        : saveEjuAttempt(
            s,
            createEjuAttempt(
              pack,
              selectedMode ?? mode,
              Date.now(),
              crypto.randomUUID(),
            ),
          ),
    );
    if (result?.active) setView(result.active.id);
  }
  const content = (
    <div>
      {a && (
        <h1
          id="eju-session-title"
          tabIndex={-1}
          className="mb-6 text-2xl font-bold outline-none"
        >
          {ejuNames[pack.course]} · {pack.title[language]}
        </h1>
      )}
      <div className="mb-6 rounded-2xl border bg-card p-5 text-sm leading-7">
        <strong>{pack.title[language]}</strong>
        <p>
          {l(
            'Независимые авторские задания Kiso по навыкам EJU. Это не прошлый экзамен JASSO; сложность и баллы не калиброваны по официальной шкале.',
            'Independent Kiso problems targeting EJU skills. This is not a past JASSO paper; difficulty and scores are not calibrated to the official scale.',
            'EJUの技能を対象とするKiso独自問題です。JASSOの過去問ではなく、難易度や得点は公式尺度に校正されていません。',
          )}
        </p>
        <p>
          {pack.sections
            .map(
              (s) =>
                `${s.title[language]}: ${s.seconds / 60} ${l('мин', 'min', '分')}`,
            )
            .join(' · ')}
        </p>
        {pack.course === 'japanese' && (
          <p>
            {l(
              '25 заданий чтения, 15 с визуальными материалами, 12 на слух и одна из двух тем сочинения. Авторская синтетическая озвучка; в экзамене 27 последовательных аудиослотов в пределах 55 минут.',
              '25 reading items, 15 listening-with-visuals items, 12 audio-only items and one of two writing prompts. Synthetic narration; exam mode schedules 27 audio slots across 55 minutes.',
              '読解25問・聴読解15問・聴解12問と記述2題から1題。合成音声を使用し、試験モードでは55分内の27枠で順に再生します。',
            )}
          </p>
        )}
      </div>
      {storageError && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-amber-50 p-4 text-amber-900"
        >
          {l(
            'Сохранение в браузере недоступно. Не закрывайте страницу: ответы пока находятся только в памяти.',
            'Browser storage is unavailable. Keep this page open; answers are only in memory.',
            'ブラウザに保存できません。解答はメモリ内のみなので、このページを閉じないでください。',
          )}
        </p>
      )}
      {conflict && (
        <p aria-live="polite" className="mb-4 rounded-xl bg-amber-50 p-4">
          {l(
            'Данные обновились в другой вкладке. Загружена актуальная версия; последнее действие при конфликте не применено.',
            'Another tab updated the data. The latest version is loaded; a conflicting action was not applied.',
            '別タブで更新されました。最新状態を読み込み、競合した操作は適用していません。',
          )}
        </p>
      )}
      {!a && (
        <>
          {!selectedMode && (
            <div className="grid gap-3 sm:grid-cols-3">
              {(['learn', 'mock', 'exam'] as EjuMode[]).map((m) => (
                <button
                  key={m}
                  aria-label={modeLabel(m)}
                  aria-pressed={mode === m}
                  className={`choice-card ${mode === m ? 'choice-card-active' : ''}`}
                  onClick={() => setMode(m)}
                >
                  <span>
                    <strong>{modeLabel(m)}</strong>
                    <small>
                      {m === 'learn'
                        ? l(
                            'Без таймера. Ответ и разбор после проверки.',
                            'Untimed. Check each answer and explanation.',
                            '時間制限なし。解答後に確認。',
                          )
                        : m === 'mock'
                          ? l(
                              'Без таймера и подсказок. Итог в конце.',
                              'Untimed, no hints. Review at the end.',
                              '時間制限・ヒントなし。最後に結果。',
                            )
                          : l(
                              'По времени разделов. Без подсказок.',
                              'Section timers. No hints.',
                              '科目ごとの制限時間。ヒントなし。',
                            )}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
          {pack.course === 'japanese' && (
            <section className="mt-5 rounded-2xl border bg-card p-5">
              <h2 className="flex items-center gap-2 font-bold">
                <Headphones className="size-5" />
                {l('Проверка звука', 'Audio check', '音声確認')}
              </h2>
              <p className="my-2 text-sm">
                {l(
                  'Перед началом прослушайте запись проверки. Аудио требуется во всех трёх режимах.',
                  'Play the audio check before starting. All three modes include listening.',
                  '開始前に音声を確認してください。3モードとも聴解があります。',
                )}
              </p>
              <audio
                controls
                preload="none"
                src={`${import.meta.env.BASE_URL}eju/audio/check.mp3`}
                onEnded={() => setAudioReady(true)}
                onError={() => setAudioReady(false)}
                className="w-full"
              >
                <track
                  kind="captions"
                  srcLang="ja"
                  label="日本語"
                  src={`${import.meta.env.BASE_URL}eju/audio/check.mp3`.replace(
                    '.mp3',
                    '.vtt',
                  )}
                />
              </audio>
              {!audioReady && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {l(
                    'Прослушайте проверку до конца, чтобы начать.',
                    'Finish the audio check to begin.',
                    '確認音声を最後まで再生すると開始できます。',
                  )}
                </p>
              )}
            </section>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            {storage.active ? (
              <button
                disabled={!ready || !audioReady}
                className={button}
                onClick={() => {
                  setView(storage.active!.id);
                  setNow(Date.now());
                }}
              >
                {l(
                  'Продолжить сохранённую попытку',
                  'Resume saved attempt',
                  '保存した受験を再開',
                )}{' '}
                · {modeLabel(storage.active.mode)}
              </button>
            ) : (
              <button
                disabled={!ready || !audioReady}
                className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-40"
                onClick={() => void start()}
              >
                {l('Начать сессию', 'Start session', '開始')}
              </button>
            )}
          </div>
          <h2 className="mt-8 text-xl font-bold">
            {l('История этого курса', 'Course history', 'このコースの履歴')}
          </h2>
          {!storage.history.length && (
            <p className="mt-3 text-muted-foreground">
              {l(
                'Завершённых попыток пока нет.',
                'No completed attempts yet.',
                '完了した受験はまだありません。',
              )}
            </p>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {storage.history.map((h) => {
              const r = summarizeEju(pack, h);
              return (
                <button
                  key={h.id}
                  className={`${button} text-left`}
                  onClick={() => {
                    setView(h.id);
                    setReview(null);
                  }}
                >
                  {modeLabel(h.mode)} · {r.correct}/{r.total}
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {new Date(h.finishedAt!).toLocaleString(language)}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
      {a && (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button
              className={button}
              onClick={() => {
                setView(null);
                setConfirm(false);
                setReview(null);
              }}
            >
              <ArrowLeft className="mr-2 inline size-4" />
              {l('К настройке', 'Back to setup', '設定へ戻る')}
            </button>
            <strong>
              {modeLabel(a.mode)} · {section?.title[language]}
            </strong>
            {seconds !== null && (
              <span
                role="timer"
                aria-label={l('Осталось времени', 'Time remaining', '残り時間')}
                className="rounded-xl border bg-card px-4 py-2 font-mono text-xl"
              >
                {Math.floor(seconds / 60)}:
                {String(seconds % 60).padStart(2, '0')}
              </span>
            )}
          </div>
          {ended ? (
            <>
              <Results pack={pack} attempt={a} language={language} />
              <div className="mt-6 flex flex-wrap gap-2">
                {pack.questions.map((item, i) => (
                  <button
                    key={item.id}
                    className={`${button} ${review === item.id ? 'border-primary bg-primary/10' : ''}`}
                    onClick={() => setReview(item.id)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              {review && (
                <div className="mt-5 rounded-2xl border bg-card p-5">
                  <EjuQuestionView
                    q={pack.questions.find((x) => x.id === review)!}
                    language={language}
                    values={
                      a.answers[review] ??
                      pack.questions
                        .find((x) => x.id === review)!
                        .answers.map(() => '')
                    }
                    onChange={() => {}}
                    disabled
                    reveal
                  />
                  {pack.questions.find((x) => x.id === review)?.audio && (
                    <audio
                      controls
                      preload="none"
                      className="mt-4 w-full"
                      src={`${import.meta.env.BASE_URL}${pack.questions.find((x) => x.id === review)!.audio}`}
                    >
                      <track
                        kind="captions"
                        srcLang="ja"
                        label="日本語"
                        src={`${import.meta.env.BASE_URL}${pack.questions.find((x) => x.id === review)!.audio}`.replace(
                          '.mp3',
                          '.vtt',
                        )}
                      />
                    </audio>
                  )}
                </div>
              )}
            </>
          ) : a.status === 'break' ? (
            <section className="rounded-2xl border bg-card p-7">
              <h2 className="text-2xl font-bold">
                {l('Раздел завершён', 'Section completed', '科目終了')}
              </h2>
              <p className="my-4 leading-7">
                {l(
                  'Ответы этого раздела зафиксированы. Следующий таймер начнётся после нажатия кнопки.',
                  'Answers in this section are locked. The next timer begins when you press the button.',
                  'この科目の解答は確定しました。ボタンを押すと次の科目の時計が始まります。',
                )}
              </p>
              <button
                className={button}
                onClick={() =>
                  void change((a) => nextEjuSection(pack, a, Date.now()))
                }
              >
                {l(
                  'Начать следующий раздел',
                  'Start next section',
                  '次の科目を開始',
                )}{' '}
                · {pack.sections[a.section + 1].title[language]}
              </button>
            </section>
          ) : (
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_260px]">
              <section className="min-w-0 rounded-2xl border bg-card p-5 sm:p-7">
                {section?.kind === 'writing' && pack.writing ? (
                  <>
                    <h2 className="text-xl font-bold">
                      {l(
                        'Выберите одну тему',
                        'Choose one prompt',
                        '一つの課題を選ぶ',
                      )}
                    </h2>
                    <div className="my-4 space-y-3">
                      {pack.writing.prompts.map((prompt, i) => (
                        <label
                          key={i}
                          className="flex gap-3 rounded-xl border p-4"
                        >
                          <input
                            type="radio"
                            name="essay-topic"
                            checked={a.writingTopic === i}
                            onChange={() =>
                              void change((x) =>
                                editEjuEssay(pack, x, x.essay, i, Date.now()),
                              )
                            }
                          />
                          <span lang="ja" className="leading-8">
                            {prompt}
                          </span>
                        </label>
                      ))}
                    </div>
                    <textarea
                      aria-label={l('Сочинение', 'Essay', '作文')}
                      lang="ja"
                      value={a.essay}
                      onChange={(e) => {
                        const text = e.target.value;
                        void change((x) =>
                          editEjuEssay(
                            pack,
                            x,
                            text,
                            x.writingTopic,
                            Date.now(),
                          ),
                        );
                      }}
                      className="min-h-96 w-full rounded-xl border bg-background p-4 leading-8"
                      maxLength={6000}
                    />
                    <p className="mt-2 text-sm">
                      {Array.from(a.essay.replace(/\s/g, '')).length} / 400–500{' '}
                      {l(
                        'знаков без пробелов; приблизительный счётчик',
                        'characters excluding whitespace; approximate count',
                        '字（空白除く・概算）',
                      )}
                    </p>
                    {a.mode === 'learn' && (
                      <p className="mt-4 rounded-xl bg-primary/5 p-4 leading-7">
                        {pack.writing.guidance[language]}
                      </p>
                    )}
                    <EjuQuestionSources language={language} section="writing" />
                  </>
                ) : (
                  q && (
                    <>
                      {q.audio && (
                        <ListeningPlayer
                          key={`${a.id}:${q.id}`}
                          q={q}
                          language={language}
                          timed={timedListening}
                          offset={
                            timedListening
                              ? Math.max(
                                  0,
                                  (section!.seconds * 1000 -
                                    (a.deadline! - now)) /
                                    1000 -
                                    audioSlot * (section!.seconds / qs.length),
                                )
                              : 0
                          }
                        />
                      )}
                      <EjuQuestionView
                        q={q}
                        language={language}
                        values={a.answers[q.id] ?? q.answers.map(() => '')}
                        onChange={(values) =>
                          void change((x) =>
                            answerEju(pack, x, q.id, values, Date.now()),
                          )
                        }
                        disabled={reveal}
                        reveal={reveal}
                        audioOnly={q.group === '聴解' && a.mode !== 'learn'}
                      />
                      {a.mode === 'learn' && !reveal && (
                        <button
                          className={`${button} mt-5`}
                          disabled={!a.answers[q.id]?.every(Boolean)}
                          onClick={() =>
                            void change((x) =>
                              submitEju(pack, x, q.id, Date.now()),
                            )
                          }
                        >
                          {l('Проверить ответ', 'Check answer', '解答を確認')}
                        </button>
                      )}
                      {!timedListening && (
                        <div className="mt-6 flex justify-between gap-3">
                          <button
                            className={button}
                            disabled={a.index === 0}
                            onClick={() =>
                              void change((x) =>
                                navigateEju(pack, x, x.index - 1, Date.now()),
                              )
                            }
                          >
                            {l('Назад', 'Previous', '前へ')}
                          </button>
                          <button
                            className={button}
                            disabled={a.index === qs.length - 1}
                            onClick={() =>
                              void change((x) =>
                                navigateEju(pack, x, x.index + 1, Date.now()),
                              )
                            }
                          >
                            {l('Далее', 'Next', '次へ')}
                          </button>
                        </div>
                      )}
                    </>
                  )
                )}
              </section>
              <aside className="rounded-2xl border bg-card p-5">
                <h2 className="font-bold">{section?.title[language]}</h2>
                {qs.length > 0 && (
                  <>
                    <p className="my-3 text-sm">
                      {qs.filter((q) => a.answers[q.id]?.every(Boolean)).length}
                      /{qs.length} {l('ответов', 'answered', '解答済み')}
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {qs.map((item, i) => (
                        <button
                          key={item.id}
                          disabled={timedListening}
                          aria-current={i === audioSlot ? 'step' : undefined}
                          className={`rounded-lg border py-2 text-sm ${i === audioSlot ? 'border-primary ring-1 ring-primary' : ''} ${a.answers[item.id]?.every(Boolean) ? 'bg-primary/10' : ''}`}
                          onClick={() =>
                            void change((x) =>
                              navigateEju(pack, x, i, Date.now()),
                            )
                          }
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {timedListening && (
                  <p className="mt-4 text-xs leading-6">
                    {l(
                      'Записи идут по порядку. После записи — время на ответ до следующего слота. Перезагрузка не останавливает часы.',
                      'Recordings follow the section clock. After each recording, answer before the next slot. Reloading does not stop time.',
                      '時計に従って順に再生します。再生後は次の枠まで解答時間です。再読み込みでも時計は止まりません。',
                    )}
                  </p>
                )}
                <button
                  className={`${button} mt-6 w-full`}
                  onClick={() => setConfirm(true)}
                >
                  {l('Завершить раздел', 'Finish section', '科目を終了')}
                </button>
                {confirm && (
                  <div role="alert" className="mt-4 space-y-3">
                    <p className="text-sm leading-6">
                      {l(
                        'Зафиксировать ответы? Вернуться к этому разделу будет нельзя. Пропуски останутся без ответа.',
                        'Lock your answers? You cannot return to this section. Unanswered items remain blank.',
                        '解答を確定しますか。この科目には戻れません。未解答はそのまま残ります。',
                      )}
                    </p>
                    <button
                      className={button}
                      onClick={() => {
                        void change((x) =>
                          finishEjuSection(
                            pack,
                            expireEju(pack, x, Date.now()),
                            Date.now(),
                          ),
                        );
                        setConfirm(false);
                      }}
                    >
                      {l('Подтвердить', 'Confirm', '確定')}
                    </button>
                    <button
                      className={button}
                      onClick={() => setConfirm(false)}
                    >
                      {l('Отмена', 'Cancel', '取消')}
                    </button>
                  </div>
                )}
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
  return a ? (
    <section
      aria-label={l('Сессия EJU', 'EJU session', 'EJU受験')}
      className="mx-auto max-w-7xl px-5 py-8 lg:px-8"
    >
      {content}
    </section>
  ) : setupTarget ? (
    createPortal(content, setupTarget)
  ) : null;
}

function ListeningPlayer({
  q,
  language,
  timed,
  offset,
}: {
  q: EjuQuestion;
  language: EjuLanguage;
  timed: boolean;
  offset: number;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [blocked, setBlocked] = useState(false),
    [failed, setFailed] = useState(false),
    [ended, setEnded] = useState(false);
  const l = (ru: string, en: string, ja: string) => ({ ru, en, ja })[language];
  async function play() {
    const audio = ref.current;
    if (!audio) return;
    try {
      await audio.play();
      setBlocked(false);
    } catch {
      setBlocked(true);
    }
  }
  useEffect(() => {
    const audio = ref.current;
    return () => {
      audio?.pause();
    };
  }, []);
  return (
    <div className="mb-5 rounded-xl bg-primary/5 p-4">
      <p className="mb-3 text-sm font-semibold">
        {l(
          'Авторская запись · синтетический голос',
          'Original recording · synthetic voice',
          '独自音声・合成音声',
        )}
      </p>
      <audio
        ref={ref}
        controls={!timed}
        preload="auto"
        src={`${import.meta.env.BASE_URL}${q.audio}`}
        className={timed ? 'hidden' : 'w-full'}
        onError={() => setFailed(true)}
        onEnded={() => setEnded(true)}
        onLoadedMetadata={() => {
          const a = ref.current!;
          if (timed) {
            if (offset >= a.duration) {
              setEnded(true);
              return;
            }
            a.currentTime = offset;
            void play();
          }
        }}
      >
        <track
          kind="captions"
          srcLang="ja"
          label="日本語"
          src={`${import.meta.env.BASE_URL}${q.audio}`.replace('.mp3', '.vtt')}
        />
      </audio>
      {timed && (
        <p aria-live="polite" className="text-sm">
          {ended
            ? l(
                'Запись закончилась. Выберите ответ; следующий вопрос появится по таймеру.',
                'Recording ended. Choose your answer; the next question follows the timer.',
                '再生終了。解答してください。次の問題は時計に従って表示されます。',
              )
            : l(
                'Прослушайте запись. Повтор и перемотка в экзамене отключены.',
                'Listen to the recording. Replay and seeking are disabled in exam mode.',
                '音声を聞いてください。試験では繰り返し・早送りはできません。',
              )}
        </p>
      )}
      {blocked && !failed && (
        <button
          className="mt-3 rounded-lg border bg-card px-4 py-2"
          onClick={() => {
            const a = ref.current;
            if (a) {
              if (offset >= a.duration) {
                setEnded(true);
                setBlocked(false);
                return;
              }
              a.currentTime = offset;
            }
            void play();
          }}
        >
          {l('Разрешить воспроизведение', 'Enable playback', '再生を許可')}
        </button>
      )}
      {failed && (
        <p role="alert" className="text-red-700">
          {l(
            'Запись не загрузилась. Проверьте соединение и перезагрузите страницу. В экзамене таймер продолжает идти.',
            'Audio failed to load. Check your connection and reload. The exam timer continues.',
            '音声を読み込めません。接続を確認して再読み込みしてください。試験の時計は進み続けます。',
          )}
        </p>
      )}
    </div>
  );
}

function Results({
  pack,
  attempt,
  language,
}: {
  pack: EjuPack;
  attempt: EjuAttempt;
  language: EjuLanguage;
}) {
  const r = summarizeEju(pack, attempt),
    l = (ru: string, en: string, ja: string) => ({ ru, en, ja })[language];
  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="text-2xl font-bold">
        {l('Результат практики', 'Practice result', '練習結果')}
      </h2>
      <p className="mt-4 text-4xl font-bold text-primary">
        {r.correct}/{r.total} · {r.percent}%
      </p>
      <p className="mt-3">
        {l('Без полного ответа', 'Incomplete or skipped', '未完了・未解答')}:{' '}
        {r.skipped}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {r.sections.map((s) => (
          <span key={s.id} className="rounded-xl bg-background p-3">
            {pack.sections.find((x) => x.id === s.id)!.title[language]}:{' '}
            {s.correct}/{s.total}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        {l(
          'Учебная доля полностью верных заданий. Это не официальный балл EJU и не прогноз поступления. В математике отдельно подсвечены ячейки; задача засчитывается только при всех верных ячейках.',
          'Practice accuracy for fully correct items, not an official EJU score or admission prediction. Numeric items count only when every cell is correct.',
          '全欄正解の設問の割合です。EJUの公式得点や合格予測ではありません。数値問題は全欄正解の場合に正解とします。',
        )}
      </p>
      {pack.writing && (
        <details className="mt-5 border-t pt-4" open>
          <summary className="cursor-pointer text-lg font-bold">
            {l(
              'Сочинение · самостоятельная проверка',
              'Writing · self-review',
              '記述・自己確認',
            )}
          </summary>
          <p lang="ja" className="mt-3 leading-8">
            {pack.writing.prompts[attempt.writingTopic]}
          </p>
          <p
            lang="ja"
            className="mt-3 whitespace-pre-wrap rounded-xl bg-background p-4 leading-8"
          >
            {attempt.essay ||
              l('Текст не введён', 'No essay submitted', '作文は未入力です')}
          </p>
          <p className="mt-3 leading-7">{pack.writing.guidance[language]}</p>
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">
              {l(
                'Авторский пример ответа',
                'Original sample essay',
                '独自の作文例',
              )}
            </summary>
            <p lang="ja" className="mt-3 whitespace-pre-line leading-8">
              {pack.writing.models[attempt.writingTopic]}
            </p>
          </details>
          <EjuQuestionSources language={language} section="writing" />
        </details>
      )}
    </section>
  );
}
