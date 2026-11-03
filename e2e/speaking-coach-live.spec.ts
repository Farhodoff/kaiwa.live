import { test, expect } from '@playwright/test';

test.use({
  permissions: ['microphone'],
  launchOptions: {
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
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
        setTimeout(() => this.onstart?.(), 0);
      }
      stop() {
        this.onend?.();
      }
      abort() {}
    };
  });
  await page.goto('/speaking-coach?preview=true');
  await page.getByRole('button', { name: 'Speaking sozlamalari' }).click();
  await expect(page.getByRole('dialog', { name: 'Speaking Coach Sozlamalari' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Gapirish uchun bosing', exact: true }).click();
  await expect(page.getByText('Tinglayapman...', { exact: true })).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => {
    const result = Object.assign([{ transcript: '今日は本を読みました。' }], { isFinal: true });
    (window as any).__coachRecognition.onresult({ results: [result] });
  });
  await expect(page.getByRole('log')).toContainText(/いいですね。\s*今日は何をしましたか？/, {
    timeout: 15000,
  });
  await expect(page.getByText('Tinglayapman...', { exact: true })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Mikrofonni pauza qilish' }).click();
  await expect(page.getByText('Mikrofon pauzada', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mikrofonni yoqish' }).click();
  await expect(page.getByText('Tinglayapman...', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Suhbatni yakunlash', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Gapirish uchun bosing', exact: true }),
  ).toBeVisible();
});
