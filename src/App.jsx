import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { BookOpen, BrainCircuit, PlaySquare, GraduationCap, Layers, LayoutDashboard, LayoutList } from 'lucide-react';
import { seedDemoData } from './lib/seedData';

if (!localStorage.getItem('studycraft_seeded_v2')) {
  seedDemoData();
  localStorage.setItem('studycraft_seeded_v2', 'true');
}
import Dashboard from './components/Dashboard';
import AITutor from './components/AITutor';
import QuizGenerator from './components/QuizGenerator';
import VideoProcessor from './components/VideoProcessor';
import SpacedRepetition from './components/SpacedRepetition';
import Planner from './components/Planner';
import PomodoroTimer from './components/PomodoroTimer';
import { cn } from './lib/utils';

function Sidebar() {
  const location = useLocation();
  const path = location.pathname;

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tutor', icon: BrainCircuit, label: 'AI Tutor' },
    { to: '/quiz', icon: BookOpen, label: 'Adaptive Practice' },
    { to: '/planner', icon: LayoutList, label: 'Planner', isNew: true },
    { to: '/video', icon: PlaySquare, label: 'Video Library' },
    { to: '/spaced', icon: Layers, label: 'Spaced Repetition' },
  ];

  return (
    <div className="w-64 bg-bg-secondary border-r border-bg-tertiary flex flex-col pt-8 pb-6 px-4">
      <div className="flex items-center gap-3 text-text-primary font-serif font-bold text-2xl mb-12 px-2 select-none">
        StudyCraft
      </div>
      
      <nav className="flex-1 space-y-1">
        {links.map(({ to, icon: Icon, label, isNew }) => {
          const isActive = path === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200",
                isActive 
                  ? "text-text-primary font-medium" 
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-text-primary" : "text-text-secondary"} />
              <div className="flex items-center gap-2 flex-1">
                <span className={cn(isActive && "underline underline-offset-4 decoration-2 decoration-text-primary")}>
                  {label}
                </span>
                {isNew && (
                  <span className="text-[9px] font-bold bg-accent-terracotta text-white px-1.5 py-0.5 rounded-sm tracking-wider uppercase ml-auto">
                    New
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto px-3 py-4">
         <div className="text-[10px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-1">Project</div>
         <div className="text-sm font-medium text-text-primary">Refined Learning</div>
         <div className="flex items-center gap-2 mt-1">
            <div className="text-xs text-text-secondary">Version 2.0</div>
            <button 
              onClick={() => {
                localStorage.removeItem('studycraft_seeded_v2');
                seedDemoData();
                window.location.reload();
              }}
              className="text-[11px] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              Reset Demo
            </button>
         </div>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        localStorage.removeItem('studycraft_seeded_v2');
        seedDemoData();
        window.location.reload();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-bg text-text-primary font-sans selection:bg-accent-warm selection:text-white">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-y-auto w-full relative">
          <div className="p-8 md:p-12 max-w-[1100px] w-full mx-auto relative z-10 flex-1 animate-fade-up">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tutor" element={<AITutor />} />
              <Route path="/quiz" element={<QuizGenerator />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/video" element={<VideoProcessor />} />
              <Route path="/spaced" element={<SpacedRepetition />} />
            </Routes>
          </div>
          <PomodoroTimer />
        </main>
      </div>
    </Router>
  );
}
