#!/bin/bash

# kaiwa.live - Telegram Webhook xavfsizligini o'rnatish skripti
# Bu skript Supabase va Telegram API ga maxfiy tokenni biriktiradi.

echo "🤖 Telegram Bot Webhook xavfsizligini o'rnatish"
echo "------------------------------------------------"

# Check if .env.local exists to extract bot token
if [ ! -f .env.local ]; then
    echo "⚠️ .env.local fayli topilmadi."
    read -p "Iltimos Telegram Bot Tokenni kiriting (masalan: 12345:ABCDE): " BOT_TOKEN
else
    # Extract token from .env.local if exists
    BOT_TOKEN=$(grep VITE_TELEGRAM_BOT_TOKEN .env.local | cut -d '=' -f2)
    if [ -z "$BOT_TOKEN" ]; then
        read -p "Iltimos Telegram Bot Tokenni kiriting (masalan: 12345:ABCDE): " BOT_TOKEN
    fi
fi

read -p "Supabase loyiha kodingizni kiriting (masalan: unizkxxxxx...): " PROJECT_REF

if [ -z "$BOT_TOKEN" ] || [ -z "$PROJECT_REF" ]; then
    echo "❌ Xato: Token va loyiha kodi (Project Reference) kiritilishi shart!"
    exit 1
fi

# 1. 16 belgili tasodifiy xavfsiz kalit yaratish
SECRET_TOKEN=$(LC_ALL=C tr -dc A-Za-z0-9 </dev/urandom | head -c 16)
echo ""
echo "✅ Maxfiy kalit yaratildi: $SECRET_TOKEN"

# 2. Supabase secrets ga yuklash
echo "⏳ Supabase ga maxfiy kalit o'rnatilmoqda..."
npx supabase secrets set TELEGRAM_WEBHOOK_SECRET="$SECRET_TOKEN" --project-ref "$PROJECT_REF"
if [ $? -ne 0 ]; then
    echo "❌ Supabase ga kalitni yuklashda xatolik! Supabase CLI da avtorizatsiya (npx supabase login) qilinganligiga ishonch hosil qiling."
    exit 1
fi

# 3. Webhook manzilini Telegram ga yangi secret bilan birga o'rnatish
WEBHOOK_URL="https://$PROJECT_REF.supabase.co/functions/v1/telegram-bot"
echo "⏳ Telegram API orqali webhook yangilanmoqda..."

curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
        "url": "'$WEBHOOK_URL'",
        "secret_token": "'$SECRET_TOKEN'"
      }' > /dev/null

echo ""
echo "✅ Barcha ishlar muvaffaqiyatli yakunlandi!"
echo "Telegram bot endi quyidagi URL manzilni faqat maxfiy kalit bilan qabul qiladi:"
echo "📍 $WEBHOOK_URL"
echo ""
echo "Muhim: Endi bot faqatgina Telegram-dan kelgan haqiqiy so'rovlarga javob beradi. Hakerlar botingizga soxta buyruq yubora olmaydi."
