/**
 * lib/reports/weekly.ts
 * ─────────────────────────────────────────────────────────────────
 * Weekly report generator.
 * Produces a structured summary of the last 7 days:
 *   - top bottleneck
 *   - most effective intervention
 *   - biggest failure
 *   - next focus recommendation
 * ─────────────────────────────────────────────────────────────────
 */

import { IDailyLog } from '@/lib/models/DailyLog';
import { UserModelData } from '@/lib/models/User';

export interface WeeklyReport {
  weekOf: string;
  daysLogged: number;
  topBottleneck: { domain: string; days: number; avgRecovery: string };
  bestIntervention: { action: string; successRate: number; domain: string } | null;
  biggestFailure: { domain: string; reason: string } | null;
  nextFocus: string;
  systemTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  domainAverages: Record<string, number>;
  insightSummary: string;
  // For email/telegram rendering
  html: string;
  text: string;
}

export function generateWeeklyReport(
  logs: IDailyLog[],
  userModel: UserModelData | null,
): WeeklyReport {
  const last7 = logs.slice(0, 7);
  const weekOf = last7[last7.length - 1]?.date ?? new Date().toISOString().split('T')[0];

  // ── Top Bottleneck ──────────────────────────────────────────────
  const bottleneckFreq: Record<string, number> = {};
  last7.forEach(l => {
    const b = l.systemAnalysis.bottleneck;
    bottleneckFreq[b] = (bottleneckFreq[b] ?? 0) + 1;
  });
  const [topBN, topBNDays] = Object.entries(bottleneckFreq)
    .sort((a, b) => b[1] - a[1])[0] ?? ['unknown', 0];
  const bLogs = last7.filter(l => l.systemAnalysis.bottleneck === topBN && l.outcomeSuccess !== undefined);
  const bSuccessRate = bLogs.length > 0
    ? bLogs.filter(l => l.outcomeSuccess).length / bLogs.length
    : 0;

  // ── Best Intervention ───────────────────────────────────────────
  const followedLogs = last7.filter(l => l.followUp.feedback === 'followed' && l.outcomeSuccess !== undefined);
  let bestIntervention: WeeklyReport['bestIntervention'] = null;
  if (followedLogs.length > 0) {
    const successfulLogs = followedLogs.filter(l => l.outcomeSuccess);
    if (successfulLogs.length > 0) {
      const best = successfulLogs[0];
      const successRate = successfulLogs.length / followedLogs.length;
      bestIntervention = {
        action: best.systemAnalysis.recommendation.action,
        successRate: parseFloat(successRate.toFixed(2)),
        domain: best.systemAnalysis.bottleneck,
      };
    }
  }

  // ── Biggest Failure ─────────────────────────────────────────────
  const failedLogs = last7.filter(l => l.outcomeSuccess === false);
  let biggestFailure: WeeklyReport['biggestFailure'] = null;
  if (failedLogs.length > 0) {
    const failedBN = mostFrequent(failedLogs.map(l => l.systemAnalysis.bottleneck));
    const topReason = last7
      .filter(l => l.feedback?.rating === 'down' && l.feedback?.reason)
      .map(l => l.feedback!.reason as string);
    biggestFailure = {
      domain: failedBN,
      reason: topReason.length > 0 ? formatReason(mostFrequent(topReason)) : 'Outcome didn\'t improve as predicted',
    };
  }

  // ── Domain Averages ─────────────────────────────────────────────
  const domainAverages: Record<string, number> = {};
  const domainKeys = ['sleep', 'energy', 'focus', 'stress', 'health', 'social'] as const;
  domainKeys.forEach(d => {
    const vals = last7.map(l => l.morningState[d]).filter(v => v !== undefined);
    domainAverages[d] = vals.length > 0
      ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
      : 0;
  });

  // ── System Trend ────────────────────────────────────────────────
  let systemTrend: WeeklyReport['systemTrend'] = 'STABLE';
  if (last7.length >= 4) {
    const firstHalf  = last7.slice(Math.ceil(last7.length / 2));
    const secondHalf = last7.slice(0, Math.floor(last7.length / 2));
    const avgFirst  = avg(firstHalf.map(l => (10 - l.morningState.stress + l.morningState.energy + l.morningState.focus) / 3));
    const avgSecond = avg(secondHalf.map(l => (10 - l.morningState.stress + l.morningState.energy + l.morningState.focus) / 3));
    if (avgSecond > avgFirst + 0.5) systemTrend = 'IMPROVING';
    else if (avgSecond < avgFirst - 0.5) systemTrend = 'DECLINING';
  }

  // ── Next Focus ──────────────────────────────────────────────────
  const worstDomain = Object.entries(domainAverages)
    .filter(([k]) => k !== 'stress')
    .sort((a, b) => a[1] - b[1])[0];
  const nextFocus = worstDomain
    ? `Address ${worstDomain[0]} (avg ${worstDomain[1]}/10 this week) — this has been your consistent weak point.`
    : 'Maintain current trajectory.';

  // ── Insight Summary ─────────────────────────────────────────────
  const insightSummary =
    systemTrend === 'IMPROVING'
      ? `Strong week. Your system improved across the second half. Focus on locking in ${topBN} recovery as a habit.`
      : systemTrend === 'DECLINING'
      ? `This week showed decay. ${topBN} has been the persistent drag — it's likely structural, not behavioral.`
      : `Stable week. No major swings. The system is in maintenance mode — a good time to tackle ${topBN} proactively.`;

  // ── Render ──────────────────────────────────────────────────────
  const text = buildTextReport({ topBN, topBNDays, bSuccessRate, bestIntervention, biggestFailure, nextFocus, systemTrend, insightSummary, domainAverages, weekOf });
  const html = buildHtmlReport({ topBN, topBNDays, bSuccessRate, bestIntervention, biggestFailure, nextFocus, systemTrend, insightSummary, domainAverages, weekOf });

  return {
    weekOf,
    daysLogged: last7.length,
    topBottleneck: { domain: topBN, days: topBNDays, avgRecovery: `${Math.round((1 - bSuccessRate) * 7)} day(s)` },
    bestIntervention,
    biggestFailure,
    nextFocus,
    systemTrend,
    domainAverages,
    insightSummary,
    html,
    text,
  };
}

