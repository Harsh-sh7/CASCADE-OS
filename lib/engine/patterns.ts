/**
 * lib/engine/patterns.ts
 * ─────────────────────────────────────────────────────────────────
 * Pattern detection over historical logs.
 * Returns 1 insight per call — the highest-priority pattern found.
 * ─────────────────────────────────────────────────────────────────
 */

import { IDailyLog } from '@/lib/models/DailyLog';
import { UserModelData } from '@/lib/models/User';

export interface PatternInsight {
  type: 'recurring_bottleneck' | 'ignore_pattern' | 'domain_correlation' | 'weekly';
  title: string;
  body: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  date: string;
}

// ─── Main Dispatcher ──────────────────────────────────────────────

export function detectPatterns(
  logs: IDailyLog[],
  userModel: UserModelData | null
): PatternInsight | null {
  if (logs.length < 3) return null;

  const today = new Date().toISOString().split('T')[0];
  const recent = logs.slice(0, 14); // work on last 14 days

  // Priority order: ignore > loop > recurring bottleneck > correlation
  const ignore     = detectIgnorePattern(recent, today);
  if (ignore) return ignore;

  const loop = detectLoopRepetition(recent, today);
  if (loop) return loop;

  const recurring  = detectRecurringBottleneck(recent, today);
  if (recurring) return recurring;

  const correlation = detectDomainCorrelation(recent, today);
  if (correlation) return correlation;

  return null;
}

// ─── Pattern 1: Ignore Pattern ───────────────────────────────────

export function detectIgnorePattern(logs: IDailyLog[], today: string): PatternInsight | null {
  const last5 = logs.slice(0, 5);
  const ignored = last5.filter(
    l => l.followUp.completed && l.followUp.feedback === 'ignored'
  ).length;

  if (ignored >= 3) {
    return {
      type: 'ignore_pattern',
      title: 'You\'ve been skipping recommendations',
      body: `You've ignored ${ignored} of the last ${last5.length} recommendations. This usually means the actions feel too hard, not the goals are wrong. The system is adjusting difficulty.`,
      severity: 'HIGH',
      date: today,
    };
  }

  // Check explicit thumbs-down feedback patterns
  const thumbsDown = logs.filter(l => l.feedback?.rating === 'down');
  if (thumbsDown.length >= 3) {
    const reasons = thumbsDown.map(l => l.feedback?.reason).filter(Boolean);
    const topReason = mostFrequent(reasons as string[]);
    return {
      type: 'ignore_pattern',
      title: `Recurring friction: ${formatReason(topReason)}`,
      body: `${thumbsDown.length} recommendations rated down with reason: "${formatReason(topReason)}". The engine is recalibrating to surface more realistic actions.`,
      severity: 'MEDIUM',
      date: today,
    };
  }

  return null;
}

// ─── Pattern 2: Loop Repetition ────────────────────────────────────

export function detectLoopRepetition(logs: IDailyLog[], today: string): PatternInsight | null {
  const last14 = logs.slice(0, 14);
  const allLoops = last14.flatMap(l => l.systemAnalysis.loops);
  if (allLoops.length === 0) return null;

  const freq = countFrequency(allLoops);
  const [topLoop, count] = Object.entries(freq).sort((a, b) => b[1] - a[1])[0] ?? [];

  if (count >= 4) {
    return {
      type: 'recurring_bottleneck',
      title: `Chronic Failure Loop: ${topLoop}`,
      body: `You have triggered the "${topLoop}" loop ${count} times in the last 14 days. This is a chronic systemic failure. The standard interventions are not working; you need a structural environment change.`,
      severity: 'HIGH',
      date: today,
    };
  }
  return null;
}

// ─── Pattern 3: Recurring Bottleneck (Stagnation) ─────────────────

