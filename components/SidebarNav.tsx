'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, PlusCircle, Network, ListTodo, PieChart, Settings, Sliders, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function SidebarNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [plan, setPlan] = useState<'FREE' | 'PRO' | 'POWER'>('FREE');

  useEffect(() => {
    setMounted(true);
    const fetchPlan = () => {
      fetch('/api/user/settings')
        .then(r => r.json())
        .then(d => { if (d.plan) setPlan(d.plan); })
        .catch(() => {});
    };

    fetchPlan();

    window.addEventListener('subscription-updated', fetchPlan);
    return () => window.removeEventListener('subscription-updated', fetchPlan);
  }, [pathname]); // Refetch when pathname changes as a cheap way to catch upgrades

  if (!mounted) return null;

  const NAV_ITEMS = [
    { href: '/dashboard', icon: Activity, label: '01_BOTTLENECK', req: 'FREE' },
    { href: '/dashboard/intake', icon: PlusCircle, label: '02_INTAKE', req: 'FREE' },
    { href: '/dashboard/map', icon: Network, label: '03_MAP', req: 'FREE' },
    { href: '/dashboard/decisions', icon: ListTodo, label: '04_DECISIONS', req: 'FREE' },
    { href: '/dashboard/resources', icon: PieChart, label: '05_RESOURCES', req: 'FREE' },
    { href: '/dashboard/simulation', icon: FlaskConical, label: '06_SIMULATION', req: 'PRO' },
    { href: '/dashboard/rules', icon: Sliders, label: '07_RULES', req: 'POWER' },
    { href: '/dashboard/settings', icon: Settings, label: '00_SETTINGS', req: 'FREE' },
  ];

  const hasAccess = (req: string) => {
    if (req === 'FREE') return true;
    if (req === 'PRO' && (plan === 'PRO' || plan === 'POWER')) return true;
    if (req === 'POWER' && plan === 'POWER') return true;
    return false;
  };

  const visibleNavs = NAV_ITEMS.filter(n => hasAccess(n.req));

  return (
    <aside className="w-64 fixed top-0 left-0 h-screen bg-black border-r border-zinc-900 flex flex-col font-mono z-50">
      <div className="p-6 border-b border-zinc-900">
        <div className="w-8 h-8 border border-white flex items-center justify-center bg-white mb-4">
          <span className="text-black font-bold">C</span>
        </div>
        <h1 className="text-white font-bold text-sm tracking-widest uppercase">Cascade_OS</h1>
        <p className="text-zinc-500 text-[10px] mt-1 tracking-widest uppercase">System Control</p>
      </div>
      
      <div className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto">
        {visibleNavs.map(({ href, icon: Icon, label, req }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-6 py-3 transition-colors duration-200 border-l-2',
                req === 'FREE'
                  ? active ? 'border-white bg-zinc-950 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                  : 'bg-white text-black border-white hover:bg-zinc-200 mt-2'
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={active && req === 'FREE' ? 2 : 1.5} />
              <span className={cn("flex-1 text-xs tracking-widest uppercase", active ? "font-bold" : "font-medium")}>{label}</span>
              {req !== 'FREE' && (
                <span className="text-[8px] tracking-widest uppercase border px-1 border-black text-black font-bold">
                  {req}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-6 border-t border-zinc-900">
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border border-zinc-800">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-white animate-pulse" />
             <span className="text-white text-[10px] tracking-widest uppercase font-bold">ACTIVE</span>
          </div>
          <span className="text-zinc-600 text-[10px] tracking-widest uppercase">{plan} TIER</span>
        </div>
      </div>
    </aside>
  );
}
