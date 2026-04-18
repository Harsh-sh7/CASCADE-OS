'use client';

import { useEffect, useState } from 'react';
import { Trophy, Flame, Star, Shield, RefreshCw } from 'lucide-react';

const LEVELS = [
  { name: 'Observer', minXp: 0 },
  { name: 'Operator', minXp: 200 },
  { name: 'Architect', minXp: 500 },
  { name: 'System Administrator', minXp: 1000 },
  { name: 'Cascade Master', minXp: 2000 },
];

const BADGE_META: Record<string, { icon: string; desc: string; color: string }> = {
  'First Fix':        { icon: '🔧', desc: 'Completed your first action recommendation.', color: '#10b981' },
  'Loop Breaker':     { icon: '🔓', desc: 'Broke an active failure loop.', color: '#7c6af7' },
  'Counterintuitive': { icon: '🎯', desc: 'Followed a counterintuitive recommendation.', color: '#a78bfa' },
  'Ghost Protocol':   { icon: '👻', desc: 'System entered Ghost Protocol. Rebuilding trust.', color: '#ef4444' },
  'Comeback Kid':     { icon: '⚡', desc: 'Returned after Ghost Protocol. Rare.', color: '#f59e0b' },
};

export default function ProgressPage() {
  const [gamification, setGamification] = useState<{ xp: number; level: string; streaks: number; badges: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      setGamification(d.gamification);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 rounded bg-[#7c6af7] animate-pulse" />
    </div>
  );

  if (!gamification) return null;

  const currentLevelIdx = LEVELS.findLastIndex(l => gamification.xp >= l.minXp);
  const currentLevel = LEVELS[currentLevelIdx];
  const nextLevel = LEVELS[currentLevelIdx + 1];
  const xpToNext = nextLevel ? nextLevel.minXp - gamification.xp : 0;
  const progressPct = nextLevel
    ? ((gamification.xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100
    : 100;

  return (
    <div className="pt-8 pb-4 space-y-5 animate-fade-in">
      <div>
        <p className="text-[#7c6af7] text-[10px] font-semibold tracking-widest uppercase mb-1">Gamification</p>
        <h1 className="text-xl font-bold text-slate-100">Progress</h1>
      </div>

      {/* Level card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#7c6af7]/20 to-[#0f0f1a] border border-[#7c6af7]/30 p-5 glow-purple">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-slate-400 text-xs mb-1">Current Level</p>
            <p className="text-slate-50 text-xl font-black">{gamification.level}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-[#7c6af7]/20 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-[#7c6af7]" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400 text-xs">{gamification.xp} XP</span>
            {nextLevel && <span className="text-slate-500 text-xs">{nextLevel.minXp} XP → {nextLevel.name}</span>}
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7c6af7] to-[#a78bfa] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
          {nextLevel && (
            <p className="text-slate-500 text-xs">{xpToNext} XP to {nextLevel.name}</p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="surface rounded-xl p-4 text-center">
          <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <p className="text-slate-100 font-bold text-lg">{gamification.streaks}</p>
          <p className="text-slate-500 text-xs">Streak</p>
        </div>
        <div className="surface rounded-xl p-4 text-center">
          <Star className="w-5 h-5 text-[#7c6af7] mx-auto mb-1" />
          <p className="text-slate-100 font-bold text-lg">{gamification.xp}</p>
          <p className="text-slate-500 text-xs">Total XP</p>
        </div>
        <div className="surface rounded-xl p-4 text-center">
          <Shield className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-slate-100 font-bold text-lg">{gamification.badges.length}</p>
          <p className="text-slate-500 text-xs">Badges</p>
        </div>
      </div>

      {/* Level roadmap */}
      <div>
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Level Roadmap</p>
        <div className="space-y-2">
          {LEVELS.map((lvl, i) => {
            const reached = gamification.xp >= lvl.minXp;
            const isCurrent = lvl.name === gamification.level;
            return (
              <div
                key={lvl.name}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  isCurrent ? 'bg-[#7c6af7]/10 border-[#7c6af7]/30' :
                  reached ? 'surface-elevated border-white/8' :
                  'bg-white/2 border-white/5'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  reached ? 'bg-[#7c6af7] text-white' : 'bg-white/8 text-slate-600'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isCurrent ? 'text-[#a78bfa]' : reached ? 'text-slate-300' : 'text-slate-600'}`}>
                    {lvl.name}
                  </p>
                  <p className="text-slate-600 text-xs">{lvl.minXp} XP</p>
                </div>
                {isCurrent && <span className="text-[#7c6af7] text-xs font-bold">YOU ARE HERE</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div>
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Badges</p>
        <div className="space-y-2">
          {Object.entries(BADGE_META).map(([name, meta]) => {
            const earned = gamification.badges.includes(name);
            return (
              <div
                key={name}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  earned ? 'surface-elevated border-white/12' : 'bg-white/2 border-white/5 opacity-40'
                }`}
              >
                <span className="text-2xl">{meta.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${earned ? 'text-slate-200' : 'text-slate-600'}`}>{name}</p>
                  <p className={`text-xs ${earned ? 'text-slate-400' : 'text-slate-700'}`}>{meta.desc}</p>
                </div>
                {earned && <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* XP guide */}
      <div className="surface rounded-xl p-4">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">How to earn XP</p>
        <div className="space-y-2">
          {[
            ['Check-in completed', '+20 XP'],
            ['Followed recommendation', '+50 XP'],
            ['Loop broken', '+75 XP'],
            ['Correct prediction', '+30 XP'],
            ['Streak bonus (per day)', '+5 XP'],
          ].map(([label, xp]) => (
            <div key={label} className="flex justify-between">
              <span className="text-slate-500 text-xs">{label}</span>
              <span className="text-[#7c6af7] text-xs font-bold">{xp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
