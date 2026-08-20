/**
 * CanCard Database Layer
 * Uses sql.js (pure JavaScript SQLite via WebAssembly)
 * Synchronous API - no callbacks needed
 */
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

let db = null;
let SQL = null;

/**
 * Initialize and return the database instance.
 * Loads existing file from disk or creates new one.
 */
async function getDatabase() {
  if (db) return db;

  SQL = await initSqlJs();
  
  const dbPath = path.resolve(process.env.DB_PATH || './data/cancard.db');
  const dbDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable WAL mode for better performance
  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');

  return db;
}

/**
 * Save the database to disk.
 */
function saveDatabase() {
  if (!db) return;
  const dbPath = path.resolve(process.env.DB_PATH || './data/cancard.db');
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

/**
 * Run a query with parameters. Returns array of row objects.
 */
function query(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE) with parameters.
 * Returns { changes: number, lastInsertRowid: number }
 */
function execute(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  const result = {
    changes: db.getRowsModified(),
    lastInsertRowid: 0
  };
  // Get last insert rowid
  const rows = query('SELECT last_insert_rowid() as id');
  if (rows.length > 0) result.lastInsertRowid = rows[0].id;
  return result;
}

/**
 * Get a single row, or null if not found.
 */
function getOne(sql, params = []) {
  const rows = query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute multiple statements (for schema creation).
 */
function executeSql(sql) {
  if (!db) throw new Error('Database not initialized');
  db.run(sql);
}

/**
 * Run multiple statements in a transaction.
 */
function transaction(fn) {
  if (!db) throw new Error('Database not initialized');
  try {
    db.run('BEGIN TRANSACTION');
    fn();
    db.run('COMMIT');
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

/**
 * Close the database connection.
 */
function close() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

module.exports = {
  getDatabase,
  saveDatabase,
  query,
  execute,
  getOne,
  executeSql,
  transaction,
  close
};