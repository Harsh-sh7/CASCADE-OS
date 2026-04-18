'use client';

import { useEffect, useState } from 'react';

const DOMAIN_META: Record<string, { desc: string }> = {
  sleep:      { desc: 'Foundation of all cognitive performance' },
  energy:     { desc: 'Rate-limits every downstream process' },
  focus:      { desc: 'Converts time into output' },
  stress:     { desc: 'Systemic suppressor — high stress = multiplier decay' },
  time:       { desc: 'Raw capacity for action' },
  workOutput: { desc: 'The downstream result of the system' },
  health:     { desc: 'Biological ceiling for energy and recovery' },
  social:     { desc: 'Oxytocin and cortisol regulation source' },
};

const EDGES = [
  { from: 'sleep', to: 'energy', w: 0.8, positive: true },
  { from: 'sleep', to: 'focus', w: 0.6, positive: true },
  { from: 'sleep', to: 'stress', w: 0.5, positive: false },
  { from: 'energy', to: 'focus', w: 0.7, positive: true },
  { from: 'energy', to: 'workOutput', w: 0.6, positive: true },
  { from: 'focus', to: 'workOutput', w: 0.8, positive: true },
  { from: 'stress', to: 'energy', w: 0.6, positive: false },
  { from: 'stress', to: 'focus', w: 0.7, positive: false },
  { from: 'time', to: 'workOutput', w: 0.7, positive: true },
  { from: 'health', to: 'energy', w: 0.7, positive: true },
  { from: 'social', to: 'stress', w: 0.5, positive: false },
];

export default function GraphPage() {
  const [states, setStates] = useState<Record<string, number>>({});
  const [bottleneck, setBottleneck] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [hasLog, setHasLog] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      setHasLog(d.hasActiveLog);
      if (d.log?.morningState) {
        const s = d.log.morningState;
        setStates({ sleep: s.sleep, energy: s.energy, focus: s.focus, stress: s.stress, time: s.timeAvailable, workOutput: 5, health: s.health, social: s.social });
        setBottleneck(d.log.systemAnalysis?.bottleneck || '');
      }
    });
  }, []);

  const selectedMeta = selected ? DOMAIN_META[selected] : null;
  const selectedEdges = selected ? EDGES.filter(e => e.from === selected || e.to === selected) : [];
  const stateVal = selected ? states[selected] ?? 5 : 0;

  return (
    <div className="pt-8 pb-4 space-y-5 animate-fade-in font-mono">
      <div>
        <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase mb-1">System Map</p>
        <h1 className="text-xl font-bold text-white uppercase tracking-tight">Dependency Grid</h1>
        <p className="text-zinc-400 text-xs mt-1 uppercase tracking-widest">Select a node to inspect its connectivity.</p>
      </div>

      {!hasLog && (
        <div className="border border-zinc-800 bg-black p-6 text-center">
          <p className="text-zinc-400 text-xs uppercase tracking-widest">Sys_Error: Check-in required for live data mapping.</p>
        </div>
      )}

      {/* Domain Grid */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(DOMAIN_META).map(([domain, meta]) => {
          const val = states[domain] ?? null;
          const isBottleneck = domain === bottleneck;
          const isSelected = domain === selected;
          const barPct = val ? (val / 10) * 100 : 0;

          return (
            <button
              key={domain}
              id={`domain-${domain}`}
              onClick={() => setSelected(isSelected ? null : domain)}
              className={`p-4 text-left border transition-all duration-200 ${
                isSelected
                  ? 'border-white bg-zinc-950'
                  : isBottleneck
                  ? 'border-zinc-500 bg-zinc-900'
                  : 'border-zinc-800 bg-black hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-white text-sm font-bold uppercase tracking-wider">{domain}</span>
                {isBottleneck && (
                  <span className="text-[8px] font-bold text-black bg-white px-2 py-0.5 uppercase tracking-widest border border-white">
                    Bottleneck
                  </span>
                )}
              </div>
              
              {val !== null && (
                <div className="mt-2 text-zinc-500">
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] uppercase tracking-widest">Capacity</span>
                    <span className="text-[10px] font-bold text-zinc-300">{val}/10</span>
                  </div>
                  <div className="h-[2px] bg-zinc-900 w-full">
                    <div
                      className="h-full bg-white transition-all duration-500"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected domain detail */}
      {selected && selectedMeta && (
        <div className="border border-white bg-black p-5 space-y-6 animate-slide-up">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-white font-bold uppercase text-lg">{selected}</p>
              <p className="text-zinc-500 text-[10px] tracking-widest uppercase">Node_Active</p>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">{selectedMeta.desc}</p>
          </div>

          <div className="w-full h-[1px] bg-zinc-800" />

          {selectedEdges.length > 0 ? (
            <div>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-4">Vector Processing</p>
              <div className="space-y-3 font-mono text-xs">
                {selectedEdges.map((e, i) => {
                  const isSource = e.from === selected;
                  const peer = isSource ? e.to : e.from;
                  return (
                    <div key={i} className="flex items-center justify-between border border-zinc-800 p-3 bg-zinc-950">
                      <div className="flex flex-col">
                        <span className="text-zinc-500 text-[9px] uppercase tracking-widest mb-1">
                          {isSource ? 'Outbound Effect' : 'Inbound Dependency'}
                        </span>
                        <span className="text-white font-bold uppercase">{peer}</span>
                      </div>
                      <div className="flex items-center justify-center bg-black border border-zinc-900 px-3 py-1">
                        <span className={`font-bold ${e.positive ? 'text-white' : 'text-zinc-500'}`}>
                          {e.positive ? '+' : '–'}{e.w}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-zinc-500 text-xs">No active vectors mapping to this node.</p>
          )}
        </div>
      )}
    </div>
  );
}
