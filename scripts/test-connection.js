const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pvcklwjbkgvqflwhruon.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Y2tsd2pia2d2cWZsd2hydW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDQ4MzcsImV4cCI6MjA3NjE4MDgzN30.L-LFXeK1Q16Mb--orJd_EkMfr62AHR2x6A7NOcOe6_I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔌 Testing Supabase connection...');

    // Test basic connection by checking if we can fetch from a simple query
    const { data, error } = await supabase.from('information_schema.tables').select('table_name').limit(1);

    if (error) {
      console.log('⚠️  Cannot query system tables (expected with anon key)');
      console.log('Error:', error.message);
    } else {
      console.log('✅ Connection successful!');
      console.log('Available tables:', data);
    }

    // Try to access an existing table to see if database is set up
    const { data: users, error: userError } = await supabase.from('users').select('*').limit(1);

    if (userError) {
      console.log('📋 Database schema not yet created');
      console.log('Need to run migrations in Supabase dashboard');
    } else {
      console.log('✅ Database already set up!');
      console.log('Sample user data:', users);
    }

  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();