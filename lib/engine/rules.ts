/**
 * lib/engine/rules.ts
 * ─────────────────────────────────────────────────────────────────
 * Rule Engine — Governability Layer
 *
 * Converts repeated patterns into automatic rules.
 * Recovery rules override optimization rules.
 * Rules are deterministic, transparent, and explain themselves.
 * ─────────────────────────────────────────────────────────────────
 */

import { IPolicy } from '@/lib/models/User';

export interface ActiveRule {
  id: string;
  rule: string;           // human-readable "IF → THEN"
  trigger: string;        // why it activated
  priority: 'RECOVERY' | 'PROTECTION' | 'OPTIMIZATION';
}

/**
 * Evaluate all rules against current state.
 * Returns list of active rules, recovery-first.
 */
export function applyRules(
  states: Record<string, number>, 
  resources: { time: number; energy: number; money: number; attention: number; },
  policies?: IPolicy[]
): ActiveRule[] {
  const active: ActiveRule[] = [];

  // ═══ RECOVERY RULES (highest priority) ═══

  if ((states.sleep ?? 5) < 4) {
    active.push({
      id: 'r1',
      rule: 'sleep < 4 → no deep work before 11 AM',
      trigger: `Sleep at ${states.sleep}/10 — cognitive ceiling is critically low`,
      priority: 'RECOVERY',
    });
  }

  if (resources.energy < 3) {
    active.push({
      id: 'r2',
      rule: 'energy < 3 → switch to recovery mode',
      trigger: `Energy at ${resources.energy}/10 — pushing through will cause multi-day debt`,
      priority: 'RECOVERY',
    });
  }

  if (resources.attention < 3 && resources.energy > 6) {
    active.push({
      id: 'r3',
      rule: 'attention < 3 + high energy → force physical exertion before mental work',
      trigger: `High kinetic energy but zero focus points to excess ambient tension`,
      priority: 'RECOVERY',
    });
  }

  if ((states.health ?? 5) < 3) {
    active.push({
      id: 'r4',
      rule: 'health < 3 → physical recovery takes absolute priority',
      trigger: `Health at ${states.health}/10 — biological deficit prevents all other gains`,
      priority: 'RECOVERY',
    });
  }

  // ═══ PROTECTION RULES ═══

  if ((states.sleep ?? 5) < 5 && resources.attention < 5) {
    active.push({
      id: 'p1',
      rule: 'sleep < 5 + attention < 5 → no important decisions today',
      trigger: 'Low sleep with fragmented attention distorts judgment',
      priority: 'PROTECTION',
    });
  }

  if (resources.energy < 5 && resources.time < 4) {
    active.push({
      id: 'p2',
      rule: 'energy < 5 + time < 4 → reduce scope, not increase effort',
      trigger: 'Low energy with low time means efficiency cannot save you',
      priority: 'PROTECTION',
    });
  }

  if ((states.relationships ?? 5) < 3 && resources.time >= 5) {
    active.push({
      id: 'p3',
      rule: 'relationships < 3 + time ≥ 5 → make one human connection',
      trigger: 'Isolation accelerates decay across all domains',
      priority: 'PROTECTION',
    });
  }

  // ═══ OPTIMIZATION RULES ═══

  if (resources.energy >= 7 && resources.attention >= 7 && resources.time >= 5) {
    active.push({
      id: 'o1',
      rule: 'energy ≥ 7 + attention ≥ 7 + time ≥ 5 → execute hardest task NOW',
      trigger: 'Peak state detected — this window is rare, use it immediately',
      priority: 'OPTIMIZATION',
    });
  }

  if ((states.sleep ?? 5) >= 8 && resources.attention >= 6) {
    active.push({
      id: 'o2',
      rule: 'sleep ≥ 8 + attention ≥ 6 → creative work window available',
      trigger: 'Well-rested and attentive — optimal conditions for creative thinking',
      priority: 'OPTIMIZATION',
    });
  }

  // Sort: RECOVERY first, then PROTECTION, then OPTIMIZATION
  const priorityOrder = { RECOVERY: 0, PROTECTION: 1, OPTIMIZATION: 2 };
  
  // ═══ CUSTOM SYSTEM POLICIES ═══
  if (policies && policies.length > 0) {
    policies.forEach((policy) => {
      if (!policy.active) return;
      
      const val = policy.conditionValue;
      // Fetch from states or resources
      const currentState = states[policy.conditionDomain] ?? resources[policy.conditionDomain as keyof typeof resources];
      
      if (currentState !== undefined) {
        let isTriggered = false;
        if (policy.conditionOp === 'gt' && currentState > val) isTriggered = true;
        if (policy.conditionOp === 'lt' && currentState < val) isTriggered = true;
        if (policy.conditionOp === 'eq' && currentState === val) isTriggered = true;

        if (isTriggered) {
          active.push({
            id: policy.id,
            rule: `IF ${policy.conditionDomain} ${policy.conditionOp === 'gt' ? '>' : policy.conditionOp === 'lt' ? '<' : '='} ${val} → ${policy.action}`,
            trigger: `System Policy [${policy.id}] matched`,
            priority: 'PROTECTION', 
          });
        }
      }
    });
  }

  active.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return active;
}
