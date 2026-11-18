# 📱 kaiwa.live Mobile API & Architecture Specification

> **For Mobile AI Agent / Developer:**
> Ushbu hujjat **kaiwa.live** platformasining mobil ilovasini (React Native / Expo / Flutter / Swift / Kotlin) ishlab chiqayotgan AI agent va dasturchilar uchun yagona va to'liq integratsiya standarti (Source of Truth) hisoblanadi.
> Barcha API shlyuzlari, avtorizatsiya qoidalari, so'rov va javob formatlari, Azure/DeepSeek zaxira tizimi hamda ovozli suhbat (Voice Loop) me'morchiligi quyida batafsil keltirilgan.

---

## 📑 Mundarija

1. [Asosiy Muhit va Konfiguratsiya](#1-asosiy-muhit-va-konfiguratsiya)
2. [Xavfsizlik va Autentifikatsiya (Supabase & Google OAuth)](#2-xavfsizlik-va-autentifikatsiya-supabase--google-oauth)
3. [AI Speaking Coach API (`/api/coach`)](#3-ai-speaking-coach-api-apicoach)
4. [DeepSeek Zaxira API (`/api/deepseek`)](#4-deepseek-zaxira-api-apideepseek)
5. [Speech Synthesis / Ovoz Sintezi (TTS) API (`/api/tts`)](#5-speech-synthesis--ovoz-sintezi-tts-api-apitts)
6. [Azure Speech Ephemeral Token API (`/api/speech-token`)](#6-azure-speech-ephemeral-token-api-apispeech-token)
7. [O'quv Darsliklari va Leksika (Curriculum & Decks)](#7-oquv-darsliklari-va-leksika-curriculum--decks)
8. [Spaced Repetition System (SRS Flashcard Algoritmi)](#8-spaced-repetition-system-srs-flashcard-algoritmi)
9. [Mobil Qurilmada Jonli Ovozli Suhbat (Voice Loop) Sikli](#9-mobil-qurilmada-jonli-ovozli-suhbat-voice-loop-sikli)
10. [Mobil AI Agent Uchun Qat'iy Qoidalar (Best Practices)](#10-mobil-ai-agent-uchun-qatiy-qoidalar-best-practices)

---

## 1. Asosiy Muhit va Konfiguratsiya

Mobil ilova to'g'ridan-to'g'ri backend API shlyuzlari bilan ishlaydi. Mobil kod ichida hech qachon OpenAI, DeepSeek yoki Azure maxfiy kalitlari (Secret Keys) saqlanmaydi — barcha so'rovlar serverless proxy orqali xavfsiz boshqariladi.

### 🌐 Base URL manzillari:

| Muhit            | Base URL                                   | Tavsif                                         |
| :--------------- | :----------------------------------------- | :--------------------------------------------- |
| **Production**   | `https://kaiwa.live`                       | Jonli serverless API va static assets          |
| **Local Dev**    | `http://<KOMPYUTER_LOKAL_IP>:5173`         | Lokal ishlab chiqish (Wi-Fi orqali Expo uchun) |
| **Supabase URL** | `https://qmuimxnknxwarvnkpnlo.supabase.co` | Auth, ma'lumotlar bazasi va Realtime           |

### 🔑 Standart So'rov Sarlavhalari (Request Headers):

Har bir so'rovda quyidagi sarlavhalar yuborilishi shart:

```http
Content-Type: application/json
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <USER_ACCESS_TOKEN yoki SUPABASE_ANON_KEY>
```

---

## 2. Xavfsizlik va Autentifikatsiya (Supabase & Google OAuth)

Mobil ilovada 3 xil foydalanuvchi rejimi mavjud:

1. **Ro'yxatdan o'tgan foydalanuvchi** (Email + Parol yoki Google OAuth)
2. **Mehmon rejimi (Guest Mode)** — ro'yxatdan o'tmasdan platformani sinab ko'rish
3. **Telegram WebApp / SSO** (agar Telegram orqali ochilsa)

### 2.1. Supabase Client Initsializatsiyasi (React Native / Expo)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qmuimxnknxwarvnkpnlo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // loyihaning public anon keyi

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Mobil uchun false
  },
});
```

### 2.2. Google Bilan Davom Etish (Google OAuth Mobil Flow)

Mobil ilovada Google bilan kirish `expo-auth-session` yoki native SDK orqali amalga oshiriladi:

```typescript
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export const signInWithGoogleOnMobile = async () => {
  const redirectUrl = makeRedirectUri({
    scheme: 'kaiwa',
    path: 'auth/callback',
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (data?.url) {
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (res.type === 'success') {
      const { url } = res;
      // URL parametrlaridan access_token va refresh_token olinadi:
      const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    }
  }
};
```

---

## 3. AI Speaking Coach API (`/api/coach`)

> **Ustuvorlik:** 1-O‘rin (Asosiy AI provayderi: Azure OpenAI `kaiwa-coach` / `gpt-4.1-mini`).
> **Vazifasi:** Yapon tili bo'yicha murabbiy (Coach) bilan real-vaqt rejimida muloqot olib borish, foydalanuvchi xatolarini tuzatish va yangi so'zlarni taqdim etish.

### 📍 Endpoint:

`POST https://kaiwa.live/api/coach`

### 📤 So'rov Formati (Request Body):

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a friendly Japanese speaking coach for JLPT N4 level. Return valid JSON only with 'reply', 'ttsText', 'feedback'."
    },
    {
      "role": "user",
      "content": "こんにちは！今日はお寿司を食べました。"
    }
  ],
  "stream": true,
  "response_format": { "type": "json_object" }
}
```

### 📥 1. Streaming Rejimi (`stream: true` - Tavsiya etiladi)

Javob `text/event-stream` (SSE) sifatida oqimda keladi. Har bir bo'lak `data: {...}` bilan boshlanadi:

```http
data: {"choices":[{"delta":{"content":"{\"reply\":\"それはいいですね！何のお寿司を食べましたか？\""}}]}
...
data: [DONE]
```

#### ⚡ Sub-600ms Mobil Ovoz Keshini Ajratib Olish Qoidasi (Sentence Extractor):

Mobil ilova to'liq JSON kelishini kutmaydi! Oqimdan kelayotgan har bir gap oxiri belgisi (`。`, `！`, `？`, `\n`) aniqlanishi bilanoq, o'sha jumla darhol TTS API ga yuboriladi:

```typescript
// Yapon tili uchun gap chegarasini ajratuvchi Regex:
const JA_SENTENCE_REGEX = /([^\n。！？]+[。！？\n]+|[^\n。！？、]{12,}、)/g;
```

### 📥 2. Non-Streaming Rejimi (`stream: false`)

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "{\"reply\":\"それはいいですね！何のお寿司を食べましたか？\",\"feedback\":\"To'g'ri va ravon gap tuzildi.\",\"new_words\":[{\"word\":\"握り寿司\",\"reading\":\"にぎりずし\",\"translation_uz\":\"Nigiri sushi\"}]}"
      }
    }
  ]
}
```

---

## 4. DeepSeek Zaxira API (`/api/deepseek`)

> **Ustuvorlik:** 2-O‘rin (Avtomatik zaxira / Fallback).
> **Qachon ishlatiladi:** Agar `/api/coach` 503 qaytarsa yoki 4-5 soniya ichida javob bermasa (Timeout).

### 📍 Endpoint:

`POST https://kaiwa.live/api/deepseek`

### 📤 So'rov Formati:

```json
{
  "model": "deepseek-chat",
  "messages": [
    { "role": "system", "content": "You are a backup Japanese coach." },
    { "role": "user", "content": "こんにちは" }
  ],
  "stream": true,
  "response_format": { "type": "json_object" }
}
```

_Eslatma: Parametrlari `/api/coach` bilan 100% bir xil, shuning uchun mobil ilova hech qanday o'zgartirishsiz shunchaki URL manzilini `/api/deepseek` ga almashtirsa kifoya._

---

## 5. Speech Synthesis / Ovoz Sintezi (TTS) API (`/api/tts`)

> **Ustuvorlik:** 1-O‘rin: Azure Neural TTS (`ja-JP-NanamiNeural`, `uz-UZ-MadinaNeural`, `en-US-JennyNeural`).
> **Zaxira:** Google High-Quality TTS (avtomatik server ichida almashadi).

### 📍 Endpoint:

`POST https://kaiwa.live/api/tts`

### 📤 So'rov Formati:

```json
{
  "text": "こんにちは、今日も一緒に日本語を勉強しましょう！",
  "lang": "ja"
}
```

_Qo'llab-quvvatlanadigan tillar:_ `ja` (Yapon), `uz` (O'zbek), `en` (Ingliz), `ru` (Rus). Maksimal matn uzunligi: 200 belgi.

### 📥 Javob Formati:

- **Status:** `200 OK`
- **Content-Type:** `audio/mpeg` (Standart MP3 audio fayl baytlari)
- **Header:** `X-TTS-Provider: azure-neural` (yoki `google-tts`)

### 📱 Mobil Ilovada O'ynatish (Audio Playback):

```typescript
import { Audio } from 'expo-av';

export const playTTSAudio = async (text: string, lang: 'ja' | 'en' = 'ja') => {
  const token = (await supabase.auth.getSession()).data.session?.access_token || SUPABASE_ANON_KEY;

  const response = await fetch('https://kaiwa.live/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text, lang }),
  });

  const blob = await response.blob();
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = async () => {
    const base64Audio = reader.result as string;
    const { sound } = await Audio.Sound.createAsync({ uri: base64Audio });
    await sound.playAsync();
  };
};
```

---

## 6. Azure Speech Ephemeral Token API (`/api/speech-token`)

> **Vazifasi:** Mobil ilovada mikrofondan foydalanuvchi nutqini real-vaqt rejimida matnga o'girish (STT - Speech to Text).
> Token xavfsizlik maqsadida 10 daqiqa yashaydi. Mobil ilova har 9 daqiqada yangilab turishi tavsiya etiladi.

### 📍 Endpoint:

`GET https://kaiwa.live/api/speech-token`  
_(Mehmonlar uchun: `GET https://kaiwa.live/api/speech-token?mode=guest`)_

### 📥 Javob Formati:

```json
{
  "token": "eyJhbGciOiJFUzI1NiIsImtpZCI6ImtleTEi...",
  "region": "swedencentral",
  "expiresIn": 600
}
```

### 📱 Mobil SDK Bilan Integratsiya:

Azure Cognitive Services Speech SDK mobil ilovada to'g'ridan-to'g'ri `SpeechTranslationConfig.fromAuthorizationToken(token, region)` orqali ulanadi. Foydalanuvchi nutqining aniqlik ko'rsatkichi (Pronunciation Assessment) ham aynan shu token orqali olinadi.

---

## 7. O'quv Darsliklari va Leksika (Curriculum & Decks)

Platforma barcha o'quv materiallarini (Minna no Nihongo 1-50 va JLPT N5-N1) strukturaviy JSON formatida saqlaydi.

### 🗂️ Asosiy Fleshkarta To'plamlari (Decks):

| To'plam ID               | Nomi                                      | Karta soni | Daraja  |
| :----------------------- | :---------------------------------------- | :--------- | :------ |
| `deck_minna_shokyu1`     | Minna no Nihongo Shokyu 1 (1–25 darslar)  | 1,078 ta   | JLPT N5 |
| `deck_minna_shokyu2`     | Minna no Nihongo Shokyu 2 (26–50 darslar) | 427 ta     | JLPT N4 |
| `deck_n3_thematic_vocab` | JLPT N3 Tematik Leksika Master            | 672 ta     | JLPT N3 |
| `deck_jlpt_n5`           | JLPT N5 Master Deck                       | 218 ta     | JLPT N5 |
| `deck_n5_test_bank`      | N5 Original 70 Test Savollari             | 70 ta      | JLPT N5 |

### 🗃️ Fleshkarta Ma'lumotlar Strukturasi (Schema):

```json
{
  "front": "わたし",
  "back": "men",
  "phonetic": "わたし - watashi",
  "example": "わたしは 学生 です。 (Men talabaman.)",
  "category": "Minna no Nihongo 1-dars",
  "level": "N5"
}
```

---

## 8. Spaced Repetition System (SRS Flashcard Algoritmi)

Mobil ilova aqlli takrorlash uchun xalqaro **SuperMemo-2 (SM-2 / MF2M)** algoritmidan foydalanadi:

### 🔢 Baholash Shkalasi (Grade: 0 dan 5 gacha):

- **5 (A'lo / Easy):** So'z hech qanday ikkilanmasdan yodga tushdi.
- **4 (Yaxshi / Good):** Kichik o'ylanish bilan to'g'ri topildi.
- **3 (Qiyin / Hard):** Zo'rg'a eslandi.
- **0–2 (Qayta / Again):** So'z eslanmadi (interval 1 kunga qaytadi).

### 🧮 Hisoblash Formulasi:

```typescript
export function calculateReview(
  grade: number,
  priorInterval: number,
  priorRepetitions: number,
  priorEaseFactor: number,
) {
  let interval = 1;
  let repetitions = 0;
  let easeFactor = Math.max(
    1.3,
    priorEaseFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)),
  );

  if (grade >= 3) {
    if (priorRepetitions === 0) interval = 1;
    else if (priorRepetitions === 1) interval = 6;
    else interval = Math.round(priorInterval * easeFactor);
    repetitions = priorRepetitions + 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return { interval, repetitions, easeFactor, nextReviewDate: nextDate.toISOString() };
}
```

---

## 9. Mobil Qurilmada Jonli Ovozli Suhbat (Voice Loop) Sikli

Mobil ilovaning eng asosiy qismi bo'lgan **AI Speaking Coach** quyidagi uzluksiz arxitektura bo'yicha ishlaydi:

```
[Foydalanuvchi Gapiradi]
          │
          ▼
[Mobil Mikrofon + VAD (Ovoz Detektori)]
   ├─ 650ms sukunat (Silence) sezilganda so'z yakunlanadi
          │
          ▼
[Azure STT / Speech-to-Text] ──> Matnga aylanadi: "こんにちは"
          │
          ▼
[POST /api/coach (stream: true)] ──(Agar xato bo'lsa)──> [POST /api/deepseek]
          │
          ▼ (Real-vaqt SSE oqimi)
[Sentence Boundary Extractor]
   ├─ Birinchi gap hosil bo'lishi bilan (masalan: "お元気ですか？")
          │
          ▼
[POST /api/tts] ──> Audio MP3 buferi olinadi
          │
          ▼
[Mobil Dinamik (Audio Speaker)] ──> Foydalanuvchiga eshittiriladi
```

---

## 10. Mobil AI Agent Uchun Qat'iy Qoidalar (Best Practices)

1. **Xavfsizlik:** Mobil ilova `.env` fayliga hech qachon OpenAI yoki Azure xususiy kalitlarini yozmang. Faqat `https://kaiwa.live/api/*` shlyuzlaridan foydalaning.
2. **Kesh va Oflayn:** Har bir generatsiya qilingan TTS audio faylni mobil xotirada (`FileSystem.cacheDirectory`) saqlang. Agar foydalanuvchi bir xil gapni qayta eshitmoqchi bo'lsa, tarmoqqa qayta so'rov yubormang (0ms playback).
3. **Zaxira Zanjiri (Resilience):** Har qanday AI so'rovida quyidagi zanjirga amal qiling:
   `Azure OpenAI` ➡️ _(muvaffaqiyatsiz bo'lsa)_ ➡️ `DeepSeek` ➡️ _(muvaffaqiyatsiz bo'lsa)_ ➡️ `Lokal muloyim xatolik xabari`.
4. **Barge-in (Gapni bo'lish imkoniyati):** Foydalanuvchi murabbiy gapirayotgan paytda gapirsa, faol ijro etilayotgan audioni darhol to'xtating (`sound.stopAsync()`).
5. **Deduplikatsiya:** Har qanday fleshkarta ro'yxatini ko'rsatishdan oldin har doim `card.front.trim().toLowerCase()` kaliti bo'yicha filtrlang.

---

_kaiwa.live — Production Engineering Team._
