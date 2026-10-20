import fs from 'fs';
import path from 'path';

const N4_EXAMPLES = {
  vocab_n4_add_3: {
    ja: '毎朝、近所の人に笑顔であいさつします。',
    romaji: 'Maiasa, kinjo no hito ni egao de aisatsu shimasu.',
    uz: "Har kuni ertalab qo'shnilarga tabassum bilan salomlashaman.",
  },
  vocab_n4_add_16: {
    ja: '明日、先生の研究室にお宅へうかがいます。',
    romaji: 'Ashita, sensei no kenkyuushitsu ni ukagaimasu.',
    uz: "Ertaga ustozning ilmiy xonasiga tashrif buyuraman.",
  },
  vocab_n4_add_23: {
    ja: '社長は何時ごろ事務所においでになりますか。',
    romaji: 'Shachou wa nanji goro jimusho ni oide ni narimasu ka.',
    uz: "Prezident soat nechalarda ofisga keladilar?",
  },
  vocab_n4_add_38: {
    ja: 'そんな派手なかっこうで面接に行ってはいけません。',
    romaji: 'Sonna hade na kakkou de mensetsu ni itte wa ikemasen.',
    uz: "Bunday ochiq-sochiq kiyimda suhbatga borish mumkin emas.",
  },
  vocab_n4_add_39: {
    ja: 'どうぞ私のことはかまわないで、お仕事を続けてください。',
    romaji: 'Douzo watashi no koto wa kamawanaide, oshigoto o tsuzukete kudasai.',
    uz: "Menga parvo qilmang, bemalol ishingizni davom ettiring.",
  },
  vocab_n4_add_44: {
    ja: 'サッカーの練習中に転んで足をけがしてしまった。',
    romaji: 'Sakkaa no renshuu chuu ni koronde ashi o kega shite shimatta.',
    uz: "Futbol mashg'ulotida yiqilib oyog'imni jarohatlab oldim.",
  },
  vocab_n4_add_45: {
    ja: 'この店は少し狭いけれど、料理がとても美味しいです。',
    romaji: 'Kono mise wa sukoshi semai keredo, ryouri ga totemo oishii desu.',
    uz: "Bu do'kon biroz tor, ammo taomlari juda mazali.",
  },
  vocab_n4_add_50: {
    ja: 'このあいだ買った本をもう最後まで読み終えました。',
    romaji: 'Kono aida katta hon o mou saigo made yomioemashita.',
    uz: "Yaqinda sotib olgan kitobimni oxirigacha o'qib tugatdim.",
  },
  vocab_n4_add_52: {
    ja: '先生、先ほどお送りした新しい資料をごらんになりましたか。',
    romaji: 'Sensei, sakihodo ookuri shita atarashii shiryou o goran ni narimashita ka.',
    uz: "Ustoz, hozirgina yuborgan yangi materiallarni ko'rib chiqdingizmi?",
  },
  vocab_n4_add_55: {
    ja: '新しいコンピューターを買って動画編集を始めました。',
    romaji: 'Atarashii konpyuutaa o katte douga henshuu o hajimemashita.',
    uz: "Yangi kompyuter sotib olib video montaj qilishni boshladim.",
  },
  vocab_n4_add_61: {
    ja: 'さ来月から日本での留学生活がスタートします。',
    romaji: 'Saraigetsu kara nihon de no ryuugaku seikatsu ga sutaato shimasu.',
    uz: "Keyingi oydan keyingi oydan Yaponiyada talabalik hayotim boshlanadi.",
  },
  vocab_n4_add_62: {
    ja: 'さ来週の金曜日に日本語能力試験の模擬テストがあります。',
    romaji: 'Saraishuu no kinyoubi ni nihongo nouryoku shiken no mogi tesuto ga arimasu.',
    uz: "Keyingi haftadan keyingi juma kuni JLPT sinov testi bo'ladi.",
  },
  vocab_n4_add_63: {
    ja: '宿題を忘れて先生に厳しくしかられました。',
    romaji: 'Shukudai o wasurete sensei ni kibishiku shikararemashita.',
    uz: "Vazifani unutib qo'yganim uchun ustozdan qattiq dakki yedim.",
  },
  vocab_n4_add_73: {
    ja: '薬を飲んで少し休んだら、頭痛がすっと治りました。',
    romaji: 'Kusuri o nonde sukoshi yasundara, zutsuu ga sutto naorimashita.',
    uz: "Dori ichib biroz dam olganimdan so'ng bosh og'rig'i birdan bosildi.",
  },
  vocab_n4_add_87: {
    ja: '休みの日はたいてい図書館で静かに勉強しています。',
    romaji: 'Yasumi no hi wa taitei toshokan de shizuka ni benkyou shite imasu.',
    uz: "Dam olish kunlari odatda kutubxonada tinch o'qiyman.",
  },
  vocab_n4_add_98: {
    ja: '駅前のとこやに行って髪を短く切ってもらった。',
    romaji: 'Ekimae no tokoya ni itte kami o mijikaku kitte moratta.',
    uz: "Vokzal oldidagi sartaroshxonaga borib sochimni qisqa kestirdim.",
  },
  vocab_n4_add_101: {
    ja: 'このスマートウォッチは機能が多いのに、ねだんが手頃です。',
    romaji: 'Kono sumaatowotchi wa kinou ga ooi noni, nedan ga tegoro desu.',
    uz: "Bu aqlli soatning funksiyalari ko'p, narxi esa hamyonbop.",
  },
  vocab_n4_add_102: {
    ja: '学生たちは先生の講義をねっしんにノートに取っています。',
    romaji: 'Gakuseitachi wa sensei no kougi o nesshin ni nooto ni totte imasu.',
    uz: "Talabalar ustozning ma'ruzasini ixlos bilan daftarlariga yozib bormoqdalar.",
  },
  vocab_n4_add_119: {
    ja: 'パスポート、または身分証明書をご提示ください。',
    romaji: 'Pasupooto, matawa mibun shoumeisho o goteiji kudasai.',
    uz: "Pasport yoki shaxsni tasdiqlovchi guvohnomani ko'rsating.",
  },
  vocab_n4_add_125: {
    ja: '難しい問題だったが、やっぱり諦めずに解いてよかった。',
    romaji: 'Muzukashii mondai datta ga, yappari akiramezu ni toite yokatta.',
    uz: "Qiyin masala edi, ammo baribir taslim bo'lmay yechganim yaxshi bo'ldi.",
  },
  vocab_n4_add_128: {
    ja: '今週中に日本文化に関するレポートを提出しなければならない。',
    romaji: 'Konshuuchuu ni nihon bunka ni kansuru repooto o teishutsu shinakereba naranai.',
    uz: "Shu hafta ichida yapon madaniyati haqidagi hisobotni topshirishim shart.",
  },
  vocab_n4_add_158: {
    ja: '週末は家族と一緒に温泉旅行を楽しんだ。',
    romaji: 'Shuumatsu wa kazoku to issho ni onsen ryokou o tanoshinda.',
    uz: "Dam olish kunida oilam bilan birga issiq buloq sayohatidan bahramand bo'ldim.",
  },
  vocab_n4_add_186: {
    ja: 'このパンは焼きたてではなく、少し固くなっている。',
    romaji: 'Kono pan wa yakitate dewa naku, sukoshi kataku natte iru.',
    uz: "Bu non yangi pishirilmagan, biroz qotib qolgan.",
  },
  vocab_n4_add_192: {
    ja: '御主人は週末によく料理を作られるそうですね。',
    romaji: 'Goshujin wa shuumatsu ni yoku ryouri o tsukurareru sou desu ne.',
    uz: "Turmush o'rtog'ingiz dam olish kunlari ko'pincha taom tayyorlar ekanlar-a?",
  },
  vocab_n4_add_245: {
    ja: '駅前の広場に多くの観光客が集まっています。',
    romaji: 'Ekimae no hiroba ni ooku no kankoukyaku ga atsumatte imasu.',
    uz: "Vokzal oldidagi maydonga ko'plab sayyohlar to'planishmoqda.",
  },
  vocab_n4_add_308: {
    ja: '漢字の勉強は中々進まないが、毎日少しずつ覚えている。',
    romaji: 'Kanji no benkyou wa nakanaka susumanai ga, mainichi sukoshizutsu oboete iru.',
    uz: "Kanji o'rganish kutilgandek oson ketmayapti, lekin har kuni oz-ozdan yodlayapman.",
  },
  vocab_n4_add_333: {
    ja: '私たちは静かな住宅街にある二階建ての白い家に住んでいます。',
    romaji: 'Watashitachi wa shizuka na juutakugai ni aru nikaidate no shiroi ie ni sunde imasu.',
    uz: "Biz sokin turar-joy dahasidagi ikki qavatli oq uyda yashaymiz.",
  },
  vocab_n4_add_383: {
    ja: '風が強く吹いて、木から赤や黄色の葉がたくさん落ちた。',
    romaji: 'Kaze ga tsuyoku fuite, ki kara aka ya kiiro no ha ga takusan ochita.',
    uz: "Shamol kuchli esib, daraxtdan ko'plab qizil va sariq barglar to'kildi.",
  },
  vocab_n4_add_388: {
    ja: '週末は妹を連れて人気のテーマパークへ遊びに行きました。',
    romaji: 'Shuumatsu wa imouto o tsurete ninki no teemapaaku e asobi ni ikimashita.',
    uz: "Dam olish kuni singlimni o'zim bilan olib mashhur ko'ngilochar bog'ga bordim.",
  },
};

const n4Path = path.resolve('src/data/vocab/jlptVocabN4.json');
const n4Data = JSON.parse(fs.readFileSync(n4Path, 'utf8'));

let updatedCount = 0;
n4Data.forEach((item) => {
  if (N4_EXAMPLES[item.id]) {
    item.examples = [N4_EXAMPLES[item.id]];
    updatedCount++;
  }
});

fs.writeFileSync(n4Path, JSON.stringify(n4Data, null, 2) + '\n', 'utf8');
console.log(`Successfully populated ${updatedCount} / 29 missing N4 examples!`);
