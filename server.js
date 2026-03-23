import express from 'express';
import cors from 'cors';
import { YoutubeTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

import db from './db.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const DIFFICULTY_WINDOWS = { hard: 1, medium: 3, easy: 7 };
const PORT = process.env.PORT || 3001;
const DEFAULT_USER_ID = 'demo-user';
const NOTE_LIMITS = {
  summaryWords: 60,
  introWords: 60,
  keyPoints: { count: 5, words: 24 },
  examples: { count: 3, words: 24 },
  formulas: { count: 3, words: 18 },
  mistakes: { count: 3, words: 20 },
  concepts: { count: 5, words: 8 },
};

const selectConceptStmt = db.prepare('SELECT * FROM user_progress WHERE user_id = ? AND concept = ?');
const insertConceptStmt = db.prepare(`
  INSERT INTO user_progress (user_id, concept, difficulty, revision_date, times_studied, last_studied)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const updateConceptStmt = db.prepare(`
  UPDATE user_progress
  SET difficulty = ?, revision_date = ?, times_studied = ?, last_studied = ?
  WHERE id = ?
`);
const listConceptsStmt = db.prepare('SELECT * FROM user_progress WHERE user_id = ? ORDER BY revision_date ASC');

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
let geminiModel = null;
if (geminiApiKey && geminiApiKey !== 'dummy_key') {
  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('🤖 Gemini model ready for structured note generation');
  } catch (err) {
    console.warn('⚠️ Unable to start Gemini model:', err.message);
  }
} else {
  console.warn('⚠️ Gemini API key missing. Falling back to heuristic summaries.');
}

function cleanTranscript(text = '') {
  return text
    .replace(/\[\d+\s*s?\]/gi, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function truncateText(text = '', wordLimit = 50) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= wordLimit) return text.trim();
  return `${words.slice(0, wordLimit).join(' ')}...`;
}

function normalizeNotes(payload = {}, metadata = {}) {
  const ensureArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
  const normalizeList = (items, limit) => ensureArray(items)
    .slice(0, limit.count)
    .map((item) => truncateText(item, limit.words));

  const normalized = {
    title: payload.title || metadata.title || 'Video Study Notes',
    summary: truncateText(
      payload.summary || payload.notes?.introduction || 'Transcript processed successfully.',
      NOTE_LIMITS.summaryWords,
    ),
    notes: {
      introduction: truncateText(
        payload.notes?.introduction || payload.summary || 'Key takeaways from the lecture.',
        NOTE_LIMITS.introWords,
      ),
      key_points: normalizeList(payload.notes?.key_points, NOTE_LIMITS.keyPoints),
      examples: normalizeList(payload.notes?.examples, NOTE_LIMITS.examples),
      formulas: normalizeList(payload.notes?.formulas, NOTE_LIMITS.formulas),
      mistakes: normalizeList(payload.notes?.mistakes, NOTE_LIMITS.mistakes),
    },
    concepts: ensureArray(payload.concepts)
      .slice(0, NOTE_LIMITS.concepts.count)
      .map((concept) => ({
        name: truncateText(concept.name || 'Concept', NOTE_LIMITS.concepts.words),
        difficulty: ['easy', 'medium', 'hard'].includes((concept.difficulty || '').toLowerCase())
          ? concept.difficulty.toLowerCase()
          : 'medium',
      })),
  };

  if (!normalized.notes.key_points.length) {
    normalized.notes.key_points = ['Review the central definition or theorem.', 'Identify the main procedure or workflow.'];
  }
  if (!normalized.notes.examples.length) {
    normalized.notes.examples = ['Apply the core idea to a simple scenario.', 'Contrast with a common misconception.'];
  }
  if (!normalized.notes.formulas.length) {
    normalized.notes.formulas = ['No essential formula highlighted.'];
  }
  if (!normalized.notes.mistakes.length) {
    normalized.notes.mistakes = ['Watch for common slips or missing steps.'];
  }

  return normalized;
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function scheduleRevisionDate(difficulty = 'medium') {
  const windowDays = DIFFICULTY_WINDOWS[difficulty] || DIFFICULTY_WINDOWS.medium;
  return addDays(windowDays);
}

function adjustDifficulty(previous = 'medium', suggested = 'medium', timesStudied = 1) {
  if (timesStudied >= 5) return 'easy';
  if (timesStudied >= 3 && (previous === 'hard' || suggested === 'hard')) return 'medium';
  if (timesStudied >= 4 && (previous === 'medium' || suggested === 'medium')) return 'easy';
  return suggested || previous || 'medium';
}

function mapProgressRow(row) {
  return {
    id: row.id,
    name: row.concept,
    difficulty: row.difficulty,
    dueDate: row.revision_date,
    times_studied: row.times_studied,
    last_studied: row.last_studied,
    created_at: row.created_at,
  };
}

function splitPlanRows(rows) {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = [];
  const upcoming = [];

  rows.forEach((row) => {
    const rowDay = (row.revision_date || '').split('T')[0];
    if (rowDay <= today) {
      todayTasks.push(mapProgressRow(row));
    } else {
      upcoming.push(mapProgressRow(row));
    }
  });

  return { todayTasks, upcoming };
}

function getWeakConcepts(userId, limit = 3) {
  const rows = listConceptsStmt.all(userId);
  return rows
    .filter((row) => row.difficulty === 'hard' || row.times_studied <= 2)
    .sort((a, b) => (a.difficulty === b.difficulty ? a.times_studied - b.times_studied : a.difficulty === 'hard' ? -1 : 1))
    .slice(0, limit)
    .map(mapProgressRow);
}

function getRevisionPlan(userId) {
  const rows = listConceptsStmt.all(userId);
  const { todayTasks, upcoming } = splitPlanRows(rows);
  return {
    today_tasks: todayTasks,
    upcoming,
    weak_concepts: getWeakConcepts(userId, 5),
  };
}

function fallbackStructuredNotes(transcript, metadata = {}) {
  const sentences = transcript
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const introduction = truncateText(sentences.slice(0, 2).join(' '), NOTE_LIMITS.introWords);
  const keyPoints = sentences.slice(2, 7).map((s) => truncateText(s, NOTE_LIMITS.keyPoints.words));
  const examples = sentences.slice(7, 10).map((s) => truncateText(s, NOTE_LIMITS.examples.words));
  const formulas = sentences.slice(10, 13).map((s) => truncateText(s, NOTE_LIMITS.formulas.words));
  const mistakes = sentences.slice(13, 16).map((s) => truncateText(s, NOTE_LIMITS.mistakes.words));

  const words = transcript.split(/\s+/).filter(Boolean);
  const conceptCandidates = [...new Set(words)]
    .filter((word) => /^[A-Za-z][A-Za-z\-]{3,20}$/.test(word))
    .slice(0, NOTE_LIMITS.concepts.count)
    .map((name, idx) => ({
      name,
      difficulty: idx === 0 ? 'hard' : idx === 1 ? 'medium' : 'easy',
    }));

  return {
    title: metadata.title || 'Video Study Notes',
    summary: introduction,
    notes: {
      introduction,
      key_points: keyPoints,
      examples,
      formulas,
      mistakes,
    },
    concepts: conceptCandidates,
  };
}

async function generateStructuredNotes(transcript, metadata = {}) {
  if (!geminiModel) {
    return fallbackStructuredNotes(transcript, metadata);
  }

  const prompt = `You are an expert AI study coach. Analyze the transcript and respond with STRICT JSON.
Required JSON shape:
{
  "title": "string",
  "summary": "string",
  "notes": {
    "introduction": "string",
    "key_points": ["string"],
    "examples": ["string"],
    "formulas": ["string"],
    "mistakes": ["string"]
  },
  "concepts": [
    {
      "name": "string",
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}

Rules:
- Keep the entire response under 280 words.
- Do NOT repeat the transcript or include timestamps/speaker labels.
- Introduction must be 2-3 concise sentences focused on exam prep.
- Key points must contain at most 5 bullets, each a short actionable insight.
- Examples limited to 3 short lines demonstrating application.
- Formulas/terms limited to 3 concise items (omit if none).
- Highlight common mistakes only if they help last-minute revision.
- Use available video metadata when helpful: ${JSON.stringify(metadata)}.
- Response must stay clear, concise, and exam-focused.

Transcript:
${transcript.slice(0, 12000)}`;

  try {
    const response = await geminiModel.generateContent(prompt);
    const rawText = response.response.text().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(rawText);
    return parsed;
  } catch (err) {
    console.warn('Gemini structured notes failed, using fallback:', err.message);
    return fallbackStructuredNotes(transcript, metadata);
  }
}

// Helper: extract video ID from any YouTube URL format
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    /(?:youtube\.com\/v\/)([^&\n?#]+)/,
    /(?:youtube\.com\/shorts\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url?.match(pattern);
    if (match?.[1]) return match[1];
  }
  if (url && /^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

app.get('/transcript', async (req, res) => {
  try {
    const { videoId, url } = req.query;
    const id = videoId || extractVideoId(url);

    if (!id) {
      return res.status(400).json({ error: 'Provide a valid YouTube URL or videoId' });
    }

    console.log(`[Proxy] Fetching transcript for: ${id}`);

    // ── ATTEMPT 1: youtube-transcript package ────────────
    try {
      const transcriptArray = await YoutubeTranscript.fetchTranscript(id);
      if (transcriptArray && transcriptArray.length > 0) {
        const transcript = transcriptArray.map(t => {
            const sec = Math.floor(t.offset / 1000);
            return `[${sec}s] ${t.text}`;
        }).join('\n');
        console.log(`[Proxy] ✅ Attempt 1 success (youtube-transcript), chars: ${transcript.length}`);
        return res.json({ transcript, source: 'youtube-transcript', videoId: id });
      }
    } catch (err) {
      console.warn('[Proxy] Attempt 1 failed:', err.message);
    }

    // ── ATTEMPT 2: Free hosted youtube-transcript-api ────────────
    try {
      const response = await fetch(
        'https://youtube-transcript-api-tau-one.vercel.app/transcript',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_url: `https://www.youtube.com/watch?v=${id}` }),
          signal: AbortSignal.timeout(10000)
        }
      );

      if (response.ok) {
          const data = await response.json();
          const text = typeof data.transcript === 'string' 
            ? data.transcript 
            : Array.isArray(data) 
              ? data.map(s => s.text).join(' ') 
              : null;

          if (text && text.trim().length > 50) {
            console.log(`[Proxy] ✅ Attempt 2 success (vercel api), chars: ${text.length}`);
            return res.json({ transcript: text, source: 'yt-api-v1', videoId: id });
          }
      } else {
          console.warn(`[Proxy] Attempt 2 failed with status: ${response.status}`);
      }
    } catch (err) {
      console.warn('[Proxy] Attempt 2 failed:', err.message);
    }

    console.warn(`[Proxy] ❌ All attempts failed for videoId: ${id}`);
    return res.status(404).json({
      error: 'Could not fetch transcript',
      reason: 'Video may not have captions, or is age-restricted/private',
      videoId: id,
      suggestion: 'Paste the transcript manually using the manual input option'
    });
  } catch (error) {
    console.error('Transcript proxy error:', error);
    return res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

app.post('/api/content/process', async (req, res) => {
  try {
    const { transcript, videoId, videoUrl, title } = req.body || {};
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 50) {
      return res.status(400).json({ error: 'Transcript is required (min 50 characters)' });
    }

    const metadata = {
      title,
      videoId,
      videoUrl,
    };
    const cleanedTranscript = cleanTranscript(transcript);
    const payload = await generateStructuredNotes(cleanedTranscript, metadata);
    const normalized = normalizeNotes(payload, metadata);

    res.json(normalized);
  } catch (err) {
    console.error('Content processing failed:', err.message);
    res.status(500).json({ error: 'Failed to process content' });
  }
});

