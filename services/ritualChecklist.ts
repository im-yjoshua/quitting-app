/**
 * Ritual checklist persistence — per-day checkbox state for the rituals screen.
 *
 * The checkboxes in app/(drawer)/rituals.tsx used to be local-only React
 * state: they silently reset every time the screen was revisited. They are now
 * persisted per local calendar day inside a checksum-verified storage envelope
 * via the shared helpers in services/storage.ts — no bare AsyncStorage JSON.
 *
 * Day rule: a record belongs to exactly one local day (YYYY-MM-DD). Checks
 * saved yesterday never leak into today — on load, a record whose dayKey is
 * not today is treated as empty and replaced by the next save.
 */
import { loadEnvelopedObject, saveEnvelopedObject } from './storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One day's ritual checkbox state. `dayKey` is a local calendar day. */
export interface RitualDayChecks {
  /** Local calendar day this record belongs to (YYYY-MM-DD). */
  dayKey: string;
  am: Record<string, boolean>;
  pm: Record<string, boolean>;
}

function isCheckMap(raw: unknown): raw is Record<string, boolean> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  return Object.values(raw as Record<string, unknown>).every(
    (v) => typeof v === 'boolean'
  );
}

export function isRitualDayChecks(raw: unknown): raw is RitualDayChecks {
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as Record<string, unknown>;
  return (
    typeof r.dayKey === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(r.dayKey) &&
    isCheckMap(r.am) &&
    isCheckMap(r.pm)
  );
}

/** The checkbox state the screen works with (day key handled internally). */
export interface RitualCheckState {
  am: Record<string, boolean>;
  pm: Record<string, boolean>;
}

/** Local calendar day key — same convention as the rest of the app (Phase 0.6). */
export function getLocalDayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const RITUAL_CHECKS_KEY = '@sovereign/ritual_checks';

/**
 * Loads today's checkbox state. Returns empty maps when nothing was saved,
 * when the payload was corrupt (quarantined by the storage layer, never
 * trusted), or when the stored record belongs to a previous day.
 */
export async function loadTodayRitualChecks(): Promise<RitualCheckState> {
  const result = await loadEnvelopedObject(RITUAL_CHECKS_KEY, isRitualDayChecks);
  if (result.status !== 'ok' || !result.object) {
    if (result.status === 'corrupted-quarantined') {
      console.warn(
        '[Rituals] Quarantined corrupt checklist payload; starting fresh.'
      );
    }
    return { am: {}, pm: {} };
  }
  if (result.object.dayKey !== getLocalDayKey()) {
    // Yesterday's checks stay yesterday.
    return { am: {}, pm: {} };
  }
  return { am: { ...result.object.am }, pm: { ...result.object.pm } };
}

// Serialized writes: toggles are human-speed, but a rapid double-tap must
// never let an older snapshot complete after (and clobber) a newer one.
let writeChain: Promise<boolean> = Promise.resolve(true);

/** Persists checkbox state under today's local day key. Never throws. */
export function saveRitualChecks(state: RitualCheckState): Promise<boolean> {
  const record: RitualDayChecks = {
    dayKey: getLocalDayKey(),
    am: { ...state.am },
    pm: { ...state.pm },
  };
  const write = writeChain.then(() =>
    saveEnvelopedObject(RITUAL_CHECKS_KEY, isRitualDayChecks, record)
  );
  // Keep the chain alive even if a write fails; the caller still sees the error.
  writeChain = write.catch(() => false);
  return write;
}
