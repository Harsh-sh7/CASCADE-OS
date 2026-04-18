'use client';

import { useEffect, useState } from 'react';
import {
  Zap, Pause, Trash2, Users, AlertCircle
} from 'lucide-react';

interface Decision { do: string; delay: string[]; delegate: string[]; remove: string[]; }
interface DashboardData {
  hasActiveLog: boolean;
  log: {
    systemAnalysis: {
      decisions: Decision;
      dayType: { type: string; label: string; };
    };
  } | null;
}

export default function DecisionsPlannerView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-black font-mono">
        <div className="w-2 h-2 bg-white animate-pulse" />
      </div>
    );
  }

  if (!data?.hasActiveLog || !data.log) {
    return (
      <div className="flex flex-col justify-center min-h-screen px-8 bg-black font-mono">
        <div className="max-w-2xl mx-auto w-full text-center">
          <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">Decision layer offline. Intake required.</p>
        </div>
      </div>
    );
  }

  const { decisions, dayType } = data.log.systemAnalysis;

  return (
    <div className="min-h-screen bg-black font-mono p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-white tracking-tighter uppercase mb-2">Decision & Planning Layer</h1>
        <p className="text-zinc-500 text-sm">System-generated triage for your daily load. Operating in <span className="text-white font-bold">{dayType.label}</span>.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        
        {/* DO */}
        <div className="border border-white p-6 relative overflow-hidden group hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-white" />
            <h2 className="text-white font-bold tracking-widest uppercase">DO (Primary Action)</h2>
          </div>
          <p className="text-xl text-white font-medium mb-4">{decisions.do}</p>
          <div className="mt-auto pt-6 border-t border-zinc-800">
             <span className="text-zinc-500 text-xs tracking-widest uppercase">Required execution. Focus complete bandwidth here.</span>
          </div>
        </div>

        {/* DELAY */}
        <div className="border border-zinc-800 p-6 bg-zinc-900/40">
          <div className="flex items-center gap-2 mb-6">
            <Pause className="w-5 h-5 text-zinc-400" />
            <h2 className="text-zinc-400 font-bold tracking-widest uppercase">DEFER</h2>
          </div>
          <ul className="space-y-4">
            {decisions.delay.length === 0 ? <p className="text-zinc-600 italic">No deferrals necessary today.</p> : null}
            {decisions.delay.map((v, i) => (
              <li key={i} className="text-zinc-300 text-sm border-l-2 border-zinc-700 pl-4">{v}</li>
            ))}
          </ul>
        </div>

        {/* DELEGATE */}
        <div className="border border-zinc-800 p-6 bg-zinc-900/40">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-zinc-400" />
            <h2 className="text-zinc-400 font-bold tracking-widest uppercase">DELEGATE</h2>
          </div>
          <ul className="space-y-4">
            {decisions.delegate.length === 0 ? <p className="text-zinc-600 italic">Solo execution clear.</p> : null}
            {decisions.delegate.map((v, i) => (
              <li key={i} className="text-zinc-300 text-sm border-l-2 border-zinc-700 pl-4">{v}</li>
            ))}
          </ul>
        </div>

        {/* DELETE */}
        <div className="border border-zinc-800 p-6 bg-zinc-900/20">
          <div className="flex items-center gap-2 mb-6">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h2 className="text-red-500 font-bold tracking-widest uppercase">DROP (Remove)</h2>
          </div>
          <ul className="space-y-4">
            {decisions.remove.length === 0 ? <p className="text-zinc-600 italic">No drops required today.</p> : null}
            {decisions.remove.map((v, i) => (
              <li key={i} className="text-red-400 text-sm border-l-2 border-red-900 pl-4">{v}</li>
            ))}
          </ul>
          <div className="mt-8 pt-6 border-t border-zinc-900">
             <span className="text-zinc-600 text-[10px] tracking-widest uppercase">Actively dragging down bandwidth. Eliminate without guilt.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
