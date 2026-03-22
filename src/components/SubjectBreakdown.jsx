import React, { useMemo } from 'react';
import { useStore } from '../lib/store';
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';

export default function SubjectBreakdown() {
  const store = useStore();

  const subjects = useMemo(() => {
    if (!store.quizResults || store.quizResults.length === 0) return [];

    const map = new Map();

    store.quizResults.forEach((q) => {
      const topic = q.topic || 'General';
      if (!map.has(topic)) {
        map.set(topic, { topic, total: 0, correct: 0, history: [] });
      }
      const data = map.get(topic);
      data.total += q.total;
      data.correct += q.score;
      data.history.push(q.score / q.total);
    });

    return Array.from(map.values()).map(sub => {
      const accuracy = sub.total > 0 ? (sub.correct / sub.total) * 100 : 0;
      
      let trend = 'same';
      if (sub.history.length >= 2) {
        // Split history in halves to check trend
        const mid = Math.floor(sub.history.length / 2);
        const firstHalf = sub.history.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
        const secondHalf = sub.history.slice(mid).reduce((a, b) => a + b, 0) / (sub.history.length - mid);
        if (secondHalf > firstHalf + 0.05) trend = 'up';
        else if (secondHalf < firstHalf - 0.05) trend = 'down';
      }

      return {
        name: sub.topic,
        attempts: sub.history.length,
        accuracy: Math.round(accuracy),
        trend
      };
    }).sort((a, b) => b.attempts - a.attempts); // sort by most tested
  }, [store.quizResults]);

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-center border border-bg-tertiary bg-bg rounded-lg p-6">
        <p className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-1">No Data Yet</p>
        <p className="text-xs text-text-tertiary">Take a quiz to see your subject breakdown.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {subjects.slice(0, 5).map((subject, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-text-primary capitalize truncate">{subject.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-tertiary">{subject.attempts} quizzes</span>
              <span className="font-bold text-text-primary w-10 text-right">{subject.accuracy}%</span>
              {subject.trend === 'up' && <ArrowUp size={14} className="text-success" />}
              {subject.trend === 'down' && <ArrowDown size={14} className="text-error" />}
              {subject.trend === 'same' && <ArrowRight size={14} className="text-text-tertiary" />}
            </div>
          </div>
          <div className="h-1.5 w-full bg-bg-tertiary rounded-full overflow-hidden">
            <div 
              className="h-full bg-text-primary transition-all duration-1000 ease-out"
              style={{ width: `${subject.accuracy}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}
