import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CalendarDays, 
  Clock, 
  Target, 
  BookOpen, 
  RefreshCw, 
  CheckCircle2, 
  Circle,
  Check,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../lib/store';
import { generateStudyPlan } from '../lib/gemini';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const EXAM_TARGETS = [
  "JEE Main", "JEE Advanced", "NEET", "UPSC Prelims", "UPSC Mains", "Custom"
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

function OnboardingForm({ onSubmit, initialData }) {
  const [target, setTarget] = useState((initialData?.examTarget && EXAM_TARGETS.includes(initialData.examTarget)) ? initialData.examTarget : (initialData?.examTarget ? "Custom" : EXAM_TARGETS[0]));
  const [customTarget, setCustomTarget] = useState((initialData?.examTarget && !EXAM_TARGETS.includes(initialData.examTarget)) ? initialData.examTarget : "");
  const [date, setDate] = useState(initialData?.examDate || "");
  const [hours, setHours] = useState(initialData?.dailyHours || 6);
  const [subjInput, setSubjInput] = useState("");
  const [subjects, setSubjects] = useState(initialData?.subjects || []);
  const [error, setError] = useState("");

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (subjInput.trim() && !subjects.find(s => s.name.toLowerCase() === subjInput.trim().toLowerCase())) {
      setSubjects([...subjects, { name: subjInput.trim(), level: "Beginner" }]);
      setSubjInput("");
    }
  };

  const handleRemoveSubject = (name) => {
    setSubjects(subjects.filter(s => s.name !== name));
  };

  const updateSubjectLevel = (name, level) => {
    setSubjects(subjects.map(s => s.name === name ? { ...s, level } : s));
  };

  const submitForm = (e) => {
    e.preventDefault();
    setError("");
    if (!date) {
      setError("Please select an exam date.");
      return;
    }
    const examDateStr = new Date(date).getTime();
    if (examDateStr < Date.now()) {
      setError("Exam date must be in the future.");
      return;
    }
    if (subjects.length === 0) {
      setError("Please add at least one subject.");
      return;
    }
    
    onSubmit({
      examTarget: target === "Custom" ? customTarget : target,
      examDate: date,
      dailyHours: hours,
      subjects
    });
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-text-primary mb-2">Configure Your Planner</h1>
        <p className="text-text-secondary">Set up your study profile to generate a personalized, AI-driven study schedule.</p>
      </div>

      <Card>
        <CardContent className="pt-6 border-bg-tertiary">
          <form onSubmit={submitForm} className="space-y-6">
            
            {/* Target and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <Target size={16} /> Exam Target
                </label>
                <select 
                  className="flex h-10 w-full rounded-sm border border-bg-tertiary bg-bg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary transition-colors"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  {EXAM_TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {target === "Custom" && (
                  <Input 
                    placeholder="Enter custom target" 
                    value={customTarget}
                    onChange={(e) => setCustomTarget(e.target.value)}
                    className="mt-2"
                    required
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <CalendarDays size={16} /> Exam Date
                </label>
                <Input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Daily Hours */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary flex items-center justify-between">
                <span className="flex items-center gap-2"><Clock size={16} /> Daily Study Hours</span>
                <span className="text-accent-warm font-bold">{hours} hrs</span>
              </label>
              <input 
                type="range" 
                min="1" max="12" 
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-warm"
              />
            </div>

            {/* Subjects */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <BookOpen size={16} /> Subjects to Cover
              </label>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. Physics, Modern History (Press Enter)"
                  value={subjInput}
                  onChange={(e) => setSubjInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubject(e)}
                />
                <Button type="button" onClick={handleAddSubject} variant="secondary">Add</Button>
              </div>

              {subjects.length > 0 && (
                <div className="space-y-3 mt-4 border border-bg-tertiary rounded-md p-4 bg-bg">
                  {subjects.map((subj) => (
                    <div key={subj.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-bg-secondary rounded-sm border border-bg-tertiary">
                      <div className="font-medium flex items-center gap-2">
                        {subj.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <select 
                          className="h-8 rounded-sm border border-bg-tertiary bg-bg px-2 text-xs focus-visible:outline-none focus:border-text-primary"
                          value={subj.level}
                          onChange={(e) => updateSubjectLevel(subj.name, e.target.value)}
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-text-secondary hover:text-accent-terracotta"
                          onClick={() => handleRemoveSubject(subj.name)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-sm text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <Button type="submit" className="w-full py-6 text-lg tracking-wide border-t-2 border-t-white/10" variant="default">
              Generate AI Study Plan
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Planner() {
  const { studyProfile, setStudyProfile, studyPlan, setStudyPlan, completedSessions, toggleSessionComplete, quizzesTaken, accuracy } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rebalanceMsg, setRebalanceMsg] = useState("");
  const [isEditing, setIsEditing] = useState(!studyProfile);

  const todayStr = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()] || "Monday";

  useEffect(() => {
    if (studyProfile && !isEditing && !studyPlan && !loading && !error) {
      handleGeneratePlan(studyProfile);
    }
  }, [studyProfile, studyPlan, isEditing]);

  const handleGeneratePlan = async (profile, isRebalance = false) => {
    setLoading(true);
    setError("");
    setRebalanceMsg("");
    try {
      let perfData = null;
      if (isRebalance) {
        perfData = { quizzesTaken, accuracy };
      }
      
      const newPlan = await generateStudyPlan(profile, perfData);
      setStudyPlan(newPlan);
      
      if (isRebalance) {
        setRebalanceMsg("Plan successfully rebalanced based on your recent quiz performance.");
        setTimeout(() => setRebalanceMsg(""), 5000);
      }
    } catch (err) {
      setError(err.message || "Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getDayPlan = (dayName) => {
    return studyPlan?.weeklySchedule?.find(d => d.day === dayName) || { day: dayName, sessions: [] };
  };

  const todayPlan = getDayPlan(todayStr);

  const getTypeColor = (type) => {
    const t = type?.toLowerCase();
    if (t?.includes('learn')) return 'border-[#3D7A5E] text-[#3D7A5E]';
    if (t?.includes('practice') && !t?.includes('review')) return 'border-[#C9622F] text-[#C9622F]';
    if (t?.includes('revise') || t?.includes('review')) return 'border-[#2C6FA6] text-[#2C6FA6]';
    return 'border-[#9C9A94] text-[#9C9A94]';
  };

  const getLeftBorderColor = (type) => {
    const t = type?.toLowerCase();
    if (t?.includes('learn')) return 'border-l-[#3D7A5E]';
    if (t?.includes('practice') && !t?.includes('review')) return 'border-l-[#C9622F]';
    if (t?.includes('revise') || t?.includes('review')) return 'border-l-[#2C6FA6]';
    return 'border-l-[#9C9A94]';
  };

  if (!studyProfile || isEditing) {
    return (
      <div className="w-full">
        <OnboardingForm 
          initialData={studyProfile}
          onSubmit={(p) => {
            setStudyProfile(p);
            setStudyPlan(null);
            setIsEditing(false);
          }} 
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="animate-spin text-accent-warm" size={40} />
        <h2 className="text-xl font-serif font-bold text-text-primary">
          {studyPlan ? "Analyzing performance & rebalancing..." : "Crafting your personalized schedule..."}
        </h2>
        <p className="text-sm text-text-secondary">This might take a few moments</p>
      </div>
    );
  }

  if (error && !studyPlan) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 max-w-md mx-auto text-center">
        <AlertCircle className="text-accent-terracotta" size={48} />
        <h2 className="text-xl font-bold text-text-primary">Generation Failed</h2>
        <p className="text-text-secondary">{error}</p>
        <Button onClick={() => handleGeneratePlan(studyProfile)}>Try Again</Button>
        <Button variant="ghost" onClick={() => setStudyProfile(null)}>Reset Profile</Button>
      </div>
    );
  }

  if (!studyPlan) return null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-[40px] pb-12 w-full max-w-[1200px] mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#111110] leading-tight mb-1">Study Planner</h1>
          <p className="text-[14px] text-[#5C5B57]">
            Targeting {studyProfile.examTarget} • {studyProfile.dailyHours}hrs/day
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsEditing(true)}
             className="bg-transparent border border-[#E8E6E1] text-[#5C5B57] text-[13px] h-9 px-4 rounded-lg hover:bg-[#F2F1EE] transition-colors font-medium"
           >
             Edit Profile
           </button>
           <button 
             onClick={() => handleGeneratePlan(studyProfile, true)} 
             className="bg-[#111110] text-white text-[13px] h-9 px-4 rounded-lg flex items-center gap-[6px] hover:opacity-90 transition-opacity font-medium"
           >
             <RefreshCw size={14} className="text-white" /> Rebalance Plan
           </button>
        </div>
      </div>

      {rebalanceMsg && (
        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="bg-[#E8F0E4] border border-[#C5D9BE] text-[#2C4A22] p-4 rounded-[8px] flex items-center gap-3 mb-[-20px]">
          <CheckCircle2 size={18} /> <span className="text-[13px]">{rebalanceMsg}</span>
        </motion.div>
      )}

      {/* Today's Focus */}
      <motion.section variants={itemVariants}>
        <h2 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#9C9A94] mb-4 flex items-center gap-2">
          <Target size={14} className="text-[#9C9A94]" /> Today's Focus ({todayStr})
        </h2>
        
        {todayPlan.sessions.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-dashed border-[#E8E6E1] rounded-[10px] p-8 text-center text-[#5C5B57] text-[14px]">
            No sessions scheduled for today. Enjoy your break!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayPlan.sessions.map((session, idx) => {
              const sessionKey = `${todayStr}-${session.topic}-${idx}`;
              const isDone = completedSessions.includes(sessionKey);
              
              return (
                <div key={idx} className={`shadow-none rounded-[10px] bg-[#FFFFFF] border border-[#E8E6E1] border-l-[3px] p-4 flex flex-col h-full transition-opacity duration-300 ${isDone ? 'opacity-60 bg-[#FAFAF8]' : ''} ${getLeftBorderColor(session.type)}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] uppercase tracking-[0.1em] font-medium border px-2 py-[2px] rounded-full bg-transparent ${getTypeColor(session.type)}`}>
                      {session.type}
                    </span>
                    <span className="text-[12px] text-[#9C9A94]">
                      {session.duration} min
                    </span>
                  </div>
                  <div className={`text-[17px] font-semibold text-[#111110] mb-1 ${isDone ? 'line-through text-[#5C5B57]' : ''}`}>{session.subject}</div>
                  <div className={`text-[13px] text-[#5C5B57] leading-[1.5] mb-4 flex-1 ${isDone ? 'line-through opacity-80' : ''}`}>
                    {session.topic}
                  </div>
                  
                  <button 
                    className={`flex items-center justify-center gap-[6px] w-full h-9 rounded-lg text-[13px] font-medium transition-colors ${
                      isDone 
                        ? 'bg-[#F2F1EE] border border-[#3D7A5E] text-[#3D7A5E]' 
                        : 'bg-transparent border-[1.5px] border-[#E8E6E1] text-[#5C5B57] hover:bg-[#F2F1EE] hover:border-[#D4D2CC]'
                    }`}
                    onClick={() => toggleSessionComplete(sessionKey)}
                  >
                    {isDone ? (
                      <><Check size={14} strokeWidth={3} /> Completed</>
                    ) : (
                      <><Circle size={14} strokeWidth={2} /> Mark as Done</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* Week Grid & Layout Split */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
        
        {/* Weekly Schedule */}
        <motion.section variants={itemVariants}>
          <h2 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#9C9A94] mb-4 flex items-center gap-2">
            <CalendarDays size={14} className="text-[#9C9A94]" /> This Week's Schedule
          </h2>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[760px]">
              {studyPlan.weeklySchedule?.map((dayPlan) => (
                <div key={dayPlan.day} className="flex-1 min-w-[124px]">
                  <div className={`text-[11px] font-semibold tracking-[0.1em] uppercase mb-3 pb-2 ${
                    dayPlan.day === todayStr 
                      ? 'text-[#111110] border-b-[2px] border-[#C9622F]' 
                      : 'text-[#9C9A94]'
                  }`}>
                    {dayPlan.day?.slice(0,3) || "DAY"}
                  </div>
                  <div className="space-y-[6px]">
                    {dayPlan.sessions.map((s, idx) => (
                      <div key={idx} className="bg-[#FAFAF8] border border-[#E8E6E1] rounded-lg px-[12px] py-[10px] shadow-none">
                        <div className="text-[13px] font-semibold text-[#111110] mb-0.5 truncate" title={s.subject}>{s.subject}</div>
                        <div className="text-[11px] text-[#9C9A94] truncate" title={s.topic}>
                           {s.duration}m · {s.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Stats & Milestones */}
        <motion.div variants={itemVariants} className="space-y-[40px]">
          
          <section>
            <h2 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#9C9A94] mb-4">
              Subject Weightage
            </h2>
            <div className="space-y-[14px]">
              {studyPlan.subjectWeightage && Object.entries(studyPlan.subjectWeightage).map(([subj, val], i) => (
                <div key={subj}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[13px] font-medium text-[#111110]">{subj}</span>
                    <span className="text-[12px] font-medium text-[#5C5B57]">{val}%</span>
                  </div>
                  <div className="h-[6px] w-full bg-[#E8E6E1] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
                      className="h-full bg-[#C9622F] rounded-full filter contrast-125"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
             <h2 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#9C9A94] mb-4">
              Milestones
            </h2>
            <div className="relative border-l flex flex-col border-[#E8E6E1] ml-1.5 space-y-[20px] pb-2">
              {studyPlan.milestones?.map((m, i) => (
                <div key={i} className="relative pl-5">
                  <div className={`absolute w-2 h-2 rounded-full -left-[4.5px] top-[4px] border ${i === 0 ? 'bg-[#C9622F] border-[#C9622F]' : 'bg-[#E8E6E1] border-transparent'}`} />
                  <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#9C9A94] mb-1">Week {m.week}</div>
                  <div className="text-[13px] text-[#5C5B57] leading-[1.5]">{m.goal}</div>
                </div>
              ))}
            </div>
          </section>

        </motion.div>
      </div>
      
    </motion.div>
  );
}
