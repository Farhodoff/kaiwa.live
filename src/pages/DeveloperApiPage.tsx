import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Copy, Check, Send, ArrowLeft } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { KaizenAI } from '../sdk/kaizen-sdk';
import { AppLogo } from '../components/AppLogo';
import { useSEO } from '../hooks/useSEO';

const DeveloperApiPage: React.FC = () => {
  useSEO({
    title: 'Developer Portal & REST API Documentation',
    description:
      'kaiwa.live Developer API va TypeScript SDK. JLPT Scoring, Flashcard AI Generator va Anki SM-2 SRS API integratsiyasi.',
    canonical: '/developers',
    keywords: 'kaiwa.live API, JLPT API, Flashcard API, Anki SM-2 REST API, educational API SDK',
  });

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'flashcards' | 'srs'>('flashcards');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Playground States
  const [fcTopic, setFcTopic] = useState('Japanese JLPT N3 Travel Vocabulary');
  const [srsQuality, setSrsQuality] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaiwa.live';

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast({ title: 'Nusxa olindi! 📋', description: 'Kod buferga muvaffaqiyatli saqlandi.' });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const runPlayground = async () => {
    setIsLoading(true);
    setApiResponse(null);
    try {
      const client = new KaizenAI({ baseUrl });
      let res;
      if (activeTab === 'flashcards') {
        res = await client.flashcards.generate({ topic: fcTopic, count: 3 });
      } else if (activeTab === 'srs') {
        res = await client.srs.calculateNextReview({
          quality: srsQuality,
          repetitions: 1,
          interval: 1,
          easeFactor: 2.5,
        });
      }
      setApiResponse(res);
      toast({ title: "✅ So'rov muvaffaqiyatli bajarildi!" });
    } catch (e: any) {
      console.error(e);
      setApiResponse({ error: e.message || 'API request failed' });
      toast({ title: 'Xatolik', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurlSnippet = () => {
    if (activeTab === 'flashcards') {
      return `curl -X POST "${baseUrl}/api/v1/flashcards-generate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "topic": "${fcTopic}",
    "count": 5
  }'`;
    }
    return `curl -X POST "${baseUrl}/api/v1/srs" \\
  -H "Content-Type: application/json" \\
  -d '{
    "quality": ${srsQuality},
    "repetitions": 1,
    "interval": 1,
    "easeFactor": 2.5
  }'`;
  };

  const getJsSnippet = () => {
    if (activeTab === 'flashcards') {
      return `const response = await fetch("${baseUrl}/api/v1/flashcards-generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    topic: "${fcTopic}",
    count: 5
  })
});
const { data } = await response.json();
console.log("Generated Cards:", data);`;
    }
    return `const response = await fetch("${baseUrl}/api/v1/srs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ quality: ${srsQuality}, repetitions: 1, interval: 1, easeFactor: 2.5 })
});
const { data } = await response.json();
console.log("Next Review Date:", data.nextReviewDate);`;
  };

  const getPythonSnippet = () => {
    if (activeTab === 'flashcards') {
      return `import requests

url = "${baseUrl}/api/v1/flashcards-generate"
payload = {
    "topic": "${fcTopic}",
    "count": 5
}
response = requests.post(url, json=payload)
print("Kartochkalar:", response.json())`;
    }
    return `import requests

url = "${baseUrl}/api/v1/srs"
payload = {
    "quality": ${srsQuality},
    "repetitions": 1,
    "interval": 1,
    "easeFactor": 2.5
}
response = requests.post(url, json=payload)
print("Keyingi takrorlash:", response.json())`;
  };

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground duration-300 animate-in fade-in">
      {/* Top Navbar */}
      <div className="sticky top-0 z-40 mb-8 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Orqaga"
          >
            <ArrowLeft size={18} />
          </button>
          <AppLogo size="sm" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="rounded-xl px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Asosiy Sahifa
          </button>
          <button
            onClick={() => navigate('/login')}
            className="rounded-xl px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Kirish
          </button>
          <button
            onClick={() => navigate('/register')}
            className="hover:scale-102 rounded-xl bg-primary px-4 py-1.5 text-xs font-black text-primary-foreground shadow-xs transition-all"
          >
            Ro'yxatdan o'tish
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Terminal size={14} />
              kaiwa.live Developer Suite & Public API
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Dasturchilar Uchun Ochiq API & SDK
            </h1>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
              Istalgan tashqi loyihangizdan (Telegram bot, Mobil ilova, React/Next.js, Python)
              kaiwa.live imkoniyatlarini chaqiring.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              CORS: Barcha domenlarga ochiq (*)
            </span>
          </div>
        </div>

        {/* Quick Feature Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            {
              title: '🎴 Flashcard Generator API',
              desc: "Mavzu bo'yicha avtomatik so'z va kartochkalar yaratish.",
              path: '/api/v1/flashcards-generate',
            },
            {
              title: '🧠 SM-2 SRS Algorithm API',
              desc: "Unutish egri chizig'iga mos interval takrorlash hisoblash.",
              path: '/api/v1/srs',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="space-y-2 rounded-2xl border border-border bg-card p-5 shadow-xs"
            >
              <div className="text-sm font-extrabold text-foreground">{item.title}</div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
              <div className="pt-1 font-mono text-[11px] text-primary">{item.path}</div>
            </div>
          ))}
        </div>

        {/* Main Interactive Playground & Code Viewer */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: API Selector & Playground */}
          <div className="space-y-5 lg:col-span-5">
            <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  1. ENDPOINT TANLASH
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setActiveTab('flashcards');
                    setApiResponse(null);
                  }}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    activeTab === 'flashcards'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Fleshkartalar
                </button>
                <button
                  onClick={() => {
                    setActiveTab('srs');
                    setApiResponse(null);
                  }}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    activeTab === 'srs'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  SM-2 SRS
                </button>
              </div>

              {/* Inputs based on endpoint */}
              <div className="space-y-3 pt-2">
                {activeTab === 'flashcards' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                      Generatsiya Mavzusi ("topic"):
                    </label>
                    <input
                      type="text"
                      value={fcTopic}
                      onChange={(e) => setFcTopic(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/50 p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                )}

                {activeTab === 'srs' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                      Eslab Qolish Sifati ("quality" 0 dan 5 gacha): {srsQuality}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      value={srsQuality}
                      onChange={(e) => setSrsQuality(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                )}

                <button
                  onClick={runPlayground}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-black text-primary-foreground shadow-md transition-all hover:scale-[1.01] active:scale-95"
                >
                  <Send size={14} className={isLoading ? 'animate-spin' : ''} />
                  <span>
                    {isLoading ? 'Yuborilmoqda...' : "Jonli So'rov Yuborish (Test Request)"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Code Snippets & Response */}
          <div className="space-y-4 lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
              <div className="flex items-center justify-between border-b border-border bg-muted/50 p-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  KOD NAMUNALARI (SNIPPETS)
                </span>
                <button
                  onClick={() => handleCopy(getCurlSnippet(), 'curl')}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  {copiedCode === 'curl' ? <Check size={13} /> : <Copy size={13} />}
                  cURL Nusxalash
                </button>
              </div>

              {/* Tabs / Code box */}
              <div className="space-y-4 overflow-x-auto bg-[#0d1117] p-4 font-mono text-xs text-[#e6edf3]">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase text-gray-400">
                    // cURL (Terminal / Bash)
                  </div>
                  <pre className="whitespace-pre-wrap text-emerald-400">{getCurlSnippet()}</pre>
                </div>

                <div className="border-t border-gray-800 pt-2">
                  <div className="mb-1 text-[10px] font-bold uppercase text-gray-400">
                    // JavaScript / TypeScript (Node.js & Frontend)
                  </div>
                  <pre className="whitespace-pre-wrap text-cyan-300">{getJsSnippet()}</pre>
                </div>

                <div className="border-t border-gray-800 pt-2">
                  <div className="mb-1 text-[10px] font-bold uppercase text-gray-400">
                    // Python (requests)
                  </div>
                  <pre className="whitespace-pre-wrap text-yellow-300">{getPythonSnippet()}</pre>
                </div>
              </div>
            </div>

            {/* Live JSON Response Viewer */}
            {apiResponse && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs duration-200 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-black text-emerald-600 dark:text-emerald-400">
                  <span>SERVER JAVOBI (HTTP 200 OK):</span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(apiResponse, null, 2), 'response')}
                    className="flex items-center gap-1 hover:underline"
                  >
                    {copiedCode === 'response' ? <Check size={13} /> : <Copy size={13} />}
                    JSON Nusxalash
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto bg-[#0d1117] p-4 font-mono text-xs text-emerald-400">
                  <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperApiPage;
