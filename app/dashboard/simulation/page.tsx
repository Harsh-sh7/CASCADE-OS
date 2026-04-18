'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Lock, ChevronRight, Activity, FlaskConical } from 'lucide-react';
import { motion } from 'framer-motion';

const DOMAINS = ['sleep', 'work', 'money', 'energy', 'attention', 'health', 'learning', 'relationships'];

export default function SimulationPage() {
  const [domain, setDomain] = useState('energy');
  const [expectedChange, setExpectedChange] = useState(2);
  const [simState, setSimState] = useState<'idle' | 'loading' | 'success' | 'error' | 'locked'>('idle');
  const [results, setResults] = useState<any>(null);

  const handleSimulate = async () => {
    setSimState('loading');
    const res = await fetch('/api/simulate-impact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDomain: domain, expectedChange }),
    });
    
    if (res.status === 403) {
      setSimState('locked');
      return;
    }
    
    const data = await res.json();
    if (data.error) {
      setSimState('error');
    } else {
      setResults(data);
      setSimState('success');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono pb-24 flex flex-col">
      <main className="pt-24 px-4 max-w-lg mx-auto w-full space-y-6">
        
        {/* Header moved into the main container flow to perfectly align with mx-auto */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-8 mb-8">
          <div className="flex items-center gap-3">
            <FlaskConical className="w-5 h-5 text-white" />
            <h1 className="text-xl font-bold tracking-tight uppercase">Impact_Simulator</h1>
          </div>
          <Link href="/dashboard" className="flex items-center gap-2 text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest transition-colors font-bold">
            [ <ArrowLeft className="w-3 h-3" /> Abort_Sim ]
          </Link>
        </div>

        {simState === 'locked' ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12 border border-zinc-900 bg-zinc-950 p-6">
            <div className="w-12 h-12 bg-white flex items-center justify-center mx-auto mb-6">
              <Lock className="w-6 h-6 text-black" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-2">Access Denied</h2>
            <p className="text-zinc-500 text-xs mb-8">Simulation engine requires PRO clearance to run downstream delta processing.</p>
            <Link href="/dashboard/settings" className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-300 transition-colors w-full">
              Upgrade Clearance <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="border border-zinc-800 bg-black p-5">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-6">Simulation Parameters</p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-zinc-400 text-[10px] uppercase tracking-widest block mb-2">Target Isolation Node</label>
                  <select 
                    value={domain} onChange={e => setDomain(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 px-3 py-3 text-sm text-white focus:outline-none focus:border-white uppercase"
                  >
                    {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="text-zinc-400 text-[10px] uppercase tracking-widest block mb-2">Synthetic Input (+/-)</label>
                  <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 px-4 py-3">
                    <input 
                      type="range" min="-3" max="3" step="1" 
                      value={expectedChange} onChange={e => setExpectedChange(parseInt(e.target.value))}
                      className="flex-1 accent-white"
                    />
                    <span className="text-white font-bold w-6 text-right text-sm">
                      {expectedChange > 0 ? '+' : ''}{expectedChange}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleSimulate} disabled={simState === 'loading' || expectedChange === 0}
                  className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-4 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-300 transition-all disabled:opacity-50"
                >
                  {simState === 'loading' ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Execute Run
                </button>
              </div>
            </div>

            {simState === 'success' && results && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                <div className="p-6 border border-white bg-white text-black selection:bg-black selection:text-white">
                  <p className="text-[10px] uppercase tracking-widest mb-4 font-bold opacity-50">Projection Insight</p>
                  
                  <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider leading-relaxed">
                      ➔ By scaling {domain} {expectedChange > 0 ? `+${expectedChange}` : expectedChange}, the engine predicts the system mode will 
                      {results.baseline.mode !== results.simulation.mode ? ` transition from ${results.baseline.mode} to ${results.simulation.mode}.` : ` remain strictly at ${results.simulation.mode}.`}
                      {results.delta.bottleneckChanged 
                        ? ` The downstream chain reaction shifts the root bottleneck entirely from ${results.baseline.bottleneck} to ${results.simulation.bottleneck}.` 
                        : ` However, the volume is insufficient to shift the primary bottleneck; it remains pinned at ${results.simulation.bottleneck}.`}
                    </p>

                    {results.simulation.insights && results.simulation.insights.length > 0 && (
                      <div className="pt-3 mt-3 border-t border-black/10">
                        {results.simulation.insights.map((insight: any, i: number) => (
                           <p key={i} className="text-xs tracking-wider leading-relaxed mb-2 font-medium">
                             ● {insight.text.toUpperCase()}
                           </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 p-4 border border-zinc-800 bg-black">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2">Baseline Protocol</p>
                    <p className="text-white text-xs font-bold uppercase mb-1">{results.baseline.mode}</p>
                    <p className="text-zinc-400 text-[10px] uppercase truncate">{results.baseline.bottleneck}</p>
                  </div>
                  <div className="flex-1 p-4 border border-zinc-500 bg-zinc-950">
                    <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-2">Simulated Delta</p>
                    <p className="text-white text-xs font-bold uppercase mb-1">{results.simulation.mode}</p>
                    <p className="text-zinc-300 text-[10px] uppercase truncate">{results.simulation.bottleneck}</p>
                  </div>
                </div>

                <div className="p-6 border border-zinc-800 bg-black">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-6">Downstream Topological Deltas</p>
                  <div className="grid grid-cols-1 gap-y-4">
                    {Object.entries(results.delta.domains).filter(([_, v]) => (v as number) !== 0).map(([k, v]) => {
                      const val = v as number;
                      const isPos = val > 0;
                      return (
                        <div key={k} className="flex justify-between items-center text-sm">
                          <span className="text-zinc-300 uppercase text-xs font-bold w-1/3 truncate pr-2">{k}</span>
                          <div className="flex-1 bg-zinc-950 h-3 relative border border-zinc-900">
                              <div 
                                className={`absolute top-0 bottom-0 ${isPos ? 'left-1/2 bg-white' : 'right-1/2 bg-zinc-600'}`} 
                                style={{ width: `${Math.min(50, Math.abs(val) * 10)}%` }}
                              />
                              <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-zinc-800" />
                          </div>
                          <span className={`font-mono text-xs font-bold w-10 text-right ${isPos ? 'text-white' : 'text-zinc-500'}`}>
                            {isPos ? '+' : ''}{val}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {simState === 'error' && (
              <div className="p-4 border border-zinc-800 bg-zinc-950 text-white text-[10px] uppercase tracking-widest text-center">
                Sys_Error: Baseline data missing. Complete daily check-in first.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
