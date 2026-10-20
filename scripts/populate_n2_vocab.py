import json
import os

N2_DATA = {
    "vocab_n2_add_2": {
        "word": "アイデア/アイディア",
        "meaningUz": "G'oya, fikr",
        "ja": "新しい企画の素晴らしいアイデアを提案した。",
        "romaji": "Atarashii kikaku no subarashii aidea o teian shita.",
        "uz": "Yangi loyiha uchun ajoyib g'oya taklif qildi."
    },
    "vocab_n2_add_4": {
        "word": "あかんぼう",
        "meaningUz": "Chaqaloq, go'dak",
        "ja": "あかんぼうがベッドで気持ちよさそうに眠っている。",
        "romaji": "Akanbou ga beddo de kimochiyosasou ni nemutte iru.",
        "uz": "Chaqaloq karavotda orom olib uxlayapti."
    },
    "vocab_n2_add_8": {
        "word": "あげる (=やる)",
        "meaningUz": "Bermoq (kichiklarga yoki hayvonlarga)",
        "ja": "毎朝庭に来る小鳥たちに餌をあげる。",
        "romaji": "Maiasa niwa ni kuru kotori-tachi ni esa o ageru.",
        "uz": "Har tong hovliga keladigan qushchalarga yem beraman."
    },
    "vocab_n2_add_9": {
        "word": "あたりまえ",
        "meaningUz": "Tabiiy, o'z-o'zidan ma'lum narsa",
        "ja": "困っている仲間を助けるのはあたりまえのことだ。",
        "romaji": "Komatte iru nakama o tasukeru no wa atarimae no koto da.",
        "uz": "Qiyin ahvolda qolgan safdoshga yordam berish tabiiy holdir."
    },
    "vocab_n2_add_11": {
        "word": "あてはまる",
        "meaningUz": "Mos tushmoq, to'g'ri kelmoq",
        "ja": "この規則はすべての状況にあてはまるわけではない。",
        "romaji": "Kono kisoku wa subete no joukyou ni atehamaru wake dewa nai.",
        "uz": "Bu qoida hamma vaziyatlarga ham to'g'ri kelavermaydi."
    },
    "vocab_n2_add_12": {
        "word": "あてはめる",
        "meaningUz": "Moslashtirmoq, qo'llamoq",
        "ja": "理論を実際のビジネスモデルにあてはめて分析する。",
        "romaji": "Riron o jissai no bijinesu moderu ni atehamete bunseki suru.",
        "uz": "Nazariyani amaliy biznes modeliga tadbiq etib tahlil qilmoq."
    },
    "vocab_n2_add_13": {
        "word": "あぶる",
        "meaningUz": "Olovda toblamoq, qizdirmoq",
        "ja": "軽く火であぶった魚は香ばしくて美味しい。",
        "romaji": "Karuku hi de abutta sakana wa koubashikute oishii.",
        "uz": "Olovda yengil toblangan baliq xushbo'y va mazali bo'ladi."
    },
    "vocab_n2_add_15": {
        "word": "あらすじ",
        "meaningUz": "Qisqacha mazmun, syujet",
        "ja": "映画を見る前に公式サイトであらすじを確認した。",
        "romaji": "Eiga o miru mae ni koushiki saito de arasuji o kakunin shita.",
        "uz": "Filmni ko'rishdan oldin rasmiy saytdan uning qisqacha mazmunini ko'rib chiqdim."
    },
    "vocab_n2_add_16": {
        "word": "あれこれ",
        "meaningUz": "Uni-buni, u yoki bu narsa",
        "ja": "あれこれ迷っているうちに時間が過ぎてしまった。",
        "romaji": "Arekore mayotte iru uchi ni jikan ga sugite shimatta.",
        "uz": "Uni-buni tanlab ikkilanayotganimda vaqt o'tib ketdi."
    },
    "vocab_n2_add_17": {
        "word": "あわただしい",
        "meaningUz": "Shoshilinch, alg'ov-dalg'ov",
        "ja": "引っ越し当日は朝からあわただしい一日となった。",
        "romaji": "Hikkoshi toujitsu wa asa kara awatadashii ichinichi to natta.",
        "uz": "Ko'chish kuni ertalabdan shoshilinch va mashaqqatli bir kun bo'ldi."
    },
    "vocab_n2_add_18": {
        "word": "あわてる",
        "meaningUz": "Shoshib qolmoq, dovdiramoq",
        "ja": "非常ベルが鳴ってもあわてずに非常口へ向かってください。",
        "romaji": "Hijou beru ga nattemo awatezu ni hijouguchi e mukatte kudasai.",
        "uz": "Xavf qo'ng'irog'i chalinganda ham dovdiramasdan zaxira chiqish eshigiga boring."
    },
    "vocab_n2_add_21": {
        "word": "いつのまにか",
        "meaningUz": "Sezdirmasdan, bilintirmasdan",
        "ja": "読書に熱中していたらいつのまにか夜が明けていた。",
        "romaji": "Dokusho ni netchuu shite itara itsunomanika yo ga akete ita.",
        "uz": "Kitobga sho'ng'ib ketganimdan qachon tong otganini ham sezmay qolibman."
    },
    "vocab_n2_add_38": {
        "word": "おくさん",
        "meaningUz": "Turmush o'rtoq (hurmat shakli)",
        "ja": "山田さんの奥さんは大学で日本語を教えていらっしゃいます。",
        "romaji": "Yamada-san no okusan wa daigaku de nihongo o oshiete irasshaimasu.",
        "uz": "Yamada janoblarining rafiqasi universitetda yapon tilidan dars beradilar."
    },
    "vocab_n2_add_39": {
        "word": "おさきに",
        "meaningUz": "Oldin, sizdan avval",
        "ja": "本日の業務が終わりましたので、お先に失礼いたします。",
        "romaji": "Honjitsu no gyoumu ga owarimashita node, osaki ni shitsurei itashimasu.",
        "uz": "Bugungi vazifalarim tugagani bois, sizlardan oldin ruxsatingiz bilan ketyapman."
    },
    "vocab_n2_add_40": {
        "word": "おじゃまします",
        "meaningUz": "Bezovta qildim (uyga kirganda aytiladigan ibora)",
        "ja": "おじゃまします。突然の訪問にもかかわらず歓迎していただき感謝します。",
        "romaji": "Ojamashimasu. Totsuzen no houmon ni mo kakawarazu kangei shite itadaki kansha shimasu.",
        "uz": "Assalomu alaykum, bezovta qildim. To'satdan kelganimga qaramay yaxshi kutib olganingiz uchun rahmat."
    },
    "vocab_n2_add_42": {
        "word": "おだいじに",
        "meaningUz": "Tuzalib keting, o'zingizni ehtiyot qiling",
        "ja": "体調を崩されたと伺いました。どうぞお大事になさってください。",
        "romaji": "Taichou o kuzusareta to ukagaimashita. Douzo odaiji ni nasatte kudasai.",
        "uz": "Tobiangiz qochganini eshitdim. O'zingizni ehtiyot qiling, tezroq tuzalib keting."
    },
    "vocab_n2_add_43": {
        "word": "おどかす",
        "meaningUz": "Qo'rqitmoq, tahdid solmoq",
        "ja": "暗闇から急に飛び出して友達をおどかした。",
        "romaji": "Kurayami kara kyuu ni tobidashite tomodachi o odokashita.",
        "uz": "Qorong'ulikdan to'satdan chiqib kelib do'stimni qo'rqitdim."
    },
    "vocab_n2_add_45": {
        "word": "おととし",
        "meaningUz": "O'tgan yildan oldingi yil",
        "ja": "おととしの夏に初めて富士山に登りました。",
        "romaji": "Ototoshi no natsu ni hajimete fujisan ni noborimashita.",
        "uz": "O'tgan yildan oldingi yozda ilk bor Fuji tog'iga chiqqanman."
    },
    "vocab_n2_add_48": {
        "word": "おまたせしました",
        "meaningUz": "Kutdirib qo'yganim uchun uzr",
        "ja": "大変おまたせしました。ご注文の季節の定食でございます。",
        "romaji": "Taihen omatase shimashita. Gochuumon no kisetsu no teishoku de gozaimasu.",
        "uz": "Kutdirib qo'yganimiz uchun uzr. Siz buyurtma qilgan fasliy to'plam tayyor."
    },
    "vocab_n2_add_50": {
        "word": "おまちどおさま",
        "meaningUz": "Kutganingizga rahmat, marhamat",
        "ja": "おまちどおさまでした。淹れたての温かいコーヒーをどうぞ。",
        "romaji": "Omachidousama deshita. Iretate no atatakai koohii o douzo.",
        "uz": "Kutdirib qo'ydim, marhamat, yangi damlangan issiq kofe."
    },
    "vocab_n2_add_66": {
        "word": "かるた",
        "meaningUz": "Karuta (yapon karta o'yini)",
        "ja": "百人一首のかるた大会で優勝を目指して特訓している。",
        "romaji": "Hyakunin\'isshu no karuta taikai de yuushou o mezashite tokkun shite iru.",
        "uz": "Hyakunin Isshu karuta musobaqasida chempion bo'lish maqsadida qattiq shug'ullanyapti."
    },
    "vocab_n2_add_68": {
        "word": "かわいがる",
        "meaningUz": "Yaxshi ko'rmoq, erkalatmoq",
        "ja": "祖父は拾ってきた子猫を我が子のようにかわいがっている。",
        "romaji": "Sofu wa hirotte kita koneko o wagako no you ni kawaigatte iru.",
        "uz": "Bobom ko'chadan topib olgan mushukchani o'z bolasiday yaxshi ko'radi."
    },
    "vocab_n2_add_69": {
        "word": "きっかけ",
        "meaningUz": "Turtki, boshlanish sababi",
        "ja": "日本のアニメを観たことが、日本語を学ぶきっかけだった。",
        "romaji": "Nihon no anime o mita koto ga, nihongo o manabu kikkake datta.",
        "uz": "Yapon animelarini ko'rganim yapon tilini o'rganishimga sabab bo'lgan."
    },
    "vocab_n2_add_73": {
        "word": "くたびれる",
        "meaningUz": "Charchamoq, holdan toymoq",
        "ja": "山道を何時間も歩いて足がすっかりくたびれた。",
        "romaji": "Yamamichi o nanjikan mo aruite ashi ga sukkari kutabireta.",
        "uz": "Tog' yo'lida bir necha soatlab yurib oyoqlarim butunlay toliqdi."
    },
    "vocab_n2_add_74": {
        "word": "くっつける",
        "meaningUz": "Yopishtirmoq, ulamoq",
        "ja": "割れた陶器の破片を強力なボンドでしっかりくっつけた。",
        "romaji": "Wareta touki no hahen o kyouryoku na bondo de shikkari kuttsuketa.",
        "uz": "Singan sopol idish bo'laklarini kuchli yelim bilan mahkam yopishtirib qo'ydim."
    },
    "vocab_n2_add_76": {
        "word": "くるむ",
        "meaningUz": "O'ramoq, chulg'amoq",
        "ja": "生まれたばかりの赤ちゃんを柔らかな毛布でくるんだ。",
        "romaji": "Umareta bakari no akachan o yawaraka na moufu de kurunda.",
        "uz": "Yangi tug'ilgan chaqaloqni yumshoq adyolga o'rab qo'ydi."
    },
    "vocab_n2_add_78": {
        "word": "けれど/けれども",
        "meaningUz": "Biroq, lekin, ammo",
        "ja": "最新のスマートフォンは高価だけれど、性能は申し分ない。",
        "romaji": "Saishin no sumaatofon wa kouka da keredo, seinou wa moushibun nai.",
        "uz": "Eng so'nggi smartfon qimmat bo'lsa-da, imkoniyatlari a'lo darajada."
    },
    "vocab_n2_add_82": {
        "word": "こしらえる",
        "meaningUz": "Tayyorlamoq, yasamoq",
        "ja": "母が手作りの新鮮な野菜スープをこしらえてくれた。",
        "romaji": "Haha ga tezukuri no shinsen na yasai suupu o koshiraete kureta.",
        "uz": "Onam o'zlari yangi sabzavotlardan sho'rva tayyorlab berdilar."
    },
    "vocab_n2_add_88": {
        "word": "こぼれる",
        "meaningUz": "To'kilmoq, toshmoq",
        "ja": "コップを倒してしまい、冷たい水が机の上にこぼれた。",
        "romaji": "Koppu o taoshite shimai, tsumetai mizu ga tsukue no ue ni koboreta.",
        "uz": "Stakanni urib yuborib, muzdek suv stol ustiga to'kildi."
    },
    "vocab_n2_add_91": {
        "word": "こらえる",
        "meaningUz": "Chidamoq, sabr qilmoq",
        "ja": "悔し涙を必死にこらえて、勝者を拍手で称えた。",
        "romaji": "Kuyashinamida o hisshi ni koraete, shousha o hakushu de tataeta.",
        "uz": "Alamli ko'z yoshlarini zo'rg'a tiyib, g'olibni qarsaklar bilan olqishladi."
    },
    "vocab_n2_add_95": {
        "word": "サークル",
        "meaningUz": "To'garak, klub",
        "ja": "大学に入学したら写真撮影のサークルに入りたい。",
        "romaji": "Daigaku ni nyuugaku shitara shashin satsuei no saakuru ni hairitai.",
        "uz": "Universitetga kirgach fotosurat to'garagiga a'zo bo'lmoqchiman."
    },
    "vocab_n2_add_97": {
        "word": "さきおととい",
        "meaningUz": "Uch kun oldin (kechadan oldingi kundan oldingi kun)",
        "ja": "さきおととい発送された小包が本日無事に届いた。",
        "romaji": "Sakiototoi hassou sareta kozutsumi ga honjitsu buji ni todoita.",
        "uz": "Uch kun avval jo'natilgan posilka bugun eson-omon yetib keldi."
    },
    "vocab_n2_add_102": {
        "word": "しあさって",
        "meaningUz": "Indindan keyin (uch kundan keyin)",
        "ja": "大事なプレゼンテーションはしあさっての午後に行われる。",
        "romaji": "Daiji na purezenteeshon wa shiasatte no gogo ni okonawareru.",
        "uz": "Muhim taqdimot indindan keyin tushdan so'ng bo'lib o'tadi."
    },
    "vocab_n2_add_104": {
        "word": "しいんと",
        "meaningUz": "Jimjit, sukunat ichida",
        "ja": "試験が始まると、教室の中はしいんと静まり返った。",
        "romaji": "Shiken ga hajimaru to, kyoushitsu no naka wa shiinto shizumarikaetta.",
        "uz": "Imtihon boshlanishi bilanoq sinfxona jimjit bo'lib qoldi."
    },
    "vocab_n2_add_110": {
        "word": "しゃがむ",
        "meaningUz": "Cho'kkalab o'tirmoq, bukchaymoq",
        "ja": "道端に咲く小さな花を観察するために地面にしゃがんだ。",
        "romaji": "Michibata ni saku chiisana hana o kansatsu suru tame ni jimen ni shaganda.",
        "uz": "Yo'l chetida ochilgan mitti gulni kuzatish uchun yerga cho'nqayib o'tirdim."
    },
    "vocab_n2_add_117": {
        "word": "すくなくとも",
        "meaningUz": "Kamida, aqalli",
        "ja": "試験に合格するには、すくなくとも毎日3時間は勉強すべきだ。",
        "romaji": "Shiken ni goukaku suru ni wa, sukunakutomo mainichi sanjikan wa benkyou subeki da.",
        "uz": "Imtihondan o'tish uchun kamida har kuni uch soat o'qish kerak."
    },
    "vocab_n2_add_126": {
        "word": "すまない",
        "meaningUz": "Kechirasiz, uzr (norasmiy)",
        "ja": "約束の時間に遅れてしまって本当にすまない。",
        "romaji": "Yakusoku no jikan ni okurete shimatte hontou ni sumanai.",
        "uz": "Belgilangan vaqtdan kech qolganim uchun chindan ham uzr."
    },
    "vocab_n2_add_129": {
        "word": "すれちがう",
        "meaningUz": "Bir-birining yonidan o'tib ketmoq, kelisha olmaslik",
        "ja": "駅の階段で偶然昔の同級生とすれちがった。",
        "romaji": "Eki no kaidan de guuzen mukashi no doukyuusei to surechigatta.",
        "uz": "Bekat zinasida tasodifan eski sinfdoshim bilan bir-birimizning yonimizdan o'tib ketdik."
    },
    "vocab_n2_add_131": {
        "word": "ゼミ",
        "meaningUz": "Seminar, ilmiy guruh mashg'uloti",
        "ja": "大学のゼミで日本経済についての研究発表を行った。",
        "romaji": "Daigaku no zemi de nihon keizai ni tsuite no kenkyuu happyou o okonatta.",
        "uz": "Universitet seminarida Yaponiya iqtisodiyoti bo'yicha ilmiy taqdimot qildim."
    },
    "vocab_n2_add_139": {
        "word": "タイア",
        "meaningUz": "Shina, g'ildirak balon",
        "ja": "冬になる前に車のタイアをスノータイアに交換した。",
        "romaji": "Fuyu ni naru mae ni kuruma no taia o sunootaia ni koukan shita.",
        "uz": "Qish tushishidan oldin avtomobil shinasini qishkisiga almashtirdim."
    },
    "vocab_n2_add_140": {
        "word": "だいいち",
        "meaningUz": "Birinchidan, eng avvalo",
        "ja": "海外旅行でだいいちに重要なのはパスポートの管理だ。",
        "romaji": "Kaigai ryokou de daiichi ni juuyou na no wa pasupooto no kanri da.",
        "uz": "Chet elga sayohatda eng avvalo pasportni ehtiyot qilish muhimdir."
    },
    "vocab_n2_add_141": {
        "word": "ダイヤグラム",
        "meaningUz": "Diagramma, qatnov jadvali",
        "ja": "鉄道のダイヤグラムを確認して乗り継ぎの計画を立てた。",
        "romaji": "Tetsudou no daiyaguramu o kakunin shite noritsugi no keikaku o tateta.",
        "uz": "Poyezdlar qatnov jadvalini tekshirib boshqa poyezdga o'tish rejasini tuzdim."
    },
    "vocab_n2_add_146": {
        "word": "だます",
        "meaningUz": "Aldamoq, laqillatmoq",
        "ja": "甘い言葉にだまされて大金を失ってしまった。",
        "romaji": "Amai kotoba ni damasarete taikin o ushinatte shimatta.",
        "uz": "Shirin so'zlarga aldanib katta miqdordagi pulni yo'qotdi."
    },
    "vocab_n2_add_149": {
        "word": "たんす",
        "meaningUz": "Kiyim javoni, sandiq",
        "ja": "季節の変わり目にたんすの服を整理した。",
        "romaji": "Kisetsu no kawarime ni tansu no fuku o seiri shita.",
        "uz": "Fasl almashayotgan paytda kiyim javonidagi kiyimlarni tartibga keltirdim."
    },
    "vocab_n2_add_150": {
        "word": "ちぎる",
        "meaningUz": "Uymoq, maydalab uzmoq",
        "ja": "パンを手で小さくちぎってスープに浸して食べた。",
        "romaji": "Pan o te de chiisaku chigitte suupu ni hitashite tabeta.",
        "uz": "Nonni qo'lda maydalab uzib, sho'rvaga botirib yedim."
    },
    "vocab_n2_add_166": {
        "word": "なぐる",
        "meaningUz": "Urmoq, mushtlamoq",
        "ja": "暴力はいかなる理由があっても他人をなぐる行為は許されない。",
        "romaji": "Bouryoku wa ikanaru riyuu ga attemo tanin o naguru koui wa yurusarenai.",
        "uz": "Qanday sabab bo'lmasin, zo'ravonlik va boshqalarni urish aslo kechirilmaydi."
    },
    "vocab_n2_add_174": {
        "word": "ばからしい",
        "meaningUz": "Bema'ni, ahmoqona",
        "ja": "そんな根拠のない噂を信じるなんてばからしい。",
        "romaji": "Sonna konkyo no nai uwasa o shinjiru nante bakarashii.",
        "uz": "Bunday asossiz mish-mishlarga ishonish bema'nilikdir."
    },
    "vocab_n2_add_175": {
        "word": "はきはき",
        "meaningUz": "Aniq va dadil (gapirmoq)",
        "ja": "面接官の質問にはきはきと答えることができた。",
        "romaji": "Mensetsukan no shitsumon ni hakihaki to kotaeru koto ga dekita.",
        "uz": "Suhbat oluvchining savollariga aniq va dadil javob bera oldim."
    },
    "vocab_n2_add_191": {
        "word": "ひゃっかじてん",
        "meaningUz": "Qomus, ensiklopediya",
        "ja": "調べたい専門用語をひゃっかじてんで詳しく確認した。",
        "romaji": "Shirabetai senmon yougo o hyakkajiten de kuwashiku kakunin shita.",
        "uz": "Qidirmoqchi bo'lgan maxsus atamani qomus orqali batafsil tekshirib ko'rdim."
    },
    "vocab_n2_add_192": {
        "word": "ビルディング",
        "meaningUz": "Baland bino, imorat",
        "ja": "駅前に近代的な高層ビルディングが建設されている。",
        "romaji": "Ekimae ni kindaiteki na kousou birudingu ga kensetsu sarete iru.",
        "uz": "Vokzal oldida zamonaviy ko'p qavatli bino qurilmoqda."
    },
    "vocab_n2_add_200": {
        "word": "ぶらさげる",
        "meaningUz": "Osmoq, osiltirib olmoq",
        "ja": "首から社員証のカードホルダーをぶらさげて出社する。",
        "romaji": "Kubi kara shainshou no kaadohorudaa o burasagete shussha suru.",
        "uz": "Bo'yinga xodimlik guvohnomasini osib ishga boraman."
    },
    "vocab_n2_add_211": {
        "word": "へる",
        "meaningUz": "Kamaymoq, qisqarmoq",
        "ja": "不況の影響で会社の利益が大幅にへってしまった。",
        "romaji": "Fukyou no eikyou de kaisha no rieki ga oohaba ni hette shimatta.",
        "uz": "Iqtisodiy inqiroz tufayli kompaniya foydasi sezilarli darajada kamayib ketdi."
    },
    "vocab_n2_add_219": {
        "word": "まごまご",
        "meaningUz": "Dovdirab qolmoq, ikkilanmoq",
        "ja": "初めて訪れた大都市の駅でまごまごしてしまった。",
        "romaji": "Hajimete otozureta daitoshi no eki de magomago shite shimatta.",
        "uz": "Ilk bor kelgan megapolis bekatida dovdirab nima qilishimni bilmay qoldim."
    },
    "vocab_n2_add_221": {
        "word": "またぐ",
        "meaningUz": "Hatlanoq, ustidan o'tmoq",
        "ja": "歩道にある大きな水たまりを大きくまたいで進んだ。",
        "romaji": "Hodou ni aru ookina mizutamari o tooku mataide susunda.",
        "uz": "Piyodalar yo'lagidagi katta ko'lmak ustidan hatlab o'tib ketdim."
    },
    "vocab_n2_add_239": {
        "word": "もしかすると",
        "meaningUz": "Ehtimol, balki",
        "ja": "もしかすると彼の主張のほうが正しいのかもしれない。",
        "romaji": "Moshikasuruto kare no shuchou no hou ga tadashii no kamo shirenai.",
        "uz": "Ehtimol uning bildirgan fikri to'g'riroqdir."
    },
    "vocab_n2_add_242": {
        "word": "モノレール",
        "meaningUz": "Monorelsli poyezd",
        "ja": "羽田空港から都心へ向かうためにモノレールに乗った。",
        "romaji": "Haneda kuukou kara toshin e mukau tame ni monoreeru ni notta.",
        "uz": "Haneda aeroportidan shahar markaziga borish uchun monorels poyezdiga chiqdim."
    },
    "vocab_n2_add_245": {
        "word": "やっつける",
        "meaningUz": "Yengmoq, tor-mor etmoq",
        "ja": "主人公が知恵を使って手ごわい敵をやっつけた。",
        "romaji": "Shujinkou ga chie o tsukatte tegowai teki o yattsuketa.",
        "uz": "Bosh qahramon aql-zakovatini ishga solib kuchli dushmanni yengdi."
    },
    "vocab_n2_add_246": {
        "word": "やむをえない",
        "meaningUz": "Ilojsiz, chorasiz",
        "ja": "台風が接近しているため、試合の中止はやむをえない。",
        "romaji": "Taifuu ga sekkin shite iru tame, shiai no chuushi wa yamu o enai.",
        "uz": "Tayfun yaqinlashib kelayotgani tufayli o'yinni bekor qilish ilojsiz chora bo'ldi."
    },
    "vocab_n2_add_248": {
        "word": "よこす",
        "meaningUz": "Yubormoq, jo'natmoq",
        "ja": "海外に住む友人から久しぶりに手紙をよこしてきた。",
        "romaji": "Kaigai ni sumu yuujin kara hisashiburi ni tegami o yokoshite kita.",
        "uz": "Chet elda yashaydigan do'stim ancha vaqtdan so'ng xat yuboribdi."
    },
    "vocab_n2_add_256": {
        "word": "レクリェーション",
        "meaningUz": "Hordiq chiqarish, ko'ngilochar tadbirlar",
        "ja": "社員の親睦を深めるために週末にレクリェーションを実施した。",
        "romaji": "Shain no shinboku o fukameru tame ni shuumatsu ni rekurieeshon o jisshi shita.",
        "uz": "Xodimlar o'rtasida birdamlikni mustahkamlash uchun dam olish kunida hordiq tadbirlari o'tkazildi."
    },
    "vocab_n2_add_259": {
        "word": "ローマじ",
        "meaningUz": "Romaji (lotin yozuvi)",
        "ja": "漢字の読み方を覚えるために最初はローマじを参考にした。",
        "romaji": "Kanji no yomikata o oboeru tame ni saisho wa roomaji o sankou ni shita.",
        "uz": "Kanji o'qilishini yodlash uchun boshida lotin yozuvidan foydalandim."
    },
    "vocab_n2_add_262": {
        "word": "わりあいに",
        "meaningUz": "Nisbatan, ancha",
        "ja": "今年の冬は例年に比べてわりあいに暖かい。",
        "romaji": "Kotoshi no fuyu wa reinen ni kurabete wariaini atatakai.",
        "uz": "Bu yilgi qish odatdagi yillarga nisbatan ancha iliq."
    },
    "vocab_n2_add_273": {
        "word": "緯度",
        "meaningUz": "Kenglik (geografik)",
        "ja": "赤道直下の地域は緯度がゼロ度である。",
        "romaji": "Sekidou chokka no chiiki wa ido ga zero do de aru.",
        "uz": "Ekvator chizig'idagi hududlarning kengligi nol darajadir."
    },
    "vocab_n2_add_282": {
        "word": "逸れる",
        "meaningUz": "Chetga chiqmoq, mavzudan og'moq",
        "ja": "議論が白熱するあまり本筋から話が逸れてしまった。",
        "romaji": "Giron ga hakunetsu suru amari hontsuji kara hanashi ga sorete shimatta.",
        "uz": "Bahs qizib ketgani tufayli gap asosiy mavzudan chetga og'ib ketdi."
    },
    "vocab_n2_add_283": {
        "word": "因る",
        "meaningUz": "Bog'liq bo'lmoq, sababli bo'lmoq",
        "ja": "事故の原因は運転手の不注意に因るものと判断された。",
        "romaji": "Jiko no gen\'in wa untenshu no fuchuui ni yoru mono to handan sareta.",
        "uz": "Baxtsiz hodisa sababi haydovchining e'tiborsizligiga bog'liq deb xulosa qilindi."
    },
    "vocab_n2_add_284": {
        "word": "引っ掛かる",
        "meaningUz": "Ilinib qolmoq, to'siqqa uchramoq",
        "ja": "釣り針が川底の岩に引っ掛かって取れなくなった。",
        "romaji": "Tsuribari ga kawazoko no iwa ni hikkakatte torenaku natta.",
        "uz": "Qarmoq ilmog'i daryo tubidagi qoyaga ilinib chiqmay qoldi."
    },
    "vocab_n2_add_285": {
        "word": "引っ繰り返す",
        "meaningUz": "Ag'darmoq, to'ntarmoq",
        "ja": "机の上のコーヒーカップを手で引っ繰り返してしまった。",
        "romaji": "Tsukue no ue no koohiikappu o te de hikkurikaeshite shimatta.",
        "uz": "Stol ustidagi kofe finjonini qo'lim bilan ag'darib yubordim."
    },
    "vocab_n2_add_286": {
        "word": "引っ繰り返る",
        "meaningUz": "Ag'darilmoq, ag'dar-to'ntar bo'lmoq",
        "ja": "強風にあおられて小さなボートが海で引っ繰り返った。",
        "romaji": "Kyoufuu ni aorate chiisana booto ga umi de hikkurikaetta.",
        "uz": "Kuchli shamol girdobida qolib kichik qayiq dengizda ag'darilib ketdi."
    },
    "vocab_n2_add_288": {
        "word": "引越し",
        "meaningUz": "Ko'chish, manzilni almashtirish",
        "ja": "新しいアパートへの引越しの準備を着々と進めている。",
        "romaji": "Atarashii apaato e no hikkoshi no junbi o chakuchaku to susumete iru.",
        "uz": "Yangi xonadonga ko'chishga tayyorgarlik izchil davom etmoqda."
    },
    "vocab_n2_add_289": {
        "word": "引算",
        "meaningUz": "Ayirish amali (matematika)",
        "ja": "小学校の算数で足し算と引算の基本を学んだ。",
        "romaji": "Shougakkou no sansuu de tashizan to hikizan no kihon o mananda.",
        "uz": "Boshlang'ich maktab hisob darsida qo'shish va ayirish asoslarini o'rgandik."
    },
    "vocab_n2_add_290": {
        "word": "引受る",
        "meaningUz": "Zimmaga olmoq, qabul qilmoq",
        "ja": "責任ある新しいプロジェクトのリーダーを引き受けた。",
        "romaji": "Sekinin aru atarashii purojekuto no riidaa o hikiuketa.",
        "uz": "Mas'uliyatli yangi loyihaning yetakchilik vazifasini zimmamga oldim."
    },
    "vocab_n2_add_291": {
        "word": "引出す",
        "meaningUz": "Yechib olmoq (pul), tortib chiqarmoq",
        "ja": "旅行の費用を支払うためにATMから現金を引出した。",
        "romaji": "Ryokou no hiyou o shiharau tame ni ATM kara genkin o hikidashita.",
        "uz": "Sayohat xarajatlarini to'lash uchun bankomatdan naqd pul yechib oldim."
    },
    "vocab_n2_add_292": {
        "word": "引分け",
        "meaningUz": "Durang, teng natija",
        "ja": "両チームとも譲らず、熱戦は1対1の引分けに終わった。",
        "romaji": "Ryou chiimu tomo yuzurazu, nessen wa ittaiichi no hikiwake ni owatta.",
        "uz": "Har ikki jamoa murosasiz kurash olib borib, shiddatli o'yin 1:1 hisobidagi durang bilan yakunlandi."
    },
    "vocab_n2_add_293": {
        "word": "引返す",
        "meaningUz": "Ortga qaytmoq",
        "ja": "忘れ物に気づいて急いで自宅へ引返した。",
        "romaji": "Wasuremono ni kizuite isoide jitaku e hikikaeshita.",
        "uz": "Narsamni unutib qoldirganimni payqab, shoshib uyga ortga qaytdim."
    },
    "vocab_n2_add_311": {
        "word": "凹む",
        "meaningUz": "Pachoqlanmoq, botib kirmoq, tushkunlikka tushmoq",
        "ja": "車を壁にぶつけてしまい、ドアが大きく凹んでしまった。",
        "romaji": "Kuruma o kabe ni butsukete shimai, doa ga ookiku heconde shimatta.",
        "uz": "Mashinani devorga urib olib, eshigi ancha pachoqlanib qoldi."
    },
    "vocab_n2_add_312": {
        "word": "応ずる",
        "meaningUz": "Mos kelmoq, javob bermoq, qabul qilmoq",
        "ja": "相手側の要望に応じて契約内容を一部変更した。",
        "romaji": "Aitegawa no youbou ni oojite keiyaku naiyou o ichibu henkou shita.",
        "uz": "Qarshi tomonning talablariga muvofiq shartnoma mazmuniga qisman o'zgartirish kiritdik."
    },
    "vocab_n2_add_316": {
        "word": "押える",
        "meaningUz": "Bosib turmoq, to'xtatmoq, tiymoq",
        "ja": "傷口を清潔なタオルで強く押さえて止血した。",
        "romaji": "Kizuguchi o seiketsu na taoru de tsuyoku osaete shiketsu shita.",
        "uz": "Yara o'rnini toza sochiq bilan mahkam bosib turib qonni to'xtatdim."
    },
    "vocab_n2_add_319": {
        "word": "襖",
        "meaningUz": "Fusuma (yapon surma eshigi)",
        "ja": "和室の襖を開けると、美しい日本庭園が広がっていた。",
        "romaji": "Washitsu no fusuma o akeru to, utsukushii nihon teien ga hirogatte ita.",
        "uz": "Yaponcha xonaning fusuma eshigini ochganda, go'zal yapon bog'i namoyon bo'ldi."
    },
    "vocab_n2_add_320": {
        "word": "卸す",
        "meaningUz": "Ulgurji narxda sotmoq",
        "ja": "市場で仕入れた新鮮な魚を市内の料亭に卸している。",
        "romaji": "Ichiba de shiireta shinsen na sakana o shinai no ryoutei ni oroshite iru.",
        "uz": "Bozordan olib kelingan yangi baliqlarni shahardagi an'anaviy restoranlarga ulgurji sotadi."
    },
    "vocab_n2_add_334": {
        "word": "何々",
        "meaningUz": "Falon-falon narsa, nimalar",
        "ja": "申請書には何々を記入すべきか具体的に教えてください。",
        "romaji": "Shinseisho ni wa naninani o kinyuu subeki ka gutaiteki ni oshiete kudasai.",
        "uz": "Arizaga nima-nimalarni yozish kerakligini aniq tushuntirib bering."
    },
    "vocab_n2_add_336": {
        "word": "加速度",
        "meaningUz": "Tezlanish (fizika)",
        "ja": "物理の実験で台車の加速度を正確に測定した。",
        "romaji": "Butsuri no jikken de daisha no kasokudo o seikaku ni sokutei shita.",
        "uz": "Fizika tajribasida aravachaning tezlanishini aniq o'lchadik."
    },
    "vocab_n2_add_340": {
        "word": "果して",
        "meaningUz": "Darhaqiqat, kutgandek",
        "ja": "事前の予想通り、果たして彼が優勝を果たした。",
        "romaji": "Jizen no yosou doori, hatashite kare ga yuushou o hatashita.",
        "uz": "Oldindan kutilganidek, haqiqatan ham u chempionlikni qo'lga kiritdi."
    },
    "vocab_n2_add_343": {
        "word": "火口",
        "meaningUz": "Vulkan krateri",
        "ja": "活火山の火口から白い煙が立ち上っているのが見えた。",
        "romaji": "Kakkazan no kakou kara shiroi kemuri ga tachinobotte iru no ga mieta.",
        "uz": "Harakatdagi vulqon krateridan oq tutun ko'tarilayotgani ko'rindi."
    },
    "vocab_n2_add_373": {
        "word": "概論",
        "meaningUz": "Kirish, umumiy tushuncha",
        "ja": "大学1年生向けの法学概論の講義を熱心に聴いた。",
        "romaji": "Daigaku ichinensei muke no hougaku gairon no kougi o nesshin ni kiita.",
        "uz": "Universitet birinchi bosqich talabalari uchun huquqshunoslikka kirish ma'ruzasini diqqat bilan tingladim."
    },
    "vocab_n2_add_389": {
        "word": "割算",
        "meaningUz": "Bo'lish amali (matematika)",
        "ja": "大きな桁の割算を筆算で丁寧に計算した。",
        "romaji": "Ookina keta no warizan o hissan de teinei ni keisan shita.",
        "uz": "Ko'p xonali sonlarni bo'lish amalini yozma hisob bilan puxta bajardim."
    },
    "vocab_n2_add_398": {
        "word": "寒帯",
        "meaningUz": "Sovuq iqlim mintaqasi",
        "ja": "寒帯に位置する地域では一年を通じて厳しい寒さが続く。",
        "romaji": "Kantai ni ichi suru chiiki dewa ichinen o tsuujite kibishii samusa ga tsuzuku.",
        "uz": "Sovuq mintaqada joylashgan hududlarda yil bo'yi qattiq sovuq hukm suradi."
    },
    "vocab_n2_add_409": {
        "word": "間も無く",
        "meaningUz": "Tez orada, yaqin daqiqalarda",
        "ja": "間も無く2番線に東京行きの特急電車が到着いたします。",
        "romaji": "Mamonaku nibansen ni toukyou yuki no tokkyuu densha ga touchaku itashimasu.",
        "uz": "Tez orada 2-yo'lakka Tokioga yo'l olgan tezyurar poyezd yetib keladi."
    },
    "vocab_n2_add_424": {
        "word": "規準",
        "meaningUz": "Mezon, qoida, andoza",
        "ja": "作品の審査は厳格な規準に基づいて公平に行われる。",
        "romaji": "Sakuhin no shinsa wa genkaku na kijun ni motozuite kouhei ni okonawareru.",
        "uz": "Ijodiy ishlarni baholash qat'iy mezonlar asosida adolatli olib boriladi."
    },
    "vocab_n2_add_432": {
        "word": "却って",
        "meaningUz": "Aksincha, qaytaga",
        "ja": "親切で手伝ったつもりが、却って相手の邪魔になってしまった。",
        "romaji": "Shinsetsu de手tsudatta tsumori ga, kaette aite no jama ni natte shimatta.",
        "uz": "Yaxshilik qilib yordam bermoqchi edim, lekin aksincha unga xalal berib qo'ydim."
    },
    "vocab_n2_add_438": {
        "word": "汲む",
        "meaningUz": "Tortib olmoq (suv), hisobga olmoq (holatni)",
        "ja": "井戸から冷たい地下水をバケツで汲み上げた。",
        "romaji": "Ido kara tsumetai chikasui o baketsu de kumiageta.",
        "uz": "Quduqdan muzdek yerosti suvini chelak bilan tortib oldim."
    },
    "vocab_n2_add_447": {
        "word": "挟まる",
        "meaningUz": "Qisilib qolmoq, orasiga tushmoq",
        "ja": "電車のドアにコートの裾が挟まって慌てた。",
        "romaji": "Densha no doa ni kooto no suso ga hasamatte awateta.",
        "uz": "Poyezd eshigiga paltomning etagi qisilib qolib shoshib qoldim."
    },
    "vocab_n2_add_450": {
        "word": "曲げる",
        "meaningUz": "Bukmoq, egmoq",
        "ja": "針金をペンチで直角に曲げて金具を作った。",
        "romaji": "Harigane o penchi de chokkaku ni magete kanagu o tsukutta.",
        "uz": "Simni ombur bilan to'g'ri burchak ostida bukib metall qism yasadim."
    },
    "vocab_n2_add_458": {
        "word": "具える",
        "meaningUz": "O'zida mujassam etmoq, ta'minlanmoq",
        "ja": "優れた指導者は知識と人徳の両方を兼ね具えている。",
        "romaji": "Sugureta shidousha wa chishiki to jintoku no ryouhou o kanesonaete iru.",
        "uz": "Ajoyib rahbar bilim va insoniylik fazilatlarini o'zida mujassam etadi."
    },
    "vocab_n2_add_469": {
        "word": "傾く",
        "meaningUz": "Og'moq, qiyalay boshlamoq",
        "ja": "夕暮れ時になり、太陽が西の空へ大きく傾いた。",
        "romaji": "Yuuguredoki ni nari, taiyou ga nishi no sora e ookiku katamuita.",
        "uz": "Oqshom payti kelib quyosh g'arbiy osmonga qarab qiyalay boshladi."
    },
    "vocab_n2_add_471": {
        "word": "形容動詞",
        "meaningUz": "Sifatdosh fe'l / na-sifat (tilshunoslik)",
        "ja": "日本語の「静かだ」や「便利だ」は文法上、形容動詞に分類される。",
        "romaji": "Nihongo no \"shizuka da\" ya \"benri da\" wa bunpoushou, keiyoudoushi ni bunrui sareru.",
        "uz": "Yapon tilidagi \"shizuka da\" va \"benri da\" grammatik jihatdan na-sifat turkumiga kiradi."
    },
    "vocab_n2_add_472": {
        "word": "恵まれる",
        "meaningUz": "Nasib etmoq, boy bo'lmoq (tabiiy imkoniyatlarga)",
        "ja": "日本は豊かな自然と美しい四季の移ろいに恵まれている。",
        "romaji": "Nihon wa yutaka na shizen to utsukushii shiki no utsuroi ni megumarete iru.",
        "uz": "Yaponiya boy tabiat va go'zal to'rt fasl almashinuviga ega."
    },
    "vocab_n2_add_473": {
        "word": "慶び",
        "meaningUz": "Quvonch, shodlik, muborakbod",
        "ja": "新春を迎え、皆様のご健康とご多幸を心よりお慶び申し上げます。",
        "romaji": "Shinshun o mukae, minasama no gokenkou to gotakou o kokoro yori oyorokobi moushiagemasu.",
        "uz": "Yangi bahoriy fasl munosabati bilan barchangizga sog'lik va saodat tilayman."
    },
    "vocab_n2_add_479": {
        "word": "繋げる",
        "meaningUz": "Ulamoq, bog'lamoq",
        "ja": "パソコンをプロジェクターにケーブルでしっかり繋げた。",
        "romaji": "Pasokon o purojekutaa ni keeburu de shikkari tsunageta.",
        "uz": "Kompyuterni proyektorga kabel orqali mahkam uladim."
    },
    "vocab_n2_add_481": {
        "word": "激増",
        "meaningUz": "Keskin ortish, ko'payish",
        "ja": "観光ビザの緩和により、外国人観光客が前年比で激増した。",
        "romaji": "Kankou biza no kanwa ni yori, gaikokujin kankoukyaku ga zennenhi de gekizou shita.",
        "uz": "Sayyohlik vizasining yengillashtirilishi tufayli xorijiy sayyohlar soni o'tgan yilga nisbatan keskin oshdi."
    },
    "vocab_n2_add_496": {
        "word": "見慣れる",
        "meaningUz": "Ko'zi o'rganmoq, tanish bo'lmoq",
        "ja": "毎日通学している道なので、見慣れた風景が広がっている。",
        "romaji": "Mainichi tsuugaku shite iru michi na node, minareta fuukei ga hirogatte iru.",
        "uz": "Har kuni o'qishga boradigan yo'lim bo'lgani sababli, ko'zim o'rgangan tanish manzara ko'rinadi."
    }
}

print(f"Loaded {len(N2_DATA)} base entries")
