import { japanesePack } from './eju-japanese.ts';
import { tr, type EjuPack, type EjuQuestion } from '../lib/eju-types.ts';

// Authored scenario data. The tasks assess the stated information, not outside knowledge.
type Scenario = {
  name: string;
  goal: string;
  problem: string;
  action: string;
  exception: string;
  reason: string;
  measure: string;
  wrong: string;
};
const scenarios: Scenario[] = [
  {
    name: '地域資料のデジタル化',
    goal: '古い写真を住民が調べられるようにする',
    problem: '撮影年が分からない写真が多い',
    action: '住民の証言と新聞記事を照合する',
    exception: '人物の公開許可が確認できない写真',
    reason: '一つの記憶だけでは年代を誤ることがある',
    measure: '年代と根拠を確認できた写真の割合',
    wrong: 'すべての写真を直ちに公開する',
  },
  {
    name: '食堂の食品廃棄',
    goal: '食べ残しを減らしながら必要な量を提供する',
    problem: '曜日によって利用者数が変わる',
    action: '曜日別の記録を使って調理量を調整する',
    exception: '予約のある団体向けの食事',
    reason: '一週間の平均だけでは各日の需要を表せない',
    measure: '提供した一食当たりの廃棄量',
    wrong: '毎日同じ量を作る',
  },
  {
    name: '河川の水質調査',
    goal: '上流と下流の水質を比較する',
    problem: '雨の後だけ下流の値が大きく変わる',
    action: '降雨量を記録して同じ条件の日を比較する',
    exception: '機器の故障が確認された日の値',
    reason: '採水条件の違いを地域の違いと取り違えるおそれがある',
    measure: '条件をそろえて測定できた回数',
    wrong: '雨の日の結果だけで地域を評価する',
  },
  {
    name: '駅の案内表示',
    goal: '初めて来た利用者も乗り換えやすくする',
    problem: '色だけでは路線を区別できない人がいる',
    action: '路線名と形の異なる記号も併記する',
    exception: '工事で一時的に閉鎖されている通路',
    reason: '同じ色の見え方を全員に仮定できない',
    measure: '目的の乗り場に迷わず着いた人の割合',
    wrong: '路線の色を濃くするだけにする',
  },
  {
    name: '実習機器の共同利用',
    goal: '限られた装置を多くの研究班が使えるようにする',
    problem: '予約だけして使わない時間が増えている',
    action: '開始前の確認と未使用枠の再公開を行う',
    exception: '長時間の連続測定が必要な実験',
    reason: '予約数が多くても実際の利用が多いとは限らない',
    measure: '利用可能時間に対する実使用時間の割合',
    wrong: '予約された時間をすべて使用済みと数える',
  },
  {
    name: '地域防災訓練',
    goal: '避難方法を住民の生活条件に合わせる',
    problem: '昼間の訓練には夜勤の住民が参加しにくい',
    action: '複数の時間帯で同じ内容の訓練を開く',
    exception: '介助が必要で個別支援を申し込んだ人',
    reason: '参加しないことと防災への関心がないことは同じではない',
    measure: '異なる勤務時間の住民が参加できた割合',
    wrong: '欠席者は関心がないと判断する',
  },
  {
    name: 'オンライン教材',
    goal: '受講者が理解を確認しながら学べるようにする',
    problem: '動画の再生回数と理解度が一致しない',
    action: '短い確認問題と説明し直す課題を加える',
    exception: '通信障害が記録された受講者の履歴',
    reason: '再生しただけでは内容を理解した証拠にならない',
    measure: '初めて見る応用問題を解けた割合',
    wrong: '再生回数だけで成績を決める',
  },
  {
    name: '公共施設の省エネルギー',
    goal: '快適さを保ちつつ電力使用を減らす',
    problem: '来館者数の違いが電力比較に影響する',
    action: '利用人数と気温を記録して比較する',
    exception: '設備交換のため休館した日',
    reason: '使用量の減少が対策の効果とは限らない',
    measure: '同じ条件に換算した一人当たりの使用量',
    wrong: '休館日を含む合計だけで成功とする',
  },
  {
    name: '商店街の歩行環境',
    goal: '買い物をする人が安全に歩けるようにする',
    problem: '荷物の搬入と歩行者の移動が重なる',
    action: '搬入時間を分けて歩行経路を確保する',
    exception: '緊急の修理車両',
    reason: '車をすべて禁止すると店の営業が成り立たない',
    measure: '歩行を妨げる場面の時間帯別の件数',
    wrong: '店への搬入を一切認めない',
  },
];

