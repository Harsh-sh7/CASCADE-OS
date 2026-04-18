export type DomainNode =
  | 'sleep'
  | 'work'
  | 'money'
  | 'energy'
  | 'attention'
  | 'health'
  | 'learning'
  | 'relationships';

export interface GraphEdge {
  from: DomainNode;
  to: DomainNode;
  weight: number; // positive means helps to, negative means hurts to
}

export const DEPENDENCY_GRAPH: GraphEdge[] = [
  // Sleep
  { from: 'sleep', to: 'energy', weight: 0.9 },
  { from: 'sleep', to: 'attention', weight: 0.7 },
  { from: 'sleep', to: 'health', weight: 0.6 },

  // Energy
  { from: 'energy', to: 'attention', weight: 0.8 },
  { from: 'energy', to: 'work', weight: 0.7 },
  { from: 'energy', to: 'learning', weight: 0.5 },
  { from: 'energy', to: 'relationships', weight: 0.4 },

  // Attention
  { from: 'attention', to: 'work', weight: 0.9 },
  { from: 'attention', to: 'learning', weight: 0.8 },
  { from: 'attention', to: 'relationships', weight: 0.6 },

  // Work
  { from: 'work', to: 'money', weight: 0.8 },
  { from: 'work', to: 'energy', weight: -0.6 }, // Burns energy
  { from: 'work', to: 'attention', weight: -0.5 }, // Burns attention

  // Money
  { from: 'money', to: 'health', weight: 0.4 }, // Affords better food/care
  { from: 'money', to: 'learning', weight: 0.3 },

  // Health
  { from: 'health', to: 'energy', weight: 0.8 },
  { from: 'health', to: 'sleep', weight: 0.5 },

  // Learning
  { from: 'learning', to: 'work', weight: 0.6 }, // Upskills work
  { from: 'learning', to: 'attention', weight: -0.4 }, // Takes cognitive capacity

  // Relationships
  { from: 'relationships', to: 'energy', weight: 0.4 }, // Emotional recharge
  { from: 'relationships', to: 'attention', weight: -0.3 }, 
];

/**
 * Calculates Downstream Impact Score (DIS) for a specific node given current states.
 * DIS = Sum(EdgeWeight * ImpactMultiplier)
 */
export function calculateDownstreamImpact(
  node: DomainNode,
  states: Record<DomainNode, number>
): number {
  const outgoingEdges = DEPENDENCY_GRAPH.filter((e) => e.from === node);
  let impact = 0;

  for (const edge of outgoingEdges) {
    const targetState = states[edge.to] ?? 5;
    // Apply threshold rule: If target state is < 4, weight is multipled by 2.
    const multiplier = targetState < 4 ? 2 : 1;
    impact += Math.abs(edge.weight) * multiplier;
  }

  return impact;
}