// ─── Renderers ────────────────────────────────────────────────────

function buildTextReport(d: any): string {
  return `
CASCADE OS — Weekly System Report (${d.weekOf})
${'─'.repeat(45)}

SYSTEM TREND: ${d.systemTrend}

TOP BOTTLENECK: ${d.topBN} (${d.topBNDays}/7 days)
${d.bestIntervention ? `BEST INTERVENTION: "${d.bestIntervention.action}" — ${Math.round(d.bestIntervention.successRate * 100)}% success` : 'NO SUCCESSFUL INTERVENTIONS YET'}
${d.biggestFailure ? `BIGGEST FAILURE: ${d.biggestFailure.domain} — ${d.biggestFailure.reason}` : ''}

DOMAIN AVERAGES:
${Object.entries(d.domainAverages).map(([k, v]) => `  ${k}: ${v}/10`).join('\n')}

NEXT FOCUS: ${d.nextFocus}

SYSTEM INSIGHT: ${d.insightSummary}

─────────────────────────────────────────────────
CASCADE OS Engine | Adaptive Intelligence Layer
`.trim();
}

function buildHtmlReport(d: any): string {
  const trendColor = d.systemTrend === 'IMPROVING' ? '#10b981' : d.systemTrend === 'DECLINING' ? '#ef4444' : '#f59e0b';
  return `
<div style="font-family:Inter,sans-serif;background:#0a0a0f;color:#e2e8f0;padding:32px;border-radius:16px;max-width:600px;">
  <h2 style="color:#a78bfa;margin:0 0 4px">CASCADE OS</h2>
  <p style="color:#64748b;margin:0 0 24px">Weekly System Report — ${d.weekOf}</p>
  <div style="background:#131318;border-radius:12px;padding:16px;margin-bottom:16px">
    <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px">System Trend</span>
    <p style="color:${trendColor};font-size:20px;font-weight:bold;margin:4px 0">${d.systemTrend}</p>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
    <div style="background:#131318;border-radius:12px;padding:16px">
      <span style="color:#64748b;font-size:11px;text-transform:uppercase">Top Bottleneck</span>
      <p style="color:#a78bfa;font-weight:bold;margin:4px 0;text-transform:capitalize">${d.topBN}</p>
      <p style="color:#64748b;font-size:12px;margin:0">${d.topBNDays}/7 days</p>
    </div>
    <div style="background:#131318;border-radius:12px;padding:16px">
      <span style="color:#64748b;font-size:11px;text-transform:uppercase">Next Focus</span>
      <p style="color:#e2e8f0;font-size:13px;margin:4px 0">${d.nextFocus}</p>
    </div>
  </div>
  <div style="background:#131318;border-radius:12px;padding:16px;margin-bottom:16px">
    <span style="color:#64748b;font-size:11px;text-transform:uppercase">System Insight</span>
    <p style="color:#e2e8f0;font-size:14px;line-height:1.6;margin:8px 0">${d.insightSummary}</p>
  </div>
  <p style="color:#334155;font-size:11px;text-align:center;margin:0">CASCADE OS Adaptive Intelligence | Not for the average</p>
</div>`;
}

