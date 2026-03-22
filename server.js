import express from 'express';
import cors from 'cors';
import { YoutubeTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js';

const app = express();

app.use(cors());
app.use(express.json());

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
      // Use the full transcript instead of downsampling, as Gemini 1.5 Flash has a 1M token context limit 
      // and downsampling by skipping entries destroys context completely.
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

  // ── ALL ATTEMPTS FAILED ───────────────────────────────────────
  console.warn(`[Proxy] ❌ All attempts failed for videoId: ${id}`);
  return res.status(404).json({
    error: 'Could not fetch transcript',
    reason: 'Video may not have captions, or is age-restricted/private',
    videoId: id,
    suggestion: 'Paste the transcript manually using the manual input option'
  });
});

app.listen(3001, () => {
  console.log('📡 Transcript proxy running on http://localhost:3001');
});
