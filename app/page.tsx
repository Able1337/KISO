'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, CheckCircle2, Clock3, GraduationCap, Pause, Play, RotateCcw, ShieldCheck, Sparkles, Target, Timer, X, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: {
        name: string; title: string; description: string; inputSchema: object;
        annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
        execute: (input: unknown) => unknown;
      }, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}

type System = 'ITPEC' | 'IPA';
type Level = 'IP' | 'FE';
type Mode = 'learn' | 'mock' | 'exam';
type Part = 'single' | 'A' | 'B';
type View = 'setup' | 'quiz' | 'break' | 'result';
type Language = 'original' | 'ru';
type ProgressData = { attempts: number; correct: number; byTopic: Record<string, { attempts: number; correct: number }>; lastUpdated: string };

type Question = {
  id: string; systems: System[]; level: Level; part: Part; domain: string; topic: string;
  year: number; source: string; prompt: string; options: string[]; answer: number;
  explanation: string; optionNotes: string[]; takeaway: string;
};

const questions: Question[] = [
  {
    id: 'ip-logic-and', systems: ['ITPEC', 'IPA'], level: 'IP', part: 'single', domain: 'Technology', topic: 'Логика', year: 2026,
    source: 'Адаптировано: (2026S, IP, Q2)',
    prompt: 'Операция выдаёт 1 только тогда, когда оба входа A и B равны 1. Какая это логическая операция?',
    options: ['AND', 'NOT', 'OR', 'XOR'], answer: 0,
    explanation: 'Это операция AND (логическое И). Её результат истинен только при одновременной истинности обоих операндов. Для наборов 00, 01 и 10 результат равен 0, а для 11 — 1. Именно такое поведение описано в условии.',
    optionNotes: ['Верно: AND требует, чтобы оба условия выполнялись одновременно.', 'NOT работает только с одним значением и меняет его на противоположное.', 'OR вернёт 1 и для комбинаций 01 и 10, поэтому не подходит.', 'XOR вернёт 1, когда входы различаются, то есть для 01 и 10.'],
    takeaway: 'AND — «оба», OR — «хотя бы один», XOR — «ровно один», NOT — «наоборот».',
  },
  {
    id: 'ip-binary-155', systems: ['ITPEC', 'IPA'], level: 'IP', part: 'single', domain: 'Technology', topic: 'Системы счисления', year: 2026,
    source: 'Адаптировано: (2026S, IP, Q4)',
    prompt: 'Как записывается десятичное число 155 в двоичной системе?',
    options: ['10011011', '10110011', '11001101', '11011001'], answer: 0,
    explanation: 'Разложим 155 по степеням двойки: 155 = 128 + 16 + 8 + 2 + 1. Для разрядов 128, 64, 32, 16, 8, 4, 2, 1 получаем биты 1,0,0,1,1,0,1,1 — то есть 10011011₂. Обратная проверка: 128 + 16 + 8 + 2 + 1 = 155.',
    optionNotes: ['Верно: единицы стоят в разрядах 128, 16, 8, 2 и 1.', 'Это 179: 128 + 32 + 16 + 2 + 1.', 'Это 205: 128 + 64 + 8 + 4 + 1.', 'Это 217: 128 + 64 + 16 + 8 + 1.'],
    takeaway: 'Для проверки двоичного числа сложите веса разрядов, в которых стоит 1.',
  },
  {
    id: 'ip-cache', systems: ['ITPEC', 'IPA'], level: 'IP', part: 'single', domain: 'Technology', topic: 'Архитектура компьютера', year: 2025,
    source: 'По темам официальных заданий 2024–2026; авторская адаптация',
    prompt: 'Для чего процессору нужна кэш-память?',
    options: ['Для постоянного хранения файлов', 'Для уменьшения среднего времени доступа к данным', 'Для замены оперативной памяти', 'Для подключения периферии'], answer: 1,
    explanation: 'Кэш — небольшая, но очень быстрая память рядом с процессором. В ней хранятся недавно или часто используемые данные и инструкции. Благодаря принципам временной и пространственной локальности процессор реже ждёт более медленную оперативную память, поэтому среднее время доступа уменьшается.',
    optionNotes: ['Постоянное хранение выполняют SSD, HDD и другие накопители.', 'Верно: кэш сокращает эффективное время обращения к основной памяти.', 'Кэш дополняет RAM, но не заменяет её: его объём намного меньше.', 'Периферией управляют контроллеры и драйверы, а не кэш CPU.'],
    takeaway: 'Кэш выигрывает в скорости, RAM — в объёме, накопитель — в долговременном хранении.',
  },
  {
    id: 'ip-wbs', systems: ['ITPEC', 'IPA'], level: 'IP', part: 'single', domain: 'Management', topic: 'Управление проектами', year: 2026,
    source: 'Адаптировано: (2026S, IP, Q56)',
    prompt: 'Какое описание WBS является правильным?',
    options: ['Иерархическая декомпозиция работ и результатов проекта', 'Список только рисков проекта', 'Календарь встреч команды', 'Финансовый отчёт после закрытия проекта'], answer: 0,
    explanation: 'WBS (Work Breakdown Structure) разбивает весь объём проекта на управляемые результаты и пакеты работ. Декомпозиция помогает не пропустить работу, определить ответственность, оценить длительность и трудозатраты. WBS отвечает на вопрос «что должно быть сделано», а расписание уже определяет «когда».',
    optionNotes: ['Верно: это основное назначение WBS.', 'Риски ведутся в реестре рисков; они могут быть связаны с элементами WBS, но не заменяют её.', 'Встречи могут входить в план коммуникаций, но это не WBS.', 'Финансовый отчёт — отдельный артефакт контроля стоимости.'],
    takeaway: 'WBS → состав работ; schedule → сроки; risk register → риски; budget → стоимость.',
  },
  {
    id: 'ip-roe', systems: ['ITPEC', 'IPA'], level: 'IP', part: 'single', domain: 'Strategy', topic: 'Финансы', year: 2026,
    source: 'Адаптировано: (2026S, IP, Q68)',
    prompt: 'Что означает буква E в показателе ROE?',
    options: ['Earnings', 'Employee', 'Enterprise', 'Equity'], answer: 3,
    explanation: 'ROE расшифровывается как Return on Equity — рентабельность собственного капитала. Обычно показатель рассчитывают как чистую прибыль, делённую на средний собственный капитал. Он показывает, насколько эффективно компания использует средства владельцев.',
    optionNotes: ['Earnings входят в числитель формулы, но E в названии означает не их.', 'Численность сотрудников не является основой ROE.', 'Enterprise используется в других показателях, например EV.', 'Верно: Equity — собственный капитал.'],
    takeaway: 'ROE = Return on Equity; ROI = Return on Investment; ROA = Return on Assets.',
  },
  {
    id: 'fe-a-cache-hit', systems: ['ITPEC', 'IPA'], level: 'FE', part: 'A', domain: 'Technology', topic: 'Производительность', year: 2025,
    source: 'По формату FE Subject A, 2024–2026; авторская адаптация',
    prompt: 'Доступ к кэшу занимает 10 нс, к основной памяти — 100 нс. При попадании в кэш основная память не читается. Каково среднее время доступа при hit rate 90%?',
    options: ['10 нс', '19 нс', '20 нс', '91 нс'], answer: 1,
    explanation: 'В 90% случаев доступ занимает 10 нс, а в 10% — 100 нс. Математическое ожидание: 0,9 × 10 + 0,1 × 100 = 9 + 10 = 19 нс. Здесь время кэша не прибавляется к 100 нс при промахе, потому что условие задаёт полное время соответствующего сценария.',
    optionNotes: ['10 нс получилось бы только при 100% попаданий.', 'Верно: это взвешенное среднее двух сценариев.', '20 нс — близкое, но неверное округление.', '91 нс получится, если перепутать вероятности попадания и промаха.'],
    takeaway: 'Среднее время = P(hit) × T(hit) + P(miss) × T(miss). Всегда уточняйте, включён ли поиск в кэше во время промаха.',
  },
  {
    id: 'fe-a-normalization', systems: ['ITPEC', 'IPA'], level: 'FE', part: 'A', domain: 'Technology', topic: 'Базы данных', year: 2024,
    source: 'По формату FE Subject A, 2024–2026; авторская адаптация',
    prompt: 'Какова главная цель нормализации реляционной базы данных?',
    options: ['Увеличить дублирование данных', 'Устранить избыточность и аномалии обновления', 'Зашифровать каждую таблицу', 'Объединить все данные в одну таблицу'], answer: 1,
    explanation: 'Нормализация разделяет данные на связанные отношения так, чтобы каждый факт хранился в подходящем месте. Это уменьшает дублирование и предотвращает аномалии вставки, изменения и удаления. При необходимости производительности позже возможна осознанная денормализация.',
    optionNotes: ['Нормализация, наоборот, стремится сократить ненужное дублирование.', 'Верно: это её основная практическая цель.', 'Шифрование относится к безопасности и не является нормализацией.', 'Одна огромная таблица обычно усиливает избыточность и аномалии.'],
    takeaway: 'Нормализация улучшает целостность; денормализация иногда улучшает скорость чтения ценой дублирования.',
  },
  {
    id: 'fe-b-complexity', systems: ['ITPEC', 'IPA'], level: 'FE', part: 'B', domain: 'Algorithm', topic: 'Сложность алгоритмов', year: 2026,
    source: 'По формату FE Subject B, 2024–2026; авторская адаптация',
    prompt: 'Алгоритм дважды проходит массив длины n: сначала ищет максимум, затем сумму. Какова его асимптотическая временная сложность?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 2,
    explanation: 'Каждый проход выполняет количество операций, пропорциональное n. Вместе это примерно n + n = 2n операций. В асимптотической оценке постоянный множитель отбрасывается, поэтому O(2n) упрощается до O(n). Два последовательных цикла не образуют квадратичную сложность — для O(n²) обычно нужны вложенные проходы.',
    optionNotes: ['O(1) не зависит от размера массива, а здесь работа растёт вместе с n.', 'O(log n) характерна, например, для бинарного поиска по отсортированным данным.', 'Верно: два последовательных линейных прохода остаются линейными.', 'O(n²) возникла бы при вложенном полном проходе для каждого элемента.'],
    takeaway: 'Последовательные блоки складываются: O(n)+O(n)=O(n). Вложенные циклы умножаются: O(n)×O(n)=O(n²).',
  },
  {
    id: 'fe-b-security', systems: ['ITPEC', 'IPA'], level: 'FE', part: 'B', domain: 'Security', topic: 'Аутентификация', year: 2025,
    source: 'По формату FE Subject B, 2024–2026; авторская адаптация',
    prompt: 'После утечки базы паролей злоумышленник перебирает варианты локально. Какой механизм сильнее всего увеличивает стоимость каждой попытки?',
    options: ['Хранение пароля открытым текстом', 'Быстрый хеш без соли', 'Медленная функция вывода ключа с уникальной солью', 'Кодирование Base64'], answer: 2,
    explanation: 'Пароли следует обрабатывать специализированной медленной функцией вывода ключа, например Argon2, scrypt, bcrypt или PBKDF2, и использовать уникальную случайную соль для каждой записи. Медленная функция повышает стоимость каждого перебираемого варианта, а соль не позволяет эффективно применять заранее рассчитанные таблицы и одинаково атаковать все записи.',
    optionNotes: ['Открытый текст сразу раскрывает все пароли при утечке.', 'Быстрый хеш позволяет проверять огромное число вариантов в секунду; отсутствие соли помогает массовой атаке.', 'Верно: это стандартный подход к устойчивому хранению паролей.', 'Base64 — обратимое кодирование, а не защита.'],
    takeaway: 'Соль не обязана быть секретной; её задача — уникализировать хеш. Секретность обеспечивает пароль, а стоимость перебора — KDF.',
  },
];

