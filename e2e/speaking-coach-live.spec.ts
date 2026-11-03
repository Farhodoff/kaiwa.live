import { test, expect } from '@playwright/test';

test.use({
  permissions: ['microphone'],
  launchOptions: {
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
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
  test.setTimeout(45000);
  await page.route('**/*', (route) => {
    const { hostname } = new URL(route.request().url());
    return ['localhost', '127.0.0.1'].includes(hostname) ? route.continue() : route.abort();
  });
  await page.route('**/api/speech-token', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
  );
  await page.route('**/api/tts', (route) =>
    route.fulfill({ status: 200, contentType: 'audio/wav', body: silentAudio() }),
  );
  await page.route('**/api/deepseek', (route) => {
    const content = JSON.stringify({ reply: 'いいですね。今日は何をしましたか？', new_words: [] });
    return route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`,
    });
  });
  await page.addInitScript(() => {
    const win = window as any;
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
  await expect(page.getByText('Tinglayapman...', { exact: true })).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => {
    const result = Object.assign([{ transcript: '今日は本を読みました。' }], { isFinal: true });
    (window as any).__coachRecognition.onresult({ results: [result] });
  });
  await page.getByRole('button', { name: 'Suhbat matnini ko‘rsatish' }).click();
  await expect(page.getByRole('log')).toContainText(/いいですね。\s*今日は何をしましたか？/, {
    timeout: 15000,
  });
  await expect(page.getByText('Tinglayapman...', { exact: true })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Mikrofonni pauza qilish' }).click();
  await expect(page.getByText('Mikrofon pauzada', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mikrofonni yoqish' }).click();
  await expect(page.getByText('Tinglayapman...', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Suhbatni yakunlash', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Suhbatni boshlash', exact: true })).toBeVisible();
});

test('blocked audio pauses the conversation and can be retried with a user click', async ({
  page,
}) => {
  test.setTimeout(45000);
  await page.route('**/*', (route) =>
    ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
  await page.route('**/api/speech-token', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
  );
  await page.route('**/api/tts', (route) =>
    route.fulfill({ status: 200, contentType: 'audio/wav', body: silentAudio() }),
  );
  await page.addInitScript(() => {
    const win = window as any;
    win.__blockCoachAudio = true;
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (win.__blockCoachAudio && this.src.startsWith('blob:'))
        return Promise.reject(new DOMException('Playback blocked', 'NotAllowedError'));
      return play.call(this);
    };
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined });
    Object.defineProperty(window, 'webkitAudioContext', { configurable: true, value: undefined });
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
    timeout: 20000,
  });
  await expect(page.getByText('Mikrofon pauzada', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__coachRecognitionActive || false)).toBe(false);
  await page.evaluate(() => {
    (window as any).__blockCoachAudio = false;
  });
  await page.getByRole('button', { name: 'Ovozni qayta yoqish' }).click();
  await expect(page.getByText('Tinglayapman...', { exact: true })).toBeVisible({ timeout: 15000 });
});

test('voice-first screen has one start control on desktop and mobile', async ({ page }) => {
  await page.route('**/*', (route) =>
    ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
  for (const [name, width, height] of [
    ['desktop', 1440, 900],
    ['mobile', 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/speaking-coach?preview=true');
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
