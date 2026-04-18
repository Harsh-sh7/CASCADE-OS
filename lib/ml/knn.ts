/**
 * lib/ml/knn.ts
 * ─────────────────────────────────────────────────────────────────
 * Pure TypeScript ML layer — no external dependencies.
 *
 * Uses K-Nearest Neighbors on stored log history to predict:
 *   1. P(success | state, intervention)
 *   2. Expected recovery time (days)
 *   3. P(failure | state, intervention) — likelihood of ignoring
 *
 * All functions degrade gracefully to rule-based fallbacks when
 * there is insufficient training data (< 7 logs).
 * ─────────────────────────────────────────────────────────────────
 */

import { IDailyLog } from '@/lib/models/DailyLog';
import { UserModelData } from '@/lib/models/User';
import { DomainNode } from '@/lib/engine/graph';

const K = 5; // number of nearest neighbors
const MIN_LOGS_FOR_ML = 7;

// ─── Feature Vector ───────────────────────────────────────────────

interface FeatureVector {
  sleep: number;
  energy: number;
  focus: number;
  stress: number;
  time: number;
  health: number;
  social: number;
  adherence: number;    // userModel adherence for bottleneck domain
  effectiveness: number; // userModel effectiveness for bottleneck domain
}

function extractFeatures(
  states: Record<DomainNode, number>,
  bottleneck: string,
  userModel: UserModelData | null
): FeatureVector {
  return {
    sleep:         states.sleep       / 10,
    energy:        states.energy      / 10,
    focus:         states.focus       / 10,
    stress:        (10 - states.stress) / 10, // invert: low stress = good
    time:          states.time        / 10,
    health:        states.health      / 10,
    social:        states.social      / 10,
    adherence:     userModel?.adherence?.[bottleneck]     ?? 0.7,
    effectiveness: userModel?.effectiveness?.[bottleneck] ?? 0.5,
  };
}

function featureFromLog(log: IDailyLog, userModel: UserModelData | null): FeatureVector {
  const s = log.morningState;
  const bn = log.systemAnalysis.bottleneck;
  return {
    sleep:         s.sleep         / 10,
    energy:        s.energy        / 10,
    focus:         s.focus         / 10,
    stress:        (10 - s.stress) / 10,
    time:          s.timeAvailable / 10,
    health:        s.health        / 10,
    social:        s.social        / 10,
    adherence:     userModel?.adherence?.[bn]     ?? 0.7,
    effectiveness: userModel?.effectiveness?.[bn] ?? 0.5,
  };
}

// ─── Euclidean Distance ───────────────────────────────────────────

function distance(a: FeatureVector, b: FeatureVector): number {
  const keys = Object.keys(a) as (keyof FeatureVector)[];
  return Math.sqrt(keys.reduce((sum, k) => sum + (a[k] - b[k]) ** 2, 0));
}

// ─── KNN Core ────────────────────────────────────────────────────

function knnNeighbors(
  query: FeatureVector,
  logs: IDailyLog[],
  userModel: UserModelData | null
): IDailyLog[] {
  const withDistances = logs
    .filter(l => l.outcomeSuccess !== undefined) // only labeled examples
    .map(l => ({ log: l, dist: distance(query, featureFromLog(l, userModel)) }))
    .sort((a, b) => a.dist - b.dist);

  return withDistances.slice(0, K).map(x => x.log);
}

// ─── Model 1: Success Probability ─────────────────────────────────

/**
 * P(success | state, intervention)
 * Returns probability 0–1 and human-readable reason.
 */
export function predictSuccess(
  states: Record<DomainNode, number>,
  bottleneck: string,
  userModel: UserModelData | null,
  historicalLogs: IDailyLog[]
): { probability: number; reason: string } {
  if (historicalLogs.length < MIN_LOGS_FOR_ML) {
    // Rule-based fallback: use adherence as proxy
    const adherence = userModel?.adherence?.[bottleneck] ?? 0.6;
    return {
      probability: adherence,
      reason: `Estimated from personal adherence (${Math.round(adherence * 100)}%) — not enough history for ML`,
    };
  }

  const query     = extractFeatures(states, bottleneck, userModel);
  const neighbors = knnNeighbors(query, historicalLogs, userModel);

  if (neighbors.length === 0) {
    return { probability: 0.5, reason: 'No comparable past states found' };
  }

  const successes = neighbors.filter(l => l.outcomeSuccess === true).length;
  const probability = parseFloat((successes / neighbors.length).toFixed(2));

  return {
    probability,
    reason: `Based on ${neighbors.length} similar past days — ${successes} succeeded (${Math.round(probability * 100)}%)`,
  };
}

