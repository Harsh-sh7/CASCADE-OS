'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, ArrowRight, Loader2, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

type DomainKey = 'sleep' | 'work' | 'money' | 'energy' | 'attention' | 'health' | 'learning' | 'relationships' | 'resourceTime' | 'resourceEnergy' | 'resourceMoney' | 'resourceAttention' | 'mentallyOverloaded' | 'environmentNoisy';

interface Question {
  id: DomainKey;
  text: string;
  options: { label: string; value: number | boolean; subtext?: string }[];
}

const INTAKE_FLOW: Question[] = [
  // Biological Baselines
  { id: 'sleep', text: 'How many hours of uninterrupted sleep did you get last night?', options: [
    { label: '< 5 Hours', value: 2, subtext: 'Severe Deficit' },
    { label: '5-6 Hours', value: 4, subtext: 'Deprived' },
    { label: '7-8 Hours', value: 7, subtext: 'Baseline' },
    { label: '8+ Hours', value: 9, subtext: 'Optimal' },
  ]},
  { id: 'energy', text: 'Assess your current physical energy ceiling.', options: [
    { label: 'Running on fumes', value: 2 },
    { label: 'Sluggish but functional', value: 4 },
    { label: 'Stable', value: 7 },
    { label: 'High kinetic energy', value: 9 },
  ]},
  { id: 'health', text: 'Are you dealing with physiological inflammation, illness, or chronic pain?', options: [
    { label: 'Severe disruption', value: 2 },
    { label: 'Noticeable friction', value: 4 },
    { label: 'Minor issue', value: 7 },
    { label: 'System clear', value: 10 },
  ]},
  // Capacity & Resources
  { id: 'attention', text: 'Assess your ability to focus deeply right now without involuntary context switching.', options: [
    { label: 'Completely fragmented', value: 2 },
    { label: 'Distracted easily', value: 4 },
    { label: 'Can hold focus', value: 7 },
    { label: 'Lock-on capability', value: 9 },
  ]},
  { id: 'resourceTime', text: 'How much unstructured TIME do you actually control today?', options: [
    { label: 'Zero (Back-to-back)', value: 2 },
    { label: '1-2 Hours', value: 4 },
    { label: '3-4 Hours', value: 7 },
    { label: 'Completely open', value: 10 },
  ]},
  { id: 'resourceMoney', text: 'Assess your current financial runway & cash flow stress.', options: [
    { label: 'Immediate crisis', value: 2 },
    { label: 'Tight/Stressed', value: 4 },
    { label: 'Stable', value: 7 },
    { label: 'Abundant runway', value: 10 },
  ]},
  // Systemic Outputs
  { id: 'work', text: 'What is the state of your primary work/business obligations?', options: [
    { label: 'Failing/Critical debt', value: 2 },
    { label: 'Behind / Stressed', value: 4 },
    { label: 'Maintaining pace', value: 7 },
    { label: 'Ahead / High leverage', value: 9 },
  ]},
  { id: 'learning', text: 'Are you actively compounding knowledge or upskilling?', options: [
    { label: 'Stagnant', value: 2 },
    { label: 'Passive consumption only', value: 4 },
    { label: 'Active learning blocks', value: 7 },
    { label: 'Intense upskilling', value: 9 },
  ]},
  { id: 'relationships', text: 'Assess your social and relationship baseline.', options: [
    { label: 'Isolated or High conflict', value: 2 },
    { label: 'Distant/Drained', value: 4 },
    { label: 'Maintained', value: 7 },
    { label: 'Deeply connected', value: 9 },
  ]},
  // Environmental Modifiers
  { id: 'environmentNoisy', text: 'Is your immediate physical environment noisy, cluttered, or chaotic?', options: [
    { label: 'Yes, hostile environment', value: true },
    { label: 'No, controlled environment', value: false },
  ]},
  { id: 'mentallyOverloaded', text: 'Are you carrying a high background anxiety or "open loop" mental load?', options: [
    { label: 'Yes, severe overload', value: true },
    { label: 'No, mind is clear', value: false },
  ]},
];

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<DomainKey, any>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasCompleted, setHasCompleted] = useState<boolean | null>(null);

  const currentQuestion = INTAKE_FLOW[step];
  const isComplete = step >= INTAKE_FLOW.length;

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => setHasCompleted(data.hasActiveLog))
      .catch(() => setHasCompleted(false));
  }, []);

  const handleSelect = (val: any) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
    setTimeout(() => {
      setStep(prev => prev + 1);
    }, 150);
  };

  useEffect(() => {
    if (hasCompleted === false && isComplete) {
      submitIntake();
    }
  }, [isComplete, hasCompleted]);

  const submitIntake = async () => {
    setLoading(true);
    try {
      // Map resources
      const payload = { ...answers };
      // Duplicate domain values to their Resource counterparts if missing
      payload.resourceEnergy = payload.energy;
      payload.resourceAttention = payload.attention;
      // Money is a domain and a resource in the new model.
      payload.money = payload.resourceMoney;

      const res = await fetch('/api/checkin/morning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize system state');
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (hasCompleted === null || loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center font-mono bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white mb-6" />
        <h2 className="text-white text-sm tracking-widest uppercase">
          {hasCompleted === null ? 'Verifying System State' : 'Initializing Cognitive State'}
        </h2>
        <p className="text-zinc-600 text-xs mt-2">Compiling neural dependencies...</p>
        {error && <p className="text-red-500 mt-4 text-xs font-bold">{error}</p>}
      </div>
    );
  }

  if (hasCompleted) {
    return (
      <div className="h-screen flex flex-col items-center justify-center font-mono bg-black px-6">
        <div className="max-w-md w-full text-center border border-zinc-800 p-8">
          <CheckSquare className="w-8 h-8 text-white mx-auto mb-6" />
          <h2 className="text-white text-xl font-bold tracking-widest uppercase mb-4">Intake Complete</h2>
          <p className="text-zinc-500 text-sm leading-relaxed mb-8">
            Your system baseline has already been established for today. Engine is running.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-4 border border-white text-white font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-colors"
          >
            Access Bottleneck Module
          </button>
        </div>
      </div>
    );
  }

  if (isComplete || loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center font-mono bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white mb-6" />
        <h2 className="text-white text-sm tracking-widest uppercase">Initializing Cognitive State</h2>
        <p className="text-zinc-600 text-xs mt-2">Compiling neural dependencies...</p>
        {error && <p className="text-red-500 mt-4 text-xs font-bold">{error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-24 px-6 font-mono h-screen flex flex-col bg-black">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4 text-zinc-500 text-xs tracking-widest uppercase">
          <Terminal className="w-4 h-4" />
          <span>System Initialization [Phase 1]</span>
        </div>
        <div className="flex gap-1 mb-8">
          {INTAKE_FLOW.map((_, i) => (
            <div key={i} className={cn("h-1 flex-1", i < step ? "bg-white" : i === step ? "bg-zinc-600 animate-pulse" : "bg-zinc-900")} />
          ))}
        </div>
      </div>

      <div className="flex-1">
        <h1 className="text-2xl font-bold text-white mb-8 tracking-tight leading-snug">
          {currentQuestion.text}
        </h1>

        <div className="flex flex-col gap-3">
          {currentQuestion.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelect(opt.value)}
              className="text-left w-full p-4 border border-zinc-800 hover:border-white hover:bg-zinc-900 transition-all group flex items-start justify-between"
            >
              <div>
                <div className="text-white font-medium flex items-center gap-3">
                  <span className="text-zinc-500 text-xs font-mono group-hover:text-white transition-colors">[{i + 1}]</span>
                  {opt.label}
                </div>
                {opt.subtext && <div className="text-zinc-500 text-xs mt-1 ml-7">{opt.subtext}</div>}
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-800 group-hover:text-white transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
