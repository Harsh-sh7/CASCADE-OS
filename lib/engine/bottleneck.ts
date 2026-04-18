import { DomainNode, calculateDownstreamImpact } from './graph';

export interface BottleneckResult {
  bottleneck: DomainNode;
  leverageRatio: number;
  isCounterintuitive: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function detectBottleneck(
  states: Record<DomainNode, number>,
  rcMultipliers: Record<string, number> = {}
): BottleneckResult {
  const domains = Object.keys(states) as DomainNode[];
  
  const domainScores = domains.map((node) => {
    const dis = calculateDownstreamImpact(node, states);
    // Base RC is 1, modified by user profile multipliers
    const rc = rcMultipliers[node] || 1.0;
    let lr = dis / rc;
    
    return { node, lr, originalLr: lr, state: states[node] };
  });

  // Sort domains by state to find the lowest scoring domain
  const sortedByState = [...domainScores].sort((a, b) => a.state - b.state);
  const lowestDomain = sortedByState[0];

  // NON-OBVIOUS INSIGHT ENFORCER
  // If bottleneck == lowest scoring domain, reduce score by 20%
  let isCounterintuitive = false;

  domainScores.forEach((d) => {
    if (d.node === lowestDomain.node) {
      d.lr = d.lr * 0.8;
    }
  });

  // Sort by Leverage Ratio descending
  domainScores.sort((a, b) => b.lr - a.lr);

  let best = domainScores[0];
  let secondBest = domainScores[1];

  // If second-best LR within 15% of best, choose non-obvious node (the one that is originally NOT the lowest)
  // Or simply prioritize the one that has higher downstream impact vs state ratio
  if (secondBest && secondBest.lr >= best.lr * 0.85) {
    // If best is the lowest domain even after penalty, and second best is close
    if (best.node === lowestDomain.node) {
      best = secondBest;
      isCounterintuitive = true;
    } else {
      // Just flag it as counterintuitive if we stick to a non-lowest domain
      isCounterintuitive = true;
    }
  }

  // Determine confidence
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  const margin = best.lr - (domainScores.find(d => d.node !== best.node)?.lr || 0);
  const percentageMargin = margin / best.lr;

  if (percentageMargin > 0.25) {
    confidence = 'HIGH';
  } else if (percentageMargin > 0.10) {
    confidence = 'MEDIUM';
  } else {
    confidence = 'LOW';
  }

  return {
    bottleneck: best.node,
    leverageRatio: best.lr,
    isCounterintuitive,
    confidence,
  };
}
