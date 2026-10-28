import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Download,
  FileJson,
  Headphones,
  Layers,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  CONTENT_AUDIT_LEVELS,
  CONTENT_MISSING_FIELDS,
  CONTENT_QUALITY_SKILLS,
  CONTENT_WORKFLOW_STATUSES,
  ContentAuditLevel,
  ContentQualityAuditService,
  ContentQualityReport,
  ContentQualitySkill,
  ContentWorkflowStatus,
  ContentMissingField,
} from '../../services/ContentQualityAuditService';

const SKILL_LABELS: Record<ContentQualitySkill, { uz: string; ja: string }> = {
  vocabulary: { uz: 'Vocabulary', ja: '語彙' },
  grammar: { uz: 'Grammar', ja: '文法' },
  kanji: { uz: 'Kanji', ja: '漢字' },
  reading: { uz: 'Reading', ja: '読解' },
  listening: { uz: 'Listening', ja: '聴解' },
};

const STATUS_LABELS: Record<ContentWorkflowStatus, { uz: string; ja: string; color: string }> = {
  draft: {
    uz: 'Draft',
    ja: '下書き',
    color: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  review: {
    uz: 'Review',
    ja: 'レビュー',
    color: 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  approved: {
    uz: 'Approved',
    ja: '承認済み',
    color: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  published: {
    uz: 'Published',
    ja: '公開済み',
    color: 'border-green-600/20 bg-green-600/10 text-green-700 dark:text-green-400',
  },
  rejected: {
    uz: 'Rejected',
    ja: '差し戻し',
    color: 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400',
  },
};

const MISSING_LABELS: Record<ContentMissingField, { uz: string; ja: string }> = {
  questionText: { uz: 'Savol matni', ja: '問題文' },
  options: { uz: 'Variantlar', ja: '選択肢' },
  correctAnswer: { uz: "To'g'ri javob", ja: '正解' },
  explanation: { uz: 'Izoh', ja: '解説' },
  passage: { uz: 'Matn / passage', ja: '本文' },
  audio: { uz: 'Audio', ja: '音声' },
};

const skillPercent = (count: number, total: number): number =>
  total > 0 ? Math.round((count / total) * 100) : 0;

const downloadFile = (content: string, filename: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const AdminContentQualityDashboard: React.FC = () => {
  const { language } = useLanguage();
  const isJa = language === 'ja';
  const [report, setReport] = useState<ContentQualityReport | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ContentAuditLevel>('N3');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await ContentQualityAuditService.fetchReport();
      setReport(next);
    } catch (err: any) {
      setError(err?.message || 'Audit hisobotini yuklab bo‘lmadi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const selected = useMemo(
    () => report?.levels.find((level) => level.level === selectedLevel) || null,
    [report, selectedLevel],
  );

  const exportReport = (format: 'json' | 'csv') => {
    if (!report) return;
    const date = new Date().toISOString().slice(0, 10);
    if (format === 'json') {
      downloadFile(
        ContentQualityAuditService.toJSON(report),
        `jlpt_content_quality_audit_${date}.json`,
        'application/json;charset=utf-8',
      );
      return;
    }
    downloadFile(
      `\uFEFF${ContentQualityAuditService.toCSV(report)}`,
      `jlpt_content_quality_audit_${date}.csv`,
      'text/csv;charset=utf-8',
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-border bg-card">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-medium">
            {isJa ? '品質監査データを読み込み中...' : 'Kontent audit yuklanmoqda...'}
          </span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-red-500" />
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground">
              {isJa ? '監査レポートの読み込みに失敗しました' : 'Audit hisobotini yuklab bo‘lmadi'}
            </h3>
            <p className="text-xs text-muted-foreground">{error}</p>
            <button
              onClick={() => void loadReport()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold"
            >
              <RefreshCw size={13} /> {isJa ? '再試行' : 'Qayta urinish'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const total = report.totals;

  return (
    <div className="space-y-4 duration-200 animate-in fade-in">
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-base font-black text-foreground">
            <BarChart3 className="h-5 w-5 text-primary" />
            {isJa ? 'JLPT N3–N1 コンテンツ品質監査' : 'JLPT N3–N1 Kontent Quality Audit'}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isJa
              ? '語彙・文法・漢字・読解・聴解の網羅率、未入力項目、重複、音声、ワークフローと誤答統計。'
              : "Vocabulary, grammar, kanji, reading va listening bo'yicha qamrov, missing field, duplicate, audio, workflow va xato statistikasi."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void loadReport()}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl border border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted/80"
          >
            <RefreshCw size={13} /> {isJa ? '更新' : 'Yangilash'}
          </button>
          <button
            onClick={() => exportReport('json')}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20"
          >
            <FileJson size={13} /> JSON
          </button>
          <button
            onClick={() => exportReport('csv')}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Download size={13} /> CSV
          </button>
        </div>
      </div>

      {report.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              {report.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard
          label={isJa ? '総コンテンツ' : 'Jami kontent'}
          value={total.totalQuestions}
          icon={<Layers size={15} />}
        />
        <SummaryCard
          label={isJa ? '未入力あり' : 'Missing field'}
          value={total.missingFieldTotal}
          tone={total.missingFieldTotal > 0 ? 'warning' : 'ok'}
          icon={<AlertTriangle size={15} />}
        />
        <SummaryCard
          label={isJa ? '重複問題' : 'Duplicate'}
          value={total.duplicateQuestionCount}
          tone={total.duplicateQuestionCount > 0 ? 'warning' : 'ok'}
          icon={<ShieldAlert size={15} />}
        />
        <SummaryCard
          label={isJa ? '音声カバー率' : 'Audio availability'}
          value={`${total.audio.availabilityPercent}%`}
          tone={total.audio.availabilityPercent >= 90 ? 'ok' : 'warning'}
          icon={<Headphones size={15} />}
        />
        <SummaryCard
          label={isJa ? 'スキル網羅率' : 'Skill coverage'}
          value={`${total.coveragePercent}%`}
          tone={total.coveragePercent === 100 ? 'ok' : 'warning'}
          icon={<CheckCircle2 size={15} />}
        />
        <SummaryCard
          label={isJa ? '誤答データ' : 'Xato statistikasi'}
          value={report.errorStatsAvailable ? `${report.topErrorQuestions.length}+` : '—'}
          tone={report.errorStatsAvailable ? 'neutral' : 'warning'}
          icon={<BarChart3 size={15} />}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {CONTENT_AUDIT_LEVELS.map((level) => {
          const levelReport = report.levels.find((item) => item.level === level);
          const active = level === selectedLevel;
          return (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`min-w-[150px] flex-1 rounded-2xl border p-3 text-left transition-all ${
                active
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-card hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-foreground">{level}</span>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {levelReport?.totalQuestions ?? 0} ta
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${levelReport?.coveragePercent ?? 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] font-medium text-muted-foreground">
                Coverage {levelReport?.coveragePercent ?? 0}% · Audio{' '}
                {levelReport?.audio.availabilityPercent ?? 0}%
              </p>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {CONTENT_QUALITY_SKILLS.map((skill) => (
              <div key={skill} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {isJa ? SKILL_LABELS[skill].ja : SKILL_LABELS[skill].uz}
                  </span>
                  {selected.skillCounts[skill] > 0 ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : (
                    <AlertTriangle size={13} className="text-amber-500" />
                  )}
                </div>
                <div className="mt-1.5 text-xl font-black text-foreground">
                  {selected.skillCounts[skill]}
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${
                      selected.skillCounts[skill] > 0 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${skillPercent(selected.skillCounts[skill], selected.totalQuestions)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {isJa ? 'ワークフロー状況' : 'Workflow holati'}
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CONTENT_WORKFLOW_STATUSES.map((status) => (
                  <div
                    key={status}
                    className={`rounded-xl border px-2.5 py-2 ${STATUS_LABELS[status].color}`}
                  >
                    <div className="text-[10px] font-bold">
                      {isJa ? STATUS_LABELS[status].ja : STATUS_LABELS[status].uz}
                    </div>
                    <div className="mt-0.5 text-lg font-black">{selected.statusCounts[status]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {isJa ? '音声の有無' : 'Audio mavjudligi'}
              </h3>
              <div className="mt-3 flex items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-8 border-muted">
                  <span className="text-xs font-black">{selected.audio.availabilityPercent}%</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Volume2 size={13} /> {selected.audio.withAudio} ta audio bor
                  </p>
                  <p className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <VolumeX size={13} /> {selected.audio.missingAudio} ta audio yo‘q
                  </p>
                  <p className="text-muted-foreground">
                    Listening jami: {selected.audio.listeningTotal}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {isJa ? '未入力フィールド統計' : 'Missing field statistikasi'}
              </h3>
              <div className="mt-3 space-y-2">
                {CONTENT_MISSING_FIELDS.map((field) => {
                  const count = selected.missingFields[field];
                  return (
                    <div key={field} className="flex items-center gap-2">
                      <span className="w-28 shrink-0 text-[11px] font-semibold text-muted-foreground">
                        {isJa ? MISSING_LABELS[field].ja : MISSING_LABELS[field].uz}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${count > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{
                            width: `${selected.totalQuestions > 0 ? Math.min(100, (count / selected.totalQuestions) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`w-8 text-right text-xs font-black ${
                          count > 0 ? 'text-red-500' : 'text-emerald-500'
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {isJa ? 'スキル網羅状況' : 'Skill coverage'}
              </h3>
              <div className="mt-3 space-y-2">
                {selected.skillCoverage.map((item) => (
                  <div key={item.skill} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-[11px] font-semibold text-muted-foreground">
                      {isJa ? SKILL_LABELS[item.skill].ja : SKILL_LABELS[item.skill].uz}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${item.covered ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: item.covered ? '100%' : '0%' }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-black ${
                        item.covered ? 'text-emerald-500' : 'text-amber-500'
                      }`}
                    >
                      {item.covered ? 'OK' : isJa ? '不足' : "Yo'q"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] font-medium text-muted-foreground">
                {selected.coveredSkills}/5 skill · {selected.coveragePercent}%
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                <BookOpen size={14} /> {isJa ? '重複コンテンツ' : 'Duplicate kontent'}
              </h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                {selected.duplicateQuestionCount} ta savol
              </span>
            </div>
            {selected.duplicateGroups.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                {isJa ? '重複は見つかりませんでした。' : 'Dublikat topilmadi.'}
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {selected.duplicateGroups.map((group) => (
                  <div
                    key={`${group.level}-${group.key}`}
                    className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {group.count}× {group.sampleText || '(matnsiz)'}
                      </span>
                      <span className="shrink-0 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        {group.questionIds.length} ID
                      </span>
                    </div>
                    <p className="mt-1 break-all text-[10px] text-muted-foreground">
                      {group.questionIds.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ErrorQuestionTable
            title={`${selected.level} — ${isJa ? '最も誤答の多い問題' : 'Eng ko‘p xato berayotgan savollar'}`}
            items={selected.topErrorQuestions}
            isJa={isJa}
          />
        </div>
      )}

      <ErrorQuestionTable
        title={isJa ? '全レベル 誤答ランキング' : 'Barcha levellar bo‘yicha xato reytingi'}
        items={report.topErrorQuestions}
        isJa={isJa}
        emptyText={
          report.errorStatsAvailable
            ? isJa
              ? '誤答データがまだありません。'
              : "Hali xato ma'lumotlari yo'q."
            : isJa
              ? '誤答統計を読み込めませんでした。'
              : "Xato statistikasini yuklab bo'lmadi."
        }
      />
    </div>
  );
};

const SummaryCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: 'ok' | 'warning' | 'neutral';
}> = ({ label, value, icon, tone = 'neutral' }) => (
  <div className="rounded-xl border border-border bg-card p-3">
    <div
      className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${
        tone === 'warning'
          ? 'text-amber-600 dark:text-amber-400'
          : tone === 'ok'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-muted-foreground'
      }`}
    >
      {icon} {label}
    </div>
    <div className="mt-1.5 text-xl font-black text-foreground">{value}</div>
  </div>
);

const ErrorQuestionTable: React.FC<{
  title: string;
  items: ContentQualityReport['topErrorQuestions'];
  isJa: boolean;
  emptyText?: string;
}> = ({ title, items, isJa, emptyText }) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
      <AlertTriangle size={14} className="text-red-500" /> {title}
    </h3>
    {items.length === 0 ? (
      <p className="mt-3 text-xs text-muted-foreground">
        {emptyText || (isJa ? 'データがありません。' : "Ma'lumot yo'q.")}
      </p>
    ) : (
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="pb-2 pr-3 font-bold">#</th>
              <th className="pb-2 pr-3 font-bold">{isJa ? '問題' : 'Savol'}</th>
              <th className="pb-2 pr-3 font-bold">Level</th>
              <th className="pb-2 pr-3 font-bold">Skill</th>
              <th className="pb-2 pr-3 text-right font-bold">{isJa ? '試行' : 'Attempt'}</th>
              <th className="pb-2 pr-3 text-right font-bold">{isJa ? '誤答' : 'Xato'}</th>
              <th className="pb-2 text-right font-bold">{isJa ? '誤答率' : 'Xato %'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((item, index) => (
              <tr key={`${item.level}-${item.questionId}`} className="align-top">
                <td className="py-2 pr-3 font-bold text-muted-foreground">{index + 1}</td>
                <td className="max-w-[320px] py-2 pr-3">
                  <p className="line-clamp-2 font-semibold text-foreground">
                    {item.questionText || '(matnsiz)'}
                  </p>
                  {item.examTitle && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{item.examTitle}</p>
                  )}
                </td>
                <td className="py-2 pr-3 font-bold text-foreground">{item.level}</td>
                <td className="py-2 pr-3 capitalize text-muted-foreground">{item.skill}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">
                  {item.attempts}
                </td>
                <td className="py-2 pr-3 text-right font-bold tabular-nums text-red-500">
                  {item.wrongCount}
                </td>
                <td className="py-2 text-right font-black tabular-nums text-red-500">
                  {item.errorRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
