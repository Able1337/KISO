'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, BookOpenCheck, CalendarDays, Check, CheckCircle2, Clock3, GraduationCap, Pause, Play, RotateCcw, Search, ShieldCheck, Sparkles, Target, Timer, Trophy, X, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { lessons, searchQueries, topicLabels, uiCopy, type UiLanguage } from './kiso-i18n';

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
type QuestionLanguage = 'original' | 'interface';
type ExamYear = 2024 | 2025 | 2026;
type ExamAttempt = { id: string; system: System; level: Level; year: ExamYear; mode: Exclude<Mode, 'learn'>; correct: number; total: number; passed: boolean; completedAt: string; partScores?: { A: number; B: number } };
type ProgressData = { attempts: number; correct: number; byTopic: Record<string, { attempts: number; correct: number }>; sessions: ExamAttempt[]; lastUpdated: string };

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
    id: 'ip-roe', systems: ['ITPEC', 'IPA'], level: 'IP', part: 'single', domain: 'Strategy', topic: 'Финансы', year: 2024,
    source: 'По формату IP, 2024; авторская адаптация',
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
  {
    id: 'fe-b-stack', systems: ['ITPEC', 'IPA'], level: 'FE', part: 'B', domain: 'Algorithm', topic: 'Структуры данных', year: 2024,
    source: 'По формату FE Subject B, 2024; авторская адаптация',
    prompt: 'Какая структура данных непосредственно реализует принцип LIFO?',
    options: ['Очередь', 'Стек', 'Двоичное дерево поиска', 'Хеш-таблица'], answer: 1,
    explanation: 'LIFO означает Last In, First Out: последний добавленный элемент извлекается первым. Именно так работает стек. Добавление выполняется операцией push на вершину, а удаление — операцией pop с вершины. Очередь использует противоположный порядок FIFO: первым извлекается элемент, добавленный раньше остальных.',
    optionNotes: ['Очередь реализует FIFO, а не LIFO.', 'Верно: push и pop работают с одной вершиной стека.', 'Дерево организует элементы по связям и ключам, а не по порядку поступления.', 'Хеш-таблица обеспечивает доступ по ключу и не задаёт LIFO-порядок.'],
    takeaway: 'Стек — LIFO; очередь — FIFO. Стек удобно связывать со стопкой тарелок.',
  },
  {
    id: 'fe-a-tcp', systems: ['ITPEC', 'IPA'], level: 'FE', part: 'A', domain: 'Technology', topic: 'Сети', year: 2026,
    source: 'По формату FE Subject A, 2026; авторская адаптация',
    prompt: 'Какое свойство отличает TCP от UDP?',
    options: ['TCP гарантирует доставку и порядок байтового потока', 'TCP не устанавливает соединение', 'TCP не использует номера портов', 'TCP всегда быстрее UDP'], answer: 0,
    explanation: 'TCP — протокол с установлением соединения. Он нумерует данные, подтверждает получение, повторно передаёт потерянные сегменты и восстанавливает правильный порядок байтов. UDP отправляет независимые датаграммы без встроенной гарантии доставки или порядка. За надёжность TCP платит дополнительными задержками и служебными данными.',
    optionNotes: ['Верно: надёжный упорядоченный поток — ключевое свойство TCP.', 'Соединение устанавливает TCP; UDP работает без него.', 'И TCP, и UDP используют номера портов.', 'TCP не всегда быстрее: гарантии требуют дополнительного обмена.'],
    takeaway: 'TCP — надёжный поток; UDP — лёгкие независимые датаграммы.',
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
  'fe-b-stack': {
    ITPEC: { prompt: 'Which data structure directly implements the LIFO principle?', options: ['Queue', 'Stack', 'Binary search tree', 'Hash table'] },
    IPA: { prompt: 'LIFOの原則を直接実現するデータ構造はどれか。', options: ['キュー', 'スタック', '二分探索木', 'ハッシュ表'] },
  },
  'fe-a-tcp': {
    ITPEC: { prompt: 'Which property distinguishes TCP from UDP?', options: ['TCP provides reliable, ordered delivery of a byte stream', 'TCP is connectionless', 'TCP does not use port numbers', 'TCP is always faster than UDP'] },
    IPA: { prompt: 'TCPをUDPと区別する性質はどれか。', options: ['信頼性のある順序付きバイトストリームを提供する', 'コネクションを確立しない', 'ポート番号を使用しない', '常にUDPより高速である'] },
  },
};

