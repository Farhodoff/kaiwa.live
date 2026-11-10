import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';
import { initErrorTracking } from './lib/errorTracking';
import { installConsoleShield } from './lib/consoleFilter';
import { VersionUpdateService } from './services/VersionUpdateService';

import './index.css';

// Xavfsiz konsol filtri va Cookie tozalagichni faollashtirish
installConsoleShield();

// Sentry / Error tracking tizimini ishga tushirish
initErrorTracking();

// Real-time kesh tozalash va yangi versiyani kuzatish xizmatlarini ishga tushirish
VersionUpdateService.startPeriodicCheck(30000);
VersionUpdateService.setupChunkErrorRecovery();

// PWA service worker-ni ro'yxatdan o'tkazish va avtomatik yangilash
let isRefreshing = false;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (isRefreshing) return;
    isRefreshing = true;
    console.info('[PWA] Yangi versiya faollashdi. Sahifa avtomatik yangilanmoqda...');
    window.location.reload();
  });
}

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      registration.update().catch(() => {});
      setInterval(() => {
        registration.update().catch(() => {});
      }, 30 * 1000);
    }
  },
  onNeedRefresh() {
    console.info('[PWA] Yangi versiya aniqlandi, kesh tozalab avtomatik o‘rnatilmoqda...');
    VersionUpdateService.applyUpdate();
  },
  onRegisterError(error) {
    console.warn('[PWA] ServiceWorker registration warning:', error);
  },
});

// Yangi deploydan keyin keshdagi eski chunklar 404 berganda keshni tozalab avtomatik yangilash
window.addEventListener('vite:preloadError', async (event) => {
  event.preventDefault();
  console.warn(
    '[Vite] Dynamic import preload error detected. Keshlarni tozalab qayta yuklanmoqda...',
  );
  await VersionUpdateService.applyUpdate();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
