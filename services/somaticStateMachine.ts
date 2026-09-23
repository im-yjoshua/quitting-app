export type GroundingPhase = 'scan_anchors' | 'kinetic_reps' | 'cleared';

export const TOTAL_ANCHOR_TARGETS = 3;
export const REQUIRED_KINETIC_REPS = 5;
export const G_FORCE_PEAK_THRESHOLD = 1.35;
export const G_FORCE_TROUGH_THRESHOLD = 1.05;

export interface SomaticState {
  phase: GroundingPhase;
  currentTargetIndex: number;
  anchorLockProgress: number; // 0 to 100
  isLockingAnchor: boolean;
  repCount: number;
  requiredReps: number;
  currentGForce: number;
  isPeakDetected: boolean;
  isCleared: boolean;
  clearedAt: number | null;
}

export const INITIAL_SOMATIC_STATE: SomaticState = {
  phase: 'scan_anchors',
  currentTargetIndex: 0,
  anchorLockProgress: 0,
  isLockingAnchor: false,
  repCount: 0,
  requiredReps: REQUIRED_KINETIC_REPS,
  currentGForce: 1.0,
  isPeakDetected: false,
  isCleared: false,
  clearedAt: null,
};

export type SomaticEvent =
  | { type: 'START_ANCHOR_LOCK' }
  | { type: 'TICK_ANCHOR_LOCK'; deltaPercent: number }
  | { type: 'ABORT_ANCHOR_LOCK' }
  | { type: 'ACCELERATION_UPDATE'; gForce: number }
  | { type: 'RECORD_REP' }
  | { type: 'COMPLETE_ALL' }
  | { type: 'RESET' };

/**
 * Pure, deterministic state machine reducer for the acute somatic circuit breaker.
 * Transitions strictly: scan_anchors -> kinetic_reps -> cleared.
 */
export function somaticStateReducer(state: SomaticState, event: SomaticEvent): SomaticState {
  switch (event.type) {
    case 'START_ANCHOR_LOCK': {
      if (state.phase !== 'scan_anchors' || state.isLockingAnchor) {
        return state;
      }
      return {
        ...state,
        isLockingAnchor: true,
        anchorLockProgress: 0,
      };
    }

    case 'TICK_ANCHOR_LOCK': {
      if (state.phase !== 'scan_anchors' || !state.isLockingAnchor) {
        return state;
      }

      const nextProgress = Math.min(100, state.anchorLockProgress + event.deltaPercent);

      if (nextProgress >= 100) {
        // Current anchor completed
        if (state.currentTargetIndex < TOTAL_ANCHOR_TARGETS - 1) {
          // Advance to next environmental anchor
          return {
            ...state,
            currentTargetIndex: state.currentTargetIndex + 1,
            isLockingAnchor: false,
            anchorLockProgress: 0,
          };
        } else {
          // All anchors locked -> Transition cleanly to kinetic_reps
          return {
            ...state,
            phase: 'kinetic_reps',
            isLockingAnchor: false,
            anchorLockProgress: 0,
          };
        }
      }

      return {
        ...state,
        anchorLockProgress: nextProgress,
      };
    }

    case 'ABORT_ANCHOR_LOCK': {
      if (!state.isLockingAnchor) return state;
      return {
        ...state,
        isLockingAnchor: false,
        anchorLockProgress: 0,
      };
    }

    case 'ACCELERATION_UPDATE': {
      return {
        ...state,
        currentGForce: event.gForce,
      };
    }

    case 'RECORD_REP': {
      if (state.phase !== 'kinetic_reps') {
        return state;
      }

      const nextRepCount = state.repCount + 1;
      if (nextRepCount >= state.requiredReps) {
        // Transition cleanly to cleared
        return {
          ...state,
          phase: 'cleared',
          repCount: nextRepCount,
          isCleared: true,
          clearedAt: Date.now(),
        };
      }

      return {
        ...state,
        repCount: nextRepCount,
      };
    }

    case 'COMPLETE_ALL': {
      return {
        ...state,
        phase: 'cleared',
        isCleared: true,
        clearedAt: Date.now(),
      };
    }

    case 'RESET': {
      return {
        ...INITIAL_SOMATIC_STATE,
      };
    }

    default:
      return state;
  }
}

/**
 * Pure helper for kinetic accelerometer rep inflection detection.
 * Detects inflection cycle: G-force peaks above 1.35G, then drops below 1.05G.
 */
export function processKineticReading(
  state: SomaticState,
  magnitude: number
): {
  nextState: SomaticState;
  repCompleted: boolean;
  circuitCleared: boolean;
} {
  if (state.phase !== 'kinetic_reps') {
    return {
      nextState: { ...state, currentGForce: parseFloat(magnitude.toFixed(2)) },
      repCompleted: false,
      circuitCleared: false,
    };
  }

  const roundedG = parseFloat(magnitude.toFixed(2));
  let isPeakDetected = state.isPeakDetected;
  let repCompleted = false;

  if (magnitude > G_FORCE_PEAK_THRESHOLD && !isPeakDetected) {
    isPeakDetected = true;
  } else if (magnitude < G_FORCE_TROUGH_THRESHOLD && isPeakDetected) {
    isPeakDetected = false;
    repCompleted = true;
  }

  let nextState: SomaticState = {
    ...state,
    currentGForce: roundedG,
    isPeakDetected,
  };

  let circuitCleared = false;
  if (repCompleted) {
    nextState = somaticStateReducer(nextState, { type: 'RECORD_REP' });
    circuitCleared = nextState.phase === 'cleared';
  }

  return {
    nextState,
    repCompleted,
    circuitCleared,
  };
}
