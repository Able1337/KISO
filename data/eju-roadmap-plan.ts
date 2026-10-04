import { ejuTopics } from './eju-topics.ts';
import type { EjuCourse } from '../lib/eju-types.ts';

// Teaching order, not JASSO's numbering. Math 2 includes the entire Math 1 scope.
export type EjuStage = {
  id: string;
  title: string;
  topics: string[];
  goal: string;
};
const foundations: EjuStage[] = [
  {
    id: 'algebra',
    title: 'Алгебра и язык условий',
    topics: ['expressions', 'sets', 'quadratic'],
    goal: 'Переводить условие в выражение, указывать допустимые значения и объяснять решение неравенства по графику. До начала повторите дроби, проценты и линейные уравнения.',
  },
  {
    id: 'figures',
    title: 'Измерения и геометрические связи',
    topics: ['measurement', 'geometry'],
    goal: 'Самостоятельно строить чертёж, выбирать теорему по известным величинам и проверять, что длины и углы согласованы. Сначала повторите подобие и теорему Пифагора.',
  },
  {
    id: 'discrete',
    title: 'Подсчёт, вероятность и целые числа',
    topics: ['integers', 'probability'],
    goal: 'Различать порядок и выбор без порядка, независимость и условие; обосновывать пространство исходов. Для целых чисел получать все решения, а не только один подходящий пример.',
  },
];
const advanced: EjuStage[] = [
  {
    id: 'functions',
    title: 'Выражения, функции и графики',
    topics: [
      'polynomials',
      'coordinate',
      'functions',
      'logarithms',
      'trigonometry',
    ],
    goal: 'После квадратных функций освоить преобразования графиков, область определения, обратную функцию и уравнения с параметрами. Проверять найденные корни в исходном выражении.',
  },
  {
    id: 'models',
    title: 'Последовательности и случайные величины',
    topics: ['sequences', 'distribution'],
    goal: 'Перейти от закономерности к общей формуле и доказательству; вычислять среднее, разброс и связь величин. Основа — алгебра, подсчёт исходов и условная вероятность.',
  },
  {
    id: 'space',
    title: 'Координаты, векторы и комплексная плоскость',
    topics: ['vectors', 'complex', 'conics'],
    goal: 'Описывать одну фигуру геометрически и алгебраически; переходить между координатами и параметром. Для комплексной формы повторите тригонометрию, для пространственных задач — геометрию.',
  },
  {
    id: 'calculus',
    title: 'Предел → производная → интеграл',
    topics: ['limits', 'derivatives', 'integrals'],
    goal: 'Объяснять предельный переход, строить исследование функции и выбирать интеграл для площади, объёма или длины. Проверьте знание функций, тригонометрии и последовательностей до этого этапа.',
  },
];
const japanese: EjuStage[] = [
  {
    id: 'read',
    title: 'Чтение: от предложения к позиции автора',
    topics: ['jp-details', 'jp-main', 'jp-relations'],
    goal: 'Находить подтверждение в тексте, восстанавливать пропущенный субъект и отличать тезис от примера. Незнакомые слова и конструкции выписывайте из контекста; отдельного официального списка слов JLPT для EJU здесь нет.',
  },
  {
    id: 'infer',
    title: 'Выводы и применение информации',
    topics: ['jp-inference', 'jp-integrated'],
    goal: 'Применять правило к новому случаю, сопоставлять текст с таблицей и устным уточнением. Объяснять, какое именно условие исключает каждый неверный вариант.',
  },
  {
    id: 'listen',
    title: 'Аудирование и конспект',
    topics: ['jp-listening'],
    goal: 'После одного прослушивания восстанавливать цель, ограничения и итог решения. Сначала тренируйте понимание без таймера, затем слушайте без паузы; запись и транскрипт используйте для разбора ошибок.',
  },
  {
    id: 'write',
    title: 'Письменная аргументация и сборка экзамена',
    topics: ['jp-writing'],
    goal: 'Писать по условию, связывать тезис с конкретным примером и редактировать текст. Завершайте цикл самостоятельным сочинением и смешанной практикой чтения и аудирования; проверка длины не заменяет оценку содержания.',
  },
];
export function ejuStages(course: EjuCourse): EjuStage[] {
  return course === 'japanese'
    ? japanese
    : course === 'math2'
      ? [...foundations, ...advanced]
      : foundations;
}
export function ejuRoadmapTopics(course: EjuCourse) {
  return ejuStages(course).flatMap((s) =>
    s.topics.map((id) => ejuTopics.find((t) => t.id === id)!),
  );
}
export function ejuPracticeCourse(topic: string): EjuCourse {
  const item = ejuTopics.find((t) => t.id === topic);
  if (!item) throw new Error(`Unknown EJU topic: ${topic}`);
  return item.courses[0];
}
export const ejuRoadmapSources = {
  mathematics:
    'https://www.jasso.go.jp/en/ryugaku/eju/examinee/syllabus/mathematics.html',
  japanese:
    'https://www.jasso.go.jp/en/ryugaku/eju/examinee/syllabus/japanese.html',
  writing: 'https://www.jasso.go.jp/en/ryugaku/eju/about/score/writing.html',
  papers:
    'https://www.jasso.go.jp/en/ryugaku/eju/examinee/pastpaper_sample/pastpaper_2018_1.html',
};