const emptyProgress: ProgressData = { attempts: 0, correct: 0, byTopic: {}, sessions: [], lastUpdated: '' };

function shuffledOrders(items: Question[]) {
  return Object.fromEntries(items.map((item) => {
    const order = item.options.map((_, index) => index);
    for (let i = order.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return [item.id, order];
  }));
}

const examYears: ExamYear[] = [2026, 2025, 2024];
function examFact(level: Level, language: UiLanguage) {
  if (level === 'IP') return language === 'ru' ? '100 вопросов · 120 минут' : language === 'en' ? '100 questions · 120 minutes' : '100問 · 120分';
  return language === 'ru' ? 'A: 60 вопросов / 90 минут · B: 20 вопросов / 100 минут' : language === 'en' ? 'A: 60 questions / 90 min · B: 20 questions / 100 min' : 'A: 60問 / 90分 · B: 20問 / 100分';
}
function breakFact(system: System, level: Level, language: UiLanguage) {
  if (level === 'IP') return uiCopy[language].onePart;
  if (system === 'IPA') return language === 'ru' ? 'Между A и B — перерыв до 10 минут' : language === 'en' ? 'Up to 10 minutes between A and B' : 'A・B間は最大10分休憩';
  return language === 'ru' ? 'A и B раздельно; перерыв задаёт организатор' : language === 'en' ? 'A and B are separate; the organizer sets the break' : 'A・Bは別科目。休憩は実施機関が指定';
}

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds); const hours = Math.floor(safe / 3600); const minutes = Math.floor((safe % 3600) / 60); const seconds = safe % 60;
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function Home() {
  const [system, setSystem] = useState<System>('ITPEC'); const [level, setLevel] = useState<Level>('IP'); const [mode, setMode] = useState<Mode>('learn'); const [examYear, setExamYear] = useState<ExamYear>(2026);
  const [view, setView] = useState<View>('setup'); const [part, setPart] = useState<Part>('single'); const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({}); const [selected, setSelected] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(120 * 60); const [breakSeconds, setBreakSeconds] = useState(10 * 60);
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>('ru'); const [questionLanguage, setQuestionLanguage] = useState<QuestionLanguage>('original');
  const [optionOrders, setOptionOrders] = useState<Record<string, number[]>>({});
  const [progress, setProgress] = useState<ProgressData>(emptyProgress);
  const [sessionRecorded, setSessionRecorded] = useState(false);
  const t = uiCopy[uiLanguage];
  const modeInfo: Record<Mode, { title: string; description: string; icon: typeof GraduationCap }> = {
    learn: { title: t.learn, description: t.learnDesc, icon: GraduationCap }, mock: { title: t.mock, description: t.mockDesc, icon: Target }, exam: { title: t.exam, description: t.examDesc, icon: Timer },
  };
  const pool = useMemo(() => questions.filter((q) => q.level === level && q.systems.includes(system) && q.year === examYear), [level, system, examYear]);
  const partPool = useMemo(() => pool.filter((q) => level === 'IP' || q.part === part), [level, part, pool]);
  const question = partPool[index]; const revealed = mode === 'learn' && selected !== null;
  const interfaceQuestionSystem: System = uiLanguage === 'ja' ? 'IPA' : 'ITPEC';
  const questionText = question ? (questionLanguage === 'original' ? originalText[question.id][system] : uiLanguage === 'ru' ? { prompt: question.prompt, options: question.options } : originalText[question.id][interfaceQuestionSystem]) : null;
  const optionOrder = question ? (optionOrders[question.id] ?? question.options.map((_, itemIndex) => itemIndex)) : [];
  const currentLesson = question ? lessons[question.id][uiLanguage] : null;
  const currentSearchQuery = question ? searchQueries[question.id][uiLanguage] : null;
  const answeredQuestions = pool.filter((item) => answers[item.id] !== undefined); const correctCount = answeredQuestions.filter((item) => answers[item.id] === item.answer).length;
  const scorePercent = answeredQuestions.length ? Math.round(correctCount / answeredQuestions.length * 100) : 0;
  const partScore = (target: 'A' | 'B') => { const items = pool.filter((item) => item.part === target); return items.length ? Math.round(items.filter((item) => answers[item.id] === item.answer).length / items.length * 100) : 0; };
  const sessionPassed = level === 'IP' ? scorePercent >= 60 : partScore('A') >= 60 && partScore('B') >= 60;

  useEffect(() => {
    try { const savedLanguage = window.localStorage.getItem('kiso-language') as UiLanguage | null; if (savedLanguage && ['ru','en','ja'].includes(savedLanguage)) setUiLanguage(savedLanguage); const saved = window.localStorage.getItem('kiso-progress-v1'); if (saved) { const parsed = JSON.parse(saved) as Partial<ProgressData>; setProgress({ ...emptyProgress, ...parsed, sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [] }); } } catch { setProgress(emptyProgress); }
  }, []);

  function changeUiLanguage(value: UiLanguage) { setUiLanguage(value); try { window.localStorage.setItem('kiso-language', value); } catch { /* Keep language for this tab. */ } }

  useEffect(() => {
    if (view !== 'result' || mode === 'learn' || sessionRecorded) return;
    const completedAt = new Date().toISOString();
    const attempt: ExamAttempt = { id: `${completedAt}-${system}-${level}-${examYear}`, system, level, year: examYear, mode, correct: correctCount, total: answeredQuestions.length, passed: sessionPassed, completedAt, ...(level === 'FE' ? { partScores: { A: partScore('A'), B: partScore('B') } } : {}) };
    setProgress((current) => { const next = { ...current, sessions: [attempt, ...current.sessions].slice(0, 100), lastUpdated: completedAt }; try { window.localStorage.setItem('kiso-progress-v1', JSON.stringify(next)); } catch { /* Keep the result for this tab. */ } return next; });
    setSessionRecorded(true);
  }, [view, mode, sessionRecorded, system, level, examYear, correctCount, answeredQuestions.length, sessionPassed]);

  useEffect(() => {
    if (view !== 'quiz' || mode !== 'exam') return;
    if (secondsLeft <= 0) { if (level === 'FE' && part === 'A') setView('break'); else setView('result'); return; }
    const timer = window.setInterval(() => setSecondsLeft((v) => v - 1), 1000); return () => window.clearInterval(timer);
  }, [view, mode, secondsLeft, level, part]);
  useEffect(() => {
    if (view !== 'break' || mode !== 'exam' || system !== 'IPA') return;
    if (breakSeconds <= 0) { startPartB(); return; }
    const timer = window.setInterval(() => setBreakSeconds((v) => v - 1), 1000); return () => window.clearInterval(timer);
  }, [view, mode, breakSeconds, system]);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const allowedSystems: System[] = ['ITPEC', 'IPA'];
    const allowedLevels: Level[] = ['IP', 'FE'];
    const allowedModes: Mode[] = ['learn', 'mock', 'exam'];
    const allowedYears: ExamYear[] = [2024, 2025, 2026];
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
          year: { type: 'number', enum: allowedYears },
        },
        required: ['system', 'level', 'mode', 'year'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const value = input as { system?: System; level?: Level; mode?: Mode; year?: ExamYear };
        if (!allowedSystems.includes(value.system as System) || !allowedLevels.includes(value.level as Level) || !allowedModes.includes(value.mode as Mode) || !allowedYears.includes(value.year as ExamYear)) {
          throw new Error('Некорректные параметры сессии');
        }
        const initialPart: Part = value.level === 'FE' ? 'A' : 'single';
        setSystem(value.system!); setLevel(value.level!); setMode(value.mode!); setExamYear(value.year!); setPart(initialPart);
        setIndex(0); setAnswers({}); setSelected(null); setBreakSeconds(10 * 60); setQuestionLanguage('original'); setSessionRecorded(false);
        setOptionOrders(shuffledOrders(questions.filter((q) => q.level === value.level && q.systems.includes(value.system!) && q.year === value.year)));
        setSecondsLeft(value.level === 'FE' ? 90 * 60 : 120 * 60); setView('quiz');
        return { status: 'started', system: value.system, level: value.level, mode: value.mode, year: value.year, part: initialPart };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  function recordProgress(item: Question, answer: number) {
    setProgress((current) => {
      const topic = current.byTopic[item.topic] ?? { attempts: 0, correct: 0 };
      const isCorrect = answer === item.answer;
      const next: ProgressData = { attempts: current.attempts + 1, correct: current.correct + (isCorrect ? 1 : 0), byTopic: { ...current.byTopic, [item.topic]: { attempts: topic.attempts + 1, correct: topic.correct + (isCorrect ? 1 : 0) } }, sessions: current.sessions, lastUpdated: new Date().toISOString() };
      try { window.localStorage.setItem('kiso-progress-v1', JSON.stringify(next)); } catch { /* Progress remains available for this tab. */ }
      return next;
    });
  }
  function startQuiz() { const initialPart: Part = level === 'FE' ? 'A' : 'single'; setPart(initialPart); setIndex(0); setAnswers({}); setSelected(null); setQuestionLanguage('original'); setSessionRecorded(false); setOptionOrders(shuffledOrders(pool)); setSecondsLeft(level === 'FE' ? 90 * 60 : 120 * 60); setBreakSeconds(10 * 60); setView('quiz'); }
  function chooseAnswer(answer: number) { if (!question || revealed) return; setSelected(answer); setAnswers((v) => ({ ...v, [question.id]: answer })); if (mode === 'learn') recordProgress(question, answer); }
  function goNext() { if (selected === null || !question) return; if (mode !== 'learn') recordProgress(question, selected); if (index < partPool.length - 1) { setIndex((v) => v + 1); setSelected(null); return; } if (level === 'FE' && part === 'A') setView('break'); else setView('result'); }
  function startPartB() { setPart('B'); setIndex(0); setSelected(null); setSecondsLeft(100 * 60); setView('quiz'); }
  function reset() { setView('setup'); setAnswers({}); setSelected(null); setIndex(0); }
  function localizedForUi(item: Question) { return uiLanguage === 'ru' ? { prompt: item.prompt, options: item.options } : originalText[item.id][uiLanguage === 'ja' ? 'IPA' : 'ITPEC']; }
  function domainLabel(domain: string) { if (['Algorithm','Security'].includes(domain)) return t.technology; if (domain === 'Management') return t.management; if (domain === 'Strategy') return t.strategy; return t.technology; }
  const relevantSessions = progress.sessions.filter((item) => item.system === system && item.level === level);
  const yearSummary = examYears.map((year) => { const sessions = relevantSessions.filter((item) => item.year === year); const best = sessions.length ? Math.max(...sessions.map((item) => item.total ? Math.round(item.correct / item.total * 100) : 0)) : null; return { year, sessions, best, passed: sessions.some((item) => item.passed) }; });

  const questionLangCode = questionLanguage === 'original' ? (system === 'ITPEC' ? 'en' : 'ja') : uiLanguage;
  return <main className="min-h-screen bg-background text-foreground" lang={uiLanguage}>
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 lg:px-8">
      <button className="flex items-center gap-3" onClick={reset} aria-label={t.home}><span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_7px_20px_rgba(12,95,94,.22)]"><BookOpenCheck className="size-5" /></span><span className="text-left"><span className="block text-lg font-bold leading-none tracking-tight">Kiso</span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[.18em] text-muted-foreground">IT Exam Lab</span></span></button>
      <div className="flex items-center gap-2">{view !== 'setup' && <Badge variant="outline" className="hidden sm:inline-flex">{system} · {level} · {examYear}</Badge>}<div className="global-language-switch" aria-label="Interface language">{(['ru','en','ja'] as UiLanguage[]).map((item) => <button key={item} className={uiLanguage === item ? 'active' : ''} onClick={() => changeUiLanguage(item)}>{item === 'ja' ? '日本語' : item.toUpperCase()}</button>)}</div></div>
    </div></header>

    {view === 'setup' && <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1fr_360px] lg:px-8 lg:py-12">
      <div><div className="mb-8 max-w-2xl"><Badge className="mb-4 bg-[var(--mint)] text-[var(--mint-ink)]">{t.badge}</Badge><h1 className="font-heading text-4xl font-bold tracking-[-.04em] sm:text-5xl">{t.heroA}<br /><span className="text-primary">{t.heroB}</span></h1><p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{t.intro}</p></div>
      <div className="space-y-7">
        <ChoiceSection number="01" title={t.system}><div className="grid gap-3 sm:grid-cols-2">{(['ITPEC','IPA'] as System[]).map((item) => <ChoiceCard key={item} active={system === item} onClick={() => setSystem(item)} title={item} description={item === 'ITPEC' ? 'ITPEC Common Examination' : 'IPA Japan Examination'} />)}</div><p className="mt-3 flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="size-4" />{t.examLanguage}: {system === 'ITPEC' ? t.english : t.japanese}</p></ChoiceSection>
        <ChoiceSection number="02" title={t.level}><div className="grid gap-3 sm:grid-cols-2">{(['IP','FE'] as Level[]).map((item) => <ChoiceCard key={item} active={level === item} onClick={() => setLevel(item)} title={item} description={item === 'IP' ? 'IT Passport · Level 1' : 'Fundamental Engineer · Level 2'} />)}</div><div className="mt-3 space-y-1 text-sm text-muted-foreground"><p className="flex items-center gap-2"><Clock3 className="size-4" />{examFact(level, uiLanguage)}</p><p className="flex items-center gap-2"><Pause className="size-4" />{breakFact(system, level, uiLanguage)}</p></div></ChoiceSection>
        <ChoiceSection number="03" title={t.year}><div className="grid grid-cols-3 gap-3">{examYears.map((year) => <button key={year} onClick={() => setExamYear(year)} className={`year-card ${examYear === year ? 'year-card-active' : ''}`}><CalendarDays className="size-4" /><span>{year}</span></button>)}</div></ChoiceSection>
        <ChoiceSection number="04" title={t.mode}><div className="grid gap-3 md:grid-cols-3">{(Object.keys(modeInfo) as Mode[]).map((item) => { const Icon = modeInfo[item].icon; return <button key={item} onClick={() => setMode(item)} className={`mode-card ${mode === item ? 'mode-card-active' : ''}`}><Icon className="size-5" /><span className="mt-4 block font-semibold">{modeInfo[item].title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{modeInfo[item].description}</span></button>; })}</div></ChoiceSection>
      </div></div>
      <aside className="lg:pt-20"><div className="sticky top-28 overflow-hidden rounded-3xl border bg-card shadow-[0_25px_70px_rgba(15,35,42,.09)]"><div className="border-b bg-[var(--ink)] p-6 text-white"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[.18em] text-white/55">{t.session}</span><Sparkles className="size-5 text-[var(--lime)]" /></div><p className="mt-7 text-3xl font-bold">{system} / {level}</p><p className="mt-2 text-sm text-white/65">{examYear} · {modeInfo[mode].title}</p></div><div className="space-y-5 p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 text-primary" /><div><p className="text-sm font-semibold">{t.verified}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{examFact(level, uiLanguage)}. {breakFact(system, level, uiLanguage)}.</p></div></div><div className="rounded-2xl bg-[var(--mint)] p-4"><p className="text-xs font-semibold text-[var(--mint-ink)]">{t.localProgress}</p><p className="mt-1 text-2xl font-bold">{progress.attempts}</p><p className="text-xs text-muted-foreground">{t.answers} · {progress.attempts ? Math.round(progress.correct / progress.attempts * 100) : 0}% {t.correctShort}</p></div><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground"><BarChart3 className="size-4" />{t.examsByYear}</div><div className="space-y-2">{yearSummary.map((item) => <div key={item.year} className="flex items-center justify-between rounded-xl border bg-background px-3 py-2.5"><div><p className="text-sm font-semibold">{item.year}</p><p className="text-[11px] text-muted-foreground">{item.sessions.length ? `${item.sessions.length} ${t.attempts} · ${t.best} ${item.best}%` : t.notTaken}</p></div>{item.passed ? <span className="flex items-center gap-1 text-xs font-semibold text-[var(--success)]"><Trophy className="size-4" />{t.passed}</span> : <span className="text-xs text-muted-foreground">—</span>}</div>)}</div></div><div className="rounded-2xl bg-muted/70 p-4 text-xs leading-5 text-muted-foreground">{examYear}: {pool.length} {t.available}.</div><Button className="h-12 w-full rounded-xl text-base" onClick={startQuiz} disabled={!pool.length}>{t.start} <ArrowRight data-icon="inline-end" /></Button></div></div></aside>
    </section>}

    {view === 'quiz' && question && <section className="mx-auto max-w-5xl px-5 py-7 lg:px-8 lg:py-10"><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2"><Badge>{level === 'FE' ? `${level} · ${part}` : level}</Badge><Badge variant="outline">{modeInfo[mode].title}</Badge><Badge variant="outline">{t.examLanguage}: {system === 'ITPEC' ? t.english : t.japanese}</Badge></div><p className="mt-3 text-sm text-muted-foreground">{t.question} {index + 1} {t.of} {partPool.length} · {domainLabel(question.domain)} / {topicLabels[question.topic][uiLanguage]}</p></div>{mode === 'exam' && <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 font-mono text-lg font-semibold tabular-nums shadow-sm"><Timer className="size-5 text-primary" /> {formatTime(secondsLeft)}</div>}</div><Progress value={((index + (selected !== null ? 1 : 0)) / partPool.length) * 100} className="mb-7 [&_[data-slot=progress-indicator]]:bg-primary" />
      <article className="rounded-3xl border bg-card p-5 shadow-[0_22px_60px_rgba(15,35,42,.07)] sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Badge className="bg-[var(--mint)] text-[var(--mint-ink)]">{question.year}</Badge><div className="language-switch" aria-label={t.questionLanguage}><button className={questionLanguage === 'original' ? 'active' : ''} onClick={() => setQuestionLanguage('original')}>{t.original}</button><button className={questionLanguage === 'interface' ? 'active' : ''} onClick={() => setQuestionLanguage('interface')}>{t.interface}</button></div></div><span className="text-right text-[11px] text-muted-foreground">{t.source} · {question.year}</span></div><h2 className="mt-6 text-xl font-semibold leading-8 tracking-[-.015em] sm:text-2xl" lang={questionLangCode}>{questionText?.prompt}</h2>
      <div className="mt-7 space-y-3">{optionOrder.map((originalIndex, displayIndex) => { const option = questionText?.options[originalIndex] ?? question.options[originalIndex]; const isSelected = selected === originalIndex; const isCorrect = question.answer === originalIndex; const stateClass = revealed && isCorrect ? 'answer-correct' : revealed && isSelected ? 'answer-wrong' : isSelected ? 'answer-selected' : ''; return <button key={originalIndex} onClick={() => chooseAnswer(originalIndex)} disabled={revealed} className={`answer-option ${stateClass}`} aria-pressed={isSelected}><span className="answer-letter">{String.fromCharCode(65 + displayIndex)}</span><span className="flex-1">{option}</span>{revealed && isCorrect && <Check className="size-5 text-[var(--success)]" />}{revealed && isSelected && !isCorrect && <X className="size-5 text-destructive" />}</button>; })}</div>
      {revealed && currentLesson && <div data-testid="explanation" className={`mt-7 rounded-2xl border p-5 sm:p-6 ${selected === question.answer ? 'explanation-correct' : 'explanation-wrong'}`}><div className="flex items-start gap-3">{selected === question.answer ? <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-[var(--success)]" /> : <XCircle className="mt-0.5 size-6 shrink-0 text-destructive" />}<div><h3 className="font-semibold">{selected === question.answer ? t.correct : t.wrong}</h3><p className="mt-1 text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">{t.quickReason}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{currentLesson.core}</p></div></div>{currentSearchQuery && <a className="search-topic" href={`https://www.google.com/search?q=${encodeURIComponent(currentSearchQuery)}`} target="_blank" rel="noreferrer"><Search className="size-4" /><span><strong>{t.searchFor}</strong>{currentSearchQuery}</span></a>}<LessonDetails lesson={currentLesson} copy={t} /></div>}
      <div className="mt-7 flex items-center justify-between gap-3 border-t pt-6"><Button variant="ghost" onClick={reset}><ArrowLeft data-icon="inline-start" />{t.exit}</Button><Button className="min-w-32" disabled={selected === null} onClick={goNext}>{index === partPool.length - 1 ? (level === 'FE' && part === 'A' ? t.finishA : t.results) : t.next}<ArrowRight data-icon="inline-end" /></Button></div></article></section>}

    {view === 'break' && <section className="mx-auto flex min-h-[calc(100vh-74px)] max-w-3xl items-center px-5 py-12"><div className="w-full rounded-3xl border bg-card p-7 text-center shadow-[0_25px_80px_rgba(15,35,42,.09)] sm:p-12"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[var(--mint)] text-primary"><Pause className="size-7" /></span><Badge className="mt-6">{system} · FE · A → B</Badge><h2 className="mt-4 text-3xl font-bold tracking-tight">{t.partDone}</h2><p className="mx-auto mt-3 max-w-lg leading-7 text-muted-foreground">{t.breakText} {system === 'IPA' ? t.officialBreak : t.organizerBreak}</p><div className="mx-auto my-8 max-w-xs rounded-2xl bg-[var(--ink)] px-5 py-5 text-white"><p className="text-xs uppercase tracking-[.18em] text-white/55">{mode === 'exam' && system === 'IPA' ? t.breakLeft : t.untimedBreak}</p><p className="mt-2 font-mono text-4xl font-bold tabular-nums">{mode === 'exam' && system === 'IPA' ? formatTime(breakSeconds) : '∞'}</p></div><Button size="lg" className="h-12 px-6" onClick={startPartB}><Play data-icon="inline-start" />{t.startB}</Button></div></section>}

    {view === 'result' && <section className="mx-auto min-h-[calc(100vh-74px)] max-w-4xl px-5 py-12"><div className="w-full rounded-3xl border bg-card p-6 shadow-[0_25px_80px_rgba(15,35,42,.09)] sm:p-10"><div className="grid items-center gap-8 sm:grid-cols-[180px_1fr]"><div className="result-ring" style={{ '--score': `${scorePercent}%` } as React.CSSProperties}><div><strong>{correctCount}</strong><span>{t.of} {answeredQuestions.length}</span></div></div><div><Badge className={sessionPassed ? 'bg-[var(--mint)] text-[var(--mint-ink)]' : ''}>{mode === 'learn' ? t.sessionDone : sessionPassed ? t.examPassed : t.thresholdMissed}</Badge><h2 className="mt-4 text-3xl font-bold tracking-tight">{examYear}: {scorePercent}%</h2><p className="mt-3 leading-7 text-muted-foreground">{mode === 'learn' ? t.learnDone : level === 'IP' ? t.ipRule : `${t.feRule}: A — ${partScore('A')}%, B — ${partScore('B')}%.`}</p></div></div><div className="mt-9 grid gap-3 sm:grid-cols-3">{['Technology','Management','Strategy'].map((domain) => { const items = answeredQuestions.filter((item) => item.domain === domain || (domain === 'Technology' && ['Algorithm','Security'].includes(item.domain))); const correct = items.filter((item) => answers[item.id] === item.answer).length; return <div key={domain} className="rounded-2xl bg-muted/65 p-4"><p className="text-xs text-muted-foreground">{domainLabel(domain)}</p><p className="mt-2 text-2xl font-bold">{correct} / {items.length}</p></div>; })}</div>
      <div className="mt-10 border-t pt-8"><div className="mb-5 flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{t.fullReview}</p><h3 className="mt-1 text-2xl font-bold tracking-tight">{t.reviewTitle}</h3></div><Badge variant="outline">{correctCount} {t.correctShort} · {pool.length - correctCount} {t.errors}</Badge></div><div className="space-y-3">{pool.map((item, itemIndex) => { const answer = answers[item.id]; const isCorrect = answer === item.answer; const localized = localizedForUi(item); const lesson = lessons[item.id][uiLanguage]; return <details key={item.id} className={`review-item ${isCorrect ? 'review-correct' : 'review-wrong'}`}><summary><span className="review-number">{level === 'FE' ? `${item.part} · ` : ''}{itemIndex + 1}</span><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{localized.prompt}</span><span className="mt-1 block text-xs text-muted-foreground">{topicLabels[item.topic][uiLanguage]} · {answer === undefined ? t.noAnswer : isCorrect ? t.correct : t.error}</span></span>{isCorrect ? <CheckCircle2 className="size-5 shrink-0 text-[var(--success)]" /> : <XCircle className="size-5 shrink-0 text-destructive" />}</summary><div className="review-body"><div className="grid gap-3 sm:grid-cols-2"><div className={`rounded-xl p-3 ${isCorrect ? 'bg-[var(--mint)]' : 'bg-destructive/8'}`}><p className="text-xs font-semibold text-muted-foreground">{t.yourAnswer}</p><p className="mt-1 text-sm font-medium">{answer === undefined ? t.answerMissing : localized.options[answer]}</p></div><div className="rounded-xl bg-[var(--mint)] p-3"><p className="text-xs font-semibold text-muted-foreground">{t.correctAnswer}</p><p className="mt-1 text-sm font-medium">{localized.options[item.answer]}</p></div></div><LessonDetails lesson={lesson} copy={t} open /></div></details>; })}</div></div>
      <div className="mt-8 flex flex-wrap justify-end gap-3 border-t pt-6"><Button variant="outline" onClick={reset}><ArrowLeft data-icon="inline-start" />{t.back}</Button><Button onClick={startQuiz}><RotateCcw data-icon="inline-start" />{t.retry}</Button></div></div></section>}
  </main>;
}

function ChoiceSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) { return <section><div className="mb-3 flex items-center gap-3"><span className="font-mono text-xs font-bold text-primary">{number}</span><h2 className="text-sm font-semibold uppercase tracking-[.12em]">{title}</h2></div>{children}</section>; }
function ChoiceCard({ active, onClick, title, description }: { active: boolean; onClick: () => void; title: string; description: string }) { return <button onClick={onClick} className={`choice-card ${active ? 'choice-card-active' : ''}`}><span><strong>{title}</strong><small>{description}</small></span><span className="choice-check">{active && <Check className="size-4" />}</span></button>; }
function LessonDetails({ lesson, copy, open = false }: { lesson: { core: string; method: string; example: string; pitfall: string }; copy: (typeof uiCopy)[UiLanguage]; open?: boolean }) { return <details className="lesson-details" open={open}><summary><BookOpenCheck className="size-4" />{copy.learnTopic}</summary><div className="lesson-body"><p>{lesson.method} {lesson.example} {lesson.pitfall}</p></div></details>; }
