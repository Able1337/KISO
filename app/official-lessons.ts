import { lessons, searchQueries, studyRecommendations, type UiLanguage } from './kiso-i18n';
import { expandedLessons } from './official-lesson-bank';

export type OfficialLesson = { core:string; detail:string; search:string; next:string; sources?:{title:string;url:string}[] };
const lessonSources:Record<number,NonNullable<OfficialLesson['sources']>>={
  22:[{title:'Open Source Definition · OSI',url:'https://opensource.org/osd'}],
  76:[{title:'ISO 9001 · ISO',url:'https://www.iso.org/iso-9001-quality-management.html'}],
  78:[{title:'ISO/IEC 27001:2022 · ISMS',url:'https://www.iso.org/standard/27001'},{title:'ISO 30401:2018 · Knowledge management systems',url:'https://www.iso.org/standard/68683.html'}],
  99:[{title:'SDGs · UN',url:'https://sdgs.un.org/goals'}],
};
const reused:Record<number,string>={2:'ip-logic-and',4:'ip-binary-155',56:'ip-wbs'};
const extra:Record<number,Record<UiLanguage,OfficialLesson>>={
  1:{
    ru:{core:'Ответ: $100. Для условий «эффект меньше $10 000» и «сокращение срока меньше недели» получается сочетание N / Y.',detail:'Таблица решений сопоставляет не отдельные условия, а их комбинации с действиями. Проверяйте строки условий по очереди: $20 000 меньше $10 000? Нет, значит N. Три дня меньше недели? Да, значит Y. Найдите столбец, в котором одновременно стоят N и Y, и прочитайте отмеченную в нём награду — $100. Не выбирайте сумму по одному признаку и не складывайте награды из разных столбцов. Знак «меньше» строгий: ровно $10 000 тоже даст N. Для двух независимых логических условий возможны четыре комбинации; для трёх — восемь.',search:'таблицы решений комбинации условий правила действий',next:'Потренируйтесь составлять таблицу решений из текста и проверять граничные значения: меньше, не больше, равно.'},
    en:{core:'The reward is $100: the conditions evaluate to N / Y.',detail:'A decision table maps combinations of conditions to actions. Test each condition separately: is $20,000 less than $10,000? No. Is three days less than one week? Yes. Find the column with N and Y together and read its marked reward: $100. Do not choose using only one condition or add rewards from different columns. “Less than” is strict: exactly $10,000 also gives N. Two Boolean conditions have four possible combinations; three have eight.',search:'decision tables conditions action rules boundary values',next:'Build a decision table from prose and practise the difference between less than, at most, and equal to.'},
    ja:{core:'正解は$100です。二つの条件は順にN・Yとなります。',detail:'決定表は条件の組合せと動作を対応付けます。まず$20,000は$10,000未満ではないのでNです。次に3日は1週間未満なのでYです。NとYが同時に並ぶ列を探すと、印の付いた報奨額は$100です。一つの条件だけで選んだり、異なる列の金額を加算したりしません。「未満」は境界を含まないため、$10,000ちょうどでもNです。真偽条件が二つなら組合せは4通り、三つなら8通りです。',search:'決定表 デシジョンテーブル 条件 動作 境界値',next:'文章から決定表を作り、未満・以下・等しいの違いを確認しましょう。'}
  },
  3:{
    ru:{core:'Ответ: 25. Для председателя есть 5 вариантов, и для каждого из них остаются 5 вариантов секретаря: 5 × 5.',detail:'Это правило произведения: число последовательных выборов перемножают. Должности различаются, поэтому пара «Анна — председатель, Борис — секретарь» отличается от обратной. Совмещение разрешено: после первого выбора кандидата не исключают. Поэтому получаем 5² = 25. Если совмещение запретить, получится 5 × 4 = 20. Число 10 = 5 × 4 / 2 подходило бы для выбора двух разных людей без распределения должностей; это другая задача.',search:'комбинаторика правило произведения размещения с повторениями',next:'Сравните выбор с повторениями и без повторений, а также задачи, в которых порядок важен и не важен.'},
    en:{core:'There are 25 assignments: 5 choices for chairperson × 5 for secretary.',detail:'Use the multiplication principle for successive choices. The roles are distinct: Anna as chairperson and Boris as secretary is different from the reverse assignment. Dual roles are allowed, so no candidate is removed after the first choice: 5² = 25. Without dual roles there would be 5 × 4 = 20 assignments. The value 10 = 5 × 4 / 2 counts two different people without assigning roles, which is not this question.',search:'counting multiplication principle ordered choices with replacement',next:'Compare choices with and without replacement, then ordered assignments and unordered selections.'},
    ja:{core:'正解は25通りです。議長5通り×書記5通りとなります。',detail:'連続する選択には積の法則を使います。役職が異なるため、Aが議長でBが書記の場合と、その逆は別です。兼任が認められるので、議長を選んでも書記の候補は減らず、5²＝25です。兼任不可なら5×4＝20通りになります。5×4÷2＝10は役割を区別せず異なる2人を選ぶ場合であり、この問題とは条件が違います。',search:'場合の数 積の法則 重複順列 順序',next:'重複を許す場合と許さない場合、順序を区別する場合としない場合を比較しましょう。'}
  },
  5:{
    ru:{core:'После всех операций остаются две коробки: 2 сверху и 1 снизу.',detail:'Записывайте стек снизу вверх и после каждого действия обновляйте его целиком. Начало: [1, 2, 2, 3, 4]. Операция 1 снимает 4 и 3 и кладёт 7: [1, 2, 2, 7]. Операция 2 кладёт 3: [1, 2, 2, 7, 3]. Операция 3 снимает 3, 7 и 2; их среднее (3 + 7 + 2) / 3 = 4: [1, 2, 4]. Операция 4 снимает 4 и 2, кладёт |4 − 2| = 2: [1, 2]. Важно снимать элементы с вершины, а не с основания; снятые элементы больше не участвуют в следующих операциях.',search:'стек LIFO push pop трассировка операций',next:'Сравните стек с очередью FIFO. Потренируйтесь выполнять последовательности push/pop и вычислять выражения в обратной польской записи.'},
    en:{core:'Two boxes remain: 2 on top of 1.',detail:'Write the stack bottom to top and update it after each operation. Initially [1, 2, 2, 3, 4]. Operation 1 replaces 4 and 3 with 7: [1, 2, 2, 7]. Operation 2 pushes 3: [1, 2, 2, 7, 3]. Operation 3 replaces 3, 7 and 2 with their mean, (3 + 7 + 2) / 3 = 4: [1, 2, 4]. Operation 4 replaces 4 and 2 with |4 − 2| = 2: [1, 2]. Remove elements from the top, not the bottom. Removed elements do not participate in later operations.',search:'stack LIFO push pop operation trace',next:'Compare a LIFO stack with a FIFO queue. Practise push/pop traces and postfix expression evaluation.'},
    ja:{core:'最後は上が2、下が1の2個の箱になります。',detail:'底から頂上の順に状態を記録します。初期状態は[1, 2, 2, 3, 4]です。操作1で4と3を7に置き換え、[1, 2, 2, 7]。操作2で3を積み、[1, 2, 2, 7, 3]。操作3で3、7、2を平均値(3＋7＋2)÷3＝4に置き換え、[1, 2, 4]。操作4で4と2を差の絶対値|4−2|＝2に置き換え、[1, 2]となります。取り出すのは底ではなく頂上です。一度取り出した値を後の計算に再利用しないよう注意します。',search:'スタック LIFO push pop トレース',next:'FIFOのキューとの違いを確認し、push/popと逆ポーランド記法の計算を練習しましょう。'}
  },
  6:{
    ru:{core:'Сначала сохраните A в TMP, затем присвойте A значение B и B — сохранённое значение TMP.',detail:'Присваивание заменяет старое значение переменной. Пусть A = 3, B = 8. После TMP ← A получаем TMP = 3; после A ← B получаем A = 8; после B ← TMP получаем B = 3. Значения обменялись. Если в последнем шаге выполнить B ← A, оба станут равны 8: старое A уже потеряно. Сохранить сначала B тоже можно, но тогда нужно изменить порядок: TMP ← B; B ← A; A ← TMP. Проверяйте всю последовательность, а не только наличие временной переменной.',search:'обмен значений переменных временная переменная присваивание',next:'Освойте пошаговую трассировку присваиваний и различие между присваиванием и проверкой равенства.'},
    en:{core:'Save A in TMP, assign B to A, then assign the saved TMP to B.',detail:'Assignment replaces a variable’s old value. With A = 3 and B = 8, TMP ← A stores 3; A ← B sets A to 8; B ← TMP sets B to 3. The values are swapped. Using B ← A in the last step leaves both equal to 8 because A has already changed. Saving B first is also possible, but requires TMP ← B; B ← A; A ← TMP. Check the whole sequence rather than merely looking for a temporary variable.',search:'swap two variables temporary variable assignment trace',next:'Practise tracing assignments step by step and distinguish assignment from equality testing.'},
    ja:{core:'AをTMPに保存し、AにBを代入してから、BにTMPを代入します。',detail:'代入すると変数の古い値は置き換わります。A＝3、B＝8なら、TMP←Aで3を保存し、A←BでAが8になり、B←TMPでBが3になります。最後をB←Aにすると、変更後のAを使うため両方8になってしまいます。Bを先に保存するなら、TMP←B、B←A、A←TMPという順序が必要です。一時変数があるかだけでなく、全体の順序を確認します。',search:'変数 値の交換 一時変数 代入 トレース',next:'代入の状態変化を追跡し、代入と等値比較の違いを学びましょう。'}
  }
};

