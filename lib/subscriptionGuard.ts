import { IUser } from '@/lib/models/User';

export type PlanType = 'FREE' | 'PRO' | 'POWER';

const PLAN_LEVELS: Record<PlanType, number> = {
  FREE: 0,
  PRO: 1,
  POWER: 2,
};

export function hasRequiredPlan(user: IUser, requiredPlan: PlanType): boolean {
  if (!user || !user.subscription || !user.subscription.plan) return false;
  
  const userLevel = PLAN_LEVELS[user.subscription.plan as PlanType] || 0;
  const requiredLevel = PLAN_LEVELS[requiredPlan];

  // If the user's plan is explicitly expired, drop them to FREE
  if (user.subscription.validUntil && new Date(user.subscription.validUntil) < new Date()) {
    return requiredLevel === 0;
  }

  return userLevel >= requiredLevel;
}

export function hasPro(user: IUser): boolean {
  return hasRequiredPlan(user, 'PRO');
}

export function hasPower(user: IUser): boolean {
  return hasRequiredPlan(user, 'POWER');
}
