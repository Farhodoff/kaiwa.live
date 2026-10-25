import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Validating kaiwa.live SEO Infrastructure...\n');

let errors = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${desc}`);
  } catch (err) {
    errors++;
    console.error(`❌ FAIL: ${desc} -> ${err.message}`);
  }
}

// 1. Robots.txt
check('robots.txt exists and contains Sitemap and AI Bots', () => {
  const content = fs.readFileSync(path.join(rootDir, 'public', 'robots.txt'), 'utf8');
  if (!content.includes('Sitemap: https://kaiwa.live/sitemap.xml')) {
    throw new Error('Missing Sitemap declaration');
  }
  if (!content.includes('User-agent: GPTBot') || !content.includes('User-agent: PerplexityBot')) {
    throw new Error('Missing Generative AI Bot directives');
  }
});

// 2. Sitemap.xml
check('sitemap.xml exists and has valid multilingual tags', () => {
  const content = fs.readFileSync(path.join(rootDir, 'public', 'sitemap.xml'), 'utf8');
  const requiredUrls = ['/', '/jlpt', '/speaking', '/pricing', '/twa'];
  for (const u of requiredUrls) {
    if (!content.includes(`<loc>https://kaiwa.live${u === '/' ? '/' : u}</loc>`)) {
      throw new Error(`Missing route in sitemap: ${u}`);
    }
  }
  if (!content.includes('hreflang="uz"') || !content.includes('hreflang="ja"') || !content.includes('hreflang="x-default"')) {
    throw new Error('Missing multilingual hreflang attributes');
  }
});

// 3. llms.txt (GEO standard)
check('llms.txt exists with structured platform documentation', () => {
  const content = fs.readFileSync(path.join(rootDir, 'public', 'llms.txt'), 'utf8');
  if (!content.includes('Kaiwa Live') || !content.includes('JLPT Master Hub')) {
    throw new Error('llms.txt is incomplete');
  }
});

// 4. index.html JSON-LD Structured Data
check('index.html contains valid JSON-LD with Course, WebSite, and FAQ schemas', () => {
  const content = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const match = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error('No JSON-LD script found in index.html');
  const parsed = JSON.parse(match[1]);
  if (!parsed['@graph'] || !Array.isArray(parsed['@graph'])) {
    throw new Error('JSON-LD @graph missing or not an array');
  }
  const types = parsed['@graph'].map((item) => item['@type']);
  const requiredTypes = ['WebApplication', 'WebSite', 'Organization', 'Course', 'FAQPage'];
  for (const t of requiredTypes) {
    if (!types.includes(t)) throw new Error(`Missing schema type: ${t}`);
  }
});

console.log('\n----------------------------------------');
if (errors === 0) {
  console.log('🎉 All SEO validation checks passed successfully!');
  process.exit(0);
} else {
  console.error(`🚨 Failed with ${errors} SEO validation errors.`);
  process.exit(1);
}