const originalText: Record<string, Record<System, { prompt: string; options: string[] }>> = {
  'ip-logic-and': {
    ITPEC: { prompt: 'An operation outputs 1 only when both inputs A and B are 1. Which logical operation is it?', options: ['AND', 'NOT', 'OR', 'XOR'] },
    IPA: { prompt: '入力Aと入力Bがともに1の場合にだけ1を出力する論理演算はどれか。', options: ['AND（論理積）', 'NOT（否定）', 'OR（論理和）', 'XOR（排他的論理和）'] },
  },
  'ip-binary-155': {
    ITPEC: { prompt: 'Which of the following represents the decimal number 155 in binary?', options: ['10011011', '10110011', '11001101', '11011001'] },
    IPA: { prompt: '10進数155を2進数で表したものはどれか。', options: ['10011011', '10110011', '11001101', '11011001'] },
  },
  'ip-cache': {
    ITPEC: { prompt: 'What is the purpose of cache memory used by a processor?', options: ['Permanent file storage', 'Reducing the average data access time', 'Replacing main memory', 'Connecting peripheral devices'] },
    IPA: { prompt: 'プロセッサがキャッシュメモリを使用する主な目的はどれか。', options: ['ファイルを永続的に保存する', 'データへの平均アクセス時間を短縮する', '主記憶を置き換える', '周辺機器を接続する'] },
  },
  'ip-wbs': {
    ITPEC: { prompt: 'Which of the following is an appropriate description of a WBS?', options: ['A hierarchical decomposition of project work and deliverables', 'A list containing only project risks', 'A calendar of team meetings', 'A financial report prepared after project closure'] },
    IPA: { prompt: 'WBSの説明として，最も適切なものはどれか。', options: ['プロジェクトの作業と成果物を階層的に分解したもの', 'プロジェクトのリスクだけを列挙したもの', 'チーム会議の日程表', 'プロジェクト終了後の財務報告書'] },
  },
  'ip-roe': {
    ITPEC: { prompt: 'What does the letter E in the financial indicator ROE represent?', options: ['Earnings', 'Employee', 'Enterprise', 'Equity'] },
    IPA: { prompt: '財務指標ROEのEが表すものはどれか。', options: ['Earnings', 'Employee', 'Enterprise', 'Equity'] },
  },
  'fe-a-cache-hit': {
    ITPEC: { prompt: 'Cache access takes 10 ns and main-memory access takes 100 ns. Main memory is not read on a cache hit. What is the average access time when the hit rate is 90%?', options: ['10 ns', '19 ns', '20 ns', '91 ns'] },
    IPA: { prompt: 'キャッシュのアクセス時間は10ns，主記憶は100nsである。ヒット時には主記憶へアクセスしない。ヒット率が90%のとき，平均アクセス時間は幾らか。', options: ['10ns', '19ns', '20ns', '91ns'] },
  },
  'fe-a-normalization': {
    ITPEC: { prompt: 'What is the primary purpose of normalizing a relational database?', options: ['Increasing data duplication', 'Eliminating redundancy and update anomalies', 'Encrypting every table', 'Combining all data into one table'] },
    IPA: { prompt: '関係データベースを正規化する主な目的はどれか。', options: ['データの重複を増やす', '冗長性と更新時異常を排除する', '全ての表を暗号化する', '全データを一つの表にまとめる'] },
  },
  'fe-b-complexity': {
    ITPEC: { prompt: 'An algorithm scans an array of length n twice: first to find the maximum, then to calculate the sum. What is its asymptotic time complexity?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'] },
    IPA: { prompt: '長さnの配列を2回走査し，1回目で最大値，2回目で合計を求めるアルゴリズムの時間計算量はどれか。', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'] },
  },
  'fe-b-security': {
    ITPEC: { prompt: 'After a password database leak, an attacker tests guesses offline. Which mechanism most increases the cost of each attempt?', options: ['Storing plaintext passwords', 'A fast unsalted hash', 'A slow key-derivation function with a unique salt', 'Base64 encoding'] },
    IPA: { prompt: 'パスワードデータベースの漏えい後，攻撃者がオフラインで推測を試みる。各試行のコストを最も高める仕組みはどれか。', options: ['平文で保存する', 'ソルトなしの高速ハッシュ', '一意なソルトを用いた低速な鍵導出関数', 'Base64で符号化する'] },
  },
};

