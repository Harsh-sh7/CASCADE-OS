/**
 * lib/ml/generateSyntheticData.ts
 * ─────────────────────────────────────────────────────────────────
 * Generates 500+ synthetic training examples following graph rules
 * with injected noise. Run once via: npx ts-node lib/ml/generateSyntheticData.ts
 * or call the seed API.
 * ─────────────────────────────────────────────────────────────────
 */

import { DomainNode, DEPENDENCY_GRAPH } from '@/lib/engine/graph';

const DOMAINS: DomainNode[] = ['sleep', 'energy', 'focus', 'stress', 'time', 'workOutput', 'health', 'social'];

const INTERVENTIONS = [
  'sleep_protocol', 'energy_boost', 'deep_work_session', 'stress_release',
  'time_restructure', 'exercise', 'social_reconnect', 'output_sprint',
];

export interface SyntheticExample {
  morningState: Record<string, number>;
  bottleneck: string;
  intervention: string;
  adherenceScore: number;
  followed: boolean;
  outcomeDelta: Record<string, number>;
  recoveryDays: number;
  success: boolean;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function noise(amplitude: number = 1): number {
  return (Math.random() - 0.5) * 2 * amplitude;
}

function generateOne(): SyntheticExample {
  // Generate random morning state
  const morningState: Record<string, number> = {};
  DOMAINS.forEach(d => {
    morningState[d] = rand(1, 10);
  });

  // Pick bottleneck: domain with lowest state (with some randomness)
  const sorted = DOMAINS
    .filter(d => d !== 'workOutput')
    .sort((a, b) => morningState[a] - morningState[b]);
  const bottleneck = Math.random() < 0.7 ? sorted[0] : sorted[rand(0, 2)];

  // Pick intervention correlating to bottleneck
  const interventionMap: Record<string, string> = {
    sleep: 'sleep_protocol', energy: 'energy_boost', focus: 'deep_work_session',
    stress: 'stress_release', time: 'time_restructure', health: 'exercise',
    social: 'social_reconnect', workOutput: 'output_sprint',
  };
  const intervention = interventionMap[bottleneck] || 'deep_work_session';

  // Adherence: correlated with energy and time
  const adherenceBase = (morningState.energy + morningState.time) / 20;
  const adherenceScore = Math.max(0.1, Math.min(1.0, adherenceBase + noise(0.15)));

  // Whether user followed through
  const followed = Math.random() < adherenceScore;

  // Compute outcomeDelta using graph edge weights
  const outcomeDelta: Record<string, number> = {};
  DOMAINS.forEach(d => {
    outcomeDelta[d] = 0;
  });

  if (followed) {
    // Apply graph edge effects from bottleneck improvement
    const edges = DEPENDENCY_GRAPH.filter(e => e.from === bottleneck);
    // Bottleneck itself improves by 1–3
    const bnImprovement = rand(1, 3);
    outcomeDelta[bottleneck] = bnImprovement;

    edges.forEach(e => {
      // Downstream domains improve proportionally
      const impact = Math.round(e.weight * bnImprovement + noise(0.5));
      outcomeDelta[e.to] = (outcomeDelta[e.to] ?? 0) + impact;
    });
  } else {
    // Natural decay: some domains drop
    DOMAINS.forEach(d => {
      outcomeDelta[d] = Math.random() < 0.3 ? rand(-2, 0) : 0;
    });
  }

  // Add noise to all deltas
  DOMAINS.forEach(d => {
    outcomeDelta[d] = Math.round(outcomeDelta[d] + noise(0.5));
  });

  // Success: bottleneck improved by 1+
  const bnDelta = bottleneck === 'stress'
    ? -outcomeDelta[bottleneck]  // stress: lower = better
    : outcomeDelta[bottleneck];
  const success = bnDelta >= 1;

  // Recovery days: based on severity and whether followed
  const severity = 10 - morningState[bottleneck]; // 0-9
  const recoveryDays = followed
    ? Math.max(1, Math.round(severity / 3 + noise(0.5)))
    : Math.max(2, Math.round(severity / 2 + noise(1)));

  return {
    morningState,
    bottleneck,
    intervention,
    adherenceScore: parseFloat(adherenceScore.toFixed(2)),
    followed,
    outcomeDelta,
    recoveryDays: Math.min(recoveryDays, 7),
    success,
  };
}

export function generateSyntheticDataset(count: number = 500): SyntheticExample[] {
  const dataset: SyntheticExample[] = [];
  for (let i = 0; i < count; i++) {
    dataset.push(generateOne());
  }
  return dataset;
}

// Summary stats (for verification)
export function summarizeDataset(data: SyntheticExample[]) {
  const followed = data.filter(d => d.followed).length;
  const succeeded = data.filter(d => d.success).length;
  const avgAdherence = data.reduce((s, d) => s + d.adherenceScore, 0) / data.length;
  const avgRecovery = data.reduce((s, d) => s + d.recoveryDays, 0) / data.length;

  return {
    total: data.length,
    followedRate: parseFloat((followed / data.length).toFixed(2)),
    successRate: parseFloat((succeeded / data.length).toFixed(2)),
    avgAdherence: parseFloat(avgAdherence.toFixed(2)),
    avgRecovery: parseFloat(avgRecovery.toFixed(2)),
  };
}
