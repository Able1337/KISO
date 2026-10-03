import type { EjuLanguage } from '../lib/eju-types';

// Links verified on JASSO, 2026-10-03. These are reference papers, not item-level provenance.
export default function EjuQuestionSources({
  language,
  section,
}: {
  language: EjuLanguage;
  section: string;
}) {
  const l = (ru: string, en: string, ja: string) => ({ ru, en, ja })[language];
  const base = 'https://www.jasso.go.jp/';
  const jp = section !== 'math';
  const paper = jp
    ? 'ryugaku/eju/examinee/pastpaper_sample/__icsFiles/afieldfile/2026/02/24/2018_1question_jafl.pdf'
    : 'en/ryugaku/eju/examinee/pastpaper_sample/__icsFiles/afieldfile/2021/09/10/2018_1question_math_1.pdf';
  const links = [
    {
      url: base + paper,
      title: jp
        ? l(
            'Japanese · 2018-1 · задания PDF',
            'Japanese · 2018-1 · question PDF',
            '日本語・2018年第1回・問題PDF',
          )
        : l(
            'Math 1 / Math 2 · 2018-1 · задания PDF',
            'Math 1 / Math 2 · 2018-1 · question PDF',
            '数学コース1・2・2018年第1回・問題PDF',
          ),
    },
    {
      url:
        base +
        'en/ryugaku/eju/examinee/pastpaper_sample/__icsFiles/afieldfile/2026/01/15/2018_1answer_e202512_1.pdf',
      title: l(
        'Ответы JASSO к работе 2018-1',
        'JASSO answer key for 2018-1',
        '2018年第1回の公式正解',
      ),
    },
  ];
  if (section === 'listening')
    links.push({
      url: base + 'ryugaku/eju/examinee/pastpaper_sample/pastpaper_2018_1.html',
      title: l(
        'Аудирование: официальные записи и скрипты',
        'Listening: official audio and transcripts',
        '聴解・聴読解：公式音声・スクリプト',
      ),
    });
  if (section === 'writing')
    links.push({
      url:
        base +
        'ryugaku/eju/examinee/pastpaper_sample/__icsFiles/afieldfile/2025/11/07/2018_1answer_jafl_writing.pdf',
      title: l(
        'Официальные образцы сочинений · 2018-1',
        'Official sample essays · 2018-1',
        '記述の公式解答例・2018年第1回',
      ),
    });
  return (
    <section
      className="mt-5 border-t pt-4 text-sm leading-6"
      aria-label={l(
        'Материалы JASSO для сравнения',
        'JASSO reference materials',
        '参考用JASSO資料',
      )}
    >
      <h3 className="font-semibold">
        {l(
          'Реальный экзамен EJU · материалы для сравнения',
          'Real EJU paper · reference materials',
          '実際のEJU問題・参考資料',
        )}
      </h3>
      <p className="mt-2 text-xs text-muted-foreground">
        {l(
          'Задание Kiso — авторское. Ссылки ведут к реальной работе по этому предмету, а не к подтверждённому аналогу конкретного задания. Нумерация и ответы JASSO относятся к официальному PDF.',
          'This Kiso task is independently authored. These links reference a real subject paper, not a verified equivalent of this specific task. JASSO numbering and answers refer to the official PDF.',
          'Kiso独自問題です。リンクは同じ科目の実際の試験で、この設問に対応する原問題を示すものではありません。番号・正解は公式PDFのものです。',
        )}
      </p>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.url}>
            <a
              className="text-primary underline underline-offset-4"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.title} ↗
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
