import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { getWeakAreaInsightsGemini } from '../lib/gemini';
import { Sparkles, PenLine, RefreshCw, AlertCircle, BookOpen } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/Card';

export default function WeakAreaInsights() {
  const store = useStore();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetInsights = async () => {
    setLoading(true);
    setError('');
    
    // Gather data
    const performanceData = {
      quizResults: store.quizResults,
      studyProfile: store.studyProfile,
      // Pass brief snapshot of FSRS deck performance
      decks: store.decks.map(d => ({
        name: d.name,
        totalCards: d.cards.length,
        avgStability: d.cards.reduce((sum, c) => sum + (c.card?.stability || 0), 0) / (d.cards.length || 1)
      }))
    };

    const result = await getWeakAreaInsightsGemini(performanceData);
    
    if (result && result.weakAreas) {
      setInsights(result);
    } else {
      setError('Could not generate insights at this time. Please try again.');
    }
    
    setLoading(false);
  };

  if (!insights && !loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 bg-bg border border-bg-tertiary rounded-lg text-center mt-6 group">
        <div className="w-12 h-12 rounded-full bg-accent-warm/10 text-accent-warm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Sparkles size={24} />
        </div>
        <h3 className="text-lg font-serif font-bold text-text-primary mb-2">Unlock Deep AI Analysis</h3>
        <p className="text-sm text-text-secondary max-w-sm mb-6">
          Our AI scans your entire learning history—from FSRS retention curves to quiz exactness—to pinpoint precisely where you need focus.
        </p>
        <Button onClick={handleGetInsights} className="gap-2 shadow-lg shadow-accent-warm/20">
          <Sparkles size={16} /> Get AI Insight
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mt-6">
      {/* Header / Loading State */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-primary font-bold font-serif text-xl">
          <Sparkles className="text-accent-warm" size={20} /> AI Synthesis
        </div>
        {insights && (
          <Button variant="ghost" size="sm" onClick={handleGetInsights} disabled={loading} className="text-xs">
            {loading ? <RefreshCw size={14} className="animate-spin mr-1" /> : <RefreshCw size={14} className="mr-1" />}
            Refresh
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/30 rounded-md text-error text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading && !insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2].map((i) => (
            <Card key={i} className="bg-bg-secondary border-bg-tertiary">
              <CardContent className="p-5 flex flex-col gap-3">
                <div className="h-5 w-3/4 bg-bg-tertiary rounded"></div>
                <div className="h-4 w-1/4 bg-bg-tertiary rounded mb-2"></div>
                <div className="h-3 w-full bg-bg-tertiary rounded"></div>
                <div className="h-3 w-5/6 bg-bg-tertiary rounded"></div>
                <div className="mt-4 bg-bg-tertiary h-16 w-full rounded-md"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AnimatePresence>
        {insights && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-5"
          >
            {insights.overallInsight && (
              <div className="p-4 bg-bg-tertiary/40 border border-bg-tertiary rounded-lg text-sm text-text-secondary italic">
                "{insights.overallInsight}"
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.weakAreas.map((area, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex"
                >
                  <Card className="bg-bg-secondary border-bg-tertiary hover:border-accent-warm/30 transition-colors w-full flex flex-col">
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="mb-3 flex justify-between items-start gap-2">
                        <h4 className="font-bold text-text-primary leading-snug">{area.concept}</h4>
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-bg border border-bg-tertiary px-2 py-0.5 rounded text-text-secondary shrink-0">
                          {area.subject}
                        </span>
                      </div>
                      <p className="text-xs text-text-tertiary mb-4 flex-1">
                        <strong className="text-text-secondary">Evidence:</strong> {area.evidence}
                      </p>
                      <div className="bg-accent-warm/10 border border-accent-warm/20 rounded-md p-3 mt-auto flex gap-3 items-start">
                        <PenLine size={16} className="text-accent-warm shrink-0 mt-0.5" />
                        <p className="text-sm text-accent-warm leading-relaxed font-medium">
                          {area.recommendation}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
