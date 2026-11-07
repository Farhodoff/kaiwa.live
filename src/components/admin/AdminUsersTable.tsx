import React from 'react';
import { Users, ArrowUpDown, Search, AlertTriangle, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { RoleBadge } from './RoleBadge';

export interface UserRecord {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  created_at: string;
  last_sign_in_at?: string;
  admin_assigned_by?: string | null;
  admin_assigned_at?: string | null;
}

export interface UserAggregatedStats {
  totalSessions: number;
  studySessions: number;
  speakingSessions: number;
  aiCoachSessions: number;
  totalDurationMinutes: number;
  lastActiveDate: string | null;
  avgScore: number | null;
}

export interface AdminUsersTableProps {
  sortedUsers: UserRecord[];
  paginatedUsers: UserRecord[];
  totalAllUsers: number;
  totalStudentsCount: number;
  totalAdminsCount: number;
  roleFilter: 'all' | 'admin' | 'student';
  setRoleFilter: (filter: 'all' | 'admin' | 'student') => void;
  sortBy: 'newest' | 'oldest' | 'sessions' | 'duration' | 'name';
  setSortBy: (sort: 'newest' | 'oldest' | 'sessions' | 'duration' | 'name') => void;
  userSearchQuery: string;
  setUserSearchQuery: (q: string) => void;
  usersPage: number;
  setUsersPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  tableStatus: {
    rpcUsers: { ok: boolean; count: number; error: string | null };
  };
  userStatsMap: Record<string, UserAggregatedStats>;
  isJa: boolean;
  onSelectDetailUser: (user: UserRecord) => void;
  onMessageModalUser: (user: { id: string; email: string }) => void;
  onToggleAdmin: (email: string, role: string | undefined, userId: string) => void;
  isSuperAdmin: (email: string, role?: string) => boolean;
  isAdminEmail: (email: string, role?: string) => boolean;
  usersPerPage: number;
  onDeleteUser?: (user: UserRecord) => void;
  deletingUserId?: string | null;
}

export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({
  sortedUsers,
  paginatedUsers,
  totalAllUsers,
  totalStudentsCount,
  totalAdminsCount,
  roleFilter,
  setRoleFilter,
  sortBy,
  setSortBy,
  userSearchQuery,
  setUserSearchQuery,
  usersPage,
  setUsersPage,
  totalPages,
  tableStatus,
  userStatsMap,
  isJa,
  onSelectDetailUser,
  onMessageModalUser,
  onToggleAdmin,
  isSuperAdmin,
  isAdminEmail,
  usersPerPage,
  onDeleteUser,
  deletingUserId,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex flex-col justify-between gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Users size={16} className="text-primary" />
            {isJa
              ? `登録ユーザー一覧 (${sortedUsers.length})`
              : `Barcha Ro'yxatdan O'tgan Foydalanuvchilar (${sortedUsers.length})`}
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {isJa
              ? `データベースから取得した ${totalAllUsers} 件のアカウント`
              : `Supabase Real DB (\`get_admin_all_users\`) dan yuklangan ${totalAllUsers} ta akkount`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filters */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5 text-[11px] font-semibold">
            <button
              onClick={() => {
                setRoleFilter('all');
                setUsersPage(0);
              }}
              className={`cursor-pointer rounded-md px-2.5 py-1 transition-colors ${roleFilter === 'all' ? 'bg-primary font-bold text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {isJa ? `全件 (${totalAllUsers})` : `Barchasi (${totalAllUsers})`}
            </button>
            <button
              onClick={() => {
                setRoleFilter('student');
                setUsersPage(0);
              }}
              className={`cursor-pointer rounded-md px-2.5 py-1 transition-colors ${roleFilter === 'student' ? 'bg-primary font-bold text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {isJa ? `受講生 (${totalStudentsCount})` : `O'quvchilar (${totalStudentsCount})`}
            </button>
            <button
              onClick={() => {
                setRoleFilter('admin');
                setUsersPage(0);
              }}
              className={`cursor-pointer rounded-md px-2.5 py-1 transition-colors ${roleFilter === 'admin' ? 'bg-primary font-bold text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {isJa ? `管理者 (${totalAdminsCount})` : `Adminlar (${totalAdminsCount})`}
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-1 text-[11px] font-semibold">
            <ArrowUpDown size={12} className="text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setUsersPage(0);
              }}
              className="cursor-pointer bg-transparent text-[11px] text-foreground outline-none"
            >
              <option value="newest" className="bg-card text-foreground">
                {isJa ? '登録が新しい順' : "Yangi qo'shilganlar"}
              </option>
              <option value="oldest" className="bg-card text-foreground">
                {isJa ? '登録が古い順' : 'Eski foydalanuvchilar'}
              </option>
              <option value="sessions" className="bg-card text-foreground">
                {isJa ? '学習実績順' : "Mashg'ulotlar soni"}
              </option>
              <option value="duration" className="bg-card text-foreground">
                {isJa ? '学習時間順' : "O'rganish vaqti"}
              </option>
              <option value="name" className="bg-card text-foreground">
                {isJa ? '名前・メール (A-Z)' : 'Ism / Email (A-Z)'}
              </option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => {
                setUserSearchQuery(e.target.value);
                setUsersPage(0);
              }}
              placeholder={isJa ? 'ユーザー検索 (名前、メール)...' : 'Qidiruv (email, ism)...'}
              className="w-full rounded-xl border border-border bg-muted py-1.5 pl-8 pr-3 text-xs text-foreground outline-none focus:border-primary sm:w-52"
            />
          </div>
        </div>
      </div>

      {tableStatus.rpcUsers.error && sortedUsers.length === 0 && (
        <div className="m-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
          <AlertTriangle size={16} />
          <span>
            {isJa
              ? `データベース接続警告: ${tableStatus.rpcUsers.error}`
              : `RPC DB Xatosi: ${tableStatus.rpcUsers.error}`}
          </span>
        </div>
      )}

      <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">{isJa ? 'ユーザー / 所属' : 'Foydalanuvchi'}</th>
              <th className="p-3">{isJa ? '権限' : 'Rol'}</th>
              <th className="p-3">{isJa ? '学習実績' : "Mashg'ulotlar"}</th>
              <th className="p-3">{isJa ? '登録日' : "Ro'yxatdan O'tgan"}</th>
              <th className="p-3">{isJa ? '最終アクセス' : 'Oxirgi Faollik'}</th>
              <th className="p-3 text-right">{isJa ? '操作' : 'Amallar'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((u, idx) => {
                const stat = userStatsMap[u.id];
                return (
                  <tr key={u.id} className="transition-colors hover:bg-muted/30">
                    <td className="p-3 font-mono text-muted-foreground">
                      {usersPage * usersPerPage + idx + 1}
                    </td>
                    <td className="cursor-pointer p-3" onClick={() => onSelectDetailUser(u)}>
                      <div className="flex items-center gap-1.5 font-bold text-foreground transition-colors hover:text-primary">
                        {u.full_name || u.email.split('@')[0]}
                        <ChevronRight size={12} className="text-muted-foreground opacity-50" />
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <RoleBadge
                        role={u.role}
                        email={u.email}
                        assignedBy={u.admin_assigned_by}
                        assignedAt={u.admin_assigned_at}
                      />
                    </td>
                    <td className="p-3">
                      {stat && stat.totalSessions > 0 ? (
                        <div>
                          <span className="font-bold text-foreground">
                            {stat.totalSessions} {isJa ? '回' : 'ta'}
                          </span>
                          <div className="text-[10px] text-muted-foreground">
                            {stat.totalDurationMinutes} {isJa ? '分' : 'daqiqa'}{' '}
                            {stat.avgScore ? `• ${stat.avgScore}%` : ''}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString(isJa ? 'ja-JP' : undefined)
                        : '—'}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {stat?.lastActiveDate ? (
                        <div>
                          <span className="font-semibold text-emerald-400">
                            {new Date(stat.lastActiveDate).toLocaleDateString(
                              isJa ? 'ja-JP' : undefined,
                            )}
                          </span>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(stat.lastActiveDate).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ) : u.last_sign_in_at ? (
                        <div>
                          <span>
                            {new Date(u.last_sign_in_at).toLocaleDateString(
                              isJa ? 'ja-JP' : undefined,
                            )}
                          </span>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(u.last_sign_in_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSelectDetailUser(u)}
                          className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10"
                          title={isJa ? '詳細を見る' : "Batafsil ko'rish"}
                        >
                          <Eye size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMessageModalUser({ id: u.id, email: u.email })}
                          className="h-7 px-2 text-[11px]"
                        >
                          {isJa ? 'メッセージ' : 'Xabar'}
                        </Button>
                        {onDeleteUser && !isAdminEmail(u.email, u.role) && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={Boolean(deletingUserId)}
                            onClick={() => onDeleteUser(u)}
                            className="h-7 gap-1 px-2 text-xs text-destructive"
                          >
                            <Trash2 size={13} />
                            {deletingUserId === u.id ? 'O‘chirilmoqda…' : 'O‘chirish'}
                          </Button>
                        )}
                        {!isSuperAdmin(u.email, u.role) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onToggleAdmin(u.email, u.role, u.id)}
                            className={`h-7 px-2 text-[11px] font-semibold transition-colors ${
                              isAdminEmail(u.email, u.role)
                                ? 'text-red-400 hover:bg-red-500/15 hover:text-red-300'
                                : 'text-primary hover:bg-primary/10'
                            }`}
                          >
                            {isJa
                              ? isAdminEmail(u.email, u.role)
                                ? '管理者権限解除'
                                : '管理者付与'
                              : isAdminEmail(u.email, u.role)
                                ? 'Adminlikni olish'
                                : 'Admin qilish'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  {isJa ? 'ユーザーが見つかりませんでした' : 'Foydalanuvchilar topilmadi'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border p-3 text-xs">
          <span className="text-muted-foreground">
            {usersPage * usersPerPage + 1}–
            {Math.min((usersPage + 1) * usersPerPage, sortedUsers.length)} / {sortedUsers.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setUsersPage((p) => Math.max(0, p - 1))}
              disabled={usersPage === 0}
              className="rounded-lg border border-border bg-muted px-3 py-1.5 font-semibold text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Oldingi
            </button>
            <span className="px-2 font-bold text-foreground">
              {usersPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setUsersPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={usersPage >= totalPages - 1}
              className="rounded-lg border border-border bg-muted px-3 py-1.5 font-semibold text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Keyingi →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
