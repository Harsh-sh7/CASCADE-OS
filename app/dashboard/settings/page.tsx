'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Bell, Send, LogOut, CheckCircle2, Loader2, Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramStep, setTelegramStep] = useState<'idle' | 'pending' | 'done'>('idle');
  const [connectToken, setConnectToken] = useState('');
  const [botUsername, setBotUsername] = useState('your_cascade_bot');
  const [saveStatus, setSaveStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<'FREE' | 'PRO' | 'POWER'>('FREE');
  const [upgradingTo, setUpgradingTo] = useState<'FREE' | 'PRO' | 'POWER' | null>(null);

  // Load saved settings on mount
  useEffect(() => {
    fetch('/api/notifications/settings')
      .then(r => r.json())
      .then(data => {
        if (data.notifications) {
          const n = data.notifications;
          setEmailEnabled(n.email ?? true);
          setTelegramEnabled(n.telegram ?? false);
          if (n.telegramChatId) {
            setTelegramStep('done');
          }
        }
      })
      .catch(() => {});

    fetch('/api/user/settings')
      .then(r => r.json())
      .then(data => {
        if (data.plan) setPlan(data.plan);
      })
      .catch(() => {});
  }, []);

  const saveNotifications = async () => {
    setLoading(true);
    setSaveStatus('');
    const res = await fetch('/api/notifications/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailEnabled, telegram: telegramEnabled }),
    });
    if (res.ok) setSaveStatus('Saved');
    setLoading(false);
  };

  const connectTelegram = async () => {
    setTelegramStep('pending');
    const res = await fetch('/api/notifications/telegram/connect', { method: 'POST' });
    const data = await res.json();
    if (data.token) {
      setConnectToken(data.token);
      if (data.botUsername) setBotUsername(data.botUsername);
    }
  };

  const pollTelegram = async () => {
    setLoading(true);
    setSaveStatus('');
    const res = await fetch('/api/notifications/telegram/poll', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setTelegramStep('done');
      setSaveStatus('Saved');
    } else {
      setSaveStatus('not_found');
    }
    setLoading(false);
  };

  const upgradePlan = async (newPlan: 'FREE' | 'PRO' | 'POWER') => {
    if (newPlan === plan || upgradingTo) return;
    setUpgradingTo(newPlan);
    await new Promise(r => setTimeout(r, 1800)); // Let payment animation breathe
    const res = await fetch('/api/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan: newPlan }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      setPlan(newPlan);
      window.dispatchEvent(new Event('subscription-updated'));
    }
    setUpgradingTo(null);
  };

  return (
    <>
    {/* Payment Processing Overlay */}
    {upgradingTo && (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center font-mono">
        <div className="border border-zinc-800 bg-black p-10 flex flex-col items-center gap-6 max-w-xs w-full">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 border-2 border-zinc-800 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-white rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest">PROCESSING_PAYMENT</p>
            <p className="text-white text-sm font-bold uppercase tracking-widest">{upgradingTo}_TIER</p>
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest">Securing license key...</p>
          </div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )}
    <div className="pt-8 pb-12 space-y-12 animate-fade-in max-w-4xl mx-auto px-6 font-mono bg-black min-h-screen">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-widest uppercase mb-2">System Control</h1>
        <p className="text-zinc-500 text-sm">Account, Subscription, and Notification Preferences</p>
      </div>

      {/* Account */}
      <div className="space-y-4">
        <p className="text-zinc-500 text-xs tracking-widest uppercase font-bold border-b border-zinc-800 pb-2">Operator Identity</p>
        <div className="flex items-center justify-between border border-zinc-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border border-zinc-500 bg-zinc-900 flex items-center justify-center text-white font-bold uppercase text-lg">
              {session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? 'U'}
            </div>
            <div>
              <p className="text-white text-md font-bold uppercase tracking-widest">{session?.user?.name || 'Operator'}</p>
              <p className="text-zinc-500 text-xs">{session?.user?.email}</p>
            </div>
          </div>
          <button
            id="signout-btn"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-red-900 bg-red-950/20 text-red-500 text-sm hover:bg-red-900 hover:text-white transition-all uppercase tracking-widest font-bold"
          >
            <LogOut className="w-4 h-4" /> Disconnect
          </button>
        </div>
      </div>

      {/* Subscription Grid */}
      <div className="space-y-4">
        <p className="text-zinc-500 text-xs tracking-widest uppercase font-bold border-b border-zinc-800 pb-2">System Licensing</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FREE */}
          <div 
            className={cn(
              "p-6 border transition-all flex flex-col h-full", 
              plan === 'FREE' ? "border-white bg-zinc-900/30" : "border-zinc-800 bg-black cursor-pointer hover:border-zinc-500"
            )}
            onClick={() => upgradePlan('FREE')}
          >
            <div className="mb-6">
              <h3 className="text-white font-bold tracking-widest uppercase text-xl mb-1 flex items-center justify-between">
                Standard
                {plan === 'FREE' && <CheckCircle2 className="w-5 h-5 text-zinc-400" />}
              </h3>
              <p className="text-zinc-500 text-xs h-8">$0 / month</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-zinc-600 shrink-0" /> Core Engine Engine</li>
              <li className="flex gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-zinc-600 shrink-0" /> 8 Life Domains mapped</li>
              <li className="flex gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-zinc-600 shrink-0" /> Ripple Map Explorer</li>
              <li className="flex gap-2 text-zinc-300 text-sm"><Check className="w-4 h-4 text-zinc-600 shrink-0" /> Bottleneck Triage AI</li>
            </ul>
            <button 
              className={cn("w-full py-3 text-sm font-bold uppercase tracking-widest text-center transition-all", plan === 'FREE' ? "text-zinc-500 cursor-default" : "border border-zinc-800 text-white hover:bg-white hover:text-black")}
            >
              {plan === 'FREE' ? 'Active' : 'Downgrade'}
            </button>
          </div>

          {/* PRO */}
          <div 
            className={cn(
              "p-6 border transition-all flex flex-col h-full", 
              plan === 'PRO' ? "border-white bg-zinc-900/30" : "border-zinc-800 bg-black cursor-pointer hover:border-zinc-500"
            )}
            onClick={() => upgradePlan('PRO')}
          >
            <div className="mb-6">
              <h3 className="text-white font-bold tracking-widest uppercase text-xl mb-1 flex items-center justify-between">
                Pro
                {plan === 'PRO' && <CheckCircle2 className="w-5 h-5 text-white" />}
              </h3>
              <p className="text-zinc-500 text-xs h-8">$12 / month</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2 text-white text-sm"><Check className="w-4 h-4 text-white shrink-0" /> Impact Simulator</li>
              <li className="flex gap-2 text-white text-sm"><Check className="w-4 h-4 text-white shrink-0" /> Unlimited Scenarios</li>
              <li className="flex gap-2 text-white text-sm"><Check className="w-4 h-4 text-white shrink-0" /> Advanced Trend Metrics</li>
              <li className="flex gap-2 text-white text-sm"><Check className="w-4 h-4 text-white shrink-0" /> Priority API Access</li>
            </ul>
            <button 
              className={cn("w-full py-3 text-sm font-bold uppercase tracking-widest text-center transition-all", plan === 'PRO' ? "text-zinc-500 cursor-default" : "border border-white text-white hover:bg-white hover:text-black")}
            >
              {plan === 'PRO' ? 'Active' : 'Unlock Pro'}
            </button>
          </div>

          {/* POWER */}
          <div 
            className={cn(
              "p-6 border transition-all flex flex-col h-full", 
              plan === 'POWER' ? "border-white bg-zinc-900/30" : "border-zinc-800 bg-black cursor-pointer hover:border-zinc-500"
            )}
            onClick={() => upgradePlan('POWER')}
          >
            <div className="mb-6">
              <h3 className="text-white font-bold tracking-widest uppercase text-xl mb-1 flex items-center justify-between">
                Power
                {plan === 'POWER' && <CheckCircle2 className="w-5 h-5 text-white" />}
              </h3>
              <p className="text-zinc-500 text-xs h-8">$29 / month</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2 text-white text-sm"><Check className="w-4 h-4 text-white shrink-0" /> Rules Override Engine</li>
              <li className="flex gap-2 text-white text-sm"><Check className="w-4 h-4 text-white shrink-0" /> Multi-Condition IF/THEN</li>
              <li className="flex gap-2 text-white text-sm"><Check className="w-4 h-4 text-white shrink-0" /> Native Integrations</li>
              <li className="flex gap-2 text-white text-sm"><Check className="w-4 h-4 text-white shrink-0" /> Agentic Execution Access</li>
            </ul>
            <button 
              className={cn("w-full py-3 text-sm font-bold uppercase tracking-widest text-center transition-all", plan === 'POWER' ? "text-zinc-500 cursor-default" : "border border-white bg-white text-black hover:bg-transparent hover:text-white")}
            >
              {plan === 'POWER' ? 'Active' : 'Unlock Power'}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <p className="text-zinc-500 text-xs tracking-widest uppercase font-bold border-b border-zinc-800 pb-2">Telemetry & Transmissions</p>

        {/* Email toggle */}
        <div className="flex items-center justify-between py-6 border-b border-zinc-900">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-zinc-700 flex items-center justify-center bg-zinc-900">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold uppercase tracking-widest">Email Intercom</p>
              <p className="text-zinc-500 text-xs">Rich text daily briefs with layout maps.</p>
            </div>
          </div>
          <button
            id="email-toggle"
            onClick={() => setEmailEnabled(v => !v)}
            className={cn("px-4 py-2 text-xs uppercase tracking-widest font-bold border transition-colors", emailEnabled ? "border-white bg-white text-black" : "border-zinc-800 text-zinc-500 hover:border-zinc-500")}
          >
            {emailEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Telegram toggle */}
        <div className="flex items-center justify-between py-6 border-b border-zinc-900">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-zinc-700 flex items-center justify-center bg-zinc-900">
              <Send className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold uppercase tracking-widest">Telegram Uplink</p>
              <p className="text-zinc-500 text-xs">Instant push messaging via protocol bot.</p>
            </div>
          </div>
          <button
            id="telegram-toggle"
            onClick={() => setTelegramEnabled(v => !v)}
            className={cn("px-4 py-2 text-xs uppercase tracking-widest font-bold border transition-colors", telegramEnabled ? "border-white bg-white text-black" : "border-zinc-800 text-zinc-500 hover:border-zinc-500")}
          >
            {telegramEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Telegram connect flow */}
        {telegramEnabled && (
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 space-y-4">
            {telegramStep === 'idle' && (
              <>
                <p className="text-zinc-400 text-sm">Generate a session token to synchronize external hardware (Telegram).</p>
                <button
                  onClick={connectTelegram}
                  className="px-6 py-3 border border-white text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                >
                  Generate Token Ping
                </button>
              </>
            )}
            {telegramStep === 'pending' && connectToken && (
              <div className="space-y-4">
                <p className="text-zinc-400 text-sm">Transmit this command sequence to <span className="text-white font-bold">@{botUsername}</span>:</p>
                <div className="bg-black border border-zinc-800 px-6 py-4 font-mono text-white select-all text-center text-lg tracking-widest">
                  /connect {connectToken}
                </div>
                <p className="text-zinc-600 text-[10px] uppercase tracking-widest">Packet expires in 10 minutes. Acknowledge post-transmission.</p>
                <button
                  onClick={pollTelegram}
                  disabled={loading}
                  className="w-full py-4 border border-white text-white font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verifying Link...' : 'Verify Uplink'}
                </button>
                {saveStatus === 'not_found' && (
                  <p className="text-red-500 text-xs uppercase tracking-widest text-center font-bold mt-2">Packet Lost. Ensure command was received by bot.</p>
                )}
              </div>
            )}
            {telegramStep === 'done' && (
              <div className="flex items-center gap-2 text-white font-bold uppercase tracking-widest text-sm">
                <CheckCircle2 className="w-4 h-4" /> Uplink Synchronized
              </div>
            )}
          </div>
        )}

        {/* Save button */}
        <button
          onClick={saveNotifications}
          disabled={loading}
          className="w-full mt-6 py-4 border border-zinc-800 text-zinc-500 font-bold uppercase tracking-widest text-sm hover:border-white hover:text-white transition-colors disabled:opacity-50"
        >
          {loading ? 'Compiling...' : saveStatus === 'Saved' ? 'Settings Saved' : 'Apply Configuration'}
        </button>
      </div>

    </div>
    </>
  );
}
