// Client-side Supabase Polyfill Interceptor
// Bridges Supabase client calls directly to our local Prisma SQLite backend APIs.

class SupabaseQueryBuilder {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private selectColumns: string = '*';
  private insertData: any = null;
  private updateData: any = null;
  private filters: any[] = [];
  private orderColumn: string | null = null;
  private orderAscending: boolean = true;
  private limitCount: number | null = null;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*') {
    this.action = 'select';
    this.selectColumns = columns;
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.updateData = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push({ column, operator: 'like', value: pattern });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderColumn = column;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
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

  // Thenable implementation (Promise interface)
  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const payload = {
        table: this.table,
        action: this.action,
        selectColumns: this.selectColumns,
        insertData: this.insertData,
        updateData: this.updateData,
        filters: this.filters,
        orderColumn: this.orderColumn,
        orderAscending: this.orderAscending,
        limitCount: this.limitCount,
        isSingle: this.isSingle,
        isMaybeSingle: this.isMaybeSingle,
      };

      const response = await fetch('/api/supabase-polyfill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Database operation failed');
      }

      const val = { data: result.data, error: null };
      return onfulfilled ? onfulfilled(val) : val;
    } catch (error: any) {
      console.error(`Supabase polyfill query failed for table ${this.table}:`, error);
      const val = { data: null, error: { message: error.message || 'Database error occurred' } };
      return onfulfilled ? onfulfilled(val) : val;
    }
  }
}

const authClient = {
  getSession: async () => {
    const sessionStr = typeof window !== 'undefined' ? localStorage.getItem('st_local_session') : null;
    return { data: { session: sessionStr ? JSON.parse(sessionStr) : null }, error: null };
  },
  onAuthStateChange: (callback: any) => {
    // Stub onAuthStateChange to prevent crash
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
  signOut: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('st_local_session');
      localStorage.removeItem('st_local_profile');
    }
    return { error: null };
  },
  updateUser: async (attributes: any) => {
    try {
      const sessionStr = typeof window !== 'undefined' ? localStorage.getItem('st_local_session') : null;
      if (!sessionStr) throw new Error('No active login session found');
      const session = JSON.parse(sessionStr);

      const response = await fetch('/api/supabase-polyfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'profiles_auth',
          action: 'update_auth',
          data: attributes,
          userId: session.user.id,
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to update user authentication details');

      return { data: { user: resData.user }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  },
};

export const supabase = {
  from: (table: string) => new SupabaseQueryBuilder(table),
  auth: authClient,
};
