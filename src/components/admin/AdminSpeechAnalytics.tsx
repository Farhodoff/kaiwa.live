import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Mic,
  Search,
  RefreshCw,
  Award,
  Clock,
  User,
  Calendar,
  TrendingUp,
  MessageSquareText,
  X,
  FileText,
} from 'lucide-react';

export interface SpeakingSessionRecord {
  id: string;
  user_email?: string;
  persona_title: string;
  fluency_score: number;
  pronunciation_score: number;
  grammar_score: number;
  vocabulary_score: number;
  duration_seconds: number;
  feedback?: string;
  transcript?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
    translation?: string;
  }>;
  created_at: string;
}

export interface UserSpeechAggregation {
  email: string;
  totalSessions: number;
  todaySessions: number;
  todayAvgScore: number;
  weeklyAvgScore: number;
  overallAvgScore: number;
  lastTopic: string;
  lastDate: string;
}

export interface AdminSpeechAnalyticsProps {
  records?: any[];
}

export const AdminSpeechAnalytics: React.FC<AdminSpeechAnalyticsProps> = ({ records }) => {
  // Instant SWR initial state from localStorage cache
  const [sessions, setSessions] = useState<SpeakingSessionRecord[]>(() => {
    if (records && Array.isArray(records) && records.length > 0) return records;
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('study_planner_admin_speech_sessions_cache');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    if (records && Array.isArray(records) && records.length > 0) {
      setSessions(records);
    }
  }, [records]);
  const [isLoading, setIsLoading] = useState(() => sessions.length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'history'>('users');
  const [selectedTranscriptSession, setSelectedTranscriptSession] =
    useState<SpeakingSessionRecord | null>(null);

  const fetchSessions = async () => {
    if (sessions.length === 0) setIsLoading(true);
    let list: SpeakingSessionRecord[] = [];

    try {
      // 1. Fetch profiles & user mapping sequentially
      const profileMap = new Map<string, string>();
      try {
        const pRes = await supabase.from('profiles').select('*').limit(300);
        if (pRes.data) {
          pRes.data.forEach((p: any) => {
            const uid = p.id || p.user_id;
            if (uid) profileMap.set(uid, p.email || p.full_name || 'Student');
          });
        }
      } catch {}

      try {
        const rpcRes = await supabase.rpc('get_admin_all_users');
        if (rpcRes.data && Array.isArray(rpcRes.data)) {
          rpcRes.data.forEach((u: any) => {
            if (u.id) profileMap.set(u.id, u.email || u.full_name || 'Student');
          });
        }
      } catch {}

      // Also check current authenticated user
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user?.id && sessionData?.session?.user?.email) {
          profileMap.set(sessionData.session.user.id, sessionData.session.user.email);
        }
      } catch {}

      // 2. Fetch via get_admin_all_sessions RPC or fallback to direct table queries
      let speakData: any[] | null = null;
      try {
        const rpcRes = await supabase.rpc('get_admin_all_sessions');
        if (!rpcRes.error && rpcRes.data) {
          const sObj = typeof rpcRes.data === 'string' ? JSON.parse(rpcRes.data) : rpcRes.data;
          if (sObj && typeof sObj === 'object' && Array.isArray(sObj.speaking_sessions)) {
            speakData = sObj.speaking_sessions;
          }
        }
      } catch {}

      if (!speakData || speakData.length === 0) {
        try {
          const speakRes = await supabase.from('speaking_sessions').select('*').limit(300);
          speakData = speakRes.data;
        } catch {}
      }
      if (speakData && speakData.length > 0) {
        speakData.forEach((item: any) => {
          list.push({
            id: item.id,
            user_email:
              item.user_email ||
              (item.user_id ? profileMap.get(item.user_id) : undefined) ||
              'Student',
            persona_title: item.persona_title || item.topic || 'Speaking Muloqot',
            fluency_score: Number(item.fluency_score || item.fluencyScore) || 0,
            pronunciation_score:
              Number(item.pronunciation_score || item.pronunciationScore) ||
              Number(item.fluency_score || item.fluencyScore) ||
              0,
            grammar_score: Number(item.grammar_score || item.grammarScore) || 0,
            vocabulary_score: Number(item.vocabulary_score || item.vocabularyScore) || 0,
            duration_seconds: Number(item.duration_seconds || item.durationSeconds) || 0,
            feedback: item.feedback || item.ai_feedback || '',
            transcript: item.transcript || [],
            created_at: item.created_at || item.createdAt || new Date().toISOString(),
          });
        });
      }

      // 3. Merge speaking_coach_sessions sequentially
      let coachSessionsData: any[] | null = null;
      try {
        const scRes = await supabase.from('speaking_coach_sessions').select('*').limit(300);
        coachSessionsData = scRes.data;
      } catch {}
      if (coachSessionsData && coachSessionsData.length > 0) {
        for (const item of coachSessionsData as any[]) {
          if (!list.some((l) => l.id === item.id)) {
            list.push({
              id: item.id,
              user_email: (item.user_id ? profileMap.get(item.user_id) : undefined) || 'Student',
              persona_title: item.persona_title || item.persona || 'Speaking Muloqot',
              fluency_score: Number(item.fluency_score || item.fluencyScore) || 0,
              pronunciation_score:
                Number(item.pronunciation_score || item.pronunciationScore) ||
                Number(item.fluency_score || item.fluencyScore) ||
                0,
              grammar_score: Number(item.grammar_score || item.grammarScore) || 0,
              vocabulary_score: Number(item.vocabulary_score || item.vocabularyScore) || 0,
              duration_seconds: Number(item.duration_seconds || item.durationSeconds) || 0,
              feedback: item.feedback || '',
              transcript: item.transcript || [],
              created_at: item.created_at || item.createdAt || new Date().toISOString(),
            });
          }
        }
      }

      // 4. Merge ai_coach_sessions sequentially
      let aiCoachData: any[] | null = null;
      try {
        const aiRes = await supabase.from('ai_coach_sessions').select('*').limit(300);
        aiCoachData = aiRes.data;
      } catch {}
      if (aiCoachData && aiCoachData.length > 0) {
        for (const item of aiCoachData as any[]) {
          if (!list.some((l) => l.id === item.id)) {
            list.push({
              id: item.id,
              user_email: (item.user_id ? profileMap.get(item.user_id) : undefined) || 'Student',
              persona_title: item.persona_title || 'AI Coach Muloqot',
              fluency_score: Number(item.fluency_score) || 0,
              pronunciation_score:
                Number(item.pronunciation_score) || Number(item.fluency_score) || 0,
              grammar_score: Number(item.grammar_score) || 0,
              vocabulary_score: Number(item.vocabulary_score) || 0,
              duration_seconds: Number(item.duration_seconds || item.durationSeconds) || 0,
              feedback: item.feedback || '',
              transcript: [],
              created_at: item.created_at || new Date().toISOString(),
            });
          }
        }
      }

      // 6. Scan LocalStorage for authentic local speech sessions (using known key patterns only)
      if (typeof window !== 'undefined') {
        try {
          const knownLocalKeys = ['scenario_history', 'speaking_sessions_local'];
          for (const k of knownLocalKeys) {
            try {
              const raw = localStorage.getItem(k);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                  for (const item of parsed) {
                    const scId =
                      item.id || `local-${item.created_at || item.createdAt || Date.now()}`;
                    if (!list.some((l) => l.id === scId)) {
                      list.push({
                        id: scId,
                        user_email:
                          item.user_email ||
                          (item.user_id ? profileMap.get(item.user_id) : undefined) ||
                          "O'quvchi",
                        persona_title:
                          item.scenario_title ||
                          item.persona_title ||
                          item.personaTitle ||
                          'Ssenariy Muloqot',
                        fluency_score: Number(item.fluency_score || item.fluencyScore) || 0,
                        pronunciation_score:
                          Number(item.pronunciation_score || item.pronunciationScore) || 0,
                        grammar_score: Number(item.grammar_score || item.grammarScore) || 0,
                        vocabulary_score:
                          Number(item.vocabulary_score || item.vocabularyScore) || 0,
                        duration_seconds:
                          Number(item.duration_seconds || item.durationSeconds) || 0,
                        feedback: item.ai_feedback || item.feedback || '',
                        transcript: item.transcript || [],
                        created_at: item.created_at || item.createdAt || new Date().toISOString(),
                      });
                    }
                  }
                }
              }
            } catch {}
          }
        } catch (localErr) {
          console.warn('Local storage speech scan notice:', localErr);
        }
      }
    } catch (err) {
      console.warn('Supabase speech analytics fetch notice:', err);
    } finally {
      // Sort descending by created_at
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSessions(list);
      if (typeof window !== 'undefined' && list.length > 0) {
        try {
          localStorage.setItem(
            'study_planner_admin_speech_sessions_cache',
            JSON.stringify(list.slice(0, 100)),
          );
        } catch {}
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch independently if parent didn't provide records
    if (!records || !Array.isArray(records) || records.length === 0) {
      fetchSessions();
    }
  }, []);

  // Summary & Date Filtering calculations (100% Real from DB)
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const todaySessions = sessions.filter((s) => s.created_at && s.created_at.startsWith(todayStr));
  const weeklySessions = sessions.filter(
    (s) => s.created_at && new Date(s.created_at) >= sevenDaysAgo,
  );

  const normalizeScore = (score?: number) => {
    const num = Number(score) || 0;
    if (num <= 0) return 0;
    if (num <= 9) return Math.min(100, Math.round((num / 9) * 100));
    return Math.min(100, Math.round(num));
  };

  const getSessionScore = (s: SpeakingSessionRecord) => {
    const scores = [s.pronunciation_score, s.fluency_score, s.grammar_score, s.vocabulary_score]
      .map((x) => normalizeScore(x))
      .filter((x) => x > 0);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((acc, curr) => acc + curr, 0) / scores.length);
  };

  const todayAvgScore =
    todaySessions.length > 0
      ? Math.round(
          todaySessions.reduce((acc, curr) => acc + getSessionScore(curr), 0) /
            todaySessions.length,
        )
      : 0;

  const weeklyAvgScore =
    weeklySessions.length > 0
      ? Math.round(
          weeklySessions.reduce((acc, curr) => acc + getSessionScore(curr), 0) /
            weeklySessions.length,
        )
      : 0;

  const totalSpokenMins = Math.round(
    sessions.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0) / 60,
  );

  // Grouping by User Email for User Analytics Aggregation
  const userAggregationsMap = new Map<string, SpeakingSessionRecord[]>();
  for (const s of sessions) {
    const email = s.user_email || 'Student';
    if (!userAggregationsMap.has(email)) {
      userAggregationsMap.set(email, []);
    }
    userAggregationsMap.get(email)!.push(s);
  }

  const userAggregations: UserSpeechAggregation[] = Array.from(userAggregationsMap.entries()).map(
    ([email, userList]) => {
      const userTodayList = userList.filter(
        (s) => s.created_at && s.created_at.startsWith(todayStr),
      );
      const userWeeklyList = userList.filter(
        (s) => s.created_at && new Date(s.created_at) >= sevenDaysAgo,
      );
      const uOverallAvg = Math.round(
        userList.reduce((acc, curr) => acc + getSessionScore(curr), 0) / userList.length,
      );

      const uTodayAvg =
        userTodayList.length > 0
          ? Math.round(
              userTodayList.reduce((acc, curr) => acc + getSessionScore(curr), 0) /
                userTodayList.length,
            )
          : uOverallAvg;

      const uWeeklyAvg =
        userWeeklyList.length > 0
          ? Math.round(
              userWeeklyList.reduce((acc, curr) => acc + getSessionScore(curr), 0) /
                userWeeklyList.length,
            )
          : uOverallAvg;

      return {
        email,
        totalSessions: userList.length,
        todaySessions: userTodayList.length,
        todayAvgScore: uTodayAvg,
        weeklyAvgScore: uWeeklyAvg,
        overallAvgScore: uOverallAvg,
        lastTopic: userList[0]?.persona_title || "Noma'lum",
        lastDate: userList[0]?.created_at || '',
      };
    },
  );

  const filteredUsers = userAggregations.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastTopic.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredSessions = sessions.filter(
    (s) =>
      s.persona_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.user_email && s.user_email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Title Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 font-display text-base font-black text-foreground">
            <Mic size={18} className="text-primary" />
            <span>Foydalanuvchilar Speech va Kunlik/Haftalik Analytics (Admin)</span>
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Kunlik va haftalik suhbat foizlari (%), seanslar chastotasi va foydalanuvchilar suhbat
            tarixi.
          </p>
        </div>

        <button
          onClick={fetchSessions}
          className="flex cursor-pointer items-center gap-1.5 self-start rounded-xl border border-border bg-muted px-3.5 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/80 sm:self-auto"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>Yangilash</span>
        </button>
      </div>

      {/* Top Stat Cards: Daily vs Weekly % & Frequency */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-primary">{todaySessions.length} seans</div>
            <div className="text-[11px] font-semibold text-muted-foreground">Bugungi Suhbatlar</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
            <Award size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-400">{todayAvgScore}%</div>
            <div className="text-[11px] font-semibold text-muted-foreground">
              Kunlik O'rtacha Foiz
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="rounded-xl bg-[#C9A961]/15 p-3 text-[#C9A961]">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-[#C9A961]">{weeklyAvgScore}%</div>
            <div className="text-[11px] font-semibold text-muted-foreground">
              Haftalik O'rtacha Foiz
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-amber-400">{totalSpokenMins} min</div>
            <div className="text-[11px] font-semibold text-muted-foreground">
              Jami Gapirilgan Vaqt
            </div>
          </div>
        </div>
      </div>

      {/* View Filter Tabs & Search */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`cursor-pointer rounded-xl border px-4 py-2 text-xs font-extrabold transition-all ${
              activeTab === 'users'
                ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            👥 Foydalanuvchilar Kesimida ({userAggregations.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`cursor-pointer rounded-xl border px-4 py-2 text-xs font-extrabold transition-all ${
              activeTab === 'history'
                ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            📜 Barcha Muloqot Tarixi ({sessions.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Qidiruv..."
            className="w-full rounded-xl border border-border bg-muted/50 py-2 pl-9 pr-4 text-xs text-foreground outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* TAB 1: User Analytics Aggregation (Daily & Weekly Foiz %) */}
      {activeTab === 'users' && (
        <div>
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p>Analytics yuklanmoqda...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card py-12 text-center text-xs text-muted-foreground">
              Foydalanuvchilar statistikasi topilmadi.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/60 text-[11px] font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="p-3.5">Foydalanuvchi Emaili</th>
                      <th className="p-3.5 text-center">Jami Seanslar</th>
                      <th className="p-3.5 text-center">Bugungi Seanslar</th>
                      <th className="p-3.5 text-center">Kunlik Foiz %</th>
                      <th className="p-3.5 text-center">Haftalik Foiz %</th>
                      <th className="p-3.5 text-center">Umumiy Ball %</th>
                      <th className="p-3.5 text-right">Oxirgi Muloqot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredUsers.map((user) => (
                      <tr key={user.email} className="transition-colors hover:bg-muted/30">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2 font-bold text-foreground">
                            <User size={14} className="text-primary" />
                            <span className="max-w-[180px] truncate">{user.email}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-foreground">
                          {user.totalSessions} ta
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-primary">
                          {user.todaySessions > 0 ? (
                            <span className="rounded-md bg-primary/10 px-2 py-0.5">
                              {user.todaySessions} marta
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          {user.todayAvgScore > 0 ? (
                            <span
                              className={`rounded-md px-2 py-0.5 ${
                                user.todayAvgScore >= 80
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}
                            >
                              {user.todayAvgScore}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          {user.weeklyAvgScore > 0 ? (
                            <span
                              className={`rounded-md px-2 py-0.5 ${
                                user.weeklyAvgScore >= 80
                                  ? 'bg-[#C9A961]/15 text-[#C9A961]'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {user.weeklyAvgScore}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-emerald-400">
                          {user.overallAvgScore}%
                        </td>
                        <td className="p-3.5 text-right text-[11px] text-muted-foreground">
                          <div className="ml-auto max-w-[120px] truncate font-bold text-foreground">
                            {user.lastTopic}
                          </div>
                          <div>
                            {user.lastDate
                              ? new Date(user.lastDate).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: All Speech Sessions History Log */}
      {activeTab === 'history' && (
        <div>
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p>Muloqot tarixi yuklanmoqda...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card py-12 text-center text-xs text-muted-foreground">
              Talaffuz va suhbat natijalari topilmadi.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/60 text-[11px] font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="p-3.5">Foydalanuvchi</th>
                      <th className="p-3.5">Mavzu / Scenario</th>
                      <th className="p-3.5 text-center">Talaffuz</th>
                      <th className="p-3.5 text-center">Silliqlik</th>
                      <th className="p-3.5 text-center">Grammatika</th>
                      <th className="p-3.5 text-center">Lug'at</th>
                      <th className="p-3.5 text-center">Vaqt</th>
                      <th className="p-3.5 text-center">Matn (Transcript)</th>
                      <th className="p-3.5 text-right">Sana</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredSessions.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-muted/30">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <User size={13} className="text-muted-foreground" />
                            <span className="max-w-[140px] truncate">{item.user_email}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-foreground">{item.persona_title}</td>
                        <td className="p-3.5 text-center font-mono font-bold text-primary">
                          {item.pronunciation_score}%
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-emerald-400">
                          {item.fluency_score}%
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-[#C9A961]">
                          {item.grammar_score}%
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-amber-400">
                          {item.vocabulary_score}%
                        </td>
                        <td className="p-3.5 text-center text-muted-foreground">
                          {Math.round(item.duration_seconds / 60)} min ({item.duration_seconds}s)
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setSelectedTranscriptSession(item)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-extrabold text-primary transition-all hover:bg-primary/20"
                            title="Suhbat matnini (transcript) ko'rish"
                          >
                            <MessageSquareText size={12} />
                            <span>📜 Matn ({item.transcript?.length || 0})</span>
                          </button>
                        </td>
                        <td className="p-3.5 text-right text-[11px] text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRANSCRIPT VIEWER MODAL */}
      {selectedTranscriptSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-4 border-b border-border bg-muted/30 p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="shrink-0 rounded-2xl bg-primary/10 p-2.5 text-primary">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-extrabold text-foreground">
                    📜 Suhbat Tarixi va Matni (Transcript)
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedTranscriptSession.user_email} •{' '}
                    {selectedTranscriptSession.persona_title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTranscriptSession(null)}
                className="cursor-pointer rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Session Overview Stats */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-5 py-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">O'rtacha Ball:</span>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono font-extrabold text-emerald-400">
                  {Math.round(
                    (selectedTranscriptSession.fluency_score +
                      selectedTranscriptSession.pronunciation_score +
                      selectedTranscriptSession.grammar_score +
                      selectedTranscriptSession.vocabulary_score) /
                      4,
                  )}
                  %
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">Davomiyligi:</span>
                <span className="font-extrabold text-foreground">
                  {selectedTranscriptSession.duration_seconds}s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">Sana:</span>
                <span className="text-muted-foreground">
                  {new Date(selectedTranscriptSession.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              {!selectedTranscriptSession.transcript ||
              selectedTranscriptSession.transcript.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <MessageSquareText size={24} className="mx-auto mb-2 opacity-50" />
                  <p>Ushbu seans uchun saqlangan suhbat matni topilmadi.</p>
                </div>
              ) : (
                selectedTranscriptSession.transcript.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-bold text-muted-foreground">
                      <span>
                        {msg.role === 'user'
                          ? `👤 ${selectedTranscriptSession.user_email}`
                          : `🤖 ${selectedTranscriptSession.persona_title}`}
                      </span>
                      {msg.timestamp && <span>• {msg.timestamp}</span>}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-medium leading-relaxed shadow-sm sm:text-sm ${
                        msg.role === 'user'
                          ? 'rounded-tr-none bg-primary text-primary-foreground'
                          : 'rounded-tl-none border border-border bg-muted/80 text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.translation && (
                        <div className="mt-2 border-t border-white/20 pt-2 text-xs italic opacity-90 dark:border-border">
                          🇺🇿 {msg.translation}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {selectedTranscriptSession.feedback && (
                <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs">
                  <div className="mb-1 flex items-center gap-1.5 font-extrabold text-amber-600 dark:text-amber-400">
                    💡 AI Coach Xulosasi & Feedback:
                  </div>
                  <p className="leading-relaxed text-muted-foreground">
                    {selectedTranscriptSession.feedback}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-border bg-muted/30 p-4">
              <button
                onClick={() => setSelectedTranscriptSession(null)}
                className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
