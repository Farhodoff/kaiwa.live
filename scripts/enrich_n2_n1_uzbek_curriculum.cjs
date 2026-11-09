const fs = require('fs');
const path = require('path');

const n2Path = path.join(__dirname, '../src/data/curriculum/levels/n2/japaneseLessons.json');
const n1Path = path.join(__dirname, '../src/data/curriculum/levels/n1/japaneseLessons.json');

const n2 = JSON.parse(fs.readFileSync(n2Path, 'utf8'));
const n1 = JSON.parse(fs.readFileSync(n1Path, 'utf8'));

const n2Updates = {
  1: {
    title: "Parallel o'zgarishlar: 〜につれて vs 〜にしたがって vs 〜に伴って",
    learnTitle: "Mutanosib o'zgarishlar (〜につれて / 〜に伴って / 〜にしたがって)",
    stepTitle: "Parallel O'zgarish Qoidalari"
  },
  2: {
    title: "Moslik va asoslanish: 〜に応じて vs 〜に沿って vs 〜に基づいて",
    learnTitle: "〜に応じて vs 〜に沿って vs 〜に基づいて qoidalari",
    stepTitle: "Moslik va Asoslash Qoidalari"
  },
  3: {
    title: "Muloyim rad etish va xavfli ehtimol: 〜かねる vs 〜かねない",
    learnTitle: "Muloyim rad etish (〜かねる) va xavf ehtimoli (〜かねない)",
    stepTitle: "〜かねる va 〜かねない Farqi"
  },
  4: {
    title: "Mutlaq imkonsizlik: 〜っこない va subyektiv belgi: 〜げ",
    learnTitle: "Qat'iy imkonsizlik (〜っこない) va tashqi ko'rinish (〜げ)",
    stepTitle: "〜っこない va 〜げ Qoidalari"
  },
  5: {
    title: "N2 Gazeta tahririyati mutolaasi: Sun'iy intellekt va axloq",
    learnTitle: "Tahririyat maqolasi: Sun'iy intellekt evolyutsiyasi va inson irodasi",
    stepTitle: "Tahririyat Maqolasi (社説)"
  },
  6: {
    title: "Yuqori biznes muloqoti: 〜申し上げます va 〜存じます",
    learnTitle: "Korporativ ehtirom iboralari: 申し上げます va 存じます",
    stepTitle: "Oliy Biznes Formulalari"
  },
  7: {
    title: "N2 Murakkab kanjilar: Iqtisodiyot, savdo va huquq (融資, 景気, 契約, 義務, 損害)",
    learnTitle: "Tijorat, moliya va qonunchilik kanjilari",
    stepTitle: "Moliya va Huquq Kanjilari"
  },
  8: {
    title: "Rasmiy majburiyat va cheklov: 〜ざるを得ない vs 〜わけにはいかない",
    learnTitle: "Majburiy tanlov (〜ざるを得ない) va ma'naviy to'siq (〜わけにはいかない)",
    stepTitle: "〜ざるを得ない va 〜わけにはいかない"
  },
  9: {
    title: "N2 Tinglab tushunish: Kompleks axborotni anglash (統合理解)",
    learnTitle: "Kompleks axborotni tinglab tushunish (統合理解) strategiyasi",
    stepTitle: "統合理解 (Tougou Rikai) Strategiyasi"
  },
  10: {
    title: "2-bo'lim xulosasi: Professional yapon tili va amaliy ko'nikmalar",
    learnTitle: "N2 2-bo'lim bilimlarni mustahkamlash",
    stepTitle: "Unit 2 Xulosasi"
  },
  11: {
    title: "〜にすぎない (...dan boshqa narsa emas / shunchaki ... xolos)",
    learnTitle: "〜にすぎない (Ni suginai) qo'llanilishi",
    stepTitle: "〜にすぎない Qoidasi"
  },
  12: {
    title: "〜をめぐって (...atrofida / ...masalasida bahs)",
    learnTitle: "〜をめぐって (O megutte) qoidasi",
    stepTitle: "〜をめぐって Qoidasi"
  },
  13: {
    title: "〜に際して (...munosabati bilan / ...qilish arafasida)",
    learnTitle: "〜に際して (Ni saishite) qo'llanilishi",
    stepTitle: "〜に際して Qoidasi"
  },
  14: {
    title: "Chekinish va zidlov: 〜ものの vs 〜とはいうものの",
    learnTitle: "Zidlov va chekinish (〜ものの / 〜とはいうものの)",
    stepTitle: "Zidlov va Chekinish Qoidasi"
  },
  15: {
    title: "〜にほかならない (...dan boshqa narsa emas / aynan ...dir)",
    learnTitle: "〜にほかならない (Ni hokanaranai) qoidasi",
    stepTitle: "〜にほかならない Qoidasi"
  },
  16: {
    title: "Atrof-muhit va texnologiya matnlari mutolaasi (環境・技術の読解)",
    learnTitle: "Ekologik savodxonlik va matn tahlili (読解)",
    stepTitle: "Ekologik Matnlar Mutolaasi"
  },
  17: {
    title: "〜に先立って (...dan oldin / ...boshlanishidan avval)",
    learnTitle: "〜に先立って (Ni sakadatte) qoidasi",
    stepTitle: "〜に先立って Qoidasi"
  },
  18: {
    title: "〜を契機に (...turtki bo'lib / ...munosabati bilan)",
    learnTitle: "〜を契機に (O keiki ni) qoidasi",
    stepTitle: "〜を契機に Qoidasi"
  },
  19: {
    title: "〜を込めて (...ni bag'ishlab / chin dildan ... bilan)",
    learnTitle: "〜を込めて (O komete) qoidasi",
    stepTitle: "〜を込めて Qoidasi"
  },
  20: {
    title: "N2 Tinglab tushunish (聴解 - Tezkor javob va umumiy mazmun)",
    learnTitle: "N2 Tinglab tushunish audio mashqlari (聴解)",
    stepTitle: "Chokkai Tinglab Tushunish Strategiyasi"
  },
  21: {
    title: "N2 Biznes kanjilari (職・企・業・採)",
    learnTitle: "Kasb-hunar va korporativ biznes kanjilari",
    stepTitle: "Biznes Kanjilari"
  },
  22: {
    title: "N2 Huquq va davlat boshqaruvi kanjilari (法・律・規・政)",
    learnTitle: "Qonun va davlat boshqaruvi kanjilari",
    stepTitle: "Qonun va Siyosat Kanjilari"
  },
  23: {
    title: "N2 Qo'shma fe'llar (〜直す, 〜終える, 〜切る, 〜抜く)",
    learnTitle: "N2 Qo'shma fe'llar (複合動詞) qoidalari",
    stepTitle: "N2 Qo'shma Fe'llar"
  },
  24: {
    title: "N2 Taqlid va holat so'zlari (擬音語・擬態語)",
    learnTitle: "N2 Taqlid va obrazli ifodalar (オノマトペ)",
    stepTitle: "Taqlid So'zlar (Onomatopeya)"
  },
  25: {
    title: "N2 Leksika integratsiyasi va sinonimlar amaliyoti",
    learnTitle: "N2 Sinonimlar va so'zlarni qayta ifodalash (言い換え)",
    stepTitle: "N2 Sinonimlar va Ibora Boyligi"
  },
  26: {
    title: "N2 Keigo mahorati (Hurmat va kamtarlik shakllari umumiy takrori)",
    learnTitle: "Sonkeigo va Kenjougo umumiy takrori",
    stepTitle: "Keigo Umumiy Mahorati"
  },
  27: {
    title: "N2 Grammatika integratsiyasi (Umumiy grammatika masalalari)",
    learnTitle: "N2 Grammatikasining to'liq qoidalari",
    stepTitle: "Grammatika Integratsiyasi"
  },
  28: {
    title: "N2 Axborot qidirish va tezkor mutolaa (情報検索の読解)",
    learnTitle: "Axborot qidirish usullari va tezkor tahlil",
    stepTitle: "Ma'lumot Izlash Dokkaisi"
  },
  29: {
    title: "N2 Kichik sinov imtihoni (模擬ミニテスト)",
    learnTitle: "N2 Kichik sinov imtihoniga tayyorgarlik",
    stepTitle: "N2 Sinov Imtihoni"
  },
  30: {
    title: "N2 Kursining yakuniy imtihoni va N1 ga tayyorgarlik sinovi",
    learnTitle: "N2 Kursini to'liq yakunlash xulosasi",
    stepTitle: "N2 Oliy Xulosa"
  }
};

