import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, Save, Search } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import {
  CurriculumQualityQueueService,
  filterQueueIssues,
  validateRevisionDraft,
  type CurriculumIssueStatus,
  type CurriculumQueueIssue,
} from '../../services/CurriculumQualityQueueService';

const STATUSES: CurriculumIssueStatus[] = ['detected', 'triaged', 'assigned', 'in_progress', 'ready_for_review', 'expert_approved', 'published', 'rejected', 'reopened', 'quarantined'];
const PAGE_SIZE = 25;
const requiredReason = new Set<CurriculumIssueStatus>(['rejected', 'reopened', 'quarantined']);

export function CurriculumQualityQueue() {
  const [issues, setIssues] = useState<CurriculumQueueIssue[]>([]);
  const [selected, setSelected] = useState<CurriculumQueueIssue | null>(null);
  const [query, setQuery] = useState(''); const [level, setLevel] = useState(''); const [status, setStatus] = useState('');
  const [page, setPage] = useState(0); const [busy, setBusy] = useState(false); const [reason, setReason] = useState('');
  const [owner, setOwner] = useState(''); const [contentVersion, setContentVersion] = useState(''); const [draft, setDraft] = useState('');

  const load = async () => {
    setBusy(true);
    try { setIssues(await CurriculumQualityQueueService.list()); }
    catch (error) { toast({ title: 'Navbat yuklanmadi', description: error instanceof Error ? error.message : 'Ruxsat yoki tarmoq xatosi', variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => { setPage(0); }, [query, level, status]);
  useEffect(() => { setReason(''); setOwner(selected?.owner_name ?? ''); setContentVersion(''); setDraft(selected ? JSON.stringify(selected.original_content, null, 2) : ''); }, [selected]);
  const filtered = useMemo(() => filterQueueIssues(issues, query, level, status), [issues, query, level, status]);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const sync = async () => {
    setBusy(true);
    try { const count = await CurriculumQualityQueueService.sync(); await load(); toast({ title: 'Curriculum audit sinxronlandi', description: `${count} ta aktiv strukturaviy muammo navbatga yozildi.` }); }
    catch (error) { toast({ title: 'Sinxronlash bajarilmadi', description: error instanceof Error ? error.message : 'Faqat admin sinxronlashi mumkin.', variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const transition = async (next: CurriculumIssueStatus) => {
    if (!selected) return;
    if (requiredReason.has(next) && !reason.trim()) { toast({ title: 'Sabab talab qilinadi', description: 'Rad etish, qayta ochish yoki karantinda izoh qoldiring.', variant: 'destructive' }); return; }
    if (next === 'published' && !contentVersion.trim()) { toast({ title: 'Versiya talab qilinadi', description: 'JSON tuzatmasi kiritilgan commit yoki release versiyasini yozing.', variant: 'destructive' }); return; }
    setBusy(true);
    try { await CurriculumQualityQueueService.transition(selected.id, next, reason, owner, contentVersion); await load(); setSelected(null); toast({ title: `Holat: ${next}` }); }
    catch (error) { toast({ title: 'Holat o‘zgarmadi', description: error instanceof Error ? error.message : 'Ruxsat yoki workflow qoidasi xatosi.', variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  const saveDraft = async () => {
    if (!selected) return;
    try {
      const content = JSON.parse(draft) as Record<string, unknown>; const validation = validateRevisionDraft(content);
      if (!validation.valid) { toast({ title: 'Draft tekshiruvdan o‘tmadi', description: validation.errors.join(' '), variant: 'destructive' }); return; }
      setBusy(true); await CurriculumQualityQueueService.createRevision(selected.id, content, validation, reason); toast({ title: 'Taklif qilingan tuzatish saqlandi', description: 'Bu hali JSON faylini o‘zgartirmaydi.' });
    } catch { toast({ title: 'JSON noto‘g‘ri', description: 'Draft JSON formatini tekshiring.', variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  return <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-lg font-bold">JLPT Curriculum Quality Queue</h2><p className="mt-1 text-sm text-slate-400">JSON manba fayllari audit qilinadi; DB faqat review va audit trail saqlaydi.</p></div>
      <button onClick={() => void sync()} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"><RefreshCw size={16} /> Auditni sinxronlash</button>
    </div>
    <div className="mt-4 grid gap-3 md:grid-cols-4">
      <label className="relative md:col-span-2"><Search className="absolute left-3 top-3 text-slate-500" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Lesson, exercise yoki matn qidirish" className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm" /></label>
      <select value={level} onChange={(event) => setLevel(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"><option value="">Barcha darajalar</option>{['N5','N4','N3','N2','N1'].map((value) => <option key={value}>{value}</option>)}</select>
      <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"><option value="">Barcha holatlar</option>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select>
    </div>
    <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800"><table className="w-full text-left text-sm"><thead className="bg-slate-900 text-xs uppercase text-slate-400"><tr><th className="p-3">Level</th><th className="p-3">Dars / mashq</th><th className="p-3">Muammo</th><th className="p-3">Holat</th><th className="p-3">Yangilangan</th></tr></thead><tbody>{visible.map((issue) => <tr key={issue.id} onClick={() => setSelected(issue)} className="cursor-pointer border-t border-slate-800 hover:bg-slate-900/70"><td className="p-3 font-bold">{issue.level}</td><td className="p-3"><div>{issue.lesson_id}</div><div className="text-xs text-slate-500">{issue.exercise_id}</div></td><td className="p-3"><div className="font-medium">{issue.issue_code}</div><div className="max-w-md truncate text-xs text-slate-400">{issue.prompt}</div></td><td className="p-3"><span className={issue.severity === 'critical' ? 'text-rose-300' : 'text-amber-300'}>{issue.status}</span></td><td className="p-3 text-xs text-slate-400">{new Date(issue.updated_at).toLocaleString()}</td></tr>)}{visible.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Ko‘rsatish uchun muammo yo‘q. Admin sifatida auditni sinxronlang.</td></tr>}</tbody></table></div>
    <div className="mt-3 flex items-center justify-between text-sm text-slate-400"><span>{filtered.length} ta natija</span><div className="flex gap-2"><button disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="rounded border border-slate-700 px-2 py-1 disabled:opacity-40">Oldingi</button><span className="py-1">{page + 1} / {pages}</span><button disabled={page + 1 >= pages} onClick={() => setPage((value) => value + 1)} className="rounded border border-slate-700 px-2 py-1 disabled:opacity-40">Keyingi</button></div></div>
    {selected && <div className="mt-5 rounded-xl border border-indigo-900 bg-slate-900 p-4"><div className="flex justify-between gap-3"><div><h3 className="font-bold">{selected.lesson_id} · {selected.exercise_id}</h3><p className="text-xs text-slate-400">{selected.source_file} · hash {selected.source_hash}</p></div><button onClick={() => setSelected(null)} className="text-slate-400">Yopish</button></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><div><p className="mb-2 text-sm font-semibold">Asl JSON (read-only)</p><pre className="max-h-96 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-300">{JSON.stringify(selected.original_content, null, 2)}</pre></div><div><label className="mb-2 block text-sm font-semibold">Taklif qilingan tuzatish</label><textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="h-80 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs" /><div className="mt-3 flex flex-wrap gap-2"><input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Mas’ul reviewer" className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" /><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Izoh / rejection sababi" className="min-w-48 flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" /><input value={contentVersion} onChange={(event) => setContentVersion(event.target.value)} placeholder="Commit yoki release versiyasi" className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm" /></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => void saveDraft()} disabled={busy} className="inline-flex items-center gap-1 rounded bg-indigo-600 px-3 py-2 text-sm font-semibold"><Save size={15} /> Draft saqlash</button>{STATUSES.filter((value) => value !== selected.status).map((value) => <button key={value} onClick={() => void transition(value)} disabled={busy} className={value === 'published' ? 'rounded bg-emerald-700 px-2 py-1 text-xs' : 'rounded border border-slate-600 px-2 py-1 text-xs'}>{value}</button>)}</div><p className="mt-3 flex gap-2 text-xs text-amber-200"><AlertTriangle size={15} /> “published” faqat manba-kod tuzatmasi versiyasi bilan ishlaydi; bu panel bundlega yozmaydi.</p></div></div></div>}
  </section>;
}
