/**
 * Seeds three demo accounts with 21 entries each, sample insights, and weekly summaries.
 *
 * Requires in .env (never commit):
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *   VITE_SUPABASE_URL or SUPABASE_URL
 *
 * Run: npm run seed:demo
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  PERSONAS,
  DEMO_PASSWORD,
  buildEntryRows,
  buildWeeklyRows,
} from './demoData.mjs';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL (or SUPABASE_URL) in .env'
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function getOrCreateUser({ email, password, displayName }) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      await supabase.auth.admin.updateUserById(found.id, {
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      });
      return found.id;
    }
    if (data.users.length < perPage) break;
    page += 1;
  }

  const { data: created, error: cErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (cErr) throw cErr;
  return created.user.id;
}

async function seedPersona(persona) {
  const userId = await getOrCreateUser({
    email: persona.email,
    password: DEMO_PASSWORD,
    displayName: persona.displayName,
  });

  await supabase.from('profiles').update({ display_name: persona.displayName }).eq('id', userId);

  await supabase.from('entries').delete().eq('user_id', userId).eq('is_demo', true);
  await supabase.from('insights').delete().eq('user_id', userId);
  await supabase.from('weekly_summaries').delete().eq('user_id', userId);

  const entryRows = buildEntryRows(persona, userId);
  const { data: insertedEntries, error: entErr } = await supabase
    .from('entries')
    .insert(entryRows)
    .select('id, created_at');

  if (entErr) throw entErr;

  const byTime = [...insertedEntries].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
  const entryIds = byTime.map((e) => e.id);

  const insightRows = persona.insights.map((ins, idx) => ({
    user_id: userId,
    type: ins.type,
    title: ins.title,
    body: ins.body,
    confidence_score: ins.confidence_score,
    entry_count: ins.entry_count,
    source_entry_ids:
      idx === 0 ? entryIds.slice(0, 3) : entryIds.slice(10, Math.min(14, entryIds.length)),
    is_read: false,
    dismissed: false,
  }));

  const { error: insErr } = await supabase.from('insights').insert(insightRows);
  if (insErr) throw insErr;

  const weeklyRows = buildWeeklyRows(persona, userId);
  const { error: wErr } = await supabase.from('weekly_summaries').insert(weeklyRows);
  if (wErr) throw wErr;

  return { email: persona.email, entries: entryIds.length };
}

async function main() {
  console.log('Seeding demo personas…');
  for (const persona of PERSONAS) {
    const r = await seedPersona(persona);
    console.log(`  ✓ ${persona.displayName} (${r.email}) — ${r.entries} entries`);
  }
  console.log('\nDemo logins (password for all):', DEMO_PASSWORD);
  console.log(PERSONAS.map((p) => `  ${p.email}`).join('\n'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
