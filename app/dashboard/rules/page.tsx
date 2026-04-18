'use client';

import { useEffect, useState } from 'react';
import { Terminal, Shield, Plus, Trash2, CheckSquare, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DomainNode } from '@/lib/engine/graph';

interface IPolicy {
  id: string;
  conditionDomain: string;
  conditionOp: 'lt' | 'gt' | 'eq';
  conditionValue: number;
  action: string;
  active: boolean;
}

const DOMAINS = ['sleep', 'work', 'money', 'energy', 'attention', 'health', 'learning', 'relationships', 'time'];
const OPERATORS = [
  { id: 'lt', label: '< (Drops below)' },
  { id: 'gt', label: '> (Exceeds)' },
  { id: 'eq', label: '= (Exactly)' }
];

export default function RulesEngineView() {
  const [policies, setPolicies] = useState<IPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/rules')
      .then(r => r.json())
      .then(d => { setPolicies(d.policies || []); setLoading(false); });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policies }),
    });
    setSaving(false);
  };

  const addRule = () => {
    setPolicies([...policies, {
      id: `pol_${Date.now()}`,
      conditionDomain: 'energy',
      conditionOp: 'lt',
      conditionValue: 4,
      action: 'Enter containment mode and block deep work.',
      active: true
    }]);
  };

  const updateRule = (id: string, field: keyof IPolicy, value: any) => {
    setPolicies(policies.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeRule = (id: string) => {
    setPolicies(policies.filter(p => p.id !== id));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-black font-mono">
        <div className="w-2 h-2 bg-white animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black font-mono p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase mb-2">Rules Engine</h1>
          <p className="text-zinc-500 text-sm">Deterministic override protocols (IF → THEN statements).</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 border border-white text-white font-bold tracking-widest uppercase text-sm hover:bg-white hover:text-black transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Compile Policy
        </button>
      </div>

      <div className="space-y-6 mb-8">
        {policies.length === 0 && (
          <div className="p-8 border border-zinc-800 border-dashed text-center">
            <Terminal className="w-6 h-6 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500">No user-defined policies active. System relies entirely on default heuristics.</p>
          </div>
        )}

        {policies.map((p) => (
          <div key={p.id} className={cn("p-6 border transition-colors", p.active ? "border-zinc-700 bg-zinc-900/20" : "border-zinc-800 bg-black opacity-50")}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Shield className={cn("w-4 h-4", p.active ? "text-white" : "text-zinc-600")} />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Policy Object [{p.id}]</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => updateRule(p.id, 'active', !p.active)}
                  className={cn("text-[10px] tracking-widest uppercase px-2 py-1 border transition-colors", p.active ? "border-white text-white" : "border-zinc-700 text-zinc-500")}
                >
                  {p.active ? 'ACTIVE' : 'BYPASSED'}
                </button>
                <button onClick={() => removeRule(p.id)} className="text-zinc-500 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="col-span-12 md:col-span-2 text-zinc-400 font-bold uppercase tracking-widest text-sm">IF</div>
              <div className="col-span-12 md:col-span-3">
                <select 
                  className="w-full bg-black border border-zinc-700 text-white p-3 outline-none focus:border-white uppercase text-xs tracking-widest"
                  value={p.conditionDomain}
                  onChange={(e) => updateRule(p.id, 'conditionDomain', e.target.value)}
                >
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-span-12 md:col-span-3">
                <select 
                  className="w-full bg-black border border-zinc-700 text-white p-3 outline-none focus:border-white uppercase text-xs tracking-widest"
                  value={p.conditionOp}
                  onChange={(e) => updateRule(p.id, 'conditionOp', e.target.value)}
                >
                  {OPERATORS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              <div className="col-span-12 md:col-span-4">
                <input 
                  type="number"
                  min="1" max="10"
                  placeholder="Value (1-10)"
                  className="w-full bg-black border border-zinc-700 text-white p-3 outline-none focus:border-white text-sm"
                  value={p.conditionValue}
                  onChange={(e) => updateRule(p.id, 'conditionValue', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start mt-4">
              <div className="col-span-12 md:col-span-2 text-white font-bold uppercase tracking-widest text-sm pt-3">THEN</div>
              <div className="col-span-12 md:col-span-10">
                <input 
                  type="text"
                  placeholder="Execute this directive..."
                  className="w-full bg-black border border-zinc-700 text-white p-3 outline-none focus:border-white text-sm placeholder:text-zinc-700"
                  value={p.action}
                  onChange={(e) => updateRule(p.id, 'action', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addRule}
        className="w-full py-4 border border-zinc-800 text-zinc-500 font-bold uppercase tracking-widest text-sm hover:border-zinc-500 hover:text-white transition-colors flex items-center justify-center gap-2 border-dashed"
      >
        <Plus className="w-4 h-4" /> Add Policy Override
      </button>

    </div>
  );
}
