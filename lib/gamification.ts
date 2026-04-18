export const XP_RULES = {
  CHECK_IN: 20,
  FOLLOWED_ACTION: 50,
  LOOP_BROKEN: 75,
  CORRECT_PREDICTION: 30, // For feedback engine
  STREAK_BONUS_PER_DAY: 5,
};

export const LEVELS = [
  { name: 'Observer', minXp: 0 },
  { name: 'Operator', minXp: 200 },
  { name: 'Architect', minXp: 500 },
  { name: 'System Administrator', minXp: 1000 },
  { name: 'Cascade Master', minXp: 2000 },
];

export function getLevel(xp: number): string {
  let userLevel = LEVELS[0].name;
  for (const level of LEVELS) {
    if (xp >= level.minXp) {
      userLevel = level.name;
    } else {
      break;
    }
  }
  return userLevel;
}

export type BadgeNames = 
  | 'First Fix'
  | 'Loop Breaker'
  | 'Counterintuitive'
  | 'Ghost Protocol'
  | 'Comeback Kid';

export interface GamificationState {
  xp: number;
  level: string;
  streaks: number;
  badges: string[];
}

export interface GamificationEvent {
  type: 'CHECK_IN' | 'FOLLOWUP';
  followedAction?: boolean;
  loopBroken?: boolean;
  correctPrediction?: boolean;
  isCounterintuitive?: boolean;
  ignoredCount?: number; // Used for ghost protocol / comeback kid
}

export function calculateGamification(
  currentState: GamificationState,
  event: GamificationEvent
): GamificationState {
  const nextState = { ...currentState };
  let xpGained = 0;

  if (event.type === 'CHECK_IN') {
    xpGained += XP_RULES.CHECK_IN;
    nextState.streaks += 1;
    xpGained += Math.min(nextState.streaks * XP_RULES.STREAK_BONUS_PER_DAY, 50); // cap streak bonus
  } else if (event.type === 'FOLLOWUP') {
    if (event.followedAction) {
      xpGained += XP_RULES.FOLLOWED_ACTION;
      
      if (!nextState.badges.includes('First Fix')) {
        nextState.badges.push('First Fix');
      }

      if (event.loopBroken) {
        xpGained += XP_RULES.LOOP_BROKEN;
        if (!nextState.badges.includes('Loop Breaker')) {
          nextState.badges.push('Loop Breaker');
        }
      }

      if (event.correctPrediction) {
        xpGained += XP_RULES.CORRECT_PREDICTION;
      }

      if (event.isCounterintuitive && !nextState.badges.includes('Counterintuitive')) {
        nextState.badges.push('Counterintuitive');
      }

      if (event.ignoredCount !== undefined && event.ignoredCount >= 3 && !nextState.badges.includes('Comeback Kid')) {
        nextState.badges.push('Comeback Kid');
      }

    } else {
      // Action ignored
      nextState.streaks = 0; // Streak broken

      if (event.ignoredCount !== undefined && event.ignoredCount >= 2 && !nextState.badges.includes('Ghost Protocol')) {
        // Since ignoredCount is 2 BEFORE this ignore, now it's 3. Trigger Ghost Protocol.
        nextState.badges.push('Ghost Protocol');
      }
    }
  }

  nextState.xp += xpGained;
  nextState.level = getLevel(nextState.xp);

  return nextState;
}
