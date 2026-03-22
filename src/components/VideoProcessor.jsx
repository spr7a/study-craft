import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { summarizeTranscriptGemini } from '../lib/gemini';
import { useStore } from '../lib/store';
import { Youtube, FileText, CheckCircle2, Link as LinkIcon, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export default function VideoProcessor() {
  const [url, setUrl] = useState('');
  const [transcriptState, setTranscriptState] = useState('idle');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [embedId, setEmbedId] = useState('');
  const [transcriptWordCount, setTranscriptWordCount] = useState(0);
  
  const addVideoProcessed = useStore(state => state.addVideoProcessed);

  const dummyVideos = [
    { title: "Newton's 3 Laws of Motion", url: "https://www.youtube.com/watch?v=kKKM8Y-u7ds" },
    { title: "Introduction to React Hooks", url: "https://www.youtube.com/watch?v=dpw9EHDh2bM" }
  ];

  const extractVideoId = (fullUrl) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = fullUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  async function fetchTranscript(youtubeUrl) {
    const encodedUrl = encodeURIComponent(youtubeUrl);
    
    const response = await fetch(
      `http://localhost:3001/transcript?url=${encodedUrl}`,
      { signal: AbortSignal.timeout(20000) } // 20s — give all attempts time
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.reason || err.error || `Server error ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.transcript || data.transcript.trim().length < 20) {
      throw new Error('Transcript is empty or too short');
    }

    console.log(`[Frontend] Got transcript via: ${data.source}, length: ${data.transcript.length}`);
    return data.transcript;
  }

  const handleProcess = async (targetUrl = url) => {
    if (!targetUrl) return;
    setUrl(targetUrl);
    setErrorMessage('');
    setTranscriptState('fetching-transcript');
    setNotes('');

    const vidId = extractVideoId(targetUrl);
    if (!vidId) {
        setErrorMessage("Invalid YouTube URL");
        setTranscriptState('error');
        return;
    }
    setEmbedId(vidId);
    
    try {
        const transcriptText = await fetchTranscript(targetUrl);
        await generateNotes(transcriptText, vidId);
    } catch (err) {
        console.error(err);
        setTranscriptState('no-transcript');
    }
  };

  const handleManualTranscript = async (text) => {
      await generateNotes(text, embedId);
  };

  const generateNotes = async (transcriptText, vidId) => {
      try {
          setTranscriptWordCount(transcriptText.split(/\s+/).length);
          setTranscriptState('generating-notes');
          
          const prompt = `Analyze this video transcript and create organized study materials. 
  The transcript might have timestamps like [120s] before text, or just be plain text.
  If there are timestamps, you MUST format them as clickable markdown links like this: [02:00](https://www.youtube.com/watch?v=${vidId}&t=120s)
  
  You MUST include the following sections exactly, formatted with Markdown headers (##):
  ## 1. Executive Summary
  ## 2. Key Concepts & Definitions
  ## 3. Visual/Diagram Descriptions (if relevant)
  ## 4. Key Takeaways
  
   Transcript:
  ${transcriptText}`;
          
          const result = await summarizeTranscriptGemini(prompt);
          setNotes(result);
          addVideoProcessed(`Video Summarized (${vidId})`);
          setTranscriptState('done');
      } catch (err) {
          console.error(err);
          setErrorMessage(err.message || 'Failed to process transcript with Gemini.');
          setTranscriptState('error');
      }
  };

  const handleRetry = () => {
      setTranscriptState('idle');
      setErrorMessage('');
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 pb-12">
      <Card className="border-bg-tertiary bg-bg-secondary shadow-sm overflow-hidden relative">
        <CardHeader className="border-b border-bg-tertiary pb-8 pt-10 px-10">
          <div className="flex items-center gap-5 mb-2">
            <div className="p-3 bg-accent-warm/10 rounded-[4px] border border-accent-warm/20 text-accent-warm">
              <Youtube size={26} strokeWidth={1.5} />
            </div>
            <div>
              <CardTitle className="text-3xl font-serif text-text-primary">Multimodal Processor</CardTitle>
              <CardDescription className="text-base mt-2 text-text-secondary">Transform any YouTube educational video into structured notes with timestamps.</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-10 px-10 pb-12">
          <div className="flex gap-4 mb-10 max-w-3xl">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
              <Input 
                className="w-full h-14 pl-12 text-base shadow-sm focus-visible:ring-text-primary" 
                placeholder="Paste YouTube URL here..." 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
                disabled={transcriptState !== 'idle' && transcriptState !== 'error' && transcriptState !== 'done'}
              />
            </div>
            <Button 
              className="h-14 px-8 text-base shadow-sm" 
              onClick={() => handleProcess()} 
              disabled={(transcriptState !== 'idle' && transcriptState !== 'error' && transcriptState !== 'done') || !url}
            >
              {transcriptState === 'fetching-transcript' || transcriptState === 'generating-notes' ? (
                <span className="flex items-center gap-2 animate-pulse"><Sparkles size={18} /> Processing...</span>
              ) : (
                <span className="flex items-center gap-2"><FileText size={18} /> Summarize</span>
              )}
            </Button>
          </div>

          {transcriptState === 'idle' && !notes && (
            <div className="mt-8 border-t border-bg-tertiary pt-8 max-w-3xl flex flex-col items-start gap-4">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.08em]">Try with an example video</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {dummyVideos.map((vid, idx) => (
                  <button 
                    key={idx}
                    className="flex items-start gap-3 p-5 bg-bg border border-bg-tertiary rounded-md hover:border-text-tertiary hover:bg-bg-secondary transition-all text-left group"
                    onClick={() => handleProcess(vid.url)}
                  >
                    <Youtube className="text-text-tertiary group-hover:text-accent-warm transition-colors mt-0.5" size={20} strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                       <h4 className="font-medium text-text-primary text-sm line-clamp-1">{vid.title}</h4>
                       <p className="text-[11px] text-text-tertiary truncate w-full mt-1.5 font-mono">{vid.url}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {transcriptState === 'fetching-transcript' && (
            <LoadingCard 
              icon="⟳"
              title="Fetching transcript..."
              subtitle="Connecting to YouTube caption service"
              animated
            />
          )}

          {transcriptState === 'generating-notes' && (
            <LoadingCard
              icon="✦"  
              title="Generating study notes"
              subtitle={`Analyzing ${transcriptWordCount} words with Gemini...`}
              showProgressBar
              animated
            />
          )}

          {transcriptState === 'no-transcript' && (
            <ManualTranscriptInput onSubmit={handleManualTranscript} />
          )}

          {transcriptState === 'error' && (
            <ErrorCard message={errorMessage} onRetry={handleRetry} />
          )}

          {notes && transcriptState === 'done' && embedId && (
            <div className="mt-10 animate-fade-up grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <div className="space-y-6 lg:col-span-5">
                  <div className="flex items-center gap-2 text-text-primary font-bold text-sm uppercase tracking-[0.06em] border-b border-bg-tertiary pb-3">
                    <Youtube size={16} className="text-accent-warm" /> Source Media
                  </div>
                  <div className="aspect-video w-full rounded-md overflow-hidden border border-bg-tertiary shadow-sm relative bg-black">
                      <iframe 
                          src={`https://www.youtube.com/embed/${embedId}`}
                          title="YouTube video player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                      ></iframe>
                  </div>
              </div>

              <div className="space-y-6 lg:col-span-7">
                  <div className="flex items-center gap-2 text-text-primary font-bold text-sm uppercase tracking-[0.06em] border-b border-bg-tertiary pb-3">
                     <CheckCircle2 size={16} className="text-success" /> Structured Notes
                  </div>
                  <div className="bg-bg p-8 rounded-md border border-bg-tertiary shadow-sm max-h-[600px] overflow-y-auto custom-scrollbar">
                    <ReactMarkdown 
                        className="prose max-w-none text-text-secondary text-sm prose-headings:font-serif prose-headings:text-text-primary prose-headings:font-medium prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-[1.7] prose-strong:text-text-primary prose-a:text-accent-warm hover:prose-a:text-accent-warm/80 prose-a:no-underline prose-a:bg-accent-warm/10 prose-a:px-1.5 prose-a:py-0.5 prose-a:rounded-[3px] prose-a:font-medium prose-a:transition-colors prose-ul:my-4 prose-li:my-1"
                        components={{
                            a: ({node, ...props}) => <a target="_blank" rel="noopener noreferrer" {...props} />
                        }}
                    >
                      {notes}
                    </ReactMarkdown>
                  </div>
              </div>
              
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingCard({ icon, title, subtitle, showProgressBar, animated }) {
  return (
    <div className={`py-24 text-center ${animated ? 'animate-fade-up' : ''}`}>
      <div className="relative inline-block mb-8 w-14 h-14 flex items-center justify-center text-4xl text-accent-warm font-serif">
        <div className="absolute inset-0 opacity-30 animate-pulse flex items-center justify-center">{icon}</div>
        <div className="relative z-10">{icon}</div>
      </div>
      <h3 className="text-2xl font-serif text-text-primary">{title}</h3>
      <p className="text-text-secondary mt-3 max-w-sm mx-auto text-sm leading-relaxed">{subtitle}</p>
      {showProgressBar && (
        <div className="w-64 h-1.5 bg-bg-tertiary rounded-full mx-auto mt-6 overflow-hidden">
             <div className="h-full bg-accent-warm rounded-full w-2/3 animate-[pulse_2s_ease-in-out_infinite]"></div>
        </div>
      )}
    </div>
  );
}

function ErrorCard({ message, onRetry }) {
  return (
    <div className="py-16 text-center animate-fade-up">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 mb-6">
        <span className="text-error text-2xl">⚠️</span>
      </div>
      <h3 className="text-xl font-serif text-text-primary mb-2">Something went wrong</h3>
      <p className="text-text-secondary mb-6">{message}</p>
      <Button onClick={onRetry} variant="outline">Try Again</Button>
    </div>
  );
}

function ManualTranscriptInput({ onSubmit }) {
  const [text, setText] = useState('');
  
  return (
    <div style={{
      background: '#FAFAF8',
      border: '1px solid #E8E6E1', 
      borderRadius: 12,
      padding: 24,
      marginTop: 32
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#111110', marginBottom: 4 }}>
        Couldn't fetch transcript automatically
      </p>
      <p style={{ fontSize: 13, color: '#5C5B57', marginBottom: 16 }}>
        On YouTube: click <strong>···</strong> below the video 
        → <strong>Show transcript</strong> → Select All → Copy → Paste below.
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste transcript here..."
        style={{
          width: '100%',
          minHeight: 140,
          padding: '12px 14px',
          border: '1.5px solid #E8E6E1',
          borderRadius: 8,
          fontSize: 13,
          color: '#111110',
          background: '#FFFFFF',
          resize: 'vertical',
          fontFamily: 'inherit',
          lineHeight: 1.6
        }}
      />
      <button
        onClick={() => text.trim().length > 20 && onSubmit(text)}
        disabled={text.trim().length < 20}
        style={{
          marginTop: 12,
          background: '#111110',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: 13,
          fontWeight: 500,
          cursor: text.length > 20 ? 'pointer' : 'not-allowed',
          opacity: text.length > 20 ? 1 : 0.5,
          width: '100%'
        }}
      >
        Generate Study Notes →
      </button>
    </div>
  );
}
