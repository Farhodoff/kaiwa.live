# Telegram Bot Setup Guide

Bu yerda Telegram botni qanday sozlash va deploy qilish ko'rsatilgan.

## 1️⃣ Bot Token ni Qo'shish

Avval tokenni `.env` fayliga qo'shishingiz kerak:

```bash
# Create .env file for Edge Functions
cd supabase/functions
cp .env.example .env

# Edit .env and add your token:
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

## 2️⃣ Local Test (Optional)

Supabase CLI orqali local test qilish:

```bash
# Start Supabase local development
supabase start

# Serve the function locally
supabase functions serve telegram-bot --env-file supabase/functions/.env --no-verify-jwt
```

Telegramda botingizni ochib `/start` yuboring.

## 3️⃣ Deploy to Supabase

```bash
# Set the secret in Supabase (production)
supabase secrets set TELEGRAM_BOT_TOKEN=your_actual_token_here

# Deploy the function
supabase functions deploy telegram-bot --no-verify-jwt
```

**Output misol:**

```
Deploying telegram-bot (project ref: abc-xyz-123)
  Deployed v1.0 in 5.2s

  https://abc-xyz-123.supabase.co/functions/v1/telegram-bot
```

## 4️⃣ Set Telegram Webhook

Telegram API ga webhook URL ni register qiling:

```bash
# Replace with your actual values:
BOT_TOKEN="your_bot_token"
WEBHOOK_URL="https://your-project-ref.supabase.co/functions/v1/telegram-bot"

curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\"}"
```

**Success response:**

```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

## 5️⃣ Test the Bot

Telegram appda botingizni oching va `/start` yuboring!

**Expected response:**

```
👋 Salom! kaiwa.live botiga xush kelibsiz! 🎓

Men sizning o'quv rejalaringizni boshqarishga yordam beraman.

Ishlatish uchun akkauntingizni bog'lash kerak:
1. Veb saytga kiring: kaiwa.live
2. Settings → Telegram Bo'limiga o'ting
3. "Telegram ni bog'lash" tugmasini bosing

Yordam kerakmi? /help buyrug'ini yuboring.
```

## 6️⃣ Verify Webhook

Webhook ishlayotganini tekshirish:

```bash
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

**Expected response:**

```json
{
  "ok": true,
  "result": {
    "url": "https://your-project.supabase.co/functions/v1/telegram-bot",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_error_date": 0,
    "max_connections": 40,
    "ip_address": "..."
  }
}
```

## Troubleshooting

### Bot javob bermayapti?

1. Webhook to'g'ri o'rnatilganini tekshiring:

   ```bash
   curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
   ```

2. Edge Function logs ni ko'ring:

   ```bash
   supabase functions logs telegram-bot
   ```

3. Webhook ni delete qilib, qaytadan o'rnating:
   ```bash
   curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook"
   ```

### Local test ishlamayapti?

- Supabase local running bo'lishini tekshiring: `supabase status`
- `.env` faylda token to'g'ri yozilganini tekshiring
- Port 54321 ochiq ekanligini tekshiring

## Next Steps

Phase 1 completed! ✅

Next:

- Phase 2: Account linking
- Phase 3: Task management commands
- Phase 4: Notifications

---

**Questions?** Check the main plan: `telegram_bot_plan.md`
