# N4 kurs auditi — 2026-11-04

Bu hisobot tarkibiy avtomatik tekshiruv va tanlab o‘tkazilgan mazmuniy tekshiruv natijasidir. Barcha yaponcha jumlalar va audiolar malakali o‘qituvchi tomonidan to‘liq tekshirilganini anglatmaydi.

## Foydalanuvchiga ko‘rinadigan manba

Asosiy kurs src/data/curriculum/levels/n4/minnaLessons.json faylini curriculumLessons.ts orqali yuklaydi. Dars sahifasi learn, practice va ikkita test bosqichini ko‘rsatadi. Alohida minnaQuizDatabase.json va public/data nusxalari mavjud; tuzatilgan bir xil savollar sinxronlashtirildi.

## Barcha darslar inventari

| Dars | Mavzu                                                                                  | So‘z | Grammatika | Mashq | Test |
| ---- | -------------------------------------------------------------------------------------- | ---: | ---------: | ----: | ---: |
| 26   | 26-Dars: 〜んです / 〜んですが (Izoh, sabab va iltimos bildirish)                      |   29 |          3 |    10 |   17 |
| 27   | 27-Dars: 可能動詞 (Qobiliyat va imkoniyat fe'llari: 〜られる / 〜れる)                 |   24 |          3 |    10 |   17 |
| 28   | 28-Dars: 〜ながら / 〜ています (Odat) / 〜し、〜し (Sabablarni sanash)                 |   23 |          3 |    10 |   17 |
| 29   | 29-Dars: 自動詞・他動詞 (O'zlik va o'zgalik fe'llari) / 〜てしまいました               |   23 |          2 |    10 |   17 |
| 30   | 30-Dars: 他動詞＋てあります / 〜ておきます (Tayyorgarlik choralari)                    |   24 |          2 |    10 |   17 |
| 31   | 31-Dars: 意向形 (Volitional form) / 〜と思っています / 〜つもりです                    |   20 |          3 |    10 |   17 |
| 32   | 32-Dars: 〜ほうがいいです (Maslahat) / 〜でしょう / 〜かもしれません                   |   20 |          3 |    10 |   17 |
| 33   | 33-Dars: 命令形・禁止形 (Buyruq va taqiq) / 〜という意味です                           |   18 |          3 |    10 |   17 |
| 34   | 34-Dars: 〜とおりに (Xuddi shunday) / 〜あとで (Keyin) / 〜て・ないで                  |   14 |          3 |    10 |   17 |
| 35   | 35-Dars: 条件形 (Shart shakli: 〜ば) / 〜なら (Tavsiya va chegara)                     |   16 |          3 |    10 |   17 |
| 36   | 36-Dars: 〜ように (Maqsad) / 〜ようになります / 〜ようにします                         |   21 |          3 |    10 |   17 |
| 37   | 37-Dars: 受身動詞 (Majhul nisbat: 〜られる) / 〜によって                               |   18 |          3 |    10 |   17 |
| 38   | 38-Dars: 動詞の名詞化 (Fe'lning otlashishi: 〜のは / 〜のが / 〜のを)                  |   17 |          3 |    10 |   17 |
| 39   | 39-Dars: 原因・理由 (Sabab-oqibat: 〜て / 〜で / 〜ので)                               |   17 |          3 |    10 |   17 |
| 40   | 40-Dars: 疑問詞＋か / 〜かどうか / 〜てみます                                          |   16 |          3 |    10 |   17 |
| 41   | 41-Dars: 授受動詞 (いただきます・くださいます・やります / 〜ていただきます)            |   15 |          3 |    10 |   17 |
| 42   | 42-Dars: 目的 (〜ために / 〜のに使います)                                              |   17 |          2 |    10 |   17 |
| 43   | 43-Dars: 様態 (〜そうです: ...ko'rinadi, tuyuladi) / 行動の移動 (〜てきます)           |   15 |          2 |    10 |   17 |
| 44   | 44-Dars: 過度 (〜すぎます) / 難易 (〜やすい / 〜にくい) / 変化 (〜くします)            |   20 |          3 |    10 |   17 |
| 45   | 45-Dars: 条件・仮定 (〜場合は) / 逆接 (〜のに: holbuki, kutilganga zid)                |   16 |          2 |    10 |   17 |
| 46   | 46-Dars: 局面 (〜ところです: Boshlanish/jarayon/yakun) / 直後 (〜ばかりです)           |   13 |          3 |    10 |   17 |
| 47   | 47-Dars: 伝聞 (〜そうです: Eshitishimcha) / 推量 (〜ようです: Ko'rinishidan)           |   14 |          3 |    10 |   17 |
| 48   | 48-Dars: 使役動詞 (Majburlash yoki ijozat berish: 〜させる) / 〜させていただけませんか |   16 |          2 |    10 |   17 |
| 49   | 49-Dars: 尊敬語 (Sonkeigo: Hurmat shakli) / お〜になります / 特殊尊敬語                |   14 |          3 |    10 |   17 |
| 50   | 50-Dars: 謙譲語 (Kenjougo: Kamtarlik shakli) / お〜します / 特殊謙譲語                 |   14 |          3 |    10 |   17 |

## Natijalar va tuzatishlar

- 25 darsda 250 amaliy mashq, 250 odatiy test savoli va 175 tinglash test savoli bor. 675 ta savol IDsi noyob, javob indekslari to‘g‘ri chegarada, takroriy variantlar va bo‘sh izohlar aniqlanmadi. Bu to‘g‘ri javobning ma’no jihatidan to‘g‘riligini kafolatlamaydi.
- 454 lug‘at yozuvida o‘qilish, ma’no, misol va misol tarjimasi mavjud; 69 grammatika yozuvi bor. Matn mavjudligi tarjimaning to‘g‘riligini kafolatlamaydi.
- 15 ta kanji o‘qilishi savolida javob qavsda yoki furigana bilan ko‘rsatilgan edi; faqat so‘ralgan so‘zdagi ko‘rsatma olib tashlandi. To‘g‘ri javob va izohlar saqlandi.
- 26- va 28-darslardagi to‘rtta savolda bir nechta tabiiy javob bo‘lishi, 33-darsda esa qo‘shimcha adabiy buyruq shakli mavjudligi sababli chalg‘ituvchi variantlar almashtirildi. Ushbu savollar yapon tili o‘qituvchisi tomonidan ham ko‘rilishi kerak.
- 45-darsda tinglash savoli elchixonaga borishni so‘rardi, matnda esa elchixonaga murojaat qilish aytilgan; savol mazmunga moslashtirildi.
- 40-darsdagi 〜てみます izohida «birinchi marta» cheklovi olib tashlandi. 50-darsdagi kamtarlik shakllarini «faqat so‘zlovchining o‘zi»ga qo‘llash haqidagi cheklov o‘z guruhi kontekstini ham qamraydigan qilib tuzatildi. Taqqoslash uchun: [Japan Foundation Irodori](https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf) va [kamtarlik izohi](https://www.irodori.jpf.go.jp/assets/data/elementary02/pdf/Z_L17.pdf).
- Avvalgi ko‘rikda N4 amaliy savollaridagi 3 ta javob oshkor bo‘lishi, eski dars havolalaridagi bo‘lim raqami xatosi va 12 tadan ko‘p lug‘atning bir vaqtda ko‘rinishi tuzatilgan.

## Strukturaviy baho va qolgan ishlar

26–50 ketma-ketligida N5 davomi va N4 grammatik mavzularining mantiqiy rivoji ko‘rinadi; biroq buni to‘liq JLPT qamrovi yoki malaka berilishi deb baholash uchun mavzular xaritasi va mutaxassis ekspertizasi kerak. 26-darsda 29 so‘z, keyingi darslarda 13–24 so‘z bor; 30 daqiqalik har bir dars vaqti foydalanuvchilar bilan sinab tasdiqlanmagan. Lug‘at ko‘rinishi 12 tadan bosqichma-bosqich ochiladi, ammo bu yangi va takroriy so‘zlarni alohida pedagogik rejalashtirish emas.

Tinglash savollari uchun 51 ta faylning mavjudligi tekshirildi, lekin audio mazmuni va 175 savolga mosligi hali eshitib tasdiqlanmagan. Bir fayl bir nechta savolga bog‘langan, ko‘p savolda esa tinglanadigan suhbat matni javobdan oldin ko‘rinadi; shu sabab ular haqiqiy tinglab tushunishni mustaqil baholamaydi. Audio va matn mosligi tekshirilmaguncha matnni yashirish o‘quvchini javobsiz qoldirishi mumkin.

Barcha 675 savolni avtomatik shakl tekshiruvidan o‘tkazish har bir variantni, har bir tarjimani yoki 454 misolni ekspert darajasida tasdiqlash emas. Qolgan ish: har bir audio va uning savollarini tinglab moslashtirish, savol variantlarining bir ma’noliligini va tarjimalarni o‘qituvchi bilan ko‘rish, keyin saytning jonli muhiti va progressni boshidan oxirigacha sinash.

## Tekshiruv natijalari

N4 darslari, quizlar, tinglash tuzilmasi, mashq va test komponentlari bo‘yicha 6 test faylida 38 ta test muvaffaqiyatli o‘tdi. Yangi tekshiruv kanji o‘qilish savollarida target so‘zning furigana yoki qavsda javob ko‘rsatmasligini tekshiradi. ESLint va `npm run build` muvaffaqiyatli; Vite eski konfiguratsiya haqida ogohlantirish beradi. Brauzerda jonli foydalanuvchi safari va audio mazmuni hali to‘liq sinovdan o‘tkazilmagan.

## Tinglash muammosi bo‘yicha keyingi tuzatish

51 ta eski audioning faqat mavjudligi tasdiqlangani yetarli emas edi. 26-darsning birinchi savoliga biriktirilgan trek mahalliy nutqni matnga aylantirish orqali tekshirilganda savolga aloqasiz ziyofat suhbatini o‘z ichiga olishi aniqlandi. Boshqa treklarning mazmuni tekshirilmagan va mos deb qabul qilinmagan.

Foydalanuvchi kursidagi barcha 175 tinglash savoli uchun eski trek o‘rniga aynan shu savolning yozma suhbatidan tuzilgan, `audioScript` orqali yaponcha sintezlangan ovoz ishlatiladi. Bu yozuvlar asl CD yoki insonlar yozgan dialog sifatida taqdim etilmaydi. Suhbat savol paytida ko‘rsatilmaydi; test tugagandan so‘ng tahlilda ochiladi. TTS ishlamasa, interfeys qayta urinish uchun xabar ko‘rsatadi. 17 savolda bitta sintez ovozidan jinsni taxmin qilish talab qilinmasligi uchun ishtirokchilar vazifasi bo‘yicha aniqlandi; 37-darsdagi bitta savolda javobning sababi suhbatda ochiq berildi.

Bu o‘zgarish fayl mavjudligiga qarab audio mos deb taxmin qilish muammosini bartaraf etadi. Sintez nutqi haqiqiy suhbatdagi turli ovozlar va intonatsiyalarni to‘liq almashtirmaydi; TTS xizmatining ishlashi tarmoq yoki brauzer nutq imkoniyatiga bog‘liq. Eski, foydalanuvchi kursiga ulanmagan alohida `minnaMondaiListeningData.ts` ma’lumotlari haqiqiy Minna audio sifatida tasdiqlanmagan.

Hali zarur: barcha savol-javoblarning mantiqiy yagonaligi, 454 lug‘at misoli va o‘zbekcha tarjimalarni til mutaxassisi to‘liq ko‘rishi; haqiqiy qurilmada TTS ovozini va tinglash amaliyotini boshidan oxirigacha sinash. Avtomatik tekshiruvlar buni tasdiqlamaydi.

Yakuniy tekshiruv: 6 ta test faylida 56 ta test va ESLint o‘tdi, production build muvaffaqiyatli yakunlandi. Azure’ga alohida sinov so‘rovi uchun hisob ma’lumotini olish kutilib qoldi va tekshiruv to‘xtatildi; shu sabab haqiqiy Azure ovozi yoki foydalanuvchi karnayidagi ijro bu ish davomida tasdiqlanmagan.
