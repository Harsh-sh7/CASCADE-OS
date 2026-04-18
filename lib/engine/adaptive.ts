/**
 * lib/engine/adaptive.ts
 * ─────────────────────────────────────────────────────────────────
 * Personalization layer: adjusts LR, scores interventions, and
 * updates the userModel from observed outcomes.
 *
 * All functions are pure (no DB calls) and return rule-based
 * fallbacks when userModel data is absent.
 * ─────────────────────────────────────────────────────────────────
 */

import { IDailyLog } from '@/lib/models/DailyLog';
import { UserModelData } from '@/lib/models/User';
import { DomainNode } from './graph';

const DOMAINS: DomainNode[] = ['sleep', 'energy', 'focus', 'stress', 'time', 'workOutput', 'health', 'social'];

// EMA smoothing factor — lower = more inertia (memory), higher = more reactive
const EMA_ALPHA = 0.25;

// ─── Adjusted Leverage Ratio ─────────────────────────────────────

/**
 * AdjustedLR = baseLR × adherence[domain] × effectiveness[domain]
 * Falls back to baseLR if userModel is empty.
 */
export function computeAdjustedLR(
  baseLR: number,
  domain: string,
  userModel: UserModelData | null
): number {
  if (!userModel) return baseLR;

  const adherence    = userModel.adherence?.[domain]    ?? 1.0;
  const effectiveness = userModel.effectiveness?.[domain] ?? 1.0;

  // Clamp to [0.1, 2.0] to prevent zero-collapse or explosion
  const adjusted = baseLR * Math.max(adherence, 0.1) * Math.max(effectiveness, 0.1);
  return Math.min(adjusted, baseLR * 2.0);
}

// ─── Adaptive Recovery Cost ───────────────────────────────────────

const BASE_RC: Record<string, number> = {
  sleep: 3, energy: 2, focus: 2, stress: 3, time: 1, workOutput: 2, health: 3, social: 2,
};

/**
 * RC_adaptive = baseRC[domain] × userModel.rcMultipliers[domain]
 * If user historically takes longer to recover sleep than average, RC rises.
 */
export function computeAdaptiveRC(
  domain: string,
  userModel: UserModelData | null
): number {
  const base = BASE_RC[domain] ?? 2;
  if (!userModel) return base;
  const multiplier = userModel.rcMultipliers?.[domain] ?? 1.0;
  return base * Math.max(multiplier, 0.5);
}

// ─── Intervention Scoring ─────────────────────────────────────────

export interface ScoredDomain {
  domain: DomainNode;
  baseLR: number;
  adjustedLR: number;
  adaptiveRC: number;
  finalScore: number;
  adherence: number;
  effectiveness: number;
}

/**
 * Scores all candidate domains and returns them ranked.
 * finalScore = adjustedLR / adaptiveRC
 */
