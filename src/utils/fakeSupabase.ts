/**
 * In-memory Supabase fake used by the Task 16 end-to-end suite.
 *
 * It emulates the small PostgREST surface exercised by the exam services:
 *   from(table).select/insert/update/delete/upsert + eq/neq/in/is/gt/gte/lt/lte/
 *   ilike/order/limit/range/single/maybeSingle, rpc(), storage.from() and
 *   auth.getUser().
 *
 * It is deliberately stateful so a whole import -> workflow -> export ->
 * rollback flow can run against it without touching a real database.
 */

export type Row = Record<string, any>;

let idCounter = 0;
function makeId(prefix = 'row'): string {
  idCounter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${idCounter}-${rand}`;
}

const nowIso = () => new Date().toISOString();

interface StoredRow extends Row {
  id: string;
}

type Filter = { op: string; column: string; value: any };
type OrderSpec = { column: string; ascending: boolean };

class FakeQueryBuilder implements PromiseLike<{ data: any; error: any; count?: number }> {
  private table: string;
  private getRows: () => StoredRow[] | undefined;
  private setRows: (rows: StoredRow[]) => void;

  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: any = null;
  private columns = '*';
  private filters: Filter[] = [];
  private orders: OrderSpec[] = [];
  private limitCount: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private isSingle = false;
  private isMaybeSingle = false;
  private returnRepresentation = false;
  private countExact = false;

  constructor(
    table: string,
    getRows: () => StoredRow[] | undefined,
    setRows: (rows: StoredRow[]) => void,
  ) {
    this.table = table;
    this.getRows = getRows;
    this.setRows = setRows;
  }

  private rows(): StoredRow[] {
    const current = this.getRows();
    if (current === undefined) {
      this.setRows([]);
      return this.getRows() as StoredRow[];
    }
    return current;
  }

  select(columns = '*') {
    if (this.op === 'select') this.columns = columns;
    else {
      this.returnRepresentation = true;
      this.columns = columns;
    }
    return this;
  }

  insert(payload: any) {
    this.op = 'insert';
    this.payload = payload;
    return this;
  }

  upsert(payload: any) {
    this.op = 'upsert';
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.op = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ op: 'eq', column, value });
    return this;
  }
  neq(column: string, value: any) {
    this.filters.push({ op: 'neq', column, value });
    return this;
  }
  in(column: string, value: any[]) {
    this.filters.push({ op: 'in', column, value });
    return this;
  }
  is(column: string, value: any) {
    this.filters.push({ op: 'is', column, value });
    return this;
  }
  gt(column: string, value: any) {
    this.filters.push({ op: 'gt', column, value });
    return this;
  }
  gte(column: string, value: any) {
    this.filters.push({ op: 'gte', column, value });
    return this;
  }
  lt(column: string, value: any) {
    this.filters.push({ op: 'lt', column, value });
    return this;
  }
  lte(column: string, value: any) {
    this.filters.push({ op: 'lte', column, value });
    return this;
  }
  like(column: string, value: string) {
    this.filters.push({ op: 'like', column, value });
    return this;
  }
  ilike(column: string, value: string) {
    this.filters.push({ op: 'ilike', column, value });
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orders.push({ column, ascending: options.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  count(mode?: string) {
    if (mode === 'exact') this.countExact = true;
    return this;
  }

  private matches(row: StoredRow): boolean {
    return this.filters.every((filter) => {
      const value = row[filter.column];
      switch (filter.op) {
        case 'eq':
          return value === filter.value;
        case 'neq':
          return value !== filter.value;
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(value);
        case 'is':
          return filter.value === null
            ? value === null || value === undefined
            : value === filter.value;
        case 'gt':
          return value > filter.value;
        case 'gte':
          return value >= filter.value;
        case 'lt':
          return value < filter.value;
        case 'lte':
          return value <= filter.value;
        case 'like': {
          const re = new RegExp('^' + String(filter.value).replace(/%/g, '.*') + '$');
          return re.test(String(value ?? ''));
        }
        case 'ilike': {
          const re = new RegExp('^' + String(filter.value).replace(/%/g, '.*') + '$', 'i');
          return re.test(String(value ?? ''));
        }
        default:
          return true;
      }
    });
  }

  private decorate(rows: StoredRow[], columns: string): Row[] {
    if (!columns || columns === '*') return rows.map((r) => ({ ...r }));
    const cols = columns
      .split(',')
      .map((c) => c.trim().split(/[\s:]+/)[0])
      .filter(Boolean);
    return rows.map((row) => {
      const out: Row = {};
      for (const c of cols) out[c] = row[c];
      return out;
    });
  }

  private withDefaults(input: Row): StoredRow {
    const row = { ...input } as StoredRow;
    if (row.id === undefined || row.id === null) row.id = makeId(this.table);
    if (row.created_at === undefined) row.created_at = nowIso();
    return row;
  }

  private execute(): { data: any; error: any; count?: number } {
    const table = this.rows();

    if (this.op === 'insert' || this.op === 'upsert') {
      const incoming: Row[] = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted: StoredRow[] = [];
      for (const item of incoming) {
        if (this.op === 'upsert' && item.id !== undefined && item.id !== null) {
          const idx = table.findIndex((r) => r.id === item.id);
          if (idx !== -1) {
            table[idx] = { ...table[idx], ...item };
            inserted.push(table[idx]);
            continue;
          }
        }
        const row = this.withDefaults(item);
        table.push(row);
        inserted.push(row);
      }
      this.setRows(table);
      const data = this.returnRepresentation ? this.decorate(inserted, this.columns) : null;
      return this.finish(data, inserted);
    }

    if (this.op === 'update') {
      const updated: StoredRow[] = [];
      this.setRows(
        table.map((row) => {
          if (this.matches(row)) {
            const next = { ...row, ...this.payload };
            updated.push(next);
            return next;
          }
          return row;
        }),
      );
      const data = this.returnRepresentation ? this.decorate(updated, this.columns) : null;
      return this.finish(data, updated);
    }

    if (this.op === 'delete') {
      const removed: StoredRow[] = [];
      const kept = table.filter((row) => {
        if (this.matches(row)) {
          removed.push(row);
          return false;
        }
        return true;
      });
      this.setRows(kept);
      const data = this.returnRepresentation ? this.decorate(removed, this.columns) : null;
      return this.finish(data, removed);
    }

    // select
    let results = table.filter((row) => this.matches(row));
    if (this.orders.length) {
      results = [...results].sort((a, b) => {
        for (const spec of this.orders) {
          const av = a[spec.column];
          const bv = b[spec.column];
          if (av === bv) continue;
          if (av === undefined || av === null) return spec.ascending ? -1 : 1;
          if (bv === undefined || bv === null) return spec.ascending ? 1 : -1;
          const cmp = av < bv ? -1 : 1;
          return spec.ascending ? cmp : -cmp;
        }
        return 0;
      });
    }
    const total = results.length;
    if (this.rangeFrom !== null && this.rangeTo !== null) {
      results = results.slice(this.rangeFrom, this.rangeTo + 1);
    }
    if (this.limitCount !== null) {
      results = results.slice(0, this.limitCount);
    }
    const data = this.decorate(results, this.columns);
    const count = this.countExact ? total : undefined;
    return this.finish(data, results, count);
  }

  private finish(data: any, rows: StoredRow[], count?: number) {
    if (this.isSingle) {
      if (!rows || rows.length === 0) {
        return { data: null, error: { message: 'Row not found', code: 'PGRST116' }, count };
      }
      return { data: Array.isArray(data) ? data[0] : data, error: null, count };
    }
    if (this.isMaybeSingle) {
      const first = Array.isArray(data) ? (data.length ? data[0] : null) : data;
      return { data: first, error: null, count };
    }
    return { data, error: null, count };
  }

  then<TResult1 = { data: any; error: any; count?: number }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: any; error: any; count?: number }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

export interface FakeSupabase {
  from(table: string): FakeQueryBuilder;
  rpc(name: string, args?: any): Promise<{ data: any; error: any }>;
  storage: {
    from(bucket: string): {
      upload(path: string, body: any, opts?: any): Promise<{ data: any; error: any }>;
      remove(paths: string[]): Promise<{ data: any; error: any }>;
      list(path?: string): Promise<{ data: any[]; error: any }>;
      getPublicUrl(path: string): { data: { publicUrl: string } };
    };
  };
  auth: {
    getUser(): Promise<{ data: { user: any }; error: any }>;
    getSession(): Promise<{ data: { session: any }; error: any }>;
    setSession(session: any): Promise<{ data: { session: any }; error: any }>;
    onAuthStateChange(cb: any): { data: { subscription: { unsubscribe(): void } } };
  };
  // Test-only helpers
  __tables: Record<string, StoredRow[]>;
  __seed(table: string, rows: Row[]): void;
  __table(table: string): StoredRow[];
  __setUser(user: Row | null): void;
  __reset(seed?: Record<string, Row[]>): void;
  __rpcResults: Record<string, { data: any; error: any }>;
}

export function createFakeSupabase(seed: Record<string, Row[]> = {}): FakeSupabase {
  const tables: Record<string, StoredRow[]> = {};
  const rpcResults: Record<string, { data: any; error: any }> = {
    is_admin: { data: true, error: null },
  };
  let currentUser: Row | null = {
    id: 'admin-user-id',
    email: 'fsoyilov@gmail.com',
    user_metadata: { full_name: 'Admin' },
  };

  for (const [table, rows] of Object.entries(seed)) {
    tables[table] = rows.map((r) => ({
      ...r,
      id: r.id ?? makeId(table),
      created_at: r.created_at ?? nowIso(),
    })) as StoredRow[];
  }

  const storageBuckets: Record<string, Row[]> = {};

  const api: FakeSupabase = {
    from(table: string) {
      return new FakeQueryBuilder(
        table,
        () => tables[table],
        (rows) => {
          tables[table] = rows;
        },
      );
    },
    async rpc(name: string) {
      return rpcResults[name] ?? { data: null, error: { message: `Unknown rpc ${name}` } };
    },
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, body: any, opts?: any) {
            if (!storageBuckets[bucket]) storageBuckets[bucket] = [];
            if (storageBuckets[bucket].some((f) => f.path === path)) {
              return { data: null, error: { message: 'Duplicate' } };
            }
            storageBuckets[bucket].push({ path, size: body?.size ?? 0, type: opts?.contentType });
            return { data: { path }, error: null };
          },
          async remove(paths: string[]) {
            if (!storageBuckets[bucket]) storageBuckets[bucket] = [];
            const removed = storageBuckets[bucket].filter((f) => paths.includes(f.path));
            storageBuckets[bucket] = storageBuckets[bucket].filter((f) => !paths.includes(f.path));
            return { data: removed, error: null };
          },
          async list(path = '') {
            return {
              data: (storageBuckets[bucket] || []).filter((f) => f.path.startsWith(path)),
              error: null,
            };
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `https://fake.storage/${bucket}/${path}` } };
          },
        };
      },
    },
    auth: {
      async getUser() {
        return { data: { user: currentUser }, error: null };
      },
      async getSession() {
        return { data: { session: currentUser ? { user: currentUser } : null }, error: null };
      },
      async setSession(session: any) {
        currentUser = session?.user ?? currentUser;
        return { data: { session }, error: null };
      },
      onAuthStateChange() {
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
    __tables: tables,
    __seed(table, rows) {
      tables[table] = rows.map((r) => ({
        ...r,
        id: r.id ?? makeId(table),
        created_at: r.created_at ?? nowIso(),
      })) as StoredRow[];
    },
    __table(table) {
      return tables[table] || [];
    },
    __setUser(user) {
      currentUser = user;
      const isAdmin = Boolean(
        user &&
        ((user.app_metadata as any)?.role === 'admin' ||
          (user.user_metadata as any)?.role === 'admin' ||
          user.role === 'admin' ||
          (user.email &&
            (user.email === 'fsoyilov@gmail.com' ||
              user.email === 'admin@kaiwa.live' ||
              user.email === 'admin@nihongo-talk.jp'))),
      );
      const isReviewer = Boolean(
        isAdmin ||
        (user &&
          ((user.app_metadata as any)?.role === 'reviewer' ||
            (user.user_metadata as any)?.role === 'reviewer' ||
            user.role === 'reviewer' ||
            (user.email && String(user.email).toLowerCase().includes('reviewer')))),
      );
      rpcResults.is_admin = { data: isAdmin, error: null };
      rpcResults.is_reviewer = { data: isReviewer, error: null };
    },
    __reset(nextSeed) {
      for (const key of Object.keys(tables)) delete tables[key];
      if (nextSeed) {
        for (const [table, rows] of Object.entries(nextSeed)) {
          tables[table] = rows.map((r) => ({
            ...r,
            id: r.id ?? makeId(table),
            created_at: r.created_at ?? nowIso(),
          })) as StoredRow[];
        }
      }
      currentUser = {
        id: 'admin-user-id',
        email: 'fsoyilov@gmail.com',
        user_metadata: { full_name: 'Admin' },
      };
      rpcResults.is_admin = { data: true, error: null };
      rpcResults.is_reviewer = { data: true, error: null };
    },
    __rpcResults: rpcResults,
  };

  return api;
}

/** Shared singleton mocked in place of src/lib/supabase during Task 16 tests. */
export const fakeSupabase = createFakeSupabase();
