#!/usr/bin/env node
/**
 * Seed the database with initial doctor and patient users
 */

const bcrypt = require('bcryptjs');
const { db } = require('./db/database');

const DOCTORS = [
  { name: 'Dr. Priya Sharma', email: 'sharma@medibook.com', specialty: 'Cardiologist' },
  { name: 'Dr. Arjun Mehta', email: 'mehta@medibook.com', specialty: 'Neurologist' },
  { name: 'Dr. Sneha Kulkarni', email: 'kulkarni@medibook.com', specialty: 'Dermatologist' },
  { name: 'Dr. Rohit Patil', email: 'patil@medibook.com', specialty: 'Orthopedic' },
  { name: 'Dr. Anita Desai', email: 'desai@medibook.com', specialty: 'Pediatrician' },
  { name: 'Dr. Vikram Joshi', email: 'joshi@medibook.com', specialty: 'General Physician' },
];

const PATIENTS = [
  { name: 'John Doe', email: 'john@example.com', phone: '9876543210' },
  { name: 'Jane Smith', email: 'jane@example.com', phone: '9876543211' },
];

const ADMIN = { name: 'Admin', email: 'admin@medibook.com', password: 'admin123' };

const PASSWORD = 'doctor123';

async function hashPassword(pwd) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(pwd, 10, (err, hash) => {
      if (err) reject(err);
      else resolve(hash);
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function seedDatabase() {
  try {
    const hashedPassword = await hashPassword(PASSWORD);
    const hashedAdminPassword = await hashPassword(ADMIN.password);

    // Seed admin
    console.log('Seeding admin...');
    const existingAdmin = await dbGet('SELECT id FROM users WHERE email = ?', [ADMIN.email]);
    if (existingAdmin) {
      console.log(`✓ Admin ${ADMIN.email} already exists`);
    } else {
      const adminId = await dbRun(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [ADMIN.name, ADMIN.email, hashedAdminPassword, 'admin']
      );
      console.log(`✓ Created admin: ${ADMIN.name} (${ADMIN.email})`);
    }

    // Seed doctors
    console.log('\nSeeding doctors...');
    for (const doctor of DOCTORS) {
      const existing = await dbGet('SELECT id FROM users WHERE email = ?', [doctor.email]);
      if (existing) {
        console.log(`✓ Doctor ${doctor.email} already exists`);
        continue;
      }
      const userId = await dbRun(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [doctor.name, doctor.email, hashedPassword, 'doctor']
      );
      console.log(`✓ Created doctor: ${doctor.name} (${doctor.email})`);
    }

    // Seed patients
    console.log('\nSeeding patients...');
    for (const patient of PATIENTS) {
      const existing = await dbGet('SELECT id FROM users WHERE email = ?', [patient.email]);
      if (existing) {
        console.log(`✓ Patient ${patient.email} already exists`);
        continue;
      }
      const userId = await dbRun(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [patient.name, patient.email, hashedPassword, 'patient']
      );
      await dbRun(
        'INSERT INTO patients (user_id, phone) VALUES (?, ?)',
        [userId, patient.phone]
      );
      console.log(`✓ Created patient: ${patient.name} (${patient.email})`);
    }

    console.log('\n✅ Database seeding complete!');
    console.log('\nYou can now log in with:');
    console.log('Doctors: use any doctor email (e.g., sharma@medibook.com) with password "doctor123"');
    console.log('Patients: use patient email with password "doctor123"');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

db.serialize(() => {
  seedDatabase();
});
