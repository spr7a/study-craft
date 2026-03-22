import { useState, useEffect } from 'react';
import { fsrs, createEmptyCard } from 'ts-fsrs';
import { useStore } from '../lib/store';
import { askGemini } from '../lib/gemini';
import { Layers, BrainCircuit, RefreshCw, Star, Check, Flame, Plus, Loader2, ArrowLeft, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

export default function SpacedRepetition() {
  const store = useStore();
  const f = fsrs();

  const [activeDeckId, setActiveDeckId] = useState(null);
  
  // Study State
  const [dueCards, setDueCards] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Generation State
  const [genTopic, setGenTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize Default Deck if empty
  useEffect(() => {
    if (store.decks.length === 0) {
      store.addDeck({
        id: 'default-1',
        name: 'React Fundamentals',
        cards: [
          { id: '1', q: 'What is a React Hook?', a: 'A special function that lets you "hook into" React features.', card: createEmptyCard() },
          { id: '2', q: 'What is useEffect used for?', a: 'To perform side effects in functional components.', card: createEmptyCard() }
        ]
      });
    }
  }, []);

  const handleStartStudy = (deck) => {
    setActiveDeckId(deck.id);
    setDueCards(deck.cards);
    if(deck.cards.length > 0) setCurrentCard(deck.cards[0]);
    setShowAnswer(false);
  };

  const handleGenerateDeck = async () => {
    if (!genTopic.trim() || isGenerating) return;
    setIsGenerating(true);
    
    try {
      const prompt = `Generate 5 high-quality flashcards about: ${genTopic}.`;
      const result = await askGemini(prompt, "");
      
      if (result && result.flashcards && result.flashcards.length > 0) {
        const newDeck = {
          id: Date.now().toString(),
          name: result.topic || genTopic,
          cards: result.flashcards.map((fc, i) => ({
            id: `${Date.now()}-${i}`,
            q: fc.q,
            a: fc.a,
            card: createEmptyCard()
          }))
        };
        store.addDeck(newDeck);
        setGenTopic('');
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate deck. Try another topic.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReview = (grade) => {
    const scheduling = f.repeat(currentCard.card, new Date());
    const nextItem = scheduling[grade]; 
    
    const activeDeck = store.decks.find(d => d.id === activeDeckId);
    const updatedCards = activeDeck.cards.map(c => 
      c.id === currentCard.id ? { ...c, card: nextItem.card } : c
    );
    
    store.updateDeck(activeDeckId, { ...activeDeck, cards: updatedCards });
    store.addFlashcardsReviewed(1, activeDeck.name);

    const remaining = dueCards.filter(c => c.id !== currentCard.id);
    setDueCards(remaining);
    
    if (remaining.length > 0) {
      setCurrentCard(remaining[0]);
      setShowAnswer(false);
    } else {
      setCurrentCard(null);
    }
  };

  const getGradeStyle = (grade) => {
    switch(grade) {
      case 1: return "bg-error/10 border border-error/30 text-error hover:bg-error/20";
      case 2: return "bg-warning/10 border border-warning/30 text-warning hover:bg-warning/20";
      case 3: return "bg-success/10 border border-success/30 text-success hover:bg-success/20";
      case 4: return "bg-text-tertiary/10 border border-text-tertiary/30 text-text-secondary hover:bg-text-tertiary/20 hover:text-text-primary";
      default: return "";
    }
  };

  if (!activeDeckId) {
    return (
      <div className="max-w-5xl mx-auto mt-6 pb-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold font-serif text-text-primary flex items-center gap-3">
              <Layers className="text-text-primary" size={28} /> Memory Banks
            </h1>
            <p className="text-text-secondary mt-2 text-sm">Select a deck to review or generate a new one with AI.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Deck List */}
          <div className="flex-[2] grid grid-cols-1 sm:grid-cols-2 gap-5">
            {store.decks.map(deck => (
              <motion.div 
                key={deck.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Card 
                  className="bg-bg-secondary border-bg-tertiary hover:border-text-tertiary cursor-pointer h-full transition-colors"
                  onClick={() => handleStartStudy(deck)}
                >
                  <CardContent className="p-8">
                    <div className="w-10 h-10 bg-bg rounded-[4px] border border-bg-tertiary flex items-center justify-center text-text-primary mb-5">
                      <BookOpen size={20} />
                    </div>
                    <CardTitle className="text-xl font-serif text-text-primary mb-2 line-clamp-1">{deck.name}</CardTitle>
                    <p className="text-xs text-text-secondary">{deck.cards.length} cards in deck</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Generator Panel */}
          <div className="flex-1">
            <Card className="bg-bg-secondary border-bg-tertiary sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-text-primary text-[15px] uppercase tracking-[0.06em]">
                   Auto-Generate
                </CardTitle>
                <CardDescription className="text-xs">Instantly build a powerful spaced repetition deck using AI.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <Input 
                  placeholder="E.g., Machine Learning Basics" 
                  value={genTopic}
                  onChange={e => setGenTopic(e.target.value)}
                  disabled={isGenerating}
                  onKeyDown={e => e.key === 'Enter' && handleGenerateDeck()}
                />
                <Button 
                  className="w-full font-medium" 
                  onClick={handleGenerateDeck}
                  disabled={isGenerating || !genTopic.trim()}
                >
                  {isGenerating ? <><Loader2 size={16} className="animate-spin mr-2" /> Generating...</> : <><Plus size={16} className="mr-2" /> Create Deck</>}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const activeDeck = store.decks.find(d => d.id === activeDeckId);

  // If session finished
  if (activeDeck && dueCards.length === 0 && !currentCard) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center animate-fade-up">
        <Card className="bg-bg-secondary border-bg-tertiary p-12 overflow-hidden">
          <div className="w-16 h-16 bg-success/10 rounded-full mx-auto flex items-center justify-center mb-6 border border-success/30">
            <Check size={32} className="text-success" />
          </div>
          <h2 className="text-3xl font-bold font-serif text-text-primary mb-3">"{activeDeck.name}" Caught Up.</h2>
          <p className="text-base text-text-secondary mb-10 max-w-sm mx-auto">
            You have reviewed all your flashcards in this deck. Great job maintaining your learning streak.
          </p>
          <div className="flex flex-col gap-4 items-center justify-center">
            <div className="flex items-center gap-2 text-accent-warm font-bold bg-accent-warm/10 py-2.5 px-6 rounded-pill border border-accent-warm/20 text-sm">
              <Flame size={18} /> {store.streakDays} Day Streak
            </div>
            <Button variant="ghost" className="mt-4" onClick={() => setActiveDeckId(null)}>
              <ArrowLeft size={16} className="mr-2" /> Back to Decks
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const progressPct = ((activeDeck.cards.length - dueCards.length) / activeDeck.cards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto mt-10 pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button 
            onClick={() => setActiveDeckId(null)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-text-tertiary hover:text-text-primary transition-colors mb-4 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          <h1 className="text-2xl font-bold font-serif text-text-primary flex items-center gap-3">
            {activeDeck.name}
          </h1>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-text-primary bg-bg-secondary px-3 py-1.5 rounded-sm border border-bg-tertiary">
            {dueCards.length} <span className="text-text-tertiary font-medium lowercase">remaining</span>
          </div>
        </div>
      </div>

      <div className="w-full bg-bg-tertiary h-1 mb-10">
        <div className="bg-text-primary h-full transition-all duration-300 ease-out" style={{ width: `${progressPct}%` }}></div>
      </div>

      <div className="perspective-1000 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id + (showAnswer ? '-a' : '-q')}
            initial={{ opacity: 0, rotateX: 10, scale: 0.98 }}
            animate={{ opacity: 1, rotateX: 0, scale: 1 }}
            exit={{ opacity: 0, rotateX: -10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Card className="bg-bg-secondary border-bg-tertiary shadow-sm relative min-h-[400px] flex flex-col group preserve-3d">
              <CardContent className="flex flex-col flex-1 p-12 text-center justify-center">
                {!showAnswer ? (
                  <h3 className="text-3xl font-serif text-text-primary leading-tight">
                    {currentCard.q}
                  </h3>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-[10px] text-text-secondary border border-bg-tertiary bg-bg px-2 py-0.5 rounded-sm mb-6 flex items-center gap-2 uppercase tracking-[0.08em] font-bold">
                         Answer
                    </div>
                    <p className="text-2xl text-text-primary leading-relaxed font-sans">
                      {currentCard.a}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8">
        {!showAnswer ? (
          <Button 
            size="lg" 
            className="w-full h-14 text-base shadow-sm" 
            onClick={() => setShowAnswer(true)}
          >
            Show Answer
          </Button>
        ) : (
          <div className="grid grid-cols-4 gap-3 animate-fade-up">
            <button className={`h-16 rounded-md flex flex-col items-center justify-center gap-0.5 ${getGradeStyle(1)} active:scale-[0.98] transition-transform`} onClick={() => handleReview(1)}>
              <span className="font-semibold text-sm">Again</span>
              <span className="text-[10px] opacity-70">{'< 1m'}</span>
            </button>
            <button className={`h-16 rounded-md flex flex-col items-center justify-center gap-0.5 ${getGradeStyle(2)} active:scale-[0.98] transition-transform`} onClick={() => handleReview(2)}>
              <span className="font-semibold text-sm">Hard</span>
              <span className="text-[10px] opacity-70">6m</span>
            </button>
            <button className={`h-16 rounded-md flex flex-col items-center justify-center gap-0.5 ${getGradeStyle(3)} active:scale-[0.98] transition-transform`} onClick={() => handleReview(3)}>
              <span className="font-semibold text-sm">Good</span>
              <span className="text-[10px] opacity-70">10m</span>
            </button>
            <button className={`h-16 rounded-md flex flex-col items-center justify-center gap-0.5 ${getGradeStyle(4)} active:scale-[0.98] transition-transform`} onClick={() => handleReview(4)}>
              <span className="font-semibold text-sm">Easy</span>
              <span className="text-[10px] opacity-70">4d</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
