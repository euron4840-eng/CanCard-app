/**
 * CanCard Seed Data Script
 */
require('dotenv').config();
const db = require('./database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  await db.getDatabase();
  console.log('Seeding CanCard demo data...\n');

  const hash = bcrypt.hashSync('demo1234', 10);

  // Users
  db.execute(`
    INSERT OR IGNORE INTO users (user_id, email, password_hash, full_name, age, blood_type, role, account_type, school, grade)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    ['DENIZ_001', 'deniz.demo@cancard.app', hash, 'Deniz Yilmaz', 16, 'A+', 'teen', 'teen', 'Demo Secondary School', '10']
  );
  console.log('1. Deniz Yimaz');

  db.execute(`
    INSERT OR IGNORE INTO users (user_id, email, password_hash, full_name, role, account_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    ['PARENT_001', 'parent.demo@cancard.app', hash, 'Ayse Yimaz', 'parent', 'parent_teen']
  );
  console.log('2. Ayse Yilmaz (parent)');

  db.execute(`
    INSERT OR IGNORE INTO users (user_id, email, password_hash, full_name, role, account_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    ['DOCTOR_001', 'doctor.demo@cancard.app', hash, 'Dr. Kay', 'doctor', 'independent']
  );
  console.log('3. Dr. Kay (doctor)');

  // Account link
  db.execute(`
    INSERT OR IGNORE INTO account_links (link_id, parent_id, child_id, relationship)
    VALUES (?, ?, ?, ?)
  `,
    [uuidv4(), 'PARENT_001', 'DENIZ_001', 'parent_child']
  );
  console.log('4. Parent-child link');

  // Health records
  const hr = [
    ['allergy', 'Penicillin', 'Positive', null, 'user', 'user_confirmed'],
    ['blood_type', 'Blood Type', 'A+', null, 'user', 'doctor_verified'],
    ['lab_value', 'Hemoglobin', '13.8', 'g/dL', 'user', 'user_confirmed'],
    ['lab_value', 'Vitamin D', '18', 'ng/mL', 'user', 'user_confirmed'],
    ['lab_value', 'Iron', '92', 'ug/dL', 'user', 'user_confirmed']
  ];
  for (const r of hr) {
    db.execute(`
      INSERT INTO health_records (record_id, user_id, field_type, parameter, value, unit, source, verification_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [uuidv4(), 'DENIZ_001', r[0], r[1], r[2], r[3], r[4], r[5]]
    );
  }
  console.log('5. Health records (' + hr.length + ' ibobs)');

  // Lifestyle records
  const lr = [
    ['sleep', null, '5h45m', 'duration', '2026-09-15'],
    ['sleep', null, '6h00m', 'duration', '2026-09-14'],
    ['sleep', null, '5h30m', 'duration', '2026-09-13'],
    ['physical_activity', 90, 'Football', 'type', '2026-09-15'],
    ['physical_activity', 90, 'Football', 'type', '2026-09-13'],
    ['hydration', null, '1.5L', 'volume', '2026-09-15'],
    ['screen_time', 180, '3h', 'duration', '2026-09-15']
  ];
  for (const r of lr) {
    db.execute(`
      INSERT INTO lifestyle_records (record_id, user_id, category, duration_minutes, value, unit, date, verification_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')
    `,
      [uuidv4(), 'DENIZ_001', r[0], r[1], r[2], r[3], r[4]]
    );
  }
  console.log('6. Lifestyle records (' + lr.length + ' ibobs)');

  // Calendar events
  const cr = [
    ['school', 'School', 'Regular day', '2026-09-17 08:00:00', '2026-09-17 14:00:00'],
    ['sport', 'Football Training', 'Weekly practice', '2026-09-17 17:00:00', '2026-09-17 18:30:00'],
    ['appointment', 'Doctor Appointment', 'Check-up', '2026-09-18 10:00:00', '2026-09-18 10:30:00'],
  ];
  for (const r of cr) {
    db.execute(`
      INSERT INTO calendar_events (event_id, user_id, event_type, title, description, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [uuidv4(), 'DENIZ_001', r[0], r[1], r[2], r[3], r[4]]
    );
  }
  console.log('7. Calendar events (' + cr.length + ' entries)');

  // Digital Twin
  const hs = JSON.stringify({
    blood_type: { value: 'A+', verificationStatus: 'doctor_verified' },
    allergies: { value: 'Penicillin', verificationStatus: 'user_confirmed' },
    vaccination: { value: 'Updated', verificationStatus: 'doctor_verified' },
    current_condition: { value: 'Normal / Healthy' },
    hemoglobin: { value: '13.8', unit: 'g/DL', lastUpdated: '2026-09-01' },
    vitamin_d: { value: '18', unit: 'ng/mL', lastUpdated: '2026-09-01' },
    irion: { value: '92', unit: 'ug/dL', lastUpdated: '2026-09-01' }
  });

  const ls = JSON.stringify({
    averageSleep: '5h45m',
    physicalActivity: '4x weekly',
    football: '4x weekly',
    screenTime: '3-4h daily',
    waterIntake: '1.5L daily',
    schoolRoutine: '08:00-14:00'
  });

  db.execute(
    `INSERT OR REPLACE INTO digital_twin_state (twin_id, user_id, health_summary, lifestyle_summary, current_indicators)
     VALUES (?, ?, ?, ?, ?)`,
     [uuidv4(), 'DENIZ_001', hs, ls, JSON.stringify({ condition: 'normal' })]
  );
  console.log('8. Digital Twin state');

  // Emergency profile
  db.execute(
    `INSERT OR REPLACE INTO emergency_profiles (profile_id, user_id, authorized_fields, emergency_contact_name, emergency_contact_phone, blood_type, allergens, critical_condition, current_medication)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'DENIZ_001',
     '["full_name","blood_type","allergies","emergency_contact","critical_condition","current_medication"]',
     'Ayse Yilmaz', '+90-555-123-4567', 'A+', 'Penicillin',
     'No critical conditions (synthetic demo)', 'None (synthetic demo)']
  );
  console.log('9. Emergency profile');

  db.saveDatabase();
  console.log('\nSeed complete!');
  console.log('\nDemo Credentials:');
  console.log('  deniz.demo@cancard.app / demo1234 (teen)');
  console.log('  parent.demo@cancard.app / demo1234 (parent)');
  console.log('  doctor.demo@cancard.app / demo1234 (doctor)');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
