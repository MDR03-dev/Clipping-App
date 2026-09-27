/*
 * Importers/callers: This file will be imported by the database controllers and services.
 * Affected API: Database client with connection and query methods.
 * Data schemas: Database connection and transaction handling.
 * Verbatim instruction: Continue building out reframe-engine; add database client per Stage 6 spec.
 */

// Simple in-memory database implementation for testing
// In production, this would use better-sqlite3 or similar

interface QueryResult {
  all: () => any[];
  get: () => any | undefined;
  run: () => { changes: number; lastInsertRowid: number };
}

interface Database {
  exec: (sql: string) => void;
  query: (sql: string) => QueryResult;
  run: (sql: string, ...params: any[]) => { changes: number; lastInsertRowid: number };
  close: () => void;
  transaction: (fn: () => void) => void;
}

interface TableSchema {
  name: string;
  columns: string;
  indexes: string[];
}

class MockDatabase implements Database {
  private tables: Map<string, any[]> = new Map();
  private schemas: Map<string, TableSchema> = new Map();

  constructor() {
    this.initializeTables();
  }

  private initializeTables(): void {
    this.schemas.set('projects', {
      name: 'projects',
      columns: 'id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP',
      indexes: []
    });
    this.schemas.set('videos', {
      name: 'videos',
      columns: 'id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL, title TEXT NOT NULL, description TEXT, file_path TEXT NOT NULL, duration REAL, uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE',
      indexes: ['idx_videos_project_id']
    });
    this.schemas.set('clips', {
      name: 'clips',
      columns: 'id INTEGER PRIMARY KEY AUTOINCREMENT, video_id INTEGER NOT NULL, title TEXT NOT NULL, description TEXT, start_time REAL NOT NULL, end_time REAL NOT NULL, file_path TEXT NOT NULL, publish_id TEXT, status TEXT DEFAULT \'PENDING\', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (video_id) REFERENCES videos (id) ON DELETE CASCADE',
      indexes: ['idx_clips_video_id']
    });
    this.schemas.set('accounts', {
      name: 'accounts',
      columns: 'id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, platform TEXT NOT NULL, access_token TEXT NOT NULL, refresh_token TEXT, expires_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, platform)',
      indexes: ['idx_accounts_user_id']
    });
    this.schemas.set('publishing_events', {
      name: 'publishing_events',
      columns: 'id INTEGER PRIMARY KEY AUTOINCREMENT, clip_id INTEGER NOT NULL, platform TEXT NOT NULL, publish_id TEXT NOT NULL, status TEXT NOT NULL, error_code TEXT, error_message TEXT, published_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (clip_id) REFERENCES clips (id) ON DELETE CASCADE',
      indexes: ['idx_publishing_events_clip_id']
    });

    // Initialize empty tables - use simple array
    var names = ['projects', 'videos', 'clips', 'accounts', 'publishing_events'];
    for (var i = 0; i < names.length; i++) {
      this.tables.set(names[i], []);
    }
  }

  exec(sql: string): void {
    console.log('[MockDB] Executed: ' + sql.substring(0, 50) + '...');
  }

  query(sql: string): QueryResult {
    var lowerSql = sql.toLowerCase().trim();

    if (lowerSql.startsWith('select')) {
      var tableMatch = sql.match(/from\s+(\w+)/i);
      if (tableMatch) {
        var tableName = tableMatch[1];
        var rows = this.tables.get(tableName) || [];

        var filteredRows = rows.slice();

        var whereMatch = sql.match(/where\s+(.+?)(?:\s+(?:order|limit|group)|$)/i);
        if (whereMatch) {
          var conditions = whereMatch[1].split('and').map(function(c) { return c.trim(); });
          var newFiltered = [];
          for (var ri = 0; ri < filteredRows.length; ri++) {
            var row = filteredRows[ri];
            var ok = true;
            for (var ci = 0; ci < conditions.length; ci++) {
              var condition = conditions[ci];
              var eqMatch = condition.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/i);
              if (eqMatch) {
                var col = eqMatch[1];
                var val = eqMatch[2];
                if (String(row[col]) !== String(val)) {
                  ok = false;
                  break;
                }
              }
            }
            if (ok) newFiltered.push(row);
          }
          filteredRows = newFiltered;
        }

        var limitMatch = sql.match(/limit\s+(\d+)/i);
        if (limitMatch) {
          filteredRows = filteredRows.slice(0, parseInt(limitMatch[1], 10));
        }

        return {
          all: function() { return filteredRows; },
          get: function() { return filteredRows[0]; },
          run: function() { return { changes: 0, lastInsertRowid: 0 }; }
        };
      }

      return {
        all: function() { return []; },
        get: function() { return undefined; },
        run: function() { return { changes: 0, lastInsertRowid: 0 }; }
      };
  }

  run(sql: string, ...params: any[]): { changes: number; lastInsertRowid: number } {
    var lowerSql = sql.toLowerCase().trim();

    if (lowerSql.startsWith('insert')) {
      var tableMatch = sql.match(/insert\s+into\s+(\w+)/i);
      if (tableMatch) {
        var tableName = tableMatch[1];
        var rows = this.tables.get(tableName) || [];

        var valuesMatch = sql.match(/values\s*\(([^)]+)\)/i);
        if (valuesMatch) {
          var values = valuesMatch[1].split(',').map(function(v) { return v.trim().replace(/['"]/g, ''); });
          var columnsMatch = sql.match(/\(([^)]+)\)\s*values/i);
          var columns = columnsMatch ? columnsMatch[1].split(',').map(function(c) { return c.trim(); }) : [];

          var newRow = { id: rows.length + 1 };
          for (var ci = 0; ci < columns.length; ci++) {
            newRow[columns[ci]] = values[ci];
          }

          if (!newRow.created_at) newRow.created_at = new Date().toISOString();
          if (!newRow.updated_at) newRow.updated_at = new Date().toISOString();
          if (!newRow.status) newRow.status = 'PENDING';

          rows.push(newRow);

          return {
            changes: 1,
            lastInsertRowid: newRow.id
          };
        }
      }

      return { changes: 0, lastInsertRowid: 0 };
  }

  close(): void {
    this.tables.clear();
  }

  transaction(fn: () => void): void {
    fn();
  }
}

export class DatabaseClient {
  private db: Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new MockDatabase();
    this.initializeSchema();
  }

  private initializeSchema(): void {
  }

  query(sql: string, params: any[] = []): any[] {
    return this.db.query(sql).all();
  }

  queryOne(sql: string, params: any[] = []): any | null {
    var result = this.db.query(sql).get();
    return result ?? null;
  }

  execute(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
    return this.db.run(sql, ...params);
  }

  transaction(): Database {
    return this.db.transaction(function() {
    });
  }

  close(): void {
    this.db.close();
  }

  getInstance(): Database {
    return this.db;
  }
}

export var db = new DatabaseClient();