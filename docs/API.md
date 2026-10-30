# 📡 Kaiwa Live — API Reference & Architecture Documentation

Ushbu hujjat **Kaiwa Live (kaiwa.live)** platformasining Vercel Serverless & Edge API arxitekturasi, autentifikatsiya, rate limiting, kvota nazorati va barcha ochiq/yopiq endpointlari bo‘yicha to‘liq texnik spetsifikatsiyasini o‘z ichiga oladi.

---

## 🏛️ 1. Umumiy Arxitektura va Edge Runtime

Kaiwa Live API qatlami gibrid arxitekturaga asoslangan:

- **Serverless Node.js Runtime (maxDuration: 60s):** Katta hisoblash quvvatini yoki maxsus AI streaming ulanishlarini talab qiluvchi marshrutlar (masalan: `/api/deepseek`).
- **Vercel Edge Runtime (V8 Engine):** Sub-millisoniyali kechikish (latency) bilan ishlovchi global tezkor marshrutlar (masalan: `/api/v1/sakubun-evaluate`, `/api/v1/srs`, `/api/tts`).
- **Database & Auth Layer:** Supabase PostgreSQL (Row Level Security - RLS bilan himoyalangan).

---

## 🔐 2. Autentifikatsiya va Xavfsizlik

### 2.1. Bearer Token (Supabase JWT)

Aksariyat himoyalangan API endpointlari `Authorization: Bearer <supabase_jwt_token>` sarlavhasini talab qiladi.

- Klient `supabase.auth.getSession()` orqali olingan `access_token`ni uzatadi.
- Server `api/_auth.js` yordamida tokenni `supabase.auth.getUser(token)` orqali tekshiradi.
- Token yaroqli bo‘lsa, foydalanuvchi ma’lumotlari (`userId`, `email`, `role`) ajratib olinadi.

### 2.2. Anonim va Mehmon (Guest) Rejimi

Platforma ro‘yxatdan o‘tmagan foydalanuvchilar uchun ham cheklangan kirishni ta’minlaydi. Mehmon so‘rovlari IP manzil asosida kvotalanadi va cheklanadi.

---

## 🛡️ 3. Rate Limiting va AI Kvota Boshqaruvi

### 3.1. Distributed Rate Limiter (`api/_rateLimit.js`)

- **Mexanizm:** Sliding-window algoritmi.
- **Asosiy Provayder:** Upstash Redis REST API (ko‘p nusxali serverless va cold-start xavfsiz).
- **Zaxira (Fallback):** Xotiradagi (In-Memory) Map (lokal ishlab chiqish va testlar uchun).
- **Standart Mezon:** 1 daqiqada maksimal **15 ta so‘rov** (IP va User ID bo‘yicha). Cheklovdan oshganda `429 Too Many Requests` qaytariladi (`Retry-After` sarlavhasi bilan).

### 3.2. AI Daily Quota & Hajm Himoyasi (`api/_quota.js`)

- **Maksimal So‘rov Hajmi:** `25 KB` (`MAX_REQUEST_SIZE_BYTES = 25 * 1024`).
- **Kunlik Bepul Kvota:** Foydalanuvchi uchun kuniga **25 ta AI so‘rovi**.
- **Admin/Power User Kvotasi:** Kuniga **500 ta AI so‘rovi**.

---

## 📚 4. API Endpointlar Spetsifikatsiyasi

### 4.1. AI Sensei Gateway (`/api/deepseek`)

Sun'iy intellekt Yuki Sensei bilan ovozli va matnli muloqot, grammatika tahlili va savollarga javob berish shlyuzi.

- **URL:** `/api/deepseek`
- **Method:** `POST` (va diagnostika uchun `GET`)
- **Runtime:** Serverless (maxDuration: 60s)
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>` (Ixtiyoriy, ammo tavsiya etiladi)

#### GET Diagnostika So‘rovi:

```json
// Response: 200 OK
{
  "status": "active",
  "service": "Supabase Edge AI Gateway",
  "available": true,
  "provider": "DeepSeek via Supabase Edge Function",
  "model": "deepseek-chat",
  "hint": "AI gateway is active and routed to Supabase Edge Function."
}
```

#### POST So‘rov Tanasi:

```json
{
  "messages": [
    { "role": "system", "content": "Siz yapon tili ustozi Yuki Senseisiz." },
    { "role": "user", "content": "こんにちは、先生！" }
  ],
  "temperature": 0.7,
  "max_tokens": 800,
  "stream": false
}
```

#### Javob Formati (200 OK):

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "こんにちは！お元気ですか？今日も一緒に日本語を練習しましょう。"
      }
    }
  ]
}
```

---

### 4.2. Insho Baholash (`/api/v1/sakubun-evaluate`)

JLPT uslubidagi yozma insholar (Sakubun) va jumlalarni grammatika, so‘z boyligi, imlo va tabiiylik mezonlari bo‘yicha chuqur tahlil qilish.

