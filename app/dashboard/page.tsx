'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowRight, Shield, AlertCircle,
  Pause, Trash2, Users, Zap, Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types simplified for this scope
interface Recommendation {
  action: string;
  gain: string[];
  cost: string[];
  whyThis: string;
  whyNotOthers: string;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceReason: string;
  bandwidthRequired?: 'LOW' | 'MEDIUM' | 'HIGH';
}
interface Decision { do: string; delay: string[]; delegate: string[]; remove: string[]; }
interface SystemAnalysis {
  bottleneck: string;
  mode: string;
  loops: string[];
  recommendation: Recommendation;
  decisions: Decision;
  dayType: { type: string; label: string };
}
interface DashboardData {
  hasActiveLog: boolean;
  log: {
    systemAnalysis: SystemAnalysis;
    morningState: any;
    followUp: { completed: boolean; feedback?: string };
  } | null;
}

export default function DashboardBottleneckView() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  const handleFollowUp = async (followed: boolean) => {
    await fetch('/api/followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followedAction: followed }),
    });
    const res = await fetch('/api/dashboard');
    setData(await res.json());
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-black font-mono">
        <div className="w-2 h-2 bg-white animate-pulse" />
        <p className="text-zinc-600 text-xs tracking-widest uppercase">Initializing Core Module</p>
      </div>
    );
  }

  if (!data?.hasActiveLog) {
    return (
      <div className="flex flex-col justify-center min-h-screen px-8 bg-black font-mono">
        <div className="max-w-2xl mx-auto w-full">
          <p className="text-zinc-600 text-xs tracking-[0.2em] uppercase mb-4 outline-none">CASCADE OS</p>
          <h1 className="text-4xl font-bold text-white mb-2 uppercase tracking-tighter">System Offline</h1>
          <p className="text-zinc-500 text-sm mb-12">No cognitive state baseline established for today.</p>
          
          <Link
            href="/dashboard/intake"
            className="inline-flex items-center justify-between w-full px-6 py-4 border border-zinc-800 bg-zinc-900/50 hover:bg-white hover:text-black transition-all group"
          >
            <span className="font-bold tracking-widest uppercase">Begin Intake Sequence</span>
            <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-black" />
          </Link>
        </div>
      </div>
    );
  }

  const analysis = data.log!.systemAnalysis;
  const decisions = analysis.decisions;
  const completed = data.log!.followUp.completed;

  return (
    <div className="min-h-screen bg-black font-mono p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-white tracking-tighter uppercase mb-2">Bottleneck Detector</h1>
        <p className="text-zinc-500 text-sm">Actionable triage based on your current state variables.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Bottleneck & DO Action */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="p-8 border border-white bg-black relative overflow-hidden group hover:border-zinc-500 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
               <Zap className="w-48 h-48" />
            </div>
            
            <div className="flex items-center gap-3 mb-8">
              <span className="text-white text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1">Top Leverage Point</span>
              <span className="text-zinc-500 text-xs uppercase tracking-widest border border-zinc-800 px-3 py-1">{analysis.mode} MODE</span>
              <span className="text-zinc-500 text-xs uppercase tracking-widest border border-zinc-800 px-3 py-1">{analysis.bottleneck}</span>
            </div>

            <h2 className="text-3xl font-bold text-white leading-snug tracking-tighter mb-6 group-hover:text-zinc-300 transition-colors">
              {decisions.do}
            </h2>

            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-zinc-800">
              <div>
                <p className="text-zinc-500 uppercase tracking-widest text-xs mb-2">Why This</p>
                <p className="text-zinc-400 text-sm leading-relaxed">{analysis.recommendation.whyThis}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-zinc-500 uppercase tracking-widest text-xs mb-1">Structural Gain</p>
                  {analysis.recommendation.gain.map((v, i) => <p key={i} className="text-white text-sm">+ {v}</p>)}
                </div>
                <div>
                  <p className="text-zinc-500 uppercase tracking-widest text-xs mb-1">Execution Cost</p>
                  {analysis.recommendation.cost.map((v, i) => <p key={i} className="text-red-400 text-sm">- {v}</p>)}
                </div>
              </div>
            </div>
          </div>

          {/* Follow-up State */}
          {!completed ? (
            <div className="flex gap-4">
              <button
                onClick={() => handleFollowUp(true)}
                className="flex-1 py-4 border border-white text-white font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Action Executed
              </button>
              <button
                onClick={() => handleFollowUp(false)}
                className="flex-1 py-4 border border-zinc-800 text-zinc-500 font-bold uppercase tracking-widest text-sm hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Skipped Execution
              </button>
            </div>
          ) : (
            <div className="py-4 border border-zinc-800 bg-zinc-900/50 text-zinc-400 font-bold uppercase tracking-widest text-center text-sm flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Loop Closed
            </div>
          )}
        </div>

        {/* Secondary Column: Constraints & History */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Failure Loops */}
          {analysis.loops.length > 0 && (
            <div className="p-6 border border-zinc-800 bg-zinc-900/40">
              <div className="flex items-center gap-2 mb-4 text-red-500 text-xs font-bold uppercase tracking-widest border-b border-zinc-800 pb-2">
                <AlertCircle className="w-4 h-4" /> Active Failure Loops
              </div>
              <ul className="space-y-4">
                {analysis.loops.map((loop, i) => (
                  <li key={i} className="text-sm text-zinc-300 leading-relaxed border-l-2 border-red-500 pl-3">
                    {loop}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Constraints Module */}
          <div className="p-6 border border-zinc-800">
            <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-6 border-b border-zinc-800 pb-2">System Constraints</h3>
            
            <div className="space-y-6">
              {decisions.delay.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">
                    <Pause className="w-3 h-3" /> Delay
                  </div>
                  {decisions.delay.map((v, i) => <p key={i} className="text-zinc-300 text-sm mb-1">{v}</p>)}
                </div>
              )}

              {decisions.delegate.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">
                    <Users className="w-3 h-3" /> Delegate
                  </div>
                  {decisions.delegate.map((v, i) => <p key={i} className="text-zinc-300 text-sm mb-1">{v}</p>)}
                </div>
              )}

              {decisions.remove.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">
                    <Trash2 className="w-3 h-3" /> Drop
                  </div>
                  {decisions.remove.map((v, i) => <p key={i} className="text-red-400 text-sm mb-1">{v}</p>)}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
