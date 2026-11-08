import http from 'node:http';
import assert from 'node:assert/strict';

const sizes = (process.env.HTTP_431_SIZES || '0,4096,8192,18000').split(',').map(Number);
assert(sizes.length >= 2 && sizes.length <= 6 && sizes[0] === 0 &&
  sizes.every((size, i) => Number.isInteger(size) && size >= 0 && size <= 32768 &&
    (i === 0 || (size >= 5 && size > sizes[i - 1]))), 'Use 2–6 increasing cookie sizes from 0 to 32768 bytes.');

const configured = process.env.HTTP_431_TARGET;
const local = !configured;
let server;
let target;
if (local) {
  server = http.createServer({ maxHeaderSize: 16384 }, (_req, res) => {
    res.writeHead(200, { 'X-Kaiwa-Diagnostic-Reached': '1', 'Content-Type': 'text/plain' });
    res.end('diagnostic handler reached');
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  target = new URL(`http://127.0.0.1:${server.address().port}/`);
} else {
  target = new URL(configured);
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname);
  assert(!target.username && !target.password && !target.search && !target.hash &&
    ['http:', 'https:'].includes(target.protocol), 'Use a credential-free HTTP URL.');
  assert(!['kaiwa.live', 'www.kaiwa.live'].includes(target.hostname), 'Use local or authorized staging.');
  assert(loopback || (target.protocol === 'https:' && process.env.HTTP_431_AUTHORIZED_ORIGIN === target.origin),
    'Remote probes require an explicitly authorized HTTPS staging origin.');
}

try {
  const statuses = [];
  for (const size of sizes) {
    const cookie = size ? 'diag=' + 'a'.repeat(Math.max(0, size - 5)) : '';
    const response = await fetch(target, {
      headers: cookie ? { Cookie: cookie } : {},
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    });
    const reached = response.headers.get('x-kaiwa-diagnostic-reached') === '1';
    const reader = response.body?.getReader();
    const body = await reader?.read();
    await reader?.cancel();
    statuses.push(response.status);
    console.log(JSON.stringify({
      cookieHeaderBytes: cookie ? Buffer.byteLength(`Cookie: ${cookie}\r\n`) : 0,
      status: response.status,
      headers: {
        applicationMarker: reached,
        contentType: response.headers.get('content-type')?.split(';')[0] ?? null,
        hasVia: response.headers.has('via'),
        hasVercelId: response.headers.has('x-vercel-id'),
      },
      body: body?.value ? 'nonempty' : 'empty',
      middlewareReached: reached ? true : local ? false : 'unknown',
      rejectingLayer: local && response.status === 431 && !reached ? 'Node HTTP parser' : 'undetermined',
    }));
  }
  if (local && !process.env.HTTP_431_SIZES) {
    assert.equal(statuses[0], 200);
    assert.equal(statuses.at(-1), 431);
  }
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
}
