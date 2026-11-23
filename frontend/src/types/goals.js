/**
 * Goal type definitions and labels
 */
export const GOAL_TYPES = {
  STEPS: 'steps',
  EXERCISE: 'exercise',
  WATER: 'water',
  SLEEP: 'sleep',
  MEDICATION: 'medication',
  CUSTOM: 'custom',
};

export const GOAL_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

export const GOAL_STATUSES = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

export const DEFAULT_GOAL_CONFIGS = {
  [GOAL_TYPES.STEPS]: { defaultTarget: 10000, unit: 'steps', frequency: GOAL_FREQUENCIES.DAILY },
  [GOAL_TYPES.EXERCISE]: { defaultTarget: 30, unit: 'mins', frequency: GOAL_FREQUENCIES.DAILY },
  [GOAL_TYPES.WATER]: { defaultTarget: 2000, unit: 'ml', frequency: GOAL_FREQUENCIES.DAILY },
  [GOAL_TYPES.SLEEP]: { defaultTarget: 8, unit: 'hours', frequency: GOAL_FREQUENCIES.DAILY },
};