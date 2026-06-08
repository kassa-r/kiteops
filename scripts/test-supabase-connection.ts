import { createClient } from '@supabase/supabase-js';
// Note: This script assumes you can import from @supabase/supabase-js.
// If running from root, ensure you have dependencies installed or use a tool that finds them.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase environment variables.');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables before running.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log(`Testing connection to ${supabaseUrl}...`);
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Connection failed with Supabase error:', error);
    } else {
      console.log(`Connection successful! Profiles table accessible.`);
    }
  } catch (err) {
    console.error('Connection failed with unexpected error:', err);
  }
}

testConnection();
