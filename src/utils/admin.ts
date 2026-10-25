export const SUPER_ADMIN_EMAIL = 'fsoyilov@gmail.com';

export const SUPER_ADMIN_EMAILS = ['fsoyilov@gmail.com'];

export const DEFAULT_ADMIN_EMAILS = [
  'fsoyilov@gmail.com',
  'admin@kaiwa.live',
  'admin@nihongo-talk.jp',
];

export interface AdminAuditLogEntry {
  id: string;
  action: 'GRANT_ADMIN' | 'REVOKE_ADMIN';
  target_user_id?: string;
  target_email: string;
  performed_by_email: string;
  created_at: string;
  details?: Record<string, any>;
}

const AUDIT_LOGS_KEY = 'study_planner_admin_audit_logs';

export const saveLocalAuditLog = (entry: AdminAuditLogEntry) => {
  if (typeof window === 'undefined') return;
  try {
    const existingRaw = localStorage.getItem(AUDIT_LOGS_KEY);
    const list: AdminAuditLogEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
    // Prepend and dedup by id
    const filtered = list.filter((item) => item.id !== entry.id);
    filtered.unshift(entry);
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(filtered.slice(0, 100)));
  } catch {}
};

export const getLocalAuditLogs = (): AdminAuditLogEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// Check if user is Super Admin
// STRICT ENFORCEMENT: ONLY fsoyilov@gmail.com is Superadmin.
// Even if someone provides role='superadmin', if their email is not fsoyilov@gmail.com, they are NOT Superadmin.
export const isSuperAdmin = (email?: string | null, _role?: string | null): boolean => {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return e === SUPER_ADMIN_EMAIL;
};

// English / IELTS track is strictly disabled in kaiwa.live (single-language isolation)
export const isEnglishTrackAllowed = (_email?: string | null): boolean => {
  return false;
};

// Check if user is Admin or Super Admin
export const isAdminEmail = (email?: string | null, role?: string | null): boolean => {
  const normalizedRole = role === 'authenticated' ? undefined : role;
  if (normalizedRole === 'admin' || normalizedRole === 'superadmin') return true;
  if (!email) return false;
  const e = email.toLowerCase().trim();
  if (DEFAULT_ADMIN_EMAILS.includes(e)) return true;
  return false;
};

// Helper for user object
export const isUserAdmin = (user?: any): boolean => {
  if (!user) return false;
  const rawRole = user.role === 'authenticated' ? undefined : user.role;
  const role = rawRole || user.user_metadata?.role || user.app_metadata?.role;
  return isAdminEmail(user.email, role);
};

const isUuid = (val?: string | null): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
};