export function scoreDomains(
  domainScores: Record<DomainNode, number>,  // baseLR per domain from bottleneck detector
  userModel: UserModelData | null
): ScoredDomain[] {
  return DOMAINS
    .filter(d => d !== 'workOutput') // workOutput is output not input
    .map(domain => {
      const baseLR        = domainScores[domain] ?? 0;
      const adherence     = userModel?.adherence?.[domain]     ?? 1.0;
      const effectiveness = userModel?.effectiveness?.[domain] ?? 1.0;
      const adjustedLR    = computeAdjustedLR(baseLR, domain, userModel);
      const adaptiveRC    = computeAdaptiveRC(domain, userModel);
      
      // Feature 4: Personal Learning Layer -> score = estimatedImprovement * successRate * adherenceFactor
      const personalSuccessRate = userModel?.successRate ?? 0.5;
      const rawScore = adaptiveRC > 0 ? (adjustedLR / adaptiveRC) : 0;
      const finalScore = rawScore * personalSuccessRate * adherence;

      return { domain, baseLR, adjustedLR, adaptiveRC, finalScore, adherence, effectiveness };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}

// ─── System Confidence Score ──────────────────────────────────────

/**
 * Returns 0–100 confidence score with reason string.
 * Based on: past success rate + similarity to current state.
 */
export function computeSystemConfidence(
  states: Record<DomainNode, number>,
  bottleneck: string,
  userModel: UserModelData | null,
  recentLogs: IDailyLog[]
): { score: number; reason: string } {
  if (recentLogs.length < 3) {
    return { score: 50, reason: 'Insufficient history — baseline confidence' };
  }

  // Success rate on same bottleneck
  const sameBottleneck = recentLogs.filter(l => l.systemAnalysis.bottleneck === bottleneck);
  if (sameBottleneck.length === 0) {
    return { score: 40, reason: `First time detecting ${bottleneck} as bottleneck` };
  }

  const successes   = sameBottleneck.filter(l => l.outcomeSuccess === true).length;
  const total       = sameBottleneck.filter(l => l.outcomeSuccess !== undefined).length;
  const successRate = total > 0 ? successes / total : 0.5;

  // Adherence bonus
  const adherenceScore = userModel?.adherence?.[bottleneck] ?? 0.5;
  const rawScore = (successRate * 0.7 + adherenceScore * 0.3) * 100;
  const score = Math.round(Math.min(Math.max(rawScore, 10), 95));

  // Feature 4: Explainability
  const personalSuccessString = userModel?.successRate !== undefined 
    ? `(This works for you ${Math.round(userModel.successRate * 100)}% of the time, ` 
    : '';

  const reason = total === 0
    ? 'No outcome data on this bottleneck yet'
    : `${personalSuccessString}${successes}/${total} successes on ${bottleneck})`;

  return { score, reason };
}

// ─── UserModel Updater ────────────────────────────────────────────

/**
 * Called after an evening check-in completes.
 * Updates adherence (EMA from follow-up), effectiveness (EMA from outcomeDelta),
 * rcMultipliers (if recovery took longer than expected), and calibrationNeeded flag.
 */
export function updateUserModel(
  currentModel: UserModelData,
  log: IDailyLog,
  consecutiveFailures: number
): UserModelData {
  const model: UserModelData = {
    adherence:         { ...currentModel.adherence },
    effectiveness:     { ...currentModel.effectiveness },
    rcMultipliers:     { ...currentModel.rcMultipliers },
    calibrationNeeded: currentModel.calibrationNeeded,
    lastCalibration:   currentModel.lastCalibration,
    successRate:       currentModel.successRate ?? 0.5,
    ignoreRate:        currentModel.ignoreRate ?? 0.0,
    avgOutcomeDelta:   currentModel.avgOutcomeDelta ?? 0.0,
  };

  const bottleneck = log.systemAnalysis.bottleneck;
  const followed   = log.followUp.feedback === 'followed';
  const delta      = log.outcomeDelta ?? {};

  // 1. Update adherence for the targeted domain (EMA)
  const currentAdherence = model.adherence[bottleneck] ?? 0.7;
  model.adherence[bottleneck] = ema(currentAdherence, followed ? 1.0 : 0.0, EMA_ALPHA);

  // 2. Update effectiveness per domain from outcomeDelta
  DOMAINS.forEach(domain => {
    const change = delta[domain] ?? 0;
    // Normalize: +2 or more = effective, 0 = neutral, negative = ineffective
    const effectivenessSignal = change >= 2 ? 1.0 : change >= 0 ? 0.5 : 0.0;
    const current = model.effectiveness[domain] ?? 0.5;
    model.effectiveness[domain] = ema(current, effectivenessSignal, EMA_ALPHA);
  });

  // 3. Update RC multiplier: if recovery didn't happen (delta bottleneck ≤ 0), increase RC
  const bottleneckImprovement = delta[bottleneck] ?? 0;
  const currentRC = model.rcMultipliers[bottleneck] ?? 1.0;
  if (bottleneckImprovement <= 0 && followed) {
    // Followed but didn't recover → domain is harder than assumed
    model.rcMultipliers[bottleneck] = Math.min(currentRC * 1.1, 3.0);
  } else if (bottleneckImprovement >= 2 && followed) {
    // Recovered faster → domain is easier than assumed
    model.rcMultipliers[bottleneck] = Math.max(currentRC * 0.95, 0.5);
  }

  // 4. Calibration check
  if (consecutiveFailures >= 3) {
    model.calibrationNeeded = true;
  } else if (log.outcomeSuccess && model.calibrationNeeded) {
    // One success after calibration = reset flag
    model.calibrationNeeded = false;
    model.lastCalibration = new Date();
  }

  // 5. Global EMA Updates for Personal Learning Layer
  const isIgnored = log.followUp.completed && log.followUp.feedback === 'ignored';
  model.ignoreRate = ema(model.ignoreRate, isIgnored ? 1.0 : 0.0, EMA_ALPHA);

  if (log.outcomeSuccess !== undefined) {
    model.successRate = ema(model.successRate, log.outcomeSuccess ? 1.0 : 0.0, EMA_ALPHA);
  }

  const positiveDeltas = Object.values(delta).filter(v => v > 0);
  if (positiveDeltas.length > 0) {
    const avgPositive = positiveDeltas.reduce((a, b) => a + b, 0) / positiveDeltas.length;
    model.avgOutcomeDelta = ema(model.avgOutcomeDelta, avgPositive, EMA_ALPHA);
  }

  return model;
}

// ─── Helpers ─────────────────────────────────────────────────────

function ema(current: number, newValue: number, alpha: number): number {
  return parseFloat((alpha * newValue + (1 - alpha) * current).toFixed(4));
}
