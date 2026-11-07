import { test, expect } from '@playwright/test';

test.use({
  permissions: ['microphone'],
  launchOptions: {
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Exercise the UI's playback lifecycle without a hardware audio clock.
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined });
    Object.defineProperty(window, 'webkitAudioContext', { configurable: true, value: undefined });
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (!this.src.startsWith('blob:')) return play.call(this);
      if ((window as any).__blockCoachAudio) {
        return Promise.reject(new DOMException('Playback blocked', 'NotAllowedError'));
      }
      const source = this.src;
      setTimeout(() => {
        if (this.src === source) this.dispatchEvent(new Event('ended'));
      }, 1200);
      return Promise.resolve();
    };
  });
  // Vite's local Supabase path is a live proxy, even when the browser URL is local.
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 503, json: { message: 'API has no test fixture' } }),
  );
  await page.route('**/supabase/**', (route) => {
    const request = route.request();
    if (!new URL(request.url()).pathname.startsWith('/supabase/rest/v1/')) {
      return route.fulfill({ status: 401, json: { message: 'No fixture session' } });
    }
    if (request.headers().accept?.includes('application/vnd.pgrst.object+json')) {
      return route.fulfill({ status: 406, json: { code: 'PGRST116', message: 'No fixture row' } });
    }
    return route.fulfill({ json: [] });
  });
});

