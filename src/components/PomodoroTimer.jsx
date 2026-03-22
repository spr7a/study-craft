import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Settings2, Play, Pause, RotateCcw, X, Check } from 'lucide-react';
import { useStore } from '../lib/store';

export default function PomodoroTimer() {
  const { pomodoro, updatePomodoro, addPomodoroSession } = useStore();
  const { timeLeft, isRunning, mode, focusDuration, breakDuration, sessionCount, isVisible } = pomodoro;

  const [showSettings, setShowSettings] = useState(false);
  const audioContextRef = useRef(null);
  const lastTimeRef = useRef(timeLeft);

  // Synchronize internal ref with state to avoid dependency issues in setInterval
  useEffect(() => {
    lastTimeRef.current = timeLeft;
  }, [timeLeft]);

  const playDing = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime); // subtle volume
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.log('Audio playback blocked');
    }
  };

  const getTotalTime = () => {
    if (mode === 'focus') return focusDuration * 60;
    if (mode === 'break') return breakDuration * 60;
    if (mode === 'longBreak') return 15 * 60;
    return 25 * 60;
  };

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        if (lastTimeRef.current > 0) {
          updatePomodoro({ timeLeft: lastTimeRef.current - 1 });
        } else {
          // Timer hit zero
          clearInterval(interval);
          playDing();
          
          if (mode === 'focus') {
            addPomodoroSession();
            const newCount = sessionCount + 1;
            // Every 4 pomodoros, suggest a long break
            if (newCount % 4 === 0) {
              updatePomodoro({ isRunning: false, mode: 'longBreak', timeLeft: 15 * 60 });
            } else {
              updatePomodoro({ isRunning: false, mode: 'break', timeLeft: breakDuration * 60 });
            }
          } else {
            // End of break, back to focus
            updatePomodoro({ isRunning: false, mode: 'focus', timeLeft: focusDuration * 60 });
          }
        }
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, mode, sessionCount, focusDuration, breakDuration, updatePomodoro, addPomodoroSession]);

  const toggleTimer = () => updatePomodoro({ isRunning: !isRunning });
  
  const resetTimer = () => {
    updatePomodoro({ isRunning: false, timeLeft: getTotalTime() });
  };

  // SVG Ring calculations
  const radius = 60;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (timeLeft / getTotalTime()) * circumference;

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  const modeLabel = mode === 'focus' ? 'Focus' : mode === 'break' ? 'Short Break' : 'Long Break';
  const accentColor = mode === 'focus' ? 'text-accent-terracotta stroke-accent-terracotta' : 'text-success stroke-success';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-[240px] bg-bg-secondary border border-bg-tertiary rounded-2xl shadow-md overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-bg-tertiary">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">{modeLabel}</span>
              <div className="flex gap-2 text-text-tertiary cursor-pointer">
                <button onClick={() => setShowSettings(!showSettings)} className="hover:text-text-primary transition-colors">
                  <Settings2 size={16} />
                </button>
                <button onClick={() => updatePomodoro({ isVisible: false })} className="hover:text-text-primary transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col items-center relative">
              {showSettings ? (
                <div className="w-full space-y-4 animate-fade-in text-sm text-text-primary">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block mb-2">Focus (min)</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[15, 25, 45, 60].map(val => (
                        <button
                          key={val}
                          onClick={() => {
                             updatePomodoro({ focusDuration: val, timeLeft: mode === 'focus' ? val * 60 : timeLeft });
                          }}
                          className={`py-1.5 rounded-md text-xs font-medium border ${focusDuration === val ? 'bg-text-primary text-white border-text-primary' : 'bg-bg border-bg-tertiary hover:bg-bg-tertiary text-text-secondary'}`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block mb-2">Break (min)</label>
                    <div className="grid grid-cols-3 gap-1">
                      {[5, 10, 15].map(val => (
                        <button
                          key={val}
                          onClick={() => {
                             updatePomodoro({ breakDuration: val, timeLeft: mode === 'break' ? val * 60 : timeLeft });
                          }}
                          className={`py-1.5 rounded-md text-xs font-medium border ${breakDuration === val ? 'bg-text-primary text-white border-text-primary' : 'bg-bg border-bg-tertiary hover:bg-bg-tertiary text-text-secondary'}`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="w-full mt-2 bg-bg-tertiary hover:bg-text-primary hover:text-white transition-colors py-2 rounded-md text-xs font-bold uppercase flex justify-center items-center gap-1">
                     <Check size={14} /> Done
                  </button>
                </div>
              ) : (
                <div className="animate-fade-in w-full text-center">
                  <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        className="text-bg-tertiary"
                      />
                      <circle
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        className={`transition-all duration-1000 ease-linear ${accentColor}`}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-3xl font-sans font-light tracking-tight text-text-primary">
                        {mins}:{secs}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-center gap-4">
                    <button 
                      onClick={toggleTimer} 
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 ${isRunning ? 'bg-text-primary text-white' : 'bg-bg text-text-primary border border-bg-tertiary shadow-sm'}`}
                    >
                      {isRunning ? <Pause size={18} className="ml-0.5" /> : <Play size={18} className="ml-1" />}
                    </button>
                    <button 
                      onClick={resetTimer} 
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-bg text-text-secondary border border-bg-tertiary shadow-sm transition-transform hover:scale-105"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                  
                  <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                    Pomodoro {sessionCount + 1} of 4
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => updatePomodoro({ isVisible: !isVisible })}
        className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
      >
        <Timer size={22} strokeWidth={2} />
      </button>
    </div>
  );
}