export function detectRecurringBottleneck(logs: IDailyLog[], today: string): PatternInsight | null {
  const last7 = logs.slice(0, 7);
  const bottlenecks = last7.map(l => l.systemAnalysis.bottleneck);
  const freq = countFrequency(bottlenecks);
  const [topBottleneck, count] = Object.entries(freq).sort((a, b) => b[1] - a[1])[0] ?? [];

  if (count >= 5) {
    return {
      type: 'recurring_bottleneck',
      title: `System Stagnation: ${topBottleneck} is blocked`,
      body: `You have been stuck on ${topBottleneck} for ${count} of the last 7 days. You are stagnating. A complete pattern break is required today.`,
      severity: 'HIGH',
      date: today,
    };
  } else if (count >= 3) {
    const recoveryRate = last7
      .filter(l => l.systemAnalysis.bottleneck === topBottleneck && l.outcomeSuccess !== undefined)
      .map(l => l.outcomeSuccess ? 1 : 0);
    const successRate = recoveryRate.length > 0
      ? Math.round(recoveryRate.reduce((a: number, b: number) => a + b, 0) / recoveryRate.length * 100)
      : null;

    return {
      type: 'recurring_bottleneck',
      title: `${topBottleneck} has been blocking you for ${count} days`,
      body: successRate !== null
        ? `${topBottleneck} is your most persistent bottleneck (${count}/7 days). Recovery success rate: ${successRate}%. This suggests a structural issue, not a one-day fix.`
        : `${topBottleneck} has been your bottleneck for ${count} of the last ${last7.length} days. This may require a systemic change, not a daily intervention.`,
      severity: 'MEDIUM',
      date: today,
    };
  }

  return null;
}

// ─── Pattern 3: Domain Correlation ───────────────────────────────

export function detectDomainCorrelation(logs: IDailyLog[], today: string): PatternInsight | null {
  if (logs.length < 5) return null;

  // Check sleep < 5 → focus drops
  const lowSleepDays = logs.filter(l => l.morningState.sleep < 5);
  if (lowSleepDays.length >= 3) {
    const avgFocusDrop = lowSleepDays
      .filter(l => l.outcomeDelta?.focus !== undefined)
      .map(l => l.outcomeDelta!.focus as number)
      .reduce((sum, v) => sum + v, 0) / (lowSleepDays.length || 1);

    if (avgFocusDrop < -1) {
      return {
        type: 'domain_correlation',
        title: 'Sleep deprivation is systematically killing your focus',
        body: `On days where your sleep score is below 5, your focus drops by ${Math.abs(avgFocusDrop.toFixed(1) as any)} points on average. Sleep is not a luxury — it's a prerequisite for everything else in your system.`,
        severity: 'HIGH',
        date: today,
      };
    }
  }

  // Check stress > 7 → social drops
  const highStressDays = logs.filter(l => l.morningState.stress > 7);
  if (highStressDays.length >= 3) {
    const avgSocialDrop = highStressDays
      .filter(l => l.outcomeDelta?.social !== undefined)
      .map(l => l.outcomeDelta!.social as number)
      .reduce((sum, v) => sum + v, 0) / (highStressDays.length || 1);

    if (avgSocialDrop < -0.5) {
      return {
        type: 'domain_correlation',
        title: 'High stress is pushing you into isolation',
        body: `On high-stress days (stress > 7), your social score drops by ${Math.abs(avgSocialDrop.toFixed(1) as any)} points. This is the early signature of a Social Withdrawal loop.`,
        severity: 'MEDIUM',
        date: today,
      };
    }
  }

  return null;
}

// ─── Helpers ─────────────────────────────────────────────────────

function countFrequency(arr: string[]): Record<string, number> {
  return arr.reduce((acc, v) => ({ ...acc, [v]: (acc[v] ?? 0) + 1 }), {} as Record<string, number>);
}

function mostFrequent(arr: string[]): string {
  const freq = countFrequency(arr);
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';
}

function formatReason(reason: string): string {
  const map: Record<string, string> = {
    too_hard:     'Too hard to execute',
    no_time:      'Not enough time',
    not_relevant: 'Doesn\'t feel relevant',
    ineffective:  'Felt ineffective',
    other:        'Other',
  };
  return map[reason] ?? reason;
}