function choice(
  id: string,
  section: string,
  topic: string,
  group: string,
  prompt: string,
  options: string[],
  correct: number,
  reason: string,
  seed: number,
  extra: Partial<EjuQuestion> = {},
): EjuQuestion {
  // Rotate by item and paper, preserving semantic keys and recorded choice numbers.
  const shift = ((seed % 4) + 4) % 4,
    rotated = [...options.slice(shift), ...options.slice(0, shift)];
  const answer = ((correct - shift + 4) % 4) + 1;
  return {
    id,
    section,
    topic,
    group,
    prompt,
    kind: 'choice',
    options: rotated,
    answers: [String(answer)],
    explanation: tr(
      `Основание в тексте или записи: ${reason}`,
      `Evidence in the passage or recording: ${reason}`,
      `根拠：${reason}`,
    ),
    ...extra,
  };
}

export function japaneseVariant(v: number): EjuPack {
  const questions: EjuQuestion[] = [];
  const addReading = (
    text: string,
    group: string,
    items: [string, string[], number, string, string][],
  ) => {
    for (const [prompt, options, correct, reason, topic] of items) {
      const i = questions.length;
      questions.push(
        choice(
          `jp-v${v}-r${i + 1}`,
          'reading',
          topic,
          group,
          prompt,
          options,
          correct,
          reason,
          v + i,
          { passage: text },
        ),
      );
    }
  };
  // Each paper combines five separate real-world settings, with a different analytical lens.
  for (let j = 0; j < 5; j++) {
    const s = scenarios[(v - 2 + j * 2) % scenarios.length];
    if (j === 0) {
      const text = `大学と地域の共同研究で「${s.name}」を扱うことになった。目標は、${s.goal}ことである。しかし、予備調査では${s.problem}ことが分かった。そこで担当者は、${s.action}方針を示した。${s.reason}からである。ただし、${s.exception}については通常の集計から外し、別の記録として残す。これは不都合な結果を隠すためではなく、通常の条件と混ぜて比較しないためである。班員には、記録の数だけでなく、どのような条件で得た情報かを説明するよう求めている。今後は${s.measure}を確認し、必要なら方法を改める。`;
      addReading(text, `読解 · ${s.name}`, [
        [
          'この研究の目的は何か。',
          [s.goal, s.wrong, '記録の数だけを最大にする', '予備調査を省略する'],
          0,
          `目標として「${s.goal}」と明示されている。`,
          'jp-details',
        ],
        [
          '担当者が示した方針はどれか。',
          [
            s.wrong,
            'すべての記録を捨てる',
            s.action,
            '参加者の記憶だけで結論を出す',
          ],
          2,
          `「そこで」の後に${s.action}とある。`,
          'jp-details',
        ],
        [
          '「通常の集計から外し」とあるが、その対象は何か。',
          ['全班員の記録', '予備調査の全結果', s.measure, s.exception],
          3,
          `「ただし」以下の例外は${s.exception}。`,
          'jp-relations',
        ],
        [
          '例外を別に記録するのはなぜか。',
          [
            '結果を良く見せるため',
            '異なる条件を混ぜないため',
            '調査人数を減らすため',
            '今後一切調べないため',
          ],
          1,
          '異なる条件と混ぜて比較しないためだと説明されている。',
          'jp-inference',
        ],
        [
          '本文の考えに最も合うものはどれか。',
          [
            '情報は多ければ条件を確認しなくてよい',
            '例外の記録は不要だ',
            '情報が得られた条件を確かめて評価する',
            '最初の方法は変更してはならない',
          ],
          2,
          '記録の条件を説明し、必要なら方法を改めるという結論。',
          'jp-main',
        ],
      ]);
    } else if (j === 1) {
      const text = `「${s.name}」の改善案について、二つの班が話し合った。甲班は${s.wrong}案を出した。実施の手順が単純で、集計にも時間がかからないという利点がある。一方、乙班は${s.action}べきだと考えた。現在は${s.problem}ため、単純な方法では実態をつかめないという。乙班の説明を聞いた甲班は、作業が増える点を心配した。そこで、まず一部の対象で乙班の方法を試し、記録に必要な時間も測ることで合意した。試行後は、${s.measure}と作業時間の両方を確かめる。担当教員は、使いやすい方法であることと、知りたいことが分かる方法であることは必ずしも一致しないと述べた。`;
      addReading(text, `読解 · ${s.name}`, [
        [
          '甲班の案の利点として挙げられたものはどれか。',
          [
            '例外をすべて説明できる',
            '手順が単純で集計が速い',
            '作業時間が全く要らない',
            'すべての対象の条件が等しい',
          ],
          1,
          '甲班は手順の単純さと集計時間の短さを利点としている。',
          'jp-details',
        ],
        [
          '乙班が甲班の案に問題を感じた理由は何か。',
          [
            s.problem,
            '甲班の人数が少ない',
            '教員が結論を指定した',
            '試行が既に失敗した',
          ],
          0,
          `${s.problem}ため、実態を捉えにくいと説明した。`,
          'jp-inference',
        ],
        [
          '話し合いの結果、何をすることになったか。',
          [
            '甲班の案を全体に導入する',
            '調査を中止する',
            '乙班の方法を一部で試す',
            '多数決だけで決める',
          ],
          2,
          '一部の対象で乙班の方法を試すことで合意した。',
          'jp-details',
        ],
        [
          '「両方」とは何と何か。',
          [
            '班員数と教員数',
            `${s.measure}と作業時間`,
            '以前の記録と新聞記事',
            '予算と参加者の年齢',
          ],
          1,
          `直前の${s.measure}と作業時間を指す。`,
          'jp-relations',
        ],
        [
          '担当教員の発言の意味は何か。',
          [
            '速くできる方法が常に正確だ',
            '複雑な方法はすべて不要だ',
            '使いやすさだけでは調査方法を評価できない',
            '使いやすさを考える必要はない',
          ],
          2,
          '使いやすさと目的への適合は別の評価軸である。',
          'jp-main',
        ],
      ]);
    } else if (j === 2) {
      const low = 20 + v * 3,
        high = low + 15 + j;
      const text = `${s.name}の報告会で、活動への参加者が前月の${low}人から${high}人に増えたという発表があった。ある学生は、人数の増加を見て活動は成功したと考えた。しかし、研究の本来の目的は${s.goal}ことである。人数が増えただけでは、この目的が達成されたかどうかは分からない。例えば、${s.problem}状況が変わっていなければ、活動の方法を見直す必要がある。担当者は、参加者数に加えて${s.measure}を調べるよう提案した。参加者数は活動への関心を知る手掛かりにはなるが、改善の程度そのものを示すとは限らない。複数の指標を用いるのは数字を増やすためではなく、判断したい内容と測っている内容を対応させるためだ。`;
      addReading(text, `読解 · ${s.name}`, [
        [
          '参加者は前月より何人増えたか。',
          [`${high}人`, `${low}人`, `${high - low}人`, `${high + low}人`],
          2,
          `${high}−${low}=${high - low}人。総数と増加数を区別する。`,
          'jp-details',
        ],
        [
          '人数の増加だけで成功とは言えないのはなぜか。',
          [
            '人数が減っているから',
            '目的の達成を直接示すとは限らないから',
            '人数を数えられないから',
            '関心を知る意味がないから',
          ],
          1,
          '活動の目的と参加者数が測る内容は同じではない。',
          'jp-inference',
        ],
        [
          '追加で調べるよう提案されたものは何か。',
          [s.measure, '教室の壁の色', '参加者の名前の長さ', '発表の回数だけ'],
          0,
          `担当者は${s.measure}を提案した。`,
          'jp-details',
        ],
        [
          '「この目的」とは何か。',
          [
            '参加者を必ず倍にすること',
            '報告書を長くすること',
            '発表会を毎月開くこと',
            s.goal,
          ],
          3,
          `前の文の${s.goal}ことを指す。`,
          'jp-relations',
        ],
        [
          '本文の主張に最も近いものはどれか。',
          [
            '数字は判断に使えない',
            '一つの数字だけで常に十分だ',
            '指標を判断の目的に対応させる',
            '人数が多ければ方法を変えなくてよい',
          ],
          2,
          '測っている内容と判断したい内容を対応させるという結論。',
          'jp-main',
        ],
      ]);
    } else if (j === 3) {
      const text = `${s.name}の担当者は、記録方法を変更する前に利用者の意見を集めた。回答の多くは、従来の方法を続けてほしいというものだった。新しい方法を覚える負担があるからだ。しかし、${s.problem}という問題は残っている。担当者は、反対意見を単に変化を嫌う声として片付けず、どの作業が負担なのかを確かめた。その結果、説明書が専門用語ばかりで、最初の操作が分かりにくいことが明らかになった。そこで${s.action}という方針自体は維持し、説明書に具体例を加え、練習の時間を設けた。変更後、担当者は利用状況を再び調べる予定である。意見を尊重することは、すべての要望をそのまま採用することではなく、要望の背景を理解して改善につなげることだという。`;
      addReading(text, `読解 · ${s.name}`, [
        [
          '従来の方法を望む回答が多かった理由は何か。',
          [
            '新しい方法を覚える負担',
            '記録が不要になったため',
            '具体例が多すぎるため',
            '利用者が全員専門家だから',
          ],
          0,
          '冒頭で新しい方法を覚える負担が理由とされる。',
          'jp-details',
        ],
        [
          '調査で分かった具体的な問題は何か。',
          [
            '説明書が短すぎる',
            '専門用語が多く操作が分かりにくい',
            '練習時間が長すぎる',
            '記録用紙が存在しない',
          ],
          1,
          '説明書の専門用語と最初の操作の分かりにくさが問題。',
          'jp-details',
        ],
        [
          '担当者は方針をどうしたか。',
          [
            'すべて取り消した',
            '利用者の意見を聞かず実施した',
            '維持しながら支援方法を変えた',
            '全員の同意まで永遠に延期した',
          ],
          2,
          '方針は維持し、説明書の具体例と練習時間を加えた。',
          'jp-inference',
        ],
        [
          '「そのまま採用する」とは何を採用することか。',
          ['調査の数字', '専門用語', '従来の説明書', '利用者のすべての要望'],
          3,
          '直前のすべての要望を指す。',
          'jp-relations',
        ],
        [
          '筆者が述べる意見の尊重とは何か。',
          [
            '多数意見だけに従うこと',
            '要望の背景を理解して改善すること',
            '反対意見を排除すること',
            '変更を一切しないこと',
          ],
          1,
          '末尾に背景を理解して改善につなげるとある。',
          'jp-main',
        ],
      ]);
    } else {
      const text = `${s.name}では、当初${s.wrong}案が検討されていた。しかし、目的である${s.goal}ためには、対象の違いに目を向ける必要がある。${s.reason}からだ。新しい計画では${s.action}ことにした。ただし、${s.exception}は別に扱う。この例外を認めると規則が曖昧になるという意見もあるが、担当者は、例外の条件を明記し、判断の理由を記録すれば、かえって説明しやすくなると考えている。例外を誰にでも無条件に広げるわけではない。運用を始めた後は、${s.measure}を確認する。規則を作ることは出発点であり、実際に何が起きたかを調べ、目的に照らして修正するところまでが計画に含まれる。`;
      addReading(text, `読解 · ${s.name}`, [
        [
          '当初検討された案はどれか。',
          [s.action, s.wrong, s.exception, s.measure],
          1,
          `冒頭に${s.wrong}案とある。`,
          'jp-details',
        ],
        [
          '新しい計画で例外となるものは何か。',
          [s.exception, 'すべての対象', '担当者の好みだけ', '理由のない申請'],
          0,
          `「ただし」以下で${s.exception}を別扱いにする。`,
          'jp-details',
        ],
        [
          '担当者が例外を説明しやすくする方法は何か。',
          [
            '理由を記録しない',
            '条件を明記せず判断する',
            '条件と判断理由を明示する',
            '例外を無条件に広げる',
          ],
          2,
          '条件を明記し判断理由を記録するとある。',
          'jp-inference',
        ],
        [
          '「出発点」とあるが、その後に必要なのは何か。',
          [
            '規則を永久に固定すること',
            '調査を終了すること',
            '目的を忘れること',
            '運用結果を確認し修正すること',
          ],
          3,
          '実際に何が起きたかを調べ、目的に照らして修正する。',
          'jp-relations',
        ],
        [
          '本文全体に最も合う題はどれか。',
          [
            '例外を一切認めない制度',
            '目的に合わせて見直す規則',
            '人数だけで測る成功',
            '説明を省く効率化',
          ],
          1,
          '目的・例外条件・運用後の検証を一貫して論じている。',
          'jp-main',
        ],
      ]);
    }
  }
  // Integrated listening: distinct timetable, eligibility and data-comparison tasks.
  for (let i = 0; i < 15; i++) {
    const s = scenarios[(v + i) % 9],
      id = `jp-v${v}-i${i + 1}`,
      n = 8 + v + i;
    let options: string[],
      script: string,
      reason: string,
      visual: EjuQuestion['visual'],
      correct: number;
    if (i % 3 === 0) {
      const start = 9 + (i % 4),
        rooms = [
          `${100 + v + i}室`,
          `${200 + v + i}室`,
          `${300 + v + i}室`,
          `${400 + v + i}室`,
        ];
      options = rooms;
      correct = (v + i) % 4;
      visual = {
        headings: ['部屋', '開始', '設備'],
        rows: rooms.map((r, k) => [
          r,
          `${start + k}:00`,
          k === correct ? '録音可' : '録音不可',
        ]),
      };
      script = `学生が「${s.name}」の発表練習の部屋を選んでいます。学生は言います。「発表を録音して聞き直したいです。開始時刻は表のどれでも大丈夫です。録音が認められている部屋を予約します。」表を見てください。学生が予約するのはどの部屋ですか。`;
      reason = `録音可なのは${rooms[correct]}だけ。時刻は選択条件ではない。`;
    } else if (i % 3 === 1) {
      options = ['計画Ａ', '計画Ｂ', '計画Ｃ', '計画Ｄ'];
      correct = (v + i + 1) % 4;
      visual = {
        headings: ['計画', '費用（円）', '所要時間（分）'],
        rows: options.map((r, k) => [
          r,
          String(
            k === correct ? n * 100 : k % 2 ? n * 100 + 500 : n * 100 - 100,
          ),
          String(k === correct ? 30 : k % 2 ? 20 : 90),
        ]),
      };
      script = `「${s.name}」の調査計画について相談しています。先生は言います。「予算は${n * 100}円以下です。準備も含めて60分以内で終わる計画を選んでください。安くても時間を超えるものは選べません。」表の計画のうち、二つの条件を満たすものはどれですか。`;
      reason = `${options[correct]}だけが予算${n * 100}円以下かつ60分以内。条件を両方確認する。`;
    } else {
      options = ['班Ａ', '班Ｂ', '班Ｃ', '班Ｄ'];
      correct = (v + i + 2) % 4;
      const attended = [n, n + 3, n + 6, n + 9],
        success = attended.map((x, k) => (k === correct ? x : x - 2));
      visual = {
        headings: ['班', '試行数', '成功数'],
        rows: options.map((r, k) => [
          r,
          String(attended[k]),
          String(success[k]),
        ]),
      };
      script = `「${s.name}」の試行結果です。担当者は言います。「成功した回数だけでなく、試行数に対する成功数の割合を比べます。最も成功率の高い班に方法を紹介してもらいましょう。」表を見て、どの班が紹介するか答えてください。`;
      reason = `${options[correct]}は成功数と試行数が同じで成功率100%。他の班には失敗が2回ある。`;
    }
    const q = choice(
      id,
      'listening',
      'jp-integrated',
      '聴読解',
      '表と音声の条件に合うものを選びなさい。',
      options,
      correct,
      reason,
      v + i,
      { visual },
    );
    q.audioText = `${script}${q.options!.map((x, k) => `${k + 1}番。${x}。`).join('')}`;
    q.audio = `eju/audio/${id}.mp3`;
    questions.push(q);
  }
  for (let i = 0; i < 12; i++) {
    const s = scenarios[(v + i * 2) % 9],
      id = `jp-v${v}-l${i + 1}`;
    const scripts = [
      [
        `学生と教員が${s.name}について話しています。学生「まず、${s.wrong}のはどうでしょう。」教員「それでは${s.problem}という問題が残ります。最初に${s.action}ことから始めてください。結果を確認してから報告書を書きましょう。」学生は最初に何をしますか。`,
        [s.wrong, s.action, 'すぐ報告書を書く', '調査を中止する'],
        1,
        `最初に${s.action}と指示された。`,
      ],
      [
        `${s.name}についての短い講義です。「${s.goal}ために、${s.action}ことを提案します。ただし、${s.exception}は通常の扱いに含めません。別に記録して条件の違いを残してください。」通常と別に扱うものは何ですか。`,
        ['すべての記録', s.measure, s.exception, '教員の全発言'],
        2,
        `ただし以下に${s.exception}という例外がある。`,
      ],
      [
        `調査の結果について話しています。「${s.name}では、集めた記録が先月より増えました。しかし、それだけで改善したとは言えません。${s.reason}からです。次は${s.measure}を確認してください。」次に確認するものは何ですか。`,
        [s.measure, '記録の用紙の色', '学生の名前の数だけ', s.wrong],
        0,
        `次は${s.measure}を確認するよう指示した。`,
      ],
      [
        `学生の発表への助言です。「${s.name}の結論として${s.wrong}と書いてありますね。ただ、あなた自身の調査では${s.problem}と分かっています。この違いを説明せずに結論を出すのは早いです。条件をもう一度確かめてから結論を書き直しましょう。」教員が最も求めていることは何ですか。`,
        [
          '文字数だけを増やす',
          '調査結果を隠す',
          '元の結論を変えない',
          '条件を検討して結論を修正する',
        ],
        3,
        '結果と結論の関係を再検討して書き直すよう求めている。',
      ],
    ] as const;
    const [baseScript, baseOptions, baseCorrect, baseReason] =
      scripts[(i + v) % 4];
    const day = v + i + 3;
    const script =
      i % 3 === 1
        ? `学生と担当者が${s.name}の報告について話しています。学生「今月${day + 2}日が最終提出日ですよね。」担当者「はい。ただし、私は${day + 1}日から出張です。提出前に助言が必要なら、${day}日までに原稿を送ってください。」学生「助言を受けてから提出したいので、その日までに送ります。」学生は担当者に何日までに原稿を送りますか。`
        : baseScript;
    const options =
      i % 3 === 1
        ? [`${day - 1}日`, `${day}日`, `${day + 1}日`, `${day + 2}日`]
        : baseOptions;
    const correct = i % 3 === 1 ? 1 : baseCorrect;
    const reason =
      i % 3 === 1
        ? `最終提出日は${day + 2}日だが、事前に助言を受ける原稿の締切は${day}日。目的に対応した期限を選ぶ。`
        : baseReason;
    const q = choice(
      id,
      'listening',
      'jp-listening',
      '聴解',
      '音声を聞いて答えなさい。',
      [...options],
      correct,
      reason,
      v + i,
    );
    q.audioText = `${script}${q.options!.map((x, k) => `${k + 1}番。${x}。`).join('')}`;
    q.audio = `eju/audio/${id}.mp3`;
    questions.push(q);
  }
  const s = scenarios[v - 2],
    s2 = scenarios[(v + 2) % 9];
  const model = (x: Scenario) =>
    `私は、${x.name}について、${x.action}方法が適切だと考える。目標は${x.goal}ことであり、作業の簡単さだけで方法を選ぶべきではないからだ。現在は${x.problem}という課題がある。例えば、条件の違う対象を同じものとして集計すると、数字は簡潔になっても、必要な改善が見えなくなる。\nもちろん、新しい方法を導入すれば、記録や説明の負担が増える可能性がある。そのため、最初から全体を変えるのではなく、一部で試し、担当者と利用者の双方から意見を集めるとよい。特に${x.exception}については、通常の場合とは分けて扱う基準を先に示す必要がある。\nまた、結果を確認するときは、${x.measure}に加え、作業時間や利用者の困り事も調べたい。一つの数値が良くなっただけで成功と決めると、別の問題を見落とすおそれがある。異なる立場の意見を理由とともに記録し、当初の目的に照らして見直すことが大切だ。このように、目的を共有し、試行と検証を繰り返すことで、現実に合った改善を続けられる。`;
  return {
    ...japanesePack,
    id: `eju-japanese-kiso-${String(v).padStart(2, '0')}`,
    title: tr(
      `Авторский вариант Kiso · ${v}`,
      `Kiso original paper · ${v}`,
      `Kiso独自問題・${v}`,
    ),
    questions,
    writing: {
      ...japanesePack.writing!,
      prompts: [s, s2].map(
        (x) =>
          `「${x.name}」では、${x.problem}という課題があります。${x.goal}ためにどのような方法がよいと思いますか。方法の利点と問題点に触れ、理由と具体例を示して400字以上500字以内で書いてください。`,
      ),
      models: [model(s), model(s2)],
    },
  };
}
