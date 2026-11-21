const { chromium } = require('@playwright/test');
const path = require('path');

async function generateOgImage() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800;900&family=JetBrains+Mono:wght@600;700&family=Noto+Sans+JP:wght@700;900&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      width: 1200px;
      height: 630px;
      background-color: #0B0F19;
      background-image: 
        radial-gradient(circle at 14% 18%, rgba(232, 72, 58, 0.28) 0%, transparent 48%),
        radial-gradient(circle at 86% 75%, rgba(201, 169, 97, 0.22) 0%, transparent 46%),
        radial-gradient(circle at 50% 38%, rgba(99, 102, 241, 0.16) 0%, transparent 55%),
        radial-gradient(circle at 78% 22%, rgba(232, 72, 58, 0.15) 0%, transparent 42%);
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 50px 64px;
      overflow: hidden;
      position: relative;
    }

    body::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
      background-size: 38px 38px;
      pointer-events: none;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      z-index: 10;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .logo-box {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: linear-gradient(135deg, #1e1b2e 0%, #0f121d 100%);
      border: 2px solid rgba(232, 72, 58, 0.55);
      box-shadow: 0 12px 30px rgba(232, 72, 58, 0.35), 0 2px 8px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
    }

    .brand-names {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .brand-title-wrap {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }

    .brand-title {
      font-size: 38px;
      font-weight: 900;
      letter-spacing: -0.03em;
      color: #ffffff;
    }

    .brand-title span.crimson {
      background: linear-gradient(135deg, #f87171 0%, #E8483A 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-kanji {
      font-family: 'Noto Sans JP', sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: #C9A961;
      letter-spacing: 0.12em;
    }

    .brand-pill {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 8px;
      background: rgba(232, 72, 58, 0.16);
      border: 1px solid rgba(232, 72, 58, 0.45);
      color: #fca5a5;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .brand-tagline {
      font-size: 14px;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.01em;
    }

    .header-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 8px 16px;
      border-radius: 999px;
      backdrop-filter: blur(12px);
      font-size: 13px;
      font-weight: 700;
      color: #e2e8f0;
    }

    .header-badge .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }

    .hero-content {
      position: relative;
      z-index: 10;
      max-width: 980px;
      margin-top: 14px;
    }

    .headline {
      font-size: 47px;
      font-weight: 900;
      line-height: 1.16;
      letter-spacing: -0.035em;
      margin-bottom: 14px;
      color: #ffffff;
    }

    .headline span.highlight {
      background: linear-gradient(135deg, #f87171 0%, #E8483A 50%, #ea580c 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .headline span.gold {
      background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 60%, #fde68a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subheadline {
      font-size: 18.5px;
      font-weight: 500;
      color: #94a3b8;
      line-height: 1.45;
      max-width: 900px;
    }

    .cards-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      position: relative;
      z-index: 10;
      margin-top: 16px;
    }

    .card {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      padding: 20px 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.45);
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-icon {
      font-size: 26px;
    }

    .card-title {
      font-size: 16px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.01em;
    }

    .card-desc {
      font-size: 12.2px;
      font-weight: 500;
      color: #94a3b8;
      line-height: 1.4;
    }

    .card-badge {
      display: inline-block;
      align-self: flex-start;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 4px;
    }

    .badge-rose {
      background: rgba(232, 72, 58, 0.18);
      color: #fca5a5;
      border: 1px solid rgba(232, 72, 58, 0.4);
    }

    .badge-amber {
      background: rgba(245, 158, 11, 0.16);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.35);
    }

    .badge-indigo {
      background: rgba(99, 102, 241, 0.18);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.35);
    }

    .badge-emerald {
      background: rgba(16, 185, 129, 0.16);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.35);
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 16px;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      position: relative;
      z-index: 10;
    }

    .url-chip {
      background: rgba(255, 255, 255, 0.06);
      padding: 6px 16px;
      border-radius: 999px;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      border: 1px solid rgba(255, 255, 255, 0.12);
      letter-spacing: 0.02em;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-group">
      <div class="logo-box">
        <!-- Japanese Torii Gate Emblem -->
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="19" r="8" fill="#E8483A" opacity="0.35" />
          <path d="M4 10C14 8.5 34 8.5 44 10C45.5 10.2 45.5 12.5 44 13C34 11.5 14 11.5 4 13C2.5 12.5 2.5 10.2 4 10Z" fill="#FFFFFF" />
          <path d="M7 14H41V16.8H7V14Z" fill="#FFFFFF" />
          <rect x="22" y="16.8" width="4" height="5.2" rx="0.5" fill="#C9A961" />
          <path d="M5 22H43V24.8H5V22Z" fill="#FFFFFF" />
          <path d="M12.5 16.8L11 41H15L16 16.8H12.5Z" fill="#FFFFFF" />
          <path d="M32 16.8L33 41H37L35.5 16.8H32Z" fill="#FFFFFF" />
          <rect x="9" y="40" width="7" height="3" rx="1" fill="#C9A961" opacity="0.9" />
          <rect x="32" y="40" width="7" height="3" rx="1" fill="#C9A961" opacity="0.9" />
        </svg>
      </div>
      <div class="brand-names">
        <div class="brand-title-wrap">
          <span class="brand-title">Kaiwa <span class="crimson">Live</span></span>
          <span class="brand-kanji">会話ライブ</span>
          <span class="brand-pill">JLPT N5–N1 & KAIWA</span>
        </div>
        <span class="brand-tagline">AI Yordamida Yapon Tilini Tizimli O'rganish Platformasi</span>
      </div>
    </div>

    <div class="header-badge">
      <span class="dot"></span>
      <span>JLPT Official Standard</span>
    </div>
  </div>

  <div class="hero-content">
    <h1 class="headline">
      <span class="highlight">JLPT N5–N1</span> Imtihoniga Tayyorlaning & <br/>
      <span class="gold">AI Speaking Sensei</span> Bilan Erkin Gapiring
    </h1>
    <p class="subheadline">
      Yuki sensei bilan jonli audio Kaiwa suhbati, 2000+ Kanji, interaktiv grammatika va Anki SM-2 aqlli fleshkartalari.
    </p>
  </div>

  <div class="cards-row">
    <div class="card">
      <div class="card-top">
        <div class="card-icon">🗣️</div>
        <span class="card-badge badge-rose">Kaiwa & Menya</span>
      </div>
      <div class="card-title">AI Speaking Sensei</div>
      <div class="card-desc">Yuki sensei bilan real vaqtda ovozli erkin muloqot va talaffuz tahlili</div>
    </div>

    <div class="card">
      <div class="card-top">
        <div class="card-icon">⛩️</div>
        <span class="card-badge badge-indigo">N5–N1 Sinov</span>
      </div>
      <div class="card-title">JLPT Mock Imtihonlar</div>
      <div class="card-desc">Moji/Goi, Dokkai va Choukai to'liq testlari, ballar va xatolar tahlili</div>
    </div>

    <div class="card">
      <div class="card-top">
        <div class="card-icon">✍️</div>
        <span class="card-badge badge-amber">Stroke & Bunpou</span>
      </div>
      <div class="card-title">Kanji & Grammatika</div>
      <div class="card-desc">Interaktiv chizish, mnemonika va misol gaplar bilan qadam-baqadam darslar</div>
    </div>

    <div class="card">
      <div class="card-top">
        <div class="card-icon">🎴</div>
        <span class="card-badge badge-emerald">Spaced Repetition</span>
      </div>
      <div class="card-title">Anki SM-2 Fleshkartalar</div>
      <div class="card-desc">Unutilish egri chizig'iga asoslangan aqlli interval takrorlash tizimi</div>
    </div>
  </div>

  <div class="footer">
    <span>© 2026 Kaiwa Live. Barcha huquqlar himoyalangan.</span>
    <span class="url-chip">kaiwa.live</span>
  </div>
</body>
</html>
  `;

  await page.setContent(htmlContent);
  await page.waitForLoadState('networkidle');

  const publicDir = path.resolve(__dirname, '../public');
  const jpgPath = path.join(publicDir, 'og-image.jpg');
  const pngPath = path.join(publicDir, 'og-image.png');

  await page.screenshot({ path: jpgPath, type: 'jpeg', quality: 88 });
  await page.screenshot({ path: pngPath, type: 'png' });

  console.log('✅ Generated Kaiwa Live og-image.jpg and og-image.png successfully in:', publicDir);
  await browser.close();
}

generateOgImage().catch((err) => {
  console.error('Error generating og image:', err);
  process.exit(1);
});
