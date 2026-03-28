import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://qgxhrxvryuguhixlprzd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFneGhyeHZyeXVndWhpeGxwcnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjQ3MjcsImV4cCI6MjA5MDI0MDcyN30.YRbIS23Oey7DLGJfgq3rJNMDNgqDirz6mwIt_amQ7FA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
async function check() {
  const { data, error } = await supabase.from('entries').select('id, sentiment_score, created_at');
  if (error) { console.error(error); process.exit(1); }
  console.log('Total entries:', data.length);
  console.log('Scores:', data.map(e => e.sentiment_score));
}
check();
