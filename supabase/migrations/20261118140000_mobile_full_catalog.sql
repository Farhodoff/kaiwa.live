-- ============================================================================
-- kaiwa.mobile — full learning catalog in PostgreSQL
-- Replaces every bundled local dataset with backend content:
--   50 Minna lessons + generated lesson quizzes, 174 AI speaking scenarios,
--   4 flashcard decks (2395 cards), 375 JLPT mock questions.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mobile_scenarios (
  id TEXT PRIMARY KEY,
  language TEXT NOT NULL DEFAULT 'ja',
  title_ja TEXT NOT NULL,
  title_uz TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💬',
  difficulty TEXT NOT NULL DEFAULT 'N5',
  category TEXT NOT NULL DEFAULT 'daily',
  description_uz TEXT NOT NULL DEFAULT '',
  opening_line_ja TEXT NOT NULL DEFAULT '',
  opening_line_uz TEXT NOT NULL DEFAULT '',
  context_prompt TEXT NOT NULL DEFAULT '',
  key_phrases JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mobile_decks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT 'N5',
  icon TEXT NOT NULL DEFAULT 'albums',
  badge_color TEXT NOT NULL DEFAULT '#6C5CE7',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mobile_flashcards
  ADD COLUMN IF NOT EXISTS deck_id TEXT REFERENCES public.mobile_decks(id) ON DELETE CASCADE;

ALTER TABLE public.mobile_quiz_questions
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS section TEXT,
  ADD COLUMN IF NOT EXISTS set_no INTEGER;

CREATE INDEX IF NOT EXISTS idx_mobile_flashcards_deck ON public.mobile_flashcards(deck_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_mobile_scenarios_level ON public.mobile_scenarios(difficulty, sort_order);
CREATE INDEX IF NOT EXISTS idx_mobile_quiz_mock_level ON public.mobile_quiz_questions(quiz_type, level, sort_order);

ALTER TABLE public.mobile_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_decks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mobile scenarios read" ON public.mobile_scenarios;
CREATE POLICY "mobile scenarios read" ON public.mobile_scenarios
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "mobile decks read" ON public.mobile_decks;
CREATE POLICY "mobile decks read" ON public.mobile_decks
  FOR SELECT TO anon, authenticated USING (true);

-- Remove the previous placeholder catalog. Progress rows cascade.
DELETE FROM public.mobile_lessons;
DELETE FROM public.mobile_quiz_questions;
DELETE FROM public.mobile_flashcards;
DELETE FROM public.mobile_decks;
DELETE FROM public.mobile_scenarios;
DROP TABLE IF EXISTS public.mobile_ai_replies;
DROP TABLE IF EXISTS public.mobile_conversation_topics;

-- @@CHUNK@@
-- lessons
-- @@CHUNK@@
INSERT INTO public.mobile_lessons (id, title, title_ja, level, minutes, xp, content, sort_order) VALUES
  ('m-l1', '1-dars: Tanishuv va O''zini tanishtirish', '第1課：自己紹介と挨拶', 'N5', 12, 35, '{"vocab":[{"ja":"わたし","romaji":"わたし","uz":"men"},{"ja":"わたしたち","romaji":"わたしたち","uz":"biz"},{"ja":"あなた","romaji":"あなた","uz":"siz (sen)"},{"ja":"あの人 (あのひと)","romaji":"あのひと","uz":"u kishi (u ayol (qiz))"},{"ja":"（あの方） (（あのかた）)","romaji":"（あのかた）","uz":"( あのかた あのひと ning hurmat shakli)"},{"ja":"皆さん (みなさん)","romaji":"みなさん","uz":"xonimlar va janoblar, hamma, sizlar"},{"ja":"～さん","romaji":"～さん","uz":"janob, xonim (hurmatni bildirish va yaqinlikni ko''rsatish uchun ism kasb va h.zo.larga qo''shiladi. Uning yanada hurmatli shakli さま dir. )"},{"ja":"～ちゃん","romaji":"～ちゃん","uz":"～さん ning qisqartma hamda erkalash ko''rinishidagi suffiksi. Odatda bolalarga nisbatan qo''llaniladi."},{"ja":"～君 (～くん)","romaji":"～くん","uz":"～さん ning qisqartma hamda erkalash ko''rinishidagi suffiksi. Odatda bolalarga nisbatan qo''llaniladi."},{"ja":"～人 (～じん)","romaji":"～じん","uz":"biror kishining millatini bildiradigan suffiks."},{"ja":"アメリカ人","romaji":"アメリカ人","uz":"\"Amerikalik\""},{"ja":"先生 (せんせい)","romaji":"せんせい","uz":"ustoz"},{"ja":"教師 (きょうし)","romaji":"きょうし","uz":"o''qituvchi , domla"},{"ja":"学生 (がくせい)","romaji":"がくせい","uz":"talaba"},{"ja":"会社員 (かいしゃいん)","romaji":"かいしゃいん","uz":"firma xodimi, korxona xodimi"},{"ja":"社員 (しゃいん)","romaji":"しゃいん","uz":"firma xodimi (korxona nomlari bilan qo''llanadi. Masalan: ＩＭＣの社員 )"},{"ja":"銀行員 (ぎんこういん)","romaji":"ぎんこういん","uz":"bank xodimi"},{"ja":"医者 (いしゃ)","romaji":"いしゃ","uz":"shifokor"},{"ja":"研究者 (けんきゅうしゃ)","romaji":"けんきゅうしゃ","uz":"tadqiqotchi, ilmiy-izlanuvchi"},{"ja":"エンジニア","romaji":"エンジニア","uz":"muhandis"},{"ja":"大学 (だいがく)","romaji":"だいがく","uz":"universitet, institut"},{"ja":"病院 (びょういん)","romaji":"びょういん","uz":"shifoxona, kasalxona"},{"ja":"電気 (でんき)","romaji":"でんき","uz":"chiroq"},{"ja":"だれ（どなた）","romaji":"だれ（どなた）","uz":"kim ( どなた、だれ ning hurmat shakli)"},{"ja":"～歳 (～さい)","romaji":"～さい","uz":"~yosh"},{"ja":"何歳 (なんさい)","romaji":"なんさい","uz":"necha yosh"},{"ja":"（おいくつ）","romaji":"（おいくつ）","uz":"( おいくつ－なんさい ning hurmat shakli)"},{"ja":"はい","romaji":"はい","uz":"ha"},{"ja":"いいえ","romaji":"いいえ","uz":"yo''q"},{"ja":"失礼ですが (しつれいですが)","romaji":"しつれいですが","uz":"Kechirasiz, ~"},{"ja":"お名前は？ (おなまえは？)","romaji":"おなまえは？","uz":"Ismingiz nima?"},{"ja":"初めまして。 (はじめまして。)","romaji":"はじめまして。","uz":"O''zimni tanishtirishga ruxsat bersangiz."},{"ja":"どうぞ よろしく (どうぞ よろしく)","romaji":"どうぞ よろしく","uz":"Tanishganimdan xursandman"},{"ja":"[ お願いします ] ([ おねがいします ])","romaji":"[ おねがいします ]","uz":""},{"ja":"こちらは ～さんです。","romaji":"こちらは ～さんです。","uz":"Bu kishi janob / xonim ~."},{"ja":"～から 来ました。 (～から きました。)","romaji":"～から きました。","uz":"Men ~(davlat nomi)dan kelganman"},{"ja":"アメリカ","romaji":"アメリカ","uz":"Amerika, AQSH"},{"ja":"イギリス","romaji":"イギリス","uz":"Angliya, Buyuk Britaniya"},{"ja":"インド","romaji":"インド","uz":"Hindiston"},{"ja":"インドネシア","romaji":"インドネシア","uz":"Indoneziya"},{"ja":"韓国[かんこく]","romaji":"韓国[かんこく]","uz":"Janubiy Koreya"},{"ja":"タイ","romaji":"タイ","uz":"Tailand"},{"ja":"中国[ちゅうごく]","romaji":"中国[ちゅうごく]","uz":"Xitoy"},{"ja":"ドイツ","romaji":"ドイツ","uz":"Olmoniya"},{"ja":"日[に] 本[ほん]","romaji":"日[に] 本[ほん]","uz":"Yaponiya"},{"ja":"フランス","romaji":"フランス","uz":"Fransiya"},{"ja":"ブラジル","romaji":"ブラジル","uz":"Braziliya"},{"ja":"さくら大学[だいがく] ／富士[ふじ] 大学[だいがく]","romaji":"さくら大学[だいがく] ／富士[ふじ] 大学[だいがく]","uz":"universitet nomlari (o''ylab topilgan)"},{"ja":"IMC ／パワー電[でん] 気[き] ／ブラジルエアー","romaji":"IMC ／パワー電[でん] 気[き] ／ブラジルエアー","uz":"kompaniyalar nomlari (o''ylab topilgan) AKC institut nomi (o''ylab topilgan) shifoxona nomi (o''ylab topilgan)"},{"ja":"神[こう] 戸[べ] 病[びょう] 院[いん]","romaji":"神[こう] 戸[べ] 病[びょう] 院[いん]","uz":""}],"grammar":[{"pattern":"OT 1 は  OT 2 です","meaning":"1) は yuklamasi は yuklamasi birikib kelgan ot gapning mavzusi bo''lib keliadi. Siz so''zlashni istagan biror predmetni tanlaysiz, unga は qo''shimchasini qo''shish…","example":"わたしは マイク・ミラーです。"},{"pattern":"OT 1 は  OT 2 じゃありません","meaning":"じゃありません、です ning inkor shaklidir. Bu shakl kundalik og''zaki nutqda qo''llaniladi. Rasmiy nutq yoki yozma uslubda esa, ではありません qo''llaniladi. [Eslatma] は「では」 da…","example":"サントスさんは 学生[がくせい] じゃ ありません。  Janob Santos talaba emas."},{"pattern":"GAP  か","meaning":"1) か yuklamasi か yuklamasi shubha, savol, ikkilanish kabi ma''nolarni bildirish uchun qo''llaniladi. So''roq shakli, gapning oxiriga か yuklamasini qo''shish orqa…","example":"ミラーさんは アメリカ人[じん] ですか。"},{"pattern":"OT  も","meaning":"Avvalgi gapdagi mavzuni takrorlab qo''llaganda は o''rniga も ( ham ) qo''shimchasi mavzu bo''lib kelgan so''zdan keyin qo''yiladi. グプタさんも 会社員[かいしゃいん] です。 Janob Gupt…","example":"ミラーさんは 会社員[かいしゃいん] です。"},{"pattern":"OT 1  の OT 2","meaning":"の qo''shimchasi ikki otni bog''lash uchun qo''llanib, tegishlilikni bildiradi. OT 1 OT 2 ni aniqlaydi. 1-darsda keltirilgan misollarda OT 2 biror-bir korxona yo…","example":"ミラーさんは IMC  の 社員[しゃいん] です。"},{"pattern":"~  さん","meaning":"さん qo''shimchasi suhbatdosh yoki uchinchi shaxs ismiga qo''shilib, so''zlovchining unga bo''lgan hurmatini ko''rsatadi. So''zlovchi o''zining ismiga さん qo''shimchasi…","example":"あの 方[かた] は ミラーさんです。 Ana u kishi janob Miller."}],"phrases":[{"ja":"わたしは マイク・ミラーです。","uz":"Men Mayk Millerman."},{"ja":"わたしは エンジニアです。","uz":"Men muhandisman."},{"ja":"サントスさんは 学生[がくせい] じゃ ありません。  Janob Santos talaba emas.","uz":"（では）"},{"ja":"ミラーさんは アメリカ人[じん] ですか。","uz":"Janob Miller amerikalikmi?"},{"ja":"ミラーさんは 先生[せんせい] ですか。 Janob Miller o`qituvchimi?","uz":"･･･いいえ、先生[せんせい] じゃ ありません。 …Yo''q, o''qituvchi emas."},{"ja":"あの 方[かた] は どなたですか。","uz":"Ana u kishi kim?"},{"ja":"ミラーさんは 会社員[かいしゃいん] です。","uz":"Janob Miller firma xodimi."},{"ja":"ミラーさんは IMC  の 社員[しゃいん] です。","uz":"Janob Miller IMC xodimi."}]}'::jsonb, 1),
  ('m-l2', '2-dars: Buyumlar va Ko''rsatish olmoshlari', '第2課：物の名前と指示代名詞', 'N5', 14, 40, '{"vocab":[{"ja":"これ","romaji":"これ","uz":"bu (so''zlovchiga yaqin masofadagi buyumga nisbatan qo''llaniladi)"},{"ja":"それ","romaji":"それ","uz":"u, o''sha (tinglovchiga yaqin masofadagi buyumlarga nisbatan qo''llaniladi)"},{"ja":"あれ","romaji":"あれ","uz":"ana u, ana o''sha (ham so''zlovchiga, ham tinglovchiga uzoq bo''lgan buyumlarga nisbatan qo''llaniladi)"},{"ja":"この～","romaji":"この～","uz":"bu ~(so''zlovchiga yaqin masofadagi buyumga nisbatan qo''llaniladi)"},{"ja":"その～","romaji":"その～","uz":"u~, o''sha~(tinglovchiga yaqin masofadagi buyumlarga nisbatan qo''llaniladi)"},{"ja":"あの～","romaji":"あの～","uz":"ana u~, ana o''sha~ (ham so''zlovchiga, ham tinglovchiga uzoq bo''lgan buyumlarga nisbatan qo''llaniladi)"},{"ja":"本 kitob (ほん)","romaji":"ほん","uz":""},{"ja":"辞書 lug`at (じしょ)","romaji":"じしょ","uz":""},{"ja":"雑誌 jurnal, oynoma (ざっし)","romaji":"ざっし","uz":""},{"ja":"新聞 gazeta, ro`znoma (しんぶん)","romaji":"しんぶん","uz":""},{"ja":"ノート","romaji":"ノート","uz":"daftar"},{"ja":"手帳 yon daftar (てちょう)","romaji":"てちょう","uz":""},{"ja":"名刺 tashrif qog`ozi (めいし)","romaji":"めいし","uz":""},{"ja":"カード","romaji":"カード","uz":"kartochka"},{"ja":"テレホンカード","romaji":"テレホンカード","uz":"telefon kartochkasi"},{"ja":"鉛筆 qalam (えんぴつ)","romaji":"えんぴつ","uz":""},{"ja":"ボールペン","romaji":"ボールペン","uz":"sharikli ruchka"},{"ja":"シャープペンシル","romaji":"シャープペンシル","uz":"avtoqalam"},{"ja":"かぎ","romaji":"かぎ","uz":"qulf-kalit"},{"ja":"時計 soat (とけい)","romaji":"とけい","uz":""},{"ja":"傘 soyabon (かさ)","romaji":"かさ","uz":""},{"ja":"かばん","romaji":"かばん","uz":"sumka"},{"ja":"[ カセット ] テープ","romaji":"[ カセット ] テープ","uz":"audio tasma"},{"ja":"テープレコーダー","romaji":"テープレコーダー","uz":"magnitofon"},{"ja":"テレビ","romaji":"テレビ","uz":"televizor"},{"ja":"ラジオ","romaji":"ラジオ","uz":"radio"},{"ja":"カメラ","romaji":"カメラ","uz":"fotoapparat"},{"ja":"コンピューター","romaji":"コンピューター","uz":"kompyuter"},{"ja":"自動車 avtomobil (じどうしゃ)","romaji":"じどうしゃ","uz":""},{"ja":"机 (つくえ)","romaji":"つくえ","uz":"stol, parta"},{"ja":"いす","romaji":"いす","uz":"stul, kursi"},{"ja":"チョコレート","romaji":"チョコレート","uz":"shokolad"},{"ja":"コーヒー","romaji":"コーヒー","uz":"qahva (kofe)"},{"ja":"英語 (えいご)","romaji":"えいご","uz":"ingliz tili"},{"ja":"日本語 (にほんご)","romaji":"にほんご","uz":"yapon tili"},{"ja":"～語 (～ご)","romaji":"～ご","uz":"~tili"},{"ja":"何 (なん)","romaji":"なん","uz":"nima"},{"ja":"そう","romaji":"そう","uz":"shunday"},{"ja":"違います。 (ちがいます。)","romaji":"ちがいます。","uz":"Unaqa emas. / Noto''g''ri."},{"ja":"そうですか。","romaji":"そうですか。","uz":"Shundaymi? Rostdanmi?"},{"ja":"あのう","romaji":"あのう","uz":"Haligi… . (Gap boshlash)"},{"ja":"ほんの気持ちです。 (ほんのきもちです。)","romaji":"ほんのきもちです。","uz":"Chin ko''ngildan"},{"ja":"どうぞ。","romaji":"どうぞ。","uz":"Marhamat."},{"ja":"どうも。","romaji":"どうも。","uz":"Rahmat."},{"ja":"[ どうも ]  ありがとう  [ ございます","romaji":"[ どうも ]  ありがとう  [ ございます","uz":"] Katta rahmat (minnatdorchilik izhor etishning to''liq ifodasi)"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"これから お世話[せわ] に なります。","romaji":"これから お世話[せわ] に なります。","uz":"Bundan buyon mehr va yordamingizga muhtojman."},{"ja":"こちらこそ よろしく。","romaji":"こちらこそ よろしく。","uz":"Men ham yordamingizni ayamaysiz degan umiddaman. / Men ham tanishganimdan xursandman. ( 「どうぞよろしく」 ga javob tariqasida)"}],"grammar":[{"pattern":"これ  /  それ  /  あれ","meaning":"これ , それ , あれ ko''rsatish olmoshlari. Ular shuningdek ot sifatida ham ishlatiladi. これ so''zlovchining yonida turgan narsalarni ko''rsatishda, それ suhbatdoshning y…","example":"それは 辞[じ] 書[しょ] ですか。 Bu (sizdagi) lug`atmi?"},{"pattern":"この  OT  /  その  OT  /  あの OT","meaning":"この , その va あの otlarni aniqlaydi. “ この OT ” so''zlovchining yonida turgan narsani, “ その OT ” suhbatdoshning yonida turgan narsani, “ あの OT” so''zlovchidan ham,…","example":"この 本[ほん] は わたしのです。 Bu kitob meniki."},{"pattern":"そうです  /  そうじゃ ありません","meaning":"So''roq gaplarda ot kesim vazifasida kelsa, bu holda そう so''zi javob tariqasida inkor yoki tasdiq ma''nosida keladi. はい、そうです bu tasdiq javob, いいえ、そう じゃ ありません in…","example":"それは テレホンカードですか。 Bu telefon kartochkasimi?"},{"pattern":"4.","meaning":"GAP 1 か、 GAP 2 か Bunday savollarga javob berishda GAP 1 va GAP 2 larni shundayligicha tanlab olish lozim. Bunday turdagi savollarga gapni shunday tanlab olib…","example":"これは ｢９｣ですか、｢７｣ですか。"},{"pattern":"OT 1 の OT 2","meaning":"Siz 1-darsda の OT 1 OT 2 ni aniqlab kelganida, uning bularni bog''lash uchun qo''llanilishini bilib oldingiz. 2-darsda siz の yuklamasi boshqa 2 xil usulda qo''l…","example":"これは コンピューターの 本[ほん] です。"},{"pattern":"そうですか","meaning":"Bu ibora so''zlovchi yangi ma''lumotni qabul qilib, uni qabul qilganini va tushunganligini ko''rsatish uchun qo''llaniladi. そうですか。 Bu soyabon siznikimi? Tushunarli.","example":"この 傘[かさ] は あなたのですか。"}],"phrases":[{"ja":"それは 辞[じ] 書[しょ] ですか。 Bu (sizdagi) lug`atmi?","uz":""},{"ja":"これを ください。 Menga mana buni bering. (3-dars )","uz":""},{"ja":"この 本[ほん] は わたしのです。 Bu kitob meniki.","uz":""},{"ja":"あの 方[かた] は どなたですか。 Anavi kishi kim?","uz":"あれ"},{"ja":"それは テレホンカードですか。 Bu telefon kartochkasimi?","uz":"･･･はい、そうです。 …Ha, shunday."},{"ja":"それは テレホンカードですか。","uz":"Bu telefon kartochkasimi?"},{"ja":"これは ｢９｣ですか、｢７｣ですか。","uz":"Bu “9” mi yoki “7”?"},{"ja":"これは コンピューターの 本[ほん] です。","uz":"Bu kompyute haqidagi kitob."}]}'::jsonb, 2),
  ('m-l3', '3-dars: Joylar va Narx-navo', '第3課：場所と買い物・値段', 'N5', 16, 30, '{"vocab":[{"ja":"ここ","romaji":"ここ","uz":"bu yer, bu joy"},{"ja":"そこ","romaji":"そこ","uz":"u yer, u joy, o''sha yer, o''sha joy"},{"ja":"あそこ","romaji":"あそこ","uz":"ana u yer, ana u joy"},{"ja":"どこ","romaji":"どこ","uz":"qayer"},{"ja":"こちら","romaji":"こちら","uz":"bu yer, bu joy ( ここ ning hurmat shakli)"},{"ja":"そちら","romaji":"そちら","uz":"u yer, u joy, o''sha yer, o''sha joy ( そこ ning hurmat shakli)"},{"ja":"あちら","romaji":"あちら","uz":"ana u yer, ana u joy ( あそこ ning hurmat shakli)"},{"ja":"どちら","romaji":"どちら","uz":"qayer ( どこ ning hurmat shakli)"},{"ja":"教室 (きょうしつ)","romaji":"きょうしつ","uz":"sinf, auditoriya"},{"ja":"食堂 (しょくどう)","romaji":"しょくどう","uz":"oshxona"},{"ja":"事務所 (じむしょ)","romaji":"じむしょ","uz":"idora, ofis"},{"ja":"会議室 (かいぎしつ)","romaji":"かいぎしつ","uz":"majlislar zali"},{"ja":"受付 (うけつけ)","romaji":"うけつけ","uz":"qabulxona"},{"ja":"ロビー","romaji":"ロビー","uz":"dahliz"},{"ja":"部屋 (へや)","romaji":"へや","uz":"xona"},{"ja":"（お手洗い） (トイレ（おてあらい）)","romaji":"トイレ（おてあらい）","uz":"hojatxona"},{"ja":"階段 (かいだん)","romaji":"かいだん","uz":"zina"},{"ja":"エレベーター","romaji":"エレベーター","uz":"lift"},{"ja":"エスカレーター","romaji":"エスカレーター","uz":"eskalator"},{"ja":"[ お ] 国 ([ お ] くに)","romaji":"[ お ] くに","uz":"vatan, mamlakat"},{"ja":"会社 (かいしゃ)","romaji":"かいしゃ","uz":"firma, korxona"},{"ja":"うち","romaji":"うち","uz":"uy"},{"ja":"電話 (でんわ)","romaji":"でんわ","uz":"telefon"},{"ja":"靴 (くつ)","romaji":"くつ","uz":"poyafzal"},{"ja":"ネクタイ","romaji":"ネクタイ","uz":"bo''yinbog''"},{"ja":"ワイン","romaji":"ワイン","uz":"musallas, sharob (vino)"},{"ja":"たばこ","romaji":"たばこ","uz":"tamaki"},{"ja":"売り場 (うりば)","romaji":"うりば","uz":"sotuv rastasi, savdo bo''limi"},{"ja":"地下 (ちか)","romaji":"ちか","uz":"yer osti, yerto''la"},{"ja":"～階 (～かい)","romaji":"～かい","uz":"~-qavat"},{"ja":"何階 (なんがい)","romaji":"なんがい","uz":"nechanchi qavat"},{"ja":"～円 (～えん)","romaji":"～えん","uz":"~iyena"},{"ja":"いくら","romaji":"いくら","uz":"necha pul, necha pul turadi, qancha, qancha turadi"},{"ja":"百 (ひゃく)","romaji":"ひゃく","uz":"yuz"},{"ja":"千 (せん)","romaji":"せん","uz":"ming"},{"ja":"万 (まん)","romaji":"まん","uz":"o''n ming"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"すみません。","romaji":"すみません。","uz":"Kechirasiz. / Meni ma''zur tutasiz."},{"ja":"～で ございます。","romaji":"～で ございます。","uz":"~dir. ( です ning hurmat shakli.)"},{"ja":"[ ～を ]  見[み] せて ください。","romaji":"[ ～を ]  見[み] せて ください。","uz":"Iltimos, ~ni ko''rsating."},{"ja":"じゃ","romaji":"じゃ","uz":"U holda. / Xo''sh. / Demak."},{"ja":"[ ～を ]  ください。","romaji":"[ ～を ]  ください。","uz":"Iltimos, ~ni bering."},{"ja":"新[しん] 大[おお] 阪[さか]","romaji":"新[しん] 大[おお] 阪[さか]","uz":"Shin-Osaka (Osakadagi bekat nomi)"},{"ja":"イタリア","romaji":"イタリア","uz":"Italiya"},{"ja":"スイス","romaji":"スイス","uz":"Shveysariya"},{"ja":"ＭＴ／ヨーネン／アキックス","romaji":"ＭＴ／ヨーネン／アキックス","uz":"kompaniyalar nomi (o''ylab topilgan)"}],"grammar":[{"pattern":"ここ／そこ／あそこ／こちら／そちら／あちら","meaning":"これ , それ va あれ ko''rsatish so''zlari predmetga nisbatan qo''llanilishini 2-darsda ko''rib chiqqan edik. ここ , そこ va あそこ ko''rsatish so''zlari o''rin- joyga nisbatan i…","example":""},{"pattern":"OT 1 は OT 2  (o`rin-joy)  です","meaning":"Ushbu namuna orqali predmet yoki odamning qayerda joylashganini izohlash mumkin. Hojatxona ana u yerda.","example":"お手[て] 洗[あら] いは あそこです。"},{"pattern":"どこ／どちら","meaning":"どこ so''zi “ qayerda ”, どちら esa “ qaysi tarafda ”, “ qaysi yonalishda ” degan ma''noni bildiradi. Shuningdek, どちら so''roq olmoshi どこ ga nisbatan muloyimroq ohang…","example":"お手[て] 洗[あら] いは どこですか。 Hojatxona qayerda (joylashgan)?"},{"pattern":"OT 1  の OT 2","meaning":"Ushbu tuzilmada どこ - OT 2 ning qayerda va kim tomonidan tayyorlanganligini so''rash uchun qo''llaniladi. Agar OT 1 -davlat nomi, OT 2 -mahsulot (predmet) nomi…","example":"これは どこの コンピューターですか。 Bu qayerning kompyuteri?"},{"pattern":"こ／そ／あ／ど  UMUMIY NEGIZGA EGA BO`LGAN KO`RSATISH","meaning":"OLMOSHLARINING JADVALI こ qator そ qator あ qator ど qator Predmet これ それ あれ どれ (8-dars) Predmet yoki この OT その OT あの OT どの OT shaxs (16-dars) Joy ここ そこ あそこ どこ Yo''…","example":""},{"pattern":"お国[くに]","meaning":"Suhbatdosh yoki 3-shaxsga nisbatan o''z hurmatini ifodalash maqsadida so''zlovchi suhbatdoshiga tegishli bo''lgan predmetga お old qo''shimchasini qo''shadi.","example":"お国[くに] は どちらですか。 Qaysi davlatdansiz?/ Qayerdansiz?"}],"phrases":[{"ja":"お手[て] 洗[あら] いは あそこです。","uz":""},{"ja":"電[でん] 話[わ] は ２階[かい] です。 Telefon 2-qavatda.","uz":""},{"ja":"山[やま] 田[だ] さんは 事[じ] 務[む] 所[しょ] です。 Janob Yamada idorada.","uz":""},{"ja":"お手[て] 洗[あら] いは どこですか。 Hojatxona qayerda (joylashgan)?","uz":"･･･あそこです。 …Ana u yerda (joylashgan)."},{"ja":"エレベータは どちらですか。 Lift qaysi tarafda (joylashgan)?","uz":"･･･あちらです。 … Ana u tarafda (joylashgan)."},{"ja":"学校[がっこう] は どこですか。 Qaysi maktabda tahsil olasiz?","uz":""},{"ja":"会社[かいしゃ] は どちらですか。 Qaysi korxonada ishlaysiz?","uz":""},{"ja":"これは どこの コンピューターですか。 Bu qayerning kompyuteri?","uz":"…Yaponiyaning kompyuteri."}]}'::jsonb, 3),
  ('m-l4', '4-dars: Vaqt, Soatlar va Fe''llar (Ertalabdan kechgacha)', '第4課：時間・動詞の現在と過去', 'N5', 18, 35, '{"vocab":[{"ja":"起きます uyg`onmoq (おきます)","romaji":"おきます","uz":""},{"ja":"寝ます uxlamoq (ねます)","romaji":"ねます","uz":""},{"ja":"働きます ishlamoq (はたらきます)","romaji":"はたらきます","uz":""},{"ja":"休みます dam olmoq (やすみます)","romaji":"やすみます","uz":""},{"ja":"勉強します dars qilmoq, dars tayyorlamoq (べんきょうします)","romaji":"べんきょうします","uz":""},{"ja":"終わります tugamoq (おわります)","romaji":"おわります","uz":""},{"ja":"デパート","romaji":"デパート","uz":"univermag"},{"ja":"銀行 bank (ぎんこう)","romaji":"ぎんこう","uz":""},{"ja":"郵便局 pochta idorasi (ゆうびんきょく)","romaji":"ゆうびんきょく","uz":""},{"ja":"図書館 kutubxona (としょかん)","romaji":"としょかん","uz":""},{"ja":"美術館 badiiy san’at muzeyi (びじゅつかん)","romaji":"びじゅつかん","uz":""},{"ja":"今 hozir (いま)","romaji":"いま","uz":""},{"ja":"～時 soat~ (～じ)","romaji":"～じ","uz":""},{"ja":"～分 ~daqiqa (～ふん（～ぷん）)","romaji":"～ふん（～ぷん）","uz":""},{"ja":"半 yarim (はん)","romaji":"はん","uz":""},{"ja":"何時 soat necha (なんじ)","romaji":"なんじ","uz":""},{"ja":"何分 necha daqiqa (なんぷん)","romaji":"なんぷん","uz":""},{"ja":"午前 (tungi soat 12dan tushki 12gacha (ごぜん)","romaji":"ごぜん","uz":"bo''lgan vaqt) masalan: 午前１時 – tungi soat1;"},{"ja":"午後 (tushki soat 12 dan tungi soat 12 (ごご)","romaji":"ごご","uz":"gacha bo''lgan vaqt) masalan: 午後３時 kunduzgi soat 3; 午後９時 kechki soat 9"},{"ja":"朝 tong, ertalab (あさ)","romaji":"あさ","uz":""},{"ja":"昼 tush, kunduzi (ひる)","romaji":"ひる","uz":""},{"ja":"晩 （夜） kech, kechqurun (ばん（よる）)","romaji":"ばん（よる）","uz":""},{"ja":"おととい","romaji":"おととい","uz":"o''tgan kuni, kechadan oldingi kun"},{"ja":"きのう","romaji":"きのう","uz":"kecha"},{"ja":"きょう","romaji":"きょう","uz":"bugun"},{"ja":"あした","romaji":"あした","uz":"ertaga"},{"ja":"あさって","romaji":"あさって","uz":"indinga, ertadan keyin"},{"ja":"けさ","romaji":"けさ","uz":"bugun ertalab, bugun tongda"},{"ja":"今晩 bugun kechqurun (こんばん)","romaji":"こんばん","uz":""},{"ja":"休み dam olish, ta’til (やすみ)","romaji":"やすみ","uz":""},{"ja":"昼休み tushlik / tushki tanaffus (ひるやすみ)","romaji":"ひるやすみ","uz":""},{"ja":"毎朝 har kuni ertalab, har tong (まいあさ)","romaji":"まいあさ","uz":""},{"ja":"毎晩 har kuni kechqurun (まいばん)","romaji":"まいばん","uz":""},{"ja":"毎日 har kuni (まいにち)","romaji":"まいにち","uz":""},{"ja":"月曜日 dushanba (げつようび)","romaji":"げつようび","uz":""},{"ja":"火曜日 seshanba (かようび)","romaji":"かようび","uz":""},{"ja":"水曜日 chorshanba (すいようび)","romaji":"すいようび","uz":""},{"ja":"木曜日 payshanba (もくようび)","romaji":"もくようび","uz":""},{"ja":"金曜日 juma (きんようび)","romaji":"きんようび","uz":""},{"ja":"土曜日 shanba (どようび)","romaji":"どようび","uz":""},{"ja":"日曜日 yakshanba (にちようび)","romaji":"にちようび","uz":""},{"ja":"何曜日 haftaning qaysi kuni (なんようび)","romaji":"なんようび","uz":""},{"ja":"番号 raqam (ばんごう)","romaji":"ばんごう","uz":""},{"ja":"何番 nechanchi raqam (なんばん)","romaji":"なんばん","uz":""},{"ja":"～から","romaji":"～から","uz":"~dan"},{"ja":"～まで","romaji":"～まで","uz":"~gacha, ~ ga qadar"},{"ja":"～と～","romaji":"～と～","uz":"~ bilan ~"},{"ja":"そちら","romaji":"そちら","uz":"sizda"},{"ja":"大変ですね。 Qiyin bo`libdi. (たいへんですね。)","romaji":"たいへんですね。","uz":""},{"ja":"えーと","romaji":"えーと","uz":"Xo''sh… . (fikrni jamlash payti iborasi)"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"１０４","romaji":"１０４","uz":"104 (ma''lumotlar bo''limi raqami)"},{"ja":"お願[ねが] いします。","romaji":"お願[ねが] いします。","uz":"Iltimos."},{"ja":"かしこまりました。","romaji":"かしこまりました。","uz":"Tushundim. / Uqdim."},{"ja":"お問[と] い合[あ] わせの番号[ばんごう]","romaji":"お問[と] い合[あ] わせの番号[ばんごう]","uz":"Ma''lumot uchun telefonlar"},{"ja":"[ どうも ]  ありがとう ございました。","romaji":"[ どうも ]  ありがとう ございました。","uz":"Katta rahmat."},{"ja":"ニューヨーク","romaji":"ニューヨーク","uz":"Nyu-York"},{"ja":"ペキン","romaji":"ペキン","uz":"Pekin"},{"ja":"ロンドン","romaji":"ロンドン","uz":"London"},{"ja":"バンコク","romaji":"バンコク","uz":"Bangkok"},{"ja":"ロサンゼルス","romaji":"ロサンゼルス","uz":"Los-Anjeles"},{"ja":"やまと美[び] 術[じゅつ] 館[かん]","romaji":"やまと美[び] 術[じゅつ] 館[かん]","uz":"muzey nomi (o''ylab topilgan)"},{"ja":"大阪[おおさか] デパート","romaji":"大阪[おおさか] デパート","uz":"univermag nomi (o''ylab topilgan)"},{"ja":"みどり図[と] 書[しょ] 館[かん]","romaji":"みどり図[と] 書[しょ] 館[かん]","uz":"kutubxona nomi (o''ylab topilgan)"},{"ja":"アップル銀行[ぎんこう]","romaji":"アップル銀行[ぎんこう]","uz":"bank nomi (o''ylab topilgan)"}],"grammar":[{"pattern":"1.","meaning":"今[いま] －時[じ] －分[ふん] です Vaqtni ifodalash uchun 時[じ] ( soat ) va 分[ふん] ( daqiqa ) kabi sanoq suffikslari ishlatiladi. Bunda son 分[ふん] dan oldin qo''yiladi. 2, 5,…","example":"今[いま] 何[なん] 時[じ] ですか。 Hozir soat necha (bo`ldi)?"},{"pattern":"FE’L  ます","meaning":"ます qo''shimchasi bilan tugagan fe''l gapda kesim bo''lib keladi. ます qo''shimchasi gapning hurmat shaklini ifodalaydi.","example":"わたしは 毎日[まいにち] 勉強[べんきょう] します。 Men har kuni dars tayyorlayman."},{"pattern":"FE’L  ます /  FE’L  ません /  FE’L  ました /  FE’L  ませんでした","meaning":"1) ます qo''shimchasi gapda hozirgi zamon yoki doimo sodir bo''ladigan ish-harakatni ifodalash uchun qo''llaniladi. Yana bu qo''shimcha kelasi zamonda sodir bo''lad…","example":"毎[まい] 朝[あさ] ６時[じ] に 起[お] きます。 Har kuni ertalab soat 6 da uyg`onaman."},{"pattern":"OT (vaqt)  に  FE’L","meaning":"Agar fe''l davomsiz harakatni bildirsa, o''sha harakat sodir bo''lganda に qo''shimchasi qo''shiladi. に qo''shimchasi undan oldin kelayotgan ot, sanoq son bilan bog…","example":"６時[じ] 半[はん] に 起[お] きます。  Soat 6 yarimda turaman."},{"pattern":"OT 1 から  OT 2 まで","meaning":"1) から boshlang''ich vaqt yoki joyni, まで oxirini ko''rsatadi. ～から , ～まで yoki ～から～まで dan keyin gohida です fe''li qo''llaniladi. ⑯ 昼[ひる] 休[やす] みは １２時[じ] からです。 Tushli…","example":"９時[じ] から ５時[じ] まで 働[はたら] きます。"},{"pattern":"OT 1 と  OT 2","meaning":"と qo''shimchasi ikkita otni o''zaro teng bog''laydi. ⑱ 銀行[ぎんこう] の 休[やす] みは 土曜日[どようび] と 日[にち] 曜[よう] 日[び] です。 Bank shanba va yakshanba kunlari ishlamaydi.","example":""},{"pattern":"GAP  ね","meaning":"Gapning oxirida qo''shiladigan ね yuklamasi mulohazaga hissiy-ta''siriy bo''yoq beradi. Masalan, bu yuklama hamdardlikni yoki so''zlovchi suhbatdoshidan kutayotga…","example":""}],"phrases":[{"ja":"今[いま] 何[なん] 時[じ] ですか。 Hozir soat necha (bo`ldi)?","uz":"･･･ ７時[じ] １０分[ぷん] です。 …Soat 7 dan 10 daqiqa o''tdi."},{"ja":"ニューヨークは 今[いま] 何[なん] 時[じ] ですか。 Nyu-Yorkda hozir soat necha (bo`ldi)?","uz":"･･･ 午前[ごぜん] ４時[じ] です。 …Ertalabki soat 4."},{"ja":"わたしは 毎日[まいにち] 勉強[べんきょう] します。 Men har kuni dars tayyorlayman.","uz":""},{"ja":"毎[まい] 朝[あさ] ６時[じ] に 起[お] きます。 Har kuni ertalab soat 6 da uyg`onaman.","uz":""},{"ja":"あした ６時[じ] に 起[お] きます。 Ertaga soat 6 da uyg`onaman.","uz":""},{"ja":"けさ ６時[じ] に 起[お] きました。 Bugun ertalab soat 6 da uyg`ondim.","uz":"2) Kesim fe''l orqali ifodalangan gaplarning so''roq shakli xuddi ega va kesimdan iborat"},{"ja":"きのう 勉強[べんきょう] しましたか。","uz":"Kecha dars tayyorladingizmi?"},{"ja":"毎[まい] 朝[あさ] 何[なん] 時[じ] に 起[お] きますか。","uz":"Har kuni ertalab soat nechada uyqudan turasiz?"}]}'::jsonb, 4),
  ('m-l5', '5-dars: Harakat, Transport va Safar', '第5課：行く・来る・帰る・交通手段', 'N5', 10, 40, '{"vocab":[{"ja":"行きます (いきます)","romaji":"いきます","uz":"bormoq"},{"ja":"来ます (きます)","romaji":"きます","uz":"kelmoq"},{"ja":"帰ります (かえります)","romaji":"かえります","uz":"qaytmoq"},{"ja":"学校 (がっこう)","romaji":"がっこう","uz":"maktab"},{"ja":"スーパー","romaji":"スーパー","uz":"supermarket, savdo do''koni"},{"ja":"駅 (えき)","romaji":"えき","uz":"vokzal; bekat"},{"ja":"飛行機 (ひこうき)","romaji":"ひこうき","uz":"samolyot"},{"ja":"船 (ふね)","romaji":"ふね","uz":"kema"},{"ja":"電車 (でんしゃ)","romaji":"でんしゃ","uz":"poyezd"},{"ja":"地下鉄 (ちかてつ)","romaji":"ちかてつ","uz":"metro"},{"ja":"新幹線 (しんかんせん)","romaji":"しんかんせん","uz":"“sinkansen” tez yurar poyezdi"},{"ja":"バス","romaji":"バス","uz":"avtobus"},{"ja":"タクシー","romaji":"タクシー","uz":"taksi"},{"ja":"自転車 (じてんしゃ)","romaji":"じてんしゃ","uz":"velosiped"},{"ja":"歩いて (あるいて)","romaji":"あるいて","uz":"piyoda"},{"ja":"人 (ひと)","romaji":"ひと","uz":"odam, kishi, inson"},{"ja":"友達 (ともだち)","romaji":"ともだち","uz":"do''st, dugona"},{"ja":"彼 (かれ)","romaji":"かれ","uz":"u (erkak kishi)"},{"ja":"彼女 (かのじょ)","romaji":"かのじょ","uz":"u (ayol kishi)"},{"ja":"家族 (かぞく)","romaji":"かぞく","uz":"oila"},{"ja":"一人で (ひとりで)","romaji":"ひとりで","uz":"bir o''zi(~m, ~ng ), yakka"},{"ja":"先週 (せんしゅう)","romaji":"せんしゅう","uz":"o''tgan hafta"},{"ja":"今週 (こんしゅう)","romaji":"こんしゅう","uz":"bu hafta"},{"ja":"来週 (らいしゅう)","romaji":"らいしゅう","uz":"kelasi hafta"},{"ja":"先月 (せんげつ)","romaji":"せんげつ","uz":"o''tgan oy"},{"ja":"今月 (こんげつ)","romaji":"こんげつ","uz":"bu oy"},{"ja":"来月 (らいげつ)","romaji":"らいげつ","uz":"kelasi oy"},{"ja":"去年 (きょねん)","romaji":"きょねん","uz":"o''tgan yili"},{"ja":"今年 (ことし)","romaji":"ことし","uz":"bu yil"},{"ja":"来年 (らいねん)","romaji":"らいねん","uz":"kelasi yil"},{"ja":"～月 (～がつ)","romaji":"～がつ","uz":"~chi oy, ~oyi"},{"ja":"何月 (なんがつ)","romaji":"なんがつ","uz":"qaysi oy"},{"ja":"1  日 (ついたち)","romaji":"ついたち","uz":"oyning birinchi sanasi"},{"ja":"2  日 (ふつか)","romaji":"ふつか","uz":"oyning ikkinchi sanasi; ikki kun"},{"ja":"3  日 (みっか)","romaji":"みっか","uz":"oyning uchinchi sanasi; uch kun"},{"ja":"4  日 (よっか)","romaji":"よっか","uz":"oyning to''rtinchi sanasi; to''rt kun"},{"ja":"5  日 (いつか)","romaji":"いつか","uz":"oyning beshinchi sanasi; besh kun"},{"ja":"6  日 (むいか)","romaji":"むいか","uz":"oyning oltinchi sanasi; olti kun"},{"ja":"7  日 (なのか)","romaji":"なのか","uz":"oyning yettinchi sanasi; yetti kun"},{"ja":"8  日 (ようか)","romaji":"ようか","uz":"oyning sakkizinchi sanasi; sakkiz kun"},{"ja":"9  日 (ここのか)","romaji":"ここのか","uz":"oyning to''qqizinchi sanasi; to''qqiz kun"},{"ja":"10  日 (とおか)","romaji":"とおか","uz":"oyning oninchi sanasi; o''n kun"},{"ja":"14  日 (じゅうよっか)","romaji":"じゅうよっか","uz":"oyning o''n to''rtinchi sanasi; o''n to''rt kun"},{"ja":"20  日 (はつか)","romaji":"はつか","uz":"oyning yigirmanchi sanasi; yigirma kun"},{"ja":"24  日 (にじゅうよっか)","romaji":"にじゅうよっか","uz":"oyning yigirma to''rtinchi sanasi; yigirma to''rt kun"},{"ja":"～日 (～にち)","romaji":"～にち","uz":"~chi sana, ~chi kun; ~kun"},{"ja":"何日 (なんにち)","romaji":"なんにち","uz":"oyning nechanchi sanasi; necha kun"},{"ja":"いつ","romaji":"いつ","uz":"qachon"},{"ja":"誕生日 (たんじょうび)","romaji":"たんじょうび","uz":"tug''ilgan kun"},{"ja":"普通 (ふつう)","romaji":"ふつう","uz":"oddiy poyezd"},{"ja":"急行 (きゅうこう)","romaji":"きゅうこう","uz":"tez yurar poyezd"},{"ja":"特急 (とっきゅう)","romaji":"とっきゅう","uz":"ekspress (tez yurar) poyezd"},{"ja":"次の (つぎの)","romaji":"つぎの","uz":"kelasi, keyingi, navbatdagi"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"どう いたしまして。","romaji":"どう いたしまして。","uz":"Arzimaydi., Hechqisi yoq."},{"ja":"～番線[ばんせん]","romaji":"～番線[ばんせん]","uz":"~chi yo''l (temir yo''l)"},{"ja":"博[はか] 多[た]","romaji":"博[はか] 多[た]","uz":"Hakata (Kyushyudagi shahar)"},{"ja":"伏[ふし] 見[み]","romaji":"伏[ふし] 見[み]","uz":"Fushimi (Kiotodagi tuman)"},{"ja":"甲子園[こうしえん]","romaji":"甲子園[こうしえん]","uz":"Koshien (Osaka yaqinidagi shahar)"},{"ja":"大[おお] 阪[さか] 城[じょう]","romaji":"大[おお] 阪[さか] 城[じょう]","uz":"Osaka qal''asi"}],"grammar":[{"pattern":"OT (o`rin-joy )  へ 行[い] きます ／来[き] ます ／帰[かえ] ります","meaning":"Harakat fe''llari bilan birga へ yuklamasi otdan keyin qo''yiladi. Bu ot harakat sodir bo''ladigan joyni bildiradi.","example":"京[きょう] 都[と] へ 行[い] きます。 Kiotoga boraman."},{"pattern":"どこ [ へ ] も 行[い] きません／行[い] きませんでした","meaning":"Inkor gapda も yuklamasi gapdagi so''roq so''zidan keyin kelsa, so''roq so''zi anglatadigan barcha hodisa va tushunchalar rad qilinadi.","example":"どこ [ へ ] も 行[い] きません。 Hech qayerga bormayman."},{"pattern":"OT (harakatlanish vositasi)  で 行[い] きます／来[き] ます／帰[かえ] ります","meaning":"で yuklamasi harakatlanish usuli yoki vositasini ko''rsatadi. Agar で yuklamasi bilan いきます , きます , かえります va hokazo kabi harakatlanishni bildiradigan fe''llar qo''…","example":"電車[でんしゃ] で 行[い] きます。 Poyezdda boraman."},{"pattern":"OT (jonli)  と  FE’L","meaning":"Odam yoki hayvonlarni bildiradigan otlardan keyin と yuklamasi qo''llansa, harakatning birgalikda sodir etilishini bildiradi. Yakka holdagi harakat uchun ひとりで…","example":"家[か] 族[ぞく] と 日[に] 本[ほん] へ 来[き] ました。"},{"pattern":"いつ","meaning":"Vaqtni aniqlaydigan savol gaplarda なんじ , なんようび , なんがつ va なんに ち kabi なん bilan bog''liq savol so''zlari qo''llaniladi. Shuningdek, biror-bir hodisa qachon sodir b…","example":"いつ 日[に] 本[ほん] へ 来[き] ましたか。"},{"pattern":"GAP  よ","meaning":"よ yuklamasi gapning oxiriga qo''yiladi. Bu yuklama tinglovchi uchun yangi ma''lumotni anglatadi yoki so''zlovchi o''zining gaplariga to''liq aminligini anglatadi.…","example":"この 電車[でんしゃ] は 甲[こう] 子[し] 園[えん] へ 行[い] きますか。"}],"phrases":[{"ja":"京[きょう] 都[と] へ 行[い] きます。 Kiotoga boraman.","uz":""},{"ja":"日[に] 本[ほん] へ 来[き] ました。 Yaponiyaga keldim.","uz":""},{"ja":"うちへ 帰[かえ] ります。 Uyimga qaytaman.","uz":"[Eslatma] 「へ」 yuklamasi え deb talaffuz qilinadi."},{"ja":"どこ [ へ ] も 行[い] きません。 Hech qayerga bormayman.","uz":""},{"ja":"何[なに] も 食[た] べません。 Hech narsa yemayman.","uz":""},{"ja":"だれも いません。 Hech kim yoq.","uz":""},{"ja":"電車[でんしゃ] で 行[い] きます。 Poyezdda boraman.","uz":""},{"ja":"タクシーで 来[き] ました。 Taksida keldim.","uz":"Agar siz piyoda ketayotgan bo''sangiz, あるいて ( あるく ) so''zini"}]}'::jsonb, 5),
  ('m-l6', '6-dars: Kundalik faoliyat va Obyekt (Harakat fe''llari)', '第6課：動詞と目的語（〜を、〜で）', 'N5', 12, 30, '{"vocab":[{"ja":"たべます 食べます","romaji":"たべます 食べます","uz":"yemoq"},{"ja":"のみます 飲みます","romaji":"のみます 飲みます","uz":"ichmoq"},{"ja":"すいます 吸います","romaji":"すいます 吸います","uz":"chekmoq"},{"ja":"[ たばこを～ ]","romaji":"[ たばこを～ ]","uz":"(tamaki chekmoq)"},{"ja":"みます 見ます","romaji":"みます 見ます","uz":"ko''rmoq"},{"ja":"ききます 聞きます","romaji":"ききます 聞きます","uz":"eshitmoq"},{"ja":"よみます 読みます","romaji":"よみます 読みます","uz":"o''qimoq"},{"ja":"かきます 書きます","romaji":"かきます 書きます","uz":"yozmoq"},{"ja":"かいます 買います","romaji":"かいます 買います","uz":"sotib olmoq"},{"ja":"とります 撮ります","romaji":"とります 撮ります","uz":"olmoq"},{"ja":"[ しゃしんを～ ]  [ 写真を～","romaji":"[ しゃしんを～ ]  [ 写真を～","uz":"] (fotosuratga olmoq)"},{"ja":"します","romaji":"します","uz":"qilmoq, bajarmoq"},{"ja":"あいます 会います","romaji":"あいます 会います","uz":"uchratmoq"},{"ja":"[ 友達に～ ] ([ ともだちに～ ])","romaji":"[ ともだちに～ ]","uz":"(do''stini uchratmoq)"},{"ja":"ごはん","romaji":"ごはん","uz":"ovqat; qaynatilgan guruch"},{"ja":"あさごはん 朝ごはん","romaji":"あさごはん 朝ごはん","uz":"ertalabki nonushta"},{"ja":"ひるごはん 昼ごはん","romaji":"ひるごはん 昼ごはん","uz":"tushlik"},{"ja":"ばんごはん 晩ごはん","romaji":"ばんごはん 晩ごはん","uz":"kechki ovqat"},{"ja":"パン","romaji":"パン","uz":"non"},{"ja":"たまご 卵","romaji":"たまご 卵","uz":"tuxum"},{"ja":"にく 肉","romaji":"にく 肉","uz":"go''sht"},{"ja":"さかな 魚","romaji":"さかな 魚","uz":"baliq"},{"ja":"やさい 野菜","romaji":"やさい 野菜","uz":"sabzavot, poliz ekinlari"},{"ja":"くだもの 果物","romaji":"くだもの 果物","uz":"meva"},{"ja":"みず 水","romaji":"みず 水","uz":"suv"},{"ja":"おちゃ お茶","romaji":"おちゃ お茶","uz":"choy"},{"ja":"こうちゃ 紅茶","romaji":"こうちゃ 紅茶","uz":"qora choy"},{"ja":"ぎゅうにゅう 牛乳","romaji":"ぎゅうにゅう 牛乳","uz":"sut"},{"ja":"（ミルク）","romaji":"（ミルク）","uz":""},{"ja":"ジュース","romaji":"ジュース","uz":"sharbat"},{"ja":"ビール","romaji":"ビール","uz":"pivo"},{"ja":"] 酒 ([ お ] さけ [ お)","romaji":"[ お ] さけ [ お","uz":"guruchdan tayyorlangan yapon arog''i"},{"ja":"ビデオ","romaji":"ビデオ","uz":"video"},{"ja":"えいが 映画","romaji":"えいが 映画","uz":"kino"},{"ja":"ＣＤ","romaji":"ＣＤ","uz":"kompakt-disk"},{"ja":"てがみ 手紙","romaji":"てがみ 手紙","uz":"xat, maktub"},{"ja":"レポート","romaji":"レポート","uz":"hisobot; ma''ruza"},{"ja":"しゃしん 写真","romaji":"しゃしん 写真","uz":"fotosurat"},{"ja":"みせ 店","romaji":"みせ 店","uz":"do''kon"},{"ja":"レストラン","romaji":"レストラン","uz":"restoran"},{"ja":"にわ 庭","romaji":"にわ 庭","uz":"hovli, bog''"},{"ja":"しゅくだい 宿題","romaji":"しゅくだい 宿題","uz":"uyga vazifa"},{"ja":"テニス","romaji":"テニス","uz":"tennis ( ～します tennis o''ynamoq)"},{"ja":"サッカー","romaji":"サッカー","uz":"futbol ( ～します futbol o''ynamoq)"},{"ja":"お ] 花見 ([ お ] はなみ [)","romaji":"[ お ] はなみ [","uz":"gullagan sakura daraxtini tomosha qilish ( ～します ~qilmoq)"},{"ja":"なに 何","romaji":"なに 何","uz":"nima"},{"ja":"いっしょに","romaji":"いっしょに","uz":"birga"},{"ja":"ちょっと","romaji":"ちょっと","uz":"bir oz, ozgina, ozroq"},{"ja":"いつも","romaji":"いつも","uz":"har doim, doimo"},{"ja":"ときどき 時々","romaji":"ときどき 時々","uz":"ba''zan"},{"ja":"それから","romaji":"それから","uz":"undan so''ng, undan keyin; shundan so''ng, shundan keyin"},{"ja":"ええ","romaji":"ええ","uz":"ha"},{"ja":"いいですね。","romaji":"いいですね。","uz":"Qanday yaxshi."},{"ja":"わかりました。","romaji":"わかりました。","uz":"Tushundim."},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"何[なん] ですか。","romaji":"何[なん] ですか。","uz":"Nima?"},{"ja":"] 。 (じゃ、 また  [ あした)","romaji":"じゃ、 また  [ あした","uz":"Ko''rishguncha."},{"ja":"メキシコ","romaji":"メキシコ","uz":"Meksika"},{"ja":"大[おお] 阪[さか] 城[じょう] 公[こう] 園[えん]","romaji":"大[おお] 阪[さか] 城[じょう] 公[こう] 園[えん]","uz":"Osaka qal''asi bog''i"}],"grammar":[{"pattern":"OT  を FE’L (o`timli)","meaning":"を tushum kelishigi ko''rsatkichi bo''lib, o''timli fe''l sifatida ifodalangan ish-harakatning to''g''ri to''ldiruvchisini ifodalaydi. [Eslatma] を va お harflari bir…","example":"ジュースを 飲[の] みます。"},{"pattern":"OT  をします","meaning":"します fe''lining ob''ekti sifatida turli xil otlar kelishi mumkin. します fe''li ot so''z turkumi bilan ifodalangan ish-harakatning bajarilishini ifodalaydi. Quyida b…","example":""},{"pattern":"何[なに] を しますか","meaning":"Ushbu so''roq gap ma''lum bir shaxs ish-harakatining mazmuniga qaratilib, ushbu shaxs nima bilan shug''ullanishi, nima qilish niyati borligini bilish uchun qo''l…","example":"月[げつ] 曜[よう] 日[び] 何[なに] を しますか。"},{"pattern":"なん  va  なに","meaning":"なん so''zi kabi なに ham “ nima ” ma''nosini ifodalaydi. 1) なん quyidagi hollarda qo''llaniladi. (1) た , だ , な – qator harflari bilan boshlanadigan so''zlardan avval…","example":"それは 何[なん] ですか。"},{"pattern":"OT (o`rin-joy) で  FE’L","meaning":"Agar Ot (o''rin-joy) yoki joy nomidan keyin で (o''rin-payt kelishigi ko''rsatkichi) kelsa, u holda ushbu qo''shimchali so''z ish-harakat bajarilgan joyni anglatadi.","example":"駅[えき] で 新聞[しんぶん] を 買[か] います。"},{"pattern":"FE’L  ませんか","meaning":"Ushbu shaklda tugallanadigan gap so''roq va inkor ma''nosini emas, balki ish-harakatning bajarilishiga yo''naltirilgan taklif ma''nosini anglatadi. ･･･ ええ、いいですね。…","example":"一緒[いっしょ] に 京[きょう] 都[と] へ 行[い] きませんか。"},{"pattern":"FE’L  ましょう","meaning":"Ushbu tuzilmadagi gaplar so''zlovchining o''z suhbatdoshini ma''lum bir ish-harakatni birga bajarishga taklif etish ma''nosini anglatadi. Shuningdek taklifga roz…","example":"ちょっと 休[やす] みましょう。"},{"pattern":"お～","meaning":"So''zlovchining suhbatdoshiga qaratilgan hurmatini kuchaytirib ifodalash uchun unga aloqador bo''lgan so''zlarga お old qo''shimchasi qo''shilishini 3-darsda ko''ri…","example":""}],"phrases":[{"ja":"ジュースを 飲[の] みます。","uz":"Sharbatni ichaman."},{"ja":"月[げつ] 曜[よう] 日[び] 何[なに] を しますか。","uz":"Dushanba kuni nima bilan shug''ullanasiz?"},{"ja":"きのう 何[なに] を しましたか。","uz":"Kecha nima bilan shug''ullandingiz?"},{"ja":"月[げつ] 曜[よう] 日[び] は 何[なに] を しますか？","uz":"Dushanbada nima qilasiz?"},{"ja":"それは 何[なん] ですか。","uz":"U nima?"},{"ja":"何[なん] の 本ですか。 Qanday kitob?","uz":""},{"ja":"寝[ね] るまえに、何[なん] と 言[い] いますか。 Uxlashga yotishdan avval nima deyiladi?","uz":"(Qanday so''z aytish kerak?) (21-dars)"},{"ja":"テレザちゃんは 何歳[なんさい] ですか。","uz":"Tereza necha yoshda?"}]}'::jsonb, 6),
  ('m-l7', '7-dars: Qurol, Til va Sovg''a almashish (Bermoq/Olmoq)', '第7課：手段と授受（あげます・もらいます）', 'N5', 14, 35, '{"vocab":[{"ja":"切ります (きります)","romaji":"きります","uz":"kesmoq (pichoqda), qirqmoq (qaychida)"},{"ja":"送ります (おくります)","romaji":"おくります","uz":"jo''natmoq"},{"ja":"あげます","romaji":"あげます","uz":"bermoq, sovg''a qilmoq"},{"ja":"もらいます","romaji":"もらいます","uz":"olmoq"},{"ja":"貸します (かします)","romaji":"かします","uz":"qarzga bermoq, berib turmoq"},{"ja":"借ります (かります)","romaji":"かります","uz":"qarzga olmoq, olib turmoq"},{"ja":"教えます (おしえます)","romaji":"おしえます","uz":"o''rgatmoq, saboq bermoq"},{"ja":"習います (ならいます)","romaji":"ならいます","uz":"o''rganmoq, saboq olmoq"},{"ja":"かけます","romaji":"かけます","uz":"(qo''ng''iroq) qilmoq"},{"ja":"[ 電話を～ ] ([ でんわを～ ])","romaji":"[ でんわを～ ]","uz":"(telefon qilmoq, qo''ng''iroq qilmoq)"},{"ja":"手 (て)","romaji":"て","uz":"qo''l"},{"ja":"はし","romaji":"はし","uz":"hashi (ovqat yeyishda qo''llaniladigan cho''p)"},{"ja":"スプーン","romaji":"スプーン","uz":"qoshiq"},{"ja":"ナイフ","romaji":"ナイフ","uz":"pichoq"},{"ja":"フォーク","romaji":"フォーク","uz":"sanchqi (vilka)"},{"ja":"はさみ","romaji":"はさみ","uz":"qaychi"},{"ja":"ファクス","romaji":"ファクス","uz":"faks"},{"ja":"ワープロ","romaji":"ワープロ","uz":"matnli protsessor"},{"ja":"パソコン","romaji":"パソコン","uz":"shaxsiy kompyuter"},{"ja":"パンチ","romaji":"パンチ","uz":"perforator, teshik ochqich (konselyariya)"},{"ja":"ホッチキス","romaji":"ホッチキス","uz":"stepler"},{"ja":"セロテープ","romaji":"セロテープ","uz":"skoch"},{"ja":"消しゴム (けしゴム)","romaji":"けしゴム","uz":"o''chirg''ich"},{"ja":"紙 (かみ)","romaji":"かみ","uz":"qog''oz"},{"ja":"花 (はな)","romaji":"はな","uz":"gul"},{"ja":"シャツ","romaji":"シャツ","uz":"ko''ylak"},{"ja":"プレゼント","romaji":"プレゼント","uz":"sovg''a, tuhva, hadya"},{"ja":"荷物 (にもつ)","romaji":"にもつ","uz":"buyum, yuk"},{"ja":"お金 (おかね)","romaji":"おかね","uz":"pul"},{"ja":"切符 (きっぷ)","romaji":"きっぷ","uz":"chipta"},{"ja":"クリスマス","romaji":"クリスマス","uz":"Krismas bayrami (rojdestvo)"},{"ja":"父 (ちち)","romaji":"ちち","uz":"otam, dadam"},{"ja":"母 (はは)","romaji":"はは","uz":"onam, oyim"},{"ja":"お父さん (おとうさん)","romaji":"おとうさん","uz":"ota, dada / ~ning otasi"},{"ja":"お母さん (おかあさん)","romaji":"おかあさん","uz":"ona, oyi / ~ning onasi"},{"ja":"もう","romaji":"もう","uz":"allaqachon, ~ib bo''ldi(~m,~ ing); endi"},{"ja":"まだ","romaji":"まだ","uz":"hali ham"},{"ja":"これから","romaji":"これから","uz":"endi; bundan buyon"},{"ja":"[ ～、 ] すてきですね。","romaji":"[ ～、 ] すてきですね。","uz":"Bu~ buncha chiroyli!"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"ごめん ください。","romaji":"ごめん ください。","uz":"Hoy kim bor? (Birovning uyiga kirib borganda qo''llanadigan ibora)"},{"ja":"いらっしゃい。","romaji":"いらっしゃい。","uz":"Xush kelibsiz."},{"ja":"どうぞ お上[あ] がり ください。","romaji":"どうぞ お上[あ] がり ください。","uz":"Ichkariga marhamat."},{"ja":"失礼[しつれい] します。","romaji":"失礼[しつれい] します。","uz":"Rahmat. / Sizni ham bezovta qilib qo''ydim. (Ichkariga kirishda mehmon tomonidan qo''llaniladigan ibora)"},{"ja":"[ ～は ]  いかがですか。","romaji":"[ ～は ]  いかがですか。","uz":"~ga xushingiz qalay?"},{"ja":"いただきます。","romaji":"いただきます。","uz":"(Yeyish, ichishdan oldin qo''llaniladigan ibora )"},{"ja":"旅行[りょこう]","romaji":"旅行[りょこう]","uz":"sayohat, safar ( ～する sayohat qilmoq)"},{"ja":"お土産[みやげ]","romaji":"お土産[みやげ]","uz":"Odatda safardan qaytayotganda yoki biror joyga borayotganda olib boriladigan sovg''a"},{"ja":"ヨーロッパ","romaji":"ヨーロッパ","uz":"Ovro''pa"},{"ja":"スペイン","romaji":"スペイン","uz":"Ispaniya"}],"grammar":[{"pattern":"OT (qurol / vosita)  で  FE’L","meaning":"で yuklamasi biror qurol yoki vosita orqali ish-harakatning bajarilishini bildiradi.","example":"はしで 食[た] べます。"},{"pattern":"“SO`Z / GAP”  は～語[ご] で 何[なん] ですか","meaning":"Bu gap shakli, biror so''z yoki gapni boshqa tilda qanday bo''lishini so''rash uchun ishlatiladi. ･･･「 Thank you 」です。 ･･･「ありがとう」です。","example":"「ありがとう」は 英[えい] 語[ご] で 何[なん] ですか。"},{"pattern":"OT (shaxs)  に あげます、 va hokazo","meaning":"あげます , かします , おしえます kabi fe''llar harakat kimga ( bermoq, qarzga bermoq, o''rgatmoq ) qaratilganligini ko''rsatilishini talab qiladi va bu shaxsga に yuklamasi q…","example":"山[やま] 田[だ] さんは 木[き] 村[むら] さんに 花[はな] を あげました。"},{"pattern":"OT (shaxs)  に もらいます、  va hokazo","meaning":"もらいます , かります , ならいます kabi fe''llar, qabul qiluvchi shaxsning harakatini izohlaydi. に qo''shimchasi taqdim etayotgan shaxsga qo''shiladi. Bunday gap misollarida…","example":"木[き] 村[むら] さんは 山[やま] 田[だ] さんに 花[はな] を もらいました。"},{"pattern":"もう  FE’L  ました","meaning":"“ もう ” “ allaqachon ” degan ma''noni bildirib, “FE''L ました ” bilan birga qo''llaniladi. Shunday qilib, “FE''L ました ” harakatning allaqachon tugallanganligini bildi…","example":"もう 荷[に] 物[もつ] を 送[おく] りましたか。"}],"phrases":[{"ja":"はしで 食[た] べます。","uz":"Hashi(cho''pak)da yeyman."},{"ja":"日[に] 本[ほん] 語[ご] で レポートを 書[か] きます。","uz":"Yapon tilida hisobot yozaman."},{"ja":"「ありがとう」は 英[えい] 語[ご] で 何[なん] ですか。","uz":"“Arigatou” ingliz tilida nima bo''ladi? …“Thank you” bo''ladi."},{"ja":"「 Thank you 」は 日[に] 本[ほん] 語[ご] で 何[なん] ですか。","uz":"“Thank you” yapon tilida nima bo''ladi? …“Arigatou” bo''ladi."},{"ja":"山[やま] 田[だ] さんは 木[き] 村[むら] さんに 花[はな] を あげました。","uz":"Janob Yamada Kimura xonimga gul berdi."},{"ja":"イーさんに 本[ほん] を 貸[か] しました。","uz":"I xonimga kitob berib turdim."},{"ja":"太[た] 郎[ろう] 君[くん] に 英[えい] 語[ご] を 教[おし] えます。","uz":"Taroga ingliz tilini o''rgataman."},{"ja":"会社[かいしゃ] に 電[でん] 話[わ] を かけます。","uz":"（へ）"}]}'::jsonb, 7),
  ('m-l8', '8-dars: Sifatlar (I-sifat va Na-sifatlar)', '第8課：形容詞（い形容詞・な形容詞）', 'N5', 16, 40, '{"vocab":[{"ja":"ハンサム [ な ]","romaji":"ハンサム [ な ]","uz":"xushro''y, chiroyli (erkak kishiga nisbatan qo''llaniladi.)"},{"ja":"きれい [ な ]","romaji":"きれい [ な ]","uz":"xushro''y, chiroyli, go''zal; toza"},{"ja":"静か [ な ] (しずか [ な ])","romaji":"しずか [ な ]","uz":"tinch, osoyishta, osuda"},{"ja":"にぎやか [ な ]","romaji":"にぎやか [ な ]","uz":"gavjum, sershovqin"},{"ja":"有名 [ な ] (ゆうめい [ な ])","romaji":"ゆうめい [ な ]","uz":"mashhur"},{"ja":"親切 [ な ] (しんせつ [ な ])","romaji":"しんせつ [ な ]","uz":"mehribon"},{"ja":"元気 [ な ] (げんき [ な ])","romaji":"げんき [ な ]","uz":"sog''lom, baquvvat"},{"ja":"暇 [ な ] (ひま [ な ])","romaji":"ひま [ な ]","uz":"bo''sh (vaqt),"},{"ja":"便利 [ な ] (べんり [ な ])","romaji":"べんり [ な ]","uz":"qulay"},{"ja":"すてき [ な ]","romaji":"すてき [ な ]","uz":"chiroyli, ajoyib"},{"ja":"大きい (おおきい)","romaji":"おおきい","uz":"katta"},{"ja":"小さい (ちいさい)","romaji":"ちいさい","uz":"kichik"},{"ja":"新しい (あたらしい)","romaji":"あたらしい","uz":"yangi"},{"ja":"古い (ふるい)","romaji":"ふるい","uz":"eski"},{"ja":"いい（よい）","romaji":"いい（よい）","uz":"yaxshi"},{"ja":"悪い (わるい)","romaji":"わるい","uz":"yomon"},{"ja":"暑い、熱い (あつい)","romaji":"あつい","uz":"issiq"},{"ja":"寒い (さむい)","romaji":"さむい","uz":"sovuq"},{"ja":"冷たい (つめたい)","romaji":"つめたい","uz":"sovuq, yaxtak (qo''l bilan sezish mumkin bo''lgan narsalarga nisbatan qo''llaniladi)"},{"ja":"難しい (むずかしい)","romaji":"むずかしい","uz":"qiyin"},{"ja":"易しい (やさしい)","romaji":"やさしい","uz":"oson"},{"ja":"高い (たかい)","romaji":"たかい","uz":"qimmat; baland"},{"ja":"安い (やすい)","romaji":"やすい","uz":"arzon"},{"ja":"低い (ひくい)","romaji":"ひくい","uz":"past"},{"ja":"おもしろい","romaji":"おもしろい","uz":"qiziqarli"},{"ja":"おいしい","romaji":"おいしい","uz":"mazali"},{"ja":"忙しい (いそがしい)","romaji":"いそがしい","uz":"band"},{"ja":"楽しい (たのしい)","romaji":"たのしい","uz":"qiziqarli, mazmunli (vaqtga nisbatan)"},{"ja":"白い (しろい)","romaji":"しろい","uz":"oq"},{"ja":"黒い (くろい)","romaji":"くろい","uz":"qora"},{"ja":"赤い (あかい)","romaji":"あかい","uz":"qizil"},{"ja":"青い (あおい)","romaji":"あおい","uz":"ko''k"},{"ja":"桜 (さくら)","romaji":"さくら","uz":"olcha (sakura)"},{"ja":"山 (やま)","romaji":"やま","uz":"tog''"},{"ja":"町 (まち)","romaji":"まち","uz":"(kichik) shahar"},{"ja":"食べ物 (たべもの)","romaji":"たべもの","uz":"yegulik"},{"ja":"車 (くるま)","romaji":"くるま","uz":"mashina"},{"ja":"所 (ところ)","romaji":"ところ","uz":"joy, yer"},{"ja":"寮 (りょう)","romaji":"りょう","uz":"yotoqxona"},{"ja":"勉強 (べんきょう)","romaji":"べんきょう","uz":"dars, mashg''ulot"},{"ja":"生活 (せいかつ)","romaji":"せいかつ","uz":"turmush, hayot"},{"ja":"[ お ] 仕事 ([ お ] しごと)","romaji":"[ お ] しごと","uz":"ish ( ～をします ishlamoq)"},{"ja":"どう","romaji":"どう","uz":"qanday, qanaqa"},{"ja":"どんな～","romaji":"どんな～","uz":"qanday ~, qanaqa ~"},{"ja":"どれ","romaji":"どれ","uz":"qaysi"},{"ja":"とても","romaji":"とても","uz":"juda"},{"ja":"あまり","romaji":"あまり","uz":"uncha ~ emas, unchalik ~ emas (inkor bilan qo''llaniladi)"},{"ja":"そして","romaji":"そして","uz":"keyin"},{"ja":"～が、～","romaji":"～が、～","uz":"~-yu,~ . ; ~. Lekin, ~."},{"ja":"お元気ですか。 (おげんきですか。)","romaji":"おげんきですか。","uz":"Yaxshimisiz? / Salomatmisiz?"},{"ja":"そうですね。","romaji":"そうですね。","uz":"Nimasini aytsam sizga… .; Rost aytasiz.; Ha-ya (Ushbu ibora suhbatning uzilib qolmasligiga xizmat qilib, “ma''qullash” yoki “fikr jamlash” ni ifodalaydi.)"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"日[に] 本[ほん] の 生活[せいかつ] に 慣[な] れましたか。","romaji":"日[に] 本[ほん] の 生活[せいかつ] に 慣[な] れましたか。","uz":"Siz Yaponiya turmush tarziga ko''nikdingizmi?"},{"ja":"[ ～、 ] もう 一杯[いっぱい] いかがですか。","romaji":"[ ～、 ] もう 一杯[いっぱい] いかがですか。","uz":"Yana bir piyola (chashka, kosa) ~ ichasizmi?"},{"ja":"いいえ、けっこうです。","romaji":"いいえ、けっこうです。","uz":"Yo''q, rahmat."},{"ja":"もう ～です [ ね ] 。","romaji":"もう ～です [ ね ] 。","uz":"Endi ~-a?"},{"ja":"そろそろ 失礼[しつれい] します。","romaji":"そろそろ 失礼[しつれい] します。","uz":"Endi bizga ruxsat."},{"ja":"ください。 (また いらっしゃって)","romaji":"また いらっしゃって","uz":"Yana keling."},{"ja":"富[ふ] 士[じ] 山[さん]","romaji":"富[ふ] 士[じ] 山[さん]","uz":"Fuji togi"},{"ja":"琵琶湖[びわこ]","romaji":"琵琶湖[びわこ]","uz":"Biva ko''li"},{"ja":"シャンハイ","romaji":"シャンハイ","uz":"Shanxay ( 上海 )"},{"ja":"「七[しち] 人[にん] の侍[さむらい] 」","romaji":"「七[しち] 人[にん] の侍[さむらい] 」","uz":"“Yetti samuray”"},{"ja":"金[きん] 閣[かく] 寺[じ]","romaji":"金[きん] 閣[かく] 寺[じ]","uz":"Kinkaji ibodatxonasi"}],"grammar":[{"pattern":"SIFATLAR","meaning":"Sifatlar 1) kesim, 2) aniqlovchi-ot o''rnida kelishi mumkin. Ular o''zgaradi va o''zgarishlariga qarab 2 turga bo''linadilar: 1. い ga tugaydigan sifatlar va 2. な…","example":""},{"pattern":"OT  は な -SIFAT  [ な ] です","meaning":"OT は い -SIFAT (~ い ) です 1) Gapda kesim vazifasida keladigan sifatdan keyingi です suhbatdoshga bo''lgan hurmatni bildiradi. い -sifatdan keyin です kelsa い qoladi,…","example":"ワット先生[せんせい] は 親切[しんせつ] です。"},{"pattern":"な -SIFAT  な  OT","meaning":"い -SIFAT ( ～い ) OT Sifat otdan oldin aniqlovchi sifatida keladi, otdan oldin な -sifatga “ な ” qo''shimchasi qo''shiladi.","example":"ワット先生[せんせい] は 親切[しんせつ] な 先生[せんせい] です。"},{"pattern":"とても／あまり","meaning":"とても , あまり –ravish. Ular sifatdan oldin qo''yilib darajani ko''rsatib keladi. とても ijobiy ma''nodagi gaplarda kelib, “ juda ” degan ma''noni anglatadi. あまり esa ink…","example":"ペキンは とても 寒[さむ] いです。"},{"pattern":"OT  は どうですか","meaning":"Bunday so''roq gap shakli biror kishi suhbatdoshining biror bir narsa, joy va kishi haqidagi fikri hamda taassuroti bilan qiziqqanda qo''llaniladi. ･･･楽[たの] しい…","example":"日[に] 本[ほん] の 生活[せいかつ] は どうですか。"},{"pattern":"OT １ は どんな OT 2  ですか","meaning":"Savolning bu ko''rinishi OT 1 ga ta''rif berishda qo''llaniladi. Bu yerda OT 2 OT 1 ga tegishli daraja bo''lib keladi. どんな so''roq so''zidan so''ng albatta ot kelad…","example":"奈良[なら] は どんな 町[まち] ですか。"},{"pattern":"GAP 1 が、 GAP 2","meaning":"が - bu bog''lovchi “ lekin ” degan ma''noni bildirib, gaplarni bog''lashda qo''llaniladi.","example":"日[に] 本[ほん] の 食[た] べ物[もの] は おいしいですが、高[たか] いです。"},{"pattern":"どれ","meaning":"Bu so''roq so''z suhbatdoshdan uch yoki undan ham ko''p predmetlardan birini tanlashni talab qiladi. ⑯ ミラーさんの 傘[かさ] は どれですか。 Janob Millerning soyaboni qaysi? ･･…","example":""}],"phrases":[{"ja":"ワット先生[せんせい] は 親切[しんせつ] です。","uz":"Vat domla mehribon."},{"ja":"富[ふ] 士[じ] 山[さん] は 高[たか] いです。","uz":"Fuji tog''i baland."},{"ja":"あそこは 静[しず] かじゃ ありません。","uz":"Anavi yer tinch emas."},{"ja":"この 本[ほん] は おもしろくないです。","uz":"Bu kitob qiziqarli emas."},{"ja":"ペキンは 寒[さむ] いですか。","uz":"Pekin sovuqmi?"},{"ja":"琵琶湖[びわこ] の水[みず] は きれいですか。","uz":"Biva ko''lining suvi tozami?"},{"ja":"ワット先生[せんせい] は 親切[しんせつ] な 先生[せんせい] です。","uz":"Vat domla mehribon domla."},{"ja":"富[ふ] 士[じ] 山[さん] は 高[たか] い 山[やま] です。","uz":"Fuji tog''i - baland tog''."}]}'::jsonb, 8),
  ('m-l9', '9-dars: Qobiliyat, Xohish va Sabab (Yoqtirish/Tushunish)', '第9課：好き・上手・わかります・から', 'N5', 18, 30, '{"vocab":[{"ja":"わかります","romaji":"わかります","uz":"tushunmoq"},{"ja":"あります","romaji":"あります","uz":"bor (bo''lmoq)"},{"ja":"好き [ な ] (すき [ な ])","romaji":"すき [ な ]","uz":"yoqimli, yoqtirgan, suygan"},{"ja":"嫌い [ な ] (きらい [ な ])","romaji":"きらい [ な ]","uz":"yoqimsiz, yoqtirmagan, suymagan"},{"ja":"上手 [ な ] (じょうず [ な ])","romaji":"じょうず [ な ]","uz":"mohir, usta, epli, zo''r"},{"ja":"下手 [ な ] (へた [ な ])","romaji":"へた [ な ]","uz":"epsiz, no''noq, mahoratsiz"},{"ja":"料理 (りょうり)","romaji":"りょうり","uz":"ovqat, taom"},{"ja":"飲み物 (のみもの)","romaji":"のみもの","uz":"ichimlik"},{"ja":"スポーツ","romaji":"スポーツ","uz":"sport"},{"ja":"野球 (やきゅう)","romaji":"やきゅう","uz":"beysbol"},{"ja":"ダンス","romaji":"ダンス","uz":"raqs"},{"ja":"音楽 (おんがく)","romaji":"おんがく","uz":"musiqa"},{"ja":"歌 (うた)","romaji":"うた","uz":"qo''shiq"},{"ja":"クラシック","romaji":"クラシック","uz":"klassik, mumtoz"},{"ja":"ジャズ","romaji":"ジャズ","uz":"jaz"},{"ja":"コンサート","romaji":"コンサート","uz":"konsert"},{"ja":"カラオケ","romaji":"カラオケ","uz":"karaoke"},{"ja":"歌舞伎 (かぶき)","romaji":"かぶき","uz":"kabuki"},{"ja":"絵 (え)","romaji":"え","uz":"rasm"},{"ja":"字 (じ)","romaji":"じ","uz":"harf"},{"ja":"漢字 (かんじ)","romaji":"かんじ","uz":"belgi, iyeroglif"},{"ja":"ひらがな","romaji":"ひらがな","uz":"hiragana (yapon alifbosi)"},{"ja":"かたかな","romaji":"かたかな","uz":"katakana (yapon alifbosi)"},{"ja":"ローマ字 (ローマじ)","romaji":"ローマじ","uz":"rim yozuvi (lotin yozuvi)"},{"ja":"細かい お金 (こまかい おかね)","romaji":"こまかい おかね","uz":"mayda pul"},{"ja":"チケット","romaji":"チケット","uz":"chipta"},{"ja":"時間 (じかん)","romaji":"じかん","uz":"vaqt"},{"ja":"用事 (ようじ)","romaji":"ようじ","uz":"ish, yumush"},{"ja":"約束 (やくそく)","romaji":"やくそく","uz":"va''da"},{"ja":"ご主人 (ごしゅじん)","romaji":"ごしゅじん","uz":"xo''jayin(ingiz), er(ingiz)"},{"ja":"夫／主人 (おっと／しゅじん)","romaji":"おっと／しゅじん","uz":"xo''jayin(im), er(im)"},{"ja":"奥さん (おくさん)","romaji":"おくさん","uz":"ayol(ingiz), xotin(ingiz)"},{"ja":"妻／家内 (つま／かない)","romaji":"つま／かない","uz":"ayol(im), xotin(im)"},{"ja":"子ども (こども)","romaji":"こども","uz":"bola, farzand"},{"ja":"よく","romaji":"よく","uz":"tez-tez; yaxshi; rosa"},{"ja":"だいたい","romaji":"だいたい","uz":"deyarli"},{"ja":"たくさん","romaji":"たくさん","uz":"ko''p"},{"ja":"少し (すこし)","romaji":"すこし","uz":"ozgina, ozroq, biroz, kam"},{"ja":"全然 (ぜんぜん)","romaji":"ぜんぜん","uz":"umuman, hech"},{"ja":"早く、速く (はやく)","romaji":"はやく","uz":"erta, barvaqt; tez"},{"ja":"～から","romaji":"～から","uz":"~dan"},{"ja":"どうして","romaji":"どうして","uz":"nima uchun"},{"ja":"残念です [ ね ] 。 (ざんねんです [ ね ] 。)","romaji":"ざんねんです [ ね ] 。","uz":"Afsus."},{"ja":"すみません。","romaji":"すみません。","uz":"Kechirasiz"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"もしもし","romaji":"もしもし","uz":"allo, eshitaman"},{"ja":"ああ","romaji":"ああ","uz":"A"},{"ja":"いっしょに いかがですか。","romaji":"いっしょに いかがですか。","uz":"Birga (fe''l~)maysizmi?"},{"ja":"[ ～は ]  ちょっと・・・・。","romaji":"[ ～は ]  ちょっと・・・・。","uz":"~ biroz… . (rad etish iborasi)"},{"ja":"だめですか。","romaji":"だめですか。","uz":"Bo''lmaydimi?"},{"ja":"また 今[こん] 度[ど] お願[ねが] いします。","romaji":"また 今[こん] 度[ど] お願[ねが] いします。","uz":"Yanagi safar. / Boshqa safar"},{"ja":"小[お] 沢[ざわ] 征[せい] 爾[じ]","romaji":"小[お] 沢[ざわ] 征[せい] 爾[じ]","uz":"Ozava Seiji (1935-), taniqli yapon dirijori"}],"grammar":[{"pattern":"1.","meaning":"OT が 好[す] きです／嫌[きら] いです／上[じょう] 手[ず] です／下手[へた] です Ish- harakatning bajarilishiga qaratilgan o''timli fe''l bilan izohlangan so''zga qarashli to''ldiruvchilardan s…","example":"私[わたし] は イタリア料[りょう] 理[り] が 好[す] きです。 Men  Italiya taomlarni yoqtiraman."},{"pattern":"どんな OT","meaning":"8-darsda o''rgangan どんな so''roq so''zi o''zidan keyin OTni talab qiladi va suhbatdoshdan ma''lum bir guruhdagi predmetlar orasidan aynan bir predmet yoki shaxsni…","example":"どんな スポーツが 好[す] きですか。 Qaysi sport turini yoqtirasiz?"},{"pattern":"よく／だいたい／たくさん／少[すこ] し／あまり／全然[ぜんぜん]","meaning":"Ushbu ravishlar fe''llardan oldin keladi. Quyida ularning qo''llanilish jadvali keltirilgan: daraja ravish + tasdiq ravish + inkor yuqori よく わかります だいたい わかります p…","example":"英[えい] 語[ご] が よく わかります。 Ingliz tilini yaxshi bilaman."},{"pattern":"GAP 1  から、 GAP 2","meaning":"から bog''lovchisi ikki gapni bir-biriga bog''lab, ularda sabab - natija aloqalarini ko''rsatadi. GAP 1 GAP 2 ning sababini ifodalaydi. Shuningdek, avval GAP 2 ke…","example":"時[じ] 間[かん] が ありませんから、新聞[しんぶん] を 読[よ] みません。"},{"pattern":"どうして","meaning":"どうして so''roq so''zi suhbatdoshdan sababni so''rab keladi. Shuningdek, どうしてですか so''rog''i suhbatdoshning aytgan gapiga izoh so''rayotgan paytda qo''llaniladi. 子[こ] 供…","example":"どうして 朝[あさ] 新聞[しんぶん] を 読[よ] みませんか。 Nima uchun ertalab gazeta o`qimaysiz?"}],"phrases":[{"ja":"私[わたし] は イタリア料[りょう] 理[り] が 好[す] きです。 Men  Italiya taomlarni yoqtiraman.","uz":""},{"ja":"私[わたし] は 日[に] 本[ほん] 語[ご] が わかります。 Men yapon tilini tushunaman.","uz":""},{"ja":"私[わたし] は 車[くるま] が あります。 Menda mashina bor.","uz":""},{"ja":"どんな スポーツが 好[す] きですか。 Qaysi sport turini yoqtirasiz?","uz":"･･･サッカーが 好[す] きです。 …Futbolni yoqtiraman."},{"ja":"英[えい] 語[ご] が よく わかります。 Ingliz tilini yaxshi bilaman.","uz":""},{"ja":"英[えい] 語[ご] が 少し わかります。 Ingliz tilini biroz bilaman.","uz":""},{"ja":"英[えい] 語[ご] が あまり わかりません。 Ingliz tilini uncha bilmayman.","uz":""},{"ja":"お金[かね] が たくさん あります。 Pulim ko`p.","uz":""}]}'::jsonb, 9),
  ('m-l10', '10-dars: Mavjudlik va Joylashuv (Insonlar va Buyumlar)', '第10課：存在（あります・います・場所）', 'N5', 10, 35, '{"vocab":[{"ja":"います","romaji":"います","uz":"bor (bo''lmoq) (jonli narsalarga)"},{"ja":"あります","romaji":"あります","uz":"bor (bo''lmoq) (jonsiz narsalarga)"},{"ja":"いろいろ [ な ]","romaji":"いろいろ [ な ]","uz":"har xil, turli xil"},{"ja":"男の 人 (おとこの ひと)","romaji":"おとこの ひと","uz":"erkak kishi"},{"ja":"女の 人 (おんなの ひと)","romaji":"おんなの ひと","uz":"ayol kishi"},{"ja":"男の 子 (おとこの こ)","romaji":"おとこの こ","uz":"o''g''il bola"},{"ja":"女の 子 (おんなの こ)","romaji":"おんなの こ","uz":"qiz bola"},{"ja":"犬 (いぬ)","romaji":"いぬ","uz":"kuchuk, it"},{"ja":"猫 (ねこ)","romaji":"ねこ","uz":"mushuk"},{"ja":"木 (き)","romaji":"き","uz":"daraxt"},{"ja":"物 (もの)","romaji":"もの","uz":"narsa, buyum"},{"ja":"フイルム","romaji":"フイルム","uz":"fototasma"},{"ja":"電池 (でんち)","romaji":"でんち","uz":"batareya"},{"ja":"箱 (はこ)","romaji":"はこ","uz":"quti"},{"ja":"スイッチ","romaji":"スイッチ","uz":"viklyuchatel (elektr tokini ulaydigan va ayiradigan asbob)"},{"ja":"冷蔵庫 (れいぞうこ)","romaji":"れいぞうこ","uz":"muzlatgich"},{"ja":"テーブル","romaji":"テーブル","uz":"stol"},{"ja":"ベッド","romaji":"ベッド","uz":"krovat"},{"ja":"棚 (たな)","romaji":"たな","uz":"tokcha"},{"ja":"ドア","romaji":"ドア","uz":"eshik"},{"ja":"窓 (まど)","romaji":"まど","uz":"deraza"},{"ja":"ポスト","romaji":"ポスト","uz":"pochta qutisi"},{"ja":"ビル","romaji":"ビル","uz":"(baland) bino"},{"ja":"公園 (こうえん)","romaji":"こうえん","uz":"xiyobon (park, bog'')"},{"ja":"喫茶店 (きっさてん)","romaji":"きっさてん","uz":"qahvaxona"},{"ja":"本屋 (ほんや)","romaji":"ほんや","uz":"kitob do''koni"},{"ja":"～屋 (～や)","romaji":"～や","uz":"~do''koni"},{"ja":"乗り場 (のりば)","romaji":"のりば","uz":"bekat"},{"ja":"県 (けん)","romaji":"けん","uz":"viloyat"},{"ja":"上 (うえ)","romaji":"うえ","uz":"ust, tepa, yuqori"},{"ja":"下 (した)","romaji":"した","uz":"ost, past"},{"ja":"前 (まえ)","romaji":"まえ","uz":"old"},{"ja":"後ろ (うしろ)","romaji":"うしろ","uz":"orqa"},{"ja":"右 (みぎ)","romaji":"みぎ","uz":"o''ng Yapon tilida"},{"ja":"左 (ひだり)","romaji":"ひだり","uz":"chap bu so''zlar ot"},{"ja":"中 (なか)","romaji":"なか","uz":"ich, ichkari hisoblanadi"},{"ja":"外 (そと)","romaji":"そと","uz":"tashqari"},{"ja":"隣 (となり)","romaji":"となり","uz":"yon, qo''shni"},{"ja":"近く (ちかく)","romaji":"ちかく","uz":"yaqin"},{"ja":"間 (あいだ)","romaji":"あいだ","uz":"ora, o''rta"},{"ja":"～や～  [ など ]","romaji":"～や～  [ など ]","uz":"~ va ~ ［ kabilar ］"},{"ja":"いちばん～","romaji":"いちばん～","uz":"eng~ ( いちばん うえ eng yuqori)"},{"ja":"～段目 (～だんめ)","romaji":"～だんめ","uz":"~(i)nchi tokcha, ~(i)nchi qator"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"[ どうも ]  すみません。","romaji":"[ どうも ]  すみません。","uz":"Katta rahmat (bu yerda “kechirim” emas, minnatdorchilik ma''nosini anglatadi)"},{"ja":"チリソース","romaji":"チリソース","uz":"chili sousi (qizil garimdoridan tayyorlangan achchiq sous)"},{"ja":"奥[おく]","romaji":"奥[おく]","uz":"ichkari, qari"},{"ja":"スパイス・コーナー","romaji":"スパイス・コーナー","uz":"ziravorlar bo''limi"},{"ja":"東京[とうきょう] ディズニーランド","romaji":"東京[とうきょう] ディズニーランド","uz":"Tokio Disneylendi"},{"ja":"ユニューヤ・ストア","romaji":"ユニューヤ・ストア","uz":"supermarket nomi (o''ylab topilgan)"}],"grammar":[{"pattern":"OT  が あります／います","meaning":"Yuqoridagi gap namunasi biror predmet yoki tirik jonning mavjudligini bildirish uchun qo''llaniladi. Gapda ushbu predmet yoki jonli ob''ektlar ega vazifasida k…","example":"コンピューターが あります。 Kompyuter bor (mavjud)."},{"pattern":"OT 1 (o`rin-joy) に OT 2  が あります／います","meaning":"1) OT 2 joylashgan o''rin-joy nomidan keyin に yuklamasi qo''shiladi. に so''roq olmoshi predmetlarga, だれ esa tirik ob''yektlarga tegishli.","example":"わたしの 部屋[へや] に机[つくえ] が あります。  Mening xonamda stol bor."},{"pattern":"OT 1  は  OT 2 (o`rin-joy) に あります／います","meaning":"1) ushbu gap namunasida so''zlovchi OT 1 ni suhbat mavzusi qilib olib, uning qayerda joylashganligini tushuntiradi. Gap mavzusi ham so''zlovchiga, ham tinglovc…","example":"東[とう] 京[きょう] ディズニーランドは 千[ち] 葉[ば] 県[けん] に あります。"},{"pattern":"OT 1 (predmet / inson / o`rin-joy) の OT 2 (holat)","meaning":"うえ , した , まえ , うしろ , みぎ , ひだり , なか , そと , となり , ちかく va あいだ kabi otlar makon-bo''shliqdagi o''rin-joyni bildiradi. [Eslatma] Agar kesim sifatida keladigan fe''l…","example":"机[つくえ] の 上[うえ] に 写真[しゃしん] が あります。 Stolning ustida surat bor."},{"pattern":"OT 1 や  OT 2","meaning":"や yuklamasi bir xil turdagi otlarni o''zaro bog''laydi. Agar と yuklamasi hamma predmetlarni birma-bir sanab o''tsa, や yuklamasi bir qancha predmetlardan bir-ikk…","example":""},{"pattern":"So`z (so`zlar)  ですか","meaning":"か yuklamasi tasdiq gaplarda qo''llaniladi. So''zlovchi tasdiqlamoqchi bo''lgan so''z yoki so''zlarni aytib, quyidagi namuna orqali tasdiqlaydi. ⑳ すみません、ユニューヤ・ストアは…","example":""},{"pattern":"チリソースは ありませんか","meaning":"Mazkur darsning “Suhbat”ida 「チリソースは ありませんか」 degan ibora uchraydi. Inkor shaklidagi ありませんか darak shaklidagi ありますか o''rniga qo''llanilib, savolni to''g''ridan-to''g…","example":""}],"phrases":[{"ja":"コンピューターが あります。 Kompyuter bor (mavjud).","uz":""},{"ja":"桜[さくら] が あります。 Olcha daraxti bor (mavjud).","uz":""},{"ja":"公園[こうえん] が あります。 Bog` bor (mavjud).","uz":"2) Agar mazkur ob''ekt jonli va o''zi harakatlanadigan bo''lsa, います fe''li qo''llaniladi."},{"ja":"男[おとこ] の人[ひと] が います。 Erkak kishi bor.","uz":""},{"ja":"犬[いぬ] が います。 Kuchuk bor.","uz":""},{"ja":"わたしの 部屋[へや] に机[つくえ] が あります。  Mening xonamda stol bor.","uz":""},{"ja":"事[じ] 務[む] 所[しょ] に ミラーさんが います。 Idorada janob Miller bor.","uz":"2) Bu tuzilmadan foydalanib, nima yoki kim qayerdaligi haqida savol tuzsa bo''ladi. な"},{"ja":"地下[ちか] に 何[なに] が ありますか。 Yer osti qavatida nima joylashgan?","uz":"･･･レストランが あります。 … Restoran joylashgan."}]}'::jsonb, 10),
  ('m-l11', '11-dars: Sanoq so''zlar, Muddat va Miqdor', '第11課：助数詞・期間・数量', 'N5', 12, 40, '{"vocab":[{"ja":"います","romaji":"います","uz":"bor (bo''lmoq)"},{"ja":"[ 子供が～ ] ([ こどもが～ ])","romaji":"[ こどもが～ ]","uz":"(bolasi bor)"},{"ja":"[ 日本に～ ] ([ にほんに～ ])","romaji":"[ にほんに～ ]","uz":"(Yaponiyada bo''lmoq)"},{"ja":"かかります","romaji":"かかります","uz":"sarf bo''lmoq, ketmoq (pul yoki vaqt)"},{"ja":"休みます (やすみます)","romaji":"やすみます","uz":"dam olmoq; qoldirmoq"},{"ja":"[ 会社を ] ([ かいしゃを～ ])","romaji":"[ かいしゃを～ ]","uz":"(ishga chiqmaslik)"},{"ja":"１つ (ひとつ)","romaji":"ひとつ","uz":"bitta"},{"ja":"２つ (ふたつ)","romaji":"ふたつ","uz":"ikkita"},{"ja":"３つ (みっつ)","romaji":"みっつ","uz":"uchta"},{"ja":"４つ (よっつ)","romaji":"よっつ","uz":"to''rtta Jonsiz"},{"ja":"５つ (いつつ)","romaji":"いつつ","uz":"beshta predmetlarni"},{"ja":"６つ (むっつ)","romaji":"むっつ","uz":"oltita sanashda"},{"ja":"７つ (ななつ)","romaji":"ななつ","uz":"yettita qo''llaniladi"},{"ja":"８つ (やっつ)","romaji":"やっつ","uz":"sakkizta"},{"ja":"９つ (ここのつ)","romaji":"ここのつ","uz":"to''qqizta"},{"ja":"１０ (とお)","romaji":"とお","uz":"o''nta"},{"ja":"いくつ","romaji":"いくつ","uz":"qancha, nechta"},{"ja":"１人 (ひとり)","romaji":"ひとり","uz":"bitta, bir kishi"},{"ja":"２人 (ふたり)","romaji":"ふたり","uz":"ikkita, ikki kishi"},{"ja":"～人 (～にん)","romaji":"～にん","uz":"~kishi, ~odam (sanoq suffiksi)"},{"ja":"～台 (～だい)","romaji":"～だい","uz":"~ta (texnika sanoq suffiksi)"},{"ja":"～枚 (～まい)","romaji":"～まい","uz":"~ta (yupqa narsalar sanoq suffiksi)"},{"ja":"～回 (～かい)","romaji":"～かい","uz":"~marta, ~bor (takror ish-harakat sanoq suffiksi)"},{"ja":"りんご","romaji":"りんご","uz":"olma"},{"ja":"みかん","romaji":"みかん","uz":"mandarin"},{"ja":"サンドイッチ","romaji":"サンドイッチ","uz":"sendvich"},{"ja":"カレー [ ライス ]","romaji":"カレー [ ライス ]","uz":"karerays (taom nomi) [karri sousi qaynatilgan guruch bilan]"},{"ja":"アイスクリーム","romaji":"アイスクリーム","uz":"muzqaymoq"},{"ja":"切手 (きって)","romaji":"きって","uz":"pochta markasi"},{"ja":"はがき","romaji":"はがき","uz":"otkritka"},{"ja":"封筒 (ふうとう)","romaji":"ふうとう","uz":"konvert"},{"ja":"速達 (そくたつ)","romaji":"そくたつ","uz":"tezkor pochta, ekspress pochta"},{"ja":"書留 (かきとめ)","romaji":"かきとめ","uz":"buyurtmali pochta"},{"ja":"エアメール","romaji":"エアメール","uz":"avia pochta"},{"ja":"（航空便） (（こうくうびん）)","romaji":"（こうくうびん）","uz":"avia pochta"},{"ja":"船便 (ふなびん)","romaji":"ふなびん","uz":"dengiz pochtasi"},{"ja":"両親 (りょうしん)","romaji":"りょうしん","uz":"ota-ona"},{"ja":"兄弟 (きょうだい)","romaji":"きょうだい","uz":"farzandlar, aka-ukalar"},{"ja":"兄 (あに)","romaji":"あに","uz":"akam"},{"ja":"お兄さん (おにいさん)","romaji":"おにいさん","uz":"akangiz,akasi"},{"ja":"姉 (あね)","romaji":"あね","uz":"opam"},{"ja":"お姉さん (おねえさん)","romaji":"おねえさん","uz":"opangiz, opasi"},{"ja":"弟 (おとうと)","romaji":"おとうと","uz":"ukam"},{"ja":"弟さん (おとうとさん)","romaji":"おとうとさん","uz":"ukangiz, ukasi"},{"ja":"妹 (いもうと)","romaji":"いもうと","uz":"singlim"},{"ja":"妹さん (いもうとさん)","romaji":"いもうとさん","uz":"singlingiz, singlisi"},{"ja":"外国 (がいこく)","romaji":"がいこく","uz":"chet el, xorij"},{"ja":"～時間 (～じかん)","romaji":"～じかん","uz":"~ soat"},{"ja":"～週間 (～しゅうかん)","romaji":"～しゅうかん","uz":"~ hafta"},{"ja":"～か月 (～かげつ)","romaji":"～かげつ","uz":"~ oy"},{"ja":"～年 (～ねん)","romaji":"～ねん","uz":"~ yil"},{"ja":"～ぐらい","romaji":"～ぐらい","uz":"~lar, ~cha, taxminan~"},{"ja":"どのぐらい","romaji":"どのぐらい","uz":"qancha (vaqt)"},{"ja":"全部で (ぜんぶで)","romaji":"ぜんぶで","uz":"hammasi bo''lib"},{"ja":"みんな","romaji":"みんな","uz":"hamma, barcha"},{"ja":"～だけ","romaji":"～だけ","uz":"faqat"},{"ja":"いらっしゃいませ。","romaji":"いらっしゃいませ。","uz":"Xush kelibsiz."},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"いい   [ お ] 天[てん] 気[き] ですね。","romaji":"いい   [ お ] 天[てん] 気[き] ですね。","uz":"Yaxshi ob-havo-ya?"},{"ja":"お出[で] かけですか。","romaji":"お出[で] かけですか。","uz":"Ko''chagami?"},{"ja":"ちょっと ～まで。","romaji":"ちょっと ～まで。","uz":"~ga borib kelaman."},{"ja":"行[い] って いらっしゃい。","romaji":"行[い] って いらっしゃい。","uz":"Yaxshi borib keling(lar)."},{"ja":"行[い] って まいります。","romaji":"行[い] って まいります。","uz":"Yaxshi qoling(lar)."},{"ja":"それから","romaji":"それから","uz":"yana"},{"ja":"オーストラリア","romaji":"オーストラリア","uz":"Avstraliya"}],"grammar":[{"pattern":"Miqdor sonlarning ifodalanishi","meaning":"1) ひとつ、ふたつ･･･････････とお Bu so''zlar 10 tagacha bo''lgan narsa buyumlarning miqdorini sanashda qo''llaniladi. 11 dan boshlab sanashda oddiy sanoq so''zlar qo''llan…","example":"りんごを ４[よっ] つ 買[か] いました。 4 ta olma sotib oldim."},{"pattern":"MIQDOR SON (muddat)  に～回[かい]  FE’L","meaning":"Bu ibora u yoki bu voqeaning ma''lum bir vaqt oralig''ida bir yoki bir necha marta qaytarilishini ifodalaydi.","example":"１か月[げつ] に２回[かい] 映[えい] 画[が] を見[み] ます。"},{"pattern":"MIQDOR SON  だけ／ OT  だけ","meaning":"だけ “ faqat ” degan ma''noni anglatadi. Bu so''z miqdor soni yoki OTdan so''ng qo''shilib kelib, aytilgan narsadan boshqa hech narsa yo''qligini ifodalaydi.","example":"パワー電[でん] 気[き] に 外国人[がいこくじん] の 社員[しゃいん] が１人[ひとり] だけ います。"}],"phrases":[{"ja":"りんごを ４[よっ] つ 買[か] いました。 4 ta olma sotib oldim.","uz":""},{"ja":"外国人[がいこくじん] の 学生[がくせい] が ２人[ふたり] います。 2 ta chet ellik talaba bor.","uz":""},{"ja":"国[くに] で ２か月[げつ] 日[に] 本[ほん] 語[ご] を勉[べん] 強[きょう] しました。 Vatanimda 2 oy yapon tilini","uz":"o''rgandim."},{"ja":"みかんを いくつ 買[か] いましたか。 Qancha mandarin sotib oldingiz?","uz":"･･･８[やっ] つ 買[か] いました。 … Sakkizta sotib oldim."},{"ja":"この 会社[かいしゃ] に 外国人[がいこくじん] が 何人[なんにん] いますか。","uz":"･･･５人[にん] います。 … 5 kishi bor."},{"ja":"毎晩[まいばん] 何時間[なんじかん] 日[に] 本[ほん] 語[ご] を 勉[べん] 強[きょう] しますか。","uz":"･･･２時[じ] 間[かん] 勉[べん] 強[きょう] します。 … 2 soat o''rganaman."},{"ja":"どの くらい 日[に] 本[ほん] 語[ご] を 勉[べん] 強[きょう] しましたか。","uz":"･･･３年[ねん] 勉強[べんきょう] しました。 … 3 yil o''rgandim."},{"ja":"大阪[おおさか] から 東[とう] 京[きょう] まで どの くらい かかりますか。","uz":"･･･新幹線[しんかんせん] で ２時[じ] 間[かん] 半[はん] かかります。 … “Shinkansen”da 2 yarim soat."}]}'::jsonb, 11),
  ('m-l12', '12-dars: O''tgan zamon va Taqqoslash (Eng va Ko''ra)', '第12課：過去形と比較（〜より・一番）', 'N5', 14, 30, '{"vocab":[{"ja":"簡単 [ な ] (かんたん [ な ])","romaji":"かんたん [ な ]","uz":"oson"},{"ja":"近い (ちかい)","romaji":"ちかい","uz":"yaqin"},{"ja":"遠い (とおい)","romaji":"とおい","uz":"uzoq, olis"},{"ja":"速い ,  早い (はやい)","romaji":"はやい","uz":"tez, barvaqt"},{"ja":"遅い (おそい)","romaji":"おそい","uz":"sekin"},{"ja":"多い (おおい)","romaji":"おおい","uz":"ko''p"},{"ja":"[ 人が～ ] ([ ひとが～ ])","romaji":"[ ひとが～ ]","uz":"(odam ko''p)"},{"ja":"少ない (すくない)","romaji":"すくない","uz":"kam"},{"ja":"暖かい、温かい (あたたかい)","romaji":"あたたかい","uz":"iliq"},{"ja":"涼しい (すずしい)","romaji":"すずしい","uz":"salqin"},{"ja":"甘い (あまい)","romaji":"あまい","uz":"shirin"},{"ja":"辛い (からい)","romaji":"からい","uz":"achchiq"},{"ja":"重い (おもい)","romaji":"おもい","uz":"og''ir"},{"ja":"軽い (かるい)","romaji":"かるい","uz":"yengil"},{"ja":"いい","romaji":"いい","uz":"yaxshi, zo''r"},{"ja":"[ コーヒーが～ ]","romaji":"[ コーヒーが～ ]","uz":"(yaxshi kofe)"},{"ja":"季節 (きせつ)","romaji":"きせつ","uz":"fasl"},{"ja":"春 (はる)","romaji":"はる","uz":"bahor"},{"ja":"夏 (なつ)","romaji":"なつ","uz":"yoz"},{"ja":"秋 (あき)","romaji":"あき","uz":"kuz"},{"ja":"冬 (ふゆ)","romaji":"ふゆ","uz":"qish"},{"ja":"天気 (てんき)","romaji":"てんき","uz":"ob-havo"},{"ja":"雨 (あめ)","romaji":"あめ","uz":"yomg''ir"},{"ja":"雪 (ゆき)","romaji":"ゆき","uz":"qor"},{"ja":"曇り (くもり)","romaji":"くもり","uz":"bulutli (havo)"},{"ja":"ホテル","romaji":"ホテル","uz":"mehmonxona"},{"ja":"空港 (くうこう)","romaji":"くうこう","uz":"aeroport"},{"ja":"海 (うみ)","romaji":"うみ","uz":"dengiz"},{"ja":"世界 (せかい)","romaji":"せかい","uz":"jahon, dunyo"},{"ja":"パーティー","romaji":"パーティー","uz":"kecha, ziyofat, bazm ( ～を します : kecha uyushtirmoq)"},{"ja":"[ お ] 祭り ([ お ] まつり)","romaji":"[ お ] まつり","uz":"bayram"},{"ja":"試験 (しけん)","romaji":"しけん","uz":"imtihon, sinov"},{"ja":"すき焼き (すきやき)","romaji":"すきやき","uz":"sukiyaki (go''sht va sabzavotlardan tayyorlanadigan issiq ovqat)"},{"ja":"刺身 (さしみ)","romaji":"さしみ","uz":"sashimi (yupqa qilib qirqilgan xom baliq go''shti)"},{"ja":"[ お ] すし","romaji":"[ お ] すし","uz":"sushi- sirka arashalgan qaynatilgan guruch ustida xom baliq"},{"ja":"てんぷら","romaji":"てんぷら","uz":"tempura- sabzavot va baliq qovurmasi"},{"ja":"生け花 (いけばな)","romaji":"いけばな","uz":"ikebana, gullar aranjirovkasi ( ～を します； ikebana bilan shug''ullanmoq)"},{"ja":"紅葉 (もみじ)","romaji":"もみじ","uz":"xazon, qizil barg"},{"ja":"どちら","romaji":"どちら","uz":"qaysi biri, qay biri (ikki predmetni tanlashda)"},{"ja":"どちらも","romaji":"どちらも","uz":"ikkalasi ham"},{"ja":"ずっと","romaji":"ずっと","uz":"ancha; ancha vaqt oldin; ancha vaqt"},{"ja":"初めて (はじめて)","romaji":"はじめて","uz":"birinchi bor, ilk bor"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"ただいま。","romaji":"ただいま。","uz":"Men keldim (uyiga qaytib kelganda)"},{"ja":"お帰[かえ] りなさい。","romaji":"お帰[かえ] りなさい。","uz":"Yaxshi keldingizmi?"},{"ja":"すごいですね。","romaji":"すごいですね。","uz":"Qoyil."},{"ja":"でも","romaji":"でも","uz":"lekin, biroq, ammo"},{"ja":"疲[つか] れました。","romaji":"疲[つか] れました。","uz":"Charchadim. Gion bayrami"},{"ja":"祗[ぎ] 園[おん] 祭[まつり]","romaji":"祗[ぎ] 園[おん] 祭[まつり]","uz":"(Kiotodagi eng katta bayram)"},{"ja":"ホンコン","romaji":"ホンコン","uz":"Gonkong"},{"ja":"シンガポール","romaji":"シンガポール","uz":"Singapur"},{"ja":"毎[まい] 日[にち] 屋[や]","romaji":"毎[まい] 日[にち] 屋[や]","uz":"supermarket nomi (o''ylab topilgan)"},{"ja":"ABC  ストア","romaji":"ABC  ストア","uz":"supermarket nomi (o''ylab topilgan)"},{"ja":"ジャパン","romaji":"ジャパン","uz":"supermarket nomi (o''ylab topilgan) Ⅱ . Tarjima Gaplar namunasi 1. Kecha yomg''ir yoqqan edi. 2. Kecha sovuq edi. 3. Hokkaydo Kyushyudan katta. 4. Men yil fasllaridan yozni ko''proq yoqtiraman. Misollar 1. Kioto tinch edimi? …Yo''q, tinch emas edi. 2. Sayohat maroqli o''tdimi? …Ha, juda ham maroqli o''tdi. 3. Ob-havo yaxshi edimi? …Yo''q, unchalik yaxshi emas edi. 4. Kechagi bazm qanday o''tdi? …Juda ham gavjum edi. Har xil odamlarni uchratdim. 5. Tokioda Nyu-Yorkdagiga qaraganda odam ko''pmi? …Ha, ancha ko''p. 6. Aeroportgacha avtobus va elektropoyezddan qaysi biri tez boradi? …Poyezd tez boradi. 7. Sizga dengiz va tog''dan qaysi biri yoqadi? …Ikkasini ham yoqtiraman. 8. Yapon taomlari ichida nimani juda yoqtirasiz? …”Tempura”ni juda yoqtiraman. Suhbat Bayram qanday o''tdi? Miller: Salom, men keldim. Ma''mur: Yaxshi keldingizmi? Miller: Mana, bu Kiotodan sizga sovg''a. Ma''mur: Rahmat. Gion bayrami qanday o''tdi? Miller: Juda qiziqarli o''tdi. Chet elliklar ham ko''p edi. Ma''mur: Gion bayrami Kioto bayramlari ichida eng mashhuri bo''lgani uchun-da? Miller: Shundaymi? Ma''mur: Fotosuratga oldingizmi? Miller: Ha, taxminan yuzta kadr oldim. Ma''mur: Zo''r-ku! Miller: Ha. Lekin, biroz charchadim."}],"grammar":[{"pattern":"Gapda kesim vazifasida keluvchi OT va  な -sifatning o`tgan zamondagi","meaning":"ko''rinishi hozirgi / kelasi zamon o''tgan zamon Darak OT あめ OT あめ gap です でした な -sifat しずか な -sifat しずか Inkor OT あめ OT あめ gap じゃありません じゃありませんでした な -sifat しずか (…","example":"きのうは 雨[あめ] でした。"},{"pattern":"Gapda kesim vazifasini bajaruvchi  い -sifatning o`tgan zamondagi","meaning":"ko''rinishi hozirgi / kelasi zamon o''tgan zamon Darak gap あついです あつかったです Inkor gap あつくないです あつくなかったです","example":"きのうは 暑[あつ] かったです。"},{"pattern":"OT 1  は OT 2  より SIFAT  です","meaning":"Ushbu turdagi gaplarda OT 1 ni OT 2 ga qiyoslagan holda uning sifati va holati ifodalanadi.","example":"この 車[くるま] は あの 車[くるま] より 大[おお] きいです。 Bu mashina narigisiga qaraganda katta."},{"pattern":"…OT 1 ／ OT 2  のほうが SIFAT  です","meaning":"Gapning bu so''roq shakli yordamida so''zlovchi o''z suhbatdoshidan ma''lum bir shaxs yoki predmetning (OT 1 va OT 2 ) holatiga nisbatan munosabatini so''raydi. I…","example":"サッカーと 野[や] 球[きゅう] と どちらが おもしろいですか。"},{"pattern":"5.","meaning":"何[なに] どこ OT 1 [ の中[なか] ] で が いちばん SIFAT ですか だれ いつ …OT 2 が いちばん SIFAT です Gapning ushbu shakli suhbatdoshdan bir guruh shaxs yoki predmet orasidan eng xususiya…","example":"日本[にほん] 料理[りょうり] [ の 中[なか] ] で 何[なに] が いちばん おいしいですか。"}],"phrases":[{"ja":"きのうは 雨[あめ] でした。","uz":"Kecha yomg''ir yog''di."},{"ja":"きのうの 試[し] 験[けん] は 簡単[かんたん] じゃ ありませんでした。","uz":"Kechagi imtihon oson bo''lmadi."},{"ja":"きのうは 暑[あつ] かったです。","uz":"Kecha kun issiq bo''ldi."},{"ja":"きのうの パーティーは あまり 楽[たの] しくなかった。","uz":"Kechagi bazm unchalik qiziq o''tmadi."},{"ja":"この 車[くるま] は あの 車[くるま] より 大[おお] きいです。 Bu mashina narigisiga qaraganda katta.","uz":"OT 1 と OT 2 と どちらが SIFAT ですか"},{"ja":"サッカーと 野[や] 球[きゅう] と どちらが おもしろいですか。","uz":"･･･サッカーの ほうが おもしろいです。 … Futbol qiziq."},{"ja":"ミラーさんと サントスさんと どちらが テニスが 上[じょう] 手[ず] ですか。","uz":"Janob Miller va janob Santosdan qaysi birlari tennisni yaxshi o''ynaydi?"},{"ja":"北海道[ほっかいどう] と大阪[おおさか] と どちらが 涼[すず] しいですか。","uz":"Hokkaydo va Osakadan qaysi biri salqin?"}]}'::jsonb, 12),
  ('m-l13', '13-dars: Istak-xohish va Maqsad (Xohlamoq/Bormoq)', '第13課：希望と目的（欲しい・〜たい・に行きます）', 'N5', 16, 35, '{"vocab":[{"ja":"遊びます (あそびます)","romaji":"あそびます","uz":"o''ynamoq, ko''ngil ochmoq"},{"ja":"泳ぎます (およぎます)","romaji":"およぎます","uz":"cho''milmoq, suzmoq"},{"ja":"迎えます (むかえます)","romaji":"むかえます","uz":"kutib olmoq"},{"ja":"疲れます (つかれます)","romaji":"つかれます","uz":"charchamoq"},{"ja":"出します (だします)","romaji":"だします","uz":"jo''natmoq"},{"ja":"[ 手紙を～ ] ([ てがみを～ ])","romaji":"[ てがみを～ ]","uz":"xat jo''natmoq"},{"ja":"入ります (はいります)","romaji":"はいります","uz":"kirmoq"},{"ja":"[ 喫茶店に～ ] ([ きっさてんに～ ])","romaji":"[ きっさてんに～ ]","uz":"(qahvaxonaga kirmoq)"},{"ja":"出ます (でます)","romaji":"でます","uz":"chiqmoq"},{"ja":"[ 喫茶店を～ ] ([ きっさてんを～ ])","romaji":"[ きっさてんを～ ]","uz":"(qahvaxonadan chiqmoq)"},{"ja":"結婚 します (けっこん します)","romaji":"けっこん します","uz":"turmush qurmoq"},{"ja":"買い物 します (かいもの します)","romaji":"かいもの します","uz":"xarid qilmoq"},{"ja":"食事 します (しょくじ します)","romaji":"しょくじ します","uz":"ovqatlanmoq"},{"ja":"散歩 します (さんぽ します)","romaji":"さんぽ します","uz":"sayr qilmoq"},{"ja":"[ 公園を～ ] ([ こうえんを～ ])","romaji":"[ こうえんを～ ]","uz":"(xiyobonda sayr qilmoq)"},{"ja":"大変 [ な ] (たいへん [ な ])","romaji":"たいへん [ な ]","uz":"qiyin, og''ir"},{"ja":"欲しい (ほしい)","romaji":"ほしい","uz":"xohlagan, xohlamoq"},{"ja":"寂しい (さびしい)","romaji":"さびしい","uz":"ma''yus, xafa"},{"ja":"広い (ひろい)","romaji":"ひろい","uz":"keng"},{"ja":"狭い (せまい)","romaji":"せまい","uz":"tor"},{"ja":"市役所 (しやくしょ)","romaji":"しやくしょ","uz":"shahar hokimiyati"},{"ja":"プール","romaji":"プール","uz":"basseyn, hovuz"},{"ja":"川 (かわ)","romaji":"かわ","uz":"daryo"},{"ja":"経済 (けいざい)","romaji":"けいざい","uz":"iqtisod"},{"ja":"美術 (びじゅつ)","romaji":"びじゅつ","uz":"san''at"},{"ja":"釣り (つり)","romaji":"つり","uz":"baliq tutish （～をします： baliq tutmoq ）"},{"ja":"スキー","romaji":"スキー","uz":"chang''i; chang''i uchish （～をします： chang''i uchmoq ）"},{"ja":"会議 (かいぎ)","romaji":"かいぎ","uz":"majlis, yig''in ( ～をします： majlis qilmoq)"},{"ja":"登録 (とうろく)","romaji":"とうろく","uz":"ro''yxatga olish （～をします： ro''yxatga olmoq ）"},{"ja":"週末 (しゅうまつ)","romaji":"しゅうまつ","uz":"hafta oxiri, dam olish kuni"},{"ja":"～ごろ","romaji":"～ごろ","uz":"~larda (vaqt bilan qo''llaniladi.)"},{"ja":"何か (なにか)","romaji":"なにか","uz":"nimadir, biror narsa"},{"ja":"どこか","romaji":"どこか","uz":"qayerdir, biror joy"},{"ja":"おなかが すきました。","romaji":"おなかが すきました。","uz":"Qorin ochdi."},{"ja":"おなかが いっぱいです。","romaji":"おなかが いっぱいです。","uz":"Qorin to''ydi. Qorin to''q."},{"ja":"のどが かわきました。","romaji":"のどが かわきました。","uz":"Chanqadim."},{"ja":"そうですね。","romaji":"そうですね。","uz":"Nimasini aytsam sizga… .; Rost aytasiz. Ha-ya (Ushbu ibora suhbatning uzilib qolmasligiga xizmat qilib, “ ma''qullash ” yoki “ fikr jamlash ” ni ifodalaydi.)"},{"ja":"そう しましょう。","romaji":"そう しましょう。","uz":"Shunday qilaylik."},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"ご注[ちゅう] 文[もん] は？","romaji":"ご注[ちゅう] 文[もん] は？","uz":"Nimani buyurasiz?"},{"ja":"定[てい] 職[しょく]","romaji":"定[てい] 職[しょく]","uz":"ovqatlar to''plami"},{"ja":"牛[ぎゅう] どん","romaji":"牛[ぎゅう] どん","uz":"gyudon- qaynatilgan guruch ustida mol go''shti"},{"ja":"[  少々[しょうしょう] ]  お待[ま] ち ください。","romaji":"[  少々[しょうしょう] ]  お待[ま] ち ください。","uz":"Bir oz kutib turing."},{"ja":"別々[べつべつ] に","romaji":"別々[べつべつ] に","uz":"alohida"},{"ja":"ロシア","romaji":"ロシア","uz":"Rossiya"},{"ja":"つるや","romaji":"つるや","uz":"yapon restorani nomi (o''ylab topilgan)"},{"ja":"おはようテレビ","romaji":"おはようテレビ","uz":"teledastur nomi (o''ylab topilgan)"}],"grammar":[{"pattern":"OT  が 欲[ほ] しいです","meaning":"Ushbu gap namunasi biror narsaga egalik qilish xohish istagini bildirish uchun ishlatiladi. Bundan tashqari suhbatdoshning nimani xohlayotganini so''rash uchu…","example":"わたしは 友達[ともだち] が 欲[ほ] しいです。"},{"pattern":"FE’Lning  ます -shakli  たいです","meaning":"1) FE''Lning ます -shakli ます bilan tugaydigan fe''llar, “FE''Lning ます -shakli” deb ataladi. Masalan, かいます fe''lida, かい “FE''Lning ます -shaklidagi” o''zagidir. 3) FE''L…","example":"わたしは 沖縄[おきなわ] へ 行[い] きたいです。"},{"pattern":"OT(o`rin-joy) へ に行[い] きます／来[き] ます／帰[かえ] ります","meaning":"OT Ushbu namuna yordamida いきます , きます , かえります kabi fe''llar orqali maqsad ifodalanadi. Gapda maqsad に qo''shimchasi bilan belgilanadi. に dan oldin qo''llaniladig…","example":"神[こう] 戸[べ] へ インド料[りょう] 理[り] を 食[た] べに 行[い] きます。"},{"pattern":"OT  に  FE’L ／ OT  を  FE’L","meaning":"に qo''shimchasi はいります , のります (transportga chiqmoq; 16-darsga qarang) kabi fe''llar bilan qo''llanilganda, tayinlangan, belgilangan joy yoki oxirgi yetib kelish…","example":"あの 喫茶店[きっさてん] に 入[はい] りましょう。"},{"pattern":"どこか／何[なに] か","meaning":"どこか noaniq olmoshi “ qayerdir ” yoki “ biror yer ” degan ma''noni bildiradi. なにか esa “ nimadir ” yoki “ biror narsa ” degan ma''noni bildiradi. Bu holda へ va を…","example":"冬休[ふゆやす] みは どこか [ へ ]"},{"pattern":"ご注文[ちゅうもん]","meaning":"ご so''z oldi qo''shimchasi ba''zi so''zlarga qo''shilib hurmatni bildiradi. ⑯ ご注[ちゅう] 文[もん] は？ Nima buyurtma qilasiz?","example":""}],"phrases":[{"ja":"わたしは 友達[ともだち] が 欲[ほ] しいです。","uz":"Men do''stlarim bo''lishini xohlayman."},{"ja":"今[いま] 何[なに] が いちばん 欲[ほ] しいですか。","uz":"Hozir nimani juda xohlaysiz?"},{"ja":"子[こ] どもが 欲[ほ] しいですか。","uz":"Farzandingiz bo''lishini xohlaysizmi?"},{"ja":"わたしは 沖縄[おきなわ] へ 行[い] きたいです。","uz":"Men Okinavaga borishni xohlayman /"},{"ja":"わたしは てんぷらを 食[た] べたいです。  Men tempura yeyishni xohlayman /","uz":"( が ) Men tempura yemoqchiman."},{"ja":"神[こう] 戸[べ] で 何[なに] を 買[か] いたいですか。","uz":"Kobeda nima xarid qilmoqchisiz?"},{"ja":"おなかが 痛[いた] いですから、何[なに] も 食[た] べたくないです。","uz":"Qornim og''riyotganligi uchun hech narsa yegim kelmayapti."},{"ja":"神[こう] 戸[べ] へ インド料[りょう] 理[り] を 食[た] べに 行[い] きます。","uz":"boraman."}]}'::jsonb, 13),
  ('m-l14', '14-dars: Fe''lning Te-shakli va Iltimos (Buyruq va Iltimos)', '第14課：て形と依頼（〜てください・〜ています）', 'N5', 18, 40, '{"vocab":[{"ja":"つけます","romaji":"つけます","uz":"yo''qmoq"},{"ja":"消します (けします)","romaji":"けします","uz":"o''chirmoq"},{"ja":"開けます (あけます)","romaji":"あけます","uz":"ochmoq"},{"ja":"閉めます (しめます)","romaji":"しめます","uz":"yopmoq"},{"ja":"急ぎます (いそぎます)","romaji":"いそぎます","uz":"shoshmoq"},{"ja":"待ちます (まちます)","romaji":"まちます","uz":"kutmoq"},{"ja":"止めます (とめます)","romaji":"とめます","uz":"to''xtatmoq"},{"ja":"曲がります (まがります)","romaji":"まがります","uz":"burilmoq, qayrilmoq"},{"ja":"[ 右へ～ ] ([ みぎへ～ ])","romaji":"[ みぎへ～ ]","uz":"(o''ngga qayrilmoq)"},{"ja":"持ちます (もちます)","romaji":"もちます","uz":"ushlab turmoq"},{"ja":"取ります (とります)","romaji":"とります","uz":"olmoq"},{"ja":"手伝います (てつだいます)","romaji":"てつだいます","uz":"yordam bermoq, ko''maklashmoq"},{"ja":"呼びます (よびます)","romaji":"よびます","uz":"chaqirmoq"},{"ja":"話します (はなします)","romaji":"はなします","uz":"suhbatlashmoq"},{"ja":"見せます (みせます)","romaji":"みせます","uz":"ko''rsatmoq"},{"ja":"教えます (おしえます)","romaji":"おしえます","uz":"o''rgatmoq, aytmoq, tushuntirmoq"},{"ja":"[ 住所を～ ] ([ じゅうしょを～ ])","romaji":"[ じゅうしょを～ ]","uz":"(manzilni aytmoq)"},{"ja":"始めます (はじめます)","romaji":"はじめます","uz":"boshlamoq"},{"ja":"降ります (ふります)","romaji":"ふります","uz":"yog''moq"},{"ja":"[ 雨が～ ] ([ あめが～ ])","romaji":"[ あめが～ ]","uz":"(yomg''ir yog''moq)"},{"ja":"コピー します","romaji":"コピー します","uz":"nusxa ko''chirmoq"},{"ja":"エアコン","romaji":"エアコン","uz":"havo sovutgich"},{"ja":"パスポート","romaji":"パスポート","uz":"pasport"},{"ja":"名前 (なまえ)","romaji":"なまえ","uz":"ism, nom"},{"ja":"住所 (じゅうしょ)","romaji":"じゅうしょ","uz":"manzil"},{"ja":"地図 (ちず)","romaji":"ちず","uz":"xarita"},{"ja":"塩 (しお)","romaji":"しお","uz":"tuz"},{"ja":"砂糖 (さとう)","romaji":"さとう","uz":"shakar, qand"},{"ja":"読み方 (よみかた)","romaji":"よみかた","uz":"o''qilish (o''qilish uslubi)"},{"ja":"～方 (～かた)","romaji":"～かた","uz":"~ish uslubi, ~ish odobi"},{"ja":"ゆっくり","romaji":"ゆっくり","uz":"sekin, bemalol"},{"ja":"すぐ","romaji":"すぐ","uz":"darhol"},{"ja":"また","romaji":"また","uz":"yana"},{"ja":"あとで","romaji":"あとで","uz":"keyin"},{"ja":"もう 少し (もう すこし)","romaji":"もう すこし","uz":"yana ozgina"},{"ja":"もう～","romaji":"もう～","uz":"yana~"},{"ja":"いいですよ。","romaji":"いいですよ。","uz":"Mayli."},{"ja":"さあ","romaji":"さあ","uz":"demak, xo''sh"},{"ja":"あれ？","romaji":"あれ？","uz":"Voy! (hayron bo''lish iborasi)"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"信号[しんごう] を 右[みぎ] へ 曲[ま] がって ください。","romaji":"信号[しんごう] を 右[みぎ] へ 曲[ま] がって ください。","uz":"Svetofordan o''ngga qayriling."},{"ja":"まっすぐ","romaji":"まっすぐ","uz":"to''g''ri"},{"ja":"これで お願[ねが] いします。","romaji":"これで お願[ねが] いします。","uz":"Buni oling, marhamat."},{"ja":"お釣[つ] り","romaji":"お釣[つ] り","uz":"qaytim"},{"ja":"梅[うめ] 田[だ]","romaji":"梅[うめ] 田[だ]","uz":"Osakadagi tuman nomi"}],"grammar":[{"pattern":"Fe’llarning tuslanishi","meaning":"Yapon tilida fe''llar tuslanishi orqali o''z ko''rinishlarini o''zgartiradi. Tuslanish turiga ko''ra 3 guruhga bo''linadi.","example":""},{"pattern":"Fe’l guruhlari","meaning":"1) Ⅰ guruh Bu guruh fe''llarning o''zagi い da tugaydi. (Asosiy o''quv darsligining 2-betiga qarang: かな と 拍[はく] ) かきます yozmoq のみます ichmoq 2) Ⅱ guruh Garchi ayrim…","example":""},{"pattern":"Fe’llarning  て -shakli","meaning":"Fe''llarning て yoki で qo''shimchasi bilan tugaydiganlarga “FE''Lning て -shakli” deyiladi. Quyida keltirilgan fe''l guruhlarining turiga qarab “FE''Lning て -shakli…","example":""},{"pattern":"FE’Lning  て -shakli  ください BUYRUQ YOKI XOHISH VA ISTAK","meaning":"Bu turdagi gaplar biror-bir harakatni iltimos, buyruq va xohish-istak maqsadida amalga oshirishda qo''llaniladi. Agar suhbatdosh yuqori lavozim egasi bo''lsa,…","example":"すみませんが、この 漢[かん] 字[じ] の 読[よ] み方[かた] を 教[おし] えて ください。"},{"pattern":"FE’Lning   て -shakli  います HARAKATNING DAVOMIY KO`RINISHI","meaning":"Bunday turdagi gaplar harakatni aynan hozir davom etayotganligini ko''rsatish uchun qo''llaniladi. ･･･いいえ、降[ふ] って いません。 …Yo''q, yog''mayapti.","example":"ミラーさんは 今[いま] 電[でん] 話[わ] を かけています。 Janob Miller hozir qo`ng`iroq"},{"pattern":"FE’Lning   ます -shakli  ましょうか YORDAMGA TAKLIF","meaning":"Bu usul so''zlovchi suhbatdoshiga biror bir narsa qilib berishni taklif qilayotganda qo''llanadi. Keltirilgan misollarda kimdandir biror-bir ishni muloyimlik b…","example":"A:  あしたも 来[き] ましょうか。 Ertaga ham kelaymi?"},{"pattern":"GAP 1  が、 GAP 2 KIRISH SO`ZLARI “KECHIRASIZ…?”, “KECHIRASIZ… .”","meaning":"が kabi kirish so''zlari bilan kelganda, o''zining boshlang''ich ma''nosini anglatmay, balki ularni shunchaki keyingi so''zlar bilan bog''lash uchun xizmat qiladi.","example":"失礼[しつれい] ですが、お名[な] 前[まえ] は？ Kechirasiz, ismingiz nima? (1-dars)"},{"pattern":"OT  が  FE’L","meaning":"Tabiat xodisalarini tasvirlayotganda EGA 「が」 bilan ajratib ko''rsatiladi.","example":"雨[あめ] が 降[ふ] って います。"}],"phrases":[{"ja":"すみませんが、この 漢[かん] 字[じ] の 読[よ] み方[かた] を 教[おし] えて ください。","uz":"Kechirasiz, mana bu iyeroglifning o''qilishini o''rgatib yuboring."},{"ja":"ここに 住[じゅう] 所[しょ] と 名[な] 前[まえ] を 書[か] いて ください。","uz":"Bu yerga manzilingiz bilan ismingizni yozing."},{"ja":"ぜひ 遊[あそ] びに 来[き] て ください。","uz":"Albatta mehmonga keling. (25-darsga qarang)"},{"ja":"ミラーさんは 今[いま] 電[でん] 話[わ] を かけています。 Janob Miller hozir qo`ng`iroq","uz":"qilayapti."},{"ja":"今[いま] 雨[あめ] が 降[ふ] って いますか。 Hozir, yomg`ir yog`ayaptimi?","uz":"･･･はい、降[ふ] って います。 …Ha, yog''ayapti."},{"ja":"A:  あしたも 来[き] ましょうか。 Ertaga ham kelaymi?","uz":"B: ええ、１０時[じ] に 来[き] て ください。 …Ha, soat 10 ga keling."},{"ja":"A:  傘[かさ] を 貸[か] しましょうか。 Soyabonimni berib turaymi?","uz":"B: すみません。お願[ねが] いします。 …Rahmat. Agar mumkin bo''lsa."},{"ja":"A:  荷[に] 物[もつ] を 持[も] ちましょうか。 Keling, yukingizni ko`tarib olib boray.","uz":"B: いいえ、けっこうです。 …Yo''q, rahmat. Hojati yo''q."}]}'::jsonb, 14),
  ('m-l15', '15-dars: Ruxsat, Taqiq va Holat fe''llari', '第15課：許可と禁止（〜てもいいです・てはいけません）', 'N5', 10, 30, '{"vocab":[{"ja":"立ちます (たちます)","romaji":"たちます","uz":"turmoq"},{"ja":"座ります (すわります)","romaji":"すわります","uz":"o''tirmoq"},{"ja":"使います (つかいます)","romaji":"つかいます","uz":"foydalanmoq, qo''llamoq, ishlatmoq"},{"ja":"置きます (おきます)","romaji":"おきます","uz":"qo''ymoq"},{"ja":"作ります、 (つくります)","romaji":"つくります","uz":"yasamoq; tayyorlamoq, pishirmoq 造ります"},{"ja":"売ります (うります)","romaji":"うります","uz":"sotmoq"},{"ja":"知ります (しります)","romaji":"しります","uz":"bilmoq"},{"ja":"住みます (すみます)","romaji":"すみます","uz":"yashamoq"},{"ja":"研究 します (けんきゅう します)","romaji":"けんきゅう します","uz":"ilmiy tadqiqot olib bormoq"},{"ja":"知って います (しって います)","romaji":"しって います","uz":"bila(~man, ~san, ~di)"},{"ja":"住んで います (すんで います)","romaji":"すんで います","uz":"yashayap(~man, san, ~ti)"},{"ja":"[ 大阪に～ ] ([ おおさかに～ ])","romaji":"[ おおさかに～ ]","uz":"(Osakada yashayap(~man, ~san,~ti))"},{"ja":"資料 (しりょう)","romaji":"しりょう","uz":"material, ma''lumot"},{"ja":"カタログ","romaji":"カタログ","uz":"katalog"},{"ja":"時刻表 (じこくひょう)","romaji":"じこくひょう","uz":"vaqt jadval"},{"ja":"服 (ふく)","romaji":"ふく","uz":"kiyim"},{"ja":"製品 (せいひん)","romaji":"せいひん","uz":"mahsulot"},{"ja":"ソフト","romaji":"ソフト","uz":"dastur ta''minoti (kompyuter)"},{"ja":"専門 (せんもん)","romaji":"せんもん","uz":"mutaxassislik, yo''nalish"},{"ja":"歯医者 (はいしゃ)","romaji":"はいしゃ","uz":"tish doktori, stomatolog"},{"ja":"床屋 (とこや)","romaji":"とこや","uz":"erkaklar sartaroshxonasi"},{"ja":"プレイガイド","romaji":"プレイガイド","uz":"teatr kassasi"},{"ja":"独身 (どくしん)","romaji":"どくしん","uz":"bo''ydoq (erkaklar), turmushga chiqmagan (ayollar)"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"特[とく] に","romaji":"特[とく] に","uz":"ayniqsa"},{"ja":"思[おも] い出[だ] します","romaji":"思[おも] い出[だ] します","uz":"yodga olmoq, xotirlamoq"},{"ja":"ご家[か] 族[ぞく]","romaji":"ご家[か] 族[ぞく]","uz":"oilangiz, oilasi"},{"ja":"いらっしゃいます","romaji":"いらっしゃいます","uz":"bo''lmoq ( います ning hurmat shakli)"},{"ja":"高校[こうこう]","romaji":"高校[こうこう]","uz":"yuqori maktab (litsey) (10,11-sinf o''quvchilariga mo''ljallangan maktab)"},{"ja":"日本橋[にっぽんばし]","romaji":"日本橋[にっぽんばし]","uz":"Osakadagi savdo hududi nomi"}],"grammar":[{"pattern":"FE’Lning  て -shakli  も いいです HARAKATGA RUXSAT BERISH","meaning":"Gapning ushbu shakli ish-harakatni bajarish mumkinligi, ruxsat berish kabi ma''nolarini ifodalaydi. Biror bir ish-harakatni bajarishga ruxsat so''ralayotgan pa…","example":"写真[しゃしん] を 撮[と] っても いいです。"},{"pattern":"FE’Lning  て -shakli  は いけません HARAKATNI TAQIQLASH","meaning":"Gapning ushbu turi ish-harakatning bajarilishini man etilishni ifodalaydi ～ても いいですか ruxsat so''rash shaklidagi so''roq gaplarga inkor javobni qaytarayotganda て…","example":"ここで たばこを 吸[す] っては いけません。禁煙[きんえん] ですから。"},{"pattern":"FE’Lning  て -shakli  います","meaning":"14-darsda ko''rib o''tgan “FE''Lning て -shakli います ”ning qo''llanilishidan tashqari ushbu shakldagi gaplar ancha avval boshlangan va hozirgacha davom etayotgan h…","example":"わたしは 結婚[けっこん] して います。 Men turmush qurganman."},{"pattern":"FE’Lning て -shakli  います","meaning":"“FE''Lning て -shakli います ”, shuningdek ma''lum vaqt mobaynida davom etib, odat tusiga kirgan yoki takrorlanib kelgan ish-harakatni ifodalaydi. tarzida qo''llash…","example":"va  ⑬ -misollarda ko`rsatilganidek, ushbu tuzilma yordamida shaxsning faoliyat"},{"pattern":"知[し] りません","meaning":"しって います fe''li inkor shaklda しりません ga o''zgaradi. ･･･いいえ、知[し] りません。 Shahar hokimiyatning telefon raqamini bilasizmi?","example":"市[し] 役[やく] 所[しょ] の 電[でん] 話[わ] 番[ばん] 号[ごう] を 知[し] って いますか。"}],"phrases":[{"ja":"写真[しゃしん] を 撮[と] っても いいです。","uz":"Suratga olish(ingiz) mumkin."},{"ja":"たばこを 吸[す] っても いいですか。","uz":"Cheksam maylimi?"},{"ja":"この カタログを もらっても いいですか。","uz":"･･･ええ、いいですよ。どうぞ。 …Ha, mayli. Marhamat. …Kechirasiz. Ilojim yo''q."},{"ja":"ここで たばこを 吸[す] っては いけません。禁煙[きんえん] ですから。","uz":"Bu yerda chekish mumkin emas. Chunki, bu yer chekish man etilgan joy."},{"ja":"先生[せんせい] 、ここで 遊[あそ] んでも いいですか。 Ustoz, bu yerda o`ynab tursak maylimi?","uz":"･･･いいえ、いけません。 …Yo''q, mumkin emas."},{"ja":"わたしは 結婚[けっこん] して います。 Men turmush qurganman.","uz":""},{"ja":"わたしは 田[た] 中[なか] さんを 知[し] って います。 Men janob Tanakani taniyman.","uz":""},{"ja":"わたしは 大阪[おおさか] に 住[す] んで います。 Men Osakada yashayman.","uz":""}]}'::jsonb, 15),
  ('m-l16', '16-dars: Harakatlar ketma-ketligi va Sifatlarni bog''lash', '第16課：動作の連続（〜てから・〜くて）', 'N5', 12, 35, '{"vocab":[{"ja":"乗ります (のります)","romaji":"のります","uz":"minmoq, chiqmoq"},{"ja":"[ 電車に～ ] ([ でんしゃに～ ])","romaji":"[ でんしゃに～ ]","uz":"(poyezdga chiqmoq)"},{"ja":"降ります (おります)","romaji":"おります","uz":"tushmoq"},{"ja":"[ 電車を～ ] ([ でんしゃを～ ])","romaji":"[ でんしゃを～ ]","uz":"(poyezddan tushmoq)"},{"ja":"乗り換えます (のりかえます)","romaji":"のりかえます","uz":"boshqa transportga almashmoq"},{"ja":"浴びます (あびます)","romaji":"あびます","uz":"qabul qilmoq"},{"ja":"[ シャワーを～ ]","romaji":"[ シャワーを～ ]","uz":"(dush qabul qilmoq)"},{"ja":"入れます (いれます)","romaji":"いれます","uz":"solmoq, joylamoq"},{"ja":"出します (だします)","romaji":"だします","uz":"chiqarmoq, olmoq (biror narasa ichidan)"},{"ja":"入ります (はいります)","romaji":"はいります","uz":"kirmoq"},{"ja":"[ 大学に～ ] ([ だいがくに～ ])","romaji":"[ だいがくに～ ]","uz":"(universitetga kirmoq)"},{"ja":"出ます (でます)","romaji":"でます","uz":"bitirmoq, tugatmoq"},{"ja":"[ 大学を～ ] ([ だいがくを～ ])","romaji":"[ だいがくを～ ]","uz":"(universitetni bitirmoq)"},{"ja":"やめます","romaji":"やめます","uz":"ketmoq, tashlamoq; bas qilmoq"},{"ja":"[ 会社を～ ] ([ かいしゃを～ ])","romaji":"[ かいしゃを～ ]","uz":"(korxonadan ketmoq)"},{"ja":"押します (おします)","romaji":"おします","uz":"bosmoq; itarmoq"},{"ja":"若い (わかい)","romaji":"わかい","uz":"yosh"},{"ja":"長い (ながい)","romaji":"ながい","uz":"uzun"},{"ja":"短い (みじかい)","romaji":"みじかい","uz":"qisqa"},{"ja":"明るい (あかるい)","romaji":"あかるい","uz":"yorug''"},{"ja":"暗い (くらい)","romaji":"くらい","uz":"qorong''u"},{"ja":"背が 高い (せが たかい)","romaji":"せが たかい","uz":"bo''yi baland, novcha"},{"ja":"頭が いい (あたまが いい)","romaji":"あたまが いい","uz":"aqlli, kallasi o''tkir"},{"ja":"体 (からだ)","romaji":"からだ","uz":"tana, jussa"},{"ja":"頭 (あたま)","romaji":"あたま","uz":"bosh"},{"ja":"髪 (かみ)","romaji":"かみ","uz":"soch"},{"ja":"顔 (かお)","romaji":"かお","uz":"yuz"},{"ja":"目 (め)","romaji":"め","uz":"ko''z"},{"ja":"耳 (みみ)","romaji":"みみ","uz":"quloq"},{"ja":"口 (くち)","romaji":"くち","uz":"og''iz"},{"ja":"歯 (は)","romaji":"は","uz":"tish"},{"ja":"おなか","romaji":"おなか","uz":"qorin"},{"ja":"足 (あし)","romaji":"あし","uz":"oyoq"},{"ja":"サービス","romaji":"サービス","uz":"xizmat korsatish , servis"},{"ja":"ジョギング","romaji":"ジョギング","uz":"yugurish ( ～を します： yugurmoq)"},{"ja":"シャワー","romaji":"シャワー","uz":"dush"},{"ja":"緑 (みどり)","romaji":"みどり","uz":"yashil; yashilliklar"},{"ja":"[ お ] 寺 ([ お ] てら)","romaji":"[ お ] てら","uz":"budda ibodatxonasi"},{"ja":"神社 (じんじゃ)","romaji":"じんじゃ","uz":"jinjya (sintoizm: ajdodlari ruhiga e''tiqod qiluvchilar dini ibodatxonasi)"},{"ja":"留学生 (りゅうがくせい)","romaji":"りゅうがくせい","uz":"xorijlik talaba"},{"ja":"～番 (～ばん)","romaji":"～ばん","uz":"~ raqam"},{"ja":"どうやって","romaji":"どうやって","uz":"qanday qilib"},{"ja":"どの～","romaji":"どの～","uz":"qaysi~"},{"ja":"[ いいえ、 ]  まだまだです。","romaji":"[ いいえ、 ]  まだまだです。","uz":"Halicha yo''q. / Hali ~ bo''lgani(m)cha yo''q."},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"お引[ひ] き出[だ] しですか。","romaji":"お引[ひ] き出[だ] しですか。","uz":"Hisob raqamingizdan pul olmoqchimisiz?"},{"ja":"まず","romaji":"まず","uz":"oldin, avvalambor"},{"ja":"キャッシュカード","romaji":"キャッシュカード","uz":"bank kartasi"},{"ja":"暗[あん] 証[しょう] 番[ばん] 号[ごう]","romaji":"暗[あん] 証[しょう] 番[ばん] 号[ごう]","uz":"shaxsiy maxfiy kod"},{"ja":"次[つぎ] に","romaji":"次[つぎ] に","uz":"so''ng, keyin"},{"ja":"金額[きんがく]","romaji":"金額[きんがく]","uz":"pul summasi"},{"ja":"確認[かくにん]","romaji":"確認[かくにん]","uz":"tasdiq ( ～します tasdiqlamoq)"},{"ja":"ボタン","romaji":"ボタン","uz":"tugmacha"},{"ja":"ＪＲ","romaji":"ＪＲ","uz":"Yaponiya Temir yo''llari kompaniyasi"},{"ja":"アジア","romaji":"アジア","uz":"Osiyo"},{"ja":"バンドン","romaji":"バンドン","uz":"Bandung (Indoneziyadagi shahar)"},{"ja":"ベラクルス","romaji":"ベラクルス","uz":"Verakruz (Meksikadagi shahar)"},{"ja":"フランケン","romaji":"フランケン","uz":"Franken (Olmoniyadagi shahar)"},{"ja":"ベトナム","romaji":"ベトナム","uz":"Vetnam"},{"ja":"フエ","romaji":"フエ","uz":"Xve (Vetnamdagi shahar)"},{"ja":"大学前[だいがくまえ]","romaji":"大学前[だいがくまえ]","uz":"“Daigakumae” (avtobus bekati nomi, o''ylab topilgan )"}],"grammar":[{"pattern":"FE’Lning  て -shakli 、 [FE’Lning  て -shakli]  、～","meaning":"Fe''lli so''z birikmalarni bog''lash uchun “FE''Lning て -shakli” qo''llaniladi. Fe''llar bir necha ketma-ket sodir bo''ladigan harakatlarni tasvirlayotganda davriy…","example":"朝[あさ] ジョギングを して、シャワーを 浴[あ] びて、会社[かいしゃ] へ 行[い] きます。"},{"pattern":"い -SIFAT  (~ い )  → ～くて、～","meaning":"い -sifatlarni sanab o''tayotganda sifatning oxirgi い harfi くて ga o''zgaradi. おおき－い → おおき－くて katta ちいさ－い → ちいさ－くて kichik い－い → ＊よ－くて yaxshi (istisno)","example":"ミラーさんは 若[わか] くて、元[げん] 気[き] です。"},{"pattern":"OT","meaning":"で、～ な -SIFAT [ な ] OT yoki な -SIFAT so''z birikmalarini sanab o''tayotganda です - で ga o''zgaradi. [Eslatma1] Bu tuzilma egalari har xil bo''lgan oddiy gaplarni y…","example":"カリナさんは インドネシア人[じん] で、京[きょう] 都[と] 大[だい] 学[がく] の 留[りゅう] 学[がく] 生[せい] です。"},{"pattern":"FE’L 1 ning  て -shakli  から、 FE’L 2","meaning":"Bunday turdagi gaplar FE''L 1 ning harakati tugagandan keyin FE''L 2 ning harakati bo''lib o''tganligini yoki bo''lib o''tishini bildirish uchun qo''llaniladi. Bu g…","example":"国[くに] へ 帰[かえ] ってから、父[ちち] の 会社[かいしゃ] で 働[はたら] きます。"},{"pattern":"OT 1  は  OT 2  が  SIFAT","meaning":"Bunday turdagi gaplar inson yoki predmetning xususiyatini tasvirlayotganda qo''llaniladi. Gapning mavzusi は yuklamasi bilan ajratiladi. OT 1 gapning mavzusini…","example":"大阪[おおさか] は 食[た] べ物[もの] が おいしいです。"},{"pattern":"どうやって","meaning":"どうやって iborasi biror bir harakatni amalga oshirish yo''llarini aniqlash uchun so''roq gaplarda qo''llaniladi. Unga esa quyida ko''rsatilgan misoldagidek javob ber…","example":"大学[だいがく] まで どう やって 行[い] きますか。"},{"pattern":"どの OT","meaning":"2-darsda otlarni aniqlab keluvchi この , その , あの ko''rsatish olmoshlari haqida bilib oldingiz. Bunga so''roq olmoshi sifatida どの qo''llaniladi. どの yordamida suhba…","example":"サントスさんは どの 人[ひと] ですか。"}],"phrases":[{"ja":"朝[あさ] ジョギングを して、シャワーを 浴[あ] びて、会社[かいしゃ] へ 行[い] きます。","uz":"Ertalab yugurib, dush qabul qilib, firmaga boraman."},{"ja":"神[こう] 戸[べ] へ 行[い] って、映[えい] 画[が] を 見[み] て、お茶[ちゃ] を 飲[の] みました。","uz":"Kobega borib, kino ko''rib, choy ichdim."},{"ja":"ミラーさんは 若[わか] くて、元[げん] 気[き] です。","uz":"Janob Miller yosh va sog''lom."},{"ja":"きのうは 天[てん] 気[き] が よくて、暑[あつ] かったです。","uz":"Kecha havo yaxshi va issiq edi."},{"ja":"カリナさんは インドネシア人[じん] で、京[きょう] 都[と] 大[だい] 学[がく] の 留[りゅう] 学[がく] 生[せい] です。","uz":"Karina Indoneziyalik bo''lib, Kioto Universitetining chet ellik talabasidir."},{"ja":"ミラーさんは ハンサムで、親切[しんせつ] です。","uz":"Janob Miller kelishgan va mehribon."},{"ja":"奈良[なら] は 静[しず] かで、きれいな 町[まち] です。","uz":"Nara osuda va go''zal shahar."},{"ja":"カリナさんは 学生[がくせい] で、マリアさんは 主[しゅ] 婦[ふ] です。","uz":"Karina talaba, Mariya esa uy bekasidir."}]}'::jsonb, 16),
  ('m-l17', '17-dars: Fe''lning Nai-shakli va Majburiyat', '第17課：ない形と義務（〜ないでください・なければなりません）', 'N5', 14, 40, '{"vocab":[{"ja":"覚えます (おぼえます)","romaji":"おぼえます","uz":"yod olmoq"},{"ja":"忘れます (わすれます)","romaji":"わすれます","uz":"unutmoq, esdan chiqarmoq"},{"ja":"なくします","romaji":"なくします","uz":"yo''qotmoq"},{"ja":"出します (だします)","romaji":"だします","uz":"topshirmoq"},{"ja":"[ レポートを～ ]","romaji":"[ レポートを～ ]","uz":"(hisobot topshirmoq)"},{"ja":"払います (はらいます)","romaji":"はらいます","uz":"to''lamoq"},{"ja":"返します (かえします)","romaji":"かえします","uz":"qaytarib bermoq"},{"ja":"出かけます (でかけます)","romaji":"でかけます","uz":"chiqib ketmoq"},{"ja":"脱ぎます (ぬぎます)","romaji":"ぬぎます","uz":"yechmoq (kiyimni ~)"},{"ja":"持って 行きます (もって いきます)","romaji":"もって いきます","uz":"olib bormoq"},{"ja":"持って 来ます (もって きます)","romaji":"もって きます","uz":"olib kelmoq"},{"ja":"心配 します (しんぱい します)","romaji":"しんぱい します","uz":"xavotir olmoq"},{"ja":"残業 します (ざんぎょう します)","romaji":"ざんぎょう します","uz":"belgilangan ish vaqti tugagandan keyin qolib ishlamoq"},{"ja":"出張 します (しゅっちょう します)","romaji":"しゅっちょう します","uz":"xizmat safariga ketmoq"},{"ja":"飲みます (のみます)","romaji":"のみます","uz":"ichmoq"},{"ja":"[ 薬を～ ] ([ くすりを～ ])","romaji":"[ くすりを～ ]","uz":"(dori ichmoq)"},{"ja":"入ります (はいります)","romaji":"はいります","uz":"kirmoq"},{"ja":"[ お風呂に～ ] ([ おふろに～ ])","romaji":"[ おふろに～ ]","uz":"(hammomga kirmoq)"},{"ja":"大切 [ な ] (たいせつ [ な ])","romaji":"たいせつ [ な ]","uz":"muhim"},{"ja":"大丈夫 [ な ] (だいじょうぶ [ な ])","romaji":"だいじょうぶ [ な ]","uz":"hammasi joyida, xavotirga o''rin yo''q"},{"ja":"危ない (あぶない)","romaji":"あぶない","uz":"xavfli"},{"ja":"問題 (もんだい)","romaji":"もんだい","uz":"masala; muammo"},{"ja":"答え (こたえ)","romaji":"こたえ","uz":"javob"},{"ja":"禁煙 (きんえん)","romaji":"きんえん","uz":"chekish taqiqlanadi"},{"ja":"[ 健康 ] 保険証 ([ けんこう ] ほけんしょう)","romaji":"[ けんこう ] ほけんしょう","uz":"tibbiy sug''urta guvohnomasi"},{"ja":"風邪 (かぜ)","romaji":"かぜ","uz":"shamollash"},{"ja":"熱 (ねつ)","romaji":"ねつ","uz":"isitma"},{"ja":"病気 (びょうき)","romaji":"びょうき","uz":"kasal, betob; kasallik"},{"ja":"薬 (くすり)","romaji":"くすり","uz":"dori"},{"ja":"[ お ] 風呂 ([ お ] ふろ)","romaji":"[ お ] ふろ","uz":"hammom"},{"ja":"上着 (うわぎ)","romaji":"うわぎ","uz":"korjoma, kostyum"},{"ja":"下着 (したぎ)","romaji":"したぎ","uz":"ichki kiyim"},{"ja":"先生 (せんせい)","romaji":"せんせい","uz":"doktor (shifokorga murojaat etish)"},{"ja":"２、３日 (２、３にち)","romaji":"２、３にち","uz":"ikki-uch kun"},{"ja":"２、３～","romaji":"２、３～","uz":"ikki-uch (narsa, buyum)"},{"ja":"～までに","romaji":"～までに","uz":"~gacha"},{"ja":"ですから","romaji":"ですから","uz":"shu sababli"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"どう しましたか。","romaji":"どう しましたか。","uz":"Nima bo''ldi."},{"ja":"[ ～が ]  痛[いた] いです。","romaji":"[ ～が ]  痛[いた] いです。","uz":"~im og''riyapti"},{"ja":"のど","romaji":"のど","uz":"tomoq"},{"ja":"お大[だい] 事[じ] に。","romaji":"お大[だい] 事[じ] に。","uz":"Sog''ayib keting. (Betob kishiga nisbatan aytiladigan ibora bo''lib, suhbat so''ngida qo''llaniladi )"}],"grammar":[{"pattern":"FE’Lning  ない -shakli","meaning":"ない da tugaydigan fe''llarga “FE''Lning ない -shakli” deyiladi. かかない so''zining o''zagi bo''lgan かか , かきます felining ない -shaklidir. Quyida ない - shaklining qanday vuju…","example":""},{"pattern":"FE’Lning  ない -shakli  ないで ください HARAKATNI BAJARMASLIKKA","meaning":"CHAQIRISH Bu tuzilma biror narsani qilmaslikni iltimos qilish yoki buyurishda qo''llaniladi.","example":"わたしは 元[げん] 気[き] ですから、心配[しんぱい] しないで ください。"},{"pattern":"FE’Lning  ない -shakli  なければ なりません HARAKATNI BAJARISH","meaning":"SHARTLIGI IFODASI Bu tuzilma ish-harakat ijrochisining xohishidan qat''iy nazar harakatni amalga oshirish zarurligini ko''rsatadi. Keyingi misolda tuzilma inko…","example":"薬[くすり] を 飲[の] まなければ なりません。 Men dori ichishim kerak."},{"pattern":"FE’Lning  ない -shakli  なくても いいです","meaning":"BAJARMASLIKKA RUXSAT Bu gap tuzilmasi ish-harakatni ko''rsatuvchi fe''lni amalga oshirmasa ham bo''lishini anglatadi.","example":"あした 来[こ] なくても いいです。"},{"pattern":"OT (to`ldiruvchi)  は","meaning":"6-darsdan bilib olgan bo''lsangiz, を yuklamasi vositasiz to''ldiruvchini ifodalash uchun xizmat qiladi. を ni は ga o''zgartirish yo''li bilan to''ldiruvchi gapning…","example":"荷[に] 物[もつ] は ここに 置[お] かないで ください。"},{"pattern":"OT (vaqt)  までに FE’L","meaning":"までに ish-harakatning belgilangan vaqtgacha bajarilishini ko''rsatadi. [Eslatma] までに bilan まで o''rtasidagi faqqa e''tibor bering. ５時[じ] まで 働[はたら] きます。 Soat 5 gach…","example":"会[かい] 議[ぎ] は ５時[じ] までに 終[お] わります。"}],"phrases":[{"ja":"わたしは 元[げん] 気[き] ですから、心配[しんぱい] しないで ください。","uz":"Men sog''-salomatman, xavotir olmang."},{"ja":"ここで 写真[しゃしん] を 撮[と] らないで ください。","uz":"Bu yerda suratga olmang."},{"ja":"薬[くすり] を 飲[の] まなければ なりません。 Men dori ichishim kerak.","uz":"HARAKATNI"},{"ja":"あした 来[こ] なくても いいです。","uz":"Ertaga kelmasangiz ham bo''ladi."},{"ja":"荷[に] 物[もつ] は ここに 置[お] かないで ください。","uz":"Yukingizni bu yerga qo''ymang."},{"ja":"昼[ひる] ごはんは 会社[かいしゃ] の 食[しょく] 堂[どう] で 食[た] べます。","uz":"Tushlikni korxona oshxonasida qilaman."},{"ja":"会[かい] 議[ぎ] は ５時[じ] までに 終[お] わります。","uz":"Majlis soat 5 gacha (shungacha bo''lgan vaqtning ichida) tugaydi."},{"ja":"土[ど] 曜[よう] 日[び] までに 本[ほん] を 返[かえ] さなければ なりません。","uz":"Shanbagacha (shungacha bo''lgan vaqtning ichida) kitobni qaytarishim kerak."}]}'::jsonb, 17),
  ('m-l18', '18-dars: Lug''at shakli (Jishokei) va Qobiliyat/Qiziqish', '第18課：辞書形と可能・趣味（ことができます・まえに）', 'N5', 16, 30, '{"vocab":[{"ja":"できます","romaji":"できます","uz":"qila olmoq, bajara olmoq"},{"ja":"洗います (あらいます)","romaji":"あらいます","uz":"yuvmoq"},{"ja":"弾きます (ひきます)","romaji":"ひきます","uz":"chalmoq (musiqa asbobini~)"},{"ja":"歌います (うたいます)","romaji":"うたいます","uz":"kuylamoq, qo''shiq aytmoq"},{"ja":"集めます (あつめます)","romaji":"あつめます","uz":"yig''moq, to''plamoq"},{"ja":"捨てます (すてます)","romaji":"すてます","uz":"tashlamoq"},{"ja":"換えます (かえます)","romaji":"かえます","uz":"almashtirmoq, o''zgartirmoq"},{"ja":"運転 します (うんてん します)","romaji":"うんてん します","uz":"haydamoq (transport ~)"},{"ja":"予約 します (よやく します)","romaji":"よやく します","uz":"buyurtma bermoq"},{"ja":"見学 します (けんがく します)","romaji":"けんがく します","uz":"kuzatmoq, ko''rmoq (o''rganish maqsadida)"},{"ja":"ピアノ","romaji":"ピアノ","uz":"pianino"},{"ja":"～メートル","romaji":"～メートル","uz":"~ metr"},{"ja":"国際～ (こくさい～)","romaji":"こくさい～","uz":"xalqaro ~"},{"ja":"現金 (げんきん)","romaji":"げんきん","uz":"naqd pul"},{"ja":"趣味 (しゅみ)","romaji":"しゅみ","uz":"qiziqish"},{"ja":"日記 (にっき)","romaji":"にっき","uz":"kundalik daftar"},{"ja":"［お］祈り (［お］いのり)","romaji":"［お］いのり","uz":"ibodat ( ～を します ibodat qilmoq)"},{"ja":"課長 (かちょう)","romaji":"かちょう","uz":"bo''lim boshlig''i"},{"ja":"部長 (ぶちょう)","romaji":"ぶちょう","uz":"departament boshlig''i ( 課長 dan yuqori lavozim)"},{"ja":"社長 (しゃちょう)","romaji":"しゃちょう","uz":"korxona boshlig''i"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"動物[どうぶつ]","romaji":"動物[どうぶつ]","uz":"jonivor, hayvon"},{"ja":"馬[うま]","romaji":"馬[うま]","uz":"ot"},{"ja":"へえ","romaji":"へえ","uz":"A?! (Hayratlanish hissini ifodalovchi ibora)"},{"ja":"それは おもしろいですね。","romaji":"それは おもしろいですね。","uz":"Qiziq-a?"},{"ja":"なかなか","romaji":"なかなか","uz":"sira, hech (inkor gapda qo''llaniladi)"},{"ja":"牧[ぼく] 場[じょう]","romaji":"牧[ぼく] 場[じょう]","uz":"ferma"},{"ja":"ほんとうですか。","romaji":"ほんとうですか。","uz":"Rostdanmi?"},{"ja":"ぜひ","romaji":"ぜひ","uz":"albatta"},{"ja":"ビートルズ","romaji":"ビートルズ","uz":"“Bitlz” – mashhur ingliz musiqa guruhi"}],"grammar":[{"pattern":"FE’Lning lug`atdagi shakli","meaning":"“Fe''lning lug''atdagi shakli” fe''lning asosiy shakli hisoblanadi. Lug''atlarda fe''lning shunday shakli ko''rsatilib, u fe''lning boshlang''ich shakli hisoblanadi.…","example":""},{"pattern":"FE’Lning lug`atdagi shakli  こと ができます BAJARA OLISH","meaning":"IBORASI Ish-harakatni bajarish imkoniyati va qobiliyatini できます fe''li anglatadi. OT yoki “FE''Lning lug''atdagi shakli こと ” ning が dan oldin kelishi ayni mana s…","example":"ミラーさんは 日本語[にほんご] が できます。"},{"pattern":"OT  Mening sevimli","meaning":"わたしの 趣[しゅ] 味[み] です FE''Lning lug''atdagi shakli こと mashg''ulotim","example":"va  ⑥ -misollarda ko`rsatilganidek, FE’Lning lug`atdagi shakli  こと  OTga nisbatan"},{"pattern":"FE’L 1 ning lug`atdagi shakli BIR HARAKATNING","meaning":"","example":""},{"pattern":"OT  の まえに、 FE’L 2 BOSHQASIDAN OLDIN","meaning":"SON (muddat) KELISHI 1) FE''L Bunday turdagi gaplarda FE''L 2 da ko''rsatilgan harakat FE''L 1 dagi harakatdan oldin amalga oshishini ko''rsatadi. Garchi FE''L 2 o…","example":"日[に] 本[ほん] へ 来[く] る まえに、日[に] 本[ほん] 語[ご] を 勉[べん] 強[きょう] しました。"},{"pattern":"なかなか","meaning":"なかなか inkor gapda “ oson emas ”, “ hech ” degan ma''nolarni anglatadi. [Eslatma] ⑪ -misolda ko''rsatilgan にほんでは so''zidagi は diqqatni gap ketayotgan joyga qarati…","example":"日[に] 本[ほん] では なかなか 馬[うま] を 見[み] ることが できません。"},{"pattern":"ぜひ","meaning":"ぜひ ravishi 「ほしいです」 , “FE''Lning ます -shakli たいです ” , “FE''Lning て -shakli ください ”ga o''xshagan iboralar qo''llanilgan gapda ishonchni yoki tilakni kuchaytirib kela…","example":"ぜひ 北海道[ほっかいどう] へ 行[い] きたいです。"}],"phrases":[{"ja":"ミラーさんは 日本語[にほんご] が できます。","uz":"Janob Miller yapon tilida gaplasha oladi."},{"ja":"雪[ゆき] が たくさん 降[ふ] りましたから、ことしは スキーが できます。","uz":"Ko''p qor yoqqanligi sababli, bu yil chang''i ucha olamiz."},{"ja":"ミラーさんは 漢[かん] 字[じ] を 読[よ] むことが できます。","uz":"Janob Miller iyerogliflarni o''qiy oladi."},{"ja":"カードで 払[はら] うことが できます。","uz":"Kartochka yordamida to''lasa bo''ladi."},{"ja":"va  ⑥ -misollarda ko`rsatilganidek, FE’Lning lug`atdagi shakli  こと  OTga nisbatan","uz":"mashg''ulotning turkumi haqida aniqroq ta''rifni beradi."},{"ja":"わたしの 趣[しゅ] 味[み] は 音楽[おんがく] です。","uz":"Mening sevimli mashg''ulotim-musiqa."},{"ja":"わたしの 趣[しゅ] 味[み] は 音楽[おんがく] を 聞[き] くことです。 Mening sevimli mashg`ulotim-musiqa","uz":"tinglash."},{"ja":"日[に] 本[ほん] へ 来[く] る まえに、日[に] 本[ほん] 語[ご] を 勉[べん] 強[きょう] しました。","uz":"Yaponiyaga kelishimdan oldin yapon tilini o''rgandim."}]}'::jsonb, 18),
  ('m-l19', '19-dars: Fe''lning Ta-shakli, Tajriba va O''zgarish', '第19課：た形・経験と変化（たことがあります・たり・くなります）', 'N5', 18, 35, '{"vocab":[{"ja":"登ります (のぼります)","romaji":"のぼります","uz":"chiqmoq, ko''tarilmoq"},{"ja":"[ 山に～ ] ([ やまに～ ])","romaji":"[ やまに～ ]","uz":"(toqqa chiqmoq)"},{"ja":"泊まります (とまります)","romaji":"とまります","uz":"tunamoq"},{"ja":"[ ホテルに～ ]","romaji":"[ ホテルに～ ]","uz":"(mehmonxonada tunamoq)"},{"ja":"掃除 します (そうじ します)","romaji":"そうじ します","uz":"tozalamoq"},{"ja":"洗濯 します (せんたく します)","romaji":"せんたく します","uz":"kir yuvmoq"},{"ja":"練習 します (れんしゅう します)","romaji":"れんしゅう します","uz":"mashq qilmoq"},{"ja":"なります","romaji":"なります","uz":"bo''lmoq"},{"ja":"眠い (ねむい)","romaji":"ねむい","uz":"uyqisiramoq"},{"ja":"強い (つよい)","romaji":"つよい","uz":"kuchli"},{"ja":"弱い (よわい)","romaji":"よわい","uz":"kuchsiz"},{"ja":"調子が いい (ちょうしが いい)","romaji":"ちょうしが いい","uz":"o''zini yaxshi his qilmoq; soz"},{"ja":"調子が 悪い (ちょうしが わるい)","romaji":"ちょうしが わるい","uz":"o''zini yomon his qilmoq; nosoz"},{"ja":"調子 (ちょうし)","romaji":"ちょうし","uz":"kayfiyat, holat"},{"ja":"ゴルフ","romaji":"ゴルフ","uz":"golf ( ～を します : golf o''ynamoq)"},{"ja":"相撲 (すもう)","romaji":"すもう","uz":"sumo kurashi"},{"ja":"パチンコ","romaji":"パチンコ","uz":"o''yin avtomati, pachinko ( ～を します : pachinko o''ynamoq)"},{"ja":"お茶 (おちゃ)","romaji":"おちゃ","uz":"choy"},{"ja":"日 (ひ)","romaji":"ひ","uz":"kun"},{"ja":"一度 (いちど)","romaji":"いちど","uz":"bir marta"},{"ja":"一度も (いちども)","romaji":"いちども","uz":"bir marta ham, hech, sira (inkor gapda qo''llaniladi.)"},{"ja":"だんだん","romaji":"だんだん","uz":"asta-sekin, tobora"},{"ja":"もうすぐ","romaji":"もうすぐ","uz":"tez orada"},{"ja":"おかげさまで","romaji":"おかげさまで","uz":"sharofatingiz bilan"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"乾杯[かんぱい]","romaji":"乾杯[かんぱい]","uz":"Qani, oldik (qadah)"},{"ja":"実[じつ] は","romaji":"実[じつ] は","uz":"ochig''i, rostini aytsam"},{"ja":"ダイエット","romaji":"ダイエット","uz":"parhez ( ～を します : parhez qilmoq)"},{"ja":"何回[なんかい] も","romaji":"何回[なんかい] も","uz":"bir necha marotaba"},{"ja":"しかし","romaji":"しかし","uz":"lekin"},{"ja":"無理[むり] ［な］","romaji":"無理[むり] ［な］","uz":"imkoni yo''q (narsa), ilojsiz (narsa)"},{"ja":"体[からだ] に いい","romaji":"体[からだ] に いい","uz":"sog''liqqa foyda"},{"ja":"ケーキ","romaji":"ケーキ","uz":"tort, pirojniy"},{"ja":"葛[かつ] 飾[しか] 北[ほく] 斎[さい]","romaji":"葛[かつ] 飾[しか] 北[ほく] 斎[さい]","uz":"Katsushika Hokusay (1760 - 1849) Edo davrining yetuk rassomi"}],"grammar":[{"pattern":"FE’Lning  た -shakli","meaning":"Bu darsda “FE''Lning た -shakli” xususiyatlari haqida bilib olasizlar. “FE''Lning た - shakli”ning tuzilish qoidasi quyidagicha: (Asosiy o''quv qo''llanmaning, 19-…","example":""},{"pattern":"FE’Lning  た -shakli  ことが あります TAJRIBADA BO`LGANLIGI","meaning":"IFODASI Bunday turdagi gaplar biror bir harakatni tasvirlashda tajribasi borligini bildirish uchun qo''llaniladi. 9-darsdan bilib olganingizdek, bunday gap tu…","example":"馬[うま] に 乗[の] った ことが あります。 Men otga minganman."},{"pattern":"FE’Lning た -shakli り、 FE’Lning  た -shakli り します","meaning":"goh FE''L…goh FE''L va x. z 10-darsda siz ko''p narsalar ichidan bir nechtasini ko''rsatish usulini bilib oldingiz ( ～や～ [ など ]). Bu darsda sizlar ayrim harakatl…","example":"日[にち] 曜[よう] 日[び] は テニスを したり、映[えい] 画[が] を 見[み] たり します。"},{"pattern":"い -SIFAT  ( ～い )  → ～く","meaning":"HOLAT YOKI SHAROITNING な -SIFAT ［な］ → に なります O''ZGARISHI IFODASI OT に Holat yoki shartlarning o''zgarishini ifodalash uchun なります xizmat qiladi.","example":"寒[さむ] い →  寒[さむ] く なります sovuq tushmoq"},{"pattern":"そう ですね","meaning":"Suhbatdoshning fikrini tushunganligini yoki u bilan hamfikr ekanligini bildirish uchun そうですね xizmat qiladi. そうですか ham bir xil ma''noni anglatib, gap ohangini…","example":"寒[さむ] く なりましたね。 Kun sovuqlashdi-a."}],"phrases":[{"ja":"馬[うま] に 乗[の] った ことが あります。 Men otga minganman.","uz":"Bu turdagi gaplar bilan o''tgan zamonda shunchaki bo''lib o''tgan voqea"},{"ja":"去年[きょねん] 北海道[ほっかいどう] で 馬[うま] に 乗[の] りました。","uz":"Men o''tgan yili Xokkaydoda otga mindim."},{"ja":"日[にち] 曜[よう] 日[び] は テニスを したり、映[えい] 画[が] を 見[み] たり します。","uz":"Men yakshanba kunlari tennis o''ynayman, kino ko''raman."},{"ja":"日[にち] 曜[よう] 日[び] は テニスを したり、映[えい] 画[が] を 見[み] たり しました。","uz":"Men o''tgan yakshanba kuni tennis o''ynadim, kino ko''rdim."},{"ja":"日[にち] 曜[よう] 日[び] は テニスを して、映[えい] 画[が] を 見[み] ました。","uz":"Men o''tgan yakshanba kuni tennis o''ynab, kino ko''rdim."},{"ja":"-misolda harakat ketma-ketligini aniq ko`rsatilgan.  ④ -misolda harakatlar","uz":"orasida hech qanday vaqt bilan bog''liqlik yo''q. Bu harakatlar so''zlovchining"},{"ja":"寒[さむ] い →  寒[さむ] く なります sovuq tushmoq","uz":""},{"ja":"元[げん] 気[き]  [ な ]  →  元[げん] 気[き] に なります sog`aymoq","uz":""}]}'::jsonb, 19),
  ('m-l20', '20-dars: Oddiy uslub (Futsuugo) va Do''stona muloqot', '第20課：普通形と会話体（丁寧体から普通体へ）', 'N5', 10, 40, '{"vocab":[{"ja":"要ります (いります)","romaji":"いります","uz":"kerak bo''lmoq, zarur bo''lmoq"},{"ja":"[ ビザが～ ]","romaji":"[ ビザが～ ]","uz":"(viza kerak)"},{"ja":"調べます (しらべます)","romaji":"しらべます","uz":"tekshirmoq, qarab ko''rmoq"},{"ja":"直します (なおします)","romaji":"なおします","uz":"to''g''rilamoq, tuzatmoq"},{"ja":"修理 します (しゅうり します)","romaji":"しゅうり します","uz":"tuzatmoq, ta''mirlamoq"},{"ja":"電話 します (でんわ します)","romaji":"でんわ します","uz":"qo''ng''iroq qilmoq, telefon qilmoq"},{"ja":"僕 (ぼく)","romaji":"ぼく","uz":"men ( わたし ning og''zaki shakli, odatda erkak kishi qo''llaydi)"},{"ja":"君 (きみ)","romaji":"きみ","uz":"sen ( あなた ning og''zaki shakli, odatda erkak kishi qo''llaydi)"},{"ja":"～君 (～くん)","romaji":"～くん","uz":"( ～さん ning og''zaki shakli, odatda yoshi kichik yoki mavqei yuqori bo''lmagan erkak kishilarning ismiga qo''shib qo''llaniladi)"},{"ja":"うん","romaji":"うん","uz":"ha, mayli, xo''p ( はい ning og''zaki shakli)"},{"ja":"ううん","romaji":"ううん","uz":"yo''q ( いいえ ning og''zaki shakli)"},{"ja":"サラリーマン","romaji":"サラリーマン","uz":"korxona xodimi"},{"ja":"ことば","romaji":"ことば","uz":"so''z, til"},{"ja":"物価 (ぶっか)","romaji":"ぶっか","uz":"narx-navo"},{"ja":"着物 (きもの)","romaji":"きもの","uz":"kimono (yapon milliy kiyimi)"},{"ja":"ビザ","romaji":"ビザ","uz":"viza"},{"ja":"初め (はじめ)","romaji":"はじめ","uz":"boshi(da)"},{"ja":"終わり (おわり)","romaji":"おわり","uz":"oxiri(da)"},{"ja":"こっち","romaji":"こっち","uz":"bu yer, bu yoqqa ( こちら ning og''zaki shakli)"},{"ja":"そっち","romaji":"そっち","uz":"o''sha yer, o''sha yoqqa ( そちら ning og''zaki shakli)"},{"ja":"あっち","romaji":"あっち","uz":"u yer, u yoqqa"},{"ja":"どっち","romaji":"どっち","uz":"qayer, qayoqqa ( どちら ning og''zaki shakli)"},{"ja":"この 間 (この あいだ)","romaji":"この あいだ","uz":"yaqinda (vaqtga nisbatan), o''tgan safar"},{"ja":"みんなで","romaji":"みんなで","uz":"hammamiz birga"},{"ja":"～けど","romaji":"～けど","uz":"~u / yu, ~. ; ~, lekin, ~. ( が ning og''zaki shakli)"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"国[くに] へ 帰[かえ] るの？","romaji":"国[くに] へ 帰[かえ] るの？","uz":"Vataningizga qaytasizmi?"},{"ja":"どう するの？","romaji":"どう するの？","uz":"Endi nima qilasiz?"},{"ja":"どう しようかな。","romaji":"どう しようかな。","uz":"Nima qilsak ekan-a?"},{"ja":"よかったら","romaji":"よかったら","uz":"Mumkin bo''lsa~. Lozim topsangiz~."},{"ja":"いろいろ","romaji":"いろいろ","uz":"turli, har xil (bu yerda “ravish” bo''lib kelgan. いろいろ 10-darsda “sifat” bo''lib kelgan)"}],"grammar":[{"pattern":"Oddiy va hurmat shaklidagi ko`rinish","meaning":"Yapon tilida gapning 2 xil ko''rinishi bor: hurmat shakl va oddiy shakl. Gapning hurmat shaklidagi ko''rinishi Gapning oddiy shaklidagi ko''rinishi (So''zlashuv…","example":""},{"pattern":"Gapning hurmat shakli va oddiy shakllarining qo`llanilishi.","meaning":"1) Hurmat shaklini har doim, har qanday holatda hamma tinglovchiga nisbatan qo''llash mumkin. Gapning hurmat shakli odatda do''stlik aloqalarida bo''lmagan o''zi…","example":""},{"pattern":"Og`zaki so`zlashuvda gapning oddiy shakli.","meaning":"1) Qoidaga ko''ra oddiy shakldagi so''roq gaplarda か so''roq yuklamasi qo''llanilmay, so''roq gapning oxirida ohangni ko''tarish bilan ifodalaniladi. Masalan: のむ (…","example":"コーヒーを 飲[の] む？  ( ® )"}],"phrases":[{"ja":"コーヒーを 飲[の] む？  ( ® )","uz":"Qahva ichasanmi?"},{"ja":"今晩[こんばん] 暇[ひま] ？","uz":"Sen bugun kechasi bo''shmisan?"},{"ja":"ごはん  [ を ]  食[た] べる？","uz":"Ovqat yeysanmi?"},{"ja":"あした 京[きょう] 都[と]  [ へ ]  行[い] かない？","uz":"Ertaga men bilan Kiotoga bormaysanmi?"},{"ja":"この りんご  [ は ]  おいしいね。","uz":"Bu olma shirin-a?"},{"ja":"そこに はさみ  [ が ]  ある？","uz":"U yerda qaychi bormi?"},{"ja":"辞[じ] 書[しょ] 、持[も] って  [ い ]  る？","uz":"Senda lug''at bormi? … うん、持[も] って [ い ] る。 … Ha, bor. … ううん、持[も] って [ い ] ない。 … Yo''q."},{"ja":"その カレーライス  [ は ]  おいしい？","uz":"O''sha guruchli “karerays” mazalimi?"}]}'::jsonb, 20),
  ('m-l21', '21-dars: Shaxsiy fikr va Iqtibos keltirish', '第21課：意見と引用（〜と思います・〜と言いました）', 'N5', 12, 30, '{"vocab":[{"ja":"思います (おもいます)","romaji":"おもいます","uz":"o''ylamoq, fikrlamoq"},{"ja":"言います (いいます)","romaji":"いいます","uz":"demoq, aytmoq"},{"ja":"足ります (たります)","romaji":"たります","uz":"yetmoq, yetarli bo''lmoq (ulush)"},{"ja":"勝ちます (かちます)","romaji":"かちます","uz":"g''olib bo''lmoq, yutmoq"},{"ja":"負けます (まけます)","romaji":"まけます","uz":"mag''lub bo''lmoq, yutqazmoq"},{"ja":"あります","romaji":"あります","uz":"bor bo''lmoq"},{"ja":"[ お祭りが～ ] ([ おまつりが～ ])","romaji":"[ おまつりが～ ]","uz":"(bayram bor, bayram bo''lmoq)"},{"ja":"役に 立ちます (やくに たちます)","romaji":"やくに たちます","uz":"nafi tegmoq, foydasi bo''lmoq"},{"ja":"むだ［な］","romaji":"むだ［な］","uz":"befoyda, bekorchi (narsa, buyum)"},{"ja":"不便［な］ (ふべん［な］)","romaji":"ふべん［な］","uz":"noqulay (sharoit)"},{"ja":"同じ (おなじ)","romaji":"おなじ","uz":"bir xil"},{"ja":"すごい","romaji":"すごい","uz":"zo''r, ajoyib (qoyil qolgan holatda, ham ijobiy, ham salbiy ma''noda keladi)"},{"ja":"首相 (しゅしょう)","romaji":"しゅしょう","uz":"bosh vazir"},{"ja":"大統領 (だいとうりょう)","romaji":"だいとうりょう","uz":"prezident"},{"ja":"政治 (せいじ)","romaji":"せいじ","uz":"siyosat"},{"ja":"ニュース","romaji":"ニュース","uz":"yangilik"},{"ja":"スピーチ","romaji":"スピーチ","uz":"nutq （～をします： nutq so''zlamoq ）"},{"ja":"試合 (しあい)","romaji":"しあい","uz":"musobaqa"},{"ja":"アルバイト","romaji":"アルバイト","uz":"qo''shimcha ish （～をします： qo''shimcha ish qilmoq ）"},{"ja":"意見 (いけん)","romaji":"いけん","uz":"fikr"},{"ja":"［お］話 (［お］はなし)","romaji":"［お］はなし","uz":"gap, suhbat （～をします： suhbatlashmoq ）"},{"ja":"ユーモア","romaji":"ユーモア","uz":"hajv, yumor"},{"ja":"むだ","romaji":"むだ","uz":"befoyda (narsa), bekorchi (narsa)"},{"ja":"デザイン","romaji":"デザイン","uz":"dizayn"},{"ja":"交通 (こうつう)","romaji":"こうつう","uz":"transport qatnovi"},{"ja":"ラッシュ","romaji":"ラッシュ","uz":"tiqilinch transport qatnovi"},{"ja":"最近 (さいきん)","romaji":"さいきん","uz":"shu kunlarda"},{"ja":"たぶん","romaji":"たぶん","uz":"balki"},{"ja":"きっと","romaji":"きっと","uz":"shubhasiz"},{"ja":"ほんとうに","romaji":"ほんとうに","uz":"haqiqatan"},{"ja":"そんなに","romaji":"そんなに","uz":"unchalik"},{"ja":"～に ついて","romaji":"～に ついて","uz":"~ haqida"},{"ja":"しかたが ありません。","romaji":"しかたが ありません。","uz":"Na iloj."},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"しばらくですね。","romaji":"しばらくですね。","uz":"Ko''rishmaganimizga ancha bo''ldi-ya? / Ko''rinmaysiz?"},{"ja":"～でも 飲[の] みませんか。","romaji":"～でも 飲[の] みませんか。","uz":"~mi ichmaymizmi?"},{"ja":"見[み] ないと･････。","romaji":"見[み] ないと･････。","uz":"Qaramasak bo''lmaydi."},{"ja":"もちろん","romaji":"もちろん","uz":"albatta"},{"ja":"カンガルー","romaji":"カンガルー","uz":"kenguru"},{"ja":"キャプテン･クック","romaji":"キャプテン･クック","uz":"Kapitan Djeyms Kuk (1728-1779)"}],"grammar":[{"pattern":"Oddiy shakl と 思[おも] います O`Z FIKRI VA TAXMININI IFODA ETISH","meaning":"Bildiriladigan fikr yoki xabar 思[おも] います fe''li yordamida と bog''lovchi yuklamasi orqali ifodalanadi. 1) Taxmin Agar gapda anglashilayotgan taxmin inkor ma''nos…","example":"あした 雨[あめ] が 降[ふ] る と 思[おも] います。"},{"pattern":"“GAP”","meaning":"と 言[い] います SHAXSNING FIKR VA MULOHAZASINI Oddiy shakl YETKAZISH 言[い] います so''zi bilan izohlanadigan gap と yordamida bog''lanadi. 1) Ko''chirma gaplarda muallif…","example":"寝[ね] るまえに「お休[やす] みなさい」と 言[い] います。"},{"pattern":"FE’L  oddiy shakl  TASDIQNI TALAB QILIB","meaning":"い -SIFAT KELADIGAN でしょう？ な -SIFAT oddiy shakl OYDINLASHTIRUVCHI OT ～だ SAVOL Agar so''zlovchi berayotgan savolning mazmuni haqida o''z suhbatdoshini xabardor va…","example":"あした パーティーに 行[い] くでしょう ?"},{"pattern":"OT 1  (o`rin-joy) で OT 2  が あります","meaning":"Agar gapda konsert, bayram, tabiiy ofat va shu kabi ish-harakatni anglatadigan OT 2 (voqea-hodisalar) kelsa, ushbu gapdagi あります so''zi “ yuz bermoq ”, “ bo''li…","example":"東[とう] 京[きょう] で 日[に] 本[ほん] と ブラジルの サッカーの 試[し] 合[あい] があります。"},{"pattern":"OT (vaziyat) で","meaning":"Agar biror-bir voqea-hodisa davomida harakat bajarilgan bo''lsa, ushbu voqea- hodisani ifodalovchi OTdan keyin で o''rin-payt kelishigi qo''shimchasi qo''yiladi.","example":"会[かい] 議[ぎ] で 何[なに] か 意[い] 見[けん] を 言[い] いましたか。"},{"pattern":"OT  でも FE’L","meaning":"So''zlovchi bir turdagi predmetlar orasidan aynan bir narsani ajratib, uni suhbatdoshiga taklif qilayotgan paytlarda でも dan foydalaniladi. ichmaymizmi?","example":"ちょっと ビールでも 飲[の] みませんか。"},{"pattern":"FE’Lning  ない -shakli  ないと…","meaning":"Ushbu tuzilma “FE''Lning ない -shakli ないと いけません ” tuzilmasidan いけません so''zini tushirib qoldirish bilan hosil bo''ladi. Ushbu shakl xuddi 17-darsda siz bilib olgan…","example":"もう 帰[かえ] らないと …"}],"phrases":[{"ja":"あした 雨[あめ] が 降[ふ] る と 思[おも] います。","uz":"Ertaga yomg''ir yog''sa kerak (deb o''ylayman)."},{"ja":"テレサちゃんは もう 寝[ね] た と 思[おも] います。","uz":"Tereza allaqachon uxlagan bo''lsa kerak (deb o''ylayman)."},{"ja":"ミラーさんは この ニュースを 知[し] って いますか。","uz":"Janob Millerning bu yangilikdan xabari bormi? …Yo''q, menimcha xabari bo''lmasa kerak (deb o''ylayman)."},{"ja":"日[に] 本[ほん] は 物[ぶっ] 価[か] が 高[たか] い と 思[おも] います。","uz":"Yaponiyada narx-navo baland deb o''ylayman."},{"ja":"新[あたら] しい 空港[くうこう] に ついて どう 思[おも] いますか。","uz":"Yangi aeroport haqida qanday fikrdasiz? … Juda ko''rkam, ammo transport qatnovi biroz noqulay deb o''ylayman."},{"ja":"A:  ファクスは 便[べん] 利[り] ですね。","uz":"Faks - juda qulay, shunday emasmi?"},{"ja":"寝[ね] るまえに「お休[やす] みなさい」と 言[い] います。","uz":"Uxlashga yotishdan avval “Hayrli tun” deyiladi."},{"ja":"ミラーさんは「来[らい] 週[しゅう] 東[とう] 京[きょう] へ 出張[しゅっちょう] します」と 言[い] いました。","uz":"Janob Miller: “Kelasi hafta Tokioga xizmat safariga ketaman”, - deb aytdilar."}]}'::jsonb, 21),
  ('m-l22', '22-dars: Aniqlovchi gaplar (Kanshi / Modifying Clauses)', '第22課：名詞修飾（連体修飾節）', 'N5', 14, 35, '{"vocab":[{"ja":"着ます (きます)","romaji":"きます","uz":"kiymoq (beldan yuqoriga qo''llaniladi)"},{"ja":"[ シャツを～ ]","romaji":"[ シャツを～ ]","uz":"ko''ylak kiymoq"},{"ja":"はきます","romaji":"はきます","uz":"kiymoq (beldan pastda qo''llaniladi)"},{"ja":"[ 靴を～ ] ([ くつを～ ])","romaji":"[ くつを～ ]","uz":"poyafzal kiymoq"},{"ja":"かぶります","romaji":"かぶります","uz":"kiymoq (boshga qo''llaniladi)"},{"ja":"[ 帽子を～ ] ([ ぼうし～ ])","romaji":"[ ぼうし～ ]","uz":"bosh kiyim kiymoq"},{"ja":"かけます","romaji":"かけます","uz":"Taqmoq"},{"ja":"[ 眼鏡を～ ] ([ めがねを～ ])","romaji":"[ めがねを～ ]","uz":"ko''zoynak taqmoq"},{"ja":"生まれます (うまれます)","romaji":"うまれます","uz":"tug''ilmoq, dunyoga kelmoq"},{"ja":"コート","romaji":"コート","uz":"palto"},{"ja":"スーツ","romaji":"スーツ","uz":"kostum-shim"},{"ja":"セーター","romaji":"セーター","uz":"sviter"},{"ja":"帽子 (ぼうし)","romaji":"ぼうし","uz":"bosh kiyim"},{"ja":"眼鏡 (めがね)","romaji":"めがね","uz":"ko''zoynak"},{"ja":"よく","romaji":"よく","uz":"tez-tez, rosa"},{"ja":"おめでとう ございます。","romaji":"おめでとう ございます。","uz":"Tabriklayman."},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"こちら","romaji":"こちら","uz":"bu ( これ ning hurmat shakli)"},{"ja":"家[や] 賃[ちん]","romaji":"家[や] 賃[ちん]","uz":"uyning ijara haqi"},{"ja":"うーん。","romaji":"うーん。","uz":"Ha. / Xo''p."},{"ja":"ダイニングキチン","romaji":"ダイニングキチン","uz":"oshxona (uyning ~si)"},{"ja":"和[わ] 室[しつ]","romaji":"和[わ] 室[しつ]","uz":"yaponcha xona"},{"ja":"押[お] し入[い] れ","romaji":"押[お] し入[い] れ","uz":"taxmon (ko''rpa-to''shak qo''yadigan maxsus joy)"},{"ja":"布[ふ] 団[とん]","romaji":"布[ふ] 団[とん]","uz":"ko''rpa"},{"ja":"アパート","romaji":"アパート","uz":"xonadon (ko''p qavatli uyda)"},{"ja":"パリ","romaji":"パリ","uz":"Parij"},{"ja":"万[ばん] 里[り] の 長城[ちょうじょう]","romaji":"万[ばん] 里[り] の 長城[ちょうじょう]","uz":"Buyuk Xitoy devori"},{"ja":"余暇[よか] 開発[かいはつ] センター","romaji":"余暇[よか] 開発[かいはつ] センター","uz":"insonlarning bo''sh vatqlari bo''yicha tadqiqot olib boruvchi markaz"},{"ja":"レジャー白書[はくしょ]","romaji":"レジャー白書[はくしょ]","uz":"insonlarning bo''sh vaqtlarini qanday o''tkazishi haqidagi “oq kitob”"}],"grammar":[{"pattern":"Aniqlovchi","meaning":"S iz bilan 2 va 8-darslarda aniqlovchi hosil qilish qoidalarini bilib olgan edik ミラーさんの うち Janob Millerning uyi (2-dars) 新[あたら] しい うち yangi uy (8-dars) きれいな…","example":""},{"pattern":"Aniqlovchi-GAPlar","meaning":"1) OT so''z turkumini aniqlab keluvchi kesim oddiy shaklda ifodalanadi. Gapning kesimi な -sifat bilan ifodalangan gaplarda uning ~ だ oddiy shakli ~ な ga o''zga…","example":"わたしは 先[せん] 週[しゅう] 映[えい] 画[が] を 見[み] ました"},{"pattern":"OT  が","meaning":"Gapda otni aniqlab keluvchi egadan keyin が qo''shimchasi qo''yiladi. ミラーさんは ケーキを 作[つく] りました。 Janob Miller pirog pishirdilar.","example":"これは ミラーさんが 作[つく] った ケーキです。"},{"pattern":"FE’Lning lug`atdagi shakli  時[じ] 間[かん]  / 約束[やくそく]  / 用[よう] 事[じ]","meaning":"Ish-harakatni bajarishga sarflanadigan vaqtni ko''rsatishda gapdagi じかん so''zidan avval “FE''Lning lug''atdagi shakli” keladi. Kelishuv ma''nosini anglatadigan ga…","example":"わたしは 朝[あさ] ごはんを 食[た] べる 時[じ] 間[かん] が ありません。"}],"phrases":[{"ja":"わたしは 先[せん] 週[しゅう] 映[えい] 画[が] を 見[み] ました","uz":"→"},{"ja":"ワンさんは 病院[びょういん] で 働[はたら] いて います","uz":"→ ワンさんが 働[はたら] いて いる 病[びょう] 院[いん]"},{"ja":"わたしは あした 友達[ともだち] に 会[あ] います","uz":"→ わたしが あした 会[あ] う 友達[ともだち]"},{"ja":",  ③  va  ④ -misollardagi tagiga chizilgan otlar aniqlanmish vazifasida","uz":"kelsa, を , で va に yuklamalari tushurib qoldiriladi."},{"ja":"これは ミラーさんが 住[す] んで いた うちです。","uz":"Bu janob Miller yashagan uy."},{"ja":"ミラーさんが 住[す] んで いた うちは 古[ふる] いです。","uz":"Janob Miller yashagan uy eski."},{"ja":"ミラーさんが 住[す] んで いた うちを 買[か] いました。","uz":"Men janob Miller yashagan uyni sotib oldim."},{"ja":"わたしは ミラーさんが 住[す] んで いた うちが 好[す] きです。","uz":"Menga janob Miller yashagan uy yoqadi."}]}'::jsonb, 22),
  ('m-l23', '23-dars: Shart va Vaqt (Qachonki / Qilsa)', '第23課：時と条件（〜とき・〜と、〜）', 'N5', 16, 40, '{"vocab":[{"ja":"聞きます (ききます)","romaji":"ききます","uz":"so''ramoq"},{"ja":"[ 先生に～ ] ([ せんせいに～ ])","romaji":"[ せんせいに～ ]","uz":"(o''qituvchidan so''ramoq)"},{"ja":"回します (まわします)","romaji":"まわします","uz":"aylantirmoq"},{"ja":"引きます (ひきます)","romaji":"ひきます","uz":"tortmoq"},{"ja":"変えます (かえます)","romaji":"かえます","uz":"o''zgartirmoq"},{"ja":"触ります (さわります)","romaji":"さわります","uz":"tegmoq"},{"ja":"[ ドアに～ ]","romaji":"[ ドアに～ ]","uz":"(eshikka tegmoq)"},{"ja":"出ます (でます)","romaji":"でます","uz":"qaytmoq, chiqmoq"},{"ja":"[ お釣りが～ ] ([ おつりが～ ])","romaji":"[ おつりが～ ]","uz":"(qaytim qaytmoq)"},{"ja":"動きます (うごきます)","romaji":"うごきます","uz":"harakatlanmoq, yurmoq"},{"ja":"[ 時計が～ ] ([ とけいが～ ])","romaji":"[ とけいが～ ]","uz":"(soat yurmoq)"},{"ja":"歩きます (あるきます)","romaji":"あるきます","uz":"piyoda yurmoq"},{"ja":"[ 道を～ ] ([ みちを～ ])","romaji":"[ みちを～ ]","uz":"(ko''chada piyoda yurmoq)"},{"ja":"渡ります (わたります)","romaji":"わたります","uz":"o''tmoq; kesib o''tmoq"},{"ja":"[ 橋を～ ] ([ はしを～ ])","romaji":"[ はしを～ ]","uz":"(ko''prikdan o''tmoq)"},{"ja":"気を つけます (きを つけます)","romaji":"きを つけます","uz":"ehtiyot bo''lmoq"},{"ja":"[ 車に ] ([ くるまに～ ])","romaji":"[ くるまに～ ]","uz":"(mashinaga ehtiyot bo''lmoq)"},{"ja":"引っ越し します (ひっこし します)","romaji":"ひっこし します","uz":"ko''chib o''tmoq"},{"ja":"電気屋 (でんきや)","romaji":"でんきや","uz":"elektr buyumlar do''koni; elektr buyumlar do''koni sotuvchisi"},{"ja":"～屋 (～や)","romaji":"～や","uz":"~ do''koni; ~do''koni sotuvchisi"},{"ja":"サイズ","romaji":"サイズ","uz":"o''lcham, hajm"},{"ja":"音 (おと)","romaji":"おと","uz":"tovush"},{"ja":"機械 (きかい)","romaji":"きかい","uz":"texnika, mashina"},{"ja":"つまみ","romaji":"つまみ","uz":"murvat"},{"ja":"故障 (こしょう)","romaji":"こしょう","uz":"buzulish, nosozlik ( ～します : buzilmoq)"},{"ja":"道 (みち)","romaji":"みち","uz":"ko''cha, yo''l"},{"ja":"交差点 (こうさてん)","romaji":"こうさてん","uz":"chorraha"},{"ja":"信号 (しんごう)","romaji":"しんごう","uz":"svetofor"},{"ja":"角 (かど)","romaji":"かど","uz":"muyulish, burulish"},{"ja":"橋 (はし)","romaji":"はし","uz":"ko''prik"},{"ja":"駐車場 (ちゅうしゃじょう)","romaji":"ちゅうしゃじょう","uz":"avto ulovlar to''xtash joyi"},{"ja":"～目 (～め)","romaji":"～め","uz":"~(i)nchi"},{"ja":"［お］正月 (［お］しょうがつ)","romaji":"［お］しょうがつ","uz":"yangi yil"},{"ja":"ごちそうさま [ でした ] 。","romaji":"ごちそうさま [ でした ] 。","uz":"Rahmat. (ovqat uchun)"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"建物[たてもの]","romaji":"建物[たてもの]","uz":"bino"},{"ja":"外国人[がいこくじん] 登[とう] 録[ろく] 証[しょう]","romaji":"外国人[がいこくじん] 登[とう] 録[ろく] 証[しょう]","uz":"chet ellik fuqaroning ro''yxatga olinganlik to''g''risidagi hujjati"},{"ja":"聖[しょう] 徳[とく] 太[たい] 子[し]","romaji":"聖[しょう] 徳[とく] 太[たい] 子[し]","uz":"Shahzoda Shotoku (574-622)"},{"ja":"法[ほう] 隆[りゅう] 寺[じ]","romaji":"法[ほう] 隆[りゅう] 寺[じ]","uz":"Horyuji- Nara viloyatidagi ibodatxona. U Ⅶ asr boshida shahzoda Shotoku tomonidan qurdirilgan."},{"ja":"元[げん] 気[き] 茶[ちゃ]","romaji":"元[げん] 気[き] 茶[ちゃ]","uz":"“Genkichya” choy navi (o''ylab topilgan )"},{"ja":"本[ほん] 田[だ] 駅[えき]","romaji":"本[ほん] 田[だ] 駅[えき]","uz":"“Honda” bekati (o''ylab topilgan )"},{"ja":"図[と] 書[しょ] 館[かん] 前[まえ]","romaji":"図[と] 書[しょ] 館[かん] 前[まえ]","uz":"“Toshokanmae” avtobus bekati (o''ylab topilgan )"}],"grammar":[{"pattern":"FE’Lning lug`atdagi shakli","meaning":"FE''Lning ない -shakli PAYT ERGASH GAPLI い -SIFAT （～い） とき、～ QO''SHMA GAP な -SIFAT な OT の Payt ergash gapli qo''shma gaplar とき bog''lovchisi yordamida bog''lanadi. と…","example":"図[と] 書[しょ] 館[かん] で 本[ほん] を 借[か] りる とき、カードが 要[い] ります。"},{"pattern":"FE’Lning lug`atdagi shakli QO`SHMA GAPDA ISH-","meaning":"とき、～ HARAKATNING FE''Lning た -shakli TUGALLANGANLIK VA TUGALLANMAGANLIK IFODASI とき dan avval kelgan “FE''Lning oddiy shakli” gapga tugallanmagan ish-harakat ma…","example":"国[くに] へ 帰[かえ] る とき、かばんを 買[か] いました。"},{"pattern":"FE’Lning lug`atdagi shakli  と、～ QO`SHMA GAP","meaning":"と bog''lovchisi shart va payt ergash gapli qo''shma gaplarni bog''lash uchun xizmat qiladi va ma''lum bir harakat bajarilishi natijasida boshqa holat vujudga kel…","example":"この ボタンを 押[お] す と、お釣[つ] りが 出[で] ます。"},{"pattern":"OT  が  SIFAT / FE’L","meaning":"Siz 14-darsda tabiatdagi voqeliklarni tasvirlashda gapdagi egadan keyin が yuklamasi qo''yilishini bilib olgan edingiz. Xuddi shuningdek, atrofdagi vaziyat yok…","example":"音[おと] が 小[ちい] さいです。"},{"pattern":"OT (o`rin-joy)  を  FE’L (harakat yo`nalishi)","meaning":"Biror-bir shaxs yoki predmetning harakatlanish joyini ifodalashda を qo''shimchasidan foydalaniladi. Shuningdek, ushbu qo''shimcha さんぽします、わ たります、あるきます kabi fe''l…","example":""}],"phrases":[{"ja":"図[と] 書[しょ] 館[かん] で 本[ほん] を 借[か] りる とき、カードが 要[い] ります。","uz":"Kutubxonadan kitob olish paytida, kutubxona kartochkasi kerak bo''ladi."},{"ja":"使[つか] い方[かた] が わからない とき、わたしに 聞[き] いて ください。","uz":"Foydalanishni tushunmagan paytingizda, mendan so''rang."},{"ja":"体[からだ] の 調[ちょう] 子[し] が 悪[わる] い とき、「元[げん] 気[き] 茶[ちゃ] 」を 飲[の] みます。","uz":"Tobim qochgan paytda, “Genkichya” choyidan ichaman."},{"ja":"暇[ひま] な とき、うちへ 遊[あそ] びに 来ませんか。","uz":"Bo''sh paytingizda, uyimizga mehmonga kelmaysizmi?"},{"ja":"妻[つま] が 病[びょう] 気[き] の とき、会社[かいしゃ] を 休[やす] みます。","uz":"Xotinim kasal bo''lib qolgan paytlarda, ishga bormayman."},{"ja":"若[わか] い とき、あまり 勉[べん] 強[きょう] しませんでした。","uz":"Yoshlik paytimda unchalik dars qilmadim."},{"ja":"子[こ] どもの とき、よく 川[かわ] で 泳[およ] ぎました。","uz":"Bolalik chog''imda men daryoda rosa cho''milar edim."},{"ja":"va  ⑦ -misollardagi sifat va ot bilan ifodalangan payt ergash gapli qo`shma","uz":"gaplarning zamoni bosh gap zamoniga bog''liq bo''lmaydi."}]}'::jsonb, 23),
  ('m-l24', '24-dars: Muruvvat va Yordam (Bermoq, Olib bermoq)', '第24課：授受動詞（くれます・〜てあげます・てもらいます）', 'N5', 18, 30, '{"vocab":[{"ja":"くれます","romaji":"くれます","uz":"bermoq (menga bermoq)"},{"ja":"連れて 行きます (つれて いきます)","romaji":"つれて いきます","uz":"olib bormoq, ergashtirib bormoq (jonli narsani ergashtirib bormoq)"},{"ja":"連れて 来ます (つれて きます)","romaji":"つれて きます","uz":"olib kelmoq, ergashtirib kelmoq (jonli narsani ergashtirib kelmoq)"},{"ja":"送ります (おくります)","romaji":"おくります","uz":"jo''natmoq; olib borib qo''ymoq"},{"ja":"[ 人を～ ] ([ ひとを～ ])","romaji":"[ ひとを～ ]","uz":"(odamni olib borib qo''ymoq)"},{"ja":"紹介します (しょうかい します)","romaji":"しょうかい します","uz":"tanishtirmoq"},{"ja":"案内します (あんない します)","romaji":"あんない します","uz":"yo''l ko''rsatmoq; tanishtirmoq, ko''rsatmoq (joyni tanishtirmoq)"},{"ja":"説明します (せつめい します)","romaji":"せつめい します","uz":"tushuntirmoq, izoh bermoq"},{"ja":"いれます","romaji":"いれます","uz":"damlamoq; solmoq"},{"ja":"[ コーヒーを～ ]","romaji":"[ コーヒーを～ ]","uz":"(kofe damlamoq)"},{"ja":"おじいさん／おじいちゃん","romaji":"おじいさん／おじいちゃん","uz":"buva / buvajon"},{"ja":"おばあさん／おばあちゃん","romaji":"おばあさん／おばあちゃん","uz":"buvi / buvijon"},{"ja":"準備 (じゅんび)","romaji":"じゅんび","uz":"tayyorgarlik （～をします： tayyorgarlik qilmoq ）"},{"ja":"意味 (いみ)","romaji":"いみ","uz":"ma''no"},{"ja":"［お］菓子 (［お］かし)","romaji":"［お］かし","uz":"shirinlik"},{"ja":"全部 (ぜんぶ)","romaji":"ぜんぶ","uz":"hammasi"},{"ja":"自分で (じぶんで)","romaji":"じぶんで","uz":"o''zi(~m, ~ng)"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"ほかに","romaji":"ほかに","uz":"undan boshqa, boshqa"},{"ja":"ワゴン車[しゃ]","romaji":"ワゴン車[しゃ]","uz":"mikroavtobus, orqa tomonida ham eshik o''rnatilgan yengil mashina"},{"ja":"［お］弁当[べんとう]","romaji":"［お］弁当[べんとう]","uz":"“Obento”- o''zi bilan olib keladigan ovqat"},{"ja":"母[はは] の日[ひ]","romaji":"母[はは] の日[ひ]","uz":"Onalar kuni"}],"grammar":[{"pattern":"くれます","meaning":"Siz 7-darsda あげます so''zi “ bermoq ” ma''nosini anglatishini bilib olgan edingiz. Shuni esdan chiqarmaslik kerakki, boshqa shaxslar tomonidan so''zlovchi va unin…","example":"私[わたし] は 佐[さ] 藤[とう] さんに 花[はな] を あげました。"},{"pattern":"FE’Lning  て -shakli もらいます","meaning":"くれます あげます、もらいます、くれます fe''llari faqatgina sovg''a berish yoki olish ma''nolarini anglatibgina qolmay, balki ish-harakatning kim tomonidan va kim uchun bajarilayo…","example":"私[わたし] は 木[き] 村[むら] さんに 本[ほん] を 貸[か] して あげました。"},{"pattern":"OT (atoqli)  が  FE’L","meaning":"･･･ええ、佐[さ] 藤[とう] さんが くれました。 「すてきな ネクタイですね」 bilan so''zlovchi o''z suhbatdoshini suhbatga chorlaydi va bunga javoban o''z suhbatdoshidan noma''lum bo''lgan xabarni…","example":"すてきな ネクタイですね。"},{"pattern":"4.","meaning":"10 va 12-darslardan gapdagi kesim あります／います bilan ifodalanib, so''roq egaga berilsa, so''roq so''zga が qo''shimchasi qo''shilishini bilib olgan edingiz. Xuddi shun…","example":"だれが 手[てつ] 伝[だ] いに 行[い] きますか。"}],"phrases":[{"ja":"私[わたし] は 佐[さ] 藤[とう] さんに 花[はな] を あげました。","uz":"Men Sato xonimga gul sovg''a qildim."},{"ja":"佐[さ] 藤[とう] さんは 私[わたし] に クリスマスカードを くれました。","uz":"Sato xonim menga Krismas bayramining tabrik qog''ozini berdilar."},{"ja":"佐[さ] 藤[とう] さんは 妹[いもうと] に お菓子[かし] を くれました。","uz":"Sato xonim singlimga shirinlik berdilar."},{"ja":"私[わたし] は 木[き] 村[むら] さんに 本[ほん] を 貸[か] して あげました。","uz":"Men Kimura xonimga kitob berib turdim."},{"ja":"タクシーを 呼[よ] びましょうか。 Taksi chaqiraymi? (14-dars)","uz":""},{"ja":"手[てつ] 伝[だ] いましょうか。","uz":"Yordan beraymi? (14-dars)"},{"ja":"わたしは 山[やま] 田[だ] さんに 図[と] 書[しょ] 館[かん] の 電[でん] 話[わ] 番号[ばんごう] を 教[おし] えて もらいました。","uz":"Men janob Yamadadan kutubxonaning telefon raqamini bilib oldim."},{"ja":"母[はは] は［私[わたし] に］セーターを 送[おく] って くれました。","uz":"Onam menga sviter jo''natib yuboribdilar."}]}'::jsonb, 24),
  ('m-l25', '25-dars: Shartli mayl va Davomiylik (Tara va Temo)', '第25課：条件表現（〜たら・〜ても）', 'N5', 10, 35, '{"vocab":[{"ja":"考えます (かんがえます)","romaji":"かんがえます","uz":"fikrlamoq"},{"ja":"着きます (つきます)","romaji":"つきます","uz":"yetib bormoq / kelmoq, qo''nmoq (samolyot), kelib / borib tushmoq"},{"ja":"[ 駅に～ ] ([ えきに～ ])","romaji":"[ えきに～ ]","uz":"(vokzalga borib tushmoq)"},{"ja":"留学します (りゅうがく します)","romaji":"りゅうがく します","uz":"chet elda ta''lim olmoq"},{"ja":"取ります (とります)","romaji":"とります","uz":"ulg''aymoq; qarimoq"},{"ja":"[ 年を～ ] ([ としを～ ])","romaji":"[ としを～ ]","uz":"(ulg''aymoq; qarimoq)"},{"ja":"田舎 (いなか)","romaji":"いなか","uz":"qishloq"},{"ja":"大使館 (たいしかん)","romaji":"たいしかん","uz":"elchixona"},{"ja":"グループ","romaji":"グループ","uz":"guruh"},{"ja":"チャン ス","romaji":"チャン ス","uz":"imkoniyat"},{"ja":"億 (おく)","romaji":"おく","uz":"( いち～ ) yuz million"},{"ja":"もし    [ ～たら ]","romaji":"もし    [ ～たら ]","uz":"agar (~sam, ~sang,~sa)"},{"ja":"いくら   [ ～ても ]","romaji":"いくら   [ ～ても ]","uz":"qancha (~sam ham, ~sang ham, ~sa ham / ~may, ~mang, ~masin)"},{"ja":"◄ 会話 ►","romaji":"◄ 会話 ►","uz":""},{"ja":"転勤[てんきん]","romaji":"転勤[てんきん]","uz":"ish yuzasidan boshqa ishga o''tish ( ～を します ishni boshqa idoraga ko''chirmoq)"},{"ja":"こと","romaji":"こと","uz":"ish, masala ( ～の こと ~ning masalasi)"},{"ja":"一杯[いっぱい] 飲[の] みましょう。","romaji":"一杯[いっぱい] 飲[の] みましょう。","uz":"Keling ichamiz."},{"ja":"[ いろいろ ]  お世話[せわ] に なりました。","romaji":"[ いろいろ ]  お世話[せわ] に なりました。","uz":"Ko''rsatgan mehribonchiligingiz uchun rahmat. / Bergan tuzingizga rozi bo''ling."},{"ja":"頑[がん] 張[ば] ります","romaji":"頑[がん] 張[ば] ります","uz":"harakat qilmoq, tirishmoq"},{"ja":"どうぞ お元[げん] 気[き] で。","romaji":"どうぞ お元[げん] 気[き] で。","uz":"Salomat bo''ling. (bir-biridan uzoq muddatda uzoqlashish oldidan xayrlashuv chog''ida qo''llaniladigan ibora)"}],"grammar":[{"pattern":"O`tgan zamondagi oddiy shakl  ら、","meaning":"QO''SHMA GAP “Oddiy shakldagi o''tgan zamon fe''li” yoki sifatga ら qo''shimchasini qo''shish bilan o''zidan oldin kelgan so''zni shart qilib ko''rsatadi. Ushbu andoz…","example":"お金[かね] が あったら、旅行[りょこう] します。"},{"pattern":"FE’Lning  た -shakli  ら、～","meaning":"QO''SHMA GAP Biror-bir ish-harakat yoki shart bajarilishi bilan, darhol boshqa harakat yoki holat yuz beradigan hollarda “FE''Lning た -shakli ら ”dan foydalanil…","example":"１０時[じ] に なったら、出[で] かけましょう。"},{"pattern":"3.","meaning":"な -SIFAT [ な ] ～で も、～ GAPDA ROZILIK OT で Ushbu andoza “o''tgan zamondagi FE''Lning oddiy shakli ら , ~” shakliga qarama-qarshi ma''noni anglatib, taxminlarga ko''…","example":"雨[あめ] が 降[ふ] っても、洗濯[せんたく] します。"},{"pattern":"もし  va  いくら","meaning":"“O''tgan zamondagi oddiy shakli ~ たら ” bilan birga kelgan もし so''zi shart ma''nosini ifodalaydi. Xuddi shunday ma''noda いくら so''zi ~ ても（でも） bilan birga qo''llanila…","example":"もし １億円[おくえん] が あったら、色々[いろいろ] な 国[くに] を 旅行[りょこう] したいです。"},{"pattern":"OT  が","meaning":"16-dars grammatikasining 4-bandida siz bilan ergash gapli qo''shma gaplarning egasi が qo''shimchasi bilan ajratib ko''rsatilishini bilib olgan edik. Xuddi shung…","example":"友達[ともだち] が 来[きた] る まえに、部屋[へや] を 掃[そう] 除[じ] します。"}],"phrases":[{"ja":"お金[かね] が あったら、旅行[りょこう] します。","uz":"Pulim bo''lsa, sayohat qilar edim."},{"ja":"時[じ] 間[かん] が なかったら、テレビを 見[み] ません。","uz":"Vaqtim bo''lmasa, televizor ko''rmayman."},{"ja":"安[やす] かったら、パソコンを 買[か] いたいです。","uz":"Arzonroq bo''lsa, kompyuter sotib olmoqchiman."},{"ja":"暇[ひま] だったら、手[てつ] 伝[だ] って ください。","uz":"Bo''sh bo''lsangiz, yordam bering?"},{"ja":"いい 天[てん] 気[き] だったら、散[さん] 歩[ぽ] しませんか。","uz":"Havo ochiq bo''lsa, sayr qilmaymizmi?"},{"ja":"１０時[じ] に なったら、出[で] かけましょう。","uz":"Soat 10 bo''lsa chiqib ketaylik!"},{"ja":"うちへ 帰[かえ] ったら、すぐ シャワーを 浴[あ] びます。","uz":"Uyimga qaytsam, darhol dush qabul qilaman."},{"ja":"雨[あめ] が 降[ふ] っても、洗濯[せんたく] します。","uz":"Yomg''ir yog''sa ham, kir yuvaman."}]}'::jsonb, 25),
  ('m-l26', '26-Dars: 〜んです / 〜んですが (Izoh, sabab va iltimos bildirish)', '第26課：〜んです・〜んですが', 'N4', 12, 40, '{"vocab":[{"ja":"見ます (みます)","romaji":"みます","uz":"ko''rmoq, tekshirmoq, qarab chiqmoq"},{"ja":"探します (さがします)","romaji":"さがします","uz":"qidirmoq, izlamoq"},{"ja":"遅れます (おくれます)","romaji":"おくれます","uz":"kechikmoq (vaqtga / darsga)"},{"ja":"間に合います (まにあいます)","romaji":"まにあいます","uz":"vaqtida ulgurmoq"},{"ja":"やります","romaji":"やります","uz":"qilmoq, bajarmoq"},{"ja":"拾います (ひろいます)","romaji":"ひろいます","uz":"terib olmoq, topib olmoq"},{"ja":"連絡します (れんらくします)","romaji":"れんらくします","uz":"xabar bermoq, bog''lanmoq"},{"ja":"気分がいい (きぶんがいい)","romaji":"きぶんがいい","uz":"o''zini yaxshi his qilmoq, kayfiyat yaxshi"},{"ja":"気分が悪い (きぶんがわるい)","romaji":"きぶんがわるい","uz":"mazasi bo''lmaslik, ko''ngil aynishi"},{"ja":"運動会 (うんどうかい)","romaji":"うんどうかい","uz":"sport musobaqasi bayrami"},{"ja":"場所 (ばしょ)","romaji":"ばしょ","uz":"joy, o''rin"},{"ja":"ボランティア","romaji":"ボランティア","uz":"ko''ngilli, volontyor"},{"ja":"財布 (さいふ)","romaji":"さいふ","uz":"hamyon"},{"ja":"ごみ","romaji":"ごみ","uz":"chiqindi, axlat"},{"ja":"国会議事堂 (こっかいぎじどう)","romaji":"こっかいぎじどう","uz":"Parlament binosi (Yaponiya)"},{"ja":"平日 (へいじつ)","romaji":"へいじつ","uz":"ish kunlari (hafta o''rtasi)"},{"ja":"弁護士 (べんごし)","romaji":"べんごし","uz":"advokat, huquqshunos"},{"ja":"いつでも","romaji":"いつでも","uz":"har doim, istalgan vaqtda"},{"ja":"どこでも","romaji":"どこでも","uz":"har qayerda, istalgan joyda"},{"ja":"だれでも","romaji":"だれでも","uz":"har kim, istalgan odam"},{"ja":"何でも (なんでも)","romaji":"なんでも","uz":"har narsa, hamma narsa"},{"ja":"こんな〜","romaji":"こんな〜","uz":"bunday, mana bunaqa"},{"ja":"燃えるごみ (もえるごみ)","romaji":"もえるごみ","uz":"yonadigan chiqindi"},{"ja":"置き場 (おきば)","romaji":"おきば","uz":"qo''yish joyi"},{"ja":"お湯 (おゆ)","romaji":"おゆ","uz":"qaynoq suv"},{"ja":"ガス (がす)","romaji":"がす","uz":"gaz"},{"ja":"都合がいい (つごうがいい)","romaji":"つごうがいい","uz":"qulay (vaqt, holat)"},{"ja":"都合が悪い (つごうがわるい)","romaji":"つごうがわるい","uz":"noqulay (vaqt bo''lmaganda)"},{"ja":"直接 (ちょくせつ)","romaji":"ちょくせつ","uz":"to''g''ridan-to''g''ri, bevosita"}],"grammar":[{"pattern":"普通形 ＋ んです / んですか","meaning":"Sabab, vaziyat va his-tuyg''uni tushuntirish, qiziqish bilan savol berish","example":"どうして 遅[おく]れたんですか。 バスが 来[こ]なかったんです。"},{"pattern":"V-て形 ＋ いただけませんか","meaning":"Iltimos, ...qilib bera olmaysizmi? (Juda muloyim iltimos)","example":"生[い]け花[ばな]を 習[なら]いたいんですが、いい 先生[せんせい]を 紹介[しょうかい]して いただけませんか。"},{"pattern":"疑問詞 ＋ V-たら いいですか","meaning":"...qilsam ma''qul bo''ladi? (Maslahat va yo''l-yo''riq so''rash)","example":"ごみは どこに 出[だ]したら いいですか。"}],"phrases":[{"ja":"どうして 遅[おく]れたんですか。 バスが 来[こ]なかったんです。","uz":"Nega kechikdingiz? Avtobus kelmadi-da."},{"ja":"日本語[にほんご]が 上手[じょうず]ですね。 どのくらい 勉強[べんきょう]したんですか。","uz":"Yapon tilingiz zo''r-ku! Qancha vaqt o''rgandingiz?"},{"ja":"生[い]け花[ばな]を 習[なら]いたいんですが、いい 先生[せんせい]を 紹介[しょうかい]して いただけませんか。","uz":"Ikebana o''rganmoqchi edim, yaxshi ustozni tavsiya qilib bera olmaysizmi?"},{"ja":"日本語[にほんご]で 手紙[てがみ]を 書[か]いたんですが、ちょっと 見[み]て いただけませんか。","uz":"Yaponcha xat yozgan edim, bir qarab bera olmaysizmi?"},{"ja":"ごみは どこに 出[だ]したら いいですか。","uz":"Chiqindini qayerga chiqarsam bo''ladi?"},{"ja":"切符[きっぷ]を なくしたんですが、どう したら いいですか。","uz":"Chiptamni yo''qotib qo''ydim, nima qilsam bo''ladi?"}]}'::jsonb, 26),
  ('m-l27', '27-Dars: 可能動詞 (Qobiliyat va imkoniyat fe''llari: 〜られる / 〜れる)', '第27課：可能動詞・見える・聞こえる', 'N4', 14, 30, '{"vocab":[{"ja":"飼います (かいます)","romaji":"かいます","uz":"boqmoq, hayvon parvarishlamoq"},{"ja":"走ります (はしります)","romaji":"はしります","uz":"yugurmoq, mashina yelmoq"},{"ja":"見えます (みえます)","romaji":"みえます","uz":"ko''rinmoq (ko''zga o''z-o''zidan chalinmoq)"},{"ja":"聞こえます (きこえます)","romaji":"きこえます","uz":"eshitilmoq (tovush quloqqa chalinmoq)"},{"ja":"できます","romaji":"できます","uz":"qurilmoq, tayyor bo''lmoq, uddalamoq"},{"ja":"開きます (ひらきます)","romaji":"ひらきます","uz":"ochmoq (kurs, to''garak, dars)"},{"ja":"心配 (しんぱいな)","romaji":"しんぱいな","uz":"xavotirli, tashvishli"},{"ja":"ペット","romaji":"ペット","uz":"uy hayvoni"},{"ja":"声 (こえ)","romaji":"こえ","uz":"ovoz (tirik jonlarning ovozi)"},{"ja":"波 (なみ)","romaji":"なみ","uz":"to''lqin"},{"ja":"花火 (はなび)","romaji":"はなび","uz":"mushakbozlik, feyerverk"},{"ja":"道具 (どうぐ)","romaji":"どうぐ","uz":"asbob, qurol, dastgoh"},{"ja":"クリーニング","romaji":"クリーニング","uz":"kimyoviy tozalash (ximchistka)"},{"ja":"マンション","romaji":"マンション","uz":"zamonaviy ko''p xonadonli turar-joy"},{"ja":"台所 (だいどころ)","romaji":"だいどころ","uz":"oshxona"},{"ja":"〜しか","romaji":"〜しか","uz":"faqatgina ...dan boshqa emas (inkor bilan)"},{"ja":"はっきり","romaji":"はっきり","uz":"aniq-tiniq, yaqqol"},{"ja":"本棚 (ほんだな)","romaji":"ほんだな","uz":"kitob javoni"},{"ja":"ほとんど","romaji":"ほとんど","uz":"deyarli, aksariyat"},{"ja":"日曜大工 (にちようだいく)","romaji":"にちようだいく","uz":"dam olish kunidagi duradgorlik/uy ta''mirlash xobbisi"},{"ja":"夢 (ゆめ)","romaji":"ゆめ","uz":"tush, orzu"},{"ja":"不思議な (ふしぎな)","romaji":"ふしぎな","uz":"ajoyib, g''alati, sirli"},{"ja":"自由に (じゆうに)","romaji":"じゆうに","uz":"erkin, bemalol"},{"ja":"飛びます (とびます)","romaji":"とびます","uz":"uchmoq"}],"grammar":[{"pattern":"可能動詞 (Kanou doushi - Fe''lning imkoniyat shakli)","meaning":"...qila olmoq, qobiliyati/imkoniyati bo''lmoq","example":"わたしは 日本語[にほんご]の 新聞[しんぶん]が 読[よ]めます。"},{"pattern":"見えます vs 見られます / 聞こえます vs 聞けます","meaning":"Ko''rinmoq / Eshitilmoq (Tabiiy) vs Tomosha qila olmoq / Tinglay olmoq (Ixtiyoriy)","example":"窓[まど]から 海[うみ]が 見[み]えます。"},{"pattern":"N ＋ しか ＋ inkor fe''l","meaning":"Faqatgina N bor / qiladi (yetishmovchilik ohangida)","example":"ローマ字[じ]しか 書[か]けません。"}],"phrases":[{"ja":"わたしは 日本語[にほんご]の 新聞[しんぶん]が 読[よ]めます。","uz":"Men yaponcha gazetalarni o''qiy olaman."},{"ja":"一人[ひとり]で 病院[びょういん]へ 行[い]けますか。","uz":"Kasalxonaga bir o''zingiz bora olasizmi?"},{"ja":"窓[まど]から 海[うみ]が 見[み]えます。","uz":"Derazadan dengiz ko''rinadi."},{"ja":"スマホで 映画[えいが]が 見[み]られます。","uz":"Smartfonda kino tomosha qilsa bo''ladi."},{"ja":"ローマ字[じ]しか 書[か]けません。","uz":"Faqatgina romaji yoza olaman (kanji yoki kanani emas)."}]}'::jsonb, 27),
  ('m-l28', '28-Dars: 〜ながら / 〜ています (Odat) / 〜し、〜し (Sabablarni sanash)', '第28課：〜ながら・〜し、〜し', 'N4', 16, 35, '{"vocab":[{"ja":"売れます (うれます)","romaji":"うれます","uz":"sotilmoq, xaridorgir bo''lmoq"},{"ja":"踊ります (おどります)","romaji":"おどります","uz":"raqsqa tushmoq"},{"ja":"かみます","romaji":"かみます","uz":"chaynamoq, tishlamoq"},{"ja":"選びます (えらびます)","romaji":"えらびます","uz":"tanlamoq, saralamoq"},{"ja":"通います (かよいます)","romaji":"かよいます","uz":"qatnamoq (maktabga, universitetga, ishga)"},{"ja":"メモします","romaji":"メモします","uz":"qayd qilib bormoq, yozib olmoq"},{"ja":"まじめ (まじめな)","romaji":"まじめな","uz":"tartibli, tirishqoq, jiddiy"},{"ja":"熱心 (ねっしんな)","romaji":"ねっしんな","uz":"g''ayratli, ixlosli, berilib ishlaydigan"},{"ja":"偉い (えらい)","romaji":"えらい","uz":"buyuk, hurmatga sazovor, qoyilmaqom"},{"ja":"経験 (けいけん)","romaji":"けいけん","uz":"tajriba"},{"ja":"力 (ちから)","romaji":"ちから","uz":"kuch, quvvat, qobiliyat"},{"ja":"人気 (にんき)","romaji":"にんき","uz":"mashhurlik, obro''"},{"ja":"値段 (ねだん)","romaji":"ねだん","uz":"narx, baho"},{"ja":"給料 (きゅうりょう)","romaji":"きゅうりょう","uz":"oylik maosh"},{"ja":"それに","romaji":"それに","uz":"bundan tashqari, ustiga-ustak"},{"ja":"それで","romaji":"それで","uz":"shu sababli, shuning uchun"},{"ja":"味 (あじ)","romaji":"あじ","uz":"ta''m, maza"},{"ja":"におい","romaji":"におい","uz":"hid"},{"ja":"品物 (しなもの)","romaji":"しなもの","uz":"tovar, mahsulot"},{"ja":"ボーナス (ぼーなす)","romaji":"ぼーなす","uz":"bonus, mukofot puli"},{"ja":"番組 (ばんぐみ)","romaji":"ばんぐみ","uz":"ko''rsatuv, dastur"},{"ja":"歌手 (かしゅ)","romaji":"かしゅ","uz":"qo''shiqchi, xonanda"},{"ja":"将来 (しょうらい)","romaji":"しょうらい","uz":"kelajak"}],"grammar":[{"pattern":"V1-ます形 ＋ ながら V2","meaning":"V1 qila turib / qilib, V2 qilmoq (Bir vaqtda ikki ish)","example":"音楽[おんがく]を 聞[き]きながら 食事[しょくじ]します。"},{"pattern":"V-ています (Doimiy odat va kasbiy holat)","meaning":"...qilib turadi, shug''ullanadi (Odat tusiga kirgan)","example":"毎朝[まいあさ] ジョギングを して います。"},{"pattern":"普通形 ＋ し、普通形 ＋ し、〜","meaning":"...ham, ...ham bo''lganligi sababli","example":"この 店[みせ]は 安[やす]いし、おいしいし、いつも 人[ひと]が 多[おお]いです。"}],"phrases":[{"ja":"音楽[おんがく]を 聞[き]きながら 食事[しょくじ]します。","uz":"Musiqa tinglab ovqatlanaman."},{"ja":"働[はたら]きながら 大学[だいがく]で 勉強[べんきょう]して います。","uz":"Ishlab yurib, universitetda o''qiyapti."},{"ja":"毎朝[まいあさ] ジョギングを して います。","uz":"Har kuni ertalab yugurib turaman."},{"ja":"この 店[みせ]は 安[やす]いし、おいしいし、いつも 人[ひと]が 多[おお]いです。","uz":"Bu do''kon arzon ham, mazali ham, shuning uchun doim odam ko''p."}]}'::jsonb, 28),
  ('m-l29', '29-Dars: 自動詞・他動詞 (O''zlik va o''zgalik fe''llari) / 〜てしまいました', '第29課：自動詞＋ています・〜てしまいました', 'N4', 18, 40, '{"vocab":[{"ja":"開きます (あきます)","romaji":"あきます","uz":"ochilmoq (o''z-o''zidan, jidoshi)"},{"ja":"閉まります (しまります)","romaji":"しまります","uz":"yopilmoq (o''z-o''zidan, jidoshi)"},{"ja":"つきます","romaji":"つきます","uz":"yonmoq (chiroq, elektr)"},{"ja":"消えます (きえます)","romaji":"きえます","uz":"o''chmoq (chiroq, olov)"},{"ja":"壊れます (こわれます)","romaji":"こわれます","uz":"buzilmoq, ishdan chiqmoq"},{"ja":"割れます (われます)","romaji":"われます","uz":"sinmoq (shisha, idish)"},{"ja":"折れます (おれます)","romaji":"おれます","uz":"sinmoq, butoqlanmoq (daraxt, qalam)"},{"ja":"破れます (やぶれます)","romaji":"やぶれます","uz":"yirtilmoq (qog''oz, kiyim)"},{"ja":"汚れます (よごれます)","romaji":"よごれます","uz":"kirlanmoq, bulg''anmoq"},{"ja":"止まります (とまります)","romaji":"とまります","uz":"to''xtamoq (transport, harakat)"},{"ja":"落とします (おとします)","romaji":"おとします","uz":"tushirib yubormoq, yo''qotmoq"},{"ja":"掛かります (かかります)","romaji":"かかります","uz":"qulflanmoq (qulf)"},{"ja":"片づけます (かたづけます)","romaji":"かたづけます","uz":"yig''ishtirmoq, tartibga keltirmoq"},{"ja":"お皿 (おさら)","romaji":"おさら","uz":"tarelka, likopcha"},{"ja":"書類 (しょるい)","romaji":"しょるい","uz":"hujjatlar"},{"ja":"忘れ物 (わすれもの)","romaji":"わすれもの","uz":"unutilgan buyum"},{"ja":"取り替えます (とりかえます)","romaji":"とりかえます","uz":"almashtirmoq (boshqasiga)"},{"ja":"お茶碗 (おちゃわん)","romaji":"おちゃわん","uz":"piyola, kosa"},{"ja":"コップ (こっぷ)","romaji":"こっぷ","uz":"stakan"},{"ja":"ガラス (がらす)","romaji":"がらす","uz":"shisha"},{"ja":"袋 (ふくろ)","romaji":"ふくろ","uz":"xalta, paket"},{"ja":"交番 (こうばん)","romaji":"こうばん","uz":"politsiya maskani (koban)"},{"ja":"駅員 (えきいん)","romaji":"えきいん","uz":"bekat navbatchisi/xodimi"}],"grammar":[{"pattern":"N が 自動詞-て形 ＋ います","meaning":"N ...gan holatda turibdi (Narsaning hozirgi ko''rinishi va holati)","example":"窓[まど]が 閉[し]まって います。"},{"pattern":"V-て形 ＋ しまいました","meaning":"1) Butkul tugatdim (Kompleks harakat); 2) Afsuski, ...bo''lib qoldi (Pushaymonlik)","example":"電車[でんしゃ]に 傘[かさ]を 忘[わす]れて しまいました。"}],"phrases":[{"ja":"窓[まど]が 閉[し]まって います。","uz":"Deraza yopiq turibdi."},{"ja":"この いすは 壊[こわ]れて いますから、座[すわ]らないで ください。","uz":"Bu stul singan, o''tirmang."},{"ja":"電車[でんしゃ]に 傘[かさ]を 忘[わす]れて しまいました。","uz":"Poyezdda soyabonimni unutib qoldiribman (afsus)."},{"ja":"この 本[ほん]は もう 全部[ぜんぶ] 読[よ]んで しまいました。","uz":"Bu kitobni allaqachon to''liq o''qib tugatdim."}]}'::jsonb, 29),
  ('m-l30', '30-Dars: 他動詞＋てあります / 〜ておきます (Tayyorgarlik choralari)', '第30課：〜てあります・〜ておきます', 'N4', 10, 30, '{"vocab":[{"ja":"はります","romaji":"はります","uz":"yopishtirmoq (devorga, daftarga)"},{"ja":"掛けます (かけます)","romaji":"かけます","uz":"osmoq, ilmoq (palto, rasm)"},{"ja":"飾ります (かざります)","romaji":"かざります","uz":"bezatmoq, bezak qo''ymoq"},{"ja":"並べます (ならべます)","romaji":"ならべます","uz":"terib qo''ymoq, qatorlashtirmoq"},{"ja":"植えます (うえます)","romaji":"うえます","uz":"ekmoq (ko''chat, daraxt)"},{"ja":"戻します (もどします)","romaji":"もどします","uz":"o''z joyiga qaytarib qo''ymoq"},{"ja":"まとめます","romaji":"まとめます","uz":"jamlamoq, tartibga keltirmoq"},{"ja":"しまいます","romaji":"しまいます","uz":"joyiga solib qo''ymoq, saqlamoq"},{"ja":"決めます (きめます)","romaji":"きめます","uz":"qaror qilmoq, belgilamoq"},{"ja":"相談します (そうだんします)","romaji":"そうだんします","uz":"maslahatlashmoq"},{"ja":"予習します (よしゅうします)","romaji":"よしゅうします","uz":"yangi darsni oldindan tayyorlanmoq"},{"ja":"復習します (ふくしゅうします)","romaji":"ふくしゅうします","uz":"o''tilgan darsni takrorlamoq"},{"ja":"そのままにします","romaji":"そのままにします","uz":"o''z holicha qoldirmoq"},{"ja":"予定 (よてい)","romaji":"よてい","uz":"reja, jadval"},{"ja":"非常袋 (ひじょうぶくろ)","romaji":"ひじょうぶくろ","uz":"favqulodda vaziyat sumkasi"},{"ja":"カレンダー (かれんだー)","romaji":"かれんだー","uz":"taqvim, kalendar"},{"ja":"ポスター (ぽすたー)","romaji":"ぽすたー","uz":"plakat, afisha"},{"ja":"人形 (にんぎょう)","romaji":"にんぎょう","uz":"qo''g''irchoq"},{"ja":"花瓶 (かびん)","romaji":"かびん","uz":"vaza, guldon"},{"ja":"鏡 (かがみ)","romaji":"かがみ","uz":"oyna, ko''zgu"},{"ja":"引き出し (ひきだし)","romaji":"ひきだし","uz":"g''aladon, tortma"},{"ja":"玄関 (げんかん)","romaji":"げんかん","uz":"dahliz, kirish joyi"},{"ja":"廊下 (ろうか)","romaji":"ろうか","uz":"yo''lak, koridor"},{"ja":"壁 (かべ)","romaji":"かべ","uz":"devor"}],"grammar":[{"pattern":"N が 他動詞-て形 ＋ あります","meaning":"N ...qilib qo''yilgan (Maqsadli qilingan ish natijasi)","example":"交番[こうばん]に 町[まち]の 地図[ちず]が はって あります。"},{"pattern":"V-て形 ＋ おきます","meaning":"Oldindan ...qilib qo''ymoq (Ehtiyot yoki tayyorgarlik chorasi)","example":"旅行[りょこう]の まえに、切符[きっぷ]を 買[か]って おきます。"}],"phrases":[{"ja":"交番[こうばん]に 町[まち]の 地図[ちず]が はって あります。","uz":"Militsiya bo''limida shahar xaritasi osib qo''yilgan."},{"ja":"机[つくえ]の 上[うえ]に メモが 置[お]いて あります。","uz":"Stol ustida eslatma qog''ozi qo''yilgan."},{"ja":"旅行[りょこう]の まえに、切符[きっぷ]を 買[か]って おきます。","uz":"Sayohatdan oldin chipta sotib olib qo''yaman."},{"ja":"ハサミを 使[つか]ったら、元[もと]の 所[ところ]に 戻[もど]して おいて ください。","uz":"Qaychini ishlatgach, o''z joyiga qaytarib qo''ying."}]}'::jsonb, 30),
  ('m-l31', '31-Dars: 意向形 (Volitional form) / 〜と思っています / 〜つもりです', '第31課：意向形・〜つもりです', 'N4', 12, 35, '{"vocab":[{"ja":"始まります (はじまります)","romaji":"はじまります","uz":"boshlanmoq"},{"ja":"続けます (つづけます)","romaji":"つづけます","uz":"davom ettirmoq"},{"ja":"見つけます (みつけます)","romaji":"みつけます","uz":"topmoq, izlab topmoq"},{"ja":"受けます (うけます)","romaji":"うけます","uz":"topshirmoq (imtihon)"},{"ja":"入学します (にゅうがくします)","romaji":"にゅうがくします","uz":"o''qishga kirmoq (universitetga)"},{"ja":"卒業します (そつぎょうします)","romaji":"そつぎょうします","uz":"o''qishni bitirmoq"},{"ja":"出席します (しゅっせきします)","romaji":"しゅっせきします","uz":"qatnashmoq, hozir bo''lmoq"},{"ja":"連休 (れんきゅう)","romaji":"れんきゅう","uz":"ketma-ket dam olish kunlari"},{"ja":"作文 (さくぶん)","romaji":"さくぶん","uz":"insho, esse"},{"ja":"結婚式 (けっこんしき)","romaji":"けっこんしき","uz":"to''y marosimi"},{"ja":"本社 (ほんしゃ)","romaji":"ほんしゃ","uz":"bosh ofis, bosh korxona"},{"ja":"支社 (ししゃ)","romaji":"ししゃ","uz":"filial, bo''lim"},{"ja":"大学院 (だいがくいん)","romaji":"だいがくいん","uz":"magistratura / doktorantura"},{"ja":"案内します (あんないします)","romaji":"あんないします","uz":"yo''l ko''rsatmoq, shaharni aylantirmoq"},{"ja":"説明します (せつめいします)","romaji":"せつめいします","uz":"tushuntirmoq, izohlamoq"},{"ja":"予定 (よてい)","romaji":"よてい","uz":"reja"},{"ja":"映画館 (えいがかん)","romaji":"えいがかん","uz":"kinoteatr"},{"ja":"飛行機 (ひこうき)","romaji":"ひこうき","uz":"samolyot"},{"ja":"予約 (よやく)","romaji":"よやく","uz":"bron, oldindan buyurtma"},{"ja":"外国 (がいこく)","romaji":"がいこく","uz":"xorijiy davlat"}],"grammar":[{"pattern":"意向形 (Ikou-kei: Fe''lning niyat/xohish shakli)","meaning":"...aylik, ...aylikchi (〜ましょう ning og''zaki/norasmiy shakli)","example":"少[すこ]し 休[やす]もう。"},{"pattern":"V-意向形 ＋ と 思っています","meaning":"...qilmoqchiman, niyat qilib yuribman","example":"将来[しょうらい] 自分[じぶん]の 会社[かいしゃ]を 作[つく]ろうと 思[おも]って います。"},{"pattern":"V-辞書形 / ない形 ＋ つもりです","meaning":"...qilish niyatidaman / ...qilmaslik niyatidaman (Qat''iy qaror)","example":"国[くに]へ 帰[かえ]っても、日本語[にほんご]の 勉強[べんきょう]を 続[つづ]ける つもりです。"}],"phrases":[{"ja":"少[すこ]し 休[やす]もう。","uz":"Biroz dam olaylik."},{"ja":"いっしょに コーヒーを 飲[の]もう。","uz":"Birga kofe ichaylik."},{"ja":"将来[しょうらい] 自分[じぶん]の 会社[かいしゃ]を 作[つく]ろうと 思[おも]って います。","uz":"Kelajakda o''z kompaniyamni ochmoqchiman."},{"ja":"国[くに]へ 帰[かえ]っても、日本語[にほんご]の 勉強[べんきょう]を 続[つづ]ける つもりです。","uz":"Yurtimga qaytgach ham, yapon tili o''rganishni davom ettirish niyatidaman."}]}'::jsonb, 31),
  ('m-l32', '32-Dars: 〜ほうがいいです (Maslahat) / 〜でしょう / 〜かもしれません', '第32課：〜ほうがいい・〜でしょう・〜かもしれない', 'N4', 14, 40, '{"vocab":[{"ja":"運動します (うんどうします)","romaji":"うんどうします","uz":"jismoniy mashq qilmoq"},{"ja":"成功します (せいこうします)","romaji":"せいこうします","uz":"muvaffaqiyat qozonmoq"},{"ja":"失敗します (しっぱいします)","romaji":"しっぱいします","uz":"muvaffaqiyatsizlikka uchramoq"},{"ja":"合格します (ごうかくします)","romaji":"ごうかくします","uz":"imtihondan muvaffaqiyatli o''tmoq"},{"ja":"晴れます (はれます)","romaji":"はれます","uz":"havo ochilmoq, musaffo bo''lmoq"},{"ja":"曇ります (くもります)","romaji":"くもります","uz":"havo bulut bo''lmoq"},{"ja":"治ります (なおります)","romaji":"なおります","uz":"tuzalmoq (kasallik)"},{"ja":"冷やします (ひやします)","romaji":"ひやします","uz":"muzlatmoq, sovitmoq"},{"ja":"心配 (しんぱいな)","romaji":"しんぱいな","uz":"xavotirli"},{"ja":"十分 (じゅうぶんな)","romaji":"じゅうぶんな","uz":"yetarli darajada"},{"ja":"やけど","romaji":"やけど","uz":"kuyish (olovdan yoki issiqdan)"},{"ja":"せき","romaji":"せき","uz":"yo''tal"},{"ja":"インフルエンザ","romaji":"インフルエンザ","uz":"gripp virusi"},{"ja":"熱 (ねつ)","romaji":"ねつ","uz":"isitma, harorat"},{"ja":"喉 (のど)","romaji":"のど","uz":"tomoq"},{"ja":"インフルエンザ (いんふるえんざ)","romaji":"いんふるえんざ","uz":"gripp virusi"},{"ja":"太陽 (たいよう)","romaji":"たいよう","uz":"quyosh"},{"ja":"星 (ほし)","romaji":"ほし","uz":"yulduz"},{"ja":"夕方 (ゆうがた)","romaji":"ゆうがた","uz":"oqshom pallasi"},{"ja":"水道 (すいどう)","romaji":"すいどう","uz":"suv quvuri, vodoprovod"}],"grammar":[{"pattern":"V-た形 / ない形 ＋ ほうがいいです","meaning":"...qilgan ma''qul / ...qilmagan yaxshiroq (Tavsiya va maslahat)","example":"熱[ねつ]が あるなら、今日[きょう]は 病院[びょういん]へ 行[い]った ほうが いいです。"},{"pattern":"普通形 ＋ でしょう","meaning":"...bo''lsa kerak (80% kuchli ehtimol va taxmin)","example":"明日[あした]は 雨[あめ]が 降[ふ]るでしょう。"},{"pattern":"普通形 ＋ かもしれません","meaning":"...bo''lishi ham mumkin (50% noaniq ehtimol)","example":"約束[やくそく]の 時間[じかん]に 間[ま]に合[あ]わないかも しれません。"}],"phrases":[{"ja":"熱[ねつ]が あるなら、今日[きょう]は 病院[びょういん]へ 行[い]った ほうが いいです。","uz":"Isitma bo''lsa, bugun shifoxonaga borganingiz ma''qul."},{"ja":"あまり お酒[さけ]を 飲[の]まない ほうが いいですよ。","uz":"Ko''p spirtli ichimlik ichmaganingiz ma''qul."},{"ja":"明日[あした]は 雨[あめ]が 降[ふ]るでしょう。","uz":"Ertaga yomg''ir yog''sa kerak."},{"ja":"約束[やくそく]の 時間[じかん]に 間[ま]に合[あ]わないかも しれません。","uz":"Kelishilgan vaqtga ulgura olmasligim ham mumkin."}]}'::jsonb, 32),
  ('m-l33', '33-Dars: 命令形・禁止形 (Buyruq va taqiq) / 〜という意味です', '第33課：命令形・禁止形・〜という意味です', 'N4', 16, 30, '{"vocab":[{"ja":"逃げます (にげます)","romaji":"にげます","uz":"qochmoq, juftakni rostlamoq"},{"ja":"騒ぎます (さわぎます)","romaji":"さわぎます","uz":"shovqin ko''tarmoq, g''alva qilmoq"},{"ja":"あきらめます","romaji":"あきらめます","uz":"taslim bo''lmoq, umidni uzmoq"},{"ja":"投げます (なげます)","romaji":"なげます","uz":"uloqtirmoq, tashlamoq"},{"ja":"守ります (まもります)","romaji":"まもります","uz":"himoya qilmoq, qoidaga rioya qilmoq"},{"ja":"伝えます (つたえます)","romaji":"つたえます","uz":"yetkazmoq, aytib qo''ymoq"},{"ja":"注意します (ちゅういします)","romaji":"ちゅういします","uz":"ehtiyot bo''lmoq, ogohlantirmoq"},{"ja":"規則 (きそく)","romaji":"きそく","uz":"qoida, tartib-nizom"},{"ja":"立ち入り禁止 (たちいりきんし)","romaji":"たちいりきんし","uz":"Kirish taqiqlanadi (belgi)"},{"ja":"非常口 (ひじょうぐち)","romaji":"ひじょうぐち","uz":"favqulodda chiqish eshigi"},{"ja":"無料 (むりょう)","romaji":"むりょう","uz":"bepul, tekin"},{"ja":"使用中 (しようちゅう)","romaji":"しようちゅう","uz":"band (ishlatilmoqda)"},{"ja":"法律 (ほうりつ)","romaji":"ほうりつ","uz":"qonun"},{"ja":"マーク (まーく)","romaji":"まーく","uz":"belgi, ramz"},{"ja":"急に (きゅうに)","romaji":"きゅうに","uz":"to''satdan, birdaniga"},{"ja":"伝言 (でんごん)","romaji":"でんごん","uz":"xabar, omonat gap"},{"ja":"席を外しています (せきをはずしています)","romaji":"せきをはずしています","uz":"joyida emas (vaqtincha)"},{"ja":"戻ります (もどります)","romaji":"もどります","uz":"qaytmoq"}],"grammar":[{"pattern":"命令形 (Meirei-kei: Buyruq) & 禁止形 (Kinshi-kei: Taqiq)","meaning":"...qil! (Qat''iy buyruq) & ...qilma! (Qat''iy taqiq)","example":"早[はや]く 走[はし]れ！"},{"pattern":"「〜」 という 意味です","meaning":"Bu ''...'' degan ma''noni anglatadi","example":"「立[た]ち入[い]り禁止[きんし]」は 入[はい]るなと いう 意味[いみ]です。"},{"pattern":"〜と 伝えて いただけませんか","meaning":"Iltimos, ...deb yetkazib qo''ya olmaysizmi?","example":"田中[たなか]さんに 10分[じゅっぷん]ほど 遅[おく]れると 伝[つた]えて いただけませんか。"}],"phrases":[{"ja":"早[はや]く 走[はし]れ！","uz":"Tezroq yugur!"},{"ja":"ここに 車[くるま]を 止[と]めるな。","uz":"Bu yerga mashina to''xtatma!"},{"ja":"「立[た]ち入[い]り禁止[きんし]」は 入[はい]るなと いう 意味[いみ]です。","uz":"''Tachiiri kinshi'' kirma degan ma''noni anglatadi."},{"ja":"田中[たなか]さんに 10分[じゅっぷん]ほど 遅[おく]れると 伝[つた]えて いただけませんか。","uz":"Tanaka janoblariga 10 daqiqacha kechikishimni yetkazib qo''ya olmaysizmi?"}]}'::jsonb, 33),
  ('m-l34', '34-Dars: 〜とおりに (Xuddi shunday) / 〜あとで (Keyin) / 〜て・ないで', '第34課：〜とおりに・〜あとで・〜ないで', 'N4', 18, 35, '{"vocab":[{"ja":"磨きます (みがきます)","romaji":"みがきます","uz":"tozalamoq, yuvmoq (tish, poyabzal)"},{"ja":"組み立てます (くみたてます)","romaji":"くみたてます","uz":"yig''moq, qismlardan birlashtirmoq (mebel, mashina)"},{"ja":"折ります (おります)","romaji":"おります","uz":"buklamoq, qayirmoq (qog''oz)"},{"ja":"気がつきます (きがつきます)","romaji":"きがつきます","uz":"payqamoq, sezib qolmoq"},{"ja":"質問します (しつもんします)","romaji":"しつもんします","uz":"savol bermoq"},{"ja":"説明書 (せつめいしょ)","romaji":"せつめいしょ","uz":"yo''riqnoma, qo''llanma"},{"ja":"図 (ず)","romaji":"ず","uz":"chizma, sxema"},{"ja":"線 (せん)","romaji":"せん","uz":"chiziq"},{"ja":"矢印 (やじるし)","romaji":"やじるし","uz":"strelka, yo''nalish ko''rsatkichi"},{"ja":"しょうゆ","romaji":"しょうゆ","uz":"soya sousi"},{"ja":"茶道 (さどう)","romaji":"さどう","uz":"choy marosimi san''ati"},{"ja":"順番 (じゅんばん)","romaji":"じゅんばん","uz":"ketma-ketlik, navbat"},{"ja":"ソース (そーす)","romaji":"そーす","uz":"sous"},{"ja":"お茶 (おちゃ)","romaji":"おちゃ","uz":"choy"}],"grammar":[{"pattern":"V1-辞書形 / た形 / Nの ＋ とおりに V2","meaning":"V1 da aytilganidek / ko''rsatilganidek V2 ni bajarish","example":"先生[せんせい]が 言[い]った とおりに、書[か]いて ください。"},{"pattern":"V1-た形 / Nの ＋ あとで V2","meaning":"V1 dan keyin / so''ng V2 ni qilish","example":"ごはんを 食[た]べた あとで、歯[は]を 磨[みが]きます。"},{"pattern":"V1-て形 / ないで V2","meaning":"V1 ni bajargan / bajarmagan holatda V2 ni qilish","example":"コーヒーは 砂糖[さとう]を 入[い]れないで 飲[の]みます。"}],"phrases":[{"ja":"先生[せんせい]が 言[い]った とおりに、書[か]いて ください。","uz":"Ustoz aytganidek qilib yozing."},{"ja":"説明書[せつめいしょ]の とおりに、組[く]み立[た]てました。","uz":"Yo''riqnomada ko''rsatilgandek yig''dim."},{"ja":"ごはんを 食[た]べた あとで、歯[は]を 磨[みが]きます。","uz":"Ovqatlangandan so''ng tishimni yuvaman."},{"ja":"仕事[しごと]の あとで、飲[の]みに 行[い]きましょう。","uz":"Ishdan keyin ichgani boraylik."},{"ja":"コーヒーは 砂糖[さとう]を 入[い]れないで 飲[の]みます。","uz":"Kofeni shakar solmasdan ichaman."}]}'::jsonb, 34),
  ('m-l35', '35-Dars: 条件形 (Shart shakli: 〜ば) / 〜なら (Tavsiya va chegara)', '第35課：条件形（〜ば）・〜なら', 'N4', 10, 40, '{"vocab":[{"ja":"咲きます (さきます)","romaji":"さきます","uz":"ochilmoq, gullamoq (gul)"},{"ja":"変わります (かわります)","romaji":"かわります","uz":"o''zgarmoq (rang, holat)"},{"ja":"困ります (こまります)","romaji":"こまります","uz":"qiyin ahvolda qolmoq, chorasiz bo''lmoq"},{"ja":"楽 (らくな)","romaji":"らくな","uz":"oson, qulay, rohatbaxsh"},{"ja":"正しい (ただしい)","romaji":"ただしい","uz":"to''g''ri, haqqoniy"},{"ja":"珍しい (めずらしい)","romaji":"めずらしい","uz":"nodir, kamyob"},{"ja":"詳しい (くわしい)","romaji":"くわしい","uz":"batafsil, yaxshi biladigan"},{"ja":"向こう (むこう)","romaji":"むこう","uz":"qarama-qarshi tomon, narigi taraf"},{"ja":"島 (しま)","romaji":"しま","uz":"orol"},{"ja":"港 (みなと)","romaji":"みなと","uz":"bandargoh, port"},{"ja":"近所 (きんじょ)","romaji":"きんじょ","uz":"mahalla, qo''shnichilik, yaqin atrofi"},{"ja":"機会 (きかい)","romaji":"きかい","uz":"imkoniyat, fursat"},{"ja":"案内所 (あんないじょ)","romaji":"あんないじょ","uz":"ma''lumotxona, axborot byurosi"},{"ja":"屋上 (おくじょう)","romaji":"おくじょう","uz":"tom, bino usti"},{"ja":"海外 (かいがい)","romaji":"かいがい","uz":"chet el, chet davlatlar"},{"ja":"歴史 (れきし)","romaji":"れきし","uz":"tarix"}],"grammar":[{"pattern":"条件形 〜ば (Jouken-kei: Shart shakli)","meaning":"Agar ...sa / ...ganda (Tabiiy qonuniyat yoki zaruriy shart)","example":"春[はる]に なれば、桜[さくら]が 咲[さ]きます。"},{"pattern":"N ＋ なら","meaning":"...bo''lsa (Mavzu yoki soha bo''yicha tavsiya berish)","example":"カメラなら、秋葉原[あきはばら]が 安[やす]いですよ。"},{"pattern":"〜ば ＋ 〜ほど","meaning":"Qanchalik ...sa, shunchalik...","example":"日本語[にほんご]は 勉強[べんきょう]すれば するほど、面白[おもしろ]くなります。"}],"phrases":[{"ja":"春[はる]に なれば、桜[さくら]が 咲[さ]きます。","uz":"Bahor bo''lsa, sakura gullaydi."},{"ja":"安[やす]ければ、買[か]いたいです。","uz":"Agar arzon bo''lsa, sotib olmoqchiman."},{"ja":"カメラなら、秋葉原[あきはばら]が 安[やす]いですよ。","uz":"Fotoapparat demoqchimisiz, unda Akihabarada eng arzon!"},{"ja":"日本語[にほんご]は 勉強[べんきょう]すれば するほど、面白[おもしろ]くなります。","uz":"Yapon tilini qancha ko''p o''rgansangiz, shuncha qiziqarli bo''lib boradi."}]}'::jsonb, 35),
  ('m-l36', '36-Dars: 〜ように (Maqsad) / 〜ようになります / 〜ようにします', '第36課：〜ように・〜ようになる・〜ようにする', 'N4', 12, 30, '{"vocab":[{"ja":"貯金します (ちょきんします)","romaji":"ちょきんします","uz":"pul jamg''armoq, tejab yig''moq"},{"ja":"過ぎます (すぎます)","romaji":"すぎます","uz":"o''tib ketmoq (vaqt)"},{"ja":"慣れます (なれます)","romaji":"なれます","uz":"ko''nikmoq, o''rganib qolmoq"},{"ja":"腐ります (くさります)","romaji":"くさります","uz":"aynimoq, sasimoq, chirimoq"},{"ja":"剣道 (けんどう)","romaji":"けんどう","uz":"kendo (yapon an''anaviy qilichbozlik sporti)"},{"ja":"ラッシュ","romaji":"ラッシュ","uz":"tirbandlik, tig''iz payt"},{"ja":"宇宙 (うちゅう)","romaji":"うちゅう","uz":"koinot, fazo"},{"ja":"曲 (きょく)","romaji":"きょく","uz":"kuy, musiqa ohangi"},{"ja":"やっと","romaji":"やっと","uz":"nihoyat, arang, zo''rg''a"},{"ja":"かなり","romaji":"かなり","uz":"ancha, ancha-muncha"},{"ja":"必ず (かならず)","romaji":"かならず","uz":"albatta, muqarrar"},{"ja":"絶対に (ぜったいに)","romaji":"ぜったいに","uz":"mutlaqo, sira ham (inkor bilan)"},{"ja":"できるだけ","romaji":"できるだけ","uz":"iloji boricha, imkon qadar"},{"ja":"練習します (れんしゅうします)","romaji":"れんしゅうします","uz":"mashq qilmoq"},{"ja":"習慣 (しゅうかん)","romaji":"しゅうかん","uz":"odat, urf-odat"},{"ja":"健康 (けんこう)","romaji":"けんこう","uz":"salomatlik"},{"ja":"無理をします (むりをします)","romaji":"むりをします","uz":"kuchni ortiqcha zo''riqtirmoq"},{"ja":"特別な (とくべつな)","romaji":"とくべつな","uz":"maxsus, alohida"},{"ja":"水泳 (すいえい)","romaji":"すいえい","uz":"suzish sporti"},{"ja":"キロ (きろ)","romaji":"きろ","uz":"kilogramm / kilometr"},{"ja":"ショック (しょっく)","romaji":"しょっく","uz":"shok, hayrat"}],"grammar":[{"pattern":"V-辞書形 / ない形 ＋ ように、〜","meaning":"...bo''lishi uchun / ...bo''lmasligi uchun (Maqsad)","example":"速[はや]く 泳[およ]げる ように、毎日[まいにち] 練習[れんしゅう]して います。"},{"pattern":"V-辞書形 ＋ ように なりました","meaning":"...qila oladigan bo''lib qoldim / ...qilishga o''rgandim","example":"毎日[まいにち] 練習[れんしゅう]して、日本語[にほんご]が 話[はな]せる ように なりました。"},{"pattern":"V-辞書形 / ない形 ＋ ように しています","meaning":"...qilishga harakat qilib kelmoqdaman / odat qilib olganman","example":"健康[けんこう]の ために、毎日[まいにち] 野菜[やさい]を 食[た]べる ように して います。"}],"phrases":[{"ja":"速[はや]く 泳[およ]げる ように、毎日[まいにち] 練習[れんしゅう]して います。","uz":"Tez suza olish uchun har kuni shug''ullanyapman."},{"ja":"風邪[かぜ]を ひかない ように、暖[あたた]かく して 寝[ね]ます。","uz":"Shamollab qolmaslik uchun issiq kiyinib uxlayman."},{"ja":"毎日[まいにち] 練習[れんしゅう]して、日本語[にほんご]が 話[はな]せる ように なりました。","uz":"Har kuni shug''ullanib, yaponcha gapira oladigan bo''lib qoldim."},{"ja":"健康[けんこう]の ために、毎日[まいにち] 野菜[やさい]を 食[た]べる ように して います。","uz":"Salomatlik uchun har kuni sabzavot yeyishga odatlanganman."}]}'::jsonb, 36),
  ('m-l37', '37-Dars: 受身動詞 (Majhul nisbat: 〜られる) / 〜によって', '第37課：受身形・〜によって', 'N4', 14, 35, '{"vocab":[{"ja":"ほめます","romaji":"ほめます","uz":"maqtamoq"},{"ja":"しかります","romaji":"しかります","uz":"urishmoq, tanbeh bermoq"},{"ja":"誘います (さそいます)","romaji":"さそいます","uz":"taklif qilmoq (birga biror joyga borishga)"},{"ja":"頼みます (たのみます)","romaji":"たのみます","uz":"iltimos qilmoq, buyurmoq"},{"ja":"踏みます (ふみます)","romaji":"ふみます","uz":"bosmoq (oyoqni)"},{"ja":"壊します (こわします)","romaji":"こわします","uz":"buzmoq, sindirmoq"},{"ja":"汚します (よごします)","romaji":"よごします","uz":"kirlatmoq, bulg''amoq"},{"ja":"行います (おこないます)","romaji":"おこないます","uz":"o''tkazmoq, amalga oshirmoq (tadbirlar)"},{"ja":"輸出します (ゆしゅつします)","romaji":"ゆしゅつします","uz":"eksport qilmoq"},{"ja":"輸入します (ゆにゅうします)","romaji":"ゆにゅうします","uz":"import qilmoq"},{"ja":"翻訳します (ほんやくします)","romaji":"ほんやくします","uz":"yozma tarjima qilmoq"},{"ja":"発明します (はつめいします)","romaji":"はつめいします","uz":"ixtiro qilmoq"},{"ja":"発見します (はっけんします)","romaji":"はっけんします","uz":"kashf etmoq"},{"ja":"泥棒 (どろぼう)","romaji":"どろぼう","uz":"o''g''ri"},{"ja":"警官 (けいかん)","romaji":"けいかん","uz":"politsiyachi"},{"ja":"建築家 (けんちくか)","romaji":"けんちくか","uz":"me''mor, arxitektor"},{"ja":"漫画 (まんが)","romaji":"まんが","uz":"manga (yapon komikslari)"},{"ja":"金 (きん)","romaji":"きん","uz":"oltin"}],"grammar":[{"pattern":"受身動詞 (Ukemi-doushi: Majhul nisbat shakli)","meaning":"...tomonidan qilinmoq / ...-ildi","example":"わたしは 部長[ぶちょう]に ほめられました。"},{"pattern":"N1 は N2 に N3 を V-受身 (Noqulaylik / Ziyon ko''rish majhulligi)","meaning":"N1 ning N3 buyumini N2 ...qilib, N1 ga noqulaylik/ziyon yetkazdi","example":"わたしは 満員電車[まんいんでんしゃ]で 足[あし]を 踏[ふ]まれました。"},{"pattern":"N1 は N2(inson) によって V-受身","meaning":"N1 buyum/bino/asar N2 shaxs tomonidan yaratildi/qurildi","example":"この 本[ほん]は 有名[ゆうめい]な 作家[さっか]によって 書[か]かれました。"}],"phrases":[{"ja":"わたしは 部長[ぶちょう]に ほめられました。","uz":"Men boshliq tomonidan maqtaldim."},{"ja":"わたしは 満員電車[まんいんでんしゃ]で 足[あし]を 踏[ふ]まれました。","uz":"To''la poyezdda oyog''imni bosib olishdi (nohush holat)."},{"ja":"雨[あめ]に 降[ふ]られて、服[ふく]が ぬれて しまいました。","uz":"Yomg''ir ostida qolib, kiyimlarim ivib ketdi."},{"ja":"この 本[ほん]は 有名[ゆうめい]な 作家[さっか]によって 書[か]かれました。","uz":"Bu kitob mashhur adib tomonidan yozilgan."}]}'::jsonb, 37),
  ('m-l38', '38-Dars: 動詞の名詞化 (Fe''lning otlashishi: 〜のは / 〜のが / 〜のを)', '第38課：動詞の名詞化（〜のは・〜のが・〜のを）', 'N4', 16, 40, '{"vocab":[{"ja":"参加します (さんかします)","romaji":"さんかします","uz":"qatnashmoq, a''zo bo''lmoq"},{"ja":"育てます (そだてます)","romaji":"そだてます","uz":"tarbiyalamoq, o''stirmoq (bola, o''simlik)"},{"ja":"運びます (はこびます)","romaji":"はこびます","uz":"tashimoq, eltmoq"},{"ja":"入院します (にゅういんします)","romaji":"にゅういんします","uz":"shifoxonaga yotmoq"},{"ja":"退院します (たいいんします)","romaji":"たいいんします","uz":"shifoxonadan chiqmoq"},{"ja":"電源 (でんげん)","romaji":"でんげん","uz":"elektr ta''minoti, manba"},{"ja":"整理します (せいりします)","romaji":"せいりします","uz":"tartibga solmoq, saralamoq"},{"ja":"似ています (にています)","romaji":"にています","uz":"o''xshamoq (tashqi ko''rinish yoki xarakter)"},{"ja":"世話をします (せわをします)","romaji":"せわをします","uz":"g''amxo''rlik qilmoq, parvarishlamoq"},{"ja":"手袋 (てぶくろ)","romaji":"てぶくろ","uz":"qo''lqop"},{"ja":"木綿 (もめん)","romaji":"もめん","uz":"paxta mato"},{"ja":"革 (かわ)","romaji":"かわ","uz":"charm, ko''n"},{"ja":"嘘 (うそ)","romaji":"うそ","uz":"yolg''on"},{"ja":"星 (ほし)","romaji":"ほし","uz":"yulduz"},{"ja":"赤ちゃん (あかちゃん)","romaji":"あかちゃん","uz":"chaqaloq"},{"ja":"海岸 (かいがん)","romaji":"かいがん","uz":"dengiz qirg''og''i, sohil"},{"ja":"工場 (こうじょう)","romaji":"こうじょう","uz":"zavod, fabrika"}],"grammar":[{"pattern":"V-普通形 ＋ のは A です","meaning":"...qilish (harakati) ...dir (Otlashtirish)","example":"一人[ひとり]で この 荷物[にもつ]を 運[はこ]ぶのは 難[むずか]しいです。"},{"pattern":"V-普通形 ＋ のが 好き / 上手 / 下手 / 速い です","meaning":"...qilishni yoqtirmoq / mohir bo''lmoq / uquvsiz bo''lmoq","example":"わたしは 星[ほし]を 見[み]るのが 好[す]きです。"},{"pattern":"V-普通形 ＋ のを 忘れました / 知っていますか","meaning":"...qilishni unutib qo''ydim / ...qilishini bilasizmi?","example":"電気[でんき]を 消[け]すのを 忘[わす]れました。"}],"phrases":[{"ja":"一人[ひとり]で この 荷物[にもつ]を 運[はこ]ぶのは 難[むずか]しいです。","uz":"Bu yukni yolg''iz tashish mushkuldir."},{"ja":"わたしは 星[ほし]を 見[み]るのが 好[す]きです。","uz":"Men yulduzlarni tomosha qilishni yaxshi ko''raman."},{"ja":"電気[でんき]を 消[け]すのを 忘[わす]れました。","uz":"Chiroqni o''chirishni unutibman."}]}'::jsonb, 38),
  ('m-l39', '39-Dars: 原因・理由 (Sabab-oqibat: 〜て / 〜で / 〜ので)', '第39課：〜て（理由）・〜で・〜ので', 'N4', 18, 30, '{"vocab":[{"ja":"答えます (こたえます)","romaji":"こたえます","uz":"javob bermoq"},{"ja":"倒れます (たおれます)","romaji":"たおれます","uz":"qulamoq, yiqilmoq (bino, daraxt)"},{"ja":"通ります (とおれます)","romaji":"とおれます","uz":"o''tmoq, kesib o''tmoq"},{"ja":"死にます (しにます)","romaji":"しにます","uz":"vafot etmoq, o''lmoq"},{"ja":"びっくりします","romaji":"びっくりします","uz":"hayron qolmoq, cho''chib ketmoq"},{"ja":"安心します (あんしんします)","romaji":"あんしんします","uz":"ko''ngil tinchimoq, taskin topmoq"},{"ja":"遅刻します (ちこくします)","romaji":"ちこくします","uz":"kechikmoq"},{"ja":"早退します (そうたいします)","romaji":"そうたいします","uz":"ishdan/darsdan ertaroq javob olib ketmoq"},{"ja":"複雑 (ふくざつな)","romaji":"ふくざつな","uz":"murakkab, chigal"},{"ja":"邪魔 (じゃまな)","romaji":"じゃまな","uz":"xalal beruvchi, noqulay"},{"ja":"火事 (かじ)","romaji":"かじ","uz":"yong''in"},{"ja":"台風 (たいふう)","romaji":"たいふう","uz":"to''fon, tayfun"},{"ja":"西洋 (せいよう)","romaji":"せいよう","uz":"G''arb mamlakatlari"},{"ja":"東洋 (とうよう)","romaji":"とうよう","uz":"Sharq mamlakatlari"},{"ja":"汚れます (よごれます)","romaji":"よごれます","uz":"kirlanmoq"},{"ja":"並びます (ならびます)","romaji":"ならびます","uz":"navbatda turmoq"},{"ja":"通ります (とおりません)","romaji":"とおりません","uz":"o''tmoq, qatnamoq"}],"grammar":[{"pattern":"V-て形 / A-くて / Na-で、〜 (Sabab)","meaning":"...bo''lib / ...ganligi sababli, ...bo''ldi","example":"ニュースを 聞[き]いて、安心[あんしん]しました。"},{"pattern":"N ＋ で (Tabiiy ofat yoki hodisa sababi)","meaning":"N (ofat/hodisa) sababli / tufayli","example":"大雨[おおあめ]で 試合[しあい]が 中止[ちゅうし]に なりました。"},{"pattern":"普通形 ＋ ので","meaning":"...bo''lganligi sababli (Muloyim va xolis sabab)","example":"用事[ようじ]が あるので、お先[さき]に 失礼[しつれい]します。"}],"phrases":[{"ja":"ニュースを 聞[き]いて、安心[あんしん]しました。","uz":"Xabarni eshitib, ko''nglim tinchidi."},{"ja":"大雨[おおあめ]で 試合[しあい]が 中止[ちゅうし]に なりました。","uz":"Kuchli yomg''ir sababli musobaqa bekor qilindi."},{"ja":"用事[ようじ]が あるので、お先[さき]に 失礼[しつれい]します。","uz":"Zarur ishim bo''lganligi sababli, sizlardan oldinroq ketishga ruxsat bersangiz."}]}'::jsonb, 39),
  ('m-l40', '40-Dars: 疑問詞＋か / 〜かどうか / 〜てみます', '第40課：〜か・〜かどうか・〜てみる', 'N4', 10, 35, '{"vocab":[{"ja":"数えます (かぞえます)","romaji":"かぞえます","uz":"sanamoq, hisoblamoq"},{"ja":"測ります (はかります)","romaji":"はかります","uz":"o''lchamoq (uzunlik, vaqt, harorat)"},{"ja":"確かめます (たしかめます)","romaji":"たしかめます","uz":"aniqlashtirmoq, tekshirib ko''rmoq"},{"ja":"合います (あいます)","romaji":"あいます","uz":"mos kelmoq, to''g''ri kelmoq (o''lcham)"},{"ja":"出発します (しゅっぱつします)","romaji":"しゅっぱつします","uz":"yo''lga chiqmoq, jo''namoq"},{"ja":"到着します (とうちゃくします)","romaji":"とうちゃくします","uz":"yetib kelmoq"},{"ja":"忘年会 (ぼうねんかい)","romaji":"ぼうねんかい","uz":"yil yakuni bayrami (Yaponiya an''anasi)"},{"ja":"傷 (きず)","romaji":"きず","uz":"chiziq, tirnalish, jarohat"},{"ja":"〜以上 (〜いじょう)","romaji":"〜いじょう","uz":"...dan ko''p, ortiq"},{"ja":"〜以下 (〜いか)","romaji":"〜いか","uz":"...dan kam, past"},{"ja":"ズボン (ずぼん)","romaji":"ずぼん","uz":"shim"},{"ja":"二次会 (にじかい)","romaji":"にじかい","uz":"ziyofatning ikkinchi davomi"},{"ja":"大会 (たいかい)","romaji":"たいかい","uz":"musobaqa, syezdd"},{"ja":"表 (おもて)","romaji":"おもて","uz":"yuz tomon, usti"},{"ja":"裏 (うら)","romaji":"うら","uz":"orqa tomon, teskarisi"},{"ja":"返事 (へんじ)","romaji":"へんじ","uz":"javob"}],"grammar":[{"pattern":"疑問詞 ＋ 普通形 ＋ か、〜","meaning":"Qachon / Qayerga / Kim ...ligini (Ichki so''roq gap)","example":"飛行機[ひこうき]が 何時[なんじ]に 着[つ]くか、調[しら]べて ください。"},{"pattern":"普通形 ＋ かどうか、〜","meaning":"...-mi yoki yo''qligini (Ikkilanish va variant)","example":"明日[あした] 雨[あめ]が 降[ふ]るか どうか、わかりません。"},{"pattern":"V-て形 ＋ みます","meaning":"...qilib ko''rmoq (Sinov va tajriba)","example":"この ズボンを はいて みても いいですか。"}],"phrases":[{"ja":"飛行機[ひこうき]が 何時[なんじ]に 着[つ]くか、調[しら]べて ください。","uz":"Samolyot soat nechada yetib kelishini tekshirib ko''ring."},{"ja":"明日[あした] 雨[あめ]が 降[ふ]るか どうか、わかりません。","uz":"Ertaga yomg''ir yog''adimi-yo''qmi, bilmayman."},{"ja":"この ズボンを はいて みても いいですか。","uz":"Bu shimni kiyib ko''rsam maylimi?"}]}'::jsonb, 40),
  ('m-l41', '41-Dars: 授受動詞 (いただきます・くださいます・やります / 〜ていただきます)', '第41課：授受動詞（敬語表現）', 'N4', 12, 40, '{"vocab":[{"ja":"いただきます","romaji":"いただきます","uz":"qabul qilib olmoq (もらいます ning hurmat shakli)"},{"ja":"くださいます","romaji":"くださいます","uz":"bermoq (kattalar menga berishi, くれます ning hurmat shakli)"},{"ja":"やります","romaji":"やります","uz":"bermoq (kichiklarga, hayvonlarga, o''simliklarga)"},{"ja":"上げます (あげます)","romaji":"あげます","uz":"ko''tarmoq, bermoq"},{"ja":"下げます (さげます)","romaji":"さげます","uz":"tushirmoq, pasaytirmoq"},{"ja":"親切にします (しんせつにします)","romaji":"しんせつにします","uz":"mehribonlik qilmoq, yaxshilik ko''rsatmoq"},{"ja":"珍しい (めずらしい)","romaji":"めずらしい","uz":"nodir, kam uchraydigan"},{"ja":"お祝い (おいわい)","romaji":"おいわい","uz":"tabrik sovg''asi"},{"ja":"お年玉 (おとしだま)","romaji":"おとしだま","uz":"yangi yil pul sovg''asi (bolalarga)"},{"ja":"お見舞い (おみまい)","romaji":"おみまい","uz":"bemor ko''rish sovg''asi / tashrifi"},{"ja":"興味 (きょうみ)","romaji":"きょうみ","uz":"qiziqish"},{"ja":"情報 (じょうほう)","romaji":"じょうほう","uz":"ma''lumot, axborot"},{"ja":"文法 (ぶんぽう)","romaji":"ぶんぽう","uz":"grammatika"},{"ja":"発音 (はつおん)","romaji":"はつおん","uz":"talaffuz"},{"ja":"猿 (さる)","romaji":"さる","uz":"maymun"}],"grammar":[{"pattern":"N1 に / から N2 を いただきます","meaning":"N1 (mavqei baland kishi) dan N2 ni qabul qilib olmoq","example":"わたしは 社長[しゃちょう]に 時計[とけい]を いただきました。"},{"pattern":"N1 が わたしに N2 を くださいます","meaning":"N1 (katta kishi) menga N2 ni marhamat qilib berdilar","example":"部長[ぶちょう]の 奥[おく]さんが お茶[ちゃ]を くださいました。"},{"pattern":"V-て くださいませんか","meaning":"Iltimos, ...qilib bera olmaysizmi? (O''ta muloyim taklif)","example":"もう 一度[いちど] 説明[せつめい]して くださいませんか。"}],"phrases":[{"ja":"わたしは 社長[しゃちょう]に 時計[とけい]を いただきました。","uz":"Men prezident janoblaridan soat oldim."},{"ja":"部長[ぶちょう]の 奥[おく]さんが お茶[ちゃ]を くださいました。","uz":"Bo''lim boshlig''ining rafiqalari menga choy berdilar."},{"ja":"もう 一度[いちど] 説明[せつめい]して くださいませんか。","uz":"Yana bir bor tushuntirib bera olmaysizmi?"}]}'::jsonb, 41),
  ('m-l42', '42-Dars: 目的 (〜ために / 〜のに使います)', '第42課：目的（〜ために・〜のに）', 'N4', 14, 30, '{"vocab":[{"ja":"包みます (つつみます)","romaji":"つつみます","uz":"o''ramoq, qadoqlamoq"},{"ja":"沸かします (わかします)","romaji":"わかします","uz":"qaynatmoq (suvni)"},{"ja":"混ぜます (まぜます)","romaji":"まぜます","uz":"aralashtirmoq"},{"ja":"計算します (けいさんします)","romaji":"けいさんします","uz":"hisoblamoq, sanamoq"},{"ja":"並びます (ならびます)","romaji":"ならびます","uz":"navbatda turmoq, qatorlashmoq"},{"ja":"弁護士 (べんごし)","romaji":"べんごし","uz":"advokat, himoyachi"},{"ja":"法律 (ほうりつ)","romaji":"ほうりつ","uz":"qonun, huquq"},{"ja":"目的 (もくてき)","romaji":"もくてき","uz":"maqsad, muddao"},{"ja":"論文 (ろんぶん)","romaji":"ろんぶん","uz":"ilmiy maqola, dissertatsiya"},{"ja":"栓抜き (せんぬき)","romaji":"せんぬき","uz":"shisha ochgich"},{"ja":"缶切り (かんきり)","romaji":"かんきり","uz":"konserva ochgich"},{"ja":"音楽家 (おんがくか)","romaji":"おんがくか","uz":"musiqachi"},{"ja":"子ども (こども)","romaji":"こども","uz":"bola"},{"ja":"教育 (きょういく)","romaji":"きょういく","uz":"ta''lim, tarbiya"},{"ja":"歴史 (れきし)","romaji":"れきし","uz":"tarix"},{"ja":"文化 (ぶんか)","romaji":"ぶんか","uz":"madaniyat"},{"ja":"戦争 (せんそう)","romaji":"せんそう","uz":"urush"}],"grammar":[{"pattern":"V-辞書形 / Nの ＋ ために、〜","meaning":"...uchun / ...manfaati yo''lida (Maqsad)","example":"将来[しょうらい] 自分[じぶん]の 店[みせ]を 持[も]つ ために、貯金[ちょきん]して います。"},{"pattern":"V-辞書形 ＋ のに 使います / 便利です / 時間がかかります","meaning":"...qilishda ishlatiladi / qulaydir / vaqt ketadi","example":"この はさみは 紙[かみ]を 切[き]るのに 使[つか]います。"}],"phrases":[{"ja":"将来[しょうらい] 自分[じぶん]の 店[みせ]を 持[も]つ ために、貯金[ちょきん]して います。","uz":"Kelajakda o''z do''konimni ochish uchun pul jamg''aryapman."},{"ja":"家族[かぞく]の ために、一生懸命[いっしょうけんめい] 働[はたら]きます。","uz":"Oilam uchun astoydil mehnat qilaman."},{"ja":"この はさみは 紙[かみ]を 切[き]るのに 使[つか]います。","uz":"Bu qaychi qog''oz qirqish uchun ishlatiladi."},{"ja":"この 辞書[じしょ]は 漢字[かんじ]を 調[しら]べるのに 便利[べんり]です。","uz":"Bu lug''at kanjilarni qidirishda juda qulay."}]}'::jsonb, 42),
  ('m-l43', '43-Dars: 様態 (〜そうです: ...ko''rinadi, tuyuladi) / 行動の移動 (〜てきます)', '第43課：〜そうだ（様態）・〜てくる', 'N4', 16, 35, '{"vocab":[{"ja":"増えます (ふえます)","romaji":"ふえます","uz":"ko''paymoq, oshmoq (son, miqdor)"},{"ja":"減ります (へります)","romaji":"へります","uz":"kamaymoq"},{"ja":"上がります (あがります)","romaji":"あがります","uz":"ko''tarilmoq (narx, harorat)"},{"ja":"下がります (さがります)","romaji":"さがります","uz":"tushmoq, pasaymoq"},{"ja":"切れます (きれます)","romaji":"きれます","uz":"uzilmoq (ip, tugma)"},{"ja":"落ちます (おちます)","romaji":"おちます","uz":"qulamoq, tushib ketmoq"},{"ja":"楽 (らくな)","romaji":"らくな","uz":"rohat, oson, qulay"},{"ja":"今にも (いまにも)","romaji":"いまにも","uz":"hozirning o''zidayoq, ayni damda"},{"ja":"暖房 (だんぼう)","romaji":"だんぼう","uz":"isitish tizimi (pechka)"},{"ja":"冷房 (れいぼう)","romaji":"れいぼう","uz":"konditsioner, sovitish tizimi"},{"ja":"センス (せんす)","romaji":"せんす","uz":"did, nozik did"},{"ja":"わあ","romaji":"わあ","uz":"voy (hayrat undovi)"},{"ja":"会員 (かいいん)","romaji":"かいいん","uz":"a''zo (klub yoki tashkilot)"},{"ja":"適当な (てきとうな)","romaji":"てきとうな","uz":"munosib, mos keluvchi"},{"ja":"特別な (とくべつな)","romaji":"とくべつな","uz":"alohida, o''zgacha"}],"grammar":[{"pattern":"V-ます形 / A-(い) / Na-(な) ＋ そうです (様態 - Tashqi ko''rinish)","meaning":"...ko''rinadi, ...tuyuladi, ...adiganga o''xshaydi","example":"今[いま]にも 雨[あめ]が 降[ふ]りそうです。"},{"pattern":"V-て形 ＋ きます","meaning":"...qilib qaytmoq / ...kelmoq","example":"ちょっと 切符[きっぷ]を 買[か]って 来[き]ます。"}],"phrases":[{"ja":"今[いま]にも 雨[あめ]が 降[ふ]りそうです。","uz":"Hozirning o''zidayoq yomg''ir yog''adigandek bo''lib turibdi."},{"ja":"この ケーキは とても おいしそうです。","uz":"Bu tort juda mazalidek ko''rinyapti."},{"ja":"ちょっと 切符[きっぷ]を 買[か]って 来[き]ます。","uz":"Birozga chipta sotib olib qaytaman."}]}'::jsonb, 43),
  ('m-l44', '44-Dars: 過度 (〜すぎます) / 難易 (〜やすい / 〜にくい) / 変化 (〜くします)', '第44課：〜すぎる・〜やすい・〜にくい・〜くする', 'N4', 18, 40, '{"vocab":[{"ja":"泣きます (なきます)","romaji":"なきます","uz":"yig''lamoq"},{"ja":"笑います (わらいます)","romaji":"わらいます","uz":"kulmoq, jilmaymoq"},{"ja":"乾きます (かわきます)","romaji":"かわきます","uz":"qurimoq"},{"ja":"滑ります (すべります)","romaji":"すべります","uz":"sirpanmoq"},{"ja":"調節します (ちょうせつします)","romaji":"ちょうせつします","uz":"moslamoq, sozlamoq (harorat, hajm)"},{"ja":"安全 (あんぜんな)","romaji":"あんぜんな","uz":"xavfsiz"},{"ja":"濃い (こい)","romaji":"こい","uz":"quyuq, to''q (choy, rang)"},{"ja":"薄い (うすい)","romaji":"うすい","uz":"suyuq, och rang, yupqa"},{"ja":"厚い (あつい)","romaji":"あつい","uz":"qalin (kitob, kiyim)"},{"ja":"太い (ふとい)","romaji":"ふとい","uz":"yo''g''on (daraxt, chiziq)"},{"ja":"細い (ほそい)","romaji":"ほそい","uz":"ingichka"},{"ja":"涙 (なみだ)","romaji":"なみだ","uz":"ko''z yoshi"},{"ja":"理由 (りゆう)","romaji":"りゆう","uz":"sabab, vaj"},{"ja":"謝罪 (しゃざい)","romaji":"しゃざい","uz":"kechirim so''rash"},{"ja":"エアコン (えあこん)","romaji":"えあこん","uz":"konditsioner"},{"ja":"パスワード (ぱすわーど)","romaji":"ぱすわーど","uz":"parol"},{"ja":"薬 (くすり)","romaji":"くすり","uz":"dori-darmon"},{"ja":"字 (じ)","romaji":"じ","uz":"harf, yozuv"},{"ja":"靴 (くつ)","romaji":"くつ","uz":"poyafzal"},{"ja":"掃除します (そうじします)","romaji":"そうじします","uz":"tozalamoq"}],"grammar":[{"pattern":"V-ます形 / A-(い) / Na-(な) ＋ すぎます","meaning":"Haddan tashqari / Juda me''yordan ortiq ...qilmoq","example":"ゆうべ お酒[さけ]を 飲[の]みすぎました。"},{"pattern":"V-ます形 ＋ やすい / にくい","meaning":"...qilish oson / qulay vs ...qilish qiyin / noqulay","example":"この パソコンは 使[つか]いやすいです。"},{"pattern":"A-く / Na-に / N-に します","meaning":"...holatga keltirmoq, ...qilmoq (O''zgartirmoq)","example":"音[おと]を 小[ちい]さく します。"}],"phrases":[{"ja":"ゆうべ お酒[さけ]を 飲[の]みすぎました。","uz":"Kecha kechqurun haddan tashqari ko''p ichib yuboribman."},{"ja":"この 部屋[へや]は 狭[せま]すぎます。","uz":"Bu xona juda ham tor."},{"ja":"この パソコンは 使[つか]いやすいです。","uz":"Bu kompyuterdan foydalanish juda oson."},{"ja":"東京[とうきょう]の 道[みち]は 複雑[ふくざつ]で、分[わ]かりにくいです。","uz":"Tokio yo''llari chigal bo''lgani uchun tushunish qiyin."},{"ja":"音[おと]を 小[ちい]さく します。","uz":"Ovozni pasaytiraman (kichik qilaman)."},{"ja":"部屋[へや]を きれいに しました。","uz":"Xonani ozoda qildim."}]}'::jsonb, 44),
  ('m-l45', '45-Dars: 条件・仮定 (〜場合は) / 逆接 (〜のに: holbuki, kutilganga zid)', '第45課：〜場合（は）・〜のに（逆接）', 'N4', 10, 30, '{"vocab":[{"ja":"信じます (しんじます)","romaji":"しんじます","uz":"ishonmoq"},{"ja":"キャンセルします","romaji":"キャンセルします","uz":"bekor qilmoq"},{"ja":"保証書 (ほしょうしょ)","romaji":"ほしょうしょ","uz":"kafolat qog''ozi (garantiya)"},{"ja":"領収書 (りょうしゅうしょ)","romaji":"りょうしゅうしょ","uz":"to''lov kvitansiyasi, chek"},{"ja":"中止 (ちゅうし)","romaji":"ちゅうし","uz":"to''xtatish, bekor qilish"},{"ja":"110番 (ひゃくとおばん)","romaji":"ひゃくとおばん","uz":"110 raqami (militsiya/politsiya chaqirish)"},{"ja":"119番 (ひゃくじゅうきゅうばん)","romaji":"ひゃくじゅうきゅうばん","uz":"119 raqami (tez yordam va o''t o''chiruvchilar)"},{"ja":"急に (きゅうに)","romaji":"きゅうに","uz":"to''satdan, birdaniga"},{"ja":"楽しみにしています (たのしみにしています)","romaji":"たのしみにしています","uz":"intiqlik bilan kutmoq"},{"ja":"返金します (へんきんします)","romaji":"へんきんします","uz":"pulni qaytarib bermoq"},{"ja":"レシート (れしーと)","romaji":"れしーと","uz":"kassa cheki"},{"ja":"連絡先 (れんらくさき)","romaji":"れんらくさき","uz":"aloqa ma''lumotlari (telefon, manzil)"},{"ja":"都合 (つごう)","romaji":"つごう","uz":"sharoit, qulaylik"},{"ja":"約束 (やくそく)","romaji":"やくそく","uz":"va''da, kelishuv"},{"ja":"一生懸命 (いっしょうけんめい)","romaji":"いっしょうけんめい","uz":"bor kuch bilan, sidqidildan"},{"ja":"給料 (きゅうりょう)","romaji":"きゅうりょう","uz":"oylik maosh"}],"grammar":[{"pattern":"普通形 (Naな / Nの) ＋ 場合は、〜","meaning":"...bo''lgan vaziyatda / ...bo''lgan taqdirda","example":"火事[かじ]や 地震[じしん]の 場合[ばあい]は、エレベーターを 使[つか]わないで ください。"},{"pattern":"普通形 (Naな / Nな) ＋ のに、〜","meaning":"...bo''lishiga qaramay / holbuki ...bo''lsa ham (Ziddiyat va taajjub)","example":"一生懸命[いっしょうけんめい] 勉強[べんきょう]したのに、不合格[ふごうかく]でした。"}],"phrases":[{"ja":"火事[かじ]や 地震[じしん]の 場合[ばあい]は、エレベーターを 使[つか]わないで ください。","uz":"Yong''in yoki zilzila bo''lgan taqdirda liftdan foydalanmang."},{"ja":"会議[かいぎ]に 遅[おく]れる 場合[ばあい]は、連絡[れんらく]して ください。","uz":"Majlisga kechikadigan bo''lsangiz, xabar bering."},{"ja":"一生懸命[いっしょうけんめい] 勉強[べんきょう]したのに、不合格[ふごうかく]でした。","uz":"Astoydil o''qigan bo''lsam ham (holbuki shuncha o''qidim), imtihondan o''ta olmadim."},{"ja":"日曜日[にちようび]なのに、働[はたら]かなければ なりません。","uz":"Yakshanba bo''lishiga qaramay, ishlashga majburman."}]}'::jsonb, 45),
  ('m-l46', '46-Dars: 局面 (〜ところです: Boshlanish/jarayon/yakun) / 直後 (〜ばかりです)', '第46課：〜ところ・〜ばかり・〜はずだ', 'N4', 12, 35, '{"vocab":[{"ja":"渡します (わたします)","romaji":"わたします","uz":"topshirmoq, qo''liga tutqazmoq"},{"ja":"帰って来ます (かえってきます)","romaji":"かえってきます","uz":"qaytib kelmoq"},{"ja":"届きます (とどきます)","romaji":"とどきます","uz":"yetib bormoq (pochta, jo''natma)"},{"ja":"留守 (るす)","romaji":"るす","uz":"uyda yo''qlik, bekorchilik"},{"ja":"宅配便 (たくはいびん)","romaji":"たくはいびん","uz":"yetkazib berish xizmati (kuryerlik)"},{"ja":"原因 (げんいん)","romaji":"げんいん","uz":"sabab, omil"},{"ja":"たった今 (たったいま)","romaji":"たったいま","uz":"ayni hozirgina, hozirning o''zida"},{"ja":"今いいですか (いまいいですか)","romaji":"いまいいですか","uz":"hozir vaqtingiz bormi?"},{"ja":"出発します (しゅっぱつします)","romaji":"しゅっぱつします","uz":"jo''namoq, yo''lga chiqmoq"},{"ja":"到着します (とうちゃくします)","romaji":"とうちゃくします","uz":"yetib kelmoq"},{"ja":"荷物 (にもつ)","romaji":"にもつ","uz":"yuk, posilka"},{"ja":"結果 (けっか)","romaji":"けっか","uz":"natija"},{"ja":"予定 (よてい)","romaji":"よてい","uz":"reja"}],"grammar":[{"pattern":"V-辞書形 / ている / た形 ＋ ところです","meaning":"Ayni ...boshlanish arafasida / ...qilinayotgan paytda / ...tugagan onda","example":"会議[かいぎ]は 今[いま]から 始[はじ]まる ところです。"},{"pattern":"V-た形 ＋ ばかりです","meaning":"Yaqindagina ...qildim / ...qilingan (Psixologik yangilik)","example":"彼[かれ]は 先月[せんげつ] 日本[にほん]へ 来[き]た ばかりです。"},{"pattern":"普通形 ＋ はずです","meaning":"...bo''lishi aniq / kerak (Asosli ishonch)","example":"荷物[にもつ]は 明日[あした] 届[とど]く はずです。"}],"phrases":[{"ja":"会議[かいぎ]は 今[いま]から 始[はじ]まる ところです。","uz":"Majlis ayni hozir boshlanish arafasida turibdi."},{"ja":"今[いま] 書類[しょるい]を 作[つく]って いる ところです。","uz":"Ayni paytda hujjatlarni tayyorlayotgan edim."},{"ja":"たった今[いま] 昼[ひる]ごはんを 食[た]べた ところです。","uz":"Ayni hozirgina tushlik qilib bo''lgan paytim edi."},{"ja":"彼[かれ]は 先月[せんげつ] 日本[にほん]へ 来[き]た ばかりです。","uz":"U o''tgan oygina Yaponiyaga keldi (kelganiga ko''p bo''lgani yo''q)."},{"ja":"荷物[にもつ]は 明日[あした] 届[とど]く はずです。","uz":"Jo''natma ertaga yetib borishi aniq."}]}'::jsonb, 46),
  ('m-l47', '47-Dars: 伝聞 (〜そうです: Eshitishimcha) / 推量 (〜ようです: Ko''rinishidan)', '第47課：〜そうだ（伝聞）・〜ようだ（推量）', 'N4', 14, 40, '{"vocab":[{"ja":"集まります (あつまります)","romaji":"あつまります","uz":"yig''ilmoq, to''planmoq"},{"ja":"別れます (わかれます)","romaji":"わかれます","uz":"ajrashmoq, xayrlashmoq"},{"ja":"音 (おと)","romaji":"おと","uz":"tovush (jonsiz narsalar tovushi)"},{"ja":"声 (こえ)","romaji":"こえ","uz":"ovoz (inson yoki jonivor)"},{"ja":"味 (あじ)","romaji":"あじ","uz":"ta''m, maza"},{"ja":"におい","romaji":"におい","uz":"hid"},{"ja":"婚約します (こんやくします)","romaji":"こんやくします","uz":"unashtirilmoq, unashtiruv"},{"ja":"比べます (くらべます)","romaji":"くらべます","uz":"solishtirmoq, qiyoslamoq"},{"ja":"天気予報 (てんきよほう)","romaji":"てんきよほう","uz":"ob-havo ma''lumoti"},{"ja":"ニュース (にゅーす)","romaji":"にゅーす","uz":"yangiliklar"},{"ja":"事故 (じこ)","romaji":"じこ","uz":"baxtsiz hodisa, avariya"},{"ja":"パトカー (ぱとかー)","romaji":"ぱとかー","uz":"politsiya mashinasi"},{"ja":"救急車 (きゅうきゅうしゃ)","romaji":"きゅうきゅうしゃ","uz":"tez yordam mashinasi"},{"ja":"うわさ","romaji":"うわさ","uz":"mish-mish"}],"grammar":[{"pattern":"普通形 ＋ そうです (伝聞 - Eshitilgan xabar)","meaning":"Eshitishimcha / Xabarlarga ko''ra ...mish","example":"天気予報[てんきよほう]に よると、明日[あした]は 寒[さむ]く なるそうです。"},{"pattern":"普通形 (Naな / Nの) ＋ ようです","meaning":"...ga o''xshaydi / ...kabi ko''rinadi (Sezgilarga asoslangan xulosa)","example":"隣[となり]の 部屋[へや]に だれか いるようです。"},{"pattern":"音 / 声 / におい / 味 が します","meaning":"Ovoz / Hid / Ta''m kelmoqda (Sezilmoqda)","example":"台所[だいどころ]から いい においが します。"}],"phrases":[{"ja":"天気予報[てんきよほう]に よると、明日[あした]は 寒[さむ]く なるそうです。","uz":"Ob-havo ma''lumotlariga ko''ra, ertaga havo soviydi emish."},{"ja":"小川[おがわ]さんは 来月[らいげつ] 結婚[けっこん]するそうです。","uz":"Eshitishimcha, Ogawa xonim kelasi oy turmushga chiqar ekan."},{"ja":"隣[となり]の 部屋[へや]に だれか いるようです。","uz":"Qo''shni xonada kimdir borga o''xshaydi (ovoz kelmoqda)."},{"ja":"台所[だいどころ]から いい においが します。","uz":"Oshxonadan yoqimli hid kelyapti."}]}'::jsonb, 47),
  ('m-l48', '48-Dars: 使役動詞 (Majburlash yoki ijozat berish: 〜させる) / 〜させていただけませんか', '第48課：使役形・〜させていただけませんか', 'N4', 16, 30, '{"vocab":[{"ja":"下ろします (おろします)","romaji":"おろします","uz":"tushirmoq (yukni)"},{"ja":"届けます (とどけます)","romaji":"とどけます","uz":"yetkazib bermoq"},{"ja":"世話をします (せわをします)","romaji":"せわをします","uz":"parvarishlamoq, qaramoq"},{"ja":"嫌 (いやな)","romaji":"いやな","uz":"yoqimsiz, istalmagan"},{"ja":"厳しい (きびしい)","romaji":"きびしい","uz":"qattiqqo''l, talabchan"},{"ja":"塾 (じゅく)","romaji":"じゅく","uz":"tayyorlov kursi, qo''shimcha dars markazi"},{"ja":"スケジュール","romaji":"スケジュール","uz":"jadval, reja"},{"ja":"生徒 (せいと)","romaji":"せいと","uz":"o''quvchi (maktab o''quvchisi)"},{"ja":"意見 (いけん)","romaji":"いけん","uz":"fikr, mulohaza"},{"ja":"発表します (はっぴょうします)","romaji":"はっぴょうします","uz":"taqdimot qilmoq, e''lon qilmoq"},{"ja":"片づけ (かたづけ)","romaji":"かたづけ","uz":"yig''ishtirish, tartibga solish"},{"ja":"手伝い (てつだい)","romaji":"てつだい","uz":"yordam"},{"ja":"買い物 (かいもの)","romaji":"かいもの","uz":"bozor-o''char, xarid"},{"ja":"コピー (こぴー)","romaji":"こぴー","uz":"nusxa ko''chirish"},{"ja":"早退します (そうたいします)","romaji":"そうたいします","uz":"ishdan/darsdan vaqtidan oldin ketmoq"},{"ja":"有給休暇 (ゆうきゅうきゅうか)","romaji":"ゆうきゅうきゅうか","uz":"haqli mehnat ta''tili"}],"grammar":[{"pattern":"使役動詞 (Shieki-doushi: Majburlash / Ijozat nisbati)","meaning":"...qildirmoq (majburlab qildirish yoki qilishiga ijozat berish)","example":"部長[ぶちょう]は ミラーさんを アメリカへ 出張[しゅっちょう]させました。"},{"pattern":"V-使役て形 ＋ いただけませんか","meaning":"Menga ...qilishga ruxsat bersangiz / ijozat bersangiz","example":"すみませんが、明日[あした] 休[やす]ませて いただけませんか。"}],"phrases":[{"ja":"部長[ぶちょう]は ミラーさんを アメリカへ 出張[しゅっちょう]させました。","uz":"Bo''lim boshlig''i Miller janoblarini Amerikaga xizmat safariga yubordi."},{"ja":"わたしは 娘[むすめ]に ピアノを 習[なら]わせます。","uz":"Men qizimga pianino chalishni o''rgataman (o''rganishiga ruxsat/imkoniyat beraman)."},{"ja":"すみませんが、明日[あした] 休[やす]ませて いただけませんか。","uz":"Kechirasiz, ertaga dam olishimga ruxsat bera olmaysizmi?"},{"ja":"自分[じぶん]で やらせて いただけませんか。","uz":"O''zim bajarishimga ijozat bersangiz."}]}'::jsonb, 48),
  ('m-l49', '49-Dars: 尊敬語 (Sonkeigo: Hurmat shakli) / お〜になります / 特殊尊敬語', '第49課：尊敬語（お〜になる・特殊尊敬語）', 'N4', 18, 35, '{"vocab":[{"ja":"勤めます (つとめます)","romaji":"つとめます","uz":"ishlamoq, xizmat qilmoq (kompaniyada)"},{"ja":"過ごします (すごします)","romaji":"すごします","uz":"vaqt o''tkazmoq"},{"ja":"いらっしゃいます","romaji":"いらっしゃいます","uz":"boradilar / keladilar / borlar (行きます・来ます・います ning hurmat shakli)"},{"ja":"召し上がります (めしあがります)","romaji":"めしあがります","uz":"yeydilar / ichadilar (食べます・飲みます ning hurmat shakli)"},{"ja":"おっしゃいます","romaji":"おっしゃいます","uz":"deydilar, aytadilar (言います ning hurmat shakli)"},{"ja":"なさいます","romaji":"なさいます","uz":"qiladilar (します ning hurmat shakli)"},{"ja":"ご覧に なります (ごらんになります)","romaji":"ごらんになります","uz":"ko''radilar (見ます ning hurmat shakli)"},{"ja":"ご存じです (ごぞんじです)","romaji":"ごぞんじです","uz":"biladilar (知っています ning hurmat shakli)"},{"ja":"お名前 (おなまえ)","romaji":"おなまえ","uz":"ism (hurmat bilan)"},{"ja":"ご住所 (ごじゅうしょ)","romaji":"ごじゅうしょ","uz":"manzil (hurmat bilan)"},{"ja":"社長 (しゃちょう)","romaji":"しゃちょう","uz":"kompaniya prezidenti"},{"ja":"部長 (ぶちょう)","romaji":"ぶちょう","uz":"departament boshlig''i"},{"ja":"奥様 (おくさま)","romaji":"おくさま","uz":"boshqaning rafiqasi (juda hurmatli)"},{"ja":"ご家族 (ごかぞく)","romaji":"ごかぞく","uz":"boshqaning oilasi"}],"grammar":[{"pattern":"お V-ます形 ＋ に なります","meaning":"...qiladilar (Muntazam hurmat fe''li)","example":"社長[しゃちょう]は もう お帰[かえ]りに なりました。"},{"pattern":"特殊尊敬語 (Maxsus hurmat fe''llari)","meaning":"Tengsiz darajadagi ehtirom shakllari","example":"先生[せんせい]は いつ いらっしゃいますか。"},{"pattern":"お V-ます形 ＋ ください / ご N ＋ ください","meaning":"Marhamat qilib ...qilingiz (Ehtiromli taklif)","example":"こちらに お掛[か]け ください。"}],"phrases":[{"ja":"社長[しゃちょう]は もう お帰[かえ]りに なりました。","uz":"Prezident janoblari allaqachon uyga qaytdilar."},{"ja":"先生[せんせい]は いつ いらっしゃいますか。","uz":"Ustoz qachon keladilar / bo''ladilar?"},{"ja":"お名前[なまえ]は 何[なん]と おっしゃいますか。","uz":"Ismi sharifingiz nima deb ataladi?"},{"ja":"こちらに お掛[か]け ください。","uz":"Marhamat qilib bu yerga o''tiringiz."}]}'::jsonb, 49),
  ('m-l50', '50-Dars: 謙譲語 (Kenjougo: Kamtarlik shakli) / お〜します / 特殊謙譲語', '第50課：謙譲語（お〜する・特殊謙譲語・丁寧語）', 'N4', 10, 40, '{"vocab":[{"ja":"参ります (まいります)","romaji":"まいります","uz":"boraman / kelaman (行きます・来ます ning kamtarlik shakli)"},{"ja":"おります","romaji":"おります","uz":"turibman / borman (います ning kamtarlik shakli)"},{"ja":"いただきます","romaji":"いただきます","uz":"yeyman / ichaman / olaman (食べます・飲みます・もらいます ning kamtarlik shakli)"},{"ja":"申します (もうします)","romaji":"もうします","uz":"deyilaman, aytaman (言います ning kamtarlik shakli)"},{"ja":"いたします","romaji":"いたします","uz":"qilaman, bajaraman (します ning kamtarlik shakli)"},{"ja":"拝見します (はいけんします)","romaji":"はいけんします","uz":"ko''raman, qarab chiqaman (見ます ning kamtarlik shakli)"},{"ja":"存じます (ぞんじます)","romaji":"ぞんじます","uz":"bilaman / o''ylayman (知っています・思います ning kamtarlik shakli)"},{"ja":"伺います (うかがいます)","romaji":"うかがいます","uz":"so''rayman / tashrif buyuraman (聞きます・行きます ning kamtarlik shakli)"},{"ja":"お目に掛かります (おめにかかります)","romaji":"おめにかかります","uz":"uchrashaman (会います ning kamtarlik shakli)"},{"ja":"私 (わたくし)","romaji":"わたくし","uz":"men (わたし ning rasmiy va kamtar shakli)"},{"ja":"私ども (わたくしども)","romaji":"わたくしども","uz":"biz (kamtarlik shakli)"},{"ja":"拝見します","romaji":"拝見します","uz":"ko''rmoq, mutolaa qilmoq (kamtarlik)"},{"ja":"ご案内します (ごあんないします)","romaji":"ごあんないします","uz":"kuzatib bormoq, tanishtirmoq (kamtarlik)"},{"ja":"お伝えします (おつたえします)","romaji":"おつたえします","uz":"yetkazmoq (kamtarlik)"}],"grammar":[{"pattern":"お V-ます形 ＋ します / ご N ＋ します","meaning":"...qilib beraman (O''z xizmatini kamtarlik bilan taklif qilish)","example":"重[おも]い 荷物[にもつ]を お持[も]ちします。"},{"pattern":"特殊謙譲語 (Maxsus kamtarlik fe''llari)","meaning":"O''z harakatini pasaytirib, suhbatdoshni yuksaltirish","example":"アメリカから 参[まい]りました。"},{"pattern":"ございます / でございます","meaning":"Bor / ...dir (丁寧語 - O''ta xushmuomala uslub)","example":"お手洗[てあら]いは 2階[にかい]に ございます。"}],"phrases":[{"ja":"重[おも]い 荷物[にもつ]を お持[も]ちします。","uz":"Og''ir yukingizni ko''tarib beraman."},{"ja":"今日[きょう]の 予定[よてい]を ご説明[せつめい]します。","uz":"Bugungi rejani tushuntirib beraman."},{"ja":"アメリカから 参[まい]りました。","uz":"Amerikadan tashrif buyurdim."},{"ja":"明日[あした] 3時[さんじ]に 伺[うかが]います。","uz":"Ertaga soat 3 da xizmatingizga boraman."},{"ja":"お手洗[てあら]いは 2階[にかい]に ございます。","uz":"Hojatxona 2-qavatda joylashgan."},{"ja":"IMCの ミラーで ございます。","uz":"Men IMC kompaniyasidan Miller bo''laman."}]}'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, title_ja = EXCLUDED.title_ja, level = EXCLUDED.level, minutes = EXCLUDED.minutes, xp = EXCLUDED.xp, content = EXCLUDED.content, sort_order = EXCLUDED.sort_order;
-- @@CHUNK@@
-- mobile_lessons: 50 rows
-- lesson quizzes
INSERT INTO public.mobile_quiz_questions (id, quiz_type, lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  ('lq_m-l1_1', 'lesson', 'm-l1', '「エンジニア」 ning ma''nosi qaysi?', '["muhandis","shifoxona, kasalxona","chiroq","universitet, institut"]'::jsonb, 0, 'エンジニア — muhandis', 1),
  ('lq_m-l1_2', 'lesson', 'm-l1', '「インド」 ning ma''nosi qaysi?', '["Hindiston","Janubiy Koreya","Indoneziya","Tailand"]'::jsonb, 0, 'インド — Hindiston', 2),
  ('lq_m-l1_3', 'lesson', 'm-l1', '「どうぞ よろしく (どうぞ よろしく)」 ning ma''nosi qaysi?', '["Tanishganimdan xursandman","Bu kishi janob / xonim ~.","Men ~(davlat nomi)dan kelganman","Amerika, AQSH"]'::jsonb, 0, 'どうぞ よろしく (どうぞ よろしく) — Tanishganimdan xursandman', 3),
  ('lq_m-l1_4', 'lesson', 'm-l1', '「わたし」 ning ma''nosi qaysi?', '["siz (sen)","u kishi (u ayol (qiz))","men","biz"]'::jsonb, 2, 'わたし — men', 4),
  ('lq_m-l1_5', 'lesson', 'm-l1', '「会社員 (かいしゃいん)」 ning ma''nosi qaysi?', '["firma xodimi (korxona nomlari bilan qo''llanadi. Masalan: ＩＭＣの社員 )","bank xodimi","shifokor","firma xodimi, korxona xodimi"]'::jsonb, 3, '会社員 (かいしゃいん) — firma xodimi, korxona xodimi', 5),
  ('lq_m-l2_1', 'lesson', 'm-l2', '「これから お世話[せわ] に なります。」 ning ma''nosi qaysi?', '["bu (so''zlovchiga yaqin masofadagi buyumga nisbatan qo''llaniladi)","Bundan buyon mehr va yordamingizga muhtojman.","Men ham yordamingizni ayamaysiz degan umiddaman. / Men ham tanishganimdan xursandman. ( 「どうぞよろしく」 ga javob tariqasida)","u, o''sha (tinglovchiga yaqin masofadagi buyumlarga nisbatan qo''llaniladi)"]'::jsonb, 1, 'これから お世話[せわ] に なります。 — Bundan buyon mehr va yordamingizga muhtojman.', 1),
  ('lq_m-l2_2', 'lesson', 'm-l2', '「シャープペンシル」 ning ma''nosi qaysi?', '["avtoqalam","sumka","qulf-kalit","audio tasma"]'::jsonb, 0, 'シャープペンシル — avtoqalam', 2),
  ('lq_m-l2_3', 'lesson', 'm-l2', '「その～」 ning ma''nosi qaysi?', '["daftar","kartochka","ana u~, ana o''sha~ (ham so''zlovchiga, ham tinglovchiga uzoq bo''lgan buyumlarga nisbatan qo''llaniladi)","u~, o''sha~(tinglovchiga yaqin masofadagi buyumlarga nisbatan qo''llaniladi)"]'::jsonb, 3, 'その～ — u~, o''sha~(tinglovchiga yaqin masofadagi buyumlarga nisbatan qo''llaniladi)', 3),
  ('lq_m-l2_4', 'lesson', 'm-l2', '「机 (つくえ)」 ning ma''nosi qaysi?', '["shokolad","stol, parta","qahva (kofe)","stul, kursi"]'::jsonb, 1, '机 (つくえ) — stol, parta', 4),
  ('lq_m-l2_5', 'lesson', 'm-l2', '「どうも。」 ning ma''nosi qaysi?', '["Bundan buyon mehr va yordamingizga muhtojman.","Rahmat.","] Katta rahmat (minnatdorchilik izhor etishning to''liq ifodasi)","Men ham yordamingizni ayamaysiz degan umiddaman. / Men ham tanishganimdan xursandman. ( 「どうぞよろしく」 ga javob tariqasida)"]'::jsonb, 1, 'どうも。 — Rahmat.', 5),
  ('lq_m-l3_1', 'lesson', 'm-l3', '「教室 (きょうしつ)」 ning ma''nosi qaysi?', '["sinf, auditoriya","idora, ofis","majlislar zali","oshxona"]'::jsonb, 0, '教室 (きょうしつ) — sinf, auditoriya', 1),
  ('lq_m-l3_2', 'lesson', 'm-l3', '「階段 (かいだん)」 ning ma''nosi qaysi?', '["lift","vatan, mamlakat","eskalator","zina"]'::jsonb, 3, '階段 (かいだん) — zina', 2),
  ('lq_m-l3_3', 'lesson', 'm-l3', '「あちら」 ning ma''nosi qaysi?', '["sinf, auditoriya","oshxona","ana u yer, ana u joy ( あそこ ning hurmat shakli)","qayer ( どこ ning hurmat shakli)"]'::jsonb, 2, 'あちら — ana u yer, ana u joy ( あそこ ning hurmat shakli)', 3),
  ('lq_m-l3_4', 'lesson', 'm-l3', '「千 (せん)」 ning ma''nosi qaysi?', '["~dir. ( です ning hurmat shakli.)","ming","o''n ming","Kechirasiz. / Meni ma''zur tutasiz."]'::jsonb, 1, '千 (せん) — ming', 4),
  ('lq_m-l3_5', 'lesson', 'm-l3', '「万 (まん)」 ning ma''nosi qaysi?', '["~dir. ( です ning hurmat shakli.)","Iltimos, ~ni ko''rsating.","o''n ming","Kechirasiz. / Meni ma''zur tutasiz."]'::jsonb, 2, '万 (まん) — o''n ming', 5),
  ('lq_m-l4_1', 'lesson', 'm-l4', '「～と～」 ning ma''nosi qaysi?', '["Xo''sh… . (fikrni jamlash payti iborasi)","sizda","~ bilan ~","104 (ma''lumotlar bo''limi raqami)"]'::jsonb, 2, '～と～ — ~ bilan ~', 1),
  ('lq_m-l4_2', 'lesson', 'm-l4', '「きのう」 ning ma''nosi qaysi?', '["ertaga","indinga, ertadan keyin","kecha","bugun"]'::jsonb, 2, 'きのう — kecha', 2),
  ('lq_m-l4_3', 'lesson', 'm-l4', '「かしこまりました。」 ning ma''nosi qaysi?', '["Nyu-York","Katta rahmat.","Tushundim. / Uqdim.","Ma''lumot uchun telefonlar"]'::jsonb, 2, 'かしこまりました。 — Tushundim. / Uqdim.', 3),
  ('lq_m-l4_4', 'lesson', 'm-l4', '「きょう」 ning ma''nosi qaysi?', '["ertaga","indinga, ertadan keyin","bugun ertalab, bugun tongda","bugun"]'::jsonb, 3, 'きょう — bugun', 4),
  ('lq_m-l4_5', 'lesson', 'm-l4', '「おととい」 ning ma''nosi qaysi?', '["kecha","bugun","ertaga","o''tgan kuni, kechadan oldingi kun"]'::jsonb, 3, 'おととい — o''tgan kuni, kechadan oldingi kun', 5),
  ('lq_m-l5_1', 'lesson', 'm-l5', '「行きます (いきます)」 ning ma''nosi qaysi?', '["qaytmoq","bormoq","kelmoq","maktab"]'::jsonb, 1, '行きます (いきます) — bormoq', 1),
  ('lq_m-l5_2', 'lesson', 'm-l5', '「5  日 (いつか)」 ning ma''nosi qaysi?', '["oyning yettinchi sanasi; yetti kun","oyning beshinchi sanasi; besh kun","oyning oltinchi sanasi; olti kun","oyning sakkizinchi sanasi; sakkiz kun"]'::jsonb, 1, '5  日 (いつか) — oyning beshinchi sanasi; besh kun', 2),
  ('lq_m-l5_3', 'lesson', 'm-l5', '「4  日 (よっか)」 ning ma''nosi qaysi?', '["oyning oltinchi sanasi; olti kun","oyning beshinchi sanasi; besh kun","oyning to''rtinchi sanasi; to''rt kun","oyning yettinchi sanasi; yetti kun"]'::jsonb, 2, '4  日 (よっか) — oyning to''rtinchi sanasi; to''rt kun', 3),
  ('lq_m-l5_4', 'lesson', 'm-l5', '「彼女 (かのじょ)」 ning ma''nosi qaysi?', '["u (ayol kishi)","o''tgan hafta","oila","bir o''zi(~m, ~ng ), yakka"]'::jsonb, 0, '彼女 (かのじょ) — u (ayol kishi)', 4),
  ('lq_m-l5_5', 'lesson', 'm-l5', '「9  日 (ここのか)」 ning ma''nosi qaysi?', '["oyning to''qqizinchi sanasi; to''qqiz kun","oyning yigirmanchi sanasi; yigirma kun","oyning o''n to''rtinchi sanasi; o''n to''rt kun","oyning oninchi sanasi; o''n kun"]'::jsonb, 0, '9  日 (ここのか) — oyning to''qqizinchi sanasi; to''qqiz kun', 5),
  ('lq_m-l6_1', 'lesson', 'm-l6', '「ビデオ」 ning ma''nosi qaysi?', '["xat, maktub","kino","kompakt-disk","video"]'::jsonb, 3, 'ビデオ — video', 1),
  ('lq_m-l6_2', 'lesson', 'm-l6', '「みせ 店」 ning ma''nosi qaysi?', '["do''kon","hovli, bog''","restoran","uyga vazifa"]'::jsonb, 0, 'みせ 店 — do''kon', 2),
  ('lq_m-l6_3', 'lesson', 'm-l6', '「てがみ 手紙」 ning ma''nosi qaysi?', '["fotosurat","hisobot; ma''ruza","xat, maktub","do''kon"]'::jsonb, 2, 'てがみ 手紙 — xat, maktub', 3),
  ('lq_m-l6_4', 'lesson', 'm-l6', '「パン」 ning ma''nosi qaysi?', '["go''sht","tuxum","baliq","non"]'::jsonb, 3, 'パン — non', 4),
  ('lq_m-l6_5', 'lesson', 'm-l6', '「おちゃ お茶」 ning ma''nosi qaysi?', '["qora choy","sut","sharbat","choy"]'::jsonb, 3, 'おちゃ お茶 — choy', 5),
  ('lq_m-l7_1', 'lesson', 'm-l7', '「送ります (おくります)」 ning ma''nosi qaysi?', '["jo''natmoq","olmoq","bermoq, sovg''a qilmoq","qarzga bermoq, berib turmoq"]'::jsonb, 0, '送ります (おくります) — jo''natmoq', 1),
  ('lq_m-l7_2', 'lesson', 'm-l7', '「お父さん (おとうさん)」 ning ma''nosi qaysi?', '["allaqachon, ~ib bo''ldi(~m,~ ing); endi","ona, oyi / ~ning onasi","hali ham","ota, dada / ~ning otasi"]'::jsonb, 3, 'お父さん (おとうさん) — ota, dada / ~ning otasi', 2),
  ('lq_m-l7_3', 'lesson', 'm-l7', '「かけます」 ning ma''nosi qaysi?', '["(qo''ng''iroq) qilmoq","qo''l","hashi (ovqat yeyishda qo''llaniladigan cho''p)","(telefon qilmoq, qo''ng''iroq qilmoq)"]'::jsonb, 0, 'かけます — (qo''ng''iroq) qilmoq', 3),
  ('lq_m-l7_4', 'lesson', 'm-l7', '「父 (ちち)」 ning ma''nosi qaysi?', '["ota, dada / ~ning otasi","otam, dadam","onam, oyim","ona, oyi / ~ning onasi"]'::jsonb, 1, '父 (ちち) — otam, dadam', 4),
  ('lq_m-l7_5', 'lesson', 'm-l7', '「これから」 ning ma''nosi qaysi?', '["Hoy kim bor? (Birovning uyiga kirib borganda qo''llanadigan ibora)","Xush kelibsiz.","endi; bundan buyon","Bu~ buncha chiroyli!"]'::jsonb, 2, 'これから — endi; bundan buyon', 5),
  ('lq_m-l8_1', 'lesson', 'm-l8', '「お元気ですか。 (おげんきですか。)」 ning ma''nosi qaysi?', '["Nimasini aytsam sizga… .; Rost aytasiz.; Ha-ya (Ushbu ibora suhbatning uzilib qolmasligiga xizmat qilib, “ma''qullash” yoki “fikr jamlash” ni ifodalaydi.)","Yaxshimisiz? / Salomatmisiz?","Yana bir piyola (chashka, kosa) ~ ichasizmi?","Siz Yaponiya turmush tarziga ko''nikdingizmi?"]'::jsonb, 1, 'お元気ですか。 (おげんきですか。) — Yaxshimisiz? / Salomatmisiz?', 1),
  ('lq_m-l8_2', 'lesson', 'm-l8', '「親切 [ な ] (しんせつ [ な ])」 ning ma''nosi qaysi?', '["sog''lom, baquvvat","bo''sh (vaqt),","qulay","mehribon"]'::jsonb, 3, '親切 [ な ] (しんせつ [ な ]) — mehribon', 2),
  ('lq_m-l8_3', 'lesson', 'm-l8', '「勉強 (べんきょう)」 ning ma''nosi qaysi?', '["ish ( ～をします ishlamoq)","qanday, qanaqa","turmush, hayot","dars, mashg''ulot"]'::jsonb, 3, '勉強 (べんきょう) — dars, mashg''ulot', 3),
  ('lq_m-l8_4', 'lesson', 'm-l8', '「日[に] 本[ほん] の 生活[せいかつ] に 慣[な] れましたか。」 ning ma''nosi qaysi?', '["Siz Yaponiya turmush tarziga ko''nikdingizmi?","Yana bir piyola (chashka, kosa) ~ ichasizmi?","Yo''q, rahmat.","Endi ~-a?"]'::jsonb, 0, '日[に] 本[ほん] の 生活[せいかつ] に 慣[な] れましたか。 — Siz Yaponiya turmush tarziga ko''nikdingizmi?', 4),
  ('lq_m-l8_5', 'lesson', 'm-l8', '「すてき [ な ]」 ning ma''nosi qaysi?', '["yangi","chiroyli, ajoyib","kichik","katta"]'::jsonb, 1, 'すてき [ な ] — chiroyli, ajoyib', 5),
  ('lq_m-l9_1', 'lesson', 'm-l9', '「スポーツ」 ning ma''nosi qaysi?', '["raqs","sport","beysbol","musiqa"]'::jsonb, 1, 'スポーツ — sport', 1),
  ('lq_m-l9_2', 'lesson', 'm-l9', '「字 (じ)」 ning ma''nosi qaysi?', '["harf","belgi, iyeroglif","katakana (yapon alifbosi)","hiragana (yapon alifbosi)"]'::jsonb, 0, '字 (じ) — harf', 2),
  ('lq_m-l9_3', 'lesson', 'm-l9', '「小[お] 沢[ざわ] 征[せい] 爾[じ]」 ning ma''nosi qaysi?', '["bor (bo''lmoq)","tushunmoq","yoqimli, yoqtirgan, suygan","Ozava Seiji (1935-), taniqli yapon dirijori"]'::jsonb, 3, '小[お] 沢[ざわ] 征[せい] 爾[じ] — Ozava Seiji (1935-), taniqli yapon dirijori', 3),
  ('lq_m-l9_4', 'lesson', 'm-l9', '「カラオケ」 ning ma''nosi qaysi?', '["harf","rasm","kabuki","karaoke"]'::jsonb, 3, 'カラオケ — karaoke', 4),
  ('lq_m-l9_5', 'lesson', 'm-l9', '「ああ」 ning ma''nosi qaysi?', '["A","~ biroz… . (rad etish iborasi)","Bo''lmaydimi?","Birga (fe''l~)maysizmi?"]'::jsonb, 0, 'ああ — A', 5),
  ('lq_m-l10_1', 'lesson', 'm-l10', '「スイッチ」 ning ma''nosi qaysi?', '["krovat","stol","muzlatgich","viklyuchatel (elektr tokini ulaydigan va ayiradigan asbob)"]'::jsonb, 3, 'スイッチ — viklyuchatel (elektr tokini ulaydigan va ayiradigan asbob)', 1),
  ('lq_m-l10_2', 'lesson', 'm-l10', '「冷蔵庫 (れいぞうこ)」 ning ma''nosi qaysi?', '["stol","tokcha","muzlatgich","krovat"]'::jsonb, 2, '冷蔵庫 (れいぞうこ) — muzlatgich', 2),
  ('lq_m-l10_3', 'lesson', 'm-l10', '「女の 子 (おんなの こ)」 ning ma''nosi qaysi?', '["mushuk","daraxt","kuchuk, it","qiz bola"]'::jsonb, 3, '女の 子 (おんなの こ) — qiz bola', 3),
  ('lq_m-l10_4', 'lesson', 'm-l10', '「フイルム」 ning ma''nosi qaysi?', '["batareya","fototasma","viklyuchatel (elektr tokini ulaydigan va ayiradigan asbob)","quti"]'::jsonb, 1, 'フイルム — fototasma', 4),
  ('lq_m-l10_5', 'lesson', 'm-l10', '「近く (ちかく)」 ning ma''nosi qaysi?', '["eng~ ( いちばん うえ eng yuqori)","ora, o''rta","yaqin","~ va ~ ［ kabilar ］"]'::jsonb, 2, '近く (ちかく) — yaqin', 5),
  ('lq_m-l11_1', 'lesson', 'm-l11', '「みんな」 ning ma''nosi qaysi?', '["hamma, barcha","faqat","Yaxshi ob-havo-ya?","Xush kelibsiz."]'::jsonb, 0, 'みんな — hamma, barcha', 1),
  ('lq_m-l11_2', 'lesson', 'm-l11', '「～週間 (～しゅうかん)」 ning ma''nosi qaysi?', '["~lar, ~cha, taxminan~","~ hafta","~ oy","~ yil"]'::jsonb, 1, '～週間 (～しゅうかん) — ~ hafta', 2),
  ('lq_m-l11_3', 'lesson', 'm-l11', '「船便 (ふなびん)」 ning ma''nosi qaysi?', '["farzandlar, aka-ukalar","ota-ona","akam","dengiz pochtasi"]'::jsonb, 3, '船便 (ふなびん) — dengiz pochtasi', 3),
  ('lq_m-l11_4', 'lesson', 'm-l11', '「[ 会社を ] ([ かいしゃを～ ])」 ning ma''nosi qaysi?', '["(ishga chiqmaslik)","bitta","uchta","ikkita"]'::jsonb, 0, '[ 会社を ] ([ かいしゃを～ ]) — (ishga chiqmaslik)', 4),
  ('lq_m-l11_5', 'lesson', 'm-l11', '「速達 (そくたつ)」 ning ma''nosi qaysi?', '["dengiz pochtasi","tezkor pochta, ekspress pochta","avia pochta","buyurtmali pochta"]'::jsonb, 1, '速達 (そくたつ) — tezkor pochta, ekspress pochta', 5),
  ('lq_m-l12_1', 'lesson', 'm-l12', '「涼しい (すずしい)」 ning ma''nosi qaysi?', '["salqin","shirin","achchiq","og''ir"]'::jsonb, 0, '涼しい (すずしい) — salqin', 1),
  ('lq_m-l12_2', 'lesson', 'm-l12', '「冬 (ふゆ)」 ning ma''nosi qaysi?', '["qish","yomg''ir","ob-havo","qor"]'::jsonb, 0, '冬 (ふゆ) — qish', 2),
  ('lq_m-l12_3', 'lesson', 'm-l12', '「いい」 ning ma''nosi qaysi?', '["bahor","yaxshi, zo''r","fasl","(yaxshi kofe)"]'::jsonb, 1, 'いい — yaxshi, zo''r', 3),
  ('lq_m-l12_4', 'lesson', 'm-l12', '「初めて (はじめて)」 ning ma''nosi qaysi?', '["Yaxshi keldingizmi?","birinchi bor, ilk bor","Men keldim (uyiga qaytib kelganda)","Qoyil."]'::jsonb, 1, '初めて (はじめて) — birinchi bor, ilk bor', 4),
  ('lq_m-l12_5', 'lesson', 'm-l12', '「ずっと」 ning ma''nosi qaysi?', '["Yaxshi keldingizmi?","birinchi bor, ilk bor","ancha; ancha vaqt oldin; ancha vaqt","Men keldim (uyiga qaytib kelganda)"]'::jsonb, 2, 'ずっと — ancha; ancha vaqt oldin; ancha vaqt', 5),
  ('lq_m-l13_1', 'lesson', 'm-l13', '「疲れます (つかれます)」 ning ma''nosi qaysi?', '["xat jo''natmoq","charchamoq","kirmoq","jo''natmoq"]'::jsonb, 1, '疲れます (つかれます) — charchamoq', 1),
  ('lq_m-l13_2', 'lesson', 'm-l13', '「登録 (とうろく)」 ning ma''nosi qaysi?', '["hafta oxiri, dam olish kuni","~larda (vaqt bilan qo''llaniladi.)","nimadir, biror narsa","ro''yxatga olish （～をします： ro''yxatga olmoq ）"]'::jsonb, 3, '登録 (とうろく) — ro''yxatga olish （～をします： ro''yxatga olmoq ）', 2),
  ('lq_m-l13_3', 'lesson', 'm-l13', '「会議 (かいぎ)」 ning ma''nosi qaysi?', '["hafta oxiri, dam olish kuni","ro''yxatga olish （～をします： ro''yxatga olmoq ）","~larda (vaqt bilan qo''llaniladi.)","majlis, yig''in ( ～をします： majlis qilmoq)"]'::jsonb, 3, '会議 (かいぎ) — majlis, yig''in ( ～をします： majlis qilmoq)', 3),
  ('lq_m-l13_4', 'lesson', 'm-l13', '「釣り (つり)」 ning ma''nosi qaysi?', '["baliq tutish （～をします： baliq tutmoq ）","chang''i; chang''i uchish （～をします： chang''i uchmoq ）","ro''yxatga olish （～をします： ro''yxatga olmoq ）","majlis, yig''in ( ～をします： majlis qilmoq)"]'::jsonb, 0, '釣り (つり) — baliq tutish （～をします： baliq tutmoq ）', 4),
  ('lq_m-l13_5', 'lesson', 'm-l13', '「寂しい (さびしい)」 ning ma''nosi qaysi?', '["ma''yus, xafa","tor","shahar hokimiyati","keng"]'::jsonb, 0, '寂しい (さびしい) — ma''yus, xafa', 5),
  ('lq_m-l14_1', 'lesson', 'm-l14', '「塩 (しお)」 ning ma''nosi qaysi?', '["o''qilish (o''qilish uslubi)","~ish uslubi, ~ish odobi","tuz","shakar, qand"]'::jsonb, 2, '塩 (しお) — tuz', 1),
  ('lq_m-l14_2', 'lesson', 'm-l14', '「見せます (みせます)」 ning ma''nosi qaysi?', '["boshlamoq","o''rgatmoq, aytmoq, tushuntirmoq","(manzilni aytmoq)","ko''rsatmoq"]'::jsonb, 3, '見せます (みせます) — ko''rsatmoq', 2),
  ('lq_m-l14_3', 'lesson', 'm-l14', '「呼びます (よびます)」 ning ma''nosi qaysi?', '["suhbatlashmoq","chaqirmoq","o''rgatmoq, aytmoq, tushuntirmoq","ko''rsatmoq"]'::jsonb, 1, '呼びます (よびます) — chaqirmoq', 3),
  ('lq_m-l14_4', 'lesson', 'm-l14', '「名前 (なまえ)」 ning ma''nosi qaysi?', '["xarita","ism, nom","manzil","tuz"]'::jsonb, 1, '名前 (なまえ) — ism, nom', 4),
  ('lq_m-l14_5', 'lesson', 'm-l14', '「コピー します」 ning ma''nosi qaysi?', '["ism, nom","havo sovutgich","pasport","nusxa ko''chirmoq"]'::jsonb, 3, 'コピー します — nusxa ko''chirmoq', 5),
  ('lq_m-l15_1', 'lesson', 'm-l15', '「思[おも] い出[だ] します」 ning ma''nosi qaysi?', '["yodga olmoq, xotirlamoq","yuqori maktab (litsey) (10,11-sinf o''quvchilariga mo''ljallangan maktab)","bo''lmoq ( います ning hurmat shakli)","oilangiz, oilasi"]'::jsonb, 0, '思[おも] い出[だ] します — yodga olmoq, xotirlamoq', 1),
  ('lq_m-l15_2', 'lesson', 'm-l15', '「特[とく] に」 ning ma''nosi qaysi?', '["yodga olmoq, xotirlamoq","ayniqsa","oilangiz, oilasi","bo''lmoq ( います ning hurmat shakli)"]'::jsonb, 1, '特[とく] に — ayniqsa', 2),
  ('lq_m-l15_3', 'lesson', 'm-l15', '「時刻表 (じこくひょう)」 ning ma''nosi qaysi?', '["dastur ta''minoti (kompyuter)","vaqt jadval","mahsulot","kiyim"]'::jsonb, 1, '時刻表 (じこくひょう) — vaqt jadval', 3),
  ('lq_m-l15_4', 'lesson', 'm-l15', '「日本橋[にっぽんばし]」 ning ma''nosi qaysi?', '["foydalanmoq, qo''llamoq, ishlatmoq","o''tirmoq","Osakadagi savdo hududi nomi","turmoq"]'::jsonb, 2, '日本橋[にっぽんばし] — Osakadagi savdo hududi nomi', 4),
  ('lq_m-l15_5', 'lesson', 'm-l15', '「立ちます (たちます)」 ning ma''nosi qaysi?', '["foydalanmoq, qo''llamoq, ishlatmoq","o''tirmoq","qo''ymoq","turmoq"]'::jsonb, 3, '立ちます (たちます) — turmoq', 5),
  ('lq_m-l16_1', 'lesson', 'm-l16', '「次[つぎ] に」 ning ma''nosi qaysi?', '["tugmacha","pul summasi","tasdiq ( ～します tasdiqlamoq)","so''ng, keyin"]'::jsonb, 3, '次[つぎ] に — so''ng, keyin', 1),
  ('lq_m-l16_2', 'lesson', 'm-l16', '「金額[きんがく]」 ning ma''nosi qaysi?', '["Yaponiya Temir yo''llari kompaniyasi","pul summasi","tugmacha","tasdiq ( ～します tasdiqlamoq)"]'::jsonb, 1, '金額[きんがく] — pul summasi', 2),
  ('lq_m-l16_3', 'lesson', 'm-l16', '「暗い (くらい)」 ning ma''nosi qaysi?', '["bo''yi baland, novcha","aqlli, kallasi o''tkir","qorong''u","tana, jussa"]'::jsonb, 2, '暗い (くらい) — qorong''u', 3),
  ('lq_m-l16_4', 'lesson', 'm-l16', '「明るい (あかるい)」 ning ma''nosi qaysi?', '["qorong''u","aqlli, kallasi o''tkir","yorug''","bo''yi baland, novcha"]'::jsonb, 2, '明るい (あかるい) — yorug''', 4),
  ('lq_m-l16_5', 'lesson', 'm-l16', '「入ります (はいります)」 ning ma''nosi qaysi?', '["bitirmoq, tugatmoq","(universitetga kirmoq)","(universitetni bitirmoq)","kirmoq"]'::jsonb, 3, '入ります (はいります) — kirmoq', 5),
  ('lq_m-l17_1', 'lesson', 'm-l17', '「忘れます (わすれます)」 ning ma''nosi qaysi?', '["yo''qotmoq","unutmoq, esdan chiqarmoq","topshirmoq","(hisobot topshirmoq)"]'::jsonb, 1, '忘れます (わすれます) — unutmoq, esdan chiqarmoq', 1),
  ('lq_m-l17_2', 'lesson', 'm-l17', '「病気 (びょうき)」 ning ma''nosi qaysi?', '["korjoma, kostyum","kasal, betob; kasallik","hammom","dori"]'::jsonb, 1, '病気 (びょうき) — kasal, betob; kasallik', 2),
  ('lq_m-l17_3', 'lesson', 'm-l17', '「[ レポートを～ ]」 ning ma''nosi qaysi?', '["to''lamoq","qaytarib bermoq","chiqib ketmoq","(hisobot topshirmoq)"]'::jsonb, 3, '[ レポートを～ ] — (hisobot topshirmoq)', 3),
  ('lq_m-l17_4', 'lesson', 'm-l17', '「下着 (したぎ)」 ning ma''nosi qaysi?', '["ichki kiyim","ikki-uch kun","ikki-uch (narsa, buyum)","doktor (shifokorga murojaat etish)"]'::jsonb, 0, '下着 (したぎ) — ichki kiyim', 4),
  ('lq_m-l17_5', 'lesson', 'm-l17', '「上着 (うわぎ)」 ning ma''nosi qaysi?', '["doktor (shifokorga murojaat etish)","ichki kiyim","ikki-uch kun","korjoma, kostyum"]'::jsonb, 3, '上着 (うわぎ) — korjoma, kostyum', 5),
  ('lq_m-l18_1', 'lesson', 'm-l18', '「部長 (ぶちょう)」 ning ma''nosi qaysi?', '["jonivor, hayvon","korxona boshlig''i","departament boshlig''i ( 課長 dan yuqori lavozim)","ot"]'::jsonb, 2, '部長 (ぶちょう) — departament boshlig''i ( 課長 dan yuqori lavozim)', 1),
  ('lq_m-l18_2', 'lesson', 'm-l18', '「動物[どうぶつ]」 ning ma''nosi qaysi?', '["jonivor, hayvon","ot","A?! (Hayratlanish hissini ifodalovchi ibora)","Qiziq-a?"]'::jsonb, 0, '動物[どうぶつ] — jonivor, hayvon', 2),
  ('lq_m-l18_3', 'lesson', 'm-l18', '「ピアノ」 ning ma''nosi qaysi?', '["xalqaro ~","~ metr","pianino","naqd pul"]'::jsonb, 2, 'ピアノ — pianino', 3),
  ('lq_m-l18_4', 'lesson', 'm-l18', '「牧[ぼく] 場[じょう]」 ning ma''nosi qaysi?', '["Rostdanmi?","“Bitlz” – mashhur ingliz musiqa guruhi","ferma","albatta"]'::jsonb, 2, '牧[ぼく] 場[じょう] — ferma', 4),
  ('lq_m-l18_5', 'lesson', 'm-l18', '「集めます (あつめます)」 ning ma''nosi qaysi?', '["tashlamoq","almashtirmoq, o''zgartirmoq","haydamoq (transport ~)","yig''moq, to''plamoq"]'::jsonb, 3, '集めます (あつめます) — yig''moq, to''plamoq', 5),
  ('lq_m-l19_1', 'lesson', 'm-l19', '「無理[むり] ［な］」 ning ma''nosi qaysi?', '["imkoni yo''q (narsa), ilojsiz (narsa)","Katsushika Hokusay (1760 - 1849) Edo davrining yetuk rassomi","tort, pirojniy","sog''liqqa foyda"]'::jsonb, 0, '無理[むり] ［な］ — imkoni yo''q (narsa), ilojsiz (narsa)', 1),
  ('lq_m-l19_2', 'lesson', 'm-l19', '「弱い (よわい)」 ning ma''nosi qaysi?', '["o''zini yaxshi his qilmoq; soz","kayfiyat, holat","o''zini yomon his qilmoq; nosoz","kuchsiz"]'::jsonb, 3, '弱い (よわい) — kuchsiz', 2),
  ('lq_m-l19_3', 'lesson', 'm-l19', '「練習 します (れんしゅう します)」 ning ma''nosi qaysi?', '["kuchli","mashq qilmoq","bo''lmoq","uyqisiramoq"]'::jsonb, 1, '練習 します (れんしゅう します) — mashq qilmoq', 3),
  ('lq_m-l19_4', 'lesson', 'm-l19', '「相撲 (すもう)」 ning ma''nosi qaysi?', '["choy","o''yin avtomati, pachinko ( ～を します : pachinko o''ynamoq)","sumo kurashi","kun"]'::jsonb, 2, '相撲 (すもう) — sumo kurashi', 4),
  ('lq_m-l19_5', 'lesson', 'm-l19', '「お茶 (おちゃ)」 ning ma''nosi qaysi?', '["choy","kun","bir marta ham, hech, sira (inkor gapda qo''llaniladi.)","bir marta"]'::jsonb, 0, 'お茶 (おちゃ) — choy', 5),
  ('lq_m-l20_1', 'lesson', 'm-l20', '「物価 (ぶっか)」 ning ma''nosi qaysi?', '["narx-navo","viza","kimono (yapon milliy kiyimi)","boshi(da)"]'::jsonb, 0, '物価 (ぶっか) — narx-navo', 1),
  ('lq_m-l20_2', 'lesson', 'm-l20', '「ビザ」 ning ma''nosi qaysi?', '["oxiri(da)","boshi(da)","viza","bu yer, bu yoqqa ( こちら ning og''zaki shakli)"]'::jsonb, 2, 'ビザ — viza', 2),
  ('lq_m-l20_3', 'lesson', 'm-l20', '「修理 します (しゅうり します)」 ning ma''nosi qaysi?', '["tuzatmoq, ta''mirlamoq","men ( わたし ning og''zaki shakli, odatda erkak kishi qo''llaydi)","sen ( あなた ning og''zaki shakli, odatda erkak kishi qo''llaydi)","qo''ng''iroq qilmoq, telefon qilmoq"]'::jsonb, 0, '修理 します (しゅうり します) — tuzatmoq, ta''mirlamoq', 3),
  ('lq_m-l20_4', 'lesson', 'm-l20', '「着物 (きもの)」 ning ma''nosi qaysi?', '["kimono (yapon milliy kiyimi)","boshi(da)","viza","oxiri(da)"]'::jsonb, 0, '着物 (きもの) — kimono (yapon milliy kiyimi)', 4),
  ('lq_m-l20_5', 'lesson', 'm-l20', '「どう しようかな。」 ning ma''nosi qaysi?', '["turli, har xil (bu yerda “ravish” bo''lib kelgan. いろいろ 10-darsda “sifat” bo''lib kelgan)","kerak bo''lmoq, zarur bo''lmoq","Mumkin bo''lsa~. Lozim topsangiz~.","Nima qilsak ekan-a?"]'::jsonb, 3, 'どう しようかな。 — Nima qilsak ekan-a?', 5),
  ('lq_m-l21_1', 'lesson', 'm-l21', '「試合 (しあい)」 ning ma''nosi qaysi?', '["gap, suhbat （～をします： suhbatlashmoq ）","fikr","qo''shimcha ish （～をします： qo''shimcha ish qilmoq ）","musobaqa"]'::jsonb, 3, '試合 (しあい) — musobaqa', 1),
  ('lq_m-l21_2', 'lesson', 'm-l21', '「思います (おもいます)」 ning ma''nosi qaysi?', '["o''ylamoq, fikrlamoq","g''olib bo''lmoq, yutmoq","yetmoq, yetarli bo''lmoq (ulush)","demoq, aytmoq"]'::jsonb, 0, '思います (おもいます) — o''ylamoq, fikrlamoq', 2),
  ('lq_m-l21_3', 'lesson', 'm-l21', '「キャプテン･クック」 ning ma''nosi qaysi?', '["o''ylamoq, fikrlamoq","yetmoq, yetarli bo''lmoq (ulush)","Kapitan Djeyms Kuk (1728-1779)","demoq, aytmoq"]'::jsonb, 2, 'キャプテン･クック — Kapitan Djeyms Kuk (1728-1779)', 3),
  ('lq_m-l21_4', 'lesson', 'm-l21', '「交通 (こうつう)」 ning ma''nosi qaysi?', '["transport qatnovi","shu kunlarda","balki","tiqilinch transport qatnovi"]'::jsonb, 0, '交通 (こうつう) — transport qatnovi', 4),
  ('lq_m-l21_5', 'lesson', 'm-l21', '「アルバイト」 ning ma''nosi qaysi?', '["qo''shimcha ish （～をします： qo''shimcha ish qilmoq ）","gap, suhbat （～をします： suhbatlashmoq ）","hajv, yumor","fikr"]'::jsonb, 0, 'アルバイト — qo''shimcha ish （～をします： qo''shimcha ish qilmoq ）', 5),
  ('lq_m-l22_1', 'lesson', 'm-l22', '「生まれます (うまれます)」 ning ma''nosi qaysi?', '["tug''ilmoq, dunyoga kelmoq","sviter","kostum-shim","palto"]'::jsonb, 0, '生まれます (うまれます) — tug''ilmoq, dunyoga kelmoq', 1),
  ('lq_m-l22_2', 'lesson', 'm-l22', '「こちら」 ning ma''nosi qaysi?', '["bu ( これ ning hurmat shakli)","Ha. / Xo''p.","oshxona (uyning ~si)","uyning ijara haqi"]'::jsonb, 0, 'こちら — bu ( これ ning hurmat shakli)', 2),
  ('lq_m-l22_3', 'lesson', 'm-l22', '「[ シャツを～ ]」 ning ma''nosi qaysi?', '["poyafzal kiymoq","kiymoq (boshga qo''llaniladi)","kiymoq (beldan pastda qo''llaniladi)","ko''ylak kiymoq"]'::jsonb, 3, '[ シャツを～ ] — ko''ylak kiymoq', 3),
  ('lq_m-l22_4', 'lesson', 'm-l22', '「眼鏡 (めがね)」 ning ma''nosi qaysi?', '["tez-tez, rosa","bu ( これ ning hurmat shakli)","ko''zoynak","Tabriklayman."]'::jsonb, 2, '眼鏡 (めがね) — ko''zoynak', 4),
  ('lq_m-l22_5', 'lesson', 'm-l22', '「[ 帽子を～ ] ([ ぼうし～ ])」 ning ma''nosi qaysi?', '["Taqmoq","tug''ilmoq, dunyoga kelmoq","bosh kiyim kiymoq","ko''zoynak taqmoq"]'::jsonb, 2, '[ 帽子を～ ] ([ ぼうし～ ]) — bosh kiyim kiymoq', 5),
  ('lq_m-l23_1', 'lesson', 'm-l23', '「橋 (はし)」 ning ma''nosi qaysi?', '["~(i)nchi","avto ulovlar to''xtash joyi","ko''prik","yangi yil"]'::jsonb, 2, '橋 (はし) — ko''prik', 1),
  ('lq_m-l23_2', 'lesson', 'm-l23', '「道 (みち)」 ning ma''nosi qaysi?', '["chorraha","svetofor","muyulish, burulish","ko''cha, yo''l"]'::jsonb, 3, '道 (みち) — ko''cha, yo''l', 2),
  ('lq_m-l23_3', 'lesson', 'm-l23', '「変えます (かえます)」 ning ma''nosi qaysi?', '["tegmoq","qaytmoq, chiqmoq","o''zgartirmoq","(eshikka tegmoq)"]'::jsonb, 2, '変えます (かえます) — o''zgartirmoq', 3),
  ('lq_m-l23_4', 'lesson', 'm-l23', '「法[ほう] 隆[りゅう] 寺[じ]」 ning ma''nosi qaysi?', '["“Toshokanmae” avtobus bekati (o''ylab topilgan )","“Genkichya” choy navi (o''ylab topilgan )","“Honda” bekati (o''ylab topilgan )","Horyuji- Nara viloyatidagi ibodatxona. U Ⅶ asr boshida shahzoda Shotoku tomonidan qurdirilgan."]'::jsonb, 3, '法[ほう] 隆[りゅう] 寺[じ] — Horyuji- Nara viloyatidagi ibodatxona. U Ⅶ asr boshida shahzoda Shotoku tomonidan qurdirilgan.', 4),
  ('lq_m-l23_5', 'lesson', 'm-l23', '「引きます (ひきます)」 ning ma''nosi qaysi?', '["(eshikka tegmoq)","tegmoq","tortmoq","o''zgartirmoq"]'::jsonb, 2, '引きます (ひきます) — tortmoq', 5),
  ('lq_m-l24_1', 'lesson', 'm-l24', '「［お］弁当[べんとう]」 ning ma''nosi qaysi?', '["Onalar kuni","“Obento”- o''zi bilan olib keladigan ovqat","bermoq (menga bermoq)","olib bormoq, ergashtirib bormoq (jonli narsani ergashtirib bormoq)"]'::jsonb, 1, '［お］弁当[べんとう] — “Obento”- o''zi bilan olib keladigan ovqat', 1),
  ('lq_m-l24_2', 'lesson', 'm-l24', '「自分で (じぶんで)」 ning ma''nosi qaysi?', '["o''zi(~m, ~ng)","“Obento”- o''zi bilan olib keladigan ovqat","undan boshqa, boshqa","mikroavtobus, orqa tomonida ham eshik o''rnatilgan yengil mashina"]'::jsonb, 0, '自分で (じぶんで) — o''zi(~m, ~ng)', 2),
  ('lq_m-l24_3', 'lesson', 'm-l24', '「案内します (あんない します)」 ning ma''nosi qaysi?', '["damlamoq; solmoq","tushuntirmoq, izoh bermoq","(kofe damlamoq)","yo''l ko''rsatmoq; tanishtirmoq, ko''rsatmoq (joyni tanishtirmoq)"]'::jsonb, 3, '案内します (あんない します) — yo''l ko''rsatmoq; tanishtirmoq, ko''rsatmoq (joyni tanishtirmoq)', 3),
  ('lq_m-l24_4', 'lesson', 'm-l24', '「おばあさん／おばあちゃん」 ning ma''nosi qaysi?', '["ma''no","shirinlik","tayyorgarlik （～をします： tayyorgarlik qilmoq ）","buvi / buvijon"]'::jsonb, 3, 'おばあさん／おばあちゃん — buvi / buvijon', 4),
  ('lq_m-l24_5', 'lesson', 'm-l24', '「おじいさん／おじいちゃん」 ning ma''nosi qaysi?', '["ma''no","buva / buvajon","buvi / buvijon","tayyorgarlik （～をします： tayyorgarlik qilmoq ）"]'::jsonb, 1, 'おじいさん／おじいちゃん — buva / buvajon', 5)
ON CONFLICT (id) DO UPDATE SET quiz_type = EXCLUDED.quiz_type, lesson_id = EXCLUDED.lesson_id, question = EXCLUDED.question, options = EXCLUDED.options, correct_index = EXCLUDED.correct_index, explanation = EXCLUDED.explanation, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_quiz_questions (id, quiz_type, lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  ('lq_m-l25_1', 'lesson', 'm-l25', '「[ いろいろ ]  お世話[せわ] に なりました。」 ning ma''nosi qaysi?', '["fikrlamoq","harakat qilmoq, tirishmoq","Salomat bo''ling. (bir-biridan uzoq muddatda uzoqlashish oldidan xayrlashuv chog''ida qo''llaniladigan ibora)","Ko''rsatgan mehribonchiligingiz uchun rahmat. / Bergan tuzingizga rozi bo''ling."]'::jsonb, 3, '[ いろいろ ]  お世話[せわ] に なりました。 — Ko''rsatgan mehribonchiligingiz uchun rahmat. / Bergan tuzingizga rozi bo''ling.', 1),
  ('lq_m-l25_2', 'lesson', 'm-l25', '「もし    [ ～たら ]」 ning ma''nosi qaysi?', '["qancha (~sam ham, ~sang ham, ~sa ham / ~may, ~mang, ~masin)","agar (~sam, ~sang,~sa)","ish, masala ( ～の こと ~ning masalasi)","ish yuzasidan boshqa ishga o''tish ( ～を します ishni boshqa idoraga ko''chirmoq)"]'::jsonb, 1, 'もし    [ ～たら ] — agar (~sam, ~sang,~sa)', 2),
  ('lq_m-l25_3', 'lesson', 'm-l25', '「[ 駅に～ ] ([ えきに～ ])」 ning ma''nosi qaysi?', '["chet elda ta''lim olmoq","ulg''aymoq; qarimoq","(ulg''aymoq; qarimoq)","(vokzalga borib tushmoq)"]'::jsonb, 3, '[ 駅に～ ] ([ えきに～ ]) — (vokzalga borib tushmoq)', 3),
  ('lq_m-l25_4', 'lesson', 'm-l25', '「いくら   [ ～ても ]」 ning ma''nosi qaysi?', '["ish yuzasidan boshqa ishga o''tish ( ～を します ishni boshqa idoraga ko''chirmoq)","qancha (~sam ham, ~sang ham, ~sa ham / ~may, ~mang, ~masin)","Keling ichamiz.","ish, masala ( ～の こと ~ning masalasi)"]'::jsonb, 1, 'いくら   [ ～ても ] — qancha (~sam ham, ~sang ham, ~sa ham / ~may, ~mang, ~masin)', 4),
  ('lq_m-l25_5', 'lesson', 'm-l25', '「チャン ス」 ning ma''nosi qaysi?', '["qancha (~sam ham, ~sang ham, ~sa ham / ~may, ~mang, ~masin)","imkoniyat","( いち～ ) yuz million","agar (~sam, ~sang,~sa)"]'::jsonb, 1, 'チャン ス — imkoniyat', 5),
  ('lq_m-l26_1', 'lesson', 'm-l26', '「どこでも」 ning ma''nosi qaysi?', '["har narsa, hamma narsa","har kim, istalgan odam","bunday, mana bunaqa","har qayerda, istalgan joyda"]'::jsonb, 3, 'どこでも — har qayerda, istalgan joyda', 1),
  ('lq_m-l26_2', 'lesson', 'm-l26', '「見ます (みます)」 ning ma''nosi qaysi?', '["qidirmoq, izlamoq","ko''rmoq, tekshirmoq, qarab chiqmoq","vaqtida ulgurmoq","kechikmoq (vaqtga / darsga)"]'::jsonb, 1, '見ます (みます) — ko''rmoq, tekshirmoq, qarab chiqmoq', 2),
  ('lq_m-l26_3', 'lesson', 'm-l26', '「ボランティア」 ning ma''nosi qaysi?', '["ko''ngilli, volontyor","hamyon","Parlament binosi (Yaponiya)","chiqindi, axlat"]'::jsonb, 0, 'ボランティア — ko''ngilli, volontyor', 3),
  ('lq_m-l26_4', 'lesson', 'm-l26', '「だれでも」 ning ma''nosi qaysi?', '["bunday, mana bunaqa","har narsa, hamma narsa","yonadigan chiqindi","har kim, istalgan odam"]'::jsonb, 3, 'だれでも — har kim, istalgan odam', 4),
  ('lq_m-l26_5', 'lesson', 'm-l26', '「都合がいい (つごうがいい)」 ning ma''nosi qaysi?', '["ko''rmoq, tekshirmoq, qarab chiqmoq","noqulay (vaqt bo''lmaganda)","to''g''ridan-to''g''ri, bevosita","qulay (vaqt, holat)"]'::jsonb, 3, '都合がいい (つごうがいい) — qulay (vaqt, holat)', 5),
  ('lq_m-l27_1', 'lesson', 'm-l27', '「不思議な (ふしぎな)」 ning ma''nosi qaysi?', '["erkin, bemalol","boqmoq, hayvon parvarishlamoq","uchmoq","ajoyib, g''alati, sirli"]'::jsonb, 3, '不思議な (ふしぎな) — ajoyib, g''alati, sirli', 1),
  ('lq_m-l27_2', 'lesson', 'm-l27', '「本棚 (ほんだな)」 ning ma''nosi qaysi?', '["deyarli, aksariyat","tush, orzu","kitob javoni","dam olish kunidagi duradgorlik/uy ta''mirlash xobbisi"]'::jsonb, 2, '本棚 (ほんだな) — kitob javoni', 2),
  ('lq_m-l27_3', 'lesson', 'm-l27', '「心配 (しんぱいな)」 ning ma''nosi qaysi?', '["ovoz (tirik jonlarning ovozi)","uy hayvoni","to''lqin","xavotirli, tashvishli"]'::jsonb, 3, '心配 (しんぱいな) — xavotirli, tashvishli', 3),
  ('lq_m-l27_4', 'lesson', 'm-l27', '「夢 (ゆめ)」 ning ma''nosi qaysi?', '["erkin, bemalol","uchmoq","ajoyib, g''alati, sirli","tush, orzu"]'::jsonb, 3, '夢 (ゆめ) — tush, orzu', 4),
  ('lq_m-l27_5', 'lesson', 'm-l27', '「ペット」 ning ma''nosi qaysi?', '["mushakbozlik, feyerverk","to''lqin","uy hayvoni","ovoz (tirik jonlarning ovozi)"]'::jsonb, 2, 'ペット — uy hayvoni', 5),
  ('lq_m-l28_1', 'lesson', 'm-l28', '「偉い (えらい)」 ning ma''nosi qaysi?', '["buyuk, hurmatga sazovor, qoyilmaqom","mashhurlik, obro''","kuch, quvvat, qobiliyat","tajriba"]'::jsonb, 0, '偉い (えらい) — buyuk, hurmatga sazovor, qoyilmaqom', 1),
  ('lq_m-l28_2', 'lesson', 'm-l28', '「通います (かよいます)」 ning ma''nosi qaysi?', '["g''ayratli, ixlosli, berilib ishlaydigan","tartibli, tirishqoq, jiddiy","qayd qilib bormoq, yozib olmoq","qatnamoq (maktabga, universitetga, ishga)"]'::jsonb, 3, '通います (かよいます) — qatnamoq (maktabga, universitetga, ishga)', 2),
  ('lq_m-l28_3', 'lesson', 'm-l28', '「人気 (にんき)」 ning ma''nosi qaysi?', '["bundan tashqari, ustiga-ustak","mashhurlik, obro''","oylik maosh","narx, baho"]'::jsonb, 1, '人気 (にんき) — mashhurlik, obro''', 3),
  ('lq_m-l28_4', 'lesson', 'm-l28', '「値段 (ねだん)」 ning ma''nosi qaysi?', '["bundan tashqari, ustiga-ustak","narx, baho","oylik maosh","shu sababli, shuning uchun"]'::jsonb, 1, '値段 (ねだん) — narx, baho', 4),
  ('lq_m-l28_5', 'lesson', 'm-l28', '「選びます (えらびます)」 ning ma''nosi qaysi?', '["qatnamoq (maktabga, universitetga, ishga)","tartibli, tirishqoq, jiddiy","tanlamoq, saralamoq","qayd qilib bormoq, yozib olmoq"]'::jsonb, 2, '選びます (えらびます) — tanlamoq, saralamoq', 5),
  ('lq_m-l29_1', 'lesson', 'm-l29', '「折れます (おれます)」 ning ma''nosi qaysi?', '["yirtilmoq (qog''oz, kiyim)","kirlanmoq, bulg''anmoq","to''xtamoq (transport, harakat)","sinmoq, butoqlanmoq (daraxt, qalam)"]'::jsonb, 3, '折れます (おれます) — sinmoq, butoqlanmoq (daraxt, qalam)', 1),
  ('lq_m-l29_2', 'lesson', 'm-l29', '「掛かります (かかります)」 ning ma''nosi qaysi?', '["tarelka, likopcha","qulflanmoq (qulf)","hujjatlar","yig''ishtirmoq, tartibga keltirmoq"]'::jsonb, 1, '掛かります (かかります) — qulflanmoq (qulf)', 2),
  ('lq_m-l29_3', 'lesson', 'm-l29', '「ガラス (がらす)」 ning ma''nosi qaysi?', '["shisha","bekat navbatchisi/xodimi","politsiya maskani (koban)","xalta, paket"]'::jsonb, 0, 'ガラス (がらす) — shisha', 3),
  ('lq_m-l29_4', 'lesson', 'm-l29', '「袋 (ふくろ)」 ning ma''nosi qaysi?', '["xalta, paket","bekat navbatchisi/xodimi","ochilmoq (o''z-o''zidan, jidoshi)","politsiya maskani (koban)"]'::jsonb, 0, '袋 (ふくろ) — xalta, paket', 4),
  ('lq_m-l29_5', 'lesson', 'm-l29', '「落とします (おとします)」 ning ma''nosi qaysi?', '["qulflanmoq (qulf)","tushirib yubormoq, yo''qotmoq","yig''ishtirmoq, tartibga keltirmoq","tarelka, likopcha"]'::jsonb, 1, '落とします (おとします) — tushirib yubormoq, yo''qotmoq', 5),
  ('lq_m-l30_1', 'lesson', 'm-l30', '「はります」 ning ma''nosi qaysi?', '["osmoq, ilmoq (palto, rasm)","yopishtirmoq (devorga, daftarga)","terib qo''ymoq, qatorlashtirmoq","bezatmoq, bezak qo''ymoq"]'::jsonb, 1, 'はります — yopishtirmoq (devorga, daftarga)', 1),
  ('lq_m-l30_2', 'lesson', 'm-l30', '「植えます (うえます)」 ning ma''nosi qaysi?', '["ekmoq (ko''chat, daraxt)","o''z joyiga qaytarib qo''ymoq","joyiga solib qo''ymoq, saqlamoq","jamlamoq, tartibga keltirmoq"]'::jsonb, 0, '植えます (うえます) — ekmoq (ko''chat, daraxt)', 2),
  ('lq_m-l30_3', 'lesson', 'm-l30', '「戻します (もどします)」 ning ma''nosi qaysi?', '["jamlamoq, tartibga keltirmoq","joyiga solib qo''ymoq, saqlamoq","qaror qilmoq, belgilamoq","o''z joyiga qaytarib qo''ymoq"]'::jsonb, 3, '戻します (もどします) — o''z joyiga qaytarib qo''ymoq', 3),
  ('lq_m-l30_4', 'lesson', 'm-l30', '「非常袋 (ひじょうぶくろ)」 ning ma''nosi qaysi?', '["favqulodda vaziyat sumkasi","plakat, afisha","taqvim, kalendar","qo''g''irchoq"]'::jsonb, 0, '非常袋 (ひじょうぶくろ) — favqulodda vaziyat sumkasi', 4),
  ('lq_m-l30_5', 'lesson', 'm-l30', '「花瓶 (かびん)」 ning ma''nosi qaysi?', '["dahliz, kirish joyi","vaza, guldon","g''aladon, tortma","oyna, ko''zgu"]'::jsonb, 1, '花瓶 (かびん) — vaza, guldon', 5),
  ('lq_m-l31_1', 'lesson', 'm-l31', '「入学します (にゅうがくします)」 ning ma''nosi qaysi?', '["ketma-ket dam olish kunlari","qatnashmoq, hozir bo''lmoq","o''qishga kirmoq (universitetga)","o''qishni bitirmoq"]'::jsonb, 2, '入学します (にゅうがくします) — o''qishga kirmoq (universitetga)', 1),
  ('lq_m-l31_2', 'lesson', 'm-l31', '「予定 (よてい)」 ning ma''nosi qaysi?', '["kinoteatr","reja","bron, oldindan buyurtma","samolyot"]'::jsonb, 1, '予定 (よてい) — reja', 2),
  ('lq_m-l31_3', 'lesson', 'm-l31', '「映画館 (えいがかん)」 ning ma''nosi qaysi?', '["xorijiy davlat","kinoteatr","bron, oldindan buyurtma","samolyot"]'::jsonb, 1, '映画館 (えいがかん) — kinoteatr', 3),
  ('lq_m-l31_4', 'lesson', 'm-l31', '「卒業します (そつぎょうします)」 ning ma''nosi qaysi?', '["o''qishni bitirmoq","insho, esse","ketma-ket dam olish kunlari","qatnashmoq, hozir bo''lmoq"]'::jsonb, 0, '卒業します (そつぎょうします) — o''qishni bitirmoq', 4),
  ('lq_m-l31_5', 'lesson', 'm-l31', '「外国 (がいこく)」 ning ma''nosi qaysi?', '["boshlanmoq","davom ettirmoq","xorijiy davlat","topmoq, izlab topmoq"]'::jsonb, 2, '外国 (がいこく) — xorijiy davlat', 5),
  ('lq_m-l32_1', 'lesson', 'm-l32', '「やけど」 ning ma''nosi qaysi?', '["isitma, harorat","gripp virusi","kuyish (olovdan yoki issiqdan)","yo''tal"]'::jsonb, 2, 'やけど — kuyish (olovdan yoki issiqdan)', 1),
  ('lq_m-l32_2', 'lesson', 'm-l32', '「水道 (すいどう)」 ning ma''nosi qaysi?', '["muvaffaqiyatsizlikka uchramoq","jismoniy mashq qilmoq","muvaffaqiyat qozonmoq","suv quvuri, vodoprovod"]'::jsonb, 3, '水道 (すいどう) — suv quvuri, vodoprovod', 2),
  ('lq_m-l32_3', 'lesson', 'm-l32', '「合格します (ごうかくします)」 ning ma''nosi qaysi?', '["imtihondan muvaffaqiyatli o''tmoq","havo ochilmoq, musaffo bo''lmoq","tuzalmoq (kasallik)","havo bulut bo''lmoq"]'::jsonb, 0, '合格します (ごうかくします) — imtihondan muvaffaqiyatli o''tmoq', 3),
  ('lq_m-l32_4', 'lesson', 'm-l32', '「晴れます (はれます)」 ning ma''nosi qaysi?', '["havo bulut bo''lmoq","tuzalmoq (kasallik)","havo ochilmoq, musaffo bo''lmoq","muzlatmoq, sovitmoq"]'::jsonb, 2, '晴れます (はれます) — havo ochilmoq, musaffo bo''lmoq', 4),
  ('lq_m-l32_5', 'lesson', 'm-l32', '「喉 (のど)」 ning ma''nosi qaysi?', '["quyosh","tomoq","yulduz","gripp virusi"]'::jsonb, 1, '喉 (のど) — tomoq', 5),
  ('lq_m-l33_1', 'lesson', 'm-l33', '「急に (きゅうに)」 ning ma''nosi qaysi?', '["qaytmoq","to''satdan, birdaniga","joyida emas (vaqtincha)","xabar, omonat gap"]'::jsonb, 1, '急に (きゅうに) — to''satdan, birdaniga', 1),
  ('lq_m-l33_2', 'lesson', 'm-l33', '「伝言 (でんごん)」 ning ma''nosi qaysi?', '["qochmoq, juftakni rostlamoq","xabar, omonat gap","qaytmoq","joyida emas (vaqtincha)"]'::jsonb, 1, '伝言 (でんごん) — xabar, omonat gap', 2),
  ('lq_m-l33_3', 'lesson', 'm-l33', '「マーク (まーく)」 ning ma''nosi qaysi?', '["xabar, omonat gap","belgi, ramz","joyida emas (vaqtincha)","to''satdan, birdaniga"]'::jsonb, 1, 'マーク (まーく) — belgi, ramz', 3),
  ('lq_m-l33_4', 'lesson', 'm-l33', '「非常口 (ひじょうぐち)」 ning ma''nosi qaysi?', '["qonun","favqulodda chiqish eshigi","bepul, tekin","band (ishlatilmoqda)"]'::jsonb, 1, '非常口 (ひじょうぐち) — favqulodda chiqish eshigi', 4),
  ('lq_m-l33_5', 'lesson', 'm-l33', '「無料 (むりょう)」 ning ma''nosi qaysi?', '["bepul, tekin","qonun","belgi, ramz","band (ishlatilmoqda)"]'::jsonb, 0, '無料 (むりょう) — bepul, tekin', 5),
  ('lq_m-l34_1', 'lesson', 'm-l34', '「茶道 (さどう)」 ning ma''nosi qaysi?', '["ketma-ketlik, navbat","sous","choy marosimi san''ati","choy"]'::jsonb, 2, '茶道 (さどう) — choy marosimi san''ati', 1),
  ('lq_m-l34_2', 'lesson', 'm-l34', '「磨きます (みがきます)」 ning ma''nosi qaysi?', '["payqamoq, sezib qolmoq","tozalamoq, yuvmoq (tish, poyabzal)","yig''moq, qismlardan birlashtirmoq (mebel, mashina)","buklamoq, qayirmoq (qog''oz)"]'::jsonb, 1, '磨きます (みがきます) — tozalamoq, yuvmoq (tish, poyabzal)', 2),
  ('lq_m-l34_3', 'lesson', 'm-l34', '「組み立てます (くみたてます)」 ning ma''nosi qaysi?', '["yig''moq, qismlardan birlashtirmoq (mebel, mashina)","payqamoq, sezib qolmoq","buklamoq, qayirmoq (qog''oz)","savol bermoq"]'::jsonb, 0, '組み立てます (くみたてます) — yig''moq, qismlardan birlashtirmoq (mebel, mashina)', 3),
  ('lq_m-l34_4', 'lesson', 'm-l34', '「折ります (おります)」 ning ma''nosi qaysi?', '["buklamoq, qayirmoq (qog''oz)","payqamoq, sezib qolmoq","savol bermoq","yo''riqnoma, qo''llanma"]'::jsonb, 0, '折ります (おります) — buklamoq, qayirmoq (qog''oz)', 4),
  ('lq_m-l34_5', 'lesson', 'm-l34', '「図 (ず)」 ning ma''nosi qaysi?', '["chiziq","soya sousi","chizma, sxema","strelka, yo''nalish ko''rsatkichi"]'::jsonb, 2, '図 (ず) — chizma, sxema', 5),
  ('lq_m-l35_1', 'lesson', 'm-l35', '「楽 (らくな)」 ning ma''nosi qaysi?', '["oson, qulay, rohatbaxsh","batafsil, yaxshi biladigan","to''g''ri, haqqoniy","nodir, kamyob"]'::jsonb, 0, '楽 (らくな) — oson, qulay, rohatbaxsh', 1),
  ('lq_m-l35_2', 'lesson', 'm-l35', '「近所 (きんじょ)」 ning ma''nosi qaysi?', '["ma''lumotxona, axborot byurosi","imkoniyat, fursat","tom, bino usti","mahalla, qo''shnichilik, yaqin atrofi"]'::jsonb, 3, '近所 (きんじょ) — mahalla, qo''shnichilik, yaqin atrofi', 2),
  ('lq_m-l35_3', 'lesson', 'm-l35', '「機会 (きかい)」 ning ma''nosi qaysi?', '["chet el, chet davlatlar","imkoniyat, fursat","ma''lumotxona, axborot byurosi","tom, bino usti"]'::jsonb, 1, '機会 (きかい) — imkoniyat, fursat', 3),
  ('lq_m-l35_4', 'lesson', 'm-l35', '「案内所 (あんないじょ)」 ning ma''nosi qaysi?', '["chet el, chet davlatlar","tarix","ma''lumotxona, axborot byurosi","tom, bino usti"]'::jsonb, 2, '案内所 (あんないじょ) — ma''lumotxona, axborot byurosi', 4),
  ('lq_m-l35_5', 'lesson', 'm-l35', '「珍しい (めずらしい)」 ning ma''nosi qaysi?', '["orol","qarama-qarshi tomon, narigi taraf","batafsil, yaxshi biladigan","nodir, kamyob"]'::jsonb, 3, '珍しい (めずらしい) — nodir, kamyob', 5),
  ('lq_m-l36_1', 'lesson', 'm-l36', '「剣道 (けんどう)」 ning ma''nosi qaysi?', '["tirbandlik, tig''iz payt","kendo (yapon an''anaviy qilichbozlik sporti)","kuy, musiqa ohangi","koinot, fazo"]'::jsonb, 1, '剣道 (けんどう) — kendo (yapon an''anaviy qilichbozlik sporti)', 1),
  ('lq_m-l36_2', 'lesson', 'm-l36', '「ショック (しょっく)」 ning ma''nosi qaysi?', '["pul jamg''armoq, tejab yig''moq","ko''nikmoq, o''rganib qolmoq","shok, hayrat","o''tib ketmoq (vaqt)"]'::jsonb, 2, 'ショック (しょっく) — shok, hayrat', 2),
  ('lq_m-l36_3', 'lesson', 'm-l36', '「習慣 (しゅうかん)」 ning ma''nosi qaysi?', '["kuchni ortiqcha zo''riqtirmoq","odat, urf-odat","salomatlik","maxsus, alohida"]'::jsonb, 1, '習慣 (しゅうかん) — odat, urf-odat', 3),
  ('lq_m-l36_4', 'lesson', 'm-l36', '「健康 (けんこう)」 ning ma''nosi qaysi?', '["salomatlik","kuchni ortiqcha zo''riqtirmoq","suzish sporti","maxsus, alohida"]'::jsonb, 0, '健康 (けんこう) — salomatlik', 4),
  ('lq_m-l36_5', 'lesson', 'm-l36', '「練習します (れんしゅうします)」 ning ma''nosi qaysi?', '["odat, urf-odat","kuchni ortiqcha zo''riqtirmoq","salomatlik","mashq qilmoq"]'::jsonb, 3, '練習します (れんしゅうします) — mashq qilmoq', 5),
  ('lq_m-l37_1', 'lesson', 'm-l37', '「発明します (はつめいします)」 ning ma''nosi qaysi?', '["ixtiro qilmoq","politsiyachi","o''g''ri","kashf etmoq"]'::jsonb, 0, '発明します (はつめいします) — ixtiro qilmoq', 1),
  ('lq_m-l37_2', 'lesson', 'm-l37', '「発見します (はっけんします)」 ning ma''nosi qaysi?', '["kashf etmoq","me''mor, arxitektor","politsiyachi","o''g''ri"]'::jsonb, 0, '発見します (はっけんします) — kashf etmoq', 2),
  ('lq_m-l37_3', 'lesson', 'm-l37', '「壊します (こわします)」 ning ma''nosi qaysi?', '["kirlatmoq, bulg''amoq","o''tkazmoq, amalga oshirmoq (tadbirlar)","buzmoq, sindirmoq","eksport qilmoq"]'::jsonb, 2, '壊します (こわします) — buzmoq, sindirmoq', 3),
  ('lq_m-l37_4', 'lesson', 'm-l37', '「ほめます」 ning ma''nosi qaysi?', '["urishmoq, tanbeh bermoq","iltimos qilmoq, buyurmoq","taklif qilmoq (birga biror joyga borishga)","maqtamoq"]'::jsonb, 3, 'ほめます — maqtamoq', 4),
  ('lq_m-l37_5', 'lesson', 'm-l37', '「翻訳します (ほんやくします)」 ning ma''nosi qaysi?', '["yozma tarjima qilmoq","ixtiro qilmoq","kashf etmoq","o''g''ri"]'::jsonb, 0, '翻訳します (ほんやくします) — yozma tarjima qilmoq', 5),
  ('lq_m-l38_1', 'lesson', 'm-l38', '「参加します (さんかします)」 ning ma''nosi qaysi?', '["qatnashmoq, a''zo bo''lmoq","tashimoq, eltmoq","shifoxonaga yotmoq","tarbiyalamoq, o''stirmoq (bola, o''simlik)"]'::jsonb, 0, '参加します (さんかします) — qatnashmoq, a''zo bo''lmoq', 1),
  ('lq_m-l38_2', 'lesson', 'm-l38', '「星 (ほし)」 ning ma''nosi qaysi?', '["dengiz qirg''og''i, sohil","chaqaloq","yulduz","zavod, fabrika"]'::jsonb, 2, '星 (ほし) — yulduz', 2),
  ('lq_m-l38_3', 'lesson', 'm-l38', '「海岸 (かいがん)」 ning ma''nosi qaysi?', '["tarbiyalamoq, o''stirmoq (bola, o''simlik)","qatnashmoq, a''zo bo''lmoq","dengiz qirg''og''i, sohil","zavod, fabrika"]'::jsonb, 2, '海岸 (かいがん) — dengiz qirg''og''i, sohil', 3),
  ('lq_m-l38_4', 'lesson', 'm-l38', '「運びます (はこびます)」 ning ma''nosi qaysi?', '["elektr ta''minoti, manba","tashimoq, eltmoq","shifoxonaga yotmoq","shifoxonadan chiqmoq"]'::jsonb, 1, '運びます (はこびます) — tashimoq, eltmoq', 4),
  ('lq_m-l38_5', 'lesson', 'm-l38', '「似ています (にています)」 ning ma''nosi qaysi?', '["paxta mato","qo''lqop","g''amxo''rlik qilmoq, parvarishlamoq","o''xshamoq (tashqi ko''rinish yoki xarakter)"]'::jsonb, 3, '似ています (にています) — o''xshamoq (tashqi ko''rinish yoki xarakter)', 5),
  ('lq_m-l39_1', 'lesson', 'm-l39', '「汚れます (よごれます)」 ning ma''nosi qaysi?', '["navbatda turmoq","kirlanmoq","javob bermoq","o''tmoq, qatnamoq"]'::jsonb, 1, '汚れます (よごれます) — kirlanmoq', 1),
  ('lq_m-l39_2', 'lesson', 'm-l39', '「複雑 (ふくざつな)」 ning ma''nosi qaysi?', '["xalal beruvchi, noqulay","yong''in","to''fon, tayfun","murakkab, chigal"]'::jsonb, 3, '複雑 (ふくざつな) — murakkab, chigal', 2),
  ('lq_m-l39_3', 'lesson', 'm-l39', '「通ります (とおりません)」 ning ma''nosi qaysi?', '["qulamoq, yiqilmoq (bino, daraxt)","o''tmoq, qatnamoq","javob bermoq","o''tmoq, kesib o''tmoq"]'::jsonb, 1, '通ります (とおりません) — o''tmoq, qatnamoq', 3),
  ('lq_m-l39_4', 'lesson', 'm-l39', '「答えます (こたえます)」 ning ma''nosi qaysi?', '["qulamoq, yiqilmoq (bino, daraxt)","javob bermoq","vafot etmoq, o''lmoq","o''tmoq, kesib o''tmoq"]'::jsonb, 1, '答えます (こたえます) — javob bermoq', 4),
  ('lq_m-l39_5', 'lesson', 'm-l39', '「死にます (しにます)」 ning ma''nosi qaysi?', '["hayron qolmoq, cho''chib ketmoq","kechikmoq","ko''ngil tinchimoq, taskin topmoq","vafot etmoq, o''lmoq"]'::jsonb, 3, '死にます (しにます) — vafot etmoq, o''lmoq', 5),
  ('lq_m-l40_1', 'lesson', 'm-l40', '「表 (おもて)」 ning ma''nosi qaysi?', '["sanamoq, hisoblamoq","javob","yuz tomon, usti","orqa tomon, teskarisi"]'::jsonb, 2, '表 (おもて) — yuz tomon, usti', 1),
  ('lq_m-l40_2', 'lesson', 'm-l40', '「忘年会 (ぼうねんかい)」 ning ma''nosi qaysi?', '["yil yakuni bayrami (Yaponiya an''anasi)","...dan kam, past","chiziq, tirnalish, jarohat","...dan ko''p, ortiq"]'::jsonb, 0, '忘年会 (ぼうねんかい) — yil yakuni bayrami (Yaponiya an''anasi)', 2),
  ('lq_m-l40_3', 'lesson', 'm-l40', '「数えます (かぞえます)」 ning ma''nosi qaysi?', '["o''lchamoq (uzunlik, vaqt, harorat)","sanamoq, hisoblamoq","aniqlashtirmoq, tekshirib ko''rmoq","mos kelmoq, to''g''ri kelmoq (o''lcham)"]'::jsonb, 1, '数えます (かぞえます) — sanamoq, hisoblamoq', 3),
  ('lq_m-l40_4', 'lesson', 'm-l40', '「合います (あいます)」 ning ma''nosi qaysi?', '["yil yakuni bayrami (Yaponiya an''anasi)","yetib kelmoq","mos kelmoq, to''g''ri kelmoq (o''lcham)","yo''lga chiqmoq, jo''namoq"]'::jsonb, 2, '合います (あいます) — mos kelmoq, to''g''ri kelmoq (o''lcham)', 4),
  ('lq_m-l40_5', 'lesson', 'm-l40', '「〜以下 (〜いか)」 ning ma''nosi qaysi?', '["shim","ziyofatning ikkinchi davomi","musobaqa, syezdd","...dan kam, past"]'::jsonb, 3, '〜以下 (〜いか) — ...dan kam, past', 5),
  ('lq_m-l41_1', 'lesson', 'm-l41', '「発音 (はつおん)」 ning ma''nosi qaysi?', '["talaffuz","qabul qilib olmoq (もらいます ning hurmat shakli)","maymun","bermoq (kattalar menga berishi, くれます ning hurmat shakli)"]'::jsonb, 0, '発音 (はつおん) — talaffuz', 1),
  ('lq_m-l41_2', 'lesson', 'm-l41', '「下げます (さげます)」 ning ma''nosi qaysi?', '["tabrik sovg''asi","nodir, kam uchraydigan","tushirmoq, pasaytirmoq","mehribonlik qilmoq, yaxshilik ko''rsatmoq"]'::jsonb, 2, '下げます (さげます) — tushirmoq, pasaytirmoq', 2),
  ('lq_m-l41_3', 'lesson', 'm-l41', '「くださいます」 ning ma''nosi qaysi?', '["bermoq (kichiklarga, hayvonlarga, o''simliklarga)","tushirmoq, pasaytirmoq","ko''tarmoq, bermoq","bermoq (kattalar menga berishi, くれます ning hurmat shakli)"]'::jsonb, 3, 'くださいます — bermoq (kattalar menga berishi, くれます ning hurmat shakli)', 3),
  ('lq_m-l41_4', 'lesson', 'm-l41', '「やります」 ning ma''nosi qaysi?', '["ko''tarmoq, bermoq","mehribonlik qilmoq, yaxshilik ko''rsatmoq","tushirmoq, pasaytirmoq","bermoq (kichiklarga, hayvonlarga, o''simliklarga)"]'::jsonb, 3, 'やります — bermoq (kichiklarga, hayvonlarga, o''simliklarga)', 4),
  ('lq_m-l41_5', 'lesson', 'm-l41', '「上げます (あげます)」 ning ma''nosi qaysi?', '["mehribonlik qilmoq, yaxshilik ko''rsatmoq","tushirmoq, pasaytirmoq","ko''tarmoq, bermoq","nodir, kam uchraydigan"]'::jsonb, 2, '上げます (あげます) — ko''tarmoq, bermoq', 5),
  ('lq_m-l42_1', 'lesson', 'm-l42', '「法律 (ほうりつ)」 ning ma''nosi qaysi?', '["ilmiy maqola, dissertatsiya","maqsad, muddao","shisha ochgich","qonun, huquq"]'::jsonb, 3, '法律 (ほうりつ) — qonun, huquq', 1),
  ('lq_m-l42_2', 'lesson', 'm-l42', '「沸かします (わかします)」 ning ma''nosi qaysi?', '["navbatda turmoq, qatorlashmoq","hisoblamoq, sanamoq","qaynatmoq (suvni)","aralashtirmoq"]'::jsonb, 2, '沸かします (わかします) — qaynatmoq (suvni)', 2),
  ('lq_m-l42_3', 'lesson', 'm-l42', '「栓抜き (せんぬき)」 ning ma''nosi qaysi?', '["konserva ochgich","shisha ochgich","musiqachi","bola"]'::jsonb, 1, '栓抜き (せんぬき) — shisha ochgich', 3),
  ('lq_m-l42_4', 'lesson', 'm-l42', '「歴史 (れきし)」 ning ma''nosi qaysi?', '["madaniyat","o''ramoq, qadoqlamoq","tarix","urush"]'::jsonb, 2, '歴史 (れきし) — tarix', 4),
  ('lq_m-l42_5', 'lesson', 'm-l42', '「音楽家 (おんがくか)」 ning ma''nosi qaysi?', '["bola","ta''lim, tarbiya","musiqachi","tarix"]'::jsonb, 2, '音楽家 (おんがくか) — musiqachi', 5),
  ('lq_m-l43_1', 'lesson', 'm-l43', '「落ちます (おちます)」 ning ma''nosi qaysi?', '["isitish tizimi (pechka)","hozirning o''zidayoq, ayni damda","rohat, oson, qulay","qulamoq, tushib ketmoq"]'::jsonb, 3, '落ちます (おちます) — qulamoq, tushib ketmoq', 1),
  ('lq_m-l43_2', 'lesson', 'm-l43', '「適当な (てきとうな)」 ning ma''nosi qaysi?', '["alohida, o''zgacha","kamaymoq","ko''paymoq, oshmoq (son, miqdor)","munosib, mos keluvchi"]'::jsonb, 3, '適当な (てきとうな) — munosib, mos keluvchi', 2),
  ('lq_m-l43_3', 'lesson', 'm-l43', '「楽 (らくな)」 ning ma''nosi qaysi?', '["isitish tizimi (pechka)","konditsioner, sovitish tizimi","rohat, oson, qulay","hozirning o''zidayoq, ayni damda"]'::jsonb, 2, '楽 (らくな) — rohat, oson, qulay', 3),
  ('lq_m-l43_4', 'lesson', 'm-l43', '「切れます (きれます)」 ning ma''nosi qaysi?', '["rohat, oson, qulay","qulamoq, tushib ketmoq","uzilmoq (ip, tugma)","hozirning o''zidayoq, ayni damda"]'::jsonb, 2, '切れます (きれます) — uzilmoq (ip, tugma)', 4),
  ('lq_m-l43_5', 'lesson', 'm-l43', '「上がります (あがります)」 ning ma''nosi qaysi?', '["uzilmoq (ip, tugma)","qulamoq, tushib ketmoq","tushmoq, pasaymoq","ko''tarilmoq (narx, harorat)"]'::jsonb, 3, '上がります (あがります) — ko''tarilmoq (narx, harorat)', 5),
  ('lq_m-l44_1', 'lesson', 'm-l44', '「靴 (くつ)」 ning ma''nosi qaysi?', '["poyafzal","kulmoq, jilmaymoq","tozalamoq","yig''lamoq"]'::jsonb, 0, '靴 (くつ) — poyafzal', 1),
  ('lq_m-l44_2', 'lesson', 'm-l44', '「エアコン (えあこん)」 ning ma''nosi qaysi?', '["parol","harf, yozuv","konditsioner","dori-darmon"]'::jsonb, 2, 'エアコン (えあこん) — konditsioner', 2),
  ('lq_m-l44_3', 'lesson', 'm-l44', '「笑います (わらいます)」 ning ma''nosi qaysi?', '["kulmoq, jilmaymoq","moslamoq, sozlamoq (harorat, hajm)","qurimoq","sirpanmoq"]'::jsonb, 0, '笑います (わらいます) — kulmoq, jilmaymoq', 3),
  ('lq_m-l44_4', 'lesson', 'm-l44', '「涙 (なみだ)」 ning ma''nosi qaysi?', '["ko''z yoshi","kechirim so''rash","sabab, vaj","konditsioner"]'::jsonb, 0, '涙 (なみだ) — ko''z yoshi', 4),
  ('lq_m-l44_5', 'lesson', 'm-l44', '「パスワード (ぱすわーど)」 ning ma''nosi qaysi?', '["dori-darmon","parol","poyafzal","harf, yozuv"]'::jsonb, 1, 'パスワード (ぱすわーど) — parol', 5),
  ('lq_m-l45_1', 'lesson', 'm-l45', '「楽しみにしています (たのしみにしています)」 ning ma''nosi qaysi?', '["intiqlik bilan kutmoq","kassa cheki","aloqa ma''lumotlari (telefon, manzil)","pulni qaytarib bermoq"]'::jsonb, 0, '楽しみにしています (たのしみにしています) — intiqlik bilan kutmoq', 1),
  ('lq_m-l45_2', 'lesson', 'm-l45', '「返金します (へんきんします)」 ning ma''nosi qaysi?', '["sharoit, qulaylik","pulni qaytarib bermoq","aloqa ma''lumotlari (telefon, manzil)","kassa cheki"]'::jsonb, 1, '返金します (へんきんします) — pulni qaytarib bermoq', 2),
  ('lq_m-l45_3', 'lesson', 'm-l45', '「都合 (つごう)」 ning ma''nosi qaysi?', '["oylik maosh","va''da, kelishuv","bor kuch bilan, sidqidildan","sharoit, qulaylik"]'::jsonb, 3, '都合 (つごう) — sharoit, qulaylik', 3),
  ('lq_m-l45_4', 'lesson', 'm-l45', '「給料 (きゅうりょう)」 ning ma''nosi qaysi?', '["bekor qilmoq","kafolat qog''ozi (garantiya)","ishonmoq","oylik maosh"]'::jsonb, 3, '給料 (きゅうりょう) — oylik maosh', 4),
  ('lq_m-l45_5', 'lesson', 'm-l45', '「急に (きゅうに)」 ning ma''nosi qaysi?', '["pulni qaytarib bermoq","to''satdan, birdaniga","kassa cheki","intiqlik bilan kutmoq"]'::jsonb, 1, '急に (きゅうに) — to''satdan, birdaniga', 5),
  ('lq_m-l46_1', 'lesson', 'm-l46', '「原因 (げんいん)」 ning ma''nosi qaysi?', '["ayni hozirgina, hozirning o''zida","sabab, omil","hozir vaqtingiz bormi?","jo''namoq, yo''lga chiqmoq"]'::jsonb, 1, '原因 (げんいん) — sabab, omil', 1),
  ('lq_m-l46_2', 'lesson', 'm-l46', '「帰って来ます (かえってきます)」 ning ma''nosi qaysi?', '["qaytib kelmoq","uyda yo''qlik, bekorchilik","yetib bormoq (pochta, jo''natma)","yetkazib berish xizmati (kuryerlik)"]'::jsonb, 0, '帰って来ます (かえってきます) — qaytib kelmoq', 2),
  ('lq_m-l46_3', 'lesson', 'm-l46', '「届きます (とどきます)」 ning ma''nosi qaysi?', '["yetkazib berish xizmati (kuryerlik)","sabab, omil","yetib bormoq (pochta, jo''natma)","uyda yo''qlik, bekorchilik"]'::jsonb, 2, '届きます (とどきます) — yetib bormoq (pochta, jo''natma)', 3),
  ('lq_m-l46_4', 'lesson', 'm-l46', '「たった今 (たったいま)」 ning ma''nosi qaysi?', '["yetib kelmoq","jo''namoq, yo''lga chiqmoq","hozir vaqtingiz bormi?","ayni hozirgina, hozirning o''zida"]'::jsonb, 3, 'たった今 (たったいま) — ayni hozirgina, hozirning o''zida', 4),
  ('lq_m-l46_5', 'lesson', 'm-l46', '「今いいですか (いまいいですか)」 ning ma''nosi qaysi?', '["yuk, posilka","jo''namoq, yo''lga chiqmoq","yetib kelmoq","hozir vaqtingiz bormi?"]'::jsonb, 3, '今いいですか (いまいいですか) — hozir vaqtingiz bormi?', 5),
  ('lq_m-l47_1', 'lesson', 'm-l47', '「味 (あじ)」 ning ma''nosi qaysi?', '["hid","unashtirilmoq, unashtiruv","solishtirmoq, qiyoslamoq","ta''m, maza"]'::jsonb, 3, '味 (あじ) — ta''m, maza', 1),
  ('lq_m-l47_2', 'lesson', 'm-l47', '「パトカー (ぱとかー)」 ning ma''nosi qaysi?', '["yig''ilmoq, to''planmoq","politsiya mashinasi","tez yordam mashinasi","mish-mish"]'::jsonb, 1, 'パトカー (ぱとかー) — politsiya mashinasi', 2),
  ('lq_m-l47_3', 'lesson', 'm-l47', '「事故 (じこ)」 ning ma''nosi qaysi?', '["tez yordam mashinasi","mish-mish","politsiya mashinasi","baxtsiz hodisa, avariya"]'::jsonb, 3, '事故 (じこ) — baxtsiz hodisa, avariya', 3),
  ('lq_m-l47_4', 'lesson', 'm-l47', '「比べます (くらべます)」 ning ma''nosi qaysi?', '["yangiliklar","baxtsiz hodisa, avariya","ob-havo ma''lumoti","solishtirmoq, qiyoslamoq"]'::jsonb, 3, '比べます (くらべます) — solishtirmoq, qiyoslamoq', 4),
  ('lq_m-l47_5', 'lesson', 'm-l47', '「天気予報 (てんきよほう)」 ning ma''nosi qaysi?', '["yangiliklar","politsiya mashinasi","baxtsiz hodisa, avariya","ob-havo ma''lumoti"]'::jsonb, 3, '天気予報 (てんきよほう) — ob-havo ma''lumoti', 5),
  ('lq_m-l48_1', 'lesson', 'm-l48', '「塾 (じゅく)」 ning ma''nosi qaysi?', '["tayyorlov kursi, qo''shimcha dars markazi","o''quvchi (maktab o''quvchisi)","fikr, mulohaza","jadval, reja"]'::jsonb, 0, '塾 (じゅく) — tayyorlov kursi, qo''shimcha dars markazi', 1),
  ('lq_m-l48_2', 'lesson', 'm-l48', '「手伝い (てつだい)」 ning ma''nosi qaysi?', '["nusxa ko''chirish","bozor-o''char, xarid","yordam","ishdan/darsdan vaqtidan oldin ketmoq"]'::jsonb, 2, '手伝い (てつだい) — yordam', 2),
  ('lq_m-l48_3', 'lesson', 'm-l48', '「届けます (とどけます)」 ning ma''nosi qaysi?', '["qattiqqo''l, talabchan","yetkazib bermoq","parvarishlamoq, qaramoq","yoqimsiz, istalmagan"]'::jsonb, 1, '届けます (とどけます) — yetkazib bermoq', 3),
  ('lq_m-l48_4', 'lesson', 'm-l48', '「意見 (いけん)」 ning ma''nosi qaysi?', '["yordam","fikr, mulohaza","taqdimot qilmoq, e''lon qilmoq","yig''ishtirish, tartibga solish"]'::jsonb, 1, '意見 (いけん) — fikr, mulohaza', 4),
  ('lq_m-l48_5', 'lesson', 'm-l48', '「生徒 (せいと)」 ning ma''nosi qaysi?', '["o''quvchi (maktab o''quvchisi)","fikr, mulohaza","yig''ishtirish, tartibga solish","taqdimot qilmoq, e''lon qilmoq"]'::jsonb, 0, '生徒 (せいと) — o''quvchi (maktab o''quvchisi)', 5)
ON CONFLICT (id) DO UPDATE SET quiz_type = EXCLUDED.quiz_type, lesson_id = EXCLUDED.lesson_id, question = EXCLUDED.question, options = EXCLUDED.options, correct_index = EXCLUDED.correct_index, explanation = EXCLUDED.explanation, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_quiz_questions (id, quiz_type, lesson_id, question, options, correct_index, explanation, sort_order) VALUES
  ('lq_m-l49_1', 'lesson', 'm-l49', '「ご存じです (ごぞんじです)」 ning ma''nosi qaysi?', '["manzil (hurmat bilan)","ism (hurmat bilan)","biladilar (知っています ning hurmat shakli)","kompaniya prezidenti"]'::jsonb, 2, 'ご存じです (ごぞんじです) — biladilar (知っています ning hurmat shakli)', 1),
  ('lq_m-l49_2', 'lesson', 'm-l49', '「奥様 (おくさま)」 ning ma''nosi qaysi?', '["boshqaning oilasi","ishlamoq, xizmat qilmoq (kompaniyada)","boshqaning rafiqasi (juda hurmatli)","vaqt o''tkazmoq"]'::jsonb, 2, '奥様 (おくさま) — boshqaning rafiqasi (juda hurmatli)', 2),
  ('lq_m-l49_3', 'lesson', 'm-l49', '「お名前 (おなまえ)」 ning ma''nosi qaysi?', '["manzil (hurmat bilan)","kompaniya prezidenti","departament boshlig''i","ism (hurmat bilan)"]'::jsonb, 3, 'お名前 (おなまえ) — ism (hurmat bilan)', 3),
  ('lq_m-l49_4', 'lesson', 'm-l49', '「おっしゃいます」 ning ma''nosi qaysi?', '["deydilar, aytadilar (言います ning hurmat shakli)","qiladilar (します ning hurmat shakli)","ko''radilar (見ます ning hurmat shakli)","biladilar (知っています ning hurmat shakli)"]'::jsonb, 0, 'おっしゃいます — deydilar, aytadilar (言います ning hurmat shakli)', 4),
  ('lq_m-l49_5', 'lesson', 'm-l49', '「ご住所 (ごじゅうしょ)」 ning ma''nosi qaysi?', '["kompaniya prezidenti","boshqaning rafiqasi (juda hurmatli)","departament boshlig''i","manzil (hurmat bilan)"]'::jsonb, 3, 'ご住所 (ごじゅうしょ) — manzil (hurmat bilan)', 5),
  ('lq_m-l50_1', 'lesson', 'm-l50', '「私 (わたくし)」 ning ma''nosi qaysi?', '["men (わたし ning rasmiy va kamtar shakli)","biz (kamtarlik shakli)","ko''rmoq, mutolaa qilmoq (kamtarlik)","kuzatib bormoq, tanishtirmoq (kamtarlik)"]'::jsonb, 0, '私 (わたくし) — men (わたし ning rasmiy va kamtar shakli)', 1),
  ('lq_m-l50_2', 'lesson', 'm-l50', '「お目に掛かります (おめにかかります)」 ning ma''nosi qaysi?', '["biz (kamtarlik shakli)","ko''rmoq, mutolaa qilmoq (kamtarlik)","men (わたし ning rasmiy va kamtar shakli)","uchrashaman (会います ning kamtarlik shakli)"]'::jsonb, 3, 'お目に掛かります (おめにかかります) — uchrashaman (会います ning kamtarlik shakli)', 2),
  ('lq_m-l50_3', 'lesson', 'm-l50', '「私ども (わたくしども)」 ning ma''nosi qaysi?', '["kuzatib bormoq, tanishtirmoq (kamtarlik)","biz (kamtarlik shakli)","yetkazmoq (kamtarlik)","ko''rmoq, mutolaa qilmoq (kamtarlik)"]'::jsonb, 1, '私ども (わたくしども) — biz (kamtarlik shakli)', 3),
  ('lq_m-l50_4', 'lesson', 'm-l50', '「拝見します」 ning ma''nosi qaysi?', '["ko''rmoq, mutolaa qilmoq (kamtarlik)","boraman / kelaman (行きます・来ます ning kamtarlik shakli)","yetkazmoq (kamtarlik)","kuzatib bormoq, tanishtirmoq (kamtarlik)"]'::jsonb, 0, '拝見します — ko''rmoq, mutolaa qilmoq (kamtarlik)', 4),
  ('lq_m-l50_5', 'lesson', 'm-l50', '「いたします」 ning ma''nosi qaysi?', '["ko''raman, qarab chiqaman (見ます ning kamtarlik shakli)","bilaman / o''ylayman (知っています・思います ning kamtarlik shakli)","so''rayman / tashrif buyuraman (聞きます・行きます ning kamtarlik shakli)","qilaman, bajaraman (します ning kamtarlik shakli)"]'::jsonb, 3, 'いたします — qilaman, bajaraman (します ning kamtarlik shakli)', 5)
ON CONFLICT (id) DO UPDATE SET quiz_type = EXCLUDED.quiz_type, lesson_id = EXCLUDED.lesson_id, question = EXCLUDED.question, options = EXCLUDED.options, correct_index = EXCLUDED.correct_index, explanation = EXCLUDED.explanation, sort_order = EXCLUDED.sort_order;
-- mobile_quiz_questions: 250 rows
-- scenarios
-- @@CHUNK@@
INSERT INTO public.mobile_scenarios (id, language, title_ja, title_uz, emoji, difficulty, category, description_uz, opening_line_ja, opening_line_uz, context_prompt, key_phrases, sort_order) VALUES
  ('jikoshoukai', 'ja', '自己紹介 (Jikoshoukai)', 'O''zini tanishtirish', '🙋', 'N5', 'social', 'Ismingiz, kelib chiqishingiz, kasbingiz va qiziqishlaringiz haqida yaponcha so''zlashish mashqi.', 'はじめまして！わたしは たなかです。いっしょに じこしょうかいを しましょう！おなまえは なんですか？', 'Ismingiz, kelib chiqishingiz, kasbingiz va qiziqishlaringiz haqida yaponcha so''zlashish mashqi.', 'あなたは親切で温かい日本語教師「田中先生」です。学習者（JLPT N5レベル）と「自己紹介（じこしょうかい）」の練習を行ってください。
厳格な言語制限（JLPT N5）:
1. 必ずN5レベルの文法（です・ます調）と基本語彙のみを使用し、1〜2文の短い返答にしてください。
2. 尊敬語・謙譲語（教えていただけますか、いらっしゃる等）は一切使わないでください。
3. 一度に質問は1つだけ、「お名前は何ですか」「どこから来ましたか」「好きな食べ物は何ですか」のように平易に聞いてください。
必須フレーズ: はじめまして, 〜です, 〜から来ました, 好きです, よろしくお願いします', '["はじめまして","から来ました","よろしくお願いします","好きです","です"]'::jsonb, 1),
  ('kaimono', 'ja', '買い物 (Kaimono)', 'Do''konda xarid va to''lov', '🛍️', 'N4', 'daily', 'Kombini yoki kiyim do''konida mahsulot qidirish, narx va o''lcham so''rash hamda to''lov qilish.', 'いらっしゃいませ！何かお探しでしょうか？お気軽にお声がけくださいね。', 'Kombini yoki kiyim do''konida mahsulot qidirish, narx va o''lcham so''rash hamda to''lov qilish.', 'あなたは東京の洋服・雑貨店の親切な店員です。客（JLPT N4レベル）の買い物対応を行ってください。
思考の流れ・会話の目標:
1. 客が何を探しているか（服、お土産、サイズ、色）を伺ってください。
2. 試着室（試着）のご案内や、価格（いくら）、割引（セール）について説明してください。
3. お会計時に現金かクレジットカード決済かを確認し、袋（レジ袋）の有無を訪ねます。
必須フレーズ: いらっしゃいませ, いくらですか, サイズはありますか, カードで払えますか, これにします', '["いらっしゃいませ","いくらですか","サイズはありますか","カードで払えますか","これにします"]'::jsonb, 2),
  ('restaurant', 'ja', 'レストラン (Resutoran)', 'Restoranda buyurtma', '🍣', 'N4', 'daily', 'Ramen yoki sushi restoranda joylashish, menyudan taom va ichimlik buyurtma berish.', 'いらっしゃいませ！何人ですか？こちらの席へどうぞ。ご注文が決まったら呼んでくださいね！', 'Ramen yoki sushi restoranda joylashish, menyudan taom va ichimlik buyurtma berish.', 'あなたは日本の和食レストランの元気なホールスタッフです。客（JLPT N4レベル）の注文対応を行ってください。
思考の流れ・会話の目標:
1. 人数を確認し、席へ案内します。
2. おすすめメニュー（ラーメン、寿司、天ぷら等）やアレルギー、飲み物の注文を聞きます。
3. 料理を運んだ後、食後にお会計（お勘定）の対応を行ってください。
必須フレーズ: おすすめは何ですか, これをお願いします, 水をください, 美味しいです, お会計をお願いします', '["おすすめは何ですか","これをお願いします","お会計をお願いします","水をください","美味しい"]'::jsonb, 3),
  ('hotel', 'ja', 'ホテル (Hoteru)', 'Mehmonxonada Check-in', '🏨', 'N4', 'travel', 'Check-in qilish, pasport ko''rsatish, Wi-Fi paroli va nonushta vaqtini so''rash.', 'いらっしゃいませ。グランドホテル東京へようこそ。チェックインですか？お名前をお願いします。', 'Check-in qilish, pasport ko''rsatish, Wi-Fi paroli va nonushta vaqtini so''rash.', 'あなたは高級ホテルのレセプション（フロント）係です。宿泊客（JLPT N4レベル）のチェックイン手続きを行ってください。
思考の流れ・会話の目標:
1. ご予約のお名前を確認し、パスポートの提示をお願いしてください。
2. お部屋の鍵（ルームキー）を渡し、Wi-Fiパスワードや朝食の時間・会場をご案内します。
3. 荷物の預かりやチェックアウト時間について質問があれば丁寧に応答してください。
必須フレーズ: チェックインしたいです, 予約しました, Wi-Fiのパスワード, 朝食は何時ですか, 鍵', '["チェックインしたいです","予約しました","Wi-Fiのパスワード","朝食は何時ですか","ルームキー"]'::jsonb, 4),
  ('michiannai', 'ja', '道案内 (Michiannai)', 'Yo''l va manzil so''rash', '🗺️', 'N3', 'travel', 'Bekat, muzey yoki mehmonxonaga borish yo''lini so''rash va ko''rsatmalar berish mashqi.', 'すみません、道に迷われましたか？どちらへ行かれたいのでしょうか？', 'Bekat, muzey yoki mehmonxonaga borish yo''lini so''rash va ko''rsatmalar berish mashqi.', 'あなたは街中で道を聞かれた親切な日本人の通行人です。旅行者（JLPT N3レベル）に目的地への行き方を教えてください。
思考の流れ・会話の目標:
1. 相手の行きたい場所（駅、観光地、コンビニ）を確認します。
2. 「まっすぐ行って、角を右に曲がる」「信号を渡る」「徒歩で約5分」などの具体的な道順を教えます。
3. バスや電車の利用が必要な場合は乗り場を教えてあげてください。
必須フレーズ: 〜はどこですか, まっすぐ行ってください, 右に曲がって, 徒歩で〜分, 助かりました', '["〜はどこですか","まっすぐ行ってください","右に曲がって","徒歩で〜分","助かりました"]'::jsonb, 5),
  ('byouin', 'ja', '病院 (Byouin)', 'Kasalxonada shifokor ko''rigi', '🏥', 'N3', 'daily', 'Shifokorga kasallik alomatlarini tushuntirish, harorat va dori retsepti suhbati.', 'こんにちは。本日はどうされましたか？どこが痛みますか、症状を詳しく教えてください。', 'Shifokorga kasallik alomatlarini tushuntirish, harorat va dori retsepti suhbati.', 'あなたは日本の内科クリニックの担当医師です。患者（JLPT N3レベル）の診察を行ってください。
思考の流れ・会話の目標:
1. どのような症状（熱、頭痛、腹痛、咳）があるか、いつから始まったかを尋ねます。
2. アレルギーの有無や服薬歴を確認し、処方する薬（飲み薬、1日3回など）の飲み方を説明します。
3. 数日安静にするよう伝え、最後にお大事にと言って診察を終えます。
必須フレーズ: 頭が痛いです, 熱があります, いつからですか, 薬を処方します, お大事に', '["頭が痛いです","熱があります","昨日から","薬を出します","お大事に"]'::jsonb, 6),
  ('mensetsu_it', 'ja', '就職面接 (IT Job Interview)', 'Yapon IT kompaniyasiga ishga kirish suhbati', '💼', 'N2', 'business', 'IT va muhandislik yo''nalishida o''z tajribangiz, loyihalaringiz va motivatsiyangizni PREP usulida yaponcha tushuntirish.', '本日は弊社ITエンジニア採用面接にご参加いただきありがとうございます。まず簡単に自己PRを含めた自己紹介をお願いできますでしょうか？', 'IT va muhandislik yo''nalishida o''z tajribangiz, loyihalaringiz va motivatsiyangizni PREP usulida yaponcha tushuntirish.', 'あなたは日本のIT企業の人事部面接官です。応募者（JLPT N2レベル）の中途・新卒採用面接を行ってください。
思考の流れ・会話の目標:
1. 自己紹介とこれまでの開発実績・使用テクノロジー（React, Node.js, Python等）を質問します。
2. 志望動機（なぜ日本で働きたいか、なぜ弊社なのか）を深掘りしてください。
3. 困難を乗り越えたエピソードやキャリアプランを質問し、丁寧なビジネス敬語で評価を行います。
必須フレーズ: 志望動機と申しますと, 開発経験がございます, 貴社に貢献したい, キャリアプラン, よろしくお願いいたします', '["志望動機","開発経験","貴社に貢献","キャリアプラン","自己PR"]'::jsonb, 7),
  ('business_koushou', 'ja', 'ビジネス交渉 (Business Negotiation)', 'Biznes muzokara va shartnoma shartlari', '🏛️', 'N1', 'business', 'Yaponiyaning yirik kompaniyalari bilan loyiha narxi, muddat va shartnoma shartlarini mukammal Keigo va Sonkeigo bilan kelishish.', 'いつも大変お世話になっております。本日は新規プロジェクトの契約条件につきましてご協議させていただきたく存じます。', 'Yaponiyaning yirik kompaniyalari bilan loyiha narxi, muddat va shartnoma shartlarini mukammal Keigo va Sonkeigo bilan kelishish.', 'あなたは日本の大手ITベンダーの事業部長です。パートナー企業の担当者（JLPT N1レベル）と高度なビジネス交渉を行ってください。
思考の流れ・会話の目標:
1. プロジェクトの納入期限（納期）、予算（コスト）、要件定義について双方の妥協点を交渉します。
2. 完璧な最高レベルのビジネス敬語（尊敬語・謙譲語）を駆使し、論理的な提案を求めます。
3. リスク管理やアフターサポート体制について合意を取り、今後の良好な関係を確認して締めくくります。
必須フレーズ: 協議させていただきたく存じます, 納期と予算の件, ご期待に沿えるよう, 検討させていただきます, 引き続きよろしくお願い申し上げます', '["協議させていただきたく存じます","納期と予算の件","ご期待に沿えるよう","検討させていただきます","引き続きよろしくお願い申し上げます"]'::jsonb, 8),
  ('tokyo_train_ticket', 'ja', '駅の窓口で切符を買う (Train Ticket & Station)', 'Tokioda metro va poyezd chiptasi xarid qilish', '🚇', 'N4', 'travel', 'JR bekatida chipta xarid qilish, yo''nalish, transfer (norikae) va platforma raqamini so''rash.', 'いらっしゃいませ。JRきっぷうりばです。どちらの駅まで行きますか？', 'JR bekatida chipta xarid qilish, yo''nalish, transfer (norikae) va platforma raqamini so''rash.', 'あなたは東京駅のみどりの窓口の駅員です。外国人旅行者（JLPT N4レベル）のきっぷ購入や電車の乗り換え案内を行ってください。
思考の流れ・会話の目標:
1. 目的地（新宿、渋谷、秋葉原、京都など）と片道・往復、何名様かを確認します。
2. 特急券や新幹線指定席が必要か、Suica/PASMOへのチャージが必要か尋ねます。
3. 出発する番線（例：「4番線から山手線内回りにお乗りください」）や乗り換え案内を丁寧に説明してください。
必須フレーズ: 〜までの切符をください, 何番線ですか, 乗り換えはありますか, 片道ですか往復ですか, お気をつけて', '["〜までの切符","何番線ですか","乗り換え","片道","ICカード"]'::jsonb, 9),
  ('konbini_shopping', 'ja', 'コンビニで買い物 (Convenience Store)', 'Kombinida (7-Eleven/FamilyMart) xarid qilish', '🏪', 'N5', 'daily', 'Bento isitish, xalta (fukuro), kvitansiya, qoshiq-vilka so''rash va to''lov turlari.', 'いらっしゃいませ！お弁当とお茶ですね。お弁当を温めますか？袋は要りますか？', 'Bento isitish, xalta (fukuro), kvitansiya, qoshiq-vilka so''rash va to''lov turlari.', 'あなたは都内のコンビニ（7-Eleven / FamilyMart）の親切な店員です。学習者（JLPT N5レベル）のレジ会計対応を行ってください。
厳格な言語制限（JLPT N5）:
1. 必ずN5レベルの簡単な文法（です・ます調）と日常語彙を使用してください。
2. 難解な敬語（「ご利用になりますか」「少々お待ちください」等）は使わず、「温めますか」「袋は要りますか」「お箸は要りますか」「〜円です」のように簡単明瞭に話してください。
3. 1回の発話は1〜2文に抑えてください。
必須フレーズ: 温めてください, 袋はいりません, お箸をください, カードで払います, ありがとうございます', '["温めてください","袋はいりません","お箸をください","カードで払います","大丈夫です"]'::jsonb, 10),
  ('fudousan_apartment_rental', 'ja', '不動産屋でお部屋探し (Apartment Rental)', 'Yaponiyada kvartira ijarasi bo''yicha rieltor suhbati', '🏢', 'N3', 'daily', 'Yashash hududi, oylik ijara (yachin), shikikin/reikin, bekatgacha masofa va xona ko''rish (naiken).', 'いらっしゃいませ、東京不動産へようこそ！お部屋探しですね。ご希望のエリアや家賃のご予算はお決まりでしょうか？', 'Yashash hududi, oylik ijara (yachin), shikikin/reikin, bekatgacha masofa va xona ko''rish (naiken).', 'あなたは外国人留学生・就職者を歓迎する日本の不動産仲介業者のエージェントです。お部屋探しに来た顧客（JLPT N3レベル）の希望条件をヒアリングしてください。
思考の流れ・会話の目標:
1. 希望の間取り（1K, 1DK, 1LDK）、最寄り駅からの徒歩分数、家賃の上限（例：6〜8万円）を確認します。
2. 敷金（しききん）、礼金（れいきん）、保証人の要否など初期費用について分かりやすく説明します。
3. 気に入った物件の内見（ないけん：部屋の見学）の日程を調整してください。
必須フレーズ: 家賃は〜円以下, 駅から徒歩〜分, 敷金と礼金, 内見したいです, 静かな場所', '["家賃は〜円以下","駅から徒歩〜分","敷金・礼金","内見したいです","日当たり"]'::jsonb, 11),
  ('baito_job_interview', 'ja', 'アルバイト・就職面接 (Baito / Job Interview)', 'Yaponiyada ishga kirish suhbati (Arubaito / Mensetsu)', '💼', 'N2', 'business', 'O''zini tanishtirish (jiko PR), ish jadvali (shift), motivatsiya va yaponcha keigo bilan javob berish.', '本日は面接にお越しいただきありがとうございます。どうぞお座りください。まず簡単に自己紹介をお願いできますでしょうか？', 'O''zini tanishtirish (jiko PR), ish jadvali (shift), motivatsiya va yaponcha keigo bilan javob berish.', 'あなたは日本のカフェまたは飲食チェーン店の店長（面接官）です。アルバイト応募者（JLPT N2レベル）の採用面接を行ってください。
思考の流れ・会話の目標:
1. 自己紹介と志望動機（なぜこの店で働きたいのか）を質問します。
2. 日本語の会話力、週に何日・何時間入れるか（シフトの希望）、通勤時間を確認します。
3. 接客で大切にしたいことや過去のアルバイト経験を聞き、礼儀正しい敬語の使い方を評価します。
4. 最後に質問があるか尋ね、選考結果の連絡日を伝えて面接を終えます。
必須フレーズ: 〜と申します, 志望動機といたしましては, 週に〜日勤務可能です, 精一杯頑張ります, よろしくお願いいたします', '["〜と申します","志望動機","シフト希望","精一杯頑張ります","よろしくお願いいたします"]'::jsonb, 12),
  ('gakko_no_ichinichi', 'ja', '学校生活 (学校での一日)', 'Maktab va kundalik o''quv hayoti', '🏫', 'N5', 'academic', 'Dars jadvali, fanlar, tanaffus va o''qituvchiga oddiy savollar berish orqali maktabdagi suhbatni mashq qilish.', 'おはようございます。今日の一時間目は何の授業ですか？一緒に教室へ行きませんか？', 'Dars jadvali, fanlar, tanaffus va o''qituvchiga oddiy savollar berish orqali maktabdagi suhbatni mashq qilish.', 'あなたは親切な日本の高校生です。JLPT N5レベルの学習者と学校生活について会話してください。
会話の目標:
1. 今日の授業、好きな科目、時間割について簡単に話してください。
2. 「宿題はありますか」「何時に終わりますか」などの初級質問を使ってください。
3. 短くて分かりやすいです・ます調を中心にし、自然な相づちを入れてください。
必須フレーズ: おはようございます, 何の授業ですか, 好きです, 宿題があります, 一緒に行きませんか', '["おはようございます","何の授業ですか","好きです","宿題があります","一緒に行きませんか"]'::jsonb, 13),
  ('kazoku_shoukai', 'ja', '家族について話す', 'Oila haqida suhbat', '👨‍👩‍👧‍👦', 'N5', 'social', 'Oila a''zolari, ularning kasbi, yoshi va birga o''tkaziladigan vaqt haqida oddiy yaponcha suhbat.', 'こんにちは！家族は何人ですか？ご家族のことを教えてください。', 'Oila a''zolari, ularning kasbi, yoshi va birga o''tkaziladigan vaqt haqida oddiy yaponcha suhbat.', 'あなたは気さくな日本人の友達です。JLPT N5レベルの学習者と家族について話してください。
会話の目標:
1. 家族の人数、兄弟姉妹、仕事、住んでいる場所を順番に尋ねます。
2. 「私の父は〜です」「妹は〜歳です」のような初級文を引き出してください。
3. 学習者の答えに共感し、簡単な追加質問をしてください。
必須フレーズ: 家族は〜人です, 父, 母, 兄, 妹, 一緒に住んでいます', '["家族は〜人です","父","母","兄","妹"]'::jsonb, 14),
  ('cafe_de_talk', 'ja', 'カフェで注文する', 'Kafeda buyurtma berish', '☕', 'N5', 'daily', 'Kafeda ichimlik va shirinlik tanlash, hajm va narxni so''rash hamda buyurtmani tasdiqlash.', 'いらっしゃいませ！何にしますか？ご注文をどうぞ！', 'Kafeda ichimlik va shirinlik tanlash, hajm va narxni so''rash hamda buyurtmani tasdiqlash.', 'あなたは日本のカフェ店員です。JLPT N5レベルの学習者に分かりやすく簡単な日本語で注文対応してください。
厳格な言語制限（JLPT N5）:
1. 必ずN5の丁寧語（です・ます調）を使用し、1〜2文の短い文で対応してください。
2. 「お決まりでしょうか」などの難解な敬語は使わず、「何を飲みますか」「ホットですか、アイスですか」「サイズはどうしますか」「店内で飲みますか」と平易に質問してください。
3. 最後に合計金額を「〜円です」とシンプルに伝えてください。
必須フレーズ: これをください, アイスコーヒー, 大きいサイズ, 店内で, いくらですか', '["これをください","アイスコーヒー","大きいサイズ","店内で","いくらですか"]'::jsonb, 15),
  ('densha_ticket', 'ja', '電車の切符を買う', 'Poyezd chiptasi va platformani so''rash', '🚉', 'N4', 'travel', 'Stansiyada chipta olish, platforma va transferlarni so''rash, kerakli poyezdni topish mashqi.', '東京駅まで行きたいですか？どの電車に乗ればいいか、一緒に確認しましょう。', 'Stansiyada chipta olish, platforma va transferlarni so''rash, kerakli poyezdni topish mashqi.', 'あなたは駅の案内係です。JLPT N4レベルの旅行者に電車の利用方法を案内してください。
会話の目標:
1. 目的地、時間、乗り換えの有無を確認します。
2. 切符、ICカード、ホーム番号、発車時刻を説明します。
3. 必要なら「次の駅で乗り換えてください」のように順序立てて案内します。
必須フレーズ: どの電車ですか, 何番線ですか, 乗り換えます, 次の駅, 切符をください', '["どの電車ですか","何番線ですか","乗り換えます","次の駅","切符をください"]'::jsonb, 16),
  ('shuumatsu_yotei', 'ja', '週末の予定を相談する', 'Dam olish kunlari rejasini kelishish', '📅', 'N4', 'social', 'Do''st bilan qayerga borish, qachon uchrashish va nima qilishni yaponcha kelishib olish.', '今週末、何か予定がありますか？天気がよかったら、一緒に出かけませんか？', 'Do''st bilan qayerga borish, qachon uchrashish va nima qilishni yaponcha kelishib olish.', 'あなたは日本人の友達です。JLPT N4レベルの学習者と週末の予定を相談してください。
会話の目標:
1. いつ・どこで・何をするかを相談します。
2. 「〜たら」「〜たい」「〜ましょう」などのN4程度の文法を自然に使ってください。
3. 相手の希望を聞き、最後に具体的な予定を決めてください。
必須フレーズ: 何をしたいですか, 〜たら, 何時に会いましょうか, どうですか, 楽しみです', '["何をしたいですか","〜たら","何時に会いましょうか","どうですか","楽しみです"]'::jsonb, 17),
  ('tenki_kaiwa', 'ja', '天気について話す', 'Ob-havo haqida suhbat', '🌤️', 'N4', 'daily', 'Bugungi va ertangi ob-havo, kiyim tanlash va rejalarni ob-havoga qarab o''zgartirish haqida gaplashish.', '今日はいい天気ですね。明日の天気予報を見ましたか？', 'Bugungi va ertangi ob-havo, kiyim tanlash va rejalarni ob-havoga qarab o''zgartirish haqida gaplashish.', 'あなたは日本人の同僚です。JLPT N4レベルの学習者と天気について会話してください。
会話の目標:
1. 晴れ、雨、暑い、寒いなどの天気表現を使ってください。
2. 天気に合わせた服装や予定について話してください。
3. 「〜そうです」「〜かもしれません」などを簡単な範囲で使ってください。
必須フレーズ: いい天気ですね, 雨が降りそうです, 暑いです, 傘を持って, 天気予報', '["いい天気ですね","雨が降りそうです","暑いです","傘を持って","天気予報"]'::jsonb, 18),
  ('tomodachi_soudan', 'ja', '友達の相談にのる', 'Do''stga maslahat berish', '💬', 'N3', 'social', 'Do''stning o''qish, ish yoki vaqtni boshqarish muammosini tinglash va muloyim maslahat berish.', '最近ちょっと困っていることがあるんですが、話を聞いてもらえませんか？', 'Do''stning o''qish, ish yoki vaqtni boshqarish muammosini tinglash va muloyim maslahat berish.', 'あなたは親しい友人です。JLPT N3レベルの学習者の悩み相談に自然に応じてください。
会話の目標:
1. 相手の悩みを詳しく聞き、気持ちを受け止めてください。
2. 「〜たほうがいい」「〜かもしれない」「もし〜なら」などで提案してください。
3. 相手を否定せず、理由や選択肢を説明しながら会話を続けてください。
必須フレーズ: それは大変ですね, どうしたらいいと思いますか, 〜たほうがいい, もし〜なら, 無理しないでください', '["それは大変ですね","どうしたらいいと思いますか","〜たほうがいい","もし〜なら","無理しないでください"]'::jsonb, 19),
  ('restaurant_kinenbi', 'ja', 'レストランで特別なリクエストをする', 'Restoranda maxsus iltimos va bron', '🍰', 'N3', 'daily', 'Tug''ilgan kun, allergiya, maxsus stol va desert bo''yicha iltimoslarni muloyim yaponcha bildirish.', '本日のご予約について、何か特別なご希望はございますか？', 'Tug''ilgan kun, allergiya, maxsus stol va desert bo''yicha iltimoslarni muloyim yaponcha bildirish.', 'あなたはレストランの予約担当スタッフです。JLPT N3レベルの客の特別な要望に対応してください。
会話の目標:
1. 記念日、アレルギー、座席、ケーキの準備について確認します。
2. 「〜てもらえますか」「〜していただけますか」などの依頼表現を練習させます。
3. 店側でできること・できないことを丁寧に説明してください。
必須フレーズ: 予約したいです, できますか, 〜していただけますか, アレルギーがあります, 記念日です', '["予約したいです","〜していただけますか","アレルギーがあります","記念日です","できますか"]'::jsonb, 20),
  ('ryokou_toukou', 'ja', '旅行の計画を立てる', 'Yaponiyada sayohat rejasini tuzish', '🗾', 'N3', 'travel', 'Shahar tanlash, transport, mehmonxona, byudjet va kunlik marshrutni yaponcha muhokama qilish.', '京都と大阪のどちらに行くか、旅行の計画を一緒に立てませんか？', 'Shahar tanlash, transport, mehmonxona, byudjet va kunlik marshrutni yaponcha muhokama qilish.', 'あなたは旅行会社のプランナーです。JLPT N3レベルの旅行者と日本旅行の計画を立ててください。
会話の目標:
1. 旅行日程、予算、交通手段、宿泊先の希望を確認します。
2. 観光地を比較し、理由をつけておすすめしてください。
3. 「〜ので」「〜なら」「〜ほうがいい」などを使って条件や比較を話してください。
必須フレーズ: 予算は〜です, 〜のほうが便利です, 〜ので, おすすめします, 予約しておきましょう', '["予算は〜です","〜のほうが便利です","おすすめします","予約しておきましょう","〜ので"]'::jsonb, 21),
  ('gakko_soudan', 'ja', '先生に相談する', 'O''qituvchi bilan o''qish masalasini muhokama qilish', '📚', 'N3', 'academic', 'Topshiriq muddati, o''qishdagi qiyinchilik va o''quv rejasini o''qituvchi bilan muhokama qilish.', 'どうしましたか？最近、勉強について何か困っていることがありますか？', 'Topshiriq muddati, o''qishdagi qiyinchilik va o''quv rejasini o''qituvchi bilan muhokama qilish.', 'あなたは日本語学校の先生です。JLPT N3レベルの学生から学習相談を受けてください。
会話の目標:
1. 学生の困っている点、宿題、試験、学習時間について質問します。
2. 具体的な勉強方法やスケジュールを提案してください。
3. 目上の人への丁寧な表現を練習させます。
必須フレーズ: ご相談があります, 〜について困っています, 〜したほうがいいでしょうか, アドバイスをお願いします, ありがとうございます', '["ご相談があります","〜について困っています","〜したほうがいいでしょうか","アドバイスをお願いします","ありがとうございます"]'::jsonb, 22),
  ('shokuba_teammeeting', 'ja', '職場のチームミーティング', 'Ishxonadagi jamoa yig''ilishi', '👥', 'N2', 'business', 'Vazifa holati, deadline, muammolar va keyingi qadamlarni professional yaponcha muhokama qilish.', 'それでは定例ミーティングを始めます。まず、先週からの進捗状況を共有していただけますか？', 'Vazifa holati, deadline, muammolar va keyingi qadamlarni professional yaponcha muhokama qilish.', 'あなたは日本企業のチームリーダーです。JLPT N2レベルの社員と定例ミーティングを行ってください。
会話の目標:
1. タスクの進捗、課題、納期、担当者について具体的に確認します。
2. 意見の相違があれば理由を聞き、代替案を求めてください。
3. ビジネスでよく使う丁寧な表現（〜と考えております、〜はいかがでしょうか）を練習させます。
必須フレーズ: 進捗状況, 課題があります, 〜と考えております, いかがでしょうか, 次のアクション', '["進捗状況","課題があります","〜と考えております","いかがでしょうか","次のアクション"]'::jsonb, 23),
  ('shokuba_email_followup', 'ja', '取引先へのフォローアップ', 'Hamkor kompaniyaga professional follow-up suhbati', '📧', 'N2', 'business', 'Uchrashuvdan keyin vazifalar, hujjatlar va keyingi muddatlarni hamkor bilan muloyim tarzda aniqlashtirish.', '先日の打ち合わせにつきまして、いくつか確認させていただきたい点がございます。', 'Uchrashuvdan keyin vazifalar, hujjatlar va keyingi muddatlarni hamkor bilan muloyim tarzda aniqlashtirish.', 'あなたは日本企業の営業担当者です。JLPT N2レベルの学習者と取引先へのフォローアップ会話を行ってください。
会話の目標:
1. 前回の打ち合わせ内容、資料、担当者、期限について確認します。
2. 相手への配慮を示しながら、未完了の項目について自然に催促してください。
3. 「恐れ入りますが」「念のため」「ご確認いただけますでしょうか」などを使ってください。
必須フレーズ: 恐れ入りますが, 念のため, ご確認いただけますでしょうか, 前回のお打ち合わせ, 今後の進め方', '["恐れ入りますが","念のため","ご確認いただけますでしょうか","前回のお打ち合わせ","今後の進め方"]'::jsonb, 24),
  ('presentation_kekka', 'ja', 'プレゼンテーションで結果を説明する', 'Taqdimotda natija va grafiklarni tushuntirish', '📊', 'N2', 'academic', 'Tadqiqot yoki loyiha natijalarini grafik, taqqoslash va xulosalar bilan professional yaponcha taqdim etish.', 'それでは、こちらのグラフをご覧ください。今回の調査結果について説明していただけますか？', 'Tadqiqot yoki loyiha natijalarini grafik, taqqoslash va xulosalar bilan professional yaponcha taqdim etish.', 'あなたは大学や企業のプレゼンテーション審査員です。JLPT N2レベルの学習者に結果説明を求めてください。
会話の目標:
1. データの増減、比較、主要な傾向について説明させます。
2. 「一方で」「その結果」「〜ことが分かります」などの論理的なつなぎ表現を使わせます。
3. 質疑応答で理由や今後の課題を説明させます。
必須フレーズ: ご覧ください, 増加しています, 一方で, その結果, 〜ことが分かります', '["ご覧ください","増加しています","一方で","その結果","〜ことが分かります"]'::jsonb, 25),
  ('shakai_mondai_iken', 'ja', '社会問題について意見を述べる', 'Ijtimoiy masala bo''yicha fikr bildirish', '📰', 'N2', 'academic', 'Masofaviy ish, yoshlar bandligi yoki texnologiya kabi mavzularda sabab, misol va qarshi fikr bilan gapirish.', '最近、テクノロジーと働き方の変化についてニュースを見ました。あなたはどう考えますか？', 'Masofaviy ish, yoshlar bandligi yoki texnologiya kabi mavzularda sabab, misol va qarshi fikr bilan gapirish.', 'あなたは日本語のディスカッション講師です。JLPT N2レベルの学習者と社会問題について意見交換してください。
会話の目標:
1. 賛成・反対だけでなく、理由、具体例、反対意見を引き出します。
2. 「〜という点で」「確かに〜が」「その一方で」などを使わせます。
3. 感情的にならず、根拠を示して意見を述べる練習にしてください。
必須フレーズ: 私の考えでは, 〜という点で, 確かに〜が, その一方で, 具体例として', '["私の考えでは","〜という点で","確かに〜が","その一方で","具体例として"]'::jsonb, 26),
  ('mendan_keigo', 'ja', '最終面接で自己PRをする', 'Yakuniy ish intervyusida professional self-PR', '🎯', 'N1', 'business', 'Kompaniyaning qadriyatlari, shaxsiy kuchli tomonlar va karera maqsadlarini yuqori darajadagi keigo bilan tushuntirish.', '本日は最終面接にお越しいただき、誠にありがとうございます。それでは、これまでのご経験と今後のキャリアビジョンについてお聞かせいただけますでしょうか。', 'Kompaniyaning qadriyatlari, shaxsiy kuchli tomonlar va karera maqsadlarini yuqori darajadagi keigo bilan tushuntirish.', 'あなたは日本の大手企業の最終面接官です。JLPT N1レベルの応募者に高度な面接を行ってください。
会話の目標:
1. 経歴、実績、志望理由、リーダーシップ、失敗から学んだことを深掘りします。
2. 応募者には論理的かつ簡潔に、敬語・謙譲語を適切に使って回答させます。
3. 企業との価値観の一致、長期的なキャリアビジョン、入社後の貢献まで質問してください。
必須フレーズ: 大変恐縮ですが, これまでの経験を踏まえますと, 貴社の理念に共感しております, 貢献してまいりたいと存じます, ご縁をいただけましたら', '["大変恐縮ですが","これまでの経験を踏まえますと","貴社の理念に共感しております","貢献してまいりたいと存じます","ご縁をいただけましたら"]'::jsonb, 27),
  ('debate_shakai', 'ja', 'ディベート：働き方改革', 'Debat: mehnat uslubini isloh qilish', '⚖️', 'N1', 'academic', 'Remote work, 4-day week yoki ofis madaniyati haqida dalillar va qarshi dalillar bilan yuqori darajadagi debat.', '本日のテーマは「週休三日制を日本で広く導入すべきか」です。まず、あなたの立場を明確にしてください。', 'Remote work, 4-day week yoki ofis madaniyati haqida dalillar va qarshi dalillar bilan yuqori darajadagi debat.', 'あなたは大学院レベルの日本語ディベート講師です。JLPT N1レベルの学習者と高度な討論を行ってください。
会話の目標:
1. 賛成・反対双方の立場を検討し、根拠・反例・譲歩を求めます。
2. 「〜とは限らない」「〜を踏まえると」「〜という見方もできます」など高度な表現を使わせます。
3. 最後に論点を整理し、説得力のある結論を述べさせます。
必須フレーズ: 〜とは限りません, 〜を踏まえると, 一概には言えません, 反対意見として, 結論として', '["〜とは限りません","〜を踏まえると","一概には言えません","反対意見として","結論として"]'::jsonb, 28),
  ('shokuba_shazai_trouble', 'ja', 'システム障害対応と社内報告 (Trouble & Apology)', 'Tizimdagi nosozlik va kechirim so''rash (Incident Report)', '🚨', 'N2', 'business', 'Serverdagi favqulodda nosozlik sababi, ko''rilgan tezkor choralar va zararni kamaytirish bo''yicha rahbarga professional Keigo bilan hisobot berish.', '緊急で報告が入りました。本番サーバーで障害が発生しているとのことですが、現在の状況と原因を説明していただけますか？', 'Serverdagi favqulodda nosozlik sababi, ko''rilgan tezkor choralar va zararni kamaytirish bo''yicha rahbarga professional Keigo bilan hisobot berish.', 'あなたはIT開発部門の技術統括部長です。JLPT N2レベルのエンジニアからサーバー障害の緊急インシデント報告とお詫びを受けてください。
会話の目標:
1. 障害の発生時刻、影響範囲、現在実施している復旧作業（一次対応）を確認します。
2. 再発防止策と恒久対応（根本原因の分析）について説明を求めます。
3. 誠意あるビジネス謝罪（「多大なるご迷惑をおかけし、深くお詫び申し上げます」等）と報告の迅速さを評価してください。
必須フレーズ: 深くお詫び申し上げます, 一次対応といたしまして, 原因を究明中, 再発防止策, 復旧の目処', '["深くお詫び申し上げます","一次対応","原因を究明中","再発防止策","復旧の目処"]'::jsonb, 29),
  ('shokuba_shinki_teian', 'ja', '新規AIプロジェクトの企画提案 (Project Pitch)', 'Yangi AI loyiha taklifini bildirish va himoya qilish', '💡', 'N2', 'business', 'Kompaniyaga yangi AI texnologiyasini joriy qilish taklifi, ROI kutilmalari va xarajatlarni bo''lim boshlig''iga taqdim etish.', '新しいAI導入プロジェクトの企画書を拝見しました。非常に興味深いですが、具体的な費用対効果と導入スケジュールについて詳しく教えていただけますか？', 'Kompaniyaga yangi AI texnologiyasini joriy qilish taklifi, ROI kutilmalari va xarajatlarni bo''lim boshlig''iga taqdim etish.', 'あなたは企画開発部門のゼネラルマネージャーです。JLPT N2レベルの社員から新規AI導入の企画提案プレゼンを受けてください。
会話の目標:
1. プロジェクトの背景・課題感（業務の自動化、工数削減など）を質問します。
2. 想定されるROI（費用対効果）、開発工数、リスク対策を論理的に説明させます。
3. 「〜をご提案申し上げます」「〜が見込めます」などの説得力あるビジネス表現を促します。
必須フレーズ: ご提案申し上げます, 費用対効果, 工数の削減が見込めます, スケジュール案, ぜひご検討のほど', '["ご提案申し上げます","費用対効果","工数削減","スケジュール案","ご検討のほど"]'::jsonb, 30),
  ('torihikisaki_denwa_keigo', 'ja', '取引先との電話対応とアポ取り (Phone Keigo)', 'Hamkor kompaniyaga qo''ng''iroq va uchrashuv belgilash', '📞', 'N2', 'business', 'Yapon biznesida muhim bo''lgan telefon etiketini qo''llagan holda bosh direktor bilan uchrashuv (apoint) belgilash.', 'お電話ありがとうございます。ABC商事の佐藤でございます。いつも大変お世話になっております。本日はどのようなご用件でしょうか？', 'Yapon biznesida muhim bo''lgan telefon etiketini qo''llagan holda bosh direktor bilan uchrashuv (apoint) belgilash.', 'あなたは大手取引先「ABC商事」の受付・担当者です。JLPT N2レベルの学習者から商談アポイントメントの電話を受けます。
会話の目標:
1. 挨拶、名乗り、用件（新製品の紹介、打ち合わせの日程調整）を電話対応の定型表現で進めます。
2. 候補日時（来週火曜日の午後など）を提示させ、日程のすり合わせを行います。
3. 最後に確認復唱をして、丁寧な電話の締めくくり（失礼いたします）を行わせてください。
必須フレーズ: いつもお世話になっております, 〜の件でお電話いたしました, ご都合はいかがでしょうか, 復唱いたします, 失礼いたします', '["いつもお世話になっております","お電話いたしました","ご都合はいかがでしょうか","復唱いたします","失礼いたします"]'::jsonb, 31),
  ('executive_board_briefing', 'ja', '取締役会での事業戦略報告 (Board Briefing)', 'Direktorlar kengashida strategik hisobot va savol-javob', '🏛️', 'N1', 'business', 'Yillik moliyaviy o''sish, bozor ulushi va keyingi chorakdagi xalqaro ekspansiya strategiyasini boshqaruv kengashi a''zolariga professional taqdim etish.', 'これより第3四半期の戦略報告に移ります。海外事業統括役員として、東南アジア市場への進出戦略およびリスクヘッジについてご報告いただけますでしょうか。', 'Yillik moliyaviy o''sish, bozor ulushi va keyingi chorakdagi xalqaro ekspansiya strategiyasini boshqaruv kengashi a''zolariga professional taqdim etish.', 'あなたは上場企業の代表取締役会長（CEO/Chair）です。JLPT N1レベルの海外事業責任者から重要経営戦略の報告を受け、鋭い質問を投げかけてください。
会話の目標:
1. 市場シェアの推移、競合優位性、地政学的リスクへの対応策（リスクヘッジ）を論理的に説明させます。
2. 最高峰の謙譲語・尊敬語（「〜と推察申し上げます」「ご高覧ください」「〜に尽力してまいる所存です」）を評価します。
3. 株主価値の最大化とコンプライアンス遵守について合意を形成してください。
必須フレーズ: ご高覧いただけますと幸甚に存じます, リスクヘッジの観点から, 尽力してまいる所存でございます, 確固たる優位性, 経営資源の最適配分', '["ご高覧いただけますと幸甚に存じます","リスクヘッジ","尽力してまいる所存","確固たる優位性","経営資源の最適配分"]'::jsonb, 32),
  ('m_and_a_due_diligence', 'ja', '企業提携・M&A交渉とデューデリジェンス (M&A Negotiation)', 'Korporativ birlashuv, M&A muzokara va risk audit', '🤝', 'N1', 'business', 'Ikki yirik korporatsiya o''rtasida birlashuv shartlari, intellektual mulk huquqlari va moliyaviy audit natijalarini murosali kelishish.', '本日のデューデリジェンス最終協議では、知的財産権の承継および企業文化の統合プロセスにおける懸念点を解消したく存じます。貴社のご見解を伺えますでしょうか。', 'Ikki yirik korporatsiya o''rtasida birlashuv shartlari, intellektual mulk huquqlari va moliyaviy audit natijalarini murosali kelishish.', 'あなたはグローバル投資銀行・戦略ファンドのシニアパートナーです。JLPT N1レベルの企業代表とM&A（合併・買収）の最終合意に向けた高度な交渉を行ってください。
会話の目標:
1. 企業価値評価（バリュエーション）、知的財産権、キーパーソン（人材）のリテンションについて協議します。
2. 双方の利益が最大化されるような建設的な妥協点（シナジー効果）を提案させます。
3. 非常に洗練されたビジネス語彙と格調高い敬語表現を徹底して使わせてください。
4. 今後の調印式およびPMI（統合プロセス）のロードマップを確認して合意に至ります。
必須フレーズ: シナジー効果を最大化すべく, 遺憾なく発揮できるよう, 懸念事項を払拭し, 双方の合意形成, 前向きに善処させていただきます', '["シナジー効果","懸念事項を払拭","双方の合意形成","善処させていただきます","PMIプロセス"]'::jsonb, 33),
  ('cross_cultural_conflict_resolution', 'ja', '多国籍チームのリーダーシップと対立解消 (Conflict Resolution)', 'Xalqaro jamoada nizolarni hal qilish va konsensus', '🌐', 'N1', 'business', 'Turli millat va madaniyatdagi jamoa a''zolari o''rtasidagi kelishmovchilikni diplomatiya va yaponcha madaniy muloyimlik bilan bartaraf etish.', '東京本社と海外拠点の開発チーム間で、納期と仕様変更をめぐって深刻な意見の対立が生じています。プロジェクトマネージャーとして、どのようにこの対立を調停されますか？', 'Turli millat va madaniyatdagi jamoa a''zolari o''rtasidagi kelishmovchilikni diplomatiya va yaponcha madaniy muloyimlik bilan bartaraf etish.', 'あなたはグローバル本社の執行役員兼人事統括です。JLPT N1レベルのシニアプロジェクトマネージャーに多国籍チームの対立解消と調停案を求めてください。
会話の目標:
1. 各国の文化的背景やコミュニケーションスタイルの違いに配慮した調停案（落としどころ）を提示させます。
2. 感情的な対立を排除し、ファクトベースでのスケジュール再設計とKPIの合意を導きます。
3. 相手の立場を立てつつ毅然と合意を促すハイレベルなビジネス日本語（クッション言葉、配慮表現）を実践させます。
必須フレーズ: お言葉を返すようではございますが, 双方の立場に鑑み, 落としどころを模索し, 誠心誠意尽くす所存, 大局的な見地から', '["お言葉を返すようではございますが","双方の立場に鑑み","落としどころ","誠心誠意尽くす所存","大局的な見地から"]'::jsonb, 34),
  ('minna_l1_hajimemashite', 'ja', '初めまして (Juda xursandman)', '1-dars: Tanishuv va O''zini tanishtirish', '🌸', 'N5', 'social', 'Minna no Nihongo 1-dars: Yangi qo''shni yoki hamkasb bilan yaponcha odob qoidalariga rioya qilgan holda tanishish mashqi.', 'おはようございます！私はIMCの社員のサトウです。初めまして、どうぞよろしくお願いします。お名前は何ですか？', 'Minna no Nihongo 1-dars: Yangi qo''shni yoki hamkasb bilan yaponcha odob qoidalariga rioya qilgan holda tanishish mashqi.', 'あなたは「みんなの日本語 初級1」第1課の会話パートナー「サトウさん」です。
学習者（JLPT N5レベル）と丁寧な自己紹介のロールプレイを行ってください。
【進行ステップ】
ステップ1 (名前・挨拶): 生徒が名前を言ったら（「〜です」）、「〜さんですね！初めまして、よろしくお願いします」と返し、「どちらから来ましたか？」と国や出身地を聞いてください。※名前を二度聞くことは絶対に禁止です。
ステップ2 (出身地・職業): 生徒が出身地を答えたら、「〜からですね！学生さんですか？それとも会社員ですか？」と職業を尋ねてください。
ステップ3 (締めくくり): 生徒の職業の答えを受け止め、「日本語がお上手ですね！これからどうぞよろしくお願いします」と温かく締めくくってください。
【厳守事項】
- 過去の質問を繰り返さず、必ず会話を前進させてください。', '["初めまして","から来ました","どうぞよろしく","会社員です","学生です"]'::jsonb, 35),
  ('minna_l2_honno_kimochi', 'ja', 'ほんの気持ちです (Chin ko''ngildan)', '2-dars: Yangi uyga ko''chish va Sovg''a ulashish', '🎁', 'N5', 'daily', 'Minna no Nihongo 2-dars: Qo''shniga ko''chib kelganda sovg''a taqdim etish va ''Bundan buyon yordamingizni ayamaysiz degan umiddaman'' iboralarini qo''llash.', 'はい、どなたですか？……あ、お隣の方ですね！こんにちは。', 'Minna no Nihongo 2-dars: Qo''shniga ko''chib kelganda sovg''a taqdim etish va ''Bundan buyon yordamingizni ayamaysiz degan umiddaman'' iboralarini qo''llash.', 'あなたはアパートの隣人「山田さん」です。「みんなの日本語」第2課の会話「ほんの気持ちです」を実践してください。
【進行ステップ】
ステップ1 (訪問・挨拶): 生徒が「これからお世話になります」「山田さんですか」などと声をかけたら、「こちらこそよろしくお願いします。どうぞお入りください」と応対してください。
ステップ2 (贈り物の授受): 生徒が「これはほんの気持ちです」「コーヒーです」などと贈り物を渡したら、「どうもありがとうございます！いただきます」と感謝を伝えてください。
ステップ3 (締めくくり): 「これからよろしくお願いいたしますね」と気持ちよく挨拶を終えてください。
【厳守事項】
- 質問を繰り返さず、生徒の返答に沿って自然に会話を進めてください。', '["これからお世話になります","こちらこそ","ほんの気持ちです","どうぞ","どうもありがとうございます"]'::jsonb, 36),
  ('minna_l3_kore_wo_kudasai', 'ja', 'これをください (Buni bering)', '3-dars: Univermagda xarid va Narx so''rash', '🏬', 'N5', 'travel', 'Minna no Nihongo 3-dars: Bo''limlar, mahsulotlar qayerdaligini bilish va narxini so''rab sotib olish.', 'いらっしゃいませ！デパートの売り場へようこそ。何かお探しですか？', 'Minna no Nihongo 3-dars: Bo''limlar, mahsulotlar qayerdaligini bilish va narxini so''rab sotib olish.', 'あなたはデパートの店員です。「みんなの日本語」第3課の会話「これをください」を演じてください。
【進行ステップ】
ステップ1 (案内): 生徒が「〜売り場はどこですか」または「〜を探しています」と言ったら、「〜売り場は2階（または地下1階）にございます」と案内してください。
ステップ2 (見せる・価格): 生徒が「この〜を見せてください」または「いくらですか」と尋ねたら、「どうぞ、こちらです。3,500円になります」と答えてください。
ステップ3 (購入・完了): 生徒が「じゃ、これをください」と言ったら、「ありがとうございます！3,500円お預かりいたします」とお会計を完了してください。
【厳守事項】
- 質問を繰り返さず、買い物ステップをスムーズに進行してください。', '["すみません","売り場はどこですか","見せてください","いくらですか","これをください"]'::jsonb, 37),
  ('minna_l4_nanji_kara', 'ja', '何時から何時までですか (Ish vaqti)', '4-dars: Kutubxona yoki Bank ish vaqtini so''rash', '🏦', 'N5', 'daily', 'Minna no Nihongo 4-dars: Soatlar, haftaning kunlari va ''qachondan qachongacha'' (〜から〜まで) iboralari bilan vaqtni aniqlashtirish.', 'はい、あすか図書館です。こんにちは！何をお調べですか？', 'Minna no Nihongo 4-dars: Soatlar, haftaning kunlari va ''qachondan qachongacha'' (〜から〜まで) iboralari bilan vaqtni aniqlashtirish.', 'あなたは図書館（または美術館）の受付案内係です。「みんなの日本語」第4課の電話での問い合わせを再現します。
【進行ステップ】
ステップ1 (開館時間の案内): 生徒が「何時から何時までですか」と尋ねたら、「午前9時から午後5時までです」と答えてください。
ステップ2 (休館日の案内): 生徒が「休みは何曜日ですか」と尋ねたら、「月曜日がお休みです」と伝えてください。
ステップ3 (確認・締めくくり): 生徒が「わかりました、ありがとうございます」と言ったら、「はい、ご来館をお待ちしております！」と明るく電話を切る挨拶をしてください。
【厳守事項】
- 質問を繰り返さず、電話での用件を1つずつ解決してください。', '["何時から何時まで","休みは何曜日","午前","午後","わかりました"]'::jsonb, 38),
  ('minna_l5_koushien', 'ja', '甲子園へ行きますか (Poyezdda borish)', '5-dars: Bekatda poyezd yo''nalishini so''rash', '🚄', 'N5', 'travel', 'Minna no Nihongo 5-dars: Temir yo''l bekatida qaysi poyezd kerakli manzilga borishini va qaysi platformadan jo''nashini so''rash.', 'はい、大阪駅の駅員です。どちらまで行かれますか？乗り場はこちらですよ。', 'Minna no Nihongo 5-dars: Temir yo''l bekatida qaysi poyezd kerakli manzilga borishini va qaysi platformadan jo''nashini so''rash.', 'あなたは大阪駅の親切な駅員さんです。「みんなの日本語」第5課「甲子園へ行きますか」の会話を演じます。
【進行ステップ】
ステップ1 (目的地の確認):
- 生徒が「甲子園（または別の駅）へ行きます」と言ったら、「甲子園ですね！5番線の普通電車ですよ」のようにホーム番号と電車の種類を案内してください。
- ※もし生徒が「いいえ、行きません」「甲子園へ行きません」「〜へ行きます」などと答えた場合は、絶対に「甲子園へ行きますか？」と繰り返さず、「そうですか！ではどちらの駅へ向かわれますか？」と柔軟に目的地を聞いてください。
ステップ2 (移動方法・切符の確認):
- 乗り場を案内した後、「切符はもう買いましたか？」または「何分くらいで着くか教えましょうか？」など次の質問をしてください。
ステップ3 (見送り・完了):
- 「次の電車はあと3分で来ますよ。お気をつけて行ってらっしゃい！」と気持ちよく送り出してください。
【厳守事項】
- 一度聞いた質問を二度と繰り返さないこと。生徒の答えを受け止め、必ず次のステップへ進めてください。', '["甲子園へ行きますか","何番線ですか","電車で行きます","どうもありがとう","切符"]'::jsonb, 39),
  ('minna_l6_isshoni_ikimasenka', 'ja', 'いっしょに行きませんか (Birga bormaymizmi)', '6-dars: Birga tushlik qilish yoki kinoga borishga taklif', '🍱', 'N5', 'social', 'Minna no Nihongo 6-dars: Hamkasb yoki do''stni biror joyga taklif qilish (''〜ませんか'') va kelishish (''〜ましょう'').', 'あ、もうお昼ですね！今日はお弁当ですか？それともどこかへ食べに行きますか？', 'Minna no Nihongo 6-dars: Hamkasb yoki do''stni biror joyga taklif qilish (''〜ませんか'') va kelishish (''〜ましょう'').', 'あなたは会社の同僚「佐藤さん」です。「みんなの日本語」第6課の誘い表現「いっしょに行きませんか」を練習します。
【進行ステップ】
ステップ1 (誘い・日程): 生徒が「いっしょに〜を食べませんか」「お昼を食べに行きませんか」と誘ってきたら、「いいですね！ぜひ行きましょう」と快諾し、「何を食べますか？（ラーメン？カレー？）」と尋ねてください。
ステップ2 (時間と場所の決定): 食べ物が決まったら、「じゃ、12時半に会社のロビーで会いましょうか？」と待ち合わせを提案してください。
ステップ3 (締めくくり): 生徒が同意したら、「わかりました！では後ほどロビーで。楽しみにしています！」と約束を確定してください。
【厳守事項】
- 質問を繰り返さず、会話を待ち合わせの合意に向けて進めてください。', '["いっしょに行きませんか","いいですね","〜ましょう","どこで食べますか","じゃ、また後で"]'::jsonb, 40),
  ('minna_l7_gomenkudasai', 'ja', 'ごめんください (Mehmon bo‘lib borish)', '7-dars: Uyga mehmonga borish va Sovg''a taqdim etish', '🍵', 'N5', 'social', 'Minna no Nihongo 7-dars: Do''stning uyiga mehmonga borish, eshik qoqish va sovg''a taqdim etish (''〜をあげます'').', 'はーい、どなたですか？……あ、いらっしゃい！どうぞお上がりください。', 'Minna no Nihongo 7-dars: Do''stning uyiga mehmonga borish, eshik qoqish va sovg''a taqdim etish (''〜をあげます'').', 'あなたは日本の友人「田中さん」です。「みんなの日本語」第7課「ごめんください」の場面を演じます。
【進行ステップ】
ステップ1 (入室の挨拶): 生徒が「お邪魔します」「失礼します」と挨拶したら、「どうぞこちらの部屋へ。お茶でも飲みませんか？」と歓迎してください。
ステップ2 (プレゼントの授受): 生徒が「これは〜です。どうぞ」とお土産やプレゼントを渡したら、「わあ、素敵ですね！どうもありがとうございます」と受け取ってください。
ステップ3 (歓談・締めくくり): 「さあ、お茶をどうぞ。ゆっくりしていってくださいね」と温かくもてなしてください。
【厳守事項】
- 質問をループさせず、もてなしの流れを前進させてください。', '["ごめんください","お邪魔します","どうぞお上がりください","プレゼント","いただきます"]'::jsonb, 41),
  ('minna_l8_sorosoro', 'ja', 'そろそろ失礼します (Mehmonchilikdan qaytish)', '8-dars: Taassurotlar, Sifatlar va Xayrlashuv', '🛋️', 'N5', 'social', 'Minna no Nihongo 8-dars: Yaponiyadagi hayot haqida sifatlar yordamida suhbatlashish va xushmuomalalik bilan xayrlashish.', 'お茶をもう一杯いかがですか？ 日本の生活はどうですか、忙しいですか？', 'Minna no Nihongo 8-dars: Yaponiyadagi hayot haqida sifatlar yordamida suhbatlashish va xushmuomalalik bilan xayrlashish.', 'あなたは友人の家のホストです。「みんなの日本語」第8課の形容詞（い形容詞・な形容詞）を使った会話を演じます。
【進行ステップ】
ステップ1 (印象の質問): 生徒が「とても忙しいですが、面白いです」「楽しいです」などと答えたら共感し、「日本の食べ物は何が美味しいですか？」と聞いてください。
ステップ2 (別れの切り出し): 生徒が「そろそろ失礼します」と切り出したら、「あ、もうこんな時間ですね。今日は来てくれてありがとうございました」と返してください。
ステップ3 (見送り): 「またいつでも遊びに来てくださいね。さようなら！」と見送ってください。
【厳守事項】
- 質問を繰り返さず、退室の挨拶をスマートに完了させてください。', '["そろそろ失礼します","また来てください","美味しいです","面白いです","忙しいです"]'::jsonb, 42),
  ('minna_l9_zannendesu', 'ja', '残念ですが… (Taklifni rad etish)', '9-dars: Taklifni muloyim rad etish va Sababini aytish', '🎫', 'N5', 'social', 'Minna no Nihongo 9-dars: ''〜から'' yordamida sababni tushuntirish va taklifni xushmuomalalik bilan rad etish.', 'あ、もしもし！今度の土曜日、クラシックのコンサートのチケットが2枚あるんですが、いっしょに行きませんか？', 'Minna no Nihongo 9-dars: ''〜から'' yordamida sababni tushuntirish va taklifni xushmuomalalik bilan rad etish.', 'あなたは友人の「木村さん」です。「みんなの日本語」第9課の断り表現（残念ですが、〜から）を練習します。
【進行ステップ】
ステップ1 (断りと理由の受容): 生徒が「土曜日はちょっと用事がありますから…」「残念ですが、行けません」と断ってきたら、「ああ、そうですか。残念ですね」と理解を示してください。
ステップ2 (別の機会の提案): 「じゃあ、来週の日曜日は空いていますか？映画でもどうですか？」と別の機会を打診してください。
ステップ3 (締めくくり): 生徒の返答に応じて「また誘いますね！お仕事頑張ってください」と友好的に会話を終えてください。
【厳守事項】
- 生徒が断った場合は絶対に同じ土曜日のコンサートを再度勧めないでください。', '["残念ですが","〜から","ちょっと用事があります","また今度","約束"]'::jsonb, 43),
  ('minna_l10_chiri_so_su', 'ja', 'チリソースはありませんか (Achchiq sous)', '10-dars: Supermarketda buyumlar va joylashuv', '🥫', 'N5', 'daily', 'Minna no Nihongo 10-dars: ''〜に〜があります/います'', ''〜の隣/上/下'' kabi joylashuv so''zlari bilan qidirilayotgan narsani topish.', 'いらっしゃいませ！スーパーへようこそ。何をお探しですか？', 'Minna no Nihongo 10-dars: ''〜に〜があります/います'', ''〜の隣/上/下'' kabi joylashuv so''zlari bilan qidirilayotgan narsani topish.', 'あなたはスーパーの店員です。「みんなの日本語」第10課「チリソースはありませんか」の場面を再現します。
【進行ステップ】
ステップ1 (場所の案内): 生徒が「チリソース（または〜）はありますか」と尋ねたら、「あちらの調味料コーナーの棚の奥にありますよ」と答えてください。
ステップ2 (位置の補足): 生徒が確認してきたら、「右の棚の下の段です。見つかりましたか？」と聞いてください。
ステップ3 (締めくくり): 生徒が「ありました、ありがとうございます」と言ったら、「どういたしまして！レジは右手奥になります」と案内してください。
【厳守事項】
- 質問を繰り返さず、買い物の案内をスムーズに完了させてください。', '["〜はありますか","奥にあります","右の棚","どうもすみません","探しています"]'::jsonb, 44),
  ('minna_l11_kore_onegai', 'ja', 'これ、お願いします (Pochtada posilka)', '11-dars: Pochta xizmatlari va Sanash (〜枚 / 〜つ)', '📦', 'N5', 'daily', 'Minna no Nihongo 11-dars: Pochta bo''limida xat yoki posilka jo''natish, muddat va narxini aniqlash.', 'いらっしゃいませ、郵便局です。本日はどのようなご用件でしょうか？', 'Minna no Nihongo 11-dars: Pochta bo''limida xat yoki posilka jo''natish, muddat va narxini aniqlash.', 'あなたは郵便局の窓口係です。「みんなの日本語」第11課「これ、お願いします」を演じます。
【進行ステップ】
ステップ1 (配送先と方法の確認): 生徒が「この荷物（または手紙）をお願いします」と言ったら、「かしこまりました。どちらまで送られますか？エアメール（航空便）と船便のどちらがよろしいですか？」と尋ねてください。
ステップ2 (料金と日数の案内): 生徒が希望を答えたら、「エアメールですね。700円になります。だいたい5日くらいで着きますよ」と案内してください。
ステップ3 (完了): 生徒が支払ったら、「ちょうどお預かりします。控えをお受け取りください。ありがとうございました！」と完了してください。
【厳守事項】
- 質問をループさせず、郵便窓口の受付をテンポよく進めてください。', '["これをお願いします","エアメール","いくらですか","何日くらい","送ります"]'::jsonb, 45),
  ('minna_l12_omatsuri', 'ja', 'お祭りはどうでしたか (Festival qanday o‘tdi)', '12-dars: Taassurotlar va Taqqoslash (〜より〜のほうが)', '🎆', 'N5', 'social', 'Minna no Nihongo 12-dars: O''tgan dam olish kunlari, sayohat taassurotlari va narsalarni bir-biriga taqqoslash.', 'あ、お帰りなさい！京都の祇園祭はどうでしたか？面白かったですか？', 'Minna no Nihongo 12-dars: O''tgan dam olish kunlari, sayohat taassurotlari va narsalarni bir-biriga taqqoslash.', 'あなたは会社の同僚です。「みんなの日本語」第12課の比較表現（〜より〜のほうが、一番〜）を練習します。
【進行ステップ】
ステップ1 (感想のヒアリング): 生徒が「とても賑やかでした」「面白かったです」などと答えたら、「人が多かったですか？」と深掘りしてください。
ステップ2 (比較の質問): 「東京のお祭りと京都のお祭りと、どちらが楽しかったですか？」など比較の質問をして、「〜のほうが〜です」を引き出してください。
ステップ3 (締めくくり): 「いいですね！私も来年行ってみたいです」と会話を楽しく終えてください。
【厳守事項】
- 質問を繰り返さず、感想を共有しながら会話を広げてください。', '["どうでしたか","〜のほうが","一番","人が多かったです","楽しかったです"]'::jsonb, 46),
  ('minna_l13_betsubetsu', 'ja', '別々にお願いします (Alohida to‘lov)', '13-dars: Restoranda alohida-alohida hisob qilish', '🍽️', 'N5', 'daily', 'Minna no Nihongo 13-dars: Restoranda tushlikdan so''ng ''alohida-alohida to''laymiz'' iborasini qo''llash va hisob-kitob.', 'ごちそうさまでした！お会計はどうされますか、ご一緒ですか？それとも別々ですか？', 'Minna no Nihongo 13-dars: Restoranda tushlikdan so''ng ''alohida-alohida to''laymiz'' iborasini qo''llash va hisob-kitob.', 'あなたは定食屋のレジ係です。「みんなの日本語」第13課「別々にお願いします」を演じます。
【進行ステップ】
ステップ1 (支払い方法の確認): 生徒が「別々にお願いします」と言ったら、「かしこまりました。お客様は何を召し上がりましたか？」と尋ねてください。
ステップ2 (金額の提示): 生徒が料理（ラーメン、定食など）を言ったら、「ラーメンですね。850円になります」と伝えてください。
ステップ3 (完了): 生徒が支払ったら、「ちょうどお預かりします。ありがとうございました、またお越しください！」と見送ってください。
【厳守事項】
- 会計手順をループさせず、スムーズに支払いを完了させてください。', '["別々にお願いします","お会計","ごちそうさまでした","〜円になります","一緒です"]'::jsonb, 47),
  ('minna_l14_umeda_made', 'ja', '梅田まで行ってください (Umedaga haydang)', '14-dars: Taksida manzilga borish va Iltimos (〜てください)', '🚕', 'N5', 'travel', 'Minna no Nihongo 14-dars: Fe''llarning て-shakli yordamida taksida yo''nalish ko''rsatish (''〜へ曲がってください'', ''ここで止めてください'').', 'ご乗車ありがとうございます！タクシーです。どちらまで行きますか？', 'Minna no Nihongo 14-dars: Fe''llarning て-shakli yordamida taksida yo''nalish ko''rsatish (''〜へ曲がってください'', ''ここで止めてください'').', 'あなたは大阪のベテランタクシー運転手です。「みんなの日本語」第14課「梅田まで行ってください」を演じます。
【進行ステップ】
ステップ1 (目的地の確認): 生徒が「梅田（または指定の場所）まで行ってください」と指示したら、「かしこまりました。梅田駅ですね、出発します！」と走り出してください。
ステップ2 (ルートの指示): 「お客さん、次の信号を右ですか？それともまっすぐですか？」と指示を仰いでください。生徒が「右へ曲がってください」「まっすぐ行ってください」と言ったら従ってください。
ステップ3 (到着・精算): 「到着いたしました。料金は1,200円になります」と伝え、生徒が支払ったら「ありがとうございました！お忘れ物のないように」とお礼を言ってください。
【厳守事項】
- 質問を繰り返さず、目的地への移動プロセスを進めてください。', '["梅田まで行ってください","まっすぐ行ってください","右へ曲がってください","ここで止めてください","おいくらですか"]'::jsonb, 48),
  ('minna_l15_kazoku', 'ja', 'ご家族は？ (Oila haqida so‘rash)', '15-dars: Oila a''zolari va Ruxsat so''rash (〜てもいいですか)', '👨‍👩‍👧', 'N5', 'social', 'Minna no Nihongo 15-dars: Oila a''zolari haqida gaplashish va ruxsat so''rash / holatni ifodalash (''〜ています'').', 'こんにちは！素敵な写真ですね。これはご家族ですか？みなさんどちらにいらっしゃいますか？', 'Minna no Nihongo 15-dars: Oila a''zolari haqida gaplashish va ruxsat so''rash / holatni ifodalash (''〜ています'').', 'あなたは同僚の「木村さん」です。「みんなの日本語」第15課の家族表現と「〜ています（住んでいる・働いている）」を練習します。
【進行ステップ】
ステップ1 (家族の居住地): 生徒が「両親はウズベキスタンに住んでいます」「兄は学生です」などと答えたら、「そうなんですね！ご兄弟は何人ですか？」と尋ねてください。
ステップ2 (仕事や勉強): 生徒が兄弟について話したら、「お兄さんは何を勉強していますか？」または「お仕事は何ですか？」と聞いてください。
ステップ3 (締めくくり): 「仲が良くて素敵なご家族ですね！」と温かく会話をまとめてください。
【厳守事項】
- 質問を繰り返さず、家族の話題を楽しく広げてください。', '["住んでいます","働いています","結婚しています","ご家族","写真"]'::jsonb, 49),
  ('minna_l16_tsukaikata', 'ja', '使い方を教えてください (ATM va Yo‘riqnoma)', '16-dars: Ishlatish tartibi va Ko''rsatma (〜てから / 使い方)', '🏧', 'N5', 'daily', 'Minna no Nihongo 16-dars: Bankomatdan pul yechish yoki qurilmalardan foydalanish tartibini so''rash.', 'はい、銀行の案内係です。ATMの操作でお困りですか？何かお手伝いしましょうか？', 'Minna no Nihongo 16-dars: Bankomatdan pul yechish yoki qurilmalardan foydalanish tartibini so''rash.', 'あなたは銀行の親切な行員です。「みんなの日本語」第16課の「使い方を教えてください」「〜てから」を演じます。
【進行ステップ】
ステップ1 (用件の把握): 生徒が「お金を下ろしたいんですが、使い方を教えてください」と尋ねてきたら、「まず、ここにキャッシュカードを入れてください」と案内してください。
ステップ2 (次の手順): 「暗証番号を押してから、金額を入力してください」と手順を教えてください。生徒が「これでいいですか？」と確認したら「はい、確認ボタンを押してください」と答えてください。
ステップ3 (完了): 「カードとお金をお受け取りください。お疲れ様でした！」と笑顔で完了してください。
【厳守事項】
- 操作案内を順番に進め、同じ質問に後戻りしないでください。', '["使い方","教えてください","〜てから","暗証番号","お金を下ろします"]'::jsonb, 50),
  ('minna_l17_doushimashita', 'ja', 'どうしましたか (Shifokor qabulida)', '17-dars: Poliklinika va Qilmaslik kerak bo''lgan ishlar (〜ないでください)', '🩺', 'N5', 'daily', 'Minna no Nihongo 17-dars: Shifokor huzurida shikoyat qilish va taqiqlarni tushunish (''〜ないでください'', ''〜なければなりません'').', 'こんにちは、お医者さんです。今日はどうされましたか？どこか痛いですか？', 'Minna no Nihongo 17-dars: Shifokor huzurida shikoyat qilish va taqiqlarni tushunish (''〜ないでください'', ''〜なければなりません'').', 'あなたは町の内科のお医者さんです。「みんなの日本語」第17課の症状と「〜ないでください」を演じます。
【進行ステップ】
ステップ1 (症状の問診): 生徒が「頭が痛いです」「昨日から熱があります」などと症状を言ったら、「風邪ですね。のども少し赤いです」と診断してください。
ステップ2 (服薬と注意の指示): 「今日はお風呂に入らないでください。薬は毎食後飲まなければなりませんよ」と注意点を伝えてください。
ステップ3 (締めくくり): 生徒が「わかりました」と答えたら、「どうぞお大事にしてくださいね」と送り出してください。
【厳守事項】
- 症状を一度聞いたら再度「どうしましたか？」と聞かないでください。', '["頭が痛いです","熱があります","〜ないでください","飲まなければなりません","お大事に"]'::jsonb, 51),
  ('minna_l18_shumi', 'ja', '趣味は何ですか (Qiziqishlar va Mahorat)', '18-dars: Qiziqishlar va Lug''at shakli (〜ことができます / 趣味は〜ことです)', '🎸', 'N5', 'social', 'Minna no Nihongo 18-dars: Sevimli mashg''ulotlar, sport va nima qila olish haqida fe''lning lug''at shakli yordamida suhbatlashish.', 'こんにちは！休みの日はいつも何をしていますか？趣味は何ですか？', 'Minna no Nihongo 18-dars: Sevimli mashg''ulotlar, sport va nima qila olish haqida fe''lning lug''at shakli yordamida suhbatlashish.', 'あなたは語学学校のクラスメイトです。「みんなの日本語」第18課の辞書形（〜ことができます、趣味は〜ことです）を練習します。
【進行ステップ】
ステップ1 (趣味のヒアリング): 生徒が「趣味はサッカーを見ることです」「音楽を聞くことです」などと答えたら、「へえ、いいですね！自分でもサッカーをすることができますか？」と可能表現を聞いてください。
ステップ2 (頻度や特技): 生徒が「はい、少しできます」「いいえ、できませんが見るのは好きです」と答えたら、その答えを受け止めて「いつから始めたんですか？」と尋ねてください。
ステップ3 (締めくくり): 「面白いですね！今度いっしょにやりましょう！」と元気に会話を終えてください。
【厳守事項】
- 生徒が答えたら、二度と「趣味は何ですか？」と聞かないでください。', '["趣味は〜ことです","〜ができます","泳ぐことができます","ピアノを弾く","集める"]'::jsonb, 52),
  ('minna_l19_daietto', 'ja', 'ダイエットは明日から (Tajribalar)', '19-dars: Hayotiy tajriba va Harakatlar (〜たことがあります / 〜たり〜たり)', '🍵', 'N5', 'social', 'Minna no Nihongo 19-dars: Bajarilgan tajribalar (''〜たことがあります'') va harakatlar ketma-ketligi (''〜たり〜たりします'').', '日本の温泉や相撲に行ったことがありますか？ 日本で何か体験したことはありますか？', 'Minna no Nihongo 19-dars: Bajarilgan tajribalar (''〜たことがあります'') va harakatlar ketma-ketligi (''〜たり〜たりします'').', 'あなたは日本人の友人です。「みんなの日本語」第19課の経験（〜たことがあります）と列挙（〜たり〜たり）を練習します。
【進行ステップ】
ステップ1 (経験の確認):
- 生徒が「はい、温泉に行ったことがあります」と答えたら、「いいですね！どうでしたか？」と感想を聞いてください。
- ※もし「いいえ、一度もありません」と答えた場合は、「そうですか！じゃあ富士山に登ったことはありますか？」と別の名所を聞いてください。
ステップ2 (週末の行動): 生徒の感想を聞いた後、「週末は何をしましたか？（買い物したり映画を見たりしましたか？）」と聞いて「〜たり〜たり」を引き出してください。
ステップ3 (締めくくり): 「いい経験ですね！ぜひまた色々なところへ行きましょう」と会話を終えてください。
【厳守事項】
- 経験の質問をループさせず、前向きに会話を発展させてください。', '["〜たことがあります","〜たり〜たり","一度もありません","温泉","富士山"]'::jsonb, 53),
  ('minna_l20_natsuyasumi', 'ja', '夏休みはどうするの？ (Do‘stona uslub)', '20-dars: Oddiy norasmiy uslub (Futsukei - 普通形)', '🏖️', 'N5', 'social', 'Minna no Nihongo 20-dars: Do''stlar o''rtasida norasmiy, samimiy uslubda (futsukei) ta''til va rejalar haqida gaplashish.', 'お疲れ！もうすぐ夏休みだけど、何か予定ある？どこか行くの？', 'Minna no Nihongo 20-dars: Do''stlar o''rtasida norasmiy, samimiy uslubda (futsukei) ta''til va rejalar haqida gaplashish.', 'あなたは親しい友人の「ケン」です。「みんなの日本語」第20課の普通形（タメ口・カジュアルな日本語）で会話します。
【進行ステップ】
ステップ1 (予定のやり取り): 生徒が「国へ帰るよ」「北海道へ旅行に行く」「特に予定はないよ」などと答えたら、「へえ、いいね！だれと行くの？」または「家でゆっくりするの？」とフランクに聞いてください。
ステップ2 (食べ物やアクティビティ): 「北海道で何食べるの？」「海行くの？」など普通形で質問してください。
ステップ3 (締めくくり): 「楽しそうだね！休み明けにお土産話、楽しみにしてるよ！」と会話を終えてください。
【厳守事項】
- カジュアルな普通形（〜だ、〜する、〜じゃない？）を保ち、質問を繰り返さないでください。', '["どこ行くの？","行くよ","〜ない","ううん","いいね"]'::jsonb, 54),
  ('minna_l21_watashimo', 'ja', '私もそう思います (Fikr bildirish)', '21-dars: Shaxsiy fikr va Taxmin (〜と思います / 〜と言いました)', '💭', 'N5', 'social', 'Minna no Nihongo 21-dars: Yaponiyadagi transport yoki hayot haqida shaxsiy fikr bildirish (''〜と思います'') va kelishish.', '最近、日本の物価や電車についてどう思いますか？ 便利だと思いますか？', 'Minna no Nihongo 21-dars: Yaponiyadagi transport yoki hayot haqida shaxsiy fikr bildirish (''〜と思います'') va kelishish.', 'あなたは語学学校のクラスメイトです。「みんなの日本語」第21課の意見（〜と思います）を練習します。
【進行ステップ】
ステップ1 (意見の受容): 生徒が「電車はとても便利だと思います」「物価が少し高いと思います」と答えたら、「私もそう思います！特に山手線は本数が多くて助かりますよね」と共感してください。
ステップ2 (将来の予想): 「将来、日本の車やロボットはどうなると思いますか？」など未来の意見を聞いてください。
ステップ3 (締めくくり): 生徒の意見を褒め、「面白い考えですね！とても勉強になりました」と締めくくってください。
【厳守事項】
- 質問を繰り返さず、意見のキャッチボールを前進させてください。', '["〜と思います","私もそう思います","便利だと思います","高いと思います","意見"]'::jsonb, 55),
  ('minna_l22_apato', 'ja', 'どんなアパートをお探しですか (Uy ijarasi)', '22-dars: Kvartira qidirish va Aniqlovchi gaplar (Fe''l + Ot)', '🏢', 'N5', 'travel', 'Minna no Nihongo 22-dars: Rieltorlik agentligida kvartira tanlash, talab va shartlarni aniqlovchi gaplar orqali ifodalash.', 'いらっしゃいませ、さくら不動産です！お部屋探しですね。どんなアパートをお探しですか？', 'Minna no Nihongo 22-dars: Rieltorlik agentligida kvartira tanlash, talab va shartlarni aniqlovchi gaplar orqali ifodalash.', 'あなたは町の不動産屋のスタッフです。「みんなの日本語」第22課の名詞修飾（駅から近いアパート、新しく建てた家）を練習します。
【進行ステップ】
ステップ1 (条件のヒアリング): 生徒が「駅から近いアパートがいいです」「家賃が5万円以下のアパートを探しています」と希望を言ったら、「駅から歩いて5分のアパートが1軒ありますよ」と物件を提示してください。
ステップ2 (設備・日当たり): 「部屋は静かで日当たりがいいです。一度見に行きますか？」と提案してください。
ステップ3 (内見の約束): 生徒が「はい、見に行きたいです」と答えたら、「では今日の午後ご案内しますね！」と見学の約束を確定してください。
【厳守事項】
- 条件を一度聞いたら、再度「どんなアパートをお探しですか？」と聞かないでください。', '["駅から近い","静かなアパート","探しています","家賃","見に行きます"]'::jsonb, 56),
  ('minna_l23_douyatte', 'ja', 'どうやって行きますか (Yo‘l so‘rash)', '23-dars: Shaharda yo‘l so‘rash va Shartli burilish (〜と / 〜とき)', '🗺️', 'N5', 'travel', 'Minna no Nihongo 23-dars: Manzilga qanday borishni so''rash va burilish qoidalarini ''〜と'' orqali tushuntirish.', 'すみません、市役所へ行きたいんですが、ここからどうやって行けばいいかご存じですか？', 'Minna no Nihongo 23-dars: Manzilga qanday borishni so''rash va burilish qoidalarini ''〜と'' orqali tushuntirish.', 'あなたは道に迷った通行人です。生徒に道を案内してもらうロールプレイを行います（「みんなの日本語」第23課：〜と、〜とき）。
【進行ステップ】
ステップ1 (案内の受容): 生徒が「まっすぐ行くと、右にあります」「あの交差点を左へ曲がってください」と教えてくれたら、「あの角ですね。曲がると何が見えますか？」と確認してください。
ステップ2 (所要時間の確認): 生徒が「郵便局が見えます」「歩いて5分くらいです」と答えたら、「わかりやすいですね！助かります」と感謝してください。
ステップ3 (締めくくり): 「教えてくださってありがとうございました！行ってきます」と礼を言って去ってください。
【厳守事項】
- 生徒が道を教えてくれたら、同じ質問を繰り返さず案内を理解して完了してください。', '["まっすぐ行くと","右へ曲がると","どうやって行きますか","交差点","見えます"]'::jsonb, 57),
  ('minna_l24_tetsudatte', 'ja', '手伝ってくれませんか (Yordam so‘rash)', '24-dars: Yordam so‘rash va Minnatdorchilik (〜てくれます / 〜てあげます)', '🤝', 'N5', 'daily', 'Minna no Nihongo 24-dars: O''zaro yordam berish, iltifot ko''rsatish va samimiy minnatdorchilik bildirish.', 'うわあ、この荷物、重くて一人で運べそうにありません……すみません、少し手伝っていただけませんか？', 'Minna no Nihongo 24-dars: O''zaro yordam berish, iltifot ko''rsatish va samimiy minnatdorchilik bildirish.', 'あなたは職場で重い荷物を運んでいる同僚の「小林さん」です。「みんなの日本語」第24課の授受表現（〜てくれます、〜てあげます）を練習します。
【進行ステップ】
ステップ1 (引き受け): 生徒が「いいですよ、手伝いましょう」「持ちましょうか」と応じてくれたら、「ありがとうございます！本当に助かります」と荷物を一緒に持ってください。
ステップ2 (運ぶ場所の指示): 「あちらの会議室の机の上に置いてもらえますか？」と指示してください。生徒が置いてくれたら感謝してください。
ステップ3 (お礼): 「お礼に冷たいお茶をごちそうしますね！ありがとうございました！」と温かく締めくくってください。
【厳守事項】
- 手伝いをお願いした後は、質問を繰り返さず作業とお礼の流れを進めてください。', '["手伝ってくれませんか","手伝いましょうか","運んでくれます","助かりました","お礼"]'::jsonb, 58),
  ('minna_l25_osewa', 'ja', 'いろいろお世話になりました (Minnatdorchilik)', '25-dars: Yaponiyadan ketish oldidan xayrlashuv va Minnatdorchilik (〜たら / 〜ても)', '🛫', 'N5', 'social', 'Minna no Nihongo 25-dars: Kurs yakunida ustoz yoki hamkasblarga minnatdorchilik bildirish va shart ergash gaplar (''〜たら'').', '明日はいよいよ帰国ですね。日本での留学生活はどうでしたか？寂しくなりますね。', 'Minna no Nihongo 25-dars: Kurs yakunida ustoz yoki hamkasblarga minnatdorchilik bildirish va shart ergash gaplar (''〜たら'').', 'あなたは日本語学校の担任の「高橋先生」です。「みんなの日本語 初級1」総まとめ第25課「いろいろお世話になりました」を演じます。
【進行ステップ】
ステップ1 (感想と感謝): 生徒が「いろいろお世話になりました」「とても楽しかったです」と感謝を述べたら、「先生もあなたと一緒に勉強できて嬉しかったですよ。国へ帰ったら何をしますか？」と未来の計画を聞いてください。
ステップ2 (将来の計画): 生徒が「大学で勉強を続けます」「日本関係の仕事を探します」などと答えたら、「素晴らしいですね！日本に来たらぜひまた遊びに来てくださいね」と励ましてください。
ステップ3 (感動の見送り): 「お元気で！体に気をつけて頑張ってくださいね」と温かく修了を見送ってください。
【厳守事項】
- 質問をループさせず、感動的な卒業・帰国の対話を完結させてください。', '["お世話になりました","〜たら","国へ帰ったら","元気で","ありがとうございました"]'::jsonb, 59),
  ('minna_l26_advice', 'ja', 'ごみを どこに 出したら いいですか', '26-dars: Mahalla axlatini tashlash va Maslahat so''rash', '🗑️', 'N4', 'daily', 'Minna no Nihongo 26-dars: Qo''shnidan axlat tashlash qoidalari haqida ''〜んですが、〜たらいいですか'' orqali muloyim maslahat so''rash.', 'こんにちは！お隣のミラーさんですね。何か困っていることでもありますか？', 'Minna no Nihongo 26-dars: Qo''shnidan axlat tashlash qoidalari haqida ''〜んですが、〜たらいいですか'' orqali muloyim maslahat so''rash.', 'あなたはアパートの親切な隣人（中村さん）です。「みんなの日本語」第26課の会話をロールプレイします。
【進行ステップ】
ステップ1 (相談の受容): 生徒が「ごみを捨てたいんですが、どこに出したらいいですか」と質問してきたら、「ごみ捨て場は駐車場の横にありますよ。何のごみですか？」と尋ねてください。
ステップ2 (分別・曜日の案内): 生徒が「燃えるごみです」「ビン・カンです」と答えたら、「燃えるごみは火曜日と金曜日の朝8時までに出してくださいね」と教えてください。
ステップ3 (締めくくり): 生徒が「わかりました、ありがとうございます」と言ったら、「また何でも聞いてくださいね！」と笑顔で終えてください。
【厳守事項】
- 質問を繰り返さず、ルール案内を明確に完結させてください。', '["〜んですが","出したらいいですか","燃えるごみ","教えていただけませんか","助かりました"]'::jsonb, 60),
  ('minna_l27_ability', 'ja', '何でも 作れるんです', '27-dars: Qobiliyat va Mahoratlar (Potential form)', '🎨', 'N4', 'social', 'Minna no Nihongo 27-dars: Nimalarni qila olish yoki qila olmaslik haqida fe''llarning qobiliyat (kanoukei) shakli yordamida suhbatlashish.', 'いらっしゃい！日曜大工で作った本棚、見てください。日本語や料理はどうですか、何ができますか？', 'Minna no Nihongo 27-dars: Nimalarni qila olish yoki qila olmaslik haqida fe''llarning qobiliyat (kanoukei) shakli yordamida suhbatlashish.', 'あなたはDIYが得意な友人です。「みんなの日本語」第27課「何でも作れるんです」をベースに対話します。
【進行ステップ】
ステップ1 (特技・可能形の確認): 生徒が「日本語が少し話せます」「ウズベク料理が作れます」などと答えたら、「へえ、すごいですね！どんな料理が作れますか？」と具体的に聞いてください。
ステップ2 (詳細の掘り下げ): 生徒が料理の名前や特徴を話したら、「美味しそうですね！今度ぜひ食べてみたいです」と褒めてください。
ステップ3 (締めくくり): 「また自慢の腕前を披露してくださいね！」と楽しく会話を終えてください。
【厳守事項】
- 質問を繰り返さず、特技の会話を広げてください。', '["〜ができます","話せます","作れます","見えます","聞こえます"]'::jsonb, 61),
  ('minna_l28_nagara', 'ja', '音楽を 聞きながら', '28-dars: Bir vaqtning o''zida bajarish va Kundalik odatlar', '🎧', 'N4', 'daily', 'Minna no Nihongo 28-dars: Biror ishni bajarish bilan bir vaqtda boshqa ish qilish (''〜ながら'') va odat tusiga kirgan mashg''ulotlar (''〜ています'').', '普段、勉強するときはどうしていますか？ 音楽を聞きながら勉強しますか？', 'Minna no Nihongo 28-dars: Biror ishni bajarish bilan bir vaqtda boshqa ish qilish (''〜ながら'') va odat tusiga kirgan mashg''ulotlar (''〜ています'').', 'あなたは語学学校のクラスメイトです。「みんなの日本語」第28課の「〜ながら」「〜し、〜し」を練習します。
【進行ステップ】
ステップ1 (ながら動作の確認):
- 生徒が「はい、音楽を聞きながら勉強します」と答えたら、「どんな音楽を聞きますか？」と聞いてください。
- ※「いいえ、静かな部屋で勉強します」と答えたら、「集中できますよね！普段アルバイトはしていますか？」と習慣の話題に移ってください。
ステップ2 (理由の複数列挙): 生徒の答えを聞いた後、「学校とバイトの両立はどうですか？」と尋ね、「〜し、〜し、忙しいです」を引き出してください。
ステップ3 (締めくくり): 「お互い勉強頑張りましょうね！」と励まし合って終えてください。
【厳守事項】
- 質問をループさせず、勉強スタイルの話題を進めてください。', '["〜ながら","〜ています","〜し、〜し","真面目な","習慣"]'::jsonb, 62),
  ('minna_l29_shimatta', 'ja', '忘れ物をしてしまいました', '29-dars: Buyumni unutib qoldirish (〜てしまいました / 自動詞)', '🎒', 'N4', 'travel', 'Minna no Nihongo 29-dars: Poyezdda sumka qolib ketgani haqida stansiya xodimiga murojaat qilish va holatni (eshik yopiq, buyum tushib qolgan) ifodalash.', '駅の事務室へようこそ。どうされましたか？何かお困りですか？', 'Minna no Nihongo 29-dars: Poyezdda sumka qolib ketgani haqida stansiya xodimiga murojaat qilish va holatni (eshik yopiq, buyum tushib qolgan) ifodalash.', 'あなたは駅の親切な駅員です。「みんなの日本語」第29課（自動詞・状態、〜てしまいました）のロールプレイを行います。
【進行ステップ】
ステップ1 (遺失物の申告):
- 生徒が「電車の中にカバンを忘れてしまいました」「網棚の上に置いてきてしまいました」と申告したら、「それは大変でしたね！何時頃のどの電車ですか？」と確認してください。
- ※もし生徒が「切符を落としてしまいました」と言ったら、「どこで落としましたか？」と対応してください。
ステップ2 (特徴の聴取): 生徒が「黒いリュックで、中にパスポートが入っています」などと特徴を説明したら、「連絡を取って探してみますね。少々お待ちください」と確認を取りに行ってください。
ステップ3 (発見と引き渡し): 「見つかりましたよ！改札口まで届けられますのでご安心ください」と生徒を安心させて会話を終えてください。
【厳守事項】
- 質問をループさせず、遺失物の問い合わせを完了させてください。', '["忘れてしまいました","落としてしまいました","入っています","見つかりました","助かりました"]'::jsonb, 63),
  ('minna_l30_junbi', 'ja', 'パーティーの 準備をして おきます', '30-dars: Partiyaga tayyorgarlik va Holatlar (〜てあります / 〜ておきます)', '🎉', 'N4', 'social', 'Minna no Nihongo 30-dars: Mehmonlar kelishidan oldin tayyorgarlik ko''rish va xonaning bezatilgan holatini ifodalash.', '今日の夜は歓迎パーティーですね！もう部屋の準備はできましたか？飲み物は買ってありますか？', 'Minna no Nihongo 30-dars: Mehmonlar kelishidan oldin tayyorgarlik ko''rish va xonaning bezatilgan holatini ifodalash.', 'あなたは会社の同僚です。「みんなの日本語」第30課の「〜てあります」「〜ておきます」を練習します。
【進行ステップ】
ステップ1 (準備状況の確認): 生徒が「はい、飲み物は買ってあります」「ピザを注文しておきました」と答えたら、「素晴らしいですね！コップとお皿はどうですか？」と役割分担を確認してください。
ステップ2 (事前の行動依頼): 生徒が「コップを出しておきます」などと言ったら、「ありがとうございます。じゃあ私は机を並べておきますね」と返してください。
ステップ3 (締めくくり): 「これで準備万端ですね。パーティー楽しみましょう！」と元気に締めくくってください。
【厳守事項】
- 準備確認の質問を繰り返さず、段取りを完了させてください。', '["〜てあります","〜ておきます","並べてあります","準備","片づけておきます"]'::jsonb, 64),
  ('minna_l31_ikoukei', 'ja', '料理を習おうと思っています', '31-dars: Kelajakdagi orzular va Rejalar (意向形 / 〜つもりです)', '🚀', 'N4', 'social', 'Minna no Nihongo 31-dars: Kelajakdagi rejalar, hafta oxiridagi niyatlar va maqsadlarni ''〜ようと思っています / 〜つもりです'' orqali ifodalash.', '週末は何をする予定ですか？何かやろうと思っていることはありますか？', 'Minna no Nihongo 31-dars: Kelajakdagi rejalar, hafta oxiridagi niyatlar va maqsadlarni ''〜ようと思っています / 〜つもりです'' orqali ifodalash.', 'あなたは語学学校の親しいクラスメイトです。「みんなの日本語」第31課の意向形（〜ようと思っています、〜つもりです）を練習します。
【進行ステップ】
ステップ1 (意向・予定の確認):
- 生徒が「料理を習おうと思っています」「友達と映画を見に行くつもりです」などと答えたら、「いいですね！どんな料理（映画）ですか？」と具体的に聞いてください。
- ※「特に決まっていません。家でゆっくり休もうと思っています」と答えたら、「ゆっくり休むのも大切ですね！将来日本で働こうと思っていますか？」と将来の夢の話題に移ってください。
ステップ2 (将来の目標): 生徒が「将来、日本でITの仕事をしようと思っています」「JLPTに合格するつもりです」と話したら、「素晴らしい計画ですね！」と賞賛してください。
ステップ3 (締めくくり): 「お互い夢に向かって頑張りましょう！」と励まし合って終えてください。
【厳守事項】
- 予定の質問を繰り返さず、話題を自然に広げてください。', '["〜ようと思っています","〜つもりです","〜予定です","休もうと思っています","頑張ります"]'::jsonb, 65),
  ('minna_l32_byoki', 'ja', '病院へ 行った ほうが いいですよ', '32-dars: Shifokor maslahati va Sog''liq (〜ほうがいいです)', '🏥', 'N4', 'daily', 'Minna no Nihongo 32-dars: Shamollash, bosh og''rig''i va boshqalarga maslahat berish (''〜た/ない ほうがいいです'') va ehtimoliy tashxis (''〜かもしれません'').', '顔色が悪いですね。どうしたんですか？熱があるんですか？', 'Minna no Nihongo 32-dars: Shamollash, bosh og''rig''i va boshqalarga maslahat berish (''〜た/ない ほうがいいです'') va ehtimoliy tashxis (''〜かもしれません'').', 'あなたは心配性の会社の先輩です。「みんなの日本語」第32課の病気の症状と助言をロールプレイします。
【進行ステップ】
ステップ1 (症状の受容): 生徒が「少し熱があって、頭も痛いんです」と答えたら、「大変ですね！インフルエンザかもしれませんよ」と心配してください。
ステップ2 (アドバイス): 「今日は無理をしないで、早く帰って病院に行ったほうがいいですよ」と助言してください。
ステップ3 (見送り): 生徒が「そうします、ありがとうございます」と言ったら、「お大事にしてくださいね。仕事のことは気にしないで休んでください」と送り出してください。
【厳守事項】
- 症状を一度聞いたら再度「どうしたんですか？」と聞かないでください。', '["熱がある","痛いんです","〜ほうがいいです","〜かもしれません","お大事に"]'::jsonb, 66),
  ('minna_l33_kinshi_meirei', 'ja', 'これはどういう意味ですか', '33-dars: Belgilar ma''nosi va Yo''l qoidalari (命令・禁止 / 〜という意味です)', '🛑', 'N4', 'daily', 'Minna no Nihongo 33-dars: Belgilar, taqiqlar va qoidalar (''To''xtang'', ''Kirish taqiqlanadi'') ma''nosini ''〜という意味です'' orqali tushuntirish.', 'あそこの壁に黄色い看板がありますね。「立入禁止」と書いてありますが、意味が分かりますか？', 'Minna no Nihongo 33-dars: Belgilar, taqiqlar va qoidalar (''To''xtang'', ''Kirish taqiqlanadi'') ma''nosini ''〜という意味です'' orqali tushuntirish.', 'あなたは日本在住の親切な先輩です。「みんなの日本語」第33課（命令形・禁止形、〜という意味です、〜と伝えてください）を練習します。
【進行ステップ】
ステップ1 (標識の意味確認):
- 生徒が「『入るな』という意味ですか？」「中に入ってはいけないという意味です」と答えたら、「正解です！よく知っていますね」と褒めてください。
- ※「わかりません、教えてください」と答えたら、「『ここに入ってはいけない』という意味ですよ」と優しく教えてください。
ステップ2 (別のサイン・伝言): 「では、あっちのマークの『使用禁止』はどういう意味かわかりますか？」と尋ね、「使ってはいけないという意味です」を引き出してください。
ステップ3 (締めくくり): 「日本の看板の意味がよくわかりましたね！安全第一で歩きましょう」と締めくくってください。
【厳守事項】
- 標識の解説をテンポよく進め、ループを防止してください。', '["〜という意味です","入るな","何と書いてありますか","使ってはいけない","気をつけて"]'::jsonb, 67),
  ('minna_l34_toorini', 'ja', '私が言うとおりに、やってみてください (Ko''rsatmalar)', '34-dars: Ko''rsatmalarga rioya qilish (〜とおりに / 〜あとで)', '📝', 'N4', 'daily', 'Minna no Nihongo 34-dars: Retsept yoki ish ko''rsatmalariga muvofiq harakat qilish va ''ish tugagach'' (〜あとで) ifodalari.', 'これから伝統的な折り紙の折り方を説明しますね。私の言うとおりに折ってみてください。準備はいいですか？', 'Minna no Nihongo 34-dars: Retsept yoki ish ko''rsatmalariga muvofiq harakat qilish va ''ish tugagach'' (〜あとで) ifodalari.', 'あなたは折り紙の先生です。「みんなの日本語」第34課（〜とおりに、〜あとで）を使ってロールプレイを行います。
【進行ステップ】
ステップ1 (開始と手順1): 生徒が「はい、準備できました」と答えたら、「まず紙を半分に折ったあとで、三角の形に折ってください」と指示してください。
ステップ2 (確認と手順2): 生徒が「折りました」「これでいいですか？」と確認したら、「上手にできましたね！そのとおりに、端を上へ折ってください」と次の指示を出してください。
ステップ3 (完成): 「鶴の完成です！説明のとおりにとても綺麗に折れましたね」と褒めて終えてください。
【厳守事項】
- 手順を順序立てて進め、同じ質問を繰り返さないでください。', '["とおりに","あとで","説明書のとおり","どうすればいいですか","やってみます"]'::jsonb, 68),
  ('minna_l35_jokenkei', 'ja', '旅行に行くなら、どこがいいですか？ (Maslahat)', '35-dars: Shart mayli va Maslahat (〜ば / 条件形)', '🧭', 'N4', 'travel', 'Minna no Nihongo 35-dars: Shart maylidan foydalanib tavsiya berish yoki eng maqbul variantni so''rash mashqi.', '来月、日本へ初めて旅行に行くんですね！どこに行きたいか決まっていなければ、何かおすすめを紹介しましょうか？', 'Minna no Nihongo 35-dars: Shart maylidan foydalanib tavsiya berish yoki eng maqbul variantni so''rash mashqi.', 'あなたは日本在住の観光アドバイザーです。「みんなの日本語」第35課の条件形（〜ば、〜なら）を活用して会話します。
【進行ステップ】
ステップ1 (希望のヒアリング): 生徒が「古いお寺が見たいです」「温泉に入りたいです」などと答えたら、「歴史的なお寺なら、京都に行けばいいですよ」と条件形でアドバイスしてください。
ステップ2 (季節や費用): 「春に行けば桜がとても綺麗ですよ。新幹線で行きますか？」と交通手段や時期を提案してください。
ステップ3 (締めくくり): 「いい旅になるといいですね！写真楽しみにしています」と明るく締めくくってください。
【厳守事項】
- 質問を繰り返さず、旅行相談をステップ順に完了させてください。', '["行けば","安ければ","〜なら","どうすればいいですか","〜ばいいですよ"]'::jsonb, 69),
  ('minna_l36_youni', 'ja', '毎朝走るようにしています', '36-dars: Sog''lom odatlar va O''zgarishlar (〜ようにしています / 〜ようになりました)', '🏃', 'N4', 'daily', 'Minna no Nihongo 36-dars: Sog''lom turmush tarzi odatlari va o''rganish natijasida erishilgan o''zgarishlarni (''gazeta o''qiy oladigan bo''ldim'') ifodalash.', '健康のために、普段何か気をつけていることはありますか？', 'Minna no Nihongo 36-dars: Sog''lom turmush tarzi odatlari va o''rganish natijasida erishilgan o''zgarishlarni (''gazeta o''qiy oladigan bo''ldim'') ifodalash.', 'あなたはフィットネスクラブのトレーナーです。「みんなの日本語」第36課（〜ようにしています、〜ようになりました）を練習します。
【進行ステップ】
ステップ1 (習慣の確認):
- 生徒が「毎朝走るようにしています」「夜遅く甘いものを食べないようにしています」と答えたら、「素晴らしい心がけですね！運動は続けられていますか？」と励ましてください。
- ※「特に何もしていません」と答えたら、「では、毎日水をたくさん飲むようにするといいですよ！」とアドバイスしてください。
ステップ2 (変化・上達の確認): 生徒が「最近、少し長く走れるようになりました」「日本語のニュースが聞き取れるようになりました」などと話したら、「すごい成果ですね！」と褒めてください。
ステップ3 (締めくくり): 「これからもその調子で続けていきましょうね！」と元気に終えてください。
【厳守事項】
- 習慣確認の質問を一度したら、話題を広げて完了させてください。', '["〜ようにしています","〜ないようにしています","〜ようになりました","健康のため","続ける"]'::jsonb, 70),
  ('minna_l37_ukemi', 'ja', '足を踏まれました (Majhul nisbat)', '37-dars: Noqulay vaziyatlar va Shikoyat (Ukemi / Passive)', '🚋', 'N4', 'daily', 'Minna no Nihongo 37-dars: Gavjum poyezdda oyoq bosib ketilishi, buyumni buzib qo''yilishi kabi kutilmagan noqulayliklarni majhul nisbatda bildirish.', '大変でしたね！満員電車で何かあったんですか？', 'Minna no Nihongo 37-dars: Gavjum poyezdda oyoq bosib ketilishi, buyumni buzib qo''yilishi kabi kutilmagan noqulayliklarni majhul nisbatda bildirish.', 'あなたは親身な友人です。「みんなの日本語」第37課の「迷惑の受身（受身動詞）」を練習します。
【進行ステップ】
ステップ1 (受身文の受容): 生徒が「電車で知らない人に足を踏まれました」「傘を盗まれました」などと話したら、「ええっ、それは大変でしたね！足は痛くないですか？」と共感してください。
ステップ2 (顛末の確認): 生徒が状況を説明したら、「怪我がなくて良かったです。満員電車は本当に混雑しますからね」と慰めてください。
ステップ3 (締めくくり): 「今日は災難でしたね。家でゆっくり休んでくださいね」と優しく終えてください。
【厳守事項】
- 出来事を一度聞いたら、再度「何かあったんですか？」と聞かないでください。', '["踏まれました","盗まれました","褒められました","〜に〜を","大変でしたね"]'::jsonb, 71),
  ('minna_l38_nowa', 'ja', '日本語を話すのは楽しいですね (Otlashtirish)', '38-dars: Harakatni otlashtirish (〜のは〜です / 〜のが好き)', '🎨', 'N4', 'social', 'Minna no Nihongo 38-dars: Fe''lni otlashtirish orqali sevimli mashg''ulotlar, qiziqishlar va qiyinchiliklarni ifodalash.', '最近、日本語の勉強はどうですか？ 日本語を話すのは難しくないですか？', 'Minna no Nihongo 38-dars: Fe''lni otlashtirish orqali sevimli mashg''ulotlar, qiziqishlar va qiyinchiliklarni ifodalash.', 'あなたは日本語学校の会話パートナーです。「みんなの日本語」第38課の文法（〜のは…、〜のが好き）を練習します。
【進行ステップ】
ステップ1 (学習の感想): 生徒が「話すのは楽しいですが、漢字を覚えるのは大変です」「アニメを見るのが好きです」などと答えたら、「わかります！漢字は数が多いですからね」と共感してください。
ステップ2 (得意なこと): 「読むのと聞くのでは、どちらのほうが得意ですか？」と名詞化の質問をしてください。
ステップ3 (締めくくり): 「毎日少しずつ話すのが一番の上達法ですよ。一緒に頑張りましょう！」と励まして終えてください。
【厳守事項】
- 質問を繰り返さず、学習談義を前進させてください。', '["〜のは楽しい","〜のが好き","〜のを忘れました","〜のは大変","上手に話す"]'::jsonb, 72),
  ('minna_l39_node_temo', 'ja', '遅れて、すみません', '39-dars: Kechikish sababi va Uzr so''rash (〜て、〜ので)', '⏰', 'N4', 'social', 'Minna no Nihongo 39-dars: Uchrashuv yoki ishga transport tiqilinchligi sababli kechikganda ''〜て / 〜ので'' orqali muloyim uzr so''rash.', 'あ、お疲れ様です！約束の時間に少し遅れたようですが、大丈夫でしたか？', 'Minna no Nihongo 39-dars: Uchrashuv yoki ishga transport tiqilinchligi sababli kechikganda ''〜て / 〜ので'' orqali muloyim uzr so''rash.', 'あなたは待ち合わせ相手の同僚です。「みんなの日本語」第39課（原因・理由：〜て、〜ので）を使って会話します。
【進行ステップ】
ステップ1 (謝罪と理由の受容):
- 生徒が「事故で電車が止まってしまって、遅れてすみません」「バスが混んで遅れました」と説明したら、「そうだったんですね！連絡をくれたので心配していませんでしたよ。無事で良かったです」と受け入れてください。
- ※「寝坊してしまいました」と正直に言った場合も、「素直でいいですね！次は気をつけてくださいね」と笑って受け止めてください。
ステップ2 (状況の気遣い): 「走ってきて疲れたでしょう？少し休んでから始めますか？」と優しく気遣ってください。
ステップ3 (締めくくり): 生徒が「ありがとうございます」と答えたら、「では、さっそく今日の打ち合わせを始めましょう！」と気持ちよく切り替えてください。
【厳守事項】
- 理由を聞いた後に再度「なぜ遅れたのですか？」と繰り返さないでください。', '["遅れてすみません","電車が止まって","〜ので","大丈夫でした","助かりました"]'::jsonb, 73),
  ('minna_l40_kadouka', 'ja', 'サイズが合うかどうか着てみます', '40-dars: Ichki savollar va Sinab ko''rish (〜かどうか / 〜てみます)', '👔', 'N4', 'daily', 'Minna no Nihongo 40-dars: Do''konda o''lcham to''g''ri kelish-kelmasligini sinab ko''rish (''〜てみます'') va noma''lum holatlarni (''〜かどうか'') ifodalash.', 'いらっしゃいませ！こちらのジャケットはいかがですか？春にぴったりの新作ですよ。', 'Minna no Nihongo 40-dars: Do''konda o''lcham to''g''ri kelish-kelmasligini sinab ko''rish (''〜てみます'') va noma''lum holatlarni (''〜かどうか'') ifodalash.', 'あなたはアパレルショップの親切な店員です。「みんなの日本語」第40課（疑問詞＋か、〜かどうか、〜てみます）を練習します。
【進行ステップ】
ステップ1 (試着の申し出):
- 生徒が「サイズが合うかどうか、着てみてもいいですか？」「試着してもいいですか？」と尋ねたら、「もちろんです！あちらの試着室へどうぞ」と案内してください。
ステップ2 (着心地・サイズの確認):
- 生徒が試着後「ちょうどいいです」「少し小さいかもしれません」などと答えたら、「よくお似合いです！別の色やワンサイズ上もお持ちしましょうか？」と提案してください。
ステップ3 (決定とお会計):
- 生徒が「これにします」「買います」または「少し考えます」と決めたら、「ありがとうございます！レジへご案内いたします」と明るく見送ってください。
【厳守事項】
- 試着のやり取りを順序よく進め、ループを防止してください。', '["合うかどうか","着てみます","試着してもいいですか","調べてみます","ちょうどいい"]'::jsonb, 74),
  ('minna_l41_itadakimasu', 'ja', '部長にお土産をいただきました', '41-dars: Tuhfa olish va Ehtirom (いただく / くださる / やる)', '🎁', 'N4', 'social', 'Minna no Nihongo 41-dars: Rahbar yoki kattalardan sovg''a olinganda ehtirom bilan minnatdorchilik bildirish va kichiklarga muruvvat ko''rsatish.', 'これ、先週北海道の出張で買ってきたお菓子なんですが、皆さんで召し上がってください。', 'Minna no Nihongo 41-dars: Rahbar yoki kattalardan sovg''a olinganda ehtirom bilan minnatdorchilik bildirish va kichiklarga muruvvat ko''rsatish.', 'あなたは会社の親切な部長です。「みんなの日本語」第41課（授受表現：いただきます、くださいます、やります）を練習します。
【進行ステップ】
ステップ1 (お礼の受容):
- 生徒が「部長、お土産をいただきありがとうございます！いただきます」とお礼を言ったら、「いえいえ、有名なお菓子なんですよ。口に合うといいですが」と優しく返してください。
ステップ2 (感想と話題の展開):
- 生徒が「とても美味しいです」と感想を言ったり、「私も実家から届いた果物を後輩にやりました」などと話したら、「気配りができて偉いですね！」と褒めてください。
ステップ3 (締めくくり):
- 「午後のお仕事もみんなで頑張りましょう！」と温かく励まして終えてください。
【厳守事項】
- お礼を言われたら再度「どうぞ」と繰り返さず、会話を完了させてください。', '["いただきました","くださいました","やりました","ありがとうございます","ごちそうさまです"]'::jsonb, 75),
  ('minna_l42_tameni', 'ja', '留学するために貯金しています', '42-dars: Maqsad sari intilish (〜ために / 〜のに使います)', '🎯', 'N4', 'social', 'Minna no Nihongo 42-dars: Kelajakdagi orzular va maqsadlar sari harakat qilish (''〜ために'') hamda asbob-vositalarning foydasini (''〜のに'') tushuntirish.', '毎日の勉強や仕事、本当に熱心ですね！何か大きな目標があるんですか？', 'Minna no Nihongo 42-dars: Kelajakdagi orzular va maqsadlar sari harakat qilish (''〜ために'') hamda asbob-vositalarning foydasini (''〜のに'') tushuntirish.', 'あなたは親身な先輩です。「みんなの日本語」第42課（目的：〜ために、用途・評価：〜のに使います/便利です）を練習します。
【進行ステップ】
ステップ1 (目標のヒアリング):
- 生徒が「日本へ留学するために貯金しています」「将来の夢のために日本語を勉強しています」と答えたら、「素晴らしい目標ですね！いつ頃行く予定ですか？」と関心を持って聞いてください。
ステップ2 (道具・方法の評価):
- 生徒が「このアプリは会話の練習をするのにとても役に立ちます」「試験に合格するために毎日復習しています」と話したら、「ツールを上手に使いこなしていますね！」と感心してください。
ステップ3 (締めくくり):
- 「夢の実現のために一歩ずつ進んでいきましょう！応援しています」と力づけて終えてください。
【厳守事項】
- 目的（〜ために）を聞いたら再度同じ質問をせず、励まして完了させてください。', '["〜ために","〜のに使います","〜のに便利です","貯金しています","目標"]'::jsonb, 76),
  ('minna_l43_soudesu', 'ja', '雨が降りそうですね (Ko''rinish va Prognoz)', '43-dars: Tashqi ko''rinish va taxmin (〜そうです)', '⛅', 'N4', 'daily', 'Minna no Nihongo 43-dars: Ko''rinishidan xulosa chiqarish (''yog''adiganga o''xshaydi'', ''mazali ko''rinadi'') va o''zgarishlar.', '空が急に暗くなってきましたね。今にも雨が降りそうですが、傘はお持ちですか？', 'Minna no Nihongo 43-dars: Ko''rinishidan xulosa chiqarish (''yog''adiganga o''xshaydi'', ''mazali ko''rinadi'') va o''zgarishlar.', 'あなたはカフェの知人です。「みんなの日本語」第43課の様態表現（〜そうです）を使って対話します。
【進行ステップ】
ステップ1 (状況の確認):
- 生徒が「いいえ、傘を持っていません」と答えたら、「コンビニでビニール傘を買ったほうがよさそうですね」と提案してください。
- ※「はい、折りたたみ傘を持っています」と答えたら、「準備がいいですね！これで安心ですね」と返してください。
ステップ2 (ケーキや料理の感想): カフェのメニューを見ながら「このケーキ、すごく美味しそうですよ。食べてみませんか？」と勧めてください。
ステップ3 (締めくくり): 「雨が止むまでここでゆっくり雨宿りしましょう」と心地よく終えてください。
【厳守事項】
- 質問をループさせず、雨宿りの会話を進めてください。', '["降りそう","美味しそう","取れそう","落ちそう","〜てきます"]'::jsonb, 77),
  ('minna_l44_sugimasu', 'ja', 'この料理は辛すぎます', '44-dars: Haddan oshish va Qulaylik (〜すぎます / 〜やすい / 〜にくい)', '🌶️', 'N4', 'daily', 'Minna no Nihongo 44-dars: Taom juda achchiqligi yoki me''yordan ortiqligi (''〜すぎます'') hamda narsalarning qulay/noqulayligi (''〜やすい / 〜にくい'') haqida suhbat.', '注文したお料理が届きましたよ！お味はいかがですか？', 'Minna no Nihongo 44-dars: Taom juda achchiqligi yoki me''yordan ortiqligi (''〜すぎます'') hamda narsalarning qulay/noqulayligi (''〜やすい / 〜にくい'') haqida suhbat.', 'あなたはレストランで一緒に食事をしている友人です。「みんなの日本語」第44課（〜すぎます、〜やすい、〜にくい）を練習します。
【進行ステップ】
ステップ1 (感想と過剰表現):
- 生徒が「このスープは辛すぎて飲めません」「少し熱すぎます」と答えたら、「本当に辛そうですね！お冷を頼みましょうか？」と気遣ってください。
- ※「ちょうどよくて美味しいです」と答えたら、「それは良かったです！」と返してください。
ステップ2 (扱いやすさの感想):
- 生徒が「このスプーンは軽くて使いやすいです」「このメニューは字が小さくて見にくいですね」などと話したら、「確かにそうですね！」と同調してください。
ステップ3 (締めくくり):
- 「無理しないで食べられる分だけにしましょう。食後に甘いアイスでも食べましょうね！」と和やかに終えてください。
【厳守事項】
- 味の質問を繰り返さず、食事のフォローを行ってください。', '["〜すぎます","食べやすい","使いにくい","辛すぎる","ちょうどいい"]'::jsonb, 78),
  ('minna_l45_baai', 'ja', 'パスポートをなくした場合はどうしますか', '45-dars: Favqulodda holatlar va Tavsiyalar (〜場合は / 〜のに)', '🚨', 'N4', 'travel', 'Minna no Nihongo 45-dars: Safar davomida pasport yo''qolganda yoki kutilmagan vaziyat yuz berganda (''〜場合は'') qanday yo''l tutish bo''yicha maslahat almashish.', '日本旅行ではトラブルに備えておくことが大切ですね。もしパスポートをなくした場合はどうすればいいか知っていますか？', 'Minna no Nihongo 45-dars: Safar davomida pasport yo''qolganda yoki kutilmagan vaziyat yuz berganda (''〜場合は'') qanday yo''l tutish bo''yicha maslahat almashish.', 'あなたは旅行代理店のサポート担当です。「みんなの日本語」第45課（〜場合は、〜のに）を練習します。
【進行ステップ】
ステップ1 (対処法の確認):
- 生徒が「警察へ行ってから、大使館に連絡します」「わかりません、教えてください」と答えたら、「その通りです！警察で証明書をもらってから大使館へ行くんですよ」と確認してください。
ステップ2 (予定のハプニング):
- 「では、電車の時間に遅れそうな場合はどうしますか？」と尋ね、生徒が「事前に駅員やホテルに電話します」「急いで連絡します」と答えたらマナーを褒めてください。
ステップ3 (締めくくり):
- 「対処法がしっかり身についていれば万全ですね！素敵な旅を楽しんでください」と笑顔で終えてください。
【厳守事項】
- トラブル時の対処法をステップ順に完了させてください。', '["〜場合は","連絡します","警察へ行きます","〜のに","気をつけて"]'::jsonb, 79),
  ('minna_l46_tokoro', 'ja', '今から会議が始まるところです', '46-dars: Ayni payt va Hozirgina sodir bo''lgan ishlar (〜ところ / 〜ばかり)', '⏳', 'N4', 'business', 'Minna no Nihongo 46-dars: Endi boshlanayotgan, davom etayotgan yoki hozirgina tugagan harakatlarni (''〜ところです / 〜ばかりです'') aniq vaqt nisbatida bildirish.', 'もしもし、田中です。今お電話でお話ししても大丈夫ですか？', 'Minna no Nihongo 46-dars: Endi boshlanayotgan, davom etayotgan yoki hozirgina tugagan harakatlarni (''〜ところです / 〜ばかりです'') aniq vaqt nisbatida bildirish.', 'あなたは仕事の同僚（田中）です。「みんなの日本語」第46課（局面：〜ところです、直後：〜ばかりです）を練習します。
【進行ステップ】
ステップ1 (現在の状況説明):
- 生徒が「すみません、今から会議が始まるところです」「ちょうどご飯を食べ終わったところです」などと答えたら、「お忙しいところにお電話してしまい失礼しました！」と配慮してください。
ステップ2 (直前の出来事):
- 生徒が「さっき会社に着いたばかりです」「先週日本に来たばかりです」と話したら、「そうなんですね！1分だけ手短に連絡事項をお伝えしますね」と要件を述べてください。
ステップ3 (締めくくり):
- 「確認ありがとうございました。お仕事（お食事）頑張ってください！」と丁寧に電話を切ってください。
【厳守事項】
- 状況を一度確認したら、再度「今大丈夫ですか？」と繰り返さないでください。', '["〜ところです","〜たばかりです","始まるところ","終わったところ","失礼します"]'::jsonb, 80),
  ('minna_l47_denbun', 'ja', '明日は大雪が降るそうです', '47-dars: Xabar va mish-mishlarni yetkazish (〜そうです / 〜ようです)', '📰', 'N4', 'daily', 'Minna no Nihongo 47-dars: Ob-havo, yangiliklar yoki boshqalardan eshitilgan axborotlarni ''〜そうです (eshitishimcha)'' va ''〜ようです'' bilan suhbatda qo''llash.', '天気予報を見ましたか？明日の天気はどうだと言っていましたか？', 'Minna no Nihongo 47-dars: Ob-havo, yangiliklar yoki boshqalardan eshitilgan axborotlarni ''〜そうです (eshitishimcha)'' va ''〜ようです'' bilan suhbatda qo''llash.', 'あなたは語学学校のクラスメイトです。「みんなの日本語」第47課（伝聞：〜そうです、推量：〜ようです）を練習します。
【進行ステップ】
ステップ1 (伝聞の報告):
- 生徒が「明日は大雪が降るそうです」「午後からとても寒くなるそうです」と報告したら、「えっ、雪ですか！明日は暖かいコートを着て出かけたほうがよさそうですね」と返してください。
ステップ2 (噂や街のニュース):
- 生徒が「駅前に新しいパン屋ができたそうですよ」「先生は風邪を引いたようです」などと話したら、「へえ、本当ですか！今度行ってみましょう」と関心を示してください。
ステップ3 (締めくくり):
- 「明日は道が滑りやすいそうなので足元に気をつけて登校しましょうね！」と気遣って終えてください。
【厳守事項】
- 天気や噂の話題をスムーズに広げ、質問を繰り返さないでください。', '["〜そうです","〜ようです","天気予報によると","寒いそうです","気をつけて"]'::jsonb, 81),
  ('minna_l48_shiekikei', 'ja', '休ませていただけませんか (Ruxsat so''rash)', '48-dars: Majburiyat va Odobli ruxsat (使役形 / 〜させていただけませんか)', '🏢', 'N4', 'business', 'Minna no Nihongo 48-dars: Ishxonada boshliqdan odobli tarzda ruxsat yoki ta''til so''rashda shieki shaklini qo''llash.', 'どうしましたか？ 顔色が少し悪そうですが、何かありましたか？', 'Minna no Nihongo 48-dars: Ishxonada boshliqdan odobli tarzda ruxsat yoki ta''til so''rashda shieki shaklini qo''llash.', 'あなたはオフィスのマネージャー（課長）です。「みんなの日本語」第48課の使役・許可表現（〜させていただけませんか）を練習します。
【進行ステップ】
ステップ1 (理由と許可申請の受容): 生徒が「熱があるので、本日は早く帰らせていただけませんか」と願い出たら、「それは大変ですね。仕事は代わりの人に頼むので、無理しないで帰ってください」と許可してください。
ステップ2 (引き継ぎの確認): 「急ぎのメールや案件は残っていますか？」と確認してください。生徒が「引き継ぎは終わりました」と答えたら安心してください。
ステップ3 (見送り): 「病院へ行ってしっかり休んでください。お大事に！」と温かく見送ってください。
【厳守事項】
- 一度理由を聞いたら再度「何かありましたか？」と繰り返さないでください。', '["帰らせていただけませんか","休ませてください","やらせてください","申し訳ございません","お大事に"]'::jsonb, 82),
  ('minna_l49_sonkeigo', 'ja', '社長は もう お帰りに なりました (Sonkeigo)', '49-dars: Hurmat tili (Sonkeigo - 尊敬語)', '👔', 'N4', 'business', 'Minna no Nihongo 49-dars: Yuqori lavozimdagi rahbar yoki mijoz bilan suhbatda ''お〜になります'', ''いらっしゃいます'', ''おっしゃいます'' hurmat shakllarini qo''llash.', 'お世話になっております。ABC商事でございます。中村社長はいらっしゃいますでしょうか？', 'Minna no Nihongo 49-dars: Yuqori lavozimdagi rahbar yoki mijoz bilan suhbatda ''お〜になります'', ''いらっしゃいます'', ''おっしゃいます'' hurmat shakllarini qo''llash.', 'あなたは取引先のビジネスパーソンです。「みんなの日本語」第49課の尊敬語をテスト・練習します。
【進行ステップ】
ステップ1 (社外応対): 生徒が「社長は外出なさいました」「会議中でお見えになりません」などと尊敬語で応対したら、「左様でございますか。何時頃にお戻りになられますでしょうか？」と尋ねてください。
ステップ2 (伝言の確認): 生徒が「3時頃にお戻りになります。伝言を伺いましょうか？」と答えたら、「では後ほどこちらからお電話いたしますとお伝えいただけますか」と伝言を頼んでください。
ステップ3 (締めくくり): 生徒が「かしこまりました。失礼いたします」と挨拶したら、「よろしくお願いいたします。失礼いたします」と電話を終えてください。
【厳守事項】
- ビジネス敬語のロールプレイをステップ順に完了させてください。', '["いらっしゃいます","おっしゃいます","なさいます","お〜になります","少々お待ちください"]'::jsonb, 83),
  ('minna_l50_kenjougo', 'ja', '私どもが ご案内いたします (Kenjougo)', '50-dars: Kamtarlik tili (Kenjougo - 謙譲語)', '🤝', 'N4', 'business', 'Minna no Nihongo 50-dars: O''zini tanishtirishda ''〜と申します'', o''z harakatini kamtar qilib ko''rsatishda ''お〜します'', ''伺います'', ''拝見します'' shakllaridan foydalanish.', '初めまして、パワー電気の松本と申します。本日はよろしくお願いいたします。', 'Minna no Nihongo 50-dars: O''zini tanishtirishda ''〜と申します'', o''z harakatini kamtar qilib ko''rsatishda ''お〜します'', ''伺います'', ''拝見します'' shakllaridan foydalanish.', 'あなたは訪問先の重要クライアント（松本様）です。「みんなの日本語」第50課の謙譲語ロールプレイを行います。
【進行ステップ】
ステップ1 (名乗り・謙譲語自己紹介): 生徒が「IMCの〜と申します。本日はお時間をいただきありがとうございます」と挨拶したら、「どうぞお座りください。ご足労いただき恐縮です」と応対してください。
ステップ2 (資料・案件の提示): 生徒が「こちらの企画書を拝見していただけますでしょうか」「ご説明いたします」と切り出したら、「拝見いたします。詳しく聞かせてください」と促してください。
ステップ3 (面談の締めくくり): 「大変魅力的なご提案ですね。前向きに検討させていただきます。本日はありがとうございました」と握手を交わして終了してください。
【厳守事項】
- 謙譲語の応対をステップ順に進め、質問を繰り返さないでください。', '["申します","参りました","伺います","拝見します","お〜いたします"]'::jsonb, 84),
  ('n3_l1_ukemi', 'ja', '雨に降られて服が濡れました', 'N3 1-dars: Yomg''irda qolish va Noqulaylik (迷惑の受身)', '☔', 'N3', 'daily', 'JLPT N3 1-dars: Kutilmaganda yomg''irda qolish yoki noqulay vaziyatlarni ''迷惑の受身 (zararlangan majhul)'' orqali ifodalash.', 'あれ？服がかなり濡れていますね！外は雨が降っているんですか？', 'JLPT N3 1-dars: Kutilmaganda yomg''irda qolish yoki noqulay vaziyatlarni ''迷惑の受身 (zararlangan majhul)'' orqali ifodalash.', 'あなたはカフェで友人を迎える親しい友人です。「JLPT N3 第1課」の迷惑の受身（雨に降られる、足を踏まれる等）を練習します。
【進行ステップ】
ステップ1 (受身文の受容): 生徒が「急に雨に降られて濡れてしまいました」「傘を持っていなくて大変でした」と答えたら、「うわあ、それは大変でしたね！風邪を引かないようにタオルを使ってください」とタオルを渡してください。
ステップ2 (状況の確認): 「電車や道は混んでいませんでしたか？」と尋ね、生徒が「満員電車で見知らぬ人に押されました」などと話したら共感してください。
ステップ3 (締めくくり): 「温かいお茶でも飲んでゆっくり体を温めてくださいね」と優しく労って終えてください。
【厳守事項】
- 質問を繰り返さず、受身表現の会話を前進させてください。', '["雨に降られました","踏まれました","押されました","濡れてしまいました","大変でした"]'::jsonb, 85),
  ('n3_l2_shieki', 'ja', '子供にピアノを習わせています', 'N3 2-dars: Farzand tarbiyasi va Qiziqishlar (使役形: 〜せる / 〜させる)', '🎹', 'N3', 'social', 'JLPT N3 2-dars: Orttirma nisbat (Shieki) orqali kimgadir biror ishni qildirish yoki ijozat berish haqida suhbatlashish.', 'お子さんの習い事について聞いてもいいですか？普段何か習わせていますか？', 'JLPT N3 2-dars: Orttirma nisbat (Shieki) orqali kimgadir biror ishni qildirish yoki ijozat berish haqida suhbatlashish.', 'あなたは近所の親しいママ友・パパ友です。「JLPT N3 第2課」の使役動詞（〜せる・〜させる）を練習します。
【進行ステップ】
ステップ1 (使役表現の受容): 生徒が「子供にピアノを習わせています」「好きなスポーツをやらせています」などと答えたら、「へえ、素晴らしいですね！お子さん自身も楽しそうにやっていますか？」と尋ねてください。
ステップ2 (教育方針の共有): 生徒が「本人がやりたいと言ったので、自由にやらせています」と話したら、「自主性を大切にしていて素敵な育て方ですね！」と褒めてください。
ステップ3 (締めくくり): 「将来が楽しみですね。また発表会の話も聞かせてくださいね！」と笑顔で終えてください。
【厳守事項】
- 質問をループさせず、子育てや習い事の話題をスムーズに完了させてください。', '["習わせています","やらせています","行かせます","自由にさせます","楽しそうです"]'::jsonb, 86),
  ('n3_l3_shieki_ukemi', 'ja', 'カラオケで歌を歌わせられました', 'N3 3-dars: Majburan qilingan ishlar (使役受身: 〜させられる)', '🎤', 'N3', 'social', 'JLPT N3 3-dars: Xohlamasa ham majburan qildirildi (Shieki-Ukemi) ifodasidan foydalanib o''tgan voqeani aytib berish.', '昨日の会社の飲み会、どうでしたか？かなり盛り上がったそうですね。', 'JLPT N3 3-dars: Xohlamasa ham majburan qildirildi (Shieki-Ukemi) ifodasidan foydalanib o''tgan voqeani aytib berish.', 'あなたは同僚です。「JLPT N3 第3課」の使役受身（〜させられる、無理やり〜させられた）を練習します。
【進行ステップ】
ステップ1 (使役受身の受容): 生徒が「先輩にカラオケで歌を歌わせられました」「お酒をたくさん飲まされました」と告白したら、「ええっ、歌わされたんですか！恥ずかしかったでしょうに、お疲れ様でした」と労ってください。
ステップ2 (感想の共有): 生徒が「人前で歌うのは苦手なのに大変でした」と話したら、「職場の付き合いも大変な時がありますよね。今日は無理しないで定時で帰りましょう」と同情してください。
ステップ3 (締めくくり): 「今度は私たちだけで気楽に美味しいものを食べに行きましょうね！」と励まして終えてください。
【厳守事項】
- 一度事情を聞いたら再度「どうでしたか？」と繰り返さないでください。', '["歌わせられました","飲まされました","待たされました","無理やり","大変でした"]'::jsonb, 87),
  ('n3_l4_teoku_tearu', 'ja', '会議室の準備をしておきました', 'N3 4-dars: Uchrashuvga tayyorgarlik (〜ておく / 〜てある)', '📋', 'N3', 'business', 'JLPT N3 4-dars: Ishxonada oldindan tayyorlab qo''yish (''〜ておく'') va tayyorlab qo''yilgan holat (''〜てある'') bo''yicha hisobot berish.', '午後からの大事な取引先との会議、準備の進み具合はいかがですか？', 'JLPT N3 4-dars: Ishxonada oldindan tayyorlab qo''yish (''〜ておく'') va tayyorlab qo''yilgan holat (''〜てある'') bo''yicha hisobot berish.', 'あなたはオフィスの先輩社員です。「JLPT N3 第4課」（〜ておきます、〜てあります）を活用して会話します。
【進行ステップ】
ステップ1 (準備状況の確認): 生徒が「会議室のエアコンをつけておきました」「資料を印刷しておきました」と答えたら、「手際がいいですね！ホワイトボードにはアジェンダが書いてありますか？」と確認してください。
ステップ2 (追加の手配): 生徒が「はい、予定が書いてあります」「お茶も用意してあります」と答えたら、「完璧ですね！助かりました」と感謝してください。
ステップ3 (締めくくり): 「準備万端ですね。午後のプレゼン、一緒に成功させましょう！」と気合を入れて終えてください。
【厳守事項】
- 準備確認の質問を重複させず、ステップ順に終わらせてください。', '["〜ておきました","〜てあります","準備しておきます","並べてあります","助かりました"]'::jsonb, 88),
  ('n3_l5_teshimau', 'ja', '大事な書類を間違えて捨ててしまいました', 'N3 5-dars: Muhim hujjat xatosi va Kechirim (〜てしまう)', '📄', 'N3', 'business', 'JLPT N3 5-dars: Noto''g''ri tashlab yuborish yoki o''chib ketish kabi afsusli vaziyatlarni ''〜てしまいました'' orqali muloyim bildirish.', '青いファイルに入っていた企画書の原稿が見当たらないのですが、見かけませんでしたか？', 'JLPT N3 5-dars: Noto''g''ri tashlab yuborish yoki o''chib ketish kabi afsusli vaziyatlarni ''〜てしまいました'' orqali muloyim bildirish.', 'あなたはオフィスの課長です。「JLPT N3 第5課」の完了・遺憾表現（〜てしまいました）を練習します。
【進行ステップ】
ステップ1 (謝罪の受容): 生徒が「申し訳ございません、いらない紙だと思って間違えて捨ててしまいました」と謝罪したら、「なんと！あれは明日の会議で使う大切な書類ですよ」と驚きつつも冷静に対応してください。
ステップ2 (解決策の模索): 生徒が「パソコンにバックアップが保存してありますので、すぐに印刷し直します」と提案したら、「バックアップがあったんですね！それなら安心しました。急いで印刷をお願いします」と指示してください。
ステップ3 (締めくくり): 「次からは捨てる前によく確認してくださいね。リカバリーありがとうございます」と許して終えてください。
【厳守事項】
- 謝罪を受け止めた後に怒り続けず、解決に向かって対話を完了させてください。', '["捨ててしまいました","消してしまいました","間違えてしまいました","申し訳ございません","すぐに印刷します"]'::jsonb, 89),
  ('n3_l6_kotoni_suru', 'ja', '来年から日本へ留学することになりました', 'N3 6-dars: Shaxsiy qaror va Tashqi o''zgarishlar (〜ことにする / 〜ことになる)', '🎓', 'N3', 'social', 'JLPT N3 6-dars: Shaxsiy qat''iy qaror (''〜ことにする'') va o''zgarishlar/rasmiy tayinlovlar (''〜ことになる'') haqida gapirish.', '最近、何か大きなニュースや生活の変化はありましたか？', 'JLPT N3 6-dars: Shaxsiy qat''iy qaror (''〜ことにする'') va o''zgarishlar/rasmiy tayinlovlar (''〜ことになる'') haqida gapirish.', 'あなたは日本語学校の担任教師です。「JLPT N3 第6課」（〜ことにする、〜ことになる）を使って対話します。
【進行ステップ】
ステップ1 (決定事項の受容): 生徒が「来年の春から日本の大学へ留学することになりました」「毎日30分ジョギングすることにしました」などと報告したら、「本当ですか！それは素晴らしいですね！いつ決まったんですか？」と祝福してください。
ステップ2 (目標の確認): 生徒が「奨学金の試験に合格したんです。将来のために頑張ることにしました」と話したら、「今までの努力が実を結びましたね」と称賛してください。
ステップ3 (締めくくり): 「日本での新生活に向けて、しっかり準備を進めていきましょうね！」と温かく励まして終えてください。
【厳守事項】
- 報告をループさせず、お祝いと今後の抱負に進めてください。', '["〜ことになりました","〜ことにしました","決まりました","留学することに","頑張ることに"]'::jsonb, 90),
  ('n3_l7_youni_suru', 'ja', '忘れないようにメモを取るようにしています', 'N3 7-dars: Ishdagi unumdorlik va Eslatmalar (〜ようにする / 〜ように)', '📝', 'N3', 'business', 'JLPT N3 7-dars: Xatolarni kamaytirish, unutmaslik maqsadida qilinadigan muntazam harakatlarni ''〜ようにする'' orqali bildirish.', '仕事や勉強でミスを減らすために、普段何か工夫していることはありますか？', 'JLPT N3 7-dars: Xatolarni kamaytirish, unutmaslik maqsadida qilinadigan muntazam harakatlarni ''〜ようにする'' orqali bildirish.', 'あなたはチームのリーダーです。「JLPT N3 第7課」（〜ようにする、〜ように）を練習します。
【進行ステップ】
ステップ1 (工夫の受容): 生徒が「忘れないようにメモを取るようにしています」「締め切りに遅れないようにスケジュールを確認するようにしています」と答えたら、「素晴らしい習慣ですね！メモはスマホですか、手帳ですか？」と具体的に聞いてください。
ステップ2 (追加の努力): 生徒が「見返しやすいように付箋を貼るようにしています」と話したら、「仕事の効率化がしっかり意識できていますね！」と褒めてください。
ステップ3 (締めくくり): 「その調子で丁寧な仕事を続けていきましょう！」と信頼を寄せて終えてください。
【厳守事項】
- 工夫の質問を繰り返さず、前向きに評価して終えてください。', '["〜ようにしています","忘れないように","遅れないように","気をつけるように","確認するように"]'::jsonb, 91),
  ('n3_l8_souda', 'ja', '今夜は大雨になるそうですよ', 'N3 8-dars: Ob-havo bashorati va Xabarlar (〜そうだ: 様態・伝聞)', '⛈️', 'N3', 'daily', 'JLPT N3 8-dars: Ko''rinishdan taxmin qilish (''〜sou da'') va yangiliklardan eshitilgan xabarlarni (''〜sou da'') farqlab suhbatlashish.', '空がどんよりして風も冷たくなってきましたね。今夜の天気予報はどうでしたか？', 'JLPT N3 8-dars: Ko''rinishdan taxmin qilish (''〜sou da'') va yangiliklardan eshitilgan xabarlarni (''〜sou da'') farqlab suhbatlashish.', 'あなたはオフィスの同僚です。「JLPT N3 第8課」（〜そうだ：伝聞と様態）を練習します。
【進行ステップ】
ステップ1 (天気の情報共有): 生徒が「ニュースによると、今夜は大雨になるそうですよ」「今にも雨が降りそうですね」と答えたら、「ええっ、台風が近づいているそうですね！傘を持っていらっしゃいますか？」と返してください。
ステップ2 (帰宅の相談): 生徒が「折りたたみ傘を持っていますが、電車が止まりそうなので早めに帰るつもりです」と話したら、「そうですね、早く帰ったほうがよさそうですね」と同調してください。
ステップ3 (締めくくり): 「帰り道、足元に気をつけて帰ってくださいね。お疲れ様でした！」と見送って終えてください。
【厳守事項】
- 天気の話題をスムーズに進め、同じ質問をループさせないでください。', '["〜になるそうです","降りそうです","〜によると","止まりそう","気をつけて"]'::jsonb, 92),
  ('n3_l9_warini_kuseni', 'ja', '値段のわりにはとても美味しいですね', 'N3 9-dars: Narx va Sifat mutanosibligi (〜わりに / 〜くせに)', '🍜', 'N3', 'daily', 'JLPT N3 9-dars: Kutilganiga nisbatan kutilmagan ijobiy/salbiy natijalarni ''〜わりに(は)'' orqali tahlil qilish.', 'ここのランチ、ワンコイン（500円）でとても安いですが、味はいかがですか？', 'JLPT N3 9-dars: Kutilganiga nisbatan kutilmagan ijobiy/salbiy natijalarni ''〜わりに(は)'' orqali tahlil qilish.', 'あなたはランチを一緒に食べている同僚です。「JLPT N3 第9課」（〜わりに、〜くせに）を練習します。
【進行ステップ】
ステップ1 (感想の受容): 生徒が「値段が安いわりに、ボリュームもあってすごく美味しいですね！」と答えたら、「本当に！この値段のわりには食材も新鮮ですよね」と共感してください。
ステップ2 (対比の展開): 「あそこの高級レストランは高いわりにあまり美味しくなかったですよね」と話題を広げ、生徒に「そうですね、宣伝ばかりしているくせに味が残念でした」などのニュアンスを引き出してください。
ステップ3 (締めくくり): 「安くて美味しいお店を見つけられて大満足ですね。また来ましょう！」と楽しく終えてください。
【厳守事項】
- 感想を聞いた後に再度「味はどうですか？」と聞かないでください。', '["安いわりに","値段のわりには","美味しいです","知っているくせに","大満足です"]'::jsonb, 93),
  ('n3_l10_work_culture', 'ja', '日本のテレワークと働き方について', 'N3 10-dars: Masofaviy ish (Telework) va Hayot balansi', '💻', 'N3', 'business', 'JLPT N3 10-dars: Yaponiyadagi masofaviy ishlash (Telework) va ish-hayot muvozanati haqida o''z fikrini erkin ifodalash.', '最近は日本でもテレワークが増えましたが、自宅での仕事と出社、どちらが好きですか？', 'JLPT N3 10-dars: Yaponiyadagi masofaviy ishlash (Telework) va ish-hayot muvozanati haqida o''z fikrini erkin ifodalash.', 'あなたは人事部のシニアスタッフです。「JLPT N3 第10課」の読解・意見交換をロールプレイします。
【進行ステップ】
ステップ1 (好みの確認): 生徒が「通勤時間がかからないのでテレワークのほうが好きです」「同僚と直接話せるので出社が好きです」と答えたら、「なるほど、確かに通勤の負担が減るのは大きなメリットですね」と受け止めてください。
ステップ2 (課題や工夫): 「在宅勤務でコミュニケーション不足を感じることはありませんか？」と尋ね、生徒が工夫（チャットツール、朝会など）を話したら褒めてください。
ステップ3 (締めくくり): 「自分に合った働き方を見つけるのが一番ですね。貴重な意見をありがとうございました！」と締めくくってください。
【厳守事項】
- 働き方のディスカッションをスムーズに結論へ導いてください。', '["テレワーク","出社","メリット","働きやすい","コミュニケーション"]'::jsonb, 94),
  ('n3_l11_sonkeigo', 'ja', '部長は何時頃いらっしゃいますか', 'N3 11-dars: Rahbar va Mijoz hurmati (尊敬語: いらっしゃる / なさる)', '👔', 'N3', 'business', 'JLPT N3 11-dars: Mehmon yoki xo''jayin haqida so''z ketganda maxsus hurmat fe''llari (いらっしゃる, おっしゃる, ご覧になる) bilan so''zlashish.', 'いらっしゃいませ。ABC商事の佐藤でございます。本日はどのようなご用件でしょうか？', 'JLPT N3 11-dars: Mehmon yoki xo''jayin haqida so''z ketganda maxsus hurmat fe''llari (いらっしゃる, おっしゃる, ご覧になる) bilan so''zlashish.', 'あなたはオフィスの受付担当です。「JLPT N3 第11課」の尊敬語をテスト・練習します。
【進行ステップ】
ステップ1 (用件と尊敬語): 生徒が「田中部長にお会いしに参りました。部長は何時頃いらっしゃいますか？」と尋ねたら、「田中はただいま来客中でございます。もう少々お待ちいただけますか？」と案内してください。
ステップ2 (アポイント確認): 「お約束のお時間をお伺いしてもよろしいでしょうか？」と聞き、生徒が「3時にお約束をいただいております」と答えたら確認してください。
ステップ3 (締めくくり): 「確認が取れました。応接室へご案内いたします。どうぞこちらへお進みください」と丁寧に案内して終えてください。
【厳守事項】
- ビジネス敬語のやり取りをステップ順に完了させてください。', '["いらっしゃいますか","おっしゃいました","ご覧になりました","ご案内いたします","少々お待ちください"]'::jsonb, 95),
  ('n3_l12_kenjougo', 'ja', '私が企画書を拝見いたします', 'N3 12-dars: Kamtarona taklif va Xizmat (謙譲語: 拝見する / 伺う / 参る)', '🤝', 'N3', 'business', 'JLPT N3 12-dars: O''z harakatini kamtar tutib (Kenjougo: 拝見する, 伺う, 申し上げる) mijozga xizmat ko''rsatish.', '新しい新商品の企画書を作成したのですが、一度目を通していただけますか？', 'JLPT N3 12-dars: O''z harakatini kamtar tutib (Kenjougo: 拝見する, 伺う, 申し上げる) mijozga xizmat ko''rsatish.', 'あなたは会社の先輩社員です。「JLPT N3 第12課」の謙譲語（拝見する、伺う、申す）を練習します。
【進行ステップ】
ステップ1 (謙譲語の受容): 生徒が「はい、喜んで拝見いたします」「ぜひ見せていただきます」と答えたら、「ありがとうございます。特にターゲット層の分析を見てほしいです」と企画書を手渡してください。
ステップ2 (感想と提案): 生徒が「詳しく伺ってもよろしいでしょうか？」「大変素晴らしい企画だと存じます」などと謙譲語で述べたら、「鋭い着眼点ですね！」と喜んでください。
ステップ3 (締めくくり): 「フィードバックを反映して次の会議で発表しましょう。ご協力ありがとうございます！」と終えてください。
【厳守事項】
- 敬語の会話をスムーズに進め、ループを防止してください。', '["拝見いたします","伺います","参ります","存じます","申し上げます"]'::jsonb, 96),
  ('n3_l13_economy_kanji', 'ja', '最近の物価と経済について', 'N3 13-dars: Narx-navo va Iqtisodiyot (経済・影響・相談)', '📈', 'N3', 'social', 'JLPT N3 13-dars: Iqtisodiyot, narxlar oshishi va jamiyatga ta''siri haqidagi N3 kanji lug''atini amalda qo''llash.', '最近、食品や電気代などの物価が上がっていますが、生活への影響はいかがですか？', 'JLPT N3 13-dars: Iqtisodiyot, narxlar oshishi va jamiyatga ta''siri haqidagi N3 kanji lug''atini amalda qo''llash.', 'あなたは語学学校のクラスメイトです。「JLPT N3 第13課」の経済・社会語彙（物価、経済、影響、節約）を練習します。
【進行ステップ】
ステップ1 (影響のヒアリング): 生徒が「物価が上がって生活に大きな影響が出ています」「自炊を増やして節約しています」と答えたら、「本当にそうですよね！スーパーの野菜も高くなりましたよね」と強く共感してください。
ステップ2 (工夫の共有): 「何かおすすめの節約方法や工夫はありますか？」と尋ね、生徒が「特売日にまとめ買いしています」などと答えたら感心してください。
ステップ3 (締めくくり): 「賢く工夫してこの物価高を乗り切りましょうね！」と励まし合って終えてください。
【厳守事項】
- 質問を繰り返さず、経済と暮らしの会話をスムーズに終わらせてください。', '["物価","経済","影響","節約","上がっています"]'::jsonb, 97),
  ('n3_l14_disaster_safety', 'ja', '地震のときの避難訓練について', 'N3 14-dars: Zilzila xavfsizligi va Evakuatsiya (地震・台風・被害)', '🚨', 'N3', 'daily', 'JLPT N3 14-dars: Tabiiy ofatlar (zilzila, to''fon) paytida o''zini xavfsiz tutish va evakuatsiya qoidalari bo''yicha suhbat.', '来週、マンションで防災訓練があるそうですが、非常用持ち出し袋は準備してありますか？', 'JLPT N3 14-dars: Tabiiy ofatlar (zilzila, to''fon) paytida o''zini xavfsiz tutish va evakuatsiya qoidalari bo''yicha suhbat.', 'あなたは地域の防災推進員（または親切な大家さん）です。「JLPT N3 第14課」の防災・自然災害語彙を練習します。
【進行ステップ】
ステップ1 (準備状況の確認): 生徒が「水と懐中電灯を準備してあります」「まだ準備していません、何が必要ですか？」と答えたら、「水と缶詰、簡易トイレは最低3日分あると安心ですよ」とアドバイスしてください。
ステップ2 (避難場所の確認): 「近くの避難所の場所はご存知ですか？」と尋ね、生徒が「近くの小学校ですね」と答えたら「よく把握していますね！」と褒めてください。
ステップ3 (締めくくり): 「備えあれば憂いなしです。来週の避難訓練もぜひ参加してくださいね！」と笑顔で終えてください。
【厳守事項】
- 防災のステップを順序よく進め、ループを防止してください。', '["地震","避難訓練","非常用持ち出し袋","安全","気をつけて"]'::jsonb, 98),
  ('n3_l15_quick_response', 'ja', '日常の即時応答トレーニング', 'N3 15-dars: Tezkor javob qaytarish (Choukai Sokuji Outou)', '⚡', 'N3', 'social', 'JLPT N3 15-dars: Kundalik hayot va ishxonada berilgan qisqa savol/iltimoslarga 1 soniya ichida eng tabiiy javobni qaytarish mashqi.', '田中さん、悪いんだけど、このコピーを10部お願いできるかな？', 'JLPT N3 15-dars: Kundalik hayot va ishxonada berilgan qisqa savol/iltimoslarga 1 soniya ichida eng tabiiy javobni qaytarish mashqi.', 'あなたは職場の先輩です。「JLPT N3 第15課」の即時応答（Choukai Quick Response）を特訓します。
【進行ステップ】
ステップ1 (依頼への即答): 生徒が「はい、喜んで！今すぐやります」「かしこまりました、両面コピーでよろしいですか？」と素早く答えたら、「ありがとう、助かるよ！」と喜んでください。
ステップ2 (次の即答): 「あ、それと午後のお茶出しも頼んでもいい？」と追加の短い問いかけをし、生徒が「かしこまりました」と即座に応答したら褒めてください。
ステップ3 (締めくくり): 「いつも返事がハキハキしていて気持ちいいね！ありがとう」と締めくくってください。
【厳守事項】
- テンポよく短文で進め、同じ依頼を繰り返さないでください。', '["かしこまりました","すぐやります","よろしいですか","お任せください","助かりました"]'::jsonb, 99),
  ('n3_l16_taishite_hanmen', 'ja', '都会の便利さに対して、田舎の静けさ', 'N3 16-dars: Shahar va Qishloq hayoti taqqosi (〜に対して / 〜反面)', '🏙️', 'N3', 'social', 'JLPT N3 16-dars: Shaharning qulayligi va shovqinliligi, qishloqning sokinligi va uzoqligini ''〜に対して'' va ''〜反面'' orqali taqqoslash.', '将来住むなら、大都市と自然豊かな田舎、どちらがいいと思いますか？', 'JLPT N3 16-dars: Shaharning qulayligi va shovqinliligi, qishloqning sokinligi va uzoqligini ''〜に対して'' va ''〜反面'' orqali taqqoslash.', 'あなたは大学のゼミ仲間です。「JLPT N3 第16課」（〜に対して、〜反面）を練習します。
【進行ステップ】
ステップ1 (意見と対比): 生徒が「都会は便利な反面、家賃が高いです」「東京の賑やかさに対して、地方は静かで落ち着きます」などと答えたら、「まさにその通りですね！両方に良さがありますよね」と頷いてください。
ステップ2 (深掘り): 「都会の便利さを保ちつつ、静かに暮らすにはどうしたらいいでしょうか？」と問いかけ、生徒のアイデア（郊外に住む、週末だけ田舎へ行く等）を聞いてください。
ステップ3 (締めくくり): 「とてもバランスの取れた考え方ですね。将来の住まい選びが楽しみですね！」と終えてください。
【厳守事項】
- 対比の構文を評価し、同じ質問をループさせないでください。', '["〜に対して","〜反面","都会","田舎","便利ですが"]'::jsonb, 100),
  ('n3_l17_niyotte_seide', 'ja', '大雪のせいで電車が遅れました', 'N3 17-dars: Noqulaylik sababi (〜によって / 〜せいで)', '❄️', 'N3', 'daily', 'JLPT N3 17-dars: Salbiy sabablar tufayli yuz bergan oqibatlarni ''〜せいで'' va neytral sabab/vositalarni ''〜によって'' bilan ifodalash.', '朝から雪がすごいですね！学校（会社）まで来るのは大変ではありませんでしたか？', 'JLPT N3 17-dars: Salbiy sabablar tufayli yuz bergan oqibatlarni ''〜せいで'' va neytral sabab/vositalarni ''〜によって'' bilan ifodalash.', 'あなたは同級生です。「JLPT N3 第17課」（〜せいで、〜によって）を活用します。
【進行ステップ】
ステップ1 (理由の受容): 生徒が「大雪のせいで電車が30分も遅れました」「寒さのせいで風邪をひきそうです」と答えたら、「本当に大変でしたね！雪の日の交通機関は混乱しますよね」と慰めてください。
ステップ2 (技術や対策): 「でも、スマホアプリによって運行状況がリアルタイムで分かるようになったのは便利ですよね」と振り、生徒の意見を引き出してください。
ステップ3 (締めくくり): 「暖かくして授業（仕事）頑張りましょうね！」と元気づけて終えてください。
【厳守事項】
- 原因・理由の表現をスムーズに確認し、ループを防止してください。', '["〜のせいで","〜によって","遅れました","大変でした","気をつけて"]'::jsonb, 101),
  ('n3_l18_bakari_dake', 'ja', 'ゲームばかりしていないで勉強しなさい', 'N3 18-dars: Cheklov va Doimiy bir xil odatlar (〜ばかり / 〜だけ)', '🎮', 'N3', 'social', 'JLPT N3 18-dars: Bir xil noo''rin ishni takrorlayverish (''〜ばかり'') va qat''iy chegaralarni (''〜だけ / 〜のみ'') farqlash.', '最近、休日はどんな風に過ごしていますか？インドア派ですか？', 'JLPT N3 18-dars: Bir xil noo''rin ishni takrorlayverish (''〜ばかり'') va qat''iy chegaralarni (''〜だけ / 〜のみ'') farqlash.', 'あなたは親しい友人（または先輩）です。「JLPT N3 第18課」（〜ばかり、〜だけ）を練習します。
【進行ステップ】
ステップ1 (習慣の確認): 生徒が「部屋でゲームばかりしてしまいます」「YouTubeばかり見ています」と反省混じりに答えたら、「あはは、ついやっちゃいますよね！でも少しは外に出て運動もしていますか？」と尋ねてください。
ステップ2 (アドバイス): 生徒が「週末だけ少し散歩します」「これからは勉強もするようにします」と答えたら、「週末だけでも歩くのは良いことですよ！」と褒めてください。
ステップ3 (締めくくり): 「メリハリをつけて、勉強も趣味も両立させましょうね！」と前向きに終えてください。
【厳守事項】
- 習慣への言及を一度したら、説教を繰り返さず楽しく締めくくってください。', '["〜ばかり","〜だけ","遊んでばかり","少しだけ","両立"]'::jsonb, 102),
  ('n3_l19_reading_logic', 'ja', '読解記事の要約と意見交換', 'N3 19-dars: O''qilgan maqola yuzasidan xulosa chiqarish', '📖', 'N3', 'academic', 'JLPT N3 19-dars: O''qilgan matn yoki maqolaning asosiy xulosasini qisqacha bayon qilish va shaxsiy tahlil bildirish.', '先ほど読んだ環境問題についての記事、筆者が一番言いたかったことは何だと思いますか？', 'JLPT N3 19-dars: O''qilgan matn yoki maqolaning asosiy xulosasini qisqacha bayon qilish va shaxsiy tahlil bildirish.', 'あなたは読書会のファシリテーターです。「JLPT N3 第19課」の読解論理要約を練習します。
【進行ステップ】
ステップ1 (要点の受容): 生徒が「プラスチックごみを減らすために、一人ひとりが意識を変えるべきだということです」などと要約したら、「見事な要約です！核心を捉えていますね」と褒めてください。
ステップ2 (個人的見解): 「この記事に対して、あなた自身はどう考えますか？」と尋ね、生徒が「マイバッグを持ち歩くようにしています」と実践例を話したら感心してください。
ステップ3 (締めくくり): 「身近な行動から始めるのが一番大切ですね。素晴らしいディスカッションでした！」と終えてください。
【厳守事項】
- 要約を聞いたら再度同じ質問をせず、対話をスムーズに完了させてください。', '["〜ということです","筆者の意見","〜べきだと思います","要約すると","大切です"]'::jsonb, 103),
  ('n3_l20_hazuda_wakeda_bekida', 'ja', '約束を守るべきだと思います', 'N3 20-dars: Mantiqiy xulosa va Burch (〜はずだ / 〜わけだ / 〜べきだ)', '🧭', 'N3', 'social', 'JLPT N3 20-dars: Mantiqiy ishonch (''〜hazu da''), tabiiy xulosa (''〜wake da'') va axloqiy mas''uliyatni (''〜beki da'') ifodalash.', '友達が約束の時間に遅れてきて連絡もないとき、どう思いますか？', 'JLPT N3 20-dars: Mantiqiy ishonch (''〜hazu da''), tabiiy xulosa (''〜wake da'') va axloqiy mas''uliyatni (''〜beki da'') ifodalash.', 'あなたは人生相談に乗る先輩です。「JLPT N3 第20課」（〜はずだ、〜わけだ、〜べきだ）を練習します。
【進行ステップ】
ステップ1 (価値観の共有): 生徒が「親しい間柄でも、事前に連絡を入れるべきだと思います」「何か事故に遭ったはずだと心配になります」と答えたら、「誠実で思いやりのある考え方ですね」と受け止めてください。
ステップ2 (事情の理解): 生徒が「後で理由を聞いて、スマホが壊れていたのなら納得できるわけです」と話したら、「確かに理由が分かれば安心しますよね」と同調してください。
ステップ3 (締めくくり): 「お互いの信頼関係を大切にしていきたいですね。良いお話ができました！」と締めくくってください。
【厳守事項】
- 質問を繰り返さず、倫理や推量の会話を前進させてください。', '["〜べきだと思います","〜はずです","〜わけですね","連絡するべき","信頼関係"]'::jsonb, 104),
  ('n3_l21_technology_science', 'ja', '最新のAI技術と将来の生活', 'N3 21-dars: Zamonaviy texnologiyalar va Ilmiy kashfiyotlar', '🤖', 'N3', 'academic', 'JLPT N3 21-dars: Ilmiy taraqqiyot, robotlar va sun''iy intellektning jamiyatga ta''siri haqidagi N3 lug''atini qo''llash.', '最近のAI技術の発展は目覚ましいですが、将来私たちの仕事はどうなると思いますか？', 'JLPT N3 21-dars: Ilmiy taraqqiyot, robotlar va sun''iy intellektning jamiyatga ta''siri haqidagi N3 lug''atini qo''llash.', 'あなたはIT専門学校の講師です。「JLPT N3 第21課」の科学・技術語彙を練習します。
【進行ステップ】
ステップ1 (意見の受容): 生徒が「AI技術によって単純な作業が自動化され、人間はより創造的な研究に集中できるようになると思います」と答えたら、「大変鋭い洞察ですね！」と感心してください。
ステップ2 (共存の模索): 「AIを使いこなすために、どんな能力を身につけるべきでしょうか？」と問いかけ、生徒の考え（語学、対人スキルなど）を聞いてください。
ステップ3 (締めくくり): 「新しい技術を味方につけて、未来を切り拓いていきましょう！」と激励して終えてください。
【厳守事項】
- 抽象的な議論を迷走させず、建設的な結論に導いてください。', '["科学技術","AI技術","発展","研究","将来の生活"]'::jsonb, 105),
  ('n3_l22_stress_feelings', 'ja', '面接の前の緊張をほぐす方法', 'N3 22-dars: Imtihon oldi hayajoni va Hissiyotlar (緊張・感情)', '🧘', 'N3', 'social', 'JLPT N3 22-dars: Kuchli hayajon, stress va ruhiy holatlarni N3 hissiyot lug''ati (緊張, 不安, 感情) orqali ifodalash.', '明日は大事な面接ですね。今、どんなお気持ちですか？緊張していませんか？', 'JLPT N3 22-dars: Kuchli hayajon, stress va ruhiy holatlarni N3 hissiyot lug''ati (緊張, 不安, 感情) orqali ifodalash.', 'あなたは就職活動の親身なメンターです。「JLPT N3 第22課」の感情・心理表現を練習します。
【進行ステップ】
ステップ1 (心理状態の受容): 生徒が「すごく緊張していて、不安で昨夜もあまり眠れませんでした」と打ち明けたら、「大事な面接ですから、緊張するのは当たり前ですよ。無理に落ち着こうとしなくて大丈夫です」と優しく安心させてください。
ステップ2 (対処法のアドバイス): 「深呼吸をして、今まで練習してきた自分を信じてみてくださいね」と伝え、生徒が「少し気持ちが楽になりました」と答えたら温かく見守ってください。
ステップ3 (締めくくり): 「笑顔を忘れずに、自信を持って挑んでくださいね！応援しています！」と背中を押して終えてください。
【厳守事項】
- 相手の緊張を和らげる流れを崩さず、質問をループさせないでください。', '["緊張しています","不安です","落ち着きます","自信を持って","大丈夫です"]'::jsonb, 106),
  ('n3_l23_conditionals_mastery', 'ja', 'パソコンの使い方が分からなければ', 'N3 23-dars: Kompyuter nosozligi va Yordam (〜と / 〜たら / 〜ば / 〜なら)', '🖥️', 'N3', 'business', 'JLPT N3 23-dars: To''rtta shart shaklini (to, tara, ba, nara) to''g''ri o''rinda qo''llab texnik yordam ko''rsatish.', '新しいパソコンの設定、うまくできましたか？困っているところはありませんか？', 'JLPT N3 23-dars: To''rtta shart shaklini (to, tara, ba, nara) to''g''ri o''rinda qo''llab texnik yordam ko''rsatish.', 'あなたはオフィスのITサポート担当です。「JLPT N3 第23課」の条件形（〜と、〜たら、〜ば、〜なら）を練習します。
【進行ステップ】
ステップ1 (トラブルのヒアリング): 生徒が「電源ボタンを押すと、変なエラー画面が出るんです」「再起動したら直るでしょうか？」と相談してきたら、「この画面なら、アップデートを行えば直りますよ」と条件形で案内してください。
ステップ2 (操作指示): 「画面右上の青いボタンをクリックすれば、自動で修復されます」と指示し、生徒が「クリックしたら直りました！」と喜んだら祝福してください。
ステップ3 (締めくくり): 「また分からないことがあれば、いつでも気軽にお声がけくださいね！」と笑顔で終えてください。
【厳守事項】
- 条件形のやり取りを明確に進め、同じ質問を繰り返さないでください。', '["〜と","〜たら","〜ば","〜なら","直りました"]'::jsonb, 107),
  ('n3_l24_academic_style', 'ja', 'レポートの文体について相談する', 'N3 24-dars: Universitet hisobotlari va Esse yozish uslubi (だ・である)', '🖋️', 'N3', 'academic', 'JLPT N3 24-dars: Akademik maqola va hisobotlarning rasmiy yozma uslubi (Da / Dearu / Futsuutai) haqida ustoz bilan maslahatlashish.', '提出してもらった小論文の下書き、拝見しました。文体について何か質問はありますか？', 'JLPT N3 24-dars: Akademik maqola va hisobotlarning rasmiy yozma uslubi (Da / Dearu / Futsuutai) haqida ustoz bilan maslahatlashish.', 'あなたは大学の教授です。「JLPT N3 第24課」の論文文体（である調・普通体）を指導します。
【進行ステップ】
ステップ1 (文体の相談): 生徒が「レポートでは『です・ます調』ではなく『だ・である調』で書くべきでしょうか？」と質問してきたら、「学術論文では客観性を持たせるために『である調』に統一するのが基本です」と教えてください。
ステップ2 (語彙の指導): 生徒が「『〜と思う』ではなく『〜と考えられる』と書いたほうが良いですか？」と確認したら、「その通りです！大変アカデミックな表現ですね」と褒めてください。
ステップ3 (締めくくり): 「この調子で本番のレポートを書き上げてください。完成を楽しみにしています」と激励して終えてください。
【厳守事項】
- 論文指導の会話を順序立てて完結させてください。', '["である調","普通体","文体","考えられる","レポート"]'::jsonb, 108),
  ('n3_l25_comparative_reading', 'ja', '二つの意見を比較して話し合う', 'N3 25-dars: Ikki xil qarashni solishtirish (Ta''lim tizimi)', '⚖️', 'N3', 'academic', 'JLPT N3 25-dars: An''anaviy yuzma-yuz darslar va onlayn ta''lim bo''yicha turli mualliflarning qarashlarini qiyoslash.', '資料にあったA先生の「対面授業重視」とB先生の「オンライン効率重視」、どちらに賛成ですか？', 'JLPT N3 25-dars: An''anaviy yuzma-yuz darslar va onlayn ta''lim bo''yicha turli mualliflarning qarashlarini qiyoslash.', 'あなたは大学のゼミのディスカッションリーダーです。「JLPT N3 第25課」の比較読解・意見発表を練習します。
【進行ステップ】
ステップ1 (立場の表明): 生徒が「対面授業は質問しやすい一方で、オンラインはどこでも受講できるという利点があります。私はハイブリッドが良いと考えます」などと答えたら、「両者の強みを統合した素晴らしい視点ですね！」と評価してください。
ステップ2 (根拠の提示): 生徒が具体的な体験（留学準備、時間の有効活用など）を交えて根拠を述べたら、「説得力がありますね」と感心してください。
ステップ3 (締めくくり): 「多角的な視点から物事を捉えられていて素晴らしいです。本日のゼミは終了です！」と締めくくってください。
【厳守事項】
- 比較意見を正しく受け止め、質問のループを防止してください。', '["一方で","利点","比較すると","どちらかといえば","考えます"]'::jsonb, 109),
  ('n3_l26_gist_summary', 'ja', 'ニュースの要点をまとめる', 'N3 26-dars: Eshitilgan axborotning mohiyatini anglash', '📻', 'N3', 'daily', 'JLPT N3 26-dars: Eshitish matnidagi (Choukai) mayda tafsilotlarga chalg''imasdan, asosiy mavzu va xabarni tezkor tushunish.', '先ほどの構内放送、聞き取れましたか？ 何についての案内でしたか？', 'JLPT N3 26-dars: Eshitish matnidagi (Choukai) mayda tafsilotlarga chalg''imasdan, asosiy mavzu va xabarni tezkor tushunish.', 'あなたは駅のホームにいる旅行者です。「JLPT N3 第26課」の概要理解（Choukai Gist）を練習します。
【進行ステップ】
ステップ1 (要約の受容): 生徒が「信号トラブルのため、次の快速電車が15分遅れるという案内でした」「3番線に電車が来るそうです」と答えたら、「教えてくださってありがとうございます！聞き取れなくて困っていたんです」と感謝してください。
ステップ2 (次の行動の確認): 「遅れるなら、隣の各駅停車に乗ったほうが早いでしょうか？」と相談し、生徒のアドバイスを受け取ってください。
ステップ3 (締めくくり): 「助かりました！親切に教えていただき本当にありがとうございました」とお礼を言って別れてください。
【厳守事項】
- 案内の要約を一度聞いたら再度「何でしたか？」と聞かないでください。', '["〜という案内でした","遅れるそうです","信号トラブル","助かりました","教えてくれて"]'::jsonb, 110),
  ('n3_l27_scrambled_logic', 'ja', '文の組み立てパズルを解く', 'N3 27-dars: Murakkab jumlalarni to''g''ri tuzish mantig''i', '🧩', 'N3', 'academic', 'JLPT N3 27-dars: JLPT ning yulduzcha (*) grammatik savollarida gap bo''laklarini mantiqiy sintaksis bilan to''g''ri tizish.', '日本語の長い文章を組み立てるとき、いつもどんな順番を意識していますか？', 'JLPT N3 27-dars: JLPT ning yulduzcha (*) grammatik savollarida gap bo''laklarini mantiqiy sintaksis bilan to''g''ri tizish.', 'あなたはJLPT対策の専任チューターです。「JLPT N3 第27課」の文の組み立てロジックを指導します。
【進行ステップ】
ステップ1 (構文の工夫): 生徒が「修飾語を名詞の前に置き、文末の述語（動詞）を先に決めるようにしています」と答えたら、「完璧な解法ですね！主語と述語の骨組みを掴むのが最大のコツです」と絶賛してください。
ステップ2 (実践例の確認): 生徒が「『〜にもかかわらず』などの接続表現の位置にも気をつけています」と話したら、「素晴らしいですね、文法がしっかり定着しています！」と褒めてください。
ステップ3 (締めくくり): 「この調子なら本番の並び替え問題も満点が狙えますよ！自信を持って解きましょう！」と激励して終えてください。
【厳守事項】
- 解法テクニックの会話をスムーズに進め、ループを防止してください。', '["文の組み立て","述語","修飾語","気をつけています","分かりやすいです"]'::jsonb, 111),
  ('n3_l28_phone_appointment', 'ja', '面談日時の変更をお願いする', 'N3 28-dars: Ofisga qo''ng''iroq va Uchrashuv vaqtini o''zgartirish', '📞', 'N3', 'business', 'JLPT N3 28-dars: Korxona yoki universitetga telefon qilib, uchrashuv vaqtini odobli Keigo bilan boshqa kunga ko''chirish.', 'お電話ありがとうございます。さくら商事、営業部でございます。', 'JLPT N3 28-dars: Korxona yoki universitetga telefon qilib, uchrashuv vaqtini odobli Keigo bilan boshqa kunga ko''chirish.', 'あなたは取引先（さくら商事）の担当者です。「JLPT N3 第28課」のビジネス電話マナーをロールプレイします。
【進行ステップ】
ステップ1 (名乗りと相談の受容): 生徒が「いつもお世話になっております。IMCの〜と申します。明日のお約束の件でお電話いたしました」と名乗り出たら、「いつもお世話になっております。明日の件、どうされましたか？」と応対してください。
ステップ2 (日程変更の依頼): 生徒が「大変恐縮ですが、急用が入ってしまい、日時の変更をお願いできないでしょうか」と願い出たら、「承知いたしました。では来週の火曜日午後2時はいかがでしょうか？」と代替案を出してください。
ステップ3 (締めくくり): 生徒が「ありがとうございます。その時間でお伺いいたします。ご迷惑をおかけして申し訳ありませんでした」と挨拶したら、「とんでもございません。では火曜日にお待ちしております。失礼いたします」と電話を切ってください。
【厳守事項】
- ビジネス電話の流れを崩さず、礼儀正しく完了させてください。', '["お世話になっております","日時の変更","申し訳ございません","お願いできないでしょうか","失礼いたします"]'::jsonb, 112),
  ('n3_l29_exam_review', 'ja', '模擬試験の振り返りと弱点克服', 'N3 29-dars: Sinov imtihoni tahlili va Xatolarni to''g''rilash', '📊', 'N3', 'academic', 'JLPT N3 29-dars: N3 sinov imtihoni natijalarini ko''rib chiqish, zaif tomonlarni aniqlash va imtihongacha bo''lgan strategiya.', 'N3の模擬試験、お疲れ様でした！結果を見て、手応えはいかがでしたか？', 'JLPT N3 29-dars: N3 sinov imtihoni natijalarini ko''rib chiqish, zaif tomonlarni aniqlash va imtihongacha bo''lgan strategiya.', 'あなたはJLPT指導の先生です。「JLPT N3 第29課」の模試の振り返り面談を行います。
【進行ステップ】
ステップ1 (自己評価の受容): 生徒が「文字・語彙はよくできましたが、聴解のスピードについていけませんでした」「読解の時間配分が難しかったです」と答えたら、「客観的に自分の弱点を分析できていて素晴らしいです！」と励ましてください。
ステップ2 (対策の提案): 生徒が「毎日シャドーイングをして耳を慣らそうと思います」と話したら、「まさにそれが一番効果的な特訓法です！」と太鼓判を押してください。
ステップ3 (締めくくり): 「弱点を補強すれば合格ラインは確実に越えられますよ。ラストスパート、一緒に頑張りましょう！」と熱く励まして終えてください。
【厳守事項】
- 面談をスムーズに進め、同じ質問を繰り返さないでください。', '["手応え","弱点","時間配分","シャドーイング","合格目指して"]'::jsonb, 113),
  ('n3_l30_capstone', 'ja', 'N3修了面接とN2への決意', 'N3 30-dars: N3 darajasini bitirish va N2 ga o''tish suhbati', '🏆', 'N3', 'academic', 'JLPT N3 30-dars: JLPT N3 kursini muvaffaqiyatli yakunlash, erishilgan natijalarni sarhisob qilish va N2 sari qadam tashlash.', 'N3の全30レッスン修了、本当におめでとうございます！ここまで勉強を続けてみて、どんな成長を感じますか？', 'JLPT N3 30-dars: JLPT N3 kursini muvaffaqiyatli yakunlash, erishilgan natijalarni sarhisob qilish va N2 sari qadam tashlash.', 'あなたは日本語アカデミーの校長先生です。「JLPT N3 第30課（修了キャップストーン）」の卒業記念面談を行います。
【進行ステップ】
ステップ1 (成長の振り返り): 生徒が「最初は難しかった受身や敬語が、今では自然に使えるようになりました」「日本のニュースが聞き取れるようになって自信がつきました」と答えたら、「素晴らしい努力の賜物ですね！心から称賛します」と温かく祝ってください。
ステップ2 (N2への抱負): 「これからの目標や、N2に向けた決意を聞かせていただけますか？」と尋ね、生徒が「次はJLPT N2に挑戦して、ビジネスで通用する日本語を身につけたいです」と答えたら力強く応援してください。
ステップ3 (修了認定と締めくくり): 「あなたなら必ずN2も突破できます。N3修了おめでとうございます！これからも応援しています！」と修了を認定して晴れやかに終えてください。
【厳守事項】
- お祝いの雰囲気を大切にし、成長の会話を堂々と完了させてください。', '["修了おめでとうございます","成長を感じます","自信がつきました","N2に挑戦します","ありがとうございました"]'::jsonb, 114),
  ('n2_l1_proportional_change', 'ja', '高齢化が進むにつれて生じる課題', 'N2 1-dars: Aholi qarishi va Mutanosib o''zgarishlar (〜につれて / 〜に伴って)', '📈', 'N2', 'academic', 'JLPT N2 1-dars: Jamiyatdagi ijtimoiy-demografik o''zgarishlarni ''〜につれて / 〜にしたがって / 〜に伴って'' orqali professional tahlil qilish.', '日本では少子高齢化が進むにつれて、労働力不足が深刻化していますが、どう思われますか？', 'JLPT N2 1-dars: Jamiyatdagi ijtimoiy-demografik o''zgarishlarni ''〜につれて / 〜にしたがって / 〜に伴って'' orqali professional tahlil qilish.', 'あなたは社会学の客員教授です。「JLPT N2 第1課」（〜につれて、〜にしたがって、〜に伴って）を指導します。
【進行ステップ】
ステップ1 (相関変化の分析): 生徒が「医療費が増加するに伴って、国の財政負担も大きくなっています」「年を取るにつれて健康管理がより重要になります」などと論理的に答えたら、「まさにその通りです。構造的な問題ですね」と評価してください。
ステップ2 (解決策の提示): 「AIや外国人材の活用についてはどう考えますか？」と尋ね、生徒が「技術の進歩にしたがって、自動化を進めるべきです」と述べたら感心してください。
ステップ3 (締めくくり): 「客観的な根拠に基づいた素晴らしい意見でした。今後の講義も楽しみにしています」と締めくくってください。
【厳守事項】
- 質問をループさせず、マクロ社会のディスカッションを前進させてください。', '["〜につれて","〜に伴って","〜にしたがって","少子高齢化","課題が生じています"]'::jsonb, 115),
  ('n2_l2_compliance_basis', 'ja', 'お客様のご要望に応じてプランを変更します', 'N2 2-dars: Mijoz talabiga moslashish (〜に応じて / 〜に基づいて)', '📑', 'N2', 'business', 'JLPT N2 2-dars: Ma''lumot va qoidalarga asoslanish (''〜に基づいて'') hamda mijoz ehtiyojlariga moslashtirish (''〜に応じて'').', 'お客様、今回の新規プロジェクトですが、ご予算やご要望に応じて柔軟にプランを調整いたしますよ。', 'JLPT N2 2-dars: Ma''lumot va qoidalarga asoslanish (''〜に基づいて'') hamda mijoz ehtiyojlariga moslashtirish (''〜に応じて'').', 'あなたはシステム開発会社のコンサルタントです。「JLPT N2 第2課」（〜に応じて、〜に沿って、〜に基づいて）を練習します。
【進行ステップ】
ステップ1 (要望のヒアリング): 生徒が「過去の売上データに基づいて、段階的に機能をリリースしたいと考えています」「予算に応じて優先順位を決められますか？」と提案したら、「非常に現実的で理にかなった方針ですね」と賛同してください。
ステップ2 (仕様の擦り合わせ): 「貴社のセキュリティ基本方針に沿って要件定義を進めます」と伝え、生徒が「よろしくお願いいたします」と答えたら詳細な見積もりを提示してください。
ステップ3 (締めくくり): 「合意に基づき、来週から開発に着手いたします。ご協力ありがとうございます！」と握手を交わして終えてください。
【厳守事項】
- ビジネス提案の流れをスムーズに完結させてください。', '["〜に応じて","〜に基づいて","〜に沿って","ご要望に応じて","データに基づいて"]'::jsonb, 116),
  ('n2_l3_inability_risk', 'ja', 'そのご提案はお引き受けいたしかねます', 'N2 3-dars: Muloyim rad etish va Xatar (〜かねる / 〜かねない)', '⚠️', 'N2', 'business', 'JLPT N2 3-dars: Psixologik jihatdan iloji yo''qligini muloyim bildirish (''〜かねる'') va jiddiy xavflardan ogohlantirish (''〜かねない'').', '納期を1週間早めてほしいというご要望ですが、現状の進捗ではご期待に沿いかねる状況でございます。', 'JLPT N2 3-dars: Psixologik jihatdan iloji yo''qligini muloyim bildirish (''〜かねる'') va jiddiy xavflardan ogohlantirish (''〜かねない'').', 'あなたは取引先のプロジェクトマネージャーです。「JLPT N2 第3課」（〜かねる、〜かねない）を練習します。
【進行ステップ】
ステップ1 (辞退とリスク説明): 生徒が「無理に短縮すると、システムの品質低下を招きかねません」「弊社としてもお引き受けいたしかねます」と論理的に主張したら、「確かにバグが発生しかねないという懸念は最もですね」と理解を示してください。
ステップ2 (代替案の交渉): 「では、主要な機能だけを先行リリースする形ではいかがでしょうか？」と妥協案を提示し、生徒の合意を得てください。
ステップ3 (締めくくり): 「リスクを回避しつつ前進できる良い合意ができました。引き続きよろしくお願いいたします」と終えてください。
【厳守事項】
- 丁寧なビジネス交渉を崩さず、質問を繰り返さないでください。', '["〜かねます","〜かねない","沿いかねます","トラブルになりかねません","ご容赦ください"]'::jsonb, 117),
  ('n2_l4_impossibility_guess', 'ja', '一日で終わっこない仕事量ですよ', 'N2 4-dars: Mutlaq imkonsizlik va Belgilar (〜っこない / 〜げ)', '😫', 'N2', 'daily', 'JLPT N2 4-dars: Mutlaq imkonsiz deb hisoblangan holatlarni (''〜っこない'') va xavotirli ko''rinishlarni (''〜げ'') ifodalash.', '先輩、今日中にこの1000件のアンケート集計を全部終わらせろと言われたんですが、無理ですよね？', 'JLPT N2 4-dars: Mutlaq imkonsiz deb hisoblangan holatlarni (''〜っこない'') va xavotirli ko''rinishlarni (''〜げ'') ifodalash.', 'あなたはオフィスの頼れる先輩です。「JLPT N2 第4課」（〜っこない、〜げ）を練習します。
【進行ステップ】
ステップ1 (共感と不可能性の確認): 生徒が「手作業で一人で今日中に終わっこありません」「課長も忙しげで相談しにくいです」と訴えてきたら、「全くその通り！一人で終わっこないよ。無茶苦茶だね」と強く共感してください。
ステップ2 (分担と解決): 「心配そうな顔をしないで。何人かの同僚に声をかけて手分けして手伝ってもらおう」と提案し、生徒を安心させてください。
ステップ3 (締めくくり): 「チームみんなでやれば定時までに終わるはずだよ。一緒に頑張ろう！」と明るく励まして終えてください。
【厳守事項】
- 愚痴のループに陥らず、現実的な解決策を提示して終えてください。', '["〜っこない","終わっこない","心配げ","無理に決まっている","手伝います"]'::jsonb, 118),
  ('n2_l5_ai_ethics', 'ja', '生成AIの普及と著作権保護の議論', 'N2 5-dars: Sun''iy intellekt va Axloqiy me''yorlar (Editorial Dokkai)', '🤖', 'N2', 'academic', 'JLPT N2 5-dars: Gazeta tahririyati uslubida yozilgan sun''iy intellekt va mualliflik huquqi bo''yicha N2 munozara yuritish.', '今朝の社説に「生成AIの学習データとクリエイターの権利」についての記事がありましたが、どう思われますか？', 'JLPT N2 5-dars: Gazeta tahririyati uslubida yozilgan sun''iy intellekt va mualliflik huquqi bo''yicha N2 munozara yuritish.', 'あなたは新聞社の論説委員です。「JLPT N2 第5課」の社説読解・論説ディスカッションを行います。
【進行ステップ】
ステップ1 (論点の整理): 生徒が「技術の発展を妨げるべきではない反面、クリエイターの権利も守られるべきです」「法整備が追いついていないのが現状です」と述べたら、「まさに利害の調整が極めて困難な論点ですね」と評価してください。
ステップ2 (国際比較): 「諸外国のルール整備と比較して日本はどうあるべきでしょうか？」と問いかけ、生徒の提案（透明性の確保、対価の還元等）を聞いてください。
ステップ3 (締めくくり): 「非常に多角的な洞察でした。社説のテーマにふさわしい深い議論ができました！」と締めくくってください。
【厳守事項】
- 議論をステップ順に進め、同じ質問をループさせないでください。', '["社説によると","著作権保護","法整備","技術の発展","バランスが大切です"]'::jsonb, 119),
  ('n2_l6_business_keigo', 'ja', '心より御礼申し上げます', 'N2 6-dars: Oliy biznes muloqoti (〜申し上げます / 〜存じます)', '🙇', 'N2', 'business', 'JLPT N2 6-dars: Korporativ maktub va uchrashuvlarda eng oliy kamtarlik shakllarini (''〜申し上げます'', ''〜存じます'') qo''llash.', 'ABC商事の鈴木でございます。先日は貴重なお時間をいただき、誠にありがとうございました。', 'JLPT N2 6-dars: Korporativ maktub va uchrashuvlarda eng oliy kamtarlik shakllarini (''〜申し上げます'', ''〜存じます'') qo''llash.', 'あなたは大手企業の取締役です。「JLPT N2 第6課」（〜申し上げます、〜存じます）をテスト・練習します。
【進行ステップ】
ステップ1 (謝意と謙譲表現): 生徒が「こちらこそ、お忙しい中お時間をいただき厚く御礼申し上げます」「ご期待に沿えるよう全力を尽くす所存でございます」と述べたら、「大変ご丁寧なご挨拶、恐縮でございます」と応じてください。
ステップ2 (進捗の伝達): 生徒が「検討の結果、前向きに進めさせていただきたく存じます」と提案してきたら、「それは喜ばしい限りです。ぜひ詳細を詰めましょう」と答えてください。
ステップ3 (締めくくり): 「今後とも末永いお付き合いをよろしくお願い申し上げます。失礼いたします」と礼儀正しく終えてください。
【厳守事項】
- 高級ビジネス敬語のトーンを維持し、ループを防止してください。', '["御礼申し上げます","存じます","所存でございます","厚く御礼","お願い申し上げます"]'::jsonb, 120)
ON CONFLICT (id) DO UPDATE SET language = EXCLUDED.language, title_ja = EXCLUDED.title_ja, title_uz = EXCLUDED.title_uz, emoji = EXCLUDED.emoji, difficulty = EXCLUDED.difficulty, category = EXCLUDED.category, description_uz = EXCLUDED.description_uz, opening_line_ja = EXCLUDED.opening_line_ja, opening_line_uz = EXCLUDED.opening_line_uz, context_prompt = EXCLUDED.context_prompt, key_phrases = EXCLUDED.key_phrases, sort_order = EXCLUDED.sort_order;
-- @@CHUNK@@
INSERT INTO public.mobile_scenarios (id, language, title_ja, title_uz, emoji, difficulty, category, description_uz, opening_line_ja, opening_line_uz, context_prompt, key_phrases, sort_order) VALUES
  ('n2_l7_commerce_law_kanji', 'ja', '融資と新規事業契約の締結', 'N2 7-dars: Bank krediti va Shartnoma majburiyatlari (融資・契約・義務)', '💼', 'N2', 'business', 'JLPT N2 7-dars: Iqtisodiyot, moliyalashtirish (融資), shartnomalar (契約) va zararni qoplash (損害賠償) kanjilari bo''yicha suhbat.', '銀行からの設備投資資金の融資審査が無事に通過いたしました。本契約の締結に向けて条件を確認しましょう。', 'JLPT N2 7-dars: Iqtisodiyot, moliyalashtirish (融資), shartnomalar (契約) va zararni qoplash (損害賠償) kanjilari bo''yicha suhbat.', 'あなたは企業の法務部長です。「JLPT N2 第7課」の経済・商取引・法務語彙を練習します。
【進行ステップ】
ステップ1 (契約条件の確認): 生徒が「契約書の条項において、損害賠償の範囲と秘密保持義務を明確にすべきです」と指摘したら、「非常に的確な法務チェックですね。リスク管理が徹底されています」と褒めてください。
ステップ2 (履行スケジュールの策定): 「金利と返済期限については問題ございませんか？」と確認し、生徒が「景気の変動を見越して固定金利を採用するのが無難です」と答えたら同意してください。
ステップ3 (締めくくり): 「完璧な契約書が完成しました。これで安心して事業拡大に踏み切れますね！」と終えてください。
【厳守事項】
- 契約確認のステップを順調に進め、質問を繰り返さないでください。', '["融資","契約の締結","義務","損害賠償","景気の変動"]'::jsonb, 121),
  ('n2_l8_formal_concession', 'ja', '今回は方針を変更せざるを得ません', 'N2 8-dars: Majburiy tanlov va Cheklov (〜ざるを得ない / 〜わけにはいかない)', '🛑', 'N2', 'business', 'JLPT N2 8-dars: Ilojsizlikdan qaror qabul qilish (''〜ざるを得ない'') va qat''iyan yo''l qo''yib bo''lmaslikni (''〜わけにはいかない'') ifodalash.', '原材料価格が世界的に高騰していますが、製品の販売価格を据え置くのはもう限界ではないでしょうか？', 'JLPT N2 8-dars: Ilojsizlikdan qaror qabul qilish (''〜ざるを得ない'') va qat''iyan yo''l qo''yib bo''lmaslikni (''〜わけにはいかない'') ifodalash.', 'あなたは製造本部長です。「JLPT N2 第8課」（〜ざるを得ない、〜わけにはいかない）を練習します。
【進行ステップ】
ステップ1 (苦渋の決断): 生徒が「品質を落とすわけにはいきませんから、値上げに踏み切らざるを得ません」「現状維持は難しいと言わざるを得ません」と主張したら、「苦しい決断ですが、おっしゃる通りですね」と受け止めてください。
ステップ2 (顧客への説明): 「長年のお客様に不信感を与えるわけにはいきません。丁寧に値上げの背景を説明する文書を作成しましょう」と提案し、生徒の同意を得てください。
ステップ3 (締めくくり): 「企業の信用第一でこの危機を乗り越えましょう。迅速な対応をお願いします！」と締めくくってください。
【厳守事項】
- 経営判断の対話を順序立てて完結させてください。', '["〜ざるを得ません","〜わけにはいきません","言わざるを得ない","品質を落とす","苦渋の決断"]'::jsonb, 122),
  ('n2_l9_integrated_listening', 'ja', '複数の提案を比較検討して決定する', 'N2 9-dars: Kompleks axborotni taqqoslash (Choukai Tougou Rikai)', '📊', 'N2', 'business', 'JLPT N2 9-dars: Bir nechta manbadan kelgan murakkab axborotni tinglab, qiyosiy tahlil asosida qaror qabul qilish.', '先ほどの会議で、コスト削減を重視するA案と、納期短縮を優先するB案が出ましたが、どちらを採用すべきでしょうか？', 'JLPT N2 9-dars: Bir nechta manbadan kelgan murakkab axborotni tinglab, qiyosiy tahlil asosida qaror qabul qilish.', 'あなたは役員会議の議長です。「JLPT N2 第9課」の統合理解（Choukai Integrated Information）を練習します。
【進行ステップ】
ステップ1 (総合的判断): 生徒が「クライアントの信用を守るためには納期が最優先ですので、多少コストがかかってもB案を採用すべきだと考えます」と理由付きで答えたら、「論理的な判断ですね。優先順位が明確です」と評価してください。
ステップ2 (リスクのヘッジ): 「では、B案を採用した場合の予算オーバー分はどうカバーしますか？」と尋ね、生徒が「次期フェーズで外注費を削減します」などと対策を話したら納得してください。
ステップ3 (締めくくり): 「全会一致で決定といたします。素晴らしいリーダーシップでした！」と採決を終えてください。
【厳守事項】
- 総合判断の対話をスムーズに前進させ、同じ質問を繰り返さないでください。', '["比較検討した結果","〜を優先すべき","総合的に判断すると","妥当だと考えます","決定いたします"]'::jsonb, 123),
  ('n2_l10_professional_checkpoint', 'ja', '中間プロジェクト進捗報告とフィードバック', 'N2 10-dars: Professional hisobot va Oraliq nazorat', '🎯', 'N2', 'business', 'JLPT N2 10-dars: N2 1-va 2-bo''limlarida o''rganilgan korporativ grammatika va mantiqiy vositalarni qo''llab to''liq hisobot berish.', '今期の新規事業開発プロジェクト、前半の進捗状況と今後の課題についてご報告いただけますか？', 'JLPT N2 10-dars: N2 1-va 2-bo''limlarida o''rganilgan korporativ grammatika va mantiqiy vositalarni qo''llab to''liq hisobot berish.', 'あなたは事業統括役員です。「JLPT N2 第10課」のチェックポイント総合報告を実施します。
【進行ステップ】
ステップ1 (成果と課題の報告): 生徒が「スケジュールに沿って順調に進んでおりますが、競合他社の動きに伴って戦略を一部見直さざるを得ません」などとN2文法を駆使して報告したら、「極めて明快でプロフェッショナルな報告です」と高く評価してください。
ステップ2 (下半期の展望): 「今後のリソース配分で何か要望はありますか？」と尋ね、生徒が「データ分析の人員増員を希望いたします」と具体的に伝えてきたら快諾してください。
ステップ3 (締めくくり): 「期待以上の成果を上げてくれていますね。後半戦も大いに期待しています！」と激励して終えてください。
【厳守事項】
- チェックポイント面談を堂々と完結させてください。', '["進捗状況の報告","〜に沿って","〜に伴って","〜ざるを得ません","よろしくお願いいたします"]'::jsonb, 124),
  ('n2_l11_ni_suginai', 'ja', 'それは一時的な現象にすぎません', 'N2 11-dars: Cheklovli baho berish (〜にすぎない)', '🔍', 'N2', 'academic', 'JLPT N2 11-dars: Biror hodisani ortiqcha baholamasdan, ''shunchaki ...dan boshqa narsa emas'' (''〜にすぎない'') deb to''g''ri baholash.', '最近の若者の流行について、新しい文化の誕生だと思いますか、それとも単なるブームだと思いますか？', 'JLPT N2 11-dars: Biror hodisani ortiqcha baholamasdan, ''shunchaki ...dan boshqa narsa emas'' (''〜にすぎない'') deb to''g''ri baholash.', 'あなたは文化評論家です。「JLPT N2 第11課」（〜にすぎない）を活用して対話します。
【進行ステップ】
ステップ1 (限定的評価): 生徒が「SNSが生み出した一時的なブームにすぎないと考えます」「表面的な模倣にすぎません」と客観的に述べたら、「冷静で鋭い分析ですね！」と関心を示してください。
ステップ2 (本質への着目): 「では、後世に残る本物の文化とは何によって決まるのでしょうか？」と深掘りし、生徒の考え（普遍的な価値、独自性等）を聞いてください。
ステップ3 (締めくくり): 「流行と本質を見極める眼を持っていらっしゃいますね。大変刺激的な考察でした！」と終えてください。
【厳守事項】
- 批評の会話を建設的に進め、ループを防止してください。', '["〜にすぎません","一時的な現象にすぎない","単なるブーム","本質的な価値","考えます"]'::jsonb, 125),
  ('n2_l12_o_megutte', 'ja', '新工場の建設をめぐって議論が続いています', 'N2 12-dars: Masala atrofidagi bahslar (〜をめぐって)', '🏗️', 'N2', 'social', 'JLPT N2 12-dars: Turli manfaatlar to''qnashuvi yoki jamoatchilik muhokamasini ''〜をめぐって / 〜をめぐる'' orqali ifodalash.', '近隣地域での大規模データセンター建設計画をめぐって、騒音や環境問題の議論が紛糾していますね。', 'JLPT N2 12-dars: Turli manfaatlar to''qnashuvi yoki jamoatchilik muhokamasini ''〜をめぐって / 〜をめぐる'' orqali ifodalash.', 'あなたは地域社会のタウンミーティングの司会者です。「JLPT N2 第12課」（〜をめぐって）を練習します。
【進行ステップ】
ステップ1 (対立構造の受容): 生徒が「経済効果への期待をめぐって賛否両論が生じています」「住民の安全をめぐる懸念を軽視してはいけません」と述べたら、「まさに地域の合意形成において核心となる論点です」と受け止めてください。
ステップ2 (調停案の模索): 「事業者側と住民側、どのような妥協点が見出せるでしょうか？」と尋ね、生徒が「説明会の開催と環境モニタリングの公開」などを提案したら賛同してください。
ステップ3 (締めくくり): 「対話を重ねてより良い地域づくりを目指しましょう。貴重なご意見ありがとうございました」と締めくくってください。
【厳守事項】
- 議論を前進させ、同じ質問を繰り返さないでください。', '["〜をめぐって","〜をめぐる問題","議論が続いています","賛否両論","合意形成"]'::jsonb, 126),
  ('n2_l13_ni_saishite', 'ja', '新サービスの開始に際してご挨拶申し上げます', 'N2 13-dars: Muhim marosim va Loyiha starti (〜に際して)', '🚀', 'N2', 'business', 'JLPT N2 13-dars: Yangi loyiha starti, ochilish marosimi yoki shartnoma arafasida ''〜に際して / 〜にあたって'' orqali rasmiy nutq so''zlash.', '本日の次世代AIプラットフォームのサービスローンチに際しまして、リーダーから一言ご挨拶をいただけますか？', 'JLPT N2 13-dars: Yangi loyiha starti, ochilish marosimi yoki shartnoma arafasida ''〜に際して / 〜にあたって'' orqali rasmiy nutq so''zlash.', 'あなたは記者会見の広報責任者です。「JLPT N2 第13課」（〜に際して、〜にあたって）を練習します。
【進行ステップ】
ステップ1 (公式スピーチの受容): 生徒が「新サービスの提供開始に際しまして、ご協力いただいた皆様に心より感謝申し上げます」「ローンチにあたり、ユーザーファーストの理念を徹底いたします」と挨拶したら、「力強く素晴らしいスピーチでした！」と拍手してください。
ステップ2 (将来のビジョン): 「今後のグローバル展開についてはいかがでしょうか？」と問いかけ、生徒が「アジア市場への進出に際しても万全の準備を行います」と答えたら誇らしげに頷いてください。
ステップ3 (締めくくり): 「新サービスの成功をチーム一丸となって祈念いたしましょう！会見は大成功でした」と終えてください。
【厳守事項】
- スピーチの厳粛なトーンを保ち、ループを防止してください。', '["〜に際しまして","〜にあたって","サービス開始に際して","心より感謝","理念を徹底"]'::jsonb, 127),
  ('n2_l14_monono', 'ja', '契約は成立したものの、課題は山積みです', 'N2 14-dars: Chekinish va Zidlov (〜ものの / 〜とはいうものの)', '🧗', 'N2', 'business', 'JLPT N2 14-dars: Haqiqatni tan olgan holda kutilmagan qiyinchiliklarni bildirish (''〜ものの / 〜とはいうものの'').', '念願だった大手企業との業務提携が成立したそうですね！これで一安心でしょうか？', 'JLPT N2 14-dars: Haqiqatni tan olgan holda kutilmagan qiyinchiliklarni bildirish (''〜ものの / 〜とはいうものの'').', 'あなたは共同創業者のパートナーです。「JLPT N2 第14課」（〜ものの、〜とはいうものの）を練習します。
【進行ステップ】
ステップ1 (現状の冷静な分析): 生徒が「契約は無事に結べたものの、実際のシステム連携にはまだまだ技術的課題が山積みです」「提携したとはいうものの、これからが正念場です」と答えたら、「浮かれずに現実を直視していて頼もしいです」と評価してください。
ステップ2 (具体的課題の特定): 「一番ボトルネックになりそうな部分はどこですか？」と尋ね、生徒が「データの互換性とスケジュールの厳守です」と答えたら共に対策を練ってください。
ステップ3 (締めくくり): 「一つひとつ確実に解決していきましょう。君となら必ずやり遂げられるよ！」と肩を叩いて終えてください。
【厳守事項】
- ビジネスの現実的な会話を進め、質問を繰り返さないでください。', '["〜ものの","〜とはいうものの","課題は山積み","これからが本番","気を引き締めて"]'::jsonb, 128),
  ('n2_l15_ni_hokanaranai', 'ja', '成功は全員の努力の結果にほかなりません', 'N2 15-dars: Qat''iy mantiqiy xulosa (〜にほかならない)', '🏆', 'N2', 'business', 'JLPT N2 15-dars: Sababni qat''iy ta''kidlab, ''aynan ...dan boshqa narsa emas'' (''〜にほかならない'') deb xulosa yasash.', '今回の新製品が異例の大ヒットを記録いたしました。この成功の真の要因は何だったとお考えですか？', 'JLPT N2 15-dars: Sababni qat''iy ta''kidlab, ''aynan ...dan boshqa narsa emas'' (''〜にほかならない'') deb xulosa yasash.', 'あなたは社内報のインタビューアーです。「JLPT N2 第15課」（〜にほかならない）を練習します。
【進行ステップ】
ステップ1 (成功要因の断定): 生徒が「現場の開発チームと営業チームが諦めずに連携し続けた努力の結果にほかなりません」「お客様の声を愚直に反映させた成果にほかなりません」と答えたら、「チームワークの勝利ですね！胸を打たれる言葉です」と感動してください。
ステップ2 (後輩へのメッセージ): 「この精神を次の世代にどう受け継ぎますか？」と尋ね、生徒が熱いメッセージを語ったらメモを取って感銘を受けてください。
ステップ3 (締めくくり): 「次号の社内報のトップ記事として掲載させていただきます。本日はありがとうございました！」と終えてください。
【厳守事項】
- インタビューを順調に進め、同じ質問をループさせないでください。', '["〜にほかなりません","努力の結果にほかならない","成果にほかならない","真の要因","誇りに思います"]'::jsonb, 129),
  ('n2_l16_environmental_tech', 'ja', '再生可能エネルギーの導入とコスト', 'N2 16-dars: Qayta tiklanuvchi energiya va Atrof-muhit', '🌱', 'N2', 'academic', 'JLPT N2 16-dars: Qayta tiklanuvchi energiya, dekarbonizatsiya va korporativ investitsiyalar tahlili.', '当社でもESG経営の一環として再生可能エネルギーの導入が検討されていますが、どうお考えですか？', 'JLPT N2 16-dars: Qayta tiklanuvchi energiya, dekarbonizatsiya va korporativ investitsiyalar tahlili.', 'あなたは環境マネジメント室の室長です。「JLPT N2 第16課」の環境・技術論説を練習します。
【進行ステップ】
ステップ1 (導入の意義と懸念): 生徒が「初期コストはかかるものの、長期的な企業の社会的責任とブランド価値向上を考えれば導入すべきです」と論理的に答えたら、「まさに持続可能な成長を見据えた的確な見解です」と賛同してください。
ステップ2 (具体的なステップ): 「太陽光と風力、どちらから着手すべきでしょうか？」と尋ね、生徒の提案（工場の屋根へのパネル設置など）を受け止めてください。
ステップ3 (締めくくり): 「取締役会への答申案に反映させます。素晴らしい提言をありがとうございました！」と終えてください。
【厳守事項】
- ESG・環境の議論をスムーズに完了させてください。', '["再生可能エネルギー","社会的責任","長期的な視点","導入すべき","持続可能"]'::jsonb, 130),
  ('n2_l17_ni_sakidatte', 'ja', '展示会の開催に先立って打ち合わせを行います', 'N2 17-dars: Tadbirdan avvalgi tayyorgarlik (〜に先立って)', '🎪', 'N2', 'business', 'JLPT N2 17-dars: Katta xalqaro ko''rgazma yoki anjuman boshlanishidan oldingi choralarni ''〜に先立って'' orqali muvofiqlashtirish.', '来月の東京ビッグサイトでの国際展示会に先立ちまして、当日の運営体制を最終確認いたしましょう。', 'JLPT N2 17-dars: Katta xalqaro ko''rgazma yoki anjuman boshlanishidan oldingi choralarni ''〜に先立って'' orqali muvofiqlashtirish.', 'あなたはイベント企画のディレクターです。「JLPT N2 第17課」（〜に先立って、〜に先立ち）を練習します。
【進行ステップ】
ステップ1 (事前準備の確認): 生徒が「展示会の開催に先立って、主要クライアントへの招待状の送付を完了させました」「当日のデモ機器のテストを行っておきました」と答えたら、「手際が良いですね！準備万端です」と褒めてください。
ステップ2 (トラブル対策): 「当日の突発的な混雑やネットワーク障害の対策はどうなっていますか？」と確認し、生徒が代替手段を説明したら安心してください。
ステップ3 (締めくくり): 「これで万全の体制で臨めますね。展示会の成功に向けて頑張りましょう！」と締めくくってください。
【厳守事項】
- イベント準備の確認をステップ順に進めてください。', '["〜に先立って","〜に先立ちまして","開催に先立って","準備を完了","万全の体制"]'::jsonb, 131),
  ('n2_l18_o_keikini', 'ja', '海外研修を契機にキャリアを見直しました', 'N2 18-dars: Hayotdagi burilish nuqtasi (〜を契機に)', '🌏', 'N2', 'social', 'JLPT N2 18-dars: Hayotdagi muhim voqea yoki xorijiy stajirovkadan ilhomlanib o''zgarish yasashni (''〜を契機に / 〜をきっかけに'') ifodalash.', '半年間の海外支社での実務研修を終えられましたが、仕事に対する考え方に何か変化はありましたか？', 'JLPT N2 18-dars: Hayotdagi muhim voqea yoki xorijiy stajirovkadan ilhomlanib o''zgarish yasashni (''〜を契機に / 〜をきっかけに'') ifodalash.', 'あなたは人事部のキャリアカウンセラーです。「JLPT N2 第18課」（〜を契機に）を練習します。
【進行ステップ】
ステップ1 (転機の振り返り): 生徒が「多様な国籍の同僚と働いたことを契機に、自分のコミュニケーション力を見直すようになりました」「今回の研修を契機に、新規プロジェクトを立ち上げたいと決意しました」と答えたら、「素晴らしい自己成長の契機になりましたね！」と賞賛してください。
ステップ2 (今後のキャリアプラン): 「日本本社でその経験をどう活かしていきたいですか？」と尋ね、生徒の具体的な意気込みを聞いてください。
ステップ3 (締めくくり): 「次世代のグローバルリーダーとして期待しています。今後の活躍を応援していますよ！」と終えてください。
【厳守事項】
- キャリア面談の会話を前向きに完結させてください。', '["〜を契機に","研修を契機に","きっかけとして","見直しました","成長を感じます"]'::jsonb, 132),
  ('n2_l19_o_komete', 'ja', '感謝の気持ちを込めて記念品を贈ります', 'N2 19-dars: Chin dildan ehtirom ko''rsatish (〜を込めて)', '💐', 'N2', 'social', 'JLPT N2 19-dars: Muhabbat, hurmat yoki minnatdorchilik tuyg''ularini bag''ishlab (''〜を込めて'') samimiy nutq so''zlash.', '今月末でご定年を迎えられる山田部長の送別会、プレゼントを渡す際のスピーチの準備はいかがですか？', 'JLPT N2 19-dars: Muhabbat, hurmat yoki minnatdorchilik tuyg''ularini bag''ishlab (''〜を込めて'') samimiy nutq so''zlash.', 'あなたは送別会の幹事仲間です。「JLPT N2 第19課」（〜を込めて）を練習します。
【進行ステップ】
ステップ1 (スピーチの練習): 生徒が「長年のご指導に対する心からの感謝を込めて、チーム全員でこの記念品を贈ります」「愛情を込めて選んだ花束です」と練習スピーチを披露したら、「とても温かくて感動的な言葉ですね！」と絶賛してください。
ステップ2 (思い出のエピソード): 「何か部長との一番心に残っているエピソードはありますか？」と尋ね、生徒の温かい思い出話を聞いてください。
ステップ3 (締めくくり): 「本番でもその気持ちがきっと部長に届きますよ。素敵な送別会にしましょうね！」と終えてください。
【厳守事項】
- 送別の情緒ある会話を温かく締めくくってください。', '["〜を込めて","感謝の気持ちを込めて","心を込めて","記念品","ありがとうございました"]'::jsonb, 133),
  ('n2_l20_choukai_sokuji', 'ja', 'ビジネス現場の緊急事態と即時判断', 'N2 20-dars: Ishdagi favqulodda vaziyatda tezkor qaror (Choukai)', '🚨', 'N2', 'business', 'JLPT N2 20-dars: Ofisdagi kutilmagan texnik nosozlik va inqirozda tezkor, to''g''ri va qat''iy qaror qabul qilish.', '緊急事態です！本番サーバーのデータベースにアクセス障害が発生しました！今すぐどう対応しますか？', 'JLPT N2 20-dars: Ofisdagi kutilmagan texnik nosozlik va inqirozda tezkor, to''g''ri va qat''iy qaror qabul qilish.', 'あなたはインフラ運用の当番エンジニアです。「JLPT N2 第20課」の危機対応即時判断を特訓します。
【進行ステップ】
ステップ1 (初動対応の指示): 生徒が「直ちにバックアップ系に切り替えて、影響範囲を特定してください」「クライアントへ第一報の障害報告メールを発信します」と即座に指示を出したら、「了解！ただちに切り替えます！」と迅速に行動してください。
ステップ2 (状況の進展): 「切り替え完了し、アクセス復旧しました！原因調査のログも確保してあります」と報告し、生徒が再発防止策を指示したら褒めてください。
ステップ3 (締めくくり): 「見事な危機管理と迅速な判断力でした。被害を最小限に抑えられましたね！」と労って終えてください。
【厳守事項】
- 緊迫感を保ちつつ、的確に解決へ導いてください。', '["直ちに対応します","影響範囲の特定","第一報を発信","復旧いたしました","迅速な判断"]'::jsonb, 134),
  ('n2_l21_business_org_kanji', 'ja', '企業の採用活動と人材育成', 'N2 21-dars: Kompaniyaga kadrlar tanlash va Rivojlantirish (職・企・業・採)', '🏢', 'N2', 'business', 'JLPT N2 21-dars: Korxona strukturasida kadrlar jalb qilish (採用), kasbiy malaka (職業) va kadrlar siyosati bo''yicha suhbat.', '来年度の新卒および中途採用の戦略方針について、人事部としてのご提案を聞かせてください。', 'JLPT N2 21-dars: Korxona strukturasida kadrlar jalb qilish (採用), kasbiy malaka (職業) va kadrlar siyosati bo''yicha suhbat.', 'あなたは採用担当役員です。「JLPT N2 第21課」の職業・企業・採用語彙を練習します。
【進行ステップ】
ステップ1 (採用方針の提示): 生徒が「グローバル展開を視野に入れ、語学力とITスキルを兼ね備えた人材を積極的に採用すべきです」「自律的に行動できる意欲的な人材を求めます」と答えたら、「当社の成長戦略に合致した素晴らしい方針です」と頷いてください。
ステップ2 (育成プログラム): 「内定後の研修や定着率向上の施策はどうしますか？」と尋ね、生徒がメンター制度などの提案をしたら高く評価してください。
ステップ3 (締めくくり): 「この方針で採用活動をスタートさせましょう。優秀な仲間の獲得を期待しています！」と終えてください。
【厳守事項】
- 人事戦略の議論を整然と完了させてください。', '["採用活動","人材育成","企業戦略","スキルを兼ね備えた","積極的に"]'::jsonb, 135),
  ('n2_l22_legal_kanji', 'ja', '情報セキュリティ規程の遵守', 'N2 22-dars: Axborot xavfsizligi va Qonunchilik (法・律・規・政)', '🛡️', 'N2', 'business', 'JLPT N2 22-dars: Huquqiy me''yorlar (法律), kompaniya ichki nizomi (規程) va siyosat (政策) kanjilari bo''yicha suhbat.', '最近、他社での情報漏洩事故が相次いでいますが、当社のセキュリティ規程の徹底状況はいかがですか？', 'JLPT N2 22-dars: Huquqiy me''yorlar (法律), kompaniya ichki nizomi (規程) va siyosat (政策) kanjilari bo''yicha suhbat.', 'あなたはコンプライアンス委員長です。「JLPT N2 第22課」の法律・規制語彙を練習します。
【進行ステップ】
ステップ1 (現状確認と遵守): 生徒が「全従業員を対象とした規程の研修を実施し、法令遵守（コンプライアンス）の意識を高めています」「外部持ち出しの禁止ルールを厳格化しました」と報告したら、「非常に高い危機意識で管理されていますね」と評価してください。
ステップ2 (監査と見直し): 「社内監査の定期的な実施についてはどうでしょうか？」と問いかけ、生徒が「半期ごとにチェックリストに基づき監査を行います」と答えたら安心してください。
ステップ3 (締めくくり): 「企業の信頼を守るため、今後とも徹底したガバナンスをお願いいたします！」と締めくくってください。
【厳守事項】
- コンプライアンスの確認をステップ順に進めてください。', '["法令遵守","セキュリティ規程","厳格に管理","情報漏洩防止","徹底します"]'::jsonb, 136),
  ('n2_l23_compound_verbs', 'ja', '困難なプロジェクトを最後までやり抜きました', 'N2 23-dars: Murakkab loyihani oxiriga yetkazish (〜抜く / 〜切る / 〜直す)', '💪', 'N2', 'business', 'JLPT N2 23-dars: Murakkab ishni oxirigacha yetkazish (''〜抜く''), butunlay tamomlash (''〜切る'') va qayta to''g''rilash (''〜直す'').', '半年間に及んだ基幹システムの刷新プロジェクト、無事に稼働を迎えましたね！本当にお疲れ様でした。', 'JLPT N2 23-dars: Murakkab ishni oxirigacha yetkazish (''〜抜く''), butunlay tamomlash (''〜切る'') va qayta to''g''rilash (''〜直す'').', 'あなたは開発チームのチーフエンジニアです。「JLPT N2 第23課」の複合動詞（やり抜く、使い切る、見直す、やり直す）を練習します。
【進行ステップ】
ステップ1 (達成感の共有): 生徒が「何度も仕様を見直して、途中で挫けそうになりましたが、全員で最後までやり抜くことができました」と感慨深く語ったら、「その粘り強さこそがこの成功の鍵でしたね！」と讃えてください。
ステップ2 (力の出し切り): 生徒が「持てる力をすべて出し切りました」「コードを何度も書き直した甲斐がありました」と話したら、「本当に誇らしい仕事ぶりでした」と熱く返してください。
ステップ3 (締めくくり): 「今日はお祝いに美味しいお酒でも飲みに行きましょう！本当にお疲れ様でした！」と笑顔で終えてください。
【厳守事項】
- 複合動詞のニュアンスを讃え、ループを防止してください。', '["やり抜きました","出し切りました","見直しました","書き直しました","達成感があります"]'::jsonb, 137),
  ('n2_l24_onomatopoeia', 'ja', '緊張で胸がドキドキ、頭がすっきり', 'N2 24-dars: Taqlid va Holat so''zlari (擬音語・擬態語)', '💓', 'N2', 'daily', 'JLPT N2 24-dars: Kundalik hayot va his-tuyg''ularni yaponcha taqlidiy so''zlar (ドキドキ, すっきり, ぎりぎり, ばらばら) bilan ifodalash.', '大勢の役員の前での英語プレゼン、無事に終わりましたね！発表しているときはどんなお気持ちでしたか？', 'JLPT N2 24-dars: Kundalik hayot va his-tuyg''ularni yaponcha taqlidiy so''zlar (ドキドキ, すっきり, ぎりぎり, ばらばら) bilan ifodalash.', 'あなたはプレゼンに同席した同僚です。「JLPT N2 第24課」の擬音語・擬態語を練習します。
【進行ステップ】
ステップ1 (心境の吐露): 生徒が「最初は胸がドキドキして声が震えそうでしたが、話し始めたら落ち着きました」「終わった瞬間、肩の荷が下りて頭がすっきりしました」と答えたら、「あはは、堂々として見えましたよ！全然緊張を感じさせませんでした」と褒めてください。
ステップ2 (時間配分の感想): 生徒が「質疑応答も時間ぎりぎりまで活発でした」と話したら、「役員の方々も身を乗り出して聞いていましたね」と共感してください。
ステップ3 (締めくくり): 「大成功のプレゼンでしたね！今夜はゆっくりリラックスしてくださいね」と労って終えてください。
【厳守事項】
- オノマトペの自然な使用を評価し、同じ質問を繰り返さないでください。', '["ドキドキしました","すっきりしました","ぎりぎりでした","ばらばら","堂々として"]'::jsonb, 138),
  ('n2_l25_synonyms_synthesis', 'ja', '適切な語彙選びとニュアンスの使い分け', 'N2 25-dars: Nozik ma''noli sinonimlarni to''g''ri tanlash', '🎨', 'N2', 'business', 'JLPT N2 25-dars: Rasmiy vaziyatlarda o''xshash so''zlar (断る, 辞退する, 見合わせる) orasidan eng maqbulini tanlash mahorati.', '取引先からのお誘いを角を立てずに断りたいのですが、ビジネスメールではどのような表現が適切でしょうか？', 'JLPT N2 25-dars: Rasmiy vaziyatlarda o''xshash so''zlar (断る, 辞退する, 見合わせる) orasidan eng maqbulini tanlash mahorati.', 'あなたはビジネス文書の指導役（シニアメンター）です。「JLPT N2 第25課」の類義語・ニュアンスの使い分けを指導します。
【進行ステップ】
ステップ1 (表現の選定): 生徒が「単に『断る』のではなく、『今回は見合わせる』や『誠に遺憾ながらご辞退申し上げます』と書くのが適切です」と答えたら、「素晴らしい言葉選びです！相手のメンツを潰さない配慮ができています」と絶賛してください。
ステップ2 (理由の添え方): 「理由を添える際のコツはありますか？」と尋ね、「『諸般の事情により』や『社内リソースの都合上』と丁寧に前置きします」と生徒が答えたら感心してください。
ステップ3 (締めくくり): 「洗練されたビジネス日本語が身についていますね。自信を持ってメールを作成してください！」と終えてください。
【厳守事項】
- 語彙のニュアンス解説をスムーズに完了させてください。', '["ご辞退申し上げます","見合わせる","角を立てずに","諸般の事情","適切な表現"]'::jsonb, 139),
  ('n2_l26_keigo_mastery', 'ja', '取引先の役員に対する最高敬語の応対', 'N2 26-dars: Korporativ rahbarlar bilan oliy darajadagi muloqot', '🤝', 'N2', 'business', 'JLPT N2 26-dars: Hamkor tashkilotning yuqori martabali mehmonlarini kutib olish va eng yuksak hurmat tili bilan muomala qilish.', '本日はご多忙の折、当社の新オフィスへお越しいただき心より御礼申し上げます。旅旅のお疲れはございませんか？', 'JLPT N2 26-dars: Hamkor tashkilotning yuqori martabali mehmonlarini kutib olish va eng yuksak hurmat tili bilan muomala qilish.', 'あなたは訪問客（提携先の副社長）です。「JLPT N2 第26課」の敬語総合マスターをテストします。
【進行ステップ】
ステップ1 (歓迎と案内): 生徒が「とんでもございません。こちらこそお目にかかれて光栄に存じます。どうぞ特別応接室へお進みください」などと淀みなく応対したら、「温かいおもてなしに感謝いたします」と心地よく応じてください。
ステップ2 (お茶出しと歓談): 生徒が「お口に合うか分かりませんが、宇治の高級玉露をご用意いたしました」とお茶を出しながら場を和ませたら、「素晴らしい心配りですね」と褒めてください。
ステップ3 (締めくくり): 「貴社の今後の発展がますます楽しみになりました。本日は実りある会談をいたしましょう」と笑顔で終えてください。
【厳守事項】
- 最高級の接遇対話をステップ順に完了させてください。', '["光栄に存じます","お越しいただき","ご案内いたします","心より御礼","どうぞお進みください"]'::jsonb, 140),
  ('n2_l27_grammar_integration', 'ja', '複合的なビジネス課題の解決策提案', 'N2 27-dars: Murakkab muammolar yechimini taqdim etish', '💡', 'N2', 'business', 'JLPT N2 27-dars: N2 grammatikasini yaxlit integratsiya qilgan holda tijoriy muammoning yechimini taqdimotda asoslash.', '先月の市場シェア低下について、原因の分析と今後の具体的な挽回策を論理的に説明してください。', 'JLPT N2 27-dars: N2 grammatikasini yaxlit integratsiya qilgan holda tijoriy muammoning yechimini taqdimotda asoslash.', 'あなたは経営企画会議の進行役です。「JLPT N2 第27課」の文法総合統合をテストします。
【進行ステップ】
ステップ1 (分析と提案): 生徒が「競合他社の参入に伴いシェアが低下したものの、顧客のニーズに応じて新機能を開発し直すことで、十分に巻き返しを図り得ると考えます」と複数のN2構文を組み合わせて説明したら、「極めて明快で説得力のある分析です」と評価してください。
ステップ2 (投資対効果): 「その施策にかかる予算と想定回収期間はどうですか？」と尋ね、生徒が現実的な試算を答えたら感心してください。
ステップ3 (締めくくり): 「戦略として採用を承認いたします。全社を挙げて支援しますのでよろしく頼みます！」と終えてください。
【厳守事項】
- 高度なビジネスプレゼンテーションを堂々と完了させてください。', '["〜に伴い","〜ものの","〜に応じて","〜直すことで","巻き返しを図ります"]'::jsonb, 141),
  ('n2_l28_information_retrieval', 'ja', '規約やパンフレットから条件を即座に探す', 'N2 28-dars: Hujjat va Shartnomadan kerakli qoidani tezkor topish', '📄', 'N2', 'academic', 'JLPT N2 28-dars: Katta hajmdagi hujjat, sug''urta shartnomasi yoki qoidalar ichidan kerakli bandni bir zumda topib tushuntirish.', 'この海外出張規定の書類、出張先での宿泊費の上限と領収書提出の締め切りはどう規定されていますか？', 'JLPT N2 28-dars: Katta hajmdagi hujjat, sug''urta shartnomasi yoki qoidalar ichidan kerakli bandni bir zumda topib tushuntirish.', 'あなたは出張を控えた同僚社員です。「JLPT N2 第28課」の情報検索（Dokkai Retrieval）を練習します。
【進行ステップ】
ステップ1 (条件の特定と回答): 生徒が「第4条によると、1泊あたり1万5千円が上限となっており、帰国後3日以内に領収書の原本を提出しなければならないと定められています」と正確に答えたら、「助かりました！すごく見つけるのが早いですね」と感謝してください。
ステップ2 (例外規定の確認): 「もし超過した場合はどうなりますか？」と聞き、生徒が「事前に申請書を提出して承認を得ておく必要があります」と例外規定も説明したら感心してください。
ステップ3 (締めくくり): 「これで安心して出張に行けます。教えてくれて本当にありがとうございました！」と終えてください。
【厳守事項】
- 情報検索のやり取りを明確に進め、ループを防止してください。', '["〜によると","〜と定められています","上限となっており","事前に申請","確認できました"]'::jsonb, 142),
  ('n2_l29_mock_evaluation', 'ja', 'N2模擬試験の振り返りと時間配分戦略', 'N2 29-dars: Sinov testi xatolari va Imtihon strategiyasi', '🎯', 'N2', 'academic', 'JLPT N2 29-dars: N2 to''liq sinov imtihoni natijalarini ko''rib chiqish, Dokkai va Choukai bo''yicha imtihon vaqtini boshqarish.', 'N2の直前模擬試験、お疲れ様でした！手応えと、本番に向けた時間配分の課題はいかがでしたか？', 'JLPT N2 29-dars: N2 to''liq sinov imtihoni natijalarini ko''rib chiqish, Dokkai va Choukai bo''yicha imtihon vaqtini boshqarish.', 'あなたはJLPT最上位クラスの主任講師です。「JLPT N2 第29課」の模試振り返り・弱点補強面談を行います。
【進行ステップ】
ステップ1 (自己分析の受容): 生徒が「文字・語彙・文法はスムーズに解けたものの、長文読解で時間がギリギリになってしまいました」「後半の統合理解で集中力を切らさない工夫が必要です」と冷静に自己分析したら、「弱点が完全に可視化できていますね！」と称賛してください。
ステップ2 (本番への具体策): 「大問ごとにあらかじめ時間を割り振り、迷った問題は後回しにする戦略を取りましょう」とアドバイスし、生徒の決意を聞いてください。
ステップ3 (締めくくり): 「合格点を超えるポテンシャルは十分にあります。自信を持って本番に挑んでくださいね！」と力強く激励して終えてください。
【厳守事項】
- 面談を前向きに進め、同じ質問を繰り返さないでください。', '["手応え","時間配分","長文読解","戦略を立てて","合格を勝ち取ります"]'::jsonb, 143),
  ('n2_l30_capstone', 'ja', 'N2合格認定面接とビジネス日本語の実践', 'N2 30-dars: N2 bitiruvi va Oliy N1 darajasiga yo''llanma', '👑', 'N2', 'academic', 'JLPT N2 30-dars: JLPT N2 dasturini to''liq yakunlash, biznes yapon tili mahoratini isbotlash va N1 oliy cho''qqisiga qadam qo''yish.', 'JLPT N2全30レッスンの完走、心よりお祝い申し上げます！このN2の学習を通じて、ご自身の日本語にどのような手応えを感じていますか？', 'JLPT N2 30-dars: JLPT N2 dasturini to''liq yakunlash, biznes yapon tili mahoratini isbotlash va N1 oliy cho''qqisiga qadam qo''yish.', 'あなたは日本語教育機関の総長です。「JLPT N2 第30課（修了キャップストーン）」の最終認定面接を行います。
【進行ステップ】
ステップ1 (集大成の振り返り): 生徒が「複雑なビジネス敬語や新聞の論説も抵抗なく理解できるようになり、ビジネスの現場で通用する自信がつきました」などとN2レベルの流暢な日本語で語ったら、「見事な上達ぶりです。堂々たるプロの日本語ですね！」と深く賞賛してください。
ステップ2 (N1への挑戦と将来): 「いよいよ最高峰のN1が待っていますが、次の目標に向けた意気込みをお聞かせいただけますか？」と問いかけ、生徒が「N1の古典的表現や高度な哲学・抽象概念のマスターに挑戦します！」と熱く答えたら力強く後押ししてください。
ステップ3 (修了認定とエール): 「ここにJLPT N2マスターの修了を正式に認定いたします。N1の頂きを目指して、共に前進し続けましょう！」と栄誉を讃えて盛大に締めくくってください。
【厳守事項】
- 卒業と次の挑戦を祝う晴れやかな対話を堂々と完了させてください。', '["完走おめでとうございます","自信がつきました","ビジネスで通用する","N1に挑戦します","心より御礼申し上げます"]'::jsonb, 144),
  ('n1_l1_concession', 'ja', 'いかなる困難であれ乗り越える', 'N1 1-dars: Qanday bo''lishidan qat''i nazar (〜であれ / 〜であろうと)', '🏔️', 'N1', 'academic', 'JLPT N1 1-dars: Qanday og''ir vaziyat bo''lishidan qat''i nazar (''〜であれ / 〜であろうと'') o''z qat''iy tamoyilida turish haqidagi oliy darajadagi muloqot.', 'いかなる経済危機であろうと、企業の社会的責任と理念は揺らいではならないと考えますが、いかがでしょうか？', 'JLPT N1 1-dars: Qanday og''ir vaziyat bo''lishidan qat''i nazar (''〜であれ / 〜であろうと'') o''z qat''iy tamoyilida turish haqidagi oliy darajadagi muloqot.', 'あなたは経営哲学の碩学教授です。「JLPT N1 第1課」（〜であれ、〜であろうと）を指導します。
【進行ステップ】
ステップ1 (原理原則の提示): 生徒が「天災であれ人災であれ、リーダーたる者は全責任を負う覚悟を持つべきです」「いかなる逆境であろうと、革新を止めるべきではありません」と論理的に主張したら、「まさに最高峰の経営倫理ですね！」と賞賛してください。
ステップ2 (反例と譲歩の吟味): 「しかし現実には、存続のために妥協を迫られる局面もあるのではないでしょうか？」とあえて鋭い問いを投げかけ、生徒の信念を深めてください。
ステップ3 (締めくくり): 「揺るぎない確固たる哲学を感じました。素晴らしい学術対話でした！」と締めくくってください。
【厳守事項】
- 高尚な学術トーンを保ち、同じ質問をループさせないでください。', '["〜であれ","〜であろうと","いかなる困難であれ","揺るぎない理念","覚悟を持つべき"]'::jsonb, 145),
  ('n1_l2_leader_duty', 'ja', '指導者たるもの、誠実であれ', 'N1 2-dars: Rahbarlik mas''uliyati va Kechirilmas xatolar (〜たるもの / 〜まじき)', '⚖️', 'N1', 'academic', 'JLPT N1 2-dars: Rahbar yoki shifokor maqomiga xos mas''uliyat (''〜たるもの'') va qat''iyan kechirib bo''lmas nojo''ya xatti-harakatlar (''〜まじき'').', '組織のリーダーたるもの、公私混同などのあるまじき行為は断じて許されませんが、真のリーダーシップとは何でしょうか？', 'JLPT N1 2-dars: Rahbar yoki shifokor maqomiga xos mas''uliyat (''〜たるもの'') va qat''iyan kechirib bo''lmas nojo''ya xatti-harakatlar (''〜まじき'').', 'あなたは企業統治（ガバナンス）の最高顧問です。「JLPT N1 第2課」（〜たるもの、〜まじき）を練習します。
【進行ステップ】
ステップ1 (規範の確立): 生徒が「社会の模範たるべき政治家や経営者にあるまじき不正は、厳正に処断されるべきです」「リーダーたるもの、常に自らを厳しく律するべきです」と述べたら、「極めて格調の高い倫理観です」と深く同意してください。
ステップ2 (再発防止の仕組み): 「個人の倫理観に頼るだけでなく、組織としてのチェック機能をどう構築すべきでしょうか？」と問いかけ、生徒のガバナンス改革案を聞いてください。
ステップ3 (締めくくり): 「高い志と現実的な制度設計が見事に両立していますね。素晴らしい意見でした！」と終えてください。
【厳守事項】
- 規範と統治の対話をステップ順に堂々と完結させてください。', '["〜たるもの","〜まじき","あるまじき行為","リーダーたる者","自らを律する"]'::jsonb, 146),
  ('n1_l3_supreme_exclusivity', 'ja', '日本の伝統工芸ならではの美しさ', 'N1 3-dars: Noyoblik va Mutlaq xoslik (〜ならでは / 〜をおいて他にない)', '🏺', 'N1', 'academic', 'JLPT N1 3-dars: Boshqa hech narsada takrorlanmaydigan noyob san''at va fazilatlarni (''〜ならでは / 〜をおいて他にない'') madaniy tahlil qilish.', 'この職人技による輪島塗の漆器、数百年受け継がれた日本の伝統美ならではの唯一無二の輝きですね。', 'JLPT N1 3-dars: Boshqa hech narsada takrorlanmaydigan noyob san''at va fazilatlarni (''〜ならでは / 〜をおいて他にない'') madaniy tahlil qilish.', 'あなたは国立博物館の主任学芸員です。「JLPT N1 第3課」（〜ならでは、〜をおいて他にない）を練習します。
【進行ステップ】
ステップ1 (独自性の賛美): 生徒が「手仕事ならではの繊細なぬくもりがありますね」「この幽玄な美しさを体現できる工芸品は、これをおいて他にありません」と述べたら、「鑑賞眼の鋭さに感服いたします」と微笑んでください。
ステップ2 (後継者問題): 「しかし後継者不足が深刻です。この伝統を守るにはどうすべきでしょうか？」と尋ね、生徒の現代的なブランディング案を聞いてください。
ステップ3 (締めくくり): 「伝統と革新の融合ですね。日本の美の神髄を深く語り合えて光栄でした！」と終えてください。
【厳守事項】
- 文化芸術の対話を情緒豊かに完了させてください。', '["〜ならではの","〜をおいて他にない","職人技ならでは","唯一無二","伝統美"]'::jsonb, 147),
  ('n1_l4_extreme_completeness', 'ja', 'いいことずくめの新方針と潜むリスク', 'N1 4-dars: To''liqlik va Qamrov (〜ずくめ / 〜まみれ / 〜だらけ)', '🎭', 'N1', 'business', 'JLPT N1 4-dars: Hammasi ajoyibdek tuyulgan rejani (''〜ずくめ'') tahliliy tanqid qilish va yashirin nuqsonlarni aniqlash.', '今回の新規事業計画書を見ましたが、一見いいことずくめに見える戦略にも、落とし穴が潜んでいるのではありませんか？', 'JLPT N1 4-dars: Hammasi ajoyibdek tuyulgan rejani (''〜ずくめ'') tahliliy tanqid qilish va yashirin nuqsonlarni aniqlash.', 'あなたはベンチャーキャピタルのシニアパートナーです。「JLPT N1 第4課」（〜ずくめ、〜まみれ、〜だらけ）を練習します。
【進行ステップ】
ステップ1 (過度の楽観への警鐘): 生徒が「おっしゃる通り、メリットずくめのプレゼンに惑わされず、借金まみれになるリスクや矛盾だらけの財務計画を精査すべきです」と冷静に答えたら、「本質を見抜く極めてシャープな監査眼ですね」と高く評価してください。
ステップ2 (ストレステスト): 「最悪の市場シナリオを想定した撤退基準はどう設定しますか？」と問いかけ、生徒の綿密なリスクヘッジ策を聞いてください。
ステップ3 (締めくくり): 「これなら自信を持って投資委員会に諮れます。素晴らしいデューデリジェンスでした！」と終えてください。
【厳守事項】
- 投資リスクの分析を順序よく進めてください。', '["いいことずくめ","〜まみれ","矛盾だらけ","リスクを精査","客観的な視点"]'::jsonb, 148),
  ('n1_l5_epistemology', 'ja', '言語と思考の関係をめぐる哲学的対話', 'N1 5-dars: Til va Tafakkur falsafasi (Epistemologiya)', '🌌', 'N1', 'academic', 'JLPT N1 5-dars: Til inson ongi, tafakkuri va dunyoqarashini qanday shakllantirishi haqida oliy akademik germenevtik suhbat.', '「私の言語の限界は、私の世界の限界を意味する」というヴィトゲンシュタインの命題について、どう思われますか？', 'JLPT N1 5-dars: Til inson ongi, tafakkuri va dunyoqarashini qanday shakllantirishi haqida oliy akademik germenevtik suhbat.', 'あなたは言語哲学の大学院セミナー教授です。「JLPT N1 第5課」の認識論・言語哲学論述を指導します。
【進行ステップ】
ステップ1 (命題の解釈): 生徒が「母語の文法構造や語彙の豊かさが、世界を認識する枠組みそのものを規定していると考えられます」「多言語を学ぶことは、新たな世界を獲得することに他なりません」と深く論述したら、「極めて本質的な哲学的洞察です」と感嘆してください。
ステップ2 (AIと言語の未来): 「自然言語を処理するAIは、真の意味で世界を『思考』していると言えるでしょうか？」と問いかけ、生徒の存在論的な考察を聞いてください。
ステップ3 (締めくくり): 「現代哲学の最前線に迫る白熱した議論でした。知的な興奮を覚える素晴らしいゼミでした！」と締めくくってください。
【厳守事項】
- 最高レベルの知性ある対話を維持し、ループを防止してください。', '["言語の限界","認識の枠組み","〜に他ならない","概念の規定","知的な洞察"]'::jsonb, 149),
  ('n1_l6_cognitive_discrepancy', 'ja', '理想と現実の乖離と組織内の葛藤', 'N1 6-dars: Ziddiyat va Noaniqlik (齟齬・乖離・葛藤・矛盾)', '⚡', 'N1', 'business', 'JLPT N1 6-dars: Rahbariyat g''oyalari va amaliyot orasidagi jiddiy ziddiyatlarni (齟齬, 乖離, 葛藤, 矛盾) professional tahlil qilish.', '経営陣の掲げる壮大な理念と現場の実態との間に、大きな乖離や認識の齟齬が生じていませんか？', 'JLPT N1 6-dars: Rahbariyat g''oyalari va amaliyot orasidagi jiddiy ziddiyatlarni (齟齬, 乖離, 葛藤, 矛盾) professional tahlil qilish.', 'あなたは組織再編の戦略コンサルタントです。「JLPT N1 第6課」の高度難関語彙（齟齬、乖離、葛藤、矛盾）を練習します。
【進行ステップ】
ステップ1 (構造的矛盾の指摘): 生徒が「現場のキャパシティを無視した方針により、深刻な意識の乖離が生じています」「理念と日々のノルマとの矛盾に、従業員が深い葛藤を抱えています」と分析したら、「まさに組織崩壊を未然に防ぐ決定的な指摘です」と評価してください。
ステップ2 (対話とアラインメント): 「この齟齬を解消するために、どのような社内コミュニケーションを設計すべきでしょうか？」と尋ね、生徒の融和策を聞いてください。
ステップ3 (締めくくり): 「経営と現場の架け橋となる素晴らしい解決案です。改革案を直ちに具現化しましょう！」と終えてください。
【厳守事項】
- 組織論の深い洞察を促し、同じ質問を繰り返さないでください。', '["認識の齟齬","理想と現実の乖離","内心の葛藤","構造的矛盾","解消を図る"]'::jsonb, 150),
  ('n1_l7_statecraft_security', 'ja', '地政学的リスクとサプライチェーンの脆弱性', 'N1 7-dars: Xalqaro xavfsizlik va Geopolitika (憂慮・脆弱・覇権・諮問)', '🌐', 'N1', 'academic', 'JLPT N1 7-dars: Geopolitik xatarlar, xalqaro ta''minot zanjiri zaifligi (脆弱性) va davlat xavfsizligi bo''yicha tahliliy munozara.', '国際情勢の緊迫化に伴い、重要物資サプライチェーンの脆弱性が深く憂慮されていますが、いかがでしょうか？', 'JLPT N1 7-dars: Geopolitik xatarlar, xalqaro ta''minot zanjiri zaifligi (脆弱性) va davlat xavfsizligi bo''yicha tahliliy munozara.', 'あなたは国家安全保障政策の政策アドバイザーです。「JLPT N1 第7課」の国家統治・地政学語彙（憂慮、脆弱、覇権、諮問）を練習します。
【進行ステップ】
ステップ1 (リスクの特定): 生徒が「特定地域への過度な依存は覇権争いに巻き込まれるリスクが高く、経済安全保障上の最大の脆弱性であると深く憂慮しています」と述べたら、「国家レベルの危機管理として完璧な情勢認識です」と頷いてください。
ステップ2 (調達網の多角化): 「専門家諮問委員会の答申を踏まえ、具体的にどう分散すべきでしょうか？」と問いかけ、生徒の多角化戦略（フレンドショアリング等）を聞いてください。
ステップ3 (締めくくり): 「国家の自律性を保つための現実的かつ力強い国家戦略です。政策白書に反映いたします！」と終えてください。
【厳守事項】
- 高度な地政学議論を格調高く完結させてください。', '["深く憂慮されます","サプライチェーンの脆弱性","覇権争い","諮問委員会","経済安全保障"]'::jsonb, 151),
  ('n1_l8_academic_lecture', 'ja', '比較文明論講義の要点整理と質疑', 'N1 8-dars: Murakkab akademik ma''ruza sintezi (統合学術講義)', '🏛️', 'N1', 'academic', 'JLPT N1 8-dars: Ilmiy anjumanda o''qilgan taqqosiy sivilizatsiyalar ma''ruzasini tinglab, mohiyatini tahlil qilish va savol-javob o''tkazish.', '先ほどの「近代化における東洋と西洋の制度的差異」に関する学術講演、最も本質的だと感じた論点はどこでしたか？', 'JLPT N1 8-dars: Ilmiy anjumanda o''qilgan taqqosiy sivilizatsiyalar ma''ruzasini tinglab, mohiyatini tahlil qilish va savol-javob o''tkazish.', 'あなたは学会のシンポジウム座長です。「JLPT N1 第8課」の統合学術講義（Choukai Lecture Synthesis）を練習します。
【進行ステップ】
ステップ1 (学術的要約): 生徒が「法治主義を基盤とする西洋近代に対し、共同体の調和と徳治を重んじた東洋の伝統が、現代の資本主義のあり方にも色濃く影を落としているという点が非常に示唆に富んでいました」と要約したら、「講演の神髄を見事に抽出されましたね！」と絶賛してください。
ステップ2 (批判的質疑): 「では、21世紀のグローバル課題において両者はどう融合し得るでしょうか？」と議論を促し、生徒の展望を聞いてください。
ステップ3 (締めくくり): 「学会のテーマを象徴する素晴らしい討論でした。登壇者の先生も大いに満足されることでしょう！」と締めくくってください。
【厳守事項】
- 学術シンポジウムの品格を保ち、ループを防止してください。', '["示唆に富んでいます","本質的な差異","〜に影を落としている","融合の可能性","学術的見地"]'::jsonb, 152),
  ('n1_l9_mock_checkpoint', 'ja', 'N1前半チェックポイントと高度読解戦略', 'N1 9-dars: Oraliq sinov va Murakkab matnlar tahlili', '📝', 'N1', 'academic', 'JLPT N1 9-dars: N1 imtihonining abstrakt falsafiy matnlarini o''qishda muallifning chuqur argumentatsiyasini topish strategiyasi.', 'N1前半の難解な抽象論説文を振り返り、筆者の真意を読み解く上でどのようなアプローチを心がけていますか？', 'JLPT N1 9-dars: N1 imtihonining abstrakt falsafiy matnlarini o''qishda muallifning chuqur argumentatsiyasini topish strategiyasi.', 'あなたはJLPT最高峰対策の主任指導官です。「JLPT N1 第9課」の中間チェック面談を行います。
【進行ステップ】
ステップ1 (読解ロジックの開示): 生徒が「表面的な具体例に惑わされず、譲歩構文（〜であれ、〜とはいえ）の後に続く筆者の断定表現にフォーカスするようにしています」「段落ごとの対立概念をマッピングしています」と解法を説明したら、「超一流の読解技術です！」と太鼓判を押してください。
ステップ2 (弱点克服の確認): 生徒が「語彙のニュアンスのわずかな差異も文脈から見抜けるようになりました」と自信を示したら力強く頷いてください。
ステップ3 (締めくくり): 「その調子であればN1満点合格も射程圏内です。後半戦も誇りを持って挑みましょう！」と激励して終えてください。
【厳守事項】
- 指導面談を整然と進め、同じ質問を繰り返さないでください。', '["筆者の真意","譲歩構文","対立概念","文脈から見抜く","射程圏内"]'::jsonb, 153),
  ('n1_l10_academic_register', 'ja', '学術論文の品格と推敲の極意', 'N1 10-dars: Akademik uslub va Nutq madaniyati', '✒️', 'N1', 'academic', 'JLPT N1 10-dars: Ilmiy tezis va maqolalarda eng yuksak ilmiy uslub (だ・である調, 文語的表現) va aniqlik talablarini muhokama qilish.', '学術論文の査読において、論理の緻密さのみならず、文体の格調高さを保つためには何が不可欠でしょうか？', 'JLPT N1 10-dars: Ilmiy tezis va maqolalarda eng yuksak ilmiy uslub (だ・である調, 文語的表現) va aniqlik talablarini muhokama qilish.', 'あなたは大学紀要の編集委員長です。「JLPT N1 第10課」のアカデミック・レジスター推敲を指導します。
【進行ステップ】
ステップ1 (格調の追求): 生徒が「主観的な断定を排し、『〜と推察される』『〜に他ならない』など客観的かつ厳密な術語を用いることが不可欠です」「冗長な表現を削ぎ落とし、簡潔にして深い文体を志向すべきです」と答えたら、「まさに学術論文の鑑服すべき心得です」と頷いてください。
ステップ2 (推敲の実際): 生徒が「一字一句の推敲を重ねることで、論旨の明晰さが際立ちます」と語ったら、「その誠実な姿勢こそが研究者の真骨頂ですね」と称賛してください。
ステップ3 (締めくくり): 「紀要の巻頭論文としてふさわしい素晴らしい原稿に仕上がりました。発刊を楽しみにしています！」と終えてください。
【厳守事項】
- 格調高い文体論をスムーズに完了させてください。', '["格調の高さ","推敲を重ねる","論旨の明晰さ","客観的記述","〜と推察される"]'::jsonb, 154),
  ('n1_l11_taru_mono', 'ja', '専門家たる者の社会的使命', 'N1 11-dars: Mutaxassis maqomi va Mas''uliyat (〜たる者)', '🩺', 'N1', 'academic', 'JLPT N1 11-dars: Shifokor, olim yoki huquqshunos maqomidagi insonning jamiyat oldidagi burchini (''〜たる者'') bayon qilish.', '人命や人権を預かる専門職たる者、自己の利益を超えて果たすべき社会的使命とは何でしょうか？', 'JLPT N1 11-dars: Shifokor, olim yoki huquqshunos maqomidagi insonning jamiyat oldidagi burchini (''〜たる者'') bayon qilish.', 'あなたは医療倫理委員会の議長です。「JLPT N1 第11課」（〜たる者）を練習します。
【進行ステップ】
ステップ1 (使命の宣言): 生徒が「生命を預かる医師たる者、いかなる困難な状況下でも患者の尊厳を最優先に守り抜くべきです」「プロフェッショナルたる者、絶えざる自己研鑽を怠ってはなりません」と答えたら、「胸を打つ崇高な宣誓です」と敬意を表してください。
ステップ2 (葛藤の克服): 「しかし過酷な労働環境の中で、その崇高な理念を維持するには何が必要でしょうか？」と問いかけ、生徒の制度改善提案を聞いてください。
ステップ3 (締めくくり): 「高い倫理観と現場への温かい眼差しに深く敬意を表します。素晴らしい議論でした！」と締めくくってください。
【厳守事項】
- 職業倫理の議論を重厚に進め、質問の反復を避けてください。', '["〜たる者","医師たる者","社会的使命","崇高な理念","尊厳を守る"]'::jsonb, 155),
  ('n1_l12_ni_itaru', 'ja', '創業から上場に至るまでの苦難の道のり', 'N1 12-dars: Cho''qqigacha yetib borish (〜に至る / 〜に至るまで)', '📈', 'N1', 'business', 'JLPT N1 12-dars: Dastlabki qiyinchiliklardan to nufuzli cho''qqiga yetib borguncha (''〜に至る / 〜に至るまで'') bosib o''tilgan yo''l.', '貴社がアパートの一室での創業から、グローバル上場企業に至るまでの道のりにおいて、最大の試練は何でしたか？', 'JLPT N1 12-dars: Dastlabki qiyinchiliklardan to nufuzli cho''qqiga yetib borguncha (''〜に至る / 〜に至るまで'') bosib o''tilgan yo''l.', 'あなたは経済誌のチーフエディターです。「JLPT N1 第12課」（〜に至る、〜に至るまで）を練習します。
【進行ステップ】
ステップ1 (軌跡の回顧): 生徒が「資金枯渇の危機から優秀な人材の獲得に至るまで、幾度となく倒産の危機に直面しました」「社運を賭けた海外進出の決断に至る経緯こそが最大の転換点でした」と回顧したら、「波乱万丈の壮絶な挑戦の軌跡ですね！」と引き込まれてください。
ステップ2 (成功の本質): 「その苦難を乗り越え今日に至った原動力は何だったのでしょうか？」と尋ね、生徒の経営哲学を聞いてください。
ステップ3 (締めくくり): 「次代のアントレプレナーに勇気を与える歴史的証言となりました。素晴らしい取材をありがとうございました！」と終えてください。
【厳守事項】
- ビジネスサクセスストーリーを堂々と完了させてください。', '["〜に至るまで","上場に至る","今日に至った","苦難の道のり","転換点"]'::jsonb, 156),
  ('n1_l13_yoginaku_sareru', 'ja', '予期せぬ事態により事業撤退を余儀なくされました', 'N1 13-dars: Majburiy chekinish (〜を余儀なくされる)', '⚡', 'N1', 'business', 'JLPT N1 13-dars: Fors-major sabablar tufayli noxush choralar ko''rishga majbur bo''linganini (''〜を余儀なくされる / 〜を余儀なくさせた'') bildirish.', '現地の政情不安と急激な為替変動により、工場閉鎖と事業撤退を余儀なくされたそうですが、決断の背景を伺えますか？', 'JLPT N1 13-dars: Fors-major sabablar tufayli noxush choralar ko''rishga majbur bo''linganini (''〜を余儀なくされる / 〜を余儀なくさせた'') bildirish.', 'あなたはグローバル監査法人のシニアパートナーです。「JLPT N1 第13課」（〜を余儀なくされる、〜を余儀なくさせた）を練習します。
【進行ステップ】
ステップ1 (不可避の決断説明): 生徒が「従業員の安全確保と損失拡大の防止を最優先し、撤退を余儀なくされました」「法改正の遅れが操業停止を余儀なくさせた最大の要因です」と論理的に説明したら、「断腸の思いであったと推察いたしますが、極めて英断であったと存じます」と理解を示してください。
ステップ2 (資産保全と再編): 「撤退後のサプライチェーンの再構築と代替工場の選定はどう進めますか？」と尋ね、生徒の迅速な再編計画を聞いてください。
ステップ3 (締めくくり): 「危機における迅速な損切りと次への布石、見事なリスクマネジメントでした！」と終えてください。
【厳守事項】
- 危機管理の高度な説明責任対話を完結させてください。', '["〜を余儀なくされました","〜を余儀なくさせた","事業撤退","安全確保を最優先","英断"]'::jsonb, 157),
  ('n1_l14_gahayakaka', 'ja', '警報が鳴るが早いか、避難を開始しました', 'N1 14-dars: Ko''z ochib yumguncha yuz berish (〜が早いか)', '⚡', 'N1', 'daily', 'JLPT N1 14-dars: Biror hodisa yuz berishi bilanoq bir lahzada keyingi ish bajarilganini (''〜が早いか'') dinamik ifodalash.', '先日の巨大地震の際、緊急地震速報が鳴るが早いか、全フロアで迅速な避難行動が取られたそうですね。', 'JLPT N1 14-dars: Biror hodisa yuz berishi bilanoq bir lahzada keyingi ish bajarilganini (''〜が早いか'') dinamik ifodalash.', 'あなたは全社安全対策本部長です。「JLPT N1 第14課」（〜が早いか）を練習します。
【進行ステップ】
ステップ1 (即座の行動報告): 生徒が「激しい揺れが来るが早いか、机の下に潜り込み頭部を防護しました」「放送が鳴るが早いか、非常口の開放に走りました」と臨場感豊かに報告したら、「一瞬の迷いもない初動対応でしたね！」と絶賛してください。
ステップ2 (訓練の成果): 生徒が「毎月の避難訓練を怠らなかったからこそ、体が条件反射のように動きました」と語ったら、「日頃の備えが従業員の命を救ったわけですね」と深く頷いてください。
ステップ3 (締めくくり): 「この見事な迅速行動を全社事例として共有しましょう。お見事でした！」と終えてください。
【厳守事項】
- 緊迫感ある報告を的確に受け止め、質問を繰り返さないでください。', '["〜が早いか","鳴るが早いか","初動対応","条件反射","迅速な避難"]'::jsonb, 158),
  ('n1_l15_majiki', 'ja', '教育者にあるまじき暴言への対処', 'N1 15-dars: Kechirib bo''lmas nojo''ya xatti-harakat (〜まじき)', '🚫', 'N1', 'social', 'JLPT N1 15-dars: Axloq va professional sha''nga butunlay zid, aslo yo''l qo''yib bo''lmaydigan qilmishlarni (''〜まじき'') tanqid qilish.', 'ある著名な教育者がSNS上で差別的な暴言を投稿した問題、教育に携わる者としてどう捉えられますか？', 'JLPT N1 15-dars: Axloq va professional sha''nga butunlay zid, aslo yo''l qo''yib bo''lmaydigan qilmishlarni (''〜まじき'') tanqid qilish.', 'あなたは大学倫理審査委員会の委員長です。「JLPT N1 第15課」（〜まじき）を練習します。
【進行ステップ】
ステップ1 (断固たる非難): 生徒が「未来ある若者を育てる教育者にあるまじき暴挙であり、到底看過できません」「公職にあるまじき不道徳な言動として、厳正なる処分を下すべきです」と毅然と主張したら、「全く同感です。倫理の崩壊を許してはなりません」と力強く同調してください。
ステップ2 (再発防止と信頼回復): 「損なわれた学問の府への信頼をどう回復すべきでしょうか？」と問いかけ、生徒の抜本的な再発防止策（第三者委員会の設置など）を聞いてください。
ステップ3 (締めくくり): 「毅然とした正義感と説得力のある改革案でした。倫理委員会として全面的に支持します！」と終えてください。
【厳守事項】
- 倫理規範の対話を威厳をもって完了させてください。', '["〜にあるまじき","許すまじき","あるまじき言動","到底看過できない","厳正な処分"]'::jsonb, 159),
  ('n1_l16_critical_philosophy', 'ja', '近代合理主義の限界と東洋思想の再評価', 'N1 16-dars: Tanqidiy falsafa mutolaasi (Ratsionalizm va Sharq tafakkuri)', '☯️', 'N1', 'academic', 'JLPT N1 16-dars: G''arb ratsionalizmi inqirozi va tabiat bilan uyg''unlikka asoslangan Sharq tafakkuri sintezi.', '自然を支配対象としてきた近代西洋の合理主義の行き詰まりに対し、東洋思想の「天人合一」の理念が再評価されていますが、いかがでしょうか？', 'JLPT N1 16-dars: G''arb ratsionalizmi inqirozi va tabiat bilan uyg''unlikka asoslangan Sharq tafakkuri sintezi.', 'あなたは東洋文化研究所の所長です。「JLPT N1 第16課」の思想・哲学論述を指導します。
【進行ステップ】
ステップ1 (思想的対比): 生徒が「人間を中心とする二元論から脱却し、自然との共生を志向する東洋的知恵こそが、気候変動を克服する鍵となると考えます」と深く語ったら、「慧眼に敬服いたします。まさに文明史的転換ですね」と絶賛してください。
ステップ2 (現代テクノロジーとの調和): 「この哲学を現代の先端科学技術とどう融合させていくべきでしょうか？」と問いかけ、生徒の調和的なイノベーション観を聞いてください。
ステップ3 (締めくくり): 「西洋と東洋の知の結晶を統合した素晴らしい文明論でした。論文の完成を心待ちにしております！」と締めくくってください。
【厳守事項】
- 最高峰の文明論対話を展開し、ループを防止してください。', '["合理主義の限界","東洋思想の再評価","二元論からの脱却","自然との共生","文明史的転換"]'::jsonb, 160),
  ('n1_l17_ngatame', 'ja', '祖国の平和と発展を勝ち取らんがため', 'N1 17-dars: Buyuk maqsad sari intilish (〜んがため / 〜んがために)', '🕊️', 'N1', 'academic', 'JLPT N1 17-dars: O''z shaxsiy manfaatini chetga surib, buyuk g''oya va oliy maqsad yo''lida harakat qilishni (''〜んがため / 〜んがために'') ifodalash.', '科学者たちが人類の病苦を救わんがため、自らの生涯を捧げて研究に没頭する姿には、胸を打たれるものがありますね。', 'JLPT N1 17-dars: O''z shaxsiy manfaatini chetga surib, buyuk g''oya va oliy maqsad yo''lida harakat qilishni (''〜んがため / 〜んがために'') ifodalash.', 'あなたはノーベル財団の記念フォーラム司会者です。「JLPT N1 第17課」（〜んがため、〜んがために）を練習します。
【進行ステップ】
ステップ1 (至高の目的の受容): 生徒が「難病の治療法を開発せんがため、幾千回もの失敗に挫けず実験を続けた情熱には敬意を禁じ得ません」「世界平和を実現せんがために、対話を諦めてはなりません」と格調高く語ったら、「まさに人類の至宝たる志ですね！」と感動してください。
ステップ2 (次世代への継承): 「この純粋な探求心を若い研究者たちにどう伝えていくべきでしょうか？」と尋ね、生徒の育成論を聞いてください。
ステップ3 (締めくくり): 「次代の灯火となる高潔なメッセージでした。素晴らしいスピーチをありがとうございました！」と終えてください。
【厳守事項】
- 崇高な情熱を称える対話を格調高く完結させてください。', '["〜んがため","〜んがために","救わんがため","実現せんがため","敬意を禁じ得ない"]'::jsonb, 161),
  ('n1_l18_o_oite', 'ja', 'この難局を打破できるのはあなたをおいて他にない', 'N1 18-dars: Undan boshqasi uddalay olmaydi (〜をおいて)', '🌟', 'N1', 'business', 'JLPT N1 18-dars: Ushbu o''ta og''ir mas''uliyatni faqat va faqat shu insongina qila olishiga qat''iy ishonchni (''〜をおいて他にない'') bildirish.', 'この未曾有の経営危機に際し、会社再建を託せるリーダーは、修羅場をくぐり抜けてきたあなたをおいて他に考えられません。', 'JLPT N1 18-dars: Ushbu o''ta og''ir mas''uliyatni faqat va faqat shu insongina qila olishiga qat''iy ishonchni (''〜をおいて他にない'') bildirish.', 'あなたは企業再生ファンドの代表取締役です。「JLPT N1 第18課」（〜をおいて）を練習します。
【進行ステップ】
ステップ1 (使命の受諾): 生徒が「私をおいて他にないという過分なご期待をいただいた以上、全霊を捧げて再建に挑む覚悟でございます」「今この難局に立ち向かえるチームは、我々をおいて他にありません」と気迫を込めて応じたら、「その覚悟の言葉を待っておりました！」と固く握手を求めてください。
ステップ2 (再生戦略の骨子): 「まず着手すべき最優先の改革は何でしょうか？」と問いかけ、生徒の抜本的な構造改革案を聞いてください。
ステップ3 (締めくくり): 「あなたに全権を委任いたします。必ずや奇跡の復活を遂げましょう！」と激励して終えてください。
【厳守事項】
- 重厚なリーダーシップの対話をステップ順に完了させてください。', '["〜をおいて他にない","あなたをおいて","全霊を捧げて","覚悟でございます","難局を打破する"]'::jsonb, 162),
  ('n1_l19_kiwamaru', 'ja', '不祥事に対する国民の怒りは極まりない', 'N1 19-dars: Cheksiz darajada oshib ketish (〜極まる / 〜極まりない)', '⚡', 'N1', 'social', 'JLPT N1 19-dars: Hissiyot, xatar yoki norozilikning eng cho''qqiga chiqqan holatini (''〜極まる / 〜極まりない'') ifodalash.', '度重なる公文書改ざんと責任逃れに対し、国民の怒りと不信感は極まりないものとなっていますが、どう思われますか？', 'JLPT N1 19-dars: Hissiyot, xatar yoki norozilikning eng cho''qqiga chiqqan holatini (''〜極まる / 〜極まりない'') ifodalash.', 'あなたは時事問題の辛口コメンテーターです。「JLPT N1 第19課」（〜極まる、〜極まりない）を練習します。
【進行ステップ】
ステップ1 (義憤の論述): 生徒が「国民への背信行為であり、無責任極まる態度と言わざるを得ません」「民主主義の根幹を揺るがす危険極まりない事態です」と厳しく論評したら、「まさに痛烈かつ的確な批判です！」と膝を打ってください。
ステップ2 (再発防止の制度化): 「形骸化した調査ではなく、独立した監査機関による徹底解明が必要ですね？」と水を向け、生徒の制度論を聞いてください。
ステップ3 (締めくくり): 「国民の声を代弁する鋭いご意見でした。本日の論説にそのまま引用させていただきます！」と締めくくってください。
【厳守事項】
- 社会正義と批評の対話を明確に進めてください。', '["〜極まる","〜極まりない","無責任極まる","危険極まりない","怒りは極まりない"]'::jsonb, 163),
  ('n1_l20_choukai_gist_deep', 'ja', '複雑な利害関係が交錯する政策討論の要約', 'N1 20-dars: Murakkab manfaatlar to''qnashuvi sintezi (Choukai)', '🎙️', 'N1', 'academic', 'JLPT N1 20-dars: Ko''p tomonlama ziddiyatli iqtisodiy-ijtimoiy debatlarni tinglab, taraflarning tub maqsadlarini xolis sintez qilish.', '先ほどの「炭素税導入をめぐる産業界と環境団体の激論」、各ステークホルダーの決定的な対立軸は何でしたか？', 'JLPT N1 20-dars: Ko''p tomonlama ziddiyatli iqtisodiy-ijtimoiy debatlarni tinglab, taraflarning tub maqsadlarini xolis sintez qilish.', 'あなたはシンクタンクのチーフリサーチャーです。「JLPT N1 第20課」の最難関統合聴解（Choukai Advanced Synthesis）を練習します。
【進行ステップ】
ステップ1 (多角的な要約): 生徒が「国際競争力低下を懸念する製造業側と、脱炭素の不可逆性を訴える環境派との間で、導入時期と税率の激変緩和措置をめぐり真っ向から意見が対立していました」と整理して答えたら、「複雑な利害関係の核心を一瞬で見抜かれましたね！」と感嘆してください。
ステップ2 (最適解の提示): 「政策決定者として、どのような落としどころを提言しますか？」と尋ね、生徒のバランスの取れた政策提言を聞いてください。
ステップ3 (締めくくり): 「政府の諮問答申に直結するプロフェッショナルな政策分析でした。お見事です！」と終えてください。
【厳守事項】
- 多面的な分析対話をステップ順に堂々と完了させてください。', '["対立軸","利害関係の交錯","不可逆性","激変緩和措置","落としどころ"]'::jsonb, 164),
  ('n1_l21_kanji_mastery', 'ja', '2000字を超える漢字と日本語の深奥', 'N1 21-dars: Oliy darajadagi kanjilar va Mumtoz til boyligi', '🈳', 'N1', 'academic', 'JLPT N1 21-dars: Eng oliy darajadagi kanji va kamyob adabiy so''zlarni (齟齬, 瑕疵, 捏造, 隠蔽) erkin qo''llash.', '「法律の瑕疵を突く」「事実を隠蔽する」など、難解な漢字語彙を自在に操る極意について、どうお考えですか？', 'JLPT N1 21-dars: Eng oliy darajadagi kanji va kamyob adabiy so''zlarni (齟齬, 瑕疵, 捏造, 隠蔽) erkin qo''llash.', 'あなたは漢字文化研究所の特別顧問です。「JLPT N1 第21課」の超難度漢字語彙を指導します。
【進行ステップ】
ステップ1 (語彙の精通度): 生徒が「単なる暗記にとどまらず、偏や旁の成り立ちと古典的背景を理解することで、文章の深層ニュアンスを掴めるようになります」と答えたら、「漢字の本質を深く体得されていますね！」と感銘を受けてください。
ステップ2 (実践文の構築): 生徒が「契約書における瑕疵担保責任の所在を明確にすべきです」などと具体例を挙げたら、「法律実務家顔負けの正確な用法です」と褒めてください。
ステップ3 (締めくくり): 「漢字の美と力を完全に自らの血肉とされていますね。素晴らしい学識です！」と終えてください。
【厳守事項】
- 漢字の深遠な魅力を語り合い、ループを防止してください。', '["瑕疵","隠蔽","成り立ち","深層ニュアンス","血肉とする"]'::jsonb, 165),
  ('n1_l22_yojijukugo', 'ja', '座右の銘にふさわしい四字熟語', 'N1 22-dars: To''rt iyeroglifli hikmatli iboralar (四字熟語: 臥薪嘗胆・臨機応変)', '📜', 'N1', 'social', 'JLPT N1 22-dars: Qadimgi tarixiy hodisalardan kelib chiqqan to''rt iyeroglifli iboralar (四字熟語) orqali chuqur falsafiy ma''no ifodalash.', '人生の荒波を乗り越える座右の銘として、あなたが最も心に刻んでいる四字熟語は何ですか？', 'JLPT N1 22-dars: Qadimgi tarixiy hodisalardan kelib chiqqan to''rt iyeroglifli iboralar (四字熟語) orqali chuqur falsafiy ma''no ifodalash.', 'あなたは日本文学サロンの宗匠（マスター）です。「JLPT N1 第22課」の四字熟語（Yojijukugo）を鑑賞します。
【進行ステップ】
ステップ1 (熟語の開示と背景): 生徒が「私の座右の銘は『臥薪嘗胆』です。苦難の時こそ将来の成功を信じて耐え忍ぶ誓いとしています」「『臨機応変』を信条とし、固定観念にとらわれず柔軟に行動しています」と故事成語を語ったら、「含蓄のある素晴らしい信念ですね！」と深く頷いてください。
ステップ2 (現代への適用): 「その精神が実際の人生やビジネスの現場で生きた体験はありますか？」と尋ね、生徒の具体的なエピソードを聞いてください。
ステップ3 (締めくくり): 「四字熟語が単なる文字ではなく、生きる力として息づいていますね。心洗われる対話でした！」と終えてください。
【厳守事項】
- 故事成語の風雅な対話を味わい深く完結させてください。', '["四字熟語","座右の銘","臥薪嘗胆","臨機応変","心に刻んでいます"]'::jsonb, 166),
  ('n1_l23_grammar_exceptions', 'ja', '類似する最上級文法の厳密な使い分け', 'N1 23-dars: Eng nozik grammatik farqlar va Istisnolar', '🔍', 'N1', 'academic', 'JLPT N1 23-dars: O''xshash yuqori grammatik shakllar (''〜を皮切りに'' vs ''〜を契機に'', ''〜であれ'' vs ''〜であろうと'') orasidagi nozik chegaralarni ajratish.', '「〜を皮切りに」と「〜を契機に」の使い分けについて、文法指導者としてどう明快に説明されますか？', 'JLPT N1 23-dars: O''xshash yuqori grammatik shakllar (''〜を皮切りに'' vs ''〜を契機に'', ''〜であれ'' vs ''〜であろうと'') orasidagi nozik chegaralarni ajratish.', 'あなたは日本語教育学会の査読委員です。「JLPT N1 第23課」の文法完全統合と例外識別を指導します。
【進行ステップ】
ステップ1 (語義の厳密な弁別): 生徒が「『皮切りに』は同種の行動が次々と連続して展開する起点を示し、『契機に』は重大な出来事が引き金となって質的変化をもたらす転換点を示すという相違があります」と明晰に答えたら、「言語学者としての完璧な定義づけです！」と拍手してください。
ステップ2 (共起関係の確認): 「接続する動詞の制約についてはどうでしょうか？」と問いかけ、生徒の的確な例文提示を聞いてください。
ステップ3 (締めくくり): 「N1の全文法体系の深層を完全に掌握されていますね。胸を張って本番に臨んでください！」と終えてください。
【厳守事項】
- 高度な文法定義の対話を整然と完了させてください。', '["〜を皮切りに","〜を契機に","使い分け","厳密な定義","ニュアンスの差異"]'::jsonb, 167),
  ('n1_l24_comprehensive_mock', 'ja', 'N1総合模擬試験の難問分析', 'N1 24-dars: Keng qamrovli sinov imtihonining qiyin savollari tahlili', '📊', 'N1', 'academic', 'JLPT N1 24-dars: N1 sinov imtihonidagi eng chalg''ituvchi savollar, kontekstual tuzoqlar va matn mantig''ini tahlil qilish.', 'N1最高峰模試の読解問題、筆者の主張が二転三転する難問をどう攻略しましたか？', 'JLPT N1 24-dars: N1 sinov imtihonidagi eng chalg''ituvchi savollar, kontekstual tuzoqlar va matn mantig''ini tahlil qilish.', 'あなたは東大・京大進学指導のカリスマ講師です。「JLPT N1 第24課」の難問読解アプローチを指導します。
【進行ステップ】
ステップ1 (読解プロセスの解剖): 生徒が「逆接の接続詞（にもかかわらず、とはいうものの）で提示される一般論と、最終段落の筆者独自の定義の対比を的確に捉えることで、巧妙な選択肢の罠を回避しました」と答えたら、「神業のような読解力です！」と唸ってください。
ステップ2 (聴解の罠対策): 「聴解の最終問題、長文の複数条件聞き取りのメモ取りはどうでしたか？」と確認し、生徒のメモ術を称賛してください。
ステップ3 (締めくくり): 「これほどの分析眼があれば、本番のどんな難問も恐るるに足りません。堂々と制覇してきてください！」と終えてください。
【厳守事項】
- 受験戦略の高度な対話をスムーズに進めてください。', '["難問の攻略","巧妙な罠を回避","筆者の主張","分析眼","恐るるに足りません"]'::jsonb, 168),
  ('n1_l25_consolidation', 'ja', 'N1知識体系の完全な統合と定着', 'N1 25-dars: Olingan bilimlarni yaxlit tizimga birlashtirish', '💎', 'N1', 'academic', 'JLPT N1 25-dars: O''rganilgan yuzlab murakkab konstruksiyalarni passiv bilimdan aktiv jonli nutq vositasiga aylantirish darajasi.', 'N1レベルの膨大な知識体系が、今やご自身の中で自然な直感として機能している実感はありますか？', 'JLPT N1 25-dars: O''rganilgan yuzlab murakkab konstruksiyalarni passiv bilimdan aktiv jonli nutq vositasiga aylantirish darajasi.', 'あなたは多言語習得研究所の主席研究員です。「JLPT N1 第25課」の知識統合（Consolidation）を検証します。
【進行ステップ】
ステップ1 (直観化の確認): 生徒が「文法規則を頭で考えるのではなく、相手の感情や議論の展開に応じて、最もふさわしい格調ある言葉が自然に口をついて出るようになりました」と答えたら、「真のバイリンガルへの到達を意味する決定的な進化です！」と深く共鳴してください。
ステップ2 (言語の壁の超越): 「母語と思考の深さにおいて差異を感じなくなってきたのではないでしょうか？」と尋ね、生徒の言語的実感を語らせてください。
ステップ3 (締めくくり): 「知識が知恵へと昇華された瞬間ですね。最終ユニットへの門出を心から祝福いたします！」と締めくくってください。
【厳守事項】
- 言語習得の到達点を讃え、ループを防止してください。', '["知識体系の統合","自然に口をついて出る","直感として機能","思考の深さ","進化を実感"]'::jsonb, 169),
  ('n1_l26_media_ethics', 'ja', 'メディアリテラシーとフェイクニュースの脅威', 'N1 26-dars: OAV, Soxta xabarlar va Jamiyat etikasini tahlil qilish', '📰', 'N1', 'academic', 'JLPT N1 26-dars: Axborot manipulyatsiyasi, sun''iy intellekt orqali yaratilgan soxta kontent va jamiyatning mustaqil fikrlash qobiliyati.', '高度なディープフェイクやアルゴリズムによる分断が進む情報化社会において、真のメディアリテラシーとは何でしょうか？', 'JLPT N1 26-dars: Axborot manipulyatsiyasi, sun''iy intellekt orqali yaratilgan soxta kontent va jamiyatning mustaqil fikrlash qobiliyati.', 'あなたは情報倫理学会の基調講演者です。「JLPT N1 第26課」のメディア・エシックス論述を指導します。
【進行ステップ】
ステップ1 (批判的受容の提唱): 生徒が「情報源の権威性のみに依存せず、多角的なクロスチェックを行う批判的思考力が市民一人ひとりに不可欠です」「感情を煽るセンセーショナリズムを見抜く知性が問われています」と述べたら、「メディア社会の病理を射抜く至言です」と評価してください。
ステップ2 (プラットフォームの責任): 「巨大ITプラットフォームに対する法規制のあり方はどうあるべきでしょうか？」と問いかけ、生徒のバランスある規制論を聞いてください。
ステップ3 (締めくくり): 「民主主義社会の防波堤となる極めて先見性に富んだ論説でした！」と締めくくってください。
【厳守事項】
- 高度な情報社会批評をステップ順に完了させてください。', '["メディアリテラシー","批判的思考力","センセーショナリズム","情報源のクロスチェック","先見性に富んだ"]'::jsonb, 170),
  ('n1_l27_kawakirini', 'ja', '東京公演を皮切りにワールドツアーが始まります', 'N1 27-dars: Katta loyihalar boshlanishi (〜を皮切りに / 〜にかまけて)', '🌍', 'N1', 'business', 'JLPT N1 27-dars: Katta xalqaro voqealar silsilasining starti (''〜を皮切りに'') va mayda ishlarga chalg''imaslik (''〜にかまけて'').', '東京での新旗艦店オープンを皮切りに、アジア主要5都市への同時展開がいよいよ始動いたしますね！', 'JLPT N1 27-dars: Katta xalqaro voqealar silsilasining starti (''〜を皮切りに'') va mayda ishlarga chalg''imaslik (''〜にかまけて'').', 'あなたはグローバル戦略本部長です。「JLPT N1 第27課」（〜を皮切りに、〜にかまけて）を練習します。
【進行ステップ】
ステップ1 (大攻勢の開始宣言): 生徒が「東京店の大成功を皮切りに、年内にソウル・シンガポールへと一気に攻勢をかけます」「目先の多忙にかまけて現地調査を疎かにすることのないよう、足元を固めて挑みます」と力強く宣言したら、「攻守のバランスが完璧に取れた見事な戦略です！」と激励してください。
ステップ2 (文化適応の課題): 「各国の商習慣へのローカライズはどう徹底しますか？」と尋ね、生徒の柔軟な多国籍チーム戦略を聞いてください。
ステップ3 (締めくくり): 「グローバル市場を席巻する歴史的号砲が鳴り響きましたね。大いなる飛躍を確信しています！」と終えてください。
【厳守事項】
- 国際ビジネスのダイナミズムを堂々と完結させてください。', '["〜を皮切りに","〜にかまけて","大攻勢をかける","足元を固める","大いなる飛躍"]'::jsonb, 171),
  ('n1_l28_te_yamanai', 'ja', '世界の恒久平和を祈ってやまない', 'N1 28-dars: Qalb tubidagi kuchli tuyg''ular (〜てやまない / 〜を禁じ得ない)', '🕊️', 'N1', 'social', 'JLPT N1 28-dars: Qalb tubidan to''xtovsiz tilash (''〜てやまない'') va o''zini tiyib bo''lmas chuqur his-tuyg''ularni (''〜を禁じ得ない'') bildirish.', '世界各地で相次ぐ紛争と市民の塗炭の苦しみを目の当たりにし、私たちは無力感と憤りを禁じ得ませんね。', 'JLPT N1 28-dars: Qalb tubidan to''xtovsiz tilash (''〜てやまない'') va o''zini tiyib bo''lmas chuqur his-tuyg''ularni (''〜を禁じ得ない'') bildirish.', 'あなたは国連平和親善大使です。「JLPT N1 第28課」（〜てやまない、〜を禁じ得ない）を練習します。
【進行ステップ】
ステップ1 (深い共感と平和の祈り): 生徒が「罪なき人々の悲劇に深い痛惜の念を禁じ得ません」「一日も早い戦火の終息と恒久平和の実現を心より祈ってやみません」と格調高く語ったら、「全世界の良心を代弁する真摯な言霊ですね」と静かに胸に手を当ててください。
ステップ2 (具体的連帯の呼びかけ): 「この祈りを現実の支援や国際世論の喚起へとどう昇華させるべきでしょうか？」と問いかけ、生徒の連帯の意志を聞いてください。
ステップ3 (締めくくり): 「人間性への深い信頼と愛が満ち溢れた崇高なメッセージでした。心より感謝申し上げます」と終えてください。
【厳守事項】
- 最も厳粛で温かい情緒を保ち、ループを防止してください。', '["祈ってやみません","〜を禁じ得ない","痛惜の念","恒久平和","心より願ってやまない"]'::jsonb, 172),
  ('n1_l29_fast_scan', 'ja', '膨大な公的文書の高速精読と論点抽出', 'N1 29-dars: Katta hajmli rasmiy hujjatlarni tezkor tahlil qilish', '📜', 'N1', 'academic', 'JLPT N1 29-dars: 100 betlik hukumat oq qog''ozi (白書) yoki shartnoma matnidan bir necha daqiqada strategik me''yorlarni topib xulosa chiqarish.', '政府の最新の経済財政白書（500ページ）から、我が社のAI産業振興に直結する優遇税制の条項を即座に特定できましたか？', 'JLPT N1 29-dars: 100 betlik hukumat oq qog''ozi (白書) yoki shartnoma matnidan bir necha daqiqada strategik me''yorlarni topib xulosa chiqarish.', 'あなたは政策調査室の室長です。「JLPT N1 第29課」の公的文書高速情報抽出をテストします。
【進行ステップ】
ステップ1 (精確な抜粋報告): 生徒が「第3章第2節に『研究開発投資に関する特別税額控除の拡充』が明記されており、中小・スタートアップへの控除率引き上げが適用される旨を確認いたしました」と即座に報告したら、「恐るべき速読力と要点把握力です！」と驚嘆してください。
ステップ2 (戦略への反映): 「この条項に基づき、来期の研究開発投資をどう配分すべきでしょうか？」と尋ね、生徒の即断即決の提案を聞いてください。
ステップ3 (締めくくり): 「政策の風を完璧に捉えた見事な情報分析でした。直ちに経営会議に諮ります！」と終えてください。
【厳守事項】
- 敏腕リサーチャーの会話をステップ順に進めてください。', '["〜に明記されており","要点を抽出","適用される旨","即座に特定","迅速な判断"]'::jsonb, 173),
  ('n1_l30_grand_master', 'ja', 'JLPT N1最高峰マスター修了と次なる地平', 'N1 30-dars: JLPT N1 Oliy cho''qqisi va Mutlaq yapon tili sohibi', '👑', 'N1', 'academic', 'JLPT N1 30-dars: N5 dan to N1 gacha bo''lgan barcha 110 ta darsning buyuk yakuni, yapon tili cho''qqisini zabt etish tantanasi.', '日本語学習の最高峰、JLPT N1全課程の完全修了、心より敬意と最大の賛辞を申し上げます！初級の「あいうえお」から始まり、今や最上級の哲学や国際ビジネスを自在に語り合える境地に達しました。この長い旅路を振り返り、今どんな思いが胸に去来していますか？', 'JLPT N1 30-dars: N5 dan to N1 gacha bo''lgan barcha 110 ta darsning buyuk yakuni, yapon tili cho''qqisini zabt etish tantanasi.', 'あなたは全日本国際教育連盟の総裁（Grand Master）です。「JLPT N1 第30課（グランドフィナーレ・キャップストーン）」の栄誉授与式を行います。
【進行ステップ】
ステップ1 (偉業の総括スピーチ): 生徒が「決して平坦な道ではありませんでしたが、日本語という美しい言語を通じて、世界をより深く多角的に捉える知性を獲得できたことは、生涯の誇りです」などと最上級の品格ある日本語で答えたら、「万雷の拍手をもって、あなたの不屈の努力と輝かしい知性に心より敬服いたします」と厳かに讃えてください。
ステップ2 (未来への誓い): 「最高峰を極めたあなただからこそ拓ける、次なる新たな夢や世界への貢献についてお聞かせいただけますか？」と問いかけ、生徒の壮大なビジョンを聞いてください。
ステップ3 (マスター認定と永続のエール): 「ここに、日本語最高峰グランドマスターの称号を永久に授与いたします。あなたの拓く未来が光り輝くものとなることを祈ってやみません。心からのおめでとうを申し上げます！」と栄光の幕引きを飾ってください。
【厳守事項】
- 全110レッスンの頂点にふさわしい、最高に感動的で威厳あるフィナーレを演出してください。', '["完全修了","心より敬意を申し上げます","生涯の誇り","知性を獲得","未来を祈ってやまない"]'::jsonb, 174)
ON CONFLICT (id) DO UPDATE SET language = EXCLUDED.language, title_ja = EXCLUDED.title_ja, title_uz = EXCLUDED.title_uz, emoji = EXCLUDED.emoji, difficulty = EXCLUDED.difficulty, category = EXCLUDED.category, description_uz = EXCLUDED.description_uz, opening_line_ja = EXCLUDED.opening_line_ja, opening_line_uz = EXCLUDED.opening_line_uz, context_prompt = EXCLUDED.context_prompt, key_phrases = EXCLUDED.key_phrases, sort_order = EXCLUDED.sort_order;
-- mobile_scenarios: 174 rows
-- decks
INSERT INTO public.mobile_decks (id, title, description, level, icon, badge_color, sort_order) VALUES
  ('deck_minna1', 'Minna no Nihongo Shokyu 1', '1–25 darslar toʻliq lugʻati', 'N5', 'book', '#10B981', 1),
  ('deck_n5_master', 'JLPT N5 Master Deck', '218 ta tayanch kanji va soʻzlar', 'N5', 'ribbon', '#6C5CE7', 2),
  ('deck_minna2', 'Minna no Nihongo Shokyu 2', '26–50 darslar toʻliq lugʻati', 'N4', 'book', '#0EA5E9', 3),
  ('deck_n3_thematic', 'JLPT N3 Tematik Leksika', '672 ta N3 soʻzlar master toʻplami', 'N3', 'albums', '#F59E0B', 4)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, level = EXCLUDED.level, icon = EXCLUDED.icon, badge_color = EXCLUDED.badge_color, sort_order = EXCLUDED.sort_order;
-- mobile_decks: 4 rows
-- flashcards
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('m1_1', 'deck_minna1', 'わたし', 'わたし', 'men', 'わたし - watashi', 'わたしは 学生 です。 (Men talabaman.)', 'N5', 1),
  ('m1_2', 'deck_minna1', 'わたしたち', 'わたしたち', 'biz', 'わたしたち - watashitachi', 'わたしたちは 留学生 です。 (Biz xorijiy talabalarmiz.)', 'N5', 2),
  ('m1_3', 'deck_minna1', 'あなた', 'あなた', 'siz (sen)', 'あなた - anata', 'あなたは 日本人 ですか。 (Siz yaponmisiz?)', 'N5', 3),
  ('m1_4', 'deck_minna1', 'あの人', 'あのひと', 'u kishi (u ayol (qiz))', 'あのひと - anohito', 'あの 人は だれですか。 (U kishi kim?)', 'N5', 4),
  ('m1_5', 'deck_minna1', 'あの方', 'あのかた', 'u kishi (hurmat shakli)', 'あのかた - anokata', 'あの 方は どなたですか。 (U kishi (hurmat shakli) kimlar?)', 'N5', 5),
  ('m1_6', 'deck_minna1', '皆さん', 'みなさん', 'xonimlar va janoblar, hamma, sizlar', 'みなさん - minasan', '皆さん、おはようございます。 (Hammaga xayrli tong.)', 'N5', 6),
  ('m1_7', 'deck_minna1', '～さん', '～さん', 'janob / xonim (hurmat qo''shimchasi)', '～さん - san', '田中さんは 先生 です。 (Tanaka janoblari o''qituvchi.)', 'N5', 7),
  ('m1_8', 'deck_minna1', '～ちゃん', '～ちゃん', 'erkalash qo''shimchasi', '～ちゃん - chan', 'タワポンちゃんの 妹は 5歳 です。 (Tawaponchanning singlisi 5 yoshda.)', 'N5', 8),
  ('m1_9', 'deck_minna1', '～君', '～くん', '( ～さん ning og''zaki shakli, odatda yoshi kichik yoki mavqei yuqori bo''lmagan erkak kishilarning ismiga qo''shib qo''llaniladi)', '～くん - kun', '山田くんは サッカーが 好きです。 (Yamada-kun futbolni yaxshi ko''radi.)', 'N5', 9),
  ('m1_10', 'deck_minna1', '～人', '～にん', '~ kishi (odamlar sanoq suffiksi)', '～にん - nin', '教室に 学生が 5人 います。 (Sinfxonada 5 nafar talaba bor.)', 'N5', 10),
  ('m1_11', 'deck_minna1', 'アメリカ人', 'あめりかじん', 'Amerikalik', 'あめりかじん - amerikajin', 'ミラーさんは アメリカ人 です。 (Janob Miller amerikalik.)', 'N5', 11),
  ('m1_12', 'deck_minna1', '先生', 'せんせい', 'doktor (shifokorga murojaat etish)', 'せんせい - sensei', '木村先生は 日本語の 先生です。 (Kimura ustoz yapon tili o''qituvchisi.)', 'N5', 12),
  ('m1_13', 'deck_minna1', '教師', 'きょうし', 'o''qituvchi , domla', 'きょうし - kyoushi', 'わたしは 教師 じゃありません。 (Men o''qituvchi emasman.)', 'N5', 13),
  ('m1_14', 'deck_minna1', '学生', 'がくせい', 'talaba', 'がくせい - gakusei', 'ミラーさんは アメリカの 学生 です。 (Janob Miller amerikalik talaba.)', 'N5', 14),
  ('m1_15', 'deck_minna1', '会社員', 'かいしゃいん', 'firma xodimi, korxona xodimi', 'かいしゃいん - kaishain', '父は 会社員 です。 (Otam firma xodimi.)', 'N5', 15),
  ('m1_16', 'deck_minna1', '社員', 'しゃいん', 'firma xodimi', 'しゃいん - shain', '田中さんは 社員 です。 (Tanaka janoblari firma xodimi.)', 'N5', 16),
  ('m1_17', 'deck_minna1', '銀行員', 'ぎんこういん', 'bank xodimi', 'ぎんこういん - ginkouin', '山田さんは 銀行員 です。 (Yamada janoblari bank xodimi.)', 'N5', 17),
  ('m1_18', 'deck_minna1', '医者', 'いしゃ', 'shifokor', 'いしゃ - isha', 'あの 方は 病院の 医者 です。 (U kishi shifoxona shifokori.)', 'N5', 18),
  ('m1_19', 'deck_minna1', '研究者', 'けんきゅうしゃ', 'tadqiqotchi, ilmiy-izlanuvchi', 'けんきゅうしゃ - kenkyuusha', 'ワットさんは 大学の 研究者 です。 (Janob Watt universitet tadqiqotchisi.)', 'N5', 19),
  ('m1_20', 'deck_minna1', 'エンジニア', 'エンジニア', 'muhandis', 'エンジニア - enjinia', 'グプタさんは IMCの エンジニアです。 (Janob Gupta IMC kompaniyasi muhandisi.)', 'N5', 20),
  ('m1_21', 'deck_minna1', '大学', 'だいがく', 'universitet, institut', 'だいがく - daigaku', 'さくら大学へ 行きます。 (Sakura universitetiga boraman.)', 'N5', 21),
  ('m1_22', 'deck_minna1', '病院', 'びょういん', 'shifoxona, kasalxona', 'びょういん - byouin', 'あそこは 神戸病院 です。 (Anavi yer Kobe shifoxonasi.)', 'N5', 22),
  ('m1_23', 'deck_minna1', '電気', 'でんき', 'chiroq', 'でんき - denki', '電気を つけて ください。 (Chiroqni yoqing, iltimos.)', 'N5', 23),
  ('m1_24', 'deck_minna1', 'だれ (どなた)', 'だれ (どなた)', 'kim? (どなた - hurmat shakli)', 'だれ (どなた) - dare (donata)', 'あの方は どなたですか。 (U kishi kimlar?)', 'N5', 24),
  ('m1_25', 'deck_minna1', '～歳', '～さい', '~yosh', '～さい - sai', 'わたしは 20歳 です。 (Men 20 yoshdaman.)', 'N5', 25),
  ('m1_26', 'deck_minna1', '何歳', 'なんさい', 'necha yosh', 'なんさい - nansai', 'お名前と おいくつ（何歳）ですか。 (Ismingiz nima va yoshingiz nechada?)', 'N5', 26),
  ('m1_27', 'deck_minna1', '何歳 (おいくつ)', 'なんさい (おいくつ)', 'necha yosh? (おいくつ - hurmat shakli)', 'なんさい (おいくつ) - nansai (oikutsu)', '失礼ですが、おいくつですか。 (Kechirasiz, yoshingiz nechada?)', 'N5', 27),
  ('m1_28', 'deck_minna1', 'はい', 'はい', 'ha', 'はい - hai', 'はい、そうです。 (Ha, shunday.)', 'N5', 28),
  ('m1_29', 'deck_minna1', 'いいえ', 'いいえ', 'yo''q', 'いいえ - iie', 'いいえ、違います。 (Yo''q, unday emas.)', 'N5', 29),
  ('m1_30', 'deck_minna1', '失礼ですが', 'しつれいですが', 'Kechirasiz, ~ (murojaat oldidan)', 'しつれいですが - shitsureidesuga', '失礼ですが、お名前は？ (Kechirasiz, ismingiz nima?)', 'N5', 30),
  ('m1_31', 'deck_minna1', 'お名前は？', 'おなまえは？', 'Ismingiz nima?', 'おなまえは？ - onamaewa', 'お名前は 何ですか。 (Ismingiz nima?)', 'N5', 31),
  ('m1_32', 'deck_minna1', '初めまして', 'はじめまして', 'Tanishganimdan xursandman / O''zimni tanishtirishga ruxsat bergaysiz', 'はじめまして - hajimemashite', '初めまして、マイク・ミラーです。 (Tanishganimdan xursandman, men Mayk Miller.)', 'N5', 32),
  ('m1_33', 'deck_minna1', 'どうぞよろしく', 'どうぞよろしく', 'Tanishganimdan mamnunman / Marhamat, yaxshi munosabatda bo''ling', 'どうぞよろしく - douzo yoroshiku', 'どうぞ よろしく お願いします。 (Marhamat, yaxshi munosabatda bo''ling / Tanishganimdan xursandman.)', 'N5', 33),
  ('m1_34', 'deck_minna1', 'お願いします', 'おねがいします', 'iltimos, so''rayman', 'おねがいします - onegaishimasu', 'これを お願いします。 (Buni iltimos qilaman.)', 'N5', 34),
  ('m1_35', 'deck_minna1', 'こちらは～さんです', 'こちらは～さんです', 'Bu kishi janob / xonim ~', 'こちらは～さんです - kochira wa ~ san desu', 'こちらは ミラーさんです。 (Bu kishi janob Miller.)', 'N5', 35),
  ('m1_36', 'deck_minna1', '～から来ました', '～からきました', '~dan keldim', '～からきました - ~ kara kimashita', 'わたしは アメリカから 来ました。 (Men Amerikadan keldim.)', 'N5', 36),
  ('m1_37', 'deck_minna1', 'アメリカ', 'アメリカ', 'Amerika, AQSH', 'アメリカ - amerika', 'ミラーさんは アメリカ人です。 (Janob Miller amerikalik.)', 'N5', 37),
  ('m1_38', 'deck_minna1', 'イギリス', 'イギリス', 'Angliya, Buyuk Britaniya', 'イギリス - igirisu', 'ワットさんは イギリスから 来ました。 (Janob Watt Angliyadan kelgan.)', 'N5', 38),
  ('m1_39', 'deck_minna1', 'インド', 'インド', 'Hindiston', 'インド - indo', 'グプタさんは インドの 会社員です。 (Janob Gupta hindistonlik firma xodimi.)', 'N5', 39),
  ('m1_40', 'deck_minna1', 'インドネシア', 'インドネシア', 'Indoneziya', 'インドネシア - indoneshia', 'インドネシアへ 旅行に 行きます。 (Indoneziyaga sayohatga boraman.)', 'N5', 40),
  ('m1_41', 'deck_minna1', '韓国', 'かんこく', 'Janubiy Koreya', 'かんこく - kankoku', '韓国の 料理は からいです。 (Koreys taomlari achchiq.)', 'N5', 41),
  ('m1_42', 'deck_minna1', 'タイ', 'タイ', 'Tailand', 'タイ - tai', 'タワポンさんは タイから 来ました。 (Janob Tawapon Tailanddan kelgan.)', 'N5', 42),
  ('m1_43', 'deck_minna1', '中国', 'ちゅうごく', 'Xitoy', 'ちゅうごく - chuugoku', 'ワンさんは 中国の 医者です。 (Janob Vang Xitoy shifokori.)', 'N5', 43),
  ('m1_44', 'deck_minna1', 'ドイツ', 'ドイツ', 'Olmoniya', 'ドイツ - doitsu', 'これは ドイツの 車です。 (Bu Germaniya mashinasi.)', 'N5', 44),
  ('m1_45', 'deck_minna1', '日本', 'にほん', 'Yaponiya', 'にほん - nihon', '日本の 生活は 楽しいです。 (Yaponiya hayoti maroqli.)', 'N5', 45),
  ('m1_46', 'deck_minna1', 'フランス', 'フランス', 'Fransiya', 'フランス - furansu', 'フランスの ワインを 飲みました。 (Fransiya vinosini ichdim.)', 'N5', 46),
  ('m1_47', 'deck_minna1', 'ブラジル', 'ブラジル', 'Braziliya', 'ブラジル - burajiru', 'サントスさんは ブラジル人です。 (Janob Santos braziliyalik.)', 'N5', 47),
  ('m1_48', 'deck_minna1', 'さくら大学 / 富士大学', 'さくらだいがく / ふじだいがく', 'universitet nomlari (to''qima)', 'さくらだいがく / ふじだいがく - sakura daigaku / fuji daigaku', '妹は さくら大学の 学生です。 (Singlim Sakura universiteti talabasi.)', 'N5', 48),
  ('m1_49', 'deck_minna1', 'パワー電気', 'パワーでんき', 'Power Denki (elektr kompaniyasi nomi)', 'パワーでんき - pawaa denki', 'シュミットさんは パワー電気の 社員です。 (Janob Shmidt Power Denki xodimi.)', 'N5', 49),
  ('m1_50', 'deck_minna1', '神戸病院', 'こうべびょういん', 'Kobe shifoxonasi', 'こうべびょういん - koube byouin', 'あの人は 神戸病院の 医者です。 (Anavi kishi Kobe shifoxonasi shifokori.)', 'N5', 50),
  ('m1_51', 'deck_minna1', 'これ', 'これ', 'bu (yaqindagi buyum)', 'これ - kore', 'これは 日本の 本 です。 (Bu Yaponiya kitobi.)', 'N5', 51),
  ('m1_52', 'deck_minna1', 'それ', 'それ', 'u, o''sha (tinglovchiga yaqin)', 'それ - sore', 'それは 英語の 辞書 ですか。 (U ingliz tili lug''atimi?)', 'N5', 52),
  ('m1_53', 'deck_minna1', 'あれ', 'あれ', 'ana u (uzoqdagi)', 'あれ - are', 'あれは わたしのかさです。 (Anavi mening soyabonim.)', 'N5', 53),
  ('m1_54', 'deck_minna1', 'この～', 'この～', 'bu (yaqindagi buyum)', 'この～ - kono', 'この本は わたしのです。 (Bu kitob meniki.)', 'N5', 54),
  ('m1_55', 'deck_minna1', 'その～', 'その～', 'u, o''sha (tinglovchiga yaqin)', 'その～ - sono', 'その時計は スイスの 時計です。 (U soat Shveytsariya soati.)', 'N5', 55),
  ('m1_56', 'deck_minna1', 'あの～', 'あの～', 'ana u (uzoqdagi)', 'あの～ - ano', 'あの車は ドイツの 自動車 です。 (Anavi mashina Germaniya avtomobili.)', 'N5', 56),
  ('m1_57', 'deck_minna1', '本', 'ほん', 'kitob', 'ほん - hon', '図書館で 本を 読みます。 (Kutubxonada kitob o''qiyman.)', 'N5', 57),
  ('m1_58', 'deck_minna1', '辞書', 'じしょ', 'lug`at', 'じしょ - jisho', 'これは 電子辞書 です。 (Bu elektron lug''at.)', 'N5', 58),
  ('m1_59', 'deck_minna1', '雑誌', 'ざっし', 'jurnal, oynoma', 'ざっし - zashi', 'カメラの 雑誌を 買いました。 (Kamera jurnali sotib oldim.)', 'N5', 59),
  ('m1_60', 'deck_minna1', '新聞', 'しんぶん', 'gazeta, ro`znoma', 'しんぶん - shinbun', '毎朝 新聞を 読みます。 (Har kuni ertalab gazeta o''qiyman.)', 'N5', 60),
  ('m1_61', 'deck_minna1', 'ノート', 'ノート', 'daftar', 'ノート - no-to', '新しい ノートに メモを 書きます。 (Yangi daftarga eslatma yozaman.)', 'N5', 61),
  ('m1_62', 'deck_minna1', '手帳', 'てちょう', 'yon daftar', 'てちょう - techou', '手帳に 予定を 書きます。 (Yon daftarchaga rejalarni yozaman.)', 'N5', 62),
  ('m1_63', 'deck_minna1', '名刺', 'めいし', 'tashrif qog`ozi', 'めいし - meishi', 'どうぞ 名刺を お受け取りください。 (Marhamat, tashrif qog''ozimni qabul qiling.)', 'N5', 63),
  ('m1_64', 'deck_minna1', 'カード', 'カード', 'kartochka', 'カード - ka-do', 'これは わたしの 学生カードです。 (Bu mening talabalik guvohnomam/kartochkam.)', 'N5', 64),
  ('m1_65', 'deck_minna1', 'テレホンカード', 'テレホンカード', 'telefon kartochkasi', 'テレホンカード - terehonka-do', '公衆電話で テレホンカードを 使います。 (Ko''cha telefonida telefon kartochkasi ishlatiladi.)', 'N5', 65),
  ('m1_66', 'deck_minna1', '鉛筆', 'えんぴつ', 'qalam', 'えんぴつ - enpitsu', '鉛筆で 名前を 書いて ください。 (Qalam bilan ismingizni yozing, iltimos.)', 'N5', 66),
  ('m1_67', 'deck_minna1', 'ボールペン', 'ボールペン', 'sharikli ruchka', 'ボールペン - bo-rupen', '黒い ボールペンで サインします。 (Qora sharikli ruchka bilan imzo chekaman.)', 'N5', 67),
  ('m1_68', 'deck_minna1', 'シャープペンシル', 'シャープペンシル', 'avtoqalam', 'シャープペンシル - sha-pupenshiru', 'この シャープペンシルは 使いやすいです。 (Bu avtomat qalamdan foydalanish qulay.)', 'N5', 68),
  ('m1_69', 'deck_minna1', 'かぎ', 'かぎ', 'qulf-kalit', 'かぎ - kagi', '部屋の かぎを かばんから 出します。 (Xonaning kalitini sumkamdan olaman.)', 'N5', 69),
  ('m1_70', 'deck_minna1', '時計', 'とけい', 'soat', 'とけい - tokei', 'この 時計は 父の 時計です。 (Bu soat otamning soati.)', 'N5', 70),
  ('m1_71', 'deck_minna1', '傘', 'かさ', 'soyabon', 'かさ - kasa', '雨ですから、かさを 持って 行きます。 (Yomg''ir yog''yapti, soyabon olib boraman.)', 'N5', 71),
  ('m1_72', 'deck_minna1', 'かばん', 'かばん', 'sumka', 'かばん - kaban', 'これは 軽い かばんです。 (Bu yengil sumka.)', 'N5', 72),
  ('m1_73', 'deck_minna1', 'カセットテープ', 'カセットテープ', 'audio tasma', 'カセットテープ - kasetote-pu', 'カセットテープで 日本語を 聞きました。 (Kasseta tasmasida yapon tilini eshitdim.)', 'N5', 73),
  ('m1_74', 'deck_minna1', 'テープレコーダー', 'テープレコーダー', 'magnitofon', 'テープレコーダー - te-pureko-da-', 'テープレコーダーで 発音を 録音します。 (Magnitafonda talaffuzni yozib olaman.)', 'N5', 74),
  ('m1_75', 'deck_minna1', 'テレビ', 'テレビ', 'televizor', 'テレビ - terebi', '毎晩 テレビを 見ます。 (Har kuni kechqurun televizor ko''raman.)', 'N5', 75),
  ('m1_76', 'deck_minna1', 'ラジオ', 'ラジオ', 'radio', 'ラジオ - rajio', 'ラジオで ニュースを 聞きます。 (Radioda yangiliklarni eshitaman.)', 'N5', 76),
  ('m1_77', 'deck_minna1', 'カメラ', 'カメラ', 'fotoapparat', 'カメラ - kamera', 'これは 新しい カメラです。 (Bu yangi fotoapparat.)', 'N5', 77),
  ('m1_78', 'deck_minna1', 'コンピューター', 'コンピューター', 'kompyuter', 'コンピューター - konpi-ta-', '会社の コンピューターを 使います。 (Kompaniya kompyuteridan foydalanaman.)', 'N5', 78),
  ('m1_79', 'deck_minna1', '自動車', 'じどうしゃ', 'avtomobil', 'じどうしゃ - jidousha', 'トヨタの 自動車は 有名です。 (Toyota avtomobillari mashhurdir.)', 'N5', 79),
  ('m1_80', 'deck_minna1', '机', 'つくえ', 'stol, parta', 'つくえ - tsukue', '机の 上に 本が あります。 (Stol ustida kitob bor.)', 'N5', 80),
  ('m1_81', 'deck_minna1', 'いす', 'いす', 'stul, kursi', 'いす - isu', 'いすに 座って ください。 (Stulga o''tiring, iltimos.)', 'N5', 81),
  ('m1_82', 'deck_minna1', 'チョコレート', 'チョコレート', 'shokolad', 'チョコレート - chokore-to', '友達に チョコレートを もらいました。 (Do''stimdan shokolad oldim.)', 'N5', 82),
  ('m1_83', 'deck_minna1', 'コーヒー', 'コーヒー', 'qahva (kofe)', 'コーヒー - ko-hi-', '毎朝 熱い コーヒーを 飲みます。 (Har ertalab qaynoq kofe ichaman.)', 'N5', 83),
  ('m1_84', 'deck_minna1', '英語', 'えいご', 'ingliz tili', 'えいご - eigo', 'スミスさんは 英語の 先生です。 (Janob Smit ingliz tili o''qituvchisi.)', 'N5', 84),
  ('m1_85', 'deck_minna1', '日本語', 'にほんご', 'yapon tili', 'にほんご - nihongo', '毎日 日本語を 一生懸命 勉強します。 (Har kuni yapon tilini astoydil o''rganaman.)', 'N5', 85),
  ('m1_86', 'deck_minna1', '～語', '～ご', '~tili', '～ご - go', 'ウズベク語を 話すことが できます。 (O''zbek tilida gaplasha olaman.)', 'N5', 86),
  ('m1_87', 'deck_minna1', '何', 'なん', 'nima', 'なん - nan', 'それは 何ですか。 (U nima?)', 'N5', 87),
  ('m1_88', 'deck_minna1', 'そう', 'そう', 'shunday', 'そう - sou', 'はい、その 通り そうです。 (Ha, xuddi shunday.)', 'N5', 88),
  ('m1_89', 'deck_minna1', '違います', 'ちがいます。', 'Noto''g''ri / Unday emas', 'ちがいます。 - chigaimasu', 'いいえ、違います。それは 辞書です。 (Yo''q, unday emas. U lug''at.)', 'N5', 89),
  ('m1_90', 'deck_minna1', 'そうですか', 'そうですか。', 'Shundaymi? / Tushunarli', 'そうですか。 - soudesuka', 'そうですか。よく わかりました。 (Shundaymi? Yaxshi tushundim.)', 'N5', 90),
  ('m1_91', 'deck_minna1', 'あのう', 'あのう', 'Haligi... (murojaat boshida)', 'あのう - anou', 'あのう、すみません。駅は どちらですか。 (Haligi, kechirasiz. Bekat qaysi tomonda?)', 'N5', 91),
  ('m1_92', 'deck_minna1', 'ほんの気持ちです', 'ほんのきもちです。', 'Arzimagan sovg''am / Ko''nglimdan chiqqani', 'ほんのきもちです。 - honnokimochidesu', 'これは ほんの 気持ちです。どうぞ。 (Bu arzimagan sovg''am. Marhamat.)', 'N5', 92),
  ('m1_93', 'deck_minna1', 'どうぞ', 'どうぞ。', 'Marhamat', 'どうぞ。 - douzo', 'どうぞ お入り ください。 (Marhamat, kiring.)', 'N5', 93),
  ('m1_94', 'deck_minna1', 'どうも', 'どうも。', 'Rahmat / Salom', 'どうも。 - doumo', 'どうも ありがとうございました。 (Katta rahmat.)', 'N5', 94),
  ('m1_95', 'deck_minna1', 'どうもありがとうございます', 'どうもありがとうございます', 'Katta rahmat', 'どうもありがとうございます - doumoarigatougozaimasu', '親切に 教えてくれて、どうも ありがとうございます。 (Mehribonlik bilan o''rgatganingiz uchun katta rahmat.)', 'N5', 95),
  ('m1_96', 'deck_minna1', 'これからお世話になります', 'これからおせわになります', 'Bundan buyon yordamingizga muhtojman', 'これからおせわになります - korekara osewa ni narimasu', '新入社員の ミラーです。これから お世話に なります。 (Yangi xodim Millerman. Bundan buyon mehr va yordamingizga muhtojman.)', 'N5', 96),
  ('m1_97', 'deck_minna1', 'こちらこそよろしく', 'こちらこそよろしく。', 'Men ham tanishganimdan mamnunman', 'こちらこそよろしく。 - kochirakosoyoroshiku', 'こちらこそ、どうぞ よろしく お願いします。 (Men ham siz bilan tanishganimdan bag''oyat mamnunman.)', 'N5', 97),
  ('m1_98', 'deck_minna1', 'ここ', 'ここ', 'bu yer, bu joy', 'ここ - koko', 'ここは 教室 です。 (Bu yer darsxona.)', 'N5', 98),
  ('m1_99', 'deck_minna1', 'そこ', 'そこ', 'u yer, u joy, o''sha yer, o''sha joy', 'そこ - soko', 'そこは 食堂 です。 (U yer oshxona.)', 'N5', 99),
  ('m1_100', 'deck_minna1', 'あそこ', 'あそこ', 'ana u yer, ana u joy', 'あそこ - asoko', 'あそこは 事務所 です。 (Anavi yer idora.)', 'N5', 100),
  ('m1_101', 'deck_minna1', 'どこ', 'どこ', 'qayer', 'どこ - doko', 'すみません、お手洗いは どこですか。 (Kechirasiz, hojatxona qayerda?)', 'N5', 101),
  ('m1_102', 'deck_minna1', 'こちら', 'こちら', 'bu kishi / bu tomon (biz taraf)', 'こちら - kochira', 'こちらは わたしの 親友の サントスさんです。 (Bu kishi mening qadrdon do''stim janob Santos.)', 'N5', 102),
  ('m1_103', 'deck_minna1', 'そちら', 'そちら', 'u yer, u taraf (そこ ning xushmuomala shakli)', 'そちら - sochira', 'エレベーターは そちらで ございます。 (Lift u tomonda.)', 'N5', 103),
  ('m1_104', 'deck_minna1', 'あちら', 'あちら', 'ana u yer, anavi taraf (あそこ ning xushmuomala shakli)', 'あちら - achira', '電話は あちらに ございます。 (Telefon ana u tarafda.)', 'N5', 104),
  ('m1_105', 'deck_minna1', 'どちら', 'どちら', 'qayer, qaysi tomon (どこ ning xushmuomala shakli)', 'どちら - dochira', 'お手洗いは どちらで ございますか。 (Hojatxona qaysi tomonda?)', 'N5', 105),
  ('m1_106', 'deck_minna1', '教室', 'きょうしつ', 'sinf, auditoriya', 'きょうしつ - kyoushitsu', '教室で 勉強します。 (Darsxonada o''qiyman.)', 'N5', 106),
  ('m1_107', 'deck_minna1', '食堂', 'しょくどう', 'oshxona', 'しょくどう - shokudou', '学生食堂で 昼ご飯を 食べます。 (Talabalar oshxonasida tushlik qilaman.)', 'N5', 107),
  ('m1_108', 'deck_minna1', '事務所', 'じむしょ', 'idora, ofis', 'じむしょ - jimusho', '事務所で 書類を もらいました。 (Idoradan hujjatlarni oldim.)', 'N5', 108),
  ('m1_109', 'deck_minna1', '会議室', 'かいぎしつ', 'majlislar zali', 'かいぎしつ - kaigishitsu', '3階の 会議室で ミーティングを します。 (3-qavatdagi majlislar xonasida yig''ilish o''tkazamiz.)', 'N5', 109),
  ('m1_110', 'deck_minna1', '受付', 'うけつけ', 'qabulxona', 'うけつけ - uketsuke', '受付で 部屋の かぎを もらいます。 (Qabulxonadan xona kalitini olaman.)', 'N5', 110),
  ('m1_111', 'deck_minna1', 'ロビー', 'ロビー', 'dahliz', 'ロビー - robi-', '1階の ロビーで 待ち合わせましょう。 (1-qavat kutilish zalida uchrashaylik.)', 'N5', 111),
  ('m1_112', 'deck_minna1', '部屋', 'へや', 'xona', 'へや - heya', 'わたしの 部屋は 2階に あります。 (Mening xonam 2-qavatda joylashgan.)', 'N5', 112),
  ('m1_113', 'deck_minna1', 'お手洗い', 'トイレおてあらい', 'hojatxona', 'トイレおてあらい - toireotearai', 'すみません、お手洗いは どこですか。 (Kechirasiz, hojatxona qayerda?)', 'N5', 113),
  ('m1_114', 'deck_minna1', '階段', 'かいだん', 'zina', 'かいだん - kaidan', '階段を 使いましょう。 (Keling, zinadan foydalanamiz.)', 'N5', 114),
  ('m1_115', 'deck_minna1', 'エレベーター', 'エレベーター', 'lift', 'エレベーター - erebe-ta-', 'エレベーターで 5階へ 上がります。 (Lift bilan 5-qavatga ko''tarilaman.)', 'N5', 115),
  ('m1_116', 'deck_minna1', 'エスカレーター', 'エスカレーター', 'eskalator', 'エスカレーター - esukare-ta-', 'エスカレーターで 2階へ 上がります。 (Eskalatorda 2-qavatga ko''tarilaman.)', 'N5', 116),
  ('m1_117', 'deck_minna1', 'お国 (国)', 'おくに (くに)', 'mamlakat, vatan (hurmat shakli)', 'おくに (くに) - okuni (kuni)', 'お国は どちらですか。 (Vataningiz qayerda?)', 'N5', 117),
  ('m1_118', 'deck_minna1', '会社', 'かいしゃ', 'firma, korxona', 'かいしゃ - kaisha', '朝 8時に 会社へ 行きます。 (Ertalab soat 8 da ishxonaga (firmaga) boraman.)', 'N5', 118),
  ('m1_119', 'deck_minna1', 'うち', 'うち', 'uy', 'うち - uchi', '6時に うちへ 帰ります。 (Soat 6 da uyga qaytaman.)', 'N5', 119),
  ('m1_120', 'deck_minna1', '電話', 'でんわ', 'telefon', 'でんわ - denwa', 'あそこに 公衆電話が あります。 (Ana u yerda umumiy telefon bor.)', 'N5', 120)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('m1_121', 'deck_minna1', '靴', 'くつ', 'poyafzal', 'くつ - kutsu', 'デパートで 新しい 靴を 買いました。 (Universamda yangi poyafzal sotib oldim.)', 'N5', 121),
  ('m1_122', 'deck_minna1', 'ネクタイ', 'ネクタイ', 'bo''yinbog', 'ネクタイ - nekutai', 'すてきな ネクタイを しめて います。 (Ajoyib bo''yinbog'' taqib olgan.)', 'N5', 122),
  ('m1_123', 'deck_minna1', 'ワイン', 'ワイン', 'musallas, sharob (vino)', 'ワイン - wain', 'イタリアの おいしい ワインを 飲みました。 (Italiyaning mazali vinosini ichdim.)', 'N5', 123),
  ('m1_124', 'deck_minna1', 'たばこ', 'たばこ', 'tamaki', 'たばこ - tabako', 'ここで たばこを 吸わないで ください。 (Bu yerda tamaki chekmang, iltimos.)', 'N5', 124),
  ('m1_125', 'deck_minna1', '売り場', 'うりば', 'sotuv rastasi, savdo bo''limi', 'うりば - uriba', 'ネクタイ売り場は 2階に あります。 (Galstuk bo''limi 2-qavatda.)', 'N5', 125),
  ('m1_126', 'deck_minna1', '地下', 'ちか', 'yer osti, yerto''la', 'ちか - chika', '地下に 食料品売り場が あります。 (Yerto''la qavatida oziq-ovqat bo''limi bor.)', 'N5', 126),
  ('m1_127', 'deck_minna1', '～階', '～かい', '~-qavat', '～かい - kai', '会議室は 3階に あります。 (Majlislar xonasi 3-qavatda.)', 'N5', 127),
  ('m1_128', 'deck_minna1', '何階', 'なんがい', 'nechanchi qavat', 'なんがい - nangai', '事務所は 何階ですか。 (Ofis nechanchi qavatda?)', 'N5', 128),
  ('m1_129', 'deck_minna1', '～円', '～えん', '~iyena', '～えん - en', 'この 本は 1,500円です。 (Bu kitob 1500 iyen.)', 'N5', 129),
  ('m1_130', 'deck_minna1', 'いくら', 'いくら', 'necha pul, necha pul turadi, qancha, qancha turadi', 'いくら - ikura', 'この ネクタイは いくらですか。 (Bu bo''yinbog'' (galstuk) qancha turadi?)', 'N5', 130),
  ('m1_131', 'deck_minna1', '百', 'ひゃく', 'yuz', 'ひゃく - hyaku', '百円の パンを 買いました。 (100 iyenlik non sotib oldim.)', 'N5', 131),
  ('m1_132', 'deck_minna1', '千', 'せん', 'ming', 'せん - sen', '千円札を 出しました。 (Ming iyenlik qog''oz pul berdim.)', 'N5', 132),
  ('m1_133', 'deck_minna1', '万', 'まん', 'o''n ming', 'まん - man', 'この カメラは 三万円でした。 (Bu fotoapparat 30 000 iyen edi.)', 'N5', 133),
  ('m1_134', 'deck_minna1', 'すみません', 'すみません。', 'Kechirasiz', 'すみません。 - sumimasen', 'すみません、駅は どちらですか。 (Kechirasiz, bekat qaysi tomonda?)', 'N5', 134),
  ('m1_135', 'deck_minna1', '～でございます', '～でございます', '~dir (です ning xushmuomala / rasmiy shakli)', '～でございます - de gozaimasu', '靴売り場は 2階で ございます。 (Poyafzal bo''limi 2-qavatda.)', 'N5', 135),
  ('m1_136', 'deck_minna1', '～を見せてください', '～をみせてください', '~ni ko''rsating, iltimos', '～をみせてください - ~ o misete kudasai', 'その 黒い 靴を 見せて ください。 (U qora poyafzalni ko''rsating, iltimos.)', 'N5', 136),
  ('m1_137', 'deck_minna1', 'じゃ', 'じゃ', 'U holda / Unda', 'じゃ - ja', 'じゃ、その ワインを ください。 (U holda ana u vinoni bering.)', 'N5', 137),
  ('m1_138', 'deck_minna1', '～をください', '～をください。', '~ni bering', '～をください。 - okudasai', 'この りんごを ください。 (Bu olmani bering.)', 'N5', 138),
  ('m1_139', 'deck_minna1', '新大阪', 'しんおおさか', 'Shin-Osaka (Osakadagi bekat nomi)', 'しんおおさか - shinoosaka', '新幹線で 新大阪へ 行きます。 (Shinkansen bilan Shin-Osakaga boraman.)', 'N5', 139),
  ('m1_140', 'deck_minna1', 'イタリア', 'イタリア', 'Italiya', 'イタリア - itaria', 'イタリアの 料理が 大好きです。 (Italiya taomlarini juda yoqtiraman.)', 'N5', 140),
  ('m1_141', 'deck_minna1', 'スイス', 'スイス', 'Shveysariya', 'スイス - suisu', 'これは スイスの 有名な 時計です。 (Bu Shveytsariyaning mashhur soati.)', 'N5', 141),
  ('m1_142', 'deck_minna1', 'MT / ヨーネン / アキックス', 'MT / yoonen / akikksu', 'to''qima kompaniya nomlari', 'MT / yoonen / akikksu', 'アキックスは 靴の ブランドです。 (Akiksu poyafzal brendidir.)', 'N5', 142),
  ('m1_143', 'deck_minna1', '起きます', 'おきます', 'uyg`onmoq', 'おきます - okimasu', '毎朝 6時に 起きます。 (Har kuni ertalab soat 6 da uyg''onaman.)', 'N5', 143),
  ('m1_144', 'deck_minna1', '寝ます', 'ねます', 'uxlamoq', 'ねます - nemasu', '夜 11時に 寝ます。 (Kechasi soat 11 da uxlayman.)', 'N5', 144),
  ('m1_145', 'deck_minna1', '働きます', 'はたらきます', 'ishlamoq', 'はたらきます - hatarakimasu', '月曜日から 金曜日まで 働きます。 (Dushanbadan jumagacha ishlayman.)', 'N5', 145),
  ('m1_146', 'deck_minna1', '休みます', 'やすみます', 'dam olmoq; qoldirmoq', 'やすみます - yasumimasu', '日曜日に 休みます。 (Yakshanba kuni dam olaman.)', 'N5', 146),
  ('m1_147', 'deck_minna1', '勉強します', 'べんきょうします', 'dars qilmoq, dars tayyorlamoq', 'べんきょうします - benkyoushimasu', '図書館で 日本語を 勉強します。 (Kutubxonada yapon tilini o''rganaman.)', 'N5', 147),
  ('m1_148', 'deck_minna1', '終わります', 'おわります', 'tugamoq', 'おわります - owarimasu', '授業は 5時に 終わります。 (Dars soat 5 da tugaydi.)', 'N5', 148),
  ('m1_149', 'deck_minna1', 'デパート', 'デパート', 'univermag', 'デパート - depa-to', 'デパートは 朝 10時から 開きます。 (Universam ertalab soat 10 dan ochiladi.)', 'N5', 149),
  ('m1_150', 'deck_minna1', '銀行', 'ぎんこう', 'bank', 'ぎんこう - ginkou', '銀行は 9時から 3時までです。 (Bank soat 9 dan 3 gacha ishlaydi.)', 'N5', 150),
  ('m1_151', 'deck_minna1', '郵便局', 'ゆうびんきょく', 'pochta idorasi', 'ゆうびんきょく - yuubinkyoku', '郵便局で 切手を 買います。 (Pochtada pochta markasi sotib olaman.)', 'N5', 151),
  ('m1_152', 'deck_minna1', '図書館', 'としょかん', 'kutubxona', 'としょかん - toshokan', '大学の 図書館で 調べます。 (Universitet kutubxonasida qidiraman.)', 'N5', 152),
  ('m1_153', 'deck_minna1', '美術館', 'びじゅつかん', 'badiiy san’at muzeyi', 'びじゅつかん - bijutsukan', '上野の 美術館へ 行きました。 (Uenodagi san''at muzeyiga bordim.)', 'N5', 153),
  ('m1_154', 'deck_minna1', '今', 'いま', 'hozir', 'いま - ima', '今 何時 ですか。 (Hozir soat necha?)', 'N5', 154),
  ('m1_155', 'deck_minna1', '～時', '～じ', 'soat~', '～じ - ji', '今 午前 9時です。 (Hozir ertalab soat 9.)', 'N5', 155),
  ('m1_156', 'deck_minna1', '～分', '～ふん～ぷん', '~daqiqa', '～ふん～ぷん - fun pun', '会議は 15分で 終わります。 (Yig''ilish 15 daqiqada tugaydi.)', 'N5', 156),
  ('m1_157', 'deck_minna1', '半', 'はん', 'yarim', 'はん - han', '毎朝 6時半に 起きます。 (Har kuni ertalab 6 yarimda uyg''onaman.)', 'N5', 157),
  ('m1_158', 'deck_minna1', '何時', 'なんじ', 'soat necha', 'なんじ - nanji', '今 何時ですか。 (Hozir soat necha?)', 'N5', 158),
  ('m1_159', 'deck_minna1', '何分', 'なんぷん', 'necha daqiqa', 'なんぷん - nanpun', '電車は 何分に 出ますか。 (Poyezd necha daqiqada jo''naydi?)', 'N5', 159),
  ('m1_160', 'deck_minna1', '午前', 'ごぜん', 'tushgacha bo''lgan vaqt (AM / ertalab)', 'ごぜん - gozen', '午前の 授業は 9時から 12時までです。 (Ertalabki dars 9 dan 12 gacha.)', 'N5', 160),
  ('m1_161', 'deck_minna1', '午後', 'ごご', 'tushdan keyingi vaqt (PM / kechki payt)', 'ごご - gogo', '午後は 図書館で 本を 読みます。 (Tushdan keyin kutubxonada kitob o''qiyman.)', 'N5', 161),
  ('m1_162', 'deck_minna1', '朝', 'あさ', 'tong, ertalab', 'あさ - asa', '朝 公園を 散歩します。 (Ertalab xiyobonni sayr qilaman.)', 'N5', 162),
  ('m1_163', 'deck_minna1', '昼', 'ひる', 'tush, kunduzi', 'ひる - hiru', '昼は 会社の 食堂で 同僚と 食べます。 (Kunduzi kompaniya oshxonasida hamkasblar bilan ovqatlanaman.)', 'N5', 163),
  ('m1_164', 'deck_minna1', '晩', 'ばんよる', '（夜） kech, kechqurun', 'ばんよる - banyoru', '晩 8時に 家へ 帰って テレビを 見ます。 (Kechqurun soat 8 da uyga qaytib televizor ko''raman.)', 'N5', 164),
  ('m1_165', 'deck_minna1', 'おととい', 'おととい', 'o''tgan kuni, kechadan oldingi kun', 'おととい - ototoi', 'おととい 友達と 映画を 見ました。 (Kechadan oldingi kuni do''stim bilan kino ko''rdim.)', 'N5', 165),
  ('m1_166', 'deck_minna1', 'きのう', 'きのう', 'kecha', 'きのう - kinou', 'きのう 図書館で 日本語を 3時間 勉強しました。 (Kecha kutubxonada yapon tilini 3 soat o''rgandim.)', 'N5', 166),
  ('m1_167', 'deck_minna1', 'きょう', 'きょう', 'bugun', 'きょう - kyou', 'きょうは 朝から とても いい 天気です。 (Bugun ertalabdan ob-havo juda yaxshi.)', 'N5', 167),
  ('m1_168', 'deck_minna1', 'あした', 'あした', 'ertaga', 'あした - ashita', 'あした 東京へ 出張します。 (Ertaga Tokioga xizmat safariga boraman.)', 'N5', 168),
  ('m1_169', 'deck_minna1', 'あさって', 'あさって', 'indinga, ertadan keyin', 'あさって - asate', 'あさって 日本語の 試験が あります。 (Indinga yapon tili imtihoni bor.)', 'N5', 169),
  ('m1_170', 'deck_minna1', 'けさ', 'けさ', 'bugun ertalab, bugun tongda', 'けさ - kesa', 'けさ パンと 果物を 食べました。 (Bugun ertalab non va meva yedim.)', 'N5', 170),
  ('m1_171', 'deck_minna1', '今晩', 'こんばん', 'bugun kechqurun', 'こんばん - konban', '今晩 テレビで サッカーを 見ます。 (Bugun oqshom televizorda futbol ko''raman.)', 'N5', 171),
  ('m1_172', 'deck_minna1', '休み', 'やすみ', 'dam olish, ta’til', 'やすみ - yasumi', '会社の 休みは 土曜日と 日曜日です。 (Kompaniyaning dam olish kunlari shanba va yakshanba.)', 'N5', 172),
  ('m1_173', 'deck_minna1', '昼休み', 'ひるやすみ', 'tushlik / tushki tanaffus', 'ひるやすみ - hiruyasumi', '昼休みに 友達と 食堂へ 行きます。 (Tushlik tanaffusida do''stim bilan oshxonaga boraman.)', 'N5', 173),
  ('m1_174', 'deck_minna1', '毎朝', 'まいあさ', 'har kuni ertalab, har tong', 'まいあさ - maiasa', '毎朝 新聞を 読んでから 会社へ 行きます。 (Har ertalab gazeta o''qib, keyin ishga boraman.)', 'N5', 174),
  ('m1_175', 'deck_minna1', '毎晩', 'まいばん', 'har kuni kechqurun', 'まいばん - maiban', '毎晩 11時に 布団に 入ります。 (Har kecha soat 11 da o''ringa yotaman.)', 'N5', 175),
  ('m1_176', 'deck_minna1', '毎日', 'まいにち', 'har kuni', 'まいにち - mainichi', '毎日 漢字の 練習を します。 (Har kuni kanji mashqini qilaman.)', 'N5', 176),
  ('m1_177', 'deck_minna1', '月曜日', 'げつようび', 'dushanba', 'げつようび - getsuyoubi', '月曜日から 金曜日まで 働きます。 (Dushanbadan jumagacha ishlayman.)', 'N5', 177),
  ('m1_178', 'deck_minna1', '火曜日', 'かようび', 'seshanba', 'かようび - kayoubi', '火曜日は 日本語の 授業が あります。 (Seshanba kuni yapon tili darsi bor.)', 'N5', 178),
  ('m1_179', 'deck_minna1', '水曜日', 'すいようび', 'chorshanba', 'すいようび - suiyoubi', '水曜日の 午後は 休みです。 (Chorshanba tushdan keyin dam olish.)', 'N5', 179),
  ('m1_180', 'deck_minna1', '木曜日', 'もくようび', 'payshanba', 'もくようび - mokuyoubi', '木曜日に 病院へ 行きます。 (Payshanba kuni shifoxonaga boraman.)', 'N5', 180),
  ('m1_181', 'deck_minna1', '金曜日', 'きんようび', 'juma', 'きんようび - kinyoubi', '金曜日の 夜 友達と 会います。 (Juma oqshomi do''stim bilan ko''rishaman.)', 'N5', 181),
  ('m1_182', 'deck_minna1', '土曜日', 'どようび', 'shanba', 'どようび - doyoubi', '土曜日に 部屋を 掃除します。 (Shanba kuni xonani tozalayman.)', 'N5', 182),
  ('m1_183', 'deck_minna1', '日曜日', 'にちようび', 'yakshanba', 'にちようび - nichiyoubi', '日曜日は 家族と 過ごします。 (Yakshanba kuni oilam bilan vaqt o''tkazaman.)', 'N5', 183),
  ('m1_184', 'deck_minna1', '何曜日', 'なんようび', 'haftaning qaysi kuni', 'なんようび - nanyoubi', 'きょうは 何曜日ですか。 (Bugun haftaning qaysi kuni?)', 'N5', 184),
  ('m1_185', 'deck_minna1', '番号', 'ばんごう', 'raqam', 'ばんごう - bangou', 'あなたの 携帯電話の 番号を 教えて ください。 (Mobil telefoningiz raqamini ayting, iltimos.)', 'N5', 185),
  ('m1_186', 'deck_minna1', '何番', 'なんばん', 'nechanchi raqam', 'なんばん - nanban', 'あなたの 電話番号は 何番ですか。 (Telefon raqamingiz necha?)', 'N5', 186),
  ('m1_187', 'deck_minna1', '～から', '～から', '~dan', '～から - kara', '時間が ありませんから、タクシーで 行きましょう。 (Vaqt yo''q, shuning uchun taksida boraylik.)', 'N5', 187),
  ('m1_188', 'deck_minna1', '～まで', '～まで', '~gacha, ~ ga qadar', '～まで - made', '郵便局は 5時までです。 (Pochta soat 5 gacha ishlaydi.)', 'N5', 188),
  ('m1_189', 'deck_minna1', '～と～', '～と～', '~ bilan ~', '～と～ - to', '机の 上に 本と ペンが あります。 (Stol ustida kitob va ruchka bor.)', 'N5', 189),
  ('m1_190', 'deck_minna1', '大変ですね', 'たいへんですね。', 'Qiyin bo''libdi / Og''ir ish ekan', 'たいへんですね。 - taihendesune', '残業ですか。大変ですね。 (Qo''shimcha ishmi? Qiyin bo''libdi-ya.)', 'N5', 190),
  ('m1_191', 'deck_minna1', 'えーと', 'えーと', 'Xo''sh... / Haligi...', 'えーと - e-to', 'えーと、何時に 会いましょうか。 (Xo''sh, soat nechada ko''rishaylik?)', 'N5', 191),
  ('m1_192', 'deck_minna1', '104 (ma''lumotlar xizmati)', '１０４', '104 raqami (ma''lumot xizmati)', '１０４ - ', '電話番号を 104で 調べます。 (Telefon raqamini 104 xizmatidan bilib olaman.)', 'N5', 192),
  ('m1_193', 'deck_minna1', 'かしこまりました', 'かしこまりました。', 'Tushundim, xo''p bo''ladi (xushmuomala)', 'かしこまりました。 - kashikomarimashita', 'かしこまりました。少々 お待ちください。 (Xo''p bo''ladi, bir oz kutib turing.)', 'N5', 193),
  ('m1_194', 'deck_minna1', 'お問い合わせの番号', 'おといあわせのばんごう', 'so''ralgan telefon raqami', 'おといあわせのばんごう - otoiawase no bangou', 'お問い合わせの番号は 03-1234-5678です。 (So''ralgan raqam 03-1234-5678.)', 'N5', 194),
  ('m1_195', 'deck_minna1', 'どうもありがとうございました', 'どうもありがとうございました。', 'Katta rahmat (minnatdorchilik)', 'どうもありがとうございました。 - doumoarigatougozaimashita', '親切に 教えてくれて、どうも ありがとうございました。 (Mehribonlik bilan tushuntirganingiz uchun katta rahmat.)', 'N5', 195),
  ('m1_196', 'deck_minna1', 'ニューヨーク', 'ニューヨーク', 'Nyu-York', 'ニューヨーク - ni-yo-ku', 'ニューヨークは 今 午前 4時です。 (Nyu-Yorkda hozir ertalab soat 4.)', 'N5', 196),
  ('m1_197', 'deck_minna1', 'ペキン', 'ペキン', 'Pekin', 'ペキン - pekin', 'ペキンは 中国の 首都です。 (Pekin Xitoyning poytaxti.)', 'N5', 197),
  ('m1_198', 'deck_minna1', 'ロンドン', 'ロンドン', 'London', 'ロンドン - rondon', 'ロンドンは 雨が 多いです。 (Londonda yomg''ir ko''p yog''adi.)', 'N5', 198),
  ('m1_199', 'deck_minna1', 'バンコク', 'バンコク', 'Bangkok', 'バンコク - bankoku', 'バンコクは とても 暑いです。 (Bangkok juda issiq.)', 'N5', 199),
  ('m1_200', 'deck_minna1', 'ロサンゼルス', 'ロサンゼルス', 'Los-Anjeles', 'ロサンゼルス - rosanzerusu', 'ロサンゼルスへ 飛行機で 行きます。 (Los-Anjelesga samolyotda boraman.)', 'N5', 200),
  ('m1_201', 'deck_minna1', 'やまと美術館', 'やまとびじゅつかん', 'Yamato muzeyi (to''qima)', 'やまとびじゅつかん - yamato bijutsukan', 'あした やまと美術館へ 行きます。 (Ertaga Yamato san''at muzeyiga boraman.)', 'N5', 201),
  ('m1_202', 'deck_minna1', '大阪デパート', 'おおさかデパート', 'Osaka universami', 'おおさかデパート - oosaka depaato', '大阪デパートで お土産を 買いました。 (Osaka universamida sovg''a sotib oldim.)', 'N5', 202),
  ('m1_203', 'deck_minna1', 'みどり図書館', 'みどりとしょかん', 'Midori kutubxonasi (to''qima)', 'みどりとしょかん - midori toshokan', 'みどり図書館は 月曜日が 休みです。 (Midori kutubxonasi dushanba kuni dam oladi.)', 'N5', 203),
  ('m1_204', 'deck_minna1', 'アップル銀行', 'アップルぎんこう', 'Apple banki (to''qima)', 'アップルぎんこう - appuru ginkou', 'アップル銀行で お金を 下ろします。 (Apple bankidan pul yechaman.)', 'N5', 204),
  ('m1_205', 'deck_minna1', '行きます', 'いきます', 'bormoq', 'いきます - ikimasu', 'あした 京都へ 行きます。 (Ertaga Kiotoga boraman.)', 'N5', 205),
  ('m1_206', 'deck_minna1', '来ます', 'きます', 'kelmoq', 'きます - kimasu', '友達が うちへ 来ました。 (Do''stim uyimga keldi.)', 'N5', 206),
  ('m1_207', 'deck_minna1', '帰ります', 'かえります', 'qaytmoq', 'かえります - kaerimasu', '午後 7時に 国へ 帰ります。 (Kechqurun soat 7 da yurtimga qaytaman.)', 'N5', 207),
  ('m1_208', 'deck_minna1', '学校', 'がっこう', 'maktab', 'がっこう - gakou', '自転車で 学校へ 行きます。 (Velosipedda maktabga boraman.)', 'N5', 208),
  ('m1_209', 'deck_minna1', 'スーパー', 'スーパー', 'supermarket, savdo do''koni', 'スーパー - su-pa-', '駅の前の スーパーで 買い物を します。 (Bekat oldidagi supermarketda xarid qilaman.)', 'N5', 209),
  ('m1_210', 'deck_minna1', '駅', 'えき', 'vokzal; bekat', 'えき - eki', '新宿駅で 電車を降ります。 (Shinjuku bekatida poyezddan tushaman.)', 'N5', 210),
  ('m1_211', 'deck_minna1', '飛行機', 'ひこうき', 'samolyot', 'ひこうき - hikouki', '飛行機で 10時間 かかります。 (Samolyotda 10 soat ketadi.)', 'N5', 211),
  ('m1_212', 'deck_minna1', '船', 'ふね', 'kema', 'ふね - fune', '横浜から 船に 乗ります。 (Yokogamadan kemaga o''tiraman.)', 'N5', 212),
  ('m1_213', 'deck_minna1', '電車', 'でんしゃ', 'poyezd', 'でんしゃ - densha', '地下鉄と 電車を 使います。 (Metro va elektr poyezddan foydalanaman.)', 'N5', 213),
  ('m1_214', 'deck_minna1', '地下鉄', 'ちかてつ', 'metro', 'ちかてつ - chikatetsu', '東京の 地下鉄は 便利です。 (Tokio metrosi juda qulaydir.)', 'N5', 214),
  ('m1_215', 'deck_minna1', '新幹線', 'しんかんせん', '“sinkansen” tez yurar poyezdi', 'しんかんせん - shinkansen', '新幹線で 大阪へ 行きました。 (Tezyurar Shinkansenda Osakaga bordim.)', 'N5', 215),
  ('m1_216', 'deck_minna1', 'バス', 'バス', 'avtobus', 'バス - basu', 'バス停で バスを 待ちます。 (Bekatda avtobus kutaman.)', 'N5', 216),
  ('m1_217', 'deck_minna1', 'タクシー', 'タクシー', 'taksi', 'タクシー - takushi-', '雨ですから、タクシーで 行きましょう。 (Yomg''ir yog''yapti, taksida boraylik.)', 'N5', 217),
  ('m1_218', 'deck_minna1', '自転車', 'じてんしゃ', 'velosiped', 'じてんしゃ - jitensha', '弟の 自転車を 借りました。 (Ukamning velosipedini qarzga oldim.)', 'N5', 218),
  ('m1_219', 'deck_minna1', '歩いて', 'あるいて', 'piyoda', 'あるいて - aruite', '駅から 家まで 歩いて 行きます。 (Bekatdan uygacha piyoda boraman.)', 'N5', 219),
  ('m1_220', 'deck_minna1', '人', 'ひと', 'odam, kishi, inson', 'ひと - hito', '親切な 人に 会いました。 (Mehribon inson bilan uchrashdim.)', 'N5', 220),
  ('m1_221', 'deck_minna1', '友達', 'ともだち', 'do''st, dugona', 'ともだち - tomodachi', '友達と いっしょに 映画を 見ました。 (Do''stim bilan birga kino ko''rdim.)', 'N5', 221),
  ('m1_222', 'deck_minna1', '彼', 'かれ', 'u (erkak kishi)', 'かれ - kare', '彼は 英語が 上手です。 (U (yigit) ingliz tilida ravon so''zlashadi.)', 'N5', 222),
  ('m1_223', 'deck_minna1', '彼女', 'かのじょ', 'u (ayol kishi)', 'かのじょ - kanojo', '彼女は さくら大学の 学生です。 (U (qiz) Sakura universiteti talabasi.)', 'N5', 223),
  ('m1_224', 'deck_minna1', '家族', 'かぞく', 'oila', 'かぞく - kazoku', '家族と 電話で 話しました。 (Oilam bilan telefonda gaplashdim.)', 'N5', 224),
  ('m1_225', 'deck_minna1', '一人で', 'ひとりで', 'bir o''zi(~m, ~ng ), yakka', 'ひとりで - hitoride', '一人で 部屋を 掃除しました。 (Bir o''zim xonani tozaladim.)', 'N5', 225),
  ('m1_226', 'deck_minna1', '先週', 'せんしゅう', 'o''tgan hafta', 'せんしゅう - senshuu', '先週 京都の 有名な お寺へ 行きました。 (O''tgan hafta Kiotoning mashhur ibodatxonasiga bordim.)', 'N5', 226),
  ('m1_227', 'deck_minna1', '今週', 'こんしゅう', 'bu hafta', 'こんしゅう - konshuu', '今週は レポートの 提出で とても 忙しいです。 (Bu hafta hisobot topshirish bilan juda bandman.)', 'N5', 227),
  ('m1_228', 'deck_minna1', '来週', 'らいしゅう', 'kelasi hafta', 'らいしゅう - raishuu', '来週の 月曜日に 日本語の 試験が あります。 (Kelasi dushanba kuni yapon tili imtihoni bor.)', 'N5', 228),
  ('m1_229', 'deck_minna1', '先月', 'せんげつ', 'o''tgan oy', 'せんげつ - sengetsu', '先月 日本へ 来ました。 (O''tgan oy Yaponiyaga keldim.)', 'N5', 229),
  ('m1_230', 'deck_minna1', '今月', 'こんげつ', 'bu oy', 'こんげつ - kongetsu', '今月は 休みが 少ないです。 (Bu oy dam olish kunlari kam.)', 'N5', 230),
  ('m1_231', 'deck_minna1', '来月', 'らいげつ', 'kelasi oy', 'らいげつ - raigetsu', '来月 大阪へ 出張します。 (Kelasi oy Osakaga xizmat safariga boraman.)', 'N5', 231),
  ('m1_232', 'deck_minna1', '去年', 'きょねん', 'o''tgan yili', 'きょねん - kyonen', '去年 大学を 卒業しました。 (O''tgan yili universitetni bitirdim.)', 'N5', 232),
  ('m1_233', 'deck_minna1', '今年', 'ことし', 'bu yil', 'ことし - kotoshi', '今年は 日本語の 試験に 合格したいです。 (Bu yil yapon tili imtihonidan o''tmoqchiman.)', 'N5', 233),
  ('m1_234', 'deck_minna1', '来年', 'らいねん', 'kelasi yil', 'らいねん - rainen', '来年 日本の 会社で 働きます。 (Kelasi yili Yaponiya korxonasida ishlayman.)', 'N5', 234),
  ('m1_235', 'deck_minna1', '～月', '～がつ', '~chi oy, ~oyi', '～がつ - gatsu', '4月に 新しい 学期が 始まります。 (Aprel oyida yangi o''quv davri boshlanadi.)', 'N5', 235),
  ('m1_236', 'deck_minna1', '何月', 'なんがつ', 'qaysi oy', 'なんがつ - nangatsu', 'あなたの 誕生日は 何月ですか。 (Tug''ilgan kuningiz qaysi oyda?)', 'N5', 236),
  ('m1_237', 'deck_minna1', '1日 (ついたち)', 'ついたち', 'oyning 1-sanasi', 'ついたち - tsuitachi', '毎月 一日は 掃除の 日です。 (Har oyning 1-sanasi tozalik kuni.)', 'N5', 237),
  ('m1_238', 'deck_minna1', '2日 (ふつか)', 'ふつか', 'oyning 2-sanasi, ikki kun', 'ふつか - futsuka', '二日に 友達と 会います。 (2-sanada do''stim bilan ko''rishaman.)', 'N5', 238),
  ('m1_239', 'deck_minna1', '3日 (みっか)', 'みっか', 'oyning 3-sanasi, uch kun', 'みっか - mikka', '三日間 京都を 旅行しました。 (Uch kun Kioto bo''ylab sayohat qildim.)', 'N5', 239),
  ('m1_240', 'deck_minna1', '4日 (よっか)', 'よっか', 'oyning 4-sanasi, to''rt kun', 'よっか - yokka', '5月四日は 祝日です。 (4-may bayram kuni.)', 'N5', 240)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
-- @@CHUNK@@
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('m1_241', 'deck_minna1', '5日 (いつか)', 'いつか', 'oyning 5-sanasi, besh kun', 'いつか - itsuka', 'こどもの日は 5月五日です。 (Bolalar kuni 5-mayda.)', 'N5', 241),
  ('m1_242', 'deck_minna1', '6日 (むいか)', 'むいか', 'oyning 6-sanasi, olti kun', 'むいか - muika', '六日に 手紙が 届きました。 (6-sanada xat yetib keldi.)', 'N5', 242),
  ('m1_243', 'deck_minna1', '7日 (なのか)', 'なのか', 'oyning 7-sanasi, yetti kun', 'なのか - nanoka', '七夕の お祭りは 7月七日です。 (Tanabata bayrami 7-iyulda.)', 'N5', 243),
  ('m1_244', 'deck_minna1', '8日 (ようか)', 'ようか', 'oyning 8-sanasi, sakkiz kun', 'ようか - youka', '八日に 会議が あります。 (8-sanada majlis bor.)', 'N5', 244),
  ('m1_245', 'deck_minna1', '9日 (ここのか)', 'ここのか', 'oyning 9-sanasi, to''qqiz kun', 'ここのか - kokonoka', '九日に 国へ 荷物を 送ります。 (9-sanada yurtimga posilka jo''nataman.)', 'N5', 245),
  ('m1_246', 'deck_minna1', '10日 (とおか)', 'とおか', 'oyning 10-sanasi, o''n kun', 'とおか - tooka', '十日後に また 会いましょう。 (O''n kundan so''ng yana uchrashaylik.)', 'N5', 246),
  ('m1_247', 'deck_minna1', '14日 (じゅうよっか)', 'じゅうよっか', 'oyning 14-sanasi, 14 kun', 'じゅうよっか - juuyokka', '2月十四日は バレンタインデーです。 (14-fevral Sevishganlar kuni.)', 'N5', 247),
  ('m1_248', 'deck_minna1', '20日 (はつか)', 'はつか', 'oyning 20-sanasi, 20 kun', 'はつか - hatsuka', '二十日に 給料を もらいます。 (20-sanada oylik maosh olaman.)', 'N5', 248),
  ('m1_249', 'deck_minna1', '24日 (にじゅうよっか)', 'にじゅうよっか', 'oyning 24-sanasi, 24 kun', 'にじゅうよっか - nijuuyokka', '十二月二十四日は クリスマスイブです。 (24-dekabr Rojdestvo arafasi.)', 'N5', 249),
  ('m1_250', 'deck_minna1', '～日', '～にち', '~chi sana, ~chi kun; ~kun', '～にち - nichi', 'きょうは 何日ですか。 (Bugun nechanchi sana?)', 'N5', 250),
  ('m1_251', 'deck_minna1', '何日', 'なんにち', 'oyning nechanchi sanasi; necha kun', 'なんにち - nannichi', '国へ 帰るのは 何日ですか。 (Yurtingizga qaytish qaysi sanada?)', 'N5', 251),
  ('m1_252', 'deck_minna1', 'いつ', 'いつ', 'qachon', 'いつ - itsu', 'いつ 日本へ 行きますか。 (Qachon Yaponiyaga borasiz?)', 'N5', 252),
  ('m1_253', 'deck_minna1', '誕生日', 'たんじょうび', 'tug''ilgan kun', 'たんじょうび - tanjoubi', '誕生日 おめでとうございます。 (Tug''ilgan kuningiz muborak bo''lsin!)', 'N5', 253),
  ('m1_254', 'deck_minna1', '普通', 'ふつう', 'oddiy poyezd', 'ふつう - futsuu', '各駅停車の 普通電車で のんびり 行きます。 (Har bekatda to''xtaydigan oddiy poyezdda ketaman.)', 'N5', 254),
  ('m1_255', 'deck_minna1', '急行', 'きゅうこう', 'tez yurar poyezd', 'きゅうこう - kyuukou', '急行電車に 乗ると、早く 着きます。 (Tez yurar poyezdga chiqsangiz tezroq yetib borasiz.)', 'N5', 255),
  ('m1_256', 'deck_minna1', '特急', 'とっきゅう', 'ekspress (tez yurar) poyezd', 'とっきゅう - tokyuu', '特急券を 買って、特急に 乗りました。 (Ekspress chiptasini sotib olib, ekspress poyezdga chiqdim.)', 'N5', 256),
  ('m1_257', 'deck_minna1', '次の', 'つぎの', 'kelasi, keyingi, navbatdagi', 'つぎの - tsugino', '次の 角を 左へ 曲がります。 (Keyingi burilishdan chapga qayrilaman.)', 'N5', 257),
  ('m1_258', 'deck_minna1', 'どういたしまして', 'どういたしまして。', 'Arzimaydi', 'どういたしまして。 - douitashimashite', 'ありがとう。― いいえ、どういたしまして。 (Rahmat. - Yo''g''-e, arzimaydi.)', 'N5', 258),
  ('m1_259', 'deck_minna1', '～番線', '～ばんせん', '~yo''l, ~platforma', '～ばんせん - ~ bansen', '東京行きは 3番線から 出ます。 (Tokioga boradigan poyezd 3-yo''ldan jo''naydi.)', 'N5', 259),
  ('m1_260', 'deck_minna1', '博多', 'はかた', 'Hakata (Kyushyudagi shahar)', 'はかた - hakata', '新幹線で 博多まで 行きました。 (Shinkansen bilan Hakatagacha bordim.)', 'N5', 260),
  ('m1_261', 'deck_minna1', '伏見', 'ふしみ', 'Fushimi (Kiotodagi tuman)', 'ふしみ - fushimi', '京都の 伏見稲荷へ 行きました。 (Kiotoning Fushimi Inari ibodatxonasiga bordim.)', 'N5', 261),
  ('m1_262', 'deck_minna1', '甲子園', 'こうしえん', 'Koshien (Osaka yaqinidagi shahar)', 'こうしえん - koushien', '甲子園で 高校野球を 見ました。 (Koshiyenda yuqori maktab beysbol o''yinini ko''rdim.)', 'N5', 262),
  ('m1_263', 'deck_minna1', '大阪城', 'おおさかじょう', 'Osaka qal''asi', 'おおさかじょう - oosakajou', '大阪城は とても 有名な お城です。 (Osaka qal''asi juda mashhur qal''a.)', 'N5', 263),
  ('m1_264', 'deck_minna1', '食べます', 'たべます', 'yemoq', 'たべます - tabemasu', '朝ごはんに パンと 卵を 食べます。 (Nonushtaga non va tuxum yeyman.)', 'N5', 264),
  ('m1_265', 'deck_minna1', '飲みます', 'のみます', 'ichmoq', 'のみます - nomimasu', '毎朝 冷たい 牛乳を 飲みます。 (Har ertalab sovuq sut ichaman.)', 'N5', 265),
  ('m1_266', 'deck_minna1', '吸います', 'すいます', 'chekmoq', 'すいます - suimasu', 'たばこを 吸いません。 (Tamaki chekmayman.)', 'N5', 266),
  ('m1_267', 'deck_minna1', 'たばこを吸います', 'たばこをすいます', 'tamaki chekmoq', 'たばこをすいます - tabako o suimasu', 'ここで たばこを 吸わないで ください。 (Bu yerda tamaki chekmang, iltimos.)', 'N5', 267),
  ('m1_268', 'deck_minna1', '見ます', 'みます', 'ko''rmoq', 'みます - mimasu', '昨夜 テレビで サッカーの 試合を 見ました。 (Kecha tunda televizorda futbol o''yinini ko''rdim.)', 'N5', 268),
  ('m1_269', 'deck_minna1', '聞きます', 'ききます', 'eshitmoq', 'ききます - kikimasu', '毎朝 ラジオで ニュースを 聞きます。 (Har ertalab radioda yangiliklarni tinglayman.)', 'N5', 269),
  ('m1_270', 'deck_minna1', '読みます', 'よみます', 'o''qimoq', 'よみます - yomimasu', '図書館で 日本語の 本を 読みます。 (Kutubxonada yaponcha kitob o''qiyman.)', 'N5', 270),
  ('m1_271', 'deck_minna1', '書きます', 'かきます', 'yozmoq', 'かきます - kakimasu', '友達に 手紙を 書きました。 (Do''stimga xat yozdim.)', 'N5', 271),
  ('m1_272', 'deck_minna1', '買います', 'かいます', 'sotib olmoq', 'かいます - kaimasu', 'スーパーで 新鮮な 果物を 買いました。 (Supermarketdan yangi meva sotib oldim.)', 'N5', 272),
  ('m1_273', 'deck_minna1', '撮ります', 'とります', 'olmoq', 'とります - torimasu', '公園で きれいな 花の 写真を 撮りました。 (Bog''da chiroyli gul rasmini oldim.)', 'N5', 273),
  ('m1_274', 'deck_minna1', '写真を撮ります', 'しゃしんをとります', 'fotosuratga olmoq, rasmga tushmoq', 'しゃしんをとります - shashin o torimasu', '京都で たくさん 写真を 撮りました。 (Kiotoda ko''p rasmga tushdim.)', 'N5', 274),
  ('m1_275', 'deck_minna1', 'します', 'します', 'qilmoq, bajarmoq', 'します - shimasu', '土曜日に サッカーを します。 (Shanba kuni futbol o''ynayman.)', 'N5', 275),
  ('m1_276', 'deck_minna1', '会います', 'あいます', 'uchratmoq', 'あいます - aimasu', '駅前で 友達に 会いました。 (Bekat oldida do''stim bilan ko''rishdim.)', 'N5', 276),
  ('m1_277', 'deck_minna1', '友達に会います', 'ともだちにあいます', 'do''st bilan uchrashmoq', 'ともだちにあいます - tomodachi ni aimasu', '土曜日に 駅で 友達に 会います。 (Shanba kuni bekatda do''stim bilan ko''rishaman.)', 'N5', 277),
  ('m1_278', 'deck_minna1', 'ごはん', 'ごはん', 'ovqat; qaynatilgan guruch', 'ごはん - gohan', '毎朝 温かい ごはんを 食べます。 (Har ertalab issiq oq guruch/ovqat yeyman.)', 'N5', 278),
  ('m1_279', 'deck_minna1', '朝ごはん', 'あさごはん', 'ertalabki nonushta', 'あさごはん - asagohan', '朝ごはんは いつも パンと コーヒーです。 (Nonushta har doim non va kofe.)', 'N5', 279),
  ('m1_280', 'deck_minna1', '昼ごはん', 'ひるごはん', 'tushlik', 'ひるごはん - hirugohan', '12時半に 会社の 食堂で 昼ごはんを 食べます。 (12 yarimda kompaniya oshxonasida tushlik qilaman.)', 'N5', 280),
  ('m1_281', 'deck_minna1', '晩ごはん', 'ばんごはん', 'kechki ovqat', 'ばんごはん - bangohan', '家族と いっしょに 晩ごはんを 食べました。 (Oilam bilan birga kechki ovqat yedim.)', 'N5', 281),
  ('m1_282', 'deck_minna1', 'パン', 'パン', 'non', 'パン - pan', 'パン屋で おいしい パンを 買いました。 (Novvoyxonadan mazali non sotib oldim.)', 'N5', 282),
  ('m1_283', 'deck_minna1', '卵', 'たまご', 'tuxum', 'たまご - tamago', '毎朝 卵を 1個 食べます。 (Har ertalab bitta tuxum yeyman.)', 'N5', 283),
  ('m1_284', 'deck_minna1', '肉', 'にく', 'go''sht', 'にく - niku', '牛肉と 豚肉を 買いました。 (Mol go''shti va cho''chqa go''shti sotib oldim.)', 'N5', 284),
  ('m1_285', 'deck_minna1', '魚', 'さかな', 'baliq', 'さかな - sakana', '日本の 魚は とても 新鮮です。 (Yaponiyaning balig''i juda yangi/toza.)', 'N5', 285),
  ('m1_286', 'deck_minna1', '野菜', 'やさい', 'sabzavot, poliz ekinlari', 'やさい - yasai', '健康のために 野菜を たくさん 食べます。 (Salomatlik uchun ko''p sabzavot yeyman.)', 'N5', 286),
  ('m1_287', 'deck_minna1', '果物', 'くだもの', 'meva', 'くだもの - kudamono', 'デザートに 甘い 果物を 食べました。 (Shirinlikka shirin meva yedim.)', 'N5', 287),
  ('m1_288', 'deck_minna1', '水', 'みず', 'suv', 'みず - mizu', '冷たい 水を 1杯 ください。 (Bir piyola sovuq suv bering.)', 'N5', 288),
  ('m1_289', 'deck_minna1', 'お茶', 'おちゃ', 'choy', 'おちゃ - ocha', '日本の 伝統的な お茶（茶道）を 体験しました。 (Yapon an''anaviy choy marosimini sinab ko''rdim.)', 'N5', 289),
  ('m1_290', 'deck_minna1', '紅茶', 'こうちゃ', 'qora choy', 'こうちゃ - koucha', '午後に レモンティー（紅茶）を 飲みました。 (Tushdan keyin qora choy ichdim.)', 'N5', 290),
  ('m1_291', 'deck_minna1', '牛乳', 'ぎゅうにゅう', 'sut', 'ぎゅうにゅう - gyuunyuu', '毎朝 牛乳を コップ1杯 飲みます。 (Har ertalab bir stakan sut ichaman.)', 'N5', 291),
  ('m1_292', 'deck_minna1', 'ミルク', 'ミルク', 'sut', 'ミルク - miruku', 'コーヒーに ミラー（牛乳）を 入れます。 (Kofega sut qo''shaman.)', 'N5', 292),
  ('m1_293', 'deck_minna1', 'ジュース', 'ジュース', 'sharbat', 'ジュース - ji-su', 'オレンジジュースを 注文しました。 (Apelsin sharbati buyurtma qildim.)', 'N5', 293),
  ('m1_294', 'deck_minna1', 'ビール', 'ビール', 'pivo', 'ビール - bi-ru', '仕事の 後で 冷たい ビールを 飲みました。 (Ishdan keyin sovuq pivo ichdim.)', 'N5', 294),
  ('m1_295', 'deck_minna1', '酒', 'おさけお', 'guruchdan tayyorlangan yapon arog''i', 'おさけお - osakeo', 'お正月には 日本酒（酒）を 飲みます。 (Yangi yilda yapon sakesini ichamiz.)', 'N5', 295),
  ('m1_296', 'deck_minna1', 'ビデオ', 'ビデオ', 'video', 'ビデオ - bideo', '休みの 日に 部屋で ビデオを 見ます。 (Dam olish kuni xonamda video ko''raman.)', 'N5', 296),
  ('m1_297', 'deck_minna1', '映画', 'えいが', 'kino', 'えいが - eiga', 'きのう 映画館へ 映画を 見に 行きました。 (Kecha kinoteatrga film ko''rishga bordim.)', 'N5', 297),
  ('m1_298', 'deck_minna1', 'CD', 'ＣＤ', 'kompakt-disk', 'ＣＤ - ', '日本の 歌手の CDを 買いました。 (Yapon qo''shiqchisining diskini sotib oldim.)', 'N5', 298),
  ('m1_299', 'deck_minna1', '手紙', 'てがみ', 'xat, maktub', 'てがみ - tegami', '国に いる 母親に 手紙を 書きました。 (Yurtimdagi onamga xat yozdim.)', 'N5', 299),
  ('m1_300', 'deck_minna1', 'レポート', 'レポート', 'hisobot; ma''ruza', 'レポート - repo-to', 'パソコンで 日本語の レポートを 作成しました。 (Kompyuterda yapon tili hisobotini tayyorladim.)', 'N5', 300),
  ('m1_301', 'deck_minna1', '写真', 'しゃしん', 'fotosurat', 'しゃしん - shashin', '京都で たくさん 写真を 撮りました。 (Kiotoda ko''p rasmga tushdim.)', 'N5', 301),
  ('m1_302', 'deck_minna1', '店', 'みせ', 'do''kon', 'みせ - mise', 'あの 店の 料理は とても おいしいです。 (Anavi do''konning taomlari juda mazali.)', 'N5', 302),
  ('m1_303', 'deck_minna1', 'レストラン', 'レストラン', 'restoran', 'レストラン - resutoran', '誕生日に 高級な レストランへ 行きました。 (Tug''ilgan kunimda qimmat restoranga bordim.)', 'N5', 303),
  ('m1_304', 'deck_minna1', '庭', 'にわ', 'hovli, bog', 'にわ - niwa', 'うちの 庭に きれいな 花が 咲いています。 (Uyimiz hovlisida chiroyli gullar ochilib yotibdi.)', 'N5', 304),
  ('m1_305', 'deck_minna1', '宿題', 'しゅくだい', 'uyga vazifa', 'しゅくだい - shukudai', '寝る 前に 日本語の 宿題を します。 (Uxlamasdan oldin yapon tili vazifasini bajaraman.)', 'N5', 305),
  ('m1_306', 'deck_minna1', 'テニス', 'テニス', 'tennis ( ～します tennis o''ynamoq)', 'テニス - tenisu', '毎週 日曜日に 友達と テニスを します。 (Har yakshanba do''stim bilan tennis o''ynayman.)', 'N5', 306),
  ('m1_307', 'deck_minna1', 'サッカー', 'サッカー', 'futbol ( ～します futbol o''ynamoq)', 'サッカー - saka-', '放課後に 公園で サッカーを しました。 (Darsdan so''ng bog''da futbol o''ynadim.)', 'N5', 307),
  ('m1_308', 'deck_minna1', 'お花見', 'おはなみ', 'gullagan sakura daraxtini tomosha qilish', 'おはなみ - ohanami', '春に 桜の 木の 下で お花見を します。 (Bahorda sakura daraxti tagida sayil qilamiz.)', 'N5', 308),
  ('m1_309', 'deck_minna1', 'いっしょに', 'いっしょに', 'birga', 'いっしょに - ishoni', 'いっしょに 京都へ 旅行に 行きませんか。 (Birga Kiotoga sayohatga bormaymizmi?)', 'N5', 309),
  ('m1_310', 'deck_minna1', 'ちょっと', 'ちょっと', 'bir oz, ozgina, ozroq', 'ちょっと - choto', 'ちょっと 待って ください。 (Biroz kutib turing.)', 'N5', 310),
  ('m1_311', 'deck_minna1', 'いつも', 'いつも', 'har doim, doimo', 'いつも - itsumo', 'わたしは いつも 7時に 起きます。 (Men har doim soat 7 da turaman.)', 'N5', 311),
  ('m1_312', 'deck_minna1', '時々', 'ときどき', 'ba''zan', 'ときどき - tokidoki', '休みの 日には 時々 映画を 見ます。 (Dam olish kunlari vaqti-vaqti bilan kino ko''raman.)', 'N5', 312),
  ('m1_313', 'deck_minna1', 'それから', 'それから', 'undan so''ng, undan keyin; shundan so''ng, shundan keyin', 'それから - sorekara', 'スーパーで パンを 買いました。それから 映画を 見ました。 (Supermarketdan non sotib oldim. So''ngra kino ko''rdim.)', 'N5', 313),
  ('m1_314', 'deck_minna1', 'ええ', 'ええ', 'ha (og''zaki)', 'ええ - ee', 'いっしょに 行きませんか。― ええ、行きましょう。 (Birga bormaymizmi? - Ha, ketdik.)', 'N5', 314),
  ('m1_315', 'deck_minna1', 'いいですね', 'いいですね。', 'Juda yaxshi / Ma''qul', 'いいですね。 - iidesune', 'あした 映画を 見ませんか。― いいですね。 (Ertaga kino ko''rmaymizmi? - Juda zo''r fikr.)', 'N5', 315),
  ('m1_316', 'deck_minna1', 'わかりました', 'わかりました。', 'Tushundim', 'わかりました。 - wakarimashita', '駅で 待って いてください。― はい、わかりました。 (Bekatda kutib turing. - Xo''p, tushundim.)', 'N5', 316),
  ('m1_317', 'deck_minna1', '何ですか', 'なんですか', 'Nima deysiz? / Labbay?', 'なんですか - nan desu ka', 'ミラーさん。― 何ですか。 (Janob Miller. - Labbay, nima deysiz?)', 'N5', 317),
  ('m1_318', 'deck_minna1', 'じゃ、また', 'じゃ、またあした', 'Xayr, ko''rishguncha', 'じゃ、またあした - jamataashita', 'じゃ、また あした。 (Mayli, ertagacha.)', 'N5', 318),
  ('m1_319', 'deck_minna1', 'メキシコ', 'メキシコ', 'Meksika', 'メキシコ - mekishiko', 'サントスさんは メキシコへ 出張しました。 (Janob Santos Meksikaga xizmat safariga bordi.)', 'N5', 319),
  ('m1_320', 'deck_minna1', '大阪城公園', 'おおさかじょうこうえん', 'Osaka qal''asi bog''i', 'おおさかじょうこうえん - oosakajoukouen', '大阪城公園で ジョギングを しました。 (Osaka qal''asi xiyobonida yugurdim.)', 'N5', 320),
  ('m1_321', 'deck_minna1', '切ります', 'きります', 'kesmoq (pichoqda), qirqmoq (qaychida)', 'きります - kirimasu', 'はさみで 紙を 切ります。 (Qaychi bilan qog''ozni kesaman.)', 'N5', 321),
  ('m1_322', 'deck_minna1', '送ります', 'おくります', 'jo''natmoq; olib borib qo''ymoq', 'おくります - okurimasu', '雨が 降っていますから、車で 駅まで 送りましょう。 (Yomg''ir yog''yapti, mashinada bekatgacha kuzatib qo''yay.)', 'N5', 322),
  ('m1_323', 'deck_minna1', 'あげます', 'あげます', 'bermoq, sovg''a qilmoq', 'あげます - agemasu', '誕生日に 母に 花を あげました。 (Tug''ilgan kunga onamga gul berdim.)', 'N5', 323),
  ('m1_324', 'deck_minna1', 'もらいます', 'もらいます', 'olmoq', 'もらいます - moraimasu', '先生から 本を もらいました。 (Ustozdan kitob oldim.)', 'N5', 324),
  ('m1_325', 'deck_minna1', '貸します', 'かします', 'qarzga bermoq, berib turmoq', 'かします - kashimasu', '友達に 傘を 貸しました。 (Do''stimga soyabon qarzga berdim.)', 'N5', 325),
  ('m1_326', 'deck_minna1', '借ります', 'かります', 'qarzga olmoq, olib turmoq', 'かります - karimasu', '図書館で 本を 借りました。 (Kutubxonadan kitob qarzga oldim.)', 'N5', 326),
  ('m1_327', 'deck_minna1', '教えます', 'おしえます', 'o''rgatmoq, aytmoq, tushuntirmoq', 'おしえます - oshiemasu', '駅までの 道を 親切に 教えてくれました。 (Bekatgacha bo''lgan yo''lni yaxshilab tushuntirib berdi.)', 'N5', 327),
  ('m1_328', 'deck_minna1', '習います', 'ならいます', 'o''rganmoq, saboq olmoq', 'ならいます - naraimasu', '先生から 生け花を 習いました。 (Ustozdan ikebana san''atini o''rgandim.)', 'N5', 328),
  ('m1_329', 'deck_minna1', 'かけます', 'かけます', '(qo''ng''iroq) qilmoq', 'かけます - kakemasu', '暗い ところで 本を 読む とき、眼鏡を かけます。 (Qorong''i joyda kitob o''qiganda ko''zoynak taqaman.)', 'N5', 329),
  ('m1_330', 'deck_minna1', '電話をかけます', 'でんわをかけます', 'telefon qilmoq', 'でんわをかけます - denwa o kakemasu', '家族に 電話を かけます。 (Oilamga telefon qilaman.)', 'N5', 330),
  ('m1_331', 'deck_minna1', '手', 'て', 'qo''l', 'て - te', '食事の 前に 手を 洗います。 (Ovqatlanishdan oldin qo''limni yuvaman.)', 'N5', 331),
  ('m1_332', 'deck_minna1', 'はし', 'はし', 'hashi', 'はし - hashi', '箸（はし）で 日本料理を 食べます。 (Chopchoqda yapon taomini yeyman.)', 'N5', 332),
  ('m1_333', 'deck_minna1', 'スプーン', 'スプーン', 'qoshiq', 'スプーン - supu-n', 'スプーンで カレーライスを 食べます。 (Qoshiq bilan karerays yeyman.)', 'N5', 333),
  ('m1_334', 'deck_minna1', 'ナイフ', 'ナイフ', 'pichoq', 'ナイフ - naifu', 'ナイフと フォークで ステーキを 切ります。 (Pichoq va vilka bilan go''shtni kesaman.)', 'N5', 334),
  ('m1_335', 'deck_minna1', 'フォーク', 'フォーク', 'sanchqi (vilka)', 'フォーク - fu-ku', 'フォークを 落としましたから、替えてください。 (Vilkam tushib ketdi, almashtirib bering.)', 'N5', 335),
  ('m1_336', 'deck_minna1', 'はさみ', 'はさみ', 'qaychi', 'はさみ - hasami', 'はさみで 紙を 切ります。 (Qaychi bilan qog''ozni kesaman.)', 'N5', 336),
  ('m1_337', 'deck_minna1', 'ファクス', 'ファクス', 'faks', 'ファクス - fukusu', 'ファクスで 書類を 送信しました。 (Faks orqali hujjatlarni jo''natdim.)', 'N5', 337),
  ('m1_338', 'deck_minna1', 'ワープロ', 'ワープロ', 'matnli protsessor', 'ワープロ - wa-puro', '昔は ワープロで 文書を 作りました。 (Ilgari matn protsessorida hujjat tayyorlangan.)', 'N5', 338),
  ('m1_339', 'deck_minna1', 'パソコン', 'パソコン', 'shaxsiy kompyuter', 'パソコン - pasokon', 'パソコンで インターネットを 使います。 (Shaxsiy kompyuterda internetdan foydalanaman.)', 'N5', 339),
  ('m1_340', 'deck_minna1', 'パンチ', 'パンチ', 'perforator, teshik ochqich', 'パンチ - panchi', 'パンチで 書類に 穴を あけます。 (Dirokol bilan qog''ozga teshik ochaman.)', 'N5', 340),
  ('m1_341', 'deck_minna1', 'ホッチキス', 'ホッチキス', 'stepler', 'ホッチキス - hochikisu', 'ホッチキスで レポートを とめます。 (Stepler bilan hisobotni qadab qo''yaman.)', 'N5', 341),
  ('m1_342', 'deck_minna1', 'セロテープ', 'セロテープ', 'skoch', 'セロテープ - serote-pu', 'セロテープで ポスターを 壁に 貼ります。 (Skotch bilan devorga afishani yopishtiraman.)', 'N5', 342),
  ('m1_343', 'deck_minna1', '消しゴム', 'けしゴム', 'o''chirg''ich', 'けしゴム - keshigomu', '消しゴムで 間違えた 字を 消します。 (O''chirg''ich bilan xato yozuvni o''chiraman.)', 'N5', 343),
  ('m1_344', 'deck_minna1', '紙', 'かみ', 'qog''oz', 'かみ - kami', '白い 紙に 住所と 名前を 書いてください。 (Oq qog''ozga manzilingiz va ismingizni yozing.)', 'N5', 344),
  ('m1_345', 'deck_minna1', '花', 'はな', 'gul', 'はな - hana', '母の 誕生日に 赤い 花を あげました。 (Onamning tug''ilgan kuniga qizil gul berdim.)', 'N5', 345),
  ('m1_346', 'deck_minna1', 'シャツ', 'シャツ', 'ko''ylak', 'シャツ - shatsu', '新しい 白い シャツを 着て 行きます。 (Yangi oq ko''ylak kiyib boraman.)', 'N5', 346),
  ('m1_347', 'deck_minna1', 'プレゼント', 'プレゼント', 'sovg''a, tuhva, hadya', 'プレゼント - purezento', '友達から すてきな プレゼントを もらいました。 (Do''stimdan ajoyib sovg''a oldim.)', 'N5', 347),
  ('m1_348', 'deck_minna1', '荷物', 'にもつ', 'buyum, yuk', 'にもつ - nimotsu', '郵便局から 重い 荷物を 送ります。 (Pochtadan og''ir posilkani jo''nataman.)', 'N5', 348),
  ('m1_349', 'deck_minna1', 'お金', 'おかね', 'pul', 'おかね - okane', '財布に お金が 少ししか ありません。 (Hamyonimda ozgina pul bor xolos.)', 'N5', 349),
  ('m1_350', 'deck_minna1', '切符', 'きっぷ', 'chipta', 'きっぷ - kipu', '駅の 券売機で 電車の 切符を 買います。 (Bekat apparatida poyezd chiptasini sotib olaman.)', 'N5', 350),
  ('m1_351', 'deck_minna1', 'クリスマス', 'クリスマス', 'Krismas bayrami (rojdestvo)', 'クリスマス - kurisumasu', 'クリスマスに 家族と ごちそうを 食べます。 (Rojdestvoda oilam bilan bayramona taom yeymiz.)', 'N5', 351),
  ('m1_352', 'deck_minna1', '父', 'ちち', 'otam, dadam', 'ちち - chichi', '父は 毎朝 早く 散歩に 出かけます。 (Otam har kuni ertalab barvaqt sayrga chiqadi.)', 'N5', 352),
  ('m1_353', 'deck_minna1', '母', 'はは', 'onam, oyim', 'はは - haha', '母は 料理が とても 上手です。 (Onam ovqat pishirishga juda usta.)', 'N5', 353),
  ('m1_354', 'deck_minna1', 'お父さん', 'おとうさん', 'ota, dada / ~ning otasi', 'おとうさん - otousan', 'あなたのお父さんは どんな 仕事を していますか。 (Otangiz qanday ish bilan shug''ullanadilar?)', 'N5', 354),
  ('m1_355', 'deck_minna1', 'お母さん', 'おかあさん', 'ona, oyi / ~ning onasi', 'おかあさん - okaasan', 'お母さんは 元気ですか。 (Onangiz salomatmilar?)', 'N5', 355),
  ('m1_356', 'deck_minna1', 'もう', 'もう', 'allaqachon, ~ib bo''ldi(~m,~ ing); endi', 'もう - mou', 'もう 宿題を 全部 終わりましたか。 (Allaqachon barcha vazifalarni tugatdingizmi?)', 'N5', 356),
  ('m1_357', 'deck_minna1', 'まだ', 'まだ', 'hali ham', 'まだ - mada', 'もう 昼ご飯を 食べましたか。― いいえ、まだです。 (Allaqachon tushlik qildingizmi? - Yo''q, hali yo''q.)', 'N5', 357),
  ('m1_358', 'deck_minna1', 'これから', 'これから', 'endi; bundan buyon', 'これから - korekara', 'これから 日本語の 勉強を 始めます。 (Hozir yapon tili darsini boshlayman.)', 'N5', 358),
  ('m1_359', 'deck_minna1', 'すてきですね', '～、すてきですね。', 'Ajoyib ekan-a', '～、すてきですね。 - sutekidesune', 'その ネクタイ、すてきですね。 (U bo''yinbog''ingiz ajoyib ekan-a.)', 'N5', 359),
  ('m1_360', 'deck_minna1', 'ごめんください', 'ごめんください。', 'Kechirasiz, kimdir bormi? (uyga kirishda)', 'ごめんください。 - gomenkudasai', 'ごめんください。どなたか いらっしゃいますか。 (Kechirasiz, biror kim bormi?)', 'N5', 360)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('m1_361', 'deck_minna1', 'いらっしゃい', 'いらっしゃい。', 'Xush kelibsiz', 'いらっしゃい。 - irashai', 'いらっしゃい。どうぞ 入って ください。 (Xush kelibsiz. Marhamat, kiring.)', 'N5', 361),
  ('m1_362', 'deck_minna1', 'どうぞお上がりください', 'どうぞおあがりください', 'Marhamat, ichkariga marhamat qiling', 'どうぞおあがりください - douzo oagari kudasai', 'どうぞ お上がり ください。スリッパを どうぞ。 (Ichkariga marhamat qiling. Shippakni kiying.)', 'N5', 362),
  ('m1_363', 'deck_minna1', '失礼します', 'しつれいします', 'Ruxsatingiz bilan / Xayr (xushmuomala)', 'しつれいします - shitsurei shimasu', 'お先に 失礼します。― お疲れ様でした。 (Ruxsatingiz bilan ketdim. - Charchamang.)', 'N5', 363),
  ('m1_364', 'deck_minna1', '～はいかがですか', '～はいかがですか。', '~dan olmaysizmi? / ~ ma''qulmi?', '～はいかがですか。 - haikagadesuka', '温かい お茶は いかがですか。 (Iliq choydan olmaysizmi?)', 'N5', 364),
  ('m1_365', 'deck_minna1', 'いただきます', 'いただきます。', 'Yoqimli ishtaha / Kamina taomga qo''l uzatmoqda', 'いただきます。 - itadakimasu', 'おいしそうですね。いただきます！ (Juda mazali ko''rinyapti. Qani, boshladik!)', 'N5', 365),
  ('m1_366', 'deck_minna1', '旅行', 'りょこう', 'sayohat', 'りょこう - ryokou', '夏休みに 北海道へ 旅行に 行きます。 (Yozgi ta''tilda Xokkaydoga sayohatga boraman.)', 'N5', 366),
  ('m1_367', 'deck_minna1', 'お土産', 'おみやげ', 'esdalik sovg''a', 'おみやげ - omiyage', '京都の お土産を 買いました。 (Kiotodan esdalik sovg''a sotib oldim.)', 'N5', 367),
  ('m1_368', 'deck_minna1', 'ヨーロッパ', 'ヨーロッパ', 'Ovro''pa', 'ヨーロッパ - yo-ropa', 'ヨーロッパの 歴史を 勉強しています。 (Yevropa tarixini o''rganyapman.)', 'N5', 368),
  ('m1_369', 'deck_minna1', 'スペイン', 'スペイン', 'Ispaniya', 'スペイン - supein', 'スペインへ サッカーを 見に 行きたいです。 (Ispaniyaga futbol ko''rgani bormoqchiman.)', 'N5', 369),
  ('m1_370', 'deck_minna1', 'ハンサムな', 'ハンサムな', 'xushro''y, chiroyli', 'ハンサムな - hansamuna', 'あの 俳優は とても ハンサムです。 (Anavi aktyor juda kelishgan.)', 'N5', 370),
  ('m1_371', 'deck_minna1', 'きれいな', 'きれいな', 'xushro''y, chiroyli, go''zal; toza', 'きれいな - kireina', '公園に きれいな 花が 咲いています。 (Bog''da chiroyli gullar ochilib yotibdi.)', 'N5', 371),
  ('m1_372', 'deck_minna1', '静かな', 'しずかな', 'tinch, osoyishta, osuda', 'しずかな - shizukana', 'この 図書館は 静かで 勉強しやすいです。 (Bu kutubxona tinch, dars qilish qulay.)', 'N5', 372),
  ('m1_373', 'deck_minna1', 'にぎやかな', 'にぎやかな', 'gavjum, sershovqin', 'にぎやかな - nigiyakana', '新宿の 夜は とても にぎやかです。 (Shinjukuning oqshomi juda gavjum.)', 'N5', 373),
  ('m1_374', 'deck_minna1', '有名な', 'ゆうめいな', 'mashhur', 'ゆうめいな - yuumeina', '京都には 有名な お寺が たくさん あります。 (Kiotoda mashhur ibodatxonalar ko''p.)', 'N5', 374),
  ('m1_375', 'deck_minna1', '親切な', 'しんせつな', 'mehribon', 'しんせつな - shinsetsuna', '山田さんは 親切な 人ですから、みんなに 好かれています。 (Yamada mehribon inson, shuning uchun hamma uni yaxshi ko''radi.)', 'N5', 375),
  ('m1_376', 'deck_minna1', '元気な', 'げんきな', 'sog''lom, baquvvat', 'げんきな - genkina', 'ミラーさんは いつも 元気ですね。 (Janob Miller doimo tetik-a.)', 'N5', 376),
  ('m1_377', 'deck_minna1', '暇な', 'ひまな', 'bo''sh (vaqt),', 'ひまな - himana', 'あしたの 午後は 暇ですか。 (Ertaga tushdan keyin bo''shmisiz?)', 'N5', 377),
  ('m1_378', 'deck_minna1', '便利な', 'べんりな', 'qulay', 'べんりな - benrina', '地下鉄は 安くて 便利です。 (Metro arzon va qulay.)', 'N5', 378),
  ('m1_379', 'deck_minna1', 'すてきな', 'すてきな', 'chiroyli, ajoyib', 'すてきな - sutekina', 'すてきな プレゼントを ありがとうございました。 (Ajoyib sovg''a uchun tashakkur.)', 'N5', 379),
  ('m1_380', 'deck_minna1', '大きい', 'おおきい', 'katta', 'おおきい - ookii', '象は 体が 大きいです。 (Filning tanasi katta.)', 'N5', 380),
  ('m1_381', 'deck_minna1', '小さい', 'ちいさい', 'kichik', 'ちいさい - chiisai', 'この かばんは 小さくて 軽いです。 (Bu sumka kichik va yengil.)', 'N5', 381),
  ('m1_382', 'deck_minna1', '新しい', 'あたらしい', 'yangi', 'あたらしい - atarashii', '新しい 携帯電話を 買いました。 (Yangi mobil telefon sotib oldim.)', 'N5', 382),
  ('m1_383', 'deck_minna1', '古い', 'ふるい', 'eski, qadimiy', 'ふるい - furui', 'この お寺は とても 古いです。 (Bu ibodatxona juda qadimiy/eski.)', 'N5', 383),
  ('m1_384', 'deck_minna1', 'いい (よい)', 'いい (よい)', 'yaxshi, soz', 'いい (よい) - ii (yoi)', 'あの 先生は とても いい 先生です。 (U ustoz juda yaxshi o''qituvchi.)', 'N5', 384),
  ('m1_385', 'deck_minna1', '悪い', 'わるい', 'yomon', 'わるい - warui', 'きのうは 天気が 悪かったです。 (Kecha ob-havo yomon edi.)', 'N5', 385),
  ('m1_386', 'deck_minna1', '暑い / 熱い', 'あつい', 'issiq (ob-havo / narsa, taom)', 'あつい - atsui', '日本の 夏は とても 暑いです。 (Yaponiyaning yozi juda issiq.)', 'N5', 386),
  ('m1_387', 'deck_minna1', '寒い', 'さむい', 'sovuq (ob-havo)', 'さむい - samui', '北海道の 冬は とても 寒いです。 (Xokkaydoning qishi juda sovuq.)', 'N5', 387),
  ('m1_388', 'deck_minna1', '冷たい', 'つめたい', 'sovuq, muzdek (narsa, ichimlik)', 'つめたい - tsumetai', '冷たい お茶を 飲みました。 (Muzdek choy ichdim.)', 'N5', 388),
  ('m1_389', 'deck_minna1', '難しい', 'むずかしい', 'qiyin', 'むずかしい - muzukashii', '日本語の 漢字は 難しいです。 (Yapon tilining iyerogliflari qiyin.)', 'N5', 389),
  ('m1_390', 'deck_minna1', '易しい', 'やさしい', 'oson', 'やさしい - yasashii', 'この テストは とても 易しかったです。 (Bu test juda oson edi.)', 'N5', 390),
  ('m1_391', 'deck_minna1', '高い', 'たかい', 'qimmat; baland', 'たかい - takai', '富士山は 高い 山です。 (Fuji tog''i baland tog''dir.)', 'N5', 391),
  ('m1_392', 'deck_minna1', '安い', 'やすい', 'arzon', 'やすい - yasui', 'あの スーパーの 野菜は 安いです。 (Anavi supermarketning sabzavotlari arzon.)', 'N5', 392),
  ('m1_393', 'deck_minna1', '低い', 'ひくい', 'past', 'ひくい - hikui', 'あの 建物は 低いです。 (Anavi bino past.)', 'N5', 393),
  ('m1_394', 'deck_minna1', 'おもしろい', 'おもしろい', 'qiziqarli', 'おもしろい - omoshiroi', 'この 本は とても おもしろいです。 (Bu kitob juda qiziqarli.)', 'N5', 394),
  ('m1_395', 'deck_minna1', 'おいしい', 'おいしい', 'mazali', 'おいしい - oishii', '日本の ラーメンは とても おいしいです。 (Yapon rameni juda mazali.)', 'N5', 395),
  ('m1_396', 'deck_minna1', '忙しい', 'いそがしい', 'band, mashg''ul', 'いそがしい - isogashii', '今週は 仕事が 忙しいです。 (Bu hafta ishim juda band.)', 'N5', 396),
  ('m1_397', 'deck_minna1', '楽しい', 'たのしい', 'maroqli, quvonchli', 'たのしい - tanoshii', '旅行は とても 楽しかったです。 (Sayohat juda maroqli o''tdi.)', 'N5', 397),
  ('m1_398', 'deck_minna1', '白い', 'しろい', 'oq', 'しろい - shiroi', '白い シャツを 着ています。 (Oq ko''ylak kiyib olgan.)', 'N5', 398),
  ('m1_399', 'deck_minna1', '黒い', 'くろい', 'qora', 'くろい - kuroi', '黒い 靴を 買いました。 (Qora tufli sotib oldim.)', 'N5', 399),
  ('m1_400', 'deck_minna1', '赤い', 'あかい', 'qizil', 'あかい - akai', '赤い りんごを 食べました。 (Qizil olma yedim.)', 'N5', 400),
  ('m1_401', 'deck_minna1', '青い', 'あおい', 'ko''k, moviy', 'あおい - aoi', '青い 空が とても きれいです。 (Moviy osmon juda chiroyli.)', 'N5', 401),
  ('m1_402', 'deck_minna1', '桜', 'さくら', 'olcha (sakura)', 'さくら - sakura', '春に 桜が 満開に なります。 (Bahorda sakura qiyg''os gullaydi.)', 'N5', 402),
  ('m1_403', 'deck_minna1', '山', 'やま', 'tog', 'やま - yama', '天気が いいから、山へ 登りましょう。 (Havo yaxshi, tog''ga chiqaylik.)', 'N5', 403),
  ('m1_404', 'deck_minna1', '町', 'まち', '(kichik) shahar', 'まち - machi', 'わたしの 故郷は 静かで きれいな 町です。 (Mening tug''ilib o''sgan joyim tinch va chiroyli shahar.)', 'N5', 404),
  ('m1_405', 'deck_minna1', '食べ物', 'たべもの', 'yegulik', 'たべもの - tabemono', '日本の 食べ物で 何が いちばん 好きですか。 (Yapon taomlaridan qaysi birini eng yaxshi ko''rasiz?)', 'N5', 405),
  ('m1_406', 'deck_minna1', '車', 'くるま', 'mashina', 'くるま - kuruma', '父は ドイツの 白い 車に 乗っています。 (Otam Germaniyaning oq mashinasini haydaydi.)', 'N5', 406),
  ('m1_407', 'deck_minna1', '所', 'ところ', 'joy, makon', 'ところ - tokoro', '京都は 静かで きれいな 所です。 (Kioto tinch va chiroyli joy.)', 'N5', 407),
  ('m1_408', 'deck_minna1', '寮', 'りょう', 'yotoqxona', 'りょう - ryou', '大学の 学生寮に 住んでいます。 (Universitet talabalar yotoqxonasida yashayman.)', 'N5', 408),
  ('m1_409', 'deck_minna1', '勉強', 'べんきょう', 'dars, mashg''ulot', 'べんきょう - benkyou', '毎日 2時間 日本語の 勉強を します。 (Har kuni 2 soat yapon tili darsini qilaman.)', 'N5', 409),
  ('m1_410', 'deck_minna1', '生活', 'せいかつ', 'turmush, hayot', 'せいかつ - seikatsu', '一人暮らしの 生活は どうですか。 (Yolg''iz yashash hayoti qanday kechyapti?)', 'N5', 410),
  ('m1_411', 'deck_minna1', 'お仕事', 'おしごと', 'ish ( ～をします ishlamoq)', 'おしごと - oshigoto', 'お仕事は 何を されていますか。 (Kasbingiz nima?)', 'N5', 411),
  ('m1_412', 'deck_minna1', 'どう', 'どう', 'qanday, qanaqa', 'どう - dou', '日本の 新しい 生活は どうですか。 (Yaponiyadagi yangi hayotingiz qanday?)', 'N5', 412),
  ('m1_413', 'deck_minna1', 'どんな～', 'どんな～', 'qanday ~, qanaqa ~', 'どんな～ - donna', 'どんな 音楽が 好きですか。 (Qanday musiqani yoqtirasiz?)', 'N5', 413),
  ('m1_414', 'deck_minna1', 'どれ', 'どれ', 'qaysi', 'どれ - dore', 'あなたの かばんは どれですか。 (Sizning sumkangiz qaysi biri?)', 'N5', 414),
  ('m1_415', 'deck_minna1', 'とても', 'とても', 'juda', 'とても - totemo', '富士山は とても 高くて きれいです。 (Fuji tog''i juda baland va chiroyli.)', 'N5', 415),
  ('m1_416', 'deck_minna1', 'あまり', 'あまり', 'uncha ~ emas, unchalik ~ emas', 'あまり - amari', 'きょうは あまり 寒くないです。 (Bugun unchalik sovuq emas.)', 'N5', 416),
  ('m1_417', 'deck_minna1', 'そして', 'そして', 'keyin', 'そして - soshite', '日本の 料理は おいしいです。そして 体に いいです。 (Yapon taomlari mazali. Va sog''liq uchun foydali.)', 'N5', 417),
  ('m1_418', 'deck_minna1', '～が、～', '～が、～', '~-yu,~ . ; ~. Lekin, ~.', '～が、～ - ga', '日本の 生活は 楽しいですが、物価が 高いです。 (Yaponiyadagi hayot maroqli, lekin narx-navo qimmat.)', 'N5', 418),
  ('m1_419', 'deck_minna1', 'お元気ですか', 'おげんきですか。', 'Yaxshimisiz? / Sog''-omonmisiz?', 'おげんきですか。 - ogenkidesuka', 'お久しぶりです。お元気ですか。 (Ko''rishmaganimizga ancha bo''ldi. Yaxshimisiz?)', 'N5', 419),
  ('m1_420', 'deck_minna1', 'そうですね', 'そうですね。', 'Shunday-a / Rostdan ham', 'そうですね。 - soudesune', 'きょうは いい 天気ですね。― そうですね。 (Bugun havo yaxshi-ya. - Shunday-a.)', 'N5', 420),
  ('m1_421', 'deck_minna1', '日本の生活に慣れましたか', 'にほんのせいかつになれましたか', 'Yaponiya hayotiga o''rgandingizmi?', 'にほんのせいかつになれましたか - nihon no seikatsu ni naremashita ka', '日本の 生活に 慣れましたか。― はい、慣れました。 (Yaponiya hayotiga o''rgandingizmi? - Ha, ko''nikdim.)', 'N5', 421),
  ('m1_422', 'deck_minna1', 'もう一杯いかがですか', 'もういっぱいいかがですか', 'Yana bir piyola olmaysizmi?', 'もういっぱいいかがですか - mou ippai ikaga desu ka', 'お茶、もう一杯 いかがですか。 (Yana bir piyola choy olmaysizmi?)', 'N5', 422),
  ('m1_423', 'deck_minna1', 'いいえ、けっこうです', 'いいえ、けっこうです。', 'Yo''q, rahmat / Yetarli', 'いいえ、けっこうです。 - iiekekoudesu', 'もう一杯 いかがですか。― いいえ、けっこうです。 (Yana bir piyola olasizmi? - Yo''q, rahmat, yetarli.)', 'N5', 423),
  ('m1_424', 'deck_minna1', 'もう～ですね', 'もう～ですね。', 'Allaqachon ~ bo''libdi-ya', 'もう～ですね。 - mou desune', 'もう 12時ですね。そろそろ 失礼します。 (Allaqachon 12 bo''libdi-ya. Ruxsatingiz bilan qaytay.)', 'N5', 424),
  ('m1_425', 'deck_minna1', 'そろそろ失礼します', 'そろそろしつれいします', 'Sekin qaytay / Ruxsatingiz bilan ketsam', 'そろそろしつれいします - sorosoro shitsurei shimasu', 'もう 遅いですから、そろそろ 失礼します。 (Allaqachon kech bo''ldi, ruxsatingiz bilan sekin qaytay.)', 'N5', 425),
  ('m1_426', 'deck_minna1', 'また来てください', 'またいらっしゃって', 'Yana keling', 'またいらっしゃって - matairashate', '楽しかったです。また 来て ください。 (Maroqli bo''ldi. Yana kelib turing.)', 'N5', 426),
  ('m1_427', 'deck_minna1', '富士山', 'ふじさん', 'Fuji togi', 'ふじさん - fujisan', '富士山は 日本で いちばん 高い 山です。 (Fuji tog''i Yaponiyadagi eng baland tog''.)', 'N5', 427),
  ('m1_428', 'deck_minna1', '琵琶湖', 'びわこ', 'Biva ko''li', 'びわこ - biwako', '琵琶湖は 日本で いちばん 大きい 湖です。 (Biva ko''li Yaponiyadagi eng katta ko''l.)', 'N5', 428),
  ('m1_429', 'deck_minna1', 'シャンハイ', 'シャンハイ', 'Shanxay ( 上海 )', 'シャンハイ - shanhai', 'シャンハイは 中国の にぎやかな 大都市です。 (Shanxay Xitoyning gavjum yirik shahr.)', 'N5', 429),
  ('m1_430', 'deck_minna1', '「七人の侍」', 'しちにんのさむらい', '“Yetti samuray”', 'しちにんのさむらい - shichininnosamurai', '「七人の侍」は 黒澤明監督の 有名な 映画です。 ("Yetti samuray" Akira Kurosavaning mashhur filmi.)', 'N5', 430),
  ('m1_431', 'deck_minna1', '金閣寺', 'きんかくじ', 'Kinkaji ibodatxonasi', 'きんかくじ - kinkakuji', '京都の 金閣寺へ 行きました。 (Kiotodagi Oltin ibodatxonaga bordim.)', 'N5', 431),
  ('m1_432', 'deck_minna1', 'わかります', 'わかります', 'tushunmoq', 'わかります - wakarimasu', '日本語の 意味が よく わかります。 (Yaponcha so''zning ma''nosini yaxshi tushunaman.)', 'N5', 432),
  ('m1_433', 'deck_minna1', 'あります', 'あります', 'bor (bo''lmoq) (jonsiz narsalarga)', 'あります - arimasu', '机の 上に 辞書が あります。 (Stol ustida lug''at bor.)', 'N5', 433),
  ('m1_434', 'deck_minna1', '好きな', 'すきな', 'yoqimli, yoqtirgan, suygan', 'すきな - sukina', 'わたしは 日本の アニメが 好きです。 (Men yapon animesini yoqtiraman.)', 'N5', 434),
  ('m1_435', 'deck_minna1', '嫌いな', 'きらいな', 'yoqimsiz, yoqtirmagan, suymagan', 'きらいな - kiraina', '子どもの 頃、野菜が 嫌いでした。 (Bolaligimda sabzavotlarni yoqtirmasdim.)', 'N5', 435),
  ('m1_436', 'deck_minna1', '上手な', 'じょうずな', 'mohir, usta, epli, zo''r', 'じょうずな - jouzuna', 'サントスさんは サッカーが 上手です。 (Janob Santos futbolni zo''r o''ynaydi.)', 'N5', 436),
  ('m1_437', 'deck_minna1', '下手な', 'へたな', 'epsiz, no''noq, mahoratsiz', 'へたな - hetana', '歌が 下手ですから、カラオケへ 行きません。 (Qo''shiq aytishga no''noqman, shuning uchun karaokega bormayman.)', 'N5', 437),
  ('m1_438', 'deck_minna1', '料理', 'りょうり', 'ovqat, taom', 'りょうり - ryouri', '母と いっしょに 日本料理を 作りました。 (Onam bilan birga yapon taomini tayyorladim.)', 'N5', 438),
  ('m1_439', 'deck_minna1', '飲み物', 'のみもの', 'ichimlik', 'のみもの - nomimono', '冷蔵庫に 冷たい 飲み物が あります。 (Muzlatgichda salqin ichimliklar bor.)', 'N5', 439),
  ('m1_440', 'deck_minna1', 'スポーツ', 'スポーツ', 'sport', 'スポーツ - supo-tsu', 'どんな スポーツを しますか。 (Qanday sport bilan shug''ullanasiz?)', 'N5', 440),
  ('m1_441', 'deck_minna1', '野球', 'やきゅう', 'beysbol', 'やきゅう - yakyuu', '週末に 友達と 野球を 観戦しました。 (Dam olish kunida do''stlar bilan beysbol tomosha qildik.)', 'N5', 441),
  ('m1_442', 'deck_minna1', 'ダンス', 'ダンス', 'raqs', 'ダンス - dansu', '週末に クラブで ダンスを しました。 (Dam olish kunida klubda raqsga tushdim.)', 'N5', 442),
  ('m1_443', 'deck_minna1', '音楽', 'おんがく', 'musiqa', 'おんがく - ongaku', '静かな 部屋で 音楽を 聞くのが 好きです。 (Tinch xonada musiqa tinglashni yoqtiraman.)', 'N5', 443),
  ('m1_444', 'deck_minna1', '歌', 'うた', 'qo''shiq', 'うた - uta', '日本の 懐かしい 歌を 歌いました。 (Yaponiyaning qadrdon qo''shig''ini kuyladim.)', 'N5', 444),
  ('m1_445', 'deck_minna1', 'クラシック', 'クラシック', 'klassik, mumtoz', 'クラシック - kurashiku', 'ベートーベンの クラシック音楽を 聞きます。 (Betxovenning klassik musiqasini eshitaman.)', 'N5', 445),
  ('m1_446', 'deck_minna1', 'ジャズ', 'ジャズ', 'jaz', 'ジャズ - jizu', 'バーで ジャズを 聞きながら お酒を 飲みました。 (Barda jaz tinglab ichimlik ichdim.)', 'N5', 446),
  ('m1_447', 'deck_minna1', 'コンサート', 'コンサート', 'konsert', 'コンサート - konsa-to', '来週の 土曜日に ロックの コンサートが あります。 (Kelasi shanba kuni rok konserti bor.)', 'N5', 447),
  ('m1_448', 'deck_minna1', 'カラオケ', 'カラオケ', 'karaoke', 'カラオケ - karaoke', '仕事の 帰りに 同僚と カラオケへ 行きました。 (Ishdan qaytishda hamkasblar bilan karaokega bordim.)', 'N5', 448),
  ('m1_449', 'deck_minna1', '歌舞伎', 'かぶき', 'kabuki', 'かぶき - kabuki', '銀座の 歌舞伎座で 歌舞伎を 見ました。 (Ginzadagi Kabukizada teatrida kabuki ko''rdim.)', 'N5', 449),
  ('m1_450', 'deck_minna1', '絵', 'え', 'rasm', 'え - e', '美術館で 美しい 絵を 鑑賞しました。 (Muzeyda go''zal san''at asarini tomosha qildim.)', 'N5', 450),
  ('m1_451', 'deck_minna1', '字', 'じ', 'harf', 'じ - ji', '田中さんは 字が とても きれいです。 (Janob Tanakaning husnixati juda chiroyli.)', 'N5', 451),
  ('m1_452', 'deck_minna1', '漢字', 'かんじ', 'belgi, iyeroglif', 'かんじ - kanji', '漢字の 読み方を 毎日 覚えます。 (Har kuni kanji o''qilishlarini yodlayman.)', 'N5', 452),
  ('m1_453', 'deck_minna1', 'ひらがな', 'ひらがな', 'hiragana (yapon alifbosi)', 'ひらがな - hiragana', '初めに ひらがなと カタカナを 勉強しました。 (Avvaliga hiragana va katakanani o''rgandim.)', 'N5', 453),
  ('m1_454', 'deck_minna1', 'かたかな', 'かたかな', 'katakana (yapon alifbosi)', 'かたかな - katakana', '外来語は カタカナで 書きます。 (Chet tilidan kirib kelgan so''zlar katakanada yoziladi.)', 'N5', 454),
  ('m1_455', 'deck_minna1', 'ローマ字', 'ローマじ', 'rim yozuvi (lotin yozuvi)', 'ローマじ - ro-maji', '駅の 看板には ローマ字も 書いて あります。 (Bekat peshlavhasida lotin yozuvi ham yozilgan.)', 'N5', 455),
  ('m1_456', 'deck_minna1', '細かいお金', 'こまかいおかね', 'mayda pul', 'こまかいおかね - komakaiokane', 'バスに 乗る 前に 細かいお金を 用意します。 (Avtobusga chiqishdan oldin mayda pul tayyorlayman.)', 'N5', 456),
  ('m1_457', 'deck_minna1', 'チケット', 'チケット', 'chipta', 'チケット - chiketo', 'インターネットで 新幹線の チケットを 予約しました。 (Internetda Shinkansen poyezdi chiptasini band qildim.)', 'N5', 457),
  ('m1_458', 'deck_minna1', '時間', 'じかん', 'vaqt', 'じかん - jikan', 'きょうは 宿題が 多くて 時間が ありません。 (Bugun vazifa ko''p, vaqtim yo''q.)', 'N5', 458),
  ('m1_459', 'deck_minna1', '用事', 'ようじ', 'ish, yumush', 'ようじ - youji', '午後は 銀行に 用事が あります。 (Tushdan keyin bankda yumushim bor.)', 'N5', 459),
  ('m1_460', 'deck_minna1', '約束', 'やくそく', 'va''da', 'やくそく - yakusoku', '日曜日 友達と 銀座で 会う 約束が あります。 (Yakshanba do''stim bilan Ginzada uchrashuvim/kelishuvim bor.)', 'N5', 460),
  ('m1_461', 'deck_minna1', 'ご主人', 'ごしゅじん', 'xo''jayiningiz, eringiz (boshqalarning turmush o''rtog''i)', 'ごしゅじん - goshujin', '山田さんの ご主人は 銀行員です。 (Yamada xonimning turmush o''rtog''i bank xodimi.)', 'N5', 461),
  ('m1_462', 'deck_minna1', '夫 (主人)', 'おっと (しゅじん)', 'erim, turmush o''rtog''im (o''zimniki)', 'おっと (しゅじん) - otto (shujin)', '夫は 会社員です。 (Erim kompaniya xodimi.)', 'N5', 462),
  ('m1_463', 'deck_minna1', '奥さん', 'おくさん', 'ayol(ingiz), xotin(ingiz)', 'おくさん - okusan', '木村さんの 奥さんは 料理研究家です。 (Janob Kimuraning rafiqasi pazandachilik mutaxassisi.)', 'N5', 463),
  ('m1_464', 'deck_minna1', '妻 (家内)', 'つま (かない)', 'ayolim, rafiqam (o''zimniki)', 'つま (かない) - tsuma (kanai)', '妻は 料理が とても 上手です。 (Rafiqam ovqat pishirishga juda usta.)', 'N5', 464),
  ('m1_465', 'deck_minna1', '子ども', 'こども', 'bola, farzand', 'こども - kodomo', '公園で 子どもたちが 元気に 遊んでいます。 (Bog''da bolalar quvnoq o''ynayapti.)', 'N5', 465),
  ('m1_466', 'deck_minna1', 'よく', 'よく', 'tez-tez; yaxshi; rosa', 'よく - yoku', 'この 喫茶店には よく 来ます。 (Bu qahvaxonaga tez-tez kelib turaman.)', 'N5', 466),
  ('m1_467', 'deck_minna1', 'だいたい', 'だいたい', 'deyarli, taxminan, asosan', 'だいたい - daitai', '日本語が だいたい 分かります。 (Yapon tilini deyarli / asosan tushunaman.)', 'N5', 467),
  ('m1_468', 'deck_minna1', 'たくさん', 'たくさん', 'ko''p', 'たくさん - takusan', 'スーパーで 果物を たくさん 買いました。 (Supermarketdan ko''p meva sotib oldim.)', 'N5', 468),
  ('m1_469', 'deck_minna1', '少し', 'すこし', 'ozgina, ozroq, biroz, kam', 'すこし - sukoshi', '日本語が 少し 話せます。 (Yaponcha ozroq gaplasha olaman.)', 'N5', 469),
  ('m1_470', 'deck_minna1', '全然', 'ぜんぜん', 'umuman, hech', 'ぜんぜん - zenzen', 'ロシア語が 全然 わかりません。 (Rus tilini umuman tushunmayman.)', 'N5', 470),
  ('m1_471', 'deck_minna1', '早く、速く', 'はやく', 'erta, barvaqt; tez', 'はやく - hayaku', '早く 起きて、速く 走ります。 (Barvaqt turib, tez yuguraman.)', 'N5', 471),
  ('m1_472', 'deck_minna1', 'どうして', 'どうして', 'nima uchun', 'どうして - doushite', 'どうして きのう 会社を 休みましたか。 (Nima uchun kecha ishga kelmadingiz?)', 'N5', 472),
  ('m1_473', 'deck_minna1', '残念ですね', 'ざんねんですね。', 'Afsus / Attang', 'ざんねんですね。 - zannendesune', 'いっしょに 行けなくて、残念ですね。 (Birga bora olmasligingiz afsus-a.)', 'N5', 473),
  ('m1_474', 'deck_minna1', 'もしもし', 'もしもし', 'allo, eshitaman', 'もしもし - moshimoshi', 'もしもし、ミラーさんのお宅ですか。 (Allo, janob Millerning xonadonimi?)', 'N5', 474),
  ('m1_475', 'deck_minna1', 'ああ', 'ああ', 'A', 'ああ - aa', 'ああ、佐藤さん、こんにちは。 (Aha, xonim Sato, assalomu alaykum.)', 'N5', 475),
  ('m1_476', 'deck_minna1', 'いっしょにいかがですか', 'いっしょにいかがですか。', 'Birga bormaymizmi? / Birga qilmaysizmi?', 'いっしょにいかがですか。 - ishoniikagadesuka', 'お昼ご飯、いっしょに いかがですか。 (Tushlikni birga qilmaysizmi?)', 'N5', 476),
  ('m1_477', 'deck_minna1', '～はちょっと…', '～はちょっと・・・・。', '~ biroz noqulay... (muloyim rad etish)', '～はちょっと・・・・。 - hachoto', '日曜日は ちょっと 都合が 悪いです。 (Yakshanba kuni biroz noqulay edi.)', 'N5', 477),
  ('m1_478', 'deck_minna1', 'だめですか', 'だめですか。', 'Bo''lmaydimi? / Iloji yo''qmi?', 'だめですか。 - damedesuka', '今週は だめですか。 (Bu hafta bo''lmaydimi?)', 'N5', 478),
  ('m1_479', 'deck_minna1', 'また今度お願いします', 'またこんどおねがいします', 'Keyingi safarga qolsin / Boshqa safar', 'またこんどおねがいします - mata kondo onegai shimasu', 'あしたの 飲み会は、また 今度 お願いします。 (Ertangi o''tirish boshqa safarga qolsin, iltimos.)', 'N5', 479),
  ('m1_480', 'deck_minna1', '小沢征爾', 'おざわせいじ', 'Ozava Seiji', 'おざわせいじ - ozawaseiji', '小沢征爾は 世界的に 有名な 指揮者です。 (Seyji Ozava jahonga mashhur dirijyordir.)', 'N5', 480)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('m1_481', 'deck_minna1', 'います', 'います', 'bor (bo''lmoq) (jonli narsalarga)', 'います - imasu', '庭に かわいい 子犬が います。 (Hovlida yoqimtoy kuchukcha bor.)', 'N5', 481),
  ('m1_482', 'deck_minna1', 'いろいろな', 'いろいろな', 'har xil, turli xil', 'いろいろな - iroirona', '日本で いろいろな 経験を しました。 (Yaponiyada turli-tuman tajribalarni orttirdim.)', 'N5', 482),
  ('m1_483', 'deck_minna1', '男の人', 'おとこのひと', 'erkak kishi', 'おとこのひと - otokonohito', 'あそこに 男の人が います。 (U yerda erkak kishi turibdi.)', 'N5', 483),
  ('m1_484', 'deck_minna1', '女の人', 'おんなのひと', 'ayol kishi', 'おんなのひと - onnanohito', 'あの 女の人は ミラーさんの 奥さんです。 (Anavi ayol kishi janob Millerning rafiqasi.)', 'N5', 484),
  ('m1_485', 'deck_minna1', '男の子', 'おとこのこ', 'o''g''il bola', 'おとこのこ - otokonoko', 'あそこで 男の子が ボールで 遊んでいます。 (Anavi yerda o''g''il bola to''p o''ynayapti.)', 'N5', 485),
  ('m1_486', 'deck_minna1', '女の子', 'おんなのこ', 'qiz bola', 'おんなのこ - onnanoko', 'かわいい 女の子が 人形を 持っています。 (Yoqimtoy qizcha qo''g''irchoq ko''tarib olgan.)', 'N5', 486),
  ('m1_487', 'deck_minna1', '犬', 'いぬ', 'kuchuk, it', 'いぬ - inu', '庭に 白い 犬が います。 (Hovlida oq kuchuk bor.)', 'N5', 487),
  ('m1_488', 'deck_minna1', '猫', 'ねこ', 'mushuk', 'ねこ - neko', '机の 下で 猫が 寝ています。 (Stol tagida mushuk uxlayapti.)', 'N5', 488),
  ('m1_489', 'deck_minna1', '木', 'き', 'daraxt', 'き - ki', '公園に 大きな 桜の 木が あります。 (Bog''da katta sakura daraxti bor.)', 'N5', 489),
  ('m1_490', 'deck_minna1', '物', 'もの', 'narsa, buyum', 'もの - mono', 'かばんの 中に 大切な 物が あります。 (Sumka ichida qimmatbaho/muhim buyum bor.)', 'N5', 490),
  ('m1_491', 'deck_minna1', 'フイルム', 'フイルム', 'fototasma', 'フイルム - fuirumu', 'カメラの フイルムを 買いました。 (Fotoapparat plyonkasini sotib oldim.)', 'N5', 491),
  ('m1_492', 'deck_minna1', '電池', 'でんち', 'batareya', 'でんち - denchi', 'リモコンの 電池を 交換しました。 (Pultning batareyasini almashtirdim.)', 'N5', 492),
  ('m1_493', 'deck_minna1', '箱', 'はこ', 'quti', 'はこ - hako', '箱を 開けると、プレゼントが 入っていました。 (Qutini ochsam, ichida sovg''a bor ekan.)', 'N5', 493),
  ('m1_494', 'deck_minna1', 'スイッチ', 'スイッチ', 'viklyuchatel', 'スイッチ - suichi', '部屋の 明かりの スイッチを つけます。 (Xona chirog''ining tugmachasini yoqaman.)', 'N5', 494),
  ('m1_495', 'deck_minna1', '冷蔵庫', 'れいぞうこ', 'muzlatgich', 'れいぞうこ - reizouko', '冷蔵庫に 牛乳と 卵が 入っています。 (Muzlatgichda sut va tuxum bor.)', 'N5', 495),
  ('m1_496', 'deck_minna1', 'テーブル', 'テーブル', 'stol', 'テーブル - te-buru', 'テーブルの 上に 花瓶を 置きました。 (Stol ustiga guldasta qo''ydim.)', 'N5', 496),
  ('m1_497', 'deck_minna1', 'ベッド', 'ベッド', 'krovat', 'ベッド - bedo', '疲れたので、ベッドに 横に なりました。 (Charchaganim sababli krovatga cho''zildim.)', 'N5', 497),
  ('m1_498', 'deck_minna1', '棚', 'たな', 'tokcha', 'たな - tana', '本棚の 棚に 辞書が 並んでいます。 (Kitob javonining tokchasida lug''atlar tizilib turibdi.)', 'N5', 498),
  ('m1_499', 'deck_minna1', 'ドア', 'ドア', 'eshik', 'ドア - doa', '寒いから ドアを 閉めて ください。 (Sovuq, eshikni yopib qo''ying, iltimos.)', 'N5', 499),
  ('m1_500', 'deck_minna1', '窓', 'まど', 'deraza', 'まど - mado', '窓から 富士山が きれいに 見えます。 (Derazadan Fuji tog''i chiroyli ko''rinib turibdi.)', 'N5', 500),
  ('m1_501', 'deck_minna1', 'ポスト', 'ポスト', 'pochta qutisi', 'ポスト - posuto', '駅前の 赤い ポストに 手紙を 入れました。 (Bekat oldidagi qizil pochta qutisiga xat tashladim.)', 'N5', 501),
  ('m1_502', 'deck_minna1', 'ビル', 'ビル', '(baland) bino', 'ビル - biru', '駅の 近くに 新しい 高層ビルが 立ちました。 (Bekat yaqinida yangi baland bino qad ko''tardi.)', 'N5', 502),
  ('m1_503', 'deck_minna1', '公園', 'こうえん', 'xiyobon, bog'', park', 'こうえん - kouen', '日曜日に 公園を 散歩しました。 (Yakshanba kuni bog''da sayr qildim.)', 'N5', 503),
  ('m1_504', 'deck_minna1', '喫茶店', 'きっさてん', 'qahvaxona', 'きっさてん - kissaten', '駅前の 喫茶店で コーヒーを 飲みました。 (Bekat oldidagi qahvaxonada kofe ichdim.)', 'N5', 504),
  ('m1_505', 'deck_minna1', '本屋', 'ほんや', 'kitob do''koni', 'ほんや - honya', '本屋で 日本語の 辞書を 買いました。 (Kitob do''konidan yapon tili lug''atini sotib oldim.)', 'N5', 505),
  ('m1_506', 'deck_minna1', '～屋', '～や', '~ do''koni, ~xona', '～や - ya', '八百屋で 新鮮な 野菜を 買いました。 (Sabzavot do''konidan yangi sabzavot oldim.)', 'N5', 506),
  ('m1_507', 'deck_minna1', '乗り場', 'のりば', 'bekat, chiqish/minish joyi', 'のりば - noriba', 'タクシー乗り場は あそこです。 (Taksi to''xtash joyi ana u yerda.)', 'N5', 507),
  ('m1_508', 'deck_minna1', '県', 'けん', 'viloyat', 'けん - ken', '神戸は 兵庫県に あります。 (Kobe Hyogo viloyatida joylashgan.)', 'N5', 508),
  ('m1_509', 'deck_minna1', '上', 'うえ', 'ust, tepa, yuqori', 'うえ - ue', '机の 上に 辞書が 置いて あります。 (Stol ustida lug''at turibdi.)', 'N5', 509),
  ('m1_510', 'deck_minna1', '下', 'した', 'ost, past', 'した - shita', '椅子の 下に 財布が 落ちています。 (Stul tagida hamyon tushib yotibdi.)', 'N5', 510),
  ('m1_511', 'deck_minna1', '前', 'まえ', 'old', 'まえ - mae', '駅の 前で 友達と 待ち合わせます。 (Bekat oldida do''stim bilan uchrashaman.)', 'N5', 511),
  ('m1_512', 'deck_minna1', '後ろ', 'うしろ', 'orqa', 'うしろ - ushiro', 'わたしの 後ろに だれかが 立っています。 (Mening orqamda kimdir turibdi.)', 'N5', 512),
  ('m1_513', 'deck_minna1', '右', 'みぎ', 'o''ng Yapon tilida', 'みぎ - migi', '交差点を 右へ 曲がると 銀行が あります。 (Chorrahadan o''ngga burilsangiz bank chiqadi.)', 'N5', 513),
  ('m1_514', 'deck_minna1', '左', 'ひだり', 'chap bu so''zlar ot', 'ひだり - hidari', '郵便局は 病院の 左側に あります。 (Pochta shifoxonaning chap tomonida.)', 'N5', 514),
  ('m1_515', 'deck_minna1', '中', 'なか', 'ich, ichkari hisoblanadi', 'なか - naka', '箱の 中に 何が 入っていますか。 (Quti ichida nima bor?)', 'N5', 515),
  ('m1_516', 'deck_minna1', '外', 'そと', 'tashqari', 'そと - soto', '雨が 降っていますから、外へ 出ません。 (Yomg''ir yog''yapti, tashqariga chiqmayman.)', 'N5', 516),
  ('m1_517', 'deck_minna1', '隣', 'となり', 'yon, qo''shni', 'となり - tonari', 'パン屋の 隣に 花屋が あります。 (Novvoyxonaning yonida gul do''koni bor.)', 'N5', 517),
  ('m1_518', 'deck_minna1', '近く', 'ちかく', 'yaqin', 'ちかく - chikaku', '学校の 近くに おいしい ラーメン屋が あります。 (Maktab yaqinida mazali ramenxona bor.)', 'N5', 518),
  ('m1_519', 'deck_minna1', '間', 'あいだ', 'ora, o''rta', 'あいだ - aida', '銀行と 郵便局の 間に 薬局が あります。 (Bank va pochta o''rtasida dorixona bor.)', 'N5', 519),
  ('m1_520', 'deck_minna1', '～や～など', '～や～など', '~ va ~ ［ kabilar ］', '～や～など - ya nado', 'かばんの 中に 本や ノートなどが あります。 (Sumka ichida kitob, daftar kabi narsalar bor.)', 'N5', 520),
  ('m1_521', 'deck_minna1', 'いちばん～', 'いちばん～', 'eng~ ( いちばん うえ eng yuqori)', 'いちばん～ - ichiban', '果物で いちばん りんごが 好きです。 (Mevalar ichida eng ko''p olmani yoqtiraman.)', 'N5', 521),
  ('m1_522', 'deck_minna1', '～段目', '～だんめ', '~(i)nchi tokcha, ~(i)nchi qator', '～だんめ - danme', '本棚の 上から 2段目に 辞書が あります。 (Kitob javonining tepadan 2-tokchasida lug''at bor.)', 'N5', 522),
  ('m1_523', 'deck_minna1', 'どうもすみません', 'どうもすみません。', 'Katta rahmat / Uzr', 'どうもすみません。 - doumosumimasen', '手伝ってくれて、どうも すみません。 (Yordamingiz uchun katta rahmat.)', 'N5', 523),
  ('m1_524', 'deck_minna1', 'チリソース', 'チリソース', 'chili sousi', 'チリソース - chiriso-su', '辛い チリソースを 料理に かけます。 (Achchiq chili sousini ovqatga solaman.)', 'N5', 524),
  ('m1_525', 'deck_minna1', '奥', 'おく', 'ichkari, to''r', 'おく - oku', '店の 奥に トイレが ございます。 (Do''konning to''rida hojatxona bor.)', 'N5', 525),
  ('m1_526', 'deck_minna1', 'スパイス・コーナー', 'スパイス・コーナー', 'ziravorlar bo''limi', 'スパイス・コーナー - supaisu ko-na-', 'スーパーの スパイス・コーナーで コショウを 買いました。 (Supermarketning ziravorlar bo''limidan murch sotib oldim.)', 'N5', 526),
  ('m1_527', 'deck_minna1', '東京ディズニーランド', 'とうきょうディズニーランド', 'Tokio Disneylendi', 'とうきょうディズニーランド - toukyoudezuni-rando', '週末に 東京ディズニーランドへ 遊びに 行きました。 (Dam olish kunida Tokio Disneylendiga aylangani bordim.)', 'N5', 527),
  ('m1_528', 'deck_minna1', 'ユニューヤ・ストア', 'ユニューヤ・ストア', 'supermarket nomi (o''ylab topilgan)', 'ユニューヤ・ストア - yuni-ya sutoa', 'ユニューヤ・ストアで 新鮮な 野菜を 買いました。 (Yunyua do''konidan yangi sabzavotlar sotib oldim.)', 'N5', 528),
  ('m1_529', 'deck_minna1', '子供がいます', 'こどもがいます', 'bolasi bor', 'こどもがいます - kodomo ga imasu', 'わたしには 子供が 2人 います。 (Mening 2 ta bolam bor.)', 'N5', 529),
  ('m1_530', 'deck_minna1', '日本にいます', 'にほんにいます', 'Yaponiyada bo''lmoq / yashamoq', 'にほんにいます - nihon ni imasu', '日本に 1年間 います。 (Yaponiyada 1 yil bo''laman.)', 'N5', 530),
  ('m1_531', 'deck_minna1', 'かかります', 'かかります', 'sarf bo''lmoq, ketmoq (pul yoki vaqt)', 'かかります - kakarimasu', 'ここから 東京まで 電車で 1時間 かかります。 (Bu yerdan Tokiogacha poyezdda 1 soat ketadi.)', 'N5', 531),
  ('m1_532', 'deck_minna1', '会社を休みます', 'かいしゃをやすみます', 'ishga chiqmaslik / dam olmoq', 'かいしゃをやすみます - kaisha o yasumimasu', '風邪を 引いたので、会社を 休みました。 (Shamollab qolganim uchun ishga chiqmadim.)', 'N5', 532),
  ('m1_533', 'deck_minna1', '1つ (ひとつ)', 'ひとつ', 'bitta', 'ひとつ - hitotsu', 'りんごを 1つ ください。 (Bitta olma bering.)', 'N5', 533),
  ('m1_534', 'deck_minna1', '2つ (ふたつ)', 'ふたつ', 'ikkita', 'ふたつ - futatsu', 'みかんを 2つ 食べました。 (Ikkita mandarin yedim.)', 'N5', 534),
  ('m1_535', 'deck_minna1', '3つ (みっつ)', 'みっつ', 'uchta', 'みっつ - mittsu', 'パンを 3つ 買いました。 (Uchta non sotib oldim.)', 'N5', 535),
  ('m1_536', 'deck_minna1', '4つ (よっつ)', 'よっつ', 'to''rtta', 'よっつ - yottsu', '机の 上に 卵が 4つ あります。 (Stol ustida 4 ta tuxum bor.)', 'N5', 536),
  ('m1_537', 'deck_minna1', '5つ (いつつ)', 'いつつ', 'beshta', 'いつつ - itsutsu', '椅子が 5つ あります。 (5 ta stul bor.)', 'N5', 537),
  ('m1_538', 'deck_minna1', '6つ (むっつ)', 'むっつ', 'oltita', 'むっつ - muttsu', 'ケーキを 6つ 買いました。 (Oltita pirojniy sotib oldim.)', 'N5', 538),
  ('m1_539', 'deck_minna1', '7つ (ななつ)', 'ななつ', 'yettita', 'ななつ - nanatsu', '箱が 7つ 届きました。 (Yettita quti yetib keldi.)', 'N5', 539),
  ('m1_540', 'deck_minna1', '8つ (やっつ)', 'やっつ', 'sakkizta', 'やっつ - yattsu', 'トマトが 8つ あります。 (Sakkizta pomidor bor.)', 'N5', 540),
  ('m1_541', 'deck_minna1', '9つ (ここのつ)', 'ここのつ', 'to''qqizta', 'ここのつ - kokonotsu', 'みかんが 9つ あります。 (To''qqizta mandarin bor.)', 'N5', 541),
  ('m1_542', 'deck_minna1', '10 (とお)', 'とお', 'o''nta', 'とお - too', '切手を 10枚 買いました。 (O''nta pochta markasi sotib oldim.)', 'N5', 542),
  ('m1_543', 'deck_minna1', 'いくつ', 'いくつ', 'qancha, nechta', 'いくつ - ikutsu', 'りんごを いくつ 買いましたか。 (Nechta olma sotib oldingiz?)', 'N5', 543),
  ('m1_544', 'deck_minna1', '1人', 'ひとり', 'bir kishi, yakka o''zi', 'ひとり - hitori', '1人で 日本へ 行きました。 (Yaponiyaga yakka o''zim bordim.)', 'N5', 544),
  ('m1_545', 'deck_minna1', '2人', 'ふたり', 'ikki kishi, ikkovlon', 'ふたり - futari', '2人で 映画を 見に 行きました。 (Ikkovlon kino ko''rgani bordik.)', 'N5', 545),
  ('m1_546', 'deck_minna1', '～台', '～だい', '~ ta (mashina, texnika sanoq suffiksi)', '～だい - dai', '車が 2台 あります。 (2 ta mashina bor.)', 'N5', 546),
  ('m1_547', 'deck_minna1', '～枚', '～まい', '~ ta, ~ varaq (yupqa narsalar sanoq suffiksi)', '～まい - mai', '切手を 5枚 買いました。 (5 ta pochta markasi sotib oldim.)', 'N5', 547),
  ('m1_548', 'deck_minna1', '～回', '～かい', '~ marta, ~ bor', '～かい - kai', '1週間に 2回 テニスを します。 (Haftada 2 marta tennis o''ynayman.)', 'N5', 548),
  ('m1_549', 'deck_minna1', 'りんご', 'りんご', 'olma', 'りんご - ringo', '甘くて おいしい りんごを 食べました。 (Shirin va mazali olma yedim.)', 'N5', 549),
  ('m1_550', 'deck_minna1', 'みかん', 'みかん', 'mandarin', 'みかん - mikan', '冬には こたつで みかんを 食べます。 (Qishda kotatsuda o''tirib mandarin yeymiz.)', 'N5', 550),
  ('m1_551', 'deck_minna1', 'サンドイッチ', 'サンドイッチ', 'sendvich', 'サンドイッチ - sandoichi', 'コンビニで サンドイッチを 買いました。 (Do''kondan sendvich sotib oldim.)', 'N5', 551),
  ('m1_552', 'deck_minna1', 'カレーライス', 'カレーライス', 'karerays', 'カレーライス - kare-raisu', '日本の カレーライスは とても 人気があります。 (Yaponiyaning karerays taomi juda mashhur.)', 'N5', 552),
  ('m1_553', 'deck_minna1', 'アイスクリーム', 'アイスクリーム', 'muzqaymoq', 'アイスクリーム - aisukuri-mu', '夏は 冷たい アイスクリームが 食べたくなります。 (Yozda muzdek muzqaymoq yeging keladi.)', 'N5', 553),
  ('m1_554', 'deck_minna1', '切手', 'きって', 'pochta markasi', 'きって - kitte', '手紙に 切手を 貼りました。 (Xatga pochta markasini yopishtirdim.)', 'N5', 554),
  ('m1_555', 'deck_minna1', 'はがき', 'はがき', 'otkritka', 'はがき - hagaki', '旅先から 友達に 絵はがきを 送りました。 (Safar joyidan do''stimga otkritka jo''natdim.)', 'N5', 555),
  ('m1_556', 'deck_minna1', '封筒', 'ふうとう', 'konvert', 'ふうとう - fuutou', '手紙を 封筒に 入れて 切手を 貼りました。 (Xatni konvertga solib pochta markasi yopishtirdim.)', 'N5', 556),
  ('m1_557', 'deck_minna1', '速達', 'そくたつ', 'tezkor pochta, ekspress pochta', 'そくたつ - sokutatsu', '急ぎの 書類ですから、速達で 送ります。 (Shoshilinch hujjat, shuning uchun tezkor pochtada yuboraman.)', 'N5', 557),
  ('m1_558', 'deck_minna1', '書留', 'かきとめ', 'buyurtmali pochta', 'かきとめ - kakitome', '大事な 手紙を 書留で 出しました。 (Muhim xatni buyurtmali xat orqali jo''natdim.)', 'N5', 558),
  ('m1_559', 'deck_minna1', 'エアメール', 'エアメール', 'avia pochta', 'エアメール - eame-ru', 'アメリカへ エアメールで 手紙を 出しました。 (Amerikaga aviapochta orqali xat jo''natdim.)', 'N5', 559),
  ('m1_560', 'deck_minna1', '航空便', 'こうくうびん', 'avia pochta', 'こうくうびん - koukuubin', '航空便で 1週間ぐらい かかります。 (Aviapochta bilan 1 hafta atrofida ketadi.)', 'N5', 560),
  ('m1_561', 'deck_minna1', '船便', 'ふなびん', 'dengiz pochtasi', 'ふなびん - funabin', '重い 荷物は 船便で 送ると 安いです。 (Og''ir yukni kema pochtasida jo''natsa arzon bo''ladi.)', 'N5', 561),
  ('m1_562', 'deck_minna1', '両親', 'りょうしん', 'ota-ona', 'りょうしん - ryoushin', '両親は 田舎で 元気に 暮らしています。 (Ota-onam qishloqda sog''-omon yashayaptilar.)', 'N5', 562),
  ('m1_563', 'deck_minna1', '兄弟', 'きょうだい', 'aka-uka, opa-singil, farzandlar', 'きょうだい - kyoudai', '兄弟が 何人 いますか。 (Nechta aka-uka/opa-singlingiz bor?)', 'N5', 563),
  ('m1_564', 'deck_minna1', '兄', 'あに', 'akam', 'あに - ani', '兄は 東京の IT企業で 働いています。 (Akam Tokioning IT kompaniyasida ishlaydi.)', 'N5', 564),
  ('m1_565', 'deck_minna1', 'お兄さん', 'おにいさん', 'akangiz,akasi', 'おにいさん - oniisan', '田中さんのお兄さんは 背が 高いですね。 (Janob Tanakaning akasi novcha ekan-a.)', 'N5', 565),
  ('m1_566', 'deck_minna1', '姉', 'あね', 'opam', 'あね - ane', '姉は 銀行で 働いています。 (Opam bankda ishlaydi.)', 'N5', 566),
  ('m1_567', 'deck_minna1', 'お姉さん', 'おねえさん', 'opangiz, opasi', 'おねえさん - oneesan', 'お姉さんは ピアノの 先生です。 (Opangiz fortepiano o''qituvchisi.)', 'N5', 567),
  ('m1_568', 'deck_minna1', '弟', 'おとうと', 'ukam', 'おとうと - otouto', '弟は 高校で サッカーを しています。 (Ukam maktabda futbol o''ynaydi.)', 'N5', 568),
  ('m1_569', 'deck_minna1', '弟さん', 'おとうとさん', 'ukangiz, ukasi', 'おとうとさん - otoutosan', '弟さんは おいくつですか。 (Ukangiz necha yoshda?)', 'N5', 569),
  ('m1_570', 'deck_minna1', '妹', 'いもうと', 'singlim', 'いもうと - imouto', '妹は 大学で 英語を 勉強しています。 (Singlim universitetda ingliz tilini o''rganyapti.)', 'N5', 570),
  ('m1_571', 'deck_minna1', '妹さん', 'いもうとさん', 'singlingiz, singlisi', 'いもうとさん - imoutosan', '妹さんは とても かわいいですね。 (Singlingiz juda yoqimtoy ekan.)', 'N5', 571),
  ('m1_572', 'deck_minna1', '外国', 'がいこく', 'chet el, xorij', 'がいこく - gaikoku', '外国へ 旅行に 行きたいです。 (Xorijga sayohatga borgim kelyapti.)', 'N5', 572),
  ('m1_573', 'deck_minna1', '～時間', '～じかん', '~ soat', '～じかん - jikan', '毎日 8時間 働きます。 (Har kuni 8 soat ishlayman.)', 'N5', 573),
  ('m1_574', 'deck_minna1', '～週間', '～しゅうかん', '~ hafta', '～しゅうかん - shuukan', '京都に 2週間 滞在しました。 (Kiotoda 2 hafta turdim.)', 'N5', 574),
  ('m1_575', 'deck_minna1', '～か月', '～かげつ', '~ oy', '～かげつ - kagetsu', '日本に 来てから 3か月が 経ちました。 (Yaponiyaga kelganimga 3 oy bo''ldi.)', 'N5', 575),
  ('m1_576', 'deck_minna1', '～年', '～ねん', '~ yil', '～ねん - nen', '日本で 2年間 勉強する 予定です。 (Yaponiyada 2 yil o''qish rejam bor.)', 'N5', 576),
  ('m1_577', 'deck_minna1', '～ぐらい', '～ぐらい', '~lar, ~cha, taxminan ~', '～ぐらい - gurai', '駅まで 15分ぐらい 歩きます。 (Bekatgacha 15 daqiqacha yuriladi.)', 'N5', 577),
  ('m1_578', 'deck_minna1', 'どのぐらい', 'どのぐらい', 'qancha vaqt / qanchalik', 'どのぐらい - donogurai', '東京から 京都まで どのぐらい かかりますか。 (Tokiodan Kiotogacha qancha vaqt ketadi?)', 'N5', 578),
  ('m1_579', 'deck_minna1', '全部で', 'ぜんぶで', 'hammasi bo''lib', 'ぜんぶで - zenbude', '全部で 5,000円に なります。 (Hammasi bo''lib 5 000 iyen bo''ladi.)', 'N5', 579),
  ('m1_580', 'deck_minna1', 'みんな', 'みんな', 'hamma, barcha', 'みんな - minna', 'クラスの みんなで 富士山に 登りました。 (Sinfdagilar hammasi birgalikda Fuji tog''iga chiqdik.)', 'N5', 580),
  ('m1_581', 'deck_minna1', '～だけ', '～だけ', 'faqat', '～だけ - dake', '休みは 日曜日だけです。 (Dam olish kuni faqat yakshanba xolos.)', 'N5', 581),
  ('m1_582', 'deck_minna1', 'いらっしゃいませ', 'いらっしゃいませ。', 'Xush kelibsiz (do''konga kirganda)', 'いらっしゃいませ。 - irashaimase', 'いらっしゃいませ！何名様ですか。 (Xush kelibsiz! Necha kishisiz?)', 'N5', 582),
  ('m1_583', 'deck_minna1', 'いいお天気ですね', 'いいおてんきですね', 'Havo juda yaxshi-ya', 'いいおてんきですね - ii otenki desu ne', 'いいお天気ですね。お出かけですか。 (Havo ajoyib-a. Biror joyga ketyapsizmi?)', 'N5', 583),
  ('m1_584', 'deck_minna1', 'お出かけですか', 'おでかけですか', 'Biror joyga boryapsizmi?', 'おでかけですか - odekake desu ka', 'お出かけですか。― ええ、ちょっと 郵便局まで。 (Ko''chagami? - Ha, pochtagacha boryapman.)', 'N5', 584),
  ('m1_585', 'deck_minna1', 'ちょっと～まで', 'ちょっと～まで。', 'Birpasga ~gacha borib kelaman', 'ちょっと～まで。 - choto made', 'ちょっと 駅まで 行ってきます。 (Birpasga bekatgacha borib kelaman.)', 'N5', 585),
  ('m1_586', 'deck_minna1', '行ってらっしゃい', 'いってらっしゃい', 'Yaxshi borib keling', 'いってらっしゃい - itterasshai', '行ってきます。― 行ってらっしゃい。 (Borib kelaman. - Yaxshi borib keling.)', 'N5', 586),
  ('m1_587', 'deck_minna1', '行ってまいります', 'いってまいります', 'Borib kelaman (xushmuomala)', 'いってまいります - itte mairimasu', '会社へ 行ってまいります。 (Ishxonaga borib kelaman.)', 'N5', 587),
  ('m1_588', 'deck_minna1', 'オーストラリア', 'オーストラリア', 'Avstraliya', 'オーストラリア - o-sutoraria', 'オーストラリアへ 留学したいです。 (Avstraliyaga o''qishga bormoqchiman.)', 'N5', 588),
  ('m1_589', 'deck_minna1', '簡単な', 'かんたんな', 'oson', 'かんたんな - kantanna', 'この 日本語の 本は 簡単ですから、読めます。 (Bu yaponcha kitob oson, o''qiy olaman.)', 'N5', 589),
  ('m1_590', 'deck_minna1', '近い', 'ちかい', 'yaqin', 'ちかい - chikai', '駅は うちから 近いです。 (Bekat uyimdan yaqin.)', 'N5', 590),
  ('m1_591', 'deck_minna1', '遠い', 'とおい', 'uzoq, olis', 'とおい - tooi', '会社は うちから 遠いです。 (Firma uyimdan uzoq.)', 'N5', 591),
  ('m1_592', 'deck_minna1', '速い / 早い', 'はやい', 'tez (速い) / barvaqt (早い)', 'はやい - hayai', '新幹線は とても 速いです。 (Sinkansen tezyurar poyezdi juda tez.)', 'N5', 592),
  ('m1_593', 'deck_minna1', '遅い', 'おそい', 'sekin, kech', 'おそい - osoi', '雨で バスが 遅くなりました。 (Yomg''ir tufayli avtobus kechikdi.)', 'N5', 593),
  ('m1_594', 'deck_minna1', '多い', 'おおい', 'ko''p', 'おおい - ooi', '東京は 人が とても 多いです。 (Tokioda odam juda ko''p.)', 'N5', 594),
  ('m1_595', 'deck_minna1', '人が多い', 'ひとがおおい', 'odam ko''p', 'ひとがおおい - hito ga ooi', '東京は 大阪より 人が 多いです。 (Tokioda Osakaga qaraganda odam ko''p.)', 'N5', 595),
  ('m1_596', 'deck_minna1', '少ない', 'すくない', 'kam', 'すくない - sukunai', 'この 町は 車が 少ないです。 (Bu shaharchada mashina kam.)', 'N5', 596),
  ('m1_597', 'deck_minna1', '暖かい / 温かい', 'あたたかい', 'iliq (ob-havo / narsa, choy)', 'あたたかい - atatakai', '春は 暖かくて 気持ちがいいです。 (Bahor iliq va rohatbaxsh.)', 'N5', 597),
  ('m1_598', 'deck_minna1', '涼しい', 'すずしい', 'salqin', 'すずしい - suzushii', '秋は 涼しくて 過ごしやすいです。 (Kuz salqin va qulay.)', 'N5', 598),
  ('m1_599', 'deck_minna1', '甘い', 'あまい', 'shirin', 'あまい - amai', 'この ケーキは 甘くて おいしいです。 (Bu tort shirin va mazali.)', 'N5', 599),
  ('m1_600', 'deck_minna1', '辛い', 'からい', 'achchiq (taom)', 'からい - karai', 'この カレーは とても 辛いです。 (Bu karri taomi juda achchiq.)', 'N5', 600)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('m1_601', 'deck_minna1', '重い', 'おもい', 'og''ir', 'おもい - omoi', 'この 荷物は とても 重いです。 (Bu yuk juda og''ir.)', 'N5', 601),
  ('m1_602', 'deck_minna1', '軽い', 'かるい', 'yengil', 'かるい - karui', 'この ノートパソコンは 軽くて 便利です。 (Bu noutbuk yengil va qulay.)', 'N5', 602),
  ('m1_603', 'deck_minna1', 'コーヒーがいい', 'コーヒーがいい', 'kofe ma''qul', 'コーヒーがいい - koohii ga ii', 'お茶と コーヒーと どちらが いいですか。 (Choy ma''qulmi yoki kofe?)', 'N5', 603),
  ('m1_604', 'deck_minna1', '季節', 'きせつ', 'fasl', 'きせつ - kisetsu', '日本の 季節の 中で 秋が いちばん 好きです。 (Yapon fasllari orasida kuzni eng yaxshi ko''raman.)', 'N5', 604),
  ('m1_605', 'deck_minna1', '春', 'はる', 'bahor', 'はる - haru', '春に なると、桜の 花が 咲きます。 (Bahor kelgach sakura gullari ochiladi.)', 'N5', 605),
  ('m1_606', 'deck_minna1', '夏', 'なつ', 'yoz', 'なつ - natsu', '日本の 夏は 湿気が 多くて 暑いです。 (Yaponiyaning yozi nam va issiq.)', 'N5', 606),
  ('m1_607', 'deck_minna1', '秋', 'あき', 'kuz', 'あき - aki', '秋には 紅葉が とても きれいです。 (Kuzda xazonrezgi juda go''zal bo''ladi.)', 'N5', 607),
  ('m1_608', 'deck_minna1', '冬', 'ふゆ', 'qish', 'ふゆ - fuyu', '冬の 北海道は 雪が たくさん 降ります。 (Qishda Xokkaydoga ko''p qor yog''adi.)', 'N5', 608),
  ('m1_609', 'deck_minna1', '天気', 'てんき', 'ob-havo', 'てんき - tenki', 'あしたの 天気予報は 晴れです。 (Ertangi ob-havo ma''lumoti ochiq havo.)', 'N5', 609),
  ('m1_610', 'deck_minna1', '雨', 'あめ', 'yomg''ir', 'あめ - ame', '外は 雨が 激しく 降っています。 (Tashqarida yomg''ir shiddat bilan yog''yapti.)', 'N5', 610),
  ('m1_611', 'deck_minna1', '雪', 'ゆき', 'qor', 'ゆき - yuki', '朝 起きたら、庭に 雪が 積もっていました。 (Ertalab tursam, hovliga qor tushibdi.)', 'N5', 611),
  ('m1_612', 'deck_minna1', '曇り', 'くもり', 'bulutli (havo)', 'くもり - kumori', 'きょうは 一日中 曇りでした。 (Bugun kun bo''yi bulutli bo''ldi.)', 'N5', 612),
  ('m1_613', 'deck_minna1', 'ホテル', 'ホテル', 'mehmonxona', 'ホテル - hoteru', '駅の 近くの ホテルを 予約しました。 (Bekat yaqinidagi mehmonxonani band qildim.)', 'N5', 613),
  ('m1_614', 'deck_minna1', '空港', 'くうこう', 'aeroport', 'くうこう - kuukou', '成田空港から 飛行機に 乗ります。 (Narita aeroportidan samolyotga chiqaman.)', 'N5', 614),
  ('m1_615', 'deck_minna1', '海', 'うみ', 'dengiz', 'うみ - umi', '夏休みに 友達と 海で 泳ぎました。 (Yozgi ta''tilda do''stlarim bilan dengizda suzdim.)', 'N5', 615),
  ('m1_616', 'deck_minna1', '世界', 'せかい', 'dunyo, olam', 'せかい - sekai', '世界中を 旅行したいです。 (Dunyo bo''ylab sayohat qilishni xohlayman.)', 'N5', 616),
  ('m1_617', 'deck_minna1', 'パーティー', 'パーティー', 'kecha, ziyofat, bazm', 'パーティー - pa-te-', '友人の 誕生日パーティーに 招待されました。 (Do''stimning tug''ilgan kun bazmiga taklif qilindim.)', 'N5', 617),
  ('m1_618', 'deck_minna1', 'お祭り', 'おまつり', 'bayram', 'おまつり - omatsuri', '町で 夏の お祭りが 開催されています。 (Shaharda yozgi festival o''tkazilyapti.)', 'N5', 618),
  ('m1_619', 'deck_minna1', '試験', 'しけん', 'imtihon, sinov', 'しけん - shiken', 'あしたの 試験のために 一生懸命 復習します。 (Ertangi imtihon uchun astoydil takrorlayman.)', 'N5', 619),
  ('m1_620', 'deck_minna1', 'すき焼き', 'すきやき', 'sukiyaki', 'すきやき - sukiyaki', 'すき焼きは 牛肉と 野菜の 鍋料理です。 (Sukiyaki mol go''shti va sabzavotli taomdir.)', 'N5', 620),
  ('m1_621', 'deck_minna1', '刺身', 'さしみ', 'sashimi', 'さしみ - sashimi', '新鮮な マグロの 刺身を 食べました。 (Yangi tunets balig''i sashimisini yedim.)', 'N5', 621),
  ('m1_622', 'deck_minna1', 'おすし', 'おすし', 'sushi- sirka arashalgan qaynatilgan guruch ustida xom baliq', 'おすし - osushi', '回転寿司で おすしを 10皿 食べました。 (Konveyer sushixonada 10 likopcha sushi yedim.)', 'N5', 622),
  ('m1_623', 'deck_minna1', 'てんぷら', 'てんぷら', 'tempura- sabzavot va baliq qovurmasi', 'てんぷら - tenpura', '揚げたての エビの てんぷらは おいしいです。 (Yangi qovurilgan krevetka tempurasi mazali.)', 'N5', 623),
  ('m1_624', 'deck_minna1', '生け花', 'いけばな', 'ikebana, gullar aranjirovkasi', 'いけばな - ikebana', '週末に 日本の 生け花を 習っています。 (Dam olish kunida yapon gul bezash san''atini o''rganyapman.)', 'N5', 624),
  ('m1_625', 'deck_minna1', '紅葉', 'もみじ', 'xazon, qizil barg', 'もみじ - momiji', '京都の 嵐山へ 紅葉を 見に 行きました。 (Kiotoning Arashiyama qismiga kuz yaproqlarini ko''rgani bordim.)', 'N5', 625),
  ('m1_626', 'deck_minna1', 'どちらも', 'どちらも', 'ikkalasi ham', 'どちらも - dochiramo', 'どちらも おいしいですから、選べません。 (Ikkalasi ham mazali, tanlay olmayman.)', 'N5', 626),
  ('m1_627', 'deck_minna1', 'ずっと', 'ずっと', 'ancha; ancha vaqt oldin; ancha vaqt', 'ずっと - zuto', '新幹線は バスより ずっと 速いです。 (Tezyurar poyezd avtobusdan ancha tez.)', 'N5', 627),
  ('m1_628', 'deck_minna1', '初めて', 'はじめて', 'birinchi bor, ilk bor', 'はじめて - hajimete', '初めて 納豆を 食べました。 (Birinchi bor natto yedim.)', 'N5', 628),
  ('m1_629', 'deck_minna1', 'ただいま', 'ただいま。', 'Men keldim (uyga qaytganda)', 'ただいま。 - tadaima', 'ただいま。― お帰りなさい。 (Men keldim. - Xush kelibsiz.)', 'N5', 629),
  ('m1_630', 'deck_minna1', 'お帰りなさい', 'おかえりなさい', 'Yaxshi keldingizmi? (uyga kutib olganda)', 'おかえりなさい - okaerinasai', 'お帰りなさい。きょうは 疲れたでしょう。 (Yaxshi keldingizmi? Bugun charchadingiz-a.)', 'N5', 630),
  ('m1_631', 'deck_minna1', 'すごいですね', 'すごいですね。', 'Ajoyib-a / Qoyil', 'すごいですね。 - sugoidesune', '日本語の スピーチコンテストで 優勝したんですか。すごいですね！ (Nutq tanlovida yutdingizmi? Qoyil!)', 'N5', 631),
  ('m1_632', 'deck_minna1', 'でも', 'でも', 'lekin, biroq, ammo', 'でも - demo', '日本料理は おいしいです。でも、少し 高いです。 (Yapon taomlari mazali. Ammo biroz qimmat.)', 'N5', 632),
  ('m1_633', 'deck_minna1', '疲れました', 'つかれました', 'Charchadim', 'つかれました - tsukaremashita', '一日中 歩いたので、とても 疲れました。 (Kun bo''yi yurganim uchun juda charchadim.)', 'N5', 633),
  ('m1_634', 'deck_minna1', '祇園祭', 'ぎおんまつり', '(Kiotodagi eng katta bayram)', 'ぎおんまつり - gionmatsuri', '7月に 京都で 祇園祭が 行われます。 (Iyul oyida Kiotoda Gion bayrami o''tkaziladi.)', 'N5', 634),
  ('m1_635', 'deck_minna1', 'ホンコン', 'ホンコン', 'Gonkong', 'ホンコン - honkon', 'ホンコンの 夜景は とても 有名です。 (Gonkongning tungi manzarasi juda mashhur.)', 'N5', 635),
  ('m1_636', 'deck_minna1', 'シンガポール', 'シンガポール', 'Singapur', 'シンガポール - shingapo-ru', 'シンガポールへ 家族旅行に 行きました。 (Singapurga oilaviy sayohatga bordim.)', 'N5', 636),
  ('m1_637', 'deck_minna1', '毎日屋', 'まいにちや', 'supermarket nomi (o''ylab topilgan)', 'まいにちや - mainichiya', '毎日屋で 安い 食料品を 買いました。 (Mainichiya do''konidan arzon oziq-ovqat sotib oldim.)', 'N5', 637),
  ('m1_638', 'deck_minna1', 'ストア', 'ABCストア', 'supermarket nomi (o''ylab topilgan)', 'ABCストア - sutoa', '近くの ストアで 牛乳を 買いました。 (Yaqindagi do''kondan sut sotib oldim.)', 'N5', 638),
  ('m1_639', 'deck_minna1', 'ジャパン', 'ジャパン', 'supermarket nomi', 'ジャパン - jipan', 'ジャパンデパートで セールが あります。 (Yaponiya universamida chegirma bor.)', 'N5', 639),
  ('m1_640', 'deck_minna1', '遊びます', 'あそびます', 'o''ynamoq, ko''ngil ochmoq', 'あそびます - asobimasu', '週末に 友達と ディズニーランドで 遊びました。 (Dam olish kunida do''stim bilan Disneylendda aylandik.)', 'N5', 640),
  ('m1_641', 'deck_minna1', '泳ぎます', 'およぎます', 'cho''milmoq, suzmoq', 'およぎます - oyogimasu', '夏休みに 海で 気持ちよく 泳ぎました。 (Yozgi ta''tilda dengizda miriqib suzdim.)', 'N5', 641),
  ('m1_642', 'deck_minna1', '迎えます', 'むかえます', 'kutib olmoq', 'むかえます - mukaemasu', '駅まで 友達を 迎えに 行きました。 (Bekatgacha do''stimni kutib olgani bordim.)', 'N5', 642),
  ('m1_643', 'deck_minna1', '疲れます', 'つかれます', 'charchamoq', 'つかれます - tsukaremasu', '一日中 歩いて、とても 疲れました。 (Kun bo''yi yurib juda charchadim.)', 'N5', 643),
  ('m1_644', 'deck_minna1', '出します', 'だします', 'chiqarmoq, olmoq (biror narasa ichidan)', 'だします - dashimasu', '郵便局で 手紙を 出しました。 (Pochtadan xat jo''natdim.)', 'N5', 644),
  ('m1_645', 'deck_minna1', '手紙を出します', 'てがみをだします', 'xat jo''natmoq', 'てがみをだします - tegami o dashimasu', '郵便局で 国へ 手紙を 出しました。 (Pochtadan yurtimga xat jo''natdim.)', 'N5', 645),
  ('m1_646', 'deck_minna1', '入ります', 'はいります', 'kirmoq', 'はいります - hairimasu', '寒いので、温かい お風呂に 入りました。 (Sovuq bo''lgani sababli issiq vannaga tushdim.)', 'N5', 646),
  ('m1_647', 'deck_minna1', '喫茶店に入ります', 'きっさてんにはいります', 'qahvaxonaga kirmoq', 'きっさてんにはいります - kissaten ni hairimasu', '雨が 降ってきたので、喫茶店に 入りました。 (Yomg''ir boshlangani sababli qahvaxonaga kirdim.)', 'N5', 647),
  ('m1_648', 'deck_minna1', '出ます', 'でます', 'bitirmoq, tugatmoq', 'でます - demasu', '切符を 買うと、お釣りが 出ます。 (Chipta sotib olsangiz qaytim chiqadi.)', 'N5', 648),
  ('m1_649', 'deck_minna1', '喫茶店を出ます', 'きっさてんをでます', 'qahvaxonadan chiqmoq', 'きっさてんをでます - kissaten o demasu', 'コーヒーを 飲んでから、喫茶店を 出ました。 (Kofe ichib bo''lib qahvaxonadan chiqdim.)', 'N5', 649),
  ('m1_650', 'deck_minna1', '結婚します', 'けっこんします', 'turmush qurmoq', 'けっこんします - kekonshimasu', '来年 幼なじみと 結婚します。 (Kelasi yili bolalikdagi tanishim bilan turmush quryapman.)', 'N5', 650),
  ('m1_651', 'deck_minna1', '買い物します', 'かいものします', 'xarid qilmoq', 'かいものします - kaimonoshimasu', '日曜日に デパートで 買い物しました。 (Yakshanba kuni universamda xarid qildim.)', 'N5', 651),
  ('m1_652', 'deck_minna1', '食事します', 'しょくじします', 'ovqatlanmoq', 'しょくじします - shokujishimasu', '家族と いっしょに レストランで 食事しました。 (Oilam bilan birgalikda restoranda ovqatlandim.)', 'N5', 652),
  ('m1_653', 'deck_minna1', '散歩します', 'さんぽします', 'sayr qilmoq', 'さんぽします - sanposhimasu', '夕方 涼しい 風を 感じながら 散歩します。 (Kechqurun salqin shabadani his qilib sayr qilaman.)', 'N5', 653),
  ('m1_654', 'deck_minna1', '公園を散歩します', 'こうえんをさんぽします', 'bog''da sayr qilmoq', 'こうえんをさんぽします - kouen o sanpo shimasu', '毎朝 近くの 公園を 散歩します。 (Har ertalab yaqin atrofdagi bog''da sayr qilaman.)', 'N5', 654),
  ('m1_655', 'deck_minna1', '大変な', 'たいへんな', 'qiyin, og''ir', 'たいへんな - taihenna', '一人での 引っ越しは 大変でした。 (Yolg''iz ko''chib o''tish ancha og''ir bo''ldi.)', 'N5', 655),
  ('m1_656', 'deck_minna1', '欲しい', 'ほしい', 'xohlamoq, ega bo''lishni istamoq', 'ほしい - hoshii', '新しい パソコンが 欲しいです。 (Yangi kompyuter xohlayapman.)', 'N5', 656),
  ('m1_657', 'deck_minna1', '寂しい', 'さびしい', 'yolg''iz, ma''yus, xafa', 'さびしい - sabishii', '友達が 国へ 帰って 寂しいです。 (Do''stim vataniga qaytib, yolg''izlanib qoldim.)', 'N5', 657),
  ('m1_658', 'deck_minna1', '広い', 'ひろい', 'keng', 'ひろい - hiroi', 'わたしの 部屋は 広くて 明るいです。 (Mening xonam keng va yorug''.)', 'N5', 658),
  ('m1_659', 'deck_minna1', '狭い', 'せまい', 'tor', 'せまい - semai', 'この 部屋は 少し 狭いです。 (Bu xona biroz tor.)', 'N5', 659),
  ('m1_660', 'deck_minna1', '市役所', 'しやくしょ', 'shahar hokimiyati / boshqarmasi', 'しやくしょ - shiyakusho', '市役所へ 登録に 行きました。 (Shahar boshqarmasiga ro''yxatdan o''tishga bordim.)', 'N5', 660),
  ('m1_661', 'deck_minna1', 'プール', 'プール', 'basseyn, hovuz', 'プール - pu-ru', '市民プールで 1時間 泳ぎました。 (Shahar basseynida 1 soat suzdim.)', 'N5', 661),
  ('m1_662', 'deck_minna1', '川', 'かわ', 'daryo', 'かわ - kawa', '川の 近くで バーベキューを しました。 (Daryo bo''yida barbekyu qildik.)', 'N5', 662),
  ('m1_663', 'deck_minna1', '経済', 'けいざい', 'iqtisod, iqtisodiyot', 'けいざい - keizai', '大学で 日本の 経済を 勉強しています。 (Universitetda Yaponiya iqtisodiyotini o''rganyapman.)', 'N5', 663),
  ('m1_664', 'deck_minna1', '美術', 'びじゅつ', 'san''at', 'びじゅつ - bijutsu', '大学で 日本の 古代美術を 研究しています。 (Universitetda qadimiy yapon san''atini tadqiq qilyapman.)', 'N5', 664),
  ('m1_665', 'deck_minna1', '釣り', 'つり', 'baliq tutish （～をします： baliq tutmoq ）', 'つり - tsuri', '週末に 父親と 川へ 釣りに 行きます。 (Dam olish kunida otam bilan daryoga baliq oviga boraman.)', 'N5', 665),
  ('m1_666', 'deck_minna1', 'スキー', 'スキー', 'chang''i; chang''i uchish （～をします： chang''i uchmoq ）', 'スキー - suki-', '冬休みに 長野へ スキーに 行きました。 (Qishki ta''tilda Naganoga chang''i uchgani bordim.)', 'N5', 666),
  ('m1_667', 'deck_minna1', '会議', 'かいぎ', 'majlis, yig''in ( ～をします： majlis qilmoq)', 'かいぎ - kaigi', '午後の 会議の 資料を 準備します。 (Tushdan keyingi yig''ilish materiallarini tayyorlayman.)', 'N5', 667),
  ('m1_668', 'deck_minna1', '登録', 'とうろく', 'ro''yxatga olish （～をします： ro''yxatga olmoq ）', 'とうろく - touroku', '市役所で 外国人登録を 行いました。 (Shahar hokimiyatida chet ellik sifatida ro''yxatdan o''tdim.)', 'N5', 668),
  ('m1_669', 'deck_minna1', '週末', 'しゅうまつ', 'hafta oxiri, dam olish kuni', 'しゅうまつ - shuumatsu', '週末は 家で ゆっくり 休みます。 (Hafta oxirida uyda bemalol dam olaman.)', 'N5', 669),
  ('m1_670', 'deck_minna1', '～ごろ', '～ごろ', '~larda (vaqt bilan qo''llaniladi.)', '～ごろ - goro', 'あしたの 昼 12時ごろ 会いましょう。 (Ertaga tushlik soat 12 lar atrofida ko''rishaylik.)', 'N5', 670),
  ('m1_671', 'deck_minna1', '何か', 'なにか', 'nimadir, biror narsa', 'なにか - nanika', 'のどが かわいたので、何か 飲みたいです。 (Chanqadim, biror narsa ichgim kelyapti.)', 'N5', 671),
  ('m1_672', 'deck_minna1', 'どこか', 'どこか', 'qayerdir, biror joy', 'どこか - dokoka', '休みの 日に どこか 静かな 所へ 行きたいです。 (Dam olish kunida qayergadir tinch joyga borgim kelyapti.)', 'N5', 672),
  ('m1_673', 'deck_minna1', 'おなかがすきました', 'おなかがすきました。', 'Qornim ochdi', 'おなかがすきました。 - onakagasukimashita', 'おなかが すきましたから、何か 食べに行きましょう。 (Qornim ochdi, biror narsa yeyishga boraylik.)', 'N5', 673),
  ('m1_674', 'deck_minna1', 'おなかがいっぱいです', 'おなかがいっぱいです。', 'Qornim to''ydi', 'おなかがいっぱいです。 - onakagaipaidesu', 'たくさん 食べたので、おなかが いっぱいです。 (Ko''p yeganim sababli qornim to''q.)', 'N5', 674),
  ('m1_675', 'deck_minna1', 'のどがかわきました', 'のどがかわきました。', 'Chanqadim', 'のどがかわきました。 - nodogakawakimashita', 'のどが かわきましたから、冷たい 水を ください。 (Chanqadim, muzdek suv bering.)', 'N5', 675),
  ('m1_676', 'deck_minna1', 'そうしましょう', 'そうしましょう。', 'Shunday qilaylik', 'そうしましょう。 - soushimashou', 'あした 映画を 見に 行きませんか。― ええ、そうしましょう。 (Ertaga kino ko''rgani bormaymizmi? - Mayli, shunday qilaylik.)', 'N5', 676),
  ('m1_677', 'deck_minna1', 'ご注文は？', 'ごちゅうもんは？', 'Buyurtmangiz nima? / Nima buyurasiz?', 'ごちゅうもんは？ - gochuumon wa?', 'いらっしゃいませ。ご注文は？ (Xush kelibsiz. Nima buyurtma qilasiz?)', 'N5', 677),
  ('m1_678', 'deck_minna1', '定食', 'ていしょく', 'ovqatlar to''plami', 'ていしょく - teishoku', 'お昼に 魚の 定食を 食べました。 (Tushlikda baliqli taomlar to''plamini yedim.)', 'N5', 678),
  ('m1_679', 'deck_minna1', '牛丼', 'ぎゅうどん', 'gyudon- qaynatilgan guruch ustida mol go''shti', 'ぎゅうどん - gyuudon', '安くて おいしい 牛丼を 注文しました。 (Arzon va mazali mol go''shtli gyudon buyurtma qildim.)', 'N5', 679),
  ('m1_680', 'deck_minna1', '少々お待ちください', 'しょうしょうおまちください', 'Biroz kutib turing (xushmuomala)', 'しょうしょうおまちください - shoushou omachi kudasai', '席を ご案内しますので、少々 お待ちください。 (Joyingizni ko''rsataman, bir oz kutib turing.)', 'N5', 680),
  ('m1_681', 'deck_minna1', '別々に', 'べつべつに', 'Alohida-alohida (hisob-kitob)', 'べつべつに - betsubetsu ni', 'お会計は 別々に お願いします。 (Hisobni alohida-alohida qilib bersangiz.)', 'N5', 681),
  ('m1_682', 'deck_minna1', 'ロシア', 'ロシア', 'Rossiya', 'ロシア - roshia', 'ロシアの 冬は とても 厳しい 寒さです。 (Rossiyaning qishi juda qahraton sovuq.)', 'N5', 682),
  ('m1_683', 'deck_minna1', 'つるや', 'つるや', 'yapon restorani nomi (o''ylab topilgan)', 'つるや - tsuruya', 'つるやで おいしい うどんを 食べました。 (Tsuruya oshxonasida mazali udon yedim.)', 'N5', 683),
  ('m1_684', 'deck_minna1', 'おはようテレビ', 'おはようテレビ', 'teledastur nomi (o''ylab topilgan)', 'おはようテレビ - ohayouterebi', '毎朝 「おはようテレビ」の ニュースを 見ます。 (Har ertalab "Ohayou TV" yangiliklarini ko''raman.)', 'N5', 684),
  ('m1_685', 'deck_minna1', 'つけます', 'つけます', 'yo''qmoq', 'つけます - tsukemasu', '暗く なったので、電気を つけました。 (Qorong''i tushgach chiroqni yoqdim.)', 'N5', 685),
  ('m1_686', 'deck_minna1', '消します', 'けします', 'o''chirmoq', 'けします - keshimasu', '寝る 前に 部屋の 電気を 消します。 (Uxlamasdan oldin xona chirog''ini o''chiraman.)', 'N5', 686),
  ('m1_687', 'deck_minna1', '開けます', 'あけます', 'ochmoq', 'あけます - akemasu', '窓を 開けて、涼しい 風を 入れます。 (Derazani ochib salqin havoni kiritaman.)', 'N5', 687),
  ('m1_688', 'deck_minna1', '閉めます', 'しめます', 'yopmoq', 'しめます - shimemasu', '雨が 入るので、窓を 閉めて ください。 (Yomg''ir kiryapti, derazani yopib qo''ying, iltimos.)', 'N5', 688),
  ('m1_689', 'deck_minna1', '急ぎます', 'いそぎます', 'shoshmoq', 'いそぎます - isogimasu', '電車に 遅れそうなので、急ぎます。 (Poyezddan kechikayotganim uchun shoshaman.)', 'N5', 689),
  ('m1_690', 'deck_minna1', '待ちます', 'まちます', 'kutmoq', 'まちます - machimasu', 'ロビーで 友達を 待っています。 (Kutish zalida do''stimni kutyapman.)', 'N5', 690),
  ('m1_691', 'deck_minna1', '止めます', 'とめます', 'to''xtatmoq', 'とめます - tomemasu', 'あそこに 車を 止めて ください。 (Anavi yerga mashinani to''xtating, iltimos.)', 'N5', 691),
  ('m1_692', 'deck_minna1', '曲がります', 'まがります', 'burilmoq, qayrilmoq', 'まがります - magarimasu', '次の 信号を 左へ 曲がります。 (Keyingi svetofordan chapga burilaman.)', 'N5', 692),
  ('m1_693', 'deck_minna1', '右へ曲がります', 'みぎへまがります', 'o''ngga burilmoq', 'みぎへまがります - migi e magarimasu', '次の 信号を 右へ 曲がって ください。 (Keyingi svetofordan o''ngga buriling.)', 'N5', 693),
  ('m1_694', 'deck_minna1', '持ちます', 'もちます', 'ushlab turmoq', 'もちます - mochimasu', 'その 重い 荷物を お持ちしましょうか。 (U og''ir yukingizni ko''tarishib yuboraymi?)', 'N5', 694),
  ('m1_695', 'deck_minna1', '取ります', 'とります', 'ulg''aymoq; qarimoq', 'とります - torimasu', 'きれいな 花の 写真を 撮りました。 (Chiroyli gulning suratini oldim.)', 'N5', 695),
  ('m1_696', 'deck_minna1', '手伝います', 'てつだいます', 'yordam bermoq, ko''maklashmoq', 'てつだいます - tetsudaimasu', '母の 料理を 手伝いました。 (Onamning ovqat qilishiga ko''maklashdim.)', 'N5', 696),
  ('m1_697', 'deck_minna1', '呼びます', 'よびます', 'chaqirmoq', 'よびます - yobimasu', 'タクシーを 1台 呼んで ください。 (Bitta taksi chaqirib bering, iltimos.)', 'N5', 697),
  ('m1_698', 'deck_minna1', '話します', 'はなします', 'suhbatlashmoq', 'はなします - hanashimasu', '先生と 日本語で ゆっくり 話しました。 (Ustoz bilan yapon tilida bosiqlik bilan gaplashdim.)', 'N5', 698),
  ('m1_699', 'deck_minna1', '見せます', 'みせます', 'ko''rsatmoq', 'みせます - misemasu', '旅行の 写真を 見せて ください。 (Sayohat rasmlarini ko''rsating, iltimos.)', 'N5', 699),
  ('m1_700', 'deck_minna1', '住所を聞きます', 'じゅうしょをききます', 'manzilni so''ramoq', 'じゅうしょをききます - juusho o kikimasu', '友達に 新しい 住所を 聞きました。 (Do''stimdan yangi manzilini so''radim.)', 'N5', 700),
  ('m1_701', 'deck_minna1', '始めます', 'はじめます', 'boshlamoq', 'はじめます - hajimemasu', '9時から 試験を 始めます。 (Soat 9 da imtihonni boshlaymiz.)', 'N5', 701),
  ('m1_702', 'deck_minna1', '降ります', 'ふります', 'yog''moq', 'ふります - furimasu', '次の バス停で 降ります。 (Keyingi avtobus bekatida tushaman.)', 'N5', 702),
  ('m1_703', 'deck_minna1', '雨が降ります', 'あめがふります', 'yomg''ir yog''moq', 'あめがふります - ame ga furimasu', '午後から 雨が 降るでしょう。 (Tushdan keyin yomg''ir yog''sa kerak.)', 'N5', 703),
  ('m1_704', 'deck_minna1', 'コピーします', 'コピーします', 'nusxa ko''chirmoq', 'コピーします - kopi-shimasu', 'この 資料を 10部 コピーして ください。 (Bu hujjatdan 10 nusxa ko''chirib bering.)', 'N5', 704),
  ('m1_705', 'deck_minna1', 'エアコン', 'エアコン', 'havo sovutgich', 'エアコン - eakon', '部屋が 暑いので、エアコンを つけました。 (Xona issiq, konditsionerni yoqdim.)', 'N5', 705),
  ('m1_706', 'deck_minna1', 'パスポート', 'パスポート', 'pasport', 'パスポート - pasupo-to', '空港で パスポートを 見せます。 (Aeroportda pasportimni ko''rsataman.)', 'N5', 706),
  ('m1_707', 'deck_minna1', '名前', 'なまえ', 'ism, nom', 'なまえ - namae', 'ここに お名前を ひらがなで 書いてください。 (Bu yerga ismingizni hiraganada yozing.)', 'N5', 707),
  ('m1_708', 'deck_minna1', '住所', 'じゅうしょ', 'manzil, turar joy', 'じゅうしょ - juusho', 'ここに 住所と 名前を 書いてください。 (Bu yerga manzil va ismingizni yozing.)', 'N5', 708),
  ('m1_709', 'deck_minna1', '地図', 'ちず', 'xarita', 'ちず - chizu', 'スマートフォンの 地図アプリを 見ながら 歩きます。 (Smartfon xaritasi ilovasiga qarab yuraman.)', 'N5', 709),
  ('m1_710', 'deck_minna1', '塩', 'しお', 'tuz', 'しお - shio', 'すみません、そこの 塩を 取って ください。 (Kechirasiz, ana u yerdagi tuzni uzatib yuboring.)', 'N5', 710),
  ('m1_711', 'deck_minna1', '砂糖', 'さとう', 'shakar, qand', 'さとう - satou', 'コーヒーに 砂糖を 少し 入れます。 (Kofega biroz shakar solaman.)', 'N5', 711),
  ('m1_712', 'deck_minna1', '読み方', 'よみかた', 'o''qilish (o''qilish uslubi)', 'よみかた - yomikata', 'この 漢字の 読み方を 教えて ください。 (Bu kanjining o''qilishini o''rgating, iltimos.)', 'N5', 712),
  ('m1_713', 'deck_minna1', '～方', '～かた', '~ish uslubi, ~ish odobi', '～かた - kata', '日本語の 勉強の 仕方（～方）を 教わりました。 (Yapon tilini o''rganish usulini bilib oldim.)', 'N5', 713),
  ('m1_714', 'deck_minna1', 'ゆっくり', 'ゆっくり', 'sekin, bemalol', 'ゆっくり - yukuri', 'もう少し ゆっくり 話して ください。 (Yana biroz sekinroq gapiring, iltimos.)', 'N5', 714),
  ('m1_715', 'deck_minna1', 'すぐ', 'すぐ', 'darhol', 'すぐ - sugu', '危ないですから、すぐに 避難してください。 (Xavfli, zudlik bilan xavfsiz joyga o''ting.)', 'N5', 715),
  ('m1_716', 'deck_minna1', 'また', 'また', 'yana', 'また - mata', 'また 今度 いっしょに 食事しましょう。 (Yana keyingi safar birga ovqatlanaylik.)', 'N5', 716),
  ('m1_717', 'deck_minna1', 'あとで', 'あとで', 'keyin', 'あとで - atode', '今は 忙しいので、あとで 電話します。 (Hozir bandman, keyinroq telefon qilaman.)', 'N5', 717),
  ('m1_718', 'deck_minna1', 'もう少し', 'もうすこし', 'yana ozgina', 'もうすこし - mousukoshi', 'もう少し 大きい サイズは ありますか。 (Yana biroz kattaroq o''lchami bormi?)', 'N5', 718),
  ('m1_719', 'deck_minna1', 'もう～', 'もう～', 'yana~', 'もう～ - mou', 'もう 一度 言って ください。 (Yana bir bor qaytarib yuboring.)', 'N5', 719),
  ('m1_720', 'deck_minna1', 'いいですよ', 'いいですよ。', 'Mayli / Albatta (ruxsat)', 'いいですよ。 - iidesuyo', 'この 傘を 借りても いいですか。― はい、いいですよ。 (Bu soyabonni olsam maylimi? - Ha, albatta.)', 'N5', 720)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
-- @@CHUNK@@
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('m1_721', 'deck_minna1', 'さあ', 'さあ', 'demak, xo''sh', 'さあ - saa', 'さあ、時間ですから 出発しましょう。 (Qani, vaqt bo''ldi, jo''naylik.)', 'N5', 721),
  ('m1_722', 'deck_minna1', 'あれ？', 'あれ？', 'Iye? / Voy? (ajablanish)', 'あれ？ - are', 'あれ？財布が どこにも ありません。 (Iye? Hamyonim hech qayerda yo''q-ku.)', 'N5', 722),
  ('m1_723', 'deck_minna1', '信号を右へ曲がってください', 'しんごうをみぎへまがってください', 'Svetofordan o''ngga buriling', 'しんごうをみぎへまがってください - shingou o migi e magatte kudasai', 'あの 信号を 右へ 曲がって ください。 (Anavi svetofordan o''ngga buriling.)', 'N5', 723),
  ('m1_724', 'deck_minna1', 'まっすぐ', 'まっすぐ', 'to''g''ri', 'まっすぐ - masugu', 'この道を まっすぐ 行くと、駅が あります。 (Ushbu yo''ldan to''g''ri yursangiz, bekat chiqadi.)', 'N5', 724),
  ('m1_725', 'deck_minna1', 'これでお願いします', 'これでおねがいします', 'buni bering / shuni olaman (to''lov qilganda)', 'これでおねがいします - kore de onegai shimasu', '1000円 出します。これで お願いします。 (1000 iyena beraman. Shu bilan hisob-kitob qiling.)', 'N5', 725),
  ('m1_726', 'deck_minna1', 'お釣り', 'おつり', 'qaytim (pul)', 'おつり - otsuri', 'お釣りと レシートを お受け取りください。 (Qaytim va chekni qabul qiling.)', 'N5', 726),
  ('m1_727', 'deck_minna1', '梅田', 'うめだ', 'Osakadagi tuman nomi', 'うめだ - umeda', '大阪の 梅田で 友達と 待ち合わせました。 (Osakaning Umeda tumanida do''stim bilan ko''rishdim.)', 'N5', 727),
  ('m1_728', 'deck_minna1', '立ちます', 'たちます', 'turmoq', 'たちます - tachimasu', '電車の中で お年寄りに 席を 譲って 立ちました。 (Poyezdda qariyaga joy berib o''rnimdan turdim.)', 'N5', 728),
  ('m1_729', 'deck_minna1', '座ります', 'すわります', 'o''tirmoq', 'すわります - suwarimasu', 'どうぞ この 椅子に 座って ください。 (Marhamat, bu stulga o''tiring.)', 'N5', 729),
  ('m1_730', 'deck_minna1', '使います', 'つかいます', 'foydalanmoq, qo''llamoq, ishlatmoq', 'つかいます - tsukaimasu', '辞書を 使って 作文を 書きました。 (Lug''atdan foydalanib insho yozdim.)', 'N5', 730),
  ('m1_731', 'deck_minna1', '置きます', 'おきます', 'qo''ymoq', 'おきます - okimasu', '毎朝 6時に 起きます。 (Har kuni ertalab soat 6 da uyg''onaman.)', 'N5', 731),
  ('m1_732', 'deck_minna1', '作ります', 'つくります', 'tayyorlamoq, yasamoq', 'つくります - tsukurimasu', '晩ご飯に カレーライスを 作りました。 (Kechki ovqatga karerays tayyorladim.)', 'N5', 732),
  ('m1_733', 'deck_minna1', '売ります', 'うります', 'sotmoq', 'うります - urimasu', 'あの 店では 新鮮な 魚介類を 売っています。 (Anavi do''konda yangi dengiz mahsulotlari sotiladi.)', 'N5', 733),
  ('m1_734', 'deck_minna1', '知ります', 'しります', 'bilmoq', 'しります - shirimasu', '田中さんの 電話番号を 知りません。 (Janob Tanakaning telefon raqamini bilmayman.)', 'N5', 734),
  ('m1_735', 'deck_minna1', '住みます', 'すみます', 'yashamoq', 'すみます - sumimasu', '将来 静かで 便利な 町に 住みたいです。 (Kelajakda tinch va qulay shaharda yashagim keladi.)', 'N5', 735),
  ('m1_736', 'deck_minna1', '研究します', 'けんきゅうします', 'ilmiy tadqiqot olib bormoq', 'けんきゅうします - kenkyuushimasu', '大学院で 日本の 文学を 研究しています。 (Magistraturada yapon adabiyotini tadqiq qilyapman.)', 'N5', 736),
  ('m1_737', 'deck_minna1', '知っています', 'しっています', 'bila(~man, ~san, ~di)', 'しっています - shiteimasu', 'あの 先生の お名前を 知っていますか。 (Anavi ustozning ismlarini bilasizmi?)', 'N5', 737),
  ('m1_738', 'deck_minna1', '住んでいます', 'すんでいます', 'yashayap(~man, san, ~ti)', 'すんでいます - sundeimasu', 'わたしは 今 東京の 新宿に 住んでいます。 (Men hozir Tokioning Shinjukusida yashayapman.)', 'N5', 738),
  ('m1_739', 'deck_minna1', '大阪に住んでいます', 'おおさかにすんでいます', 'Osakada yashayapman', 'おおさかにすんでいます - oosaka ni sunde imasu', 'わたしは 家族と 大阪に 住んでいます。 (Men oilam bilan Osakada yashayapman.)', 'N5', 739),
  ('m1_740', 'deck_minna1', '資料', 'しりょう', 'material, ma''lumot', 'しりょう - shiryou', '会議の 資料を 机の 上に 準備しました。 (Yig''ilish materiallarini stol ustiga tayyorlab qo''ydim.)', 'N5', 740),
  ('m1_741', 'deck_minna1', 'カタログ', 'カタログ', 'katalog', 'カタログ - katarogu', '新商品の カタログを 見せて ください。 (Yangi mahsulotlar katalogini ko''rsating, iltimos.)', 'N5', 741),
  ('m1_742', 'deck_minna1', '時刻表', 'じこくひょう', 'vaqt jadval', 'じこくひょう - jikokuhyou', '駅の 時刻表を 見て 次の 電車を 調べます。 (Bekatdagi poyezdlar jadvaliga qarab keyingi poyezdni bilib olaman.)', 'N5', 742),
  ('m1_743', 'deck_minna1', '服', 'ふく', 'kiyim', 'ふく - fuku', 'デパートで 冬の 暖かい 服を 買いました。 (Universamda qishki issiq kiyim sotib oldim.)', 'N5', 743),
  ('m1_744', 'deck_minna1', '製品', 'せいひん', 'mahsulot', 'せいひん - seihin', '日本の 電子製品は 世界中で 信頼されています。 (Yapon elektron mahsulotlari butun dunyoda ishonch qozongan.)', 'N5', 744),
  ('m1_745', 'deck_minna1', 'ソフト', 'ソフト', 'dastur ta''minoti (kompyuter)', 'ソフト - sofuto', 'パソコンに 新しい 翻訳ソフトを インストールしました。 (Kompyuterga yangi tarjima dasturini o''rnatdim.)', 'N5', 745),
  ('m1_746', 'deck_minna1', '専門', 'せんもん', 'mutaxassislik, yo''nalish', 'せんもん - senmon', '大学での わたしの 専門は 経済学です。 (Universitetdagi mening mutaxassisligim iqtisodiyot.)', 'N5', 746),
  ('m1_747', 'deck_minna1', '歯医者', 'はいしゃ', 'tish shifokori, stomatolog', 'はいしゃ - haisha', '歯が 痛いので、歯医者へ 行きます。 (Tishim og''riyotgani sababli stomatologga boraman.)', 'N5', 747),
  ('m1_748', 'deck_minna1', '床屋', 'とこや', 'sartaroshxona (erkaklar)', 'とこや - tokoya', '駅前の 床屋で 髪を 切りました。 (Bekat oldidagi sartaroshxonada sochimni oldirdim.)', 'N5', 748),
  ('m1_749', 'deck_minna1', 'プレイガイド', 'プレイガイド', 'teatr kassasi', 'プレイガイド - pureigaido', '駅前の プレイガイドで コンサートの 切符を 買いました。 (Bekat oldidagi chiptaxonadan konsert chiptasini oldim.)', 'N5', 749),
  ('m1_750', 'deck_minna1', '独身', 'どくしん', 'bo''ydoq', 'どくしん - dokushin', 'ミラーさんは まだ 独身です。 (Janob Miller hali bo''ydoq.)', 'N5', 750),
  ('m1_751', 'deck_minna1', '特に', 'とくに', 'ayniqsa', 'とくに - tokuni', '日本料理、特に おすしが 大好きです。 (Yapon taomlari, ayniqsa sushini juda yaxshi ko''raman.)', 'N5', 751),
  ('m1_752', 'deck_minna1', '思い出します', 'おもいだします', 'eslamoq, yodga olmoq', 'おもいだします - omoidashimasu', '写真の アルバムを 見ると、家族を 思い出します。 (Rasm albomini ko''rsam oilamni yodga olaman.)', 'N5', 752),
  ('m1_753', 'deck_minna1', 'ご家族', 'ごかぞく', 'oilangiz (hurmat shakli)', 'ごかぞく - gokazoku', 'ご家族は みなさん お元気ですか。 (Oilangizdagilar hammasi salomatmilar?)', 'N5', 753),
  ('m1_754', 'deck_minna1', 'いらっしゃいます', 'いらっしゃいます', 'bo''lmoq, bor bo''lmoq (います ning hurmat shakli)', 'いらっしゃいます - irasshaimasu', '社長は 今 会議室に いらっしゃいます。 (Prezident / direktor hozir majlislar xonasidalar.)', 'N5', 754),
  ('m1_755', 'deck_minna1', '高校', 'こうこう', 'yuqori maktab', 'こうこう - koukou', '弟は 来年 高校を 卒業します。 (Ukam kelasi yili yuqori maktabni bitiradi.)', 'N5', 755),
  ('m1_756', 'deck_minna1', '日本橋', 'にっぽんばし', 'Osakadagi savdo hududi nomi', 'にっぽんばし - nipponbashi', '大阪の 日本橋で パソコンの 部品を 買いました。 (Osakaning Nihonbashisidan kompyuter detallarini sotib oldim.)', 'N5', 756),
  ('m1_757', 'deck_minna1', '乗ります', 'のります', 'minmoq, chiqmoq', 'のります - norimasu', '毎朝 8時の 地下鉄に 乗ります。 (Har ertalab soat 8 dagi metroga chiqaman.)', 'N5', 757),
  ('m1_758', 'deck_minna1', '電車に乗ります', 'でんしゃにのります', 'poyezdga chiqmoq', 'でんしゃにのります - densha ni norimasu', '新宿駅で 電車に 乗ります。 (Shinjuku bekatida poyezdga chiqaman.)', 'N5', 758),
  ('m1_759', 'deck_minna1', '電車を降ります', 'でんしゃをおります', 'poyezddan tushmoq', 'でんしゃをおります - densha o orimasu', '次の 駅で 電車を 降ります。 (Keyingi bekatda poyezddan tushaman.)', 'N5', 759),
  ('m1_760', 'deck_minna1', '乗り換えます', 'のりかえます', 'boshqa transportga almashmoq', 'のりかえます - norikaemasu', '新宿駅で JR線に 乗り換えます。 (Shinjuku bekatida JR liniyasiga o''tirib olaman.)', 'N5', 760),
  ('m1_761', 'deck_minna1', '浴びます', 'あびます', 'qabul qilmoq', 'あびます - abimasu', '運動の 後で シャワーを 浴びました。 (Sportdan so''ng dush qabul qildim.)', 'N5', 761),
  ('m1_762', 'deck_minna1', 'シャワーを浴びます', 'シャワーをあびます', 'dush qabul qilmoq', 'シャワーをあびます - shawaa o abimasu', '朝 起きてから、シャワーを 浴びます。 (Ertalab turib dush qabul qilaman.)', 'N5', 762),
  ('m1_763', 'deck_minna1', '入れます', 'いれます', 'solmoq, joylamoq', 'いれます - iremasu', '温かい コーヒーに 砂糖を 入れます。 (Issiq kofega shakar solaman.)', 'N5', 763),
  ('m1_764', 'deck_minna1', '大学に入ります', 'だいがくにはいります', 'universitetga kirmoq', 'だいがくにはいります - daigaku ni hairimasu', '来年 東京の 大学に 入ります。 (Kelasi yili Tokiodagi universitetga kiraman.)', 'N5', 764),
  ('m1_765', 'deck_minna1', '大学を出ます', 'だいがくをでます', 'universitetni bitirmoq', 'だいがくをでます - daigaku o demasu', '3年前に 大学を 出ました。 (3 yil oldin universitetni bitirganman.)', 'N5', 765),
  ('m1_766', 'deck_minna1', 'やめます', 'やめます', 'ketmoq, tashlamoq; bas qilmoq', 'やめます - yamemasu', '健康のために たばこを やめました。 (Salomatlik uchun chekishni tashladim.)', 'N5', 766),
  ('m1_767', 'deck_minna1', '会社を辞めます', 'かいしゃをやめます', 'ishdan bo''shamoq / ketmoq', 'かいしゃをやめます - kaisha o yamemasu', '来月で 今の 会社を 辞めます。 (Kelasi oy hozirgi ishimdan bo''shayman.)', 'N5', 767),
  ('m1_768', 'deck_minna1', '押します', 'おします', 'bosmoq; itarmoq', 'おします - oshimasu', '非常ボタンを 押すと、警告音が 鳴ります。 (Favqulodda tugmani bossangiz signal chalinadi.)', 'N5', 768),
  ('m1_769', 'deck_minna1', '若い', 'わかい', 'yosh', 'わかい - wakai', 'あの 先生は 若くて 熱心です。 (Anavi o''qituvchi yosh va g''ayratli.)', 'N5', 769),
  ('m1_770', 'deck_minna1', '長い', 'ながい', 'uzun', 'ながい - nagai', 'マリアさんは 髪が 長いです。 (Mariyaning sochi uzun.)', 'N5', 770),
  ('m1_771', 'deck_minna1', '短い', 'みじかい', 'qisqa', 'みじかい - mijikai', '夏休みは 短かったです。 (Yozgi ta''til qisqa bo''ldi.)', 'N5', 771),
  ('m1_772', 'deck_minna1', '明るい', 'あかるい', 'yorug''; quvnoq', 'あかるい - akarui', '窓が 大きくて、部屋が 明るいです。 (Deraza katta bo''lib, xona yorug''.)', 'N5', 772),
  ('m1_773', 'deck_minna1', '暗い', 'くらい', 'qorong''u', 'くらい - kurai', '夜道は 暗いので 気をつけてください。 (Kechasi yo''l qorong''u, ehtiyot bo''ling.)', 'N5', 773),
  ('m1_774', 'deck_minna1', '背が高い', 'せがたかい', 'bo''yi baland, novcha', 'せがたかい - segatakai', 'ミラーさんは 背が高いです。 (Janob Miller novcha / bo''yi baland.)', 'N5', 774),
  ('m1_775', 'deck_minna1', '頭がいい', 'あたまがいい', 'aqlli, zehnli', 'あたまがいい - atamagaii', '山田さんは 頭がよくて 親切です。 (Janob Yamada aqlli va ochiqko''ngil.)', 'N5', 775),
  ('m1_776', 'deck_minna1', '体', 'からだ', 'tana, jussa', 'からだ - karada', '毎日 運動して、体を 鍛えています。 (Har kuni sport bilan shug''ullanib, tanamni chiniqtiryapman.)', 'N5', 776),
  ('m1_777', 'deck_minna1', '頭', 'あたま', 'bosh', 'あたま - atama', '頭が 痛いので、少し 休みます。 (Boshim og''riyapti, biroz dam olaman.)', 'N5', 777),
  ('m1_778', 'deck_minna1', '髪', 'かみ', 'soch', 'かみ - kami', '彼女は 黒くて 長い 髪を しています。 (U qizning sochi qora va uzun.)', 'N5', 778),
  ('m1_779', 'deck_minna1', '顔', 'かお', 'yuz', 'かお - kao', '朝 起きて すぐに 顔を 洗います。 (Ertalab uyg''oniboq yuzimni yuvaman.)', 'N5', 779),
  ('m1_780', 'deck_minna1', '目', 'め', 'ko''z', 'め - me', 'パソコンを 長時間 見て、目が 疲れました。 (Kompyuterga uzoq qarab ko''zim toliqdi.)', 'N5', 780),
  ('m1_781', 'deck_minna1', '耳', 'みみ', 'quloq', 'みみ - mimi', '寒さで 耳が 赤く なりました。 (Sovuqdan quloqlarim qizarib ketdi.)', 'N5', 781),
  ('m1_782', 'deck_minna1', '口', 'くち', 'og''iz', 'くち - kuchi', '大きく 口を 開けて ください。 (Og''zingizni katta oching, iltimos.)', 'N5', 782),
  ('m1_783', 'deck_minna1', '歯', 'は', 'tish', 'は - ha', '毎食後 必ず 歯を みがきます。 (Har ovqatdan so''ng albatta tishimni yuvaman.)', 'N5', 783),
  ('m1_784', 'deck_minna1', 'おなか', 'おなか', 'qorin', 'おなか - onaka', 'おなかが 痛いので、病院へ 行きます。 (Qornim og''riyapti, shifoxonaga boraman.)', 'N5', 784),
  ('m1_785', 'deck_minna1', '足', 'あし', 'oyoq', 'あし - ashi', 'たくさん 歩いたので、足が 疲れました。 (Ko''p yurganim sababli oyoqlarim charchadi.)', 'N5', 785),
  ('m1_786', 'deck_minna1', 'サービス', 'サービス', 'xizmat korsatish , servis', 'サービス - sa-bisu', 'この ホテルの サービスは すばらしいです。 (Bu mehmonxonaning xizmat ko''rsatishi ajoyib.)', 'N5', 786),
  ('m1_787', 'deck_minna1', 'ジョギング', 'ジョギング', 'yugurish ( ～を します： yugurmoq)', 'ジョギング - jigingu', '朝 早く 起きて ジョギングを します。 (Ertalab barvaqt turib yuguraman.)', 'N5', 787),
  ('m1_788', 'deck_minna1', 'シャワー', 'シャワー', 'dush', 'シャワー - shawa-', '運動の 後で シャワーを 浴びました。 (Sportdan so''ng dush qabul qildim.)', 'N5', 788),
  ('m1_789', 'deck_minna1', '緑', 'みどり', 'yashil; yashilliklar', 'みどり - midori', 'この 町は 公園が多くて、緑が 豊かです。 (Bu shaharda bog''lar ko''p, yashillikka boy.)', 'N5', 789),
  ('m1_790', 'deck_minna1', 'お寺', 'おてら', 'budda ibodatxonasi', 'おてら - otera', '京都の 古い お寺を 見学しました。 (Kiotoning qadimiy ibodatxonasini ziyorat qildim.)', 'N5', 790),
  ('m1_791', 'deck_minna1', '神社', 'じんじゃ', 'jinjya', 'じんじゃ - jinja', 'お正月に 神社へ 初詣に 行きます。 (Yangi yilda sinto ibodatxonasiga ziyoratga boramiz.)', 'N5', 791),
  ('m1_792', 'deck_minna1', '留学生', 'りゅうがくせい', 'xorijlik talaba', 'りゅうがくせい - ryuugakusei', '田中さんは 留学生 です。 (Tanaka janoblari xorijlik talaba.)', 'N5', 792),
  ('m1_793', 'deck_minna1', '～番', '～ばん', '~ raqam', '～ばん - ban', 'わたしの 部屋は 305番です。 (Mening xonam 305-raqam.)', 'N5', 793),
  ('m1_794', 'deck_minna1', 'どうやって', 'どうやって', 'qanday qilib', 'どうやって - douyate', '大学まで どうやって 行きますか。 (Universitetgacha qanday yetib borasiz?)', 'N5', 794),
  ('m1_795', 'deck_minna1', 'どの～', 'どの～', 'qaysi~', 'どの～ - dono', 'ミラーさんの かばんは どの かばんですか。 (Janob Millerning sumkasi qaysi sumka?)', 'N5', 795),
  ('m1_796', 'deck_minna1', 'いいえ、まだまだです', 'いいえ、まだまだです。', 'Yo''q, hali unchalik emas (kamsuqumlik)', 'いいえ、まだまだです。 - iiemadamadadesu', '日本語が お上手ですね。― いいえ、まだまだです。 (Yaponchangiz zo''r-a. - Yo''g''-e, hali unchalik emas.)', 'N5', 796),
  ('m1_797', 'deck_minna1', 'お引き出しですか', 'おひきだしですか', 'Pul yechmoqchimisiz? (bankda)', 'おひきだしですか - ohikidashi desu ka', 'お引き出しですか。こちらの ATMを ご利用ください。 (Pul yechmoqchimisiz? Bu yerdagi bankomatdan foydalaning.)', 'N5', 797),
  ('m1_798', 'deck_minna1', 'まず', 'まず', 'oldin, avvalambor', 'まず - mazu', 'まず カードを 入れて、暗証番号を 押します。 (Avval kartani kiritib, maxfiy kodni terasiz.)', 'N5', 798),
  ('m1_799', 'deck_minna1', 'キャッシュカード', 'キャッシュカード', 'bank kartasi', 'キャッシュカード - kyashuka-do', 'キャッシュカードを 財布から 出します。 (Bank kartasini hamyondan chiqaraman.)', 'N5', 799),
  ('m1_800', 'deck_minna1', '暗証番号', 'あんしょうばんごう', 'shaxsiy maxfiy kod', 'あんしょうばんごう - anshoubangou', '4桁の 暗証番号を 入力してください。 (To''rt xonali maxfiy pin-kodni kiriting.)', 'N5', 800),
  ('m1_801', 'deck_minna1', '次に', 'つぎに', 'so''ngra, keyin', 'つぎに - tsugi ni', '次に お引き出しの 金額を 押して ください。 (Keyin yechiladigan pul summasini bosing.)', 'N5', 801),
  ('m1_802', 'deck_minna1', '金額', 'きんがく', 'pul summasi', 'きんがく - kingaku', '画面の 金額を 確認して ください。 (Ekrandagi pul miqdorini tasdiqlang.)', 'N5', 802),
  ('m1_803', 'deck_minna1', '確認', 'かくにん', 'tasdiq ( ～します tasdiqlamoq)', 'かくにん - kakunin', '予約の 内容を もう一度 確認します。 (Buyurtma mazmunini yana bir bor tekshiraman.)', 'N5', 803),
  ('m1_804', 'deck_minna1', 'ボタン', 'ボタン', 'tugmacha', 'ボタン - botan', '確認の 緑の ボタンを 押して ください。 (Tasdiqlash uchun yashil tugmachani bosing.)', 'N5', 804),
  ('m1_805', 'deck_minna1', 'JR', 'ＪＲ', 'Yaponiya Temir yo''llari kompaniyasi', 'ＪＲ - ', 'JRの 山手線で 渋谷へ 行きます。 (JR Yamanote poyezdida Shibuyaga boraman.)', 'N5', 805),
  ('m1_806', 'deck_minna1', 'アジア', 'アジア', 'Osiyo', 'アジア - ajia', 'アジアの 経済は 急速に 発展しています。 (Osiyo iqtisodiyoti shiddat bilan rivojlanmoqda.)', 'N5', 806),
  ('m1_807', 'deck_minna1', 'バンドン', 'バンドン', 'Bandung (Indoneziyadagi shahar)', 'バンドン - bandon', 'バンドンは インドネシアの 涼しい 都市です。 (Bandung Indoneziyaning salqin shahri.)', 'N5', 807),
  ('m1_808', 'deck_minna1', 'ベラクルス', 'ベラクルス', 'Verakruz (Meksikadagi shahar)', 'ベラクルス - berakurusu', 'ベラクルスは メキシコの 港町です。 (Verakruz Meksikaning port shahri.)', 'N5', 808),
  ('m1_809', 'deck_minna1', 'フランケン', 'フランケン', 'Franken (Olmoniyadagi shahar)', 'フランケン - furanken', 'フランケン地方の ワインを 飲みました。 (Franken mintaqasi vinosini ichdim.)', 'N5', 809),
  ('m1_810', 'deck_minna1', 'ベトナム', 'ベトナム', 'Vetnam', 'ベトナム - betonamu', 'ベトナムの フォーは とても おいしいです。 (Vetnamning fo sho''rvasi juda mazali.)', 'N5', 810),
  ('m1_811', 'deck_minna1', 'フエ', 'フエ', 'Xve (Vetnamdagi shahar)', 'フエ - fue', 'フエは ベトナムの 古都です。 (Xve Vetnamning qadimiy poytaxti.)', 'N5', 811),
  ('m1_812', 'deck_minna1', '大学前', 'だいがくまえ', '“Daigakumae”', 'だいがくまえ - daigakumae', '大学前の バス停で 降ります。 (Universitet oldidagi bekatda tushaman.)', 'N5', 812),
  ('m1_813', 'deck_minna1', '覚えます', 'おぼえます', 'yod olmoq', 'おぼえます - oboemasu', '毎日 新しい 漢字を 5つ 覚えます。 (Har kuni 5 ta yangi kanji yodlayman.)', 'N5', 813),
  ('m1_814', 'deck_minna1', '忘れます', 'わすれます', 'unutmoq, esdan chiqarmoq', 'わすれます - wasuremasu', '宿題を 家に 忘れて しまいました。 (Vazifamni uyda unutib qoldiribman.)', 'N5', 814),
  ('m1_815', 'deck_minna1', 'なくします', 'なくします', 'yo''qotmoq', 'なくします - nakushimasu', '駅で 大切な パスポートを なくしました。 (Bekatda qimmatli pasportimni yo''qotib qo''ydim.)', 'N5', 815),
  ('m1_816', 'deck_minna1', 'レポートを出します', 'レポートをだします', 'hisobot topshirmoq', 'レポートをだします - repooto o dashimasu', '金曜日までに レポートを 出さなければなりません。 (Jumagacha hisobot topshirishim shart.)', 'N5', 816),
  ('m1_817', 'deck_minna1', '払います', 'はらいます', 'to''lamoq', 'はらいます - haraimasu', 'レジで 現金で 払いました。 (Kassada naqd pul bilan to''ladim.)', 'N5', 817),
  ('m1_818', 'deck_minna1', '返します', 'かえします', 'qaytarib bermoq', 'かえします - kaeshimasu', '図書館へ 借りた 本を 返しに 行きます。 (Kutubxonaga olgan kitobimni qaytargani boraman.)', 'N5', 818),
  ('m1_819', 'deck_minna1', '出かけます', 'でかけます', 'chiqib ketmoq', 'でかけます - dekakemasu', '休みの 日には 友達と 買い物に 出かけます。 (Dam olish kunida do''stim bilan xaridga chiqaman.)', 'N5', 819),
  ('m1_820', 'deck_minna1', '脱ぎます', 'ぬぎます', 'yechmoq (kiyimni ~)', 'ぬぎます - nugimasu', '家へ 入る 前に、玄関で 靴を 脱ぎます。 (Uyga kirishdan oldin dahlizda poyafzalni yechamiz.)', 'N5', 820),
  ('m1_821', 'deck_minna1', '持って行きます', 'もっていきます', 'olib bormoq', 'もっていきます - moteikimasu', '毎日 持って行きます。 (Har kuni olib bormoq.)', 'N5', 821),
  ('m1_822', 'deck_minna1', '持って来ます', 'もってきます', 'olib kelmoq', 'もってきます - motekimasu', '毎日 持って来ます。 (Har kuni olib kelmoq.)', 'N5', 822),
  ('m1_823', 'deck_minna1', '心配します', 'しんぱいします', 'xavotir olmoq', 'しんぱいします - shinpaishimasu', 'あまり 心配しないで ください。大丈夫ですよ。 (Unchalik xavotir olmang. Hammasi joyida bo''ladi.)', 'N5', 823),
  ('m1_824', 'deck_minna1', '残業します', 'ざんぎょうします', 'belgilangan ish vaqti tugagandan keyin qolib ishlamoq', 'ざんぎょうします - zangyoushimasu', 'きょうは 仕事が たくさん あるので、残業します。 (Bugun ish ko''p, qo''shimcha ishda qolaman.)', 'N5', 824),
  ('m1_825', 'deck_minna1', '出張します', 'しゅっちょうします', 'xizmat safariga ketmoq', 'しゅっちょうします - shuchoushimasu', '来週 大阪の 支社へ 出張します。 (Kelasi hafta Osakadagi filialga xizmat safariga boraman.)', 'N5', 825),
  ('m1_826', 'deck_minna1', '薬を飲みます', 'くすりをのみます', 'dori ichmoq', 'くすりをのみます - kusuri o nomimasu', '食後に この 薬を 飲んで ください。 (Ovqatdan keyin ushbu dorini iching.)', 'N5', 826),
  ('m1_827', 'deck_minna1', 'お風呂に入ります', 'おふろにはいります', 'vannaga / hammomga tushmoq', 'おふろにはいります - ofuro ni hairimasu', '熱が ありますから、きょうは お風呂に 入らないで ください。 (Isitma bor, bugun vannaga kirmang.)', 'N5', 827),
  ('m1_828', 'deck_minna1', '大切な', 'たいせつな', 'muhim', 'たいせつな - taisetsuna', 'これは 祖母から もらった 大切な 時計です。 (Bu buvimdan olgan qadrli soatim.)', 'N5', 828),
  ('m1_829', 'deck_minna1', '大丈夫な', 'だいじょうぶな', 'hammasi joyida, xavotirga o''rin yo''q', 'だいじょうぶな - daijoubuna', '心配しないで ください。もう 大丈夫です。 (Xavotir olmang. Hammasi joyida.)', 'N5', 829),
  ('m1_830', 'deck_minna1', '危ない', 'あぶない', 'xavfli', 'あぶない - abunai', '道で 遊ぶのは 危ないです。 (Yo''lda o''ynash xavfli.)', 'N5', 830),
  ('m1_831', 'deck_minna1', '問題', 'もんだい', 'savol, masala; muammo', 'もんだい - mondai', 'テストの 問題が 全部 できました。 (Test savollarining barchasini ishladim.)', 'N5', 831),
  ('m1_832', 'deck_minna1', '答え', 'こたえ', 'javob', 'こたえ - kotae', '問題の 答えを ノートに 書いて ください。 (Savolning javobini daftarga yozing.)', 'N5', 832),
  ('m1_833', 'deck_minna1', '禁煙', 'きんえん', 'chekish taqiqlanadi', 'きんえん - kinen', 'この レストランは 全席 禁煙です。 (Bu restoranning barcha o''rinlarida chekish taqiqlangan.)', 'N5', 833),
  ('m1_834', 'deck_minna1', '健康保険証', 'けんこうほけんしょう', 'tibbiy sug''urta guvohnomasi', 'けんこうほけんしょう - kenkouhokenshou', '病院へ 行く とき、健康保険証を 忘れずに 持って 行きます。 (Shifoxonaga borganimda sug''urta kartasini unutmay olib boraman.)', 'N5', 834),
  ('m1_835', 'deck_minna1', '風邪', 'かぜ', 'shamollash', 'かぜ - kaze', '風邪を 引いて、声が 出ません。 (Shamollab qolib ovozim chiqmayapti.)', 'N5', 835),
  ('m1_836', 'deck_minna1', '熱', 'ねつ', 'isitma', 'ねつ - netsu', '38度の 熱が ありますから、寝ています。 (38 daraja isitma bor, yotibman.)', 'N5', 836),
  ('m1_837', 'deck_minna1', '病気', 'びょうき', 'kasal, betob; kasallik', 'びょうき - byouki', '病気に ならないように、手洗いを します。 (Kasal bo''lmaslik uchun qo''limni yuvaman.)', 'N5', 837),
  ('m1_838', 'deck_minna1', '薬', 'くすり', 'dori', 'くすり - kusuri', '薬局で 風邪薬を 買って 飲みました。 (Dorixonadan shamollash dorisini sotib ichdim.)', 'N5', 838),
  ('m1_839', 'deck_minna1', 'お風呂', 'おふろ', 'hammom', 'おふろ - ofuro', '日本の お風呂は 深くて 温まります。 (Yaponiyaning vannasi chuqur va yaxshi isitadi.)', 'N5', 839),
  ('m1_840', 'deck_minna1', '上着', 'うわぎ', 'korjoma, kostyum', 'うわぎ - uwagi', '寒いので、暖かい 上着を 羽織りました。 (Sovuq bo''lgani uchun issiq kurtka/kamzul kiyib oldim.)', 'N5', 840)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('m1_841', 'deck_minna1', '下着', 'したぎ', 'ichki kiyim', 'したぎ - shitagi', '汗を かいたので、下着を 着替えました。 (Terlaganim sababli ichki kiyimimni almashtirdim.)', 'N5', 841),
  ('m1_842', 'deck_minna1', '2、3日', '２、３にち', 'ikki-uch kun', '２、３にち - nichi', '2、3日 ゆっくり 休めば 治りますよ。 (Ikki-uch kun yaxshilab dam olsangiz tuzalib ketasiz.)', 'N5', 842),
  ('m1_843', 'deck_minna1', '2、3～', '２、３～', 'ikki-uchta ~', '２、３～ - ', '2、3個 りんごを 買いました。 (Ikki-uchtacha olma sotib oldim.)', 'N5', 843),
  ('m1_844', 'deck_minna1', '～までに', '～までに', '~gacha', '～までに - madeni', 'あしたの 夕方5時までに 提出してください。 (Ertaga kechki 5 gacha topshiring.)', 'N5', 844),
  ('m1_845', 'deck_minna1', 'ですから', 'ですから', 'shu sababli', 'ですから - desukara', 'あしたは 試験です。ですから 早く 寝ます。 (Ertaga imtihon. Shuning uchun erta uxlayman.)', 'N5', 845),
  ('m1_846', 'deck_minna1', 'どうしましたか', 'どうしましたか。', 'Nima bo''ldi? / Tinchlikmi?', 'どうしましたか。 - doushimashitaka', '元気が ありませんね。どうしましたか。 (Kayfiyatingiz yo''q-a. Nima bo''ldi?)', 'N5', 846),
  ('m1_847', 'deck_minna1', '～が痛いです', '～がいたいです', '~im og''riyapti', '～がいたいです - ~ ga itai desu', 'きのうから のどが 痛いです。 (Kechadan beri tomog''im og''riyapti.)', 'N5', 847),
  ('m1_848', 'deck_minna1', 'のど', 'のど', 'tomoq', 'のど - nodo', 'のどが 痛いので、温かい お茶を 飲みます。 (Tomog''im og''riganligi uchun iliq choy ichaman.)', 'N5', 848),
  ('m1_849', 'deck_minna1', 'お大事に', 'おだいじに', 'Tezroq sog''ayib keting (bemorga)', 'おだいじに - odaiji ni', '無理を しないで、どうぞ お大事に。 (O''zingizni zo''riqtirmang, tezroq sog''ayib keting.)', 'N5', 849),
  ('m1_850', 'deck_minna1', 'できます', 'できます', 'qila olmoq, bajara olmoq', 'できます - dekimasu', 'わたしは ピアノを 弾くことが できます。 (Men fortepiano chala olaman.)', 'N5', 850),
  ('m1_851', 'deck_minna1', '洗います', 'あらいます', 'yuvmoq', 'あらいます - araimasu', '食事の 前に 手を きれいに 洗いましょう。 (Ovqatdan oldin qo''llarni toza qilib yuvaylik.)', 'N5', 851),
  ('m1_852', 'deck_minna1', '弾きます', 'ひきます', 'chalmoq (musiqa asbobini~)', 'ひきます - hikimasu', '休みの 日に 部屋で ギターを 弾きます。 (Dam olish kunida xonamda gitara chalama.)', 'N5', 852),
  ('m1_853', 'deck_minna1', '歌います', 'うたいます', 'kuylamoq, qo''shiq aytmoq', 'うたいます - utaimasu', 'みんなで いっしょに 日本の 歌を 歌いました。 (Hammamiz birgalikda yaponcha qo''shiq kuyladik.)', 'N5', 853),
  ('m1_854', 'deck_minna1', '集めます', 'あつめます', 'yig''moq, to''plamoq', 'あつめます - atsumemasu', '子どもの 頃から 世界の 切手を 集めています。 (Bolaligimdan dunyo pochta markalarini to''playman.)', 'N5', 854),
  ('m1_855', 'deck_minna1', '捨てます', 'すてます', 'tashlamoq', 'すてます - sutemasu', '燃える ごみを 決められた 日に 捨てます。 (Yonuvchan chiqindini belgilangan kunda tashlayman.)', 'N5', 855),
  ('m1_856', 'deck_minna1', '換えます', 'かえます', 'almashtirmoq, o''zgartirmoq', 'かえます - kaemasu', '銀行で ドルを 日本円に 換えます。 (Bankda dollarni yapon iyeniga almashtiraman.)', 'N5', 856),
  ('m1_857', 'deck_minna1', '運転します', 'うんてんします', 'haydamoq (transport ~)', 'うんてんします - untenshimasu', '週末に ドライブで 車を 運転しました。 (Dam olish kunida mashina haydab sayr qildim.)', 'N5', 857),
  ('m1_858', 'deck_minna1', '予約します', 'よやくします', 'buyurtma bermoq', 'よやくします - yoyakushimasu', 'インターネットで 新幹線の 座席を 予約しました。 (Internetda Shinkansen o''rnini band qildim.)', 'N5', 858),
  ('m1_859', 'deck_minna1', '見学します', 'けんがくします', 'kuzatmoq, ko''rmoq (o''rganish maqsadida)', 'けんがくします - kengakushimasu', '自動車の 工場を 見学しました。 (Avtomobil zavodini borib ko''rdim.)', 'N5', 859),
  ('m1_860', 'deck_minna1', 'ピアノ', 'ピアノ', 'pianino', 'ピアノ - piano', '子どもの 頃から ピアノを 習っています。 (Bolaligimdan fortepiano chalishni o''rganaman.)', 'N5', 860),
  ('m1_861', 'deck_minna1', '～メートル', '～メートル', '~ metr', '～メートル - me-toru', 'あの 木の 高さは 10メートルぐらい あります。 (Anavi daraxtning balandligi 10 metrcha keladi.)', 'N5', 861),
  ('m1_862', 'deck_minna1', '国際～', 'こくさい～', 'xalqaro ~', 'こくさい～ - kokusai', '国際会議に 参加しました。 (Xalqaro konferensiyada qatnashdim.)', 'N5', 862),
  ('m1_863', 'deck_minna1', '現金', 'げんきん', 'naqd pul', 'げんきん - genkin', 'クレジットカードが 使えませんから、現金で 払います。 (Karta ishlamaydi, naqd pul bilan to''layman.)', 'N5', 863),
  ('m1_864', 'deck_minna1', '趣味', 'しゅみ', 'qiziqish', 'しゅみ - shumi', 'わたしの 趣味は 写真を 撮ることです。 (Mening qiziqishim rasmga olish.)', 'N5', 864),
  ('m1_865', 'deck_minna1', '日記', 'にっき', 'kundalik daftar', 'にっき - niki', '毎晩 寝る 前に 日本語で 日記を 書きます。 (Har kecha uxlashdan oldin yaponcha kundalik yozaman.)', 'N5', 865),
  ('m1_866', 'deck_minna1', 'お祈り', '［お］いのり', 'ibodat, duo', '［お］いのり - oinori', '食事の 前に 家族で お祈りを します。 (Ovqatdan oldin oila bo''lib duo qilamiz.)', 'N5', 866),
  ('m1_867', 'deck_minna1', '課長', 'かちょう', 'bo''lim boshlig''i', 'かちょう - kachou', '木村さんは 営業部の 課長です。 (Janob Kimura savdo bo''limi boshlig''i.)', 'N5', 867),
  ('m1_868', 'deck_minna1', '部長', 'ぶちょう', 'departament boshlig''i', 'ぶちょう - buchou', '部長に 新しい 企画書を 提出しました。 (Departament boshlig''iga yangi loyiha hisobotini topshirdim.)', 'N5', 868),
  ('m1_869', 'deck_minna1', '社長', 'しゃちょう', 'korxona boshlig''i', 'しゃちょう - shachou', '社長が 全社員の 前で 挨拶を しました。 (Kompaniya rahbari barcha xodimlar oldida nutq so''zladi.)', 'N5', 869),
  ('m1_870', 'deck_minna1', '動物', 'どうぶつ', 'jonivor, hayvon', 'どうぶつ - doubutsu', '上野動物園で かわいい 動物を たくさん 見ました。 (Ueno hayvonot bog''ida yoqimtoy hayvonlarni ko''rdim.)', 'N5', 870),
  ('m1_871', 'deck_minna1', '馬', 'うま', 'ot (hayvon)', 'うま - uma', '北海道の 牧場で 馬に 乗りました。 (Xokkaydo fermasida ot mindim.)', 'N5', 871),
  ('m1_872', 'deck_minna1', 'へえ', 'へえ', 'Iye! / Qoyil-e! (hayrat)', 'へえ - hee', '富士山に 3回 登りました。― へえ、すごいですね。 (Fuji tog''iga 3 marta chiqdim. - Iye, qoyil-e!)', 'N5', 872),
  ('m1_873', 'deck_minna1', 'それはおもしろいですね', 'それはおもしろいですね。', 'Bu juda qiziq-a', 'それはおもしろいですね。 - sorehaomoshiroidesune', '日本刀を 集めているんです。― それはおもしろいですね。 (Yapon qilichlarini to''playapman. - Juda qiziq ekan-a.)', 'N5', 873),
  ('m1_874', 'deck_minna1', 'なかなか', 'なかなか', 'sira, hech (inkor gapda qo''llaniladi)', 'なかなか - nakanaka', 'バスが なかなか 来ませんね。 (Avtobus sira kela qolmayapti-ya.)', 'N5', 874),
  ('m1_875', 'deck_minna1', '牧場', 'ぼくじょう', 'ferma', 'ぼくじょう - bokujou', '広い 牧場で 牛や 羊を 飼っています。 (Katta fermada sig''ir va qo''ylar boqiladi.)', 'N5', 875),
  ('m1_876', 'deck_minna1', 'ほんとうですか', 'ほんとうですか。', 'Rostdanmi? / Haqiqatdanmi?', 'ほんとうですか。 - hontoudesuka', '来月 結婚するんです。― え、ほんとうですか。 (Kelasi oy uylanyapman. - Iye, rostdanmi?)', 'N5', 876),
  ('m1_877', 'deck_minna1', 'ぜひ', 'ぜひ', 'albatta', 'ぜひ - zehi', '日本へ 来たら、ぜひ 京都へ 行って ください。 (Yaponiyaga kelsangiz, albatta Kiotoga boring.)', 'N5', 877),
  ('m1_878', 'deck_minna1', 'ビートルズ', 'ビートルズ', '“Bitlz” – mashhur ingliz musiqa guruhi', 'ビートルズ - bi-toruzu', '父は ビートルズの レコードを 大切に しています。 (Otam "Bitlz" plastinkasini asrab-avaylaydi.)', 'N5', 878),
  ('m1_879', 'deck_minna1', '登ります', 'のぼります', 'chiqmoq, ko''tarilmoq', 'のぼります - noborimasu', '去年の 夏休みに 富士山に 登りました。 (O''tgan yozgi ta''tilda Fuji tog''iga chiqdim.)', 'N5', 879),
  ('m1_880', 'deck_minna1', '山に登ります', 'やまにのぼります', 'toqqa chiqmoq', 'やまにのぼります - yama ni noborimasu', '去年の 夏に 友達と 富士山に 登りました。 (O''tgan yozda do''stlarim bilan Fuji tog''iga chiqdim.)', 'N5', 880),
  ('m1_881', 'deck_minna1', '泊まります', 'とまります', 'tunamoq', 'とまります - tomarimasu', '京都の 伝統的な 旅館に 泊まりました。 (Kiotoning an''anaviy yapon mehmonxonasida tunadim.)', 'N5', 881),
  ('m1_882', 'deck_minna1', 'ホテルに泊まります', 'ホテルにとまります', 'mehmonxonada tunamoq', 'ホテルにとまります - hoteru ni tomarimasu', '旅行で 温泉の ある ホテルに 泊まりました。 (Sayohatda issiq bulog''i bor mehmonxonada tunadim.)', 'N5', 882),
  ('m1_883', 'deck_minna1', '掃除します', 'そうじします', 'tozalamoq', 'そうじします - soujishimasu', '土曜日の 朝 部屋を きれいに 掃除します。 (Shanba kuni ertalab xonani toza qilib yig''ishtiraman.)', 'N5', 883),
  ('m1_884', 'deck_minna1', '洗濯します', 'せんたくします', 'kir yuvmoq', 'せんたくします - sentakushimasu', '天気が いい 日に シーツを 洗濯します。 (Havo yaxshi kunda choyshablarni kir yuvaman.)', 'N5', 884),
  ('m1_885', 'deck_minna1', '練習します', 'れんしゅうします', 'mashq qilmoq', 'れんしゅうします - renshuushimasu', '毎日 発音の 練習を しています。 (Har kuni talaffuz mashqini qilyapman.)', 'N5', 885),
  ('m1_886', 'deck_minna1', 'なります', 'なります', 'bo''lmoq', 'なります - narimasu', '将来 日本語の 先生に なりたいです。 (Kelajakda yapon tili o''qituvchisi bo''lmoqchiman.)', 'N5', 886),
  ('m1_887', 'deck_minna1', '眠い', 'ねむい', 'uyqisiramoq, uyqu kelgan', 'ねむい - nemui', 'きのう 夜遅くまで 起きていたので、眠いです。 (Kecha kechgacha o''tirganim sababli uyqum kelyapti.)', 'N5', 887),
  ('m1_888', 'deck_minna1', '強い', 'つよい', 'kuchli, baquvvat', 'つよい - tsuyoi', 'あの 相撲選手は とても 強いです。 (Anavi sumo kurashchisi juda kuchli.)', 'N5', 888),
  ('m1_889', 'deck_minna1', '弱い', 'よわい', 'kuchsiz, nimjon', 'よわい - yowai', 'わたしは お酒に 弱いです。 (Men spirtli ichimlikka nozikman / icholmayman.)', 'N5', 889),
  ('m1_890', 'deck_minna1', '調子がいい', 'ちょうしがいい', 'o''zini yaxshi his qilmoq; soz', 'ちょうしがいい - choushigaii', '最近 体の 調子が とても いいです。 (Yaqinda sog''lig''im/ahvolim juda yaxshi.)', 'N5', 890),
  ('m1_891', 'deck_minna1', '調子が悪い', 'ちょうしがわるい', 'o''zini yomon his qilmoq; nosoz', 'ちょうしがわるい - choushigawarui', '胃の 調子が 悪いので、お粥を 食べます。 (Oshqozonim nosoz, shuning uchun bo''tqa yeyman.)', 'N5', 891),
  ('m1_892', 'deck_minna1', '調子', 'ちょうし', 'kayfiyat, holat', 'ちょうし - choushi', 'パソコンの 調子は どうですか。 (Kompyuteringiz qanday ishlayapti?)', 'N5', 892),
  ('m1_893', 'deck_minna1', 'ゴルフ', 'ゴルフ', 'golf ( ～を します : golf o''ynamoq)', 'ゴルフ - gorufu', '会社の 上司と ゴルフを しました。 (Kompaniya boshlig''i bilan golf o''ynadim.)', 'N5', 893),
  ('m1_894', 'deck_minna1', '相撲', 'すもう', 'sumo kurashi', 'すもう - sumou', '両国国技館で 大相撲を 見ました。 (Ryogoku Kokugikanda sumo kurashini tomosha qildim.)', 'N5', 894),
  ('m1_895', 'deck_minna1', 'パチンコ', 'パチンコ', 'o''yin avtomati, pachinko', 'パチンコ - pachinko', '日本の 駅前には よく パチンコ屋が あります。 (Yaponiya bekatlari oldida pachinko zallari ko''p.)', 'N5', 895),
  ('m1_896', 'deck_minna1', '日', 'ひ', 'kun', 'ひ - hi', '天気が いい 日には 洗濯を します。 (Havo yaxshi bo''lgan kunda kir yuvaman.)', 'N5', 896),
  ('m1_897', 'deck_minna1', '一度', 'いちど', 'bir marta', 'いちど - ichido', 'もう 一度 ゆっくり 言って ください。 (Yana bir marta sekinroq ayting, iltimos.)', 'N5', 897),
  ('m1_898', 'deck_minna1', '一度も', 'いちども', 'bir marta ham, hech, sira', 'いちども - ichidomo', 'わたしは 一度も スキーを したことが ありません。 (Men bir marta ham chang''i uchmaganman.)', 'N5', 898),
  ('m1_899', 'deck_minna1', 'だんだん', 'だんだん', 'asta-sekin, tobora', 'だんだん - dandan', '春に なって、だんだん 暖かく なってきました。 (Bahor kelib, havo asta-sekin iliy boshladi.)', 'N5', 899),
  ('m1_900', 'deck_minna1', 'もうすぐ', 'もうすぐ', 'tez orada', 'もうすぐ - mousugu', 'もうすぐ 桜が 咲く 季節に なります。 (Tez orada sakura gullaydigan mavsum keladi.)', 'N5', 900),
  ('m1_901', 'deck_minna1', 'おかげさまで', 'おかげさまで', 'Sharofatingiz bilan / Xudoga shukur', 'おかげさまで - okagesamade', 'お元気ですか。― はい、おかげさまで 元気です。 (Yaxshimisiz? - Ha, shukr, yaxshiman.)', 'N5', 901),
  ('m1_902', 'deck_minna1', '乾杯', 'かんぱい', 'Qani oldik! / Qadahlar to''qnashuvi', 'かんぱい - kanpai', '合格を 祝して、みんなで 乾杯しましょう！ (Imtihondan o''tganlikni nishonlab, qani oldik!)', 'N5', 902),
  ('m1_903', 'deck_minna1', '実は', 'じつは', 'Ochig''i, aslida', 'じつは - jitsu wa', '実は 来月 国へ 帰ることになりました。 (Ochig''i, kelasi oy yurtimga qaytadigan bo''ldim.)', 'N5', 903),
  ('m1_904', 'deck_minna1', 'ダイエット', 'ダイエット', 'parhez ( ～を します : parhez qilmoq)', 'ダイエット - daieto', '健康のために ダイエットを 始めました。 (Salomatlik uchun parhez boshladim.)', 'N5', 904),
  ('m1_905', 'deck_minna1', '何回も', 'なんかいも', 'bir necha marta, qayta-qayta', 'なんかいも - nankai mo', 'この 映画を 何回も 見ました。 (Bu filmni bir necha bor ko''rganman.)', 'N5', 905),
  ('m1_906', 'deck_minna1', 'しかし', 'しかし', 'lekin', 'しかし - shikashi', '一生懸命 勉強しました。しかし、試験に 落ちました。 (Astoydil o''qidim. Ammo imtihondan yiqildim.)', 'N5', 906),
  ('m1_907', 'deck_minna1', '無理な', 'むり［な］', 'imkonsiz, o''ta qiyin', 'むり［な］ - muri [na]', '無理な スケジュールは 体に よくありません。 (O''ta tig''iz reja sog''liqqa yaxshi emas.)', 'N5', 907),
  ('m1_908', 'deck_minna1', '体にいい', 'からだにいい', 'sog''liqqa foydali', 'からだにいい - karada ni ii', '毎朝の ジョギングは 体に いいです。 (Har ertalabki yugurish sog''liqqa foydali.)', 'N5', 908),
  ('m1_909', 'deck_minna1', 'ケーキ', 'ケーキ', 'tort, pirojniy', 'ケーキ - ke-ki', '誕生日に 大きな チョコレートケーキを 食べました。 (Tug''ilgan kunda katta shokoladli tort yedim.)', 'N5', 909),
  ('m1_910', 'deck_minna1', '葛飾北斎', 'かつしかほくさい', 'Katsushika Hokusay (mashhur yapon rassomi)', 'かつしかほくさい - katsushika hokusai', '葛飾北斎は 「富嶽三十六景」で 有名な 浮世絵師です。 (Katsushika Hokusay mashhur yapon musavviridir.)', 'N5', 910),
  ('m1_911', 'deck_minna1', '要ります', 'いります', 'kerak bo''lmoq, zarur bo''lmoq', 'いります - irimasu', '旅行の 準備に 何が 要りますか。 (Sayohat tayyorgarligiga nima kerak bo''ladi?)', 'N5', 911),
  ('m1_912', 'deck_minna1', 'ビザが要ります', 'ビザがいります', 'viza kerak bo''lmoq', 'ビザがいります - biza ga irimasu', '外国へ 旅行する とき、ビザが 要ります。 (Chet elga borganda viza kerak bo''ladi.)', 'N5', 912),
  ('m1_913', 'deck_minna1', '調べます', 'しらべます', 'tekshirmoq, qarab ko''rmoq', 'しらべます - shirabemasu', 'インターネットで 電車の 時刻を 調べます。 (Internetda poyezd vaqtlarini tekshiraman.)', 'N5', 913),
  ('m1_914', 'deck_minna1', '直します', 'なおします', 'to''g''rilamoq, tuzatmoq', 'なおします - naoshimasu', '先生に 作文の 間違いを 直して もらいました。 (Ustozga inshodagi xatolarni to''g''rilattirib oldim.)', 'N5', 914),
  ('m1_915', 'deck_minna1', '修理します', 'しゅうりします', 'tuzatmoq, ta''mirlamoq', 'しゅうりします - shuurishimasu', '壊れた 時計を 時計屋で 修理しました。 (Buzilgan soatni ustaxonada tuzatdim.)', 'N5', 915),
  ('m1_916', 'deck_minna1', '電話します', 'でんわします', 'qo''ng''iroq qilmoq, telefon qilmoq', 'でんわします - denwashimasu', '夜 家族に 電話します。 (Kechasi oilamga telefon qilaman.)', 'N5', 916),
  ('m1_917', 'deck_minna1', '僕', 'ぼく', 'men (yigitlar erkin tilda)', 'ぼく - boku', '僕も いっしょに 行って いい？ (Men ham birga borsam maylimi?)', 'N5', 917),
  ('m1_918', 'deck_minna1', '君', 'きみ', 'sen (tengdoshlarga)', 'きみ - kimi', '君の 意見を 聞かせて ほしい。 (Sening fikringni eshitgim keladi.)', 'N5', 918),
  ('m1_919', 'deck_minna1', 'うん', 'うん', 'ha (og''zaki / erkin)', 'うん - un', 'あした 暇？― うん、暇だよ。 (Ertaga bo''shmisan? - Ha, bo''shman.)', 'N5', 919),
  ('m1_920', 'deck_minna1', 'ううん', 'ううん', 'yo''q (og''zaki / erkin)', 'ううん - uun', 'きのう 映画 見た？― ううん、見なかった。 (Kecha kino ko''rdingmi? - Yo''q, ko''rmadim.)', 'N5', 920),
  ('m1_921', 'deck_minna1', 'サラリーマン', 'サラリーマン', 'korxona xodimi', 'サラリーマン - sarari-man', '日本の サラリーマンは 朝 満員電車で 通勤します。 (Yaponiyada oylik maoshga ishlovchi xodimlar ertalab gavjum poyezdda qatnaydi.)', 'N5', 921),
  ('m1_922', 'deck_minna1', 'ことば', 'ことば', 'so''z, til', 'ことば - kotoba', '日本語の ことばを たくさん 覚えたいです。 (Yapon tilidagi so''zlarni ko''p yodlamoqchiman.)', 'N5', 922),
  ('m1_923', 'deck_minna1', '物価', 'ぶっか', 'narx-navo', 'ぶっか - buka', '東京は 家賃や 食料品の 物価が 高いです。 (Tokioda ijara haqi va oziq-ovqat narxlari qimmat.)', 'N5', 923),
  ('m1_924', 'deck_minna1', '着物', 'きもの', 'kimono (yapon milliy kiyimi)', 'きもの - kimono', 'お正月に 美しい 着物を 着ました。 (Yangi yilda go''zal kimono kiydim.)', 'N5', 924),
  ('m1_925', 'deck_minna1', 'ビザ', 'ビザ', 'viza', 'ビザ - biza', '大使館で 学生ビザを 申請しました。 (Elchixonada talabalik vizasiga ariza topshirdim.)', 'N5', 925),
  ('m1_926', 'deck_minna1', '初め', 'はじめ', 'boshi(da)', 'はじめ - hajime', '月の 初めに 家賃を 払います。 (Oyning boshida ijara haqini to''layman.)', 'N5', 926),
  ('m1_927', 'deck_minna1', '終わり', 'おわり', 'oxiri(da)', 'おわり - owari', '映画の 終わりに 主人公が 故郷へ 帰りました。 (Kino oxirida bosh qahramon vataniga qaytdi.)', 'N5', 927),
  ('m1_928', 'deck_minna1', 'こっち', 'こっち', 'bu taraf, bu yoq (og''zaki)', 'こっち - kochi', 'こっちへ 来て、いっしょに 座ろう。 (Bu yoqqa kel, birga o''tiraylik.)', 'N5', 928),
  ('m1_929', 'deck_minna1', 'そっち', 'そっち', 'u taraf, u yoq (og''zaki)', 'そっち - sochi', 'そっちの 方が 静かで 勉強しやすいよ。 (U taraf tinchroq, dars qilish qulay.)', 'N5', 929),
  ('m1_930', 'deck_minna1', 'あっち', 'あっち', 'ana u taraf (og''zaki)', 'あっち - achi', 'あっちに 新しい コンビニが できたよ。 (Ana u tomonda yangi do''kon ochildi.)', 'N5', 930),
  ('m1_931', 'deck_minna1', 'どっち', 'どっち', 'qaysi biri? (og''zaki)', 'どっち - dochi', 'リンゴと バナナ、どっちが 好き？ (Olma yoki banan, qaysi biri yoqadi?)', 'N5', 931),
  ('m1_932', 'deck_minna1', 'この間', 'このあいだ', 'yaqinda (vaqtga nisbatan), o''tgan safar', 'このあいだ - konoaida', 'この間、偶然 駅で 田中さんに 会ったよ。 (Yaqinda tasodifan bekatda Tanakani ko''rib qoldim.)', 'N5', 932),
  ('m1_933', 'deck_minna1', 'みんなで', 'みんなで', 'hammamiz birga', 'みんなで - minnade', '週末は みんなで 海へ バーベキューに 行こう。 (Dam olish kuni hammamiz dengizga barbekyuga boraylik.)', 'N5', 933),
  ('m1_934', 'deck_minna1', '～けど', '～けど', '~u / yu, ~. ; ~, lekin, ~.', '～けど - kedo', '日本語は 難しいけど、とても おもしろいよ。 (Yapon tili qiyin, lekin juda qiziqarli.)', 'N5', 934),
  ('m1_935', 'deck_minna1', '国へ帰るの？', 'くにへかえるの？', 'Yurtingga qaytasanmi? (og''zaki)', 'くにへかえるの？ - kuni e kaeru no?', '夏休みに 国へ 帰るの？ (Yozgi ta''tilda yurtingga qaytasanmi?)', 'N5', 935),
  ('m1_936', 'deck_minna1', 'どうするの？', 'どうするの？', 'Endi nima qilasan? (og''zaki)', 'どうするの？ - dousuruno', 'あした 雨が 降ったら、どうするの？ (Ertaga yomg''ir yog''sa nima qilasan?)', 'N5', 936),
  ('m1_937', 'deck_minna1', 'どうしようかな', 'どうしようかな。', 'Nima qilsam ekan-a? (o''ylanib qolish)', 'どうしようかな。 - doushiyoukana', '日曜日は 映画を 見ようか、どうしようかな。 (Yakshanba kuni kino ko''rsammikan, nima qilsam ekan-a.)', 'N5', 937),
  ('m1_938', 'deck_minna1', 'よかったら', 'よかったら', 'Mumkin bo''lsa~. Lozim topsangiz~.', 'よかったら - yokatara', 'よかったら、いっしょに お茶でも 飲まない？ (Malol kelmasa, birga choy ichmaymizmi?)', 'N5', 938),
  ('m1_939', 'deck_minna1', 'いろいろ', 'いろいろ', 'turli, har xil', 'いろいろ - iroiro', '日本で いろいろ お世話に なりました。 (Yaponiyada ko''p yordam ko''rsatdingiz.)', 'N5', 939),
  ('m1_940', 'deck_minna1', '思います', 'おもいます', 'o''ylamoq, fikrlamoq', 'おもいます - omoimasu', 'あしたは いい 天気に なると 思います。 (Ertaga ob-havo yaxshi bo''lsa kerak deb o''ylayman.)', 'N5', 940),
  ('m1_941', 'deck_minna1', '言います', 'いいます', 'demoq, aytmoq', 'いいます - iimasu', '田中さんは 「おめでとう」と 言いました。 (Janob Tanaka "tabriklayman" deb aytdi.)', 'N5', 941),
  ('m1_942', 'deck_minna1', '足ります', 'たります', 'yetmoq, yetarli bo''lmoq (ulush)', 'たります - tarimasu', '準備した お金で 十分 足りました。 (Tayyorlangan pul to''liq yetdi.)', 'N5', 942),
  ('m1_943', 'deck_minna1', '勝ちます', 'かちます', 'g''olib bo''lmoq, yutmoq', 'かちます - kachimasu', 'きのうの サッカーの 試合で 日本が 勝ちました。 (Kechagi futbol o''yinida Yaponiya g''olib bo''ldi.)', 'N5', 943),
  ('m1_944', 'deck_minna1', '負けます', 'まけます', 'mag''lub bo''lmoq, yutqazmoq', 'まけます - makemasu', '決勝戦で 負けて、とても 悔しかったです。 (Finalda yutqazib juda afsuslandim.)', 'N5', 944),
  ('m1_945', 'deck_minna1', 'お祭りがあります', 'おまつりがあります', 'bayram / festival bo''lmoq', 'おまつりがあります - omatsuri ga arimasu', '来週 私の 町で にぎやかな お祭りが あります。 (Kelasi hafta shahrimda gavjum bayram bo''ladi.)', 'N5', 945),
  ('m1_946', 'deck_minna1', '役に立ちます', 'やくにたちます', 'nafi tegmoq, foydasi bo''lmoq', 'やくにたちます - yakunitachimasu', '毎日 役に立ちます。 (Har kuni nafi tegmoq, foydasi bo''lmoq.)', 'N5', 946),
  ('m1_947', 'deck_minna1', 'むだな', 'むだ［な］', 'bekorchi, foydasiz', 'むだ［な］ - mudana', '使わない 電気は 消して、むだな エネルギーを 減らします。 (Ishlatilmayotgan chiroqni o''chirib, ortiqcha sarfni kamaytiraman.)', 'N5', 947),
  ('m1_948', 'deck_minna1', '不便な', 'ふべん［な］', 'noqulay (sharoit)', 'ふべん［な］ - fubenna', '駅から 遠いので、少し 不便です。 (Bekatdan uzoq, shuning uchun biroz noqulay.)', 'N5', 948),
  ('m1_949', 'deck_minna1', '同じ', 'おなじ', 'bir xil', 'おなじ - onaji', 'わたしと 田中さんは 同じ 誕生日の 日です。 (Men va Tanaka bir xil kunda tug''ilganmiz.)', 'N5', 949),
  ('m1_950', 'deck_minna1', 'すごい', 'すごい', 'ajoyib, zo''r, qoyilmaqom', 'すごい - sugoi', '日本語が とても 上手ですね。すごいです！ (Yapon tilida ajoyib gapirar ekansiz. Zo''r!)', 'N5', 950),
  ('m1_951', 'deck_minna1', '首相', 'しゅしょう', 'bosh vazir', 'しゅしょう - shushou', '日本の 首相が 新しい 政策を 発表しました。 (Yaponiya bosh vaziri yangi siyosatni e''lon qildi.)', 'N5', 951),
  ('m1_952', 'deck_minna1', '大統領', 'だいとうりょう', 'prezident', 'だいとうりょう - daitouryou', 'アメリカの 大統領が 日本を 訪問しました。 (AQSH prezidenti Yaponiyaga tashrif buyurdi.)', 'N5', 952),
  ('m1_953', 'deck_minna1', '政治', 'せいじ', 'siyosat', 'せいじ - seiji', '大学で 国際政治の 歴史を 勉強しています。 (Universitetda xalqaro siyosat tarixini o''rganyapman.)', 'N5', 953),
  ('m1_954', 'deck_minna1', 'ニュース', 'ニュース', 'yangilik', 'ニュース - ni-su', '毎晩 7時の ニュースを 見ます。 (Har oqshom soat 7 dagi yangiliklarni ko''raman.)', 'N5', 954),
  ('m1_955', 'deck_minna1', 'スピーチ', 'スピーチ', 'nutq （～をします： nutq so''zlamoq ）', 'スピーチ - supi-chi', '大勢の 前で 日本語の スピーチを しました。 (Ko''pchilik oldida yaponcha nutq so''zladim.)', 'N5', 955),
  ('m1_956', 'deck_minna1', '試合', 'しあい', 'musobaqa, o''yin, match', 'しあい - shiai', 'きのう サッカーの 試合を 見ました。 (Kecha futbol musobaqasini tomosha qildim.)', 'N5', 956),
  ('m1_957', 'deck_minna1', 'アルバイト', 'アルバイト', 'qo''shimcha ish （～をします： qo''shimcha ish qilmoq ）', 'アルバイト - arubaito', 'コンビニで 週に 3日 アルバイトを しています。 (Do''konda haftasiga 3 kun qo''shimcha ishda ishlayman.)', 'N5', 957),
  ('m1_958', 'deck_minna1', '意見', 'いけん', 'fikr', 'いけん - iken', '会議で 自分の 意見を はっきりと 言いました。 (Yig''ilishda o''z fikrimni aniq bayon qildim.)', 'N5', 958),
  ('m1_959', 'deck_minna1', 'お話', '［お］はなし', 'gap, suhbat, ertak', '［お］はなし - ohanashi', '先生の 面白い お話を 聞きました。 (Ustozning qiziqarli suhbatlarini tingladim.)', 'N5', 959),
  ('m1_960', 'deck_minna1', 'ユーモア', 'ユーモア', 'hajv, yumor', 'ユーモア - yu-moa', 'ミラー先生は ユーモアが あって、授業が 楽しいです。 (Janob Miller yumor hissiga ega, darslari qiziq.)', 'N5', 960)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('m1_961', 'deck_minna1', 'むだ', 'むだ', 'befoyda (narsa), bekorchi (narsa)', 'むだ - muda', '時間を むだに 使わないで ください。 (Vaqtni behuda sarflamang.)', 'N5', 961),
  ('m1_962', 'deck_minna1', 'デザイン', 'デザイン', 'dizayn', 'デザイン - dezain', 'この 車は 新しい デザインで かっこいいです。 (Bu mashina yangi dizaynga ega, chiroyli.)', 'N5', 962),
  ('m1_963', 'deck_minna1', '交通', 'こうつう', 'transport qatnovi', 'こうつう - koutsuu', '東京は 電車や 地下鉄の 交通が とても 発達しています。 (Tokioda poyezd va metro transport tizimi juda rivojlangan.)', 'N5', 963),
  ('m1_964', 'deck_minna1', 'ラッシュ', 'ラッシュ', 'tiqilinch transport qatnovi', 'ラッシュ - rashu', '朝の 通勤ラッシュは 電車が とても 混みます。 (Ertalabki tirbandlik payti poyezdlar juda to''la bo''ladi.)', 'N5', 964),
  ('m1_965', 'deck_minna1', '最近', 'さいきん', 'shu kunlarda', 'さいきん - saikin', '最近 日本語の 本を たくさん 読んでいます。 (Yaqinda yaponcha kitoblarni ko''p o''qiyapman.)', 'N5', 965),
  ('m1_966', 'deck_minna1', 'たぶん', 'たぶん', 'balki', 'たぶん - tabun', 'あしたは たぶん 雨が 降るでしょう。 (Ertaga balki yomg''ir yog''sa kerak.)', 'N5', 966),
  ('m1_967', 'deck_minna1', 'きっと', 'きっと', 'shubhasiz', 'きっと - kito', '一生懸命 勉強すれば、きっと 合格できますよ。 (Astoydil o''qisangiz, shubhasiz o''ta olasiz.)', 'N5', 967),
  ('m1_968', 'deck_minna1', 'ほんとうに', 'ほんとうに', 'haqiqatan', 'ほんとうに - hontouni', '日本の 新幹線は ほんとうに 速くて 便利です。 (Yaponiyaning Shinkansen poyezdi haqiqatan ham tez va qulay.)', 'N5', 968),
  ('m1_969', 'deck_minna1', 'そんなに', 'そんなに', 'unchalik', 'そんなに - sonnani', 'きょうは そんなに 寒くありません。 (Bugun unchalik ham sovuq emas.)', 'N5', 969),
  ('m1_970', 'deck_minna1', '～について', '～について', '~ haqida', '～について - nitsuite', '日本の 文化について レポートを 書きました。 (Yaponiya madaniyati haqida hisobot yozdim.)', 'N5', 970),
  ('m1_971', 'deck_minna1', 'しかたがありません', 'しかたがありません。', 'Iloj qancha / Na iloj', 'しかたがありません。 - shikatagaarimasen', '雨が 降ってきたから、ピクニックは 中止です。しかたがありません。 (Yomg''ir boshlandi, sayr bekor qilindi. Na iloj.)', 'N5', 971),
  ('m1_972', 'deck_minna1', 'しばらくですね', 'しばらくですね。', 'Ko''rishmaganimizga ancha bo''ldi-ya', 'しばらくですね。 - shibarakudesune', 'あ、田中さん！しばらくですね。お元気でしたか。 (A, janob Tanaka! Ko''rishmaganimizga ancha bo''ldi-ya. Yaxshimisiz?)', 'N5', 972),
  ('m1_973', 'deck_minna1', '～でも飲みませんか', '～でものみませんか', '~mi ichmaymizmi?', '～でものみませんか - ~ demo nomimasen ka', '仕事の 帰りに ビールでも 飲みませんか。 (Ishdan qaytishda pivo ichmaymizmi?)', 'N5', 973),
  ('m1_974', 'deck_minna1', '見ないと……', 'みないと……', 'Ko''rmasam bo''lmaydi...', 'みないと…… - minai to...', 'あしたの サッカーの 試合、見ないと･････。 (Ertangi futbol o''yinini ko''rmasam bo''lmaydi...)', 'N5', 974),
  ('m1_975', 'deck_minna1', 'もちろん', 'もちろん', 'albatta', 'もちろん - mochiron', 'パーティーに 来てくれますか。― もちろん 行きます！ (Bazmga kelasizmi? - Albatta boraman!)', 'N5', 975),
  ('m1_976', 'deck_minna1', 'カンガルー', 'カンガルー', 'kenguru', 'カンガルー - kangaru-', 'オーストラリアの 動物園で カンガルーを 見ました。 (Avstraliya hayvonot bog''ida kenguruni ko''rdim.)', 'N5', 976),
  ('m1_977', 'deck_minna1', 'キャプテン・クック', 'キャプテン･クック', 'Kapitan Djeyms Kuk (1728-1779)', 'キャプテン･クック - kyaputenkuku', 'キャプテン・クックは 有名な イギリスの 探検家です。 (Kapitan Kuk mashhur ingliz sayyohi bo''lgan.)', 'N5', 977),
  ('m1_978', 'deck_minna1', '着ます', 'きます', 'kiymoq (beldan yuqoriga qo''llaniladi)', 'きます - kimasu', '友達が うちへ 来ました。 (Do''stim uyimga keldi.)', 'N5', 978),
  ('m1_979', 'deck_minna1', 'シャツを着ます', 'シャツをきます', 'ko''ylak kiymoq', 'シャツをきます - shatsu o kimasu', '毎朝 白い シャツを 着て 会社へ 行きます。 (Har ertalab oq ko''ylak kiyib ishga boraman.)', 'N5', 979),
  ('m1_980', 'deck_minna1', 'はきます', 'はきます', 'kiymoq (beldan pastda qo''llaniladi)', 'はきます - hakimasu', '新しい スニーカーを はいて 散歩に 出かけます。 (Yangi krossovka kiyib sayrga chiqaman.)', 'N5', 980),
  ('m1_981', 'deck_minna1', '靴を履きます', 'くつをはきます', 'poyafzal kiymoq', 'くつをはきます - kutsu o hakimasu', '玄関で 靴を 履いて 外へ 出ます。 (Dahlizda poyafzal kiyib tashqariga chiqaman.)', 'N5', 981),
  ('m1_982', 'deck_minna1', 'かぶります', 'かぶります', 'kiymoq (boshga qo''llaniladi)', 'かぶります - kaburimasu', '日差しが 強いので、白い 帽子を かぶります。 (Quyosh nuri o''tkir, oq kepka kiyib olaman.)', 'N5', 982),
  ('m1_983', 'deck_minna1', '帽子を被ります', 'ぼうしをかぶります', 'bosh kiyim kiymoq', 'ぼうしをかぶります - boushi o kaburimasu', '日差しが 強いので、帽子を 被ります。 (Quyosh nuri kuchli, bosh kiyim kiyib olaman.)', 'N5', 983),
  ('m1_984', 'deck_minna1', '眼鏡をかけます', 'めがねをかけます', 'ko''zoynak taqmoq', 'めがねをかけます - megane o kakemasu', '本を 読む とき、眼鏡を かけます。 (Kitob o''qiganda ko''zoynak taqaman.)', 'N5', 984),
  ('m1_985', 'deck_minna1', '生まれます', 'うまれます', 'tug''ilmoq, dunyoga kelmoq', 'うまれます - umaremasu', 'わたしは 1998年に ウズベキスタンで 生まれました。 (Men 1998-yilda O''zbekistonda tug''ilganman.)', 'N5', 985),
  ('m1_986', 'deck_minna1', 'コート', 'コート', 'palto', 'コート - ko-to', '冬は 寒いので、厚い コートが 必要です。 (Qish sovuq bo''lgani sababli qalin palto kerak.)', 'N5', 986),
  ('m1_987', 'deck_minna1', 'スーツ', 'スーツ', 'kostum-shim', 'スーツ - su-tsu', '就職活動のために 黒い スーツを 買いました。 (Ish qidirish uchun qora kostyum-shim sotib oldim.)', 'N5', 987),
  ('m1_988', 'deck_minna1', 'セーター', 'セーター', 'sviter', 'セーター - se-ta-', '母が 編んでくれた セーターは とても 暖かいです。 (Onam to''qib bergan sviter juda issiq.)', 'N5', 988),
  ('m1_989', 'deck_minna1', '帽子', 'ぼうし', 'bosh kiyim', 'ぼうし - boushi', '夏休みに 海で麦わら帽子を かぶりました。 (Yozgi ta''tilda dengizda somon shlyapa kiydim.)', 'N5', 989),
  ('m1_990', 'deck_minna1', '眼鏡', 'めがね', 'ko''zoynak', 'めがね - megane', '新しい おしゃれな 眼鏡を かけています。 (Yangi bejirim ko''zoynak taqib olgan.)', 'N5', 990),
  ('m1_991', 'deck_minna1', 'おめでとうございます', 'おめでとうございます。', 'Tabriklayman! / Qutlayman!', 'おめでとうございます。 - omedetougozaimasu', 'ご結婚 おめでとうございます！ (Turmush qurganingiz muborak bo''lsin!)', 'N5', 991),
  ('m1_992', 'deck_minna1', '家賃', 'やちん', 'uyning ijara haqi', 'やちん - yachin', '毎月 25日に アパートの 家賃を 銀行から 振り込みます。 (Har oyning 25-sanasida kvartira ijarasini bankdan o''tkazaman.)', 'N5', 992),
  ('m1_993', 'deck_minna1', 'うーん', 'うーん。', 'Hm... / O''ylab ko''rish kerak', 'うーん。 - u-n', 'うーん、少し 考えさせて ください。 (Hm, biroz o''ylab ko''rishimga izn bering.)', 'N5', 993),
  ('m1_994', 'deck_minna1', 'ダイニングキッチン', 'ダイニングキッチン', 'oshxona (dining kitchen)', 'ダイニングキッチン - dainingukicchin', 'この アパートは ダイニングキッチンが 広いです。 (Bu xonadonning oshxonasi keng.)', 'N5', 994),
  ('m1_995', 'deck_minna1', '和室', 'わしつ', 'yaponcha xona', 'わしつ - washitsu', '畳が 敷いてある 伝統的な 和室で 休みます。 (Tatami to''shalgan an''anaviy yapon xonasida dam olaman.)', 'N5', 995),
  ('m1_996', 'deck_minna1', '押し入れ', 'おしいれ', 'taxmon (yapon shkafi)', 'おしいれ - oshiire', '朝 起きたら、布団を 押し入れに しまいます。 (Ertalab uyg''ongach, ko''rpani taxmonga yig''ishtirib qo''yaman.)', 'N5', 996),
  ('m1_997', 'deck_minna1', '布団', 'ふとん', 'ko''rpa-to''shak', 'ふとん - futon', '畳の 上に 布団を 敷いて 寝ます。 (Tatamining ustiga ko''rpa-to''shak yozib uxlayman.)', 'N5', 997),
  ('m1_998', 'deck_minna1', 'アパート', 'アパート', 'xonadon (ko''p qavatli uyda)', 'アパート - apa-to', '大学の 近くの 静かな アパートに 住んでいます。 (Universitet yaqinidagi tinch kvartirada yashayman.)', 'N5', 998),
  ('m1_999', 'deck_minna1', 'パリ', 'パリ', 'Parij', 'パリ - pari', 'フランスの パリへ 美術館巡りに 行きたいです。 (Fransiyaning Parij shahriga muzeylarni tomosha qilgani borgim keladi.)', 'N5', 999),
  ('m1_1000', 'deck_minna1', '万里の長城', 'ばんりのちょうじょう', 'Buyuk Xitoy devori', 'ばんりのちょうじょう - banrinochoujou', '万里の長城は 宇宙からも 見える 有名な 遺跡です。 (Buyuk Xitoy devori kosmosdan ham ko''rinadigan mashhur yodgorlikdir.)', 'N5', 1000),
  ('m1_1001', 'deck_minna1', '余暇開発センター', 'よかかいはつセンター', 'insonlarning bo''sh vatqlari bo''yicha tadqiqot olib boruvchi markaz', 'よかかいはつセンター - yokakaihatsusenta-', '余暇開発センターの 調査結果を 読みました。 (Bo''sh vaqtni rivojlantirish markazi hisobotini o''qidim.)', 'N5', 1001),
  ('m1_1002', 'deck_minna1', 'レジャー白書', 'レジャーはくしょ', 'insonlarning bo''sh vaqtlarini qanday o''tkazishi haqidagi “oq kitob”', 'レジャーはくしょ - reji-hakusho', 'レジャー白書に よると、国内旅行が 増えています。 ("Hordiq oq kitobi"ga ko''ra, ichki sayohat ko''paymoqda.)', 'N5', 1002),
  ('m1_1003', 'deck_minna1', '先生に聞きます', 'せんせいにききます', 'o''qituvchidan so''ramoq', 'せんせいにききます - sensei ni kikimasu', 'わからない 漢字を 先生に 聞きました。 (Tushunmagan kanjimni o''qituvchimdan so''radim.)', 'N5', 1003),
  ('m1_1004', 'deck_minna1', '回します', 'まわします', 'aylantirmoq', 'まわします - mawashimasu', 'この つまみを 右へ 回すと、音が 大きく なります。 (Bu murvatni o''ngga bursangiz ovozi balandlashadi.)', 'N5', 1004),
  ('m1_1005', 'deck_minna1', '引きます', 'ひきます', 'tortmoq', 'ひきます - hikimasu', 'ドアの 取っ手を 手前に 引いて ください。 (Eshik tutqichini o''zingizga torting.)', 'N5', 1005),
  ('m1_1006', 'deck_minna1', '変えます', 'かえます', 'o''zgartirmoq', 'かえます - kaemasu', '来週の 会議の 時間を 変えたいです。 (Kelasi haftadagi yig''ilish vaqtini o''zgartirmoqchiman.)', 'N5', 1006),
  ('m1_1007', 'deck_minna1', '触ります', 'さわります', 'tegmoq', 'さわります - sawarimasu', '展示品に 手を 触らないで ください。 (Eksponatlarga qo''l tekkizmang.)', 'N5', 1007),
  ('m1_1008', 'deck_minna1', 'ドアに触ります', 'ドアにさわります', 'eshikka tegmoq', 'ドアにさわります - doa ni sawarimasu', 'ペンキを 塗ったばかりですから、ドアに 触らないで ください。 (Bo''yoq endi surtildi, eshikka tegmang.)', 'N5', 1008),
  ('m1_1009', 'deck_minna1', 'お釣りが出ます', 'おつりがでます', 'qaytim qaytmoq', 'おつりがでます - otsuri ga demasu', 'ボタンを 押すと、自動的にお釣りが 出ます。 (Tugmani bossangiz, avtomatik ravishda qaytim chiqadi.)', 'N5', 1009),
  ('m1_1010', 'deck_minna1', '動きます', 'うごきます', 'harakatlanmoq, yurmoq', 'うごきます - ugokimasu', 'この 時計は 電池が なくなったので、動きません。 (Bu soatning batareyasi tugagani sababli yurmayapti.)', 'N5', 1010),
  ('m1_1011', 'deck_minna1', '時計が動きます', 'とけいがうごきます', 'soat yurmoq', 'とけいがうごきます - tokei ga ugokimasu', '電池を 入れると、止まっていた 時計が 動きました。 (Batareya solsam, to''xtab qolgan soat yura boshladi.)', 'N5', 1011),
  ('m1_1012', 'deck_minna1', '歩きます', 'あるきます', 'piyoda yurmoq', 'あるきます - arukimasu', '健康のために 毎日 1万歩 歩きます。 (Salomatlik uchun har kuni 10 000 qadam piyoda yuraman.)', 'N5', 1012),
  ('m1_1013', 'deck_minna1', '道を歩きます', 'みちをあるきます', 'ko''chada yurmoq', 'みちをあるきます - michi o arukimasu', '朝の 新鮮な 空気を 吸いながら、道を 歩きます。 (Ertalabki toza havodan nafas olib ko''chada yuraman.)', 'N5', 1013),
  ('m1_1014', 'deck_minna1', '渡ります', 'わたります', 'o''tmoq; kesib o''tmoq', 'わたります - watarimasu', '青信号に なったら、横断歩道を 渡りましょう。 (Yashil chiroq yongach yo''lakdan o''taylik.)', 'N5', 1014),
  ('m1_1015', 'deck_minna1', '橋を渡ります', 'はしをわたります', 'ko''prikdan o''tmoq', 'はしをわたります - hashi o watarimasu', '大きな 川に かかっている 橋を 渡ります。 (Katta daryo ustiga qurilgan ko''prikdan o''taman.)', 'N5', 1015),
  ('m1_1016', 'deck_minna1', '気をつけます', 'きをつけます', 'ehtiyot bo''lmoq', 'きをつけます - kiotsukemasu', '道を 渡る とき、車に 気を つけて ください。 (Yo''ldan o''tayotganda mashinalardan ehtiyot bo''ling.)', 'N5', 1016),
  ('m1_1017', 'deck_minna1', '車に注意します', 'くるまにちゅういします', 'mashinadan ehtiyot bo''lmoq', 'くるまにちゅういします - kuruma ni chuui shimasu', '道を 渡る ときは、車に 注意して ください。 (Yo''ldan o''tayotganda mashinalardan ehtiyot bo''ling.)', 'N5', 1017),
  ('m1_1018', 'deck_minna1', '引っ越しします', 'ひっこしします', 'ko''chib o''tmoq', 'ひっこしします - hikoshishimasu', '会社の 近くの 静かな アパートへ 引っ越しします。 (Kompaniya yaqinidagi tinch xonadonga ko''chib o''taman.)', 'N5', 1018),
  ('m1_1019', 'deck_minna1', '電気屋', 'でんきや', 'elektr jihozlari do''koni', 'でんきや - denkiya', '電気屋で 新しい 電池を 買いました。 (Elektr do''konidan yangi batareyka sotib oldim.)', 'N5', 1019),
  ('m1_1020', 'deck_minna1', 'サイズ', 'サイズ', 'o''lcham, hajm', 'サイズ - saizu', 'この 靴は わたしの 足の サイズに ぴったりです。 (Bu poyafzal oyog''im o''lchamiga to''liq mos keladi.)', 'N5', 1020),
  ('m1_1021', 'deck_minna1', '音', 'おと', 'tovush', 'おと - oto', '隣の 部屋から ピアノの 美しい 音が 聞こえます。 (Qo''shni xonadan pianinoning yoqimli sadosi eshitilyapti.)', 'N5', 1021),
  ('m1_1022', 'deck_minna1', '機械', 'きかい', 'mashina, apparat, texnika', 'きかい - kikai', 'この 機械の 使い方を 教えてください。 (Bu mashina/texnikaning ishlatilishini o''rgating.)', 'N5', 1022),
  ('m1_1023', 'deck_minna1', 'つまみ', 'つまみ', 'murvat', 'つまみ - tsumami', 'ラジオの つまみを 回して、音量を 上げます。 (Radioning murvatini burab, ovozini balandlataman.)', 'N5', 1023),
  ('m1_1024', 'deck_minna1', '故障', 'こしょう', 'buzulish, nosozlik ( ～します : buzilmoq)', 'こしょう - koshou', '洗濯機が 故障したので、修理を 頼みました。 (Kir yuvish mashinasi buzilgani uchun usta chaqirdim.)', 'N5', 1024),
  ('m1_1025', 'deck_minna1', '道', 'みち', 'ko''cha, yo''l', 'みち - michi', 'この道を まっすぐ 100メートル 行くと、駅が あります。 (Bu ko''chadan to''g''riga 100 metr yursangiz, bekat chiqadi.)', 'N5', 1025),
  ('m1_1026', 'deck_minna1', '交差点', 'こうさてん', 'chorraha', 'こうさてん - kousaten', '次の 交差点を 左へ 曲がると、銀行が あります。 (Keyingi chorrahadan chapga burilsangiz bank bor.)', 'N5', 1026),
  ('m1_1027', 'deck_minna1', '信号', 'しんごう', 'svetofor', 'しんごう - shingou', 'あの 信号を 渡った ところに 郵便局が あります。 (Anavi svetofordan o''tgan joyda pochta bor.)', 'N5', 1027),
  ('m1_1028', 'deck_minna1', '角', 'かど', 'muyulish, burulish', 'かど - kado', '角の たばこ屋の 前で 友達を 待っています。 (Burilishdagi tamaki do''koni oldida do''stimni kutyapman.)', 'N5', 1028),
  ('m1_1029', 'deck_minna1', '橋', 'はし', 'ko''prik', 'はし - hashi', 'あの 赤い 橋を 渡って、向こうの 島へ 行きます。 (Anavi qizil ko''prikdan o''tib narigi orolga boramiz.)', 'N5', 1029),
  ('m1_1030', 'deck_minna1', '駐車場', 'ちゅうしゃじょう', 'avto ulovlar to''xtash joyi', 'ちゅうしゃじょう - chuushajou', 'スーパーの 駐車場は 無料で 利用できます。 (Supermarket avtoturargohidan bepul foydalanish mumkin.)', 'N5', 1030),
  ('m1_1031', 'deck_minna1', '～目', '～め', '~(i)nchi', '～め - me', '2つ目の 信号を 右へ 曲がって ください。 (Ikkinchi svetofordan o''ngga buriling.)', 'N5', 1031),
  ('m1_1032', 'deck_minna1', 'お正月', '［お］しょうがつ', 'Yangi yil bayrami', '［お］しょうがつ - oshougatsu', '日本では お正月に 家族みんなで おせち料理を 食べます。 (Yaponiyada Yangi yilda butun oila jam bo''lib Osechi taomini yeydi.)', 'N5', 1032),
  ('m1_1033', 'deck_minna1', 'ごちそうさまでした', 'ごちそうさまでした。', 'Taom uchun rahmat (ovqatdan so''ng)', 'ごちそうさまでした。 - gochisousamadeshita', 'とても おいしかったです。ごちそうさまでした！ (Juda mazali bo''libdi. Taom uchun tashakkur!)', 'N5', 1033),
  ('m1_1034', 'deck_minna1', '建物', 'たてもの', 'bino', 'たてもの - tatemono', 'あの 歴史的な 建物は 100年前に 建てられました。 (Anavi tarixiy bino 100 yil oldin qurilgan.)', 'N5', 1034),
  ('m1_1035', 'deck_minna1', '外国人登録証', 'がいこくじんとうろくしょう', 'chet ellik fuqaroning ro''yxatga olinganlik to''g''risidagi hujjati', 'がいこくじんとうろくしょう - gaikokujintourokushou', '市役所に 外国人登録証を 取りに 行きました。 (Shahar idorasiga chet ellik guvohnomasini olgani bordim.)', 'N5', 1035),
  ('m1_1036', 'deck_minna1', '聖徳太子', 'しょうとくたいし', 'Shahzoda Shotoku (574-622)', 'しょうとくたいし - shoutokutaishi', '聖徳太子は 日本の 歴史で 非常に 有名な 政治家です。 (Shahzoda Shotoku Yaponiya tarixida juda mashhur arbobdir.)', 'N5', 1036),
  ('m1_1037', 'deck_minna1', '法隆寺', 'ほうりゅうじ', 'Horyuji- Nara viloyatidagi ibodatxona. U Ⅶ asr boshida shahzoda Shotoku tomonidan qurdirilgan.', 'ほうりゅうじ - houryuuji', '奈良の 法隆寺は 世界最古の 木造建築です。 (Naradagi Horyuji dunyodagi eng qadimiy yog''och binodir.)', 'N5', 1037),
  ('m1_1038', 'deck_minna1', '元気茶', 'げんきちゃ', '“Genkichya” choy navi (o''ylab topilgan )', 'げんきちゃ - genkicha', '健康のために 毎日 元気茶を 飲んでいます。 (Salomatlik uchun har kuni Genkicha ichib yuraman.)', 'N5', 1038),
  ('m1_1039', 'deck_minna1', '本田駅', 'ほんだえき', '“Honda” bekati (o''ylab topilgan )', 'ほんだえき - hondaeki', '本田駅の 前に 新しい カフェが できました。 (Honda bekati oldida yangi qahvaxona ochildi.)', 'N5', 1039),
  ('m1_1040', 'deck_minna1', '図書館前', 'としょかんまえ', '“Toshokanmae” avtobus bekati', 'としょかんまえ - toshokanmae', '図書館前の バス停で 5番の バスに 乗ります。 (Kutubxona oldidagi bekatda 5-avtobusga chiqaman.)', 'N5', 1040),
  ('m1_1041', 'deck_minna1', 'くれます', 'くれます', 'bermoq (menga bermoq)', 'くれます - kuremasu', '誕生日に 友達が すてきな 本を くれました。 (Tug''ilgan kunimga do''stim ajoyib kitob sovg''a qildi.)', 'N5', 1041),
  ('m1_1042', 'deck_minna1', '連れて行きます', 'つれていきます', 'olib bormoq, ergashtirib bormoq', 'つれていきます - tsureteikimasu', '週末に 子どもを 遊園地へ 連れて 行きました。 (Dam olish kunida bolamni istirohat bog''iga olib bordim.)', 'N5', 1042),
  ('m1_1043', 'deck_minna1', '連れて来ます', 'つれてきます', 'olib kelmoq, ergashtirib kelmoq', 'つれてきます - tsuretekimasu', 'あしたの パーティーに 友達を 連れて 来て ください。 (Ertangi bazmga do''stingizni ergashtirib keling.)', 'N5', 1043),
  ('m1_1044', 'deck_minna1', '人を送ります', 'ひとをおくります', 'odamni kuzatib qo''ymoq / olib borib qo''ymoq', 'ひとをおくります - hito o okurimasu', '車で 友達を 駅まで 送って あげました。 (Mashinamda do''stimni bekatgacha kuzatib qo''ydim.)', 'N5', 1044),
  ('m1_1045', 'deck_minna1', '紹介します', 'しょうかいします', 'tanishtirmoq', 'しょうかいします - shoukaishimasu', '新しく 来た 留学生を クラスのみんなに 紹介しました。 (Yangi kelgan xorijiy talabani butun sinfga tanishtirdim.)', 'N5', 1045),
  ('m1_1046', 'deck_minna1', '案内します', 'あんないします', 'yo''l ko''rsatmoq; tanishtirmoq, ko''rsatmoq', 'あんないします - annaishimasu', '東京の 有名な 観光地を 案内して あげました。 (Tokioning mashhur diqqatga sazovor joylarini ko''rsatib aylantirdim.)', 'N5', 1046),
  ('m1_1047', 'deck_minna1', '説明します', 'せつめいします', 'tushuntirmoq, izoh bermoq', 'せつめいします - setsumeishimasu', '新しい ソフトの 使い方を わかりやすく 説明しました。 (Yangi dasturning ishlatilishini tushunarli qilib izohlab berdim.)', 'N5', 1047),
  ('m1_1048', 'deck_minna1', 'いれます', 'いれます', 'damlamoq; solmoq', 'いれます - iremasu', 'お客様に 香り高い 日本茶を いれました。 (Mehmonlarga xushbo''y yapon choyini damladim.)', 'N5', 1048),
  ('m1_1049', 'deck_minna1', 'コーヒーを淹れます', 'コーヒーをいれます', 'kofe damlamoq', 'コーヒーをいれます - koohii o iremasu', 'お客さんに 香りの いい コーヒーを 淹れました。 (Mehmonlarga xushbo''y kofe damlab berdim.)', 'N5', 1049),
  ('m1_1050', 'deck_minna1', 'おじいさん / おじいちゃん', 'ojiisan / ojiichan', 'buva / buvajon', 'ojiisan / ojiichan', 'おじいちゃんは 毎朝 庭の 盆栽に 水を やります。 (Buvajonim har ertalab hovlidagi bonzayga suv quyadilar.)', 'N5', 1050),
  ('m1_1051', 'deck_minna1', 'おばあさん / おばあちゃん', 'obaasan / obaachan', 'buvi / buvijon', 'obaasan / obaachan', 'おばあちゃんが おいしい 手作りお菓子を 作ってくれました。 (Buvijonim menga mazali qo''lda tayyorlangan shirinlik pishirib berdilar.)', 'N5', 1051),
  ('m1_1052', 'deck_minna1', '準備', 'じゅんび', 'tayyorgarlik （～をします： tayyorgarlik qilmoq ）', 'じゅんび - junbi', 'あしたの パーティーの 準備を みんなで 手伝いました。 (Ertangi bazm tayyorgarligiga hammamiz yordamlashdik.)', 'N5', 1052),
  ('m1_1053', 'deck_minna1', '意味', 'いみ', 'ma''no', 'いみ - imi', 'この 難しい 言葉の 意味を 辞書で 調べました。 (Ushbu murakkab so''zning ma''nosini lug''atdan qidirdim.)', 'N5', 1053),
  ('m1_1054', 'deck_minna1', 'お菓子', '［お］かし', 'shirinliklar, qandolat', '［お］かし - okashi', 'お茶と いっしょに 日本の 伝統的な お菓子を 食べました。 (Choy bilan birga Yaponiyaning an''anaviy shirinligini yedim.)', 'N5', 1054),
  ('m1_1055', 'deck_minna1', '全部', 'ぜんぶ', 'hammasi', 'ぜんぶ - zenbu', '宿題は もう 全部 終わりました。 (Vazifalarimning hammasi allaqachon tugadi.)', 'N5', 1055),
  ('m1_1056', 'deck_minna1', '自分で', 'じぶんで', 'o''zi(~m, ~ng)', 'じぶんで - jibunde', 'パソコンを 自分で 修理して みました。 (Kompyuterni o''zim mustaqil tuzatib ko''rdim.)', 'N5', 1056),
  ('m1_1057', 'deck_minna1', 'ほかに', 'ほかに', 'undan boshqa, boshqa', 'ほかに - hokani', 'ほかに 何か 質問は ありますか。 (Bundan tashqari yana biror savolingiz bormi?)', 'N5', 1057),
  ('m1_1058', 'deck_minna1', 'ワゴン車', 'ワゴンしゃ', 'mikroavtobus, orqa tomonida ham eshik o''rnatilgan yengil mashina', 'ワゴンしゃ - wagonsha', '大きな ワゴン車に 荷物を 積んで 旅行に 出かけました。 (Katta mikroavtobusga yuklarni ortib sayohatga jo''nadik.)', 'N5', 1058),
  ('m1_1059', 'deck_minna1', 'お弁当', 'おべんとう', '“Obento”- o''zi bilan olib keladigan ovqat', 'おべんとう - obentou', '母が 作ってくれた おいしい お弁当を 食べます。 (Onam tayyorlab bergan mazali bento tushligini yeyman.)', 'N5', 1059),
  ('m1_1060', 'deck_minna1', '母の日', 'ははのひ', 'Onalar kuni', 'ははのひ - hahanohi', '母の日に カーネーションの 花を プレゼントしました。 (Onalar kunida chinnigul sovg''a qildim.)', 'N5', 1060),
  ('m1_1061', 'deck_minna1', '考えます', 'かんがえます', 'fikrlamoq', 'かんがえます - kangaemasu', '将来の 夢について よく 考えます。 (Kelajakdagi orzularim haqida chuqur o''ylab ko''raman.)', 'N5', 1061),
  ('m1_1062', 'deck_minna1', '着きます', 'つきます', 'yetib bormoq / kelmoq, qo''nmoq', 'つきます - tsukimasu', '新幹線は 定刻に 京都駅に 着きました。 (Shinkansen poyezdi o''z vaqtida Kioto bekatiga yetib bordi.)', 'N5', 1062),
  ('m1_1063', 'deck_minna1', '駅に着きます', 'えきにつきます', 'bekatga yetib bormoq', 'えきにつきます - eki ni tsukimasu', '駅に 着いたら、すぐに 電話して ください。 (Bekatga yetib borgach darhol telefon qiling.)', 'N5', 1063),
  ('m1_1064', 'deck_minna1', '留学します', 'りゅうがくします', 'chet elda ta''lim olmoq', 'りゅうがくします - ryuugakushimasu', '来年 日本の 大学に 留学する 予定です。 (Kelasi yili Yaponiya universitetiga o''qishga borishni rejalashtiryapman.)', 'N5', 1064),
  ('m1_1065', 'deck_minna1', '年を取ります', 'としをとります', 'ulg''aymoq, keksaymoq', 'としをとります - toshi o torimasu', '年を 取っても、ずっと 学び続けたいです。 (Keksayganimda ham doimo o''rganishda davom etgim keladi.)', 'N5', 1065),
  ('m1_1066', 'deck_minna1', '田舎', 'いなか', 'qishloq', 'いなか - inaka', '空気が きれいで 静かな 田舎に 住みたいです。 (Havosi toza va sokin qishloqda yashagim keladi.)', 'N5', 1066),
  ('m1_1067', 'deck_minna1', '大使館', 'たいしかん', 'elchixona', 'たいしかん - taishikan', 'ビザの 手続きで 大使館へ 行きます。 (Viza ishlari bilan elchixonaga boraman.)', 'N5', 1067),
  ('m1_1068', 'deck_minna1', 'グループ', 'グループ', 'guruh', 'グループ - guru-pu', '授業で 4人の グループに 分かれて 討論しました。 (Darsda 4 kishilik guruhlarga bo''linib bahslashdik.)', 'N5', 1068),
  ('m1_1069', 'deck_minna1', 'チャンス', 'チャンス', 'imkoniyat', 'チャンス - chansu', '日本で 働く 絶好の チャンスを つかみました。 (Yaponiyada ishlash uchun ajoyib imkoniyatni qo''lga kiritdim.)', 'N5', 1069),
  ('m1_1070', 'deck_minna1', '億', 'おく', '( いち～ ) yuz million', 'おく - oku', '宝くじで 1億円が 当たったら、世界一周旅行を したいです。 (Lotereyada 100 million iyen yutsam, dunyo bo''ylab sayohat qilardim.)', 'N5', 1070),
  ('m1_1071', 'deck_minna1', 'もし～たら', 'もし～たら', 'agar (~sam, ~sang,~sa)', 'もし～たら - moshi tara', 'もし 時間が あったら、京都へ 行きたいです。 (Agar vaqtim bo''lsa, Kiotoga borgim keladi.)', 'N5', 1071),
  ('m1_1072', 'deck_minna1', 'いくら～ても', 'いくら～ても', 'qancha', 'いくら～ても - ikura temo', 'いくら 難しくても、あきらめずに 頑張ります。 (Qanchalik qiyin bo''lmasin, taslim bo''lmay harakat qilaman.)', 'N5', 1072),
  ('m1_1073', 'deck_minna1', '転勤', 'てんきん', 'boshqa shaharga / filialga ishga o''tish', 'てんきん - tenkin', '来月から 大阪本社へ 転勤することに なりました。 (Kelasi oydan Osaka bosh ofisiga ishga o''tadigan bo''ldim.)', 'N5', 1073),
  ('m1_1074', 'deck_minna1', 'こと', 'こと', 'ish, masala ( ～の こと ~ning masalasi)', 'こと - koto', '健康の ことについて いつも 気を つけています。 (Salomatlik masalasiga doimo e''tibor berib yuraman.)', 'N5', 1074),
  ('m1_1075', 'deck_minna1', '一杯飲みましょう', 'いっぱいのみましょう', 'Keling, bir qadah ichaylik', 'いっぱいのみましょう - ippainomimashou', '仕事が 終わったら、一杯 飲みましょう。 (Ish tugagach keling bir qadah ichamiz.)', 'N5', 1075),
  ('m1_1076', 'deck_minna1', 'いろいろお世話になりました', 'いろいろおせわになりました', 'Ko''rsatgan mehribonchiligingiz va yordamingiz uchun katta rahmat', 'いろいろおせわになりました - iroiro osewa ni narimashita', '日本での 1年間、いろいろ お世話に なりました。 (Yaponiyadagi bir yil davomida ko''rsatgan g''amxo''rligingiz uchun katta rahmat.)', 'N5', 1076),
  ('m1_1077', 'deck_minna1', '頑張ります', 'がんばります', 'harakat qilmoq, tirishmoq', 'がんばります - ganbarimasu', '日本語能力試験 N5 合格のために 頑張ります！ (JLPT N5 imtihonidan o''tish uchun astoydil harakat qilaman!)', 'N5', 1077),
  ('m1_1078', 'deck_minna1', 'どうぞお元気で', 'どうぞおげんきで', 'Doimo salomat bo''ling (uzoq xayrlashuv)', 'どうぞおげんきで - douzoogenkide', '国へ 帰られても、どうぞ お元気で。 (Yurtingizga qaytsangiz ham, doimo sog''-omon bo''ling.)', 'N5', 1078),
  ('n5m_1', 'deck_n5_master', '一', 'いち / ひとつ', 'Bir, 1 (One)', 'いち / ひとつ - Ichi / Hitotsu', '一日 (ついたち - Oyning birinchi kuni / bir kun)', 'N5', 1),
  ('n5m_2', 'deck_n5_master', '二', 'に / ふたつ', 'Ikki, 2 (Two)', 'に / ふたつ - Ni / Futatsu', '二月 (にがつ - Fevral oyi)', 'N5', 2)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('n5m_3', 'deck_n5_master', '三', 'さん / みっつ', 'Uch, 3 (Three)', 'さん / みっつ - San / Mittsu', '三日 (みっか - 3-kun / 3 kunlik)', 'N5', 3),
  ('n5m_4', 'deck_n5_master', '四', 'よん / し', 'To''rt, 4 (Four)', 'よん / し - Yon / Shi', '四月 (しがつ - Aprel oyi)', 'N5', 4),
  ('n5m_5', 'deck_n5_master', '五', 'ご / いつつ', 'Besh, 5 (Five)', 'ご / いつつ - Go / Itsutsu', '五人 (ごにん - Besh kishi)', 'N5', 5),
  ('n5m_6', 'deck_n5_master', '六', 'ろく / むっつ', 'Olti, 6 (Six)', 'ろく / むっつ - Roku / Muttsu', '六日 (むいか - 6-kun / olti kun)', 'N5', 6),
  ('n5m_7', 'deck_n5_master', '七', 'なな / しち', 'Yetti, 7 (Seven)', 'なな / しち - Nana / Shichi', '七夕 (たなばた - Tanabata festivali)', 'N5', 7),
  ('n5m_8', 'deck_n5_master', '八', 'はち / やっつ', 'Sakkiz, 8 (Eight)', 'はち / やっつ - Hachi / Yattsu', '八百屋 (やおや - Sabzavot do''koni)', 'N5', 8),
  ('n5m_9', 'deck_n5_master', '九', 'きゅう / く', 'To''qqiz, 9 (Nine)', 'きゅう / く - Kyuu / Ku', '九月 (くがつ - Sentabr oyi)', 'N5', 9),
  ('n5m_10', 'deck_n5_master', '十', 'じゅう / とお', 'O''n, 10 (Ten)', 'じゅう / とお - Juu / Too', '十日 (とおか - 10-kun / o''n kun)', 'N5', 10),
  ('n5m_11', 'deck_n5_master', '人', 'ひと', 'Odam, Shaxs (Person)', 'ひと - Hito', 'あの人は誰ですか (U odam kimsan?)', 'N5', 11),
  ('n5m_12', 'deck_n5_master', '名', 'な / めい', 'Ism, Nom, Obro'' (Name, Reputation)', 'な / めい - Na / Mei', '名前 (なまえ - Ism)', 'N5', 12),
  ('n5m_13', 'deck_n5_master', '方', 'かた / ほう', 'Tomon, shaxs, usul (Direction, person, way)
Onyomi: ホウ (hou)
Kunyomi: かた (kata)', 'かた / ほう - Kata / Hou', '新しい漢字の書き方を先生に教わりました。 (Yangi kanjining yozish usulini ustozdan o''rgandim.)', 'N5', 13),
  ('n5m_14', 'deck_n5_master', '本', 'ほん', 'Kitob (Book)', 'ほん - Hon', '本を読みます (Kitob o''qiyman)', 'N5', 14),
  ('n5m_15', 'deck_n5_master', '日', 'ひ', 'Quyosh, Kun (Sun, Day)', 'ひ - Hi', '日曜日 (Nichiyoubi - Yakshanba)', 'N5', 15),
  ('n5m_16', 'deck_n5_master', '何', 'なに / なん', 'Nima, Qanday (What)', 'なに / なん - Nani / Nan', '何時ですか (なんじですか - Soat necha?)', 'N5', 16),
  ('n5m_17', 'deck_n5_master', '大', 'おお・きい / だい', 'Katta, Ulkan (Big, Large)', 'おお・きい / だい - Oo-kii / Dai', '大学 (だいがく - Universitet)', 'N5', 17),
  ('n5m_18', 'deck_n5_master', '学', 'まなぶ', 'O''rganmoq, Ilm (Study)', 'まなぶ - Manabu', '学校 (Gakkou - Maktab)', 'N5', 18),
  ('n5m_19', 'deck_n5_master', '会', 'あ・う / かい', 'Uchrashmoq, Jamiyat (Meet, Society)', 'あ・う / かい - A-u / Kai', '会社 (かいしゃ - Kompaniya/Firma)', 'N5', 19),
  ('n5m_20', 'deck_n5_master', '社', 'しゃ / やしろ', 'Kompaniya, Jamiyat, Ziyoratgoh (Company, Shinto shrine)', 'しゃ / やしろ - Sha / Yashiro', '社員 (しゃいん - Kompaniya xodimi)', 'N5', 20),
  ('n5m_21', 'deck_n5_master', '先', 'さき', 'Oldin, Ilgarigi (Ahead)', 'さき - Saki', '先月 (Sengetsu - O''tgan oy)', 'N5', 21),
  ('n5m_22', 'deck_n5_master', '生', 'いきる', 'Yashamoq, Tug''ilish (Life)', 'いきる - Ikiru', '先生 (Sensei - O''qituvchi)', 'N5', 22),
  ('n5m_23', 'deck_n5_master', '行', 'い・く / こう', 'Bormoq, O''tkazmoq (To go, Conduct)', 'い・く / こう - I-ku / Kou', '銀行 (ぎんこう - Bank)', 'N5', 23),
  ('n5m_24', 'deck_n5_master', '来', 'く・る / らい', 'Kelmoq, Kelasi (To come, Next)', 'く・る / らい - Ku-ru / Rai', '来週 (らいしゅう - Kelasi hafta)', 'N5', 24),
  ('n5m_25', 'deck_n5_master', '自', 'じ / し', 'O''zi, Shaxsiy (Self, Oneself)', 'じ / し - Ji / Shi', '自転車 (じてんしゃ - Velosiped)', 'N5', 25),
  ('n5m_26', 'deck_n5_master', '車', 'くるま', 'Mashina (Car)', 'くるま - Kuruma', '電車 (Densha - Elektropoyezd)', 'N5', 26),
  ('n5m_27', 'deck_n5_master', '百', 'ひゃく', 'Yuz, 100 (Hundred)', 'ひゃく - Hyaku', '三百 (さんびゃく - Uch yuz)', 'N5', 27),
  ('n5m_28', 'deck_n5_master', '千', 'せん', 'Ming, 1000 (Thousand)', 'せん - Sen', '三千 (さんぜん - Uch ming)', 'N5', 28),
  ('n5m_29', 'deck_n5_master', '万', 'まん / ばん', 'O''n ming, 10,000 (Ten thousand)', 'まん / ばん - Man / Ban', '一万円 (いちまんえん - 10 ming yen)', 'N5', 29),
  ('n5m_30', 'deck_n5_master', '円', 'えん / まるい', 'Yen (yapon puli), Doira (Yen, Circle)', 'えん / まるい - En / Marui', '百円 (ひゃくえん - 100 yen)', 'N5', 30),
  ('n5m_31', 'deck_n5_master', '毎', 'まい', 'Har, Har bir (Every)', 'まい - Mai', '毎日 (まいにち - Har kuni)', 'N5', 31),
  ('n5m_32', 'deck_n5_master', '時', 'とき / じ', 'Vaqt, Soat (Time, Hour)', 'とき / じ - Toki / Ji', '一時 (いちじ - Soat 1 / bir soat)', 'N5', 32),
  ('n5m_33', 'deck_n5_master', '分', 'ふん / わかる', 'Daqiqa, Qism, Tushunmoq (Minute, Part, Understand)', 'ふん / わかる - Fun / Wakaru', '五分 (ごふん - 5 daqiqa)', 'N5', 33),
  ('n5m_34', 'deck_n5_master', '半', 'はん / なかば', 'Yarim, Yarmi (Half)', 'はん / なかば - Han / Nakaba', '九時半 (くじはん - To''qqiz yarim)', 'N5', 34),
  ('n5m_35', 'deck_n5_master', '国', 'くに / こく', 'Davlat, Mamlakat, Yurt (Country, Nation)', 'くに / こく - Kuni / Koku', '外国 (がいこく - Xorijiy davlat)', 'N5', 35),
  ('n5m_36', 'deck_n5_master', '月', 'つき', 'Oy (Moon, Month)', 'つき - Tsuki', '今月 (Kongetsu - Shu oy)', 'N5', 36),
  ('n5m_37', 'deck_n5_master', '火', 'ひ / か', 'Olov, Olovli (Fire)', 'ひ / か - Hi / Ka', '火曜日 (かようび - Seshanba)', 'N5', 37),
  ('n5m_38', 'deck_n5_master', '水', 'みず', 'Suv (Water)', 'みず - Mizu', '水を飲みます (Suv ichaman)', 'N5', 38),
  ('n5m_39', 'deck_n5_master', '木', 'き', 'Daraxt (Tree)', 'き - Ki', '大きな木 (Katta daraxt)', 'N5', 39),
  ('n5m_40', 'deck_n5_master', '金', 'かね', 'Pul, Oltin (Money, Gold)', 'かね - Kane', '金の 寺（金閣寺）が 建てられました。', 'N5', 40),
  ('n5m_41', 'deck_n5_master', '土', 'つち', 'Tuproq (Earth, Soil)', 'つち - Tsuchi', '土曜日 (Doyoubi - Shanba)', 'N5', 41),
  ('n5m_42', 'deck_n5_master', '書', 'か・く / しょ', 'Yozmoq, Kitob, Hujjat (To write, Book)', 'か・く / しょ - Ka-ku / Sho', '辞書 (じしょ - Lug''at)', 'N5', 42),
  ('n5m_43', 'deck_n5_master', '友', 'とも', 'Do''st (Friend)', 'とも - Tomo', '友達 (Tomodachi - Do''stlar)', 'N5', 43),
  ('n5m_44', 'deck_n5_master', '年', 'とし / ねん', 'Yil, Yosh (Year, Age)', 'とし / ねん - Toshi / Nen', '今年 (ことし - Bu yil)', 'N5', 44),
  ('n5m_45', 'deck_n5_master', '今', 'いま / こん', 'Hozir, Ayni dam (Now, Present)', 'いま / こん - Ima / Kon', '今日 (きょう - Bugun)', 'N5', 45),
  ('n5m_46', 'deck_n5_master', '週', 'しゅう', 'Hafta (Week)', 'しゅう - Shuu', '今週 (こんしゅう - Bu hafta)', 'N5', 46),
  ('n5m_47', 'deck_n5_master', '休', 'やす・む / きゅう', 'Dam olmoq, Tanaffus (To rest, Vacation)', 'やす・む / きゅう - Yasu-mu / Kyuu', '夏休み (なつやすみ - Yozgi tatil)', 'N5', 47),
  ('n5m_48', 'deck_n5_master', '前', 'まえ / ぜん', 'Old, Oldin, Ilgari (Before, Front)', 'まえ / ぜん - Mae / Zen', '午前 (ごぜん - Tushgacha / ertalab)', 'N5', 48),
  ('n5m_49', 'deck_n5_master', '午', 'ご', 'Tush, Peshin (Noon)', 'ご - Go', '午後 (ごご - Tushdan keyin / abeddan so''ng)', 'N5', 49),
  ('n5m_50', 'deck_n5_master', '後', 'うしろ / あと / ご', 'Orqa, Keyin, So''ng (Behind, After, Later)', 'うしろ / あと / ご - Ushiro / Ato / Go', '後で (あとで - Keyinroq)', 'N5', 50),
  ('n5m_51', 'deck_n5_master', '校', 'こう', 'Maktab, Ta''lim maskani (School)', 'こう - Kou', '高校 (こうこう - Yuqori maktab / Litsey)', 'N5', 51),
  ('n5m_52', 'deck_n5_master', '帰', 'かえ・る / き', 'Qaytmoq (Return)
Onyomi: キ (ki)
Kunyomi: かえ・る, かえ・す (kae-ru, kae-su)', 'かえ・る / き - Kae-ru / Ki', '帰国 (きこく - Vataniga qaytish)', 'N5', 52),
  ('n5m_53', 'deck_n5_master', '見', 'み・る / けん', 'Ko''rmoq, Qaramoq, Ko''rsatmoq (To see, Look)', 'み・る / けん - Mi-ru / Ken', '意見 (いけん - Fikr, mulohaza)', 'N5', 53),
  ('n5m_54', 'deck_n5_master', '聞', 'き・く / ぶん', 'Eshitmoq, Tinglamoq, So''ramoq (To hear, Listen, Ask)', 'き・く / ぶん - Ki-ku / Bun', '新聞 (しんぶん - Gazeta)', 'N5', 54),
  ('n5m_55', 'deck_n5_master', '読', 'よ・む / どく', 'O''qimoq (To read)', 'よ・む / どく - Yo-mu / Doku', '読書 (どくしょ - Kitobxonlik)', 'N5', 55),
  ('n5m_56', 'deck_n5_master', '食', 'た・べる / しょく', 'Yemoq, Taom, Oziq-ovqat (To eat, Food)', 'た・べる / しょく - Ta-beru / Shoku', '食事 (しょくじ - Taomlanish)', 'N5', 56),
  ('n5m_57', 'deck_n5_master', '飲', 'の・む / いん', 'Ichmoq, Ichimlik (To drink)', 'の・む / いん - No-mu / In', '飲み物 (のみもの - Ichimlik)', 'N5', 57),
  ('n5m_58', 'deck_n5_master', '買', 'か・う / ばい', 'Sotib olmoq, Xarid qilmoq (To buy)', 'か・う / ばい - Ka-u / Bai', '買い物 (かいもの - Xarid, bozorlik)', 'N5', 58),
  ('n5m_59', 'deck_n5_master', '山', 'やま', 'Tog'' (Mountain)', 'やま - Yama', '富士山 (Fujisan - Fuji tog''i)', 'N5', 59),
  ('n5m_60', 'deck_n5_master', '川', 'かわ', 'Daryo (River)', 'かわ - Kawa', 'きれいな川 (Toza daryo)', 'N5', 60),
  ('n5m_61', 'deck_n5_master', '子', 'こ', 'Bola (Child)', 'こ - Ko', '男の子 (Otoko no ko - O''g''il bola)', 'N5', 61),
  ('n5m_62', 'deck_n5_master', '女', 'おんな', 'Ayol (Woman)', 'おんな - Onna', '女の子 (Onna no ko - Qiz bola)', 'N5', 62),
  ('n5m_63', 'deck_n5_master', '私', 'わたし', 'Men, shaxsiy (I, private)
Onyomi: シ (shi)
Kunyomi: わたし, わたくし (watashi, watakushi)', 'わたし - Watashi', '本日の司会を務めさせていただきます私、田中でございます。 (Bugungi tadbir boshlovchisi bo''lgan kamina Tanaka bo''laman.)', 'N5', 63),
  ('n5m_64', 'deck_n5_master', '門', 'もん', 'Darvoza (Gate)
Onyomi: モン (mon)
Kunyomi: かど (kado)', 'もん - Mon', '校門 (こうもん (Koumon)) — Maktab darvozasi', 'N5', 64),
  ('n5m_65', 'deck_n5_master', '間', 'あいだ', 'Oraliq, orasi, vaqt oralig''i (Between, interval)
Turkum: Ot', 'あいだ - Aida', '私と彼の間に問題はありません。 (Men bilan uning o''rtasida hech qanday muammo yo''q.)', 'N5', 65),
  ('n5m_66', 'deck_n5_master', '母', 'はは / ぼ', 'Ona (Mother)', 'はは / ぼ - Haha / Bo', 'お母さん (おかあさん - Oyi / Ona)', 'N5', 66),
  ('n5m_67', 'deck_n5_master', '父', 'ちち / ふ', 'Ota (Father)', 'ちち / ふ - Chichi / Fu', 'お父さん (おとうさん - Dadam / Ota)', 'N5', 67),
  ('n5m_68', 'deck_n5_master', '物', 'もの / ぶつ', 'Narsa, buyum (Thing, object)
Onyomi: ブツ, モツ (butsu, motsu)
Kunyomi: もの (mono)', 'もの / ぶつ - Mono / Butsu', '大切な物をなくさないように引き出しにしまいます。 (Muhim narsani yo''qotib qo''ymaslik uchun tortmaga solib qo''yaman.)', 'N5', 68),
  ('n5m_69', 'deck_n5_master', '朝', 'あさ / ちょう', 'Tong, ertalab (Morning)
Onyomi: チョウ (chou)
Kunyomi: あさ (asa)', 'あさ / ちょう - Asa / Chou', '今朝 (けさ - Bugun ertalab)', 'N5', 69),
  ('n5m_70', 'deck_n5_master', '昼', 'ひる / ちゅう', 'Kunduz, tush (Noon, daytime)
Onyomi: チュウ (chuu)
Kunyomi: ひる (hiru)', 'ひる / ちゅう - Hiru / Chuu', '昼休みに同僚と一緒に近くの公園で弁当を食べました。 (Tushlik tanaffusida hamkasbim bilan yaqindagi parkda bento yedim.)', 'N5', 70),
  ('n5m_71', 'deck_n5_master', '夜', 'よる / や', 'Tun, kecha (Night)
Onyomi: ヤ (ya)
Kunyomi: よる, よ (yoru, yo)', 'よる / や - Yoru / Ya', '今夜 (こんや - Bugun kechasi)', 'N5', 71),
  ('n5m_72', 'deck_n5_master', '晩', 'ばん', 'Oqshom, kechqurun (Night, evening)
Onyomi: バン (ban)
Kunyomi: -', 'ばん - Ban', '今晩、家族と一緒に外食をする予定です。 (Bugun oqshom oilam bilan birga tashqarida ovqatlanmoqchimiz.)', 'N5', 72),
  ('n5m_73', 'deck_n5_master', '町', 'まち / ちょう', 'Shaharcha (Town)
Onyomi: チョウ (chou)
Kunyomi: まち (machi)', 'まち / ちょう - Machi / Chou', '私が生まれ育った町は自然が豊かで静かです。 (Men tug''ilib o''sgan shaharcha tabiati boy va sokindir.)', 'N5', 73),
  ('n5m_74', 'deck_n5_master', '白', 'しろ / しろい', 'Oq rang (White)', 'しろ / しろい - Shiro / Shiroi', '白い服 (しろいふく - Oq kiyim)', 'N5', 74),
  ('n5m_75', 'deck_n5_master', '赤', 'あか / あかい', 'Qizil (Red)
Onyomi: セキ, シャク (seki, shaku)
Kunyomi: あか, あか・い (aka, aka-i)', 'あか / あかい - Aka / Akai', '秋になると山全体の木々が美しい赤や黄色に染まります。 (Kuz kelganda butun tog'' daraxtlari ajoyib qizil va sariq rangga kiradi.)', 'N5', 75),
  ('n5m_76', 'deck_n5_master', '青', 'あお / あおい', 'Moviy, ko''k (Blue)
Onyomi: セイ, ショウ (sei, shou)
Kunyomi: あお, あお・い (ao, ao-i)', 'あお / あおい - Ao / Aoi', '信号が青に変わったら渡りましょう。 (Svetofor yashilga (moviyga) o''zgarganda o''taylik.)', 'N5', 76),
  ('n5m_77', 'deck_n5_master', '黒', 'くろ / くろい', 'Qora (Black)
Onyomi: コク (koku)
Kunyomi: くろ, くろ・い (kuro, kuro-i)', 'くろ / くろい - Kuro / Kuroi', '黒板 (こくばん - Doska / doskachasi)', 'N5', 77),
  ('n5m_78', 'deck_n5_master', '安', 'やす・い / あん', 'Arzon, Tinch (Cheap, Peaceful)', 'やす・い / あん - Yasu-i / An', '安い本 (やすいほん - Arzon kitob)', 'N5', 78),
  ('n5m_79', 'deck_n5_master', '高', 'たか・い / こう', 'Quantity, amount, volume, number, amount of money', 'たか・い / こう - Taka-i / Kou', '高校生 (こうこうせい - Yuqori sinf talabasi)', 'N5', 79),
  ('n5m_80', 'deck_n5_master', '小', 'ちい・さい / しょう', 'Kichik, Mayda (Small, Little)', 'ちい・さい / しょう - Chii-sai / Shou', '小学校 (しょうがっこう - Boshlang''ich maktab)', 'N5', 80),
  ('n5m_81', 'deck_n5_master', '男', 'おとこ / だん', 'Erkak, O''g''il (Man, Male)', 'おとこ / だん - Otoko / Dan', '男の子 (おとこのこ - O''g''il bola)', 'N5', 81),
  ('n5m_82', 'deck_n5_master', '上', 'うえ / じょう', 'Tepa, Ustida (Above, Up)', 'うえ / じょう - Ue / Jou', '上手 (じょうず - Mohir, usta)', 'N5', 82),
  ('n5m_83', 'deck_n5_master', '下', 'した / か', 'Past, Ostida (Below, Down)', 'した / か - Shita / Ka', '下手 (へた - Noo''quv, yomon)', 'N5', 83),
  ('n5m_84', 'deck_n5_master', '左', 'ひだり / さ', 'Chap tomon (Left)', 'ひだり / さ - Hidari / Sa', '左手 (ひだりて - Chap qo''l)', 'N5', 84),
  ('n5m_85', 'deck_n5_master', '右', 'みぎ / う / ゆう', 'O''ng tomon (Right)', 'みぎ / う / ゆう - Migi / U / Yuu', '右手 (みぎて - O''ng qo''l)', 'N5', 85),
  ('n5m_86', 'deck_n5_master', '中', 'なか / ちゅう', 'Ichida, O''rtasida (Middle, Inside)', 'なか / ちゅう - Naka / Chuu', '一日中 (いちにちじゅう - Kun bo''yi)', 'N5', 86),
  ('n5m_87', 'deck_n5_master', '近', 'ちか・い / きん', 'Yaqin (Near)
Onyomi: キン (kin)
Kunyomi: ちか・い (chika-i)', 'ちか・い / きん - Chika-i / Kin', '近くの店 (ちかくのみせ - Yaqin atrofdagi do''kon)', 'N5', 87),
  ('n5m_88', 'deck_n5_master', '魚', 'さかな / ぎょ', 'Baliq (Fish)', 'さかな / ぎょ - Sakana / Gyo', '魚料理 (さかなりょうり - Baliqli taom)', 'N5', 88),
  ('n5m_89', 'deck_n5_master', '手', 'て / しゅ', 'Qo''l (Hand)', 'て / しゅ - Te / Shu', '手紙 (てがみ - Xat, maktub)', 'N5', 89),
  ('n5m_90', 'deck_n5_master', '犬', 'いぬ / けん', 'It (Dog)
Onyomi: ケン (ken)
Kunyomi: いぬ (inu)', 'いぬ / けん - Inu / Ken', '子犬 (こいぬ - Kuchukcha)', 'N5', 90),
  ('n5m_91', 'deck_n5_master', '早', 'はや・い / そう', 'Erta, tez (Early, fast)
Onyomi: ソウ, サッ (sou, satsu)
Kunyomi: はや・い, はや・まる (haya-i, haya-maru)', 'はや・い / そう - Haya-i / Sou', '早起き (はやおき - Ertalab barvaqt uyg''onish)', 'N5', 91),
  ('n5m_92', 'deck_n5_master', '計', 'はか・る / けい', 'Reja, Hisoblamoq (Measure, Plan)', 'はか・る / けい - Haka-ru / Kei', '計画 (けいかく - Reja, plan)', 'N5', 92),
  ('n5m_93', 'deck_n5_master', '外', 'そと / がい', 'Tashqari, Tashqi (Outside)', 'そと / がい - Soto / Gai', '外国 (がいこく - Xorijiy davlat)', 'N5', 93),
  ('n5m_94', 'deck_n5_master', '兄', 'あに / けい', 'Aka (Older brother)
Onyomi: ケイ, キョウ (kei, kyou)
Kunyomi: あに (ani)', 'あに / けい - Ani / Kei', 'お兄さん (おにいさん - Aka (hurmatli))', 'N5', 94),
  ('n5m_95', 'deck_n5_master', '弟', 'おとうと / てい', 'Uka (Younger brother)
Onyomi: テイ, ダイ (tei, dai)
Kunyomi: おとうと (otouto)', 'おとうと / てい - Otouto / Tei', '弟 (おとうと (Otouto)) — Ukam', 'N5', 95),
  ('n5m_96', 'deck_n5_master', '姉', 'あね / し', 'Opa (Older sister)
Onyomi: シ (shi)
Kunyomi: あね (ane)', 'あね / し - Ane / Shi', '姉 (あね (Ane)) — Opam', 'N5', 96),
  ('n5m_97', 'deck_n5_master', '妹', 'いもうと / まい', 'Singil (Younger sister)
Onyomi: マイ (mai)
Kunyomi: いもうと (imouto)', 'いもうと / まい - Imouto / Mai', '妹 (いもうと (Imouto)) — Singlim', 'N5', 97),
  ('n5m_98', 'deck_n5_master', '家', 'いえ / か', 'Uy, oila (House, family)
Onyomi: カ, ケ (ka, ke)
Kunyomi: いえ, や (ie, ya)', 'いえ / か - Ie / Ka', '仕事が終わったらすぐに家に帰ります。 (Ish tugagach darhol uyga qaytaman.)', 'N5', 98),
  ('n5m_99', 'deck_n5_master', '族', 'ぞく', 'Oila, toifa (Family, tribe)
Onyomi: ゾク (zoku)
Kunyomi: -', 'ぞく - Zoku', '家族 (かぞく (Kazoku)) — Oila', 'N5', 99),
  ('n5m_100', 'deck_n5_master', '春', 'はる / しゅん', 'Bahor (Spring)
Onyomi: シュン (shun)
Kunyomi: はる (haru)', 'はる / しゅん - Haru / Shun', '春休み (はるやすみ - Bahorgi tatil)', 'N5', 100),
  ('n5m_101', 'deck_n5_master', '夏', 'なつ / か', 'Yoz (Summer)
Onyomi: カ, ゲ (ka, ge)
Kunyomi: なつ (natsu)', 'なつ / か - Natsu / Ka', '夏休み (なつやすみ - Yozgi tatil)', 'N5', 101),
  ('n5m_102', 'deck_n5_master', '秋', 'あき / しゅう', 'Kuz (Autumn)
Onyomi: シュウ (shuu)
Kunyomi: あき (aki)', 'あき / しゅう - Aki / Shuu', '秋風 (あきかぜ - Kuzgi shabada)', 'N5', 102),
  ('n5m_103', 'deck_n5_master', '冬', 'ふゆ / とう', 'Qish (Winter)
Onyomi: トウ (tou)
Kunyomi: ふゆ (fuyu)', 'ふゆ / とう - Fuyu / Tou', '冬休み (ふゆやすみ - Qishki tatil)', 'N5', 103),
  ('n5m_104', 'deck_n5_master', '気', 'き', 'Ruh, Kayfiyat, Havo (Spirit, Mood, Air)', 'き - Ki', '元気 (げんき - Tetik, sog''lom)', 'N5', 104),
  ('n5m_105', 'deck_n5_master', '天', 'てん', 'Osmon, Falak (Heaven, Sky)', 'てん - Ten', '天気 (てんき - Ob-havo)', 'N5', 105),
  ('n5m_106', 'deck_n5_master', '多', 'おお・い / た', 'Ko''p, Talaygina (Many, Much)', 'おお・い / た - Oo-i / Ta', '人が多い (ひとがおおい - Odam ko''p)', 'N5', 106),
  ('n5m_107', 'deck_n5_master', '少', 'すこ・し / すく・ない', 'Kam, Ozgina (Few, Little)', 'すこ・し / すく・ない - Suko-shi / Suku-nai', '少し (すこし - Bir oz)', 'N5', 107),
  ('n5m_108', 'deck_n5_master', '元', 'げん / もと', 'Asos, boshlang''ich, tetik (Origin, health)
Onyomi: ゲン, ガン (gen, gan)
Kunyomi: もと (moto)', 'げん / もと - Gen / Moto', '失敗は成功の元という言葉を信じて挑戦を続けた。 (''Xatolar muvaffaqiyatning kalitidir'' degan gapga ishonib intilishda davom etdim.)', 'N5', 108),
  ('n5m_109', 'deck_n5_master', '歩', 'ある・く / ほ', 'Yurmoq, qadam (Walk, step)
Onyomi: ホ, ブ (ho, bu)
Kunyomi: ある・く, あゆ・む (aru-ku, ayu-mu)', 'ある・く / ほ - Aru-ku / Ho', '歩く (あるく (Aruku)) — Piyoda yurmoq', 'N5', 109),
  ('n5m_110', 'deck_n5_master', '入', 'はい・る / にゅう', 'Kirmoq, Solmoq (Enter, Put in)', 'はい・る / にゅう - Hai-ru / Nyuu', '入口 (いりぐち - Kirish eshigi)', 'N5', 110),
  ('n5m_111', 'deck_n5_master', '出', 'で・る / しゅつ', 'Chiqmoq, Chiqarmoq (Exit, Leave)', 'で・る / しゅつ - De-ru / Shutsu', '出口 (でぐち - Chiqish eshigi)', 'N5', 111),
  ('n5m_112', 'deck_n5_master', '立', 'た・つ / りつ', 'Turmoq, Tik turmoq (Stand up)', 'た・つ / りつ - Ta-tsu / Ritsu', '立ち上がります (O''rnidan turmoq)', 'N5', 112),
  ('n5m_113', 'deck_n5_master', '止', 'と・まる / し', 'To''xtamoq (To stop)', 'と・まる / し - To-maru / Shi', '止まれ (とまれ - To''xtang!)', 'N5', 113),
  ('n5m_114', 'deck_n5_master', '始', 'はじ・まる / し', 'Boshlanmoq, boshlamoq (Begin, start)
Onyomi: シ (shi)
Kunyomi: はじ・まる, はじ・める (haji-maru, haji-meru)', 'はじ・まる / し - Haji-maru / Shi', '始まる (はじまる (Hajimaru)) — Boshlanmoq', 'N5', 114),
  ('n5m_115', 'deck_n5_master', '開', 'あ・ける / かい', 'Ochmoq, ochilmoq (Open)
Onyomi: カイ (kai)
Kunyomi: ひら・く, あ・く, あ・ける (hira-ku, a-ku, a-keru)', 'あ・ける / かい - A-keru / Kai', '開ける (あける (Akeru)) — Ochmoq', 'N5', 115),
  ('n5m_116', 'deck_n5_master', '海', 'うみ / かい', 'Dengiz (Sea)', 'うみ / かい - Umi / Kai', '海へ行きます (Dengizga boraman)', 'N5', 116),
  ('n5m_117', 'deck_n5_master', '世', 'せ / よ', 'Dunyo, zamon, avlod (World, generation)
Onyomi: セイ, セ (sei, se)
Kunyomi: よ (yo)', 'せ / よ - Se / Yo', '世界 (せかい (Sekai)) — Dunyo', 'N5', 117),
  ('n5m_118', 'deck_n5_master', '界', 'かい', 'Chegara, dunyo (World, boundary)
Onyomi: カイ (kai)
Kunyomi: -', 'かい - Kai', '世界中 (せかいじゅう - Butun dunyo)', 'N5', 118),
  ('n5m_119', 'deck_n5_master', '画', 'が / かく', 'Tasvir, reja, chiziq (Picture, plan, stroke)
Onyomi: ガ, カク (ga, kaku)
Kunyomi: -', 'が / かく - Ga / Kaku', '映画 (えいが (Eiga)) — Kino', 'N5', 119),
  ('n5m_120', 'deck_n5_master', '映', 'えい / うつす', 'Aks ettirmoq, proyeksiyalamoq (Reflect, project)
Onyomi: エイ (ei)
Kunyomi: うつ・る, うつ・す, は・える (utsu-ru, utsu-su, ha-eru)', 'えい / うつす - Ei / Utsusu', '映画 (えいが (Eiga)) — Film, kino', 'N5', 120),
  ('n5m_121', 'deck_n5_master', '花', 'はな / か', 'Gul (Flower)', 'はな / か - Hana / Ka', '花見 (はなみ - Gul tomoshasi)', 'N5', 121),
  ('n5m_122', 'deck_n5_master', '茶', 'ちゃ / さ', 'Choy (Tea)
Onyomi: チャ, サ (cha, sa)
Kunyomi: -', 'ちゃ / さ - Cha / Sa', '食事の後に温かいお茶を一杯飲みます。 (Ovqatdan so''ng bir chashka issiq choy ichaman.)', 'N5', 122)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
-- @@CHUNK@@
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('n5m_123', 'deck_n5_master', '語', 'ご / かたる', 'Til, So''z (Language, Word)', 'ご / かたる - Go / Kataru', '日本語 (にほんご - Yapon tili)', 'N5', 123),
  ('n5m_124', 'deck_n5_master', '英', 'えい', 'Ingliz, ajoyib (English, brilliant)
Onyomi: エイ (ei)
Kunyomi: -', 'えい - Ei', '英語 (えいご (Eigo)) — Ingliz tili', 'N5', 124),
  ('n5m_125', 'deck_n5_master', '体', 'からだ / たい', 'Tana, gavda (Body)
Onyomi: タイ, テイ (tai, tei)
Kunyomi: からだ (karada)', 'からだ / たい - Karada / Tai', '毎朝ジョギングをして体を鍛えています。 (Har tong yugurib, tanamni chiniqtiraman.)', 'N5', 125),
  ('n5m_126', 'deck_n5_master', '足', 'あし / そく', 'Oyoq, Yetarli bo''lmoq (Foot, Leg)', 'あし / そく - Ashi / Soku', '足が痛い (Oyoq og''riyapti)', 'N5', 126),
  ('n5m_127', 'deck_n5_master', '口', 'くち / こう', 'Og''iz (Mouth, Opening)', 'くち / こう - Kuchi / Kou', '入口 (いりぐち - Kirish joyi)', 'N5', 127),
  ('n5m_128', 'deck_n5_master', '顔', 'かお / がん', 'Yuz, chehra (Face)
Onyomi: ガン (gan)
Kunyomi: かお (kao)', 'かお / がん - Kao / Gan', '朝起きたら冷たい水で顔を洗います。 (Ertalab turgach sovuq suvda yuzimni yuvaman.)', 'N5', 128),
  ('n5m_129', 'deck_n5_master', '耳', 'みみ / じ', 'Quloq (Ear)', 'みみ / じ - Mimi / Ji', '耳が遠い (Qulog''i og''ir / yaxshi eshitmaydi)', 'N5', 129),
  ('n5m_130', 'deck_n5_master', '目', 'め / もく', 'Ko''z (Eye)', 'め / もく - Me / Moku', '目が痛い (Ko''zim og''riyapti)', 'N5', 130),
  ('n5m_131', 'deck_n5_master', '知', 'し・る / ち', 'Bilmoq (To know)', 'し・る / ち - Shi-ru / Chi', '知っています (Bilaman)', 'N5', 131),
  ('n5m_132', 'deck_n5_master', '住', 'す・む / じゅう', 'Yashamoq, Istiqomat qilmoq (To live)', 'す・む / じゅう - Su-mu / Juu', '東京に住んでいます (Tokioda yashayman)', 'N5', 132),
  ('n5m_133', 'deck_n5_master', '思', 'おも・う / し', 'O''ylamoq (To think)', 'おも・う / し - Omo-u / Shi', 'そう思います (Shunday deb o''ylayman)', 'N5', 133),
  ('n5m_134', 'deck_n5_master', '使', 'つか・う / し', 'Ishlatmoq, elchi (Use, messenger)
Onyomi: シ (shi)
Kunyomi: つか・う (tsuka-u)', 'つか・う / し - Tsuka-u / Shi', '使う (つかう (Tsukau)) — Ishlatmoq', 'N5', 134),
  ('n5m_135', 'deck_n5_master', '作', 'つく・る / さく', 'Yasamoq, tayyorlamoq (Make, create)
Onyomi: サク, サ (saku, sa)
Kunyomi: つく・る (tsuku-ru)', 'つく・る / さく - Tsuku-ru / Saku', '料理を作ります (Ovqat tayyorlayman)', 'N5', 135),
  ('n5m_136', 'deck_n5_master', '品', 'しな / ひん', 'Mahsulot, tovar (Goods, refinement)
Onyomi: ヒン (hin)
Kunyomi: しな (shina)', 'しな / ひん - Shina / Hin', '品物 (しなもの (Shinamono)) — Mahsulot', 'N5', 136),
  ('n5m_137', 'deck_n5_master', '長', 'なが・い / ちょう', 'Uzun, Rahbar (Long, Leader)', 'なが・い / ちょう - Naga-i / Chou', '髪が長い (Soch uzun)', 'N5', 137),
  ('n5m_138', 'deck_n5_master', '明', 'あか・るい / めい', 'Yorug'', ravshan (Bright, clear)
Onyomi: メイ, ミョウ (mei, myou)
Kunyomi: あか・るい, あき・らか (aka-rui, aki-raka)', 'あか・るい / めい - Aka-rui / Mei', '明るい (あかるい (Akarui)) — Yorug''', 'N5', 138),
  ('n5m_139', 'deck_n5_master', '肉', 'にく', 'Go''sht (Meat)
Onyomi: ニク (niku)
Kunyomi: -', 'にく - Niku', '牛肉 (ぎゅうにく (Gyuuniku)) — Mol go''shti', 'N5', 139),
  ('n5m_140', 'deck_n5_master', '問', 'とい / もん', 'Savol, so''ramoq (Question, ask)
Onyomi: モン (mon)
Kunyomi: と・う, と・い (to-u, to-i)', 'とい / もん - Toi / Mon', '質問 (しつもん (Shitsumon)) — Savol', 'N5', 140),
  ('n5m_141', 'deck_n5_master', '答', 'こた・え / とう', 'Javob bermoq (Answer)
Onyomi: トウ (tou)
Kunyomi: こた・える, こた・え (kota-eru, kota-e)', 'こた・え / とう - Kota-e / Tou', '答える (こたえる (Kotaeru)) — Javob bermoq', 'N5', 141),
  ('n5m_142', 'deck_n5_master', '心', 'こころ / しん', 'yurak, qalb, ko''ngil
Turkum: Ot', 'こころ / しん - Kokoro / Shin', '相手を思いやる温かい心を持つことが大切だ。 (Boshqalarni tushunadigan iliq qalb egasi bo''lish muhimdir.)', 'N5', 142),
  ('n5m_143', 'deck_n5_master', '配', 'くば・る / はい', 'Tarqatmoq, Xavotir (Distribute)', 'くば・る / はい - Kuba-ru / Hai', '心配しないで (Xavotir olmang)', 'N5', 143),
  ('n5m_144', 'deck_n5_master', '売', 'う・る / ばい', 'Sotmoq (Sell)
Onyomi: バイ (bai)
Kunyomi: う・る, う・れる (u-ru, u-reru)', 'う・る / ばい - U-ru / Bai', '本を売ります (Kitob sotaman)', 'N5', 144),
  ('n5m_145', 'deck_n5_master', '場', 'ば / じょう', 'Joy, maydon (Place, location)
Onyomi: ジョウ (jou)
Kunyomi: ば (ba)', 'ば / じょう - Ba / Jou', '場所 (ばしょ (Basho)) — Joy', 'N5', 145),
  ('n5m_146', 'deck_n5_master', '字', 'じ', 'Harf, yozuv (Letter, character)
Onyomi: ジ (ji)
Kunyomi: あざ (aza)', 'じ - Ji', '漢字 (かんじ (Kanji)) — Kanji', 'N5', 146),
  ('n5m_147', 'deck_n5_master', '漢', 'かん', 'Xitoy (China, Han)
Onyomi: カン (kan)
Kunyomi: -', 'かん - Kan', '漢字を覚える (Kanjilarni eslab qolish)', 'N5', 147),
  ('n5m_148', 'deck_n5_master', '料', 'りょう', 'To''lov, xomashyo (Fee, ingredients)
Onyomi: リョウ (ryou)
Kunyomi: -', 'りょう - Ryou', '料理 (りょうり - Taom, pishirish)', 'N5', 148),
  ('n5m_149', 'deck_n5_master', '理', 'り', 'Mantiq, Sabab (Logic, Reason)', 'り - Ri', '理由 (りゆう - Sabab)', 'N5', 149),
  ('n5m_150', 'deck_n5_master', '主', 'おも / しゅ', 'Asosiy, xo''jayin (Main, master)
Onyomi: シュ, ス (shu, su)
Kunyomi: おも, ぬし (omo, nushi)', 'おも / しゅ - Omo / Shu', '主人 (しゅじん (Shujin)) — Xo''jayin, er', 'N5', 150),
  ('n5m_151', 'deck_n5_master', '着', 'き・る / つ・く / ちゃく', 'Kiymoq, yetib bormoq (Wear, arrive)
Onyomi: チャク, ジャク (chaku, jaku)
Kunyomi: き・る, つ・く (ki-ru, tsu-ku)', 'き・る / つ・く / ちゃく - Ki-ru / Tsu-ku / Chaku', '着る (きる (Kiru)) — Kiymoq', 'N5', 151),
  ('n5m_152', 'deck_n5_master', '新', 'あたら・しい / しん', 'Yangi (New)', 'あたら・しい / しん - Atara-shii / Shin', '新聞 (しんぶん - Gazeta)', 'N5', 152),
  ('n5m_153', 'deck_n5_master', '古', 'ふる・い / こ', 'Antiquity, ancient times', 'ふる・い / こ - Furu-i / Ko', '古い本 (Eski kitob)', 'N5', 153),
  ('n5m_154', 'deck_n5_master', '持', 'も・つ / じ', 'Ushlamoq, ega bo''lmoq (Hold, possess)
Onyomi: ジ (ji)
Kunyomi: も・つ, も・てる (mo-tsu, mo-teru)', 'も・つ / じ - Mo-tsu / Ji', 'お金を持っています (Yonimda pul bor)', 'N5', 154),
  ('n5m_155', 'deck_n5_master', '電', 'でん', 'Elektr (Electricity)', 'でん - Den', '電車 (でんしゃ - Poyezd)', 'N5', 155),
  ('n5m_156', 'deck_n5_master', '話', 'はな・す / わ', 'Gapirmoq, Suhbat (To talk, Story)', 'はな・す / わ - Hana-su / Wa', '日本語で話します (Yaponchada gapiraman)', 'N5', 156),
  ('n5m_157', 'deck_n5_master', '音', 'おと / おん', 'Tovush, ovoz (Sound)
Onyomi: オン, イン (on, in)
Kunyomi: おと, ね (oto, ne)', 'おと / おん - Oto / On', '外から不思議な音が聞こえます。 (Tashqaridan g''alati ovoz eshitilyapti.)', 'N5', 157),
  ('n5m_158', 'deck_n5_master', '楽', 'たの・しい / がく / らく', 'Qiziqarli, Rohatli (Fun, Music)', 'たの・しい / がく / らく - Tano-shii / Gaku / Raku', '楽しい旅行 (Qiziqarli sayohat)', 'N5', 158),
  ('n5m_159', 'deck_n5_master', '歌', 'うた / うた・う', 'Qo''shiq, kuylamoq (Song, sing)
Onyomi: カ (ka)
Kunyomi: うた, うた・う (uta, uta-u)', 'うた / うた・う - Uta / Uta-u', '日本の古い歌をカラオケで歌いました。 (Yaponiyaning eski qo''shig''ini karaokeda kuyladim.)', 'N5', 159),
  ('n5m_160', 'deck_n5_master', '度', 'ど / たび', 'Daraja, marta (Degree, time)
Onyomi: ド, ト (do, to)
Kunyomi: たび (tabi)', 'ど / たび - Do / Tabi', 'もう一度 (もういちど - Yana bir marta)', 'N5', 160),
  ('n5m_161', 'deck_n5_master', '教', 'おし・える / きょう', 'O''rgatmoq, ta''lim (Teach, religion)
Onyomi: キョウ (kyou)
Kunyomi: おし・える, おそ・わる (oshi-eru, oso-waru)', 'おし・える / きょう - Oshi-eru / Kyou', '教える (おしえる (Oshieru)) — O''rgatmoq', 'N5', 161),
  ('n5m_162', 'deck_n5_master', '習', 'なら・う / しゅう', 'O''rganmoq (To learn)', 'なら・う / しゅう - Nara-u / Shuu', '日本語を習います (Yapon tilini o''rganaman)', 'N5', 162),
  ('n5m_163', 'deck_n5_master', '貸', 'か・す / たい', 'Qarzga bermoq (Lend)
Onyomi: タイ (tai)
Kunyomi: か・す (ka-su)', 'か・す / たい - Ka-su / Tai', '本を貸してください (Kitob berib turing)', 'N5', 163),
  ('n5m_164', 'deck_n5_master', '借', 'か・りる / しゃく', 'Qarzga olmoq (Borrow)
Onyomi: シャク (shaku)
Kunyomi: か・りる (ka-riru)', 'か・りる / しゃく - Ka-riru / Shaku', '借りる (かりる (Kariru)) — Qarz olmoq', 'N5', 164),
  ('n5m_165', 'deck_n5_master', '送', 'おく・る / そう', 'Jo''natmoq (To send)', 'おく・る / そう - Oku-ru / Sou', '荷物を送ります (Yukni jo''nataman)', 'N5', 165),
  ('n5m_166', 'deck_n5_master', '強', 'つよ・い / きょう', 'Kuchli (Strong)
Onyomi: キョウ, ゴウ (kyou, gou)
Kunyomi: つよ・い, つよ・まる (tsuyo-i, tsuyo-maru)', 'つよ・い / きょう - Tsuyo-i / Kyou', '強い (つよい (Tsuyoi)) — Kuchli', 'N5', 166),
  ('n5m_167', 'deck_n5_master', '勉', 'べん', 'Tirishmoq, g''ayrat (Endeavor, strive)
Onyomi: ベン (ben)
Kunyomi: つと・める (tsuto-meru)', 'べん - Ben', '勉強 (べんきょう (Benkyou)) — O''qish, ta''lim', 'N5', 167),
  ('n5m_168', 'deck_n5_master', '旅', 'たび / りょ', 'Sayohat (Travel, trip)
Onyomi: リョ (ryo)
Kunyomi: たび (tabi)', 'たび / りょ - Tabi / Ryo', '一人で日本中を旅するのが夢です。 (Bir o''zim butun Yaponiya bo''ylab sayohat qilish orzuim.)', 'N5', 168),
  ('n5m_169', 'deck_n5_master', '室', 'しつ', 'Xona (Room)
Onyomi: シツ (shitsu)
Kunyomi: むろ (muro)', 'しつ - Shitsu', '教室 (きょうしつ (Kyoushitsu)) — Sinfxona', 'N5', 169),
  ('n5m_170', 'deck_n5_master', '登', 'のぼ・る / とう', 'Ko''tarilmoq, Chiqmoq (To climb)', 'のぼ・る / とう - Nobo-ru / Tou', '山に登ります (Tog''ga chiqaman)', 'N5', 170),
  ('n5m_171', 'deck_n5_master', '不', 'ふ / ぶ', 'Emas, inkor, no- (No-, not, non-)
Onyomi: フ, ブ (fu, bu)
Kunyomi: -', 'ふ / ぶ - Fu / Bu', '不便 (ふべん (Fuben)) — Noqulay', 'N5', 171),
  ('n5m_172', 'deck_n5_master', '同', 'おな・じ / どう', 'Bir xil, teng (Same)
Onyomi: ドウ (dou)
Kunyomi: おな・じ (ona-ji)', 'おな・じ / どう - Ona-ji / Dou', '同じ本 (O''xshash / bir xil kitob)', 'N5', 172),
  ('n5m_173', 'deck_n5_master', '言', 'い・う / げん', 'Aytmoq, Demoq (To say)', 'い・う / げん - I-u / Gen', '何と言いましたか (Nima dedingiz?)', 'N5', 173),
  ('n5m_174', 'deck_n5_master', '意', 'い', 'Ma''no, Fikr (Meaning, Intention)', 'い - I', '意味 (いみ - Ma''no)', 'N5', 174),
  ('n5m_175', 'deck_n5_master', '事', 'こと / じ', 'Ish, Masala (Thing, Matter)', 'こと / じ - Koto / Ji', '仕事 (しごと - Ish, xizmat)', 'N5', 175),
  ('n5m_176', 'deck_n5_master', '仕', 'し / つかえる', 'Xizmat qilmoq, ish (Serve, doing)
Onyomi: シ, ジ (shi, ji)
Kunyomi: つか・える (tsuka-eru)', 'し / つかえる - Shi / Tsukaeru', '仕事 (しごと (Shigoto)) — Ish, xizmat', 'N5', 176),
  ('n5m_177', 'deck_n5_master', '病', 'びょう', 'Kasallik (Illness, disease)
Onyomi: ビョウ, ヘイ (byou, hei)
Kunyomi: や・む, やまい (ya-mu, yamai)', 'びょう - Byou', '病気 (びょうき (Byouki)) — Kasallik', 'N5', 177),
  ('n5m_178', 'deck_n5_master', '院', 'いん', 'Muassasa, bino (Institution)
Onyomi: イン (in)
Kunyomi: -', 'いん - In', '病院 (びょういん (Byouin)) — Kasalxona', 'N5', 178),
  ('n5m_179', 'deck_n5_master', '医', 'い', 'Tibbiyot, davolash (Medicine, doctor)
Onyomi: イ (i)
Kunyomi: -', 'い - I', '医者 (いしゃ (Isha)) — Shifokor', 'N5', 179),
  ('n5m_180', 'deck_n5_master', '者', 'もの / しゃ', 'Kishi, odam (Person)
Onyomi: シャ (sha)
Kunyomi: もの (mono)', 'もの / しゃ - Mono / Sha', '医者 (いしゃ (Isha)) — Shifokor', 'N5', 180),
  ('n5m_181', 'deck_n5_master', '堂', 'どう', 'Zal, bino (Hall, shrine)
Onyomi: ドウ (dou)
Kunyomi: -', 'どう - Dou', '食堂 (しょくどう (Shokudou)) — Oshxona', 'N5', 181),
  ('n5m_182', 'deck_n5_master', '屋', 'や / おく', 'Tom, do''kon, xona (Roof, shop)
Onyomi: オク (oku)
Kunyomi: や (ya)', 'や / おく - Ya / Oku', '本屋 (ほんや - Kitob do''koni)', 'N5', 182),
  ('n5m_183', 'deck_n5_master', '用', 'よう', 'Foydalanmoq, vazifa (Use, business)
Onyomi: ヨウ (you)
Kunyomi: もち・いる (mochi-iru)', 'よう - You', '今日は急な用ができて早く帰らなければなりません。 (Bugun to''satdan shoshilinch yumush chiqib qolib, erta qaytishim kerak.)', 'N5', 183),
  ('n5m_184', 'deck_n5_master', '有', 'ゆう / ある', 'Bor, mavjud bo''lmoq (Have, exist)
Onyomi: ユウ, ウ (yuu, u)
Kunyomi: あ・る (a-ru)', 'ゆう / ある - Yuu / Aru', '有名 (ゆうめい (Yuumei)) — Mashhur', 'N5', 184),
  ('n5m_185', 'deck_n5_master', '店', 'みせ / てん', 'Do''kon (Shop, Store)', 'みせ / てん - Mise / Ten', '店員 (てんいん - Do''kon sotuvchisi)', 'N5', 185),
  ('n5m_186', 'deck_n5_master', '民', 'みん / たみ', 'Xalq, aholi (People, citizen)
Onyomi: ミン (min)
Kunyomi: たみ (tami)', 'みん / たみ - Min / Tami', '市民 (しみん (Shimin)) — Shahar aholisi', 'N5', 186),
  ('n5m_187', 'deck_n5_master', '正', 'ただ・しい / せい / しょう', 'To''g''ri, Aniq (Correct, Right)', 'ただ・しい / せい / しょう - Tada-shii / Sei / Shou', 'お正月 (おしょうがつ - Yangi yil bayrami)', 'N5', 187),
  ('n5m_188', 'deck_n5_master', '銀', 'ぎん', 'Kumush (Silver)
Onyomi: ギン (gin)
Kunyomi: -', 'ぎん - Gin', '銀行 (ぎんこう (Ginkou)) — Bank', 'N5', 188),
  ('n5m_189', 'deck_n5_master', '図', 'ず / と', 'Chizma, reja (Drawing, plan)
Onyomi: ズ, ト (zu, to)
Kunyomi: はか・る (haka-ru)', 'ず / と - Zu / To', 'わかりやすいように図を描いて説明してください。 (Tushunarli bo''lishi uchun chizma chizib tushuntirib bering.)', 'N5', 189),
  ('n5m_190', 'deck_n5_master', '館', 'かん', 'Katta bino, saroy (Building, mansion)
Onyomi: カン (kan)
Kunyomi: やかた (yakata)', 'かん - Kan', '図書館 (としょかん (Toshokan)) — Kutubxona', 'N5', 190),
  ('n5m_191', 'deck_n5_master', '道', 'みち / どう', 'Yo''l (Road, Way)', 'みち / どう - Michi / Dou', '道を歩きます (Yo''ldan yuraman)', 'N5', 191),
  ('n5m_192', 'deck_n5_master', '動', 'うご・く / どう', 'Qimirlamoq, harakatlanmoq (Move)
Onyomi: ドウ (dou)
Kunyomi: うご・く, うご・かす (ugo-ku, ugo-kasu)', 'うご・く / どう - Ugo-ku / Dou', '動く (うごく (Ugoku)) — Harakatlanmoq', 'N5', 192),
  ('n5m_193', 'deck_n5_master', '建', 'た・てる / けん', 'Qurmoq (To build)', 'た・てる / けん - Ta-teru / Ken', '建物 (たてもの - Bino, inshoot)', 'N5', 193),
  ('n5m_194', 'deck_n5_master', '特', 'とく', 'Maxsus, Alohida (Special)', 'とく - Toku', '特に (とくに - Ayniqsa)', 'N5', 194),
  ('n5m_195', 'deck_n5_master', '終', 'お・わる / しゅう', 'Tugamoq, tugatmoq (End, finish)
Onyomi: シュウ (shuu)
Kunyomi: お・わる, お・える (o-waru, o-eru)', 'お・わる / しゅう - O-waru / Shuu', '終わる (おわる (Owaru)) — Tugamoq', 'N5', 195),
  ('n5m_196', 'deck_n5_master', '駅', 'えき', 'Vokzal, Bekat (Station)', 'えき - Eki', '駅員 (えきいん - Bekat xodimi)', 'N5', 196),
  ('n5m_197', 'deck_n5_master', '写', 'うつ・す / しゃ', 'Nusxa olmoq, rasmga olmoq (Copy, photograph)
Onyomi: シャ (sha)
Kunyomi: うつ・す, うつ・る (utsu-su, utsu-ru)', 'うつ・す / しゃ - Utsu-su / Sha', '写真 (しゃしん (Shashin)) — Fotosurat', 'N5', 197),
  ('n5m_198', 'deck_n5_master', '真', 'ま / しん', 'Haqiqat, sof (True, reality)
Onyomi: シン (shin)
Kunyomi: ま, まこと (ma, makoto)', 'ま / しん - Ma / Shin', '写真 (しゃしん (Shashin)) — Fotosurat', 'N5', 198),
  ('n5m_199', 'deck_n5_master', '牛', 'うし / ぎゅう', 'Mol, sigir (Cow, beef)
Onyomi: ギュウ (gyuu)
Kunyomi: うし (ushi)', 'うし / ぎゅう - Ushi / Gyuu', '牛乳 (ぎゅうにゅう (Gyuunyuu)) — Sut', 'N5', 199),
  ('n5m_200', 'deck_n5_master', '員', 'いん', 'Xodim, a''zo (Member, employee)
Onyomi: イン (in)
Kunyomi: -', 'いん - In', '会社員 (かいしゃいん (Kaishain)) — Firma xodimi', 'N5', 200),
  ('n5m_201', 'deck_n5_master', '林', 'はやし / りん', 'O''rmoncha, daraxtzor (Grove, woods)
Onyomi: リン (rin)
Kunyomi: はやし (hayashi)', 'はやし / りん - Hayashi / Rin', '小林 (こばやし - Kobayashi (familiya))', 'N5', 201),
  ('n5m_202', 'deck_n5_master', '森', 'もり / しん', 'Katta o''rmon (Forest)
Onyomi: シン (shin)
Kunyomi: もり (mori)', 'もり / しん - Mori / Shin', '深い森の中には珍しい野生動物が生息しています。 (Qalin o''rmon ichida noyob yovvoyi hayvonlar yashaydi.)', 'N5', 202),
  ('n5m_203', 'deck_n5_master', '田', 'た / でん', 'Sholizor, dala (Rice field)
Onyomi: デン (den)
Kunyomi: た (ta)', 'た / でん - Ta / Den', '田んぼ (たんぼ (Tanbo)) — Sholizor', 'N5', 203),
  ('n5m_204', 'deck_n5_master', '考', 'かんが・える / こう', 'O''ylamoq, fikr yuritmoq (Think, consider)
Onyomi: コウ (kou)
Kunyomi: かんが・える (kanga-eru)', 'かんが・える / こう - Kanga-eru / Kou', 'よく考えます (Yaxshilab o''ylab ko''raman)', 'N5', 204),
  ('n5m_205', 'deck_n5_master', '規', 'き', 'Qoida, Mezon (Rule, Standard)', 'き - Ki', '規則 (きそく - Qoida)', 'N5', 205),
  ('n5m_206', 'deck_n5_master', '切', 'き・る / せつ', 'Kesmoq (Cut)
Onyomi: セツ, サイ (setsu, sai)
Kunyomi: き・る, き・れる (ki-ru, ki-reru)', 'き・る / せつ - Ki-ru / Setsu', '切る (きる (Kiru)) — Kesmoq', 'N5', 206),
  ('n5m_207', 'deck_n5_master', '試', 'ため・す / し', 'Sinab ko''rmoq (Try, test)
Onyomi: シ (shi)
Kunyomi: こころ・みる, ため・す (kokoro-miru, tame-su)', 'ため・す / し - Tame-su / Shi', '試合 (しあい (Shiai)) — Musobaqa', 'N5', 207),
  ('n5m_208', 'deck_n5_master', '験', 'けん', 'Sinov, tajriba (Test, verify)
Onyomi: ケン, ゲン (ken, gen)
Kunyomi: -', 'けん - Ken', '試験 (しけん (Shiken)) — Imtihon', 'N5', 208),
  ('n5m_209', 'deck_n5_master', '部', 'ぶ', 'Bo''lim, qism, xona (Section, department, part)
Onyomi: ブ (bu)
Kunyomi: -', 'ぶ - Bu', '全部 (ぜんぶ (Zenbu)) — Hammasi', 'N5', 209),
  ('n5m_210', 'deck_n5_master', '文', 'ぶん / もん', 'Matn, jumla, adabiyot (Sentence, literature)
Onyomi: ブン, モン (bun, mon)
Kunyomi: ふみ (fumi)', 'ぶん / もん - Bun / Mon', '作文 (さくぶん (Sakubun)) — Insho', 'N5', 210),
  ('n5m_211', 'deck_n5_master', '歳', 'さい', 'Yosh (Age, Years old)', 'さい - Sai', '二十歳 (はたち - Yigirma yosh)', 'N5', 211),
  ('n5m_212', 'deck_n5_master', '留', 'りゅう / とめる', 'Qolmoq, Chetda o''qimoq (To stay)', 'りゅう / とめる - Ryuu / Tomeru', '留学生 (りゅうがくせい - Chet ellik talaba)', 'N5', 212),
  ('n5m_213', 'deck_n5_master', '議', 'ぎ', 'Muhokama, Majlis (Discussion, Council)', 'ぎ - Gi', '会議 (かいぎ - Majlis, yig''ilish)', 'N5', 213),
  ('n5m_214', 'deck_n5_master', '散', 'さん / ちる', 'Tarqalmoq, Sayr (Scatter, Stroll)', 'さん / ちる - San / Chiru', '散歩 (さんぽ - Sayr qilish)', 'N5', 214),
  ('n5m_215', 'deck_n5_master', '浴', 'あ・びる / よく', 'Cho''milmoq, Dush qabul qilmoq (To bathe)', 'あ・びる / よく - A-biru / Yoku', 'シャワーを浴びます (Dush qabul qilaman)', 'N5', 215),
  ('n5m_216', 'deck_n5_master', '降', 'お・りる / ふ・る / こう', 'Yog''moq, tushmoq (Fall, get off)
Onyomi: コウ, ゴ (kou, go)
Kunyomi: ふ・る, お・りる (fu-ru, o-riru)', 'お・りる / ふ・る / こう - O-riru / Fu-ru / Kou', '電車を降ります (Poyezddan tushaman)', 'N5', 216),
  ('n5m_217', 'deck_n5_master', '階', 'かい', 'Qavat, Pog''ona (Storey, Floor)', 'かい - Kai', '階段 (かいだん - Zina, zinapoya)', 'N5', 217),
  ('n5m_218', 'deck_n5_master', '億', 'おく', 'Yuz million, 100,000,000 (Hundred million)', 'おく - Oku', '一億円 (いちおくえん - 100 million yen)', 'N5', 218),
  ('m2_1', 'deck_minna2', '見ます', 'みます', 'ko''rmoq, tekshirmoq, qarab chiqmoq', 'みます - mimasu', '先生に レポートを 見て いただきます。 (Ustozga hisobotimni tekshirtirib olaman.)', 'N4', 1),
  ('m2_2', 'deck_minna2', '探します', 'さがします', 'qidirmoq, izlamoq', 'さがします - sagashimasu', '鍵を 探して いるんです。 (Kalitimni qidirayotgan edim.)', 'N4', 2),
  ('m2_3', 'deck_minna2', '遅れます', 'おくれます', 'kechikmoq (vaqtga / darsga)', 'おくれます - okuremasu', '電車が 遅れたんです。 (Poyezd kechikkan edi-da.)', 'N4', 3),
  ('m2_4', 'deck_minna2', '間に合います', 'まにあいます', 'vaqtida ulgurmoq', 'まにあいます - maniaimasu', '会議の 時間に 間に合いました。 (Majlis vaqtiga ulgurdim.)', 'N4', 4),
  ('m2_5', 'deck_minna2', 'やります', 'やります', 'bermoq (kichiklarga, hayvonlarga, o''simliklarga)', 'やります - yarimasu', '犬に えさを やります。 (Itga yemish beraman.)', 'N4', 5),
  ('m2_6', 'deck_minna2', '拾います', 'ひろいます', 'terib olmoq, topib olmoq', 'ひろいます - hiroimasu', '道で 財布を 拾いました。 (Yo''lda hamyon topib oldim.)', 'N4', 6),
  ('m2_7', 'deck_minna2', '連絡します', 'れんらくします', 'xabar bermoq, bog''lanmoq', 'れんらくします - renrakushimasu', '先生に 連絡して ください。 (Ustozga xabar bering.)', 'N4', 7),
  ('m2_8', 'deck_minna2', '気分がいい', 'きぶんがいい', 'o''zini yaxshi his qilmoq, kayfiyat yaxshi', 'きぶんがいい - kibungaii', '今朝は とても 気分がいいです。 (Bugun ertalab o''zimni juda yaxshi his qilyapman.)', 'N4', 8),
  ('m2_9', 'deck_minna2', '気分が悪い', 'きぶんがわるい', 'mazasi bo''lmaslik, ko''ngil aynishi', 'きぶんがわるい - kibungawarui', '少し 気分が 悪いんです。 (Biroz mazam bo''lmayapti-da.)', 'N4', 9),
  ('m2_10', 'deck_minna2', '運動会', 'うんどうかい', 'sport musobaqasi bayrami', 'うんどうかい - undoukai', '明日は 学校の 運動会です。 (Ertaga maktabning sport bayrami.)', 'N4', 10),
  ('m2_11', 'deck_minna2', '場所', 'ばしょ', 'joy, o''rin', 'ばしょ - basho', '会議の 場所は どこですか。 (Majlis o''tkaziladigan joy qayerda?)', 'N4', 11),
  ('m2_12', 'deck_minna2', 'ボランティア', 'ボランティア', 'ko''ngilli, volontyor', 'ボランティア - borantea', '週末 ボランティアに 参加します。 (Dam olish kunlari ko''ngillilar safiga qo''shilaman.)', 'N4', 12),
  ('m2_13', 'deck_minna2', '財布', 'さいふ', 'hamyon', 'さいふ - saifu', '財布を 落として しまいました。 (Hamyonimni tushirib qo''ydim.)', 'N4', 13),
  ('m2_14', 'deck_minna2', 'ごみ', 'ごみ', 'chiqindi, axlat', 'ごみ - gomi', 'ごみは どこに 出したら いいですか。 (Chiqindini qayerga chiqarsam bo''ladi?)', 'N4', 14),
  ('m2_15', 'deck_minna2', '国会議事堂', 'こっかいぎじどう', 'Parlament binosi (Yaponiya)', 'こっかいぎじどう - kokaigijidou', '国会議事堂を 見学しました。 (Parlament binosini borib ko''rdim.)', 'N4', 15),
  ('m2_16', 'deck_minna2', '平日', 'へいじつ', 'ish kunlari (hafta o''rtasi)', 'へいじつ - heijitsu', '平日は 忙しいです。 (Ish kunlari bandman.)', 'N4', 16),
  ('m2_17', 'deck_minna2', '弁護士', 'べんごし', 'advokat, huquqshunos', 'べんごし - bengoshi', '弁護士に なる ために、法律を 勉強します。 (Advokat bo''lish uchun huquqni o''rganadi.)', 'N4', 17),
  ('m2_18', 'deck_minna2', 'いつでも', 'いつでも', 'har doim, istalgan vaqtda', 'いつでも - itsude', 'いつでも 電話して ください。 (Istalgan vaqtda qo''ng''iroq qiling.)', 'N4', 18),
  ('m2_19', 'deck_minna2', 'どこでも', 'どこでも', 'har qayerda, istalgan joyda', 'どこでも - dokode', 'コンビニは どこでも あります。 (Konbini do''konlari hamma joyda bor.)', 'N4', 19),
  ('m2_20', 'deck_minna2', 'だれでも', 'だれでも', 'har kim, istalgan odam', 'だれでも - darede', 'この 漢字は だれでも 読めます。 (Bu kanjini istalgan kishi o''qiy oladi.)', 'N4', 20),
  ('m2_21', 'deck_minna2', '何でも', 'なんでも', 'har narsa, hamma narsa', 'なんでも - nande', '何でも 食べられます。 (Har qanday narsani yey olaman.)', 'N4', 21),
  ('m2_22', 'deck_minna2', 'こんな〜', 'こんな〜', 'bunday, mana bunaqa', 'こんな〜 - konna', 'こんな カメラが 欲しいです。 (Mana shunaqa fotoapparat xohlayman.)', 'N4', 22),
  ('m2_23', 'deck_minna2', '燃えるごみ', 'もえるごみ', 'yonadigan chiqindi', 'もえるごみ - erugomi', '月曜日は 燃えるごみの 日です。 (Dushanba yonadigan chiqindi kuni.)', 'N4', 23),
  ('m2_24', 'deck_minna2', '置き場', 'おきば', 'qo''yish joyi', 'おきば - okiba', '自転車の 置き場は あそこです。 (Velosiped qo''yish joyi anavi yerda.)', 'N4', 24)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('m2_25', 'deck_minna2', 'お湯', 'おゆ', 'qaynoq suv', 'おゆ - oyu', 'お湯が 出ないんですが、見て いただけませんか。 (Issiq suv chiqmayapti, qarab bera olmaysizmi?)', 'N4', 25),
  ('m2_26', 'deck_minna2', 'ガス', 'がす', 'gaz', 'がす - gasu', 'ガス会社に 連絡してください。 (Gaz kompaniyasiga bog''laning.)', 'N4', 26),
  ('m2_27', 'deck_minna2', '都合がいい', 'つごうがいい', 'qulay (vaqt, holat)', 'つごうがいい - tsugougaii', '何曜日が ご都合が よろしいですか。 (Qaysi kun sizga qulay?)', 'N4', 27),
  ('m2_28', 'deck_minna2', '都合が悪い', 'つごうがわるい', 'noqulay (vaqt bo''lmaganda)', 'つごうがわるい - tsugougawarui', '今日は ちょっと 都合が 悪いんです。 (Bugun biroz noqulay edi-da.)', 'N4', 28),
  ('m2_29', 'deck_minna2', '直接', 'ちょくせつ', 'to''g''ridan-to''g''ri, bevosita', 'ちょくせつ - chokusetsu', '先生に 直接 聞いて ください。 (Ustozdan to''g''ridan-to''g''ri so''rang.)', 'N4', 29),
  ('m2_30', 'deck_minna2', '飼います', 'かいます', 'boqmoq, hayvon parvarishlamoq', 'かいます - kaimasu', '犬を 飼って います。 (It boqyapman.)', 'N4', 30),
  ('m2_31', 'deck_minna2', '走ります', 'はしります', 'yugurmoq, mashina yelmoq', 'はしります - hashirimasu', '道を 走ります。 (Yo''lda yuguradi.)', 'N4', 31),
  ('m2_32', 'deck_minna2', '見えます', 'みえます', 'ko''rinmoq (ko''zga o''z-o''zidan chalinmoq)', 'みえます - miemasu', '部屋から 富士山が 見えます。 (Xonadan Fudzi tog''i ko''rinadi.)', 'N4', 32),
  ('m2_33', 'deck_minna2', '聞こえます', 'きこえます', 'eshitilmoq (tovush quloqqa chalinmoq)', 'きこえます - kikoemasu', '波の 音が 聞こえます。 (To''lqin ovozi eshitilyapti.)', 'N4', 33),
  ('m2_34', 'deck_minna2', 'できます', 'できます', 'qurilmoq, tayyor bo''lmoq, uddalamoq', 'できます - dekimasu', '駅の 前に 大きい スーパーが できました。 (Bekat oldida katta supermarket qurildi.)', 'N4', 34),
  ('m2_35', 'deck_minna2', '開きます', 'ひらきます', 'ochilmoq (o''z-o''zidan, jidoshi)', 'ひらきます - hirakimasu', '日本語の 教室を 開きます。 (Yapon tili to''garagini ochadi.)', 'N4', 35),
  ('m2_36', 'deck_minna2', '心配', 'しんぱいな', 'xavotirli, tashvishli', 'しんぱいな - shinpaina', '無理を しない ほうが いいですよ。 (O''zingizni zo''riqtirmagan ma''qul.)', 'N4', 36),
  ('m2_37', 'deck_minna2', 'ペット', 'ペット', 'uy hayvoni', 'ペット - peto', 'マンションで ペットが 飼えますか。 (Ko''p qavatli uyda uy hayvoni boqsa bo''ladimi?)', 'N4', 37),
  ('m2_38', 'deck_minna2', '声', 'こえ', 'ovoz (tirik jonlarning ovozi)', 'こえ - koe', '鳥の 声が 聞こえます。 (Qushlarning ovozi eshitilyapti.)', 'N4', 38),
  ('m2_39', 'deck_minna2', '波', 'なみ', 'to''lqin', 'なみ - nami', '静かな 波ですね。 (Osoyishta to''lqinlar ekan.)', 'N4', 39),
  ('m2_40', 'deck_minna2', '花火', 'はなび', 'mushakbozlik, feyerverk', 'はなび - hanabi', '夏に 花火を 見に 行きます。 (Yozda mushakbozlik ko''rgani boraman.)', 'N4', 40),
  ('m2_41', 'deck_minna2', '道具', 'どうぐ', 'asbob, qurol, dastgoh', 'どうぐ - dougu', '便利な 道具ですね。 (Qulay asbob ekan.)', 'N4', 41),
  ('m2_42', 'deck_minna2', 'クリーニング', 'クリーニング', 'kimyoviy tozalash (ximchistka)', 'クリーニング - kuri-ningu', 'スーツを クリーニングに 出します。 (Kastyumni kimyoviy tozalashga beraman.)', 'N4', 42),
  ('m2_43', 'deck_minna2', 'マンション', 'マンション', 'zamonaviy ko''p xonadonli turar-joy', 'マンション - manshon', '新しい マンションに 引っ越しました。 (Yangi ko''p xonadonli uyga ko''chib o''tdim.)', 'N4', 43),
  ('m2_44', 'deck_minna2', '台所', 'だいどころ', 'oshxona', 'だいどころ - daidokoro', '台所を 掃除しました。 (Oshxonani tozaladim.)', 'N4', 44),
  ('m2_45', 'deck_minna2', '〜しか', '〜しか', 'faqatgina ...dan boshqa emas (inkor bilan)', '〜しか - shika', '千円しか ありません。 (Faqatgina 1000 yenim bor (boshqa yo''q).)', 'N4', 45),
  ('m2_46', 'deck_minna2', 'はっきり', 'はっきり', 'aniq-tiniq, yaqqol', 'はっきり - hakiri', '字が はっきり 見えます。 (Harflar aniq ko''rinyapti.)', 'N4', 46),
  ('m2_47', 'deck_minna2', '本棚', 'ほんだな', 'kitob javoni', 'ほんだな - hondana', '本棚を 自分で 作りました。 (Kitob javonini o''zim yasadim.)', 'N4', 47),
  ('m2_48', 'deck_minna2', 'ほとんど', 'ほとんど', 'deyarli, aksariyat', 'ほとんど - hotondo', '宿題は ほとんど 終わりました。 (Vazifa deyarli tugadi.)', 'N4', 48),
  ('m2_49', 'deck_minna2', '日曜大工', 'にちようだいく', 'dam olish kunidagi duradgorlik/uy ta''mirlash xobbisi', 'にちようだいく - nichiyoudaiku', '父の 趣味は 日曜大工です。 (Otamning xobbisi uy buyumlarini yasash.)', 'N4', 49),
  ('m2_50', 'deck_minna2', '夢', 'ゆめ', 'tush, orzu', 'ゆめ - yume', 'いつか 日本に 住むのが 夢です。 (Qachondir Yaponiyada yashash mening orzum.)', 'N4', 50),
  ('m2_51', 'deck_minna2', '不思議な', 'ふしぎな', 'ajoyib, g''alati, sirli', 'ふしぎな - fushigina', '不思議な ポケットですね。 (Ajoyib cho''ntak ekan-a.)', 'N4', 51),
  ('m2_52', 'deck_minna2', '自由に', 'じゆうに', 'erkin, bemalol', 'じゆうに - jiyuuni', '空を 自由に 飛びたいです。 (Osmonda erkin uchishni istayman.)', 'N4', 52),
  ('m2_53', 'deck_minna2', '飛びます', 'とびます', 'uchmoq', 'とびます - tobimasu', '鳥が 空を 飛んでいます。 (Qushlar osmonda uchyapti.)', 'N4', 53),
  ('m2_54', 'deck_minna2', '売れます', 'うれます', 'sotilmoq, xaridorgir bo''lmoq', 'うれます - uremasu', 'この パンは よく 売れます。 (Bu non juda yaxshi sotiladi.)', 'N4', 54),
  ('m2_55', 'deck_minna2', '踊ります', 'おどります', 'raqsqa tushmoq', 'おどります - odorimasu', '音楽に 合わせて 踊ります。 (Musiqaga moslab raqsga tushadi.)', 'N4', 55),
  ('m2_56', 'deck_minna2', 'かみます', 'かみます', 'chaynamoq, tishlamoq', 'かみます - kamimasu', 'ガムを かみながら 話しては いけません。 (Saqich chaynab gaplashish mumkin emas.)', 'N4', 56),
  ('m2_57', 'deck_minna2', '選びます', 'えらびます', 'tanlamoq, saralamoq', 'えらびます - erabimasu', '好きな 物を 選んで ください。 (Yoqtirgan narsangizni tanlang.)', 'N4', 57),
  ('m2_58', 'deck_minna2', '通います', 'かよいます', 'qatnamoq (maktabga, universitetga, ishga)', 'かよいます - kayoimasu', '大学に 通って います。 (Universitetga qatnayapman.)', 'N4', 58),
  ('m2_59', 'deck_minna2', 'メモします', 'メモします', 'qayd qilib bormoq, yozib olmoq', 'メモします - memoshimasu', '先生の 話を メモします。 (Ustozning gaplarini qayd qilib boradi.)', 'N4', 59),
  ('m2_60', 'deck_minna2', 'まじめ', 'まじめな', 'tartibli, tirishqoq, jiddiy', 'まじめな - majimena', '彼は とても まじめな 学生です。 (U juda tartibli talaba.)', 'N4', 60),
  ('m2_61', 'deck_minna2', '熱心', 'ねっしんな', 'g''ayratli, ixlosli, berilib ishlaydigan', 'ねっしんな - neshinna', '熱心に 勉強して います。 (Ixlos bilan o''rganyapti.)', 'N4', 61),
  ('m2_62', 'deck_minna2', '偉い', 'えらい', 'buyuk, hurmatga sazovor, qoyilmaqom', 'えらい - erai', '一人で やって 偉いですね。 (Bir o''zingiz uddalab, qoyilmaqomsiz-a!)', 'N4', 62),
  ('m2_63', 'deck_minna2', '経験', 'けいけん', 'tajriba', 'けいけん - keiken', '日本で いろいろな 経験を しました。 (Yaponiyada turli xil tajribalarni orttirdim.)', 'N4', 63),
  ('m2_64', 'deck_minna2', '力', 'ちから', 'kuch, quvvat, qobiliyat', 'ちから - chikara', '力を 出して ください。 (Kuchingizni to''plang.)', 'N4', 64),
  ('m2_65', 'deck_minna2', '人気', 'にんき', 'mashhurlik, obro''', 'にんき - ninki', 'この 歌手は 若い 人に 人気が あります。 (Bu xonanda yoshlar orasida juda mashhur.)', 'N4', 65),
  ('m2_66', 'deck_minna2', '値段', 'ねだん', 'narx, baho', 'ねだん - nedan', 'この 店は 値段が 安いです。 (Bu do''konning narxlari arzon.)', 'N4', 66),
  ('m2_67', 'deck_minna2', '給料', 'きゅうりょう', 'oylik maosh', 'きゅうりょう - kyuuryou', '毎日 残業しているのに、給料が 安いです。 (Har kuni ortiqcha ishlasam ham maoshim kam.)', 'N4', 67),
  ('m2_68', 'deck_minna2', 'それに', 'それに', 'bundan tashqari, ustiga-ustak', 'それに - soreni', '頭が 痛いです。それに 熱も あります。 (Boshim og''riyapti. Bundan tashqari, isitman ham bor.)', 'N4', 68),
  ('m2_69', 'deck_minna2', 'それで', 'それで', 'shu sababli, shuning uchun', 'それで - sorede', '雨が 降りました。それで 遅れました。 (Yomg''ir yog''di. Shu sababli kechikdim.)', 'N4', 69),
  ('m2_70', 'deck_minna2', '味', 'あじ', 'ta''m, maza', 'あじ - aji', 'この 料理は いい 味が します。 (Bu taomning mazasi juda yaxshi.)', 'N4', 70),
  ('m2_71', 'deck_minna2', 'におい', 'におい', 'hid', 'におい - nioi', 'いい においが しますね。 (Juda xushbo''y hid kelyapti-a.)', 'N4', 71),
  ('m2_72', 'deck_minna2', '品物', 'しなもの', 'tovar, mahsulot', 'しなもの - shinano', 'いい 品物を 安く 買いました。 (Yaxshi tovarni arzonga sotib oldim.)', 'N4', 72),
  ('m2_73', 'deck_minna2', 'ボーナス', 'ぼーなす', 'bonus, mukofot puli', 'ぼーなす - bo-nasu', '夏の ボーナスを もらいました。 (Yozgi bonusni oldim.)', 'N4', 73),
  ('m2_74', 'deck_minna2', '番組', 'ばんぐみ', 'ko''rsatuv, dastur', 'ばんぐみ - bangumi', '面白い 番組を 見ています。 (Qiziqarli ko''rsatuv ko''ryapman.)', 'N4', 74),
  ('m2_75', 'deck_minna2', '歌手', 'かしゅ', 'qo''shiqchi, xonanda', 'かしゅ - kashu', '彼女は 有名な 歌手です。 (U mashhur xonanda.)', 'N4', 75),
  ('m2_76', 'deck_minna2', '将来', 'しょうらい', 'kelajak', 'しょうらい - shourai', '将来 自分の 店を 持ちたいです。 (Kelajakda shaxsiy do''konim bo''lishini xohlayman.)', 'N4', 76),
  ('m2_77', 'deck_minna2', '閉まります', 'しまります', 'yopilmoq (o''z-o''zidan, jidoshi)', 'しまります - shimarimasu', '窓が 閉まって います。 (Deraza yopiq turibdi.)', 'N4', 77),
  ('m2_78', 'deck_minna2', 'つきます', 'つきます', 'yonmoq (chiroq, elektr)', 'つきます - tsukimasu', '電灯が ついて います。 (Chiroq yonib turibdi.)', 'N4', 78),
  ('m2_79', 'deck_minna2', '消えます', 'きえます', 'o''chmoq (chiroq, olov)', 'きえます - kiemasu', '火が 消えました。 (Olov o''chdi.)', 'N4', 79),
  ('m2_80', 'deck_minna2', '壊れます', 'こわれます', 'buzilmoq, ishdan chiqmoq', 'こわれます - kowaremasu', '時計が 壊れて います。 (Soat buzilib qolgan.)', 'N4', 80),
  ('m2_81', 'deck_minna2', '割れます', 'われます', 'sinmoq (shisha, idish)', 'われます - waremasu', 'コップが 割れて しまいました。 (Stakan sinib ketdi.)', 'N4', 81),
  ('m2_82', 'deck_minna2', '折れます', 'おれます', 'sinmoq, butoqlanmoq (daraxt, qalam)', 'おれます - oremasu', '木の 枝が 折れて います。 (Daraxt shoxi sinib qolgan.)', 'N4', 82),
  ('m2_83', 'deck_minna2', '破れます', 'やぶれます', 'yirtilmoq (qog''oz, kiyim)', 'やぶれます - yaburemasu', '袋が 破れて います。 (Xalta yirtilgan ekan.)', 'N4', 83),
  ('m2_84', 'deck_minna2', '汚れます', 'よごれます', 'kirlanmoq, bulg''anmoq', 'よごれます - yogoremasu', '服が 汚れて、恥ずかしかったです。 (Kiyimim kirlanib, xijolat bo''ldim.)', 'N4', 84),
  ('m2_85', 'deck_minna2', '止まります', 'とまります', 'to''xtamoq (transport, harakat)', 'とまります - tomarimasu', '車が 止まって います。 (Mashina to''xtab turibdi.)', 'N4', 85),
  ('m2_86', 'deck_minna2', '落とします', 'おとします', 'tushirib yubormoq, yo''qotmoq', 'おとします - otoshimasu', '鍵を 落として しまいました。 (Kalitni tushirib yo''qotib qo''ydim.)', 'N4', 86),
  ('m2_87', 'deck_minna2', '掛かります', 'かかります', 'qulflanmoq (qulf)', 'かかります - kakarimasu', '鍵が 掛かって います。 (Qulf qulflangan turibdi.)', 'N4', 87),
  ('m2_88', 'deck_minna2', '片づけます', 'かたづけます', 'yig''ishtirmoq, tartibga keltirmoq', 'かたづけます - katazukemasu', '部屋を 片づけました。 (Xonani yig''ishtirdim.)', 'N4', 88),
  ('m2_89', 'deck_minna2', 'お皿', 'おさら', 'tarelka, likopcha', 'おさら - osara', 'お皿を 洗います。 (Likopchalarni yuvadi.)', 'N4', 89),
  ('m2_90', 'deck_minna2', '書類', 'しょるい', 'hujjatlar', 'しょるい - shorui', '大切な 書類を 忘れました。 (Muhim hujjatlarni unutib qoldirdim.)', 'N4', 90),
  ('m2_91', 'deck_minna2', '忘れ物', 'わすれもの', 'unutilgan buyum', 'わすれもの - wasureno', '電車に 忘れ物を しました。 (Poyezdda buyumimni unutib qoldirdim.)', 'N4', 91),
  ('m2_92', 'deck_minna2', '取り替えます', 'とりかえます', 'almashtirmoq (boshqasiga)', 'とりかえます - torikaemasu', '電球を 取り替えます。 (Lampochkani almashtiraman.)', 'N4', 92),
  ('m2_93', 'deck_minna2', 'お茶碗', 'おちゃわん', 'piyola, kosa', 'おちゃわん - ochawan', 'お茶碗を 洗います。 (Piyolalarni yuvaman.)', 'N4', 93),
  ('m2_94', 'deck_minna2', 'コップ', 'こっぷ', 'stakan', 'こっぷ - kopu', 'コップが 汚れています。 (Stakan kirlanib qolibdi.)', 'N4', 94),
  ('m2_95', 'deck_minna2', 'ガラス', 'がらす', 'shisha', 'がらす - garasu', '窓の ガラスが 割れました。 (Deraza oynasi sindi.)', 'N4', 95),
  ('m2_96', 'deck_minna2', '袋', 'ふくろ', 'xalta, paket', 'ふくろ - fukuro', 'ごみ袋を 買って きます。 (Axlat xaltasi sotib kelaman.)', 'N4', 96),
  ('m2_97', 'deck_minna2', '交番', 'こうばん', 'politsiya maskani (koban)', 'こうばん - kouban', '交番に 届けました。 (Politsiya punktiga topshirdim.)', 'N4', 97),
  ('m2_98', 'deck_minna2', '駅員', 'えきいん', 'bekat navbatchisi/xodimi', 'えきいん - ekiin', '駅員に 落とし物を 聞きました。 (Bekat xodimidan yo''qolgan buyumni so''radim.)', 'N4', 98),
  ('m2_99', 'deck_minna2', 'はります', 'はります', 'yopishtirmoq (devorga, daftarga)', 'はります - harimasu', '壁に カレンダーが はって あります。 (Devorga taqvim yopishtirilgan turibdi.)', 'N4', 99),
  ('m2_100', 'deck_minna2', '掛けます', 'かけます', 'osmoq, ilmoq (palto, rasm)', 'かけます - kakemasu', '服を ハンガーに 掛けます。 (Kiyimni kiyim ilgichga iladi.)', 'N4', 100),
  ('m2_101', 'deck_minna2', '飾ります', 'かざります', 'bezatmoq, bezak qo''ymoq', 'かざります - kazarimasu', '部屋に 花を 飾ります。 (Xonaga gul qo''yib bezatadi.)', 'N4', 101),
  ('m2_102', 'deck_minna2', '並べます', 'ならべます', 'terib qo''ymoq, qatorlashtirmoq', 'ならべます - narabemasu', '机の 上に 本を 並べました。 (Stol ustiga kitoblarni qator qilib terib qo''ydi.)', 'N4', 102),
  ('m2_103', 'deck_minna2', '植えます', 'うえます', 'ekmoq (ko''chat, daraxt)', 'うえます - uemasu', '庭に 木を 植えます。 (Hovliga daraxt ekadi.)', 'N4', 103),
  ('m2_104', 'deck_minna2', '戻します', 'もどします', 'o''z joyiga qaytarib qo''ymoq', 'もどします - doshimasu', '使ったら、元の 所に 戻して ください。 (Ishlatganingizdan keyin o''z joyiga qaytarib qo''ying.)', 'N4', 104),
  ('m2_105', 'deck_minna2', 'まとめます', 'まとめます', 'jamlamoq, tartibga keltirmoq', 'まとめます - matomemasu', 'レポートを まとめます。 (Hisobotni jamlab xulosalaydi.)', 'N4', 105),
  ('m2_106', 'deck_minna2', 'しまいます', 'しまいます', 'joyiga solib qo''ymoq, saqlamoq', 'しまいます - shimaimasu', '引き出しに しまいます。 (Tortmaga solib qo''yadi.)', 'N4', 106),
  ('m2_107', 'deck_minna2', '決めます', 'きめます', 'qaror qilmoq, belgilamoq', 'きめます - kimemasu', '次の 旅行の 日を 決めました。 (Keyingi sayohat kunini belgiladim.)', 'N4', 107),
  ('m2_108', 'deck_minna2', '相談します', 'そうだんします', 'maslahatlashmoq', 'そうだんします - soudanshimasu', '先生と 相談します。 (Ustoz bilan maslahatlashadi.)', 'N4', 108),
  ('m2_109', 'deck_minna2', '予習します', 'よしゅうします', 'yangi darsni oldindan tayyorlanmoq', 'よしゅうします - yoshuushimasu', '明日の 漢字を 予習して おきます。 (Ertangi kanjilarni oldindan tayyorlanib qo''yaman.)', 'N4', 109),
  ('m2_110', 'deck_minna2', '復習します', 'ふくしゅうします', 'o''tilgan darsni takrorlamoq', 'ふくしゅうします - fukushuushimasu', '毎日 復習します。 (Har kuni takrorlaydi.)', 'N4', 110),
  ('m2_111', 'deck_minna2', 'そのままにします', 'そのままにします', 'o''z holicha qoldirmoq', 'そのままにします - sonomamanishimasu', '道具は そのままに して おいて ください。 (Asboblarni o''z holicha qoldirib turing.)', 'N4', 111),
  ('m2_112', 'deck_minna2', '予定', 'よてい', 'reja, jadval', 'よてい - yotei', '来週 出張する 予定です。 (Kelasi hafta xizmat safariga chiqish rejalashtirilgan.)', 'N4', 112),
  ('m2_113', 'deck_minna2', '非常袋', 'ひじょうぶくろ', 'favqulodda vaziyat sumkasi', 'ひじょうぶくろ - hijoubukuro', '非常袋を 準備して おきます。 (Favqulodda sumkani oldindan tayyorlab qo''yaman.)', 'N4', 113),
  ('m2_114', 'deck_minna2', 'カレンダー', 'かれんだー', 'taqvim, kalendar', 'かれんだー - karenda-', '壁に カレンダーが 掛けて あります。 (Devorga kalendar osib qo''yilgan.)', 'N4', 114),
  ('m2_115', 'deck_minna2', 'ポスター', 'ぽすたー', 'plakat, afisha', 'ぽすたー - posuta-', '案内の ポスターが はって あります。 (E''lon plakati yopishtirib qo''yilgan.)', 'N4', 115),
  ('m2_116', 'deck_minna2', '人形', 'にんぎょう', 'qo''g''irchoq', 'にんぎょう - ningyou', '棚に 人形が 飾って あります。 (Javonga qo''g''irchoq bezab qo''yilgan.)', 'N4', 116),
  ('m2_117', 'deck_minna2', '花瓶', 'かびん', 'vaza, guldon', 'かびん - kabin', 'テーブルの 上に 花瓶が 置いて あります。 (Stol ustiga guldon qo''yib qo''yilgan.)', 'N4', 117),
  ('m2_118', 'deck_minna2', '鏡', 'かがみ', 'oyna, ko''zgu', 'かがみ - kagami', '鏡を 拭いて おきます。 (Ko''zguni artib qo''yaman.)', 'N4', 118),
  ('m2_119', 'deck_minna2', '引き出し', 'ひきだし', 'g''aladon, tortma', 'ひきだし - hikidashi', 'パスポートは 引き出しに しまって あります。 (Pasport tortmaga solib qo''yilgan.)', 'N4', 119),
  ('m2_120', 'deck_minna2', '玄関', 'げんかん', 'dahliz, kirish joyi', 'げんかん - nkan', '玄関に 靴を 並べて おきます。 (Dahlizga poyafzallarni tartiblab qo''yaman.)', 'N4', 120),
  ('m2_121', 'deck_minna2', '廊下', 'ろうか', 'yo''lak, koridor', 'ろうか - rouka', '廊下を 走らないで ください。 (Yo''lakda yugurmang.)', 'N4', 121),
  ('m2_122', 'deck_minna2', '壁', 'かべ', 'devor', 'かべ - kabe', '壁に 絵を 掛けます。 (Devorga rasm osaman.)', 'N4', 122),
  ('m2_123', 'deck_minna2', '始まります', 'はじまります', 'boshlanmoq', 'はじまります - hajimarimasu', '式が 始まります。 (Marosim boshlanadi.)', 'N4', 123),
  ('m2_124', 'deck_minna2', '続けます', 'つづけます', 'davom ettirmoq', 'つづけます - tsuzukemasu', '勉強を 続けます。 (O''qishni davom ettiradi.)', 'N4', 124),
  ('m2_125', 'deck_minna2', '見つけます', 'みつけます', 'topmoq, izlab topmoq', 'みつけます - mitsukemasu', 'いい 仕事を 見つけました。 (Yaxshi ish topdim.)', 'N4', 125),
  ('m2_126', 'deck_minna2', '受けます', 'うけます', 'topshirmoq (imtihon)', 'うけます - ukemasu', 'JLPT 試験を 受けます。 (JLPT imtihonini topshiraman.)', 'N4', 126),
  ('m2_127', 'deck_minna2', '入学します', 'にゅうがくします', 'o''qishga kirmoq (universitetga)', 'にゅうがくします - nyuugakushimasu', '大学に 入学したいです。 (Universitetga kirishni xohlayman.)', 'N4', 127),
  ('m2_128', 'deck_minna2', '卒業します', 'そつぎょうします', 'o''qishni bitirmoq', 'そつぎょうします - sotsugyoushimasu', '来年 大学を 卒業します。 (Kelasi yil universitetni bitiraman.)', 'N4', 128),
  ('m2_129', 'deck_minna2', '出席します', 'しゅっせきします', 'qatnashmoq, hozir bo''lmoq', 'しゅっせきします - shusekishimasu', '結婚式に 出席します。 (To''yda qatnashaman.)', 'N4', 129),
  ('m2_130', 'deck_minna2', '連休', 'れんきゅう', 'ketma-ket dam olish kunlari', 'れんきゅう - renkyuu', '来週は 連休です。 (Keyingi hafta ketma-ket dam olish kunlari.)', 'N4', 130),
  ('m2_131', 'deck_minna2', '作文', 'さくぶん', 'insho, esse', 'さくぶん - sakubun', '日本語で 作文を 書きました。 (Yapon tilida insho yozdim.)', 'N4', 131),
  ('m2_132', 'deck_minna2', '結婚式', 'けっこんしき', 'to''y marosimi', 'けっこんしき - kekonshiki', '友だちの 結婚式に 行きます。 (Do''stimning to''yiga boraman.)', 'N4', 132),
  ('m2_133', 'deck_minna2', '本社', 'ほんしゃ', 'bosh ofis, bosh korxona', 'ほんしゃ - honsha', '東京の 本社で 働きます。 (Tokiodagi bosh ofisda ishlaydi.)', 'N4', 133),
  ('m2_134', 'deck_minna2', '支社', 'ししゃ', 'filial, bo''lim', 'ししゃ - shisha', '大阪の 支社に 行きます。 (Osakadagi filialga boradi.)', 'N4', 134),
  ('m2_135', 'deck_minna2', '大学院', 'だいがくいん', 'magistratura / doktorantura', 'だいがくいん - daigakuin', '大学院に 進学したいです。 (Magistraturada o''qimoqchiman.)', 'N4', 135),
  ('m2_136', 'deck_minna2', '案内します', 'あんないします', 'yo''l ko''rsatmoq, shaharni aylantirmoq', 'あんないします - annaishimasu', '東京を 案内する つもりです。 (Tokioni aylantirib tanishtirmoqchiman.)', 'N4', 136),
  ('m2_137', 'deck_minna2', '説明します', 'せつめいします', 'tushuntirmoq, izohlamoq', 'せつめいします - setsumeishimasu', '使い方を 説明しようと 思います。 (Foydalanish tartibini tushuntirmoqchiman.)', 'N4', 137),
  ('m2_138', 'deck_minna2', '映画館', 'えいがかん', 'kinoteatr', 'えいがかん - eigakan', '週末 映画館へ 行こうと 思っています。 (Dam olish kunlari kinoga bormoqchiman.)', 'N4', 138),
  ('m2_139', 'deck_minna2', '飛行機', 'ひこうき', 'samolyot', 'ひこうき - hikouki', '飛行機の 予約を しようと 思います。 (Samolyotga bron qilmoqchiman.)', 'N4', 139),
  ('m2_140', 'deck_minna2', '予約', 'よやく', 'bron, oldindan buyurtma', 'よやく - yoyaku', 'ホテルを 予約して あります。 (Mehmonxona band qilib qo''yilgan.)', 'N4', 140),
  ('m2_141', 'deck_minna2', '外国', 'がいこく', 'xorijiy davlat', 'がいこく - gaikoku', '将来 外国で 働く つもりです。 (Kelajakda xorijda ishlamoqchiman.)', 'N4', 141),
  ('m2_142', 'deck_minna2', '運動します', 'うんどうします', 'jismoniy mashq qilmoq', 'うんどうします - undoushimasu', '毎日 運動した ほうが いいです。 (Har kuni jismoniy mashq qilgan ma''qul.)', 'N4', 142),
  ('m2_143', 'deck_minna2', '成功します', 'せいこうします', 'muvaffaqiyat qozonmoq', 'せいこうします - seikoushimasu', '実験は 成功するでしょう。 (Tajriba muvaffaqiyatli chiqsa kerak.)', 'N4', 143),
  ('m2_144', 'deck_minna2', '失敗します', 'しっぱいします', 'muvaffaqiyatsizlikka uchramoq', 'しっぱいします - shipaishimasu', '試験に 失敗しました。 (Imtihondan yiqildim.)', 'N4', 144)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('m2_145', 'deck_minna2', '合格します', 'ごうかくします', 'imtihondan muvaffaqiyatli o''tmoq', 'ごうかくします - goukakushimasu', 'N4に 合格しました。 (N4 dan muvaffaqiyatli o''tdim.)', 'N4', 145),
  ('m2_146', 'deck_minna2', '晴れます', 'はれます', 'havo ochilmoq, musaffo bo''lmoq', 'はれます - haremasu', '明日は 晴れるでしょう。 (Ertaga havo ochiq bo''lsa kerak.)', 'N4', 146),
  ('m2_147', 'deck_minna2', '曇ります', 'くもります', 'havo bulut bo''lmoq', 'くもります - kurimasu', '午後から 曇るかもしれません。 (Tushdan keyin bulut bo''lishi ham mumkin.)', 'N4', 147),
  ('m2_148', 'deck_minna2', '治ります', 'なおります', 'tuzalmoq (kasallik)', 'なおります - naorimasu', '風邪が 治りました。 (Shamollashim tuzaldi.)', 'N4', 148),
  ('m2_149', 'deck_minna2', '冷やします', 'ひやします', 'muzlatmoq, sovitmoq', 'ひやします - hiyashimasu', '頭を 水で 冷やします。 (Boshni sovuq suv bilan sovitadi.)', 'N4', 149),
  ('m2_150', 'deck_minna2', '十分', 'じゅうぶんな', 'yetarli darajada', 'じゅうぶんな - juubunna', '時間は 十分 あります。 (Vaqt yetarlicha bor.)', 'N4', 150),
  ('m2_151', 'deck_minna2', 'やけど', 'やけど', 'kuyish (olovdan yoki issiqdan)', 'やけど - yakedo', '手に やけどを しました。 (Qo''limni kuydirib oldim.)', 'N4', 151),
  ('m2_152', 'deck_minna2', 'せき', 'せき', 'yo''tal', 'せき - seki', 'せきが 出ます。 (Yo''talyapman.)', 'N4', 152),
  ('m2_153', 'deck_minna2', 'インフルエンザ', 'インフルエンザ', 'gripp virusi', 'インフルエンザ - infuruenza', 'インフルエンザに かかりました。 (Grippga chalindim.)', 'N4', 153),
  ('m2_154', 'deck_minna2', '熱', 'ねつ', 'isitma, harorat', 'ねつ - netsu', '高い 熱が ありますから、病院へ 行った ほうが いいです。 (Isitmangiz baland ekan, shifoxonaga borganingiz ma''qul.)', 'N4', 154),
  ('m2_155', 'deck_minna2', '喉', 'のど', 'tomoq', 'のど - nodo', '喉が 痛いです。 (Tomog''im og''riyapti.)', 'N4', 155),
  ('m2_156', 'deck_minna2', '太陽', 'たいよう', 'quyosh', 'たいよう - taiyou', '太陽が 出て 暖かくなりました。 (Quyosh chiqib havo ilidi.)', 'N4', 156),
  ('m2_157', 'deck_minna2', '星', 'ほし', 'yulduz', 'ほし - hoshi', '今夜は 星が きれいに 見えます。 (Bugun tunda yulduzlar chiroyli ko''rinyapti.)', 'N4', 157),
  ('m2_158', 'deck_minna2', '夕方', 'ゆうがた', 'oqshom pallasi', 'ゆうがた - yuugata', '夕方から 雨が 降るでしょう。 (Oqshomdan yomg''ir yog''sa kerak.)', 'N4', 158),
  ('m2_159', 'deck_minna2', '水道', 'すいどう', 'suv quvuri, vodoprovod', 'すいどう - suidou', '水道の 水を 飲んでも いいですか。 (Jo''mrak suvidan ichsa bo''ladimi?)', 'N4', 159),
  ('m2_160', 'deck_minna2', '逃げます', 'にげます', 'qochmoq, juftakni rostlamoq', 'にげます - nimasu', '泥棒が 逃げました。 (O''g''ri qochib ketdi.)', 'N4', 160),
  ('m2_161', 'deck_minna2', '騒ぎます', 'さわぎます', 'shovqin ko''tarmoq, g''alva qilmoq', 'さわぎます - sawagimasu', '教室で 騒ぐな！ (Sinfda shovqin solma! (taqiq))', 'N4', 161),
  ('m2_162', 'deck_minna2', 'あきらめます', 'あきらめます', 'taslim bo''lmoq, umidni uzmoq', 'あきらめます - akiramemasu', '最後まで あきらめるな！ (Oxirigacha taslim bo''lma!)', 'N4', 162),
  ('m2_163', 'deck_minna2', '投げます', 'なげます', 'uloqtirmoq, tashlamoq', 'なげます - namasu', 'ボールを 投げろ！ (To''pni tashla! (buyruq))', 'N4', 163),
  ('m2_164', 'deck_minna2', '守ります', 'まもります', 'himoya qilmoq, qoidaga rioya qilmoq', 'まもります - marimasu', '時間と 規則を 守りなさい。 (Vaqt va qoidalarga rioya qiling.)', 'N4', 164),
  ('m2_165', 'deck_minna2', '伝えます', 'つたえます', 'yetkazmoq, aytib qo''ymoq', 'つたえます - tsutaemasu', '田中さんに 伝えて ください。 (Tanaka janoblariga yetkazib qo''ying.)', 'N4', 165),
  ('m2_166', 'deck_minna2', '注意します', 'ちゅういします', 'ehtiyot bo''lmoq, ogohlantirmoq', 'ちゅういします - chiuishimasu', '車に 注意して ください。 (Mashinadan ehtiyot bo''ling.)', 'N4', 166),
  ('m2_167', 'deck_minna2', '規則', 'きそく', 'qoida, tartib-nizom', 'きそく - kisoku', '会社の 規則を 守ります。 (Kompaniya qoidalariga rioya qiladi.)', 'N4', 167),
  ('m2_168', 'deck_minna2', '立ち入り禁止', 'たちいりきんし', 'Kirish taqiqlanadi (belgi)', 'たちいりきんし - tachiirikinshi', 'あそこは 立ち入り禁止です。 (U yerga kirish taqiqlangan.)', 'N4', 168),
  ('m2_169', 'deck_minna2', '非常口', 'ひじょうぐち', 'favqulodda chiqish eshigi', 'ひじょうぐち - hijouguchi', '非常口を 確認して ください。 (Favqulodda chiqish eshigini aniqlab oling.)', 'N4', 169),
  ('m2_170', 'deck_minna2', '無料', 'むりょう', 'bepul, tekin', 'むりょう - muryou', 'この 博物館は 無料です。 (Bu muzey bepul.)', 'N4', 170),
  ('m2_171', 'deck_minna2', '使用中', 'しようちゅう', 'band (ishlatilmoqda)', 'しようちゅう - shiyouchiu', '会議室は 今 使用中です。 (Majlislar xonasi hozir band.)', 'N4', 171),
  ('m2_172', 'deck_minna2', '法律', 'ほうりつ', 'qonun, huquq', 'ほうりつ - houritsu', '法律を 守らなければ なりません。 (Qonunga rioya qilish shart.)', 'N4', 172),
  ('m2_173', 'deck_minna2', 'マーク', 'まーく', 'belgi, ramz', 'まーく - ma-ku', 'この マークは どういう 意味ですか。 (Bu belgi qanday ma''noni anglatadi?)', 'N4', 173),
  ('m2_174', 'deck_minna2', '急に', 'きゅうに', 'to''satdan, birdaniga', 'きゅうに - kyuuni', '急に 雨が 降り出しました。 (To''satdan yomg''ir yog''a boshladi.)', 'N4', 174),
  ('m2_175', 'deck_minna2', '伝言', 'でんごん', 'xabar, omonat gap', 'でんごん - dengon', '田中さんに 伝言を お願いできますか。 (Tanaka san-ga gapimni yetkaza olasizmi?)', 'N4', 175),
  ('m2_176', 'deck_minna2', '席を外しています', 'せきをはずしています', 'joyida emas (vaqtincha)', 'せきをはずしています - sekiohazushiteimasu', '部長は 今 席を 外して おられます。 (Bo''lim boshlig''i hozir o''z joylarida yo''q edilar.)', 'N4', 176),
  ('m2_177', 'deck_minna2', '戻ります', 'もどります', 'qaytmoq', 'もどります - dorimasu', '30分で 戻ると 言っていました。 (30 daqiqada qaytaman degandilar.)', 'N4', 177),
  ('m2_178', 'deck_minna2', '磨きます', 'みがきます', 'tozalamoq, yuvmoq (tish, poyabzal)', 'みがきます - migakimasu', '毎日 歯を 磨きます。 (Har kuni tishimni yuvaman.)', 'N4', 178),
  ('m2_179', 'deck_minna2', '組み立てます', 'くみたてます', 'yig''moq, qismlardan birlashtirmoq (mebel, mashina)', 'くみたてます - kumitatemasu', '自分で 机を 組み立てました。 (Stolni o''zim qismlardan yig''dim.)', 'N4', 179),
  ('m2_180', 'deck_minna2', '折ります', 'おります', 'buklamoq, qayirmoq (qog''oz)', 'おります - orimasu', '紙を 折って 鶴を 作ります。 (Qog''ozni buklab turna yasaydi.)', 'N4', 180),
  ('m2_181', 'deck_minna2', '気がつきます', 'きがつきます', 'payqamoq, sezib qolmoq', 'きがつきます - kigatsukimasu', '間違いに 気がつきました。 (Xatoni payqab qoldim.)', 'N4', 181),
  ('m2_182', 'deck_minna2', '質問します', 'しつもんします', 'savol bermoq', 'しつもんします - shitsunshimasu', '先生に 質問します。 (Ustozga savol beradi.)', 'N4', 182),
  ('m2_183', 'deck_minna2', '説明書', 'せつめいしょ', 'yo''riqnoma, qo''llanma', 'せつめいしょ - setsumeisho', '説明書の とおりに 作ります。 (Yo''riqnomada ko''rsatilgandek yasaydi.)', 'N4', 183),
  ('m2_184', 'deck_minna2', '図', 'ず', 'chizma, sxema', 'ず - zu', '図を 見て ください。 (Chizmaga qarang.)', 'N4', 184),
  ('m2_185', 'deck_minna2', '線', 'せん', 'chiziq', 'せん - sen', '黒い 線を 引きます。 (Qora chiziq tortadi.)', 'N4', 185),
  ('m2_186', 'deck_minna2', '矢印', 'やじるし', 'strelka, yo''nalish ko''rsatkichi', 'やじるし - yajirushi', '矢印の 方向へ 進んで ください。 (Strelka yo''nalishi bo''ylab yuring.)', 'N4', 186),
  ('m2_187', 'deck_minna2', 'しょうゆ', 'しょうゆ', 'soya sousi', 'しょうゆ - shouyu', 'しょうゆを 少し つけます。 (Biroz soya sousi surtadi.)', 'N4', 187),
  ('m2_188', 'deck_minna2', '茶道', 'さどう', 'choy marosimi san''ati', 'さどう - sadou', '日本で 茶道を 体験しました。 (Yaponiyada choy marosimi san''atini sinab ko''rdim.)', 'N4', 188),
  ('m2_189', 'deck_minna2', '順番', 'じゅんばん', 'ketma-ketlik, navbat', 'じゅんばん - junban', '順番どおりに 並んで ください。 (Navbat bo''yicha turing.)', 'N4', 189),
  ('m2_190', 'deck_minna2', 'ソース', 'そーす', 'sous', 'そーす - so-su', 'ソースを かけないで 食べて みてください。 (Sous quymasdan yeb ko''ring.)', 'N4', 190),
  ('m2_191', 'deck_minna2', 'お茶', 'おちゃ', 'choy', 'おちゃ - ocha', 'ご飯を 食べた あとで、お茶を 飲みます。 (Ovqatlangandan so''ng choy ichaman.)', 'N4', 191),
  ('m2_192', 'deck_minna2', '咲きます', 'さきます', 'ochilmoq, gullamoq (gul)', 'さきます - sakimasu', '春に なれば、桜が 咲きます。 (Bahor kelsa, sakura gullaydi.)', 'N4', 192),
  ('m2_193', 'deck_minna2', '変わります', 'かわります', 'o''zgarmoq (rang, holat)', 'かわります - kawarimasu', '色が 変わります。 (Rangi o''zgaradi.)', 'N4', 193),
  ('m2_194', 'deck_minna2', '困ります', 'こまります', 'qiyin ahvolda qolmoq, chorasiz bo''lmoq', 'こまります - komarimasu', 'お金が なければ、困ります。 (Pul bo''lmasa, qiyin ahvolda qolaman.)', 'N4', 194),
  ('m2_195', 'deck_minna2', '楽', 'らくな', 'oson, qulay, rohatbaxsh', 'らくな - rakuna', '新幹線の ほう が 楽です。 (Shinkansen poyezdi qulayroq.)', 'N4', 195),
  ('m2_196', 'deck_minna2', '正しい', 'ただしい', 'to''g''ri, haqqoniy', 'ただしい - tadashii', '正しい 発音を 覚えます。 (To''g''ri talaffuzni yodlaydi.)', 'N4', 196),
  ('m2_197', 'deck_minna2', '珍しい', 'めずらしい', 'nodir, kam uchraydigan', 'めずらしい - mezurashii', '珍しい 切手ですね。 (Nodir marka ekan-a.)', 'N4', 197),
  ('m2_198', 'deck_minna2', '詳しい', 'くわしい', 'batafsil, yaxshi biladigan', 'くわしい - kuwashii', '彼は パソコンに 詳しいです。 (U kompyuterlarni juda yaxshi biladi.)', 'N4', 198),
  ('m2_199', 'deck_minna2', '向こう', 'むこう', 'qarama-qarshi tomon, narigi taraf', 'むこう - mukou', '向こうに 島が 見えます。 (Narigi tomonda orol ko''rinadi.)', 'N4', 199),
  ('m2_200', 'deck_minna2', '島', 'しま', 'orol', 'しま - shima', '小さな 島に 住んで います。 (Kichik orolda yashaydi.)', 'N4', 200),
  ('m2_201', 'deck_minna2', '港', 'みなと', 'bandargoh, port', 'みなと - minato', '港に 船が 着きました。 (Portga kema kelib to''xtadi.)', 'N4', 201),
  ('m2_202', 'deck_minna2', '近所', 'きんじょ', 'mahalla, qo''shnichilik, yaqin atrofi', 'きんじょ - kinjo', '近所の 人と 仲よく します。 (Mahalla ahli bilan inoq yashaydi.)', 'N4', 202),
  ('m2_203', 'deck_minna2', '機会', 'きかい', 'imkoniyat, fursat', 'きかい - kikai', '機会が あれば、日本へ 行きたいです。 (Fursat bo''lsa, Yaponiyaga borishni xohlayman.)', 'N4', 203),
  ('m2_204', 'deck_minna2', '案内所', 'あんないじょ', 'ma''lumotxona, axborot byurosi', 'あんないじょ - annaijo', '駅の 案内所で 聞けば、分かりますよ。 (Bekat ma''lumotxonasidan so''rasangiz, bilib olasiz.)', 'N4', 204),
  ('m2_205', 'deck_minna2', '屋上', 'おくじょう', 'tom, bino usti', 'おくじょう - okujou', '屋上に 上がれば、町が よく 見えます。 (Tomga chiqsangiz, shahar yaxshi ko''rinadi.)', 'N4', 205),
  ('m2_206', 'deck_minna2', '海外', 'かいがい', 'chet el, chet davlatlar', 'かいがい - kaigai', '時間が あれば、海外旅行に 行きたいです。 (Vaqt bo''lsa chet elga sayohat qilmoqchiman.)', 'N4', 206),
  ('m2_207', 'deck_minna2', '歴史', 'れきし', 'tarix', 'れきし - rekishi', 'この 本は 歴史を 調べるのに 役に 立ちます。 (Bu kitob tarixni o''rganishda juda asqotadi.)', 'N4', 207),
  ('m2_208', 'deck_minna2', '貯金します', 'ちょきんします', 'pul jamg''armoq, tejab yig''moq', 'ちょきんします - chokinshimasu', '将来の ために 貯金します。 (Kelajak uchun pul jamg''aradi.)', 'N4', 208),
  ('m2_209', 'deck_minna2', '過ぎます', 'すぎます', 'o''tib ketmoq (vaqt)', 'すぎます - sugimasu', '7時を 過ぎました。 (Soat 7 dan o''tib ketdi.)', 'N4', 209),
  ('m2_210', 'deck_minna2', '慣れます', 'なれます', 'ko''nikmoq, o''rganib qolmoq', 'なれます - naremasu', '日本の 生活に 慣れました。 (Yaponiya hayotiga ko''nikib qoldim.)', 'N4', 210),
  ('m2_211', 'deck_minna2', '腐ります', 'くさります', 'aynimoq, sasimoq, chirimoq', 'くさります - kusarimasu', '食べ物が 腐らない ように、冷蔵庫に 入れます。 (Ovqat aynamasligi uchun muzlatgichga soladi.)', 'N4', 211),
  ('m2_212', 'deck_minna2', '剣道', 'けんどう', 'kendo (yapon an''anaviy qilichbozlik sporti)', 'けんどう - kendou', '剣道を 習って います。 (Kendo sportini o''rganyapman.)', 'N4', 212),
  ('m2_213', 'deck_minna2', 'ラッシュ', 'ラッシュ', 'tirbandlik, tig''iz payt', 'ラッシュ - rashu', '朝の ラッシュは 大変です。 (Ertalabki tirbandlik juda qiyin.)', 'N4', 213),
  ('m2_214', 'deck_minna2', '宇宙', 'うちゅう', 'koinot, fazo', 'うちゅう - uchiu', '宇宙へ 行って みたいです。 (Koinotga borib ko''rishni xohlayman.)', 'N4', 214),
  ('m2_215', 'deck_minna2', '曲', 'きょく', 'kuy, musiqa ohangi', 'きょく - kyoku', 'この 曲を よく 聞きます。 (Bu kuyni tez-tez eshitaman.)', 'N4', 215),
  ('m2_216', 'deck_minna2', 'やっと', 'やっと', 'nihoyat, arang, zo''rg''a', 'やっと - yato', 'やっと 自転車に 乗れるように なりました。 (Nihoyat velosiped haydashni o''rganib oldim.)', 'N4', 216),
  ('m2_217', 'deck_minna2', 'かなり', 'かなり', 'ancha, ancha-muncha', 'かなり - kanari', '日本語が かなり 分かるように なりました。 (Yapon tilini ancha tushunadigan bo''lib qoldim.)', 'N4', 217),
  ('m2_218', 'deck_minna2', '必ず', 'かならず', 'albatta, muqarrar', 'かならず - kanarazu', '約束を 必ず 守って ください。 (Kelishuvga albatta rioya qiling.)', 'N4', 218),
  ('m2_219', 'deck_minna2', '絶対に', 'ぜったいに', 'mutlaqo, sira ham (inkor bilan)', 'ぜったいに - zetaini', '絶対に 忘れません。 (Sira ham unutmayman.)', 'N4', 219),
  ('m2_220', 'deck_minna2', 'できるだけ', 'できるだけ', 'iloji boricha, imkon qadar', 'できるだけ - dekirudake', 'できるだけ 早く 来て ください。 (Iloji boricha ertaroq keling.)', 'N4', 220),
  ('m2_221', 'deck_minna2', '練習します', 'れんしゅうします', 'mashq qilmoq', 'れんしゅうします - renshuushimasu', '毎日 漢字を 練習するように しています。 (Har kuni kanjilarni mashq qilishga harakat qilyapman.)', 'N4', 221),
  ('m2_222', 'deck_minna2', '習慣', 'しゅうかん', 'odat, urf-odat', 'しゅうかん - shuukan', '毎朝 散歩する 習慣が できました。 (Har kuni ertalab sayr qilish odatim shakllandi.)', 'N4', 222),
  ('m2_223', 'deck_minna2', '健康', 'けんこう', 'salomatlik', 'けんこう - kenkou', '健康のために 野菜を たくさん 食べます。 (Salomatlik uchun ko''p sabzavot yeyman.)', 'N4', 223),
  ('m2_224', 'deck_minna2', '無理をします', 'むりをします', 'kuchni ortiqcha zo''riqtirmoq', 'むりをします - murioshimasu', '無理を しないように して ください。 (O''zingizni ortiqcha zo''riqtirmaslikka harakat qiling.)', 'N4', 224),
  ('m2_225', 'deck_minna2', '特別な', 'とくべつな', 'alohida, o''zgacha', 'とくべつな - tokubetsuna', '特別な 運動は していません。 (Alohida bir mashq qilayotganim yo''q.)', 'N4', 225),
  ('m2_226', 'deck_minna2', '水泳', 'すいえい', 'suzish sporti', 'すいえい - suiei', '水泳が できるように なりました。 (Suzishni o''rganib oldim.)', 'N4', 226),
  ('m2_227', 'deck_minna2', 'キロ', 'きろ', 'kilogramm / kilometr', 'きろ - kiro', '毎朝 5キロ 走るように しています。 (Har kuni ertalab 5 km yugurishga harakat qilaman.)', 'N4', 227),
  ('m2_228', 'deck_minna2', 'ショック', 'しょっく', 'shok, hayrat', 'しょっく - shoku', '試験に 落ちて ショックを 受けました。 (Imtihondan yiqilib qattiq tushkunlikka tushdim.)', 'N4', 228),
  ('m2_229', 'deck_minna2', 'ほめます', 'ほめます', 'maqtamoq', 'ほめます - homemasu', '先生に ほめられました。 (Ustozim tomonidan maqtaldim.)', 'N4', 229),
  ('m2_230', 'deck_minna2', 'しかります', 'しかります', 'urishmoq, tanbeh bermoq', 'しかります - shikarimasu', '母に しかられました。 (Onamdan dakki eshitdim.)', 'N4', 230),
  ('m2_231', 'deck_minna2', '誘います', 'さそいます', 'taklif qilmoq (birga biror joyga borishga)', 'さそいます - sasoimasu', '友だちに パーティーに 誘われました。 (Do''stim tomonidan ziyofatga taklif qilindim.)', 'N4', 231),
  ('m2_232', 'deck_minna2', '頼みます', 'たのみます', 'iltimos qilmoq, buyurmoq', 'たのみます - tanomimasu', '仕事を 頼まれました。 (Menga ish topshirildi.)', 'N4', 232),
  ('m2_233', 'deck_minna2', '踏みます', 'ふみます', 'bosmoq (oyoqni)', 'ふみます - fumimasu', '電車で 足を 踏まれました。 (Poyezdda oyog''imni bosib olishdi.)', 'N4', 233),
  ('m2_234', 'deck_minna2', '壊します', 'こわします', 'buzmoq, sindirmoq', 'こわします - kowashimasu', '弟に パソコンを 壊されました。 (Ukam kompyuterimni buzib qo''ydi.)', 'N4', 234),
  ('m2_235', 'deck_minna2', '汚します', 'よごします', 'kirlatmoq, bulg''amoq', 'よごします - yogoshimasu', '服を 汚されました。 (Kiyimimni kirlatishdi.)', 'N4', 235),
  ('m2_236', 'deck_minna2', '行います', 'おこないます', 'o''tkazmoq, amalga oshirmoq (tadbirlar)', 'おこないます - okonaimasu', 'オリンピックが 行われました。 (Olimpiada o''tkazildi.)', 'N4', 236),
  ('m2_237', 'deck_minna2', '輸出します', 'ゆしゅつします', 'eksport qilmoq', 'ゆしゅつします - yushutsushimasu', '車が 世界中へ 輸出されて います。 (Avtomobillar butun dunyoga eksport qilinmoqda.)', 'N4', 237),
  ('m2_238', 'deck_minna2', '輸入します', 'ゆにゅうします', 'import qilmoq', 'ゆにゅうします - yunyuushimasu', '石油を 輸入して います。 (Neft import qilinadi.)', 'N4', 238),
  ('m2_239', 'deck_minna2', '翻訳します', 'ほんやくします', 'yozma tarjima qilmoq', 'ほんやくします - honyakushimasu', 'この 本は 英語に 翻訳されました。 (Bu kitob ingliz tiliga tarjima qilingan.)', 'N4', 239),
  ('m2_240', 'deck_minna2', '発明します', 'はつめいします', 'ixtiro qilmoq', 'はつめいします - hatsumeishimasu', '電話は ベルによって 発明されました。 (Telefon Bell tomonidan ixtiro qilingan.)', 'N4', 240),
  ('m2_241', 'deck_minna2', '発見します', 'はっけんします', 'kashf etmoq', 'はっけんします - hakenshimasu', '新しい 星が 発見されました。 (Yangi yulduz kashf qilindi.)', 'N4', 241),
  ('m2_242', 'deck_minna2', '泥棒', 'どろぼう', 'o''g''ri', 'どろぼう - dorobou', '泥棒に お金を 取られました。 (O''g''ri pulimni o''g''irlab ketdi.)', 'N4', 242),
  ('m2_243', 'deck_minna2', '警官', 'けいかん', 'politsiyachi', 'けいかん - keikan', '泥棒は 警官に 捕まりました。 (O''g''ri politsiyachi tomonidan qo''lga olindi.)', 'N4', 243),
  ('m2_244', 'deck_minna2', '建築家', 'けんちくか', 'me''mor, arxitektor', 'けんちくか - kenchikuka', 'この ビルは 有名な 建築家によって 設計されました。 (Bu bino mashhur me''mor tomonidan loyihalashtirilgan.)', 'N4', 244),
  ('m2_245', 'deck_minna2', '漫画', 'まんが', 'manga (yapon komikslari)', 'まんが - manga', '日本の 漫画は 世界中で 読まれています。 (Yapon mangalari butun dunyoda o''qiladi.)', 'N4', 245),
  ('m2_246', 'deck_minna2', '金', 'きん', 'oltin', 'きん - kin', '金の 寺（金閣寺）が 建てられました。 (Oltin ibodatxona barpo etilgan.)', 'N4', 246),
  ('m2_247', 'deck_minna2', '参加します', 'さんかします', 'qatnashmoq, a''zo bo''lmoq', 'さんかします - sankashimasu', 'ボランティアに 参加します。 (Ko''ngillilar faoliyatida qatnashadi.)', 'N4', 247),
  ('m2_248', 'deck_minna2', '育てます', 'そだてます', 'tarbiyalamoq, o''stirmoq (bola, o''simlik)', 'そだてます - sodatemasu', '花を 育てるのが 好きです。 (Gul o''stirishni yoqtiraman.)', 'N4', 248),
  ('m2_249', 'deck_minna2', '運びます', 'はこびます', 'tashimoq, eltmoq', 'はこびます - hakobimasu', '重い 荷物を 運びます。 (Og''ir yukni tashiydi.)', 'N4', 249),
  ('m2_250', 'deck_minna2', '入院します', 'にゅういんします', 'shifoxonaga yotmoq', 'にゅういんします - nyuuinshimasu', '祖父が 入院しました。 (Bobom shifoxonaga yotqizildi.)', 'N4', 250),
  ('m2_251', 'deck_minna2', '退院します', 'たいいんします', 'shifoxonadan chiqmoq', 'たいいんします - taiinshimasu', '来週 退院します。 (Keyingi hafta shifoxonadan chiqadi.)', 'N4', 251),
  ('m2_252', 'deck_minna2', '電源', 'でんげん', 'elektr ta''minoti, manba', 'でんげん - denn', '電源を 入れて ください。 (Elektr manbaini yoqing.)', 'N4', 252),
  ('m2_253', 'deck_minna2', '整理します', 'せいりします', 'tartibga solmoq, saralamoq', 'せいりします - seirishimasu', '書類を 整理します。 (Hujjatlarni tartibga keltiradi.)', 'N4', 253),
  ('m2_254', 'deck_minna2', '似ています', 'にています', 'o''xshamoq (tashqi ko''rinish yoki xarakter)', 'にています - niteimasu', '父に よく 似て います。 (Otamga juda o''xshayman.)', 'N4', 254),
  ('m2_255', 'deck_minna2', '世話をします', 'せわをします', 'g''amxo''rlik qilmoq, parvarishlamoq', 'せわをします - sewaoshimasu', '犬の 世話を します。 (Itni parvarish qiladi.)', 'N4', 255),
  ('m2_256', 'deck_minna2', '手袋', 'てぶくろ', 'qo''lqop', 'てぶくろ - tebukuro', '手袋を はめるのを 忘れました。 (Qo''lqop kiyishni unutibman.)', 'N4', 256),
  ('m2_257', 'deck_minna2', '木綿', 'もめん', 'paxta mato', 'もめん - men', '木綿の シャツを 着るのが 好きです。 (Paxta ko''ylak kiyishni yoqtiraman.)', 'N4', 257),
  ('m2_258', 'deck_minna2', '革', 'かわ', 'charm, ko''n', 'かわ - kawa', '革の 財布を 買いました。 (Charm hamyon sotib oldim.)', 'N4', 258),
  ('m2_259', 'deck_minna2', '嘘', 'うそ', 'yolg''on', 'うそ - uso', '嘘を つくのは よくありません。 (Yolg''on gapirish yaxshi emas.)', 'N4', 259),
  ('m2_260', 'deck_minna2', '赤ちゃん', 'あかちゃん', 'chaqaloq', 'あかちゃん - akachan', '赤ちゃんが 生まれたのを 知っていますか。 (Chaqaloq tug''ilganini bilasizmi?)', 'N4', 260),
  ('m2_261', 'deck_minna2', '海岸', 'かいがん', 'dengiz qirg''og''i, sohil', 'かいがん - kaigan', '海岸を 散歩するのが 気持ちいいです。 (Sohilda sayr qilish xush yoqadi.)', 'N4', 261),
  ('m2_262', 'deck_minna2', '工場', 'こうじょう', 'zavod, fabrika', 'こうじょう - koujou', '車を 作る 工場を 見学しました。 (Mashina ishlab chiqaradigan zavodni ekskursiya qildik.)', 'N4', 262),
  ('m2_263', 'deck_minna2', '答えます', 'こたえます', 'javob bermoq', 'こたえます - kotaemasu', '質問に 答えます。 (Savolga javob beradi.)', 'N4', 263),
  ('m2_264', 'deck_minna2', '倒れます', 'たおれます', 'qulamoq, yiqilmoq (bino, daraxt)', 'たおれます - taoremasu', '地震で ビルが 倒れました。 (Zilzila sababli bino qulab tushdi.)', 'N4', 264)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('m2_265', 'deck_minna2', '通ります', 'とおれます', 'o''tmoq, kesib o''tmoq', 'とおれます - tooremasu', '道を 通ります。 (Yo''ldan o''tadi.)', 'N4', 265),
  ('m2_266', 'deck_minna2', '死にます', 'しにます', 'vafot etmoq, o''lmoq', 'しにます - shinimasu', '犬が 死んで、悲しいです。 (Itim o''lib qolib, xafaman.)', 'N4', 266),
  ('m2_267', 'deck_minna2', 'びっくりします', 'びっくりします', 'hayron qolmoq, cho''chib ketmoq', 'びっくりします - bikurishimasu', 'ニュースを 聞いて、びっくりしました。 (Xabarni eshitib hayron qoldim.)', 'N4', 267),
  ('m2_268', 'deck_minna2', '安心します', 'あんしんします', 'ko''ngil tinchimoq, taskin topmoq', 'あんしんします - anshinshimasu', '家族の 声を 聞いて、安心しました。 (Oilamning ovozini eshitib, ko''nglim tinchidi.)', 'N4', 268),
  ('m2_269', 'deck_minna2', '遅刻します', 'ちこくします', 'kechikmoq', 'ちこくします - chikokushimasu', '授業に 遅刻しました。 (Darsga kechikdim.)', 'N4', 269),
  ('m2_270', 'deck_minna2', '早退します', 'そうたいします', 'ishdan/darsdan ertaroq javob olib ketmoq', 'そうたいします - soutaishimasu', '体調が 悪いので、早退させて ください。 (Tobim yo''qligi sababli barvaqt ketishga ruxsat bering.)', 'N4', 270),
  ('m2_271', 'deck_minna2', '複雑', 'ふくざつな', 'murakkab, chigal', 'ふくざつな - fukuzatsuna', '道が 複雑で、迷いました。 (Yo''l chigal bo''lgani sababli adashib qoldim.)', 'N4', 271),
  ('m2_272', 'deck_minna2', '邪魔', 'じゃまな', 'xalal beruvchi, noqulay', 'じゃまな - jamana', '荷物が 邪魔です。 (Yuklar yo''lga xalal beryapti.)', 'N4', 272),
  ('m2_273', 'deck_minna2', '火事', 'かじ', 'yong''in', 'かじ - kaji', '火事で 家が 焼けました。 (Yong''in tufayli uy yonib ketdi.)', 'N4', 273),
  ('m2_274', 'deck_minna2', '台風', 'たいふう', 'to''fon, tayfun', 'たいふう - taifuu', '台風で 電車が 止まりました。 (To''fon sababli poyezdlar to''xtadi.)', 'N4', 274),
  ('m2_275', 'deck_minna2', '西洋', 'せいよう', 'G''arb mamlakatlari', 'せいよう - seiyou', '西洋の 文化に 興味が あります。 (G''arb madaniyatiga qiziqishim bor.)', 'N4', 275),
  ('m2_276', 'deck_minna2', '東洋', 'とうよう', 'Sharq mamlakatlari', 'とうよう - touyou', '東洋の 歴史を 勉強しています。 (Sharq tarixini o''rganayapman.)', 'N4', 276),
  ('m2_277', 'deck_minna2', '並びます', 'ならびます', 'navbatda turmoq, qatorlashmoq', 'ならびます - narabimasu', '店の 前に 人が 並んで います。 (Do''kon oldida odamlar navbatda turishibdi.)', 'N4', 277),
  ('m2_278', 'deck_minna2', '数えます', 'かぞえます', 'sanamoq, hisoblamoq', 'かぞえます - kazoemasu', '人数を 数えます。 (Odamlar sonini sanaydi.)', 'N4', 278),
  ('m2_279', 'deck_minna2', '測ります', 'はかります', 'o''lchamoq (uzunlik, vaqt, harorat)', 'はかります - hakarimasu', '熱を 測ります。 (Isitmani o''lchaydi.)', 'N4', 279),
  ('m2_280', 'deck_minna2', '確かめます', 'たしかめます', 'aniqlashtirmoq, tekshirib ko''rmoq', 'たしかめます - tashikamemasu', '時間を 確かめて ください。 (Vaqtni aniqlashtirib oling.)', 'N4', 280),
  ('m2_281', 'deck_minna2', '合います', 'あいます', 'mos kelmoq, to''g''ri kelmoq (o''lcham)', 'あいます - aimasu', 'サイズが 合います。 (O''lchami to''g''ri keldi.)', 'N4', 281),
  ('m2_282', 'deck_minna2', '出発します', 'しゅっぱつします', 'yo''lga chiqmoq, jo''namoq', 'しゅっぱつします - shupatsushimasu', 'バスは たった今 出発した ところです。 (Avtobus xuddi hozirgina jo''nab ketdi.)', 'N4', 282),
  ('m2_283', 'deck_minna2', '到着します', 'とうちゃくします', 'yetib kelmoq', 'とうちゃくします - touchakushimasu', '飛行機は もうすぐ 到着する はずです。 (Samolyot hozir yetib kelishi aniq.)', 'N4', 283),
  ('m2_284', 'deck_minna2', '忘年会', 'ぼうねんかい', 'yil yakuni bayrami (Yaponiya an''anasi)', 'ぼうねんかい - bounenkai', '忘年会に 行きます。 (Yil yakuni ziyofatiga boradi.)', 'N4', 284),
  ('m2_285', 'deck_minna2', '傷', 'きず', 'chiziq, tirnalish, jarohat', 'きず - kizu', '車に 傷が あります。 (Mashinada tirnalgan joy bor.)', 'N4', 285),
  ('m2_286', 'deck_minna2', '〜以上', '〜いじょう', '...dan ko''p, ortiq', '〜いじょう - ijou', '18歳以上 (18 yoshdan yuqori.)', 'N4', 286),
  ('m2_287', 'deck_minna2', '〜以下', '〜いか', '...dan kam, past', '〜いか - ika', '1000円以下 (1000 yendan past.)', 'N4', 287),
  ('m2_288', 'deck_minna2', 'ズボン', 'ずぼん', 'shim', 'ずぼん - zubon', 'この ズボンを はいて みても いいですか。 (Ushbu shimni kiyib ko''rsam bo''ladimi?)', 'N4', 288),
  ('m2_289', 'deck_minna2', '二次会', 'にじかい', 'ziyofatning ikkinchi davomi', 'にじかい - nijikai', '二次会へ 行くか どうか 話し合っています。 (Davomiga boramizmi-yo''qmi maslahatlashyapmiz.)', 'N4', 289),
  ('m2_290', 'deck_minna2', '大会', 'たいかい', 'musobaqa, syezdd', 'たいかい - taikai', 'スピーチ大会で 誰が 優勝するか 楽しみです。 (Nutq musobaqasida kim yutishi qiziq bo''lyapti.)', 'N4', 290),
  ('m2_291', 'deck_minna2', '表', 'おもて', 'yuz tomon, usti', 'おもて - ote', '表と 裏を 確かめて ください。 (Oldi va orqa tomonini tekshiring.)', 'N4', 291),
  ('m2_292', 'deck_minna2', '裏', 'うら', 'orqa tomon, teskarisi', 'うら - ura', '封筒の 裏に 住所を 書きます。 (Konvertning orqasiga manzil yozaman.)', 'N4', 292),
  ('m2_293', 'deck_minna2', '返事', 'へんじ', 'javob', 'へんじ - henji', 'メールの 返事を 出しました。 (Xatga javob qaytardim.)', 'N4', 293),
  ('m2_294', 'deck_minna2', 'いただきます', 'いただきます', 'yeyman / ichaman / olaman (食べます・飲みます・もらいます ning kamtarlik shakli)', 'いただきます - itadakimasu', '先生に 本を いただきました。 (Ustozdan kitob oldim (ehtirom bilan).)', 'N4', 294),
  ('m2_295', 'deck_minna2', 'くださいます', 'くださいます', 'bermoq (kattalar menga berishi, くれます ning hurmat shakli)', 'くださいます - kudasaimasu', '社長が お土産を くださいました。 (Kompaniya rahbari menga sovg''a berdilar.)', 'N4', 295),
  ('m2_296', 'deck_minna2', '上げます', 'あげます', 'ko''tarmoq, bermoq', 'あげます - amasu', '給料を 上げます。 (Oylikni oshiradi.)', 'N4', 296),
  ('m2_297', 'deck_minna2', '下げます', 'さげます', 'tushirmoq, pasaytirmoq', 'さげます - samasu', '温度を 下げます。 (Haroratni pasaytiradi.)', 'N4', 297),
  ('m2_298', 'deck_minna2', '親切にします', 'しんせつにします', 'mehribonlik qilmoq, yaxshilik ko''rsatmoq', 'しんせつにします - shinsetsunishimasu', 'お年寄りに 親切に します。 (Keksalar bilan xushmuomala bo''ladi.)', 'N4', 298),
  ('m2_299', 'deck_minna2', 'お祝い', 'おいわい', 'tabrik sovg''asi', 'おいわい - oiwai', '結婚の お祝いを あげます。 (To''y tabrigi sovg''asini beradi.)', 'N4', 299),
  ('m2_300', 'deck_minna2', 'お年玉', 'おとしだま', 'yangi yil pul sovg''asi (bolalarga)', 'おとしだま - otoshidama', '子どもに お年玉を やります。 (Bolalarga yangi yil pul sovg''asini beradi.)', 'N4', 300),
  ('m2_301', 'deck_minna2', 'お見舞い', 'おみまい', 'bemor ko''rish sovg''asi / tashrifi', 'おみまい - omimai', 'お見舞いに 行きます。 (Bemor ko''rgani boradi.)', 'N4', 301),
  ('m2_302', 'deck_minna2', '興味', 'きょうみ', 'qiziqish', 'きょうみ - kyoumi', '日本の 文化に 興味が あります。 (Yaponiya madaniyatiga qiziqishim bor.)', 'N4', 302),
  ('m2_303', 'deck_minna2', '情報', 'じょうほう', 'ma''lumot, axborot', 'じょうほう - jouhou', '先生が いい 情報を くださいました。 (Ustoz menga yaxshi ma''lumot berdilar.)', 'N4', 303),
  ('m2_304', 'deck_minna2', '文法', 'ぶんぽう', 'grammatika', 'ぶんぽう - bunpou', '先生が 文法を 説明して くださいました。 (Ustoz grammatikani tushuntirib berdilar.)', 'N4', 304),
  ('m2_305', 'deck_minna2', '発音', 'はつおん', 'talaffuz', 'はつおん - hatsuon', '発音を 直して いただきました。 (Talaffuzimni to''g''irlatib oldim.)', 'N4', 305),
  ('m2_306', 'deck_minna2', '猿', 'さる', 'maymun', 'さる - saru', '動物園で 猿に えさを やりました。 (Hayvonot bog''ida maymunga yem berdim.)', 'N4', 306),
  ('m2_307', 'deck_minna2', '包みます', 'つつみます', 'o''ramoq, qadoqlamoq', 'つつみます - tsutsumimasu', 'プレゼントを きれいな 紙で 包みます。 (Sovg''ani chiroyli qog''ozga o''raydi.)', 'N4', 307),
  ('m2_308', 'deck_minna2', '沸かします', 'わかします', 'qaynatmoq (suvni)', 'わかします - wakashimasu', 'お湯を 沸かします。 (Choynakda suv qaynatadi.)', 'N4', 308),
  ('m2_309', 'deck_minna2', '混ぜます', 'まぜます', 'aralashtirmoq', 'まぜます - mazemasu', 'よく 混ぜて ください。 (Yaxshilab aralashtiring.)', 'N4', 309),
  ('m2_310', 'deck_minna2', '計算します', 'けいさんします', 'hisoblamoq, sanamoq', 'けいさんします - keisanshimasu', 'お金を 計算します。 (Pulni hisob-kitob qiladi.)', 'N4', 310),
  ('m2_311', 'deck_minna2', '目的', 'もくてき', 'maqsad, muddao', 'もくてき - kuteki', '日本へ 来た 目的は 何ですか。 (Yaponiyaga kelishdan maqsadingiz nima?)', 'N4', 311),
  ('m2_312', 'deck_minna2', '論文', 'ろんぶん', 'ilmiy maqola, dissertatsiya', 'ろんぶん - ronbun', '卒業論文を 書きます。 (Bitiruv malakaviy ishini yozadi.)', 'N4', 312),
  ('m2_313', 'deck_minna2', '栓抜き', 'せんぬき', 'shisha ochgich', 'せんぬき - sennuki', '栓抜きは どこですか。 (Shisha ochgich qayerda?)', 'N4', 313),
  ('m2_314', 'deck_minna2', '缶切り', 'かんきり', 'konserva ochgich', 'かんきり - kankiri', '缶切りで 缶詰を 開けます。 (Konserva ochgich bilan bankani ochadi.)', 'N4', 314),
  ('m2_315', 'deck_minna2', '音楽家', 'おんがくか', 'musiqachi', 'おんがくか - ongakuka', '音楽家を 目指しています。 (Musiqachi bo''lishni maqsad qilgan.)', 'N4', 315),
  ('m2_316', 'deck_minna2', '子ども', 'こども', 'bola', 'こども - kodo', '子どもの ために 絵本を 買いました。 (Farzandim uchun ertak kitob sotib oldim.)', 'N4', 316),
  ('m2_317', 'deck_minna2', '教育', 'きょういく', 'ta''lim, tarbiya', 'きょういく - kyouiku', '子どもの 教育に お金が かかります。 (Bola ta''limiga pul sarflanadi.)', 'N4', 317),
  ('m2_318', 'deck_minna2', '文化', 'ぶんか', 'madaniyat', 'ぶんか - bunka', '文化を 理解するのに 時間が かかります。 (Madaniyatni tushunish uchun vaqt kerak bo''ladi.)', 'N4', 318),
  ('m2_319', 'deck_minna2', '戦争', 'せんそう', 'urush', 'せんそう - sensou', '平和の ために 戦争を 反対します。 (Tinchlik uchun urushga qarshimiz.)', 'N4', 319),
  ('m2_320', 'deck_minna2', '増えます', 'ふえます', 'ko''paymoq, oshmoq (son, miqdor)', 'ふえます - fuemasu', '留学生が 増えました。 (Chet ellik talabalar soni ko''paydi.)', 'N4', 320),
  ('m2_321', 'deck_minna2', '減ります', 'へります', 'kamaymoq', 'へります - herimasu', '輸出が 減りました。 (Eksport kamaydi.)', 'N4', 321),
  ('m2_322', 'deck_minna2', '上がります', 'あがります', 'ko''tarilmoq (narx, harorat)', 'あがります - agarimasu', '値段が 上がります。 (Narxlar ko''tariladi.)', 'N4', 322),
  ('m2_323', 'deck_minna2', '下がります', 'さがります', 'tushmoq, pasaymoq', 'さがります - sagarimasu', '気温が 下がりました。 (Havo harorati pasaydi.)', 'N4', 323),
  ('m2_324', 'deck_minna2', '切れます', 'きれます', 'uzilmoq (ip, tugma)', 'きれます - kiremasu', 'ひもが 切れそうです。 (Ip uzilib ketadiganga o''xshaydi.)', 'N4', 324),
  ('m2_325', 'deck_minna2', '落ちます', 'おちます', 'qulamoq, tushib ketmoq', 'おちます - ochimasu', '荷物が 落ちそうです。 (Yuk tushib ketadiganga o''xshaydi.)', 'N4', 325),
  ('m2_326', 'deck_minna2', '今にも', 'いまにも', 'hozirning o''zidayoq, ayni damda', 'いまにも - imani', '今にも 雨が 降りそうです。 (Hozirning o''zidayoq yomg''ir yog''adigandek turibdi.)', 'N4', 326),
  ('m2_327', 'deck_minna2', '暖房', 'だんぼう', 'isitish tizimi (pechka)', 'だんぼう - danbou', '暖房を つけたので、部屋が 暖かくなりました。 (Isitgichni yoqqanim sababli xona ilidi.)', 'N4', 327),
  ('m2_328', 'deck_minna2', '冷房', 'れいぼう', 'konditsioner, sovitish tizimi', 'れいぼう - reibou', '冷房が 効いて 涼しいです。 (Konditsioner ishlab salqin bo''lib turibdi.)', 'N4', 328),
  ('m2_329', 'deck_minna2', 'センス', 'せんす', 'did, nozik did', 'せんす - sensu', '服の センスが いいですね。 (Kiyinish didingiz ajoyib ekan.)', 'N4', 329),
  ('m2_330', 'deck_minna2', 'わあ', 'わあ', 'voy (hayrat undovi)', 'わあ - waa', 'わあ、きれいな 花火ですね。 (Voy, qanday go''zal mushakbozlik!)', 'N4', 330),
  ('m2_331', 'deck_minna2', '会員', 'かいいん', 'a''zo (klub yoki tashkilot)', 'かいいん - kaiin', 'ジムの 会員に なりました。 (Sport zali a''zosiga aylandim.)', 'N4', 331),
  ('m2_332', 'deck_minna2', '適当な', 'てきとうな', 'munosib, mos keluvchi', 'てきとうな - tekitouna', '適当な 大きさに 切って ください。 (Mos o''lchamda kesib chiqing.)', 'N4', 332),
  ('m2_333', 'deck_minna2', '泣きます', 'なきます', 'yig''lamoq', 'なきます - nakimasu', '赤ちゃんが 泣いて います。 (Chaqaloq yig''layapti.)', 'N4', 333),
  ('m2_334', 'deck_minna2', '笑います', 'わらいます', 'kulmoq, jilmaymoq', 'わらいます - waraimasu', 'みんなで 楽しく 笑いました。 (Barchamiz quvnoq kulishdik.)', 'N4', 334),
  ('m2_335', 'deck_minna2', '乾きます', 'かわきます', 'qurimoq', 'かわきます - kawakimasu', '洗濯物が 乾きました。 (Yuvilgan kiyimlar quridi.)', 'N4', 335),
  ('m2_336', 'deck_minna2', '滑ります', 'すべります', 'sirpanmoq', 'すべります - suberimasu', '道が 凍って 滑りやすいです。 (Yo''l muzlab, sirpanchiq bo''lib qolibdi.)', 'N4', 336),
  ('m2_337', 'deck_minna2', '調節します', 'ちょうせつします', 'moslamoq, sozlamoq (harorat, hajm)', 'ちょうせつします - chousetsushimasu', 'エアコンの 温度を 調節します。 (Konditsioner haroratini sozlaydi.)', 'N4', 337),
  ('m2_338', 'deck_minna2', '安全', 'あんぜんな', 'xavfsiz', 'あんぜんな - anzenna', '安全な 道を 歩きます。 (Xavfsiz yo''ldan yuradi.)', 'N4', 338),
  ('m2_339', 'deck_minna2', '濃い', 'こい', 'quyuq, to''q (choy, rang)', 'こい - koi', '濃い お茶が 好きです。 (Achchiq to''q choyni yoqtiraman.)', 'N4', 339),
  ('m2_340', 'deck_minna2', '薄い', 'うすい', 'suyuq, och rang, yupqa', 'うすい - usui', '味が 薄いです。 (Ta''mi suyuq (kam tuzli).)', 'N4', 340),
  ('m2_341', 'deck_minna2', '厚い', 'あつい', 'qalin (kitob, kiyim)', 'あつい - atsui', '厚い 本を 読みます。 (Qalin kitobni o''qiydi.)', 'N4', 341),
  ('m2_342', 'deck_minna2', '太い', 'ふとい', 'yo''g''on (daraxt, chiziq)', 'ふとい - futoi', '太い ペンで 書いて ください。 (Yo''g''on ruchka bilan yozing.)', 'N4', 342),
  ('m2_343', 'deck_minna2', '細い', 'ほそい', 'ingichka', 'ほそい - hosoi', '細い 道ですね。 (Ingichka yo''l ekan.)', 'N4', 343),
  ('m2_344', 'deck_minna2', '涙', 'なみだ', 'ko''z yoshi', 'なみだ - namida', '涙が 出ました。 (Ko''zdan yosh chiqdi.)', 'N4', 344),
  ('m2_345', 'deck_minna2', '理由', 'りゆう', 'sabab, vaj', 'りゆう - riyuu', '遅刻した 理由を 言い訳しないで ください。 (Kechikish sababini bahona qilmang.)', 'N4', 345),
  ('m2_346', 'deck_minna2', '謝罪', 'しゃざい', 'kechirim so''rash', 'しゃざい - shazai', '誠意を 持って 謝ります。 (Chin dildan uzr so''rayman.)', 'N4', 346),
  ('m2_347', 'deck_minna2', 'エアコン', 'えあこん', 'konditsioner', 'えあこん - eakon', 'この エアコンは 操作が しやすいです。 (Bu konditsionerni boshqarish juda oson.)', 'N4', 347),
  ('m2_348', 'deck_minna2', 'パスワード', 'ぱすわーど', 'parol', 'ぱすわーど - pasuwa-do', '短い パスワードは 覚えやすいですが、危険です。 (Qisqa parol eslab qolishga oson, ammo xavfli.)', 'N4', 348),
  ('m2_349', 'deck_minna2', '薬', 'くすり', 'dori-darmon', 'くすり - kusuri', '苦い 薬は 飲みにくいです。 (Achchiq dorini ichish qiyin.)', 'N4', 349),
  ('m2_350', 'deck_minna2', '字', 'じ', 'harf, yozuv', 'じ - ji', '小さい 字は 読みにくいです。 (Kichik yozuvni o''qish qiyin.)', 'N4', 350),
  ('m2_351', 'deck_minna2', '靴', 'くつ', 'poyafzal', 'くつ - kutsu', 'この 靴は 歩きやすいです。 (Bu poyafzalda yurish juda qulay.)', 'N4', 351),
  ('m2_352', 'deck_minna2', '掃除します', 'そうじします', 'tozalamoq', 'そうじします - soujishimasu', '部屋を きれいに 掃除しました。 (Xonani chiroyli qilib tozaladim.)', 'N4', 352),
  ('m2_353', 'deck_minna2', '信じます', 'しんじます', 'ishonmoq', 'しんじます - shinjimasu', '友だちを 信じます。 (Do''stimga ishonaman.)', 'N4', 353),
  ('m2_354', 'deck_minna2', 'キャンセルします', 'キャンセルします', 'bekor qilmoq', 'キャンセルします - kyanserushimasu', '予約を キャンセルします。 (Band qilingan joyni bekor qiladi.)', 'N4', 354),
  ('m2_355', 'deck_minna2', '保証書', 'ほしょうしょ', 'kafolat qog''ozi (garantiya)', 'ほしょうしょ - hoshousho', '保証書を 持って 行きます。 (Kafolat qog''ozini olib boradi.)', 'N4', 355),
  ('m2_356', 'deck_minna2', '領収書', 'りょうしゅうしょ', 'to''lov kvitansiyasi, chek', 'りょうしゅうしょ - ryoushuusho', '領収書を ください。 (Kvitansiya bering.)', 'N4', 356),
  ('m2_357', 'deck_minna2', '中止', 'ちゅうし', 'to''xtatish, bekor qilish', 'ちゅうし - chiushi', '雨で 試合は 中止です。 (Yomg''ir tufayli musobaqa bekor qilindi.)', 'N4', 357),
  ('m2_358', 'deck_minna2', '110番', 'ひゃくとおばん', '110 raqami (militsiya/politsiya chaqirish)', 'ひゃくとおばん - hyakutooban', '事件の 時は 110番に かけます。 (Voqea sodir bo''lganda 110 ga qo''ng''iroq qilinadi.)', 'N4', 358),
  ('m2_359', 'deck_minna2', '119番', 'ひゃくじゅうきゅうばん', '119 raqami (tez yordam va o''t o''chiruvchilar)', 'ひゃくじゅうきゅうばん - hyakujuukyuuban', '火事の 時は 119番です。 (Yong''inda 119 raqamiga qo''ng''iroq qilinadi.)', 'N4', 359),
  ('m2_360', 'deck_minna2', '楽しみにしています', 'たのしみにしています', 'intiqlik bilan kutmoq', 'たのしみにしています - tanoshiminishiteimasu', '会えるのを 楽しみに して います。 (Uchrashishni intiqlik bilan kutmoqdaman.)', 'N4', 360),
  ('m2_361', 'deck_minna2', '返金します', 'へんきんします', 'pulni qaytarib bermoq', 'へんきんします - henkinshimasu', '領収書が あれば、返金いたします。 (Chek bo''lsa, pulingizni qaytarib beramiz.)', 'N4', 361),
  ('m2_362', 'deck_minna2', 'レシート', 'れしーと', 'kassa cheki', 'れしーと - reshi-to', 'レシートを なくして しまいました。 (Chekni yo''qotib qo''yibman.)', 'N4', 362),
  ('m2_363', 'deck_minna2', '連絡先', 'れんらくさき', 'aloqa ma''lumotlari (telefon, manzil)', 'れんらくさき - renrakusaki', '緊急の 連絡先を 教えて ください。 (Favqulodda aloqa raqamingizni ayting.)', 'N4', 363),
  ('m2_364', 'deck_minna2', '都合', 'つごう', 'sharoit, qulaylik', 'つごう - tsugou', '都合が 悪い 場合は、事前に ご連絡ください。 (Vaqtingiz bo''lmasa oldindan xabar qiling.)', 'N4', 364),
  ('m2_365', 'deck_minna2', '約束', 'やくそく', 'va''da, kelishuv', 'やくそく - yakusoku', '約束したのに、彼は 来なかった。 (Vadasiga qaramasdan u kelmadi.)', 'N4', 365),
  ('m2_366', 'deck_minna2', '一生懸命', 'いっしょうけんめい', 'bor kuch bilan, sidqidildan', 'いっしょうけんめい - ishoukenmei', '一生懸命 勉強したのに、不合格でした。 (Bor kuchim bilan o''qigan bo''lsam ham o''ta olmadim.)', 'N4', 366),
  ('m2_367', 'deck_minna2', '渡します', 'わたします', 'topshirmoq, qo''liga tutqazmoq', 'わたします - watashimasu', '手紙を 渡します。 (Xatni topshiradi.)', 'N4', 367),
  ('m2_368', 'deck_minna2', '帰って来ます', 'かえってきます', 'qaytib kelmoq', 'かえってきます - kaetekimasu', '父が 帰って 来ました。 (Otam qaytib keldilar.)', 'N4', 368),
  ('m2_369', 'deck_minna2', '届きます', 'とどきます', 'yetib bormoq (pochta, jo''natma)', 'とどきます - todokimasu', '荷物が 届きました。 (Jo''natma yetib keldi.)', 'N4', 369),
  ('m2_370', 'deck_minna2', '留守', 'るす', 'uyda yo''qlik, bekorchilik', 'るす - rusu', '留守の 間に 荷物が 来ました。 (Uyda yo''qligimda jo''natma kelibdi.)', 'N4', 370),
  ('m2_371', 'deck_minna2', '宅配便', 'たくはいびん', 'yetkazib berish xizmati (kuryerlik)', 'たくはいびん - takuhaibin', '宅配便で 送ります。 (Kuryerlik xizmati orqali jo''natadi.)', 'N4', 371),
  ('m2_372', 'deck_minna2', '原因', 'げんいん', 'sabab, omil', 'げんいん - nin', '事故の 原因を 調べます。 (Avariya sababini o''rganadi.)', 'N4', 372),
  ('m2_373', 'deck_minna2', 'たった今', 'たったいま', 'ayni hozirgina, hozirning o''zida', 'たったいま - tataima', 'たった今 帰った ところです。 (Ayni hozirgina qaytib kelgan paytim edi.)', 'N4', 373),
  ('m2_374', 'deck_minna2', '今いいですか', 'いまいいですか', 'hozir vaqtingiz bormi?', 'いまいいですか - imaiidesuka', 'すみません、今 いいですか。 (Kechirasiz, hozir vaqtingiz bormi?)', 'N4', 374),
  ('m2_375', 'deck_minna2', '荷物', 'にもつ', 'yuk, posilka', 'にもつ - nitsu', '荷物を まとめている ところです。 (Yuklarimni yig''ishtirayotgan joyim edi.)', 'N4', 375),
  ('m2_376', 'deck_minna2', '結果', 'けっか', 'natija', 'けっか - keka', '明日 結果が 出る はずです。 (Ertaga natija chiqishi shubhasiz.)', 'N4', 376),
  ('m2_377', 'deck_minna2', '集まります', 'あつまります', 'yig''ilmoq, to''planmoq', 'あつまります - atsumarimasu', '人が たくさん 集まりました。 (Odamlar ko''p to''plandi.)', 'N4', 377),
  ('m2_378', 'deck_minna2', '別れます', 'わかれます', 'ajrashmoq, xayrlashmoq', 'わかれます - wakaremasu', '駅で 友だちと 別れました。 (Bekatda do''stim bilan xayrlashdim.)', 'N4', 378),
  ('m2_379', 'deck_minna2', '音', 'おと', 'tovush (jonsiz narsalar tovushi)', 'おと - oto', '変な 音が します。 (G''alati ovoz eshitilyapti.)', 'N4', 379),
  ('m2_380', 'deck_minna2', '婚約します', 'こんやくします', 'unashtirilmoq, unashtiruv', 'こんやくします - konyakushimasu', '二人は 婚約したそうです。 (Ular unashtirilgan ekan (eshitishimcha).)', 'N4', 380),
  ('m2_381', 'deck_minna2', '比べます', 'くらべます', 'solishtirmoq, qiyoslamoq', 'くらべます - kurabemasu', '昔と 今を 比べます。 (O''tmish bilan bugunni solishtiradi.)', 'N4', 381),
  ('m2_382', 'deck_minna2', '天気予報', 'てんきよほう', 'ob-havo ma''lumoti', 'てんきよほう - tenkiyohou', '天気予報に よると、明日は 晴れる そうです。 (Ob-havo ma''lumotiga ko''ra ertaga ochiq havo bo''larmish.)', 'N4', 382),
  ('m2_383', 'deck_minna2', 'ニュース', 'にゅーす', 'yangiliklar', 'にゅーす - nyu-su', 'ニュースに よると、地震が あった そうです。 (Yangiliklarga ko''ra zilzila bo''libdi.)', 'N4', 383),
  ('m2_384', 'deck_minna2', '事故', 'じこ', 'baxtsiz hodisa, avariya', 'じこ - jiko', '大きな 事故が 起きた ようです。 (Katta avariya yuz berganga o''xshaydi.)', 'N4', 384)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
-- @@CHUNK@@
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('m2_385', 'deck_minna2', 'パトカー', 'ぱとかー', 'politsiya mashinasi', 'ぱとかー - patoka-', 'パトカーの サイレンが 聞こえますね。 (Politsiya sirenasining ovozi eshitilyapti-a.)', 'N4', 385),
  ('m2_386', 'deck_minna2', '救急車', 'きゅうきゅうしゃ', 'tez yordam mashinasi', 'きゅうきゅうしゃ - kyuukyuusha', '救急車が 来たようです。 (Tez yordam yetib kelganga o''xshaydi.)', 'N4', 386),
  ('m2_387', 'deck_minna2', 'うわさ', 'うわさ', 'mish-mish', 'うわさ - uwasa', 'あの うわさは 本当の ようです。 (U mish-mish rostga o''xshaydi.)', 'N4', 387),
  ('m2_388', 'deck_minna2', '下ろします', 'おろします', 'tushirmoq (yukni)', 'おろします - oroshimasu', '荷物を 下ろします。 (Yukni tushiradi.)', 'N4', 388),
  ('m2_389', 'deck_minna2', '届けます', 'とどけます', 'yetkazib bermoq', 'とどけます - todokemasu', '書類を 届けます。 (Hujjatlarni yetkazib beradi.)', 'N4', 389),
  ('m2_390', 'deck_minna2', '嫌', 'いやな', 'yoqimsiz, istalmagan', 'いやな - iyana', '嫌な ことは やめましょう。 (Yoqimsiz narsani to''xtataylik.)', 'N4', 390),
  ('m2_391', 'deck_minna2', '厳しい', 'きびしい', 'qattiqqo''l, talabchan', 'きびしい - kibishii', '先生は とても 厳しいです。 (Ustoz juda talabchan.)', 'N4', 391),
  ('m2_392', 'deck_minna2', '塾', 'じゅく', 'tayyorlov kursi, qo''shimcha dars markazi', 'じゅく - juku', '子どもを 塾に 通わせます。 (Bolani qo''shimcha dars markaziga qatnatadi.)', 'N4', 392),
  ('m2_393', 'deck_minna2', 'スケジュール', 'スケジュール', 'jadval, reja', 'スケジュール - sukeji-ru', 'スケジュールを 確認します。 (Jadvalni tekshiradi.)', 'N4', 393),
  ('m2_394', 'deck_minna2', '生徒', 'せいと', 'o''quvchi (maktab o''quvchisi)', 'せいと - seito', '生徒に 本を 読ませます。 (O''quvchiga kitob o''qitadi.)', 'N4', 394),
  ('m2_395', 'deck_minna2', '意見', 'いけん', 'fikr, mulohaza', 'いけん - iken', '学生に 自由に 意見を 言わせます。 (Talabalarga erkin fikr bildirishga imkon beraman.)', 'N4', 395),
  ('m2_396', 'deck_minna2', '発表します', 'はっぴょうします', 'taqdimot qilmoq, e''lon qilmoq', 'はっぴょうします - hapyoushimasu', '新入社員に 発表させました。 (Yangi xodimlarga taqdimot qildirdim.)', 'N4', 396),
  ('m2_397', 'deck_minna2', '片づけ', 'かたづけ', 'yig''ishtirish, tartibga solish', 'かたづけ - katazuke', '子どもに 自分の 部屋を 片づけさせます。 (Farzandimga o''z xonasini yig''ishtirtiraman.)', 'N4', 397),
  ('m2_398', 'deck_minna2', '手伝い', 'てつだい', 'yordam', 'てつだい - tetsudai', '料理を 手伝わせました。 (Ovqat qilishda yordamlashishga jalb qildim.)', 'N4', 398),
  ('m2_399', 'deck_minna2', '買い物', 'かいもの', 'bozor-o''char, xarid', 'かいもの - kaino', '息子に 買い物に 行かせました。 (O''g''limni xaridga yubordim.)', 'N4', 399),
  ('m2_400', 'deck_minna2', 'コピー', 'こぴー', 'nusxa ko''chirish', 'こぴー - kopi-', '書類を コピーさせて いただけませんか。 (Hujjatlardan nusxa ko''chirib olsam maylimi?)', 'N4', 400),
  ('m2_401', 'deck_minna2', '有給休暇', 'ゆうきゅうきゅうか', 'haqli mehnat ta''tili', 'ゆうきゅうきゅうか - yuukyuukyuuka', '明日 休ませて いただけませんか。 (Ertaga dam olishimga ijozat bera olmaysizmi?)', 'N4', 401),
  ('m2_402', 'deck_minna2', '勤めます', 'つとめます', 'ishlamoq, xizmat qilmoq (kompaniyada)', 'つとめます - tsutomemasu', '銀行に 勤めて いらっしゃいます。 (Bankda xizmat qiladilar (hurmat).)', 'N4', 402),
  ('m2_403', 'deck_minna2', '過ごします', 'すごします', 'vaqt o''tkazmoq', 'すごします - sugoshimasu', '週末を どこで お過ごしに なりましたか。 (Dam olish kunlarini qayerda o''tkazdingiz? (hurmat))', 'N4', 403),
  ('m2_404', 'deck_minna2', 'いらっしゃいます', 'いらっしゃいます', 'boradilar / keladilar / borlar (行きます・来ます・います ning hurmat shakli)', 'いらっしゃいます - irashaimasu', '社長は 部屋に いらっしゃいます。 (Prezident xonadalar.)', 'N4', 404),
  ('m2_405', 'deck_minna2', '召し上がります', 'めしあがります', 'yeydilar / ichadilar (食べます・飲みます ning hurmat shakli)', 'めしあがります - meshiagarimasu', '何を 召し上がりますか。 (Nima tanovul qilasizlar?)', 'N4', 405),
  ('m2_406', 'deck_minna2', 'おっしゃいます', 'おっしゃいます', 'deydilar, aytadilar (言います ning hurmat shakli)', 'おっしゃいます - oshaimasu', '先生が そう おっしゃいました。 (Ustoz shunday dedilar.)', 'N4', 406),
  ('m2_407', 'deck_minna2', 'なさいます', 'なさいます', 'qiladilar (します ning hurmat shakli)', 'なさいます - nasaimasu', 'ゴルフを なさいますか。 (Golf o''ynaysizmi?)', 'N4', 407),
  ('m2_408', 'deck_minna2', 'ご覧に なります', 'ごらんになります', 'ko''radilar (見ます ning hurmat shakli)', 'ごらんになります - goranninarimasu', 'この 映画を ご覧に なりましたか。 (Bu filmni tomosha qildingizmi?)', 'N4', 408),
  ('m2_409', 'deck_minna2', 'ご存じです', 'ごぞんじです', 'biladilar (知っています ning hurmat shakli)', 'ごぞんじです - gozonjidesu', 'あの方を ご存じですか。 (Anavi kishini taniysizmi / bilasizmi?)', 'N4', 409),
  ('m2_410', 'deck_minna2', 'お名前', 'おなまえ', 'ism (hurmat bilan)', 'おなまえ - onamae', 'お名前は 何と おっしゃいますか。 (Ismingiz nima deb ataladi?)', 'N4', 410),
  ('m2_411', 'deck_minna2', 'ご住所', 'ごじゅうしょ', 'manzil (hurmat bilan)', 'ごじゅうしょ - gojuusho', 'こちらに ご住所を お書きに なって ください。 (Bu yerga manzilingizni yozib qo''ysangiz.)', 'N4', 411),
  ('m2_412', 'deck_minna2', '社長', 'しゃちょう', 'kompaniya prezidenti', 'しゃちょう - shachou', '社長は もう お帰りに なりました。 (Prezident janoblari allaqachon uylariga qaytdilar.)', 'N4', 412),
  ('m2_413', 'deck_minna2', '部長', 'ぶちょう', 'departament boshlig''i', 'ぶちょう - buchou', '部長が ゴルフを なさいます。 (Boshliq golf o''ynaydilar.)', 'N4', 413),
  ('m2_414', 'deck_minna2', '奥様', 'おくさま', 'boshqaning rafiqasi (juda hurmatli)', 'おくさま - okusama', '奥様も ご一緒に いらっしゃいますか。 (Rafiqa xonim ham birga tashrif buyuradilarmi?)', 'N4', 414),
  ('m2_415', 'deck_minna2', 'ご家族', 'ごかぞく', 'boshqaning oilasi', 'ごかぞく - gokazoku', 'ご家族の 皆様に よろしく お伝えください。 (Oilangiz a''zolariga salomimni yetkazing.)', 'N4', 415),
  ('m2_416', 'deck_minna2', '参ります', 'まいります', 'boraman / kelaman (行きます・来ます ning kamtarlik shakli)', 'まいります - mairimasu', '明日 9時に 参ります。 (Ertaga soat 9 da yetib boraman (kamtarlik bilan).)', 'N4', 416),
  ('m2_417', 'deck_minna2', 'おります', 'おります', 'turibman / borman (います ning kamtarlik shakli)', 'おります - orimasu', '東京に おります。 (Tokioda istiqomat qilyapman.)', 'N4', 417),
  ('m2_418', 'deck_minna2', '申します', 'もうします', 'deyilaman, aytaman (言います ning kamtarlik shakli)', 'もうします - ushimasu', 'ミラーと 申します。 (Meni Miller deb atashadi (ismim Miller).)', 'N4', 418),
  ('m2_419', 'deck_minna2', 'いたします', 'いたします', 'qilaman, bajaraman (します ning kamtarlik shakli)', 'いたします - itashimasu', 'わたしが 準備いたします。 (O''zim tayyorlayman.)', 'N4', 419),
  ('m2_420', 'deck_minna2', '拝見します', 'はいけんします', 'ko''raman, qarab chiqaman (見ます ning kamtarlik shakli)', 'はいけんします - haikenshimasu', '書類を 拝見します。 (Hujjatlarni ehtirom bilan ko''rib chiqaman.)', 'N4', 420),
  ('m2_421', 'deck_minna2', '存じます', 'ぞんじます', 'bilaman / o''ylayman (知っています・思います ning kamtarlik shakli)', 'ぞんじます - zonjimasu', '存じて おります。 (Bilaman, xabardorman.)', 'N4', 421),
  ('m2_422', 'deck_minna2', '伺います', 'うかがいます', 'so''rayman / tashrif buyuraman (聞きます・行きます ning kamtarlik shakli)', 'うかがいます - ukagaimasu', '明日 お宅へ 伺います。 (Ertaga xonadoningizga tashrif buyuraman.)', 'N4', 422),
  ('m2_423', 'deck_minna2', 'お目に掛かります', 'おめにかかります', 'uchrashaman (会います ning kamtarlik shakli)', 'おめにかかります - omenikakarimasu', '社長に お目に 掛かりました。 (Prezident janoblari bilan uchrashdim.)', 'N4', 423),
  ('m2_424', 'deck_minna2', '私', 'わたくし', 'men (わたし ning rasmiy va kamtar shakli)', 'わたくし - watakushi', '私が 担当いたします。 (Men o''zim mas''ul bo''laman.)', 'N4', 424),
  ('m2_425', 'deck_minna2', '私ども', 'わたくしども', 'biz (kamtarlik shakli)', 'わたくしども - watakushido', '私どもが ご案内いたします。 (Biz sizga hamrohlik qilamiz.)', 'N4', 425),
  ('m2_426', 'deck_minna2', 'ご案内します', 'ごあんないします', 'kuzatib bormoq, tanishtirmoq (kamtarlik)', 'ごあんないします - goannaishimasu', '会議室へ ご案内いたします。 (Majlislar zaliga kuzatib qo''yaman.)', 'N4', 426),
  ('m2_427', 'deck_minna2', 'お伝えします', 'おつたえします', 'yetkazmoq (kamtarlik)', 'おつたえします - otsutaeshimasu', '部長に お伝えいたします。 (Boshliqqa yetkazib qo''yaman.)', 'N4', 427),
  ('n3t_1', 'deck_n3_thematic', '方 (かた)', 'kata', 'Kishi, inson (hurmat shakli)', 'kata', 'あの方は先生です。', 'N3', 1),
  ('n3t_2', 'deck_n3_thematic', 'チラシ', 'chirashi', 'Reklama varaqasi, flayer', 'chirashi', 'チラシを見ました。', 'N3', 2),
  ('n3t_3', 'deck_n3_thematic', 'ホームページ', 'hōmupēji', 'Veb-sayt, bosh sahifa', 'hōmupēji', 'ホームページを見ます。', 'N3', 3),
  ('n3t_4', 'deck_n3_thematic', '学生証 (がくせいしょう)', 'gakuseishō', 'Talabalik guvohnomasi', 'gakuseishō', '学生証を見せます。', 'N3', 4),
  ('n3t_5', 'deck_n3_thematic', '面接 (めんせつ)', 'mensetsu', 'Suhbat, intervyu', 'mensetsu', '明日、面接があります。', 'N3', 5),
  ('n3t_6', 'deck_n3_thematic', '履歴書 (りれきしょ)', 'rirekisho', 'Rezyume, CV', 'rirekisho', '履歴書を書きます。', 'N3', 6),
  ('n3t_7', 'deck_n3_thematic', '希望する (きぼうする)', 'kibō suru', 'Istamoq, xohlamoq', 'kibō suru', '東京で働くことを希望します。', 'N3', 7),
  ('n3t_8', 'deck_n3_thematic', '募集する (ぼしゅうする)', 'boshū suru', 'Ishchi qidirmoq,募集 qilmoq', 'boshū suru', '会社が社員を募集しています。', 'N3', 8),
  ('n3t_9', 'deck_n3_thematic', '思い出す (おもいだす)', 'omoidasu', 'Eslamoq, yodga tushirmoq', 'omoidasu', '昔のことを思い出しました。', 'N3', 9),
  ('n3t_10', 'deck_n3_thematic', '入力する (にゅうりょくする)', 'nyūryoku suru', 'Ma''lumot kiritmoq', 'nyūryoku suru', '名前を入力します。', 'N3', 10),
  ('n3t_11', 'deck_n3_thematic', 'それでは', 'soredewa', 'Unda, yaxshi unda', 'soredewa', 'それでは、始めましょう。', 'N3', 11),
  ('n3t_12', 'deck_n3_thematic', 'いらっしゃいます', 'irasshaimasu', 'Bormoq, kelmoq, bo''lmoq (hurmat shakli)', 'irasshaimasu', '先生はいらっしゃいますか。', 'N3', 12),
  ('n3t_13', 'deck_n3_thematic', '申します (もうします)', 'mōshimasu', 'Ismim..., deb atalaman (kamtarlik shakli)', 'mōshimasu', '田中と申します。', 'N3', 13),
  ('n3t_14', 'deck_n3_thematic', '参ります (まいります)', 'mairimasu', 'Bormoq, kelmoq (kamtarlik shakli)', 'mairimasu', '明日、会社へ参ります。', 'N3', 14),
  ('n3t_15', 'deck_n3_thematic', '少々お待ちください (しょうしょうおまちください)', 'shōshō omachi kudasai', 'Iltimos, biroz kuting', 'shōshō omachi kudasai', '少々お待ちください。', 'N3', 15),
  ('n3t_16', 'deck_n3_thematic', 'お先に失礼します (おさきにしつれいします)', 'osaki ni shitsurei shimasu', 'Sizdan oldin ketayotganim uchun uzr', 'osaki ni shitsurei shimasu', 'お先に失礼します。', 'N3', 16),
  ('n3t_17', 'deck_n3_thematic', 'こちらへどうぞ', 'kochira e dōzo', 'Bu yoqqa marhamat', 'kochira e dōzo', 'こちらへどうぞ。', 'N3', 17),
  ('n3t_18', 'deck_n3_thematic', '失礼します (しつれいします)', 'shitsurei shimasu', 'Uzr, ruxsatingiz bilan', 'shitsurei shimasu', '失礼します。', 'N3', 18),
  ('n3t_19', 'deck_n3_thematic', 'よろしくお願いいたします (よろしくおねがいいたします)', 'yoroshiku onegai itashimasu', 'Siz bilan yaxshi hamkorlik qilishni kutaman', 'yoroshiku onegai itashimasu', 'よろしくお願いいたします。', 'N3', 19),
  ('n3t_20', 'deck_n3_thematic', '楽器 (がっき)', 'gakki', 'Musiqa asbobi', 'gakki', 'ギターは楽器です。', 'N3', 20),
  ('n3t_21', 'deck_n3_thematic', '建物 (たてもの)', 'tatemono', 'Bino, imorat', 'tatemono', 'あの建物は大きいです。', 'N3', 21),
  ('n3t_22', 'deck_n3_thematic', '歴史 (れきし)', 'rekishi', 'Tarix', 'rekishi', '日本の歴史を勉強します。', 'N3', 22),
  ('n3t_23', 'deck_n3_thematic', '意見 (いけん)', 'iken', 'Fikr, nuqtai nazar', 'iken', '私の意見を言います。', 'N3', 23),
  ('n3t_24', 'deck_n3_thematic', 'お年寄り (おとしより)', 'otoshiyori', 'Keksa odam, qariya', 'otoshiyori', 'お年寄りに親切にします。', 'N3', 24),
  ('n3t_25', 'deck_n3_thematic', '言葉 (ことば)', 'kotoba', 'So''z, til, ibora', 'kotoba', 'この言葉の意味は何ですか。', 'N3', 25),
  ('n3t_26', 'deck_n3_thematic', '自分 (じぶん)', 'jibun', 'O''zi, o''z', 'jibun', '自分でします。', 'N3', 26),
  ('n3t_27', 'deck_n3_thematic', '話 (はなし)', 'hanashi', 'Suhbat, gap, hikoya', 'hanashi', '友達と話をしました。', 'N3', 27),
  ('n3t_28', 'deck_n3_thematic', '野外ライブ (やがいライブ)', 'yagai raibu', 'Ochiq havodagi jonli konsert', 'yagai raibu', '野外ライブに行きました。', 'N3', 28),
  ('n3t_29', 'deck_n3_thematic', '～個 (～こ)', '~ko', 'Dona uchun hisob so''zi', '~ko', 'りんごを三個買いました。', 'N3', 29),
  ('n3t_30', 'deck_n3_thematic', '聞き取る (ききとる)', 'kikitoru', 'Eshitib tushunmoq', 'kikitoru', '日本語を聞き取ります。', 'N3', 30),
  ('n3t_31', 'deck_n3_thematic', '覚える (おぼえる)', 'oboeru', 'Yodlamoq, eslab qolmoq', 'oboeru', '新しい言葉を覚えます。', 'N3', 31),
  ('n3t_32', 'deck_n3_thematic', '応援する (おうえんする)', 'ōen suru', 'Qo''llab-quvvatlamoq, dalda bermoq', 'ōen suru', '友達を応援します。', 'N3', 32),
  ('n3t_33', 'deck_n3_thematic', 'サイクリングする', 'saikuringu suru', 'Velosiped haydamoq', 'saikuringu suru', '週末にサイクリングします。', 'N3', 33),
  ('n3t_34', 'deck_n3_thematic', '遅い (おそい)', 'osoi', 'Sekin, kech', 'osoi', 'この車は遅いです。', 'N3', 34),
  ('n3t_35', 'deck_n3_thematic', '速い (はやい)', 'hayai', 'Tez', 'hayai', 'この電車は速いです。', 'N3', 35),
  ('n3t_36', 'deck_n3_thematic', 'つまらない', 'tsumaranai', 'Zerikarli', 'tsumaranai', 'この映画はつまらないです。', 'N3', 36),
  ('n3t_37', 'deck_n3_thematic', '得意 (とくい)', 'tokui', 'Yaxshi bilmoq, mohir bo''lmoq', 'tokui', '私は料理が得意です。', 'N3', 37),
  ('n3t_38', 'deck_n3_thematic', '苦手 (にがて)', 'nigate', 'Yaxshi emas, qiynalmoq', 'nigate', '私は英語が苦手です。', 'N3', 38),
  ('n3t_39', 'deck_n3_thematic', '無理 (むり)', 'muri', 'Imkonsiz, uddalab bo''lmaydigan', 'muri', '無理をしないでください。', 'N3', 39),
  ('n3t_40', 'deck_n3_thematic', '朝早く (あさはやく)', 'asa hayaku', 'Ertalab juda erta', 'asa hayaku', '朝早く起きます。', 'N3', 40),
  ('n3t_41', 'deck_n3_thematic', 'もう一度聞こう (もういちどきこう)', 'mō ichido kikō', 'Yana bir marta eshitaylik', 'mō ichido kikō', 'もう一度聞きましょう。', 'N3', 41),
  ('n3t_42', 'deck_n3_thematic', '字幕 (じまく)', 'jimaku', 'Subtitr', 'jimaku', '字幕を見ます。', 'N3', 42),
  ('n3t_43', 'deck_n3_thematic', '大好き (だいすき)', 'daisuki', 'Juda yaxshi ko''rmoq', 'daisuki', '日本料理が大好きです。', 'N3', 43),
  ('n3t_44', 'deck_n3_thematic', 'まず', 'mazu', 'Avvalo, birinchi navbatda', 'mazu', 'まず勉強しましょう。', 'N3', 44),
  ('n3t_45', 'deck_n3_thematic', '恥ずかしい (はずかしい)', 'hazukashii', 'Uyalmok, noqulay his qilmoq', 'hazukashii', '人の前で話すのは恥ずかしいです。', 'N3', 45),
  ('n3t_46', 'deck_n3_thematic', '次 (つぎ)', 'tsugi', 'Keyingi, navbatdagi', 'tsugi', '次の駅で降ります。', 'N3', 46),
  ('n3t_47', 'deck_n3_thematic', 'うれしい', 'ureshii', 'Xursand, mamnun', 'ureshii', 'プレゼントをもらって、うれしいです。', 'N3', 47),
  ('n3t_48', 'deck_n3_thematic', '画面 (がめん)', 'gamen', 'Ekran', 'gamen', '画面を見てください。', 'N3', 48),
  ('n3t_49', 'deck_n3_thematic', '腕時計 (うでどけい)', 'udedokei', 'Qo''l soati', 'udedokei', '腕時計を買いました。', 'N3', 49),
  ('n3t_50', 'deck_n3_thematic', 'セーター', 'sētā', 'Sviter', 'sētā', 'このセーターが好きです。', 'N3', 50),
  ('n3t_51', 'deck_n3_thematic', 'スーツケース', 'sūtsukēsu', 'Chamadon', 'sūtsukēsu', 'スーツケースを持っています。', 'N3', 51),
  ('n3t_52', 'deck_n3_thematic', 'コート', 'kōto', 'Palto', 'kōto', 'コートを着ます。', 'N3', 52),
  ('n3t_53', 'deck_n3_thematic', '棚 (たな)', 'tana', 'Tokcha, javon', 'tana', '本を棚に置きます。', 'N3', 53),
  ('n3t_54', 'deck_n3_thematic', '指輪 (ゆびわ)', 'yubiwa', 'Uzuk', 'yubiwa', '指輪を買いました。', 'N3', 54),
  ('n3t_55', 'deck_n3_thematic', 'サイズ', 'saizu', 'O''lcham, razmer', 'saizu', 'このサイズは大きいです。', 'N3', 55),
  ('n3t_56', 'deck_n3_thematic', '数字 (すうじ)', 'sūji', 'Raqam, son', 'sūji', '数字を書いてください。', 'N3', 56),
  ('n3t_57', 'deck_n3_thematic', 'ヒール', 'hīru', 'Poshna', 'hīru', 'この靴はヒールが高いです。', 'N3', 57),
  ('n3t_58', 'deck_n3_thematic', 'ボタン', 'botan', 'Tugma', 'botan', 'ボタンを押してください。', 'N3', 58),
  ('n3t_59', 'deck_n3_thematic', 'ジーンズ', 'jīnzu', 'Jinsi shim', 'jīnzu', 'ジーンズをはいています。', 'N3', 59),
  ('n3t_60', 'deck_n3_thematic', '売り場 (うりば)', 'uriba', 'Sotuv bo''limi, savdo joyi', 'uriba', '靴の売り場はどこですか。', 'N3', 60),
  ('n3t_61', 'deck_n3_thematic', '動く (うごく)', 'ugoku', 'Harakatlanmoq', 'ugoku', '時計が動いています。', 'N3', 61),
  ('n3t_62', 'deck_n3_thematic', '説明する (せつめいする)', 'setsumei suru', 'Tushuntirmoq', 'setsumei suru', '店員が説明します。', 'N3', 62),
  ('n3t_63', 'deck_n3_thematic', '配達する (はいたつする)', 'haitatsu suru', 'Yetkazib bermoq', 'haitatsu suru', '荷物を配達します。', 'N3', 63),
  ('n3t_64', 'deck_n3_thematic', '重い (おもい)', 'omoi', 'Og''ir', 'omoi', 'このかばんは重いです。', 'N3', 64),
  ('n3t_65', 'deck_n3_thematic', '軽い (かるい)', 'karui', 'Yengil', 'karui', 'このかばんは軽いです。', 'N3', 65),
  ('n3t_66', 'deck_n3_thematic', 'ちょうどいい', 'chōdo ii', 'Aynan mos, juda yaxshi mos keladigan', 'chōdo ii', 'このサイズはちょうどいいです。', 'N3', 66),
  ('n3t_67', 'deck_n3_thematic', '丈夫 (じょうぶ)', 'jōbu', 'Mustahkam, chidamli', 'jōbu', 'このかばんは丈夫です。', 'N3', 67),
  ('n3t_68', 'deck_n3_thematic', 'もっと', 'motto', 'Yana, ko''proq', 'motto', 'もっと大きいのがほしいです。', 'N3', 68),
  ('n3t_69', 'deck_n3_thematic', 'もっと大きいかばんがほしいです。', 'motto ōkii kaban ga hoshii desu', 'Kattaroq sumka xohlayman.', 'motto ōkii kaban ga hoshii desu', 'もっと大きいかばんがほしいです。', 'N3', 69),
  ('n3t_70', 'deck_n3_thematic', 'ちょっと', 'chotto', 'Biroz, ozgina', 'chotto', 'ちょっと待ってください。', 'N3', 70),
  ('n3t_71', 'deck_n3_thematic', 'いかがですか', 'ikaga desu ka', 'Qanday? Yoqdimi?', 'ikaga desu ka', 'この靴はいかがですか。', 'N3', 71),
  ('n3t_72', 'deck_n3_thematic', 'かしこまりました', 'kashikomarimashita', 'Tushundim, xo''p bo''ladi (kamtarlik shakli)', 'kashikomarimashita', 'はい、かしこまりました。', 'N3', 72),
  ('n3t_73', 'deck_n3_thematic', '壁 (かべ)', 'kabe', 'Devor', 'kabe', '壁に写真があります。', 'N3', 73),
  ('n3t_74', 'deck_n3_thematic', 'カレンダー', 'karendā', 'Kalendar', 'karendā', 'カレンダーを見ます。', 'N3', 74),
  ('n3t_75', 'deck_n3_thematic', '世界地図 (せかいちず)', 'sekai chizu', 'Dunyo xaritasi', 'sekai chizu', '世界地図を見ます。', 'N3', 75),
  ('n3t_76', 'deck_n3_thematic', '最新 (さいしん)', 'saishin', 'Eng yangi, so''nggi', 'saishin', 'これは最新のモデルです。', 'N3', 76),
  ('n3t_77', 'deck_n3_thematic', '飲み放題 (のみほうだい)', 'nomihōdai', 'Cheksiz ichimlik', 'nomihōdai', 'ここは飲み放題です。', 'N3', 77)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('n3t_78', 'deck_n3_thematic', '期間限定 (きかんげんてい)', 'kikan gentei', 'Cheklangan muddat, vaqtinchalik', 'kikan gentei', 'これは期間限定です。', 'N3', 78),
  ('n3t_79', 'deck_n3_thematic', 'セット', 'setto', 'Set, to''plam', 'setto', 'セットを注文します。', 'N3', 79),
  ('n3t_80', 'deck_n3_thematic', 'フロアガイド', 'furoa gaido', 'Qavatlar xaritasi, yo''nalish ko''rsatmasi', 'furoa gaido', 'フロアガイドを見ます。', 'N3', 80),
  ('n3t_81', 'deck_n3_thematic', '意味 (いみ)', 'imi', 'Ma''no', 'imi', 'この言葉の意味は何ですか。', 'N3', 81),
  ('n3t_82', 'deck_n3_thematic', '営業中 (えいぎょうちゅう)', 'eigyōchū', 'Ochiq, ishlayotgan', 'eigyōchū', '店は営業中です。', 'N3', 82),
  ('n3t_83', 'deck_n3_thematic', '大盛り (おおもり)', 'ōmori', 'Katta porsiya', 'ōmori', 'ご飯を大盛りにします。', 'N3', 83),
  ('n3t_84', 'deck_n3_thematic', 'おかわり', 'okawari', 'Qo''shimcha porsiya, yana olish', 'okawari', 'ご飯をおかわりします。', 'N3', 84),
  ('n3t_85', 'deck_n3_thematic', '送料 (そうりょう)', 'sōryō', 'Yetkazib berish to''lovi', 'sōryō', '送料はいくらですか。', 'N3', 85),
  ('n3t_86', 'deck_n3_thematic', 'タイムサービス', 'taimu sābisu', 'Qisqa muddatli aksiya', 'taimu sābisu', '今、タイムサービスです。', 'N3', 86),
  ('n3t_87', 'deck_n3_thematic', '定休日 (ていきゅうび)', 'teikyūbi', 'Dam olish kuni, doimiy yopiq kun', 'teikyūbi', '月曜日は定休日です。', 'N3', 87),
  ('n3t_88', 'deck_n3_thematic', '本日 (ほんじつ)', 'honjitsu', 'Bugun (rasmiy uslub)', 'honjitsu', '本日は休みです。', 'N3', 88),
  ('n3t_89', 'deck_n3_thematic', '半額 (はんがく)', 'hangaku', 'Yarim narx', 'hangaku', '今日は半額です。', 'N3', 89),
  ('n3t_90', 'deck_n3_thematic', 'レディースデー', 'redīsu dē', 'Ayollar kuni', 'redīsu dē', '今日はレディースデーです。', 'N3', 90),
  ('n3t_91', 'deck_n3_thematic', '量 (りょう)', 'ryō', 'Miqdor, hajm', 'ryō', 'ご飯の量が多いです。', 'N3', 91),
  ('n3t_92', 'deck_n3_thematic', '親子丼 (おやこどん)', 'oyakodon', 'Tovuq va tuxumli guruchli taom', 'oyakodon', '親子丼を食べます。', 'N3', 92),
  ('n3t_93', 'deck_n3_thematic', '牛丼 (ぎゅうどん)', 'gyūdon', 'Mol go''shtli guruchli taom', 'gyūdon', '牛丼を食べました。', 'N3', 93),
  ('n3t_94', 'deck_n3_thematic', 'サンドイッチ', 'sandoicchi', 'Sendvich', 'sandoicchi', 'サンドイッチを食べます。', 'N3', 94),
  ('n3t_95', 'deck_n3_thematic', 'ソース', 'sōsu', 'Sous', 'sōsu', 'ソースをかけます。', 'N3', 95),
  ('n3t_96', 'deck_n3_thematic', '～券 (～けん)', '~ken', 'Chipta, kupon', '~ken', '割引券を使います。', 'N3', 96),
  ('n3t_97', 'deck_n3_thematic', 'かける', 'kakeru', 'Ilmoq, osmoq; ustiga solmoq', 'kakeru', 'カレンダーをかけます。', 'N3', 97),
  ('n3t_98', 'deck_n3_thematic', '貼る (はる)', 'haru', 'Yopishtirmoq', 'haru', '写真を壁に貼ります。', 'N3', 98),
  ('n3t_99', 'deck_n3_thematic', '注文する (ちゅうもんする)', 'chūmon suru', 'Buyurtma bermoq', 'chūmon suru', 'ラーメンを注文します。', 'N3', 99),
  ('n3t_100', 'deck_n3_thematic', '割引する (わりびきする)', 'waribiki suru', 'Chegirma qilmoq', 'waribiki suru', '今日は割引します。', 'N3', 100),
  ('n3t_101', 'deck_n3_thematic', '両替する (りょうがえする)', 'ryōgae suru', 'Pulni maydalamoq, valyuta almashtirmoq', 'ryōgae suru', 'お金を両替します。', 'N3', 101),
  ('n3t_102', 'deck_n3_thematic', '得 (とく)', 'toku', 'Foydali, tejamli, manfaatli', 'toku', 'このセットは得です。', 'N3', 102),
  ('n3t_103', 'deck_n3_thematic', '特別 (とくべつ)', 'tokubetsu', 'Maxsus, alohida', 'tokubetsu', '今日は特別な日です。', 'N3', 103),
  ('n3t_104', 'deck_n3_thematic', 'どういう', 'dō iu', 'Qanday, qanday turdagi', 'dō iu', 'どういう意味ですか。', 'N3', 104),
  ('n3t_105', 'deck_n3_thematic', 'もう', 'mō', 'Yana, boshqa; allaqachon', 'mō', 'もう一つください。', 'N3', 105),
  ('n3t_106', 'deck_n3_thematic', 'もう一杯 (もういっぱい)', 'mō ippai', 'Yana bir stakan/kosa', 'mō ippai', 'もう一杯ください。', 'N3', 106),
  ('n3t_107', 'deck_n3_thematic', '大変 (たいへん)', 'taihen', 'Juda, nihoyatda; qiyin', 'taihen', '今日は大変です。', 'N3', 107),
  ('n3t_108', 'deck_n3_thematic', 'デザート', 'dezāto', 'Desert', 'dezāto', 'デザートを食べます。', 'N3', 108),
  ('n3t_109', 'deck_n3_thematic', '笑顔 (えがお)', 'egao', 'Tabassum, kulgan yuz', 'egao', '笑顔で話します。', 'N3', 109),
  ('n3t_110', 'deck_n3_thematic', '悲しい (かなしい)', 'kanashii', 'Xafa, g''amgin', 'kanashii', '今日は悲しいです。', 'N3', 110),
  ('n3t_111', 'deck_n3_thematic', '給料 (きゅうりょう)', 'kyūryō', 'Oylik maosh', 'kyūryō', '給料をもらいました。', 'N3', 111),
  ('n3t_112', 'deck_n3_thematic', 'サークル', 'sākuru', 'Klub, guruh', 'sākuru', '大学のサークルに入ります。', 'N3', 112),
  ('n3t_113', 'deck_n3_thematic', '説明会 (せつめいかい)', 'setsumeikai', 'Tushuntirish yig''ilishi, tanishtiruv uchrashuvi', 'setsumeikai', '説明会に行きます。', 'N3', 113),
  ('n3t_114', 'deck_n3_thematic', '専門学校 (せんもんがっこう)', 'senmon gakkō', 'Kasb-hunar maktabi, ixtisoslashgan maktab', 'senmon gakkō', '専門学校で勉強します。', 'N3', 114),
  ('n3t_115', 'deck_n3_thematic', '見学会 (けんがくかい)', 'kengakukai', 'Tanishuv tashrifi, kuzatuv ekskursiyasi', 'kengakukai', '学校の見学会に行きます。', 'N3', 115),
  ('n3t_116', 'deck_n3_thematic', '学部 (がくぶ)', 'gakubu', 'Fakultet, akademik bo''lim', 'gakubu', '私は工学部です。', 'N3', 116),
  ('n3t_117', 'deck_n3_thematic', '経済 (けいざい)', 'keizai', 'Iqtisod, iqtisodiyot', 'keizai', '経済を勉強します。', 'N3', 117),
  ('n3t_118', 'deck_n3_thematic', '法律 (ほうりつ)', 'hōritsu', 'Qonun, huquq', 'hōritsu', '法律を勉強しています。', 'N3', 118),
  ('n3t_119', 'deck_n3_thematic', 'カナダ', 'Kanada', 'Kanada', 'Kanada', 'カナダに行きたいです。', 'N3', 119),
  ('n3t_120', 'deck_n3_thematic', '聴解 (ちょうかい)', 'chōkai', 'Tinglab tushunish', 'chōkai', '聴解の練習をします。', 'N3', 120),
  ('n3t_121', 'deck_n3_thematic', 'アクセサリー', 'akusesarī', 'Aksessuar', 'akusesarī', 'アクセサリーを買いました。', 'N3', 121),
  ('n3t_122', 'deck_n3_thematic', '一生懸命 (いっしょうけんめい)', 'isshōkenmei', 'Bor kuchi bilan, astoydil', 'isshōkenmei', '一生懸命勉強します。', 'N3', 122),
  ('n3t_123', 'deck_n3_thematic', '答え (こたえ)', 'kotae', 'Javob', 'kotae', '答えを書きます。', 'N3', 123),
  ('n3t_124', 'deck_n3_thematic', '試験 (しけん)', 'shiken', 'Imtihon', 'shiken', '明日、試験があります。', 'N3', 124),
  ('n3t_125', 'deck_n3_thematic', '将来 (しょうらい)', 'shōrai', 'Kelajak', 'shōrai', '将来、日本で働きたいです。', 'N3', 125),
  ('n3t_126', 'deck_n3_thematic', 'ビジネス', 'bijinesu', 'Biznes, ish faoliyati', 'bijinesu', 'ビジネスを勉強します。', 'N3', 126),
  ('n3t_127', 'deck_n3_thematic', '日本語能力試験 (にほんごのうりょくしけん)', 'nihongo nōryoku shiken', 'Yapon tili darajasini aniqlash imtihoni (JLPT)', 'nihongo nōryoku shiken', '日本語能力試験を受けます。', 'N3', 127),
  ('n3t_128', 'deck_n3_thematic', '間違い (まちがい)', 'machigai', 'Xato, adashish', 'machigai', 'これは間違いです。', 'N3', 128),
  ('n3t_129', 'deck_n3_thematic', '寮 (りょう)', 'ryō', 'Talabalar yotoqxonasi', 'ryō', '寮に住んでいます。', 'N3', 129),
  ('n3t_130', 'deck_n3_thematic', '目標 (もくひょう)', 'mokuhyō', 'Maqsad, maqsadli ko''rsatkich', 'mokuhyō', '目標があります。', 'N3', 130),
  ('n3t_131', 'deck_n3_thematic', '～料 (～りょう)', '~ryō', 'To''lov, haq', '~ryō', '授業料を払います。', 'N3', 131),
  ('n3t_132', 'deck_n3_thematic', '翻訳する (ほんやくする)', 'honyaku suru', 'Tarjima qilmoq', 'honyaku suru', '日本語を翻訳します。', 'N3', 132),
  ('n3t_133', 'deck_n3_thematic', '調べる (しらべる)', 'shiraberu', 'Tekshirmoq, izlamoq, o''rganmoq', 'shiraberu', 'インターネットで調べます。', 'N3', 133),
  ('n3t_134', 'deck_n3_thematic', '見学する (けんがくする)', 'kengaku suru', 'Borib ko''rmoq, kuzatmoq', 'kengaku suru', '学校を見学します。', 'N3', 134),
  ('n3t_135', 'deck_n3_thematic', '相談する (そうだんする)', 'sōdan suru', 'Maslahatlashmoq', 'sōdan suru', '先生に相談します。', 'N3', 135),
  ('n3t_136', 'deck_n3_thematic', '貯金する (ちょきんする)', 'chokin suru', 'Pul jamg''armoq', 'chokin suru', '毎月、貯金します。', 'N3', 136),
  ('n3t_137', 'deck_n3_thematic', '留学する (りゅうがくする)', 'ryūgaku suru', 'Chet elda o''qimoq', 'ryūgaku suru', '日本に留学したいです。', 'N3', 137),
  ('n3t_138', 'deck_n3_thematic', '開く (ひらく)', 'hiraku', 'Ochmoq', 'hiraku', '店を開きます。', 'N3', 138),
  ('n3t_139', 'deck_n3_thematic', '自分の店を開く (じぶんのみせをひらく)', 'jibun no mise o hiraku', 'O''z do''konini ochmoq', 'jibun no mise o hiraku', '将来、自分の店を開きたいです。', 'N3', 139),
  ('n3t_140', 'deck_n3_thematic', '続ける (つづける)', 'tsuzukeru', 'Davom ettirmoq', 'tsuzukeru', '日本語の勉強を続けます。', 'N3', 140),
  ('n3t_141', 'deck_n3_thematic', 'やめる', 'yameru', 'To''xtatmoq, tashlamoq', 'yameru', '仕事をやめます。', 'N3', 141),
  ('n3t_142', 'deck_n3_thematic', '受ける (うける)', 'ukeru', 'Qabul qilmoq; imtihon topshirmoq', 'ukeru', '試験を受けます。', 'N3', 142),
  ('n3t_143', 'deck_n3_thematic', '案内する (あんないする)', 'annai suru', 'Yo''l ko''rsatmoq, yo''naltirmoq', 'annai suru', '駅まで案内します。', 'N3', 143),
  ('n3t_144', 'deck_n3_thematic', '進学する (しんがくする)', 'shingaku suru', 'Keyingi bosqichda o''qishni davom ettirmoq', 'shingaku suru', '大学に進学します。', 'N3', 144),
  ('n3t_145', 'deck_n3_thematic', '通学する (つうがくする)', 'tsūgaku suru', 'Maktab yoki universitetga qatnab o''qimoq', 'tsūgaku suru', '毎日、電車で通学します。', 'N3', 145),
  ('n3t_146', 'deck_n3_thematic', '選ぶ (えらぶ)', 'erabu', 'Tanlamoq', 'erabu', '大学を選びます。', 'N3', 146),
  ('n3t_147', 'deck_n3_thematic', '迷う (まよう)', 'mayou', 'Ikkilanmoq, qaror qila olmay qolmoq', 'mayou', 'どの大学にするか迷っています。', 'N3', 147),
  ('n3t_148', 'deck_n3_thematic', '考える (かんがえる)', 'kangaeru', 'O''ylamoq, o''ylab ko''rmoq', 'kangaeru', '将来について考えます。', 'N3', 148),
  ('n3t_149', 'deck_n3_thematic', '決める (きめる)', 'kimeru', 'Qaror qilmoq, belgilamoq', 'kimeru', '進学先を決めました。', 'N3', 149),
  ('n3t_150', 'deck_n3_thematic', '合格する (ごうかくする)', 'gōkaku suru', 'Imtihondan o''tmoq', 'gōkaku suru', '試験に合格しました。', 'N3', 150),
  ('n3t_151', 'deck_n3_thematic', '専攻する (せんこうする)', 'senkō suru', 'Mutaxassislik bo''yicha o''qimoq', 'senkō suru', '情報工学を専攻しています。', 'N3', 151),
  ('n3t_152', 'deck_n3_thematic', '悩む (なやむ)', 'nayamu', 'Tashvishlanmoq, qiynalmoq', 'nayamu', '将来のことで悩んでいます。', 'N3', 152),
  ('n3t_153', 'deck_n3_thematic', '就職する (しゅうしょくする)', 'shūshoku suru', 'Ishga joylashmoq', 'shūshoku suru', '日本で就職したいです。', 'N3', 153),
  ('n3t_154', 'deck_n3_thematic', '確認する (かくにんする)', 'kakunin suru', 'Tekshirmoq, tasdiqlamoq', 'kakunin suru', 'もう一度確認します。', 'N3', 154),
  ('n3t_155', 'deck_n3_thematic', '正しい (ただしい)', 'tadashii', 'To''g''ri', 'tadashii', 'この答えは正しいです。', 'N3', 155),
  ('n3t_156', 'deck_n3_thematic', '建築家 (けんちくか)', 'kenchikuka', 'Arxitektor', 'kenchikuka', '建築家になりたいです。', 'N3', 156),
  ('n3t_157', 'deck_n3_thematic', 'デザイナー', 'dezainā', 'Dizayner', 'dezainā', 'デザイナーになりたいです。', 'N3', 157),
  ('n3t_158', 'deck_n3_thematic', '夢 (ゆめ)', 'yume', 'Orzu, tush', 'yume', '私の夢は日本で働くことです。', 'N3', 158),
  ('n3t_159', 'deck_n3_thematic', 'スーツ', 'sūtsu', 'Kostyum', 'sūtsu', 'スーツを着ます。', 'N3', 159),
  ('n3t_160', 'deck_n3_thematic', '願書 (がんしょ)', 'gansho', 'Ariza, hujjat shakli', 'gansho', '願書を書きます。', 'N3', 160),
  ('n3t_161', 'deck_n3_thematic', '事務室 (じむしつ)', 'jimushitsu', 'Ofis, ma''muriyat xonasi', 'jimushitsu', '事務室へ行きます。', 'N3', 161),
  ('n3t_162', 'deck_n3_thematic', '書類 (しょるい)', 'shorui', 'Hujjatlar', 'shorui', '書類を出します。', 'N3', 162),
  ('n3t_163', 'deck_n3_thematic', '～中 (～じゅう)', '~jū', 'Davomida, ichida', '~jū', '今日中に終わります。', 'N3', 163),
  ('n3t_164', 'deck_n3_thematic', '経営する (けいえいする)', 'keiei suru', 'Boshqarmoq, biznes yuritmoq', 'keiei suru', '店を経営しています。', 'N3', 164),
  ('n3t_165', 'deck_n3_thematic', '体験する (たいけんする)', 'taiken suru', 'Tajriba orttirmoq, boshdan kechirmoq', 'taiken suru', '日本の生活を体験します。', 'N3', 165),
  ('n3t_166', 'deck_n3_thematic', '頑張る (がんばる)', 'ganbaru', 'Harakat qilmoq, bor kuchini bermoq', 'ganbaru', '毎日、頑張ります。', 'N3', 166),
  ('n3t_167', 'deck_n3_thematic', 'スピーチする', 'supīchi suru', 'Nutq so''zlamoq', 'supīchi suru', 'みんなの前でスピーチします。', 'N3', 167),
  ('n3t_168', 'deck_n3_thematic', '受験する (じゅけんする)', 'juken suru', 'Imtihon topshirmoq', 'juken suru', '大学を受験します。', 'N3', 168),
  ('n3t_169', 'deck_n3_thematic', '復習する (ふくしゅうする)', 'fukushū suru', 'Takrorlamoq, darsni qayta ko''rib chiqmoq', 'fukushū suru', '毎日、復習します。', 'N3', 169),
  ('n3t_170', 'deck_n3_thematic', '予習する (よしゅうする)', 'yoshū suru', 'Darsga oldindan tayyorlanmoq', 'yoshū suru', '授業の前に予習します。', 'N3', 170),
  ('n3t_171', 'deck_n3_thematic', 'デッサンする', 'dessan suru', 'Rasm eskizini chizmoq', 'dessan suru', '毎日、デッサンします。', 'N3', 171),
  ('n3t_172', 'deck_n3_thematic', '通訳 (つうやく)', 'tsūyaku', 'Og''zaki tarjima, tarjimonlik', 'tsūyaku', '通訳をします。', 'N3', 172),
  ('n3t_173', 'deck_n3_thematic', 'パティシエ', 'patishie', 'Qandolatchi, pastry chef', 'patishie', 'パティシエになりたいです。', 'N3', 173),
  ('n3t_174', 'deck_n3_thematic', '味 (あじ)', 'aji', 'Ta''m, maza', 'aji', 'この料理は味がいいです。', 'N3', 174),
  ('n3t_175', 'deck_n3_thematic', 'タコ', 'tako', 'Ahtapot', 'tako', 'タコを食べます。', 'N3', 175),
  ('n3t_176', 'deck_n3_thematic', 'たこ焼き (たこやき)', 'takoyaki', 'Takoyaki, ahtapotli yapon taomi', 'takoyaki', 'たこ焼きを食べます。', 'N3', 176),
  ('n3t_177', 'deck_n3_thematic', 'におい', 'nioi', 'Hid, is', 'nioi', 'いいにおいがします。', 'N3', 177),
  ('n3t_178', 'deck_n3_thematic', '～がする', '~ga suru', 'Hid yoki tovush sezilmoq', '~ga suru', 'いいにおいがします。', 'N3', 178),
  ('n3t_179', 'deck_n3_thematic', '通る (とおる)', 'tōru', 'Orqali o''tmoq', 'tōru', 'この道を通ります。', 'N3', 179),
  ('n3t_180', 'deck_n3_thematic', '似る (にる)', 'niru', 'O''xshamoq', 'niru', '二人はよく似ています。', 'N3', 180),
  ('n3t_181', 'deck_n3_thematic', '丸い (まるい)', 'marui', 'Dumaloq', 'marui', 'このテーブルは丸いです。', 'N3', 181),
  ('n3t_182', 'deck_n3_thematic', '小さな (ちいさな)', 'chiisana', 'Kichkina', 'chiisana', '小さな店があります。', 'N3', 182),
  ('n3t_183', 'deck_n3_thematic', '生活を楽しむ (せいかつをたのしむ)', 'seikatsu o tanoshimu', 'Hayotdan zavqlanmoq', 'seikatsu o tanoshimu', '日本の生活を楽しんでいます。', 'N3', 183),
  ('n3t_184', 'deck_n3_thematic', '美容院 (びよういん)', 'biyōin', 'Go''zallik saloni, sartaroshxona', 'biyōin', '美容院へ行きます。', 'N3', 184),
  ('n3t_185', 'deck_n3_thematic', '空港 (くうこう)', 'kūkō', 'Aeroport', 'kūkō', '空港へ行きます。', 'N3', 185),
  ('n3t_186', 'deck_n3_thematic', '歯科 (しか)', 'shika', 'Tish shifokori, stomatologiya', 'shika', '歯科へ行きます。', 'N3', 186),
  ('n3t_187', 'deck_n3_thematic', '市民 (しみん)', 'shimin', 'Shahar fuqarosi', 'shimin', '私はこの町の市民です。', 'N3', 187),
  ('n3t_188', 'deck_n3_thematic', '三味線 (しゃみせん)', 'shamisen', 'Shamisen, yapon musiqa asbobi', 'shamisen', '三味線を聞きました。', 'N3', 188),
  ('n3t_189', 'deck_n3_thematic', '種類 (しゅるい)', 'shurui', 'Tur, xil', 'shurui', 'いろいろな種類があります。', 'N3', 189),
  ('n3t_190', 'deck_n3_thematic', '水道 (すいどう)', 'suidō', 'Suv ta''minoti, kran suvi', 'suidō', '水道の水を飲みます。', 'N3', 190),
  ('n3t_191', 'deck_n3_thematic', 'てんぷら', 'tenpura', 'Tempura', 'tenpura', 'てんぷらを食べました。', 'N3', 191),
  ('n3t_192', 'deck_n3_thematic', '不動産 (ふどうさん)', 'fudōsan', 'Ko''chmas mulk', 'fudōsan', '不動産の仕事をしています。', 'N3', 192),
  ('n3t_193', 'deck_n3_thematic', '交流会 (こうりゅうかい)', 'kōryūkai', 'Madaniy almashinuv uchrashuvi', 'kōryūkai', '交流会に参加します。', 'N3', 193),
  ('n3t_194', 'deck_n3_thematic', '小学校 (しょうがっこう)', 'shōgakkō', 'Boshlang''ich maktab', 'shōgakkō', '弟は小学校に通っています。', 'N3', 194),
  ('n3t_195', 'deck_n3_thematic', '市役所 (しやくしょ)', 'shiyakusho', 'Shahar hokimiyati', 'shiyakusho', '市役所へ行きます。', 'N3', 195),
  ('n3t_196', 'deck_n3_thematic', '情報 (じょうほう)', 'jōhō', 'Ma''lumot, axborot', 'jōhō', 'インターネットで情報を調べます。', 'N3', 196),
  ('n3t_197', 'deck_n3_thematic', 'タオル', 'taoru', 'Sochiq', 'taoru', 'タオルを使います。', 'N3', 197)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('n3t_198', 'deck_n3_thematic', '茶道 (さどう)', 'sadō', 'Choy marosimi', 'sadō', '茶道を勉強しています。', 'N3', 198),
  ('n3t_199', 'deck_n3_thematic', 'センター', 'sentā', 'Markaz', 'sentā', 'センターへ行きます。', 'N3', 199),
  ('n3t_200', 'deck_n3_thematic', '～場 (～じょう)', '~jō', 'Joy, maydon', '~jō', 'サッカー場へ行きます。', 'N3', 200),
  ('n3t_201', 'deck_n3_thematic', '～口 (～ぐち)', '~guchi', 'Kirish yoki chiqish joyi', '~guchi', '西口で会いましょう。', 'N3', 201),
  ('n3t_202', 'deck_n3_thematic', 'かかる', 'kakaru', 'Vaqt ketmoq, sarflanmoq', 'kakaru', '駅まで10分かかります。', 'N3', 202),
  ('n3t_203', 'deck_n3_thematic', '質問する (しつもんする)', 'shitsumon suru', 'Savol bermoq', 'shitsumon suru', '先生に質問します。', 'N3', 203),
  ('n3t_204', 'deck_n3_thematic', 'カットする', 'katto suru', 'Soch kestirmoq, kesmoq', 'katto suru', '髪をカットします。', 'N3', 204),
  ('n3t_205', 'deck_n3_thematic', '紹介する (しょうかいする)', 'shōkai suru', 'Tanishtirmoq', 'shōkai suru', '友達を紹介します。', 'N3', 205),
  ('n3t_206', 'deck_n3_thematic', '修理する (しゅうりする)', 'shūri suru', 'Ta''mirlamoq', 'shūri suru', '自転車を修理します。', 'N3', 206),
  ('n3t_207', 'deck_n3_thematic', '知らせる (しらせる)', 'shiraseru', 'Xabar bermoq, bildirmoq', 'shiraseru', '友達に知らせます。', 'N3', 207),
  ('n3t_208', 'deck_n3_thematic', '止まる (とまる)', 'tomaru', 'To''xtamoq', 'tomaru', 'バスが止まりました。', 'N3', 208),
  ('n3t_209', 'deck_n3_thematic', '出る (でる)', 'deru', 'Chiqmoq; qatnamoq', 'deru', 'バスが出ます。', 'N3', 209),
  ('n3t_210', 'deck_n3_thematic', '着く (つく)', 'tsuku', 'Yetib kelmoq', 'tsuku', '駅に着きました。', 'N3', 210),
  ('n3t_211', 'deck_n3_thematic', '利用する (りようする)', 'riyō suru', 'Foydalanmoq', 'riyō suru', 'このサービスを利用します。', 'N3', 211),
  ('n3t_212', 'deck_n3_thematic', '必要 (ひつよう)', 'hitsuyō', 'Kerakli, zarur', 'hitsuyō', 'パスポートが必要です。', 'N3', 212),
  ('n3t_213', 'deck_n3_thematic', '行き方を教える (いきかたをおしえる)', 'ikikata o oshieru', 'Qanday borishni tushuntirmoq', 'ikikata o oshieru', '駅への行き方を教えてください。', 'N3', 213),
  ('n3t_214', 'deck_n3_thematic', '大使館 (たいしかん)', 'taishikan', 'Elchixona', 'taishikan', '大使館へ行きます。', 'N3', 214),
  ('n3t_215', 'deck_n3_thematic', 'メートル', 'mētoru', 'Metr', 'mētoru', '駅は100メートル先です。', 'N3', 215),
  ('n3t_216', 'deck_n3_thematic', '坂 (さか)', 'saka', 'Qiya yo''l, tepalik', 'saka', 'この坂は長いです。', 'N3', 216),
  ('n3t_217', 'deck_n3_thematic', '～階建て (～かいだて)', '~kaidate', '~ qavatli bino', '~kaidate', 'この建物は4階建てです。', 'N3', 217),
  ('n3t_218', 'deck_n3_thematic', '～番線 (～ばんせん)', '~bansen', '~-raqamli poyezd yoki metro liniyasi platformasi', '~bansen', '3番線で待ってください。', 'N3', 218),
  ('n3t_219', 'deck_n3_thematic', '～行き (～ゆき)', '~yuki', '~ tomon ketadigan, ~ yo''nalishidagi', '~yuki', '新宿行きの電車です。', 'N3', 219),
  ('n3t_220', 'deck_n3_thematic', '上る (のぼる)', 'noboru', 'Yuqoriga ko''tarilmoq', 'noboru', '坂を上ります。', 'N3', 220),
  ('n3t_221', 'deck_n3_thematic', '下りる (おりる)', 'oriru', 'Pastga tushmoq', 'oriru', '坂を下ります。', 'N3', 221),
  ('n3t_222', 'deck_n3_thematic', '駐車する (ちゅうしゃする)', 'chūsha suru', 'Avtomobilni park qilmoq', 'chūsha suru', 'ここに車を駐車します。', 'N3', 222),
  ('n3t_223', 'deck_n3_thematic', '中学校 (ちゅうがっこう)', 'chūgakkō', 'O''rta maktab', 'chūgakkō', '弟は中学校に通っています。', 'N3', 223),
  ('n3t_224', 'deck_n3_thematic', 'びっくり', 'bikkuri', 'Hayrat, ajablanish', 'bikkuri', 'びっくりしました。', 'N3', 224),
  ('n3t_225', 'deck_n3_thematic', '本当に (ほんとうに)', 'hontō ni', 'Haqiqatan ham, rostdan', 'hontō ni', '本当にありがとうございます。', 'N3', 225),
  ('n3t_226', 'deck_n3_thematic', 'もう少し (もうすこし)', 'mō sukoshi', 'Yana biroz, sal ko''proq', 'mō sukoshi', 'もう少し待ってください。', 'N3', 226),
  ('n3t_227', 'deck_n3_thematic', 'ゆっくり', 'yukkuri', 'Sekin, asta', 'yukkuri', 'ゆっくり話してください。', 'N3', 227),
  ('n3t_228', 'deck_n3_thematic', 'もう一度 (もういちど)', 'mō ichido', 'Yana bir marta', 'mō ichido', 'もう一度お願いします。', 'N3', 228),
  ('n3t_229', 'deck_n3_thematic', '白 (しろ)', 'shiro', 'Oq rang', 'shiro', '白い服を着ています。', 'N3', 229),
  ('n3t_230', 'deck_n3_thematic', '窓口 (まどぐち)', 'madoguchi', 'Kassa, xizmat oynasi', 'madoguchi', '窓口で聞きます。', 'N3', 230),
  ('n3t_231', 'deck_n3_thematic', '～号車 (～ごうしゃ)', '~gōsha', '~-raqamli vagon', '~gōsha', '三号車に乗ります。', 'N3', 231),
  ('n3t_232', 'deck_n3_thematic', '～ずつ', '~zutsu', 'Har biridan, teng miqdorda', '~zutsu', '一人に二つずつください。', 'N3', 232),
  ('n3t_233', 'deck_n3_thematic', '自然 (しぜん)', 'shizen', 'Tabiat', 'shizen', '自然がきれいです。', 'N3', 233),
  ('n3t_234', 'deck_n3_thematic', 'ラベンダー畑 (ラベンダーばたけ)', 'rabandā batake', 'Lavanda dalasi', 'rabandā batake', 'ラベンダー畑へ行きます。', 'N3', 234),
  ('n3t_235', 'deck_n3_thematic', '湿原 (しつげん)', 'shitsugen', 'Botqoqlik, namlik maydoni', 'shitsugen', '湿原を見ました。', 'N3', 235),
  ('n3t_236', 'deck_n3_thematic', '牧場 (ぼくじょう)', 'bokujō', 'Ferma, chorvachilik xo''jaligi', 'bokujō', '牧場へ行きます。', 'N3', 236),
  ('n3t_237', 'deck_n3_thematic', 'ジャガイモ', 'jagaimo', 'Kartoshka', 'jagaimo', 'ジャガイモを食べます。', 'N3', 237),
  ('n3t_238', 'deck_n3_thematic', 'トウモロコシ', 'tōmorokoshi', 'Makkajo''xori', 'tōmorokoshi', 'トウモロコシを食べました。', 'N3', 238),
  ('n3t_239', 'deck_n3_thematic', 'ウニ', 'uni', 'Dengiz kirpisi', 'uni', 'ウニを食べたことがあります。', 'N3', 239),
  ('n3t_240', 'deck_n3_thematic', '乗馬 (じょうば)', 'jōba', 'Ot minish', 'jōba', '乗馬をしたいです。', 'N3', 240),
  ('n3t_241', 'deck_n3_thematic', 'カヌー', 'kanū', 'Kanoe', 'kanū', 'カヌーに乗ります。', 'N3', 241),
  ('n3t_242', 'deck_n3_thematic', '楽しむ (たのしむ)', 'tanoshimu', 'Zavqlanmoq, maroqli o''tkazmoq', 'tanoshimu', '旅行を楽しみます。', 'N3', 242),
  ('n3t_243', 'deck_n3_thematic', 'カニ', 'kani', 'Qisqichbaqa', 'kani', 'カニを食べました。', 'N3', 243),
  ('n3t_244', 'deck_n3_thematic', '着物 (きもの)', 'kimono', 'Kimono, an''anaviy yapon kiyimi', 'kimono', '着物を着ます。', 'N3', 244),
  ('n3t_245', 'deck_n3_thematic', 'ショッピングセンター', 'shoppingu sentā', 'Savdo markazi', 'shoppingu sentā', 'ショッピングセンターへ行きます。', 'N3', 245),
  ('n3t_246', 'deck_n3_thematic', '水族館 (すいぞくかん)', 'suizokukan', 'Akvarium', 'suizokukan', '水族館へ行きたいです。', 'N3', 246),
  ('n3t_247', 'deck_n3_thematic', 'スノーボード', 'sunōbōdo', 'Snoubord', 'sunōbōdo', 'スノーボードをします。', 'N3', 247),
  ('n3t_248', 'deck_n3_thematic', '船 (ふね)', 'fune', 'Kema, qayiq', 'fune', '船に乗ります。', 'N3', 248),
  ('n3t_249', 'deck_n3_thematic', '雰囲気 (ふんいき)', 'fun''iki', 'Muhit, atmosfera', 'fun''iki', 'この店は雰囲気がいいです。', 'N3', 249),
  ('n3t_250', 'deck_n3_thematic', '街 (まち)', 'machi', 'Shahar, ko''cha hududi', 'machi', 'この街が好きです。', 'N3', 250),
  ('n3t_251', 'deck_n3_thematic', 'こっち', 'kotchi', 'Bu tomon, bu yoq (norasmiy)', 'kotchi', 'こっちへ来てください。', 'N3', 251),
  ('n3t_252', 'deck_n3_thematic', 'そっち', 'sotchi', 'U tomon, u yoq (norasmiy)', 'sotchi', 'そっちにあります。', 'N3', 252),
  ('n3t_253', 'deck_n3_thematic', '市内 (しない)', 'shinai', 'Shahar ichida', 'shinai', '市内にホテルがあります。', 'N3', 253),
  ('n3t_254', 'deck_n3_thematic', '最後 (さいご)', 'saigo', 'Oxiri, so''nggi', 'saigo', '最後に写真を撮ります。', 'N3', 254),
  ('n3t_255', 'deck_n3_thematic', '旅館 (りょかん)', 'ryokan', 'Yaponcha uslubdagi mehmonxona', 'ryokan', '旅館に泊まります。', 'N3', 255),
  ('n3t_256', 'deck_n3_thematic', '朝食 (ちょうしょく)', 'chōshoku', 'Nonushta', 'chōshoku', '朝食を食べます。', 'N3', 256),
  ('n3t_257', 'deck_n3_thematic', '夕食 (ゆうしょく)', 'yūshoku', 'Kechki ovqat', 'yūshoku', '夕食は七時です。', 'N3', 257),
  ('n3t_258', 'deck_n3_thematic', '観光地 (かんこうち)', 'kankōchi', 'Sayyohlik joyi', 'kankōchi', '有名な観光地へ行きます。', 'N3', 258),
  ('n3t_259', 'deck_n3_thematic', '登山 (とざん)', 'tozan', 'Tog''ga chiqish', 'tozan', '夏に登山をします。', 'N3', 259),
  ('n3t_260', 'deck_n3_thematic', '虫 (むし)', 'mushi', 'Hasharot', 'mushi', '虫がいます。', 'N3', 260),
  ('n3t_261', 'deck_n3_thematic', '宿泊 (しゅくはく)', 'shukuhaku', 'Turar joyda tunash', 'shukuhaku', 'ホテルに宿泊します。', 'N3', 261),
  ('n3t_262', 'deck_n3_thematic', '代金 (だいきん)', 'daikin', 'To''lov, xarajat', 'daikin', '代金を払います。', 'N3', 262),
  ('n3t_263', 'deck_n3_thematic', '内容 (ないよう)', 'naiyō', 'Mazmun, tafsilotlar', 'naiyō', '旅行の内容を確認します。', 'N3', 263),
  ('n3t_264', 'deck_n3_thematic', 'なし', 'nashi', 'Yo''q, mavjud emas', 'nashi', '朝食はなしです。', 'N3', 264),
  ('n3t_265', 'deck_n3_thematic', '値段 (ねだん)', 'nedan', 'Narx', 'nedan', '値段はいくらですか。', 'N3', 265),
  ('n3t_266', 'deck_n3_thematic', '大人 (おとな)', 'otona', 'Katta odam, voyaga yetgan', 'otona', '大人は二人です。', 'N3', 266),
  ('n3t_267', 'deck_n3_thematic', '～付き (～つき)', '~tsuki', '~ bilan birga, ~ qo''shilgan', '~tsuki', '朝食付きのホテルです。', 'N3', 267),
  ('n3t_268', 'deck_n3_thematic', '～泊～日 (～はく～にち)', '~haku ~nichi', '~ kecha ~ kun', '~haku ~nichi', '二泊三日の旅行です。', 'N3', 268),
  ('n3t_269', 'deck_n3_thematic', '～費 (～ひ)', '~hi', '~ xarajat, ~ to''lovi', '~hi', '交通費はいくらですか。', 'N3', 269),
  ('n3t_270', 'deck_n3_thematic', '待ち合わせる (まちあわせる)', 'machiawaseru', 'Uchrashib olmoq, uchrashuv belgilamoq', 'machiawaseru', '駅で待ち合わせます。', 'N3', 270),
  ('n3t_271', 'deck_n3_thematic', 'ガイドする', 'gaido suru', 'Yo''l ko''rsatmoq, gidlik qilmoq', 'gaido suru', '町をガイドします。', 'N3', 271),
  ('n3t_272', 'deck_n3_thematic', '観光する (かんこうする)', 'kankō suru', 'Sayohat qilmoq, diqqatga sazovor joylarni tomosha qilmoq', 'kankō suru', '東京を観光します。', 'N3', 272),
  ('n3t_273', 'deck_n3_thematic', '出発する (しゅっぱつする)', 'shuppatsu suru', 'Jo''namoq, yo''lga chiqmoq', 'shuppatsu suru', '朝八時に出発します。', 'N3', 273),
  ('n3t_274', 'deck_n3_thematic', 'キャンプする', 'kyanpu suru', 'Kemping qilmoq', 'kyanpu suru', '山でキャンプします。', 'N3', 274),
  ('n3t_275', 'deck_n3_thematic', '珍しい (めずらしい)', 'mezurashii', 'Noyob, kam uchraydigan', 'mezurashii', '珍しい魚を見ました。', 'N3', 275),
  ('n3t_276', 'deck_n3_thematic', '伝統的 (でんとうてき)', 'dentōteki', 'An''anaviy', 'dentōteki', 'これは伝統的な料理です。', 'N3', 276),
  ('n3t_277', 'deck_n3_thematic', 'それに', 'soreni', 'Bundan tashqari, yana', 'soreni', 'それに、おいしいです。', 'N3', 277),
  ('n3t_278', 'deck_n3_thematic', 'どっち', 'dotchi', 'Qaysi biri (norasmiy)', 'dotchi', 'どっちがいいですか。', 'N3', 278),
  ('n3t_279', 'deck_n3_thematic', 'イルカ', 'iruka', 'Delfin', 'iruka', 'イルカを見ました。', 'N3', 279),
  ('n3t_280', 'deck_n3_thematic', 'ショー', 'shō', 'Shou, tomosha dasturi', 'shō', 'イルカのショーを見ます。', 'N3', 280),
  ('n3t_281', 'deck_n3_thematic', '手袋 (てぶくろ)', 'tebukuro', 'Qo''lqop', 'tebukuro', '手袋を持っています。', 'N3', 281),
  ('n3t_282', 'deck_n3_thematic', 'マフラー', 'mafurā', 'Sharf', 'mafurā', 'マフラーを買いました。', 'N3', 282),
  ('n3t_283', 'deck_n3_thematic', '年末 (ねんまつ)', 'nenmatsu', 'Yil oxiri', 'nenmatsu', '年末に旅行します。', 'N3', 283),
  ('n3t_284', 'deck_n3_thematic', 'ガイドブック', 'gaidobukku', 'Sayohat qo''llanmasi', 'gaidobukku', 'ガイドブックを読みます。', 'N3', 284),
  ('n3t_285', 'deck_n3_thematic', 'パーク', 'pāku', 'Park', 'pāku', 'パークへ行きます。', 'N3', 285),
  ('n3t_286', 'deck_n3_thematic', '早割 (はやわり)', 'hayawari', 'Oldindan bron qilish uchun chegirma', 'hayawari', '早割でチケットを買いました。', 'N3', 286),
  ('n3t_287', 'deck_n3_thematic', '～中 (～ちゅう)', '~chū', 'Davomida, jarayonida', '~chū', '旅行中です。', 'N3', 287),
  ('n3t_288', 'deck_n3_thematic', '取る (とる)', 'toru', 'Yengillashtirmoq, xalos bo''lmoq', 'toru', '休みを取ります。', 'N3', 288),
  ('n3t_289', 'deck_n3_thematic', '休みを取る (やすみをとる)', 'yasumi o toru', 'Ta''til olmoq, dam olish kunini olmoq', 'yasumi o toru', '来週、休みを取ります。', 'N3', 289),
  ('n3t_290', 'deck_n3_thematic', 'ぬれる', 'nureru', 'Ho''llanmoq', 'nureru', '雨で服がぬれました。', 'N3', 290),
  ('n3t_291', 'deck_n3_thematic', '用意する (よういする)', 'yōi suru', 'Tayyorlamoq', 'yōi suru', '旅行の準備を用意します。', 'N3', 291),
  ('n3t_292', 'deck_n3_thematic', '伝える (つたえる)', 'tsutaeru', 'Yetkazmoq, aytib bermoq', 'tsutaeru', '友達に伝えます。', 'N3', 292),
  ('n3t_293', 'deck_n3_thematic', 'コピーする', 'kopī suru', 'Nusxa ko''chirmoq', 'kopī suru', '書類をコピーします。', 'N3', 293),
  ('n3t_294', 'deck_n3_thematic', 'お願いします (おねがいします)', 'onegai shimasu', 'Iltimos, so''rayman', 'onegai shimasu', 'お願いします。', 'N3', 294),
  ('n3t_295', 'deck_n3_thematic', 'あとで', 'ato de', 'Keyinroq', 'ato de', 'あとで電話します。', 'N3', 295),
  ('n3t_296', 'deck_n3_thematic', '相手 (あいて)', 'aite', 'Suhbatdosh, qarshidagi odam, sherik', 'aite', '相手の話を聞きます。', 'N3', 296),
  ('n3t_297', 'deck_n3_thematic', '習慣 (しゅうかん)', 'shūkan', 'Odat, an''ana', 'shūkan', '国によって習慣が違います。', 'N3', 297),
  ('n3t_298', 'deck_n3_thematic', '違い (ちがい)', 'chigai', 'Farq', 'chigai', '文化の違いがあります。', 'N3', 298),
  ('n3t_299', 'deck_n3_thematic', '驚く (おどろく)', 'odoroku', 'Hayron bo''lmoq, ajablanmoq', 'odoroku', 'その話を聞いて驚きました。', 'N3', 299),
  ('n3t_300', 'deck_n3_thematic', '失礼 (しつれい)', 'shitsurei', 'Qo''pollik, odobsizlik', 'shitsurei', '失礼なことを言いました。', 'N3', 300),
  ('n3t_301', 'deck_n3_thematic', '会議 (かいぎ)', 'kaigi', 'Yig''ilish, majlis', 'kaigi', '午後に会議があります。', 'N3', 301),
  ('n3t_302', 'deck_n3_thematic', '課長 (かちょう)', 'kachō', 'Bo''lim boshlig''i', 'kachō', '課長と話します。', 'N3', 302),
  ('n3t_303', 'deck_n3_thematic', '社長 (しゃちょう)', 'shachō', 'Kompaniya prezidenti, direktor', 'shachō', '社長に会いました。', 'N3', 303),
  ('n3t_304', 'deck_n3_thematic', 'ご存じ (ごぞんじ)', 'gozonji', 'Bilmoq, xabardor bo''lmoq (hurmat shakli)', 'gozonji', 'この店をご存じですか。', 'N3', 304),
  ('n3t_305', 'deck_n3_thematic', 'どなた', 'donata', 'Kim? (hurmat shakli)', 'donata', 'あの方はどなたですか。', 'N3', 305),
  ('n3t_306', 'deck_n3_thematic', 'ミステリー', 'misuterī', 'Detektiv, sirli asar', 'misuterī', 'ミステリーが好きです。', 'N3', 306),
  ('n3t_307', 'deck_n3_thematic', '出身 (しゅっしん)', 'shusshin', 'Tug''ilgan joyi, vatani', 'shusshin', '私はウズベキスタン出身です。', 'N3', 307),
  ('n3t_308', 'deck_n3_thematic', 'ごろ', 'goro', 'Taxminan, atrofida', 'goro', '七時ごろ帰ります。', 'N3', 308),
  ('n3t_309', 'deck_n3_thematic', 'いらっしゃる', 'irassharu', 'Bormoq, kelmoq, bo''lmoq (hurmat shakli)', 'irassharu', '先生はいらっしゃいます。', 'N3', 309),
  ('n3t_310', 'deck_n3_thematic', 'おっしゃる', 'ossharu', 'Demoq, aytmoq (hurmat shakli)', 'ossharu', '先生がおっしゃいました。', 'N3', 310),
  ('n3t_311', 'deck_n3_thematic', 'ご覧になる (ごらんになる)', 'goran ni naru', 'Ko''rmoq, qaramoq (hurmat shakli)', 'goran ni naru', 'こちらをご覧ください。', 'N3', 311),
  ('n3t_312', 'deck_n3_thematic', 'なさる', 'nasaru', 'Qilmoq (hurmat shakli)', 'nasaru', '何をなさいますか。', 'N3', 312),
  ('n3t_313', 'deck_n3_thematic', '召し上がる (めしあがる)', 'meshiagaru', 'Yemoq, ichmoq (hurmat shakli)', 'meshiagaru', 'どうぞ召し上がってください。', 'N3', 313),
  ('n3t_314', 'deck_n3_thematic', '出席する (しゅっせきする)', 'shusseki suru', 'Qatnashmoq, ishtirok etmoq', 'shusseki suru', '会議に出席します。', 'N3', 314),
  ('n3t_315', 'deck_n3_thematic', '退院する (たいいんする)', 'taiin suru', 'Kasalxonadan chiqmoq', 'taiin suru', '明日、退院します。', 'N3', 315),
  ('n3t_316', 'deck_n3_thematic', '一緒に作りましょう (いっしょにつくりましょう)', 'issho ni tsukurimashō', 'Birgalikda tayyorlaylik', 'issho ni tsukurimashō', '一緒に料理を作りましょう。', 'N3', 316),
  ('n3t_317', 'deck_n3_thematic', 'このくらい', 'kono kurai', 'Shunchalik, mana shuncha', 'kono kurai', 'このくらいでいいです。', 'N3', 317)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('n3t_318', 'deck_n3_thematic', '皮 (かわ)', 'kawa', 'Po''st, po''stlog''', 'kawa', 'じゃがいもの皮をむきます。', 'N3', 318),
  ('n3t_319', 'deck_n3_thematic', 'キャベツ', 'kyabetsu', 'Karam', 'kyabetsu', 'キャベツを切ります。', 'N3', 319),
  ('n3t_320', 'deck_n3_thematic', '大根 (だいこん)', 'daikon', 'Yapon rediska', 'daikon', '大根を切ります。', 'N3', 320),
  ('n3t_321', 'deck_n3_thematic', 'タマネギ', 'tamanegi', 'Piyoz', 'tamanegi', 'タマネギを切ります。', 'N3', 321),
  ('n3t_322', 'deck_n3_thematic', 'ニンジン', 'ninjin', 'Sabzi', 'ninjin', 'ニンジンを切ります。', 'N3', 322),
  ('n3t_323', 'deck_n3_thematic', 'ネギ', 'negi', 'Ko''k piyoz', 'negi', 'ネギを入れます。', 'N3', 323),
  ('n3t_324', 'deck_n3_thematic', '半分 (はんぶん)', 'hanbun', 'Yarmi, yarim', 'hanbun', '半分に切ります。', 'N3', 324),
  ('n3t_325', 'deck_n3_thematic', 'カップ', 'kappu', 'Stakan, piyola, o''lchov idishi', 'kappu', '水を一カップ入れます。', 'N3', 325),
  ('n3t_326', 'deck_n3_thematic', 'クリーム', 'kurīmu', 'Krem', 'kurīmu', 'クリームを入れます。', 'N3', 326),
  ('n3t_327', 'deck_n3_thematic', 'ゼリー', 'zerī', 'Jele', 'zerī', 'ゼリーを食べます。', 'N3', 327),
  ('n3t_328', 'deck_n3_thematic', 'パスタのソースを作る (パスタのソースをつくる)', 'pasuta no sōsu o tsukuru', 'Pasta sousini tayyorlamoq', 'pasuta no sōsu o tsukuru', 'パスタのソースを作ります。', 'N3', 328),
  ('n3t_329', 'deck_n3_thematic', 'パスタ', 'pasuta', 'Makaron, pasta', 'pasuta', 'パスタを食べます。', 'N3', 329),
  ('n3t_330', 'deck_n3_thematic', 'はちみつ', 'hachimitsu', 'Asal', 'hachimitsu', 'はちみつを入れます。', 'N3', 330),
  ('n3t_331', 'deck_n3_thematic', 'みそ汁 (みそしる)', 'misoshiru', 'Miso sho''rvasi', 'misoshiru', 'みそ汁を飲みます。', 'N3', 331),
  ('n3t_332', 'deck_n3_thematic', '火 (ひ)', 'hi', 'Olov, issiqlik', 'hi', '火をつけます。', 'N3', 332),
  ('n3t_333', 'deck_n3_thematic', '強火 (つよび)', 'tsuyobi', 'Kuchli olov', 'tsuyobi', '強火で焼きます。', 'N3', 333),
  ('n3t_334', 'deck_n3_thematic', '弱火 (よわび)', 'yowabi', 'Past olov', 'yowabi', '弱火で煮ます。', 'N3', 334),
  ('n3t_335', 'deck_n3_thematic', 'ルー', 'rū', 'Sous yoki karri uchun quyuqlashtiruvchi massa', 'rū', 'ルーを入れます。', 'N3', 335),
  ('n3t_336', 'deck_n3_thematic', 'グラム', 'guramu', 'Gramm', 'guramu', '肉を二百グラム買います。', 'N3', 336),
  ('n3t_337', 'deck_n3_thematic', 'できあがり', 'dekiagari', 'Tayyor bo''lishi, tayyor', 'dekiagari', '料理のできあがりです。', 'N3', 337),
  ('n3t_338', 'deck_n3_thematic', 'むく', 'muku', 'Po''stini archmoq', 'muku', 'じゃがいもの皮をむきます。', 'N3', 338),
  ('n3t_339', 'deck_n3_thematic', '焼く (やく)', 'yaku', 'Qovurmoq, pishirmoq, grilda tayyorlamoq', 'yaku', '肉を焼きます。', 'N3', 339),
  ('n3t_340', 'deck_n3_thematic', '沸かす (わかす)', 'wakasu', 'Suvni qaynatmoq', 'wakasu', 'お湯を沸かします。', 'N3', 340),
  ('n3t_341', 'deck_n3_thematic', '冷やす (ひやす)', 'hiyasu', 'Sovutmoq', 'hiyasu', '水を冷やします。', 'N3', 341),
  ('n3t_342', 'deck_n3_thematic', '煮る (にる)', 'niru', 'Qaynatib pishirmoq, dimlamoq', 'niru', '野菜を煮ます。', 'N3', 342),
  ('n3t_343', 'deck_n3_thematic', 'ゆでる', 'yuderu', 'Suvda qaynatib pishirmoq', 'yuderu', '卵をゆでます。', 'N3', 343),
  ('n3t_344', 'deck_n3_thematic', '変わる (かわる)', 'kawaru', 'O''zgarmoq', 'kawaru', '色が変わりました。', 'N3', 344),
  ('n3t_345', 'deck_n3_thematic', '沸騰する (ふっとうする)', 'futtō suru', 'Qaynab ketmoq', 'futtō suru', 'お湯が沸騰しました。', 'N3', 345),
  ('n3t_346', 'deck_n3_thematic', '炒める (いためる)', 'itameru', 'Qovurmoq', 'itameru', '野菜を炒めます。', 'N3', 346),
  ('n3t_347', 'deck_n3_thematic', '厚い (あつい)', 'atsui', 'Qalin', 'atsui', 'この肉は厚いです。', 'N3', 347),
  ('n3t_348', 'deck_n3_thematic', '薄い (うすい)', 'usui', 'Yupqa; ta''mi kuchsiz', 'usui', '肉を薄く切ります。', 'N3', 348),
  ('n3t_349', 'deck_n3_thematic', '濃い (こい)', 'koi', 'Quyuq, kuchli ta''mli', 'koi', 'このスープは味が濃いです。', 'N3', 349),
  ('n3t_350', 'deck_n3_thematic', '細かい (こまかい)', 'komakai', 'Mayda, kichik', 'komakai', '野菜を細かく切ります。', 'N3', 350),
  ('n3t_351', 'deck_n3_thematic', '細い (ほそい)', 'hosoi', 'Ingichka', 'hosoi', '細い道を歩きます。', 'N3', 351),
  ('n3t_352', 'deck_n3_thematic', '弱い (よわい)', 'yowai', 'Kuchsiz, sust', 'yowai', '火が弱いです。', 'N3', 352),
  ('n3t_353', 'deck_n3_thematic', '次に (つぎに)', 'tsugi ni', 'Keyin, navbatdagi bosqichda', 'tsugi ni', '次に肉を入れます。', 'N3', 353),
  ('n3t_354', 'deck_n3_thematic', '最後に (さいごに)', 'saigo ni', 'Oxirida, nihoyat', 'saigo ni', '最後に味を見ます。', 'N3', 354),
  ('n3t_355', 'deck_n3_thematic', '調味料 (ちょうみりょう)', 'chōmiryō', 'Ziravorlar, ta''m beruvchi mahsulotlar', 'chōmiryō', '調味料を入れます。', 'N3', 355),
  ('n3t_356', 'deck_n3_thematic', '鍋 (なべ)', 'nabe', 'Qozon, kastryulka', 'nabe', '鍋に野菜を入れます。', 'N3', 356),
  ('n3t_357', 'deck_n3_thematic', '肉じゃが (にくじゃが)', 'nikujaga', 'Go''sht va kartoshkali yapon taomi', 'nikujaga', '肉じゃがを作りました。', 'N3', 357),
  ('n3t_358', 'deck_n3_thematic', '遠慮する (えんりょする)', 'enryo suru', 'Tortinmoq, o''zini tiyib turmoq', 'enryo suru', '遠慮しないでください。', 'N3', 358),
  ('n3t_359', 'deck_n3_thematic', 'もちろん', 'mochiron', 'Albatta, shubhasiz', 'mochiron', 'もちろん大丈夫です。', 'N3', 359),
  ('n3t_360', 'deck_n3_thematic', 'だいたい', 'daitai', 'Taxminan, ko''pincha', 'daitai', 'だいたい分かりました。', 'N3', 360),
  ('n3t_361', 'deck_n3_thematic', 'お邪魔します (おじゃまします)', 'ojama shimasu', 'Xalaqit berganim uchun uzr; uyingizga kirishda aytiladi', 'ojama shimasu', 'お邪魔します。', 'N3', 361),
  ('n3t_362', 'deck_n3_thematic', 'よくいらっしゃいました', 'yoku irasshaimashita', 'Xush kelibsiz, kelganingizdan xursandman', 'yoku irasshaimashita', 'よくいらっしゃいました。', 'N3', 362),
  ('n3t_363', 'deck_n3_thematic', '明るい (あかるい)', 'akarui', 'Yorqin, quvnoq', 'akarui', '明るい部屋です。', 'N3', 363),
  ('n3t_364', 'deck_n3_thematic', '（お）団子 (おだんご)', 'odango', 'Dango, guruchli shirinlik', 'odango', 'お団子を食べます。', 'N3', 364),
  ('n3t_365', 'deck_n3_thematic', '湖 (みずうみ)', 'mizuumi', 'Ko''l', 'mizuumi', '湖がきれいです。', 'N3', 365),
  ('n3t_366', 'deck_n3_thematic', '運転手 (うんてんしゅ)', 'untenshu', 'Haydovchi', 'untenshu', '運転手さんに聞きます。', 'N3', 366),
  ('n3t_367', 'deck_n3_thematic', '駅員 (えきいん)', 'ekiin', 'Vokzal xodimi', 'ekiin', '駅員さんに聞きました。', 'N3', 367),
  ('n3t_368', 'deck_n3_thematic', 'お巡りさん (おまわりさん)', 'omawarisan', 'Politsiyachi', 'omawarisan', 'お巡りさんに聞きます。', 'N3', 368),
  ('n3t_369', 'deck_n3_thematic', '～さん', '~san', 'Janob, xonim; ayrim kasblarga hurmat bilan qo''shiladi', '~san', '駅員さん、ありがとうございます。', 'N3', 369),
  ('n3t_370', 'deck_n3_thematic', '送る (おくる)', 'okuru', 'Kuzatib qo''ymoq, olib borib qo''ymoq', 'okuru', '車で家まで送ります。', 'N3', 370),
  ('n3t_371', 'deck_n3_thematic', '直す (なおす)', 'naosu', 'Tuzatmoq, ta''mirlamoq', 'naosu', '自転車を直します。', 'N3', 371),
  ('n3t_372', 'deck_n3_thematic', '譲る (ゆずる)', 'yuzuru', 'Bermoq, boshqasiga o''tkazmoq', 'yuzuru', '席を譲ります。', 'N3', 372),
  ('n3t_373', 'deck_n3_thematic', '連れて行く (つれていく)', 'tsurete iku', 'Olib bormoq, birga olib ketmoq', 'tsurete iku', '友達を駅まで連れて行きます。', 'N3', 373),
  ('n3t_374', 'deck_n3_thematic', '教える (おしえる)', 'oshieru', 'O''rgatmoq, ma''lumot bermoq', 'oshieru', '駅への行き方を教えます。', 'N3', 374),
  ('n3t_375', 'deck_n3_thematic', '拾う (ひろう)', 'hirou', 'Yerdan olib qo''ymoq, topib olmoq', 'hirou', '道で財布を拾いました。', 'N3', 375),
  ('n3t_376', 'deck_n3_thematic', '届ける (とどける)', 'todokeru', 'Yetkazib bermoq, olib borib topshirmoq', 'todokeru', '荷物を届けます。', 'N3', 376),
  ('n3t_377', 'deck_n3_thematic', '迎えに来る (むかえにくる)', 'mukae ni kuru', 'Kutib olish uchun kelmoq', 'mukae ni kuru', '父が迎えに来ます。', 'N3', 377),
  ('n3t_378', 'deck_n3_thematic', '捕る (とる)', 'toru', 'Tutmoq, ushlamoq', 'toru', '魚を捕ります。', 'N3', 378),
  ('n3t_379', 'deck_n3_thematic', 'そんなに', 'sonnani', 'Bunchalik, shunchalik', 'sonnani', 'そんなに難しくないです。', 'N3', 379),
  ('n3t_380', 'deck_n3_thematic', 'お世話になりました (おせわになりました)', 'osewa ni narimashita', 'Ko''rsatgan yordamingiz uchun rahmat', 'osewa ni narimashita', 'いろいろお世話になりました。', 'N3', 380),
  ('n3t_381', 'deck_n3_thematic', '花瓶 (かびん)', 'kabin', 'Gul vaza', 'kabin', '花瓶に花を入れます。', 'N3', 381),
  ('n3t_382', 'deck_n3_thematic', '茶碗 (ちゃわん)', 'chawan', 'Chinni kosa, guruch kosasi', 'chawan', '茶碗を洗います。', 'N3', 382),
  ('n3t_383', 'deck_n3_thematic', '机 (つくえ)', 'tsukue', 'Stol, yozuv stoli', 'tsukue', '机の上に本があります。', 'N3', 383),
  ('n3t_384', 'deck_n3_thematic', '本棚 (ほんだな)', 'hondana', 'Kitob javoni', 'hondana', '本を本棚に入れます。', 'N3', 384),
  ('n3t_385', 'deck_n3_thematic', '近所 (きんじょ)', 'kinjo', 'Yaqin atrof, mahalla', 'kinjo', '近所にコンビニがあります。', 'N3', 385),
  ('n3t_386', 'deck_n3_thematic', '～先 (～さき)', '~saki', '~ boriladigan joy, manzil', '~saki', 'アルバイト先は駅の近くです。', 'N3', 386),
  ('n3t_387', 'deck_n3_thematic', '教授 (きょうじゅ)', 'kyōju', 'Professor', 'kyōju', '教授に質問します。', 'N3', 387),
  ('n3t_388', 'deck_n3_thematic', '部長 (ぶちょう)', 'buchō', 'Bo''lim boshlig''i', 'buchō', '部長と話します。', 'N3', 388),
  ('n3t_389', 'deck_n3_thematic', '資料 (しりょう)', 'shiryō', 'Hujjatlar, materiallar, ma''lumotlar', 'shiryō', '資料を見てください。', 'N3', 389),
  ('n3t_390', 'deck_n3_thematic', 'いただく', 'itadaku', 'Qabul qilmoq, olmoq (kamtarlik shakli)', 'itadaku', '先生から資料をいただきました。', 'N3', 390),
  ('n3t_391', 'deck_n3_thematic', 'くださる', 'kudasaru', 'Berib qo''ymoq (hurmat shakli)', 'kudasaru', '先生が本をくださいました。', 'N3', 391),
  ('n3t_392', 'deck_n3_thematic', 'どういたしまして', 'dōitashimashite', 'Arzimaydi, hechqisi yo''q', 'dōitashimashite', 'どういたしまして。', 'N3', 392),
  ('n3t_393', 'deck_n3_thematic', 'チヂミ', 'chijimi', 'Chijimi, koreyscha quymoq', 'chijimi', 'チヂミを食べます。', 'N3', 393),
  ('n3t_394', 'deck_n3_thematic', '飾る (かざる)', 'kazaru', 'Bezamoq', 'kazaru', '花を飾ります。', 'N3', 394),
  ('n3t_395', 'deck_n3_thematic', '乾杯 (かんぱい)', 'kanpai', 'Qadah ko''tarmoq, tost', 'kanpai', 'みんなで乾杯しましょう。', 'N3', 395),
  ('n3t_396', 'deck_n3_thematic', '大切さ (たいせつさ)', 'taisetsusa', 'Muhimlik, ahamiyat', 'taisetsusa', '仕事の大切さが分かりました。', 'N3', 396),
  ('n3t_397', 'deck_n3_thematic', 'ですから', 'desu kara', 'Shuning uchun, shu sababli', 'desu kara', '今日は忙しいです。ですから、行きません。', 'N3', 397),
  ('n3t_398', 'deck_n3_thematic', 'アルバイト先 (アルバイトさき)', 'arubaito saki', 'Yarim stavkali ish joyi', 'arubaito saki', 'アルバイト先は駅の近くです。', 'N3', 398),
  ('n3t_399', 'deck_n3_thematic', '裏 (うら)', 'ura', 'Orqa tomon', 'ura', '紙の裏を見てください。', 'N3', 399),
  ('n3t_400', 'deck_n3_thematic', '紙 (かみ)', 'kami', 'Qog''oz', 'kami', '紙に名前を書きます。', 'N3', 400),
  ('n3t_401', 'deck_n3_thematic', 'シフト', 'shifuto', 'Ish smenasi', 'shifuto', '明日のシフトは朝です。', 'N3', 401),
  ('n3t_402', 'deck_n3_thematic', 'スタッフ', 'sutaffu', 'Xodimlar, personal', 'sutaffu', 'スタッフに聞きます。', 'N3', 402),
  ('n3t_403', 'deck_n3_thematic', 'タイムカード', 'taimu kādo', 'Ish vaqtini qayd qiluvchi karta', 'taimu kādo', 'タイムカードを押します。', 'N3', 403),
  ('n3t_404', 'deck_n3_thematic', '表 (ひょう)', 'hyō', 'Jadval', 'hyō', '表を見てください。', 'N3', 404),
  ('n3t_405', 'deck_n3_thematic', 'ホール', 'hōru', 'Restoranning mijozlar zali', 'hōru', 'ホールで働いています。', 'N3', 405),
  ('n3t_406', 'deck_n3_thematic', '毎月 (まいげつ)', 'maigetsu', 'Har oy', 'maigetsu', '毎月給料をもらいます。', 'N3', 406),
  ('n3t_407', 'deck_n3_thematic', '髪の毛 (かみのけ)', 'kaminoke', 'Soch', 'kaminoke', '髪の毛を切ります。', 'N3', 407),
  ('n3t_408', 'deck_n3_thematic', 'スニーカー', 'sunīkā', 'Krossovka, sport oyoq kiyimi', 'sunīkā', 'スニーカーをはいています。', 'N3', 408),
  ('n3t_409', 'deck_n3_thematic', '隅 (すみ)', 'sumi', 'Burchak', 'sumi', '部屋の隅に置きます。', 'N3', 409),
  ('n3t_410', 'deck_n3_thematic', '調理場 (ちょうりば)', 'chōriba', 'Oshxona, ovqat tayyorlash joyi', 'chōriba', '調理場で料理をします。', 'N3', 410),
  ('n3t_411', 'deck_n3_thematic', '伝票 (でんぴょう)', 'denpyō', 'Buyurtma varaqasi, hisob qog''ozi', 'denpyō', '伝票を確認します。', 'N3', 411),
  ('n3t_412', 'deck_n3_thematic', '道具 (どうぐ)', 'dōgu', 'Asbob, jihoz', 'dōgu', '道具を使います。', 'N3', 412),
  ('n3t_413', 'deck_n3_thematic', '床 (ゆか)', 'yuka', 'Pol', 'yuka', '床を掃除します。', 'N3', 413),
  ('n3t_414', 'deck_n3_thematic', '予定 (よてい)', 'yotei', 'Reja, jadval', 'yotei', '明日の予定があります。', 'N3', 414),
  ('n3t_415', 'deck_n3_thematic', '温度 (おんど)', 'ondo', 'Harorat', 'ondo', '温度を確認します。', 'N3', 415),
  ('n3t_416', 'deck_n3_thematic', '代わり (かわり)', 'kawari', 'O''rniga, o''rnida', 'kawari', '私の代わりにお願いします。', 'N3', 416),
  ('n3t_417', 'deck_n3_thematic', '洗剤 (せんざい)', 'senzai', 'Kir yuvish yoki tozalash vositasi', 'senzai', '洗剤を使います。', 'N3', 417),
  ('n3t_418', 'deck_n3_thematic', '都合 (つごう)', 'tsugō', 'Qulaylik, sharoit, vaqt imkoniyati', 'tsugō', '明日は都合がいいです。', 'N3', 418),
  ('n3t_419', 'deck_n3_thematic', 'マニュアル', 'manyuaru', 'Qo''llanma, yo''riqnoma', 'manyuaru', 'マニュアルを読みます。', 'N3', 419),
  ('n3t_420', 'deck_n3_thematic', 'オーブン', 'ōbun', 'Duxovka, pech', 'ōbun', 'オーブンでパンを焼きます。', 'N3', 420),
  ('n3t_421', 'deck_n3_thematic', '汚れ (よごれ)', 'yogore', 'Kir, dog''', 'yogore', '汚れがあります。', 'N3', 421),
  ('n3t_422', 'deck_n3_thematic', 'ルール', 'rūru', 'Qoida', 'rūru', 'ルールを守ります。', 'N3', 422),
  ('n3t_423', 'deck_n3_thematic', '～様 (～さま)', '~sama', 'Janob, xonim (juda hurmatli shakl)', '~sama', 'お客様、こちらへどうぞ。', 'N3', 423),
  ('n3t_424', 'deck_n3_thematic', '押す (おす)', 'osu', 'Bosmoq', 'osu', 'ボタンを押します。', 'N3', 424),
  ('n3t_425', 'deck_n3_thematic', '断る (ことわる)', 'kotowaru', 'Rad etmoq', 'kotowaru', 'お願いを断りました。', 'N3', 425),
  ('n3t_426', 'deck_n3_thematic', '出す (だす)', 'dasu', 'Chiqarib qo''ymoq; olib chiqmoq', 'dasu', 'ごみを出します。', 'N3', 426),
  ('n3t_427', 'deck_n3_thematic', '渡す (わたす)', 'watasu', 'Uzatmoq, topshirmoq', 'watasu', '書類を渡します。', 'N3', 427),
  ('n3t_428', 'deck_n3_thematic', '着替える (きがえる)', 'kigaeru', 'Kiyim almashtirmoq', 'kigaeru', '服を着替えます。', 'N3', 428),
  ('n3t_429', 'deck_n3_thematic', 'つける', 'tsukeru', 'Taqmoq, kiymoq, biriktirmoq', 'tsukeru', 'アクセサリーをつけます。', 'N3', 429),
  ('n3t_430', 'deck_n3_thematic', 'アクセサリーをつける', 'akusesarī o tsukeru', 'Aksessuar taqmoq', 'akusesarī o tsukeru', '今日はアクセサリーをつけます。', 'N3', 430),
  ('n3t_431', 'deck_n3_thematic', 'おしゃべりする', 'oshaberi suru', 'Suhbatlashmoq, gaplashmoq', 'oshaberi suru', '仕事中におしゃべりしません。', 'N3', 431),
  ('n3t_432', 'deck_n3_thematic', 'チェックする', 'chekku suru', 'Tekshirmoq', 'chekku suru', '注文をチェックします。', 'N3', 432),
  ('n3t_433', 'deck_n3_thematic', '乾く (かわく)', 'kawaku', 'Qurimoq', 'kawaku', '服が乾きました。', 'N3', 433),
  ('n3t_434', 'deck_n3_thematic', 'しまう', 'shimau', 'Joyiga olib qo''ymoq, saqlab qo''ymoq', 'shimau', '道具をしまいます。', 'N3', 434),
  ('n3t_435', 'deck_n3_thematic', '滑る (すべる)', 'suberu', 'Sirpanmoq', 'suberu', '床が濡れていて滑ります。', 'N3', 435),
  ('n3t_436', 'deck_n3_thematic', '運ぶ (はこぶ)', 'hakobu', 'Tashimoq', 'hakobu', '荷物を運びます。', 'N3', 436),
  ('n3t_437', 'deck_n3_thematic', '拭く (ふく)', 'fuku', 'Artmoq', 'fuku', 'テーブルを拭きます。', 'N3', 437)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('n3t_438', 'deck_n3_thematic', '干す (ほす)', 'hosu', 'Quritish uchun osmoq', 'hosu', '服を外に干します。', 'N3', 438),
  ('n3t_439', 'deck_n3_thematic', '片付ける (かたづける)', 'katazukeru', 'Yig''ishtirmoq, tartibga keltirmoq', 'katazukeru', '部屋を片付けます。', 'N3', 439),
  ('n3t_440', 'deck_n3_thematic', '燃える (もえる)', 'moeru', 'Yonmoq', 'moeru', '紙が燃えています。', 'N3', 440),
  ('n3t_441', 'deck_n3_thematic', 'あいさつする', 'aisatsu suru', 'Salomlashmoq, salom bermoq', 'aisatsu suru', '毎朝、あいさつします。', 'N3', 441),
  ('n3t_442', 'deck_n3_thematic', '空く (あく)', 'aku', 'Bo''shamoq', 'aku', '席が空きました。', 'N3', 442),
  ('n3t_443', 'deck_n3_thematic', '上がる (あがる)', 'agaru', 'Ko''tarilmoq', 'agaru', '温度が上がります。', 'N3', 443),
  ('n3t_444', 'deck_n3_thematic', '代わる (かわる)', 'kawaru', 'O''rnini almashtirmoq', 'kawaru', '今日は私が代わります。', 'N3', 444),
  ('n3t_445', 'deck_n3_thematic', 'アルバイトを代わる', 'arubaito o kawaru', 'Birovning ish smenasini almashtirmoq', 'arubaito o kawaru', '友達のアルバイトを代わります。', 'N3', 445),
  ('n3t_446', 'deck_n3_thematic', '呼ぶ (よぶ)', 'yobu', 'Chaqirmoq', 'yobu', 'スタッフを呼びます。', 'N3', 446),
  ('n3t_447', 'deck_n3_thematic', '上げる (あげる)', 'ageru', 'Ko''tarmoq', 'ageru', '温度を上げます。', 'N3', 447),
  ('n3t_448', 'deck_n3_thematic', '下げる (さげる)', 'sageru', 'Tushirmoq, pasaytirmoq', 'sageru', '温度を下げます。', 'N3', 448),
  ('n3t_449', 'deck_n3_thematic', '足りる (たりる)', 'tariru', 'Yetarli bo''lmoq', 'tariru', 'お金が足ります。', 'N3', 449),
  ('n3t_450', 'deck_n3_thematic', '邪魔 (じゃま)', 'jama', 'Xalaqit, to''sqinlik', 'jama', '仕事の邪魔をしません。', 'N3', 450),
  ('n3t_451', 'deck_n3_thematic', '丁寧 (ていねい)', 'teinei', 'Muloyim, odobli', 'teinei', '丁寧に話します。', 'N3', 451),
  ('n3t_452', 'deck_n3_thematic', 'しっかり', 'shikkari', 'Puxta, yaxshilab', 'shikkari', 'しっかり働きます。', 'N3', 452),
  ('n3t_453', 'deck_n3_thematic', '絶対に (ぜったいに)', 'zettai ni', 'Albatta, mutlaqo', 'zettai ni', '絶対に忘れません。', 'N3', 453),
  ('n3t_454', 'deck_n3_thematic', 'はっきり', 'hakkiri', 'Aniq, ravshan', 'hakkiri', 'はっきり話してください。', 'N3', 454),
  ('n3t_455', 'deck_n3_thematic', '大きな (おおきな)', 'ōkina', 'Katta', 'ōkina', '大きな声で話します。', 'N3', 455),
  ('n3t_456', 'deck_n3_thematic', 'お手洗い (おてあらい)', 'otearai', 'Hojatxona', 'otearai', 'お手洗いはどこですか。', 'N3', 456),
  ('n3t_457', 'deck_n3_thematic', 'ガソリン', 'gasorin', 'Benzin', 'gasorin', 'ガソリンがありません。', 'N3', 457),
  ('n3t_458', 'deck_n3_thematic', 'ひも', 'himo', 'Ip, bog''ich', 'himo', 'ひもを結びます。', 'N3', 458),
  ('n3t_459', 'deck_n3_thematic', '袋 (ふくろ)', 'fukuro', 'Xalta, paket', 'fukuro', '袋に入れます。', 'N3', 459),
  ('n3t_460', 'deck_n3_thematic', 'モップ', 'moppu', 'Mop, pol artgich', 'moppu', 'モップで床を掃除します。', 'N3', 460),
  ('n3t_461', 'deck_n3_thematic', '引き出し (ひきだし)', 'hikidashi', 'Tortma, shkaf tortmasi', 'hikidashi', '引き出しに入れます。', 'N3', 461),
  ('n3t_462', 'deck_n3_thematic', 'バター', 'batā', 'Sariyog''', 'batā', 'バターを使います。', 'N3', 462),
  ('n3t_463', 'deck_n3_thematic', '瓶 (びん)', 'bin', 'Shisha idish, butilka', 'bin', '瓶を捨てます。', 'N3', 463),
  ('n3t_464', 'deck_n3_thematic', 'ガス', 'gasu', 'Gaz', 'gasu', 'ガスを使います。', 'N3', 464),
  ('n3t_465', 'deck_n3_thematic', '～袋 (～ぶくろ)', '~bukuro', '~ xalta, paket', '~bukuro', 'ごみ袋を使います。', 'N3', 465),
  ('n3t_466', 'deck_n3_thematic', '決まる (きまる)', 'kimaru', 'Hal bo''lmoq, belgilab qo''yilmoq', 'kimaru', '予定が決まりました。', 'N3', 466),
  ('n3t_467', 'deck_n3_thematic', '確かめる (たしかめる)', 'tashikameru', 'Tekshirmoq, ishonch hosil qilmoq', 'tashikameru', 'もう一度確かめます。', 'N3', 467),
  ('n3t_468', 'deck_n3_thematic', '注意する (ちゅういする)', 'chūi suru', 'E''tibor bermoq, ehtiyot bo''lmoq', 'chūi suru', '足元に注意してください。', 'N3', 468),
  ('n3t_469', 'deck_n3_thematic', 'なくなる', 'nakunaru', 'Tugamoq, qolmay qolmoq', 'nakunaru', 'ガソリンがなくなりました。', 'N3', 469),
  ('n3t_470', 'deck_n3_thematic', '切れる (きれる)', 'kireru', 'Tugab qolmoq', 'kireru', '電池が切れました。', 'N3', 470),
  ('n3t_471', 'deck_n3_thematic', '焦げる (こげる)', 'kogeru', 'Kuyib qolmoq', 'kogeru', 'パンが焦げました。', 'N3', 471),
  ('n3t_472', 'deck_n3_thematic', '破れる (やぶれる)', 'yabureru', 'Yirtilmoq', 'yabureru', '紙が破れました。', 'N3', 472),
  ('n3t_473', 'deck_n3_thematic', 'そのままにする', 'sono mama ni suru', 'O''z holicha qoldirmoq', 'sono mama ni suru', 'そのままにしてください。', 'N3', 473),
  ('n3t_474', 'deck_n3_thematic', '並べる (ならべる)', 'naraberu', 'Qator qilib terib qo''ymoq', 'naraberu', '商品を並べます。', 'N3', 474),
  ('n3t_475', 'deck_n3_thematic', '休憩する (きゅうけいする)', 'kyūkei suru', 'Tanaffus qilmoq, dam olmoq', 'kyūkei suru', '少し休憩します。', 'N3', 475),
  ('n3t_476', 'deck_n3_thematic', '届く (とどく)', 'todoku', 'Yetib kelmoq', 'todoku', '荷物が届きました。', 'N3', 476),
  ('n3t_477', 'deck_n3_thematic', '少々 (しょうしょう)', 'shōshō', 'Biroz, ozgina', 'shōshō', '少々お待ちください。', 'N3', 477),
  ('n3t_478', 'deck_n3_thematic', 'お先にどうぞ (おさきにどうぞ)', 'osaki ni dōzo', 'Avval siz, marhamat', 'osaki ni dōzo', 'お先にどうぞ。', 'N3', 478),
  ('n3t_479', 'deck_n3_thematic', '申し訳ないんですが (もうしわけないんですが)', 'mōshiwake nain desu ga', 'Kechirasiz-u, ammo...', 'mōshiwake nain desu ga', '申し訳ないんですが、もう一度お願いします。', 'N3', 479),
  ('n3t_480', 'deck_n3_thematic', '気をつける (きをつける)', 'ki o tsukeru', 'Ehtiyot bo''lmoq', 'ki o tsukeru', '車に気をつけてください。', 'N3', 480),
  ('n3t_481', 'deck_n3_thematic', '最初に (さいしょに)', 'saisho ni', 'Avvalo, birinchi navbatda', 'saisho ni', '最初に名前を書きます。', 'N3', 481),
  ('n3t_482', 'deck_n3_thematic', '先に (さきに)', 'saki ni', 'Oldin, avval', 'saki ni', '先に帰ります。', 'N3', 482),
  ('n3t_483', 'deck_n3_thematic', '八百屋 (やおや)', 'yaoya', 'Sabzavot do''koni, meva-sabzavot sotuvchisi', 'yaoya', '八百屋で野菜を買います。', 'N3', 483),
  ('n3t_484', 'deck_n3_thematic', 'おじさん', 'ojisan', 'Amaki, o''rta yoshli erkak (muloyim atama)', 'ojisan', 'おじさんに聞きました。', 'N3', 484),
  ('n3t_485', 'deck_n3_thematic', '苦労 (くろう)', 'kurō', 'Qiyinchilik, mashaqqat', 'kurō', 'いろいろ苦労しました。', 'N3', 485),
  ('n3t_486', 'deck_n3_thematic', '親しい (したしい)', 'shitashii', 'Yaqin, qadrdon', 'shitashii', '親しい友達がいます。', 'N3', 486),
  ('n3t_487', 'deck_n3_thematic', '何度も (なんども)', 'nando mo', 'Ko''p marta, qayta-qayta', 'nando mo', '何度も練習しました。', 'N3', 487),
  ('n3t_488', 'deck_n3_thematic', '話しかける (はなしかける)', 'hanashikakeru', 'Gap boshlamoq, murojaat qilmoq', 'hanashikakeru', '友達に話しかけます。', 'N3', 488),
  ('n3t_489', 'deck_n3_thematic', '彼 (かれ)', 'kare', 'Yigit, sevgilisi', 'kare', '彼に会いたいです。', 'N3', 489),
  ('n3t_490', 'deck_n3_thematic', '彼女 (かのじょ)', 'kanojo', 'Qiz, sevgilisi', 'kanojo', '彼女に会いたいです。', 'N3', 490),
  ('n3t_491', 'deck_n3_thematic', '～こと', '~koto', '~ haqidagi narsa, masala', '~koto', '将来のことを考えます。', 'N3', 491),
  ('n3t_492', 'deck_n3_thematic', '興味 (きょうみ)', 'kyōmi', 'Qiziqish', 'kyōmi', '日本の文化に興味があります。', 'N3', 492),
  ('n3t_493', 'deck_n3_thematic', 'ボランティア', 'borantia', 'Ko''ngillilik, volontyor', 'borantia', 'ボランティアをしています。', 'N3', 493),
  ('n3t_494', 'deck_n3_thematic', '物価 (ぶっか)', 'bukka', 'Tovarlar narxi, yashash xarajatlari', 'bukka', '日本は物価が高いです。', 'N3', 494),
  ('n3t_495', 'deck_n3_thematic', '敬語 (けいご)', 'keigo', 'Hurmat tili, hurmat shaklidagi til', 'keigo', '敬語を勉強しています。', 'N3', 495),
  ('n3t_496', 'deck_n3_thematic', '文化 (ぶんか)', 'bunka', 'Madaniyat', 'bunka', '日本の文化が好きです。', 'N3', 496),
  ('n3t_497', 'deck_n3_thematic', '～代 (～だい)', '~dai', '~ xarajat, ~ to''lovi', '~dai', '食事代を払います。', 'N3', 497),
  ('n3t_498', 'deck_n3_thematic', '持つ (もつ)', 'motsu', 'Ega bo''lmoq, ushlamoq', 'motsu', '日本に興味を持っています。', 'N3', 498),
  ('n3t_499', 'deck_n3_thematic', '節約する (せつやくする)', 'setsuyaku suru', 'Tejamoq, iqtisod qilmoq', 'setsuyaku suru', 'お金を節約します。', 'N3', 499),
  ('n3t_500', 'deck_n3_thematic', '外食する (がいしょくする)', 'gaishoku suru', 'Tashqarida ovqatlanmoq', 'gaishoku suru', '週末は外食します。', 'N3', 500),
  ('n3t_501', 'deck_n3_thematic', 'ダイエットする', 'daietto suru', 'Parhez qilmoq, dieta qilmoq', 'daietto suru', 'ダイエットをしています。', 'N3', 501),
  ('n3t_502', 'deck_n3_thematic', '太る (ふとる)', 'futoru', 'Semirmoq, vazn orttirmoq', 'futoru', '食べすぎると太ります。', 'N3', 502),
  ('n3t_503', 'deck_n3_thematic', '折れる (おれる)', 'oreru', 'Sinmoq', 'oreru', 'えんぴつが折れました。', 'N3', 503),
  ('n3t_504', 'deck_n3_thematic', '故障する (こしょうする)', 'koshō suru', 'Buzilmoq, ishdan chiqmoq', 'koshō suru', 'テレビが故障しました。', 'N3', 504),
  ('n3t_505', 'deck_n3_thematic', '学ぶ (まなぶ)', 'manabu', 'O''rganmoq, ta''lim olmoq', 'manabu', '大学で日本語を学びます。', 'N3', 505),
  ('n3t_506', 'deck_n3_thematic', '育てる (そだてる)', 'sodateru', 'Tarbiyalamoq, voyaga yetkazmoq', 'sodateru', '子どもを育てます。', 'N3', 506),
  ('n3t_507', 'deck_n3_thematic', '研究する (けんきゅうする)', 'kenkyū suru', 'Tadqiqot qilmoq', 'kenkyū suru', '大学で研究しています。', 'N3', 507),
  ('n3t_508', 'deck_n3_thematic', 'あんまり', 'anmari', 'Unchalik, ko''p emas', 'anmari', 'あんまり食べません。', 'N3', 508),
  ('n3t_509', 'deck_n3_thematic', '駅前 (えきまえ)', 'ekimae', 'Vokzal oldi, stansiya oldi', 'ekimae', '駅前で会いましょう。', 'N3', 509),
  ('n3t_510', 'deck_n3_thematic', '具合 (ぐあい)', 'guai', 'Holat, sog''liq ahvoli', 'guai', '具合がいいです。', 'N3', 510),
  ('n3t_511', 'deck_n3_thematic', '区役所 (くやくしょ)', 'kuyakusho', 'Tuman hokimiyati', 'kuyakusho', '区役所へ行きます。', 'N3', 511),
  ('n3t_512', 'deck_n3_thematic', '今夜 (こんや)', 'konya', 'Bugun kechqurun', 'konya', '今夜、友達と会います。', 'N3', 512),
  ('n3t_513', 'deck_n3_thematic', '出張する (しゅっちょうする)', 'shutchō suru', 'Xizmat safariga bormoq', 'shutchō suru', '来週、大阪へ出張します。', 'N3', 513),
  ('n3t_514', 'deck_n3_thematic', '打つ (うつ)', 'utsu', 'Urmoq, zarba bermoq', 'utsu', 'ボールを打ちます。', 'N3', 514),
  ('n3t_515', 'deck_n3_thematic', '回る (まわる)', 'mawaru', 'Aylanmoq, aylanib chiqmoq', 'mawaru', '公園を回ります。', 'N3', 515),
  ('n3t_516', 'deck_n3_thematic', '投げる (なげる)', 'nageru', 'Otmoq, uloqtirmoq', 'nageru', 'ボールを投げます。', 'N3', 516),
  ('n3t_517', 'deck_n3_thematic', 'あきらめる', 'akirameru', 'Taslim bo''lmoq, voz kechmoq', 'akirameru', 'まだあきらめません。', 'N3', 517),
  ('n3t_518', 'deck_n3_thematic', '機会 (きかい)', 'kikai', 'Imkoniyat, fursat', 'kikai', 'いい機会がありました。', 'N3', 518),
  ('n3t_519', 'deck_n3_thematic', '地域 (ちいき)', 'chiiki', 'Hudud, mintaqa', 'chiiki', 'この地域は静かです。', 'N3', 519),
  ('n3t_520', 'deck_n3_thematic', 'チーム', 'chīmu', 'Jamoa', 'chīmu', 'スポーツチームに入ります。', 'N3', 520),
  ('n3t_521', 'deck_n3_thematic', '～君 (～くん)', '~kun', 'O''g''il bolalar yoki yosh erkaklarga qo''shiladigan hurmat shakli', '~kun', '田中君は学生です。', 'N3', 521),
  ('n3t_522', 'deck_n3_thematic', 'シュートする', 'shūto suru', 'Zarba bermoq, golga tepmoq', 'shūto suru', 'ゴールにシュートします。', 'N3', 522),
  ('n3t_523', 'deck_n3_thematic', 'お帰りなさい (おかえりなさい)', 'okaerinasai', 'Xush kelibsiz, uyga qaytganingiz bilan', 'okaerinasai', 'お帰りなさい。', 'N3', 523),
  ('n3t_524', 'deck_n3_thematic', 'よし', 'yoshi', 'Yaxshi, qani, bo''ldi', 'yoshi', 'よし、頑張りましょう。', 'N3', 524),
  ('n3t_525', 'deck_n3_thematic', '食料品 (しょくりょうひん)', 'shokuryōhin', 'Oziq-ovqat mahsulotlari', 'shokuryōhin', '食料品を買います。', 'N3', 525),
  ('n3t_526', 'deck_n3_thematic', '冷凍する (れいとうする)', 'reitō suru', 'Muzlatmoq', 'reitō suru', '肉を冷凍します。', 'N3', 526),
  ('n3t_527', 'deck_n3_thematic', '残す (のこす)', 'nokosu', 'Qoldirmoq, saqlab qo''ymoq', 'nokosu', 'ご飯を残さないでください。', 'N3', 527),
  ('n3t_528', 'deck_n3_thematic', '残る (のこる)', 'nokoru', 'Qolmoq', 'nokoru', '料理が少し残っています。', 'N3', 528),
  ('n3t_529', 'deck_n3_thematic', '体調不良 (たいちょうふりょう)', 'taichō furyō', 'Sog''liqning yomon holati', 'taichō furyō', '今日は体調不良です。', 'N3', 529),
  ('n3t_530', 'deck_n3_thematic', 'おにぎり', 'onigiri', 'Guruchdan tayyorlangan dumaloq taom', 'onigiri', 'おにぎりを食べます。', 'N3', 530),
  ('n3t_531', 'deck_n3_thematic', '元気 (げんき)', 'genki', 'Sog''lom, tetik, quvnoq', 'genki', '今日は元気です。', 'N3', 531),
  ('n3t_532', 'deck_n3_thematic', '元気がない (げんきがない)', 'genki ga nai', 'Kayfiyati yo''q, tushkun', 'genki ga nai', '今日は元気がありません。', 'N3', 532),
  ('n3t_533', 'deck_n3_thematic', '胃 (い)', 'i', 'Oshqozon', 'i', '胃が痛いです。', 'N3', 533),
  ('n3t_534', 'deck_n3_thematic', '痛み (いたみ)', 'itami', 'Og''riq', 'itami', '痛みがあります。', 'N3', 534),
  ('n3t_535', 'deck_n3_thematic', '疲れ (つかれ)', 'tsukare', 'Charchoq', 'tsukare', '疲れがたまりました。', 'N3', 535),
  ('n3t_536', 'deck_n3_thematic', '湿布 (しっぷ)', 'shippu', 'Sovuq yoki issiq kompress plastiri', 'shippu', '肩に湿布を貼ります。', 'N3', 536),
  ('n3t_537', 'deck_n3_thematic', 'うがい', 'ugai', 'Tomoqni chayish', 'ugai', '家に帰ったら、うがいをします。', 'N3', 537),
  ('n3t_538', 'deck_n3_thematic', 'ジム', 'jimu', 'Sport zali', 'jimu', 'ジムで運動します。', 'N3', 538),
  ('n3t_539', 'deck_n3_thematic', '氷 (こおり)', 'kōri', 'Muz', 'kōri', '氷を入れます。', 'N3', 539),
  ('n3t_540', 'deck_n3_thematic', 'ドレッシング', 'doresshingu', 'Salat sousi', 'doresshingu', 'サラダにドレッシングをかけます。', 'N3', 540),
  ('n3t_541', 'deck_n3_thematic', '～金 (～きん)', '~kin', '~ to''lovi, ~ haqi', '~kin', '入会金を払います。', 'N3', 541),
  ('n3t_542', 'deck_n3_thematic', '酔う (よう)', 'you', 'Mast bo''lmoq; ko''ngli aynimoq', 'you', 'お酒に酔いました。', 'N3', 542),
  ('n3t_543', 'deck_n3_thematic', '取れる (とれる)', 'toreru', 'Xalos bo''lmoq, yengillashmoq', 'toreru', '疲れが取れました。', 'N3', 543),
  ('n3t_544', 'deck_n3_thematic', '入会する (にゅうかいする)', 'nyūkai suru', 'Klub yoki guruhga a''zo bo''lmoq', 'nyūkai suru', 'ジムに入会しました。', 'N3', 544),
  ('n3t_545', 'deck_n3_thematic', 'さす', 'sasu', 'Ustida ochib tutmoq', 'sasu', '傘をさします。', 'N3', 545),
  ('n3t_546', 'deck_n3_thematic', 'ガンガン', 'gangan', 'Qattiq, kuchli urib og''rish holati', 'gangan', '頭がガンガンします。', 'N3', 546),
  ('n3t_547', 'deck_n3_thematic', 'パンパン', 'panpan', 'Mushaklar tarang va shishgan holat', 'panpan', '足がパンパンです。', 'N3', 547),
  ('n3t_548', 'deck_n3_thematic', 'フラフラ', 'furafura', 'Boshi aylangan, holsiz holat', 'furafura', 'フラフラします。', 'N3', 548),
  ('n3t_549', 'deck_n3_thematic', 'ムカムカ', 'mukamuka', 'Ko''ngil aynishi', 'mukamuka', '胃がムカムカします。', 'N3', 549),
  ('n3t_550', 'deck_n3_thematic', '毎日に、元気に！ (まいにち、げんきに！)', 'mainichi, genki ni', 'Har kuni tetik bo''ling!', 'mainichi, genki ni', '毎日、元気に過ごしましょう。', 'N3', 550),
  ('n3t_551', 'deck_n3_thematic', '肩 (かた)', 'kata', 'Yelka', 'kata', '肩が痛いです。', 'N3', 551),
  ('n3t_552', 'deck_n3_thematic', '首 (くび)', 'kubi', 'Bo''yin', 'kubi', '首が痛いです。', 'N3', 552),
  ('n3t_553', 'deck_n3_thematic', 'カロリー', 'karorī', 'Kaloriya', 'karorī', 'カロリーを計算します。', 'N3', 553),
  ('n3t_554', 'deck_n3_thematic', 'ジューサー', 'jūsā', 'Sharbat chiqargich', 'jūsā', 'ジューサーでジュースを作ります。', 'N3', 554),
  ('n3t_555', 'deck_n3_thematic', '体脂肪計 (たいしぼうけい)', 'taishibōkei', 'Tana yog''i o''lchagich', 'taishibōkei', '体脂肪計で測ります。', 'N3', 555),
  ('n3t_556', 'deck_n3_thematic', '体脂肪率 (たいしぼうりつ)', 'taishibōritsu', 'Tana yog''i foizi', 'taishibōritsu', '体脂肪率を測ります。', 'N3', 556),
  ('n3t_557', 'deck_n3_thematic', 'ネックストレッチ', 'nekku sutoretchi', 'Bo''yin cho''zish mashqi', 'nekku sutoretchi', 'ネックストレッチをします。', 'N3', 557)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_flashcards (id, deck_id, front, front_ja, back, reading, example, level, sort_order) VALUES
  ('n3t_558', 'deck_n3_thematic', 'マッサージ器 (マッサージき)', 'massāji ki', 'Massaj apparati', 'massāji ki', 'マッサージ器を使います。', 'N3', 558),
  ('n3t_559', 'deck_n3_thematic', '万歩計 (まんぽけい)', 'manpokei', 'Qadam o''lchagich, pedometr', 'manpokei', '万歩計で歩数を測ります。', 'N3', 559),
  ('n3t_560', 'deck_n3_thematic', 'ストレス', 'sutoresu', 'Stress', 'sutoresu', 'ストレスがたまっています。', 'N3', 560),
  ('n3t_561', 'deck_n3_thematic', '虫歯 (むしば)', 'mushiba', 'Tish kariyesi', 'mushiba', '虫歯があります。', 'N3', 561),
  ('n3t_562', 'deck_n3_thematic', 'ビタミンC', 'bitamin shī', 'C vitamini', 'bitamin shī', 'ビタミンCを取ります。', 'N3', 562),
  ('n3t_563', 'deck_n3_thematic', '方法 (ほうほう)', 'hōhō', 'Usul, yo''l', 'hōhō', 'いい方法を考えます。', 'N3', 563),
  ('n3t_564', 'deck_n3_thematic', '健康 (けんこう)', 'kenkō', 'Sog''liq, salomatlik', 'kenkō', '健康に気をつけます。', 'N3', 564),
  ('n3t_565', 'deck_n3_thematic', '栄養 (えいよう)', 'eiyō', 'Oziqlanish, ozuqa', 'eiyō', '栄養のバランスが大切です。', 'N3', 565),
  ('n3t_566', 'deck_n3_thematic', 'ショウガ', 'shōga', 'Zanjabil', 'shōga', 'ショウガを入れます。', 'N3', 566),
  ('n3t_567', 'deck_n3_thematic', 'バランス', 'baransu', 'Muvozanat, balans', 'baransu', '栄養のバランスを考えます。', 'N3', 567),
  ('n3t_568', 'deck_n3_thematic', '～不足 (～ぶそく)', '~busoku', '~ yetishmasligi', '~busoku', '運動不足です。', 'N3', 568),
  ('n3t_569', 'deck_n3_thematic', '疲れを取る (つかれをとる)', 'tsukare o toru', 'Charchoqni yo''qotmoq', 'tsukare o toru', 'ゆっくり休んで疲れを取ります。', 'N3', 569),
  ('n3t_570', 'deck_n3_thematic', '測る (はかる)', 'hakaru', 'O''lchamoq', 'hakaru', '体重を測ります。', 'N3', 570),
  ('n3t_571', 'deck_n3_thematic', '計算する (けいさんする)', 'keisan suru', 'Hisoblamoq', 'keisan suru', 'カロリーを計算します。', 'N3', 571),
  ('n3t_572', 'deck_n3_thematic', 'マッサージする', 'massāji suru', 'Massaj qilmoq', 'massāji suru', '肩をマッサージします。', 'N3', 572),
  ('n3t_573', 'deck_n3_thematic', 'たまる', 'tamaru', 'To''planmoq, yig''ilmoq', 'tamaru', 'ストレスがたまります。', 'N3', 573),
  ('n3t_574', 'deck_n3_thematic', 'やせる', 'yaseru', 'Ozmoq, vazn tashlamoq', 'yaseru', '少しやせました。', 'N3', 574),
  ('n3t_575', 'deck_n3_thematic', 'こる', 'koru', 'Qotib qolmoq, taranglashmoq', 'koru', '肩がこります。', 'N3', 575),
  ('n3t_576', 'deck_n3_thematic', '動かす (うごかす)', 'ugokasu', 'Harakatlantirmoq', 'ugokasu', '体を動かします。', 'N3', 576),
  ('n3t_577', 'deck_n3_thematic', '眠る (ねむる)', 'nemuru', 'Uxlamoq', 'nemuru', '毎晩よく眠ります。', 'N3', 577),
  ('n3t_578', 'deck_n3_thematic', '冷える (ひえる)', 'hieru', 'Sovib qolmoq', 'hieru', '体が冷えました。', 'N3', 578),
  ('n3t_579', 'deck_n3_thematic', 'このごろ', 'kono goro', 'Shu kunlarda, oxirgi paytlarda', 'kono goro', 'このごろ忙しいです。', 'N3', 579),
  ('n3t_580', 'deck_n3_thematic', 'ふーん', 'fūn', 'Hmm, shundaymi', 'fūn', 'ふーん、そうですか。', 'N3', 580),
  ('n3t_581', 'deck_n3_thematic', 'グレープフルーツ', 'gurēpufurūtsu', 'Greypfrut', 'gurēpufurūtsu', 'グレープフルーツを食べます。', 'N3', 581),
  ('n3t_582', 'deck_n3_thematic', '二日酔い (ふつかよい)', 'futsuka yoi', 'Mastlikdan keyingi holat, hangover', 'futsuka yoi', '二日酔いで気分が悪いです。', 'N3', 582),
  ('n3t_583', 'deck_n3_thematic', '温める (あたためる)', 'atatameru', 'Isitmoq', 'atatameru', 'ご飯を温めます。', 'N3', 583),
  ('n3t_584', 'deck_n3_thematic', '釣る (つる)', 'tsuru', 'Baliq tutmoq', 'tsuru', '魚を釣ります。', 'N3', 584),
  ('n3t_585', 'deck_n3_thematic', '不利 (ふり)', 'furi', 'Noqulay, foydasiz holat', 'furi', 'これは少し不利です。', 'N3', 585),
  ('n3t_586', 'deck_n3_thematic', '手に入れる (てにいれる)', 'te ni ireru', 'Qo''lga kiritmoq, ega bo''lmoq', 'te ni ireru', '新しい本を手に入れました。', 'N3', 586),
  ('n3t_587', 'deck_n3_thematic', '町で見かけた子どもたち (まちでみかけたこどもたち)', 'machi de mikaketa kodomo-tachi', 'Shaharda ko''rilgan bolalar', 'machi de mikaketa kodomo-tachi', '町で子どもたちを見かけました。', 'N3', 587),
  ('n3t_588', 'deck_n3_thematic', '親 (おや)', 'oya', 'Ota-ona', 'oya', '親に電話します。', 'N3', 588),
  ('n3t_589', 'deck_n3_thematic', '父親 (ちちおや)', 'chichioya', 'Ota', 'chichioya', '父親は会社員です。', 'N3', 589),
  ('n3t_590', 'deck_n3_thematic', '母親 (ははおや)', 'hahaoya', 'Ona', 'hahaoya', '母親と話します。', 'N3', 590),
  ('n3t_591', 'deck_n3_thematic', '子ども (こども)', 'kodomo', 'Bola', 'kodomo', '子どもが遊んでいます。', 'N3', 591),
  ('n3t_592', 'deck_n3_thematic', '近所の子ども (きんじょのこども)', 'kinjo no kodomo', 'Yaqin atrofdagi bola', 'kinjo no kodomo', '近所の子どもと遊びます。', 'N3', 592),
  ('n3t_593', 'deck_n3_thematic', '家事 (かじ)', 'kaji', 'Uy ishlari', 'kaji', '毎日、家事をします。', 'N3', 593),
  ('n3t_594', 'deck_n3_thematic', 'コーチ', 'kōchi', 'Murabbiy', 'kōchi', 'コーチが教えます。', 'N3', 594),
  ('n3t_595', 'deck_n3_thematic', '塾 (じゅく)', 'juku', 'Qo''shimcha o''quv markazi', 'juku', '学校のあとで塾に行きます。', 'N3', 595),
  ('n3t_596', 'deck_n3_thematic', '数学 (すうがく)', 'sūgaku', 'Matematika', 'sūgaku', '数学を勉強します。', 'N3', 596),
  ('n3t_597', 'deck_n3_thematic', 'ゲームセンター', 'gēmu sentā', 'O''yin markazi', 'gēmu sentā', 'ゲームセンターに行きます。', 'N3', 597),
  ('n3t_598', 'deck_n3_thematic', 'ころ', 'koro', 'Vaqtida, paytida', 'koro', '子どものころ、よく遊びました。', 'N3', 598),
  ('n3t_599', 'deck_n3_thematic', '～キロ', '~kiro', '~ kilometr, ~ kilogramm', '~kiro', '駅まで二キロあります。', 'N3', 599),
  ('n3t_600', 'deck_n3_thematic', '騒ぐ (さわぐ)', 'sawagu', 'Shovqin qilmoq, bezovta qilmoq', 'sawagu', 'ここで騒がないでください。', 'N3', 600),
  ('n3t_601', 'deck_n3_thematic', '世話する (せわする)', 'sewa suru', 'G''amxo''rlik qilmoq, qaramoq', 'sewa suru', '子どもの世話をします。', 'N3', 601),
  ('n3t_602', 'deck_n3_thematic', 'えらい', 'erai', 'Ajoyib, maqtovga loyiq', 'erai', 'よく頑張って、えらいです。', 'N3', 602),
  ('n3t_603', 'deck_n3_thematic', 'この間 (このあいだ)', 'kono aida', 'Yaqinda, o''tgan kuni', 'kono aida', 'この間、友達に会いました。', 'N3', 603),
  ('n3t_604', 'deck_n3_thematic', '必ず (かならず)', 'kanarazu', 'Albatta, shubhasiz', 'kanarazu', '必ず行きます。', 'N3', 604),
  ('n3t_605', 'deck_n3_thematic', 'やっぱり', 'yappari', 'Baribir, o''ylaganimdek', 'yappari', 'やっぱり日本が好きです。', 'N3', 605),
  ('n3t_606', 'deck_n3_thematic', '夜遅く (よるおそく)', 'yoru osoku', 'Tunda kech, juda kech paytda', 'yoru osoku', '夜遅くまで勉強します。', 'N3', 606),
  ('n3t_607', 'deck_n3_thematic', 'うち', 'uchi', 'Men, uyim, mening tomonim', 'uchi', 'うちに帰ります。', 'N3', 607),
  ('n3t_608', 'deck_n3_thematic', 'うちの親 (うちのおや)', 'uchi no oya', 'Mening ota-onam', 'uchi no oya', 'うちの親は元気です。', 'N3', 608),
  ('n3t_609', 'deck_n3_thematic', '海外 (かいがい)', 'kaigai', 'Chet el, xorij', 'kaigai', '海外で働きたいです。', 'N3', 609),
  ('n3t_610', 'deck_n3_thematic', '曲 (きょく)', 'kyoku', 'Qo''shiq, musiqa asari', 'kyoku', '好きな曲を聞きます。', 'N3', 610),
  ('n3t_611', 'deck_n3_thematic', '教育 (きょういく)', 'kyōiku', 'Ta''lim, tarbiya', 'kyōiku', '教育は大切です。', 'N3', 611),
  ('n3t_612', 'deck_n3_thematic', '化粧品 (けしょうひん)', 'keshōhin', 'Kosmetika', 'keshōhin', '化粧品を買います。', 'N3', 612),
  ('n3t_613', 'deck_n3_thematic', 'けんかする', 'kenka suru', 'Janjallashmoq, urishmoq', 'kenka suru', '兄弟でけんかしました。', 'N3', 613),
  ('n3t_614', 'deck_n3_thematic', '泣く (なく)', 'naku', 'Yig''lamoq', 'naku', '子どもが泣いています。', 'N3', 614),
  ('n3t_615', 'deck_n3_thematic', 'やる', 'yaru', 'Qilmoq', 'yaru', '宿題をやります。', 'N3', 615),
  ('n3t_616', 'deck_n3_thematic', '宿題をやる (しゅくだいをやる)', 'shukudai o yaru', 'Uy vazifasini qilmoq', 'shukudai o yaru', '毎日、宿題をやります。', 'N3', 616),
  ('n3t_617', 'deck_n3_thematic', '厳しい (きびしい)', 'kibishii', 'Qattiqqo''l, talabchan, og''ir', 'kibishii', '父は厳しいです。', 'N3', 617),
  ('n3t_618', 'deck_n3_thematic', '熱心 (ねっしん)', 'nesshin', 'G''ayratli, astoydil', 'nesshin', '先生は仕事に熱心です。', 'N3', 618),
  ('n3t_619', 'deck_n3_thematic', '何でも (なんでも)', 'nandemo', 'Har qanday narsa, nima bo''lsa ham', 'nandemo', '何でも聞いてください。', 'N3', 619),
  ('n3t_620', 'deck_n3_thematic', '僕 (ぼく)', 'boku', 'Men (yosh erkaklar ishlatadigan norasmiy shakl)', 'boku', '僕は学生です。', 'N3', 620),
  ('n3t_621', 'deck_n3_thematic', '祖母 (そぼ)', 'sobo', 'Buvi', 'sobo', '祖母は元気です。', 'N3', 621),
  ('n3t_622', 'deck_n3_thematic', 'おもちゃ', 'omocha', 'O''yinchoq', 'omocha', '子どもにおもちゃをあげます。', 'N3', 622),
  ('n3t_623', 'deck_n3_thematic', '役に立つ (やくにたつ)', 'yaku ni tatsu', 'Foydali bo''lmoq, ish bermoq', 'yaku ni tatsu', 'この本は役に立ちます。', 'N3', 623),
  ('n3t_624', 'deck_n3_thematic', 'ちゃんと', 'chanto', 'To''g''ri, yaxshilab, tartibli ravishda', 'chanto', 'ちゃんと勉強してください。', 'N3', 624),
  ('n3t_625', 'deck_n3_thematic', '仕方がない (しかたがない)', 'shikata ga nai', 'Boshqa chora yo''q, iloj yo''q', 'shikata ga nai', '仕方がないです。', 'N3', 625),
  ('n3t_626', 'deck_n3_thematic', '漫画家 (まんがか)', 'mangaka', 'Manga rassomi, manga chizuvchi', 'mangaka', '漫画家になりたいです。', 'N3', 626),
  ('n3t_627', 'deck_n3_thematic', '～部 (～ぶ)', '~bu', '~ bo''lim, ~ klub', '~bu', 'テニス部に入っています。', 'N3', 627),
  ('n3t_628', 'deck_n3_thematic', 'メジャーな', 'mejā na', 'Mashhur, ommabop, asosiy', 'mejā na', 'これはメジャーなスポーツです。', 'N3', 628),
  ('n3t_629', 'deck_n3_thematic', '連載する (れんさいする)', 'rensai suru', 'Seriyali tarzda nashr etmoq', 'rensai suru', 'この漫画は雑誌で連載しています。', 'N3', 629),
  ('n3t_630', 'deck_n3_thematic', 'スタートする', 'sutāto suru', 'Boshlamoq', 'sutāto suru', 'イベントがスタートします。', 'N3', 630),
  ('n3t_631', 'deck_n3_thematic', 'ヒットする', 'hitto suru', 'Juda ommalashmoq, hit bo''lmoq', 'hitto suru', 'この歌がヒットしました。', 'N3', 631),
  ('n3t_632', 'deck_n3_thematic', '奨学金 (しょうがくきん)', 'shōgakukin', 'Stipendiya, grant', 'shōgakukin', '奨学金をもらいました。', 'N3', 632),
  ('n3t_633', 'deck_n3_thematic', '支援する (しえんする)', 'shien suru', 'Qo''llab-quvvatlamoq', 'shien suru', '学生を支援します。', 'N3', 633),
  ('n3t_634', 'deck_n3_thematic', '女の子 (おんなのこ)', 'onna no ko', 'Qiz bola', 'onna no ko', '女の子が遊んでいます。', 'N3', 634),
  ('n3t_635', 'deck_n3_thematic', 'おせち料理 (おせちりょうり)', 'osechi ryōri', 'Yangi yilga tayyorlanadigan an''anaviy yapon taomlari', 'osechi ryōri', 'お正月におせち料理を食べます。', 'N3', 635),
  ('n3t_636', 'deck_n3_thematic', '行事 (ぎょうじ)', 'gyōji', 'Tadbir, marosim', 'gyōji', '学校の行事があります。', 'N3', 636),
  ('n3t_637', 'deck_n3_thematic', '敬老の日 (けいろうのひ)', 'keirō no hi', 'Keksalarni hurmat qilish kuni', 'keirō no hi', '敬老の日に祖母に電話します。', 'N3', 637),
  ('n3t_638', 'deck_n3_thematic', '（お）正月 (おしょうがつ)', 'oshōgatsu', 'Yangi yil bayrami', 'oshōgatsu', 'お正月に家族と過ごします。', 'N3', 638),
  ('n3t_639', 'deck_n3_thematic', '七五三 (しちごさん)', 'shichigosan', '7-5-3 bolalar bayrami', 'shichigosan', '七五三は子どもの行事です。', 'N3', 639),
  ('n3t_640', 'deck_n3_thematic', '新年 (しんねん)', 'shinnen', 'Yangi yil', 'shinnen', '新年を家族と祝います。', 'N3', 640),
  ('n3t_641', 'deck_n3_thematic', '成人式 (せいじんしき)', 'seijinshiki', 'Voyaga yetganlik marosimi', 'seijinshiki', '成人式に参加します。', 'N3', 641),
  ('n3t_642', 'deck_n3_thematic', '節分 (せつぶん)', 'setsubun', 'Setsubun, qish oxiri marosimi', 'setsubun', '節分に豆をまきます。', 'N3', 642),
  ('n3t_643', 'deck_n3_thematic', 'ひなまつり', 'hinamatsuri', 'Qizlar bayrami, Hina Matsuri', 'hinamatsuri', '三月三日はひなまつりです。', 'N3', 643),
  ('n3t_644', 'deck_n3_thematic', '（お）赤飯 (おせきはん)', 'osekihan', 'Bayramlarda yeyiladigan qizil guruch', 'osekihan', 'お祝いに赤飯を食べます。', 'N3', 644),
  ('n3t_645', 'deck_n3_thematic', '布 (ぬの)', 'nuno', 'Mato, gazlama', 'nuno', '布で包みます。', 'N3', 645),
  ('n3t_646', 'deck_n3_thematic', '年賀状 (ねんがじょう)', 'nengajō', 'Yangi yil tabriknomasi', 'nengajō', '年賀状を書きます。', 'N3', 646),
  ('n3t_647', 'deck_n3_thematic', 'はがき', 'hagaki', 'Pochta kartochkasi', 'hagaki', 'はがきを送ります。', 'N3', 647),
  ('n3t_648', 'deck_n3_thematic', 'ふろしき', 'furoshiki', 'Narsalarni o''rash uchun mato', 'furoshiki', 'ふろしきで荷物を包みます。', 'N3', 648),
  ('n3t_649', 'deck_n3_thematic', 'ランドセル', 'randoseru', 'Boshlang''ich maktab o''quvchisi sumkasi', 'randoseru', 'ランドセルを背負います。', 'N3', 649),
  ('n3t_650', 'deck_n3_thematic', 'ウナギ', 'unagi', 'Ilonbaliq', 'unagi', 'ウナギを食べます。', 'N3', 650),
  ('n3t_651', 'deck_n3_thematic', '大晦日 (おおみそか)', 'ōmisoka', 'Yilning so''nggi kuni', 'ōmisoka', '大晦日にそばを食べます。', 'N3', 651),
  ('n3t_652', 'deck_n3_thematic', '数 (かず)', 'kazu', 'Son, miqdor', 'kazu', '数を数えます。', 'N3', 652),
  ('n3t_653', 'deck_n3_thematic', '（お）金持ち (おかねもち)', 'okanemochi', 'Boy odam', 'okanemochi', 'あの人はお金持ちです。', 'N3', 653),
  ('n3t_654', 'deck_n3_thematic', 'スイカ', 'suika', 'Tarvuz', 'suika', '夏にスイカを食べます。', 'N3', 654),
  ('n3t_655', 'deck_n3_thematic', 'ブルーベリー', 'burūberī', 'Ko''k rezavor meva, blueberry', 'burūberī', 'ブルーベリーを食べます。', 'N3', 655),
  ('n3t_656', 'deck_n3_thematic', 'ミカン', 'mikan', 'Mandarin', 'mikan', 'ミカンを食べます。', 'N3', 656),
  ('n3t_657', 'deck_n3_thematic', '豆 (まめ)', 'mame', 'Loviya, dukkakli don', 'mame', '豆を食べます。', 'N3', 657),
  ('n3t_658', 'deck_n3_thematic', 'ユズ', 'yuzu', 'Yuzu, yapon sitrusi', 'yuzu', 'ユズを使います。', 'N3', 658),
  ('n3t_659', 'deck_n3_thematic', '冬至 (とうじ)', 'tōji', 'Qish quyoshi turishi, qishki quyosh turishi', 'tōji', '冬至にゆず湯に入ります。', 'N3', 659),
  ('n3t_660', 'deck_n3_thematic', '年 (とし)', 'toshi', 'Yosh, yil', 'toshi', '今年はいい年です。', 'N3', 660),
  ('n3t_661', 'deck_n3_thematic', '土用の丑の日 (どようのうしのひ)', 'doyō no ushi no hi', 'Midsummerda eel yeyiladigan maxsus kun', 'doyō no ushi no hi', '土用の丑の日にうなぎを食べます。', 'N3', 661),
  ('n3t_662', 'deck_n3_thematic', '招き猫 (まねきねこ)', 'maneki neko', 'Omad chaqiruvchi mushuk haykalchasi', 'maneki neko', '店に招き猫があります。', 'N3', 662),
  ('n3t_663', 'deck_n3_thematic', '遊び (あそび)', 'asobi', 'O''yin, hordiq', 'asobi', '子どもたちは遊びが好きです。', 'N3', 663),
  ('n3t_664', 'deck_n3_thematic', 'お盆 (おぼん)', 'obon', 'Obon, marhumlarni xotirlash bayrami', 'obon', 'お盆に家族が集まります。', 'N3', 664),
  ('n3t_665', 'deck_n3_thematic', '空手 (からて)', 'karate', 'Karate', 'karate', '空手を習っています。', 'N3', 665),
  ('n3t_666', 'deck_n3_thematic', '餃子 (ぎょうざ)', 'gyōza', 'Gyoza, ichli xamir taomi', 'gyōza', '餃子を食べます。', 'N3', 666),
  ('n3t_667', 'deck_n3_thematic', 'ごちそう', 'gochisō', 'Hashamatli ovqat, ziyofat', 'gochisō', '今日はごちそうを食べます。', 'N3', 667),
  ('n3t_668', 'deck_n3_thematic', 'シチュー', 'shichū', 'Dimlama, stew', 'shichū', 'シチューを作ります。', 'N3', 668),
  ('n3t_669', 'deck_n3_thematic', '将棋 (しょうぎ)', 'shōgi', 'Shogi, yapon shaxmati', 'shōgi', '父と将棋をします。', 'N3', 669),
  ('n3t_670', 'deck_n3_thematic', '先祖 (せんぞ)', 'senzo', 'Ajdodlar', 'senzo', '先祖のお墓に行きます。', 'N3', 670),
  ('n3t_671', 'deck_n3_thematic', 'チェス', 'chesu', 'Shaxmat', 'chesu', 'チェスをします。', 'N3', 671),
  ('n3t_672', 'deck_n3_thematic', 'テコンドー', 'tekondō', 'Taekvondo', 'tekondō', 'テコンドーを習います。', 'N3', 672)
ON CONFLICT (id) DO UPDATE SET deck_id = EXCLUDED.deck_id, front = EXCLUDED.front, front_ja = EXCLUDED.front_ja, back = EXCLUDED.back, reading = EXCLUDED.reading, example = EXCLUDED.example, level = EXCLUDED.level, sort_order = EXCLUDED.sort_order;
-- mobile_flashcards: 2395 rows
-- mock exams
-- @@CHUNK@@
INSERT INTO public.mobile_quiz_questions (id, quiz_type, lesson_id, level, section, set_no, question, options, correct_index, explanation, sort_order) VALUES
  ('mock_n5_s1_101', 'mock', NULL, 'N5', 'knowledge', 1, 'きょうは 水曜日（すいようび）です。あしたは（　）曜日です。', '["火","木","金","土"]'::jsonb, 1, 'Bugun Chorshanba (水曜日). Ertaga esa Payshanba (木曜日 - もくようび) bo''ladi. 火曜日 - Seshanba, 金曜日 - Juma, 土曜日 - Shanba.', 1),
  ('mock_n5_s1_102', 'mock', NULL, 'N5', 'knowledge', 1, '教室（きょうしつ）の なかに つくえ（　）いすが あります。', '["と","が","を","も"]'::jsonb, 0, 'Narsalarni to''liq sanab o''tishda ''va'' ma''nosida ''と'' yuklamasi keladi: つくえ と いす (stol va stul).', 2),
  ('mock_n5_s1_103', 'mock', NULL, 'N5', 'knowledge', 1, '毎朝、新聞を（　）から、会社へ行きます。', '["読みます","読んで","読んだ","読む"]'::jsonb, 1, 'Ketma-ket harakatlarda ''~te kara'' (qilib bo''lgach) grammatikasi qo''llanadi: 読んでから (o''qib bo''lgach).', 3),
  ('mock_n5_s1_104', 'mock', NULL, 'N5', 'knowledge', 1, '駅まで バスで どの（　）かかりますか。', '["いくら","ぐらい","ごろ","なんにん"]'::jsonb, 1, 'Vaqt yoki muddat miqdorini (taxminan qancha) so''rashda ''どのぐらい'' (dono gurai) birikmasi ishlatiladi.', 4),
  ('mock_n5_s1_105', 'mock', NULL, 'N5', 'knowledge', 1, '田中さんは（毎朝）ジョギングを します。', '["まいあさ","まいばん","まいとし","まいにち"]'::jsonb, 0, '「毎朝」kanjisining to''g''ri o''qilishi — まいあさ (har tong). 毎晩 - har oqshom, 毎日 - har kun.', 5),
  ('mock_n5_s1_106', 'mock', NULL, 'N5', 'knowledge', 1, 'わたしは 毎朝 7時半（　）起きます。', '["に","で","を","へ"]'::jsonb, 0, 'Aniq vaqt ko''rsatkichlaridan keyin (soat, daqiqa) ''に'' yuklamasi qo''yiladi: 7時半に 起きます (7 yarimda uyg''onaman).', 6),
  ('mock_n5_s1_107', 'mock', NULL, 'N5', 'knowledge', 1, '日本人は はし（　）ご飯を 食べます。', '["に","で","を","へ"]'::jsonb, 1, 'Biror vosita yoki qurol yordamida harakat bajarilganda ''で'' yuklamasi ishlatiladi: はしで (cho''p bilan).', 7),
  ('mock_n5_s1_108', 'mock', NULL, 'N5', 'knowledge', 1, '部屋が 暗いですから、電気を（　）ください。', '["つけて","消して","あけて","しめて"]'::jsonb, 0, 'Xona qorong''i bo''lgani uchun chiroqni yoqish so''ralmoqda. Chiroqni yoqish — つける (つけます -> つけて). 消す - o''chirmoq.', 8),
  ('mock_n5_s1_109', 'mock', NULL, 'N5', 'knowledge', 1, '日曜日、デパートへ（友だち）と 行きました。', '["こども","ともだち","きょうだい","かぞく"]'::jsonb, 1, '「友だち」kanjisining to''g''ri o''qilishi — ともだち (do''st). 子ども - bola, 家族 - oila.', 9),
  ('mock_n5_s1_110', 'mock', NULL, 'N5', 'knowledge', 1, 'ここは 図書館ですから、大きな声で（　）で ください。', '["話さない","話す","話して","話した"]'::jsonb, 0, 'Biror ishni qilmaslikni so''rashda inkor ''〜ないでください'' qolipi ishlatiladi: 話さないでください (gapirmang).', 10),
  ('mock_n5_s1_111', 'mock', NULL, 'N5', 'knowledge', 1, 'この みかんは 甘くて、（　）です。', '["おいしい","おいしくて","おいしかった","おいしくない"]'::jsonb, 0, 'Gap oxirida kesim sifatida i-sifatning lug''aviy shakli + です keladi: 甘くて、おいしいです (shirin va mazali).', 11),
  ('mock_n5_s1_112', 'mock', NULL, 'N5', 'knowledge', 1, 'テーブルの上に ペンが（　）あります。', '["3ぽん","3まい","3さつ","3だい"]'::jsonb, 0, 'Qalam, ruchka kabi uzun ingichka buyumlar ''本 (ほん/ぼん/ぽん)'' sanoq so''zi bilan sanaladi: 3本 (さんぼん).', 12),
  ('mock_n5_s1_113', 'mock', NULL, 'N5', 'knowledge', 1, '正しい文を作ってください：
昨日 ＿＿ ＿＿ ★ ＿＿ 買いました。', '["デパートで","新しい","靴（くつ）を","友達と"]'::jsonb, 2, 'To''g''ri tartib: 昨日 [友達と] [デパートで] [★ 靴を] [新しい] 買いました (yoki 新しい 靴を). Yulduzcha o''rnida 靴を (3-variant) turadi.', 13),
  ('mock_n5_s1_114', 'mock', NULL, 'N5', 'reading', 1, 'リーさんは 何で 学校へ 行きますか？', '["歩いて","バスで","自転車で","電車で"]'::jsonb, 2, 'Matnda aniq keltirilgan: ''jitensha de gakkou e ikimasu'' (velosipedda maktabga boradi).', 14),
  ('mock_n5_s1_115', 'mock', NULL, 'N5', 'reading', 1, '二人の 食事は いくらでしたか？', '["1500円","2000円","3000円","6000円"]'::jsonb, 2, 'Matnda ''Futari de 3000-en deshita'' (ikkalamizga jami 3000 yen bo''ldi) deyilgan.', 15),
  ('mock_n5_s1_116', 'mock', NULL, 'N5', 'reading', 1, 'タケシさんは カレーを 食べた後で、何を しなければなりませんか？', '["カレーを作る","お皿を洗う","母を駅へ迎えに行く","冷蔵庫を掃除する"]'::jsonb, 1, 'Onaning xatida: ''食べたあとで、お皿を洗っておいてね'' (ovqatlangandan so''ng likopchalarni yuvib qo''y) deb topshiriq berilgan.', 16),
  ('mock_n5_s1_117', 'mock', NULL, 'N5', 'reading', 1, '山田さんは 日曜日の午前に 何を しましたか？', '["映画を見た","友達とお茶を飲んだ","公園を散歩した","一日中うちにいた"]'::jsonb, 2, 'Matnda: ''日曜日はとてもいい天気でした。山田さんは朝9時から公園を散歩して...'' (yakshanba ertalab 9 dan parkda sayr qildi) deb yozilgan.', 17),
  ('mock_n5_s1_118', 'mock', NULL, 'N5', 'reading', 1, 'マリアさんは 今、何が できますか？', '["漢字がたくさん読める","ひらがなとカタカナが読める","日本語でスピーチができる","英語を教えている"]'::jsonb, 1, 'Matnda: ''今はひらがなとカタカナが読めます'' (Hozir hiragana va katakanani o''qiy olaman) deb yozilgan. Kanji o''rganish kelasi hafta boshlanadi.', 18),
  ('mock_n5_s1_119', 'mock', NULL, 'N5', 'reading', 1, '土曜日の 午後3時に このクリニックで 診察を 受けることが できますか？', '["受けることができる","予約があれば受けられる","午後は休診なので受けることができない","祝日なら受けられる"]'::jsonb, 2, 'E''londa yozilgan: ''土曜日：午前 9:00〜13:00（午後は休診）'' — Shanba kuni tushdan keyin klinika ishlamaydi (休診 - qabul yo''q).', 19),
  ('mock_n5_s1_120', 'mock', NULL, 'N5', 'listening', 1, 'お皿の右側に何を置きますか？', '["フォーク","ナイフ","スプーン","はし"]'::jsonb, 2, 'Ayol kishi: ''migi gawa ni supuun o oite kudasai'' (o''ng tomonga qoshiqni qo''ying) deb aytadi.', 20),
  ('mock_n5_s1_121', 'mock', NULL, 'N5', 'listening', 1, '男の人はあした何時に起きますか？', '["6時","7時","8時","9時"]'::jsonb, 1, 'Erkak kishi: ''7-ji ni okiru yo'' (soat 7 da uyg''onaman) deb javob beradi.', 21),
  ('mock_n5_s1_122', 'mock', NULL, 'N5', 'listening', 1, '二人は 明日 どこで 会いますか？', '["駅の改札口","北口の本屋の前","南口のカフェ","映画館の入り口"]'::jsonb, 1, 'Suhbatda ayol ''北口の本屋さんの前にしない？'' (Shimoliy chiqishdagi kitob do''koni oldi bo''lsinmi?) deb taklif qiladi va erkak rozi bo''ladi.', 22),
  ('mock_n5_s1_123', 'mock', NULL, 'N5', 'listening', 1, '学生は 明日 机の上に 何を 出しますか？', '["辞書と教科書","えんぴつと消しゴム","ノートと教科書","携帯電話"]'::jsonb, 1, 'O''qituvchi: ''えんぴつと消しゴムを必ず持ってきてください'' (Qalam va o''chirg''ichni albatta olib keling) deb ta''kidlaydi.', 23),
  ('mock_n5_s1_124', 'mock', NULL, 'N5', 'listening', 1, '男の人は 何を着て 出かけますか？', '["薄いシャツ","厚いコート","レインコート","セーターだけ"]'::jsonb, 1, 'Erkak kishi: ''じゃあ厚いコートを着ていくよ'' (U holda qalin palto kiyib boraman) deb javob beradi.', 24),
  ('mock_n5_s1_125', 'mock', NULL, 'N5', 'listening', 1, '男の人は 飲み物に 何を 頼みましたか？', '["温かいコーヒー","冷たいお茶","ジュース","コーラ"]'::jsonb, 1, 'Mijoz: ''冷たいお茶をください'' (Muzdek choy bering) deb buyurtma qiladi.', 25),
  ('mock_n5_s2_126', 'mock', NULL, 'N5', 'knowledge', 2, 'あしたは（雨）ですか。', '["ゆき","はれ","くもり","あめ"]'::jsonb, 3, '「雨」（yomg''ir）so''zining to''g''ri o''qilishi — あめ (ame). ゆき — qor, はれ — ochiq havo, くもり — bulutli havo.', 26),
  ('mock_n5_s2_127', 'mock', NULL, 'N5', 'knowledge', 2, 'きょうしつで（書いて）ください。', '["かいて","きいて","はいて","ひいて"]'::jsonb, 0, '「書く」（yozmoq）fe''lining te-shakli — かいて (kaite). きいて — eshitib/so''rab, はいて — kiyib/supurib, ひいて — chalib/tortib.', 27),
  ('mock_n5_s2_128', 'mock', NULL, 'N5', 'knowledge', 2, 'しゃしんは はこの（中）に あります。', '["そば","そと","なか","よこ"]'::jsonb, 2, '「中」（ichida, ichkarisida）so''zining to''g''ri o''qilishi — なか (naka). そば — yonida, そと — tashqarisida, よこ — yon tomonida.', 28),
  ('mock_n5_s2_129', 'mock', NULL, 'N5', 'knowledge', 2, 'この いすは（小さい）です。', '["ちいさい","ちさい","しいさい","しさい"]'::jsonb, 0, '「小さい」（kichkina）so''zining to''g''ri o''qilishi — ちいさい (chiisai). Cho''ziq ''ii'' tovushi bilan yoziladi.', 29),
  ('mock_n5_s2_130', 'mock', NULL, 'N5', 'knowledge', 2, 'あしたは（火よう日）です。', '["どようび","すいようび","かようび","にちようび"]'::jsonb, 2, '「火曜日」（Seshanba）ning to''g''ri o''qilishi — かようび (kayoubi). どようび — Shanba, すいようび — Chorshanba, にちようび — Yakshanba.', 30),
  ('mock_n5_s2_131', 'mock', NULL, 'N5', 'knowledge', 2, 'せいとは（百人）います。', '["ひゃくにん","びゃくにん","ひゃくじん","びゃくじん"]'::jsonb, 0, '「百人」（yuz nafar kishi/o''quvchi）ning to''g''ri o''qilishi — ひゃくにん (hyakunin). Odam sanaganda ''nin'' qo''shimchasi ulanadi.', 31),
  ('mock_n5_s2_132', 'mock', NULL, 'N5', 'knowledge', 2, 'わたしの くには（かわ）が おおいです。', '["花","山","川","木"]'::jsonb, 2, '「かわ」（daryo）so''zining to''g''ri kanji yozilishi — 川 (kawa). 花 — gul, 山 — tog'', 木 — daraxt.', 32),
  ('mock_n5_s2_133', 'mock', NULL, 'N5', 'knowledge', 2, 'きのうは（かいしゃ）を やすみました。', '["公仕","公社","会仕","会社"]'::jsonb, 3, '「かいしゃ」（firma, korxona）ning to''g''ri kanji yozilishi — 会社 (kaisha). 会 (uchrashuv) + 社 (jamiyat).', 33),
  ('mock_n5_s2_134', 'mock', NULL, 'N5', 'knowledge', 2, '（　）を わすれましたから、じかんが わかりません。', '["じしょ","ちず","とけい","さいふ"]'::jsonb, 2, 'Vaqtni bilish uchun ''soat'' kerak bo''ladi: とけい (tokei - soat). じしょ — lug''at, ちず — xarita, さいふ — hamyon.', 34),
  ('mock_n5_s2_135', 'mock', NULL, 'N5', 'knowledge', 2, 'わたしの うちは えきに ちかいですから、（　）です。', '["べんり","じょうぶ","いっぱい","へた"]'::jsonb, 0, 'Vokzalga yaqin bo''lgan uy qulay (べんり - benri) hisoblanadi. じょうぶ — baquvvat, いっぱい — to''la, へた — no''noq.', 35),
  ('mock_n5_s2_136', 'mock', NULL, 'N5', 'knowledge', 2, '田中さんは イギリス人（　）けっこんしました。', '["と","に","を","へ"]'::jsonb, 0, 'Biror inson bilan turmush qurishda o''sha shaxsga ''bilan'' ma''nosida ''と'' yuklamasi ulanadi: イギリス人と結婚しました.', 36),
  ('mock_n5_s2_137', 'mock', NULL, 'N5', 'knowledge', 2, 'すみません、この りんごを みっつ（　）ください。', '["を","に","で","と"]'::jsonb, 0, 'Ob''ektni ko''rsatib iltimos qilishda ''o'' (を) keladi: りんごを 3つ ください (olmadan 3 ta bering).', 37),
  ('mock_n5_s2_138', 'mock', NULL, 'N5', 'knowledge', 2, 'きのう デパートへ シャツを かい（　）いきました。', '["に","で","を","へ"]'::jsonb, 0, 'Harakat maqsadini bildirishda fe''l o''zagiga ''~ni ikimasu'' (qilish uchun bormoq) qo''shiladi: かいに行きました (sotib olgani bordim).', 38),
  ('mock_n5_s2_139', 'mock', NULL, 'N5', 'reading', 2, '図書館について、正しいものは どれですか。', '["土曜日も 本を 借りることが できる。","本は 1回に 5さつまで 借りられる。","平日の 朝9時から 夕方5時まで 開いている。","本は 1か月 借りることが できる。"]'::jsonb, 2, 'E''londa ochiq aytilgan: Dushanbadan Jumagacha (hafta ichi kunlari) soat 9:00 dan 17:00 gacha kutubxona ochiq bo''ladi.', 39),
  ('mock_n5_s2_140', 'mock', NULL, 'N5', 'reading', 2, 'リーさんは なぜ このメールを 書きましたか。', '["ケーキの 作り方を 質問するため。","パーティーの お礼を 言って、写真を 送るため。","来週の 約束を キャンセルするため。","新しい カメラを 買ってもらうため。"]'::jsonb, 1, 'Xat kechagi shirin ziyofat va shirinlik uchun minnatdorchilik bildirish hamda suratlarni yuborish maqsadida yozilgan.', 40),
  ('mock_n5_s2_141', 'mock', NULL, 'N5', 'reading', 2, 'ツアーの 参加者は 昼ご飯を どこで 食べますか。', '["新宿駅の レストラン","富士山の 5合目","出発前の バスの中","午後3時の 新宿"]'::jsonb, 1, 'Jadvalda aniq ko''rsatilgan: 11:00 da Fujisan 5-bosqichiga (5合目) yetib boriladi va o''sha yerda tushlik qilinadi.', 41),
  ('mock_n5_s2_142', 'mock', NULL, 'N5', 'reading', 2, 'この人は 朝 何時に うちを 出ますか。', '["6時","7時半","8時","8時45分"]'::jsonb, 1, 'Matnda aniq keltirilgan: ''7時半に うちを 出て'' (soat 7:30 da uydan chiqib ketadi).', 42),
  ('mock_n5_s2_143', 'mock', NULL, 'N5', 'reading', 2, '土曜日の 午後2時に クリニックへ 行くと どうなりますか。', '["診察を 受けることが できる。","薬だけ もらえる。","休みなので 診察は 受けられない。","保険証が あれば 見てもらえる。"]'::jsonb, 2, 'Shanba kuni faqat 13:00 gacha ishlaydi, tushdan keyin ''午後休診'' (dam olish) bo''lgani sababli ko''rikdan o''tib bo''lmaydi.', 43),
  ('mock_n5_s2_144', 'mock', NULL, 'N5', 'reading', 2, '買わなくても いいものは どれですか。', '["牛乳","りんご","パン","卵"]'::jsonb, 3, 'Eslatmada aniq yozilgan: ''卵は まだ 冷蔵庫に 6個 あるので、買わなくて いいです'' (tuxum muzlatgichda bor, sotib olish shart emas).', 44),
  ('mock_n5_s2_145', 'mock', NULL, 'N5', 'listening', 2, '男の人は 何を 飲みますか？', '["お茶","コーヒー","冷たいジュース","水"]'::jsonb, 2, 'Mehmon tavsiya etilgan ichimliklar orasidan sovuq sharbatni tanladi: ''冷たい ジュースを ください''.', 45),
  ('mock_n5_s2_146', 'mock', NULL, 'N5', 'listening', 2, '学生が 明日 持ってくるものは どれですか？', '["エプロンと三角巾","包丁とお皿","教科書とノート","お弁当"]'::jsonb, 0, 'O''qituvchi talabalarga oshxona fartugi va ro''molcha (エプロンと三角巾) olib kelishni tayinladi.', 46),
  ('mock_n5_s2_147', 'mock', NULL, 'N5', 'listening', 2, '男の人は 全部で いくら 払いますか？', '["300円","400円","500円","600円"]'::jsonb, 1, '2 ta olma (200 yen) va 1 bog'' banan (200 yen) jami 400 yen bo''ladi: ''合わせて 400円になります''.', 47),
  ('mock_n5_s2_148', 'mock', NULL, 'N5', 'listening', 2, '女の人は 何番線の 電車に 乗りますか？', '["1番線","2番線","3番線","4番線"]'::jsonb, 1, 'Bekat xodimi Tokyo vokzaliga borish uchun 2-yo''ldagi poyezdga chiqishni aytdi: ''2番線の 電車に 乗ってください''.', 48),
  ('mock_n5_s2_149', 'mock', NULL, 'N5', 'listening', 2, '二人は 何時に 会いますか？', '["1時","1時半","2時","2時半"]'::jsonb, 1, 'Kino 14:00 da boshlanadi, ular 30 daqiqa oldin — soat 1:30 da (1時半) uchrashishga kelishdilar.', 49),
  ('mock_n5_s2_150', 'mock', NULL, 'N5', 'listening', 2, '男の人は 次に どこへ 行きますか？', '["1階の薬局","2階の3番の部屋の前","会計の窓口","外のタクシー乗り場"]'::jsonb, 1, 'Qabulxona xodimi 2-qavatdagi 3-xona oldida kutishni aytdi: ''2階の 3番の 部屋の前で お待ちください''.', 50),
  ('mock_n5_s3_151', 'mock', NULL, 'N5', 'knowledge', 3, 'きのう、あたらしい（車）を かいました。', '["くるま","でんしゃ","じてんしゃ","ひこうき"]'::jsonb, 0, '「車」（mashina/avtomobil）kanjisining to''g''ri o''qilishi — くるま (kuruma). でんしゃ — poyezd, じてんしゃ — velosiped.', 51),
  ('mock_n5_s3_152', 'mock', NULL, 'N5', 'knowledge', 3, 'つくえの うえに ほんが（五冊）あります。', '["ごほん","ごさつ","ごまい","ごだい"]'::jsonb, 1, 'Kitob va daftarlar «〜冊（さつ）» qo''shimchasi bilan sanaladi: 五冊 — ごさつ (beshta kitob).', 52),
  ('mock_n5_s3_153', 'mock', NULL, 'N5', 'knowledge', 3, 'きょうは てんきが よくて、（あたたかい）です。', '["暑い","涼しい","暖かい","寒い"]'::jsonb, 2, '«Iliq» (ob-havo) so''zining to''g''ri kanjisi — 暖かい (あたたかい). 暑い — issiq, 寒い — sovuq.', 53),
  ('mock_n5_s3_154', 'mock', NULL, 'N5', 'knowledge', 3, 'あした ともだち（　）えいがを みに いきます。', '["に","を","で","と"]'::jsonb, 3, 'Birgalikda harakat bajarilganda biriktiruvchi «と» yuklamasi ishlatiladi: ともだちと (do''stim bilan).', 54),
  ('mock_n5_s3_155', 'mock', NULL, 'N5', 'knowledge', 3, 'すみません、この りんごを みっつ（　）。', '["ください","あります","います","します"]'::jsonb, 0, 'Xarid qilishda buyurtma «〜を ください» (bering) bilan ifodalanadi: みっつ ください (uchta bering).', 55),
  ('mock_n5_s3_156', 'mock', NULL, 'N5', 'knowledge', 3, 'わたしは まいばん おんがくを（　）ながら ほんを よみます。', '["きいて","きき","きく","きいた"]'::jsonb, 1, 'Bir vaqtda ikkita ishni bajarishda V-masu o''zagi + ながら: 聞きながら (tinglagan holda).', 56),
  ('mock_n5_s3_157', 'mock', NULL, 'N5', 'knowledge', 3, 'へやの でんきを（　）から、ねます。', '["けす","けした","けして","けさない"]'::jsonb, 2, 'Ketma-ket harakatlarda te-shakl + から: 消してから (o''chirgandan so''ng).', 57),
  ('mock_n5_s3_158', 'mock', NULL, 'N5', 'knowledge', 3, 'わたしの へやは ひろい（　）、あかるいです。', '["が","から","でも","し"]'::jsonb, 3, 'Sifatlarni biriktirib ifodalashda: 広いし、明るいです (keng hamda yorug'').', 58),
  ('mock_n5_s3_159', 'mock', NULL, 'N5', 'knowledge', 3, 'この みちは くるまが おおいですから、（あぶない）です。', '["危ない","安全","便利","静か"]'::jsonb, 0, '«Xavfli» so''zining to''g''ri kanjisi — 危ない (あぶない). 安全 — xavfsiz, 便利 — qulay.', 59),
  ('mock_n5_s3_160', 'mock', NULL, 'N5', 'knowledge', 3, 'きのうは どこ（　）いきませんでした。', '["にも","へも","でも","をも"]'::jsonb, 1, 'To''liq inkor: どこへも 行きませんでした (hech qayerga bormadim).', 60),
  ('mock_n5_s3_161', 'mock', NULL, 'N5', 'knowledge', 3, 'あには （がいこく）の だいがくで べんきょうして います。', '["外園","国外国","外国","町国"]'::jsonb, 2, '«Chet el» so''zining to''g''ri kanjisi — 外国 (がいこく).', 61),
  ('mock_n5_s3_162', 'mock', NULL, 'N5', 'knowledge', 3, 'この おかしは とても （あまくて） おいしいです。', '["辛くて","苦くて","酸っぱくて","甘くて"]'::jsonb, 3, '«Shirin bo''lib» i-sifat te-shakli kanjisi — 甘くて (あまくて).', 62),
  ('mock_n5_s3_163', 'mock', NULL, 'N5', 'knowledge', 3, 'えきまで あるいて 15ふん（　）かかります。', '["ぐらい","ごろ","しか","まで"]'::jsonb, 0, 'Vaqt miqdorining taxminiyligi: 15分ぐらい (taxminan 15 daqiqa).', 63),
  ('mock_n5_s3_164', 'mock', NULL, 'N5', 'reading', 3, 'この ひとは あさごはんの あとで 何[なに]を しますか。', '["かいしゃへ いきます","いぬと さんぽを します","6じに おきます","テレビを みます"]'::jsonb, 1, 'Matnda nonushtadan keyin it bilan sayr qilishi yozilgan.', 64),
  ('mock_n5_s3_165', 'mock', NULL, 'N5', 'reading', 3, '「わたし」は デパートで 何[なに]を かいましたか。', '["あおい シャツ","コーヒー","くろい くつ","かばん"]'::jsonb, 2, 'Matnda qora poyabzal sotib olgani aniq ko''rsatilgan.', 65),
  ('mock_n5_s3_166', 'mock', NULL, 'N5', 'reading', 3, 'ほんばこは どこに ありますか。', '["つくえの うえ","ベッドの した","へやの そと","つくえの ひだり"]'::jsonb, 3, 'Kitob javoni stolning chap tomonida joylashgan.', 66),
  ('mock_n5_s3_167', 'mock', NULL, 'N5', 'reading', 3, 'この ひとは なつやすみに 何[なに]を するのが すきですか。', '["うみで およぐこと","やまに のぼること","いえで ねること","あめを みること"]'::jsonb, 0, 'Dengizda suzishni yaxshi ko''rishi aytilgan.', 67),
  ('mock_n5_s3_168', 'mock', NULL, 'N5', 'reading', 3, 'そうべつかいは いつ ありますか。', '["どようびの あさ","きんようびの よる 6じはん","らいしゅうの にちようび","きょうの よる"]'::jsonb, 1, 'Juma oqshomi 6:30 da o''tkazilishi aytilgan.', 68),
  ('mock_n5_s3_169', 'mock', NULL, 'N5', 'reading', 3, 'としょかんで ほんは なんさつまで かりられますか。', '["2さつまで","10さつまで","5さつまで","なんさつでも"]'::jsonb, 2, 'Kutubxona qoidasiga ko''ra 5 tagacha kitob olish mumkin.', 69),
  ('mock_n5_s3_170', 'mock', NULL, 'N5', 'listening', 3, '男[おとこ]の 人[ひと]は 全部[ぜんぶ]で いくら はらいますか。', '["150円","200円","450円","300円"]'::jsonb, 3, '150 yendan 2 ta ruchka xarid qilgani uchun 300 yen to''laydi.', 70),
  ('mock_n5_s3_171', 'mock', NULL, 'N5', 'listening', 3, '2人[ふたり]は あした 何時[なんじ]に 会[あ]いますか。', '["9時半[くじはん]","9時[くじ]","10時[じゅうじ]","8時半[はちじはん]"]'::jsonb, 0, '9 juda erta bo''lgani sababli 9:30 ga kelishishdi.', 71),
  ('mock_n5_s3_172', 'mock', NULL, 'N5', 'listening', 3, '女[おんな]の 人[ひと]は きのう どこへ 行[い]きましたか。', '["水族館[すいぞくかん]","動物園[どうぶつえん]","映画館[えいがかん]","デパート"]'::jsonb, 1, 'Hayvonot bog''iga borib pandalarni ko''rgani aytildi.', 72),
  ('mock_n5_s3_173', 'mock', NULL, 'N5', 'listening', 3, '田中[たなか]さんの 傘[かさ]は 何色[なにいろ]ですか。', '["黒[くろ]","白[しろ]","青[あお]","赤[あか]"]'::jsonb, 2, 'Tanaka janob o''z soyaboni ko''k rangdaligini bildirdi.', 73),
  ('mock_n5_s3_174', 'mock', NULL, 'N5', 'listening', 3, '2人[ふたり]は これから 何[なに]を しますか。', '["昼[ひる]ごはんを 食[た]べる","帰[かえ]る","休[やす]む","会議[かいぎ]に 行[い]く"]'::jsonb, 3, 'Soat 3 da majlis bo''lgani uchun tezroq yig''ilishga borishmoqda.', 74),
  ('mock_n5_s3_175', 'mock', NULL, 'N5', 'listening', 3, '女[おんな]の 人[ひと]は はがきを 何枚[なんまい] 買[か]いましたか。', '["3枚[さんまい]","1枚[いちまい]","5枚[ごまい]","2枚[にまい]"]'::jsonb, 0, 'Ayol kishi 3 ta otkritka sotib oldi.', 75),
  ('mock_n4_s1_201', 'mock', NULL, 'N4', 'knowledge', 1, '雨が 降って（　）、試合は 中止になりました。', '["きたので","くるのに","きたら","きても"]'::jsonb, 0, 'Sabab-oqibatni bildirishda ''node'' qo''llaniladi: Ame ga futte kita node (yomg''ir yog''ib boshlaganligi sababli).', 1),
  ('mock_n4_s1_202', 'mock', NULL, 'N4', 'knowledge', 1, '先生に 本を（　）。ありがとうございました。', '["あげました","くれました","いただきました","やりました"]'::jsonb, 2, 'Ustoz yoki hurmatli shaxsdan biror narsa qabul qilganda kamtarlik fe''li ''itadakimasu'' ishlatiladi.', 2),
  ('mock_n4_s1_203', 'mock', NULL, 'N4', 'knowledge', 1, 'この漢字は どういう（　）ですか。', '["いみ","わけ","こと","りゆう"]'::jsonb, 0, 'So''z yoki belgining ma''nosi so''ralganda ''imi'' (意味 - ma''no) so''zi to''g''ri keladi.', 3),
  ('mock_n4_s1_204', 'mock', NULL, 'N4', 'knowledge', 1, '毎日 走る（　）に しています。健康のためです。', '["こと","よう","はず","わけ"]'::jsonb, 1, 'O''ziga odat qilib olish ma''nosida ''fe''l oddiy shakli + you ni suru'' ifodasi ishlatiladi.', 4),
  ('mock_n4_s1_205', 'mock', NULL, 'N4', 'knowledge', 1, '来年の（計画）を 立てています。', '["けいかく","けいがく","けいかっ","かいかく"]'::jsonb, 0, '「計画」kanjisining to''g''ri o''qilishi — けいかく (reja).', 5),
  ('mock_n4_s1_206', 'mock', NULL, 'N4', 'knowledge', 1, '漢字が 難しくて、日本の新聞が まだ（　）。', '["読めません","読みません","読まれません","読ませません"]'::jsonb, 0, 'Qobiliyat yetmasligida imkoniyat/potentsial fe''lining inkori ishlatiladi: 読めません (o''qiy olmayman).', 6),
  ('mock_n4_s1_207', 'mock', NULL, 'N4', 'knowledge', 1, '風で ドアが（　）しまいました。', '["閉めて","閉まって","開けて","止めて"]'::jsonb, 1, 'Eshik shamolda o''z-o''zidan yopilgani uchun o''timsiz fe''l (jidoushi) ''閉まる'' (しまって) ishlatiladi.', 7),
  ('mock_n4_s1_208', 'mock', NULL, 'N4', 'knowledge', 1, '熱が ありますから、今日は 早く 寝た（　）が いいですよ。', '["ほう","こと","もの","よう"]'::jsonb, 0, 'Tavsiya va maslahat berishda ''fe''l ta-shakli + ほうがいい'' qo''llaniladi: 寝たほうがいい (uxlaganingiz ma''qul).', 8),
  ('mock_n4_s1_209', 'mock', NULL, 'N4', 'knowledge', 1, '弟に 大切な ケーキを（　）しまいました。', '["食べて","食べられて","食べさせて","食べられても"]'::jsonb, 1, 'Birovning harakatidan noxush zarar ko''rilganda majhullik (ukemi) ishlatiladi: 食べられてしまいました.', 9),
  ('mock_n4_s1_210', 'mock', NULL, 'N4', 'knowledge', 1, '空が 暗くなってきました。今にも 雨が（　）そうです。', '["降る","降り","降った","降って"]'::jsonb, 1, 'Ko''rinishdan sodir bo''lish arafasidagi holat uchun ''fe''l o''zagi + そうだ'' ishlatiladi: 降りそうです.', 10),
  ('mock_n4_s1_211', 'mock', NULL, 'N4', 'knowledge', 1, '駅前の 図書館へ 本を（　）に 行きます。', '["返し","返す","返して","返した"]'::jsonb, 0, 'Maqsad bilan borishda ''fe''l o''zagi + に行く'' qo''llanadi: 返しに行きます (topshirgani boraman).', 11),
  ('mock_n4_s1_212', 'mock', NULL, 'N4', 'knowledge', 1, '田中さんは 用事があるから、今日のパーティーには（　）と 言っていました。', '["来られない","来ないで","来させる","来られる"]'::jsonb, 0, 'Kela olmaslik haqidagi iqtibos: potentsial inkor ''来られない'' (korarenai to itte imashita).', 12),
  ('mock_n4_s1_213', 'mock', NULL, 'N4', 'knowledge', 1, '正しい文を作ってください：
日本へ ＿＿ ＿＿ ★ ＿＿ 勉強しています。', '["留学するために","大学で","経済を","一生懸命"]'::jsonb, 2, 'To''g''ri tartib: 日本へ [留学するために] [大学で] [★ 経済を] [一生懸命] 勉強しています -> 経済を (3-variant).', 13),
  ('mock_n4_s1_214', 'mock', NULL, 'N4', 'reading', 1, '新しい アパートの どんなところが 気に入っていますか？', '["駅から とても 近いところ","近くに 静かな 公園が あるところ","家賃が 前より 安いところ","近くに 大きな スーパーが あるところ"]'::jsonb, 1, 'Matnda aniq keltirilgan: ''chikaku ni shizukana kouen ga aru node ki ni itte imasu'' (yaqinida tinch bog'' borligi yoqmoqda).', 14),
  ('mock_n4_s1_215', 'mock', NULL, 'N4', 'reading', 1, '借りることが できないものは 何ですか？', '["古い小説","歴史の本","DVDや最新号の雑誌","辞書"]'::jsonb, 2, 'E''londa yozilgan: ''DVD ya zasshi no saishingou wa kariru koto ga dekimasen'' (DVD va yangi son jurnallarni qarzga olib ketib bo''lmaydi).', 15),
  ('mock_n4_s1_216', 'mock', NULL, 'N4', 'reading', 1, 'ペットボトルや空き缶は、いつ 出さなければなりませんか？', '["火曜日の夜","水曜日の朝8時まで","木曜日の朝8時まで","金曜日の午後"]'::jsonb, 2, 'Qoidalarda resurs chiqindilari (資源ごみ: pet butilkalar, bankalar) ''木曜日の 朝8時まで'' (Payshanba ertalab soat 8 gacha) deb belgilangan.', 16),
  ('mock_n4_s1_217', 'mock', NULL, 'N4', 'reading', 1, 'この文章の内容と合っているものはどれですか？', '["肉じゃがを作るのはとても難しかった","友達のためにすでにアパートで作った","来週友達を招待して肉じゃがを作るつもりだ","先生に料理を振る舞った"]'::jsonb, 2, 'Matn oxirida yozilgan: ''来週、自分の国から来た友達をアパートに招待して作ってあげるつもりです'' (Kelasi hafta do''stlarimni chaqirib pishirib bermoqchiman).', 17),
  ('mock_n4_s1_218', 'mock', NULL, 'N4', 'reading', 1, '打ち合わせの日時が変更になった理由は何ですか？', '["会議室が予約できなかったから","佐藤さんが病気になったから","田中課長が不在だったから","先方の担当者が急に出張になったから"]'::jsonb, 3, 'Email matnida aniq ko''rsatilgan: ''先方の担当者が急な出張となったため'' (hamkor tomon mas''ul xodimi to''satdan xizmat safariga ketgani sababli).', 18),
  ('mock_n4_s1_219', 'mock', NULL, 'N4', 'reading', 1, 'この切符について 正しい 説明は どれですか？', '["平日の通勤時にも使える","バスにも自由に乗ることができる","土日や祝日に地下鉄全線で何度でも使える","JR線にも自由に乗ることができる"]'::jsonb, 2, 'Qoidalarda aytilganidek: dam olish va bayram kunlarida metroning barcha liniyalarida cheksiz foydalanish mumkin. Boshqa transportlarda esa amal qilmaydi.', 19),
  ('mock_n4_s1_220', 'mock', NULL, 'N4', 'listening', 1, '男の学生はどうしてパーティーに来られませんか？', '["風邪をひいたから","アルバイトがあるから","お金がないから","宿題が多いから"]'::jsonb, 1, 'Erkak talaba: ''arubaito no shifuto ga haitte ite'' (yarim kunlik ish navbati borligi sababli) kela olmasligini aytadi.', 20),
  ('mock_n4_s1_221', 'mock', NULL, 'N4', 'listening', 1, '新幹線は何番線から発車しますか？', '["10番線","11番線","12番線","13番線"]'::jsonb, 1, 'E''londa aniq eshitiladi: ''11-bansen ni Hakata-yuki shinkansen ga touchaku itashimasu'' (11-yo''lga yetib keladi).', 21),
  ('mock_n4_s1_222', 'mock', NULL, 'N4', 'listening', 1, '女性社員は まず 何を しますか？', '["会議室を予約する","資料を20部コピーする","パソコンの準備をする","お茶を入れる"]'::jsonb, 1, 'Boshliq: ''先にこの資料を20部コピーして会議室に持っていって'' (avval ushbu hujjatdan 20 nusxa ko''chirib majlis xonasiga olib bor) deb buyuradi.', 22),
  ('mock_n4_s1_223', 'mock', NULL, 'N4', 'listening', 1, '男の人は 白い薬を いつ 飲みますか？', '["毎食後","寝る前","熱が38度以上出たときだけ","朝起きたときだけ"]'::jsonb, 0, 'Shifokor: ''白い薬は毎食後、必ず水と一緒に飲んでください'' (oq dorini har ovqatdan keyin iching) deb uqtiradi.', 23),
  ('mock_n4_s1_224', 'mock', NULL, 'N4', 'listening', 1, '客は どうやって 支払いますか？', '["クレジットカード","スマホのバーコード決済","交通系電子マネー（Suica）","商品券"]'::jsonb, 2, 'Xaridor bank kartasi ishlamagach: ''じゃあSuicaでお願いします'' (undog'' bo''lsa Suica transport elektron puli bilan to''layman) deydi.', 24),
  ('mock_n4_s1_225', 'mock', NULL, 'N4', 'listening', 1, '二人は 明日 何時の 電車に 乗りますか？', '["8時","8時15分","8時半","9時"]'::jsonb, 2, 'Ayol 8:30 dagi poyezdni taklif qiladi va erkak ham rozi bo''ladi (''8時半のに乗ろう''). 8:15 esa stantsiyada uchrashish vaqti.', 25),
  ('mock_n4_s2_226', 'mock', NULL, 'N4', 'knowledge', 2, 'この町の（人口）は どのぐらいですか。', '["にんこう","ひとくち","じんこう","いりぐち"]'::jsonb, 2, '「人口」（aholi, odam soni）so''zining to''g''ri o''qilishi — じんこう (jinkou). 「人」bu yerda on''yomi ''jin'' deb o''qiladi.', 26),
  ('mock_n4_s2_227', 'mock', NULL, 'N4', 'knowledge', 2, '部屋が 暑いですね。エアコンを（　）。', '["つけましょう","あけましょう","おしましょう","ひらきましょう"]'::jsonb, 0, 'Konditsioner yoki elektr jihozlarini yoqish — 「つける」(tsukeru). Taklif shaklida: つけましょう (yoqaylik).', 27),
  ('mock_n4_s2_228', 'mock', NULL, 'N4', 'knowledge', 2, '黒いペン（　）名前を 書いてください。', '["で","を","に","が"]'::jsonb, 0, 'Harakatni bajarish vositasi yoki qurolini ifodalashda ''で'' (de) yuklamasi qo''yiladi: 黒いペンで (qora ruchka bilan).', 28),
  ('mock_n4_s2_229', 'mock', NULL, 'N4', 'knowledge', 2, 'この カメラの（使い方）を 教えてください。', '["つかいかた","つかいほう","しよおかた","つかいがた"]'::jsonb, 0, 'Fe''l ます-asosi + 方 (かた) birikmasi qilish usulini bildiradi: 使い方 — つかいかた (ishlatish usuli).', 29),
  ('mock_n4_s2_230', 'mock', NULL, 'N4', 'knowledge', 2, '道が 複雑ですから、（　）地図を 見てください。', '["よく","ずっと","急に","大体"]'::jsonb, 0, 'Yo''l chigal bo''lgani sababli xaritani ''diqqat bilan, yaxshilab'' qarash so''ralyapti: 「よく」(yaxshilab).', 30),
  ('mock_n4_s2_231', 'mock', NULL, 'N4', 'knowledge', 2, '田中さんは 今、（会議中）です。', '["かいぎちゅう","あいぎなか","かいぎじゅう","えいぎちゅう"]'::jsonb, 0, 'Biror harakat davom etayotgan paytda Ot + 中 (ちゅう) birikmasi keladi: 会議中 — かいぎちゅう (majlisda / majlis davomida).', 31),
  ('mock_n4_s2_232', 'mock', NULL, 'N4', 'knowledge', 2, 'この お茶は 熱すぎて、（　）にくいです。', '["飲み","飲んで","飲む","飲ま"]'::jsonb, 0, 'Biror ishni bajarish qiyinligini ifodalovchi ''~nikui'' qo''shimchasi fe''lning ます-asosi bilan keladi: 飲み + にくい = 飲みにくい (ichish qiyin).', 32),
  ('mock_n4_s2_233', 'mock', NULL, 'N4', 'knowledge', 2, 'レポートを 書いた（　）、先生に 見せます。', '["あとで","まえに","ながら","あいだ"]'::jsonb, 0, 'Harakat sodir bo''lgandan keyingi ketma-ketlik: Fe''l た-shakli + あとで (...gandan keyin): 書いたあとで (yozgandan keyin).', 33),
  ('mock_n4_s2_234', 'mock', NULL, 'N4', 'knowledge', 2, 'あしたは 雨が 降る（　）。傘を 持って行きましょう。', '["かもしれません","つもりです","はずです","予定です"]'::jsonb, 0, 'Ob-havo kabi ehtimoliy taxminlarda ''~kamoshiremasen'' (ehtimol, bo''lsa kerak) qo''llanadi. ''Tsumori'' faqat insonning shaxsiy niyatiga ishlatiladi.', 34),
  ('mock_n4_s2_235', 'mock', NULL, 'N4', 'knowledge', 2, '駅前の レストランは 安い（　）、とても おいしいです。', '["し","が","のに","けど"]'::jsonb, 0, 'Bir necha ijobiy sifatlarni yoki sabablarni sanab o''tishda ''~shi'' (ham, ustiga-ustak) grammatikasi ishlatiladi: 安いし、おいしいです.', 35),
  ('mock_n4_s2_236', 'mock', NULL, 'N4', 'knowledge', 2, '先生、この 書類を（　）いただけませんか。', '["見て","見せて","見られて","見させて"]'::jsonb, 0, 'Boshqalardan muloyim iltimos qilishda: Fe''l て-shakli + いただけませんか qo''llanadi: 見ていただけませんか (ko''rib bera olmaysizmi?).', 36),
  ('mock_n4_s2_237', 'mock', NULL, 'N4', 'knowledge', 2, '壁に カレンダーが（　）あります。', '["掛けて","掛かって","掛けた","掛かる"]'::jsonb, 0, 'Bajarilgan ish natijasining saqlanishi: Ot + が + o''timli fe''l (tadoushi) て-shakli + あります. 掛ける (kakemasu - osmoq) -> 掛けてあります.', 37),
  ('mock_n4_s2_238', 'mock', NULL, 'N4', 'knowledge', 2, '日本へ（　）なら、新幹線に 乗ったほうが いいですよ。', '["行く","行って","行った","行かない"]'::jsonb, 0, 'Hali sodir bo''lmagan voqea yuzasidan maslahat berganda: Lug''at shakli + なら ishlatiladi: 行くなら (agar boradigan bo''lsangiz).', 38),
  ('mock_n4_s2_239', 'mock', NULL, 'N4', 'reading', 2, '土曜日に DVDを 返したい人は どうしなければなりませんか。', '["返却ポストに入れます。","月曜日以降にカウンターへ直接持って行きます。","土曜日の朝、電話をします。","来週の土曜日まで待ちます。"]'::jsonb, 1, 'Matnda aniq aytilgan: DVD va CD kabi sinuvchan buyumlarni qutiga solmasdan, dushanba kunidan boshlab to''g''ridan-to''g''ri qabulxona peshtaxtasiga (counter) olib kelish shart.', 39),
  ('mock_n4_s2_240', 'mock', NULL, 'N4', 'reading', 2, 'この 交流会に 参加したい人は いつまでに 何をしなければなりませんか。', '["10月15日までに参加費を払います。","10月10日までに鈴木さんにメールで申し込みます。","10月10日までに国際交流センターへ行きます。","10月15日の14時に直接ホールへ行きます。"]'::jsonb, 1, 'E''londa yozilgan: 10-oktabrgacha (seshanba) xizmatchi Suzuki xonimga elektron pochta (mail) orqali ariza topshirish kerak.', 40),
  ('mock_n4_s2_241', 'mock', NULL, 'N4', 'reading', 2, '新しい アパートについて、正しくないものは どれですか。', '["駅から歩いて5分で便利です。","部屋が広くて日当たりがいいです。","電車の音が少し気になります。","家賃が前の部屋より安いです。"]'::jsonb, 3, 'Matnda ijara haqi (yachin / 家賃) haqida umuman gapirilmagan. Qolgan uchta ma''lumot (bekatga yaqinligi, yorug''ligi, poyezd shovqini) matnda keltirilgan.', 41),
  ('mock_n4_s2_242', 'mock', NULL, 'N4', 'reading', 2, 'スミスさんの 最近の 様子について、合っているものは どれですか。', '["今は5キロ走れるようになりました。","毎朝ジョギングをするのが大変でやめました。","日本に来る前も毎日5キロ走っていました。","走ると疲れて勉強に集中できません。"]'::jsonb, 0, 'Matnda aytilgan: ''最近は 5キロ 走れるように なりました'' (so''nggi paytlarda 5 kilometr yugura oladigan bo''ldi).', 42),
  ('mock_n4_s2_243', 'mock', NULL, 'N4', 'reading', 2, '缶や ビンは 何曜日の 何時までに 出しますか。', '["火曜日の朝8時まで","水曜日の朝8時まで","金曜日の朝8時まで","水曜日の夜8時まで"]'::jsonb, 1, 'Matndagi qoidaga ko''ra: Yonmaydigan chiqindi (shisha va bankalar - bin, kan) chorshanba kuni ertalab soat 8:00 gacha chiqariladi.', 43),
  ('mock_n4_s2_244', 'mock', NULL, 'N4', 'reading', 2, '返信ハガキを 送る時、どうしますか。', '["「御出席」をそのまま丸で囲みます。","「御」を二本線で消して、「出席」を丸で囲みます。","新しいハガキを買って送ります。","何も書かずにそのまま送ります。"]'::jsonb, 1, 'Yapon madaniyatida taklifnomaga javob yozganda hurmat prefiksi bo''lgan ''御'' (Go) belgisi ikkita chiziq bilan o''chirilib, ''出席'' (ishtirok etaman) aylanaga olinadi.', 44),
  ('mock_n4_s2_245', 'mock', NULL, 'N4', 'listening', 2, '女の人は これから どこへ 行きますか？', '["部長室","1階のロビー","会議室","自分の席"]'::jsonb, 1, 'Direktor hozir 1-qavat kutish zalida (lobby) mehmon bilan birga bo''lgani uchun ayol xodim o''sha yerga borishini aytadi: ''ロビーへ行って渡してきます''.', 45)
ON CONFLICT (id) DO UPDATE SET quiz_type = EXCLUDED.quiz_type, lesson_id = EXCLUDED.lesson_id, level = EXCLUDED.level, section = EXCLUDED.section, set_no = EXCLUDED.set_no, question = EXCLUDED.question, options = EXCLUDED.options, correct_index = EXCLUDED.correct_index, explanation = EXCLUDED.explanation, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_quiz_questions (id, quiz_type, lesson_id, level, section, set_no, question, options, correct_index, explanation, sort_order) VALUES
  ('mock_n4_s2_246', 'mock', NULL, 'N4', 'listening', 2, '学生は 明日 何時に どこに 集まりますか？', '["8時45分に駅の東口","8時45分に駅の西口","9時に駅の東口","9時に駅の西口"]'::jsonb, 0, 'O''qituvchi aytadi: ''8時45分までに駅の東口に集まってください'' (soat 8:45 gacha vokzalning sharqiy chiqishida to''planish kerak).', 46),
  ('mock_n4_s2_247', 'mock', NULL, 'N4', 'listening', 2, '男の人は どの シャツを 買いますか？', '["青のMサイズ","白のMサイズ","黒のMサイズ","白のLサイズ"]'::jsonb, 1, 'Moviy rang tugagan bo''lgani uchun xaridor ishda kiyish maqsadida oq rangdagi M o''lchamli ko''ylakni tanlaydi.', 47),
  ('mock_n4_s2_248', 'mock', NULL, 'N4', 'listening', 2, '男の人は 薬を いつ 飲みますか？', '["ご飯を食べる前","ご飯を食べたあと","寝る前","朝起きたとき"]'::jsonb, 1, 'Shifokor ta''kidlaydi: ''必ずご飯を食べたあとに飲んでください'' (albatta ovqatdan keyin iching).', 48),
  ('mock_n4_s2_249', 'mock', NULL, 'N4', 'listening', 2, '男の人は 日本の 生活で 何が 一番 困っていますか？', '["物価が高いこと","日本語が通じないこと","ゴミの分別ルール","電車の乗り方"]'::jsonb, 2, 'Erkak kishi aniq aytadi: ''一番困っているのはゴミの分別ルールなんだ'' (eng qiynayotgan narsa — chiqindilarni saralash qoidalari).', 49),
  ('mock_n4_s2_250', 'mock', NULL, 'N4', 'listening', 2, '女の人は 何番線の 電車に 乗りますか？', '["1番線","2番線","3番線","4番線"]'::jsonb, 2, 'Bekat xodimi 20 daqiqa tezroq yetib borishi uchun 3-yo''ldagi tezkor poyezdga chiqishni tavsiya qiladi: ''3番線の快速電車に乗ってください''.', 50),
  ('mock_n4_s3_251', 'mock', NULL, 'N4', 'knowledge', 3, '日本[にほん]の 歴史[れきし]に ついて（研究[けんきゅう]）して います。', '["けんきゅう","けんがく","けんしゅう","せんもん"]'::jsonb, 0, '「研究」（ilmiy izlanish, tadqiqot）ning to''g''ri o''qilishi — けんきゅう (kenkyuu).', 51),
  ('mock_n4_s3_252', 'mock', NULL, 'N4', 'knowledge', 3, 'パスポートを （紛失[ふんしつ]）した 場合は、すぐに 届け出[とどけで]て ください。', '["こわした","なくした","みつけた","もらった"]'::jsonb, 1, '「紛失」so''zining ma''nosi — tushirib yo''qotmoq (なくした).', 52),
  ('mock_n4_s3_253', 'mock', NULL, 'N4', 'knowledge', 3, 'この 荷物[にもつ]は （重[おも]すぎて）、一人[ひとり]では 持[も]てません。', '["軽すぎて","長すぎて","重すぎて","多すぎて"]'::jsonb, 2, '«Juda og''ir bo''lib ketgan» kanjisi — 重すぎて (おもすぎて).', 53),
  ('mock_n4_s3_254', 'mock', NULL, 'N4', 'knowledge', 3, '田中[たなか]さんは 会議[かいぎ]の 資料[しりょう]を もう 集[あつ]めて（　）。', '["います","おきます","しまいます","あります"]'::jsonb, 3, 'Oldindan qilingan maqsadli harakat natijasi: 他動詞＋てあります: 集めてあります.', 54),
  ('mock_n4_s3_255', 'mock', NULL, 'N4', 'knowledge', 3, '頭[あたま]が 痛[いた]いんです。（　）早[はや]く 帰[かえ]っても いいですか。', '["ですから","それで","しかし","でも"]'::jsonb, 0, 'Sabab bildirishdan so''ng xulosa chiqarish: ですから (shuning uchun).', 55),
  ('mock_n4_s3_256', 'mock', NULL, 'N4', 'knowledge', 3, '先生[せんせい]、この 漢字[かんじ]の 読[よ]み方[かた]を 教[おし]えて（　）。', '["あげましょうか","いただけませんか","もらいますか","くれますか"]'::jsonb, 1, 'O''qituvchidan muloyimlik bilan o''rgatishni so''rash: 〜ていただけませんか.', 56),
  ('mock_n4_s3_257', 'mock', NULL, 'N4', 'knowledge', 3, '雨[あめ]が（　）そうだから、傘[かさ]を 持[も]って 行[い]きましょう。', '["降る","降った","降り","降って"]'::jsonb, 2, 'Tashqi belgiga qarab taxmin: Fe''l masu-o''zagi + そう: 降りそう (yog''adiganga o''xshaydi).', 57),
  ('mock_n4_s3_258', 'mock', NULL, 'N4', 'knowledge', 3, '将来[しょうらい] 医者[いしゃ]に（　）つもりです。', '["なり","なって","なろう","なる"]'::jsonb, 3, 'Qat''iy niyat va maqsad: Fe''l lug''aviy shakli + つもり: なる つもり (bo''lmoqchiman).', 58),
  ('mock_n4_s3_259', 'mock', NULL, 'N4', 'knowledge', 3, 'この 本[ほん]は 難[むずか]しすぎて、ちっとも（　）。', '["分かりません","分かります","読めました","面白いです"]'::jsonb, 0, '«Juda qiyin bo''lgani uchun umuman tushunmadim»: ちっとも＋inkor (分かりません).', 59),
  ('mock_n4_s3_260', 'mock', NULL, 'N4', 'knowledge', 3, '明日[あした]までに この 本[ほん]を 読[よ]んで（　）ください。', '["あって","おいて","いて","みせて"]'::jsonb, 1, 'Belgilangan vaqtgacha tayyorlab qo''yish: V-ておいて ください.', 60),
  ('mock_n4_s3_261', 'mock', NULL, 'N4', 'knowledge', 3, '時間[じかん]が ありませんから、（急[いそ]いで） 行[い]きましょう。', '["あるいて","はしって","いそいで","とんで"]'::jsonb, 2, '«Shoshib, tezlik bilan» fe''lining te-shakli — 急いで (いそいで).', 61),
  ('mock_n4_s3_262', 'mock', NULL, 'N4', 'knowledge', 3, '私[わたし]は 毎朝[まいあさ] 6時[ろくじ]に（起[お]きる）ように して います。', '["おける","あきる","いきる","おきる"]'::jsonb, 3, '«Uyg''onmoq» fe''lining to''g''ri o''qilishi — 起きる (おきる).', 62),
  ('mock_n4_s3_263', 'mock', NULL, 'N4', 'knowledge', 3, '田中[たなか]さんは 来週[らいしゅう] アメリカへ 出張[しゅっちょう]する（　）です。', '["予定[よてい]","都合[つごう]","準備[じゅんび]","利用[りよう]"]'::jsonb, 0, 'Rasmiy taqvim rejasi: 〜予定です (yotei desu - rejalashtirilgan).', 63),
  ('mock_n4_s3_264', 'mock', NULL, 'N4', 'reading', 3, 'スピーチ大会[たいかい]に 出[で]る 人[ひと]は 何日[なんにち]までに 申[もう]し込[こ]まなければ なりませんか。', '["10月20日","10月15日[じゅうがつじゅうごにち]","11月1日","いつでもよい"]'::jsonb, 1, 'E''londa arizalar 10-oktyabr 15-sanagacha qabul qilinishi yozilgan.', 64),
  ('mock_n4_s3_265', 'mock', NULL, 'N4', 'reading', 3, 'この アパートの 規則[きそく]で 正[ただ]しいものは どれですか。', '["ペットを 飼[か]っても よい","ゴミは いつでも 捨[す]てて よい","夜[よる] 10時[じゅうじ]以降[いこう]は 静[しず]かに する","部屋[へや]で 楽器[がっき]を 弾[ひ]いて よい"]'::jsonb, 2, 'Kvartira qoidasida kechki soat 10 dan keyin shovqin qilmaslik shart qilingan.', 65),
  ('mock_n4_s3_266', 'mock', NULL, 'N4', 'reading', 3, '山田[やまだ]さんは どうして 会議[かいぎ]に 遅[おく]れましたか。', '["寝坊[ねぼう]したから","道[みち]に 迷[まよ]ったから","場所[ばしょ]を 間違[まちが]えたから","電車[でんしゃ]が 事故[じこ]で 止[と]まったから"]'::jsonb, 3, 'Poyezd halokat sababli to''xtab qolgani tushuntirilgan.', 66),
  ('mock_n4_s3_267', 'mock', NULL, 'N4', 'reading', 3, 'リサイクルショップに 持[も]って 行[い]ける 物[もの]は どれですか。', '["まだ 使[つか]える きれいな 服[ふく]","壊[こわ]れた テレビ","汚[よご]れた 家具[かぐ]","動[うご]かない 時計[とけい]"]'::jsonb, 0, 'Faqat toza va yaroqli kiyim-kechaklar qabul qilinishi aytilgan.', 67),
  ('mock_n4_s3_268', 'mock', NULL, 'N4', 'reading', 3, '図書館[としょかん]の パソコンを 使[つか]いたい 人[ひと]は まず 何[なに]を しますか。', '["自由[じゆう]に 座[すわ]って 電源[でんげん]を 入[い]れる","受付[うけつけ]で 学生証[がくせいしょう]を 見[み]せる","お金[かね]を 払[はら]う","先生[せんせい]の 許可[きょか]を もらう"]'::jsonb, 1, 'Kutubxonadagi kompyuterdan foydalanish uchun talabalik guvohnomasini ko''rsatish kerak.', 68),
  ('mock_n4_s3_269', 'mock', NULL, 'N4', 'reading', 3, '留学生[りゅうがくせい]センターの 奨学金[しょうがくきん]の 条件[じょうけん]で 合[あ]って いるものは どれですか。', '["アルバイトを して いない 人","1年生[いちねんせい]だけ","出席率[しゅっせきりつ]が 90％以上[いじょう]の 人[ひと]","日本語[にほんご]が 話[はな]せない 人"]'::jsonb, 2, 'Davomat ko''rsatkichi 90% dan yuqori bo''lishi talab qilinadi.', 69),
  ('mock_n4_s3_270', 'mock', NULL, 'N4', 'listening', 3, '男[おとこ]の 人[ひと]は これから まず どこへ 行[い]きますか。', '["郵便局[ゆうびんきょく]","コンビニ","会社[かいしゃ]","銀行[ぎんこう]"]'::jsonb, 3, 'Avval pul yechib olish uchun bankka borishini aytdi.', 70),
  ('mock_n4_s3_271', 'mock', NULL, 'N4', 'listening', 3, '女[おんな]の 人[ひと]は 何時[なんじ]の 新幹線[しんかんせん]に 乗[の]りますか。', '["10時15分[じゅうじじゅうごふん]","10時[じゅうじ]","10時30分","11時[じゅういちじ]"]'::jsonb, 0, '10:15 dagi poyezdga chiqishi rejalashtirildi.', 71),
  ('mock_n4_s3_272', 'mock', NULL, 'N4', 'listening', 3, '2人[ふたり]は どこで 昼[ひる]ごはんを 食[た]べますか。', '["会社の 食堂[しょくどう]","駅前[えきまえ]の カレー屋[や]","公園[こうえん]","コンビニ"]'::jsonb, 1, 'Vokzal oldidagi yangi ochilgan karri oshxonasiga borishga kelishishdi.', 72),
  ('mock_n4_s3_273', 'mock', NULL, 'N4', 'listening', 3, '男[おとこ]の 人[ひと]は 明日[あした] 何[なに]を 持[も]って 行[い]かなければ なりませんか。', '["お金[かね]だけ","パスポート","保険証[ほけんしょう]と 写真[しゃしん]","筆記用具[ひっきようぐ]だけ"]'::jsonb, 2, 'Tibbiy sug''urta kartasi va 2 dona fotosurat talab qilinadi.', 73),
  ('mock_n4_s3_274', 'mock', NULL, 'N4', 'listening', 3, '女[おんな]の 人[ひと]は 何[なに]を 手伝[てつだ]いますか。', '["書類[しょるい]を コピーする","電話[でんわ]を かける","掃除[そうじ]をする","部屋[へや]の 机[つくえ]を 運[はこ]ぶ"]'::jsonb, 3, 'Xonadagi og''ir stolni ko''chirishga yordam beradi.', 74),
  ('mock_n4_s3_275', 'mock', NULL, 'N4', 'listening', 3, '男[おとこ]の 人[ひと]は どうして パーティーに 行[い]けませんか。', '["アルバイトが 入[はい]って しまったから","病気[びょうき]に なったから","旅行[りょこう]に 行[い]くから","お金[かね]が ないから"]'::jsonb, 0, 'Kutilmaganda smenada yarim kunlik ish chiqib qolgani sababli borolmaydi.', 75),
  ('mock_n3_s1_301', 'mock', NULL, 'N3', 'knowledge', 1, '大事な 会議の 最中に、携帯電話が 鳴って（　）。', '["しまった","おいた","みた","いった"]'::jsonb, 0, 'Kutilmagan yoki noxush hodisa yuz berganda ''~te shimatta'' (afsuski bo''lib qoldi) grammatikasi ishlatiladi.', 1),
  ('mock_n3_s1_302', 'mock', NULL, 'N3', 'knowledge', 1, 'どんなに 頼まれても、この仕事を 引き受ける（　）には いかない。', '["もの","こと","わけ","はず"]'::jsonb, 2, '''~wake ni wa ikanai'' ijtimoiy yoki axloqiy sababga ko''ra ''bunday qilib bo''lmaydi'' degan ma''noni ifodalaydi.', 2),
  ('mock_n3_s1_303', 'mock', NULL, 'N3', 'knowledge', 1, '試験の 結果は、ウェブサイトに（　）次第、メールで ご連絡します。', '["発表する","発表した","発表され","発表して"]'::jsonb, 2, '''fe''l o''zagi (stem) + shidai'' (darhol, bo''lishi bilanoq) ma''nosini bildiradi: happyousare-shidai (e''lon qilinishi bilanoq).', 3),
  ('mock_n3_s1_304', 'mock', NULL, 'N3', 'knowledge', 1, '最近の パソコンは 小型化される（　）、性能も 著しく 向上している。', '["反面","一方","途端","次第"]'::jsonb, 1, 'Biror tendensiyaning bir tomonlama rivojlanib borishini bildirishda ''ippou'' qo''llaniladi.', 4),
  ('mock_n3_s1_305', 'mock', NULL, 'N3', 'knowledge', 1, '契約を結ぶ前に、条件を（慎重）に 確認してください。', '["しんちょう","きんちょう","しんじょう","きんじょう"]'::jsonb, 0, '「慎重」kanjisining to''g''ri o''qilishi — しんちょう (ehtiyotkorlik bilan, chuqur o''ylab).', 5),
  ('mock_n3_s1_306', 'mock', NULL, 'N3', 'knowledge', 1, '今回の 新規事業の 計画（　）、役員会で 詳しい 説明が あった。', '["に関して","にとって","に反して","を通じて"]'::jsonb, 0, 'Biror mavzu yoki masala to''g''risida gap ketganda ''〜に関して'' (to''g''risida / haqida) grammatikasi ishlatiladi.', 6),
  ('mock_n3_s1_307', 'mock', NULL, 'N3', 'knowledge', 1, '毎日 仕事で 多忙な 現代人（　）、質の良い 睡眠は 不可欠だ。', '["にとって","に対して","によって","につれて"]'::jsonb, 0, 'Muayyan shaxs yoki toifa nuqtai nazaridan baholaganda ''〜にとって'' (... uchun) ifodasi to''g''ri keladi.', 7),
  ('mock_n3_s1_308', 'mock', NULL, 'N3', 'knowledge', 1, '冬の 寒い 時期は、どうしても 運動不足に（　）になる。', '["なりがち","なりぎみ","なりそう","なりかけ"]'::jsonb, 0, 'Noxush odat yoki tendensiyaga moyillikni bildirishda ''fe''l o''zagi + がち'' (〜がち) qo''llanadi: なりがち (bo''lib qolishga moyil).', 8),
  ('mock_n3_s1_309', 'mock', NULL, 'N3', 'knowledge', 1, '明日、午前10時に 貴社へ（　）。よろしくお願いいたします。', '["お伺いします","いらっしゃいます","参られます","おいでになります"]'::jsonb, 0, 'Hamkor kompaniyaga borishda o''z harakatini kamtarin qilish uchun kenjougo (kamtarlik) fe''li ''お伺いします'' ishlatiladi.', 9),
  ('mock_n3_s1_310', 'mock', NULL, 'N3', 'knowledge', 1, '午後から 天気が 崩れると 思っていたが、（　）雷雨になった。', '["案の定","かえって","むしろ","せっかく"]'::jsonb, 0, '''案の定'' (あんのじょう) - kutilganidek, taxmin qilinganidek (ko''pincha salbiy holatlarda) ma''nosidagi ravishdir.', 10),
  ('mock_n3_s1_311', 'mock', NULL, 'N3', 'knowledge', 1, 'あんなに 毎日 猛練習を 積み重ねて きたのだから、彼なら 必ず 合格する（　）。', '["に違いない","にすぎない","わけがない","はずがない"]'::jsonb, 0, 'Kuchli ishonch bilan xulosa chiqarishda ''〜に違いない'' (shubhasiz, aniq shunday bo''ladi) qo''llanadi.', 11),
  ('mock_n3_s1_312', 'mock', NULL, 'N3', 'knowledge', 1, '会社の 就業規則により、勤務中の 私用電話は 原則禁止という（　）。', '["ことになっている","ことにしている","わけになっている","ようにしている"]'::jsonb, 0, 'Ijtimoiy qoida, qonun yoki tashkiliy tartib-qoidani bildirishda ''〜ことになっている'' (shunday tartib belgilangan) ishlatiladi.', 12),
  ('mock_n3_s1_313', 'mock', NULL, 'N3', 'knowledge', 1, '正しい文を作ってください：
困難な 状況でも、＿＿ ＿＿ ★ ＿＿ 努力した。', '["決して","目標に向かって","諦めることなく","最後まで"]'::jsonb, 2, 'To''g''ri tartib: 困難な 状況でも、[決して] [目標に向かって] [★ 諦めることなく] [最後まで] 努力した -> 諦めることなく (3-variant).', 13),
  ('mock_n3_s1_314', 'mock', NULL, 'N3', 'reading', 1, '筆者が最も強調したい点はどれですか？', '["レジ袋の価格をもっと引き上げるべきだ","消費者の努力だけに頼らず、企業が代替素材を採用すべきだ","プラスチック製品の製造を完全に禁止すべきだ","エコバッグの普及率をさらに高める必要がある"]'::jsonb, 1, 'Muallif: ''iste''molchilar ongi bilangina cheklanmay, korxonalar parchalanishi mumkin bo''lgan muqobil materiallarni qo''llashi shart'' deb ta''kidlaydi.', 14),
  ('mock_n3_s1_315', 'mock', NULL, 'N3', 'reading', 1, '自己成長にとって最も重要だとされているのはどのようなことですか？', '["緊急かつ重要なこと","緊急だが重要ではないこと","緊急ではないが重要なこと","緊急でも重要でもないこと"]'::jsonb, 2, 'Matnda o''sish uchun eng muhimi: ''kinkyuu dewa nai ga juuyou na koto'' (shoshilinch bo''lmagan, lekin muhim ishlar) deb aniq aytilgan.', 15),
  ('mock_n3_s1_316', 'mock', NULL, 'N3', 'reading', 1, '文章によると、テレワークにおいてどのような課題が生じていますか？', '["通勤時間が以前より長くなってしまったこと","業務の生産性が完全にゼロになってしまうこと","偶発的な雑談から生まれるアイデアや一体感が減少すること","社員同士の給与格差が広がること"]'::jsonb, 2, 'Matnda tasvirlanishicha, teleworkning asosiy muammosi — tasodifiy suhbatlardan tug''iladigan ijodiy g''oyalar va jamoaviy birdamlikning susayishidir.', 16),
  ('mock_n3_s1_317', 'mock', NULL, 'N3', 'reading', 1, '筆者が考える「1冊の本を読み通すことの最大の価値」は何ですか？', '["短時間で大量のトリビアを記憶できること","著者の思考過程を追体験し、本質を見抜く深い洞察力を養えること","最新の流行やトレンドをいち早く知ること","要約動画を作るスキルが身につくこと"]'::jsonb, 1, 'Muallif kitobni to''liq o''qish orqali muallifning fikrlash zanjirini bosib o''tish va chuqur mohiyatni tushunish ko''nikmasi shakllanishini ta''kidlaydi.', 17),
  ('mock_n3_s1_318', 'mock', NULL, 'N3', 'reading', 1, '現行の利用者が来年も旧料金のまま利用し続けるにはどうすればよいですか？', '["何もしないで待っていればよい","9月30日までに1年契約の自動更新を申し込む","セキュリティ機能を無効にする","10月1日以降に新規アカウントを作成する"]'::jsonb, 1, 'E''lon shartida aytilgan: ''9月30日までに1年契約の自動更新をお申し込みいただくことで、向こう1年間は旧料金（月額1,200円）のまま新機能をご利用いただけます''.', 18),
  ('mock_n3_s1_319', 'mock', NULL, 'N3', 'reading', 1, '平日夜（19時以降）と日曜日を中心に利用し、費用を最も抑えたい人に最適なプランはどれですか？', '["デイタイム会員","ナイト＆ホリデー会員","フルタイム会員","会議室専用プラン"]'::jsonb, 1, 'Ish kunlari kechasi (18:00 dan keyin) va dam olish kunlari foydalanuvchilar uchun eng arzon va mos tarif — ''ナイト＆ホリデー会員'' (oyiga 12,000 yen).', 19),
  ('mock_n3_s1_320', 'mock', NULL, 'N3', 'listening', 1, '部下はまず何を修正しますか？', '["企画書のタイトル","予算のグラフのデータ","全体の構成","参加者のリスト"]'::jsonb, 1, 'Xodim o''tgan yilgi eski byudjet grafik ma''lumotlarini eng so''nggisiga almashtirishini aytadi.', 20),
  ('mock_n3_s1_321', 'mock', NULL, 'N3', 'listening', 1, '留学生が申請するビザの種類は何ですか？', '["留学ビザ","特定活動ビザ","就労ビザ","観光ビザ"]'::jsonb, 1, 'O''qituvchi o''qishni tugatgach ish qidirish uchun ''Tokutei Katsudou Visa'' kerakligini tushuntiradi.', 21),
  ('mock_n3_s1_322', 'mock', NULL, 'N3', 'listening', 1, '男性社員は 今日中に 何を 終わらせますか？', '["セミナーの発表スライド","取引先への見積書の作成と送信","会議室の手配","出張の精算手続き"]'::jsonb, 1, 'Boshliq taqdimot slaydlarini ertaga birga ko''rishlarini, bugun esa kechiktirmasdan hisob-faktura (見積書) ni yuborishni buyuradi.', 22),
  ('mock_n3_s1_323', 'mock', NULL, 'N3', 'listening', 1, '迷子の男の子が 着ている 服装の 特徴は どれですか？', '["黄色いシャツに白いズボン","青い長袖Tシャツに黒い半ズボン、赤い帽子","緑のセーターにジーンズ","白いシャツに茶色い帽子"]'::jsonb, 1, 'E''londa aniq aytildi: ''青い長袖Tシャツに、黒い半ズボンを着用し、赤い帽子をかぶっております''.', 23),
  ('mock_n3_s1_324', 'mock', NULL, 'N3', 'listening', 1, '客は 何時の 朝食券を もらいましたか？', '["7時","8時","8時半","9時"]'::jsonb, 0, 'Mijoz 8:30 da jo''nab ketishi kerak bo''lgani sababli soat 7 dagi nonushta vaqtini tanlaydi.', 24),
  ('mock_n3_s1_325', 'mock', NULL, 'N3', 'listening', 1, '専門家が 勧めている 最も 手軽で 効果的な 節電対策は何ですか？', '["エアコンを一切つけないこと","スイッチ付きタップなどを活用して待機電力を切ること","夜間は照明をすべて消すこと","冷蔵庫の電源を定期的に抜くこと"]'::jsonb, 1, 'Mutaxassis maishiy texnikalarning kutish rejimidagi quvvatini o''chirish (スイッチ付きタップ orqali) eng samarali ekanligini ta''kidlaydi.', 25),
  ('mock_n3_s2_326', 'mock', NULL, 'N3', 'knowledge', 2, '郵便局の 近くに （引っ越した）ので 便利です。', '["ひっこした","うつった","とおった","わたった"]'::jsonb, 0, '「引っ越す」（ko''chib o''tmoq）ning to''g''ri o''qilishi — ひっこす (hikkosu). O''tgan zamonda: 引っ越した (hikkoshita).', 26),
  ('mock_n3_s2_327', 'mock', NULL, 'N3', 'knowledge', 2, '荷物が 届きましたが、それは 私が 頼んだのと（　）。', '["ちがかったです","まちがったです","ちがっていました","まちがえていました"]'::jsonb, 2, 'Narsa kutilganidan yoki buyurtma qilinganidan ''boshqacha bo''lmoq'' fe''li — 「違う」(chigau). To''g''ri davomiy o''tgan shakli: 違っていました (chigatte imashita).', 27),
  ('mock_n3_s2_328', 'mock', NULL, 'N3', 'knowledge', 2, '子供の ころ、よく この 公園で 遊んだ（　）。', '["ことか","ことだ","ものか","ものだ"]'::jsonb, 3, 'O''tmishdagi doimiy odat yoki xotiralarni eslashda fe''lning oddiy o''tgan zamoniga 「〜たものだ」 qo''shiladi (bolaligimda bu bog''da ko''p o''ynardim).', 28),
  ('mock_n3_s2_329', 'mock', NULL, 'N3', 'knowledge', 2, '新しい 計画について （反対）する 意見が 出ました。', '["さんせい","はんたい","きそく","しょうにん"]'::jsonb, 1, '「反対」（qarshilik, qarshi bo''lish）so''zining to''g''ri o''qilishi — はんたい (hantai).', 29),
  ('mock_n3_s2_330', 'mock', NULL, 'N3', 'knowledge', 2, '彼は いつも （真面目）に 仕事に 取り組んでいる。', '["しんけん","まじめ","ねっしん","ていねい"]'::jsonb, 1, '「真面目」（jiddiy, vijdonan ishlaydigan）so''zining to''g''ri o''qilishi — まじめ (majime).', 30),
  ('mock_n3_s2_331', 'mock', NULL, 'N3', 'knowledge', 2, '明日の 試験が 心配で、昨夜は なかなか（　）。', '["眠れなかった","起きなかった","休まなかった","座れなかった"]'::jsonb, 0, 'Xavotir sababli uxlay olmaslik — 「眠れなかった」(nemurenakatta). ''Nakanaka'' inkor fe''l bilan kelib ''hech uxlay olmadim'' ma''nosini beradi.', 31),
  ('mock_n3_s2_332', 'mock', NULL, 'N3', 'knowledge', 2, '会議の （準備）が すべて 整いました。', '["じゅんび","せつび","よてい","けいかく"]'::jsonb, 0, '「準備」（tayyorgarlik, hozirlik）so''zining to''g''ri o''qilishi — じゅんび (junbi).', 32),
  ('mock_n3_s2_333', 'mock', NULL, 'N3', 'knowledge', 2, '雨が 降らない（　）、急いで 買い物に 行ってきましょう。', '["あいだに","うちに","までに","とおりに"]'::jsonb, 1, 'Holat o''zgarishidan oldin biror ishni bajarib olish grammatikasi: 「〜ないうちに」(yomg''ir yog''masdan turib / fursat borida).', 33),
  ('mock_n3_s2_334', 'mock', NULL, 'N3', 'knowledge', 2, 'どんなに 失敗しても、最後まで 諦めない（　）。', '["わけだ","はずだ","つもりだ","べきだ"]'::jsonb, 2, 'O''zining qat''iy niyatini ifodalashda fe''lning oddiy shakliga 「つもりだ」(taslim bo''lmaslik niyatidaman) qo''shiladi.', 34),
  ('mock_n3_s2_335', 'mock', NULL, 'N3', 'knowledge', 2, 'この 部屋は 南向きで （日当たり）が とても いいです。', '["ひあたり","ひざし","にっこう","ひるま"]'::jsonb, 0, '「日当たり」（quyosh tushishi, yorug''lik tushishi）so''zining to''g''ri o''qilishi — ひあたり (hiatari).', 35),
  ('mock_n3_s2_336', 'mock', NULL, 'N3', 'knowledge', 2, '先輩に アドバイスを （　）おかげで、問題が 解決しました。', '["さしあげた","いただいた","くださった","やり直した"]'::jsonb, 1, 'Katta yoshli yoki tajribali odamdan (senpaidan) maslahat qabul qilib olganda kamtarlik fe''li — 「いただく」(itadaku) ishlatiladi.', 36),
  ('mock_n3_s2_337', 'mock', NULL, 'N3', 'knowledge', 2, 'あんなに 優しい 彼が、そんな ひどい 嘘を つく（　）。', '["はずがない","わけではない","に違いない","にすぎない"]'::jsonb, 0, 'Mantiqan mutlaqo imkonsiz narsani inkor qilishda: 「〜はずがない」(bo''lishi aslo mumkin emas, yolg''on gapirishi mumkin emas).', 37),
  ('mock_n3_s2_338', 'mock', NULL, 'N3', 'knowledge', 2, '日本での 留学生活は 毎日が とても（充実）しています。', '["まんぞく","じゅうじつ","けんこう","たいへん"]'::jsonb, 1, '「充実」（mazmunli, to''laqonli o''tish）so''zining to''g''ri o''qilishi — じゅうじつ (juujitsu).', 38),
  ('mock_n3_s2_339', 'mock', NULL, 'N3', 'reading', 2, '変更後の 会議について、正しいものは どれですか。', '["火曜日の14:00から第2会議室で行われる。","火曜日の16:00から大会議室で行われる。","水曜日の16:00に延期された。","資料は会議の当日に紙で配布される。"]'::jsonb, 1, 'Xabarnomada aniq yozilgan: Soat 16:00 ga ko''chirildi va xona ''大会議室'' (katta majlislar zali) ga o''zgardi.', 39),
  ('mock_n3_s2_340', 'mock', NULL, 'N3', 'reading', 2, '筆者が 述べている 現代の 読書スタイルとは どのようなものですか。', '["紙の本をすべて捨てて、電子書籍だけに統一すること。","電子書籍は読みにくいので、紙の本だけを読むこと。","状況や気分に合わせて、電子書籍と紙の本の両方を使い分けること。","読書をやめてオーディオブックだけを利用すること。"]'::jsonb, 2, 'Muallif oxirgi jumlada ta''kidlaydi: ''用途や気分によって両方を使い分ける'' (vaziyat va kayfiyatga qarab ikkalasidan ham unumli foydalanish).', 40),
  ('mock_n3_s2_341', 'mock', NULL, 'N3', 'reading', 2, 'ペットボトルを ゴミに 出すときの 正しい 手順は どれですか。', '["そのまま火曜日に出す。","キャップとラベルをはがして水で洗い、火曜日に出す。","足で平らにつぶして水曜日に出す。","ひもで十字に縛って木曜日に出す。"]'::jsonb, 1, 'Qoidada yozilgan: ''キャップとラベルをはがして水洗いし、火曜日に出してください'' (qopqoq va etiketkasini yulib, chayqab, seshanba kuni chiqariladi).', 41),
  ('mock_n3_s2_342', 'mock', NULL, 'N3', 'reading', 2, '言葉の 変化について、筆者は どのように 考えていますか。', '["若者言葉はすべて禁止すべきである。","昔の正しい日本語だけを守り続けるべきである。","言語が生きている限り、時代とともに変化するのは自然なことである。","辞書に載っていない言葉を使ってはならない。"]'::jsonb, 2, 'Muallif fikricha: ''言語が生きている限り、時代の要求に応じて変化し続けるのは自然な現象なのです'' (til tirik ekan, davr bilan birga o''zgarishi tabiiy hodisadir).', 42),
  ('mock_n3_s2_343', 'mock', NULL, 'N3', 'reading', 2, '点検が 終わったあと、水を 使うときは どうすれば いいですか。', '["すぐにそのまま飲んでも構わない。","1分ほど水を流してから使用する。","お湯だけを使うようにする。","翌日まで水を使ってはいけない。"]'::jsonb, 1, 'E''londa aytilgan: ''1分ほど水を流してからご使用ください'' (suv quvurlari tozalanishi uchun 1 daqiqacha oqizib yuborib keyin ishlatish kerak).', 43),
  ('mock_n3_s2_344', 'mock', NULL, 'N3', 'reading', 2, '日記を 書くことの 効果として、筆者が 挙げているものは どれですか。', '["日本語の漢字の書き順が上達すること。","気持ちや思考が整理されて、前向きに新しい一日を迎えられること。","過去の出来事を他人に自慢できるようになること。","睡眠時間が短くても疲れなくなること。"]'::jsonb, 1, 'Muallif: ''文字にすることで頭の中が整理され、翌朝を前向きな気持ちで迎えることができます'' deb yozgan (fikrlar tartiblanib, yangi kunga ijobiy kayfiyatda kirishadi).', 44),
  ('mock_n3_s2_345', 'mock', NULL, 'N3', 'listening', 2, '男性社員は まず 何を しますか？', '["プレゼン資料を印刷する","取引先に確認メールを送る","会議室の予約をする","外出の準備をする"]'::jsonb, 1, 'Boshliq xaridori tushdan keyin safarga ketishi sababli avval tasdiqlovchi xatni yuborishni buyuradi: ''先に確認メールを送っておいて''.', 45),
  ('mock_n3_s2_346', 'mock', NULL, 'N3', 'listening', 2, '観光客は 何番線の 電車に 乗りますか？', '["1番線","3番線","4番線","5番線"]'::jsonb, 3, 'Yo''riqchi aniq tushuntiradi: Narita Express tezyurar poyezdi yerosti 2-qavatdagi 5-yo''ldan jo''naydi (''5番線ホームへお進みください'').', 46),
  ('mock_n3_s2_347', 'mock', NULL, 'N3', 'listening', 2, '午後の 日本文学の 講義は どこで 行われますか？', '["3号館の201教室","3号館の105教室","5号館の201教室","5号館の105教室"]'::jsonb, 3, 'Proyektor buzilganligi sababli dars 5-bino 105-auditoriyaga ko''chirilgan (''5号館の105教室に変更になった'').', 47),
  ('mock_n3_s2_348', 'mock', NULL, 'N3', 'listening', 2, '客は どの靴を 買うことに しましたか？', '["黒の26.5","紺の26.0","茶色の26.5","茶色の27.0"]'::jsonb, 2, 'Qora rang tugagani sababli mijoz ishda kiyish uchun 26.5 o''lchamdagi jigarrang poyabzalni tanlaydi (''茶色にしてみようかな'').', 48),
  ('mock_n3_s2_349', 'mock', NULL, 'N3', 'listening', 2, '午後の 天気について、正しいものは どれですか？', '["一日中ずっと快晴が続く。","午後から雨雲が広がり、夕方以降は雷雨になる。","朝から雪が降る。","非常に強い台風が直撃する。"]'::jsonb, 1, 'Sinoptik aytadi: Tushdan keyin yomg''ir bulutlari kelib, kechqurun kuchli momaqaldiroqli yomg''ir yog''ishi kutilmoqda.', 49),
  ('mock_n3_s2_350', 'mock', NULL, 'N3', 'listening', 2, '患者は どの薬を 寝る前に 飲みますか？', '["赤いカプセル","白い錠剤","両方の薬","食後の粉薬"]'::jsonb, 1, 'Shifokor yo''talni qoldiruvchi oq tabletkani uxlashdan 30 daqiqa oldin ichishni buyuradi: ''白い錠剤は...おやすみになる30分前に''.', 50),
  ('mock_n3_s3_351', 'mock', NULL, 'N3', 'knowledge', 3, 'この プロジェクトは 全員[ぜんいん]の 協力[きょうりょく]の（もとに） 成功[せいこう]した。', '["もとに","うしろに","あいだに","まえに"]'::jsonb, 0, 'Biror narsaning rahnamoligi yoki ko''magi ostida: 〜のもとに (yordami ostida).', 51),
  ('mock_n3_s3_352', 'mock', NULL, 'N3', 'knowledge', 3, '新商品の 発売[はつばい]を 来月[らいげつ]に（延期[えんき]）することになった。', '["えんちょう","えんき","ちゅうし","はいし"]'::jsonb, 1, '「延期」（kechiktirish, muddatini surish）ning to''g''ri o''qilishi — えんき (enki).', 52),
  ('mock_n3_s3_353', 'mock', NULL, 'N3', 'knowledge', 3, '最近[さいきん]の 若者[わかもの]は スマートフォンに（依存[いぞん]）しがちだ。', '["いそん","たいぞん","いぞん","よりぞん"]'::jsonb, 2, '«Bog''lanib/qaram bo''lib qolish» so''zining o''qilishi — 依存 (いぞん/いそん).', 53),
  ('mock_n3_s3_354', 'mock', NULL, 'N3', 'knowledge', 3, 'どんなに 忙[いそが]しくても、連絡[れんらく]ぐらい（すべきだ）。', '["するはずだ","するわけだ","するべきではない","すべきだ"]'::jsonb, 3, 'Burch va umuminsoniy qoida sifatida: 〜べきだ (qilmog''i shart/lozim).', 54),
  ('mock_n3_s3_355', 'mock', NULL, 'N3', 'knowledge', 3, '彼[かれ]は 親切[しんせつ]な（反面[はんめん]）、怒[おこ]りっぽい ところも ある。', '["はんめん","うらめん","ぎゃくめん","たいめん"]'::jsonb, 0, '«Bir tomondan... ikkinchi tomondan esa»: 反面 (はんめん - hanmen).', 55),
  ('mock_n3_s3_356', 'mock', NULL, 'N3', 'knowledge', 3, 'この 店[みせ]の パンは 美味[おい]しい（ばかりでなく）、値段[ねだん]も 手頃[てごろ]だ。', '["ばかりか","ばかりでなく","ほどではなく","きりではなく"]'::jsonb, 1, '«Faqatgina u emas, balki... ham»: 〜ばかりでなく.', 56),
  ('mock_n3_s3_357', 'mock', NULL, 'N3', 'knowledge', 3, '試験[しけん]が 近[ちか]づく（にしたがって）、緊張感[きんちょうかん]が 高[たか]まってきた。', '["にともなって","にたいして","にしたがって","について"]'::jsonb, 2, 'Biror holat rivojlanishi bilan mutanosib ravishda: 〜にしたがって.', 57),
  ('mock_n3_s3_358', 'mock', NULL, 'N3', 'knowledge', 3, '田中[たなか]さんが 犯人[はんにん]の（はずがない）。彼[かれ]は その時[とき] 旅行中[りょこうちゅう]だった。', '["わけがない","にちがいない","かもしれない","はずがない"]'::jsonb, 3, 'Kuchli mantiqiy inkor: «bunday bo''lishi aslo mumkin emas» — 〜はずがない.', 58),
  ('mock_n3_s3_359', 'mock', NULL, 'N3', 'knowledge', 3, '風邪[かぜ]（気味[ぎみ]）で、頭[あたま]が ぼんやり しています。', '["ぎみ","っぽい","がち","だらけ"]'::jsonb, 0, 'Biroz shamollash alomati sezilayotganda: 風邪気味 (かぜぎみ).', 59),
  ('mock_n3_s3_360', 'mock', NULL, 'N3', 'knowledge', 3, '昨日[きのう]は 一日中[ついたちじゅう] 忙[いそが]しくて、食事[しょくじ]を（とる時間すらなかった）。', '["とる時間ばかりだった","とる時間すらなかった","とる時間だけだった","とる時間どころだった"]'::jsonb, 1, 'Hatto eng oddiy narsaga ham imkon bo''lmaganda: 〜すら (hattoki ovqatlanishga vaqt ham bo''lmadi).', 60),
  ('mock_n3_s3_361', 'mock', NULL, 'N3', 'knowledge', 3, 'その 計画[けいかく]には （賛成[さんせい]）いたしかねます。', '["応援する","賛成できる","賛同できない","歓迎する"]'::jsonb, 2, '«〜かねます» — vaziyat taqozosi bilan qila olmaslikni muloyim rad etish: 賛成いたしかねます = 賛同できない.', 61),
  ('mock_n3_s3_362', 'mock', NULL, 'N3', 'knowledge', 3, '環境[かんきょう]問題[もんだい]に（関心[かんしん]）を 持[も]つ 人[ひと]が 増[ふ]えている。', '["かんけい","かんかく","かんどう","かんしん"]'::jsonb, 3, '«Qiziqish, e''tibor» so''zining to''g''ri kanjisi — 関心 (かんしん).', 62),
  ('mock_n3_s3_363', 'mock', NULL, 'N3', 'knowledge', 3, 'この 映画[えいが]は 大人[おとな]から 子供[こども]に（至[いた]るまで）、楽[たの]しめる。', '["いたるまで","わたるまで","かぎるまで","つづくまで"]'::jsonb, 0, 'Qamrov chegarasi: 〜から〜に至るまで (kattalardan tortib bolalargacha).', 63),
  ('mock_n3_s3_364', 'mock', NULL, 'N3', 'reading', 3, '筆者[ひっしゃ]が この 文章[ぶんしょう]で 最[もっと]も 伝[つた]えたいことは 何[なに]ですか。', '["失敗[しっぱい]しないように 慎重[しんちょう]に 行動[こうどう]すべきである","失敗[しっぱい]を 恐[おそ]れずに 挑戦[ちょうせん]する 姿勢[しせい]が 成長[せいちょう]に 不可欠[ふかけつ]である","成功[せいこう]の ためには 他人[たにん]の 意見[いけん]を 聞[き]いてはならない","目標[もくひょう]は 低[ひく]めに 設定[せってい]するのが よい"]'::jsonb, 1, 'Matnda xatolardan qo''rqmasdan yangi sinovlarga dadil intilish inson o''sishi uchun zarurligi ilgari surilgan.', 64),
  ('mock_n3_s3_365', 'mock', NULL, 'N3', 'reading', 3, '新[あたら]しい 勤務[きんむ]システムに よって、社員[しゃいん]には どのような 変化[へんか]が 期待[きたい]されますか。', '["残業代[ざんぎょうだい]が 自動的[じどうてき]に 2倍[ばい]に 増[ふ]えること","毎日[まいにち] 必[かなら]ず 出社[しゅっしゃ]しなければならなくなること","自分[じぶん]の 裁量[さいりょう]で 効率的[こうりつてき]に 時間[じかん]を 活用[かつよう]できること","同僚[どうりょう]との コミュニケーションが 完全[かんぜん]に なくなること"]'::jsonb, 2, 'Xodimlarning o''z ixtiyori bilan vaqtni unumli rejalashtirishi ko''zda tutilgan.', 65),
  ('mock_n3_s3_366', 'mock', NULL, 'N3', 'reading', 3, 'この アンケート結果[けっか]から 読[よ]み取[と]れる 事実[じじつ]は どれですか。', '["高齢者[こうれいしゃ]の 9割[きゅうわり]が 電子書籍[でんししょせき]を 利用[りよう]して いる","読書[どくしょ]をする 人[ひと]の 割合[わりあい]は 毎年[まいとし] 減少[げんしょう]して いる","電子書籍[でんししょせき]の 値段[ねだん]は 紙[かみ]の 本[ほん]より 高[たか]い","若年層[じゃくねんそう]ほど 紙[かみ]の 本[ほん]より 電子書籍[でんししょせき]を 好[この]む 傾向[けいこう]が ある"]'::jsonb, 3, 'So''rovnoma yoshlar orasida elektron kitoblarga qiziqish yuqoriligini ko''rsatgan.', 66),
  ('mock_n3_s3_367', 'mock', NULL, 'N3', 'reading', 3, '工場見学[こうじょうけんがく]に 参加[さんか]する 際[さい]の 注意事項[ちゅういじこう]として 正[ただ]しいものは どれですか。', '["安全[あんぜん]のため、サンダルや ハイヒールでの 参加[さんか]は 認[みと]められない","工場内[こうじょうない]では 自由[じゆう]に 写真[しゃしん]を 撮影[さつえい]して よい","小学生[しょうがくせい]以下[いか]の 子供[こども]は 保護者[ほごしゃ]なしで 見学[けんがく]できる","ヘルメットの 着用[ちゃくよう]は 任意[にんい]である"]'::jsonb, 0, 'Xavfsizlik yuzasidan baland poshnali tufli va shippaklarda qatnashish qat''iyan man etiladi.', 67),
  ('mock_n3_s3_368', 'mock', NULL, 'N3', 'reading', 3, '筆者[ひっしゃ]に よると、AI（人工知能[じんこうちのう]）時代[じだい]に 人間[にんげん]に 求[もと]められる 力[ちから]とは 何[なに]ですか。', '["膨大[ぼうだい]な データを 機械[きかい]より 早[はや]く 暗記[あんき]する 力","他者[たしゃ]の 気持[きも]ちに 共感[きょうかん]し、創造的[そうぞうてき]に 協働[きょうどう]する 力[ちから]","誰[だれ]とも 関[かか]わらずに 一人[ひとり]で 計算[けいさん]する 力","過去[かこ]の 例[れい]を そのまま 丸暗記[まるあんき]する 力"]'::jsonb, 1, 'Insoniy hamdardlik, kreativlik va hamkorlikda ishlash fazilatlari talab etiladi.', 68),
  ('mock_n3_s3_369', 'mock', NULL, 'N3', 'reading', 3, 'この お知らせの 目的[もくてき]は 何[なに]ですか。', '["水道料金[すいどうりょうきん]の 値上[ねあ]げの 通知[つうち]","新[あたら]しい 水道管[すいどうかん]の 工事[こうじ]の 完了[かんりょう]報告[ほうこく]","定期点検[ていきてんけん]に 伴[ともな]う 断水[だんすい]の 日時[にちじ]と 協力[きょうりょく]の 依頼[いらい]","マンションの 管理人[かんりにん]の 交代[こうたい]挨拶[あいさつ]"]'::jsonb, 2, 'Rejali texnik ko''rik sababli suv o''chirilishi haqidagi ogohlantirish.', 69),
  ('mock_n3_s3_370', 'mock', NULL, 'N3', 'listening', 3, '男[おとこ]の 人[ひと]は これから まず 何[なに]を しますか。', '["会議室[かいぎしつ]の 予約[よやく]を 取[と]り消[け]す","上司[じょうし]に 報告書[ほうこくしょ]を 提出[ていしゅつ]する","昼休[ひるやす]みを 取[と]る","取引先[とりひきさき]に 電話[でんわ]を かけて 納期[のうき]を 確認[かくにん]する"]'::jsonb, 3, 'Avval hamkor tashkilotga qo''ng''iroq qilib muddatni aniqlashtirishi kerak.', 70),
  ('mock_n3_s3_371', 'mock', NULL, 'N3', 'listening', 3, '女[おんな]の 人[ひと]は どの プランを 申[もう]し込[こ]むことに しましたか。', '["インターネットと 携帯[けいたい]が セットになった 割引[わりびき]プラン","通話[つうわ]のみの 基本[きほん]プラン","データ無制限[むせいげん]の 単体[たんたい]プラン","家族[かぞく]4人[よにん]の ファミリープラン"]'::jsonb, 0, 'Internet va uyali aloqa birlashtirilgan chegirmali tarifni tanladi.', 71),
  ('mock_n3_s3_372', 'mock', NULL, 'N3', 'listening', 3, '2人[ふたり]は 新年会[しんねんかい]の 日程[にってい]を いつに 決[き]めましたか。', '["今月[こんげつ]の 末[すえ]","来月[らいげつ]の 第2金曜日[だいにきんようび]","来月[らいげつ]の 初日[しょにち]","再来月[さらいげつ]"]'::jsonb, 1, 'Kelasi oyning ikkinchi jumasi hamma uchun qulay bo''lgani sababli tanlandi.', 72),
  ('mock_n3_s3_373', 'mock', NULL, 'N3', 'listening', 3, '女[おんな]の 人[ひと]が 指摘[してき]した 資料[しりょう]の 修正点[しゅうせいてん]は どこですか。', '["表紙[ひょうし]の タイトルが 間違[まちが]えて いる点","ページ番号[ばんごう]が ない点","最新[さいしん]の 売上[うりあげ]グラフの 単位[たんい]が 抜[ぬ]けて いる点","フォントサイズが 小[ちい]さすぎる点"]'::jsonb, 2, 'Sotuv diagrammasida o''lchov birligi (million yen) yozilmay qolgani ko''rsatildi.', 73),
  ('mock_n3_s3_374', 'mock', NULL, 'N3', 'listening', 3, '留学生[りゅうがくせい]は これから まず 何[なに]を 書[か]かなければ なりませんか。', '["履歴書[りれきしょ]の 職歴[しょくれき]","健康[けんこう]診断書[しんだんしょ]","推薦状[すいせんじょう]","自己[じこ]PRと 志望[しぼう]理由[りゆう]の 作文[さくぶん]"]'::jsonb, 3, 'O''zini tanishtirish va tanlagan mutaxassislik sabablarini bayon qiluvchi insho yozishi kerak.', 74),
  ('mock_n3_s3_375', 'mock', NULL, 'N3', 'listening', 3, '男[おとこ]の 人[ひと]が この 鞄[かばん]を 気[き]に 入[い]った 理由[りゆう]は 何[なに]ですか。', '["軽[かる]くて 防水[ぼうすい]機能[きのう]が 優[すぐ]れて いるところ","デザインが 派手[はで]なところ","革[かわ]が 高級[こうきゅう]なところ","鍵[かぎ]が 3つ 付[つ]いて いるところ"]'::jsonb, 0, 'Sumkaning juda yengil va suv o''tkazmas (vodonepronitsayemyy) xususiyati yoqdi.', 75),
  ('mock_n2_s1_401', 'mock', NULL, 'N2', 'knowledge', 1, '景気の 低迷に（　）、多くの 企業が 採用人数を 削減した。', '["ともなって","関わらず","限らず","おいて"]'::jsonb, 0, '''~ni tomonatte'' (biror narsa sodir bo''lishi bilan birga, unga mutanosib ravishda) ma''nosini beradi.', 1),
  ('mock_n2_s1_402', 'mock', NULL, 'N2', 'knowledge', 1, 'いくら 経験が 豊富だからと（　）、過信は 禁物だ。', '["いっても","いったら","いえば","いって"]'::jsonb, 0, '''~kara to itte / to ittemo'' (garchi ... bo''lgan taqdirda ham) qolipi to''g''ri keladi.', 2),
  ('mock_n2_s1_403', 'mock', NULL, 'N2', 'knowledge', 1, '新商品の 発売を（　）、大規模な キャンペーンを 展開する。', '["めぐって","皮切りに","契機に","よそに"]'::jsonb, 1, '''~o kawakiri ni'' biror ketma-ket hodisalar zanjirining boshlanishi va startini ifodalaydi.', 3),
  ('mock_n2_s1_404', 'mock', NULL, 'N2', 'knowledge', 1, 'あの 作家の 新作は、期待を（　）素晴らしい 傑作だった。', '["通して","裏切らない","もとにした","めざした"]'::jsonb, 1, '''kitai o uragiranai'' (kutilmalarni puchga chiqarmagan, ishonchni oqlagan) iborasi qo''llaniladi.', 4),
  ('mock_n2_s1_405', 'mock', NULL, 'N2', 'knowledge', 1, 'この プロジェクトの 成功は、チーム全員の 協力（　）あり得ない。', '["なしには","ばかりに","わりに","からして"]'::jsonb, 0, '''~nashi ni wa (ari-enai)'' (...siz aslo bo''lishi mumkin emas / ...siz tasavvur qilib bo''lmaydi) ma''nosini bildiradi.', 5),
  ('mock_n2_s1_406', 'mock', NULL, 'N2', 'knowledge', 1, '地震の 揺れを 感知した（　）、エレベーターは 最寄り階に 自動停止した。', '["が早いか","なり","とたん","や否や"]'::jsonb, 2, '''~to tan'' (shu zahoti, bilanoq) kutilmagan ketma-ket hodisani ifodalaydi.', 6),
  ('mock_n2_s1_407', 'mock', NULL, 'N2', 'knowledge', 1, '次の 下線部の 言葉の 読み方として 最も よいものを 選びなさい。
「政府は 新たな 経済政策を <u>提唱</u>した。」', '["ていしょう","だいしょう","ていじょう","ちょうしょう"]'::jsonb, 0, '提唱 iyeroglifining to''g''ri o''qilishi ''ていしょう'' (Teishou - ilgari surish, taklif qilish).', 7),
  ('mock_n2_s1_408', 'mock', NULL, 'N2', 'knowledge', 1, '次の 下線部の 言葉の 漢字として 最も よいものを 選びなさい。
「彼は 困難な 状況でも <u>れいせい</u>に 判断した。」', '["冷清","冷静","冷精","冷整"]'::jsonb, 1, '''Reisei'' (sovuqqon, bosiq) so''zining to''g''ri iyeroglifi ''冷静'' hisoblanadi.', 8),
  ('mock_n2_s1_409', 'mock', NULL, 'N2', 'knowledge', 1, '会議で 出た 意見を（　）、最終的な 報告書を 作成した。', '["ふまえて","かぎって","かけて","めぐって"]'::jsonb, 0, '''~o fumaete'' (biror narsani asos/tayanch qilib olgan holda) ma''nosidagi N2 grammatik vositasi.', 9),
  ('mock_n2_s1_410', 'mock', NULL, 'N2', 'knowledge', 1, '留学を（　）に、彼の 視野は 大きく 広がった。', '["最中","契機","極み","拍子"]'::jsonb, 1, '''~o keiki ni'' (biror muhim voqeani turtki/imkoniyat deb bilib) qolipi to''g''ri keladi.', 10),
  ('mock_n2_s1_411', 'mock', NULL, 'N2', 'knowledge', 1, '親の 反対を（　）、彼は 自分の 夢を 追い続けた。', '["よそに","かねて","もとより","こめて"]'::jsonb, 0, '''~o yoso ni'' (boshqalarning e''tirozi yoki xavotiriga qaramasdan, pisand qilmay) degan ma''noni beradi.', 11),
  ('mock_n2_s1_412', 'mock', NULL, 'N2', 'knowledge', 1, '次の 言葉の 使い方として 最も 適切なものを 選びなさい。
「<u>愛着</u>」', '["長年 使ってきた 時計に 深い 愛着を 感じている。","新しい パソコンを 愛着して 仕事を 始めた。","彼の 愛着な 態度は 周囲を 怒らせた。","今回の 旅行は とても 愛着な 思い出に なった。"]'::jsonb, 0, '''Aichaku'' (biror qadrdon buyum yoki joyga mehr qo''yish) hissini ifodalaydi: ''愛着を感じる / 愛着が湧く''.', 12),
  ('mock_n2_s1_413', 'mock', NULL, 'N2', 'knowledge', 1, 'あの レストランは、料理の 味は（　）、接客サービスが 素晴らしい。', '["ともかく","からこそ","あまり","いっぽうで"]'::jsonb, 0, '''~wa tomokaku'' (...ni chetga surib turganda / bir chetga qo''yib aytganda) qolipi qo''llaniladi.', 13),
  ('mock_n2_s1_414', 'mock', NULL, 'N2', 'reading', 1, '筆者が日本社会に求めていることは何ですか？', '["テレワークを廃止し、全員がオフィスに出社すること","終業後の連絡を規制するなど、労働者の健康を守る明確なルールを作ること","諸外国と同じ労働法をそのまま無条件に導入すること","IT機器の利用時間を個人が自己責任で管理すること"]'::jsonb, 1, 'Muallif ish vaqtidan keyin aloqaga chiqmaslik huquqi kabi aniq himoya qoidalari zarurligini ta''kidlaydi.', 14),
  ('mock_n2_s1_415', 'mock', NULL, 'N2', 'reading', 1, '筆者によると、人間にしか生み出せないものとは何ですか？', '["膨大なデータに基づく正確な分析結果","個人的な体験や葛藤から生じる独自性","短時間で大量に作成できる絵画や文章","過去の様式を忠実に模倣した作品"]'::jsonb, 1, 'Matnda odamning o''z shaxsiy kechinmalari va ziddiyatlaridan kelib chiquvchi o''ziga xoslikni (独自性) sun''iy intellekt o''rnini bosa olmasligi yozilgan.', 15)
ON CONFLICT (id) DO UPDATE SET quiz_type = EXCLUDED.quiz_type, lesson_id = EXCLUDED.lesson_id, level = EXCLUDED.level, section = EXCLUDED.section, set_no = EXCLUDED.set_no, question = EXCLUDED.question, options = EXCLUDED.options, correct_index = EXCLUDED.correct_index, explanation = EXCLUDED.explanation, sort_order = EXCLUDED.sort_order;
-- @@CHUNK@@
INSERT INTO public.mobile_quiz_questions (id, quiz_type, lesson_id, level, section, set_no, question, options, correct_index, explanation, sort_order) VALUES
  ('mock_n2_s1_416', 'mock', NULL, 'N2', 'reading', 1, '現代の若年層の消費傾向として最も合致するものはどれですか？', '["高級な品物をできるだけ多く買い集めること","モノを所有することよりも、体験や人との共感に価値を置くこと","シェアリングサービスを避け、すべて自分で購入すること","旅行やイベントなどの出費を極力控えること"]'::jsonb, 1, 'Yoshlar buyumni sotib olib mulk qilishdan ko''ra (モノの所有), noyob tajriba va boshqalar bilan hamfikrlikka (体験・共感) ko''proq ahamiyat bermoqda.', 16),
  ('mock_n2_s1_417', 'mock', NULL, 'N2', 'reading', 1, '組織でイノベーションを起こすために経営層に必要な姿勢は何ですか？', '["絶対に失敗が起きない完璧な計画のみを承認すること","失敗した社員に対して厳しい減点処分を科すこと","失敗を恐れず挑戦したプロセスそのものを正当に評価すること","新規事業への投資を控え、既存事業のみに注力すること"]'::jsonb, 2, 'Muallif xodimlarning xatosiga jazo bermasdan, botirlik bilan yangilikka intilgan jarayonini (挑戦したプロセス) yuqori baholash zarurligini uqtiradi.', 17),
  ('mock_n2_s1_418', 'mock', NULL, 'N2', 'reading', 1, '筆者がインターネットの要約情報に対して懸念している点は何ですか？', '["情報が手に入るまでに時間がかかりすぎること","自ら深く問いを立てて思索する力が衰えてしまうこと","インターネットの利用料金が高騰していること","要約された文章が難解で理解できないこと"]'::jsonb, 1, 'Faqat tayyor qisqartirilgan konspektlar bilan cheklanish o''z mustaqil mushohada yuritish qobiliyatini zaiflashtiradi (思索する力が衰退する).', 18),
  ('mock_n2_s1_419', 'mock', NULL, 'N2', 'reading', 1, '休館期間中の対応について、正しいものはどれですか？', '["すべての資料は返却ポストに投函して返却できる","CDやDVDは返却ポストに投函せず、開館後にカウンターへ返却する","休館期間中もウェブサイトからいつでも本の予約ができる","休館中は正面玄関から入館して自習室のみ利用できる"]'::jsonb, 1, 'E''londa CD va DVD disklari sinish xavfi bo''lgani sababli qutiga tashlanmasligi (投函不可) va ochilgandan so''ng topshirilishi ko''rsatilgan.', 19),
  ('mock_n2_s1_420', 'mock', NULL, 'N2', 'listening', 1, '今年度の個人消費の特徴として述べられているのはどれですか？', '["すべての分野で消費が均等に落ち込んでいる","日用品は節約するが、体験型のことにはお金を使うという二極化","高級ブランド品の売上だけが伸びている","オンラインショッピングの利用が激減している"]'::jsonb, 1, 'Iste''molchilar ro''zg''or mahsulotlarida tejab, sayohat va konsert kabi tajriba (taiken) sohalariga pul sarflamoqda (qutblanish).', 20),
  ('mock_n2_s1_421', 'mock', NULL, 'N2', 'listening', 1, 'チームの生産性を高めるために最重要とされているものは何ですか？', '["厳格な上下関係","心理的安全性","労働時間の延長","成果主義による競争"]'::jsonb, 1, 'Spiker jamoada psixologik xavfsizlik (shinriteki anzensei) eng asosiy omil ekanligini aytadi.', 21),
  ('mock_n2_s1_422', 'mock', NULL, 'N2', 'listening', 1, '女性社員は まず 何を しますか？', '["資料を全員分印刷する","市場調査のグラフを修正する","部長に確認のメールを送る","明日のプレゼンの練習をする"]'::jsonb, 2, 'Bo''lim boshlig''i chop etishdan oldin boshliqqa (buchou) tasdiq so''rab xat yozishni buyuradi (''部長に最終確認のメールを送って'').', 22),
  ('mock_n2_s1_423', 'mock', NULL, 'N2', 'listening', 1, '朝 すっきりと 目覚めるために 最も 効果的な 方法は何ですか？', '["起きてすぐに太陽の光を浴びること","夜遅くに激しい運動をすること","アラームを何度も鳴らすこと","朝一番に熱いシャワーを浴びること"]'::jsonb, 0, 'Mutaxassis uyg''ongan zahoti pardani ochib quyosh nurini qabul qilishni eng samarali vosita deb ta''kidlaydi (''太陽の光を浴びること'').', 23),
  ('mock_n2_s1_424', 'mock', NULL, 'N2', 'listening', 1, '男の人が 新しいスマートフォンを 買わない 理由は 何ですか？', '["カメラの性能が気に入らないから","今使っている機種のバッテリーが切れたから","本体の価格が高すぎるから","デザインが古く見えるから"]'::jsonb, 2, 'Yigit yangi telefon narxi haddan tashqari qimmatligi (価格が高すぎて手が出ない) sababli uni xarid qilmaslikka qaror qiladi.', 24),
  ('mock_n2_s1_425', 'mock', NULL, 'N2', 'listening', 1, '木村さんは この後 まず どうしますか？', '["自分で営業部の部屋へ向かう","ソファーに座って待つ","田中に直接電話をかける","建物の外へ出て待つ"]'::jsonb, 1, 'Qabulxona xodimi divanda o''tirib ozgina kutib turishni iltimos qiladi (''ソファーにお掛けになって少々お待ちいただけますでしょうか'').', 25),
  ('mock_n2_s2_426', 'mock', NULL, 'N2', 'knowledge', 2, 'どんなに 困難な 道（　）、自分で 選んだからには 最後まで やり抜く。', '["であろうと","にすぎず","ばかりか","につけ"]'::jsonb, 0, '''~de arou to'' (qanchalik ... bo''lgan taqdirda ham) ma''nosini ifodalaydi.', 26),
  ('mock_n2_s2_427', 'mock', NULL, 'N2', 'knowledge', 2, '彼の 普段の 努力を（　）いればこそ、今回の 合格を 心から 祝福できる。', '["知って","知れば","知ろうと","知るまいと"]'::jsonb, 0, '''~ba koso / V-te ireba koso'' (aynan ... bo''lgani uchungina / sababli) grammatik qolipidir.', 27),
  ('mock_n2_s2_428', 'mock', NULL, 'N2', 'knowledge', 2, '次の 下線部の 言葉の 読み方として 最も よいものを 選びなさい。
「両国の 間で <u>平和条約</u>が 締結された。」', '["へいわじょうやく","へいわていやく","へいわじょうき","へいわちょうやく"]'::jsonb, 0, '平和条約 ning to''g''ri o''qilishi ''へいわじょうやく'' (Heiwa jouyaku - tinchlik shartnomasi).', 28),
  ('mock_n2_s2_429', 'mock', NULL, 'N2', 'knowledge', 2, '次の 下線部の 言葉の 漢字として 最も よいものを 選びなさい。
「事件の <u>しんそう</u>を 明らかにする。」', '["真想","真相","深相","真爽"]'::jsonb, 1, '''Shinsou'' (haqiqiy holat, voqea asl haqiqati) ''真相'' deb yoziladi.', 29),
  ('mock_n2_s2_430', 'mock', NULL, 'N2', 'knowledge', 2, '先輩の アドバイスに（　）、履歴書の 志望動機を 書き直した。', '["沿って","向かって","際して","通して"]'::jsonb, 0, '''~ni sotte'' (biror qoida, reja yoki yo''l-yo''riqqa rioya qilgan holda, muvofiq ravishda) qolipi qo''llaniladi.', 30),
  ('mock_n2_s2_431', 'mock', NULL, 'N2', 'knowledge', 2, '健康管理は、食事（　）、適度な 運動も 不可欠である。', '["はもとより","にしては","とあれば","にしたら"]'::jsonb, 0, '''~wa motoyori'' (A o''z-o''zidan ma''lumki, lekin B ham zarur) degan ma''noni ifodalaydi.', 31),
  ('mock_n2_s2_432', 'mock', NULL, 'N2', 'knowledge', 2, 'この 計画には 莫大な 予算が 必要であり、実行は（　）困難だ。', '["極めて","ろくに","たいして","いっそ"]'::jsonb, 0, '''Kiwamete'' (g''oyatda, haddan tashqari darajada) ravishi N2 darajasidagi rasmiy uslubga xosdir.', 32),
  ('mock_n2_s2_433', 'mock', NULL, 'N2', 'knowledge', 2, '天候の 悪化に（　）、山頂への 登山は 中止と 決定された。', '["かんがみ","ともない","めぐり","おいて"]'::jsonb, 0, '''~ni kangami'' (vaziyat yoki holatni chuqur inobatga olgan holda) ma''nosidagi rasmiy ifoda.', 33),
  ('mock_n2_s2_434', 'mock', NULL, 'N2', 'knowledge', 2, '次の 下線部の 言葉と 意味が 最も 近いものを 選びなさい。
「彼は <u>おおむね</u> 賛成の 意を 表した。」', '["だいたい","まったく","めったに","けっして"]'::jsonb, 0, '''Oomune'' so''zi ''umumiy hisobda, deyarli / asosiy qismi'' ya''ni ''だいたい (daitai)'' bilan sinonimdir.', 34),
  ('mock_n2_s2_435', 'mock', NULL, 'N2', 'knowledge', 2, '人気 アイドルの コンサート（　）、会場周辺は 早朝から ファンで 埋め尽くされた。', '["とあって","にすぎず","から見れば","を限りに"]'::jsonb, 0, '''~to atte'' (...dek alohida/favqulodda vaziyat bo''lgani sababli) ma''nosini bildiradi.', 35),
  ('mock_n2_s2_436', 'mock', NULL, 'N2', 'knowledge', 2, '子ども（　）、親の 表情の 変化には 敏感に 気づくものだ。', '["ながらも","っこない","っぽい","がちで"]'::jsonb, 0, '''~nagara mo'' (garchi ... bo''lsa ham / yosh bo''lishiga qaramay) zid ma''noli N2 qolipidir.', 36),
  ('mock_n2_s2_437', 'mock', NULL, 'N2', 'knowledge', 2, '長年の 研究成果が ついに 実を結び、新薬の 開発に 成功（　）。', '["した次第だ","するわけがない","しないとも限らない","するはずがない"]'::jsonb, 0, '''~shidaida'' (mana shunday sabablar va voqealar zanjiri natijasida shunga yetib keldik) deb xulosa qilishda ishlatiladi.', 37),
  ('mock_n2_s2_438', 'mock', NULL, 'N2', 'knowledge', 2, '次の 言葉の 使い方として 最も 適切なものを 選びなさい。
「<u>手際</u>」', '["シェフは 鮮やかな 手際で 魚を さばいた。","彼の 手際が 悪くて バスに 乗り遅れた。","手際を よく 磨いて 部屋を 掃除した。","この パソコンは 手際が 軽くて 持ち運びに 便利だ。"]'::jsonb, 0, '''Tegiwa'' ishni chaqqon, mohirona va epchillik bilan bajarish mahoratini bildiradi: ''手際が良い / 鮮やかな手際''.', 38),
  ('mock_n2_s2_439', 'mock', NULL, 'N2', 'reading', 2, '筆者の主張として最も適切なものはどれですか？', '["SNSで多くの評価を得ることが自己肯定感を高める最善策である","他者からの評価に依存せず、自らの価値観に従って生きることが大切である","他人の目をまったく気にせずに生きることは不可能である","自己肯定感を高めるためにはSNSの利用を完全に禁止すべきである"]'::jsonb, 1, 'Muallif boshqalarning sonli bahosiga qaram bo''lmasdan, o''z qadriyatlariga tayanib yashash haqiqiy o''ziga ishonchni berishini ta''kidlaydi.', 39),
  ('mock_n2_s2_440', 'mock', NULL, 'N2', 'reading', 2, 'ビルの屋上や壁面の緑化がもたらす効果として述べられていないものはどれですか？', '["都市の気温上昇（ヒートアイランド現象）を緩和すること","人々に精神的な安らぎや潤いを与えること","建築物の建設コストを大幅に削減すること","都市の景観を向上させること"]'::jsonb, 2, 'Matnda qurilish xarajatlarini kamaytirishi haqida hech narsa aytilmagan (qolgan barcha bandlar matnda sanab o''tilgan).', 40),
  ('mock_n2_s2_441', 'mock', NULL, 'N2', 'reading', 2, '異文化と接する際に筆者が重要だと考えている姿勢は何ですか？', '["自分の文化の優位性を相手に納得させること","相手の文化をすぐに自文化の基準で判断すること","背景にある歴史や社会的文脈を理解しようと努めること","自文化の習慣をすべて捨てて相手に同化すること"]'::jsonb, 2, 'Boshqa madaniyatni o''rganishda uning zamiridagi tarixiy va ijtimoiy omillarni (歴史や社会的文脈) tushunishga intilish eng muhimdir.', 41),
  ('mock_n2_s2_442', 'mock', NULL, 'N2', 'reading', 2, '現代において求められている「支援型リーダーシップ」の説明として正しいものはどれですか？', '["すべての決定をリーダーが一人で行い、厳格に従わせること","メンバーの強みを活かし、自律的な決定を支援する環境を整えること","業務の指示を出さず、部下の行動を完全に放任すること","短期的な成果のみを重視して厳しいノルマを課すこと"]'::jsonb, 1, 'Qo''llab-quvvatlovchi lider xodimlarning kuchli tomonlarini yuzaga chiqarib, erkin qaror qabul qilishiga ko''maklashadi.', 42),
  ('mock_n2_s2_443', 'mock', NULL, 'N2', 'reading', 2, '筆者が睡眠について述べていることと合致するものはどれですか？', '["睡眠時間を削ることで短期的には大きな成果が得られる","十分な睡眠をとることが長期的な高い成果を維持する投資となる","勉強時間を増やすためには睡眠時間を4時間以下に抑えるべきである","睡眠不足でも集中力や判断力には何の影響もない"]'::jsonb, 1, 'Etarli uyqu uzoq muddatli aqliy samaradorlik va salomatlikka kiritilgan eng ishonchli sarmoyadir (最も確実な投資).', 43),
  ('mock_n2_s2_444', 'mock', NULL, 'N2', 'reading', 2, 'カードを紛失した際、最初に行うべき緊急の対応は何ですか？', '["翌月の給与明細を確認すること","直ちに総務部へ電話連絡し、旧カードの利用を停止すること","警察署に行って遺失物届を出すこと","すぐに再発行手数料2,000円を現金で支払うこと"]'::jsonb, 1, 'Karta yo''qolganda xavfsizlik uchun eng avval darhol telefon orqali eski kartani bloklash (利用停止手続き) kerak.', 44),
  ('mock_n2_s2_445', 'mock', NULL, 'N2', 'listening', 2, '二人は 最終的に どうすることに しましたか？', '["テスト期間をさらに短縮して予定通りリリースする","クライアントと交渉して納期を1週間延ばす","新システムの導入そのものを中止する","テストを省略してそのまま運用を開始する"]'::jsonb, 1, 'Boshliq xatoliklar qolib ketmasligi uchun mijoz bilan kelishib topshirish muddatini 1 haftaga uzaytirishga (納期を1週間後ろにずらそう) qaror qiladi.', 45),
  ('mock_n2_s2_446', 'mock', NULL, 'N2', 'listening', 2, '相談員が 面接で 最も 大切だと 言っていることは 何ですか？', '["用意した志望動機を完璧に暗記して話すこと","質問の意図を捉えて結論から簡潔に答える対話をすること","自分の実績をできるだけ長く詳しくアピールすること","面接官の目を見ずに下を向いて話すこと"]'::jsonb, 1, 'Maslahatchi yodlab olingan matnni to''xtovsiz aytish emas, savol mohiyatini anglab qisqa xulosa bilan muloqot qilish muhimligini uqtiradi.', 46),
  ('mock_n2_s2_447', 'mock', NULL, 'N2', 'listening', 2, '客の 要望について、どうなりましたか？', '["満席のため人数を増やすことはできなかった","飛行機もホテルも手配でき、1名の追加が可能になった","ツアー自体が中止になっていた","ホテルは空いているが飛行機が取れなかった"]'::jsonb, 1, 'Sayyohlik agentligi samolyot va mehmonxonadan joy topib, 1 nafar kishini qo''shish imkoni borligini tasdiqladi.', 47),
  ('mock_n2_s2_448', 'mock', NULL, 'N2', 'listening', 2, '来週の 研修で 重点的に 行うことは 何ですか？', '["名刺交換のロールプレイング","電話応対の基本練習","ビジネスメールの敬語指導と添削","社内システムの操作説明"]'::jsonb, 2, 'Xodimlar yangi ishchilar qiynalayotgan rasmiy xat yozishdagi hurmat tili (keigo email) ustida ko''proq mashq o''tkazishga kelishib oldilar.', 48),
  ('mock_n2_s2_449', 'mock', NULL, 'N2', 'listening', 2, '美術館での 写真撮影について、正しいものは どれですか？', '["すべての作品をフラッシュを使って撮影できる","指定された作品のみ、フラッシュと三脚なしで撮影できる","動画であれば全館で自由に撮影できる","いかなる撮影も完全に禁止されている"]'::jsonb, 1, 'E''londa faqat belgilangan asarlarnigina chiroq (flash) va shtativsiz suratga olishga ruxsat berilgani aytiladi.', 49),
  ('mock_n2_s2_450', 'mock', NULL, 'N2', 'listening', 2, '男性客は 次に 何を 試着しますか？', '["グレーのズボン","紺色のジャケット","黒色のズボン","別のサイズのジャケット"]'::jsonb, 1, 'Mijoz kulrang o''rniga to''q ko''k (紺 - kon) rangli nimchani (jaket) kiyib ko''rmoqchi bo''ladi: ''紺を着てみて決めるよ''.', 50),
  ('mock_n2_s3_451', 'mock', NULL, 'N2', 'knowledge', 3, '政府[せいふ]は 景気[けいき]の 回復[かいふく]を（目指[めざ]して）、新[あたら]しい 経済[けいざい]対策[たいさく]を 打[う]ち出[だ]した。', '["めざして","めがけて","ねらって","むかって"]'::jsonb, 0, '«Maqsad qilib intilmoq» ma''nosidagi fe''l — 目指して (めざして).', 51),
  ('mock_n2_s3_452', 'mock', NULL, 'N2', 'knowledge', 3, '今回[こんかい]の 不祥事[ふしょうじ]は、組織[そしき]の 隠蔽[いんぺい]体質[たいしつ]に（起因[きいん]）する ものだ。', '["おこいん","きいん","はついん","げんいん"]'::jsonb, 1, '«...dan kelib chiqmoq / sabab bo''lmoq»: 起因 (きいん - kiin).', 52),
  ('mock_n2_s3_453', 'mock', NULL, 'N2', 'knowledge', 3, 'いかに 困難[こんなん]な 状況[じょうきょう]で（あろうと）、最後[さいご]まで 諦[あきら]めない。', '["あろうが","あっても","あろうと","あるまいと"]'::jsonb, 2, 'Kuchli iroda bilan «qanchalik og''ir bo''lmasin»: 〜であろうと.', 53),
  ('mock_n2_s3_454', 'mock', NULL, 'N2', 'knowledge', 3, '両国[りょうこく]の 首脳[しゅのう]は 領土[りょうど]問題[もんだい]を（めぐって）、激[はげ]しい 議論[ぎろん]を 交[か]わした。', '["こめて","つうじて","とおして","めぐって"]'::jsonb, 3, 'Biror bahsli mavzu atrofida tortishuv: 〜をめぐって.', 54),
  ('mock_n2_s3_455', 'mock', NULL, 'N2', 'knowledge', 3, '市民[しみん]の 声[こえ]を（踏[ふ]まえて）、都市[とし]再開発[さいかいはつ]の 計画[けいかく]を 見直[みなお]す。', '["ふまえて","かまえて","おさえて","とらえて"]'::jsonb, 0, 'Fikr va takliflarni asos qilib olgan holda: 〜を踏まえて (tayangan holda).', 55),
  ('mock_n2_s3_456', 'mock', NULL, 'N2', 'knowledge', 3, 'こんな 重大[じゅうだい]な 決定[けってい]を、私[わたし]の一存[いちぞん]では（決[き]めかねます）。', '["決められます","決めかねます","決めるべきです","決めかねません"]'::jsonb, 1, 'Vaziyat nozikligi tufayli bir o''zi hal qila olmasligini bildirish: 〜かねます.', 56),
  ('mock_n2_s3_457', 'mock', NULL, 'N2', 'knowledge', 3, '調査[ちょうさ]の 結果[けっか]は、私[わたし]たちの 予想[よそう]に（反[はん]して）、大幅[おおはば]な 黒字[くろじ]だった。', '["そくして","たいして","はんして","こたえて"]'::jsonb, 2, 'Kutilgan taxminga zid ravishda: 〜に反して (予想に反して).', 57),
  ('mock_n2_s3_458', 'mock', NULL, 'N2', 'knowledge', 3, '日頃[ひごろ]の 努力[どりょく]（なしには）、このような 快挙[かいきょ]は 達成[たっせい]できなかった。', '["ぬきには","からには","うえないでは","なしには"]'::jsonb, 3, '«...siz aslo bo''lmasdi»: 〜なしには / 〜なくしては.', 58),
  ('mock_n2_s3_459', 'mock', NULL, 'N2', 'knowledge', 3, '彼[かれ]の 成功[せいこう]は 天才[てんさい]的な 才能[さいのう]の（たまもの）と 言[い]える。', '["努力の結晶","偶然の産物","単なる幸運","他人の援助"]'::jsonb, 0, '«たまもの» — uzoq mehnatu sa''y-harakatning mevasi, samarali natijasi.', 59),
  ('mock_n2_s3_460', 'mock', NULL, 'N2', 'knowledge', 3, '契約書[けいやくしょ]の 条件[じょうけん]を （厳格[げんかく]）に 遵守[じゅんしゅ]する。', '["ごんかく","げんかく","きゅうかく","りつかく"]'::jsonb, 1, '«Qat''iy, shafqatsiz darajada aniq»: 厳格 (げんかく).', 60),
  ('mock_n2_s3_461', 'mock', NULL, 'N2', 'knowledge', 3, '彼[かれ]は どんなに 忙[いそが]しくても、笑顔[えがお]を（絶[た]やさない）。', '["きらさない","やめない","たやさない","すてない"]'::jsonb, 2, 'Tabassumini aslo so''ndirmaydi/yo''qotmaydi: 笑顔を絶やさない.', 61),
  ('mock_n2_s3_462', 'mock', NULL, 'N2', 'knowledge', 3, '一度[いちど] 決[き]めた（以上[いじょう]）、最後[さいご]まで やり遂[と]げなければ ならない。', '["からには","うえは","ばかりに","いじょう"]'::jsonb, 3, '«Modomiki qaror qilingan ekan»: 〜以上 (〜以上は).', 62),
  ('mock_n2_s3_463', 'mock', NULL, 'N2', 'knowledge', 3, '彼[かれ]の 言動[げんどう]には、いささか 疑問[ぎもん]を（抱[いだ]かざるを得ない）。', '["いだかざるをえない","いだかざるをえないわけがない","いだかざるをえないはずだ","いだくべきではない"]'::jsonb, 0, 'Majburan shubhalanishga to''g''ri keladi: 〜ざるを得ない (qilmaslikning iloji yo''q).', 63),
  ('mock_n2_s3_464', 'mock', NULL, 'N2', 'reading', 3, '筆者[ひっしゃ]が 主張[しゅちょう]する「真[しん]の リーダーシップ」とは どのような ものですか。', '["すべてを 独断[どくだん]で 決[き]めて 部下[ぶか]に 命令[めいれい]を 下[くだ]すこと","権力[けんりょく]で 従[したが]わせるのではなく、組織[そしき]の 潜在能力[せんざいのうりょく]を 引[ひ]き出[だ]す 伴走者[ばんそうしゃ]であること","失敗[しっぱい]の 責任[せきにん]を すべて 部下[ぶか]に 負[お]わせること","何[なに]も 指示[しじ]を出さず 現場[げんば]に 丸投[まるな]げすること"]'::jsonb, 1, 'Haqiqiy rahbarlik buyruqbozlik emas, balki xodimlarning imkoniyatlarini yuzaga chiqaruvchi hamroh bo''lishdir.', 64),
  ('mock_n2_s3_465', 'mock', NULL, 'N2', 'reading', 3, '現代[げんだい]の 消費者[しょうひひしゃ]行動[こうどう]の 特徴[とくちょう]として 述[の]べられているものは どれですか。', '["安ければ品質はどうでもよいという極端な価格至上主義","他人の評判は一切気にせず直感だけで購買を決定すること","単なる「モノの所有」から、特別な体験や共感を重視する「コト消費」へのシフト","店舗での対面販売しか信用しない傾向の強まり"]'::jsonb, 2, 'Oddiy buyumga egalik qilishdan ko''ra noyob tajriba va taassurot orttirish muhim ahamiyat kasb etmoqda.', 65),
  ('mock_n2_s3_466', 'mock', NULL, 'N2', 'reading', 3, 'リモートワークが 企業[きぎょう]文化[ぶんか]に 与[あた]える 潜在的[せんざいてき]な リスクとして 懸念[けねん]されているものは 何[なに]ですか。', '["通勤時間がなくなることで従業員の睡眠時間が過剰になること","紙の書類が減りすぎてオフィスが整頓されすぎること","世界中の優秀な人材を採用できるようになること","偶発的[ぐうはつてき]な 雑談[ざつだん]や 交流[こうりゅう]が 減少[げんしょう]し、組織[そしき]の 一体感[いったいかん]や 創発性[そうはつせい]が 損[そこ]なわれること"]'::jsonb, 3, 'Kutilmagan tasodifiy suhbatlarning kamayishi sababli ijodiy g''oyalar va jamoaviy birlik susayishi xavfi bor.', 66),
  ('mock_n2_s3_467', 'mock', NULL, 'N2', 'reading', 3, '伝統工芸[でんとうこうげい]の 継承[けいしょう]における 課題[かだい]と 解決策[かいけつさく]として 適切[てきせつ]なものは どれですか。', '["伝統[でんとう]の 技法[ぎほう]を 守[まも]りつつ、現代[げんだい]の ライフスタイルに 合[あ]わせた 新製品[しんせいひん]を 開発[かいはつ]すること","昔ながらのデザインを絶対に変えずに高価格で維持し続けること","職人の手作業をすべてロボットによる大量生産に切り替えること","後継者がいないため自然に産業が消滅するのを待つこと"]'::jsonb, 0, 'Qadimiy hunarmandchilik mahoratini asragan holda zamonaviy hayotga mos yangi dizaynlarni joriy etish.', 67),
  ('mock_n2_s3_468', 'mock', NULL, 'N2', 'reading', 3, '筆者[ひっしゃ]の 科学[かがく]技術[ぎじゅつ]に 対[たい]する 立場[たちば]は どのような ものですか。', '["科学の進展は常に絶対善であり、いかなる規制も加えるべきではない","技術[ぎじゅつ]の 進歩[しんぽ]を 盲信[もうしん]せず、倫理的[りんりてき]な 影響[えいきょう]を 絶[た]えず 吟味[ぎんみ]する 社会的[しゃかいてき] 対話[たいわ]が 不可欠[ふかけつ]である","危険な新技術はすべて開発を即座に中止し原始的な生活に戻るべきだ","専門家だけにすべての判断を委ね、一般市民は沈黙を守るべきだ"]'::jsonb, 1, 'Texnologiyaga ko''r-ko''rona ishonmasdan, axloqiy va ijtimoiy oqibatlarni chuqur muhokama qilish lozim.', 68),
  ('mock_n2_s3_469', 'mock', NULL, 'N2', 'reading', 3, '多言語[たげんご]教育[きょういく]が もたらす 最大[さいだい]の メリットとして 述[の]べられているものは どれですか。', '["将来必ず外交官になって大金を稼げるようになること","母国語の文法や語彙を完全に忘れて新しい人格になれること","単なる 言語[げんご]の 習得[しゅうとく]に 留[とど]まらず、多様[たよう]な 視点[してん]から 物事[ものごと]を 捉[とら]える 柔軟[じゅうなん]な 思考力[しこうりょく]が 養[やしな]われること","外国語を話すときだけ性格が攻撃的になれること"]'::jsonb, 2, 'Shunchaki til o''rganish emas, balki dunyoga turli rakurslardan qaray oladigan teran tafakkurni shakllantiradi.', 69),
  ('mock_n2_s3_470', 'mock', NULL, 'N2', 'listening', 3, '男[おとこ]の 開発者[かいはつしゃ]は 今後[こんご] どこを 重点的[じゅうてんてき]に 改良[かいりょう]する 予定[よてい]ですか。', '["本体[ほんたい]の カラーバリエーション","スピーカーの 音質[おんしつ]","パッケージの デザイン","バッテリーの 駆動[くどう]時間[じかん]と 放熱[ほうねつ]効率[こうりつ]"]'::jsonb, 3, 'Batareyaning ishlash muddatini uzaytirish va qizib ketmasligini ta''minlashga e''tibor qaratiladi.', 70),
  ('mock_n2_s3_471', 'mock', NULL, 'N2', 'listening', 3, '女[おんな]の 支店長[してんちょう]が 最優先[さいゆうせん]で 取り組[とりく]むべきと 考[かんが]えている 施策[しさく]は 何[なに]ですか。', '["顧客[こきゃく]一人ひとりの ニーズに 合[あ]わせた 資産[しさん]運用[うんよう]コンサルティングの 強化[きょうか]","支店の 窓口[まどぐち]営業[えいぎょう]時間[じかん]の 延長[えんちょう]","新規[しんき]口座[こうざ]開設[かいせつ]の 手数料[てすうりょう]の 引き下げ","テレビCMの 放送[ほうそう]回数[かいすう]の 増加[ぞうか]"]'::jsonb, 0, 'Mijozlarning ehtiyojlariga mos professional moliyaviy maslahat berish xizmatini kuchaytirish.', 71),
  ('mock_n2_s3_472', 'mock', NULL, 'N2', 'listening', 3, '町長[ちょうちょう]は 観光[かんこう]振興[しんこう]のために どのような 方針[ほうしん]を 示[しめ]しましたか。', '["大型[おおがた]リゾートホテルを 多数[たすう] 誘致[ゆうち]すること","自然[しぜん]や 歴史[れきし]資源[しげん]を 生[い]かした 長期[ちょうき]滞在型[たいざいがた]の エコツーリズムの 推進[すいしん]","外国人[がいこくじん]観光客[かんこうきゃく]の 入場[にゅうじょう]を 制限[せいげん]すること","観光地[かんこうち]の 入場料[にゅうじょうりょう]を 完全[かんぜん]無料[むりょう]に すること"]'::jsonb, 1, 'Tabiat va tarixiy merosga asoslangan ekoturizmni rivojlantirish orqali uzoq muddatli mehmonlarni jalb qilish.', 72),
  ('mock_n2_s3_473', 'mock', NULL, 'N2', 'listening', 3, '研究所[けんきゅうじょ]の 発表[はっぴょう]に よると、新素材[しんそざい]の 最大[さいだい]の 利点[りてん]は 何[なに]ですか。', '["製造コストが プラスチックの 10倍[じゅうばい] かかる点","火[ひ]に 弱[よわ]く 溶[と]けやすい 点","軽量[けいりょう]でありながら 鋼鉄[こうてつ]の 5倍[ごばい]の 強度[きょうど]を 持[も]ち、自然[しぜん]分解[ぶんかい]される 点","リサイクルが 不可能[ふかのう]な 点"]'::jsonb, 2, 'Juda yengil bo''lishiga qaramay po''latdan 5 barobar mustahkam va tabiatda o''z-o''zidan parchalanadi.', 73),
  ('mock_n2_s3_474', 'mock', NULL, 'N2', 'listening', 3, '女性[じょせい]が 提案[ていあん]した 働き方[はたらきかた]改革[かいかく]の 具体策[ぐたいさく]は どれですか。', '["すべての 会議[かいぎ]の 時間[じかん]を 2倍[ばい]に 延[の]ばすこと","有給[ゆうきゅう]休暇[きゅうか]の 取得[しゅとく]を 禁止[きんし]すること","全員[ぜんいん]が 深夜[しんや]まで 残業[ざんぎょう]すること","週休[しゅうきゅう]3日制[みっかせい]の 試験[しけん]導入[どうにゅう]と 業務[ぎょうむ]の ペーパーレス化[か]"]'::jsonb, 3, 'Haftada 3 kunlik dam olish rejimini sinovdan o''tkazish va qog''ozsiz tizimga o''tish taklif etildi.', 74),
  ('mock_n2_s3_475', 'mock', NULL, 'N2', 'listening', 3, '大学[だいがく]の 事務[じむ]スタッフが 留学生[りゅうがくせい]に 伝[つた]えている 手続き[てつづき]の 期限[きげん]は いつですか。', '["今月[こんげつ]末[まつ]の 金曜日[きんようび] 午後[ごご]5時[ごじ]まで","来週[らいしゅう]の 月曜日[げつようび] 朝[あさ]9時[くじ]","来月[らいげつ]の 15日[じゅうごにち]","いつでも 提出[ていしゅつ]可能[かのう]"]'::jsonb, 0, 'Shu oyning oxirgi juma kuni soat 17:00 ga qadar topshirish qat''iy belgilangan.', 75),
  ('mock_n1_s1_501', 'mock', NULL, 'N1', 'knowledge', 1, '国家の 安全保障に 関わる 重大な 秘密を（　）漏らすことは 許されない。', '["たりとも","だに","すら","まじき"]'::jsonb, 0, '''~taritomo (...nai)'' qolipi ''hatto zarracha ham'' degan kuchli inkor ma''nosini bildiradi: ichi-nichi taritomo / sukoshi taritomo.', 1),
  ('mock_n1_s1_502', 'mock', NULL, 'N1', 'knowledge', 1, '親友の 突然の 訃報に、悲しみを（　）ことが できなかった。', '["禁じ得ない","禁じざる","禁じかねない","禁じ得る"]'::jsonb, 0, '''~kinji enai'' hissiyotlarni bosib tura olmaslik, tiyib bo''lmas qayg''uni bildiradi: kanashimi o kinji enai.', 2),
  ('mock_n1_s1_503', 'mock', NULL, 'N1', 'knowledge', 1, '誠心誠意の 謝罪が あって（　）、初めて 和解への 道が 開かれる。', '["こそあれ","ならでは","をおいて","こそ"]'::jsonb, 3, '''A atte koso'' ta''kid qolipi: aynan chin dildan uzr bo''lgandagina yarashishga yo''l ochiladi.', 3),
  ('mock_n1_s1_504', 'mock', NULL, 'N1', 'knowledge', 1, '公職に ある者が、私利私欲を 肥やすなど 断じて（　）行為だ。', '["あるまじき","ありがちな","あるべき","あり得る"]'::jsonb, 0, '''~aru majiki'' qolipi kasbiy yoki ijtimoiy mavqe nuqtai nazaridan ''aslo yo''l qo''yib bo''lmaydigan'' ma''nosini anglatadi.', 4),
  ('mock_n1_s1_505', 'mock', NULL, 'N1', 'knowledge', 1, '自然の 猛威の 前には、人間の 知恵など 児戯に（　）。', '["等しい","至らない","及ばない","堪えない"]'::jsonb, 0, '''jigi ni hitoshii'' (bolalar o''yiniga teng, arzimas) iborasi tabiat oldida inson ojizligini ko''rsatadi.', 5),
  ('mock_n1_s1_506', 'mock', NULL, 'N1', 'knowledge', 1, '次の 下線部の 言葉の 読み方として 最も よいものを 選びなさい。
「長年の 悲願が ついに <u>成就</u>した。」', '["じょうじゅ","せいじゅ","じょうしゅう","せいしゅう"]'::jsonb, 0, '成就 so''zining to''g''ri o''qilishi — じょうじゅ (Jouju - niyatning amalga oshishi, ro''yobga chiqishi).', 6),
  ('mock_n1_s1_507', 'mock', NULL, 'N1', 'knowledge', 1, '次の 下線部の 言葉の 漢字として 最も よいものを 選びなさい。
「相手の <u>しつよう</u>な 追及に 苦慮した。」', '["執拗","執要","湿拗","執洋"]'::jsonb, 0, '''Shitsuyou'' (o''jar, tinimsiz, qaysar) so''zining to''g''ri kanjisi — 執拗.', 7),
  ('mock_n1_s1_508', 'mock', NULL, 'N1', 'knowledge', 1, '彼の 卓抜した 才能と 弛まぬ 努力が（　）、今回の 歴史的 快挙が 生まれた。', '["相まって","先立って","ひきかえ","おいて"]'::jsonb, 0, '''~to aimatte'' (ikki ijobiy omil bir-biri bilan uyg''unlashib, kuchayib) degan N1 grammatik qoidasidir.', 8),
  ('mock_n1_s1_509', 'mock', NULL, 'N1', 'knowledge', 1, 'この 難病の 治療法を 見いだすことは、医学者（　）の 崇高な 使命だ。', '["たるもの","づくめ","まみれ","ずくめ"]'::jsonb, 0, '''~taru mono'' (o''z kasbi yoki mas''uliyatli maqomiga sazovor shaxs sifatida) ma''nosini ifodalaydi.', 9),
  ('mock_n1_s1_510', 'mock', NULL, 'N1', 'knowledge', 1, '多額の 資金援助を いただいた 恩師には、感謝の（　）ございません。', '["念に堪えません","極みで","きらいが","余儀なく"]'::jsonb, 0, '''kansha no nen ni taemasen'' (cheksiz minnatdorlik tuyg''usini bosolmayman) eng oliy darajadagi rasmiy minnatdorlik iborasidir.', 10),
  ('mock_n1_s1_511', 'mock', NULL, 'N1', 'knowledge', 1, '不祥事を 起こした 企業が、責任を 逃れようとするのは 卑劣（　）。', '["極まりない","極まること","極めない","極まり得ない"]'::jsonb, 0, '''Na-sifat + kiwamarinai'' (haddan tashqari, o''ta darajada nomaqbul) holatni ifodalaydi: hiretsu kiwamarinai.', 11),
  ('mock_n1_s1_512', 'mock', NULL, 'N1', 'knowledge', 1, '次の 文の（　）に 入れるのに 最も よい 言葉を 選びなさい。
「経済指標の 改善傾向は <u>顕著</u>に 現れている。」', '["目立って","かすかに","徐々に","不自然に"]'::jsonb, 0, '顕著 (kencho) — ''ko''zga yaqqol tashlanadigan, sezilarli'' (目立って - medatte) ma''nodoshidir.', 12),
  ('mock_n1_s1_513', 'mock', NULL, 'N1', 'knowledge', 1, '彼が これほど 責任感の 強い 人物であったとは、想像（　）しなかった。', '["だに","すら","だの","なり"]'::jsonb, 0, '''~dani shinakatta'' (hatto xayolga ham keltirmagan edim, tasavvur ham qilmagan edim) ma''nosidagi adabiy N1 vositasidir.', 13),
  ('mock_n1_s1_514', 'mock', NULL, 'N1', 'reading', 1, '筆者の主張の核心として最も適切なものはどれですか？', '["近代合理主義による産業革命の成果を全面的に放棄すべきだ","自然を支配の対象とみなす思想を改め、自然と共生する世界観へ転換すべきだ","東洋思想は西洋の科学技術と一切相容れないものである","生態系の破壊は科学技術のさらなる進歩によってのみ解決できる"]'::jsonb, 1, 'Muallif inson tabiat ustidan hukmronlik qilishi haqidagi qarashdan voz kechib, tabiat bilan uyg''unlikdagi falsafaga o''tish lozimligini ta''kidlaydi.', 14),
  ('mock_n1_s1_515', 'mock', NULL, 'N1', 'reading', 1, '筆者が考える「古典を読む最大の意義」とは何ですか？', '["過去の歴史的事実を暗記し、教養を高めること","現代の価値観を絶対的な基準として過去の誤りを批判すること","自らの時代の前提を相対化し、批判的に省察する契機を得ること","古風な文体を模倣して美しい文章を書けるようになること"]'::jsonb, 2, 'Klassik asarlarni o''qish orqali zamonamiz qoliplaridan chiqib, tanqidiy fikrlash (批判的思考) imkoniyati paydo bo''ladi.', 15),
  ('mock_n1_s1_516', 'mock', NULL, 'N1', 'reading', 1, '偶然の発見（セレンディピティ）を生かすために最も不可欠なものは何だと述べられていますか？', '["最新式の高性能な実験機器と潤沢な研究資金","常に問題意識を持ち常識を疑う、準備された知性","偶然の失敗を完全に排除する緻密な計画性","他の研究者との積極的な共同研究体制"]'::jsonb, 1, 'Tasodifiy kashfiyotlardan unumli foydalanish uchun doimo teran izlanishda bo''lgan ''tayyorlangan aql'' (準備された精神) zarur.', 16),
  ('mock_n1_s1_517', 'mock', NULL, 'N1', 'reading', 1, '本文で筆者が問題提起している内容として最も合致するものはどれですか？', '["AIの発展によって効率性が高まるのは人類にとって無条件に歓迎すべきことだ","効率至上主義で失われがちな身体的経験や試行錯誤にこそ人間の独創性がある","あらゆる自動化技術の開発を今すぐ停止し、手作業の時代に戻るべきだ","人間の直観や身体感覚は科学的に再現可能であるため重視に値しない"]'::jsonb, 1, 'Muallif AI samaradorlikni oshirgani bilan, haqiqiy insoniy ijodkorlik aynan sinov-xatolar va jismoniy tajribada yashiringanini uqtiradi.', 17),
  ('mock_n1_s1_518', 'mock', NULL, 'N1', 'reading', 1, '「言わぬが花」や「余情」の美学がもたらす効果として、筆者は何を挙げていますか？', '["正確な情報伝達により誤解をゼロにすること","表現を切り詰めることで、受け手の想像力を極大化させること","会話の時間を短縮して業務を効率化すること","外国語への翻訳を容易にすること"]'::jsonb, 1, 'Gapni qisqa va vazmin qilib, tinglovchining tasavvur qobiliyatini (受け手の想像力) yuksaltirish maqsad qilingan.', 18),
  ('mock_n1_s1_519', 'mock', NULL, 'N1', 'reading', 1, '筆者が推奨するリーダーシップと組織のあり方はどれですか？', '["強力な権限を持つリーダーがトップダウンで統率する組織","成員の内発的動機を引き出し、自律的な連携を促す奉仕型のリーダーシップ","リーダーを置かず、全員の多数決のみで全ての意思決定を行う組織","外的な変化に左右されず、過去の規則を頑なに守り抜く組織"]'::jsonb, 1, 'Muallif a''zolarning ichki ishtiyoqini uyg''otib, ularga ko''maklashuvchi ''xizmatchi yetakchilik'' (サーバント・リーダーシップ) tarafdoridir.', 19),
  ('mock_n1_s1_520', 'mock', NULL, 'N1', 'listening', 1, 'パラダイムシフトが起こる根本的な契機として述べられているのはどれですか？', '["学会の指導者が交代したとき","既存の理論で説明できない変則事象が累積したとき","実験機器の予算が大幅に増額されたとき","社会一般の関心が科学から離れたとき"]'::jsonb, 1, 'Professor mavjud nazariyalar tushuntirib bera olmaydigan anomaliyalar to''planib ketganda paradigma o''zgarishini aytadi.', 20),
  ('mock_n1_s1_521', 'mock', NULL, 'N1', 'listening', 1, '言語学者が言語の多様性を重要視する最大の理由は何ですか？', '["観光産業の発展に直結するから","独自の認識体系や世界観の喪失を防ぐため","外国語学習者の教材を増やすため","翻訳技術の精度を測る指標になるから"]'::jsonb, 1, 'Tilning yo''qolishi shu xalqning asrlar davomida shakllangan o''ziga xos dunyoqarashi va idrok tizimining yo''qolishidir.', 21),
  ('mock_n1_s1_522', 'mock', NULL, 'N1', 'listening', 1, 'カーボンニュートラルの実現に不可欠な二つの要素は何ですか？', '["原子力発電の増設と海外からの電力輸入","産業構造の脱炭素化と消費者のライフスタイルの変革","化石燃料の価格引き上げと自動車の利用禁止","先端技術の輸出制限と自然保護区の拡大"]'::jsonb, 1, 'Ekspert sanoat tuzilmasini dekarbonizatsiya qilish hamda iste''molchilar turmush tarzini tubdan o''zgartirishni zaruriy deb ta''kidlaydi.', 22),
  ('mock_n1_s1_523', 'mock', NULL, 'N1', 'listening', 1, '社長が打ち出した新規事業の基本方針はどれですか？', '["既存事業の改善のみに専念し、リスクを徹底的に回避する","不確実性を恐れず、革新的なフロンティア領域に資源を集中投下する","全事業から撤退し、他社との合併を目指す","人件費を大幅に削減し、現状の利益を維持する"]'::jsonb, 1, 'Prezident noaniqlikdan cho''chimay, yangi innovatsion sohalarga resurslarni jamlashni taklif qilmoqda.', 23),
  ('mock_n1_s1_524', 'mock', NULL, 'N1', 'listening', 1, '今回の特別展の最も大きな特徴は何ですか？', '["作品を制作年代順に機械的に配列したこと","「光の陰影の変遷」というテーマを軸に空間を再構成したこと","画家の遺品や手紙のみを展示の中心としたこと","入場料を無料にして鑑賞者を増やしたこと"]'::jsonb, 1, 'Ko''rgazmaning asosiy o''ziga xosligi ''yorug''lik va soyaning o''zgarishi'' mavzusi atrofida qayta tashkil etilganligidir.', 24),
  ('mock_n1_s1_525', 'mock', NULL, 'N1', 'listening', 1, 'これからの教育で最も求められている力は何だと述べられていますか？', '["既知の問題に迅速に正解を出す暗記力","自ら課題を発見し共創を促す「問いを立てる力」","計算ソフトを使いこなすプログラミング技能","試験で高得点を取るためのテクニック"]'::jsonb, 1, 'Kelajak ta''limida muammoni mustaqil topish va yangi savollarni o''rtaga tashlash qobiliyati (問いを立てる力) talab etiladi.', 25),
  ('mock_n1_s2_526', 'mock', NULL, 'N1', 'knowledge', 2, '彼の 学問に対する 情熱は、生涯を 通じて 衰えることを（　）。', '["知らなかった","言わなかった","見なかった","聞かなかった"]'::jsonb, 0, '''otoroeru koto o shiranakatta'' (aslo so''nishni bilmadi, tinimsiz kuchaydi) adabiy turg''un iborasidir.', 26),
  ('mock_n1_s2_527', 'mock', NULL, 'N1', 'knowledge', 2, 'どれほど 科学技術が 発展しようと（　）、死の 恐怖を 完全に 克服することは できない。', '["が","とも","なら","から"]'::jsonb, 1, '''Verb-(y)ou to / to mo'' (qanchalik ... qilingan taqdirda ham) degan N1 shart-inkor vositasi: dore hodo hatten shiyou tomo.', 27),
  ('mock_n1_s2_528', 'mock', NULL, 'N1', 'knowledge', 2, '次の 下線部の 言葉の 読み方として 最も よいものを 選びなさい。
「両国は 長年の 確執を 解消すべく <u>妥協</u>点を探った。」', '["だきょう","たいきょう","だぎょう","たいぎょう"]'::jsonb, 0, '妥協 iyeroglifining to''g''ri o''qilishi — だきょう (Dakyou - murosa, konsensus).', 28),
  ('mock_n1_s2_529', 'mock', NULL, 'N1', 'knowledge', 2, '次の 下線部の 言葉の 漢字として 最も よいものを 選びなさい。
「相手の 弱点を <u>こうみょう</u>に ついた 戦術だ。」', '["巧妙","功妙","巧名","高妙"]'::jsonb, 0, '''Koumyou'' (ustamonlik bilan, epchil, ayyorona) so''zining to''g''ri kanjisi — 巧妙.', 29),
  ('mock_n1_s2_530', 'mock', NULL, 'N1', 'knowledge', 2, '彼の 傲慢な 態度は、周囲の 反感を 買わずには（　）。', '["おかない","やまない","すまない","たえない"]'::jsonb, 0, '''~zu ni wa okanai'' (muqarrar ravishda ...ga olib keladi, sababchi bo''lmay qo''ymaydi) kuchli oqibatni bildiradi.', 30),
  ('mock_n1_s2_531', 'mock', NULL, 'N1', 'knowledge', 2, '未曾有の 経済危機に 直面し、政府は 緊急対策を 余儀なく（　）。', '["された","した","させた","ならなかった"]'::jsonb, 0, '''~o yogi naku sareta'' (chora yo''qligidan majburan ... qilishga to''g''ri keldi) passiv konstruksiyasidir.', 31),
  ('mock_n1_s2_532', 'mock', NULL, 'N1', 'knowledge', 2, '長年 培った 職人の 熟練技は、機械（　）再現できるものではない。', '["とて","たりとも","とばかりに","ごとく"]'::jsonb, 0, '''Noun + tote'' (hatto ... bo''lgan taqdirda ham / hatto zamonaviy mashinalar ham) degan N1 chegaralash vositasi.', 32),
  ('mock_n1_s2_533', 'mock', NULL, 'N1', 'knowledge', 2, '被災地の 一日も 早い 復興を 心から 祈って（　）。', '["やまない","たえない","おかない","すまない"]'::jsonb, 0, '''inotte yamanai'' (yurakdan tinimsiz duo qilmoq / tilamoq) iborasi his-tuyg''uning bardavomligini bildiradi.', 33),
  ('mock_n1_s2_534', 'mock', NULL, 'N1', 'knowledge', 2, '次の 下線部の 言葉の 意味として 最も 近いものを 選びなさい。
「彼の 意見には <u>一理</u>ある。」', '["道理にかなった部分がある","全く根拠がない","専門的な理論である","非常識である"]'::jsonb, 0, '一理ある (ichiri aru) — unda ham o''ziga yarasha haqiqat yoki to''g''ri mantiq (道理にかなった部分) borligini anglatadi.', 34),
  ('mock_n1_s2_535', 'mock', NULL, 'N1', 'knowledge', 2, 'いかに 困難が あろうと、最後まで 初志を 貫徹する（　）だ。', '["のみ","きらい","まじき","ずくめ"]'::jsonb, 0, '''~suru nomi da'' (faqat va faqat ... qilmoq qoladi xolos) qat''iy qaror va ahdni bildiradi.', 35),
  ('mock_n1_s2_536', 'mock', NULL, 'N1', 'knowledge', 2, '親の 財産を（　）に 放蕩の 限りを 尽くすなど、言語道断だ。', '["いいこと","かぎり","ばかり","もの"]'::jsonb, 0, '''~o ii koto ni'' (vaziyat yoki imkoniyatdan yomon maqsadda, suiiste''mol qilib foydalanish) ma''nosini bildiradi.', 36),
  ('mock_n1_s2_537', 'mock', NULL, 'N1', 'knowledge', 2, '真相が 明らかに なるに（　）、世論の 怒りは ますます 高まった。', '["つれて","おいて","沿って","反して"]'::jsonb, 0, '''~ni tsurete'' (hodisaning rivojlanishi bilan bir qatorda) o''zgarishni ko''rsatadi.', 37),
  ('mock_n1_s2_538', 'mock', NULL, 'N1', 'knowledge', 2, '日頃の 地道な 鍛錬が あって（　）の 栄冠である。', '["こそ","さえ","すら","だに"]'::jsonb, 0, '''~atte koso no (Noun)'' (aynan tinimsiz mashaqqatli mehnat tufayligina qo''lga kiritilgan g''alaba) ta''kid shaklidir.', 38),
  ('mock_n1_s2_539', 'mock', NULL, 'N1', 'reading', 2, '筆者が考える「真の多文化共生」に必要な姿勢とは何ですか？', '["自国の伝統文化のみを他民族に徹底して学習させること","自己の価値観を絶対化せず、対話を通じて相互変容を受け入れること","外国人の居住区を隔離し、摩擦を物理的に防ぐこと","すべての言語を英語に統一し、効率的な社会を作ること"]'::jsonb, 1, 'Muallif o''z qadriyatlarini yagona haqiqat deb bilmasdan, o''zaro muloqot orqali bir-birini tushunish va o''zgarishga tayyor bo''lishni aytadi.', 39),
  ('mock_n1_s2_540', 'mock', NULL, 'N1', 'reading', 2, '筆者が述べる「真の知性」とはどのようなものですか？', '["すべての自然現象をデータで完全に解明したと確信すること","自らの知識を過信せず、未知の深淵に対して謙虚な畏怖の念を抱くこと","科学以外の迷信や伝統をすべて否定し排除すること","誰よりも多くの専門用語や公式を記憶していること"]'::jsonb, 1, 'Haqiqiy aql-idrok o''z bilganlariga bino qo''ymasdan, noma''lum olam oldida kamtarlik va hayrat tuyg''usini saqlashdadir.', 40),
  ('mock_n1_s2_541', 'mock', NULL, 'N1', 'reading', 2, '筆者によれば、芸術鑑賞の本質とは何ですか？', '["作者の伝記的事実を調べ、作者の意図のみを忠実に復元すること","鑑賞者の経験と作品が響き合い、新たな意味を共創する能動的行為","美術評論家の解説をそのまま暗記して作品の値段を当てること","作品の技法や構図の優劣を客観的な数値で採点すること"]'::jsonb, 1, 'San''at asarini tomosha qilish — insonning o''z hayotiy tajribasi bilan asar o''rtasida yangi ma''no yaratuvchi ijodiy jarayondir.', 41),
  ('mock_n1_s2_542', 'mock', NULL, 'N1', 'reading', 2, '都市計画に関して筆者が強く主張していることはどれですか？', '["古い建物をすべて取り壊し、超高層ビルを建設すべきだ","歴史的建造物を保存し、利便性と歴史性の調和を図るべきだ","自動車の通行を完全に禁止し、江戸時代の町並みをそのまま復元すべきだ","都市の景観は経済的利益のみを最優先に決定されるべきだ"]'::jsonb, 1, 'Shahar taraqqiyotida faqat zamonaviylik ortidan quvmay, tarixiy meros va qulaylik uyg''unligini (調和) saqlash lozim.', 42),
  ('mock_n1_s2_543', 'mock', NULL, 'N1', 'reading', 2, 'イノベーションを生み出す組織に必要な条件として、筆者は何を挙げていますか？', '["失敗した者を厳しく処罰し、ミスを根絶する規律","失敗を貴重な学びとして受け入れる「心理的安全性」","失敗の可能性がゼロである確実なプロジェクトのみを行うこと","外部のコンサルタントに全ての新規事業を一任すること"]'::jsonb, 1, 'Yangi yangiliklar yaratish uchun xatolardan qo''rqmaydigan ruhiy xavfsizlik muhiti (心理的安全性) zarur.', 43),
  ('mock_n1_s2_544', 'mock', NULL, 'N1', 'reading', 2, '筆者が説く「真の幸福」の源泉とは何ですか？', '["他人よりも多くの高級ブランド品を所有すること","他者との絆、自己の成長、社会への貢献という経験と関係性","仕事を辞めて一人で孤立した生活を送ること","将来の不安を解消するために資産を蓄積し続けること"]'::jsonb, 1, 'Muallif baxt boyliklar sonida emas, balki samimiy munosabatlar, shaxsiy o''sish va jamiyatga xizmat qilishda ekanligini ta''kidlaydi.', 44),
  ('mock_n1_s2_545', 'mock', NULL, 'N1', 'listening', 2, '研究者が最も早急に取り組むべきだと主張しているのは何ですか？', '["生分解性プラスチックの国内生産のみを増やすこと","途上国へのインフラ支援と使い捨てプラ削減の国際条約締結","すべてのプラスチック製品の製造を即座に全面禁止すること","海洋ゴミの回収作業をボランティアだけに頼ること"]'::jsonb, 1, 'Tadqiqotchi rivojlanayotgan davlatlarga infratuzilma yordami berish va bir martalik plastmassani qisqartirish xalqaro shartnomasini zarur deb biladi.', 45),
  ('mock_n1_s2_546', 'mock', NULL, 'N1', 'listening', 2, '歴史的事件を正当に評価するために不可欠な方法は何ですか？', '["勝者の公式記録のみを絶対の事実として採用すること","敗者や庶民の手記など多角的な史料を突き合わせて検証すること","古い記録は信用せず、現代の価値観のみで解釈すること","教科書の記述をそのまま鵜呑みにすること"]'::jsonb, 1, 'Tarixiy hodisani xolis baholash uchun faqat g''oliblarning emas, mag''lublar va oddiy xalq yozuvlarini ham har tomonlama solishtirish zarur.', 46),
  ('mock_n1_s2_547', 'mock', NULL, 'N1', 'listening', 2, '今四半期において最優先される方針は何ですか？', '["新機能のリリースを予定より前倒しして実施すること","新機能開発を凍結し、システムの安定性とセキュリティ対策を徹底すること","開発チームの人員を半減させてコストを削減すること","セキュリティ対策は後回しにして売上拡大を狙うこと"]'::jsonb, 1, 'Menejer yangi funksiyalarni to''xtatib, tizim barqarorligi va xavfsizlik zaifliklarini bartaraf etishni birinchi o''ringa qo''ydi.', 47),
  ('mock_n1_s2_548', 'mock', NULL, 'N1', 'listening', 2, '地方都市の再生に向けて提唱されている施策は何ですか？', '["郊外に巨大なショッピングモールを乱立させること","都市機能を中心部に集約するコンパクトシティ化と公共交通網の再編","すべての公共施設を民間に売却して撤退すること","若者の移住のみを強制し、高齢者福祉を削減すること"]'::jsonb, 1, 'Shahar markazida xizmatlarni jamlash (kompakt shahar) va jamoat transportini qayta yo''lga qo''yish zaruriyati aytildi.', 48),
  ('mock_n1_s2_549', 'mock', NULL, 'N1', 'listening', 2, '脳科学者が睡眠に関して強調しているポイントは何ですか？', '["睡眠時間は極力削って仕事に充てるべきである","十分な睡眠は脳の老廃物を排出し健康を維持する必須の投資である","睡眠薬を常用して短時間で深い眠りを取れば問題ない","高齢者は睡眠を全くとる必要がない"]'::jsonb, 1, 'Yetarli uyqu miyadagi chiqindilarni tozalab, kognitiv salomatlikni saqlovchi zaruriy omil ekanligi ta''kidlandi.', 49),
  ('mock_n1_s2_550', 'mock', NULL, 'N1', 'listening', 2, '日本伝統建築の耐震性の本質として説明されているものはどれですか？', '["鉄筋コンクリートで揺れを力ずくで押さえつける剛構造","接合部がしなやかに揺れを逃しエネルギーを分散する柔構造の知恵","地下深くまで太い金属杭を打ち込む基礎工事","地震の起きない地域のみを選んで建築すること"]'::jsonb, 1, 'Yapon an''anaviy me''morchiligida zilzila kuchini qattiq ushlab turish emas, balki bo''g''inlarning egiluvchan harakati orqali kuchni tarqatish (柔構造 - egiluvchan struktura) uslubi qo''llaniladi.', 50),
  ('mock_n1_s3_551', 'mock', NULL, 'N1', 'knowledge', 3, '長年[ながねん]の 宿願[しゅくがん]が ようやく 達成[たっせい]され、（感慨[かんがい]無量[むりょう]）である。', '["かんがいむりょう","かんげきむりょう","かんしょうむりょう","かんしんむりょう"]'::jsonb, 0, 'Cheksiz taassurot va yuksak his-tuyg''ular og''ushida: 感慨無量 (かんがいむりょう).', 51),
  ('mock_n1_s3_552', 'mock', NULL, 'N1', 'knowledge', 3, '法案[ほうあん]の 成立[せいりつ]に 向け、野党[やとう]との 妥協点[だきょうてん]を（模索[もさく]）する。', '["ぼさく","もさく","めいさく","ばくさく"]'::jsonb, 1, '«Paypaslab to''g''ri yo''l qidirmoq»: 模索 (もさく).', 52),
  ('mock_n1_s3_553', 'mock', NULL, 'N1', 'knowledge', 3, 'あの 政治家[せいじか]の 発言[はつげん]は、無責任[むせきにん]（極[きわ]まりない）。', '["かぎりない","たえない","きわまりない","やまない"]'::jsonb, 2, 'Had-hududsiz salbiy ma''noda: 〜極まりない (nihoyatda mas''uliyatsiz).', 53),
  ('mock_n1_s3_554', 'mock', NULL, 'N1', 'knowledge', 3, '一国[いっこく]の 首相[しゅしょう]（たるもの）、国家[こっか]の 将来[しょうらい]に 責任[せきにん]を 持[も]つべきだ。', '["ともあろうもの","としたところで","ならではの","たるもの"]'::jsonb, 3, '«...dek yuqori maqomdagi shaxsga loyiq ravishda»: 〜たるもの.', 54),
  ('mock_n1_s3_555', 'mock', NULL, 'N1', 'knowledge', 3, '天候[てんこう]の 急変[きゅうへん]に より、登山[とざん]ルートの 変更[へんこう]を（余儀[よぎ]なくされた）。', '["よぎなくされた","やむをえなくなった","よぎなくさせた","しぜんとなった"]'::jsonb, 0, 'Tashqi favqulodda omillar sababli noiloj majbur qolmoq: 〜を余儀なくされた.', 55),
  ('mock_n1_s3_556', 'mock', NULL, 'N1', 'knowledge', 3, 'たとえ 誰[だれ]で（あれ）、法[ほう]の 前[まえ]には 平等[びょうどう]で なければ ならない。', '["あれども","あれ","あろうとも","ありながら"]'::jsonb, 1, '«Kim bo''lishidan qat''i nazar»: 〜であれ.', 56),
  ('mock_n1_s3_557', 'mock', NULL, 'N1', 'knowledge', 3, '伝統[でんとう]の 技[わざ]と 最新[さいしん]の テクノロジーが（相[あい]まって）、比類[ひるい]なき 名品[めいひん]が 生[う]まれた。', '["かさなって","ひきかえて","あいまって","かこつけて"]'::jsonb, 2, 'Ikki buyuk kuch birlashib yanada kuchayishi: 〜と相まって (qo''shilib, uyg''unlashib).', 57),
  ('mock_n1_s3_558', 'mock', NULL, 'N1', 'knowledge', 3, '彼女[かのじょ]は ピアノは（おろか）、バイオリンの 演奏[えんそう]に かけても 一流[いちりゅう]だ。', '["さることながら","ばかりか","どころか","おろか"]'::jsonb, 3, '«U yoqda tursin, hatto...»: 〜はおろか.', 58),
  ('mock_n1_s3_559', 'mock', NULL, 'N1', 'knowledge', 3, '今日[きょう]の 出来事[できごと]は、私[わたし]の 生涯[しょうがい]において 忘[わす]れる（まじき） 屈辱[くつじょく]である。', '["まじき","べからざる","べからず","まじきこと"]'::jsonb, 0, '«Aslo sodir bo''lmasligi lozim bo''lgan»: 〜まじき.', 59),
  ('mock_n1_s3_560', 'mock', NULL, 'N1', 'knowledge', 3, '会社[かいしゃ]の 資金[しきん]を 私的[してき]に 流用[りゅうよう]するなど、言語[ごんご]（道断[どうだん]）だ。', '["とうだん","どうだん","さいだん","みちだん"]'::jsonb, 1, 'Kechirib bo''lmas, so''z bilan ta''riflash mushkul yovuz qilmish: 言語道断 (ごんごどうだん).', 60)
ON CONFLICT (id) DO UPDATE SET quiz_type = EXCLUDED.quiz_type, lesson_id = EXCLUDED.lesson_id, level = EXCLUDED.level, section = EXCLUDED.section, set_no = EXCLUDED.set_no, question = EXCLUDED.question, options = EXCLUDED.options, correct_index = EXCLUDED.correct_index, explanation = EXCLUDED.explanation, sort_order = EXCLUDED.sort_order;
INSERT INTO public.mobile_quiz_questions (id, quiz_type, lesson_id, level, section, set_no, question, options, correct_index, explanation, sort_order) VALUES
  ('mock_n1_s3_561', 'mock', NULL, 'N1', 'knowledge', 3, '彼[かれ]の 論文[ろんぶん]は 既存[きぞん]の 定説[ていせつ]を 根底[こんてい]から 覆[くつがえ]す（画期的[かっきてき]）な ものだ。', '["かくきてき","がきてき","かっきてき","えつきてき"]'::jsonb, 2, '«Tarixiy burilish yasovchi davriy yangilik»: 画期的 (かっきてき).', 61),
  ('mock_n1_s3_562', 'mock', NULL, 'N1', 'knowledge', 3, '新体制[しんたいせい]の 発足[ほっそく]を（皮切[かわき]りに）、全社的[ぜんしゃてき]な 改革[かいかく]が 断行[だんこう]された。', '["かぎりに","おわりに","しめくくりに","かわきりに"]'::jsonb, 3, 'Ketma-ket yirik voqealarning birinchi debochasi: 〜を皮切りに (boshlab berib).', 62),
  ('mock_n1_s3_563', 'mock', NULL, 'N1', 'knowledge', 3, '我々[われわれ]の 懸念[けねん]は （杞憂[きゆう]）に 終[お]わった。', '["取り越し苦労","的確な予想","重大な危機","正当な判断"]'::jsonb, 0, '«杞憂» (qadimiy rivoyatdan kelib chiqqan) — keraksiz, asossiz vahima va havotir = 取り越し苦労.', 63),
  ('mock_n1_s3_564', 'mock', NULL, 'N1', 'reading', 3, '筆者[ひっしゃ]の 述[の]べる「現代[げんだい]社会[しゃかい]の 疎外感[そがいかん]」の 根源[こんげん]は 何[なに]にあるとされていますか。', '["単純に物質的な富が不足していること","効率[こうりつ]と 合理主義[ごうりしゅぎ]の 徹底[てってい]に より、人間[にんげん]が 生[い]きる 意味[いみ]や 全体性[ぜんたいせい]から 切[き]り離[はな]された 点","科学技術の発展が完全に停止してしまったこと","人々が過度に宗教的になりすぎたこと"]'::jsonb, 1, 'Samaradorlik va ratsionalizm natijasida inson butunlikdan va tiriklik mohiyatidan uzilib qolgani.', 64),
  ('mock_n1_s3_565', 'mock', NULL, 'N1', 'reading', 3, '芸術[げいじゅつ]の 本質[ほんしつ]について、筆者[ひっしゃ]は どのような 見解[けんかい]を 示[しめ]して いますか。', '["権力者のプロパガンダとして奉仕すること","鑑賞者を退屈させずに眠らせるための娯楽","現実[げんじつ]を 単[たん]に 模倣[もほう]するのではなく、日常[にちじょう]の 枠組[わくぐ]みを 揺[ゆ]るがし 新[あたら]しい 感受性[かんじゅせい]を 開眼[かいげん]させる 営[いとな]みである","過去の古典作品を寸分違わず再現する職人芸"]'::jsonb, 2, 'San''at oddiy taqlid emas, balki odatiy qarashlarni larzaga solib yangi idrok ufqlari ochishdir.', 65),
  ('mock_n1_s3_566', 'mock', NULL, 'N1', 'reading', 3, '言語[げんご]と 思考[しこう]の 相関[そうかん]関係[かんけい]に 関[かん]する 記述[きじゅつ]として 最[もっと]も 適切[てきせつ]なものは どれですか。', '["人間は言語がなくても全く同じ深さで論理的思考を行える","すべての言語は本質的に同一であり文化的差異は存在しない","言語は思考の結果として生じる副産物にすぎない","言語[げんご]は 単[たん]なる 伝達[でんたつ]の 道具[どうぐ]ではなく、人間[にんげん]が 世界[せかい]を 分節[ぶんせつ]し 認識[にんしき]する 構造[こうぞう]そのものを 規定[きてい]して いる"]'::jsonb, 3, 'Til shunchaki muloqot vositasi emas, inson ongining borliqni tushunish tizimini belgilaydi.', 66),
  ('mock_n1_s3_567', 'mock', NULL, 'N1', 'reading', 3, 'グローバリズムが 地域[ちいき]文化[ぶんか]に 与[あた]える 功罪[こうざい]について 筆者[ひっしゃ]はどう 論[ろん]じて いますか。', '["画一的[かくいつてき]な 消費[しょうひ]文化[ぶんか]が 固有[こゆう]の 多様性[たようせい]を 侵食[しんしょく]する 一方[いっぽう]で、伝統[でんとう]の 価値[かち]を 再評価[さいひょうか]する 契機[けいき]にも なりうる","地域文化はグローバル化によって完全に抹殺される運命にある","グローバル化によって世界中のすべての文化が完全に均質化された","地域文化は孤立を保ち、外来文化を一切排除すべきである"]'::jsonb, 0, 'Globallashuv bir xillashtiruvchi iste''mol madaniyatini yoysa-da, milliy merosni qayta anglash imkonini ham beradi.', 67),
  ('mock_n1_s3_568', 'mock', NULL, 'N1', 'reading', 3, 'AIの 判断[はんだん]と 人間[にんげん]の 意思[いし]決定[けってい]の 差異[さい]について、筆者[ひっしゃ]が 強調[きょうちょう]する 点[てん]は 何[なに]ですか。', '["AIの判断には一切の誤りがなく人間よりも常に倫理的である","AIは 確率[かくりつ]計算[けいさん]に 基[づ]く 最適解[さいてきかい]を 出[だ]すが、結果[けっか]に 対[たい]する 倫理的[りんりてき]な 責任[せきにん]を 引[ひ]き受[う]けられるのは 人間[にんげん]だけである","人間は感情に左右されるため、すべての司法判断をAIに代行させるべきだ","AIと人間の意思決定プロセスには本質的な差異は全く存在しない"]'::jsonb, 1, 'AI ehtimolliklar asosida optimal javob topsa-da, yuzaga keladigan natija uchun mas''uliyatni faqat inson oladi.', 68),
  ('mock_n1_s3_569', 'mock', NULL, 'N1', 'reading', 3, '「歴史[れきし]の 叙述[じょじゅつ]」に ついて 筆者[ひっしゃ]が 警鐘[けいしょう]を 鳴[な]らして いる 内容[ないよう]は どれですか。', '["歴史教科書に書かれている記述はすべて疑いの余地のない絶対的真実である","過去の出来事は現在の基準だけで断罪すれば十分である","歴史[れきし]は 勝者[しょうしゃ]の 視点[してん]から 都合[つごう]よく 体系化[たいけいか]されがちであり、埋[う]もれた 敗者[はいしゃ]や 名[な]もなき 人々[ひとびと]の 声[こえ]を 掬[すく]い取[と]る 複眼[ふくがん]的[てき]な 読解[どっかい]が 欠[か]かせない","記録に残っていない民衆の歴史は研究する価値が全くない"]'::jsonb, 2, 'Tarix ko''pincha g''oliblar manfaati bo''yicha tizimlashtirilgani bois, mag''lublar va xalq xotirasini ham o''rganish zarur.', 69),
  ('mock_n1_s3_570', 'mock', NULL, 'N1', 'listening', 3, 'シンポジウムにおいて、登壇者[とうだんしゃ]が 指摘[してき]する デジタル民主主義[みんしゅしゅぎ]の 構造的[こうぞうてき]な 脆弱性[ぜいじゃくせい]とは 何[なに]ですか。', '["インターネットの通信速度が遅すぎて投票が遅延する点","政治家のSNSアカウントがハッキングされる危険性","若者の投票率が異常に高くなりすぎること","アルゴリズムによる 情報[じょうほう]の 偏向[へんこう]（エコーチェンバー）が 社会[しゃかい]の 分断[ぶんだん]と ポピュリズムを 加速[かそく]させる 点"]'::jsonb, 3, 'Algoritmlar keltirib chiqaradigan axborot pufagi (echo chamber) jamiyatning qutblanishi va bo''linishini tezlashtiradi.', 70),
  ('mock_n1_s3_571', 'mock', NULL, 'N1', 'listening', 3, '文化[ぶんか]人類学者[じんるいがくしゃ]が 述[の]べる「贈与[ぞうよ]の 逆説[ぎゃくせつ]」とは どのような 内容[ないよう]ですか。', '["純粋[じゅんすい]な 無償[むしょう]の 贈与[ぞうよ]に 見[み]えても、受[う]け手[て]に 返礼[へんれい]の 義務[ぎむ]や 負債感[ふさいかん]を 生[う]じさせ、非対称[ひたいしょう]な 権力[けんりょく]関係[かんけい]を 構築[こうちく]する 点","贈り物は常に金額が高ければ高いほど人間関係が円滑になる点","プレゼントを貰ったら即座に同じものを買い与えなければ法的に罰せられる点","原始社会において物品の交換は一切行われていなかった点"]'::jsonb, 0, 'Beg''araz sovg''adek ko''rinsa-da, qabul qiluvchida qaytarish majburiyatini va qaramlik hissini paydo qiladi.', 71),
  ('mock_n1_s3_572', 'mock', NULL, 'N1', 'listening', 3, '経済学者[けいざいがくしゃ]が 提言[ていげん]する「循環型[じゅんかんがた] 経済[けいざい]（サーキュラー・エコノミー）」の 核心[かくしん]は 何[なに]ですか。', '["壊れた製品はすべて発展途上国へ輸出して処理すること","製品[せいひん]の 企画[きかく]・設計[せっけい] 段階[だんかい]から 廃棄物[はいきぶつ]を 出[だ]さない ループを 組[く]み込[こ]み、資源[しげん]の 価値[かち]を 最大限[さいだいげん]に 維持[いじ]し 続[つづ]けること","消費者が買い物を一切やめて自給自足の原始生活を送ること","リサイクルマークを印刷するだけで実際は焼却処分を続けること"]'::jsonb, 1, 'Mahsulotni yaratish va loyihalash bosqichidanoq chiqindi chiqarmaydigan to''liq aylanma tizimni joriy etish.', 72),
  ('mock_n1_s3_573', 'mock', NULL, 'N1', 'listening', 3, '言語[げんご]哲学者[てつがくしゃ]の 講義[こうぎ]に おいて、メタファー（隠喩[いんゆ]）の 認知的[にんちてき] 機能[きのう]として 説明[せつめい]されたものは どれですか。', '["単に詩人や文学者が文章を華やかに飾るための修辞的テクニックにすぎないこと","日常会話においては誤解を招くだけなので絶対に使用してはならない言葉遣いであること","未知[みち]の 抽象的[ちゅうしょうてき]な 概念[がいねん]を、身体的[しんたいてき]で 具体的[ぐたいてき]な 経験[けいけん]に 投射[とうしゃ]して 理解[りかい]を 可能[かのう]に する 基盤[きばん]的[てき]な 思考[しこう]の 枠組[わくぐ]みであること","辞書に載っていない造語を勝手に作り出して相手を混乱させる行為であること"]'::jsonb, 2, 'Metafora nafaqat badiiy vosita, balki murakkab mavhum tushunchalarni tana va tajriba orqali idrok etish tizimidir.', 73),
  ('mock_n1_s3_574', 'mock', NULL, 'N1', 'listening', 3, '都市[とし]計画[けいかく]の 専門家[せんもんか]が 主張[しゅちょう]する「15分[じゅうごふん] 都市[とし]（15-Minute City）」の 狙[ねら]いは 何[なに]ですか。', '["すべての住民を毎日15分間強制的に全力疾走させる健康政策","自動車の所有を法律で完全に死刑にすること","都市の中心部を富裕層だけの居住区に限定すること","居住[きょじゅう]、労働[ろうどう]、医療[いりょう]、商業[しょうぎょう]などの 必須[ひっす] 機能[きのう]を 徒歩[とほ]や 自転車[じてんしゃ]で 15分[じゅうごふん]圏内[けんない]に 集約[しゅうやく]し、生活[せいかつ]の 質[しつ]と 脱炭素[だつたんそ]を 両立[りょうりつ]させること"]'::jsonb, 3, 'Uy, ishxona, poliklinika va do''konlarni piyoda yoki velosipedda 15 daqiqalik masofada jamlash orqali sifatli hayot yaratish.', 74),
  ('mock_n1_s3_575', 'mock', NULL, 'N1', 'listening', 3, '認知[にんち]心理学者[しんりがくしゃ]が 警鐘[けいしょう]を 鳴[な]らす「マルチタスクの 幻想[げんそう]」の 本質[ほんしつ]は 何[なに]ですか。', '["脳[のう]は 複数[ふくすう]の 認知的[にんちてき] 課題[かだい]を 同時[どうじ]に 並行[へいこう]処理[しょり]しているのではなく、急速[きゅうそく]に 注意[ちゅうい]を 切[き]り替[か]えているにすぎず、結果[けっか]として 集中力[しゅうちゅうりょく]と 処理[しょり]能力[のうりょく]が 著[いちじる]しく 低下[ていか]する 点","脳は訓練すれば同時に5つ以上の複雑な仕事を完璧に遂行できる点","マルチタスクを行えば睡眠時間を半分に減らしても健康でいられる点","音楽を聴きながら仕事をすると記憶力が自動的に10倍に跳ね上がる点"]'::jsonb, 0, 'Miya bir vaqtda ikkita ishni qilmaydi, balki tez-tez diqqatni almashtirishi sababli aqliy quvvat keskin pasayadi.', 75)
ON CONFLICT (id) DO UPDATE SET quiz_type = EXCLUDED.quiz_type, lesson_id = EXCLUDED.lesson_id, level = EXCLUDED.level, section = EXCLUDED.section, set_no = EXCLUDED.set_no, question = EXCLUDED.question, options = EXCLUDED.options, correct_index = EXCLUDED.correct_index, explanation = EXCLUDED.explanation, sort_order = EXCLUDED.sort_order;
-- mobile_quiz_questions: 375 rows