const emptyProgress: ProgressData = { attempts: 0, correct: 0, byTopic: {}, lastUpdated: '' };

function shuffledOrders(items: Question[]) {
  return Object.fromEntries(items.map((item) => {
    const order = item.options.map((_, index) => index);
    for (let i = order.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return [item.id, order];
  }));
}

const modeInfo: Record<Mode, { title: string; description: string; icon: typeof GraduationCap }> = {
  learn: { title: 'Обучение', description: 'Ответ и подробный разбор появляются сразу', icon: GraduationCap },
  mock: { title: 'Пробный экзамен', description: 'Без таймера и подсказок, итог в конце', icon: Target },
  exam: { title: 'Экзамен', description: 'С таймером, без подсказок, итог в конце', icon: Timer },
};
const examFacts: Record<Level, string> = { IP: 'Одна часть · 100 вопросов · 120 минут', FE: 'Часть A: 60 / 90 мин · перерыв · часть B: 20 / 100 мин' };

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds); const hours = Math.floor(safe / 3600); const minutes = Math.floor((safe % 3600) / 60); const seconds = safe % 60;
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function Home() {
  const [system, setSystem] = useState<System>('ITPEC'); const [level, setLevel] = useState<Level>('IP'); const [mode, setMode] = useState<Mode>('learn');
  const [view, setView] = useState<View>('setup'); const [part, setPart] = useState<Part>('single'); const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({}); const [selected, setSelected] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(120 * 60); const [breakSeconds, setBreakSeconds] = useState(10 * 60);
  const [language, setLanguage] = useState<Language>('original');
  const [optionOrders, setOptionOrders] = useState<Record<string, number[]>>({});
  const [progress, setProgress] = useState<ProgressData>(emptyProgress);
  const pool = useMemo(() => questions.filter((q) => q.level === level && q.systems.includes(system)), [level, system]);
  const partPool = useMemo(() => pool.filter((q) => level === 'IP' || q.part === part), [level, part, pool]);
  const question = partPool[index]; const revealed = mode === 'learn' && selected !== null;
  const questionText = question ? (language === 'original' ? originalText[question.id][system] : { prompt: question.prompt, options: question.options }) : null;
  const optionOrder = question ? (optionOrders[question.id] ?? question.options.map((_, itemIndex) => itemIndex)) : [];

  useEffect(() => {
    try { const saved = window.localStorage.getItem('kiso-progress-v1'); if (saved) setProgress(JSON.parse(saved) as ProgressData); } catch { setProgress(emptyProgress); }
  }, []);

  useEffect(() => {
    if (view !== 'quiz' || mode !== 'exam') return;
    if (secondsLeft <= 0) { if (level === 'FE' && part === 'A') setView('break'); else setView('result'); return; }
    const timer = window.setInterval(() => setSecondsLeft((v) => v - 1), 1000); return () => window.clearInterval(timer);
  }, [view, mode, secondsLeft, level, part]);
  useEffect(() => {
    if (view !== 'break' || mode !== 'exam') return;
    if (breakSeconds <= 0) { startPartB(); return; }
    const timer = window.setInterval(() => setBreakSeconds((v) => v - 1), 1000); return () => window.clearInterval(timer);
  }, [view, mode, breakSeconds]);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const allowedSystems: System[] = ['ITPEC', 'IPA'];
    const allowedLevels: Level[] = ['IP', 'FE'];
    const allowedModes: Mode[] = ['learn', 'mock', 'exam'];
    void Promise.resolve(context.registerTool({
      name: 'start_practice_session',
      title: 'Начать учебную сессию',
      description: 'Настраивает профиль ITPEC или IPA, уровень IP или FE, режим и открывает первый вопрос.',
      inputSchema: {
        type: 'object',
        properties: {
          system: { type: 'string', enum: allowedSystems },
          level: { type: 'string', enum: allowedLevels },
          mode: { type: 'string', enum: allowedModes },
        },
        required: ['system', 'level', 'mode'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const value = input as { system?: System; level?: Level; mode?: Mode };
        if (!allowedSystems.includes(value.system as System) || !allowedLevels.includes(value.level as Level) || !allowedModes.includes(value.mode as Mode)) {
          throw new Error('Некорректные параметры сессии');
        }
        const initialPart: Part = value.level === 'FE' ? 'A' : 'single';
        setSystem(value.system!); setLevel(value.level!); setMode(value.mode!); setPart(initialPart);
        setIndex(0); setAnswers({}); setSelected(null); setBreakSeconds(10 * 60); setLanguage('original');
        setOptionOrders(shuffledOrders(questions.filter((q) => q.level === value.level && q.systems.includes(value.system!))));
        setSecondsLeft(value.level === 'FE' ? 90 * 60 : 120 * 60); setView('quiz');
        return { status: 'started', system: value.system, level: value.level, mode: value.mode, part: initialPart };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  function recordProgress(item: Question, answer: number) {
    setProgress((current) => {
      const topic = current.byTopic[item.topic] ?? { attempts: 0, correct: 0 };
      const isCorrect = answer === item.answer;
      const next: ProgressData = { attempts: current.attempts + 1, correct: current.correct + (isCorrect ? 1 : 0), byTopic: { ...current.byTopic, [item.topic]: { attempts: topic.attempts + 1, correct: topic.correct + (isCorrect ? 1 : 0) } }, lastUpdated: new Date().toISOString() };
      try { window.localStorage.setItem('kiso-progress-v1', JSON.stringify(next)); } catch { /* Progress remains available for this tab. */ }
      return next;
    });
  }
  function startQuiz() { const initialPart: Part = level === 'FE' ? 'A' : 'single'; setPart(initialPart); setIndex(0); setAnswers({}); setSelected(null); setLanguage('original'); setOptionOrders(shuffledOrders(pool)); setSecondsLeft(level === 'FE' ? 90 * 60 : 120 * 60); setBreakSeconds(10 * 60); setView('quiz'); }
  function chooseAnswer(answer: number) { if (!question || revealed) return; setSelected(answer); setAnswers((v) => ({ ...v, [question.id]: answer })); if (mode === 'learn') recordProgress(question, answer); }
  function goNext() { if (selected === null || !question) return; if (mode !== 'learn') recordProgress(question, selected); if (index < partPool.length - 1) { setIndex((v) => v + 1); setSelected(null); return; } if (level === 'FE' && part === 'A') setView('break'); else setView('result'); }
  function startPartB() { setPart('B'); setIndex(0); setSelected(null); setSecondsLeft(100 * 60); setView('quiz'); }
  function reset() { setView('setup'); setAnswers({}); setSelected(null); setIndex(0); }
  const answeredQuestions = pool.filter((item) => answers[item.id] !== undefined); const correctCount = answeredQuestions.filter((item) => answers[item.id] === item.answer).length;

  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
      <button className="flex items-center gap-3" onClick={reset} aria-label="На главную"><span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_7px_20px_rgba(12,95,94,.22)]"><BookOpenCheck className="size-5" /></span><span className="text-left"><span className="block text-lg font-bold leading-none tracking-tight">Kiso</span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[.18em] text-muted-foreground">IT Exam Lab</span></span></button>
      <div className="flex items-center gap-2">{view !== 'setup' && <Badge variant="outline">{system} · {level}</Badge>}<Badge className="hidden bg-[var(--warm)] text-[var(--warm-ink)] sm:inline-flex">MVP · 2024–2026</Badge></div>
    </div></header>

    {view === 'setup' && <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1fr_360px] lg:px-8 lg:py-12">
      <div><div className="mb-8 max-w-2xl"><Badge className="mb-4 bg-[var(--mint)] text-[var(--mint-ink)]">Подготовка по официальному формату</Badge><h1 className="font-heading text-4xl font-bold tracking-[-.04em] sm:text-5xl">Выберите свой маршрут<br /><span className="text-primary">к уверенной сдаче.</span></h1><p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">Практика по структуре ITPEC и IPA. В обучении каждая ошибка превращается в понятный разбор, а экзаменационные режимы сохраняют интригу до финала.</p></div>
      <div className="space-y-7">
        <ChoiceSection number="01" title="Система экзамена"><div className="grid gap-3 sm:grid-cols-2">{(['ITPEC','IPA'] as System[]).map((item) => <ChoiceCard key={item} active={system === item} onClick={() => setSystem(item)} title={item} description={item === 'ITPEC' ? 'Англоязычный экзамен стран ITPEC' : 'Японская система экзаменов IPA'} />)}</div></ChoiceSection>
        <ChoiceSection number="02" title="Уровень"><div className="grid gap-3 sm:grid-cols-2">{(['IP','FE'] as Level[]).map((item) => <ChoiceCard key={item} active={level === item} onClick={() => setLevel(item)} title={item} description={item === 'IP' ? 'IT Passport · базовая IT-грамотность' : 'Fundamental Engineer · уровень 2'} />)}</div><p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4" />{examFacts[level]}</p></ChoiceSection>
        <ChoiceSection number="03" title="Режим"><div className="grid gap-3 md:grid-cols-3">{(Object.keys(modeInfo) as Mode[]).map((item) => { const Icon = modeInfo[item].icon; return <button key={item} onClick={() => setMode(item)} className={`mode-card ${mode === item ? 'mode-card-active' : ''}`}><Icon className="size-5" /><span className="mt-4 block font-semibold">{modeInfo[item].title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{modeInfo[item].description}</span></button>; })}</div></ChoiceSection>
      </div></div>
      <aside className="lg:pt-20"><div className="sticky top-28 overflow-hidden rounded-3xl border bg-card shadow-[0_25px_70px_rgba(15,35,42,.09)]"><div className="border-b bg-[var(--ink)] p-6 text-white"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[.18em] text-white/55">Ваша сессия</span><Sparkles className="size-5 text-[var(--lime)]" /></div><p className="mt-7 text-3xl font-bold">{system} / {level}</p><p className="mt-2 text-sm text-white/65">{modeInfo[mode].title}</p></div><div className="space-y-5 p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 text-primary" /><div><p className="text-sm font-semibold">Актуальный формат</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Материалы и структура 2024–2026 годов</p></div></div>{level === 'FE' && <div className="flex items-start gap-3"><Pause className="mt-0.5 size-5 text-primary" /><div><p className="text-sm font-semibold">Пауза между A и B</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Отдельный экран перерыва до 10 минут</p></div></div>}<div className="rounded-2xl bg-[var(--mint)] p-4"><p className="text-xs font-semibold text-[var(--mint-ink)]">Локальный прогресс</p><p className="mt-1 text-2xl font-bold">{progress.attempts}</p><p className="text-xs text-muted-foreground">ответов · {progress.attempts ? Math.round(progress.correct / progress.attempts * 100) : 0}% верных</p></div><div className="rounded-2xl bg-muted/70 p-4 text-xs leading-5 text-muted-foreground">В MVP доступно {pool.length} проверочных вопросов. Полный банк будет расширен официальными комплектами последних трёх лет.</div><Button className="h-12 w-full rounded-xl text-base" onClick={startQuiz}>Начать сессию <ArrowRight data-icon="inline-end" /></Button></div></div></aside>
    </section>}

    {view === 'quiz' && question && <section className="mx-auto max-w-5xl px-5 py-7 lg:px-8 lg:py-10"><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2"><Badge>{level === 'FE' ? `Часть ${part}` : level}</Badge><Badge variant="outline">{modeInfo[mode].title}</Badge></div><p className="mt-3 text-sm text-muted-foreground">Вопрос {index + 1} из {partPool.length} · {question.domain} / {question.topic}</p></div>{mode === 'exam' && <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 font-mono text-lg font-semibold tabular-nums shadow-sm"><Timer className="size-5 text-primary" /> {formatTime(secondsLeft)}</div>}</div><Progress value={((index + (selected !== null ? 1 : 0)) / partPool.length) * 100} className="mb-7 [&_[data-slot=progress-indicator]]:bg-primary" />
      <article className="rounded-3xl border bg-card p-5 shadow-[0_22px_60px_rgba(15,35,42,.07)] sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Badge className="bg-[var(--mint)] text-[var(--mint-ink)]">{question.year}</Badge><div className="language-switch" aria-label="Язык вопроса"><button className={language === 'original' ? 'active' : ''} onClick={() => setLanguage('original')}>{system === 'ITPEC' ? 'EN' : '日本語'}</button><button className={language === 'ru' ? 'active' : ''} onClick={() => setLanguage('ru')}>RU</button></div></div><span className="text-right text-[11px] text-muted-foreground">{question.source}</span></div><h2 className="mt-6 text-xl font-semibold leading-8 tracking-[-.015em] sm:text-2xl" lang={language === 'original' ? (system === 'ITPEC' ? 'en' : 'ja') : 'ru'}>{questionText?.prompt}</h2>
      <div className="mt-7 space-y-3">{optionOrder.map((originalIndex, displayIndex) => { const option = questionText?.options[originalIndex] ?? question.options[originalIndex]; const isSelected = selected === originalIndex; const isCorrect = question.answer === originalIndex; const stateClass = revealed && isCorrect ? 'answer-correct' : revealed && isSelected ? 'answer-wrong' : isSelected ? 'answer-selected' : ''; return <button key={originalIndex} onClick={() => chooseAnswer(originalIndex)} disabled={revealed} className={`answer-option ${stateClass}`} aria-pressed={isSelected}><span className="answer-letter">{String.fromCharCode(65 + displayIndex)}</span><span className="flex-1">{option}</span>{revealed && isCorrect && <Check className="size-5 text-[var(--success)]" />}{revealed && isSelected && !isCorrect && <X className="size-5 text-destructive" />}</button>; })}</div>
      {revealed && <div data-testid="explanation" className={`mt-7 rounded-2xl border p-5 sm:p-6 ${selected === question.answer ? 'explanation-correct' : 'explanation-wrong'}`}><div className="flex items-start gap-3">{selected === question.answer ? <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-[var(--success)]" /> : <XCircle className="mt-0.5 size-6 shrink-0 text-destructive" />}<div><h3 className="font-semibold">{selected === question.answer ? 'Верно — закрепим логику' : 'Пока неверно — разберём по шагам'}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{question.explanation}</p></div></div><div className="mt-5 border-t pt-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Почему каждый вариант</p><div className="mt-3 space-y-2">{optionOrder.map((originalIndex, displayIndex) => <p key={originalIndex} className="flex gap-2 text-sm leading-6"><span className={`font-bold ${originalIndex === question.answer ? 'text-[var(--success)]' : 'text-muted-foreground'}`}>{String.fromCharCode(65 + displayIndex)}.</span>{question.optionNotes[originalIndex]}</p>)}</div></div><div className="mt-5 flex gap-3 rounded-xl bg-background/70 p-4 text-sm leading-6"><Sparkles className="mt-0.5 size-4 shrink-0 text-primary" /><span><strong>Запомнить:</strong> {question.takeaway}</span></div></div>}
      <div className="mt-7 flex items-center justify-between gap-3 border-t pt-6"><Button variant="ghost" onClick={reset}><ArrowLeft data-icon="inline-start" />Выйти</Button><Button className="min-w-32" disabled={selected === null} onClick={goNext}>{index === partPool.length - 1 ? (level === 'FE' && part === 'A' ? 'Завершить A' : 'К результату') : 'Дальше'}<ArrowRight data-icon="inline-end" /></Button></div></article></section>}

    {view === 'break' && <section className="mx-auto flex min-h-[calc(100vh-74px)] max-w-3xl items-center px-5 py-12"><div className="w-full rounded-3xl border bg-card p-7 text-center shadow-[0_25px_80px_rgba(15,35,42,.09)] sm:p-12"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[var(--mint)] text-primary"><Pause className="size-7" /></span><Badge className="mt-6">FE · переход A → B</Badge><h2 className="mt-4 text-3xl font-bold tracking-tight">Часть A завершена</h2><p className="mx-auto mt-3 max-w-lg leading-7 text-muted-foreground">Перед алгоритмической частью B можно сделать перерыв. Ответы части A сохранены и изменить их уже нельзя.</p><div className="mx-auto my-8 max-w-xs rounded-2xl bg-[var(--ink)] px-5 py-5 text-white"><p className="text-xs uppercase tracking-[.18em] text-white/55">{mode === 'exam' ? 'Осталось перерыва' : 'Пауза без таймера'}</p><p className="mt-2 font-mono text-4xl font-bold tabular-nums">{mode === 'exam' ? formatTime(breakSeconds) : '∞'}</p></div><Button size="lg" className="h-12 px-6" onClick={startPartB}><Play data-icon="inline-start" />Начать часть B</Button></div></section>}

    {view === 'result' && <section className="mx-auto flex min-h-[calc(100vh-74px)] max-w-4xl items-center px-5 py-12"><div className="w-full rounded-3xl border bg-card p-6 shadow-[0_25px_80px_rgba(15,35,42,.09)] sm:p-10"><div className="grid items-center gap-8 sm:grid-cols-[180px_1fr]"><div className="result-ring" style={{ '--score': `${answeredQuestions.length ? (correctCount / answeredQuestions.length) * 100 : 0}%` } as React.CSSProperties}><div><strong>{correctCount}</strong><span>из {answeredQuestions.length}</span></div></div><div><Badge className="bg-[var(--mint)] text-[var(--mint-ink)]">Сессия завершена</Badge><h2 className="mt-4 text-3xl font-bold tracking-tight">Результат готов</h2><p className="mt-3 leading-7 text-muted-foreground">{mode === 'learn' ? 'Вы сразу разобрали каждую ошибку. Повторите темы с низким результатом после короткого перерыва.' : 'Во время сессии подсказки не показывались. Ниже — только итог, как вы и настроили.'}</p></div></div><div className="mt-9 grid gap-3 sm:grid-cols-3">{['Technology','Management','Strategy'].map((domain) => { const items = answeredQuestions.filter((item) => item.domain === domain || (domain === 'Technology' && ['Algorithm','Security'].includes(item.domain))); const correct = items.filter((item) => answers[item.id] === item.answer).length; return <div key={domain} className="rounded-2xl bg-muted/65 p-4"><p className="text-xs text-muted-foreground">{domain}</p><p className="mt-2 text-2xl font-bold">{correct} / {items.length}</p></div>; })}</div><div className="mt-8 flex flex-wrap justify-end gap-3 border-t pt-6"><Button variant="outline" onClick={reset}><ArrowLeft data-icon="inline-start" />К настройке</Button><Button onClick={startQuiz}><RotateCcw data-icon="inline-start" />Пройти ещё раз</Button></div></div></section>}
  </main>;
}

function ChoiceSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) { return <section><div className="mb-3 flex items-center gap-3"><span className="font-mono text-xs font-bold text-primary">{number}</span><h2 className="text-sm font-semibold uppercase tracking-[.12em]">{title}</h2></div>{children}</section>; }
function ChoiceCard({ active, onClick, title, description }: { active: boolean; onClick: () => void; title: string; description: string }) { return <button onClick={onClick} className={`choice-card ${active ? 'choice-card-active' : ''}`}><span><strong>{title}</strong><small>{description}</small></span><span className="choice-check">{active && <Check className="size-4" />}</span></button>; }
