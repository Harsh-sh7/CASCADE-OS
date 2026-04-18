'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface LogEntry {
  date: string;
  morningState: {
    sleep: number;
    energy: number;
    focus: number;
    stress: number;
    timeAvailable: number;
    health: number;
    social: number;
  };
  systemAnalysis: {
    bottleneck: string;
    mode: string;
  };
}

const DOMAIN_COLORS: Record<string, string> = {
  sleep: '#7c6af7',
  energy: '#f59e0b',
  focus: '#10b981',
  stress: '#ef4444',
  health: '#06b6d4',
  social: '#a78bfa',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#131318] border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-slate-400 text-xs mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
            {p.dataKey}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function HistoryPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'chart' | 'list'>('chart');
  const [activeLines, setActiveLines] = useState(['sleep', 'energy', 'focus', 'stress']);

  useEffect(() => {
    fetch('/api/history').then(r => r.json()).then(d => {
      setLogs((d.logs || []).reverse());
      setLoading(false);
    });
  }, []);

  const chartData = logs.map(l => ({
    date: l.date.slice(5), // MM-DD
    sleep: l.morningState.sleep,
    energy: l.morningState.energy,
    focus: l.morningState.focus,
    stress: l.morningState.stress,
    health: l.morningState.health,
    social: l.morningState.social,
    bottleneck: l.systemAnalysis.bottleneck,
    mode: l.systemAnalysis.mode,
  }));

  const bottleneckFreq = logs.reduce<Record<string, number>>((acc, l) => {
    const b = l.systemAnalysis.bottleneck;
    acc[b] = (acc[b] || 0) + 1;
    return acc;
  }, {});
  const topBottleneck = Object.entries(bottleneckFreq).sort((a, b) => b[1] - a[1])[0];

  const toggleLine = (key: string) => {
    setActiveLines(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 rounded bg-[#7c6af7] animate-pulse" />
    </div>
  );

  return (
    <div className="pt-8 pb-4 space-y-5 animate-fade-in">
      <div>
        <p className="text-[#7c6af7] text-[10px] font-semibold tracking-widest uppercase mb-1">Pattern Detection</p>
        <h1 className="text-xl font-bold text-slate-100">History</h1>
        <p className="text-slate-500 text-sm mt-1">Last {logs.length} days of system data.</p>
      </div>

      {logs.length === 0 ? (
        <div className="surface rounded-2xl p-8 text-center">
          <p className="text-slate-400 text-sm">No data yet. Complete a check-in to start tracking.</p>
        </div>
      ) : (
        <>
          {/* Stats strip */}
          {topBottleneck && (
            <div className="grid grid-cols-2 gap-3">
              <div className="surface rounded-xl p-4">
                <p className="text-slate-500 text-xs mb-1">Most frequent bottleneck</p>
                <p className="text-[#a78bfa] font-bold capitalize">{topBottleneck[0]}</p>
                <p className="text-slate-600 text-xs">{topBottleneck[1]} of {logs.length} days</p>
              </div>
              <div className="surface rounded-xl p-4">
                <p className="text-slate-500 text-xs mb-1">Days tracked</p>
                <p className="text-slate-100 font-bold">{logs.length}</p>
                <p className="text-slate-600 text-xs">Total check-ins</p>
              </div>
            </div>
          )}

          {/* Toggle view */}
          <div className="flex items-center gap-2 surface rounded-xl p-1">
            <button onClick={() => setView('chart')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${view === 'chart' ? 'bg-[#7c6af7] text-white' : 'text-slate-400'}`}>Chart</button>
            <button onClick={() => setView('list')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${view === 'list' ? 'bg-[#7c6af7] text-white' : 'text-slate-400'}`}>Log</button>
          </div>

          {view === 'chart' && (
            <div className="surface rounded-2xl p-4">
              {/* Domain toggles */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(DOMAIN_COLORS).map(([key, color]) => (
                  <button
                    key={key}
                    onClick={() => toggleLine(key)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all"
                    style={{
                      background: activeLines.includes(key) ? `${color}20` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${activeLines.includes(key) ? color + '50' : 'rgba(255,255,255,0.08)'}`,
                      color: activeLines.includes(key) ? color : '#64748b',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    {key}
                  </button>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis domain={[1, 10]} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  {Object.entries(DOMAIN_COLORS).map(([key, color]) =>
                    activeLines.includes(key) ? (
                      <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
                    ) : null
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {view === 'list' && (
            <div className="space-y-3">
              {[...logs].reverse().map(log => {
                const modeCls = log.systemAnalysis.mode === 'TRIAGE' ? 'text-red-400' : log.systemAnalysis.mode === 'CONTAINMENT' ? 'text-amber-400' : 'text-emerald-400';
                return (
                  <div key={log.date} className="surface rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-300 text-sm font-medium">{log.date}</p>
                      <span className={`text-xs font-bold ${modeCls}`}>{log.systemAnalysis.mode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">Bottleneck:</span>
                      <span className="text-[#a78bfa] text-xs font-medium capitalize">{log.systemAnalysis.bottleneck}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(log.morningState).map(([k, v]) => (
                        <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500">
                          {k}: <span className="text-slate-300">{v}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
