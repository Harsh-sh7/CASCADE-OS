'use client';

import { useEffect, useState } from 'react';
import { Database, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Resources {
  time: number;
  energy: number;
  money: number;
  attention: number;
}

interface DashboardData {
  hasActiveLog: boolean;
  log: {
    resources?: Resources;
    systemAnalysis: {
      bottleneck: string;
    };
  } | null;
}

export default function ResourcesAllocationView() {
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

  if (!data?.hasActiveLog || !data.log || !data.log.resources) {
    return (
      <div className="flex flex-col justify-center min-h-screen px-8 bg-black font-mono">
        <div className="max-w-2xl mx-auto w-full text-center">
          <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">Resource module uncalibrated. Intake required.</p>
        </div>
      </div>
    );
  }

  const { resources } = data.log;
  const metrics = [
    { key: 'time', label: 'TIME', value: resources.time, desc: 'Unstructured temporal blocks available.' },
    { key: 'energy', label: 'ENERGY', value: resources.energy, desc: 'Biological ATP and physiological capacity.' },
    { key: 'attention', label: 'ATTENTION', value: resources.attention, desc: 'Executive function and focus depth.' },
    { key: 'money', label: 'LIQUIDITY', value: resources.money, desc: 'Financial runway and immediate cash flow.' },
  ];

  return (
    <div className="min-h-screen bg-black font-mono p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-white tracking-tighter uppercase mb-2">Resource Allocation</h1>
        <p className="text-zinc-500 text-sm">The 4-currency systemic capacity mapping.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {metrics.map((m) => (
          <div key={m.key} className="border border-zinc-800 p-6 relative group overflow-hidden">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 {m.value <= 3 && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />}
                 <h2 className={cn("font-bold tracking-widest uppercase", m.value <= 3 ? "text-red-500" : "text-white")}>
                   {m.label}
                 </h2>
               </div>
               <span className="text-white font-mono text-2xl">{m.value}<span className="text-zinc-600 text-sm">/10</span></span>
            </div>

            {/* Matrix Capacity Bar */}
            <div className="h-4 w-full bg-zinc-900 border border-zinc-800 flex relative">
               <div 
                 className={cn("h-full transition-all duration-1000", m.value <= 3 ? "bg-red-500" : "bg-white")} 
                 style={{ width: `${m.value * 10}%` }}
               />
               <div className="absolute inset-0 grid grid-cols-10 divide-x divide-black opacity-20 pointer-events-none" />
            </div>

            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-6">{m.desc}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-12 p-6 border border-zinc-800 bg-zinc-900/40 flex items-start gap-4">
        <Database className="w-5 h-5 text-zinc-500 mt-1" />
        <div>
          <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-1 border-b border-zinc-800 inline-block pb-1">Currency Conversion Laws</h3>
          <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
            Time cannot generate output without Energy. <br/>
            Money can buy Time, but cannot buy immediate physiological Energy. <br/>
            Attention is the most volatile currency; it directly drains Energy. 
            When any currency drops below a <strong className="text-red-500 mx-1 border border-red-500/30 px-1 py-0.5">3/10 threshold</strong>, the system enters containment overriding all other optimizations.
          </p>
        </div>
      </div>
    </div>
  );
}
