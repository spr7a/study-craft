import React, { useMemo } from 'react';
import { useStore } from '../lib/store';


export default function ActivityHeatmap() {
  const store = useStore();
  
  // Create the 12-week grid (12 cols x 7 rows)
  const grid = useMemo(() => {
    const WEEKS = 12;
    const DAYS = 7;
    const today = new Date();
    
    // Go back (12 * 7) - 1 days to start
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (WEEKS * DAYS - 1));
    
    const days = [];
    for (let i = 0; i < WEEKS * DAYS; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const count = store.studyActivityLog?.[dateStr] || 0;
      
      days.push({
        date: d,
        dateStr,
        count
      });
    }

    // Rearrange into weeks (columns) where each col has 7 days
    const cols = [];
    for(let w = 0; w < WEEKS; w++) {
      cols.push(days.slice(w * DAYS, (w + 1) * DAYS));
    }
    return cols;
  }, [store.studyActivityLog]);

  const getColor = (count) => {
    if (count === 0) return 'bg-bg-tertiary border-bg/50';
    if (count <= 2) return 'bg-accent-warm/20 border-accent-warm/30';
    if (count <= 5) return 'bg-accent-warm/50 border-accent-warm/60';
    if (count <= 10) return 'bg-accent-warm/80 border-accent-warm/90';
    return 'bg-accent-warm border-accent-warm shadow-[0_0_8px_rgba(242,125,76,0.5)]'; // 10+
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // Note: Just showing "Last 3 months" effectively
  
  return (
    <div className="flex flex-col w-full overflow-x-auto pb-2">
      <div className="flex w-full items-end gap-2 text-[10px] text-text-tertiary font-medium uppercase tracking-wider mb-2">
        <div className="w-6"></div> {/* Label offset */}
        {grid.map((col, i) => {
          // Show month label roughly at the start of the month
          const isFirstWeekOfMonth = col[0].date.getDate() <= 7;
          return (
            <div key={`ml-${i}`} className="flex-1 w-4 opacity-70">
              {isFirstWeekOfMonth ? monthNames[col[0].date.getMonth()] : ''}
            </div>
          );
        })}
      </div>
      
      <div className="flex gap-2 min-w-max">
        <div className="flex flex-col justify-between text-[10px] text-text-tertiary font-medium uppercase tracking-wider py-1.5 w-6">
          <span className="opacity-0">Sun</span>
          <span className="opacity-70">Mon</span>
          <span className="opacity-0">Tue</span>
          <span className="opacity-70">Wed</span>
          <span className="opacity-0">Thu</span>
          <span className="opacity-70">Fri</span>
          <span className="opacity-0">Sat</span>
        </div>
        
        {grid.map((week, wIndex) => (
          <div key={`w-${wIndex}`} className="flex flex-col gap-1.5">
            {week.map((day, dIndex) => (
              <div 
                key={day.dateStr}
                title={`${day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${day.count} sessions`}
                className={`w-[14px] h-[14px] rounded-[3px] border ${getColor(day.count)} transition-all hover:scale-125 hover:z-10 cursor-crosshair`}
              />
            ))}
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-2 mt-4 text-[10px] text-text-tertiary self-end font-medium">
        <span>Less</span>
        <div className={`w-[12px] h-[12px] rounded-[2px] ${getColor(0)}`}></div>
        <div className={`w-[12px] h-[12px] rounded-[2px] ${getColor(2)}`}></div>
        <div className={`w-[12px] h-[12px] rounded-[2px] ${getColor(5)}`}></div>
        <div className={`w-[12px] h-[12px] rounded-[2px] ${getColor(10)}`}></div>
        <div className={`w-[12px] h-[12px] rounded-[2px] ${getColor(15)}`}></div>
        <span>More</span>
      </div>
    </div>
  );
}