// ─── Helpers ─────────────────────────────────────────────────────

function mostFrequent(arr: string[]): string {
  const freq = arr.reduce((a, v) => ({ ...a, [v]: (a[v] ?? 0) + 1 }), {} as Record<string, number>);
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function formatReason(r: string): string {
  const m: Record<string, string> = { too_hard: 'Too hard', no_time: 'No time', not_relevant: 'Not relevant', ineffective: 'Felt ineffective', other: 'Other' };
  return m[r] ?? r;
}

// ─── Weekly Narrative ────────────────────────────────────────────

export interface WeeklyNarrative {
  primaryBottleneck: string;
  biggestLeak: string;
  mostEffectiveAction: string;
  systemInsight: string;
  nextFocus: string;
}

/**
 * Generate a human-readable weekly narrative.
 * Reads like a system diagnosis, not an analytics report.
 */
export function generateWeeklyNarrative(logs: IDailyLog[]): WeeklyNarrative {
  const last7 = logs.slice(0, 7);

  // Primary bottleneck
  const bnFreq: Record<string, number> = {};
  last7.forEach(l => {
    const b = l.systemAnalysis.bottleneck;
    bnFreq[b] = (bnFreq[b] ?? 0) + 1;
  });
  const [topBN, topBNDays] = Object.entries(bnFreq).sort((a, b) => b[1] - a[1])[0] ?? ['unknown', 0];
  const primaryBottleneck = `${capitalize(topBN)} appeared ${topBNDays} of ${last7.length} days. This isn't a one-off — it's a structural constraint.`;

  // Biggest leak: domain that decayed most
  const domainKeys = ['sleep', 'energy', 'focus', 'stress', 'health', 'social'] as const;
  let worstDecay = { domain: '', delta: 0 };
  domainKeys.forEach(d => {
    const vals = last7.map(l => l.morningState[d]).filter(v => v !== undefined);
    if (vals.length >= 3) {
      const early = avg(vals.slice(-3));
      const recent = avg(vals.slice(0, 3));
      const delta = recent - early;
      if (delta < worstDecay.delta) {
        worstDecay = { domain: d, delta };
      }
    }
  });
  const biggestLeak = worstDecay.domain
    ? `${capitalize(worstDecay.domain)} dropped ${Math.abs(worstDecay.delta).toFixed(1)} points over the week. This is your biggest resource drain.`
    : 'No significant domain decay detected this week.';

  // Most effective action
  const successfulLogs = last7.filter(l => l.followUp.feedback === 'followed' && l.outcomeSuccess);
  const mostEffectiveAction = successfulLogs.length > 0
    ? `"${successfulLogs[0].systemAnalysis.recommendation.action}" — this worked. The system learned from it.`
    : 'No completed actions produced measurable improvement yet. Keep logging.';

  // System insight
  const successCount = last7.filter(l => l.outcomeSuccess).length;
  const totalTracked = last7.filter(l => l.outcomeSuccess !== undefined).length;
  const rate = totalTracked > 0 ? successCount / totalTracked : 0;
  let systemInsight: string;
  if (rate > 0.7) {
    systemInsight = 'The system is calibrated well. Most predictions are landing. Focus on consistency, not change.';
  } else if (rate > 0.4) {
    systemInsight = 'Predictions are mixed. The adaptive layer is still learning your response patterns. More data improves accuracy.';
  } else if (totalTracked > 0) {
    systemInsight = 'Most recommendations didn\'t produce the expected outcome. The system will recalibrate next week.';
  } else {
    systemInsight = 'Not enough evening check-ins to evaluate prediction quality. Complete check-ins to unlock adaptive intelligence.';
  }

  // Next focus
  const avgByDomain: Record<string, number> = {};
  domainKeys.forEach(d => {
    const vals = last7.map(l => l.morningState[d]).filter(v => v !== undefined);
    avgByDomain[d] = vals.length ? avg(vals) : 5;
  });
  const weakest = Object.entries(avgByDomain)
    .filter(([k]) => k !== 'stress')
    .sort((a, b) => a[1] - b[1])[0];
  const nextFocus = weakest
    ? `${capitalize(weakest[0])} averaged ${weakest[1].toFixed(1)}/10. This is where your next breakthrough hides.`
    : 'Maintain current trajectory.';

  return { primaryBottleneck, biggestLeak, mostEffectiveAction, systemInsight, nextFocus };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
