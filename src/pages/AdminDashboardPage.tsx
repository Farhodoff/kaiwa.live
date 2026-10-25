import React, { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useStudyData } from '../context/StudyPlannerContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import {
  Users,
  Loader2,
  RefreshCw,
  Home,
  BookOpen,
  Wand2,
  Mic,
  MessageSquareText,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Download,
  Radio,
  X,
  BarChart3,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import {
  isAdminEmail,
  isSuperAdmin,
  isUserAdmin,
  grantAdminRole,
  revokeAdminRole,
  SUPER_ADMIN_EMAIL,
  getAdminAuditLogs,
  AdminAuditLogEntry,
} from '../utils/admin';
import { UserNotificationService } from '../services/UserNotificationService';
import { AdminMetricsOverview } from '../components/admin/AdminMetricsOverview';
import { AdminUsersTable } from '../components/admin/AdminUsersTable';
import { toast } from '../hooks/use-toast';
import { safeLocalStorage } from '../utils/storage/safeLocalStorage';

const AdminScenarioManager = lazy(() =>
  import('../components/admin/AdminScenarioManager').then((m) => ({
    default: m.AdminScenarioManager,
  })),
);
const AdminSpeechAnalytics = lazy(() =>
  import('../components/admin/AdminSpeechAnalytics').then((m) => ({
    default: m.AdminSpeechAnalytics,
  })),
);
const AdminContentStudio = lazy(() =>
  import('../components/admin/AdminContentStudio').then((m) => ({ default: m.AdminContentStudio })),
);
const AdminContentQualityDashboard = lazy(() =>
  import('../components/admin/AdminContentQualityDashboard').then((m) => ({
    default: m.AdminContentQualityDashboard,
  })),
);
const AdminDatasetVaultModal = lazy(() =>
  import('../components/admin/AdminDatasetVaultModal').then((m) => ({
    default: m.AdminDatasetVaultModal,
  })),
);
const AdminAiCardCleanerModal = lazy(() =>
  import('../components/decks/AdminAiCardCleanerModal').then((m) => ({
    default: m.AdminAiCardCleanerModal,
  })),
);
const AdminAuditLogsModal = lazy(() =>
  import('../components/admin/AdminAuditLogsModal').then((m) => ({
    default: m.AdminAuditLogsModal,
  })),
);
const AdminBroadcastModal = lazy(() =>
  import('../components/admin/AdminBroadcastModal').then((m) => ({
    default: m.AdminBroadcastModal,
  })),
);
const AdminUserDetailModal = lazy(() =>
  import('../components/admin/AdminUserDetailModal').then((m) => ({
    default: m.AdminUserDetailModal,
  })),
);

const AdminTabFallback: React.FC = () => (
  <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-border bg-card p-12 text-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-xs font-medium text-muted-foreground">Modul yuklanmoqda...</span>
    </div>
  </div>
);

interface UserRecord {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  created_at: string;
  last_sign_in_at?: string;
  admin_assigned_by?: string | null;
  admin_assigned_at?: string | null;
}

interface UserAggregatedStats {
  totalSessions: number;
  studySessions: number;
  speakingSessions: number;
  aiCoachSessions: number;
  totalDurationMinutes: number;
  lastActiveDate: string | null;
  avgScore: number | null;
}

interface TableFetchStatus {
  rpcUsers: { ok: boolean; count: number; error: string | null };
  profiles: { ok: boolean; count: number; error: string | null };
  studySessions: { ok: boolean; count: number; error: string | null };
  speakingSessions: { ok: boolean; count: number; error: string | null };
  speakingCoachSessions: { ok: boolean; count: number; error: string | null };
  aiCoachSessions: { ok: boolean; count: number; error: string | null };
  flashcards: { ok: boolean; count: number; error: string | null };
  speakingErrors: { ok: boolean; count: number; error: string | null };
  speakingVocabularies: { ok: boolean; count: number; error: string | null };
  diagnosticResults: { ok: boolean; count: number; error: string | null };
  learningGoals: { ok: boolean; count: number; error: string | null };
}

export interface DatabaseResourceMetrics {
  flashcards: number;
  studySessions: number;
  speakingSessions: number;
  speakingCoachSessions: number;
  aiCoachSessions: number;
  speakingErrors: number;
  speakingVocabularies: number;
  diagnosticResults: number;
  learningGoals: number;
  profiles: number;
  globalOverrides?: number;
  writingHistory?: number;
  mockExams?: number;
  customKanji?: number;
  customGrammar?: number;
  customQuiz?: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useStudyData();
  const { language } = useLanguage();
  const isJa = language === 'ja';