export const officialLessonCount=new Set([...Object.keys(reused),...Object.keys(extra),...Object.keys(expandedLessons)]).size;
export function officialLesson(number:number,language:UiLanguage):OfficialLesson|null {
  if(expandedLessons[number]) return {...expandedLessons[number][language],sources:lessonSources[number]};
  if(extra[number]) return extra[number][language];
  const id=reused[number];if(!id)return null;
  const lesson=lessons[id][language];
  const clarification=number===56?{
    ru:' В этом вопросе верно, что WBS служит основой оценки человеко-дней. Она включает 100% согласованного объёма проекта, но не работу за его границами. Глубину декомпозиции выбирают под конкретный проект, а не одинаковой для всех. Похожие работы нельзя пропускать только потому, что их выполняет один участник: иначе часть объёма и трудозатрат потеряется.',
    en:' In this question a WBS supports person-day estimates. It covers 100% of the agreed project scope, not work outside that scope. Decomposition depth depends on the project rather than being identical everywhere. Similar activities cannot simply be omitted because one team member performs them; doing so would hide scope and effort.',
    ja:' この問題ではWBSを人日工数の見積りの基礎にできる点が正しい説明です。合意したスコープの100%を含めますが、範囲外の作業は含めません。分解の深さはプロジェクトに応じて決めます。同じ担当者が類似作業を行っても、省略すると必要な範囲や工数が抜けるため記載が必要です。'
  }[language]:'';
  return {core:lesson.core,detail:`${lesson.method} ${lesson.example} ${lesson.pitfall}${clarification}`,search:searchQueries[id][language],next:studyRecommendations[id][language]};
}
