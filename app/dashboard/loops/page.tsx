'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Loop {
  name: string;
  breakPoint: string;
  action: string;
}

const LOOP_DESCRIPTIONS: Record<string, { desc: string; emoji: string; color: string }> = {
  'Burnout Spiral': {
    desc: 'Low energy + low health + high stress form a self-reinforcing loop. Output declines, stress rises, recovery shrinks.',
    emoji: '🔥',
    color: '#ef4444',
  },
  'Avoidance Trap': {
    desc: 'High stress suppresses focus, which tanks output, which increases stress. Classic stuck cycle.',
    emoji: '🌀',
    color: '#f59e0b',
  },
  'Social Withdrawal': {
    desc: 'Low energy reduces social interaction, which increases cortisol, which further depletes energy.',
    emoji: '🪢',
    color: '#a78bfa',
  },
};

export default function LoopsPage() {
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLog, setHasLog] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(data => {
      setHasLog(data.hasActiveLog);
      if (data.log?.systemAnalysis?.loops?.length) {
        // Re-construct loop objects from names (the API only stores names)
        const loopData: Loop[] = data.log.systemAnalysis.loops.map((name: string) => {
          const presets: Record<string, { breakPoint: string; action: string }> = {
            'Burnout Spiral': { breakPoint: 'sleep', action: 'Enforce hard cut-off for work today. Zero output expectations.' },
            'Avoidance Trap': { breakPoint: 'focus', action: 'Complete ONE microscopic task completely unrelated to the main stressor.' },
            'Social Withdrawal': { breakPoint: 'social', action: 'Send ONE low-friction message to a friend. No response required.' },
          };
          return { name, ...presets[name] };
        });
        setLoops(loopData);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 rounded bg-[#7c6af7] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="pt-8 pb-4 space-y-5 animate-fade-in">
      <div>
        <p className="text-[#7c6af7] text-[10px] font-semibold tracking-widest uppercase mb-1">Loop Detection</p>
        <h1 className="text-xl font-bold text-slate-100">Failure Loops</h1>
        <p className="text-slate-500 text-sm mt-1">Self-reinforcing cycles that trap your system.</p>
      </div>

      {!hasLog && (
        <div className="surface rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-sm">Complete today's check-in to see active loops.</p>
        </div>
      )}

      {hasLog && loops.length === 0 && (
        <div className="rounded-2xl bg-emerald-950/30 border border-emerald-500/20 p-6 text-center">
          <p className="text-emerald-400 font-semibold mb-1">No active loops detected</p>
          <p className="text-emerald-400/60 text-sm">Your system is not in a feedback trap today.</p>
        </div>
      )}

      {loops.map(loop => {
        const meta = LOOP_DESCRIPTIONS[loop.name] ?? { desc: '', emoji: '⚠️', color: '#ef4444' };
        return (
          <div
            key={loop.name}
            className="rounded-2xl bg-[#0f0f1a] border p-5 space-y-4"
            style={{ borderColor: `${meta.color}30` }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{meta.emoji}</span>
              <div className="flex-1">
                <p className="font-bold text-slate-100">{loop.name}</p>
                <p className="text-slate-400 text-sm leading-relaxed mt-1">{meta.desc}</p>
              </div>
            </div>

            <div
              className="rounded-xl p-4 space-y-2"
              style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}20` }}
            >
              <div className="flex items-center gap-2">
                <RefreshCcw className="w-3.5 h-3.5" style={{ color: meta.color }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
                  Break Point: {loop.breakPoint}
                </p>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{loop.action}</p>
            </div>
          </div>
        );
      })}

      {/* All 3 loop definitions shown for awareness */}
      <div>
        <p className="text-slate-600 text-xs uppercase tracking-widest mb-4">All known loops</p>
        {Object.entries(LOOP_DESCRIPTIONS).map(([name, meta]) => (
          <div key={name} className="surface rounded-xl p-4 mb-3 flex items-start gap-3">
            <span className="text-xl">{meta.emoji}</span>
            <div>
              <p className="text-slate-300 font-medium text-sm">{name}</p>
              <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{meta.desc}</p>
            </div>
            {loops.find(l => l.name === name) && (
              <span className="ml-auto">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