  const [usersList, setUsersList] = useState<UserRecord[]>(() => {
    try {
      const parsed = safeLocalStorage.getJSON<UserRecord[] | null>(
        'study_planner_admin_users_cache',
        null,
      );
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        !parsed.some((u: any) => u.id?.startsWith('usr-') || u.email?.includes('@tokyo-tech.jp'))
      ) {
        return parsed;
      }
      safeLocalStorage.removeItem('study_planner_admin_users_cache');
    } catch {}
    return [];
  });

  const [dailyStats, setDailyStats] = useState<any[]>(() => {
    try {
      const parsed = safeLocalStorage.getJSON<any[] | null>(
        'study_planner_admin_stats_cache',
        null,
      );
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        !parsed.some((s: any) => s.activity_date === '2026-08-25' && s.active_users === 18)
      ) {
        return parsed;
      }
      safeLocalStorage.removeItem('study_planner_admin_stats_cache');
    } catch {}
    return [];
  });

  const [speechRecords, setSpeechRecords] = useState<any[]>([]);
  const [userStatsMap, setUserStatsMap] = useState<Record<string, UserAggregatedStats>>({});

  const [dbMetrics, setDbMetrics] = useState<DatabaseResourceMetrics>({
    flashcards: 0,
    studySessions: 0,
    speakingSessions: 0,
    speakingCoachSessions: 0,
    aiCoachSessions: 0,
    speakingErrors: 0,
    speakingVocabularies: 0,
    diagnosticResults: 0,
    learningGoals: 0,
    profiles: 0,
  });

  // Debounce ref to prevent realtime query storms
  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detailed Table Status for Real DB Forensic Audit Bar & UI Error Indicators
  const [tableStatus, setTableStatus] = useState<TableFetchStatus>({
    rpcUsers: { ok: false, count: 0, error: null },
    profiles: { ok: false, count: 0, error: null },
    studySessions: { ok: false, count: 0, error: null },
    speakingSessions: { ok: false, count: 0, error: null },
    speakingCoachSessions: { ok: false, count: 0, error: null },
    aiCoachSessions: { ok: false, count: 0, error: null },
    flashcards: { ok: false, count: 0, error: null },
    speakingErrors: { ok: false, count: 0, error: null },
    speakingVocabularies: { ok: false, count: 0, error: null },
    diagnosticResults: { ok: false, count: 0, error: null },
    learningGoals: { ok: false, count: 0, error: null },
  });

  const [loading, setLoading] = useState(() => usersList.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [chartMode, setChartMode] = useState<'dau' | 'duration'>('dau');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'student'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'sessions' | 'duration' | 'name'>(
    'newest',
  );
  const [usersPage, setUsersPage] = useState(0);
  const USERS_PER_PAGE = 15;
  const [activeSection, setActiveSection] = useState<
    'users' | 'speech' | 'scenarios' | 'content' | 'quality'
  >('users');

  const [isCleanerOpen, setIsCleanerOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [selectedDetailUser, setSelectedDetailUser] = useState<UserRecord | null>(null);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const secretClicksRef = useRef(0);
  const userListRef = useRef(usersList);

  const [messageModalUser, setMessageModalUser] = useState<{ id: string; email: string } | null>(
    null,
  );
  const [msgTitle, setMsgTitle] = useState('🎁 Maxsus Xabar');
  const [msgContent, setMsgContent] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Admin Assignment Dialog State
  const [assignAdminModalOpen, setAssignAdminModalOpen] = useState(false);
  const [assignAdminEmailInput, setAssignAdminEmailInput] = useState('');
  const [assigningAdmin, setAssigningAdmin] = useState(false);

  // Admin Action Confirmation Dialog State (Grant / Revoke)
  const [confirmActionModal, setConfirmActionModal] = useState<{
    isOpen: boolean;
    type: 'grant' | 'revoke';
    targetEmail: string;
    targetId?: string;
    targetName?: string;
    loading: boolean;
  }>({
    isOpen: false,
    type: 'grant',
    targetEmail: '',
    loading: false,
  });

  // Admin Audit Logs Modal State
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsVaultOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    userListRef.current = usersList;
  }, [usersList]);

  const handleSecretTitleClick = () => {
    secretClicksRef.current += 1;
    if (secretClicksRef.current >= 5) {
      setIsVaultOpen(true);
      secretClicksRef.current = 0;
    }
  };

  // Global Independent DB Data Fetcher
  const fetchAdminData = useCallback(async () => {
    if (userListRef.current.length === 0) setLoading(true);

    // Ensure active authenticated session is restored
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        await supabase.auth.refreshSession().catch(() => {});
      }
    } catch {}

    const newStatus: TableFetchStatus = {
      rpcUsers: { ok: false, count: 0, error: null },
      profiles: { ok: false, count: 0, error: null },
      studySessions: { ok: false, count: 0, error: null },
      speakingSessions: { ok: false, count: 0, error: null },
      speakingCoachSessions: { ok: false, count: 0, error: null },
      aiCoachSessions: { ok: false, count: 0, error: null },
      flashcards: { ok: false, count: 0, error: null },
      speakingErrors: { ok: false, count: 0, error: null },
      speakingVocabularies: { ok: false, count: 0, error: null },
      diagnosticResults: { ok: false, count: 0, error: null },
      learningGoals: { ok: false, count: 0, error: null },
    };

    // 1. FETCH FULL DATABASE RESOURCE METRICS (10 TABLES)
    const metrics: DatabaseResourceMetrics = {
      flashcards: 0,
      studySessions: 0,
      speakingSessions: 0,
      speakingCoachSessions: 0,
      aiCoachSessions: 0,
      speakingErrors: 0,
      speakingVocabularies: 0,
      diagnosticResults: 0,
      learningGoals: 0,
      profiles: 0,
    };

    try {
      const rpcMetRes = await supabase.rpc('get_admin_database_metrics');
      let mObj: any = null;
      if (!rpcMetRes.error && rpcMetRes.data) {
        mObj = typeof rpcMetRes.data === 'string' ? JSON.parse(rpcMetRes.data) : rpcMetRes.data;
      } else {
        // Direct fallback with verified publishable key if RPC client auth failed
        try {
          const directMet = await fetch(`${supabaseUrl}/rest/v1/rpc/get_admin_database_metrics`, {
            method: 'POST',
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
          });
          if (directMet.ok) {
            mObj = await directMet.json();
          }
        } catch {}
      }
      if (mObj) {
        if (typeof mObj.flashcards_count === 'number') metrics.flashcards = mObj.flashcards_count;
        if (typeof mObj.study_sessions_count === 'number')
          metrics.studySessions = mObj.study_sessions_count;
        if (typeof mObj.speaking_sessions_count === 'number')
          metrics.speakingSessions = mObj.speaking_sessions_count;
        if (typeof mObj.speaking_coach_sessions_count === 'number')
          metrics.speakingCoachSessions = mObj.speaking_coach_sessions_count;
        if (typeof mObj.ai_coach_sessions_count === 'number')
          metrics.aiCoachSessions = mObj.ai_coach_sessions_count;
        if (typeof mObj.speaking_errors_count === 'number')
          metrics.speakingErrors = mObj.speaking_errors_count;
        if (typeof mObj.speaking_vocabularies_count === 'number')
          metrics.speakingVocabularies = mObj.speaking_vocabularies_count;
        if (typeof mObj.diagnostic_results_count === 'number')
          metrics.diagnosticResults = mObj.diagnostic_results_count;
        if (typeof mObj.learning_goals_count === 'number')
          metrics.learningGoals = mObj.learning_goals_count;
        if (typeof mObj.profiles_count === 'number') metrics.profiles = mObj.profiles_count;
        if (typeof mObj.global_flashcard_overrides_count === 'number')
          metrics.globalOverrides = mObj.global_flashcard_overrides_count;
        if (typeof mObj.writing_history_count === 'number')
          metrics.writingHistory = mObj.writing_history_count;
        if (typeof mObj.mock_exams_history_count === 'number')
          metrics.mockExams = mObj.mock_exams_history_count;
        if (typeof mObj.custom_kanji_count === 'number')
          metrics.customKanji = mObj.custom_kanji_count;
        if (typeof mObj.custom_grammar_count === 'number')
          metrics.customGrammar = mObj.custom_grammar_count;
        if (typeof mObj.custom_quiz_questions_count === 'number')
          metrics.customQuiz = mObj.custom_quiz_questions_count;
      } else {
        // Direct table head-count fallback if RPC is unavailable
        try {
          const [
            fcRes,
            profRes,
            ssRes,
            spRes,
            scRes,
            aiRes,
            errRes,
            vocRes,
            diagRes,
            goalRes,
            goRes,
            wrRes,
            meRes,
            ckRes,
            cgRes,
            cqRes,
          ] = await Promise.allSettled([
            supabase.from('flashcards').select('id', { count: 'exact', head: true }),
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('study_sessions').select('id', { count: 'exact', head: true }),
            supabase.from('speaking_sessions').select('id', { count: 'exact', head: true }),
            supabase.from('speaking_coach_sessions').select('id', { count: 'exact', head: true }),
            supabase.from('ai_coach_sessions').select('id', { count: 'exact', head: true }),
            supabase.from('speaking_errors').select('id', { count: 'exact', head: true }),
            supabase.from('speaking_vocabularies').select('id', { count: 'exact', head: true }),
            supabase.from('diagnostic_results').select('id', { count: 'exact', head: true }),
            supabase.from('learning_goals').select('id', { count: 'exact', head: true }),
            supabase
              .from('global_flashcard_overrides')
              .select('id', { count: 'exact', head: true }),
            supabase.from('ielts_writing_history').select('id', { count: 'exact', head: true }),
            supabase.from('mock_exams_history').select('id', { count: 'exact', head: true }),
            supabase.from('custom_kanji').select('id', { count: 'exact', head: true }),
            supabase.from('custom_grammar').select('id', { count: 'exact', head: true }),
            supabase.from('custom_quiz_questions').select('id', { count: 'exact', head: true }),
          ]);

          if (fcRes.status === 'fulfilled' && typeof fcRes.value.count === 'number') {
            metrics.flashcards = fcRes.value.count;
          }
          if (profRes.status === 'fulfilled' && typeof profRes.value.count === 'number') {
            metrics.profiles = profRes.value.count;
          }
          if (ssRes.status === 'fulfilled' && typeof ssRes.value.count === 'number') {
            metrics.studySessions = ssRes.value.count;
          }
          if (spRes.status === 'fulfilled' && typeof spRes.value.count === 'number') {
            metrics.speakingSessions = spRes.value.count;
          }
          if (scRes.status === 'fulfilled' && typeof scRes.value.count === 'number') {
            metrics.speakingCoachSessions = scRes.value.count;
          }
          if (aiRes.status === 'fulfilled' && typeof aiRes.value.count === 'number') {
            metrics.aiCoachSessions = aiRes.value.count;
          }
          if (errRes.status === 'fulfilled' && typeof errRes.value.count === 'number') {
            metrics.speakingErrors = errRes.value.count;
          }
          if (vocRes.status === 'fulfilled' && typeof vocRes.value.count === 'number') {
            metrics.speakingVocabularies = vocRes.value.count;
          }
          if (diagRes.status === 'fulfilled' && typeof diagRes.value.count === 'number') {
            metrics.diagnosticResults = diagRes.value.count;
          }
          if (goalRes.status === 'fulfilled' && typeof goalRes.value.count === 'number') {
            metrics.learningGoals = goalRes.value.count;
          }
          if (goRes.status === 'fulfilled' && typeof goRes.value.count === 'number') {
            metrics.globalOverrides = goRes.value.count;
          }
          if (wrRes.status === 'fulfilled' && typeof wrRes.value.count === 'number') {
            metrics.writingHistory = wrRes.value.count;
          }
          if (meRes.status === 'fulfilled' && typeof meRes.value.count === 'number') {
            metrics.mockExams = meRes.value.count;
          }
          if (ckRes.status === 'fulfilled' && typeof ckRes.value.count === 'number') {
            metrics.customKanji = ckRes.value.count;
          }
          if (cgRes.status === 'fulfilled' && typeof cgRes.value.count === 'number') {
            metrics.customGrammar = cgRes.value.count;
          }
          if (cqRes.status === 'fulfilled' && typeof cqRes.value.count === 'number') {
            metrics.customQuiz = cqRes.value.count;
          }
        } catch {}
      }
    } catch {}

    newStatus.flashcards = { ok: true, count: metrics.flashcards, error: null };
    newStatus.speakingErrors = { ok: true, count: metrics.speakingErrors, error: null };
    newStatus.speakingVocabularies = { ok: true, count: metrics.speakingVocabularies, error: null };
    newStatus.diagnosticResults = { ok: true, count: metrics.diagnosticResults, error: null };
    newStatus.learningGoals = { ok: true, count: metrics.learningGoals, error: null };
    newStatus.profiles = { ok: true, count: metrics.profiles, error: null };

    // 2. INDEPENDENT USERS FETCH (get_admin_all_users RPC -> direct fetch -> fallback to profiles table)
    let loadedUsers: UserRecord[] = [];
    try {
      const rpcRes = await supabase.rpc('get_admin_all_users');
      let rawUsersData =
        !rpcRes.error && Array.isArray(rpcRes.data) && rpcRes.data.length > 0 ? rpcRes.data : null;

      // Direct fetch fallback with verified anon key if RPC client failed with 401 or invalid key
      if (!rawUsersData) {
        try {
          const directUsersRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_admin_all_users`, {
            method: 'POST',
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
          });
          if (directUsersRes.ok) {
            const directUsersJson = await directUsersRes.json();
            if (Array.isArray(directUsersJson) && directUsersJson.length > 0) {
              rawUsersData = directUsersJson;
            }
          }
        } catch {}
      }

      if (rawUsersData && rawUsersData.length > 0) {
        newStatus.rpcUsers = { ok: true, count: rawUsersData.length, error: null };
        loadedUsers = rawUsersData.map((u: any) => ({
          id: u.id,
          email: u.email || "Noma'lum",
          full_name: u.full_name || '',
          role: isSuperAdmin(u.email)
            ? 'superadmin'
            : typeof u.role === 'string'
              ? u.role.toLowerCase()
              : u.role || 'user',
          created_at: u.created_at || new Date().toISOString(),
          last_sign_in_at: u.last_sign_in_at || u.last_sign_in,
          admin_assigned_by: u.admin_assigned_by,
          admin_assigned_at: u.admin_assigned_at,
        }));
      } else {
        newStatus.rpcUsers = {
          ok: false,
          count: 0,
          error: rpcRes.error?.message || 'RPC xatosi',
        };
        // Fallback to profiles table if RPC returned error or 0 users
        const pRes = await supabase.from('profiles').select('*').limit(500);
        if (pRes.data && Array.isArray(pRes.data) && pRes.data.length > 0) {
          newStatus.profiles = { ok: true, count: pRes.data.length, error: null };
          loadedUsers = pRes.data.map((u: any) => ({
            id: u.id,
            email: u.email || "Noma'lum",
            full_name: u.full_name || '',
            role: isSuperAdmin(u.email)
              ? 'superadmin'
              : typeof u.role === 'string'
                ? u.role.toLowerCase()
                : u.role || 'user',
            created_at: u.created_at || new Date().toISOString(),
            last_sign_in_at: u.updated_at,
            admin_assigned_by: u.admin_assigned_by,
            admin_assigned_at: u.admin_assigned_at,
          }));
        }
      }

      // Enrich loaded users with profiles attribution if not already present
      try {
        const { data: profRows } = await supabase
          .from('profiles')
          .select('id, email, role, admin_assigned_by, admin_assigned_at');
        if (Array.isArray(profRows) && profRows.length > 0) {
          const profIdMap = new Map(profRows.map((p) => [p.id, p]));
          const profEmailMap = new Map(
            profRows.filter((p) => p.email).map((p) => [p.email.toLowerCase(), p]),
          );
          loadedUsers = loadedUsers.map((u) => {
            const p =
              profIdMap.get(u.id) || (u.email ? profEmailMap.get(u.email.toLowerCase()) : null);
            if (p) {
              return {
                ...u,
                role: isSuperAdmin(u.email)
                  ? 'superadmin'
                  : p.role === 'superadmin'
                    ? 'admin'
                    : p.role || u.role,
                admin_assigned_by: p.admin_assigned_by || u.admin_assigned_by,
                admin_assigned_at: p.admin_assigned_at || u.admin_assigned_at,
              };
            }
            return u;
          });
        }
      } catch {}
    } catch (uErr: any) {
      newStatus.rpcUsers = { ok: false, count: 0, error: uErr?.message || 'RPC exception' };
    }

    // Ensure current logged-in admin is included if not present
    const currentAdminEmail = user?.email;
    const currentAdminRoleRaw = user?.role || user?.user_metadata?.role || user?.app_metadata?.role;
    const currentAdminRole =
      typeof currentAdminRoleRaw === 'string'
        ? currentAdminRoleRaw.toLowerCase()
        : currentAdminRoleRaw;
    if (currentAdminEmail && isAdminEmail(currentAdminEmail, currentAdminRole)) {
      const exists = loadedUsers.some(
        (u) =>
          u.email.toLowerCase() === currentAdminEmail.toLowerCase() ||
          (user.id && u.id === user.id),
      );
      if (!exists) {
        loadedUsers.unshift({
          id: user.id || 'current-admin',
          email: currentAdminEmail,
          full_name: user.user_metadata?.full_name || 'Admin',
          role: isSuperAdmin(currentAdminEmail) ? 'superadmin' : 'admin',
          created_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
        });
      }
    }

    setUsersList(loadedUsers);
    if (loadedUsers.length > 0) {
      safeLocalStorage.setJSON('study_planner_admin_users_cache', loadedUsers);
    } else {
      safeLocalStorage.removeItem('study_planner_admin_users_cache');
    }

    // 3. INDEPENDENT SESSION TABLES FETCH WITH RPC AND DIRECT FALLBACK
    let speakingData: any[] = [];
    let coachData: any[] = [];
    let aiCoachData: any[] = [];
    let studyData: any[] = [];

    try {
      const rpcSessions = await supabase.rpc('get_admin_all_sessions');
      let sObj =
        !rpcSessions.error && rpcSessions.data
          ? typeof rpcSessions.data === 'string'
            ? JSON.parse(rpcSessions.data)
            : rpcSessions.data
          : null;

      if (!sObj) {
        try {
          const directSessionsRes = await fetch(
            `${supabaseUrl}/rest/v1/rpc/get_admin_all_sessions`,
            {
              method: 'POST',
              headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
              },
            },
          );
          if (directSessionsRes.ok) {
            sObj = await directSessionsRes.json();
          }
        } catch {}
      }

      if (sObj) {
        if (Array.isArray(sObj.speaking_sessions)) {
          speakingData = sObj.speaking_sessions;
          newStatus.speakingSessions = { ok: true, count: speakingData.length, error: null };
        }
        if (Array.isArray(sObj.speaking_coach_sessions)) {
          coachData = sObj.speaking_coach_sessions;
          newStatus.speakingCoachSessions = { ok: true, count: coachData.length, error: null };
        }
        if (Array.isArray(sObj.ai_coach_sessions)) {
          aiCoachData = sObj.ai_coach_sessions;
          newStatus.aiCoachSessions = { ok: true, count: aiCoachData.length, error: null };
        }
        if (Array.isArray(sObj.study_sessions)) {
          studyData = sObj.study_sessions;
          newStatus.studySessions = { ok: true, count: studyData.length, error: null };
        }
      }
    } catch (rErr) {
      console.warn('[AdminDashboard] get_admin_all_sessions RPC error:', rErr);
    }

    // Only fallback to direct tables if RPC failed
    if (speakingData.length === 0 && !newStatus.speakingSessions.ok) {
      try {
        const spRes = await supabase.from('speaking_sessions').select('*').limit(500);
        if (spRes.data) speakingData = spRes.data;
        newStatus.speakingSessions = {
          ok: !spRes.error,
          count: speakingData.length,
          error: spRes.error?.message || null,
        };
      } catch {}
    }

    if (coachData.length === 0 && !newStatus.speakingCoachSessions.ok) {
      try {
        const scRes = await supabase.from('speaking_coach_sessions').select('*').limit(500);
        if (scRes.data) coachData = scRes.data;
        newStatus.speakingCoachSessions = {
          ok: !scRes.error,
          count: coachData.length,
          error: scRes.error?.message || null,
        };
      } catch {}
    }

    if (aiCoachData.length === 0 && !newStatus.aiCoachSessions.ok) {
      try {
        const aiRes = await supabase.from('ai_coach_sessions').select('*').limit(500);
        if (aiRes.data) aiCoachData = aiRes.data;
        newStatus.aiCoachSessions = {
          ok: !aiRes.error,
          count: aiCoachData.length,
          error: aiRes.error?.message || null,
        };
      } catch {}
    }

    if (studyData.length === 0 && !newStatus.studySessions.ok) {
      try {
        const stRes = await supabase.from('study_sessions').select('*').limit(500);
        if (stRes.data) studyData = stRes.data;
        newStatus.studySessions = {
          ok: !stRes.error,
          count: studyData.length,
          error: stRes.error?.message || null,
        };
      } catch {}
    }

    setDbMetrics(metrics);
    setTableStatus(newStatus);

    // 3. AGGREGATE DAILY & WEEKLY STATS FROM REAL SESSION RECORDS ONLY
    const dailyMap = new Map<
      string,
      {
        activity_date: string;
        activeUsers: Set<string>;
        total_duration_minutes: number;
        total_sessions: number;
        scores: number[];
      }
    >();

    const processRecord = (
      created_at?: string,
      durationMin?: number,
      userId?: string,
      score?: number,
    ) => {
      if (!created_at) return;
      const dateStr = created_at.split('T')[0];
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          activity_date: dateStr,
          activeUsers: new Set(),
          total_duration_minutes: 0,
          total_sessions: 0,
          scores: [],
        });
      }
      const entry = dailyMap.get(dateStr)!;
      if (userId) entry.activeUsers.add(userId);
      entry.total_duration_minutes += Math.max(0, Math.round(durationMin || 0));
      entry.total_sessions += 1;
      if (typeof score === 'number' && score > 0) entry.scores.push(score);
    };

    speakingData.forEach((s: any) =>
      processRecord(
        s.created_at,
        (s.duration_seconds || 0) / 60,
        s.user_id,
        s.overall_score || s.grammar_score,
      ),
    );
    coachData.forEach((s: any) =>
      processRecord(
        s.created_at,
        (s.duration_seconds || 0) / 60,
        s.user_id,
        s.grammar_score || (s.fluency_score ? s.fluency_score * 20 : 0),
      ),
    );
    aiCoachData.forEach((s: any) =>
      processRecord(
        s.created_at,
        (s.duration_seconds || 0) / 60,
        s.user_id,
        s.grammar_score || s.vocabulary_score,
      ),
    );
    studyData.forEach((s: any) => processRecord(s.created_at, s.duration || 0, s.user_id));

    const allDailyStats = Array.from(dailyMap.values())
      .sort((a, b) => a.activity_date.localeCompare(b.activity_date))
      .map((entry) => {
        const avgScore =
          entry.scores.length > 0
            ? Math.round(entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length)
            : 0;
        return {
          activity_date: entry.activity_date,
          active_users: entry.activeUsers.size,
          total_duration_minutes: entry.total_duration_minutes,
          total_sessions: entry.total_sessions,
          avg_score: avgScore,
        };
      });

    setDailyStats(allDailyStats);
    if (allDailyStats.length > 0) {
      safeLocalStorage.setJSON('study_planner_admin_stats_cache', allDailyStats);
    }

    // 4. AGGREGATE PER-USER STATISTICS FROM REAL SESSIONS
    const statsMap: Record<string, UserAggregatedStats> = {};
    const scoresByUser: Record<string, number[]> = {};

    const initUserStat = (key: string) => {
      if (!statsMap[key]) {
        statsMap[key] = {
          totalSessions: 0,
          studySessions: 0,
          speakingSessions: 0,
          aiCoachSessions: 0,
          totalDurationMinutes: 0,
          lastActiveDate: null,
          avgScore: null,
        };
      }
      return statsMap[key];
    };

    const addRecordToUser = (
      userId?: string,
      type?: 'study' | 'speak' | 'coach' | 'ai',
      durationMin?: number,
      createdAt?: string,
      score?: number,
    ) => {
      if (!userId) return;
      const stat = initUserStat(userId);
      stat.totalSessions += 1;
      stat.totalDurationMinutes += Math.max(0, Math.round(durationMin || 0));
      if (type === 'study') stat.studySessions += 1;
      else if (type === 'speak') stat.speakingSessions += 1;
      else if (type === 'coach' || type === 'ai') stat.aiCoachSessions += 1;

      if (createdAt) {
        if (
          !stat.lastActiveDate ||
          new Date(createdAt).getTime() > new Date(stat.lastActiveDate).getTime()
        ) {
          stat.lastActiveDate = createdAt;
        }
      }

      if (typeof score === 'number' && score > 0) {
        if (!scoresByUser[userId]) scoresByUser[userId] = [];
        scoresByUser[userId].push(score);
      }
    };

    studyData.forEach((s: any) =>
      addRecordToUser(s.user_id, 'study', s.duration || 0, s.created_at),
    );
    speakingData.forEach((s: any) =>
      addRecordToUser(
        s.user_id,
        'speak',
        (s.duration_seconds || 0) / 60,
        s.created_at,
        s.overall_score || s.grammar_score,
      ),
    );
    coachData.forEach((s: any) =>
      addRecordToUser(
        s.user_id,
        'coach',
        (s.duration_seconds || 0) / 60,
        s.created_at,
        s.grammar_score || (s.fluency_score ? s.fluency_score * 20 : 0),
      ),
    );
    aiCoachData.forEach((s: any) =>
      addRecordToUser(
        s.user_id,
        'ai',
        (s.duration_seconds || 0) / 60,
        s.created_at,
        s.grammar_score || s.vocabulary_score,
      ),
    );

    for (const [uid, scoreList] of Object.entries(scoresByUser)) {
      if (statsMap[uid] && scoreList.length > 0) {
        statsMap[uid].avgScore = Math.round(
          scoreList.reduce((a, b) => a + b, 0) / scoreList.length,
        );
      }
    }

    setUserStatsMap(statsMap);

    // 5. BUILD USER_ID → EMAIL MAP FROM LOADED USERS
    const profileMap = new Map<string, string>();
    loadedUsers.forEach((u) => {
      if (u.id && u.email) profileMap.set(u.id, u.email);
    });

    const resolveEmail = (record: any): string => {
      if (record.user_email && record.user_email !== 'student@nihon-talk.com')
        return record.user_email;
      if (record.user_id && profileMap.has(record.user_id)) return profileMap.get(record.user_id)!;
      return "Noma'lum";
    };

    // 6. COMBINE REAL CONVERSATION HISTORY RECORDS
    const combinedSpeech = [
      ...speakingData.map((s) => ({
        id: s.id,
        user_id: s.user_id,
        user_email: resolveEmail(s),
        created_at: s.created_at,
        duration_seconds: s.duration_seconds || 0,
        persona_title: s.persona_title || s.topic || 'Yaponcha Suhbat',
        score: s.overall_score || s.grammar_score || 0,
        feedback: s.feedback || s.ai_feedback || 'Mavjud emas',
        transcript: Array.isArray(s.transcript) && s.transcript.length > 0 ? s.transcript : null,
        type: 'Speaking',
      })),
      ...coachData.map((s) => ({
        id: s.id,
        user_id: s.user_id,
        user_email: resolveEmail(s),
        created_at: s.created_at,
        duration_seconds: s.duration_seconds || 0,
        persona_title: s.persona || s.persona_title || 'Speaking Coach',
        score: s.grammar_score || (s.fluency_score ? Math.round(s.fluency_score * 20) : 0),
        feedback: s.feedback || 'Mavjud emas',
        transcript: Array.isArray(s.transcript) && s.transcript.length > 0 ? s.transcript : null,
        type: 'Speaking Coach',
      })),
      ...aiCoachData.map((s) => ({
        id: s.id,
        user_id: s.user_id,
        user_email: resolveEmail(s),
        created_at: s.created_at,
        duration_seconds: s.duration_seconds || 0,
        persona_title: s.persona_title || 'AI Coach',
        score: s.grammar_score || s.vocabulary_score || 0,
        transcript: Array.isArray(s.transcript) && s.transcript.length > 0 ? s.transcript : null,
        type: 'AI Coach',
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setSpeechRecords(combinedSpeech);
    setLoading(false);
  }, [user]);

  const [authEmail, setAuthEmail] = useState<string>(() => user?.email || '');
  const [authRole, setAuthRole] = useState<string | undefined>(
    () => (user as { role?: string })?.role,
  );

  useEffect(() => {
    const resolveAdminRole = async () => {
      let email = user?.email;
      let rawRole = (user as any)?.role;
      let metaRole = (user as any)?.user_metadata?.role || (user as any)?.app_metadata?.role;
      let resolvedRole = rawRole && rawRole !== 'authenticated' ? rawRole : undefined;
      resolvedRole = resolvedRole || metaRole;

      if (!email) {
        try {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            email = data.user.email;
            metaRole = data.user.user_metadata?.role || data.user.app_metadata?.role;
            resolvedRole = metaRole || (data.user as any).role;
            if (resolvedRole === 'authenticated') resolvedRole = metaRole;
          }
        } catch {}
      }

      if (email) {
        setAuthEmail(email);
        // If role not resolved yet, check profiles table
        if (!resolvedRole || resolvedRole === 'authenticated') {
          try {
            const uid = user?.id || (await supabase.auth.getUser()).data?.user?.id;
            if (uid) {
              const { data: prof } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', uid)
                .single();
              if (prof?.role) resolvedRole = prof.role;
            }
          } catch {}
        }
        if (resolvedRole && resolvedRole !== 'authenticated') {
          setAuthRole(resolvedRole.toLowerCase());
        }
      }
    };
    resolveAdminRole();
  }, [user]);

  const isAuthorized = Boolean(
    authEmail && (isAdminEmail(authEmail, authRole) || isUserAdmin(user)),
  );

  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1200);

    (async () => {
      try {
        await fetchAdminData();
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [fetchAdminData]);

  // Realtime Postgres Changes Subscription (debounced to prevent query storms)
  useEffect(() => {
    if (!isAuthorized) return;

    const debouncedFetch = () => {
      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
      fetchDebounceRef.current = setTimeout(() => {
        fetchAdminData();
      }, 2000); // 2s debounce — prevents rapid-fire fetches
    };

    const channel = supabase
      .channel('admin_dashboard_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'speaking_sessions' },
        debouncedFetch,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'speaking_coach_sessions' },
        debouncedFetch,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_coach_sessions' },
        debouncedFetch,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_sessions' },
        debouncedFetch,
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debouncedFetch)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeActive(true);
        }
      });

    return () => {
      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [isAuthorized, fetchAdminData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAdminData();
      toast({
        title: "🔄 DB Ma'lumotlari Yangilandi",
        description: "Real DB dan barcha ma'lumotlar muvaffaqiyatli yuklandi.",
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: e?.message || "Ma'lumotlarni yuklashda xatolik yuz berdi",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendMsg = async () => {
    if (!messageModalUser || !msgTitle.trim() || !msgContent.trim()) return;
    setSendingMsg(true);
    try {
      await UserNotificationService.sendNotification({
        user_id: messageModalUser.id,
        title: msgTitle,
        message: msgContent,
        type: 'admin',
      });
      toast({
        title: '✅ Xabar Yuborildi',
        description: `Xabar ${messageModalUser.email} ga muvaffaqiyatli yetkazildi.`,
      });
      setMessageModalUser(null);
      setMsgContent('');
    } catch {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: 'Xabar yuborishda xatolik yuz berdi.',
      });
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCloseMessageModal = () => {
    setMessageModalUser(null);
    setMsgContent('');
    setMsgTitle('🎁 Maxsus Xabar');
  };

  const handleOpenConfirmModal = (
    type: 'grant' | 'revoke',
    targetEmail: string,
    targetRole?: string,
    targetId?: string,
    targetName?: string,
  ) => {
    if (isSuperAdmin(targetEmail, targetRole)) {
      toast({
        variant: 'destructive',
        title: 'Taqiqlangan',
        description: "Super Admin rolini o'zgartirish mumkin emas.",
      });
      return;
    }
    setConfirmActionModal({
      isOpen: true,
      type,
      targetEmail,
      targetId,
      targetName,
      loading: false,
    });
  };

  const executeConfirmedAdminAction = async () => {
    if (!confirmActionModal.targetEmail) return;
    setConfirmActionModal((prev) => ({ ...prev, loading: true }));
    try {
      const actorEmail = user?.email || SUPER_ADMIN_EMAIL;
      const targetEmail = confirmActionModal.targetEmail;
      const targetId = confirmActionModal.targetId;

      if (confirmActionModal.type === 'revoke') {
        const success = await revokeAdminRole(targetEmail, targetId, actorEmail);
        if (success) {
          toast({
            title: '🛡️ Adminlik Bekor Qilindi',
            description: `${targetEmail} adminlikdan muvaffaqiyatli chiqarildi.`,
          });
          setUsersList((prev) =>
            prev.map((u) =>
              u.email?.toLowerCase() === targetEmail.toLowerCase() ||
              (targetId && u.id === targetId)
                ? { ...u, role: 'user', admin_assigned_by: null, admin_assigned_at: null }
                : u,
            ),
          );
          setConfirmActionModal({ isOpen: false, type: 'revoke', targetEmail: '', loading: false });
          fetchAdminData();
        } else {
          toast({
            variant: 'destructive',
            title: 'Xatolik',
            description: `${targetEmail} adminlikni bekor qilishda xatolik yuz berdi.`,
          });
          setConfirmActionModal((prev) => ({ ...prev, loading: false }));
        }
      } else {
        const success = await grantAdminRole(targetEmail, targetId, actorEmail);
        if (success) {
          toast({
            title: '🛡️ Admin Roli Berildi',
            description: `${targetEmail} ga Admin roli muvaffaqiyatli berildi!`,
          });
          setUsersList((prev) =>
            prev.map((u) =>
              u.email?.toLowerCase() === targetEmail.toLowerCase() ||
              (targetId && u.id === targetId)
                ? {
                    ...u,
                    role: 'admin',
                    admin_assigned_by: actorEmail,
                    admin_assigned_at: new Date().toISOString(),
                  }
                : u,
            ),
          );
          setConfirmActionModal({ isOpen: false, type: 'grant', targetEmail: '', loading: false });
          fetchAdminData();
        } else {
          toast({
            variant: 'destructive',
            title: 'Xatolik',
            description: `${targetEmail} ga admin roli berishda xatolik yuz berdi.`,
          });
          setConfirmActionModal((prev) => ({ ...prev, loading: false }));
        }
      }
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: e?.message || 'Amalni bajarishda xatolik yuz berdi.',
      });
      setConfirmActionModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleOpenAuditModal = async () => {
    setAuditModalOpen(true);
    setLoadingAuditLogs(true);
    try {
      const logs = await getAdminAuditLogs();
      setAuditLogs(logs);
    } catch {
      setAuditLogs([]);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const handleToggleAdmin = (targetEmail: string, targetRole?: string, targetId?: string) => {
    const isCurrentlyAdmin = isAdminEmail(targetEmail, targetRole);
    handleOpenConfirmModal(
      isCurrentlyAdmin ? 'revoke' : 'grant',
      targetEmail,
      targetRole,
      targetId,
    );
  };

  const handleAssignAdminByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToAssign = assignAdminEmailInput.trim();
    if (!emailToAssign) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: 'Iltimos, email manzilini kiriting.',
      });
      return;
    }
    if (isSuperAdmin(emailToAssign)) {
      toast({
        variant: 'destructive',
        title: 'Taqiqlangan',
        description: 'Ushbu foydalanuvchi allaqachon Super Admin.',
      });
      return;
    }
    setAssigningAdmin(true);
    try {
      const matchedUser = usersList.find(
        (u) => u.email?.toLowerCase() === emailToAssign.toLowerCase(),
      );
      const actorEmail = user?.email || SUPER_ADMIN_EMAIL;
      const success = await grantAdminRole(emailToAssign, matchedUser?.id, actorEmail);
      if (success) {
        toast({
          title: '🛡️ Admin Roli Berildi',
          description: `${emailToAssign} muvaffaqiyatli Admin etib tayinlandi!`,
        });
        setUsersList((prev) =>
          prev.map((u) =>
            u.email?.toLowerCase() === emailToAssign.toLowerCase()
              ? {
                  ...u,
                  role: 'admin',
                  admin_assigned_by: actorEmail,
                  admin_assigned_at: new Date().toISOString(),
                }
              : u,
          ),
        );
        setAssignAdminEmailInput('');
        setAssignAdminModalOpen(false);
        fetchAdminData();
      } else {
        toast({
          variant: 'destructive',
          title: 'Xatolik',
          description: `${emailToAssign} ga admin roli berishda xatolik yuz berdi.`,
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: err?.message || 'Kutilmagan xatolik yuz berdi.',
      });
    } finally {
      setAssigningAdmin(false);
    }
  };

  const exportUsersToCSV = () => {
    if (usersList.length === 0) {
      toast({
        title: "Ma'lumot yo'q",
        description: 'Eksport qilish uchun foydalanuvchilar mavjud emas.',
      });
      return;
    }
    const headers = [
      'ID',
      'Ism',
      'Email',
      'Rol',
      'Royxatdan Otgan',
      'Oxirgi Kirish',
      'Jami Mashgulotlar',
      'Jami Vaqt (daqiqa)',
      'Ortacha Ball',
    ];
    const rows = usersList.map((u) => {
      const stat = userStatsMap[u.id];
      return [
        `"${u.id}"`,
        `"${(u.full_name || '').replace(/"/g, '""')}"`,
        `"${u.email}"`,
        `"${u.role || 'user'}"`,
        `"${u.created_at || ''}"`,
        `"${u.last_sign_in_at || ''}"`,
        stat?.totalSessions || 0,
        stat?.totalDurationMinutes || 0,
        stat?.avgScore ? `${stat.avgScore}%` : 'N/A',
      ].join(',');
    });

    const csvString = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nihon_talk_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: '📥 CSV Yuklab Olindi',
      description: `${usersList.length} ta foydalanuvchi ma'lumoti yuklandi.`,
    });
  };

  const exportSpeechToCSV = () => {
    if (speechRecords.length === 0) {
      toast({
        title: "Ma'lumot yo'q",
        description: 'Eksport qilish uchun muloqot yozuvlari mavjud emas.',
      });
      return;
    }
    const headers = [
      'ID',
      'Email',
      'Turi',
      'Mavzu/Persona',
      'Ball',
      'Davomiyligi (soniya)',
      'Sana',
    ];
    const rows = speechRecords.map((s) =>
      [
        `"${s.id}"`,
        `"${s.user_email}"`,
        `"${s.type}"`,
        `"${(s.persona_title || '').replace(/"/g, '""')}"`,
        s.score || 0,
        s.duration_seconds || 0,
        `"${s.created_at}"`,
      ].join(','),
    );

    const csvString = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `nihon_talk_speech_history_${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: '📥 CSV Yuklab Olindi',
      description: `${speechRecords.length} ta suhbat yozuvi yuklandi.`,
    });
  };

  // User Role Filter Calculations
  const studentUsers = usersList.filter((s) => !isAdminEmail(s.email, s.role));
  const adminUsers = usersList.filter((s) => isAdminEmail(s.email, s.role));
  const totalStudentsCount = studentUsers.length;
  const totalAdminsCount = adminUsers.length;
  const totalAllUsers = usersList.length;

  // Real Activity Stats Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayStat = dailyStats.find((s) => s.activity_date === todayStr);
  const activeTodayCount = todayStat ? todayStat.active_users : 0;
  const todaySessionsCount = todayStat ? todayStat.total_sessions : 0;

  const totalSessionsCount = dailyStats.reduce((sum, d) => sum + (d.total_sessions || 0), 0);
  const totalDurationMinutes = dailyStats.reduce(
    (sum, d) => sum + (d.total_duration_minutes || 0),
    0,
  );
  const totalDurationHours = Math.floor(totalDurationMinutes / 60);
  const remainingMinutes = totalDurationMinutes % 60;

  const totalSpeakingSeconds = speechRecords.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
  const totalSpeakingMinutes = Math.round(totalSpeakingSeconds / 60);

  // Real Averages (Calculated from Real DB Score Records Only)
  const todayScores = speechRecords
    .filter(
      (r) =>
        r.created_at &&
        r.created_at.split('T')[0] === todayStr &&
        typeof r.score === 'number' &&
        r.score > 0,
    )
    .map((r) => r.score);
  const dailyAvgPercent =
    todayScores.length > 0
      ? Math.round(todayScores.reduce((a, b) => a + b, 0) / todayScores.length)
      : 0;

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString().split('T')[0];
  const weeklyScores = speechRecords
    .filter(
      (r) =>
        r.created_at &&
        r.created_at.split('T')[0] >= sevenDaysAgo &&
        typeof r.score === 'number' &&
        r.score > 0,
    )
    .map((r) => r.score);
  const weeklyAvgPercent =
    weeklyScores.length > 0
      ? Math.round(weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length)
      : 0;

  const roleFilteredUsers =
    roleFilter === 'all'
      ? usersList
      : roleFilter === 'admin'
        ? usersList.filter((s) => isAdminEmail(s.email, s.role))
        : usersList.filter((s) => !isAdminEmail(s.email, s.role));

  const searchedUsers = userSearchQuery.trim()
    ? roleFilteredUsers.filter(
        (s) =>
          s.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
          (s.full_name && s.full_name.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
          (s.role && s.role.toLowerCase().includes(userSearchQuery.toLowerCase())),
      )
    : roleFilteredUsers;

  const sortedUsers = [...searchedUsers].sort((a, b) => {
    const statA = userStatsMap[a.id];
    const statB = userStatsMap[b.id];
    if (sortBy === 'newest') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    }
    if (sortBy === 'sessions') {
      return (statB?.totalSessions || 0) - (statA?.totalSessions || 0);
    }
    if (sortBy === 'duration') {
      return (statB?.totalDurationMinutes || 0) - (statA?.totalDurationMinutes || 0);
    }
    if (sortBy === 'name') {
      return (a.full_name || a.email).localeCompare(b.full_name || b.email);
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedUsers.length / USERS_PER_PAGE);
  const paginatedUsers = sortedUsers.slice(
    usersPage * USERS_PER_PAGE,
    (usersPage + 1) * USERS_PER_PAGE,
  );

  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  if (!isAuthorized)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <span className="text-5xl">🔒</span>
        <h2 className="text-xl font-bold text-foreground">Kirish taqiqlangan</h2>
        <p className="max-w-sm text-xs text-muted-foreground">
          Bu sahifaga faqat admin foydalanuvchilari kira oladi.
        </p>
        <Button onClick={() => navigate('/')} className="mt-2 gap-2">
          <Home className="h-4 w-4" /> Bosh sahifaga
        </Button>
      </div>
    );

  // Filter user speech records for the detail modal
  const userDetailSpeechRecords = selectedDetailUser
    ? speechRecords.filter(
        (r) => r.user_id === selectedDetailUser.id || r.user_email === selectedDetailUser.email,
      )
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-3 pb-24 duration-300 animate-in fade-in sm:px-6 md:pb-12">
      {/* Top Bar Header */}
      <div className="flex flex-col justify-between gap-3.5 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h1
              onClick={handleSecretTitleClick}
              className="cursor-default select-none font-display text-xl font-black tracking-tight text-foreground transition-colors hover:text-primary active:scale-[0.99] sm:text-2xl"
              title="kaiwa.live Admin Console"
            >
              {isJa ? 'システム管理者ダッシュボード' : 'Super Admin Paneli'}
            </h1>
            {isRealtimeActive && (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"></span> Live
                DB
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isJa
              ? 'ユーザー学習動向・AIコーチング評価・システム稼働状況の総合管理コンソール'
              : "Foydalanuvchilar faolligi, ta'lim ko'rsatkichlari va AI Coach tahlillari boshqaruvi"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setAssignAdminModalOpen(true)}
            className="flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
            title={isJa ? '管理者を指名' : 'Yangi admin tayinlash'}
          >
            <ShieldCheck size={14} className="text-primary" />{' '}
            {isJa ? '管理者指名' : 'Admin Tayinlash'}
          </button>
          <button
            onClick={handleOpenAuditModal}
            className="flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/80"
            title={isJa ? '管理者権限変更ログ' : 'Adminlar tayinlash va bekor qilish tarixi'}
          >
            <Clock size={14} className="text-primary" /> {isJa ? '管理者履歴' : 'Adminlar Tarixi'}
          </button>
          <button
            onClick={() => setIsBroadcastOpen(true)}
            className="flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/80"
            title={
              isJa
                ? '全ユーザーにお知らせを配信'
                : 'Barcha foydalanuvchilarga bildirishnoma yuborish'
            }
          >
            <Radio size={14} className="text-primary" /> {isJa ? '一斉通知' : "E'lon / Broadcast"}
          </button>
          {(activeSection === 'users' || activeSection === 'speech') && (
            <button
              onClick={activeSection === 'speech' ? exportSpeechToCSV : exportUsersToCSV}
              className="flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/80"
              title={isJa ? 'CSVエクスポート' : 'Joriy jadvalni CSV formatida yuklab olish'}
            >
              <Download size={14} /> {isJa ? 'CSV出力' : 'CSV Yuklab Olish'}
            </button>
          )}
          <button
            onClick={() => setIsCleanerOpen(true)}
            className="flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/80"
          >
            <Wand2 size={14} className="text-[#C9A961]" /> AI Cleaner
          </button>
          <button
            onClick={() => navigate('/admin/exams')}
            className="flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90"
          >
            <BookOpen size={14} /> {isJa ? '模擬試験管理' : 'Imtihonlar'}
          </button>
          <button
            onClick={handleRefresh}
            className="flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/80"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />{' '}
            {isJa ? '更新' : 'Yangilash'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="scrollbar-hide flex w-full shrink-0 items-center gap-1.5 overflow-x-auto rounded-2xl border border-border bg-muted/60 p-1.5 text-xs font-bold sm:w-fit">
        <button
          onClick={() => setActiveSection('users')}
          className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 transition-all ${
            activeSection === 'users'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users size={14} />{' '}
          {isJa
            ? `ユーザー一覧・統計 (${totalAllUsers})`
            : `Foydalanuvchilar & Faollik (${totalAllUsers})`}
        </button>
        <button
          onClick={() => setActiveSection('speech')}
          className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 transition-all ${
            activeSection === 'speech'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Mic size={14} />{' '}
          {isJa
            ? `AI会話ログ (${speechRecords.length})`
            : `AI Coach Natijalari (${speechRecords.length})`}
        </button>
        <button
          onClick={() => setActiveSection('scenarios')}
          className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 transition-all ${
            activeSection === 'scenarios'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquareText size={14} /> {isJa ? 'シナリオ管理' : 'Yaponcha Ssenariylar'}
        </button>
        <button
          onClick={() => setActiveSection('content')}
          className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 transition-all ${
            activeSection === 'content'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen size={14} /> {isJa ? 'コンテンツ作成・管理' : "Kontent Qo'shish & Boshqaruv"}
        </button>
        <button
          onClick={() => setActiveSection('quality')}
          className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 transition-all ${
            activeSection === 'quality'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 size={14} /> {isJa ? 'N3–N1 品質監査' : 'N3–N1 Kontent Sifati'}
        </button>
      </div>

      {activeSection === 'users' && (
        <div className="space-y-6 duration-200 animate-in fade-in">
          <AdminMetricsOverview
            dbMetrics={dbMetrics}
            isJa={isJa}
            totalStudentsCount={totalStudentsCount}
            totalAllUsers={totalAllUsers}
            totalAdminsCount={totalAdminsCount}
            activeTodayCount={activeTodayCount}
            totalSessionsCount={totalSessionsCount}
            totalDurationHours={totalDurationHours}
            remainingMinutes={remainingMinutes}
            totalDurationMinutes={totalDurationMinutes}
            todaySessionsCount={todaySessionsCount}
            dailyAvgPercent={dailyAvgPercent}
            weeklyAvgPercent={weeklyAvgPercent}
            totalSpeakingMinutes={totalSpeakingMinutes}
            chartMode={chartMode}
            setChartMode={setChartMode}
            dailyStats={dailyStats}
          />
          <AdminUsersTable
            sortedUsers={sortedUsers}
            paginatedUsers={paginatedUsers}
            totalAllUsers={totalAllUsers}
            totalStudentsCount={totalStudentsCount}
            totalAdminsCount={totalAdminsCount}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            userSearchQuery={userSearchQuery}
            setUserSearchQuery={setUserSearchQuery}
            usersPage={usersPage}
            setUsersPage={setUsersPage}
            totalPages={totalPages}
            tableStatus={tableStatus}
            userStatsMap={userStatsMap}
            isJa={isJa}
            onSelectDetailUser={setSelectedDetailUser}
            onMessageModalUser={setMessageModalUser}
            onToggleAdmin={handleToggleAdmin}
            isSuperAdmin={isSuperAdmin}
            isAdminEmail={isAdminEmail}
            usersPerPage={USERS_PER_PAGE}
          />
        </div>
      )}

      {activeSection === 'speech' && (
        <Suspense fallback={<AdminTabFallback />}>
          <AdminSpeechAnalytics records={speechRecords} />
        </Suspense>
      )}

      {activeSection === 'scenarios' && (
        <Suspense fallback={<AdminTabFallback />}>
          <AdminScenarioManager />
        </Suspense>
      )}

      {activeSection === 'content' && (
        <Suspense fallback={<AdminTabFallback />}>
          <AdminContentStudio />
        </Suspense>
      )}
      {activeSection === 'quality' && (
        <Suspense fallback={<AdminTabFallback />}>
          <AdminContentQualityDashboard />
        </Suspense>
      )}

      {/* REAL DB FORENSIC DEBUG INDICATOR BAR */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-[11px] text-slate-300">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="font-bold text-slate-100">REAL DB STATUS:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span>
            RPC Users:{' '}
            <strong className={tableStatus.rpcUsers.ok ? 'text-emerald-400' : 'text-rose-400'}>
              {tableStatus.rpcUsers.count}
            </strong>
          </span>
          <span>
            Profiles:{' '}
            <strong className={tableStatus.profiles.ok ? 'text-emerald-400' : 'text-rose-400'}>
              {tableStatus.profiles.count}
            </strong>
          </span>
          <span>
            Study Sessions:{' '}
            <strong className={tableStatus.studySessions.ok ? 'text-emerald-400' : 'text-rose-400'}>
              {tableStatus.studySessions.count}
            </strong>
          </span>
          <span>
            Speaking Sessions:{' '}
            <strong
              className={tableStatus.speakingSessions.ok ? 'text-emerald-400' : 'text-rose-400'}
            >
              {tableStatus.speakingSessions.count}
            </strong>
          </span>
          <span>
            Speaking Coach:{' '}
            <strong
              className={
                tableStatus.speakingCoachSessions.ok ? 'text-emerald-400' : 'text-rose-400'
              }
            >
              {tableStatus.speakingCoachSessions.count}
            </strong>
          </span>
          <span>
            AI Coach:{' '}
            <strong
              className={tableStatus.aiCoachSessions.ok ? 'text-emerald-400' : 'text-rose-400'}
            >
              {tableStatus.aiCoachSessions.count}
            </strong>
          </span>
        </div>
      </div>

      {/* User Profile Detail View Modal */}
      {selectedDetailUser && (
        <Suspense fallback={null}>
          <AdminUserDetailModal
            user={selectedDetailUser}
            userStats={selectedDetailUser ? userStatsMap[selectedDetailUser.id] : undefined}
            speechRecords={userDetailSpeechRecords}
            onClose={() => setSelectedDetailUser(null)}
            onOpenMessageModal={(targetUser) => {
              setMessageModalUser(targetUser);
              setSelectedDetailUser(null);
            }}
            isJa={isJa}
          />
        </Suspense>
      )}

      {/* Global Broadcast Announcement Modal */}
      {isBroadcastOpen && (
        <Suspense fallback={null}>
          <AdminBroadcastModal
            isOpen={isBroadcastOpen}
            onClose={() => setIsBroadcastOpen(false)}
            isJa={isJa}
          />
        </Suspense>
      )}

      {/* Direct User Message Modal */}
      {messageModalUser && (
        <div
          className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={handleCloseMessageModal}
        >
          <div
            className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Xabar Yuborish: {messageModalUser.email}
              </h3>
              <button
                onClick={handleCloseMessageModal}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              value={msgTitle}
              onChange={(e) => setMsgTitle(e.target.value)}
              placeholder="Sarlavha"
              className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
            />
            <textarea
              rows={3}
              value={msgContent}
              onChange={(e) => setMsgContent(e.target.value)}
              placeholder="Xabar matni..."
              className="w-full resize-none rounded-xl border border-border bg-muted px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCloseMessageModal}
                className="flex-1 text-xs"
              >
                Bekor qilish
              </Button>
              <Button onClick={handleSendMsg} disabled={sendingMsg} className="flex-1 text-xs">
                Yuborish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Admin Modal */}
      {assignAdminModalOpen && (
        <div
          className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            if (!assigningAdmin) setAssignAdminModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  {isJa ? '管理者権限の付与' : 'Yangi Admin Tayinlash'}
                </h3>
              </div>
              <button
                onClick={() => setAssignAdminModalOpen(false)}
                disabled={assigningAdmin}
                className="cursor-pointer rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              {isJa
                ? '登録済みユーザーのメールアドレスを指定して管理者権限を付与します。'
                : "Ro'yxatdan o'tgan foydalanuvchining email manzilini kiritib, unga Admin maqomini bering."}
            </p>

            <form onSubmit={handleAssignAdminByEmail} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  {isJa ? '対象メールアドレス' : 'Foydalanuvchi Emaili'}
                </label>
                <input
                  type="email"
                  value={assignAdminEmailInput}
                  onChange={(e) => setAssignAdminEmailInput(e.target.value)}
                  placeholder="masalan: user@nihongo-talk.jp"
                  required
                  disabled={assigningAdmin}
                  className="focus:outline-hidden w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              {/* Suggestions from loaded users */}
              {assignAdminEmailInput.trim().length > 1 && (
                <div className="max-h-28 overflow-y-auto rounded-xl border border-border/70 bg-muted/40 p-1.5 text-xs">
                  {usersList
                    .filter(
                      (u) =>
                        u.email
                          ?.toLowerCase()
                          .includes(assignAdminEmailInput.toLowerCase().trim()) &&
                        !isSuperAdmin(u.email),
                    )
                    .slice(0, 3)
                    .map((matched) => (
                      <button
                        key={matched.id}
                        type="button"
                        onClick={() => setAssignAdminEmailInput(matched.email)}
                        className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-1 text-left hover:bg-muted"
                      >
                        <span className="truncate font-medium text-foreground">
                          {matched.email}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {matched.full_name || 'Talaba'} ({matched.role || 'user'})
                        </span>
                      </button>
                    ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssignAdminModalOpen(false)}
                  disabled={assigningAdmin}
                  className="flex-1 text-xs"
                >
                  {isJa ? 'キャンセル' : 'Bekor qilish'}
                </Button>
                <Button
                  type="submit"
                  disabled={assigningAdmin || !assignAdminEmailInput.trim()}
                  className="flex-1 gap-1.5 bg-primary text-xs text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                >
                  {assigningAdmin ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={13} />
                  )}
                  {isJa ? '管理者を付与' : 'Admin Qilish'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Action Confirmation Dialog (Grant / Revoke) */}
      {confirmActionModal.isOpen && (
        <div
          className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            if (!confirmActionModal.loading) {
              setConfirmActionModal((prev) => ({ ...prev, isOpen: false }));
            }
          }}
        >
          <div
            className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                {confirmActionModal.type === 'revoke' ? (
                  <AlertTriangle size={20} className="text-red-400" />
                ) : (
                  <ShieldCheck size={20} className="text-primary" />
                )}
                <h3 className="text-sm font-bold text-foreground">
                  {confirmActionModal.type === 'revoke'
                    ? isJa
                      ? '管理者権限の解除確認'
                      : 'Adminlikni Bekor Qilish'
                    : isJa
                      ? '管理者権限の付与確認'
                      : 'Admin Qilib Tayinlash'}
                </h3>
              </div>
              <button
                onClick={() => {
                  if (!confirmActionModal.loading) {
                    setConfirmActionModal((prev) => ({ ...prev, isOpen: false }));
                  }
                }}
                disabled={confirmActionModal.loading}
                className="cursor-pointer rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1 rounded-xl border border-border bg-muted/40 p-3 text-xs">
              <div className="font-semibold text-foreground">
                {confirmActionModal.targetName || 'Foydalanuvchi'}:
              </div>
              <div className="font-mono font-bold text-primary">
                {confirmActionModal.targetEmail}
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              {confirmActionModal.type === 'revoke' ? (
                <>
                  <span className="font-semibold text-red-400">⚠️ Diqqat:</span> Siz haqiqatan ham
                  ushbu foydalanuvchini adminlikdan olib tashlamoqchimisiz? Foydalanuvchi Admin
                  Panelga kirish, o'quv bazasi va kontentni boshqarish huquqlaridan mahrum qilinadi.
                </>
              ) : (
                <>
                  <span className="font-semibold text-primary">🛡️ Ma'lumot:</span> Ushbu
                  foydalanuvchiga Adminlik maqomini bermoqchimisiz? U Admin Panel va tizim
                  resurslarini boshqarish huquqiga ega bo'ladi.
                </>
              )}
            </p>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmActionModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={confirmActionModal.loading}
                className="flex-1 text-xs"
              >
                {isJa ? 'キャンセル' : 'Bekor qilish'}
              </Button>
              <Button
                type="button"
                onClick={executeConfirmedAdminAction}
                disabled={confirmActionModal.loading}
                className={`flex-1 gap-1.5 text-xs font-bold text-white shadow-md ${
                  confirmActionModal.type === 'revoke'
                    ? 'bg-red-600 shadow-red-600/20 hover:bg-red-700'
                    : 'bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90'
                }`}
              >
                {confirmActionModal.loading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : confirmActionModal.type === 'revoke' ? (
                  <AlertTriangle size={13} />
                ) : (
                  <ShieldCheck size={13} />
                )}
                {confirmActionModal.type === 'revoke'
                  ? isJa
                    ? '解除を実行'
                    : 'Ha, Adminlikdan Olish'
                  : isJa
                    ? '権限を付与'
                    : 'Ha, Admin Qilish'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Audit History Logs Modal */}
      {auditModalOpen && (
        <Suspense fallback={null}>
          <AdminAuditLogsModal
            isOpen={auditModalOpen}
            onClose={() => setAuditModalOpen(false)}
            auditLogs={auditLogs}
            loading={loadingAuditLogs}
            isJa={isJa}
          />
        </Suspense>
      )}

      {/* SECRET DEVELOPER DATASET & VOICE VAULT MODAL */}
      {isVaultOpen && (
        <Suspense fallback={null}>
          <AdminDatasetVaultModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />
        </Suspense>
      )}

      {isCleanerOpen && (
        <Suspense fallback={null}>
          <AdminAiCardCleanerModal isOpen={isCleanerOpen} onClose={() => setIsCleanerOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
