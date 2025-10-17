const fs = require('fs');
const path = require('path');

// Read the Supabase configuration
const SUPABASE_URL = 'https://pvcklwjbkgvqflwhruon.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Y2tsd2pia2d2cWZsd2hydW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDQ4MzcsImV4cCI6MjA3NjE4MDgzN30.L-LFXeK1Q16Mb--orJd_EkMfr62AHR2x6A7NOcOe6_I';

async function runSQL(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    console.log('SQL executed successfully:', result);
    return result;
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Setting up dental CRM database...');

    // Read and execute the initial schema migration
    const schemaPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 Creating database schema...');
    await runSQL(schemaSQL);

    // Read and execute the seed data migration
    const seedPath = path.join(__dirname, '../supabase/migrations/002_seed_data.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    console.log('🌱 Seeding database with sample data...');
    await runSQL(seedSQL);

    console.log('✅ Database setup complete!');
    console.log('🦷 Your dental CRM database is ready with sample practices, users, and tickets.');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();