/**
 * lib/engine/decisions.ts
 * ─────────────────────────────────────────────────────────────────
 * Decision Triad: DO / DELAY / DROP
 *
 * Replaces single recommendation with structured decision context.
 * DO = primary action (from recommendation engine)
 * DELAY = what should NOT be done now (requires resources you lack)
 * DROP = what should be removed today (optional load increasing strain)
 * ─────────────────────────────────────────────────────────────────
 */

import { DomainNode } from './graph';

export interface DecisionQuad {
  do: string;
  delay: string[];
  delegate: string[];
  remove: string[];
}

export interface DayClassification {
  type: 'DEEP_WORK' | 'LIGHT' | 'RECOVERY' | 'TRIAGE' | 'CONTAINMENT';
  label: string;
}

/**
 * Classify the day based on available resources.
 */
export function classifyDay(
  states: Record<string, number>,
  resources: { time: number; energy: number; money: number; attention: number; }
): DayClassification {
  const distressed = Object.values(states).filter(v => v < 3).length;

  if (distressed >= 3) return { type: 'TRIAGE', label: 'Triage Day' };
  if (resources.energy < 3 || resources.time < 3) return { type: 'CONTAINMENT', label: 'Containment Day' };
  if ((states.health ?? 5) < 3 && resources.energy < 5) return { type: 'RECOVERY', label: 'Recovery Day' };
  if (resources.energy >= 7 && resources.attention >= 6 && resources.time >= 5) return { type: 'DEEP_WORK', label: 'Deep Work Day' };
  return { type: 'LIGHT', label: 'Light Execution Day' };
}

/**
 * Generate the decision quad based on system state.
 */
export function generateDecisionTriad(
  primaryAction: string,
  bottleneck: string,
  states: Record<string, number>,
  resources: { time: number; energy: number; money: number; attention: number; },
  dayType: DayClassification['type']
): DecisionQuad {
  const delay: string[] = [];
  const delegate: string[] = [];
  const remove: string[] = [];

  // Rules:
  if (dayType === 'TRIAGE') {
    remove.push('All optional commitments today.');
    delay.push('Any decision that can wait 24 hours.');
    return { do: primaryAction, delay, delegate, remove };
  }

  // CONTAINMENT
  if (dayType === 'CONTAINMENT') {
    remove.push('The lowest priority item on your active list.');
    if (resources.energy < 3) remove.push('Any physical or highly social exertion.');
    if (resources.time < 3) delay.push('All meetings or calls not absolutely critical today.');
    delegate.push('Any administrative or repetitive tasks.');
    return { do: primaryAction, delay, delegate, remove };
  }

  // Standard modes
  if (resources.energy < 4) {
    delay.push('Tasks requiring sustained mental effort.');
  }

  if (resources.attention < 4) {
    delay.push('Complex multi-step work.');
    remove.push('Background noise and context-switching apps.');
  }

  if ((states.sleep ?? 5) < 5) {
    delay.push('Important decisions or difficult conversations.');
    delegate.push('Tasks requiring high emotional bandwidth.');
  }

  if (resources.time < 4) {
    delegate.push('Anything that takes >30 mins but can be done by someone else 80% as well.');
  }

  if ((states.relationships ?? 5) > 7 && resources.energy < 5) {
    remove.push('Optional social obligations tonight.');
  }

  // Fallbacks if empty
  if (delay.length === 0) delay.push('Nothing specific — resources are sufficient.');
  if (delegate.length === 0) delegate.push('You are clear to execute solo today.');
  if (remove.length === 0) remove.push('Passive consumption (unnecessary scrolling).');

  return {
    do: primaryAction,
    delay,
    delegate,
    remove,
  };
}