app.post('/api/content/complete', (req, res) => {
  try {
    const { concepts = [], user_id: userId = DEFAULT_USER_ID } = req.body || {};
    if (!Array.isArray(concepts) || concepts.length === 0) {
      return res.status(400).json({ error: 'concepts array required' });
    }

    const now = new Date().toISOString();

    concepts.forEach((concept) => {
      const name = concept.name || 'Concept';
      const incomingDifficulty = (concept.difficulty || 'medium').toLowerCase();
      const existing = selectConceptStmt.get(userId, name);

      if (existing) {
        const newTimes = existing.times_studied + 1;
        const difficulty = adjustDifficulty(existing.difficulty, incomingDifficulty, newTimes);
        const revisionDate = scheduleRevisionDate(difficulty).split('T')[0];
        updateConceptStmt.run(difficulty, revisionDate, newTimes, now, existing.id);
      } else {
        const revisionDate = scheduleRevisionDate(incomingDifficulty).split('T')[0];
        insertConceptStmt.run(userId, name, incomingDifficulty, revisionDate, 1, now);
      }
    });

    const plan = getRevisionPlan(userId);
    res.json({ status: 'saved', assigned: concepts.length, plan });
  } catch (error) {
    console.error('Saving study session failed:', error);
    res.status(500).json({ error: 'Failed to save study session' });
  }
});

