import { tr, type EjuText, type EjuCourse } from '../lib/eju-types.ts';
export type StudyTopic = {
  id: string;
  courses: EjuCourse[];
  title: EjuText;
  lesson: EjuText;
};
const m1: EjuCourse[] = ['math1'];
const m2: EjuCourse[] = ['math2'];
const jp: EjuCourse[] = ['japanese'];
const t = (
  id: string,
  courses: EjuCourse[],
  title: [string, string, string],
  lesson: [string, string, string],
): StudyTopic => ({ id, courses, title: tr(...title), lesson: tr(...lesson) });
export const ejuTopics: StudyTopic[] = [
  t(
    'expressions',
    m1,
    ['Числа и выражения', 'Numbers and expressions', '数と式'],
    [
      'Равенство сохраняется, если выполнить одну и ту же операцию с обеими частями. При делении проверьте, что делитель не равен нулю. Для разложения x²−sx+p найдите два числа с суммой s и произведением p. В корнях сначала выделяйте полные квадраты.',
      'Apply the same operation to both sides of an equation; never divide by zero. Factor x²−sx+p by finding two numbers with sum s and product p. Extract square factors before combining radicals.',
      '等式の両辺に同じ操作を行う。0で割らない。x²−sx+pは和がs、積がpの2数を探して因数分解する。根号では平方因子を先に取り出す。',
    ],
  ),
  t(
    'sets',
    m1,
    ['Множества и логика', 'Sets and propositions', '集合と命題'],
    [
      'Для двух множеств |A∪B|=|A|+|B|−|A∩B|. Дополнение считаем относительно явно заданного общего множества. Обратное утверждение Q⇒P не следует автоматически из P⇒Q: найдите контрпример.',
      'Use inclusion–exclusion for unions and a defined universe for complements. The converse Q⇒P need not follow from P⇒Q; test it with a counterexample.',
      '和集合では共通部分の二重計算を除く。補集合には全体集合が必要。P⇒Qから逆Q⇒Pは自動的には言えず、反例で確かめる。',
    ],
  ),
  t(
    'quadratic',
    m1,
    ['Квадратные функции', 'Quadratic functions', '二次関数'],
    [
      'Приведите ax²+bx+c к a(x−h)²+k. Для экстремума на отрезке проверяйте вершину, если она внутри, и оба конца. Корни разбивают ось на интервалы знака; касание прямой соответствует нулевому дискриминанту.',
      'Complete the square. For extrema on a closed interval, check both endpoints and the vertex if it lies inside. Roots divide sign intervals; tangency corresponds to discriminant zero.',
      '平方完成で頂点を求める。閉区間の最大・最小では両端と区間内の頂点を調べる。根で符号を分け、接する条件には判別式0を使う。',
    ],
  ),
  t(
    'measurement',
    m1,
    ['Тригонометрия и измерения', 'Trigonometry and measurement', '図形と計量'],
    [
      'Используйте a²=b²+c²−2bc cos A, a/sin A=2R и S=bc sin A/2. Угол должен лежать между выбранными сторонами в формуле площади. Рисунок помогает выбрать соответствующие стороны, но не заменяет доказательство.',
      'Use the cosine rule, sine rule and included-angle area formula. Match each angle with its opposite side; distinguish radius R from diameter 2R.',
      '余弦定理、正弦定理、面積公式を使い分ける。角と対辺を対応させ、面積では2辺の間の角を使う。半径と直径を区別する。',
    ],
  ),
  t(
    'probability',
    m1,
    [
      'Комбинаторика и вероятность',
      'Counting and probability',
      '場合の数と確率',
    ],
    [
      'Сначала решите, важен ли порядок и допускается ли повторение. Без возвращения вероятности следующих выборов меняются. Условная вероятность ограничивает пространство исходов. Ожидание — сумма значений, умноженных на вероятности; чистая прибыль учитывает стоимость участия.',
      'Decide whether order and repetition matter. Without replacement, probabilities change. Conditional probability restricts the sample space. Expected net profit includes the participation cost.',
      '順序と重複の有無を先に判断する。戻さない抽出では確率が変わる。条件付き確率では標本空間を限定する。純利益の期待値では費用も引く。',
    ],
  ),
  t(
    'integers',
    m1,
    ['Целые числа и системы счисления', 'Integers and bases', '整数の性質'],
    [
      'Алгоритм Евклида повторяет деление с остатком до нулевого остатка. Для положительных a,b: НОД×НОК=ab. В основании b цифры имеют веса b⁰,b¹,…; каждая цифра меньше b. Для обратного перевода последовательно делите на основание.',
      'Euclid repeats remainder division. For positive integers gcd×lcm=ab. Base-b place values are powers of b and digits are smaller than b. Reverse conversion uses repeated division.',
      '互除法は余りが0になるまで繰り返す。正整数では最大公約数×最小公倍数=積。b進法の各桁はbの累乗の重みを持ち、数字はb未満。',
    ],
  ),
  t(
    'geometry',
    m1,
    ['Свойства фигур', 'Geometry', '図形の性質'],
    [
      'Биссектриса делит противоположную сторону в отношении прилежащих сторон. Для внешней точки и окружности PT²=PA·PB. Все расстояния берутся от одной точки. Начинайте решение с рисунка и отметок известных углов и длин.',
      'Use the angle-bisector theorem and power of a point. Measure both secant lengths from the same point. Start with a diagram labeling known lengths and angles.',
      '角の二等分線の定理と方べきの定理を使う。割線の距離は同じ点から測る。既知の長さと角度を図に書き込む。',
    ],
  ),
  t(
    'polynomials',
    m2,
    ['Многочлены', 'Polynomials', '式と証明'],
    [
      'Остаток при делении P(x) на x−a равен P(a). Если он нулевой, x−a — множитель. После выделения множителя продолжайте разложение и проверяйте его раскрытием скобок.',
      'The remainder on division by x−a is P(a). A zero remainder identifies a factor. Verify a complete factorization by expansion.',
      'x−aで割った余りはP(a)。0ならx−aは因数。因数分解後は展開して確かめる。',
    ],
  ),
  t(
    'coordinate',
    m2,
    ['Координатная геометрия', 'Coordinate geometry', '図形と方程式'],
    [
      'Окружность имеет вид (x−h)²+(y−k)²=r². Центр (h,k), радиус r≥0. После дополнения до квадрата следите за добавленными константами. Пересечения с прямой находите подстановкой.',
      'Complete the square to identify center and radius. Track the added constants carefully. Substitute a line equation to find intersections.',
      '平方完成で中心と半径を読み取る。加えた定数を右辺にも反映する。直線との交点は代入して求める。',
    ],
  ),
  t(
    'logarithms',
    m2,
    ['Степени и логарифмы', 'Exponents and logarithms', '指数・対数関数'],
    [
      'Вынесите одинаковые степени как общий множитель. log a+log b=log(ab) требует положительных a,b и одного основания. После решения обязательно отбрасывайте корни, нарушающие область определения.',
      'Factor common exponential terms. Logarithm sum rules require positive arguments and a common base. Reject roots outside the domain.',
      '指数の共通因数をくくる。対数の和の公式には正の真数と共通の底が必要。真数条件に反する解を除く。',
    ],
  ),
  t(
    'trigonometry',
    m2,
    ['Тригонометрические функции', 'Trigonometric functions', '三角関数'],
    [
      'Подстановка u=sinθ может превратить уравнение в квадратное. Затем вернитесь к углам: одному u могут соответствовать несколько θ. Проверьте диапазон [−1,1] и заданный интервал углов.',
      'Substitute u=sinθ, solve algebraically, then recover every angle in the required interval. Enforce −1≤u≤1.',
      'u=sinθで代数方程式に直し、指定範囲の角に戻す。−1≤u≤1と角の範囲を確認する。',
    ],
  ),
  t(
    'sequences',
    m2,
    ['Последовательности', 'Sequences', '数列'],
    [
      'Для aₙ₊₁=raₙ+c ищите постоянную точку L=rL+c. Тогда aₙ−L — геометрическая прогрессия. Суммы полиномов по n разлагайте на известные суммы Σ1, Σn, Σn².',
      'Shift a linear recurrence by its fixed point to get a geometric sequence. Decompose polynomial sums into standard power sums.',
      '一次漸化式は固定点を引くと等比数列になる。多項式の和は基本的な和の公式に分ける。',
    ],
  ),
  t(
    'distribution',
    m2,
    ['Распределения вероятностей', 'Probability distributions', '確率分布'],
    [
      'Для X~B(n,p): P(X=k)=C(n,k)pᵏ(1−p)ⁿ⁻ᵏ, E(X)=np. Дисперсия V(X)=E(X²)−E(X)². Не заменяйте E(X²) квадратом среднего.',
      'For a binomial variable use the combination factor and both success/failure probabilities. Variance is E(X²)−E(X)², not the second moment alone.',
      '二項分布では組合せの数と成功・失敗の確率を掛ける。分散はE(X²)−E(X)²であり、二乗の平均と平均の二乗は異なる。',
    ],
  ),
  t(
    'vectors',
    m2,
    ['Векторы', 'Vectors', 'ベクトル'],
    [
      'Скалярное произведение a·b=|a||b|cosθ. В координатах умножьте соответствующие компоненты и сложите. Для внутреннего деления AP:PB=m:n получаем P=(nA+mB)/(m+n).',
      'Compute dot products componentwise and divide by magnitudes for angles. Internal division uses opposite weights: P=(nA+mB)/(m+n).',
      '内積は対応成分の積の和。角度には大きさの積で割る。内分点は反対側の比を重みにする。',
    ],
  ),
  t(
    'complex',
    m2,
    ['Комплексная плоскость', 'Complex plane', '複素数平面'],
    [
      'Используйте i²=−1. Умножение на cosθ+i sinθ поворачивает вектор на θ; умножение на i — поворот на 90° против часовой стрелки. Длина комплексного числа — √(a²+b²).',
      'Use i²=−1. Multiplication by a unit complex number rotates a point; multiplication by i gives a counterclockwise quarter-turn.',
      'i²=−1を使う。絶対値1の複素数を掛けると回転し、iを掛けると反時計回り90°回転する。',
    ],
  ),
  t(
    'conics',
    m2,
    ['Кривые второго порядка', 'Conic sections', '二次曲線'],
    [
      'Для эллипса x²/a²+y²/b²=1 при a>b фокусы (±c,0), c²=a²−b². У гиперболы знак между квадратами отрицательный и c²=a²+b². Не смешивайте эти формулы.',
      'For an ellipse c²=a²−b²; for a hyperbola c²=a²+b². Distinguish semiaxes from full axis lengths.',
      '楕円ではc²=a²−b²、双曲線ではc²=a²+b²。半軸と軸全体の長さも区別する。',
    ],
  ),
  t(
    'functions',
    m2,
    ['Функции и обратные функции', 'Functions and inverses', '関数'],
    [
      'Чтобы найти обратную функцию, запишите y=f(x), выразите x через y и поменяйте имена. Проверьте область определения и однозначность. Знаменатель обратной функции не должен обращаться в ноль.',
      'Solve y=f(x) for x, then rename variables. Check domains and one-to-one behavior. An inverse’s denominator must be nonzero.',
      'y=f(x)をxについて解き、変数名を交換する。定義域と一対一性を確認し、分母0を除く。',
    ],
  ),
  t(
    'limits',
    m2,
    ['Пределы', 'Limits', '極限'],
    [
      'Форма 0/0 требует преобразования, а не ответа 0. Разложите на множители, рационализируйте или разделите на старшую степень. Предел зависит от значений рядом с точкой, даже если функция в самой точке не определена.',
      'An indeterminate form requires simplification. Factor, rationalize or divide by the highest power. A limit depends on nearby values, not the value at the point itself.',
      '0/0は変形が必要な不定形。因数分解・有理化・最高次数での除算を使う。極限は点の近くの値で決まる。',
    ],
  ),
  t(
    'derivatives',
    m2,
    ['Производные', 'Differentiation', '微分法'],
    [
      'Производная даёт наклон касательной. Стационарная точка не всегда экстремум: проверьте знак производной слева и справа. Касательная в x=a: y=f(a)+f′(a)(x−a).',
      'A derivative gives tangent slope. Stationary points require a sign-change check. The tangent at a is y=f(a)+f′(a)(x−a).',
      '導関数は接線の傾き。停留点では符号変化を確認する。接線はy=f(a)+f′(a)(x−a)。',
    ],
  ),
  t(
    'integrals',
    m2,
    ['Интегралы и площади', 'Integration and area', '積分法'],
    [
      'Сначала найдите точки пересечения, затем определите верхнюю и нижнюю функции. Площадь равна интегралу верхней минус нижняя. Если порядок меняется, разбейте интервал; знаковый интеграл может взаимно сократить площади.',
      'Find intersections and the upper/lower curves before integrating. Split intervals where their order changes; a signed integral can cancel geometric areas.',
      '交点と上下関係を調べて上−下を積分する。上下が変わる区間は分け、符号付き積分と面積を区別する。',
    ],
  ),
  t(
    'jp-details',
    jp,
    [
      'Чтение: детали и условия',
      'Reading: details and conditions',
      '読解・詳細',
    ],
    [
      'Сначала прочитайте вопрос, затем найдите сроки, исключения и условия в тексте. Отмечайте ただし, まで, 場合. Проверяйте все части ответа: вариант может повторять слова текста, но менять условие.',
      'Locate deadlines, exceptions and conditions. Watch ただし, まで and 場合. A distractor may repeat the text’s vocabulary while changing its condition.',
      '期限・例外・条件を探し、ただし・まで・場合に注目する。同じ語を使っていても条件が変わった選択肢に注意。',
    ],
  ),
  t(
    'jp-main',
    jp,
    ['Чтение: главная мысль', 'Reading: main idea', '読解・主旨'],
    [
      'Отделяйте пример от вывода. Слова しかし, つまり и そのため показывают ход аргумента. Правильная главная мысль охватывает текст, не усиливая осторожное утверждение до «всегда» или «никогда».',
      'Separate examples from conclusions. Follow contrast and conclusion markers. Avoid options that turn a qualified claim into an absolute one.',
      '例と結論を分け、逆接やまとめの表現を追う。限定的な主張を「必ず」などに強めた選択肢を避ける。',
    ],
  ),
  t(
    'jp-relations',
    jp,
    [
      'Чтение: связи и указатели',
      'Reading: relations and references',
      '読解・関係',
    ],
    [
      'Для それ и このこと найдите предшествующее действие или идею, затем подставьте её вместо указателя. Различайте причину, следствие и простое совпадение. Делайте короткую схему аргумента.',
      'Resolve references by substituting the preceding idea. Distinguish cause, effect and coincidence; sketch the argument’s structure.',
      '指示語を前の内容に置き換えて確認する。原因・結果・単なる同時発生を区別し、論理関係を整理する。',
    ],
  ),
  t(
    'jp-inference',
    jp,
    ['Чтение: вывод из текста', 'Reading: inference', '読解・推論'],
    [
      'Выбирайте вывод, который поддержан текстом, а не просто правдоподобен. Для каждого варианта ищите основание. Нельзя добавлять причинность, всеобщность или оценку, которых автор не давал.',
      'Choose an inference supported by the passage, not merely plausible. Do not add causality, universality or value judgments absent from the text.',
      'もっともらしさではなく本文の根拠で判断する。本文にない因果関係・一般化・評価を加えない。',
    ],
  ),
  t(
    'jp-integrated',
    jp,
    ['Аудирование с таблицами', 'Listening with visual information', '聴読解'],
    [
      'До записи просмотрите заголовки и единицы измерения. Во время прослушивания выписывайте ограничения, затем исключайте неподходящие строки. Различайте абсолютное число, прирост и долю.',
      'Inspect headings and units before listening. Track each constraint, then eliminate rows. Distinguish totals, changes and proportions.',
      '音声前に見出しと単位を確認。条件をメモして候補を消去する。総数・増加数・割合を区別する。',
    ],
  ),
  t(
    'jp-listening',
    jp,
    [
      'Аудирование: лекции и диалоги',
      'Listening: lectures and conversations',
      '聴解',
    ],
    [
      'Следите за пересмотром решения: первоначальное предложение может быть отвергнуто после でも или では. В лекции отмечайте цель, пример и итог. Сначала отвечайте без скрипта, потом проверьте место, где потеряли смысл.',
      'Track revised decisions rather than the first proposal. In lectures note the purpose, example and conclusion. Attempt without the transcript, then review the missed link.',
      '最初の提案ではなく変更後の決定を追う。講義では目的・例・結論を押さえる。まずスクリプトなしで解き、その後で確認する。',
    ],
  ),
  t(
    'jp-writing',
    jp,
    ['Сочинение: аргументация', 'Writing: argumentation', '記述・論証'],
    [
      'За 30 минут: 5 минут на план, 20 на текст, 5 на проверку. Сформулируйте позицию, объясните почему, приведите пример, рассмотрите возражение и сделайте вывод. 400–500 знаков; количество знаков само по себе не оценивает качество.',
      'Allocate 5 minutes to planning, 20 to drafting and 5 to review. State a position, justify it, give an example, address another view and conclude. Aim for 400–500 Japanese characters.',
      '30分を構想5分・執筆20分・確認5分に分ける。立場、理由、例、反対の視点、結論を示す。400〜500字を目安に、字数だけでなく論証を確認する。',
    ],
  ),
];
