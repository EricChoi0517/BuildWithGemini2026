/**
 * Echo Journal — Demo Persona Seed Script
 *
 * Creates 3 demo users with 21 days of journal entries,
 * pre-generated insights, and weekly summaries.
 *
 * Requires in .env (never commit the service role key):
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *   VITE_SUPABASE_URL or SUPABASE_URL
 *
 * Run: npm run seed:demo
 *
 * Demo logins (password for all: echo-demo-2026):
 *   alex@echojournal.demo
 *   maya@echojournal.demo
 *   jordan@echojournal.demo
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Missing SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL (or SUPABASE_URL) in .env'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================
// HELPERS
// ============================================
function daysAgo(n, hour = 21, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - (21 - n));
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ============================================
// PERSONA 1 — ALEX (The Founder)
// Arc: Slow burnout over 3 weeks
// Sentiment: starts +0.6, ends -0.4
// Key entities: Sarah (co-founder), Diana (investor), investors
// Unresolved thread: "the board meeting" mentioned day 3, never revisited
// Vocabulary drift: "excited" → "hoping" → "trying"
// ============================================
const alexEntries = [
  {
    day: 1, created_at: daysAgo(1, 8, 15),
    transcript: "Excited about this week. We just closed a seed extension and the team is fired up. Had a great call with two potential enterprise clients this morning. Sarah and I are finally aligned on the product roadmap. Revenue is trending up and I feel like we're building real momentum. This is why I started this company.",
    duration_seconds: 28, energy_level: 0.82, speaking_rate: 152, pause_ratio: 0.10, pitch_variance: 0.38,
    sentiment_score: 0.8, sentiment_label: 'positive',
    entities: ['Sarah'], topics: ['seed extension', 'enterprise clients', 'product roadmap', 'revenue'],
    unresolved_threads: [], summary: 'Great momentum after seed extension, aligned with Sarah on roadmap.',
  },
  {
    day: 2, created_at: daysAgo(2, 21, 30),
    transcript: "Good day. Spent most of it on hiring. We need a senior backend engineer but the pipeline is thin. Every good candidate wants fully remote and we're hybrid. Sarah thinks we should bend on this but I'm worried about culture. Also excited about the demo day next month. Practicing my pitch this weekend.",
    duration_seconds: 30, energy_level: 0.70, speaking_rate: 145, pause_ratio: 0.14, pitch_variance: 0.30,
    sentiment_score: 0.5, sentiment_label: 'positive',
    entities: ['Sarah'], topics: ['hiring', 'remote work', 'demo day', 'pitch'],
    unresolved_threads: ['remote work policy'], summary: 'Hiring challenges, demo day prep, debating remote policy with Sarah.',
  },
  {
    day: 3, created_at: daysAgo(3, 22, 0),
    transcript: "The board meeting is coming up and I haven't even started the deck. Diana wants updated financials and a revised burn rate projection. I told Sarah I'd handle it but honestly I'm drowning in operational stuff. Spent three hours today on a customer escalation that should have been handled by support. Need to delegate better.",
    duration_seconds: 29, energy_level: 0.50, speaking_rate: 158, pause_ratio: 0.12, pitch_variance: 0.42,
    sentiment_score: 0.0, sentiment_label: 'neutral',
    entities: ['Diana', 'Sarah'], topics: ['board meeting', 'financials', 'burn rate', 'delegation'],
    unresolved_threads: ['board meeting deck'], summary: 'Board meeting prep stress, struggling to delegate, customer fire drill.',
  },
  {
    day: 4, created_at: daysAgo(4, 20, 45),
    transcript: "Sarah and I got into it today about the pricing model. She wants to go freemium and I think it's too early. We were both frustrated and it bled into the team standup which wasn't great. We smoothed it over after but something feels off. We used to just vibe on these decisions.",
    duration_seconds: 27, energy_level: 0.45, speaking_rate: 140, pause_ratio: 0.20, pitch_variance: 0.40,
    sentiment_score: -0.2, sentiment_label: 'negative',
    entities: ['Sarah'], topics: ['pricing', 'co-founder conflict', 'team dynamics'],
    unresolved_threads: ['pricing disagreement'], summary: 'Fight with Sarah about pricing, tension visible to team.',
  },
  {
    day: 5, created_at: daysAgo(5, 23, 15),
    transcript: "Investors want a monthly update and I've been putting it off. The numbers are fine but the narrative is harder to write. How do you say 'we're growing but I'm exhausted and my co-founder and I aren't communicating well' in investor-speak. Anyway. Knocked out some product work tonight which felt good.",
    duration_seconds: 26, energy_level: 0.42, speaking_rate: 135, pause_ratio: 0.22, pitch_variance: 0.35,
    sentiment_score: -0.1, sentiment_label: 'neutral',
    entities: ['Sarah', 'investors'], topics: ['investor update', 'communication', 'exhaustion'],
    unresolved_threads: [], summary: 'Dreading investor update, noting communication gap with Sarah.',
  },
  {
    day: 6, created_at: daysAgo(6, 14, 0),
    transcript: "Saturday but I'm at my laptop. Trying to get ahead on the board deck. Sarah texted asking if I wanted to grab lunch and I said I was busy. I know I should take breaks but every hour I'm not working feels like we're falling behind. The runway is fourteen months. Fourteen months sounds like a lot until it isn't.",
    duration_seconds: 28, energy_level: 0.35, speaking_rate: 128, pause_ratio: 0.25, pitch_variance: 0.28,
    sentiment_score: -0.3, sentiment_label: 'negative',
    entities: ['Sarah'], topics: ['weekend work', 'runway', 'isolation'],
    unresolved_threads: [], summary: 'Working through Saturday, declined Sarah lunch invite, fixating on runway.',
  },
  {
    day: 7, created_at: daysAgo(7, 22, 30),
    transcript: "Sunday night. Didn't leave the apartment all weekend. Ate delivery twice. I'm aware this isn't sustainable. But the board deck is done and it actually looks good. Small win. Starting the week hoping things settle down. I keep using that word. Hoping. Like I don't have control over it.",
    duration_seconds: 24, energy_level: 0.30, speaking_rate: 118, pause_ratio: 0.28, pitch_variance: 0.22,
    sentiment_score: -0.3, sentiment_label: 'negative',
    entities: [], topics: ['isolation', 'health', 'self-awareness'],
    unresolved_threads: [], summary: 'Full weekend working, noticing unhealthy patterns, using "hoping" language.',
  },
  {
    day: 8, created_at: daysAgo(8, 9, 0),
    transcript: "Monday. Team standup felt flat. I could tell people are picking up on my energy. One of our engineers asked if everything was okay and I said yeah just busy. I don't want to bring my stress into the team but I think I already am. Sarah was late to standup which annoyed me more than it should have.",
    duration_seconds: 26, energy_level: 0.38, speaking_rate: 132, pause_ratio: 0.20, pitch_variance: 0.30,
    sentiment_score: -0.2, sentiment_label: 'negative',
    entities: ['Sarah'], topics: ['team morale', 'leadership', 'irritability'],
    unresolved_threads: [], summary: 'Team sensing low energy, irritated at Sarah over small things.',
  },
  {
    day: 9, created_at: daysAgo(9, 21, 0),
    transcript: "Had coffee with another founder today. He sold his company last year. I asked him how he knew when to push through versus when something was actually broken. He said if you're asking the question it's already worth paying attention to. That hit different. Still processing it.",
    duration_seconds: 25, energy_level: 0.45, speaking_rate: 125, pause_ratio: 0.24, pitch_variance: 0.28,
    sentiment_score: 0.1, sentiment_label: 'neutral',
    entities: [], topics: ['mentorship', 'self-reflection', 'burnout'],
    unresolved_threads: [], summary: 'Mentor conversation planted a seed about recognizing burnout.',
  },
  {
    day: 10, created_at: daysAgo(10, 22, 45),
    transcript: "Investors want to schedule a call. Probably about the update I still haven't sent. I keep hoping they'll just forget about it. There's that word again. Hoping. I emailed Diana to push the board meeting back a week. She said fine but I could feel the judgment through the screen.",
    duration_seconds: 23, energy_level: 0.32, speaking_rate: 138, pause_ratio: 0.18, pitch_variance: 0.35,
    sentiment_score: -0.4, sentiment_label: 'negative',
    entities: ['Diana', 'investors'], topics: ['avoidance', 'investors', 'board meeting'],
    unresolved_threads: [], summary: 'Avoiding investor communication, pushed board meeting, noting "hoping" pattern.',
  },
  {
    day: 11, created_at: daysAgo(11, 20, 30),
    transcript: "Sarah confronted me today. Said I've been distant and short with her for two weeks. She's right. I apologized but I don't think I explained myself well. I said I was just stressed and she said that's not a strategy. She's right about that too. I'm just... trying to hold it all together.",
    duration_seconds: 27, energy_level: 0.35, speaking_rate: 122, pause_ratio: 0.28, pitch_variance: 0.32,
    sentiment_score: -0.4, sentiment_label: 'negative',
    entities: ['Sarah'], topics: ['co-founder relationship', 'confrontation', 'stress'],
    unresolved_threads: [], summary: 'Sarah called out distance, acknowledged she was right, using "trying" language.',
  },
  {
    day: 12, created_at: daysAgo(12, 21, 15),
    transcript: "Lost a customer today. Not a huge one but it stings. They said our onboarding was confusing and support was slow. Both fair criticisms. I know what we need to fix but I don't have the bandwidth to fix it. That's the whole problem. Everything is clear but nothing is actionable because I'm spread too thin.",
    duration_seconds: 28, energy_level: 0.28, speaking_rate: 142, pause_ratio: 0.15, pitch_variance: 0.38,
    sentiment_score: -0.5, sentiment_label: 'negative',
    entities: [], topics: ['churn', 'onboarding', 'bandwidth', 'overwhelm'],
    unresolved_threads: [], summary: 'Lost customer, clear on problems but no bandwidth to fix them.',
  },
  {
    day: 13, created_at: daysAgo(13, 15, 0),
    transcript: "Saturday again. At the office again. Nobody else is here. Sarah went to her friend's birthday and I told her I couldn't make it. The truth is I could have. I just didn't want to pretend to be fine in front of people who would ask about the company. The performance of being a founder is exhausting on its own.",
    duration_seconds: 26, energy_level: 0.22, speaking_rate: 115, pause_ratio: 0.30, pitch_variance: 0.20,
    sentiment_score: -0.5, sentiment_label: 'negative',
    entities: ['Sarah'], topics: ['weekend work', 'social avoidance', 'performance', 'isolation'],
    unresolved_threads: [], summary: 'Working alone on Saturday, avoiding social situations, exhausted by founder performance.',
  },
  {
    day: 14, created_at: daysAgo(14, 23, 45),
    transcript: "Didn't do anything today. Sat on the couch. Watched videos. Couldn't make myself open my laptop. I know I should be worried about that but honestly it felt like my body just said no. Maybe that's what rest looks like when you've forgotten how to do it voluntarily.",
    duration_seconds: 20, energy_level: 0.15, speaking_rate: 105, pause_ratio: 0.35, pitch_variance: 0.15,
    sentiment_score: -0.4, sentiment_label: 'negative',
    entities: [], topics: ['burnout', 'paralysis', 'rest'],
    unresolved_threads: [], summary: 'Completely shut down, body refused to work, involuntary rest day.',
  },
  {
    day: 15, created_at: daysAgo(15, 21, 0),
    transcript: "Trying to get back on track. Had a decent product session. We shipped a small fix that a customer asked for and they sent a really nice thank you email. That helped. Sarah and I had lunch and actually talked about non-work stuff for the first time in weeks. She mentioned she's been worried about me.",
    duration_seconds: 27, energy_level: 0.42, speaking_rate: 130, pause_ratio: 0.20, pitch_variance: 0.28,
    sentiment_score: 0.1, sentiment_label: 'neutral',
    entities: ['Sarah'], topics: ['recovery', 'customer win', 'co-founder', 'concern'],
    unresolved_threads: [], summary: 'Small wins helping, Sarah expressed worry, trying to stabilize.',
  },
  {
    day: 16, created_at: daysAgo(16, 22, 30),
    transcript: "Investor call happened. It was actually fine. They're happy with the numbers. I was transparent about being stretched thin and they suggested we hire a VP of Operations. Which is smart but also feels like admitting I can't do this. I know that's ego talking. Trying to separate the two.",
    duration_seconds: 26, energy_level: 0.40, speaking_rate: 135, pause_ratio: 0.18, pitch_variance: 0.30,
    sentiment_score: 0.0, sentiment_label: 'neutral',
    entities: ['investors'], topics: ['investor call', 'hiring', 'vulnerability', 'ego'],
    unresolved_threads: ['VP of Operations hiring'], summary: 'Investor call went fine, they suggested VP Ops, wrestling with ego.',
  },
  {
    day: 17, created_at: daysAgo(17, 20, 0),
    transcript: "Sarah shared a job description she drafted for the VP Ops role. It was really good. Thorough. She'd clearly been thinking about this for a while. I felt guilty that she had to do that because I was too proud to admit I needed help. Told her that. She appreciated it.",
    duration_seconds: 24, energy_level: 0.45, speaking_rate: 128, pause_ratio: 0.22, pitch_variance: 0.25,
    sentiment_score: 0.2, sentiment_label: 'positive',
    entities: ['Sarah'], topics: ['hiring', 'vulnerability', 'co-founder', 'gratitude'],
    unresolved_threads: [], summary: 'Sarah proactively drafted VP Ops JD, admitted needing help.',
  },
  {
    day: 18, created_at: daysAgo(18, 21, 30),
    transcript: "Skipped lunch again. Third time this week. I know I keep doing this. Trying to at least notice it even if I can't fix it yet. The product is in a good place. ARR is growing. I just need to stop treating myself like fuel to burn. That's what Sarah said and she's not wrong.",
    duration_seconds: 22, energy_level: 0.35, speaking_rate: 120, pause_ratio: 0.25, pitch_variance: 0.22,
    sentiment_score: -0.2, sentiment_label: 'negative',
    entities: ['Sarah'], topics: ['health', 'skipping meals', 'self-awareness', 'ARR'],
    unresolved_threads: ['skipping meals'], summary: 'Skipping meals pattern, Sarah called out self-neglect.',
  },
  {
    day: 19, created_at: daysAgo(19, 22, 0),
    transcript: "A friend asked me today how the startup was going and I said 'we're trying.' Not 'great' or 'exciting' or even 'hard.' Just trying. I heard myself say it and it felt honest in a way that scared me. The company is fine. The metrics are fine. I'm the part that's not fine.",
    duration_seconds: 25, energy_level: 0.30, speaking_rate: 115, pause_ratio: 0.28, pitch_variance: 0.25,
    sentiment_score: -0.4, sentiment_label: 'negative',
    entities: [], topics: ['identity', 'honesty', 'burnout', 'disconnection'],
    unresolved_threads: [], summary: 'Heard himself say "trying" and recognized personal crisis separate from company.',
  },
  {
    day: 20, created_at: daysAgo(20, 21, 45),
    transcript: "Sarah booked me a therapy appointment. She didn't ask, she just did it. I should be annoyed but I'm mostly relieved. First session is Thursday. I also finally sent the investor update. It was honest. Shorter than usual. Nobody complained.",
    duration_seconds: 20, energy_level: 0.38, speaking_rate: 125, pause_ratio: 0.22, pitch_variance: 0.28,
    sentiment_score: 0.1, sentiment_label: 'neutral',
    entities: ['Sarah', 'investors'], topics: ['therapy', 'co-founder support', 'investor update'],
    unresolved_threads: [], summary: 'Sarah booked therapy for him, sent honest investor update.',
  },
  {
    day: 21, created_at: daysAgo(21, 21, 0),
    transcript: "Three weeks. Looking back at this I can see it clearly. The excitement turned into pressure turned into avoidance turned into paralysis. I'm not fixed. But I'm aware. Sarah and I are talking again. The therapy appointment is tomorrow. The company will survive me taking care of myself. Trying to believe that.",
    duration_seconds: 30, energy_level: 0.42, speaking_rate: 120, pause_ratio: 0.24, pitch_variance: 0.28,
    sentiment_score: -0.1, sentiment_label: 'neutral',
    entities: ['Sarah'], topics: ['reflection', 'self-awareness', 'therapy', 'recovery'],
    unresolved_threads: [], summary: 'Three-week reflection — sees the burnout arc clearly, taking first steps toward recovery.',
  },
];

// ============================================
// PERSONA 2 — MAYA (The Student)
// Arc: Anxiety spike before exams, relief after
// Key entities: Jake (roommate), Professor Chen, Anika (study partner)
// Unresolved thread: Jake mentioned positively early on, disappears entirely
// Speech patterns: pause ratio increases, speaking rate goes up pre-exams
// Duration gets shorter in week 3 (exhaustion)
// ============================================
const mayaEntries = [
  {
    day: 1, created_at: daysAgo(1, 22, 0),
    transcript: "Good first week of the quarter. Moved into the new apartment with Jake and it's way better than the dorms. He made pasta for us on the first night which was sweet. My schedule is heavy but manageable. Stats, algorithms, and Professor Chen's NLP seminar which I'm really excited about.",
    duration_seconds: 28, energy_level: 0.72, speaking_rate: 148, pause_ratio: 0.12, pitch_variance: 0.32,
    sentiment_score: 0.7, sentiment_label: 'positive',
    entities: ['Jake', 'Professor Chen'], topics: ['new apartment', 'roommate', 'classes', 'NLP'],
    unresolved_threads: [], summary: 'Good start to quarter, happy with new apartment and Jake, excited about NLP seminar.',
  },
  {
    day: 2, created_at: daysAgo(2, 21, 30),
    transcript: "Went to the campus fair with Jake. He signed up for intramural soccer and I found a quant finance reading group which is perfect. Met this girl Anika who's also in the algorithms class. We might start studying together. Weather was beautiful. College feels right today.",
    duration_seconds: 25, energy_level: 0.68, speaking_rate: 142, pause_ratio: 0.14, pitch_variance: 0.30,
    sentiment_score: 0.6, sentiment_label: 'positive',
    entities: ['Jake', 'Anika'], topics: ['campus life', 'quant finance', 'friends', 'study group'],
    unresolved_threads: [], summary: 'Campus fair with Jake, found quant reading group, met Anika.',
  },
  {
    day: 3, created_at: daysAgo(3, 23, 15),
    transcript: "Jake and I had people over and it was actually fun. I'm usually not a host but he makes it easy. Stayed up too late though and I have Professor Chen's seminar at eight thirty tomorrow. The first reading assignment is dense. Sixty pages on transformer architectures. Need to speed read in the morning.",
    duration_seconds: 26, energy_level: 0.55, speaking_rate: 150, pause_ratio: 0.12, pitch_variance: 0.35,
    sentiment_score: 0.3, sentiment_label: 'positive',
    entities: ['Jake', 'Professor Chen'], topics: ['social life', 'sleep', 'transformers', 'reading'],
    unresolved_threads: [], summary: 'Fun night hosting with Jake, but behind on NLP readings.',
  },
  {
    day: 4, created_at: daysAgo(4, 21, 45),
    transcript: "Study session with Anika went well. She's incredibly sharp. We worked through the dynamic programming problem set and she explained the tabulation approach in a way that just clicked. I feel like I'm learning more from study partners than lectures sometimes. Grabbed boba after.",
    duration_seconds: 24, energy_level: 0.62, speaking_rate: 140, pause_ratio: 0.16, pitch_variance: 0.28,
    sentiment_score: 0.5, sentiment_label: 'positive',
    entities: ['Anika'], topics: ['studying', 'dynamic programming', 'algorithms'],
    unresolved_threads: [], summary: 'Great study session with Anika, dynamic programming clicking.',
  },
  {
    day: 5, created_at: daysAgo(5, 22, 30),
    transcript: "Professor Chen announced the midterm format today. Open note but time-pressured. Forty percent of the grade. That's... a lot. Also the stats midterm is the same week. I need to start planning. Made a study calendar tonight but looking at it is already stressful. Two weeks to prepare.",
    duration_seconds: 25, energy_level: 0.48, speaking_rate: 155, pause_ratio: 0.12, pitch_variance: 0.38,
    sentiment_score: -0.1, sentiment_label: 'neutral',
    entities: ['Professor Chen'], topics: ['midterms', 'study planning', 'stress', 'grades'],
    unresolved_threads: [], summary: 'Midterm details dropped, two exams same week, stress building.',
  },
  {
    day: 6, created_at: daysAgo(6, 20, 0),
    transcript: "Something happened with Jake. I came home and he had moved my stuff off the shared desk without asking. I brought it up and he got weirdly defensive. Said I was overreacting. Maybe I was. But it felt dismissive. Didn't want to push it. Studied at the library instead.",
    duration_seconds: 23, energy_level: 0.40, speaking_rate: 135, pause_ratio: 0.22, pitch_variance: 0.35,
    sentiment_score: -0.3, sentiment_label: 'negative',
    entities: ['Jake'], topics: ['roommate conflict', 'boundaries', 'avoidance'],
    unresolved_threads: ['Jake conflict'], summary: 'Jake moved her stuff, got defensive when confronted, retreated to library.',
  },
  {
    day: 7, created_at: daysAgo(7, 23, 0),
    transcript: "Full day at the library. Anika and I did a practice exam for algorithms. I got most of it but blanked on the graph traversal section. Need to review BFS and DFS again. My brain feels full. Going to sleep early tonight. Haven't seen Jake since yesterday. It's fine.",
    duration_seconds: 22, energy_level: 0.38, speaking_rate: 148, pause_ratio: 0.18, pitch_variance: 0.30,
    sentiment_score: -0.1, sentiment_label: 'neutral',
    entities: ['Anika'], topics: ['studying', 'algorithms', 'graph traversal', 'exhaustion'],
    unresolved_threads: [], summary: 'Practice exam went okay, avoiding Jake, mental fatigue.',
  },
  {
    day: 8, created_at: daysAgo(8, 22, 30),
    transcript: "Midterm week starts Monday. I can feel the anxiety in my chest. Like this low hum. Studied for six hours today and I still don't feel ready for stats. The confidence intervals section is confusing and the textbook isn't helping. Anika said she's stressed too which makes me feel slightly less alone in it.",
    duration_seconds: 26, energy_level: 0.35, speaking_rate: 160, pause_ratio: 0.10, pitch_variance: 0.42,
    sentiment_score: -0.4, sentiment_label: 'negative',
    entities: ['Anika'], topics: ['anxiety', 'midterms', 'statistics', 'confidence intervals'],
    unresolved_threads: [], summary: 'Physical anxiety building, stats weak spot, speaking faster.',
  },
  {
    day: 9, created_at: daysAgo(9, 23, 45),
    transcript: "Couldn't sleep last night so I studied until three AM. Bad idea. Fell asleep during the NLP lecture and Professor Chen noticed. She didn't say anything but I saw her look. I'm drinking too much coffee. Three cups today. My hands are shaking a little. Exam is in two days.",
    duration_seconds: 22, energy_level: 0.28, speaking_rate: 165, pause_ratio: 0.08, pitch_variance: 0.45,
    sentiment_score: -0.5, sentiment_label: 'negative',
    entities: ['Professor Chen'], topics: ['insomnia', 'caffeine', 'sleep', 'midterms'],
    unresolved_threads: [], summary: 'Sleep-deprived, fell asleep in lecture, physical anxiety symptoms.',
  },
  {
    day: 10, created_at: daysAgo(10, 22, 0),
    transcript: "Stats midterm today. I think it went okay. Maybe. The last question on hypothesis testing I wasn't sure about. I changed my answer twice. When I change answers it's usually wrong. Whatever. Done. Can't change it now. Algorithms midterm Thursday. No time to rest.",
    duration_seconds: 20, energy_level: 0.32, speaking_rate: 158, pause_ratio: 0.10, pitch_variance: 0.40,
    sentiment_score: -0.2, sentiment_label: 'negative',
    entities: [], topics: ['midterm', 'statistics', 'uncertainty', 'second-guessing'],
    unresolved_threads: [], summary: 'Stats midterm done, second-guessing answers, no rest before next exam.',
  },
  {
    day: 11, created_at: daysAgo(11, 21, 30),
    transcript: "All day algorithms prep. Anika and I did three full practice exams. Graph stuff finally clicked. I can feel the difference between understanding something and just memorizing it. This feels like understanding. I'm tired but less scared. Exam tomorrow morning.",
    duration_seconds: 21, energy_level: 0.40, speaking_rate: 145, pause_ratio: 0.14, pitch_variance: 0.32,
    sentiment_score: 0.1, sentiment_label: 'neutral',
    entities: ['Anika'], topics: ['algorithms', 'graphs', 'exam prep', 'confidence'],
    unresolved_threads: [], summary: 'Intensive prep with Anika, graph algorithms finally clicked.',
  },
  {
    day: 12, created_at: daysAgo(12, 15, 0),
    transcript: "Done. Both midterms done. Algorithms went well I think. The graph question was almost exactly what Anika and I practiced. I feel this huge weight lifted. Literally lighter. Went straight home and slept for four hours. Woke up disoriented but happy.",
    duration_seconds: 20, energy_level: 0.55, speaking_rate: 138, pause_ratio: 0.18, pitch_variance: 0.28,
    sentiment_score: 0.6, sentiment_label: 'positive',
    entities: ['Anika'], topics: ['midterms done', 'relief', 'sleep', 'graphs'],
    unresolved_threads: [], summary: 'Both midterms done, algorithms went well, massive relief.',
  },
  {
    day: 13, created_at: daysAgo(13, 20, 0),
    transcript: "Recovery day. Watched a movie. Ate real food for the first time in days. Anika and I got dinner and just talked about non-school stuff. She wants to work at a quant fund too. We might apply to the same places. That could be cool or competitive. Hopefully cool.",
    duration_seconds: 22, energy_level: 0.58, speaking_rate: 132, pause_ratio: 0.20, pitch_variance: 0.25,
    sentiment_score: 0.5, sentiment_label: 'positive',
    entities: ['Anika'], topics: ['recovery', 'friendship', 'quant finance', 'careers'],
    unresolved_threads: [], summary: 'Post-exam recovery, dinner with Anika, shared career interests.',
  },
  {
    day: 14, created_at: daysAgo(14, 22, 15),
    transcript: "Got the stats midterm back. B plus. I'll take it. The hypothesis testing question I was worried about was actually right the first time before I changed it. Classic. Professor Chen's NLP grades come out next week. That's the one that matters to me.",
    duration_seconds: 19, energy_level: 0.52, speaking_rate: 140, pause_ratio: 0.16, pitch_variance: 0.28,
    sentiment_score: 0.3, sentiment_label: 'positive',
    entities: ['Professor Chen'], topics: ['grades', 'statistics', 'NLP'],
    unresolved_threads: [], summary: 'Stats B+, original answer was right, waiting on NLP grade.',
  },
  {
    day: 15, created_at: daysAgo(15, 21, 0),
    transcript: "I realized I haven't talked to Jake in like a week and a half. We live together and we're basically strangers now. He's always in his room or out. I'm always at the library or with Anika. I should say something but I don't know what. Maybe it's just how it is now.",
    duration_seconds: 21, energy_level: 0.40, speaking_rate: 128, pause_ratio: 0.24, pitch_variance: 0.25,
    sentiment_score: -0.2, sentiment_label: 'negative',
    entities: ['Jake', 'Anika'], topics: ['roommate distance', 'avoidance', 'social drift'],
    unresolved_threads: ['Jake conflict'], summary: 'Realizing Jake has completely disappeared from daily life.',
  },
  {
    day: 16, created_at: daysAgo(16, 22, 30),
    transcript: "Professor Chen's office hours. She said my seminar participation is strong but my written analysis needs more rigor. She also mentioned a research assistant position opening up in her lab next quarter. I want that so badly. Need to make this final paper really good.",
    duration_seconds: 22, energy_level: 0.60, speaking_rate: 145, pause_ratio: 0.14, pitch_variance: 0.32,
    sentiment_score: 0.5, sentiment_label: 'positive',
    entities: ['Professor Chen'], topics: ['office hours', 'research', 'RA position', 'writing'],
    unresolved_threads: [], summary: 'Professor Chen feedback, RA position opportunity, motivated.',
  },
  {
    day: 17, created_at: daysAgo(17, 23, 0),
    transcript: "Working on the NLP final paper. Chose topic on sentiment analysis in financial text. Feels very on brand. Anika is helping me find datasets. The quant reading group met today and we discussed Kelly criterion for position sizing. My worlds are starting to overlap in a good way.",
    duration_seconds: 23, energy_level: 0.55, speaking_rate: 140, pause_ratio: 0.16, pitch_variance: 0.30,
    sentiment_score: 0.4, sentiment_label: 'positive',
    entities: ['Anika'], topics: ['NLP paper', 'sentiment analysis', 'quant finance', 'Kelly criterion'],
    unresolved_threads: [], summary: 'NLP paper on financial sentiment, interests converging.',
  },
  {
    day: 18, created_at: daysAgo(18, 21, 15),
    transcript: "Short one tonight. Tired. Paper is coming along. Ate dinner alone because Anika had a thing. Realized how much I depend on her for social interaction now that Jake and I don't talk. Should probably diversify my social portfolio. Ha. Quant brain is leaking into everything.",
    duration_seconds: 16, energy_level: 0.35, speaking_rate: 125, pause_ratio: 0.22, pitch_variance: 0.22,
    sentiment_score: -0.1, sentiment_label: 'neutral',
    entities: ['Anika', 'Jake'], topics: ['loneliness', 'social dependency', 'humor'],
    unresolved_threads: [], summary: 'Noting social isolation beyond Anika, self-aware humor about it.',
  },
  {
    day: 19, created_at: daysAgo(19, 22, 0),
    transcript: "Algorithms grade posted. A minus. Yes. Anika got an A. I'm happy for her and only a little competitive about it. The graph question carried me. Professor Chen also emailed about the RA position. Application is due next Friday. This is the thing I need to focus on.",
    duration_seconds: 20, energy_level: 0.62, speaking_rate: 148, pause_ratio: 0.12, pitch_variance: 0.35,
    sentiment_score: 0.6, sentiment_label: 'positive',
    entities: ['Anika', 'Professor Chen'], topics: ['grades', 'algorithms', 'RA application'],
    unresolved_threads: [], summary: 'A- in algorithms, RA application deadline set, motivated.',
  },
  {
    day: 20, created_at: daysAgo(20, 21, 30),
    transcript: "Submitted the RA application. Wrote about wanting to explore NLP applications in financial markets. Attached my sentiment analysis paper draft as a writing sample. It's not perfect but it's mine. Anika proofread it. She's been such a good friend this quarter. I should tell her that.",
    duration_seconds: 22, energy_level: 0.58, speaking_rate: 135, pause_ratio: 0.18, pitch_variance: 0.28,
    sentiment_score: 0.5, sentiment_label: 'positive',
    entities: ['Anika', 'Professor Chen'], topics: ['RA application', 'NLP', 'financial markets', 'gratitude'],
    unresolved_threads: [], summary: 'Submitted RA application, grateful for Anika.',
  },
  {
    day: 21, created_at: daysAgo(21, 22, 0),
    transcript: "End of the quarter reflection. The midterm weeks were rough but I came out stronger. My grades are solid. The RA thing could change everything. I still haven't fixed things with Jake and that bothers me more than I want to admit. Maybe next quarter. For now I'm proud of what I pushed through.",
    duration_seconds: 25, energy_level: 0.55, speaking_rate: 130, pause_ratio: 0.20, pitch_variance: 0.28,
    sentiment_score: 0.4, sentiment_label: 'positive',
    entities: ['Jake'], topics: ['reflection', 'growth', 'grades', 'unresolved relationships'],
    unresolved_threads: ['Jake conflict'], summary: 'Quarter reflection — growth through stress, Jake still unresolved.',
  },
];

// ============================================
// PERSONA 3 — JORDAN (The Creative)
// Arc: Creative block then breakthrough
// Key: irregular recording times, "the project" vague for 2 weeks
// High pitch variance (expressive), vocabulary-rich entries
// Entities: Luis (photographer), Mira (gallery owner)
// Insight: most energetic entries happen late at night
// ============================================
const jordanEntries = [
  {
    day: 1, created_at: daysAgo(1, 23, 30),
    transcript: "Late night. The apartment smells like turpentine which means I at least opened the paints today even if I didn't use them. I've been circling around the project for weeks now. I know what I want it to feel like but I can't find the entry point. It's like the idea is a room I can see through frosted glass.",
    duration_seconds: 28, energy_level: 0.50, speaking_rate: 125, pause_ratio: 0.22, pitch_variance: 0.45,
    sentiment_score: -0.1, sentiment_label: 'neutral',
    entities: [], topics: ['creative block', 'the project', 'painting', 'metaphor'],
    unresolved_threads: ['the project'], summary: 'Circling the project, can sense it but can\'t start, poetic about the frustration.',
  },
  {
    day: 2, created_at: daysAgo(2, 9, 15),
    transcript: "Morning for once. Went on a walk before the city got loud. There's a mural going up on Figueroa that stopped me. Massive. Three stories. The scale of someone else's ambition is either inspiring or crushing depending on the day. Today it was inspiring. I took photos. Maybe they'll unlock something.",
    duration_seconds: 25, energy_level: 0.58, speaking_rate: 130, pause_ratio: 0.20, pitch_variance: 0.42,
    sentiment_score: 0.3, sentiment_label: 'positive',
    entities: [], topics: ['morning walk', 'mural', 'inspiration', 'photography'],
    unresolved_threads: [], summary: 'Morning walk, inspired by a massive mural, gathering input.',
  },
  {
    day: 3, created_at: daysAgo(3, 2, 0),
    transcript: "It's two AM and I just spent three hours rearranging my studio instead of working on the project. Classic avoidance behavior dressed up as productivity. The space looks great though. I found an old sketchbook from 2023 and some of those drawings are better than what I'm making now. That's a depressing thought.",
    duration_seconds: 27, energy_level: 0.62, speaking_rate: 142, pause_ratio: 0.14, pitch_variance: 0.48,
    sentiment_score: -0.3, sentiment_label: 'negative',
    entities: [], topics: ['avoidance', 'studio', 'procrastination', 'self-comparison'],
    unresolved_threads: ['the project'], summary: '2AM avoidance reorganization, comparing current work unfavorably to 2023.',
  },
  {
    day: 4, created_at: daysAgo(4, 16, 45),
    transcript: "Afternoon. Coffee shop. Watching people and sketching faces in my notebook. Not for any reason. Just to keep the hands moving. A woman at the next table asked what I was drawing and I showed her and she said it looked like her ex-husband and we both laughed. Human connection through accidental portraiture.",
    duration_seconds: 24, energy_level: 0.55, speaking_rate: 135, pause_ratio: 0.18, pitch_variance: 0.40,
    sentiment_score: 0.4, sentiment_label: 'positive',
    entities: [], topics: ['sketching', 'people watching', 'humor', 'connection'],
    unresolved_threads: [], summary: 'Sketching in coffee shop, random funny human moment.',
  },
  {
    day: 5, created_at: daysAgo(5, 22, 15),
    transcript: "Met a photographer named Luis at a gallery opening tonight. His work is all long exposure urban landscapes. Highways at night that look like circulatory systems. We talked for an hour about how constraints create better work. He shoots only on film. Only at night. The limitations are the art. I need constraints for the project.",
    duration_seconds: 30, energy_level: 0.72, speaking_rate: 148, pause_ratio: 0.10, pitch_variance: 0.50,
    sentiment_score: 0.6, sentiment_label: 'positive',
    entities: ['Luis'], topics: ['photography', 'constraints', 'gallery', 'artistic philosophy'],
    unresolved_threads: [], summary: 'Met Luis the photographer, conversation about constraints as creative fuel.',
  },
  {
    day: 6, created_at: daysAgo(6, 1, 30),
    transcript: "One thirty AM. I can't sleep because of what Luis said about constraints. What if the project's constraint is time. Thirty seconds of something. A painting that takes exactly thirty seconds to see. A video that's exactly thirty seconds. I don't know what this means yet but it's buzzing.",
    duration_seconds: 22, energy_level: 0.68, speaking_rate: 155, pause_ratio: 0.08, pitch_variance: 0.52,
    sentiment_score: 0.5, sentiment_label: 'positive',
    entities: ['Luis'], topics: ['insomnia', 'constraints', 'the project', 'time', 'ideas'],
    unresolved_threads: ['the project'], summary: 'Late night idea spark — what if the constraint is 30 seconds.',
  },
  {
    day: 7, created_at: daysAgo(7, 11, 0),
    transcript: "Lazy Sunday. Didn't create anything. Read a book. Cooked something elaborate for no reason. Roasted eggplant with tahini and pomegranate seeds. Sometimes the best creative act is not creating. Letting the soil rest. That's what I'm telling myself anyway.",
    duration_seconds: 20, energy_level: 0.45, speaking_rate: 118, pause_ratio: 0.25, pitch_variance: 0.35,
    sentiment_score: 0.2, sentiment_label: 'positive',
    entities: [], topics: ['rest', 'cooking', 'reading', 'creative philosophy'],
    unresolved_threads: [], summary: 'Rest day, elaborate cooking, philosophical about letting ideas settle.',
  },
  {
    day: 8, created_at: daysAgo(8, 20, 0),
    transcript: "Back in the studio. Started ten small canvases. Each one I'm giving myself exactly thirty seconds to make a mark. No planning, no sketching first. Just thirty seconds of instinct. Most of them are garbage but two of them have something. A gesture that feels alive. This might be the project.",
    duration_seconds: 27, energy_level: 0.75, speaking_rate: 150, pause_ratio: 0.10, pitch_variance: 0.48,
    sentiment_score: 0.7, sentiment_label: 'positive',
    entities: [], topics: ['painting', 'the project', 'constraint', 'instinct', 'breakthrough'],
    unresolved_threads: [], summary: 'Breakthrough — 30-second constraint canvases, two have real energy.',
  },
  {
    day: 9, created_at: daysAgo(9, 2, 30),
    transcript: "Two thirty AM and I just finished another twenty canvases. I'm covered in paint. My back hurts. I'm grinning. The thirty second rule is everything. Some of these are the best things I've made in years. The constraint removed the overthinking. Luis was right. Limitations are the art.",
    duration_seconds: 25, energy_level: 0.88, speaking_rate: 158, pause_ratio: 0.06, pitch_variance: 0.55,
    sentiment_score: 0.9, sentiment_label: 'positive',
    entities: ['Luis'], topics: ['painting', 'breakthrough', 'creative flow', 'late night', 'constraints'],
    unresolved_threads: [], summary: '2:30AM creative explosion, 20 canvases, best work in years, covered in paint.',
  },
  {
    day: 10, created_at: daysAgo(10, 14, 0),
    transcript: "Crashed hard today. Woke up at noon with paint on my pillowcase. The canvases from last night are drying on every surface. In the daylight some of them are less exciting than they felt at two AM. But three or four are genuinely good. I need to curate ruthlessly.",
    duration_seconds: 22, energy_level: 0.40, speaking_rate: 125, pause_ratio: 0.22, pitch_variance: 0.32,
    sentiment_score: 0.2, sentiment_label: 'positive',
    entities: [], topics: ['morning after', 'curation', 'editing', 'self-critique'],
    unresolved_threads: [], summary: 'Post-flow crash, editing with fresh eyes, 3-4 pieces are keepers.',
  },
  {
    day: 11, created_at: daysAgo(11, 19, 30),
    transcript: "Texted Luis photos of the canvases. He responded with a voice note that was basically just him yelling 'YES' for ten seconds. Then he asked if I'd be interested in a joint show. His long exposure photos next to my thirty second paintings. Time as a theme. I said yes before I even thought about it.",
    duration_seconds: 26, energy_level: 0.78, speaking_rate: 152, pause_ratio: 0.08, pitch_variance: 0.50,
    sentiment_score: 0.8, sentiment_label: 'positive',
    entities: ['Luis'], topics: ['collaboration', 'exhibition', 'time theme', 'photography'],
    unresolved_threads: [], summary: 'Luis proposed joint show — his long exposures + 30-second paintings.',
  },
  {
    day: 12, created_at: daysAgo(12, 23, 0),
    transcript: "Started writing an artist statement for the show. Hate writing artist statements. Every word feels pretentious. How do you explain something that only makes sense as a feeling. The paintings are about urgency and instinct and the terror of uncommitted marks. See. Pretentious.",
    duration_seconds: 22, energy_level: 0.52, speaking_rate: 138, pause_ratio: 0.18, pitch_variance: 0.42,
    sentiment_score: 0.0, sentiment_label: 'neutral',
    entities: [], topics: ['artist statement', 'writing', 'self-awareness', 'humor'],
    unresolved_threads: [], summary: 'Struggling with artist statement, self-deprecating about art language.',
  },
  {
    day: 13, created_at: daysAgo(13, 10, 0),
    transcript: "Morning studio session. Made five more canvases. The constraint is becoming second nature. I'm starting to know what the brush will do in thirty seconds. Which means I need to change something. Add a new rule maybe. Or a different tool. Comfort is the enemy of good constraint art.",
    duration_seconds: 23, energy_level: 0.65, speaking_rate: 140, pause_ratio: 0.14, pitch_variance: 0.40,
    sentiment_score: 0.4, sentiment_label: 'positive',
    entities: [], topics: ['painting', 'constraints', 'evolution', 'process'],
    unresolved_threads: [], summary: 'Constraint becoming too easy, needs to evolve the rules.',
  },
  {
    day: 14, created_at: daysAgo(14, 2, 15),
    transcript: "New rule. Left hand only. I'm right handed. The thirty second canvases with my left hand are chaotic and unpredictable and some of them are incredible. One looks like a city on fire seen from above. My left hand has opinions my right hand doesn't know about.",
    duration_seconds: 24, energy_level: 0.82, speaking_rate: 155, pause_ratio: 0.08, pitch_variance: 0.52,
    sentiment_score: 0.7, sentiment_label: 'positive',
    entities: [], topics: ['left hand', 'new constraint', 'chaos', 'discovery'],
    unresolved_threads: [], summary: '2AM experiment — left hand only canvases producing unexpected results.',
  },
  {
    day: 15, created_at: daysAgo(15, 17, 0),
    transcript: "Met Mira today. She runs a small gallery in the arts district. Luis introduced us. She wants to see the work when it's ready. She said the thirty second concept reminds her of Gutai group performance art. I pretended I knew what that was and then spent an hour reading about it after. It's actually relevant.",
    duration_seconds: 27, energy_level: 0.62, speaking_rate: 142, pause_ratio: 0.14, pitch_variance: 0.42,
    sentiment_score: 0.5, sentiment_label: 'positive',
    entities: ['Mira', 'Luis'], topics: ['gallery', 'Gutai', 'art history', 'networking'],
    unresolved_threads: [], summary: 'Met gallery owner Mira through Luis, discovered Gutai connection.',
  },
  {
    day: 16, created_at: daysAgo(16, 22, 45),
    transcript: "Hit a wall today. Made eight canvases and threw away six. The left hand trick is becoming a crutch. I'm manufacturing chaos instead of finding it. Need to sit with the discomfort of not having a trick. Just be in the thirty seconds with nothing but attention.",
    duration_seconds: 22, energy_level: 0.38, speaking_rate: 128, pause_ratio: 0.24, pitch_variance: 0.35,
    sentiment_score: -0.2, sentiment_label: 'negative',
    entities: [], topics: ['creative block', 'self-critique', 'authenticity', 'crutches'],
    unresolved_threads: [], summary: 'Mini-block, recognizing the left hand gimmick became a crutch.',
  },
  {
    day: 17, created_at: daysAgo(17, 3, 0),
    transcript: "Three AM. Just made the best piece in the series. No trick. No left hand. No rule except thirty seconds. I closed my eyes for the first fifteen seconds and opened them for the last fifteen. The result is half dream half intention. This is what the show should be about. The line between control and surrender.",
    duration_seconds: 28, energy_level: 0.90, speaking_rate: 148, pause_ratio: 0.08, pitch_variance: 0.55,
    sentiment_score: 0.9, sentiment_label: 'positive',
    entities: [], topics: ['breakthrough', 'eyes closed', 'control vs surrender', 'best piece'],
    unresolved_threads: [], summary: '3AM — best piece yet, eyes closed then open, found the show\'s thesis.',
  },
  {
    day: 18, created_at: daysAgo(18, 12, 0),
    transcript: "Noon. Texted Mira the photos. She called within ten minutes. She wants to do the show in six weeks. Luis is in. I'm in. She said she'll handle promotion if we handle installation. This is really happening. I feel like I'm standing at the edge of something.",
    duration_seconds: 22, energy_level: 0.75, speaking_rate: 150, pause_ratio: 0.10, pitch_variance: 0.48,
    sentiment_score: 0.8, sentiment_label: 'positive',
    entities: ['Mira', 'Luis'], topics: ['gallery show', 'planning', 'momentum', 'future'],
    unresolved_threads: [], summary: 'Gallery show confirmed in 6 weeks, everything falling into place.',
  },
  {
    day: 19, created_at: daysAgo(19, 21, 0),
    transcript: "Spent the day selecting which pieces make the cut. Forty seven canvases total. Need to get it down to twenty. Each one I remove hurts a little. But the show needs a clear arc. Beginning constraint. Middle chaos. End surrender. That's the narrative.",
    duration_seconds: 23, energy_level: 0.60, speaking_rate: 132, pause_ratio: 0.18, pitch_variance: 0.38,
    sentiment_score: 0.4, sentiment_label: 'positive',
    entities: [], topics: ['curation', 'show narrative', 'editing', 'constraint-chaos-surrender'],
    unresolved_threads: [], summary: 'Curating 47 → 20 pieces, found narrative arc for the show.',
  },
  {
    day: 20, created_at: daysAgo(20, 1, 0),
    transcript: "Luis came over to look at the selections. He's printing his photos at four by six feet. Next to my twelve by twelve inch canvases the scale contrast is going to be dramatic. We talked about how his work captures hours of accumulated light and mine captures thirty seconds of accumulated instinct. Time as the medium not the subject.",
    duration_seconds: 29, energy_level: 0.72, speaking_rate: 140, pause_ratio: 0.14, pitch_variance: 0.45,
    sentiment_score: 0.7, sentiment_label: 'positive',
    entities: ['Luis'], topics: ['collaboration', 'scale', 'time', 'artistic dialogue'],
    unresolved_threads: [], summary: 'Planning session with Luis, scale contrast between works, time as medium.',
  },
  {
    day: 21, created_at: daysAgo(21, 23, 0),
    transcript: "Three weeks ago I couldn't start. Now I have a show in five weeks and forty seven canvases and a collaborator and a gallery. The block wasn't the absence of ideas. It was the presence of too many without a container. The thirty second constraint was the container. Everything I needed was already here. I just needed a frame to see it through.",
    duration_seconds: 30, energy_level: 0.70, speaking_rate: 128, pause_ratio: 0.18, pitch_variance: 0.42,
    sentiment_score: 0.7, sentiment_label: 'positive',
    entities: ['Luis', 'Mira'], topics: ['reflection', 'creative block resolved', 'constraints', 'gratitude'],
    unresolved_threads: [], summary: 'Three-week reflection — from block to gallery show, constraint was the key.',
  },
];

// ============================================
// INSIGHTS (pre-generated for demo)
// ============================================
function generateInsights(userId, persona) {
  if (persona === 'founder') {
    return [
      {
        user_id: userId, type: 'emotional_pattern',
        title: 'Your mood has been declining steadily',
        body: 'Over the past 3 weeks, your average sentiment dropped from +0.6 to -0.4. The shift accelerated around day 10 when investor pressure and co-founder tension overlapped.',
        confidence_score: 0.92, entry_count: 21, is_read: false, dismissed: false,
      },
      {
        user_id: userId, type: 'unresolved_thread',
        title: 'The board meeting — never revisited',
        body: 'You mentioned "the board meeting" on day 3 with significant stress. You pushed it back on day 10 but never discussed the outcome or how it went. This thread carries unresolved weight.',
        confidence_score: 0.85, entry_count: 2, is_read: false, dismissed: false,
      },
      {
        user_id: userId, type: 'relationship_map',
        title: 'Sarah appears in increasingly negative contexts',
        body: 'Early entries mention Sarah in collaborative, positive contexts. By week 2, mentions shift to conflict, guilt, and distance. In the last 10 entries, Sarah appears in a negative context 3x more than in the first 10.',
        confidence_score: 0.88, entry_count: 15, is_read: false, dismissed: false,
      },
      {
        user_id: userId, type: 'vocabulary_drift',
        title: 'Your language shifted from certainty to uncertainty',
        body: '"Excited" appeared 2x in week 1, then disappeared entirely. "Hoping" appeared 3x in week 2. By week 3, "trying" became your default verb. This hedging pattern often precedes burnout recognition.',
        confidence_score: 0.90, entry_count: 21, is_read: false, dismissed: false,
      },
      {
        user_id: userId, type: 'energy_correlation',
        title: 'Your weekends are lower energy than weekdays',
        body: 'Your Saturday and Sunday entries average 0.27 energy versus 0.42 on weekdays. You\'re working through weekends but your body is running on empty when it should be recovering.',
        confidence_score: 0.82, entry_count: 6, is_read: false, dismissed: false,
      },
    ];
  }

  if (persona === 'student') {
    return [
      {
        user_id: userId, type: 'emotional_pattern',
        title: 'Anxiety spike around exam week',
        body: 'Your sentiment dropped sharply from day 8-11, coinciding with midterm prep. Speaking rate increased from 148 to 165 wpm and pause ratio dropped to 0.08 — signs of rushed, anxious speech. Post-exams, mood recovered to pre-exam levels.',
        confidence_score: 0.94, entry_count: 8, is_read: false, dismissed: false,
      },
      {
        user_id: userId, type: 'unresolved_thread',
        title: 'You haven\'t mentioned Jake in 11 days',
        body: 'Jake appeared in 4 of your first 6 entries — positive at first, then a conflict on day 6 that was never addressed. He disappeared from your entries entirely after that. The last mention had emotional weight.',
        confidence_score: 0.87, entry_count: 6, is_read: false, dismissed: false,
      },
      {
        user_id: userId, type: 'vocabulary_drift',
        title: 'Your entries got shorter during exam week',
        body: 'Average entry duration dropped from 25 seconds (week 1) to 20 seconds (week 2) during peak exam stress. Week 3 partially recovered to 22 seconds. Entry length tracks closely with your energy levels.',
        confidence_score: 0.80, entry_count: 21, is_read: false, dismissed: false,
      },
      {
        user_id: userId, type: 'relationship_map',
        title: 'Anika replaced Jake as your primary social connection',
        body: 'Jake appears in entries 1-3 and 6-7, then only twice more. Anika appears in 12 of 21 entries and is mentioned in exclusively positive contexts. Your social world narrowed significantly this quarter.',
        confidence_score: 0.91, entry_count: 16, is_read: false, dismissed: false,
      },
      {
        user_id: userId, type: 'energy_correlation',
        title: 'Study sessions with Anika boost your mood',
        body: 'Entries that mention studying with Anika average +0.45 sentiment versus +0.05 for solo study entries. Collaborative learning consistently lifts your emotional state.',
        confidence_score: 0.78, entry_count: 8, is_read: false, dismissed: false,
      },
    ];
  }

  if (persona === 'creative') {
    return [
      {
        user_id: userId, type: 'energy_correlation',
        title: 'Your most energetic entries happen late at night',
        body: 'Entries recorded between midnight and 3AM average 0.78 energy and +0.62 sentiment. Your daytime entries average 0.52 energy. Your creative peak is nocturnal — your best breakthroughs (day 9, day 14, day 17) all happened after midnight.',
        confidence_score: 0.93, entry_count: 7, is_read: false, dismissed: false,
      },
      {
        user_id: userId, type: 'unresolved_thread',
        title: '"The project" was unnamed for 8 days',
        body: 'You mentioned "the project" in 5 entries over the first 8 days without ever specifying what it was. The vagueness resolved on day 8 when the 30-second constraint gave it shape. Naming things often follows finding constraints.',
        confidence_score: 0.85, entry_count: 8, is_read: false, dismissed: false,
      },
      {
        user_id: userId, type: 'emotional_pattern',
        title: 'Creative block followed by explosive output',
        body: 'Days 1-7 averaged +0.14 sentiment with frequent self-doubt. Days 8-11 averaged +0.67 as the constraint unlocked creative flow. The pattern: accumulation → constraint → release. Your block wasn\'t a problem, it was a loading phase.',
        confidence_score: 0.89, entry_count: 14, is_read: false, dismissed: false,
      },
      {
        user_id: userId, type: 'relationship_map',
        title: 'Luis was the catalyst',
        body: 'Luis appears in 6 entries. Every mention is in a positive context and directly precedes a creative breakthrough. The day 5 conversation about constraints directly led to the 30-second concept on day 6.',
        confidence_score: 0.91, entry_count: 6, is_read: false, dismissed: false,
      },
      {
        user_id: userId, type: 'vocabulary_drift',
        title: 'Your vocabulary is the richest of any persona',
        body: 'You use 40% more unique words per entry than average. Metaphors appear in 15 of 21 entries. Your language is most vivid after midnight and most restrained during daytime entries.',
        confidence_score: 0.76, entry_count: 21, is_read: false, dismissed: false,
      },
    ];
  }

  return [];
}

// ============================================
// WEEKLY SUMMARIES (pre-generated)
// ============================================
function generateWeeklySummaries(userId, persona) {
  const now = new Date();
  const weekStarts = [
    { start: new Date(now.getTime() - 21 * 86400000), end: new Date(now.getTime() - 15 * 86400000) },
    { start: new Date(now.getTime() - 14 * 86400000), end: new Date(now.getTime() - 8 * 86400000) },
    { start: new Date(now.getTime() - 7 * 86400000), end: now },
  ];

  if (persona === 'founder') {
    return [
      {
        user_id: userId,
        week_start: weekStarts[0].start.toISOString().split('T')[0],
        week_end: weekStarts[0].end.toISOString().split('T')[0],
        summary: 'Started the week with post-funding energy but quickly hit operational walls. A pricing disagreement with Sarah set a tense undertone. Board meeting prep consumed the weekend. Energy is high but fragile.',
        avg_sentiment: 0.2, entry_count: 7,
        top_topics: ['board meeting', 'hiring', 'Sarah', 'pricing'],
        emotional_arc: 'Optimistic start → tension building → weekend isolation',
      },
      {
        user_id: userId,
        week_start: weekStarts[1].start.toISOString().split('T')[0],
        week_end: weekStarts[1].end.toISOString().split('T')[0],
        summary: 'The burnout became visible this week. Team noticed low energy. Sarah confronted the growing distance. A mentor conversation planted an important seed about paying attention to warning signs. Lost a customer. Working through both weekend days.',
        avg_sentiment: -0.25, entry_count: 7,
        top_topics: ['burnout', 'Sarah conflict', 'customer churn', 'mentorship'],
        emotional_arc: 'Flat → confrontation → paralysis → first rest',
      },
      {
        user_id: userId,
        week_start: weekStarts[2].start.toISOString().split('T')[0],
        week_end: weekStarts[2].end.toISOString().split('T')[0],
        summary: 'Bottomed out mid-week then began climbing back. Sent an honest investor update. Sarah drafted a VP Ops JD unprompted. Vocabulary shifted from "excited" to "trying." Therapy appointment booked. The awareness is there even if the recovery isn\'t.',
        avg_sentiment: -0.1, entry_count: 7,
        top_topics: ['recovery', 'therapy', 'VP Ops', 'self-awareness'],
        emotional_arc: 'Low point → honesty → first steps toward help',
      },
    ];
  }

  if (persona === 'student') {
    return [
      {
        user_id: userId,
        week_start: weekStarts[0].start.toISOString().split('T')[0],
        week_end: weekStarts[0].end.toISOString().split('T')[0],
        summary: 'Strong start to the quarter. New apartment with Jake, exciting classes, and a promising study partnership with Anika. Social life is active. A small conflict with Jake on day 6 introduced a crack that would widen.',
        avg_sentiment: 0.35, entry_count: 7,
        top_topics: ['new quarter', 'Jake', 'Anika', 'NLP seminar'],
        emotional_arc: 'Excited → settled → first tension with Jake',
      },
      {
        user_id: userId,
        week_start: weekStarts[1].start.toISOString().split('T')[0],
        week_end: weekStarts[1].end.toISOString().split('T')[0],
        summary: 'Midterm week hit hard. Physical anxiety symptoms appeared — caffeine dependence, insomnia, hand tremors. Speaking rate spiked to 165 wpm. The relief after finishing was palpable. Anika was a lifeline throughout.',
        avg_sentiment: -0.05, entry_count: 7,
        top_topics: ['midterms', 'anxiety', 'statistics', 'algorithms'],
        emotional_arc: 'Dread → crisis → grind → massive relief',
      },
      {
        user_id: userId,
        week_start: weekStarts[2].start.toISOString().split('T')[0],
        week_end: weekStarts[2].end.toISOString().split('T')[0],
        summary: 'Post-exam recovery and future planning. Good grades came in. RA application submitted. But Jake remains unaddressed — acknowledged as an unresolved relationship but deferred to "next quarter." Social world has narrowed to primarily Anika.',
        avg_sentiment: 0.35, entry_count: 7,
        top_topics: ['grades', 'RA application', 'Jake unresolved', 'career'],
        emotional_arc: 'Recovery → momentum → lingering guilt about Jake',
      },
    ];
  }

  if (persona === 'creative') {
    return [
      {
        user_id: userId,
        week_start: weekStarts[0].start.toISOString().split('T')[0],
        week_end: weekStarts[0].end.toISOString().split('T')[0],
        summary: 'A week of circling. "The project" remained unnamed and unstarted. Avoidance behaviors — studio reorganization, coffee shop sketching — masked as productivity. The Luis conversation on day 5 planted the constraint seed that would bloom next week.',
        avg_sentiment: 0.15, entry_count: 7,
        top_topics: ['creative block', 'avoidance', 'Luis', 'constraints'],
        emotional_arc: 'Frustration → small joys → catalytic conversation',
      },
      {
        user_id: userId,
        week_start: weekStarts[1].start.toISOString().split('T')[0],
        week_end: weekStarts[1].end.toISOString().split('T')[0],
        summary: 'The 30-second constraint unlocked everything. Output exploded — 30+ canvases in a week. The best work happened after midnight. A joint show with Luis materialized from a text exchange. Energy levels highest of all three weeks.',
        avg_sentiment: 0.55, entry_count: 7,
        top_topics: ['30-second constraint', 'breakthrough', 'Luis collaboration', 'gallery'],
        emotional_arc: 'Spark → explosion → creative high → productive crash',
      },
      {
        user_id: userId,
        week_start: weekStarts[2].start.toISOString().split('T')[0],
        week_end: weekStarts[2].end.toISOString().split('T')[0],
        summary: 'From making to curating. Met gallery owner Mira. Hit a mini-block when the left hand gimmick became a crutch, then broke through again with the eyes-closed technique. Show confirmed in 6 weeks. The constraint that started as limitation became liberation.',
        avg_sentiment: 0.5, entry_count: 7,
        top_topics: ['curation', 'Mira gallery', 'show planning', 'constraint evolution'],
        emotional_arc: 'Refinement → mini-block → breakthrough → momentum',
      },
    ];
  }

  return [];
}

// ============================================
// SEED RUNNER
// ============================================
async function getOrCreateUser({ email, password, displayName }) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (found) {
      await supabase.auth.admin.updateUserById(found.id, {
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      });
      return { id: found.id, existed: true };
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
  return { id: created.user.id, existed: false };
}

const PERSONAS = [
  {
    email: 'alex@echojournal.demo',
    password: 'echo-demo-2026',
    displayName: 'Alex',
    persona: 'founder',
    entries: alexEntries,
  },
  {
    email: 'maya@echojournal.demo',
    password: 'echo-demo-2026',
    displayName: 'Maya',
    persona: 'student',
    entries: mayaEntries,
  },
  {
    email: 'jordan@echojournal.demo',
    password: 'echo-demo-2026',
    displayName: 'Jordan',
    persona: 'creative',
    entries: jordanEntries,
  },
];

async function seed() {
  console.log('🌱 Seeding Echo Journal demo data...\n');

  for (const persona of PERSONAS) {
    console.log(`━━━ Creating: ${persona.displayName} (${persona.persona}) ━━━`);

    let userId;
    try {
      const { id, existed } = await getOrCreateUser({
        email: persona.email,
        password: persona.password,
        displayName: persona.displayName,
      });
      userId = id;
      await supabase
        .from('profiles')
        .update({ display_name: persona.displayName })
        .eq('id', userId);

      if (existed) {
        console.log(`  ⚠️  User already exists — refreshing demo data…`);
        await supabase.from('weekly_summaries').delete().eq('user_id', userId);
        await supabase.from('insights').delete().eq('user_id', userId);
        await supabase.from('entries').delete().eq('user_id', userId).eq('is_demo', true);
        console.log(`  🧹 Cleaned existing demo rows`);
      } else {
        console.log(`  ✅ User created: ${userId}`);
      }
    } catch (e) {
      console.error(`  ❌ Auth error: ${e.message || e}`);
      continue;
    }

    // 2. Insert entries
    const entries = persona.entries.map((e) => ({
      user_id: userId,
      created_at: e.created_at,
      transcript: e.transcript,
      duration_seconds: e.duration_seconds,
      energy_level: e.energy_level,
      speaking_rate: e.speaking_rate,
      pause_ratio: e.pause_ratio,
      pitch_variance: e.pitch_variance,
      sentiment_score: e.sentiment_score,
      sentiment_label: e.sentiment_label,
      entities: e.entities,
      topics: e.topics,
      unresolved_threads: e.unresolved_threads,
      summary: e.summary,
      is_demo: true,
      demo_persona: persona.persona,
    }));

    const { error: entryError } = await supabase.from('entries').insert(entries);
    if (entryError) {
      console.error(`  ❌ Entry error: ${entryError.message}`);
    } else {
      console.log(`  ✅ ${entries.length} entries inserted`);
    }

    // 3. Insert insights
    const insights = generateInsights(userId, persona.persona);
    if (insights.length > 0) {
      const { error: insightError } = await supabase.from('insights').insert(insights);
      if (insightError) {
        console.error(`  ❌ Insight error: ${insightError.message}`);
      } else {
        console.log(`  ✅ ${insights.length} insights inserted`);
      }
    }

    // 4. Insert weekly summaries
    const summaries = generateWeeklySummaries(userId, persona.persona);
    if (summaries.length > 0) {
      const { error: summaryError } = await supabase.from('weekly_summaries').insert(summaries);
      if (summaryError) {
        console.error(`  ❌ Summary error: ${summaryError.message}`);
      } else {
        console.log(`  ✅ ${summaries.length} weekly summaries inserted`);
      }
    }

    console.log('');
  }

  console.log('🎉 Seeding complete!\n');
  console.log('Demo logins:');
  console.log('┌────────────┬──────────────────────────┬──────────────────┐');
  console.log('│ Persona    │ Email                    │ Password         │');
  console.log('├────────────┼──────────────────────────┼──────────────────┤');
  console.log('│ Founder    │ alex@echojournal.demo    │ echo-demo-2026   │');
  console.log('│ Student    │ maya@echojournal.demo    │ echo-demo-2026   │');
  console.log('│ Creative   │ jordan@echojournal.demo  │ echo-demo-2026   │');
  console.log('└────────────┴──────────────────────────┴──────────────────┘');
}

seed().catch(console.error);