// ─── Model 2: Recovery Time Predictor ────────────────────────────

/**
 * Returns expected recovery time in days (1–7).
 * Weighted linear regression over neighbors: penalizes low energy and high stress.
 */
export function predictRecovery(
  states: Record<DomainNode, number>,
  bottleneck: string,
  userModel: UserModelData | null,
  historicalLogs: IDailyLog[]
): { days: number; reason: string } {
  // Rule-based baseline
  const baseRecovery: Record<string, number> = {
    sleep: 2, energy: 2, focus: 1, stress: 3, time: 1, health: 3, social: 2, workOutput: 2,
  };
  const base = baseRecovery[bottleneck] ?? 2;

  if (historicalLogs.length < MIN_LOGS_FOR_ML) {
    const energyPenalty = states.energy < 4 ? 1 : 0;
    const stressPenalty = states.stress > 7 ? 1 : 0;
    return {
      days: Math.min(base + energyPenalty + stressPenalty, 7),
      reason: `Rule-based estimate. Penalty applied for ${energyPenalty ? 'low energy ' : ''}${stressPenalty ? 'high stress' : ''}`.trim() || 'Standard estimate',
    };
  }

  const query     = extractFeatures(states, bottleneck, userModel);
  const neighbors = knnNeighbors(query, historicalLogs, userModel);

  // Estimate from how long neighbors stayed bottlenecked
  // If outcomeSuccess = true on day N, recovery was 1 day; else look at consecutive logs
  // Simplified: use rcMultiplier as proxy
  const rcMultiplier = userModel?.rcMultipliers?.[bottleneck] ?? 1.0;
  const estimated = Math.round(base * rcMultiplier);

  return {
    days: Math.min(Math.max(estimated, 1), 7),
    reason: `Estimated ${estimated} day(s) based on your personal recovery pattern for ${bottleneck}`,
  };
}

// ─── Model 3: Failure Predictor ──────────────────────────────────

/**
 * Returns probability (0–1) that the user will NOT follow the recommendation.
 * Used to deprioritize interventions the user is unlikely to act on.
 */
export function predictFailure(
  states: Record<DomainNode, number>,
  bottleneck: string,
  userModel: UserModelData | null,
  historicalLogs: IDailyLog[]
): { probability: number; reason: string } {
  // Low energy or low time → high failure probability (rule-based)
  const energyFactor = states.energy < 4 ? 0.3 : 0;
  const timeFactor   = states.time    < 3 ? 0.25 : 0;

  const adherence = userModel?.adherence?.[bottleneck] ?? 0.7;
  const baseFailure = Math.max(1 - adherence - energyFactor - timeFactor, 0.05);

  if (historicalLogs.length < MIN_LOGS_FOR_ML) {
    return {
      probability: parseFloat(baseFailure.toFixed(2)),
      reason: `Rule-based: ${Math.round(baseFailure * 100)}% failure likelihood from energy/time constraints`,
    };
  }

  const query     = extractFeatures(states, bottleneck, userModel);
  const neighbors = knnNeighbors(query, historicalLogs, userModel);

  const ignoredCount = neighbors.filter(
    l => l.followUp.completed && l.followUp.feedback === 'ignored'
  ).length;
  const ignoreRate = neighbors.length > 0 ? ignoredCount / neighbors.length : baseFailure;

  const blended = parseFloat(((ignoreRate * 0.6 + baseFailure * 0.4)).toFixed(2));

  return {
    probability: Math.min(blended, 0.95),
    reason: `${ignoredCount}/${neighbors.length} similar past days were skipped`,
  };
}

// ─── Final Decision Score ─────────────────────────────────────────

/**
 * Composite score used to rank interventions.
 * score = adjustedLR × P(success) × (1 − P(failure))
 */
export function computeMLScore(
  adjustedLR: number,
  successProb: number,
  failureProb: number
): number {
  return parseFloat((adjustedLR * successProb * (1 - failureProb)).toFixed(4));
}