// Short WAV fixture keeps the test independent of paid speech services and audio files.
function silentAudio() {
  const data = Buffer.alloc(44 + 1600);
  data.write('RIFF', 0);
  data.writeUInt32LE(data.length - 8, 4);
  data.write('WAVE', 8);
  data.write('fmt ', 12);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(8000, 24);
  data.writeUInt32LE(16000, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write('data', 36);
  data.writeUInt32LE(1600, 40);
  return data;
}

test('hands-free conversation resumes after a reply and after microphone pause', async ({
  page,
}) => {
  test.setTimeout(75000);
  await page.route('**/*', (route) => {
    const { hostname } = new URL(route.request().url());
    return ['localhost', '127.0.0.1'].includes(hostname) ? route.fallback() : route.abort();
  });
  await page.route('**/api/speech-token*', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
  );
  await page.route('**/api/tts', (route) =>
    route.fulfill({ status: 200, contentType: 'audio/wav', body: silentAudio() }),
  );
  await page.route('**/api/coach', (route) => {
    if (!route.request().postDataJSON()?.stream) {
      return route.fulfill({
        json: { choices: [{ message: { content: '{}' } }] },
      });
    }
    const content = JSON.stringify({ reply: 'いいですね。今日は何をしましたか？', new_words: [] });
    return route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`,
    });
  });
  await page.addInitScript(() => {
    const win = window as any;
    const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    const tracks: MediaStreamTrack[] = [];
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await getUserMedia(constraints);
      tracks.push(...stream.getAudioTracks());
      return stream;
    };
    win.__coachTracksStopped = () =>
      tracks.length > 0 && tracks.every((track) => track.readyState === 'ended');
    win.SpeechRecognition = class {
      onstart?: () => void;
      onend?: () => void;
      start() {
        win.__coachRecognition = this;
        win.__coachRecognitionActive = true;
        setTimeout(() => this.onstart?.(), 0);
      }
      stop() {
        win.__coachRecognitionActive = false;
        this.onend?.();
      }
      abort() {
        win.__coachRecognitionActive = false;
      }
    };
  });
  await page.goto('/speaking-coach?preview=true');
  await page.getByRole('button', { name: 'Speaking sozlamalari' }).click();
  await expect(page.getByRole('dialog', { name: 'Speaking Coach Sozlamalari' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Suhbatni boshlash', exact: true }).click();
  await expect(page.getByText('Murabbiy gapiryapti', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__coachRecognitionActive || false)).toBe(false);
  await expect(page.getByText('Tinglayapman...', { exact: true })).toBeVisible({ timeout: 30000 });
  await page.evaluate(() => {
    const result = Object.assign([{ transcript: '今日は本を読みました。' }], { isFinal: true });
    (window as any).__coachRecognition.onresult({ results: [result] });
  });
  await page.getByRole('button', { name: 'Suhbat matnini ko‘rsatish' }).click();
  await expect(page.getByRole('log')).toContainText(/いいですね。\s*今日は何をしましたか？/, {
    timeout: 25000,
  });
  await expect(page.getByText('Tinglayapman...', { exact: true })).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Mikrofonni pauza qilish' }).click();
  await expect(page.getByText('Mikrofon pauzada', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mikrofonni yoqish' }).click();
  await expect(page.getByText('Tinglayapman...', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Suhbatni yakunlash', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Suhbatni boshlash', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as any).__coachTracksStopped())).toBe(true);
  await page.getByRole('button', { name: 'Tushunarli, Yopish' }).click();
  await page.getByRole('button', { name: 'Suhbatni boshlash', exact: true }).click();
  await expect(page.getByText('Tinglayapman...', { exact: true })).toBeVisible({ timeout: 25000 });
  await page.getByRole('button', { name: 'Suhbatni yakunlash', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__coachTracksStopped())).toBe(true);
});

test('blocked audio pauses the conversation and can be retried with a user click', async ({
  page,
}) => {
  test.setTimeout(75000);
  await page.route('**/*', (route) =>
    ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)
      ? route.fallback()
      : route.abort(),
  );
  await page.route('**/api/speech-token*', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
  );
  await page.route('**/api/tts', (route) =>
    route.fulfill({ status: 200, contentType: 'audio/wav', body: silentAudio() }),
  );
  await page.addInitScript(() => {
    const win = window as any;
    win.__blockCoachAudio = true;
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined });
    win.SpeechRecognition = class {
      onstart?: () => void;
      onend?: () => void;
      start() {
        win.__coachRecognitionActive = true;
        setTimeout(() => this.onstart?.(), 0);
      }
      stop() {
        win.__coachRecognitionActive = false;
        this.onend?.();
      }
      abort() {
        win.__coachRecognitionActive = false;
      }
    };
  });
  await page.goto('/speaking-coach?preview=true');
  await page.getByRole('button', { name: 'Suhbatni boshlash', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ovozni qayta yoqish' })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByText('Mikrofon pauzada', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__coachRecognitionActive || false)).toBe(false);
  await page.evaluate(() => {
    (window as any).__blockCoachAudio = false;
  });
  await page.getByRole('button', { name: 'Ovozni qayta yoqish' }).click();
  await expect(page.getByText('Tinglayapman...', { exact: true })).toBeVisible({ timeout: 25000 });
});

test('voice-first screen has one start control on desktop and mobile', async ({ page }) => {
  await page.route('**/*', (route) =>
    ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)
      ? route.fallback()
      : route.abort(),
  );
  for (const [name, width, height] of [
    ['desktop', 1440, 900],
    ['mobile', 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/speaking-coach?preview=true');
    await expect(page.getByRole('button', { name: 'Suhbatni boshlash', exact: true })).toBeVisible({
      timeout: 25000,
    });
    await expect(page.getByRole('button', { name: 'Suhbatni boshlash', exact: true })).toHaveCount(
      1,
    );
    await expect(page.getByRole('log')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await page.screenshot({ path: `/tmp/kaiwa-voice-turn-${name}.png` });
  }
});

test('shows a permission error and leaves the microphone inactive when capture is denied', async ({
  page,
}) => {
  await page.route('**/*', (route) =>
    ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)
      ? route.fallback()
      : route.abort(),
  );
  await page.route('**/api/tts', (route) =>
    route.fulfill({ status: 200, contentType: 'audio/wav', body: silentAudio() }),
  );
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException('Denied by test fixture', 'NotAllowedError');
    };
  });
  await page.goto('/speaking-coach?preview=true');
  await page.getByRole('button', { name: 'Suhbatni boshlash', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Mikrofon ruxsati berilmadi', {
    timeout: 25000,
  });
  await expect(page.getByText('Tinglayapman...', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Suhbatni yakunlash', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Suhbatni boshlash', exact: true })).toBeVisible();
});
