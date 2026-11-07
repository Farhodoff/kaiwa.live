import { expect, test } from '@playwright/test';

test.use({ trace: 'off' });
test.skip(process.env.RUN_AZURE_INTEGRATION_TESTS !== 'true', 'Opt-in real Azure Speech test');

test('issues a Kaiwa Speech token and synthesizes a Japanese phrase in Azure', async () => {
  const base = process.env.AZURE_INTEGRATION_BASE_URL ?? '';
  const target = URL.canParse(base) ? new URL(base) : null;
  const credential = process.env.AZURE_INTEGRATION_SUPABASE_JWT;
  if (
    !credential ||
    !target ||
    target.protocol !== 'https:' ||
    target.username ||
    target.password ||
    ['kaiwa.live', 'www.kaiwa.live'].includes(target.hostname)
  ) {
    throw new Error('Configure an authorized HTTPS staging origin and a test-account session.');
  }

  let step = 'Kaiwa Speech token';
  let status: number | undefined;
  try {
    const tokenResponse = await fetch(new URL('/api/speech-token', target), {
      headers: { Authorization: `Bearer ${credential}` },
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    status = tokenResponse.status;
    if (!tokenResponse.ok) throw new Error(`HTTP ${tokenResponse.status}`);
    const { token, region } = await tokenResponse.json();
    if (
      typeof token !== 'string' ||
      !token ||
      typeof region !== 'string' ||
      !/^[a-z0-9]+$/.test(region)
    ) {
      throw new Error('Invalid token response structure');
    }

    step = 'Azure Speech synthesis';
    status = undefined;
    const audio = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm',
      },
      body: '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP"><voice name="ja-JP-NanamiNeural">こんにちは</voice></speak>',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
    status = audio.status;
    if (!audio.ok) throw new Error(`HTTP ${audio.status}`);
    const bytes = Buffer.from(await audio.arrayBuffer());
    expect(bytes.length).toBeGreaterThan(44);
    expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
  } catch {
    throw new Error(`${step} verification failed (HTTP ${status ?? 'unavailable'}).`);
  }
});
