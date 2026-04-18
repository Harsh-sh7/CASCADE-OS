import { DomainNode } from './graph';

export interface ActiveLoop {
  name: string;
  breakPoint: DomainNode | string;
  action: string;
}

export function detectFailureLoops(
  states: Record<DomainNode, number>
): ActiveLoop[] {
  const activeLoops: ActiveLoop[] = [];

  // Loops occur when certain nodes are simultaneously distressed (< 4) or overloaded (> 7)
  
  // 1. Burnout Spiral: Low energy, low health, but pushing hard on work
  // Break point: sleep (mandate rest) or work (reduce load)
  if (states.energy < 4 && states.health < 4 && states.work > 6) {
    activeLoops.push({
      name: 'Burnout Spiral',
      breakPoint: 'sleep',
      action: 'Enforce hard cut-off for work today. Zero output expectations.',
    });
  }

  // 2. Avoidance Trap: Low attention, low work output, high relationship seeking or distraction
  if (states.attention < 4 && states.work < 4 && states.learning < 4) {
    activeLoops.push({
      name: 'Avoidance Trap',
      breakPoint: 'attention',
      action: 'Complete ONE microscopic task completely unrelated to the main stressor.',
    });
  }

  // 3. Isolation Loop: Low energy, low relationships
  if (states.energy < 4 && states.relationships < 3) {
    activeLoops.push({
      name: 'Isolation Loop',
      breakPoint: 'relationships',
      action: 'Send ONE low-friction message to a friend. No response required.',
    });
  }

  return activeLoops;
}
