import type { InterventionDrillType, NearMissRecord, RelapseTrigger } from '../types/app';

export const NEAR_MISS_CAP = 100;

export function createNearMiss(
  trigger: RelapseTrigger,
  drillType: InterventionDrillType,
  nowMs: number
): NearMissRecord {
  return {
    id: `nearmiss_${nowMs}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: nowMs,
    trigger,
    drillType,
  };
}

export function appendNearMiss(
  history: readonly NearMissRecord[] | undefined,
  record: NearMissRecord,
  cap = NEAR_MISS_CAP
): NearMissRecord[] {
  return [record, ...(history ?? [])].slice(0, cap);
}
