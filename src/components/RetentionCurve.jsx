import React, { useMemo } from 'react';
import { useStore } from '../lib/store';
import { motion } from 'framer-motion';

export default function RetentionCurve() {
  const store = useStore();
  
  // Calculate average stability from user's flashcards
  const avgStability = useMemo(() => {
    let totalS = 0;
    let count = 0;
    store.decks.forEach(deck => {
      deck.cards.forEach(c => {
        // Fallback to 1 if stability is missing or 0
        const stability = c.card?.stability || 1; 
        totalS += stability;
        count++;
      });
    });
    return count > 0 ? Math.max(1, totalS / count) : 1;
  }, [store.decks]);

  // SVG Dimensions & Scales
  const width = 600;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // X maps days (0-30), Y maps retention (0-100)
  const getX = (day) => padding.left + (day / 30) * graphWidth;
  const getY = (retention) => padding.top + graphHeight - (retention / 100) * graphHeight;

  // Generate path data
  const generatePath = (sValue) => {
    let d = `M ${getX(0)} ${getY(100)}`;
    for (let day = 1; day <= 30; day++) {
      const retention = 100 * Math.exp(-day / sValue);
      d += ` L ${getX(day)} ${getY(retention)}`;
    }
    return d;
  };

  const ebbinghausPath = generatePath(1); // Baseline: rapid forgetting
  const userPath = generatePath(Math.max(2, avgStability * 1.5)); // Exaggerate slightly for visual distinction

  // Generate some simulated data dots for the user curve
  const dataPoints = [2, 7, 14, 21].map(day => ({
    x: getX(day),
    y: getY(100 * Math.exp(-day / Math.max(2, avgStability * 1.5))),
  }));

  // Gradient path adds bottom corners to close the shape
  const userFillPath = `${userPath} L ${getX(30)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`;

  return (
    <div className="w-full flex justify-center items-center py-4 bg-bg rounded-lg border border-bg-tertiary">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full max-w-full h-auto text-text-primary"
      >
        <defs>
          <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" className="text-accent-warm" stopOpacity="0.2" />
            <stop offset="100%" stopColor="currentColor" className="text-accent-warm" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Axes */}
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="currentColor" strokeWidth="1" className="text-bg-tertiary" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="currentColor" strokeWidth="1" className="text-bg-tertiary" />

        {/* Y Axis Labels (0, 50, 100) */}
        {[0, 50, 100].map(val => (
          <text key={val} x={padding.left - 10} y={getY(val)} fill="currentColor" fontSize="10" textAnchor="end" alignmentBaseline="middle" className="text-text-tertiary">
            {val}%
          </text>
        ))}

        {/* X Axis Labels (0, 10, 20, 30 days) */}
        {[0, 10, 20, 30].map(val => (
          <text key={val} x={getX(val)} y={height - padding.bottom + 15} fill="currentColor" fontSize="10" textAnchor="middle" className="text-text-tertiary">
            {val}d
          </text>
        ))}

        {/* Ebbinghaus Baseline Curve */}
        <path 
          d={ebbinghausPath} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeDasharray="4 4"
          className="text-text-tertiary opacity-40" 
        />

        {/* User Fill Area */}
        <path 
          d={userFillPath} 
          fill="url(#curveFill)" 
        />

        {/* User Actual Curve */}
        <motion.path 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          d={userPath} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          className="text-accent-warm" 
        />

        {/* Data points */}
        {dataPoints.map((pt, i) => (
          <motion.circle 
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1 + i * 0.1, duration: 0.3 }}
            cx={pt.x} 
            cy={pt.y} 
            r="4" 
            fill="currentColor" 
            className="text-bg"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: 'var(--color-accent-warm)' }}
          />
        ))}
      </svg>
      
      {/* Legend */}
      <div className="absolute top-6 right-6 flex flex-col gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-accent-warm rounded-full"></div>
          <span className="text-text-secondary font-medium">Your Retention</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0 border-t border-dashed border-text-tertiary"></div>
          <span className="text-text-tertiary">Expected Drop-off</span>
        </div>
      </div>
    </div>
  );
}
