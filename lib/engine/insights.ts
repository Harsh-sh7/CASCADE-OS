/**
 * lib/engine/insights.ts
 * ─────────────────────────────────────────────────────────────────
 * System Insight Layer
 *
 * Generates 1–2 non-obvious, graph-derived insights explaining
 * why the system is in its current state. Not advice — diagnosis.
 * ─────────────────────────────────────────────────────────────────
 */

import { DomainNode, DEPENDENCY_GRAPH } from './graph';
import { IDailyLog } from '@/lib/models/DailyLog';

export interface SystemInsight {
  text: string;
  driver: DomainNode;      // the causal domain
  target: DomainNode;      // the affected domain
  severity: 'HIGH' | 'MEDIUM';
}

/**
 * Generates 1–2 causal insights from current state + history.
 * Looks for hidden drivers — domains that are causing visible problems
 * elsewhere in the graph.
 */
export function generateInsights(
  states: Record<DomainNode, number>,
  bottleneck: string,
  recentLogs: IDailyLog[]
): SystemInsight[] {
  const insights: SystemInsight[] = [];

  // 1. Find hidden causation: a domain that's low AND has strong edges
  //    to the bottleneck, but ISN'T the bottleneck itself
  const edgesToBottleneck = DEPENDENCY_GRAPH.filter(e => e.to === bottleneck && e.from !== bottleneck);
  for (const edge of edgesToBottleneck) {
    const driverState = states[edge.from] ?? 5;
    const isNegativeEdge = edge.weight < 0;

    // If driver is low and has positive edge → it's dragging bottleneck down
    if (!isNegativeEdge && driverState < 5 && Math.abs(edge.weight) >= 0.5) {
      insights.push({
        text: `Your ${bottleneck} issue is being driven by low ${edge.from} (${driverState}/10), not by ${bottleneck} itself.`,
        driver: edge.from,
        target: bottleneck as DomainNode,
        severity: driverState < 3 ? 'HIGH' : 'MEDIUM',
      });
    }
    // If driver is high and has negative edge → it's actively hurting bottleneck
    if (isNegativeEdge && driverState > 6 && Math.abs(edge.weight) >= 0.5) {
      insights.push({
        text: `High ${edge.from} (${driverState}/10) is actively suppressing your ${bottleneck}.`,
        driver: edge.from,
        target: bottleneck as DomainNode,
        severity: driverState > 8 ? 'HIGH' : 'MEDIUM',
      });
    }
  }

  // 2. Historical pattern: domain correlation from logs
  if (recentLogs.length >= 3) {
    // Check if a domain has been stable while others decay
    const domains: DomainNode[] = ['sleep', 'work', 'money', 'energy', 'attention', 'health', 'learning', 'relationships'];
    const stableDomains = domains.filter(d => {
      const vals = recentLogs.slice(0, 5).map(l => {
        const s = l.morningState;
        return (s as any)[d] ?? 5;
      });
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return avg >= 7; // consistently good
    });

    const decayingDomains = domains.filter(d => {
      const vals = recentLogs.slice(0, 5).map(l => {
        const s = l.morningState;
        return (s as any)[d] ?? 5;
      });
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return avg < 4;
    });

    if (stableDomains.length > 0 && decayingDomains.length > 0) {
      const stable = stableDomains[0];
      const decaying = decayingDomains[0];
      // Only add if not already covered
      if (!insights.find(i => i.driver === stable && i.target === decaying)) {
        insights.push({
          text: `${capitalize(stable)} is stable at ${states[stable] ?? 5}/10. The real constraint is ${decaying} — that's where the system is bleeding.`,
          driver: stable,
          target: decaying,
          severity: 'MEDIUM',
        });
      }
    }
  }

  // 3. Counter-narrative: if user thinks they need X, but graph says Y
  const lowestDomain = (Object.entries(states) as [DomainNode, number][])
    .sort((a, b) => a[1] - b[1])[0];

  if (lowestDomain && lowestDomain[0] !== bottleneck) {
    const [lowest, lowestVal] = lowestDomain;
    insights.push({
      text: `${capitalize(lowest)} feels worst (${lowestVal}/10), but fixing ${bottleneck} first will unlock more downstream improvement.`,
      driver: bottleneck as DomainNode,
      target: lowest,
      severity: 'MEDIUM',
    });
  }

  // Return top 2, deduped by target
  const seen = new Set<string>();
  return insights.filter(i => {
    const key = `${i.driver}-${i.target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 2);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
