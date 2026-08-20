/**
 * CanCard Database Schema Setup
 * Creates all tables defined in the architecture documents
 * Run with: npm run setup
 */
require('dotenv').config();
const db = require('./database');

async function setup() {
  await db.getDatabase();

  console.log('Creating CanCard database schema...\n');

  // Users table (CP-02: User Identity & Profile Model)
  db.executeSql(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      date_of_birth TEXT,
      age INTEGER,
      height_cm REAL,
      weight_kg REAL,
      blood_type TEXT,
      role TEXT DEFAULT 'self' CHECK (role IN ('self', 'parent', 'teen', 'doctor', 'admin')),
      account_type TEXT DEFAULT 'self' CHECK (account_type IN ('self', 'parent_minor', 'parent_teen', 'teen', 'independent')),
      school TEXT,
      grade TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✓ Created: users');

  // Parent-child account links (CP-04)
  db.executeSql(`
    CREATE TABLE IF NOT EXISTS account_links (
      link_id TEXT PRIMARY KEY,
      parent_id TEXT NOT NULL REFERENCES users(user_id),
      child_id TEXT NOT NULL REFERENCES users(user_id),
      relationship TEXT,
      permissions TEXT DEFAULT '{"view_health":true,"manage_health":true,"approve_updates":true,"view_emergency":true}',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(parent_id, child_id)
    )
  `);
  console.log('✓ Created: account_links');

  // Structured Health Records (CP-03)
  db.executeSql(`  
    CREATE TABLE IF NOT EXISTS health_records (
      record_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(user_id),
      field_type TEXT NOT NULL,
      parameter TEXT NOT NULL,
      value TEXT NOT NULL,
      unit TEXT,
      source TEXT DEFAULT 'user' CHECK (source IN ('user', 'medical_document', 'institution', 'ai_extracted')),
      verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'user_confirmed', 'doctor_verified', 'rejected')),
      notes TEXT,
      recorded_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✓ Created: health_records');

  // Lifestyle Records (CP-06)
  db.executeSql(`
    CREATE TABLE IF NOT EXISTS lifestyle_records (
    record_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(user_id),
      category TEXT NOT NULL CHECK (category IN ('sleep', 'physical_activity', 'nutrition', 'hydration', 'screen_time', 'stress_mood', 'other')),
      duration_minutes INTEGER,
      value TEXT,
      unit TEXT,
      source TEXT DEFAULT 'user' CHECK (source IN ('user', 'auto', 'parent')),
      verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
      recorded_at TEXT DEFAULT (datetime('now')),
      date TEXT NOT NULL
    )
  `);
  console.log('✓ Created: lifestyle_records');

  // Calendar Events / Routine (CP-07)
  db.executeSql(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      event_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(user_id),
      event_type TEXT NOT NULL CHECK (event_type IN ('school', 'sport', 'appointment', 'medication', 'recovery', 'reminder', 'other')),
      title TEXT NOT NULL,
      description TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      all_day INTEGER DEFAULT 0,
      recurrence TEXT,
      conflict_status TEXT DEFAULT 'none' CHECK (conflict_status IN ('none', 'warning', 'conflict', 'resolved')),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✓ Created: calendar_events');

  // Medical Docments (OCR Pipeline - 2B)
  db.executeSql(`
    CREATE TABLE IF NOT EXISTS medical_documents (
      document_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(user_id),
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      ocr_status TEXT DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
      extraction_data TEXT,
      review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'reviewed', 'confirmed', 'rejected')),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✓ Created: medical_documents');

  // Digital Twin State (2C)
  db.executeSql(`
    CREATE TABLE IF NOT EXISTS digital_twin_state (
      twin_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(user_id),
      health_summary TEXT,
      lifestyle_summary TEXT,
      current_indicators TEXT,
      last_updated TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✓ Created: digital_twin_state');

  // Simulation History (2C)
  db.executeSql(`
    CREATE TABLE IF NOT EXISTS simulation_results (
      result_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(user_id),
      scenario_variables TEXT NOT NULL,
      results TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✓ Created: simulation_results');

  // Emergency Profiles (2E)
  db.executeSql(`
    CREATE TABLE IF NOT EXISTS emergency_profiles (
      profile_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(user_id),
      authorized_fields TEXT DEFAULT '["full_name","blood_type","allergies","emergency_contact","critical_condition"]',
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      critical_condition TEXT,
      current_medication TEXT,
      allergens TEXT,
      blood_type TEXT,
      nfc_uid TEXT,
      offline_dataset TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✓ Created: emergency_profiles');

  // Access Logs (2F)
  db.executeSql(`
    CREATE TABLE IF NOT EXISTS access_logs (
      log_id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(user_id),
      accessed_by TEXT,
      access_type TEXT NOT NULL,
      resource_type TEXT,
      ip_address TEXT,
      user_agent TEXT,
      success INTEGER DEFAULT 1,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✓ Created: access_logs');

  // Therapy / Doctor Recommendations (2D)
  db.executeSql(`
    CREATE TABLE IF NOT EXISTS therapy_recommendations (
      recommendation_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(user_id),
      doctor_name TEXT,
      recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('medication', 'rest', 'activity', 'nutrition', 'follow_up', 'other')),
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      interval_hours INTEGER,
      first_dose_time TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✓ Created: therapy_recommendations');

  // Notifications
  db.executeSql(`
    CREATE TABLE IF NOT EXISTS notifications (
      notification_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(user_id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      related_entity_type TEXT,
      related_entity_id TEXT,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('✓ Created: notifications');

  db.saveDatabase();
  console.log('\n✓ Schema setup complete!');
  process.exit(0);
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});