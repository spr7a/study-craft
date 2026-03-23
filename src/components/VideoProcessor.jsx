import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { Youtube, FileText, CheckCircle2, Link as LinkIcon, Sparkles, ListChecks, FlaskConical, Sigma, CalendarDays, Download, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useContent } from '../hooks/useContent';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

export default function VideoProcessor() {
  const [url, setUrl] = useState('');
  const [transcriptState, setTranscriptState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [embedId, setEmbedId] = useState('');
  const [transcriptWordCount, setTranscriptWordCount] = useState(0);
  const {
    content,
    revisionPlan,
    isProcessing: isContentProcessing,
    isMarking,
    message: contentMessage,
    error: contentError,
    runProcess,
    markStudied,
    refreshRevisionPlan,
    downloadCurrentNotes,
  } = useContent();
  
  const addVideoProcessed = useStore(state => state.addVideoProcessed);

  const dummyVideos = [
    { title: "Newton's 3 Laws of Motion", url: "https://www.youtube.com/watch?v=kKKM8Y-u7ds" },
    { title: "Introduction to React Hooks", url: "https://www.youtube.com/watch?v=dpw9EHDh2bM" }
  ];

  useEffect(() => {
    refreshRevisionPlan();
  }, [refreshRevisionPlan]);

  const extractVideoId = (fullUrl) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = fullUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  async function fetchTranscript(youtubeUrl) {
    const encodedUrl = encodeURIComponent(youtubeUrl);
    
    const response = await fetch(
      `${API_BASE}/transcript?url=${encodedUrl}`,
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

    const vidId = extractVideoId(targetUrl);
    if (!vidId) {
        setErrorMessage("Invalid YouTube URL");
        setTranscriptState('error');
        return;
    }
    setEmbedId(vidId);
    
    try {
        const transcriptText = await fetchTranscript(targetUrl);
        await generateNotes(transcriptText, vidId, targetUrl);
    } catch (err) {
        console.error(err);
        setTranscriptState('no-transcript');
    }
  };

  const handleManualTranscript = async (text) => {
    await generateNotes(text, embedId, url);
  };

  const generateNotes = async (transcriptText, vidId, videoTitle = '') => {
    try {
        setTranscriptWordCount(transcriptText.split(/\s+/).length);
        setTranscriptState('generating-notes');
        await runProcess({
          transcript: transcriptText,
          videoId: vidId,
          videoUrl: videoTitle,
          title: videoTitle,
        });
        addVideoProcessed(`Video Summarized (${vidId})`);
        setTranscriptState('done');
    } catch (err) {
        console.error(err);
        setErrorMessage(err.message || 'Failed to process transcript with Gemini.');
        setTranscriptState('error');
    }
  };

  const handleMarkAsStudied = async () => {
    if (!content?.concepts?.length) return;
    try {
      await markStudied();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadNotes = () => {
    if (content) {
      downloadCurrentNotes();
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
              disabled={(transcriptState !== 'idle' && transcriptState !== 'error' && transcriptState !== 'done') || !url || isContentProcessing}
            >
              {transcriptState === 'fetching-transcript' || transcriptState === 'generating-notes' || isContentProcessing ? (
                <span className="flex items-center gap-2 animate-pulse"><Sparkles size={18} /> Processing...</span>
              ) : (
                <span className="flex items-center gap-2"><FileText size={18} /> Summarize</span>
              )}
            </Button>
          </div>

          {transcriptState === 'idle' && !content && (
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

          {content && transcriptState === 'done' && embedId && (
            <div className="mt-10 space-y-10">
              <div className="animate-fade-up grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                    <div className="bg-bg p-8 rounded-md border border-bg-tertiary shadow-sm space-y-6">
                      <div className="p-5 border border-bg-tertiary rounded-md bg-bg-secondary/40">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-text-tertiary mb-2">Summary</p>
                        <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap break-words max-h-40 overflow-y-auto pr-2 custom-scrollbar">{content.summary}</p>
                      </div>

                      <div className="flex gap-3 p-5 border border-bg-tertiary rounded-md bg-bg-secondary/40">
                        <div className="text-2xl">📘</div>
                        <div>
                          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-[0.08em]">Introduction</p>
                          <p className="text-sm text-text-secondary leading-relaxed mt-1 whitespace-pre-wrap break-words max-h-40 overflow-y-auto pr-2 custom-scrollbar">{content.notes.introduction}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StructuredList icon={<ListChecks size={18} className="text-text-primary" />} label="Key Points" items={content.notes.key_points} />
                        <StructuredList icon={<FlaskConical size={18} className="text-text-primary" />} label="Examples" items={content.notes.examples} />
                      </div>

                      <StructuredList icon={<Sigma size={18} className="text-text-primary" />} label="Formulas" items={content.notes.formulas} />
                      <StructuredList icon={<AlertTriangle size={18} className="text-error" />} label="Common Mistakes" items={content.notes.mistakes} emptyLabel="No common pitfalls detected." />
                    </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-bg p-8 border border-bg-tertiary rounded-md shadow-sm">
                    <div className="flex items-center gap-2 text-text-primary font-bold text-sm uppercase tracking-[0.06em] border-b border-bg-tertiary pb-3">
                      <ListChecks size={16} className="text-text-primary" /> Concepts
                    </div>
                    <div className="mt-6 space-y-4">
                      {content.concepts.length === 0 && (
                        <p className="text-sm text-text-tertiary">No concepts detected yet.</p>
                      )}
                      {content.concepts.map((concept, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 p-4 border border-bg-tertiary rounded-md bg-bg-secondary/40">
                          <div>
                            <p className="text-sm font-medium text-text-primary">{concept.name}</p>
                            <p className="text-xs text-text-tertiary">Concept #{idx + 1}</p>
                          </div>
                          <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${difficultyBadge(concept.difficulty)}`}>
                            {concept.difficulty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {revisionPlan && (
                    <div className="bg-bg p-8 border border-bg-tertiary rounded-md shadow-sm">
                      <div className="flex items-center gap-2 text-text-primary font-bold text-sm uppercase tracking-[0.06em] border-b border-bg-tertiary pb-3">
                        <CalendarDays size={16} className="text-text-primary" /> Revision Plan
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <RevisionColumn title="📅 Today" tasks={revisionPlan.today_tasks} emptyLabel="No study tasks today" />
                        <RevisionColumn title="📆 Upcoming" tasks={revisionPlan.upcoming} emptyLabel="Nothing scheduled" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    className="px-6"
                    onClick={handleMarkAsStudied}
                    disabled={isMarking || !content.concepts.length}
                  >
                    {isMarking ? 'Saving...' : 'Mark as Studied'}
                  </Button>
                  <Button
                    variant="outline"
                    className="px-6"
                    onClick={handleDownloadNotes}
                    disabled={!content}
                  >
                    <span className="flex items-center gap-2 text-sm"><Download size={16} /> Download Notes</span>
                  </Button>
                  {contentMessage && (
                    <p className="text-xs text-success font-medium">{contentMessage}</p>
                  )}
                  {contentError && (
                    <p className="text-xs text-error font-medium">{contentError}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const difficultyStyles = {
  easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  hard: 'bg-rose-50 text-rose-700 border-rose-200',
};

function difficultyBadge(level = 'medium') {
  return difficultyStyles[level] || difficultyStyles.medium;
}

function StructuredList({ icon, label, items, emptyLabel = 'No data available.' }) {
  return (
    <div className="p-5 border border-bg-tertiary rounded-md bg-bg-secondary/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-text-primary">{icon}</div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-tertiary">{label}</p>
      </div>
      {items && items.length ? (
        <ul className="space-y-2 text-sm text-text-secondary">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="text-text-tertiary">•</span>
              <span className="flex-1 leading-relaxed whitespace-pre-wrap break-words">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-text-tertiary">{emptyLabel}</p>
      )}
    </div>
  );
}

function RevisionColumn({ title, tasks, emptyLabel }) {
  return (
    <div className="p-5 border border-bg-tertiary rounded-md bg-bg-secondary/30">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-tertiary mb-3">{title}</p>
      {tasks && tasks.length ? (
        <div className="space-y-3">
          {tasks.map((task, idx) => {
            const dueLabel = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Flexible';
            return (
              <div key={`${task.name}-${idx}`} className="flex items-center justify-between gap-3 p-3 rounded-md bg-bg border border-bg-tertiary">
                <div>
                  <p className="text-sm font-medium text-text-primary">{task.name}</p>
                  <p className="text-xs text-text-tertiary">Due {dueLabel}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${difficultyBadge(task.difficulty)}`}>
                  {task.difficulty}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-text-tertiary">{emptyLabel}</p>
      )}
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
