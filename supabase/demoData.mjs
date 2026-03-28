/** Demo personas: 21 daily voice-journal style entries each (past 3 weeks). */

import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

export const DEMO_PASSWORD = 'demo123456';

export const PERSONAS = [
  {
    key: 'founder',
    email: 'demo-founder@echojournal.app',
    displayName: 'Alex Chen',
    demo_persona: 'founder',
    insights: [
      {
        type: 'emotional_pattern',
        title: 'Energy dipping on board nights',
        body: 'After mentions of Diana or board prep, your entries the next day skew more drained than your baseline.',
        confidence_score: 0.68,
        entry_count: 5,
      },
      {
        type: 'unresolved_thread',
        title: 'The Marcus conversation',
        body: 'You have not revisited the equity split with Marcus since the tense check-in—might be worth one clear conversation.',
        confidence_score: 0.61,
        entry_count: 4,
      },
    ],
    weekly: [
      {
        weeksAgo: 2,
        summary:
          'A heavy week centered on runway and cofounder tension. Small wins on hiring still felt overshadowed by board pressure.',
        emotional_arc: 'Opened cautiously, dipped mid-week after the Marcus call, slight rebound after talking to your therapist.',
        avg_sentiment: -0.12,
        entry_count: 7,
        top_topics: ['runway', 'Marcus', 'board', 'hiring'],
      },
      {
        weeksAgo: 1,
        summary:
          'You kept shipping while carrying a lot of maybe and I guess in how you talk about decisions—clarity might help.',
        emotional_arc: 'Sentiment trended downward; the product demo high did not last into the weekend.',
        avg_sentiment: -0.28,
        entry_count: 7,
        top_topics: ['board', 'COO search', 'therapist', 'demo day'],
      },
    ],
    transcripts: [
      `Okay, day one of actually using this. Pitch deck went fine but I keep replaying Marcus's face when I said we need to hire a COO. Board wants metrics we don't have yet.`,
      `Slept four hours. Diana emailed at 6am about runway. I think we're fine for nine months but the tone rattled me.`,
      `Shipped a small analytics fix. Felt good for twenty minutes then Slack piled up. Maybe I'm not delegating enough.`,
      `Therapist asked what I'd say to a friend in my position. I guess I'd tell them to breathe—but I don't know if I believe that for myself.`,
      `Marcus and I did a walking one-on-one. It was civil. We didn't touch equity. Probably need to soon.`,
      `Demo to a design partner. They liked the live flow. First positive signal in a week.`,
      `Board prep all day. I kind of want to disappear. Coffee and nerves.`,
      `Weekend. Tried not to open the laptop. Mostly failed. Megan from our angel list texted encouragement—that helped.`,
      `Standup was short. Engineering is green; I'm the bottleneck on GTM. That's probably accurate.`,
      `Maybe we should postpone the COO search until after Series A. I don't know. Marcus thinks we need someone now.`,
      `Night run. Cleared my head a bit. Still feel behind everyone on LinkedIn.`,
      `Customer called about a bug. We fixed it in an hour. That competence still matters.`,
      `Diana wants a revised forecast by Friday. I'll pull an all-nighter if I have to.`,
      `Pulled the all-nighter. Numbers are honest. Sending them felt like admitting weakness.`,
      `Marcus snapped in a meeting. I stayed calm outside but my hands shook after. This can't be the long-term normal.`,
      `I guess I'm scared the board sees me as naive. I'm probably overthinking.`,
      `Therapist session—talked about boundaries with Marcus. Homework: one direct sentence about equity timeline.`,
      `Drafted the sentence. Deleted it three times. Sent a softer version. No reply yet.`,
      `Soft reply from Marcus: "Let's talk Thursday." Okay. That's something.`,
      `Thursday talk got postponed to next week. Classic. I'm trying not to spiral.`,
      `Today's quieter. Shipped docs. Walked without Slack. Maybe I can hold both the fear and the work.`,
    ],
  },
  {
    key: 'student',
    email: 'demo-student@echojournal.app',
    displayName: 'Jordan Rivera',
    demo_persona: 'student',
    insights: [
      {
        type: 'vocabulary_drift',
        title: 'More hedging before exams',
        body: 'Phrases like "maybe" and "I guess" showed up more often in the five entries leading into midterms.',
        confidence_score: 0.64,
        entry_count: 5,
      },
      {
        type: 'relationship_map',
        title: 'Tyler vs Priya',
        body: 'Roommate stress shows up with negative tone; study sessions with Priya track closer to neutral or upbeat.',
        confidence_score: 0.7,
        entry_count: 6,
      },
    ],
    weekly: [
      {
        weeksAgo: 2,
        summary:
          'Roommate friction and a steady study rhythm with Priya. You were already bracing for midterms.',
        emotional_arc: 'Bumpy at home, steadier in the library.',
        avg_sentiment: 0.05,
        entry_count: 7,
        top_topics: ['Tyler', 'Priya', 'study', 'roommate'],
      },
      {
        weeksAgo: 1,
        summary:
          'Midterms peaked; Tyler situation cooled after you set a boundary. Internship apps still in the maybe pile.',
        emotional_arc: 'Stress spike then relief; grad-school vs industry still unresolved.',
        avg_sentiment: -0.08,
        entry_count: 7,
        top_topics: ['midterms', 'internships', 'Tyler', 'career'],
      },
    ],
    transcripts: [
      `First entry. Tyler left dishes again. I'm not trying to be petty but it's every day. Priya and I knocked out calc problem sets—she explains things clearly.`,
      `Maybe I should just talk to Tyler instead of simmering. I guess I'm avoiding conflict.`,
      `Talked to Tyler. He actually apologized and bought paper towels. Small win.`,
      `Library until midnight. Brain fried. Coffee tomorrow is non-negotiable.`,
      `Career fair flyer overload. Everyone says "network" like it's easy. I don't know where to start.`,
      `Priya thinks I should apply to three internships max and go deep. Probably smart.`,
      `Tyler had friends over loud until 2am. I had an 8am. Not great.`,
      `Emailed the RA maybe? Feels dramatic. I'll try earplugs first.`,
      `Midterm one down. Felt shaky on the proofs but I think I passed.`,
      `Celebrated with Priya—froyo and complaining. I needed that.`,
      `Tyler and I split a cleaning schedule on the fridge. So far he's sticking to it.`,
      `Professor mentioned grad school vs industry. I guess I've been assuming grad school without deciding.`,
      `Applied to two places. Essays are rough. Maybe they're fine.`,
      `Second midterm. Harder. I walked out thinking I could have studied more—classic.`,
      `Parents called. They mean well but the "what's your plan" loop stresses me out.`,
      `Priya sent internship links from her cousin's company. I'll apply this weekend.`,
      `Weekend applications. Typos found at 1am. Fixed and submitted.`,
      `Heard back for a phone screen. Nervous but excited.`,
      `Tyler offered quiet hours after 11 on weeknights. Surprised me—in a good way.`,
      `Phone screen went okay. I rambled a bit but the recruiter seemed engaged.`,
      `Today I just studied and ate ramen. Quiet. Maybe that's what I needed.`,
    ],
  },
  {
    key: 'parent',
    email: 'demo-parent@echojournal.app',
    displayName: 'Sam Taylor',
    demo_persona: 'parent',
    insights: [
      {
        type: 'memory_anchor',
        title: 'This time last month',
        body: 'You were running on two-hour stretches and doubting every decision. Today reads steadier—worth noticing.',
        confidence_score: 0.73,
        entry_count: 8,
      },
      {
        type: 'emotional_pattern',
        title: 'Slow upward trend',
        body: 'Across the last two weeks your tone around sleep and support has softened—more hope, less panic.',
        confidence_score: 0.66,
        entry_count: 7,
      },
    ],
    weekly: [
      {
        weeksAgo: 2,
        summary:
          "Sleep deprivation dominated; Megan and you tag-teamed nights. Your mom's visit was a lifeline.",
        emotional_arc: 'Raw and exhausted, with brief relief when help arrived.',
        avg_sentiment: -0.35,
        entry_count: 7,
        top_topics: ['sleep', 'Megan', 'mom', 'feeding'],
      },
      {
        weeksAgo: 1,
        summary:
          'Returning-to-work worries surfaced, but you also named small joys. The household rhythm improved bit by bit.',
        emotional_arc:
          'Still tired, but less catastrophizing; more "we can figure this out."',
        avg_sentiment: 0.02,
        entry_count: 7,
        top_topics: ['work', 'Megan', 'pediatrician', 'routine'],
      },
    ],
    transcripts: [
      `Day three home from the hospital. I love them so much it hurts. I haven't slept more than two hours straight.`,
      `Megan took the early shift so I could nap. I still woke up at every tiny noise.`,
      `Mom arrives tomorrow. I feel guilty needing help but I'm so glad she's coming.`,
      `Mom's here. She made soup and held the baby while I showered. I cried in the bathroom—relief, I think.`,
      `Pediatrician said weight gain looks good. First time I exhaled in a week.`,
      `Night was brutal again. Megan and I snapped over nothing. We apologized. We're running on fumes.`,
      `Took a twenty-minute walk with the stroller. Sun felt like medicine.`,
      `Thinking about work emails piling up. I'm probably not ready but I'm scared of falling behind.`,
      `HR emailed about return date. I don't know. Maybe I need another month.`,
      `Megan and I mapped nights on paper. Having a plan helped even if the baby ignores plans.`,
      `Mom left today. Hugged her too long at the airport. Grateful and scared.`,
      `Friend dropped off lasagna. Small kindness, huge impact.`,
      `Baby smiled—maybe gas—but I'll take it as a win.`,
      `Slept four hours in a row. Felt like a miracle.`,
      `Video call with my sister. She reminded me this phase is not forever.`,
      `Worried I'm not "bonding right." Megan says I'm doing fine. I guess I believe her sometimes.`,
      `First solo outing: grocery run. Anxiety and pride mixed.`,
      `Talked to my manager. They're flexible on return. That weight lifted a little.`,
      `Date night at home after baby slept—takeout and a show. Felt like us again for an hour.`,
      `Rough night but morning coffee on the porch with Megan felt gentle.`,
      `Today I'm tired but okay. We're learning. Maybe I'm learning to be kinder to myself too.`,
    ],
  },
];

