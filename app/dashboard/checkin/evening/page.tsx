'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const QUESTIONS = [
  { domain: 'sleep',   label: 'SLEEP_CYCLE',   question: 'Evaluate previous night recovery.',             low: 'Critical deficit', high: 'Optimal rest' },
  { domain: 'energy',  label: 'SYS_ENERGY',  question: 'Current biological capacity.',            low: 'Depleted', high: 'Peak output' },
  { domain: 'focus',   label: 'FOCUS_LOCK',   question: 'Determine rate of output focus.',            low: 'Scattered', high: 'Sustained' },
  { domain: 'stress',  label: 'STRESS_LOAD',  question: 'Calculate current systemic friction.',             low: 'Nominal', high: 'Overload' },
  { domain: 'time',    label: 'TIME_CAP',    question: 'Determine active hours allocated.',    low: 'Zero bandwidth', high: 'Unrestricted' },
  { domain: 'health',  label: 'BIO_HEALTH',  question: 'Assess physical infrastructure.',              low: 'Compromised', high: 'Stable' },
  { domain: 'social',  label: 'SOC_NETWORK',  question: 'Measure interpersonal synchronization.',     low: 'Isolated', high: 'Integrated' },
];

const LEVELS = ['LVL_1 (Critical)', 'LVL_2 (Low)', 'LVL_3 (Nominal)', 'LVL_4 (High)', 'LVL_5 (Peak)'];
const LEVEL_VALUES = [2, 4, 6, 8, 10];

export default function EveningCheckinPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const current = QUESTIONS[currentStep];

  const handleSelect = (levelIndex: number) => {
    setSelected(levelIndex);
    const value = LEVEL_VALUES[levelIndex];
    const newAnswers = { ...answers, [current.domain]: value };
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentStep < QUESTIONS.length - 1) {
        setCurrentStep(prev => prev + 1);
        setSelected(null);
      }
    }, 350);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/checkin/evening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleep:         answers.sleep ?? 5,
          energy:        answers.energy ?? 5,
          focus:         answers.focus ?? 5,
          stress:        answers.stress ?? 5,
          timeAvailable: answers.time ?? 5,
          health:        answers.health ?? 5,
          social:        answers.social ?? 5,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12 font-mono">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="border border-zinc-800 bg-black p-8 w-full max-w-md space-y-6"
        >
          <div className="text-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-1">State Logged</h2>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest">
              Daily telemetry fed into neural engine.
            </p>
          </div>

          <div className="w-full h-[1px] bg-zinc-900" />

          {result.outcomeSuccess !== undefined && (
            <div className={`p-4 border text-center text-xs font-bold uppercase tracking-widest ${
              result.outcomeSuccess
                ? 'bg-zinc-950 border-white text-white'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400'
            }`}>
              {result.outcomeSuccess ? '[ Bottleneck Yield ]' : '[ Bottleneck Resisted ]'}
            </div>
          )}

          <div className="pt-2">
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-4">Domain Deltas</p>
            <div className="space-y-2">
              {result.outcomeDelta && Object.entries(result.outcomeDelta).map(([domain, delta]: [string, any]) => (
                <div key={domain} className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <span className="text-white text-xs font-bold uppercase">{domain}</span>
                  <span className={`text-sm font-bold ${
                    delta > 0 ? 'text-white' : delta < 0 ? 'text-zinc-600' : 'text-zinc-500'
                  }`}>
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full mt-4 py-4 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-zinc-300 transition-colors"
          >
            Acknowledge & Exit
          </button>
        </motion.div>
      </div>
    );
  }

  const isLastStep = currentStep === QUESTIONS.length - 1;
  const allAnswered = Object.keys(answers).length === QUESTIONS.length;

  return (
    <div className="min-h-screen bg-black flex flex-col px-6 py-12 font-mono">
      {/* Progress Matrix */}
      <div className="mb-12">
        <div className="flex justify-between items-end mb-3">
          <span className="text-white text-[10px] uppercase tracking-widest font-bold">Node Diagnostics</span>
          <span className="text-zinc-500 text-[10px] font-mono">[{currentStep + 1}/{QUESTIONS.length}]</span>
        </div>
        <div className="flex gap-1">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 transition-colors duration-300 ${
                i <= currentStep ? 'bg-white' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
          className="flex-1 flex flex-col"
        >
          <div className="mb-2">
            <span className="text-white text-[10px] font-bold tracking-widest uppercase px-2 py-1 border border-zinc-800 bg-zinc-950">
              {current.label}
            </span>
          </div>

          <h2 className="text-xl font-bold text-white uppercase tracking-tight leading-snug mt-6 mb-10">
            {current.question}
          </h2>

          <div className="space-y-3 flex-1">
            {LEVELS.map((level, i) => (
              <button
                key={level}
                onClick={() => handleSelect(i)}
                className={`w-full text-left px-5 py-4 border transition-all duration-200 ${
                  selected === i
                    ? 'bg-zinc-950 border-white text-white'
                    : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider">{level}</span>
                  {selected === i && (
                    <span className="text-white text-[10px] tracking-widest uppercase">Select</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-between border-t border-zinc-900 mt-8 pt-4">
            <span className="text-zinc-500 text-[10px] uppercase tracking-widest">{current.low}</span>
            <span className="text-zinc-500 text-[10px] uppercase tracking-widest">{current.high}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Submit button on last step */}
      {isLastStep && allAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          {error && <p className="text-zinc-400 text-[10px] uppercase uppercase text-center mb-4 p-2 border border-zinc-800">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-zinc-300 transition-colors disabled:opacity-50"
          >
            {loading ? 'Committing State…' : 'Finalize Diagnostics'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
