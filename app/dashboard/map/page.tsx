'use client';

import { useState, useEffect } from 'react';
import { Network, Activity, ArrowRight, Zap, Target, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DomainNode } from '@/lib/engine/graph';

// Static graph for front-end visualization mapping
const EDGES = [
  { from: 'sleep', to: 'energy', w: 0.9 },
  { from: 'sleep', to: 'attention', w: 0.7 },
  { from: 'sleep', to: 'health', w: 0.6 },
  { from: 'energy', to: 'attention', w: 0.8 },
  { from: 'energy', to: 'work', w: 0.7 },
  { from: 'energy', to: 'learning', w: 0.5 },
  { from: 'energy', to: 'relationships', w: 0.4 },
  { from: 'attention', to: 'work', w: 0.9 },
  { from: 'attention', to: 'learning', w: 0.8 },
  { from: 'attention', to: 'relationships', w: 0.6 },
  { from: 'work', to: 'money', w: 0.8 },
  { from: 'work', to: 'energy', w: -0.6 },
  { from: 'work', to: 'attention', w: -0.5 },
  { from: 'money', to: 'health', w: 0.4 },
  { from: 'money', to: 'learning', w: 0.3 },
  { from: 'health', to: 'energy', w: 0.8 },
  { from: 'health', to: 'sleep', w: 0.5 },
  { from: 'learning', to: 'work', w: 0.6 },
  { from: 'learning', to: 'attention', w: -0.4 },
  { from: 'relationships', to: 'energy', w: 0.4 },
  { from: 'relationships', to: 'attention', w: -0.3 },
];

const DOMAINS: DomainNode[] = ['sleep', 'work', 'money', 'energy', 'attention', 'health', 'learning', 'relationships'];

export default function RippleGraphMap() {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // Compute downstream / upstream matrices base on active node
  const downstreamEdges = activeNode ? EDGES.filter(e => e.from === activeNode) : [];
  const upstreamEdges = activeNode ? EDGES.filter(e => e.to === activeNode) : [];

  const getDimState = (domain: string) => {
    if (!activeNode) return false;
    if (activeNode === domain) return false;
    const isConnectedDown = downstreamEdges.some(e => e.to === domain);
    const isConnectedUp = upstreamEdges.some(e => e.from === domain);
    return !(isConnectedDown || isConnectedUp);
  };

  const getEdgeStrengthColor = (weight: number) => {
    if (weight >= 0.8) return 'text-white border-white bg-white/10';
    if (weight >= 0.5) return 'text-zinc-400 border-zinc-400';
    if (weight > 0) return 'text-zinc-600 border-zinc-600';
    if (weight <= -0.5) return 'text-red-500 border-red-500 bg-red-500/10';
    return 'text-red-900 border-red-900';
  };

  return (
    <div className="p-8 font-mono max-w-6xl mx-auto h-screen flex flex-col">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase mb-2">Life Dependency Map</h1>
          <p className="text-zinc-500 text-sm">RIPPLE SIMULATOR: Click any node to isolated inbound/outbound systemic effects.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-xs text-white"><div className="w-3 h-3 bg-white/20 border border-white" /> Amplifies</div>
          <div className="flex items-center gap-2 text-xs text-zinc-500"><div className="w-3 h-3 border border-zinc-600" /> Supports</div>
          <div className="flex items-center gap-2 text-xs text-red-500"><div className="w-3 h-3 bg-red-500/10 border border-red-500" /> Degrades</div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-6">
        {DOMAINS.map(domain => {
          const isDim = getDimState(domain);
          const isTargetDownstream = downstreamEdges.find(e => e.to === domain);
          const isTargetUpstream = upstreamEdges.find(e => e.from === domain);

          return (
            <button
              key={domain}
              onClick={() => setActiveNode(activeNode === domain ? null : domain)}
              className={cn(
                "relative group flex flex-col items-center justify-center p-8 border transition-all duration-300",
                activeNode === domain ? "border-white bg-white/5" : "border-zinc-800 hover:border-zinc-500 bg-black",
                isDim && "opacity-20 translate-scale-95"
              )}
            >
              <div className="text-white font-bold tracking-widest uppercase mb-4">{domain}</div>

              {/* Matrix Data Overlay when active */}
              {activeNode === domain && (
                <div className="absolute inset-0 bg-white/5 pointer-events-none border mt-[1px] ml-[1px]" />
              )}

              {/* Status Display overlay if affected */}
              {isTargetDownstream && (
                <div className={cn("mt-4 text-xs font-bold border px-3 py-1", getEdgeStrengthColor(isTargetDownstream.w))}>
                  {isTargetDownstream.w > 0 ? "OUTBOUND SYNERGY" : "OUTBOUND DECAY"} ({isTargetDownstream.w})
                </div>
              )}
              {isTargetUpstream && (
                <div className={cn("mt-4 text-xs font-bold border px-3 py-1", getEdgeStrengthColor(isTargetUpstream.w))}>
                  {isTargetUpstream.w > 0 ? "DRIVEN BY" : "SUPPRESSED BY"} ({isTargetUpstream.w})
                </div>
              )}
            </button>
          )
        })}
      </div>

      {activeNode && (
        <div className="mt-8 p-6 border border-zinc-800 bg-black animate-in slide-in-from-bottom-5">
          <h2 className="text-white font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Ripple Cascade Analysis: {activeNode}
          </h2>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-zinc-500 uppercase tracking-widest mb-3 text-xs border-b border-zinc-800 pb-2">If {activeNode} drops (Outbound Risk)</p>
              {downstreamEdges.length === 0 ? <p className="text-zinc-700">Terminal node. No outbound constraints.</p> : (
                <ul className="space-y-2">
                  {downstreamEdges.map(e => (
                    <li key={e.to} className="flex justify-between items-center text-zinc-300">
                      <span>{e.to}</span>
                      <span className={cn(e.w > 0 ? "text-red-500" : "text-white")}>
                        {e.w > 0 ? `Loses ${e.w * 10}0% capacity` : `Gains false relief`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-zinc-500 uppercase tracking-widest mb-3 text-xs border-b border-zinc-800 pb-2">To increase {activeNode} (Inbound Drivers)</p>
              {upstreamEdges.length === 0 ? <p className="text-zinc-700">Root node. Must be governed directly.</p> : (
                <ul className="space-y-2">
                  {upstreamEdges.map(e => (
                    <li key={e.from} className="flex justify-between items-center text-zinc-300">
                      <span>Requires {e.from}</span>
                      <span className={e.w > 0 ? "text-white font-bold" : "text-zinc-500"}>
                        {e.w > 0 ? `Strong multiplier (${e.w})` : `Must overcome (${e.w})`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
