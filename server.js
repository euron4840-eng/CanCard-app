require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());
app.use(express.static('public')); // Add this line to serve HTML/CSS/JS files

// Open local SQL database
const db = new sqlite3.Database('./cancard.db');

// Set up table and initial seed data
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      blood_type TEXT NOT NULL,
      verification_status TEXT DEFAULT 'self_reported'
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO users (user_id, full_name, age, blood_type, verification_status)
    VALUES ('DENIZ_001', 'Deniz Yılmaz', 16, 'A+', 'doctor_verified')
  `);
});

// 1. GET: Fetch user by ID
app.get('/api/user/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM users WHERE user_id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User profile not found' });

    res.json({
      userId: row.user_id,
      fullName: row.full_name,
      age: row.age,
      bloodType: row.blood_type,
      verificationStatus: row.verification_status
    });
  });
});

// 2. POST: Add a new user
app.post('/api/user', (req, res) => {
  const { userId, fullName, age, bloodType, verificationStatus } = req.body;

  const sql = `
    INSERT INTO users (user_id, full_name, age, blood_type, verification_status)
    VALUES (?, ?, ?, ?, ?)
  `;
  const params = [userId, fullName, age, bloodType, verificationStatus || 'self_reported'];

  db.run(sql, params, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: 'User created successfully', userId });
  });
});

// 3. PUT: Update an existing user
app.put('/api/user/:id', (req, res) => {
  const { id } = req.params;
  const { fullName, age, bloodType, verificationStatus } = req.body;

  const sql = `
    UPDATE users
    SET full_name = COALESCE(?, full_name),
        age = COALESCE(?, age),
        blood_type = COALESCE(?, blood_type),
        verification_status = COALESCE(?, verification_status)
    WHERE user_id = ?
  `;

  const params = [
    fullName ?? null,
    age ?? null,
    bloodType ?? null,
    verificationStatus ?? null,
    id
  ];

  db.run(sql, params, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User updated successfully', userId: id });
  });
});

// 4. DELETE: Remove a user by ID
app.delete('/api/user/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM users WHERE user_id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully', userId: id });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});