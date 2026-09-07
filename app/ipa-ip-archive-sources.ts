// Primary references complement the official question and answer PDFs.
const references:Record<string,{title:string;url:string}[]>={
 '2024:10':[{title:'METI · 限定提供データ',url:'https://www.meti.go.jp/policy/economy/chizai/chiteki/data.html'}],
 '2024:27':[{title:'PPC · 個人情報保護法ガイドライン',url:'https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/'}],
 '2024:32':[{title:'MHLW · Labour law glossary',url:'https://laborlaw.mhlw.go.jp/lesson/glossary.html'}],
 '2024:35':[{title:'JPO · 実用新案の登録要件',url:'https://www.jpo.go.jp/system/laws/rule/guideline/patent/tukujitu_kijun/ht/10_0200.html'}],
 '2025:1':[{title:'MHLW · Labour law glossary',url:'https://laborlaw.mhlw.go.jp/lesson/glossary.html'}],
 '2025:6':[{title:'e-Gov · 特定電子メール法 第3条',url:'https://laws.e-gov.go.jp/law/414AC0100000026/20220617_504AC0000000068'}],
 '2025:12':[{title:'JPO · 商標制度',url:'https://www.jpo.go.jp/system/trademark/gaiyo/seidogaiyo/chizai08.html'}],
 '2025:16':[{title:'Japan · Act on Prohibition of Unauthorized Computer Access',url:'https://www.japaneselawtranslation.go.jp/en/laws/view/3933'}],
 '2025:30':[{title:'Japan · Copyright Act, Article 10',url:'https://www.japaneselawtranslation.go.jp/en/laws/view/4207/ja'}],
};
export function ipaIpArchiveSources(packId:string,number:number){
 const year=/^ipa-ip-(2024|2025)-public$/.exec(packId)?.[1];
 return [{title:'IPA · ITパスポート 公開問題・解答',url:'https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/questions.html'},...(references[`${year}:${number}`]??[])];
}