// Dynamic role grant — updates profiles.role, audit fields, and auth metadata via RPC or direct DB update
export const grantAdminRole = async (
  emailOrId: string,
  userId?: string,
  assignedByEmail?: string,
): Promise<boolean> => {
  if (!emailOrId && !userId) return false;
  const targetId = userId || (isUuid(emailOrId) ? emailOrId : null);
  const targetEmail =
    !isUuid(emailOrId) && emailOrId.includes('@') ? emailOrId.toLowerCase().trim() : null;
  const actorEmail = assignedByEmail || SUPER_ADMIN_EMAIL;

  try {
    const { supabase } = await import('../lib/supabase');

    // 1. Try secure set_user_admin_role RPC function first
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('set_user_admin_role', {
        target_user_id: targetId,
        target_email: targetEmail,
        make_admin: true,
        assigned_by_email: actorEmail,
      });

      if (!rpcError && rpcData && (rpcData as any).success) {
        console.info(`[Admin] Admin role granted to ${emailOrId} via RPC by ${actorEmail}`);
        saveLocalAuditLog({
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          action: 'GRANT_ADMIN',
          target_user_id: targetId || undefined,
          target_email: targetEmail || emailOrId,
          performed_by_email: actorEmail,
          created_at: new Date().toISOString(),
        });
        return true;
      }
      if (rpcError) {
        console.warn(
          '[Admin] set_user_admin_role RPC error, falling back to direct update:',
          rpcError.message,
        );
      }
    } catch (rpcEx: any) {
      console.warn('[Admin] set_user_admin_role RPC exception:', rpcEx?.message);
    }

    // 2. Direct profiles update fallback
    const nowIso = new Date().toISOString();
    let updateQuery = supabase.from('profiles').update({
      role: 'admin',
      admin_assigned_by: actorEmail,
      admin_assigned_at: nowIso,
      updated_at: nowIso,
    });

    if (targetId) {
      updateQuery = updateQuery.eq('id', targetId);
    } else if (targetEmail) {
      updateQuery = updateQuery.ilike('email', targetEmail);
    }

    const { data: updatedRows, error: updateError } = await updateQuery.select('id, role');
    if (!updateError && updatedRows && updatedRows.length > 0) {
      console.info(`[Admin] Admin role granted to ${emailOrId} in DB profiles`);
      saveLocalAuditLog({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        action: 'GRANT_ADMIN',
        target_user_id: targetId || undefined,
        target_email: targetEmail || emailOrId,
        performed_by_email: actorEmail,
        created_at: nowIso,
      });
      return true;
    }

    // 3. If profile row did not exist yet, upsert by targetId if known
    if (targetId) {
      const { error: upsertErr } = await supabase.from('profiles').upsert({
        id: targetId,
        email: targetEmail || undefined,
        role: 'admin',
        admin_assigned_by: actorEmail,
        admin_assigned_at: nowIso,
        updated_at: nowIso,
      });
      if (!upsertErr) {
        console.info(`[Admin] Admin role upserted for ${emailOrId} in DB`);
        saveLocalAuditLog({
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          action: 'GRANT_ADMIN',
          target_user_id: targetId,
          target_email: targetEmail || emailOrId,
          performed_by_email: actorEmail,
          created_at: nowIso,
        });
        return true;
      }
    }

    if (updateError) {
      console.warn('[Admin] grantAdminRole DB error:', updateError.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('[Admin] grantAdminRole exception:', e?.message);
    return false;
  }
};

export const revokeAdminRole = async (
  emailOrId: string,
  userId?: string,
  revokedByEmail?: string,
): Promise<boolean> => {
  if (!emailOrId && !userId) return false;
  const targetId = userId || (isUuid(emailOrId) ? emailOrId : null);
  const targetEmail =
    !isUuid(emailOrId) && emailOrId.includes('@') ? emailOrId.toLowerCase().trim() : null;
  const actorEmail = revokedByEmail || SUPER_ADMIN_EMAIL;

  // Never allow revoking superadmin
  if (isSuperAdmin(emailOrId) || (targetEmail && isSuperAdmin(targetEmail))) {
    console.warn('[Admin] Cannot revoke superadmin role');
    return false;
  }

  try {
    const { supabase } = await import('../lib/supabase');

    // 1. Try secure set_user_admin_role RPC function first
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('set_user_admin_role', {
        target_user_id: targetId,
        target_email: targetEmail,
        make_admin: false,
        assigned_by_email: actorEmail,
      });

      if (!rpcError && rpcData && (rpcData as any).success) {
        console.info(`[Admin] Admin role revoked from ${emailOrId} via RPC by ${actorEmail}`);
        saveLocalAuditLog({
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          action: 'REVOKE_ADMIN',
          target_user_id: targetId || undefined,
          target_email: targetEmail || emailOrId,
          performed_by_email: actorEmail,
          created_at: new Date().toISOString(),
        });
        return true;
      }
      if (rpcError) {
        console.warn(
          '[Admin] set_user_admin_role RPC error, falling back to direct update:',
          rpcError.message,
        );
      }
    } catch (rpcEx: any) {
      console.warn('[Admin] set_user_admin_role RPC exception:', rpcEx?.message);
    }

    // 2. Direct profiles update fallback
    const nowIso = new Date().toISOString();
    let updateQuery = supabase.from('profiles').update({
      role: 'user',
      admin_assigned_by: null,
      admin_assigned_at: null,
      updated_at: nowIso,
    });

    if (targetId) {
      updateQuery = updateQuery.eq('id', targetId);
    } else if (targetEmail) {
      updateQuery = updateQuery.ilike('email', targetEmail);
    }

    const { data: updatedRows, error: updateError } = await updateQuery.select('id, role');
    if (!updateError && updatedRows && updatedRows.length > 0) {
      console.info(`[Admin] Admin role revoked from ${emailOrId} in DB profiles`);
      saveLocalAuditLog({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        action: 'REVOKE_ADMIN',
        target_user_id: targetId || undefined,
        target_email: targetEmail || emailOrId,
        performed_by_email: actorEmail,
        created_at: nowIso,
      });
      return true;
    }

    if (updateError) {
      console.warn('[Admin] revokeAdminRole DB error:', updateError.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('[Admin] revokeAdminRole exception:', e?.message);
    return false;
  }
};

// Fetch admin audit logs from RPC, DB table, or local fallback
export const getAdminAuditLogs = async (): Promise<AdminAuditLogEntry[]> => {
  const localLogs = getLocalAuditLogs();
  try {
    const { supabase } = await import('../lib/supabase');

    // 1. Try get_admin_audit_logs RPC
    try {
      const { data, error } = await supabase.rpc('get_admin_audit_logs');
      if (!error && Array.isArray(data) && data.length > 0) {
        const rpcLogs: AdminAuditLogEntry[] = data.map((item: any) => ({
          id: item.id || `audit-${item.created_at}`,
          action: item.action,
          target_user_id: item.target_user_id,
          target_email: item.target_email,
          performed_by_email: item.performed_by_email || SUPER_ADMIN_EMAIL,
          created_at: item.created_at,
          details: item.details,
        }));
        // Merge with local logs, prioritizing DB logs
        const map = new Map<string, AdminAuditLogEntry>();
        rpcLogs.forEach((l) => map.set(`${l.target_email}-${l.action}-${l.created_at}`, l));
        localLogs.forEach((l) => {
          const key = `${l.target_email}-${l.action}-${l.created_at}`;
          if (!map.has(key)) map.set(key, l);
        });
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      }
    } catch {}

    // 2. Direct admin_audit_logs table query
    try {
      const { data: tableData, error: tableError } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!tableError && Array.isArray(tableData) && tableData.length > 0) {
        const dbLogs: AdminAuditLogEntry[] = tableData.map((item: any) => ({
          id: item.id,
          action: item.action,
          target_user_id: item.target_user_id,
          target_email: item.target_email,
          performed_by_email: item.performed_by_email || SUPER_ADMIN_EMAIL,
          created_at: item.created_at,
          details: item.details,
        }));
        const map = new Map<string, AdminAuditLogEntry>();
        dbLogs.forEach((l) => map.set(`${l.target_email}-${l.action}-${l.created_at}`, l));
        localLogs.forEach((l) => {
          const key = `${l.target_email}-${l.action}-${l.created_at}`;
          if (!map.has(key)) map.set(key, l);
        });
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      }
    } catch {}

    return localLogs;
  } catch (e) {
    return localLogs;
  }
};