function sentimentLabel(score) {
  if (score >= 0.25) return 'positive';
  if (score <= -0.25) return 'negative';
  return 'neutral';
}

/** Linear drift + small noise */
function scoresForPersona(key) {
  const n = 21;
  if (key === 'founder') {
    return Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1);
      return 0.42 - t * 0.95 + (Math.sin(i * 0.7) * 0.06);
    });
  }
  if (key === 'student') {
    return Array.from({ length: n }, (_, i) => {
      const mid = i >= 8 && i <= 14 ? -0.35 : 0.15;
      return mid + Math.sin(i * 0.5) * 0.25;
    });
  }
  // parent: improving
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return -0.45 + t * 0.78 + (Math.cos(i * 0.4) * 0.08);
  });
}

export function buildEntryRows(persona, userId) {
  const scores = scoresForPersona(persona.key);
  const now = new Date();

  return persona.transcripts.map((transcript, i) => {
    const daysAgo = 20 - i;
    const created = new Date(now);
    created.setDate(created.getDate() - daysAgo);
    created.setHours(8 + (i % 5), 10 + (i % 40), 0, 0);

    const sentiment_score = Math.max(-1, Math.min(1, scores[i]));
    const energy = Math.max(0, Math.min(1, 0.35 + sentiment_score * 0.35 + (i % 3) * 0.05));

    return {
      user_id: userId,
      created_at: created.toISOString(),
      transcript,
      duration_seconds: 22 + (i % 7),
      energy_level: Math.round(energy * 100) / 100,
      speaking_rate: 115 + (i % 5) * 8,
      pause_ratio: Math.round((0.22 + (1 - energy) * 0.2) * 100) / 100,
      pitch_variance: Math.round((0.25 + (i % 4) * 0.06) * 100) / 100,
      sentiment_score: Math.round(sentiment_score * 100) / 100,
      sentiment_label: sentimentLabel(sentiment_score),
      entities: inferEntities(persona.key, i),
      topics: inferTopics(persona.key, i),
      keywords: inferKeywords(persona.key, i),
      speaking_tone: inferSpeakingTone(persona.key, sentiment_score),
      facial_affect_summary: inferFacialAffect(persona.key, sentiment_score),
      emotion_context_notes: null,
      unresolved_threads: inferThreads(persona.key, i),
      summary: transcript.slice(0, Math.min(120, transcript.length)) + (transcript.length > 120 ? '…' : ''),
      is_demo: true,
      demo_persona: persona.demo_persona,
    };
  });
}