- **URL:** `/api/v1/sakubun-evaluate`
- **Method:** `POST`
- **Runtime:** Edge Runtime
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`

#### So‘rov Tanasi:

```json
{
  "content": "先週の日曜日に友達と京都に行きました。とても楽しかったですが、電車が遅れました。",
  "topic": "休日",
  "level": "N4"
}
```

#### Javob Formati (200 OK):

```json
{
  "overallScore": 88,
  "scores": {
    "grammar": 90,
    "vocabulary": 85,
    "naturalness": 88,
    "structure": 90
  },
  "correctedText": "先週の日曜日に友達と京都へ行きました。とても楽しかったですが、電車が遅れてしまいました。",
  "feedbackUz": "Matn juda ravon va tushunarli yozilgan. Yo'nalish bildirishda 'へ' yuklamasi ko'proq tavsiya etiladi. Kutilmagan salbiy hodisalarda '〜てしまいました' shakli tabiiyroq eshitiladi.",
  "errors": [
    {
      "original": "京都に行きました",
      "correction": "京都へ行きました",
      "explanation": "Yo'nalishni ta'kidlash uchun 'へ' afzalroqdir."
    }
  ]
}
```

---

### 4.3. SM-2 Spaced Repetition Dvigateli (`/api/v1/srs`)

Anki SM-2 takrorlash algoritmi asosida kartochkaning keyingi ko‘rish sanasi va oraliq kunlarini hisoblovchi deterministik funksiya.

- **URL:** `/api/v1/srs`
- **Method:** `POST`
- **Runtime:** Edge Runtime

#### So‘rov Tanasi:

```json
{
  "quality": 4,
  "repetitions": 2,
  "interval": 3,
  "easeFactor": 2.5,
  "reviewDate": "2026-10-30"
}
```

_`quality` mezoni: 0 (mutlaq eslanmadi) dan 5 (oson va xatosiz eslandi) gacha._

#### Javob Formati (200 OK):

```json
{
  "repetitions": 3,
  "interval": 7,
  "easeFactor": 2.5,
  "dueDate": "2026-11-06",
  "nextReviewDate": "2026-11-06T00:00:00.000Z"
}
```

---

### 4.4. AI Fleshkarta Generatori (`/api/v1/flashcards-generate`)

Kiritilgan mavzu, dars matni yoki iyerogliflar ro‘yxati asosida avtomatik ravishda ikki tomonlama JLPT kartochkalarini yaratish.

- **URL:** `/api/v1/flashcards-generate`
- **Method:** `POST`
- **Runtime:** Edge Runtime

#### So‘rov Tanasi:

```json
{
  "prompt": "JLPT N3 darajasidagi ob-havo va tabiiy ofatlarga oid 5 ta so'z",
  "level": "N3",
  "count": 5
}
```

#### Javob Formati (200 OK):

```json
{
  "cards": [
    {
      "front": "洪水",
      "reading": "こうずい",
      "back": "Suv toshqini, sel",
      "exampleSentence": "大雨で川が氾濫し、洪水が発生した。",
      "exampleTranslation": "Kuchli yomg'ir sababli daryo toshib, sel keldi."
    }
  ]
}
```

---

### 4.5. Audio TTS Sintezi (`/api/tts`)

Ko‘p tilli tabiiy ovozli sintez (Text-To-Speech) marshruti.

- **URL:** `/api/tts`
- **Method:** `POST`
- **Runtime:** Edge Runtime
- **Headers:** `Content-Type: application/json`

#### So‘rov Tanasi:

```json
{
  "text": "おはようございます",
  "lang": "ja"
}
```

#### Ruxsat etilgan tillar (`ALLOWED_LANGUAGES`):

`uz`, `ja`, `en`, `ru`, `ko`, `zh`, `es`, `fr`, `de`, `tr`, `ar`, `it`, `pt`, `hi`, `id`, `vi`, `th`.

---

### 4.6. Telegram Integratsiyasi va TWA Webhook (`/api/telegram`)

Telegram boti, Mini App autentifikatsiyasi va kunlik test tarqatmalari uchun yagona router.

- **URL:** `/api/telegram`
- **Sub-yo‘nalishlar:**
  - `auth-twa`: Telegram WebApp `initData` orqali xavfsiz HMAC tekshiruvidan o‘tish va foydalanuvchini Supabase bilan bog‘lash.
  - `webhook`: Bot buyruqlarini (`/start`, `/quiz`, `/progress`, `/battle`) qabul qilish.
  - `notify-daily`: Kunlik takrorlash eslatmalarini yuborish.
  - `dispatch-daily-dataset`: Har kuni 22:00 da yangi so‘zlar to‘plamini foydalanuvchilarga jo‘natish.
  - `dispatch-group-battle`: Guruhlardagi jonli musobaqa viktorinalarini boshqarish.

---

### 4.7. SEO va Strukturaviy Reytinglar (`/api/seo/ratings`)

Qidiruv tizimlari (Google Search Rich Snippets) uchun platforma reytinglari va foydalanuvchi sharhlari statistikasini taqdim etuvchi ochiq keshli marshrut.

- **URL:** `/api/seo/ratings`
- **Method:** `GET`

#### Javob Formati (200 OK):

```json
{
  "ratingValue": "4.9",
  "ratingCount": 12480,
  "bestRating": "5",
  "worstRating": "1"
}
```

---

## 🚦 5. Xatolar va HTTP Status Kodlari

| Status Kodd              | Sabab va Izoh                                                      |
| :----------------------- | :----------------------------------------------------------------- |
| `200 OK`                 | So‘rov muvaffaqiyatli bajarildi.                                   |
| `204 No Content`         | OPTIONS preflight so‘rovi tasdiqlandi.                             |
| `400 Bad Request`        | So‘rov tanasi noto‘g‘ri yoki parametrlar yetarli emas.             |
| `401 Unauthorized`       | Bearer token taqdim etilmagan yoki yaroqsiz.                       |
| `405 Method Not Allowed` | Ushbu marshrutda ruxsat etilmagan HTTP metod chaqirildi.           |
| `413 Payload Too Large`  | So‘rov hajmi 25 KB chegarasidan oshib ketdi.                       |
| `429 Too Many Requests`  | 15 req/min yoki kunlik AI kvotasi tugadi.                          |
| `500 Internal Error`     | Server ichki xatosi (avtomatik ravishda fallback rejimiga o‘tadi). |