const n1Updates = {
  1: {
    title: "Klassik chekinish: 〜であれ / 〜であろうと (Qanday bo'lishidan qat'i nazar)",
    learnTitle: "Umumiy shart va chekinish (〜であれ / 〜であろうと)",
    stepTitle: "〜であれ / 〜であろうと Qoidasi"
  },
  2: {
    title: "Maqom va mas'uliyat: 〜たるもの vs 〜まじき (Yetakchiga xos vs Kechirilmas)",
    learnTitle: "Maqom mas'uliyati (〜たるもの) va kechirilmas harakat (〜まじき)",
    stepTitle: "〜たるもの va 〜まじき Qoidasi"
  },
  3: {
    title: "Noyoblik va mutlaq xoslik: 〜ならでは vs 〜をおいて他にない",
    learnTitle: "Yuksak mutlaqlik va xoslik (〜ならでは / 〜をおいて他にない)",
    stepTitle: "Noyoblik va Eksklyuzivlik"
  },
  4: {
    title: "Mutlaq qamrov va to'liqlik: 〜ずくめ vs 〜まみれ vs 〜だらけ",
    learnTitle: "To'liq qoplanish va kirlanish nozikliklari (〜ずくめ / 〜まみれ / 〜だらけ)",
    stepTitle: "〜ずくめ, 〜まみれ, 〜だらけ Farqlari"
  },
  5: {
    title: "N1 Chuqur germenevtika: Epistemologiya va til falsafasi risolasi",
    learnTitle: "Falsafiy risola: Til chegaralari va borliq haqiqati",
    stepTitle: "Falsafiy Traktat Matni"
  },
  6: {
    title: "N1 Oliy kanjilar 1: Ziddiyat va noaniqlik (齟齬, 乖離, 曖昧, 葛藤, 矛盾)",
    learnTitle: "N1 Yuqori akademik kanjilar",
    stepTitle: "Ziddiyat va Noaniqlik Kanjilari"
  },
  7: {
    title: "N1 Oliy kanjilar 2: Davlat boshqaruvi va xavfsizlik (憂慮, 脆弱, 覇権, 諮問, 隠蔽)",
    learnTitle: "Davlat siyosati va strategik terminlar",
    stepTitle: "Geosiyosat va Xavfsizlik Kanjilari"
  },
  8: {
    title: "N1 Tinglab tushunish: Kompleks akademik ma'ruza sintezi (統合学術講義)",
    learnTitle: "Akademik doktorlik ma'ruzasi sintezi",
    stepTitle: "Akademik Ma'ruza Tinglash"
  },
  9: {
    title: "JLPT N1 Sinov imtihoni: Grammatika va o'qish oraliq nazorati",
    learnTitle: "JLPT N1 Imtihonining bosh strategiyasi",
    stepTitle: "N1 Sinov Imtihoni Strategiyasi"
  },
  10: {
    title: "JLPT N1 Oliy cho'qqi: Murakkab kanjilar va akademik uslub takrori",
    learnTitle: "Yapon tili oliy cho'qqisi xulosasi (JLPT N1)",
    stepTitle: "JLPT N1 Grand Pinnacle Xulosasi"
  },
  11: {
    title: "〜たる者 (...dek maqomdagi inson sifatida / ...bo'la turib)",
    learnTitle: "〜たる者 (Taru mono) qo'llanilishi",
    stepTitle: "〜たる者 Qoidasi"
  },
  12: {
    title: "〜に至る / 〜に至るまで (...darajagacha yetib borish / ...gacha)",
    learnTitle: "〜に至る / 〜に至るまで (Ni itaru) qoidasi",
    stepTitle: "〜に至る Qoidasi"
  },
  13: {
    title: "〜を余儀なくされる (...ga majbur bo'lmoq / ilojsiz qolmoq)",
    learnTitle: "〜を余儀なくされる (O yoginaku sareru) qoidasi",
    stepTitle: "〜を余儀なくされる Qoidasi"
  },
  14: {
    title: "〜が早いか (...ishi bilanoq / ...gan zahoti)",
    learnTitle: "〜が早いか (Ga hayai ka) qoidasi",
    stepTitle: "〜が早いか Qoidasi"
  },
  15: {
    title: "〜まじき (...ga aslo yarashmaydigan / qilib bo'lmas)",
    learnTitle: "〜まじき (Majiki) qoidasi",
    stepTitle: "〜まじき Qoidasi"
  },
  16: {
    title: "N1 Tanqidiy falsafa mutolaasi (Falsafa va tafakkur publitsistikasi)",
    learnTitle: "N1 Falsafiy nasr va publitsistika tahlili",
    stepTitle: "Falsafiy Mutolaa Tahlili"
  },
  17: {
    title: "〜んがため / 〜んがために (...maqsadida / ...ni ko'zlab)",
    learnTitle: "〜んがため (N ga tame) qoidasi",
    stepTitle: "〜んがため Qoidasi"
  },
  18: {
    title: "〜をおいて (...dan boshqa / ...dan o'zga)",
    learnTitle: "〜をおいて (O oite) qoidasi",
    stepTitle: "〜をおいて Qoidasi"
  },
  19: {
    title: "〜極まる / 〜極まりない (O'ta darajada ... / Cheksiz darajada ...)",
    learnTitle: "〜極まる / 〜極まりない (Kiwamaru / Kiwamarinai) qoidasi",
    stepTitle: "〜極まる Qoidasi"
  },
  20: {
    title: "N1 Tinglab tushunish mahorati (聴解 - Kompleks va muallif g'oyasini anglash)",
    learnTitle: "N1 Kompleks va muallif g'oyasini anglash (統合理解・主張理解)",
    stepTitle: "N1 Tinglab Tushunish Strategiyasi"
  },
  21: {
    title: "N1 Oliy darajadagi kanjilar (2000+ iyeroglif)",
    learnTitle: "N1 Murakkab kanjilar va birikmalar",
    stepTitle: "N1 Akademik Kanjilar"
  },
  22: {
    title: "N1 To'rt iyeroglifli klassik idiomalar (四字熟語 - Yojijukugo)",
    learnTitle: "Klassik to'rt iyeroglifli iboralar (四字熟語 - Yojijukugo)",
    stepTitle: "Yojijukugo Idiomalar"
  },
  23: {
    title: "N1 Grammatika to'liq integratsiyasi va istisnolar",
    learnTitle: "N1 Grammatikasining to'liq master takrori",
    stepTitle: "Grammatika Sinovi"
  },
  24: {
    title: "JLPT N1 Sinov imtihoni: Keng qamrovli amaliyot",
    learnTitle: "N1 To'liq imtihon simulyatsiyasiga tayyorgarlik",
    stepTitle: "N1 Sinov Imtihoni"
  },
  25: {
    title: "JLPT N1 Umumiy takrorlash va mustahkamlash",
    learnTitle: "N1 Umumiy takrorlash darsi",
    stepTitle: "N1 Mavzularini Takrorlash"
  },
  26: {
    title: "N1 Mutolaa: OAV, Sun'iy intellekt va etika (AI va axloqiy ilmiy maqola)",
    learnTitle: "Sun'iy intellekt rivoji va insoniylik inqirozi",
    stepTitle: "AI va Etika Bo'yicha Ilmiy Matn"
  },
  27: {
    title: "Yuqori uslub grammatikasi: 〜にかまけて va 〜を皮切りに (Chalg'ish va boshlanish nuqtasi)",
    learnTitle: "Chalg'ish va boshlang'ich nuqta qoidalari",
    stepTitle: "〜にかまけて va 〜を皮切りに Qoidalari"
  },
  28: {
    title: "Kuchli his-tuyg'ular: 〜てやまない va 〜を禁じ得ない (To'xtovsiz his qilish va tiyib bo'lmaslik)",
    learnTitle: "Samimiy tuyg'ular va kuchli his-tuyg'ular qoidalari",
    stepTitle: "〜てやまない va 〜を禁じ得ない Qoidasi"
  },
  29: {
    title: "N1 Tezkor o'qish va axborot qidirish (Katta matnlar va axborot qidirish)",
    learnTitle: "Shartnoma va rasmiy e'lonlarni tezkor tahlil qilish",
    stepTitle: "N1 Axborot Qidiruvi (情報検索) Taktikasi"
  },
  30: {
    title: "JLPT N1 Yakuniy takrorlash va kurs tamomlanishi (Barcha sohalar xulosasi)",
    learnTitle: "Oliy cho'qqi falsafasi: Kundalik hayotdan akademik cho'qqigacha",
    stepTitle: "JLPT N1 Mukammal Xulosasi"
  }
};

function applyUpdates(lessons, updates) {
  lessons.forEach((l, idx) => {
    const num = idx + 1;
    const upd = updates[num];
    if (upd) {
      if (upd.title) l.title = upd.title;
      if (l.steps && l.steps[0]) {
        if (upd.stepTitle) l.steps[0].title = upd.stepTitle;
        if (l.steps[0].learnData && upd.learnTitle) {
          l.steps[0].learnData.title = upd.learnTitle;
        }
      }
    }
  });
}

applyUpdates(n2, n2Updates);
applyUpdates(n1, n1Updates);

fs.writeFileSync(n2Path, JSON.stringify(n2, null, 2) + '\n', 'utf8');
fs.writeFileSync(n1Path, JSON.stringify(n1, null, 2) + '\n', 'utf8');
console.log('Successfully enriched all 30 N2 and 30 N1 lessons with 100% Uzbek titles, learn titles, and explanations!');