function inferEntities(key, i) {
  if (key === 'founder') {
    const pool = ['Marcus', 'Diana', 'Megan', 'therapist', 'board'];
    return [pool[i % pool.length], pool[(i + 2) % pool.length]];
  }
  if (key === 'student') {
    const pool = ['Tyler', 'Priya', 'parents', 'professor'];
    return [pool[i % pool.length]];
  }
  const pool = ['Megan', 'mom', 'baby', 'pediatrician', 'manager'];
  return [pool[i % pool.length]];
}

function inferTopics(key, i) {
  if (key === 'founder')
    return [['runway', 'hiring', 'board'][i % 3], ['Marcus', 'product', 'stress'][(i + 1) % 3]];
  if (key === 'student')
    return [['midterms', 'roommate', 'internships'][i % 3], ['study', 'career', 'sleep'][(i + 2) % 3]];
  return [['sleep', 'feeding', 'work return'][i % 3], ['Megan', 'family', 'routine'][(i + 1) % 3]];
}

function inferThreads(key, i) {
  if (key === 'founder' && i < 8) return ['Equity conversation with Marcus'];
  if (key === 'student' && i > 10 && i < 18) return ['Grad school vs industry'];
  if (key === 'parent' && i < 10) return ['Return-to-work timing'];
  return [];
}

