import Link from 'next/link';
import { ArrowRight, Activity, Cpu, ShieldAlert, Waves } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col font-mono text-zinc-400">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border border-zinc-500 bg-white flex items-center justify-center">
            <span className="text-black font-bold text-[10px]">C</span>
          </div>
          <span className="font-bold text-xs tracking-widest text-white uppercase">Cascade_OS</span>
        </div>
        <Link
          href="/login"
          className="text-xs text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
        >
          [ Initial_Boot ]
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center border-b border-zinc-900">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-zinc-800 bg-zinc-900/50">
          <span className="w-2 h-2 bg-white animate-pulse" />
          <span className="text-zinc-400 text-[10px] uppercase tracking-widest">Neuro-Adaptive Routing Active</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white max-w-3xl leading-tight mb-8 uppercase tracking-tighter mix-blend-difference">
          Stop managing time.<br/>
          Start managing bandwidth.
        </h1>

        <p className="text-zinc-500 text-sm md:text-base max-w-xl leading-relaxed mb-12">
          Rigid time-blocking is obsolete. Cascade OS is an environment-aware cognitive routing system designed for executive dysfunction, dynamic energy levels, and sensory bottlenecks.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full justify-center max-w-sm">
          <Link
            id="get-started-btn"
            href="/login"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-zinc-300 transition-colors"
          >
            Execute Sys_Init <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[1px] bg-zinc-900 max-w-3xl w-full border border-zinc-900">
          {[
            { label: 'Bandwidth First', sub: 'Calculates cognitive load.' },
            { label: 'Zero Backlog', sub: 'Shame-Free Loop mechanics.' },
            { label: 'Sensory Aware', sub: 'Monitors environment friction.' },
          ].map((s) => (
            <div key={s.label} className="bg-black p-6 text-left">
              <p className="text-white font-bold text-xs uppercase tracking-widest mb-2">{s.label}</p>
              <p className="text-zinc-600 text-[11px] leading-relaxed">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 py-24 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-16">
          <div className="h-[1px] flex-1 bg-zinc-900" />
          <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase">System Specifications</p>
          <div className="h-[1px] flex-1 bg-zinc-900" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              icon: <Activity className="w-5 h-5 text-white" />,
              title: 'The Bandwidth Shift',
              desc: 'The clock is secondary. When your cognitive load spikes, the system dynamically re-classifies task intensities to match your fluctuating capacity, keeping you out of paralysis.',
            },
            {
              icon: <Waves className="w-5 h-5 text-white" />,
              title: 'Sensory Dependencies',
              desc: 'Noise, constant interruptions, clutter—Cascade OS tracks external friction. When the environment becomes a bottleneck, output tasks halt. Containment initiates.',
            },
            {
              icon: <ShieldAlert className="w-5 h-5 text-white" />,
              title: 'Shame-Free Loop',
              desc: 'Missed a task due to zero energy? A standard to-do list punishes you with debt. Cascade recognizes executive blocks, triggers Recovery Mode, and instantly dissolves the backlog.',
            },
            {
              icon: <Cpu className="w-5 h-5 text-white" />,
              title: 'Emergency State',
              desc: 'Total system collapse? Zero bandwidth? The engine overrides complex decision trees and issues a single, low-friction recovery directive designed solely for baseline restoration.',
            },
          ].map((f) => (
            <div key={f.title} className="p-6 border border-zinc-900 hover:border-zinc-700 transition-colors bg-zinc-950">
              <div className="mb-4">
                {f.icon}
              </div>
              <p className="text-white font-bold text-sm uppercase tracking-widest mb-3">{f.title}</p>
              <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 py-8 border-t border-zinc-900 text-center">
        <p className="text-zinc-700 text-[10px] uppercase tracking-widest">CASCADE_OS // V1.0.0-NEURO // END OF LINE</p>
      </footer>
    </main>
  );
}
