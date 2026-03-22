import { useState, useRef, useEffect } from 'react';
import { autoGenerateQuizGemini } from '../lib/gemini';
import { useStore } from '../lib/store';
import { Check, X, CheckCircle2, XCircle, Award, Target, RefreshCcw, Loader2, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';

const subjectTopicsMap = {
  "Physics": [
    "Laws of Motion", "Kinematics", "Electrostatics", 
    "Modern Physics", "Rotational Motion", "Thermodynamics"
  ],
  "Chemistry": [
    "Chemical Bonding", "Organic Reactions", "Electrochemistry",
    "Thermodynamics", "Coordination Compounds", "Equilibrium"
  ],
  "Mathematics": [
    "Integration", "Differential Equations", "3D Geometry",
    "Probability", "Matrices & Determinants", "Complex Numbers"
  ],
  "Biology": [
    "Cell Biology", "Genetics & Evolution", "Human Physiology",
    "Plant Physiology", "Ecology", "Biotechnology"
  ],
  "History": [
    "Modern Indian History", "Ancient India", "World Wars",
    "Constitutional Development", "Revolt of 1857", "Medieval India"
  ],
  "Economics": [
    "Microeconomics", "Macroeconomics", "Money & Banking",
    "Government Budget", "Balance of Payments", "Indian Economy"
  ]
};

const fallbackTopics = [
  { subject: "Chemistry", topic: "Electrochemistry", tag: "High weightage" },
  { subject: "Chemistry", topic: "Organic Reactions", tag: "High weightage" },
  { subject: "Physics", topic: "Rotational Motion", tag: "High weightage" },
  { subject: "Mathematics", topic: "3D Geometry", tag: "High weightage" },
  { subject: "Physics", topic: "Modern Physics", tag: "High weightage" },
  { subject: "Physics", topic: "Thermodynamics", tag: "High weightage" }
];

export default function QuizGenerator() {
  const addQuizResult = useStore((state) => state.addQuizResult);
  const { studyProfile, quizResults } = useStore();

  // Left Column: Setup Form State
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficultyLevel, setDifficultyLevel] = useState('JEE/NEET Level');

  // Right Column: Dashboard State
  const [recentTopics, setRecentTopics] = useState([]);
  const [suggestedTopics, setSuggestedTopics] = useState([]);

  // Quiz State
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]); 
  const [showExp, setShowExp] = useState(false);
  const [score, setScore] = useState(0);

  // Tracking State
  const [timeTaken, setTimeTaken] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const startTimeRef = useRef(Date.now());
  const timerIntervalRef = useRef(null);
  const [currentQuestionTime, setCurrentQuestionTime] = useState(0);
  const [averageTime, setAverageTime] = useState(0);

  // Follow-up state
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [followUpGenerating, setFollowUpGenerating] = useState(false);
  const [fuIndex, setFuIndex] = useState(0);
  const [fuSelectedOpt, setFuSelectedOpt] = useState(null);
  const [fuShowExp, setFuShowExp] = useState(false);
  const [fuScore, setFuScore] = useState(0);

  // UI state for review
  const [expandedExplanations, setExpandedExplanations] = useState({});

  const clearTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Setup / Init
  useEffect(() => {
    // Read local storage history
    try {
      const histStr = localStorage.getItem('studycraft_topic_history');
      if (histStr) {
        const parsed = JSON.parse(histStr);
        setRecentTopics(parsed.entries.slice(0, 8));
      }
    } catch (e) {
      console.error(e);
    }

    // Default subject = worst accuracy or 'Physics'
    let initSub = "Physics";
    if (quizResults && quizResults.length > 0) {
      const subStats = {};
      quizResults.forEach(r => {
        if (!r.subject) return;
        if (!subStats[r.subject]) subStats[r.subject] = { c: 0, t: 0 };
        subStats[r.subject].c += r.score || 0;
        subStats[r.subject].t += r.total || 0;
      });
      const validKeys = Object.keys(subStats);
      if (validKeys.length > 0) {
         initSub = validKeys.sort((a,b) => (subStats[a].c/subStats[a].t) - (subStats[b].c/subStats[b].t))[0];
      }
    } else if (studyProfile?.subjects?.length > 0) {
      initSub = studyProfile.subjects[0].name;
    }
    setSubject(initSub);

    // Compute suggestions from History
    const topicStats = {};
    if (quizResults) {
      quizResults.forEach(r => {
        if (!r.subject || !r.topic) return;
        const key = `${r.subject}::${r.topic}`;
        if (!topicStats[key]) topicStats[key] = { subject: r.subject, topic: r.topic, correct: 0, total: 0 };
        topicStats[key].correct += r.score || 0;
        topicStats[key].total += r.total || 0;
      });
    }
    const weakTopics = Object.values(topicStats)
      .map(t => ({ ...t, accuracy: t.total ? Math.round((t.correct / t.total) * 100) : 0 }))
      .filter(t => t.accuracy < 65)
      .sort((a,b) => a.accuracy - b.accuracy)
      .map(t => ({ subject: t.subject, topic: t.topic, accuracy: t.accuracy, tag: "Weak area" }));

    let finalSuggs = weakTopics.slice(0, 4);
    if (finalSuggs.length < 4) {
      const usableFallback = fallbackTopics.filter(f => !finalSuggs.some(s => s.topic === f.topic && s.subject === f.subject));
      finalSuggs = [...finalSuggs, ...usableFallback.slice(0, 4 - finalSuggs.length)];
    }
    setSuggestedTopics(finalSuggs);
  }, [quizResults, studyProfile]);

  const handleGenerate = async () => {
    if (!topic || !subject) return;

    setIsLoading(true);
    setHasError(false);
    
    const diffStr = difficultyLevel === 'Mixed' ? '' : ` Focus on ${difficultyLevel} difficulty.`;
    const generated = await autoGenerateQuizGemini(subject, topic, diffStr, questionCount);

    if (generated && generated.length > 0) {
      setQuestions(generated);
      resetQuizState();
    } else {
      setHasError(true);
    }
    setIsLoading(false);
  };

  const updateTopicHistory = (sub, top, count, level, correct, total) => {
    try {
      const data = JSON.parse(localStorage.getItem('studycraft_topic_history') || '{"entries":[]}');
      let entries = data.entries || [];
      const existIdx = entries.findIndex(e => e.subject === sub && e.topic === top);
      const acc = Math.round((correct / total) * 100);
      
      if (existIdx >= 0) {
         entries[existIdx] = {
           ...entries[existIdx],
           lastUsed: new Date().toISOString(),
           lastAccuracy: acc,
           timesUsed: (entries[existIdx].timesUsed || 1) + 1,
           questionCount: count,
           difficulty: level
         };
      } else {
         entries.unshift({
           id: `th_${Date.now()}`,
           subject: sub,
           topic: top,
           questionCount: count,
           difficulty: level,
           lastUsed: new Date().toISOString(),
           lastAccuracy: acc,
           timesUsed: 1
         });
      }
      entries.sort((a,b) => new Date(b.lastUsed) - new Date(a.lastUsed));
      if (entries.length > 20) entries = entries.slice(0, 20);
      localStorage.setItem('studycraft_topic_history', JSON.stringify({ entries }));
    } catch(e) { console.error(e); }
  };

  const resetQuizState = () => {
    setCurrentIndex(0);
    setSelectedOptions([]);
    setTimeTaken([]);
    setDifficulties([]);
    setShowExp(false);
    setScore(0);
    setAverageTime(0);
    setExpandedExplanations({});
  };

  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length && !showExp) {
      setCurrentQuestionTime(0);
      startTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setCurrentQuestionTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [currentIndex, questions.length, showExp]);

  const handleSelect = (idx, isSkip = false) => {
    if (showExp) return;
    
    const newSels = [...selectedOptions];
    newSels[currentIndex] = isSkip ? -1 : idx;
    setSelectedOptions(newSels);

    clearTimer();
    const ms = Date.now() - startTimeRef.current;
    const newTimes = [...timeTaken];
    newTimes[currentIndex] = ms;
    setTimeTaken(newTimes);

    setShowExp(true);
    if (!isSkip && idx === questions[currentIndex].correct) {
      setScore(s => s + 1);
    }
  };

  const handleRating = (rating) => {
    const newDiffs = [...difficulties];
    newDiffs[currentIndex] = rating;
    setDifficulties(newDiffs);
  };

  const handleNextClick = () => {
    if (currentIndex === questions.length - 1) {
      const avg = timeTaken.reduce((a,b)=>a+b, 0) / timeTaken.length;
      setAverageTime(avg);

      const quizData = questions.map((q, i) => ({
        ...q,
        isCorrect: selectedOptions[i] === q.correct,
        time_taken_ms: timeTaken[i],
        difficulty_rating: difficulties[i] || 'Unrated'
      }));
      
      addQuizResult(score, questions.length, topic, quizData, subject);
      updateTopicHistory(subject, topic, questionCount, difficultyLevel, score, questions.length);

      setCurrentIndex(questions.length);
    } else {
      setCurrentIndex(c => c + 1);
      setShowExp(false);
    }
  };

  const handleFollowUp = async () => {
    setFollowUpGenerating(true);
    setShowFollowUpModal(true);
    const generated = await autoGenerateQuizGemini(subject, topic, 'Drill', 5);
    setFollowUpQuestions(generated && generated.length > 0 ? generated : []);
    setFuIndex(0);
    setFuSelectedOpt(null);
    setFuShowExp(false);
    setFuScore(0);
    setFollowUpGenerating(false);
  };

  const handleFuSelect = (idx) => {
    if (fuShowExp) return;
    setFuSelectedOpt(idx);
    setFuShowExp(true);
    if (idx === followUpQuestions[fuIndex].correct) {
      setFuScore(s => s + 1);
    }
  };

  // RENDER: Setup Dashboard if No Questions
  if (questions.length === 0) {
    const defaultSubjects = studyProfile?.subjects?.map(s => s.name) || ["Physics", "Chemistry", "Mathematics", "Biology", "History", "Economics"];
    // Ensure the predefined subjects are prioritized to match the user's instructions cleanly
    const safeSubjects = defaultSubjects.length ? defaultSubjects : ["Physics", "Chemistry", "Mathematics", "Biology", "History", "Economics"];

    // Dynamic hardcoded chips for selected subject
    const subjectChips = subjectTopicsMap[subject] || subjectTopicsMap["Physics"];
    
    return (
      <div className="max-w-[1020px] mx-auto mt-6 md:mt-10 font-sans tracking-tight">
        <div className="flex flex-col md:flex-row gap-12">
          
          {/* LEFT COLUMN: SETUP FORM (60%) */}
          <div className="flex-1 md:w-[60%]">
            <div className="mb-10">
              <h1 className="text-[32px] font-bold text-[#111110] leading-tight mb-2 font-serif">Adaptive Practice</h1>
              <p className="text-[15px] font-medium text-[#5C5B57]">Generate a quiz tailored to your level.</p>
            </div>

            <div className="space-y-8">
              {/* Subject Selector */}
              <div>
                <label className="text-[10px] font-semibold text-[#9C9A94] uppercase tracking-[0.1em] mb-3 block">Subject</label>
                <div className="flex flex-wrap gap-2.5">
                  {safeSubjects.map(s => (
                    <button 
                      key={s}
                      onClick={() => setSubject(s)}
                      className={`px-[16px] py-[6px] rounded-full text-[13px] font-medium border-[1.5px] transition-colors ${
                        subject === s 
                          ? 'bg-[#111110] text-[#FFFFFF] border-[#111110]' 
                          : 'bg-[#FAFAF8] text-[#5C5B57] border-[#E8E6E1] hover:border-[#111110]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Input */}
              <div>
                <label className="text-[10px] font-semibold text-[#9C9A94] uppercase tracking-[0.1em] mb-3 block">Topic</label>
                <input 
                  type="text" 
                  className="w-full h-[46px] bg-[#FFFFFF] border-[1.5px] border-[#E8E6E1] rounded-[10px] px-4 text-[14px] text-[#111110] focus:outline-none focus:border-[#111110] placeholder:text-[#9C9A94]"
                  placeholder="e.g. Laws of Motion, Organic Chemistry..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
                
                {/* Topic Chips */}
                <div className="mt-3 flex flex-wrap gap-1">
                  <AnimatePresence mode="popLayout">
                    {subjectChips && subjectChips.map((c, i) => (
                      <motion.button 
                        key={`${subject}-${c}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        onClick={() => setTopic(c)}
                        className={`px-[12px] py-[4px] rounded-full text-[12px] font-medium border transition-colors inline-flex m-[3px] ${
                          topic === c 
                            ? 'bg-[#111110] text-[#FFFFFF] border-[#111110]' 
                            : 'bg-[#F2F1EE] border-[#E8E6E1] text-[#5C5B57] hover:bg-[#E8E6E1] hover:text-[#111110]'
                        }`}
                      >
                        {c}
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="text-[10px] font-semibold text-[#9C9A94] uppercase tracking-[0.1em] mb-3 block">Questions</label>
                <div className="flex flex-wrap gap-2.5">
                  {[5, 10, 15, 20].map(n => (
                    <button 
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      className={`px-[20px] py-[8px] rounded-full text-[13px] font-medium border-[1.5px] transition-colors ${
                        questionCount === n 
                          ? 'bg-[#111110] text-[#FFFFFF] border-[#111110]' 
                          : 'bg-[#FAFAF8] text-[#5C5B57] border-[#E8E6E1] hover:border-[#111110]'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-[10px] font-semibold text-[#9C9A94] uppercase tracking-[0.1em] mb-3 block">Difficulty</label>
                <div className="flex flex-wrap gap-2.5">
                  {['Mixed', 'Easy', 'Medium', 'Hard', 'JEE/NEET Level'].map(d => (
                    <button 
                      key={d}
                      onClick={() => setDifficultyLevel(d)}
                      className={`px-[16px] py-[8px] rounded-full text-[13px] font-medium border-[1.5px] transition-colors ${
                        difficultyLevel === d 
                          ? 'bg-[#111110] text-[#FFFFFF] border-[#111110]' 
                          : 'bg-[#FAFAF8] text-[#5C5B57] border-[#E8E6E1] hover:border-[#111110]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div>
                <button 
                  onClick={handleGenerate}
                  disabled={isLoading || !topic || !subject}
                  className="w-full h-[44px] bg-[#111110] text-[#FFFFFF] text-[14px] font-medium rounded-[10px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed hover:bg-black/80 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Generating questions...</>
                  ) : (
                    <>Generate Quiz &rarr;</>
                  )}
                </button>
                {hasError && (
                  <p className="text-[#B84040] text-[13px] font-medium mt-3 text-center">
                    Couldn't generate questions right now. Please check API Key or retry.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: TOPIC INTELLIGENCE PANEL (40%) */}
          <div className="flex-1 md:w-[40%] md:border-l md:border-[#E8E6E1] md:pl-12 py-2">
            
            {/* Empty State Banner */}
            {!quizResults?.length && !studyProfile && (
              <div className="bg-[#F2F1EE] text-[#5C5B57] text-[13px] rounded-[8px] p-[10px] px-[14px] mb-[24px]">
                👋 New here? Start with a suggested topic below.
              </div>
            )}

            {/* SECTION A: RECENT TOPICS */}
            <div className="mb-10">
              <h3 className="text-[10px] font-semibold text-[#9C9A94] uppercase tracking-[0.1em] mb-4">Recent Topics</h3>
              <div className="flex flex-col gap-2">
                {recentTopics.length === 0 ? (
                  <div className="text-[13px] text-[#9C9A94] italic p-2 px-0">
                    Your completed quizzes will appear here.
                  </div>
                ) : (
                  recentTopics.map(h => (
                    <div 
                      key={h.id}
                      onClick={() => { setSubject(h.subject); setTopic(h.topic); }}
                      className="bg-[#FAFAF8] border border-[#E8E6E1] rounded-[8px] p-[10px] px-[14px] flex items-center gap-3 cursor-pointer hover:border-[#111110] transition-colors group"
                    >
                      <span className="bg-[#F2F1EE] text-[#5C5B57] text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0">
                        {h.subject}
                      </span>
                      <span className="text-[13px] font-medium text-[#111110] flex-1 truncate">
                        {h.topic}
                      </span>
                      <span 
                        className="text-[12px] font-semibold shrink-0" 
                        style={{ color: h.lastAccuracy >= 70 ? '#3D7A5E' : h.lastAccuracy >= 40 ? '#C9622F' : '#B84040' }}
                      >
                        {h.lastAccuracy}%
                      </span>
                      <span className="text-[12px] font-medium text-[#9C9A94] opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        &rarr; use
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SECTION B: SUGGESTED TOPICS */}
            <div>
              <div className="mb-4">
                <h3 className="text-[10px] font-semibold text-[#9C9A94] uppercase tracking-[0.1em]">Suggested For You</h3>
                <p className="text-[12px] text-[#9C9A94] mt-0.5">Based on your weak areas</p>
              </div>
              <div className="flex flex-col gap-2">
                {suggestedTopics.map((s, idx) => (
                  <div 
                    key={`${s.subject}-${s.topic}-${idx}`}
                    onClick={() => { setSubject(s.subject); setTopic(s.topic); }}
                    className="bg-[#FAFAF8] border border-[#E8E6E1] rounded-[8px] p-[10px] px-[14px] flex items-center gap-3 cursor-pointer hover:border-[#111110] transition-colors group"
                  >
                    <span className="bg-[#F2F1EE] text-[#5C5B57] text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0">
                      {s.subject}
                    </span>
                    <span className="text-[13px] font-medium text-[#111110] flex-1 truncate">
                      {s.topic}
                    </span>
                    <span 
                      className="text-[11px] font-semibold shrink-0" 
                      style={{ color: s.tag === 'Weak area' ? '#C9622F' : '#2C6FA6' }}
                    >
                      {s.accuracy !== undefined ? `${s.accuracy}% (Weak)` : s.tag}
                    </span>
                    <span className="text-[12px] font-medium text-[#9C9A94] opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      &rarr; use
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // RENDER: RESULTS SCREEN
  if (currentIndex >= questions.length) {
    const accuracy = score / questions.length;
    return (
      <div className="max-w-[680px] mx-auto mt-8 animate-fade-up font-sans">
        <div className="bg-[#FFFFFF] border border-[#E8E6E1] rounded-[14px] p-[32px] px-[36px] shadow-sm">
          
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start border-b border-[#E8E6E1] pb-8 mb-8">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <CheckCircle2 size={32} className="text-[#C9622F]" strokeWidth={2} />
                <h2 className="text-[26px] font-bold text-[#111110]">Quiz Complete</h2>
              </div>
              <p className="text-[14px] text-[#5C5B57] ml-0 md:ml-11">Topic: {topic}</p>
            </div>
            
            <div className="text-center md:text-right flex flex-col items-center md:items-end">
              <div className="flex items-baseline mb-[2px]">
                <span className="text-[56px] font-bold text-[#111110] font-sans leading-none" style={{ fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' }}>
                  {score}
                </span>
                <span className="text-[24px] font-normal text-[#9C9A94] ml-1 leading-none">/{questions.length}</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#9C9A94] mt-1">Score</div>
              <div className="text-[13px] text-[#9C9A94] mt-3">Avg time per question: {(averageTime/1000).toFixed(1)}s</div>
            </div>
          </div>

          {accuracy < 0.60 && (
            <div className="bg-[#FDF5F0] border border-[#F0C9B0] rounded-[10px] p-[16px] px-[20px] mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="flex items-center gap-1.5 text-[14px] font-semibold text-[#111110] mb-0.5">
                  <Lightbulb size={14} className="text-[#C9622F]" /> You struggled with this topic
                </h4>
                <p className="text-[13px] text-[#5C5B57]">Your accuracy is under 60%. Want to do a quick drill to reinforce the basics?</p>
              </div>
              <button 
                onClick={handleFollowUp}
                disabled={followUpGenerating}
                className="bg-[#111110] text-white text-[13px] px-[16px] py-[8px] rounded-[8px] whitespace-nowrap hover:bg-black/80 transition-colors w-fit"
              >
                {followUpGenerating ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null} 
                {followUpGenerating ? 'Loading...' : 'Generate 5 targeted follow-up questions?'}
              </button>
            </div>
          )}

          <div className="space-y-5">
            <h3 className="text-[15px] font-semibold text-[#111110] mb-2">Question Review</h3>
            {questions.map((q, i) => {
              const qTimeStr = (timeTaken[i]/1000).toFixed(1);
              const diffRating = difficulties[i];
              const isCorrect = selectedOptions[i] === q.correct;
              const isSkipped = selectedOptions[i] === -1;
              const diffColor = diffRating === 'Too Easy' ? '#3D7A5E' : diffRating === 'Just Right' ? '#2C6FA6' : diffRating === 'Hard' ? '#C9622F' : diffRating === 'Very Hard' ? '#B84040' : '#9C9A94';
              
              const isExpanded = expandedExplanations[i];

              return (
                <div key={i} className="bg-[#FAFAF8] border border-[#E8E6E1] rounded-[10px] p-[16px] px-[20px]">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[11px] font-semibold text-[#9C9A94] tracking-wide inline-flex items-center">
                      Q{i + 1} &middot; <span className="ml-1">{qTimeStr}s</span>
                    </div>
                    {diffRating && diffRating !== 'Unrated' && (
                      <div className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: diffColor }}>
                        RATED: {diffRating}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-[14px] text-[#111110] mb-3 leading-relaxed mt-1">{q.question}</p>
                  
                  <div className="space-y-1.5 mb-3 text-[13px]">
                    <div className={`font-medium ${isCorrect ? 'text-[#3D7A5E]' : isSkipped ? 'text-[#9C9A94]' : 'text-[#B84040]'}`}>
                      Your answer: {isSkipped ? 'Skipped' : `${String.fromCharCode(65 + selectedOptions[i])}) ${q.options[selectedOptions[i]]}`}
                    </div>
                    {!isCorrect && !isSkipped && (
                      <div className="font-medium text-[#3D7A5E]">
                        Correct: {String.fromCharCode(65 + q.correct)}) {q.options[q.correct]}
                      </div>
                    )}
                  </div>

                  {q.explanation && (
                    <div className="mt-2">
                       <button 
                         onClick={() => setExpandedExplanations(prev => ({...prev, [i]: !prev[i]}))}
                         className="text-[#2C6FA6] text-[13px] font-medium flex items-center gap-1 hover:underline focus:outline-none w-fit"
                       >
                         See explanation {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                       </button>
                       {isExpanded && (
                         <div className="mt-3 bg-[#F0F5FB] border-l-[3px] border-[#2C6FA6] rounded-r-md p-3 text-[13px] text-[#111110] leading-relaxed">
                           {q.explanation}
                           {q.examiners_note && (
                             <div className="mt-2 text-[#C9622F] font-semibold flex items-center gap-1">
                               <Lightbulb size={12}/> Examiner's Note: <span className="text-[#111110] font-normal">{q.examiners_note}</span>
                             </div>
                           )}
                         </div>
                       )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <button 
              className="bg-[#111110] text-white px-8 py-3 rounded-[10px] text-[14px] font-medium hover:bg-black/80 transition-colors w-fit"
              onClick={() => {
                setQuestions([]);
              }}
            >
              New Quiz Session
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ACTIVE QUESTION VIEW
  const q = questions[currentIndex];
  const timerWarning = currentQuestionTime > 180;
  const timerCaution = currentQuestionTime > 90;
  const tColor = timerWarning || timerCaution ? '#C9622F' : '#111110';
  const tBorder = timerWarning || timerCaution ? '#C9622F' : '#E8E6E1';
  const tBg = timerWarning || timerCaution ? 'transparent' : '#F2F1EE';

  return (
    <div className="max-w-[680px] mx-auto pt-8 font-sans relative">
      <div className="flex justify-between items-center mb-6">
        <span className="text-[11px] font-semibold text-[#9C9A94] uppercase tracking-[0.1em]">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <div className="flex items-center gap-4">
          <div 
            className="border rounded-full px-[14px] py-[4px] text-[13px] font-semibold text-center min-w-[64px]"
            style={{ backgroundColor: tBg, borderColor: tBorder, color: tColor, fontVariantNumeric: 'tabular-nums' }}
          >
            {Math.floor(currentQuestionTime / 60).toString().padStart(2, '0')}:{(currentQuestionTime % 60).toString().padStart(2, '0')}
          </div>
          <button 
            onClick={() => handleSelect(-1, true)} 
            disabled={showExp}
            className="bg-transparent border border-[#E8E6E1] text-[#5C5B57] text-[13px] h-[34px] px-4 rounded-[8px] hover:border-[#111110] hover:text-[#111110] transition-colors disabled:opacity-50"
          >
            Skip &rarr;
          </button>
        </div>
      </div>

      <div className="bg-[#FFFFFF] border border-[#E8E6E1] rounded-[12px] p-[32px] px-[36px] shadow-sm">
        <h3 className="text-[19px] font-semibold leading-[1.5] text-[#111110] mb-7 max-w-[640px]">
          {q?.question}
        </h3>

        <div className="space-y-[10px]">
          {q?.options.map((opt, i) => {
            const isSelected = selectedOptions[currentIndex] === i;
            const isCorrect = showExp && q.correct === i;
            const isWrong = showExp && isSelected && !isCorrect;
            const isUnchosen = showExp && !isCorrect && !isSelected;

            let rowStyle = {
              background: '#FAFAF8',
              borderColor: '#E8E6E1',
              borderWidth: '1.5px',
              opacity: isUnchosen ? 0.45 : 1
            };
            let badgeStyle = {
              background: '#F2F1EE',
              borderColor: '#E8E6E1',
              color: '#5C5B57'
            };

            if (showExp) {
              if (isCorrect) {
                rowStyle.background = '#F0F7F4';
                rowStyle.borderColor = '#3D7A5E';
                rowStyle.borderWidth = '2px';
                badgeStyle.background = '#3D7A5E';
                badgeStyle.borderColor = '#3D7A5E';
                badgeStyle.color = '#FFFFFF';
              } else if (isWrong) {
                rowStyle.background = '#FDF4F4';
                rowStyle.borderColor = '#B84040';
                rowStyle.borderWidth = '2px';
                badgeStyle.background = '#B84040';
                badgeStyle.borderColor = '#B84040';
                badgeStyle.color = '#FFFFFF';
              }
            } else if (isSelected) {
              rowStyle.background = '#FFFFFF';
              rowStyle.borderColor = '#111110';
              rowStyle.borderWidth = '2px';
              badgeStyle.background = '#111110';
              badgeStyle.borderColor = '#111110';
              badgeStyle.color = '#FFFFFF';
            }

            return (
              <button 
                key={i}
                disabled={showExp}
                className={`w-full text-left rounded-[10px] p-[14px] px-[18px] flex items-center gap-[14px] transition-all duration-150 cursor-pointer ${!showExp && !isSelected ? 'hover:border-[#111110] hover:bg-[#FFFFFF] group' : ''}`}
                style={rowStyle}
                onClick={() => handleSelect(i)}
              >
                <div 
                  className={`w-[28px] h-[28px] rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0 transition-colors ${!showExp && !isSelected ? 'group-hover:bg-[#111110] group-hover:text-[#FFFFFF] group-hover:border-[#111110]' : ''}`}
                  style={badgeStyle}
                >
                  {String.fromCharCode(65 + i)}
                </div>
                <div className="flex-1 text-[15px] text-[#111110] leading-[1.4]">
                  {opt}
                </div>
                {isCorrect && <Check size={18} strokeWidth={3} color="#3D7A5E" className="shrink-0" />}
                {isWrong && <X size={18} strokeWidth={3} color="#B84040" className="shrink-0" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {showExp && difficulties[currentIndex] && q?.explanation && (
            <motion.div 
              initial={{ opacity: 0, y: 4 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.25 }} 
              className="mt-[20px] bg-[#F0F5FB] border-l-[3px] border-[#2C6FA6] rounded-r-lg p-[14px] px-[16px]"
            >
               <div className="text-[10px] font-semibold tracking-[0.1em] text-[#2C6FA6] mb-[6px] uppercase">EXPLANATION</div>
               <div className="text-[13px] text-[#111110] leading-[1.6]">
                 {q.explanation}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showExp && (
          <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="mt-[16px] bg-[#F2F1EE] border border-[#E8E6E1] rounded-[10px] p-[16px] px-[20px]"
          >
             <div className="text-[11px] font-semibold tracking-[0.1em] text-[#9C9A94] uppercase text-center mb-[12px]">
               {difficulties[currentIndex] ? 'Difficulty Rated' : 'Rate difficulty to continue'}
             </div>
             <div className="flex gap-[8px] justify-center">
                {[
                  { label: 'Too Easy', sBorder: '#3D7A5E', sText: '#3D7A5E', sBg: '#F0F7F4' },
                  { label: 'Just Right', sBorder: '#2C6FA6', sText: '#2C6FA6', sBg: '#F0F5FB' },
                  { label: 'Hard', sBorder: '#C9622F', sText: '#C9622F', sBg: '#FDF5F0' },
                  { label: 'Very Hard', sBorder: '#B84040', sText: '#B84040', sBg: '#FDF4F4' }
                ].map((d) => {
                  const isSelected = difficulties[currentIndex] === d.label;
                  const isRated = !!difficulties[currentIndex];
                  return (
                    <button 
                      key={d.label}
                      disabled={isRated}
                      onClick={() => handleRating(d.label)}
                      className="flex-1 rounded-[8px] py-[10px] text-[13px] font-medium transition-colors"
                      style={isSelected ? {
                        border: `2px solid ${d.sBorder}`,
                        color: d.sText,
                        backgroundColor: d.sBg
                      } : {
                        border: '1.5px solid #E8E6E1',
                        color: '#5C5B57',
                        backgroundColor: '#FAFAF8',
                        opacity: isRated ? 0.6 : 1,
                        cursor: isRated ? 'default' : 'pointer'
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExp && difficulties[currentIndex] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-[20px] flex justify-end">
             <button 
               onClick={handleNextClick}
               className="bg-[#111110] text-[#FFFFFF] font-medium text-[13px] px-[24px] py-[12px] rounded-[8px] hover:bg-black/80 transition-colors"
             >
               {currentIndex === questions.length - 1 ? 'View Results' : 'Next Question →'}
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK DRILL MODAL */}
      {showFollowUpModal && followUpQuestions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#FFFFFF] w-full max-w-xl rounded-[14px] shadow-2xl overflow-hidden border border-[#E8E6E1] flex flex-col max-h-[90vh]">
            {fuIndex >= followUpQuestions.length ? (
               <div className="p-10 text-center flex-1 overflow-y-auto">
                  <Target size={40} className="mx-auto text-[#C9622F] mb-4" />
                  <h2 className="text-2xl font-bold font-serif mb-2">Quick Drill Complete</h2>
                  <p className="text-4xl my-6" style={{ fontVariantNumeric: 'tabular-nums' }}>{fuScore} <span className="text-xl text-[#9C9A94]">/ {followUpQuestions.length}</span></p>
                  <button onClick={() => setShowFollowUpModal(false)} className="bg-[#111110] text-white px-8 py-3 rounded-lg font-medium">Close Drill</button>
               </div>
            ) : (
               <div className="flex-1 flex flex-col h-full">
                <div className="p-4 border-b border-[#E8E6E1] bg-[#FAFAF8] flex justify-between items-center">
                  <div className="font-bold text-[12px] tracking-widest uppercase text-[#111110] flex items-center gap-2">
                     <Target size={16} className="text-[#C9622F]"/> Quick Drill
                  </div>
                  <div className="text-[12px] font-semibold text-[#5C5B57]">Q{fuIndex + 1} / {followUpQuestions.length}</div>
                </div>
                <div className="p-8 flex-1 overflow-y-auto">
                  <h3 className="text-[17px] font-semibold text-[#111110] mb-6">{followUpQuestions[fuIndex].question}</h3>
                  <div className="space-y-3">
                    {followUpQuestions[fuIndex].options.map((opt, i) => {
                      let isCorrect = fuShowExp && i === followUpQuestions[fuIndex].correct;
                      let isWrong = fuShowExp && i === fuSelectedOpt && i !== followUpQuestions[fuIndex].correct;
                      let btnCls = "w-full text-left p-4 rounded-md border-[1.5px] text-[14px] transition-colors flex items-center gap-3 ";
                      if (fuShowExp) {
                         if (isCorrect) btnCls += "bg-[#F0F7F4] border-[#3D7A5E] text-[#111110]";
                         else if (isWrong) btnCls += "bg-[#FDF4F4] border-[#B84040] text-[#111110]";
                         else btnCls += "bg-[#FAFAF8] border-[#E8E6E1] text-[#9C9A94] opacity-50";
                      } else if (i === fuSelectedOpt) {
                         btnCls += "bg-[#FFFFFF] border-[#111110] text-[#111110]";
                      } else {
                         btnCls += "bg-[#FAFAF8] border-[#E8E6E1] text-[#111110] hover:border-[#111110]";
                      }
                      return (
                        <button key={i} className={btnCls} onClick={() => handleFuSelect(i)} disabled={fuShowExp}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {fuShowExp && (
                    <div className="mt-6 flex flex-col gap-4">
                      {followUpQuestions[fuIndex].explanation && (
                         <div className="p-4 bg-[#F0F5FB] border-l-[3px] border-[#2C6FA6] rounded-r-md text-[13px] leading-relaxed">
                           <strong className="text-[#2C6FA6] block text-[10px] uppercase tracking-wider mb-1">Explanation</strong>
                           {followUpQuestions[fuIndex].explanation}
                         </div>
                      )}
                      <div className="flex justify-end">
                        <button className="bg-[#111110] text-white px-6 py-2 rounded-lg text-sm" onClick={() => {
                          setFuIndex(c => c+1);
                          setFuShowExp(false);
                          setFuSelectedOpt(null);
                        }}>Next Question &rarr;</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
