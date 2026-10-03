import type { EjuLanguage } from '../lib/eju-types';
export default function EjuMaterials({ language }: { language: EjuLanguage }) {
  const l = (ru: string, en: string, ja: string) => ({ ru, en, ja })[language];
  const base = 'https://www.jasso.go.jp/en/ryugaku/eju/examinee/';
  return (
    <section className="mt-6 rounded-2xl border bg-card p-5 text-sm leading-7">
      <h2 className="font-bold">
        {l(
          'Официальные материалы EJU · JASSO',
          'Official EJU materials · JASSO',
          'EJU公式資料・JASSO',
        )}
      </h2>
      <p>
        {l(
          'Оригиналы открываются на сайте JASSO. Авторские варианты Kiso расположены выше.',
          'Original materials open on JASSO’s website. Kiso practice papers are available above.',
          '原本はJASSOのサイトで開きます。Kiso独自問題は上で選択できます。',
        )}
      </p>
      <ul className="mt-2 space-y-2">
        {[
          [
            'pastpaper_sample/index.html',
            l(
              'Прошлые экзамены: задания и ответы',
              'Past papers: questions and answers',
              '過去問・正解',
            ),
          ],
          [
            'pastpaper_sample/pastpaper_2021_1.html',
            l(
              'Математика: сессия 2021-1 и ключи',
              'Mathematics: 2021-1 paper and keys',
              '数学：2021年第1回・正解',
            ),
          ],
          [
            'pastpaper_sample/pastpaper_2018_1.html',
            l(
              'Сессия 2018-1: опубликованные материалы, аудио и ответы',
              '2018-1: published materials, audio and answers',
              '2018年第1回：公開問題・音声・正解',
            ),
          ],
          [
            'syllabus/mathematics.html',
            l(
              'Программа Mathematics Course 1 / 2 (с 2026 года)',
              'Mathematics Course 1 / 2 syllabus (from 2026)',
              '数学コース1・2のシラバス（2026年から）',
            ),
          ],
          [
            'syllabus/japanese.html',
            l('Программа Japanese', 'Japanese syllabus', '日本語のシラバス'),
          ],
          [
            'procedure/subject.html',
            l(
              'Состав экзамена и время',
              'Subjects and timing',
              '試験科目・時間',
            ),
          ],
        ].map(([path, title]) => (
          <li key={path}>
            <a
              className="text-primary underline underline-offset-4"
              href={base + path}
              target="_blank"
              rel="noreferrer"
            >
              {title} ↗
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        <a
          className="underline"
          href={`${import.meta.env.BASE_URL}eju/audio/ATTRIBUTION.txt`}
          target="_blank"
          rel="noreferrer"
        >
          {l(
            'Синтетическая озвучка Kiso: Mei · CC BY 3.0',
            'Kiso synthetic voice: Mei · CC BY 3.0',
            'Kiso合成音声：Mei・CC BY 3.0',
          )}
        </a>
      </p>
    </section>
  );
}
