import { DomainNode } from './graph';

export interface Intervention {
  action: string;
  gain: string[];
  cost: string[];
  whyThis: string;
  whyNotOthers: string;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceReason: string;
  bandwidthRequired?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export function generateContextualIntervention(
  bottleneck: string,
  states: Record<string, number>,
  confidence: 'HIGH' | 'MEDIUM' | 'LOW',
  cognitiveBandwidth?: number
): Intervention {
  const isExhausted = (states.energy ?? 5) < 4;
  const isLowAttention = (states.attention ?? 5) < 4;

  let action = '';
  let gain: string[] = [];
  let cost: string[] = [];
  let whyThis = '';
  let whyNotOthers = '';
  let bandwidthRequired: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';

  switch (bottleneck) {
    case 'sleep':
      action = isExhausted
        ? 'Take a 20-minute NSDR (Non-Sleep Deep Rest) or nap immediately.'
        : 'Set a hard technology blackout 60 minutes before bed tonight.';
      bandwidthRequired = isExhausted ? 'LOW' : 'MEDIUM';
      gain = ['Immediate central nervous system reset', 'Cognitive clearance'];
      cost = ['Requires switching contexts', '20-60 mins of time'];
      whyThis = 'System breakdown stems from baseline neurological fatigue. Pushing through reduces leverage to zero.';
      whyNotOthers = 'Trying to fix output while sleep-deprived is treating symptoms, not the disease.';
      break;

    case 'work':
      action = isLowAttention
        ? 'Lower your standard for today to 60%. Execute the minimal viable version.'
        : 'Pick the most dreaded task and do it for exactly 15 minutes, then stop if needed.';
      bandwidthRequired = isLowAttention ? 'MEDIUM' : 'HIGH';
      gain = ['Momentum shifted', 'Perfectionism bypassed'];
      cost = ['Accepting sub-optimal output in the short term'];
      whyThis = 'The activation energy barrier is currently higher than your systemic capacity.';
      whyNotOthers = 'Planning and optimizing will only delay action. You need raw execution, however messy.';
      break;

    case 'money':
      action = 'Audit one single financial leak (e.g. cancel one unused subscription) right now.';
      bandwidthRequired = 'MEDIUM';
      gain = ['Long-term structural resource yield', 'Mental closure'];
      cost = ['Small time block', 'Potential frustration'];
      whyThis = 'Financial friction quietly bleeds ambient attention. Fixing the plumbing stops the leak permanently.';
      whyNotOthers = 'Working harder to earn more is less efficient than stopping the bleeding of existing resources.';
      break;

    case 'energy':
      action = 'Go for a 15-minute walk outside without any audio input or phone access.';
      bandwidthRequired = 'LOW';
      gain = ['Cortisol clearance', 'Oxygenation'];
      cost = ['15 mins of time'];
      whyThis = 'Your physical battery is the rate-limiting step for all cognitive tasks currently.';
      whyNotOthers = 'Time management techniques cannot substitute for physiological ATP.';
      break;

    case 'attention':
      action = isExhausted
        ? 'Write down exactly ONE task on a physical post-it note. Hide everything else.'
        : 'Block 45 minutes for deep work. Place phone in another room.';
      bandwidthRequired = isExhausted ? 'LOW' : 'HIGH';
      gain = ['Reduced context switching', 'Task completion momentum'];
      cost = ['Temporary unavailability to others'];
      whyThis = 'Attention fragmentation is destroying your return on invested time.';
      whyNotOthers = 'Increasing hours worked will only yield diminishing returns. You need depth, not duration.';
      break;

    case 'health':
      action = isExhausted
        ? 'Drink 500ml of water and stretch for 2 minutes.'
        : 'Schedule a 30-minute workout before any further cognitive work.';
      bandwidthRequired = isExhausted ? 'LOW' : 'HIGH';
      gain = ['Metabolic stabilization', 'Endorphin release', 'Baseline capacity increase'];
      cost = ['Physical exertion', 'Time required'];
      whyThis = 'Biological decay is silently dragging down your maximum cognitive ceiling.';
      whyNotOthers = 'Mental interventions cannot fix biological deficits.';
      break;

    case 'learning':
      action = 'Spend 20 minutes consuming one highly dense, difficult piece of material related to your core block.';
      bandwidthRequired = 'HIGH';
      gain = ['Skill compounding', 'Future task friction reduction'];
      cost = ['High cognitive load'];
      whyThis = 'You are limited by sheer capability, not time or energy. You must build better tools in your brain.';
      whyNotOthers = 'Working the same way will yield the same bottleneck tomorrow.';
      break;

    case 'relationships':
      action = isExhausted
        ? 'Text someone you care about a simple thought or observation. No pressure for a conversation.'
        : 'Schedule a 15-minute voice call with a close friend while walking.';
      bandwidthRequired = 'LOW';
      gain = ['Oxytocin release', 'Perspective shift'];
      cost = ['Emotional energy'];
      whyThis = 'Isolation is becoming a negative multiplier on your baseline mood and resilience.';
      whyNotOthers = 'Grinding through isolation creates a refractory period that ruins tomorrow\'s output.';
      break;

    default:
      action = 'Identify ONE commitment you have this week and cancel/delegate it.';
      bandwidthRequired = 'MEDIUM';
      gain = ['Reclaimed bandwidth', 'Reduced background anxiety'];
      cost = ['Potential social friction'];
      whyThis = 'You are operating above maximum carrying capacity. Time must be reclaimed structurally.';
      whyNotOthers = 'Efficiency hacks cannot save an overloaded system. Arithmetic wins.';
      break;
  }
  
  // Dynamic Task Reclassification (Downgrade Engine)
  if (cognitiveBandwidth !== undefined) {
    if (cognitiveBandwidth < 4 && bandwidthRequired !== 'LOW') {
      action = `[Downgraded due to LOW Capacity] Review notes or prepare materials for 10 minutes. Original action too heavy.`;
      bandwidthRequired = 'LOW';
    } else if (cognitiveBandwidth >= 4 && cognitiveBandwidth < 7 && bandwidthRequired === 'HIGH') {
      action = `[Downgraded due to MEDIUM Capacity] Start the action but limit scope to 20 minutes with lower expectations.`;
      bandwidthRequired = 'MEDIUM';
    }
  }

  // Adjust reasons for lower confidence
  let confidenceReason = confidence === 'HIGH' 
    ? 'This domain statistically dominates downstream impact given your current system state.'
    : confidence === 'MEDIUM' 
    ? 'There are multiple competing issues, but resolving this clears the most probable bottleneck.'
    : 'Your system is highly ambiguous today. This is an exploratory intervention to force a state change.';

  return {
    action,
    gain,
    cost,
    whyThis,
    whyNotOthers,
    confidenceLevel: confidence,
    confidenceReason,
    bandwidthRequired
  };
}
