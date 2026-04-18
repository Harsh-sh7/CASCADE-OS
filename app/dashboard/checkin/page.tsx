'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Info } from 'lucide-react';

const QUESTIONS = [
  {
    id: 'sleep',
    domain: 'Sleep',
    question: 'How did you sleep last night?',
    low: 'Barely slept',
    high: 'Deep, complete sleep',
  },
  {
    id: 'energy',
    domain: 'Energy',
    question: 'What is your physical energy level right now?',
    low: 'Drained, heavy',
    high: 'Energized, ready',
  },
  {
    id: 'focus',
    domain: 'Focus',
    question: 'How sharp does your mind feel today?',
    low: 'Foggy, scattered',
    high: 'Laser focused',
  },
  {
    id: 'stress',
    domain: 'Stress',
    question: 'How stressed or overwhelmed are you feeling?',
    low: 'Calm, at ease',
    high: 'Extremely stressed',
    inverted: true,
  },
  {
    id: 'timeAvailable',
    domain: 'Time',
    question: 'How much unblocked time do you have today?',
    low: 'No time at all',
    high: 'Completely free',
  },
  {
    id: 'health',
    domain: 'Health',
    question: 'How is your body feeling physically?',
    low: 'Sick or hurt',
    high: 'Peak condition',
  },
  {
    id: 'social',
    domain: 'Social',
    question: 'How connected do you feel to others right now?',
    low: 'Completely isolated',
    high: 'Deeply connected',
  },
];

const SLIDER_OPTIONS = [
  { value: 2, label: 'Very Low' },
  { value: 4, label: 'Low' },
  { value: 6, label: 'Moderate' },
  { value: 8, label: 'High' },
  { value: 10, label: 'Peak' },
];

export default function CheckinPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  
  // Environment Input
  const [environmentNoisy, setEnvironmentNoisy] = useState<boolean | null>(null);
  const [mentallyOverloaded, setMentallyOverloaded] = useState<boolean | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEnvStep = step === QUESTIONS.length;
  const progress = isEnvStep ? 100 : ((step) / QUESTIONS.length) * 100;

  const currentQ = isEnvStep ? null : QUESTIONS[step];
  const currentValue = currentQ ? (answers[currentQ.id] ?? 6) : null;

  const setAnswer = (val: number) => {
    if (currentQ) {
      setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
    }
  };

  const goNext = () => {
    if (!isEnvStep) {
      if (!answers[currentQ!.id]) setAnswer(6);
      setStep(s => s + 1);
    } else {
      handleSubmit();
    }
  };

  const goPrev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        sleep: answers.sleep ?? 6,
        energy: answers.energy ?? 6,
        focus: answers.focus ?? 6,
        stress: answers.stress ?? 5,
        timeAvailable: answers.timeAvailable ?? 6,
        health: answers.health ?? 6,
        social: answers.social ?? 6,
        environmentNoisy: !!environmentNoisy,
        mentallyOverloaded: !!mentallyOverloaded,
      };

      const res = await fetch('/api/checkin/morning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col px-5 pt-8 pb-28">
      {/* Back + Progress */}
      <div className="flex items-center gap-4 mb-8">
        <button
          id="checkin-back-btn"
          onClick={goPrev}
          disabled={step === 0}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-20 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <span className="text-zinc-500 text-[10px] uppercase tracking-widest tabular-nums">
          {step + 1}/{QUESTIONS.length + 1}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {!isEnvStep && currentQ ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
            {/* Domain badge */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">{currentQ.domain}</span>
            </div>

            {/* Question */}
            <h2 className="text-2xl font-medium text-white leading-snug mb-10 text-balance tracking-tight">
              {currentQ.question}
            </h2>

            {/* Options */}
            <div className="space-y-3 mb-10">
              {SLIDER_OPTIONS.map(opt => {
                const selected = currentValue === opt.value;
                return (
                  <button
                    key={opt.value}
                    id={`${currentQ.id}-option-${opt.value}`}
                    onClick={() => setAnswer(opt.value)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all duration-200 text-left ${
                      selected
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <span className="font-medium text-sm">{opt.label}</span>
                    {selected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-black" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Low / High labels */}
            <div className="flex justify-between mb-8">
              <span className="text-zinc-500 text-xs">{currentQ.low}</span>
              <span className="text-zinc-500 text-xs">{currentQ.high}</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="env-step"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
             {/* Domain badge */}
             <div className="flex items-center gap-2 mb-6">
              <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">State Context</span>
            </div>

            <h2 className="text-2xl font-medium text-white leading-snug mb-10 text-balance tracking-tight">
              Final Environment Check
            </h2>

            <div className="space-y-6">
              {/* Noisy */}
              <div>
                <p className="text-white/90 text-sm font-medium mb-3">Is your environment actively distracting right now?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEnvironmentNoisy(true)}
                    className={`flex-1 py-3 rounded-xl border transition-all text-sm font-medium ${
                      environmentNoisy === true ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-zinc-400'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setEnvironmentNoisy(false)}
                    className={`flex-1 py-3 rounded-xl border transition-all text-sm font-medium ${
                      environmentNoisy === false ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-zinc-400'
                    }`}
                  >
                     No
                  </button>
                </div>
              </div>

              {/* Overloaded */}
               <div>
                <p className="text-white/90 text-sm font-medium mb-3">Are you feeling mentally overloaded or paralyzed?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setMentallyOverloaded(true)}
                    className={`flex-1 py-3 rounded-xl border transition-all text-sm font-medium ${
                      mentallyOverloaded === true ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-zinc-400'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setMentallyOverloaded(false)}
                    className={`flex-1 py-3 rounded-xl border transition-all text-sm font-medium ${
                      mentallyOverloaded === false ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-zinc-400'
                    }`}
                  >
                     No
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <Info className="w-4 h-4 text-white/50 shrink-0 mt-0.5" />
              <p className="text-zinc-400 text-xs leading-relaxed">
                CASCADE OS will automatically downgrade task intensity if your cognitive state or environment is compromised.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <p className="text-white text-sm text-center mb-4 p-3 bg-red-950 border border-red-900 rounded-lg">{error}</p>
      )}

      {/* Next / Submit */}
      <button
        id="checkin-next-btn"
        onClick={goNext}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-black font-semibold text-sm transition-all hover:bg-zinc-200 disabled:opacity-60"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Assessing Constraints…</>
        ) : isEnvStep ? (
          <>Initialize Session</>
        ) : (
          <>Next <ChevronRight className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}