function inferKeywords(key, i) {
  const t = inferTopics(key, i);
  const e = inferEntities(key, i);
  const extra =
    key === 'founder'
      ? ['runway', 'burn rate', 'deck', 'Slack']
      : key === 'student'
        ? ['GPA', 'library', 'deadline', 'roommate']
        : ['nap', 'bottle', 'pediatrician', 'leave'];
  return [...new Set([...t, ...e, extra[i % extra.length]])].slice(0, 6);
}

function inferFacialAffect(key, score) {
  if (key === 'founder') {
    if (score < -0.2) return 'Demo: drawn expression, less eye contact.';
    if (score > 0.25) return 'Demo: slightly more open, small smiles.';
    return 'Demo: focused, neutral face.';
  }
  if (key === 'student') {
    if (score < -0.15) return 'Demo: tense jaw, tired eyes.';
    return 'Demo: relaxed, casual expression.';
  }
  if (score < -0.2) return 'Demo: fatigued, softer gaze.';
  return 'Demo: calm, attentive.';
}

function inferSpeakingTone(key, score) {
  if (key === 'founder') {
    if (score < -0.2) return 'Tired, compressed sentences; worry under the surface.';
    if (score > 0.2) return 'Cautiously upbeat; relief when something lands.';
    return 'Matter-of-fact, scanning for problems.';
  }
  if (key === 'student') {
    if (score < -0.15) return 'Stressed pacing; shorter clauses before exams.';
    return 'Conversational, a little self-deprecating.';
  }
  if (score < -0.2) return 'Soft, fragmented; running on little sleep.';
  return 'Warmer and steadier as the week improves.';
}

export function buildWeeklyRows(persona, userId) {
  const weekStartsOn = 1;
  return persona.weekly.map((w) => {
    const ref = subWeeks(new Date(), w.weeksAgo);
    const ws = startOfWeek(ref, { weekStartsOn });
    const we = endOfWeek(ref, { weekStartsOn });
    return {
      user_id: userId,
      week_start: format(ws, 'yyyy-MM-dd'),
      week_end: format(we, 'yyyy-MM-dd'),
      summary: w.summary,
      avg_sentiment: w.avg_sentiment,
      entry_count: w.entry_count,
      top_topics: w.top_topics,
      emotional_arc: w.emotional_arc,
      notable_entries: [],
    };
  });
}
