import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
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