app.get('/api/revision/plan', (req, res) => {
  try {
    const userId = req.query.user_id || DEFAULT_USER_ID;
    const plan = getRevisionPlan(userId);
    res.json(plan);
  } catch (error) {
    console.error('Fetching revision plan failed:', error);
    res.status(500).json({ error: 'Failed to fetch revision plan' });
  }
});

app.post('/api/tutor/chat', async (req, res) => {
  try {
    const { message, history = [], context = '', user_id: userId = DEFAULT_USER_ID } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const weakConcepts = getWeakConcepts(userId, 5);

    if (!geminiModel) {
      return res.json({
        reply: 'The tutor is offline. Please configure your GEMINI_API_KEY to enable personalized responses.',
        weak_concepts: weakConcepts,
      });
    }

    const formattedHistory = history
      .filter((msg) => msg?.role && msg?.content)
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const weakContext = weakConcepts.length
      ? `The student struggles with: ${weakConcepts.map((c) => c.name).join(', ')}.`
      : 'No specific weak concepts are recorded yet.';

    const referenceContext = context
      ? `Reference Material:\n${context.slice(0, 6000)}\nUse it to ground your answer when relevant.`
      : 'No custom reference was provided. Use your general knowledge.';

    const guidance = `You are a supportive AI tutor. ${weakContext} Tailor the response to improve those areas and provide actionable guidance.`;

    const chat = geminiModel.startChat({
      history: formattedHistory,
      generationConfig: { maxOutputTokens: 600 },
    });

    const response = await chat.sendMessage(`${guidance}\n${referenceContext}\nStudent: ${message}`);
    const reply = response.response.text();
    res.json({ reply, weak_concepts: weakConcepts });
  } catch (error) {
    console.error('Tutor chat failed:', error);
    res.status(500).json({ error: 'Tutor is unavailable right now' });
  }
});

app.listen(PORT, () => {
  console.log(`📡 StudyCraft API running on http://localhost:${PORT}`);
});
