import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 5: Reduced motion static glow
 * Validates: Requirements 8.3
 *
 * For any elapsed time value (in milliseconds) with reduced motion enabled,
 * the computed glow opacity returned by calculateGlowOpacity SHALL be exactly 0.7.
 */

// Constants from app.js (pure function tested in isolation)
const GLOW_PULSE_MIN_OPACITY = 0.6;
const GLOW_PULSE_MAX_OPACITY = 1.0;
const GLOW_PULSE_PERIOD_MS = 1000;
const GLOW_REDUCED_MOTION_OPACITY = 0.7;

function calculateGlowOpacity(elapsedMs, reducedMotion) {
  if (reducedMotion) return GLOW_REDUCED_MOTION_OPACITY;
  const phase = (elapsedMs % GLOW_PULSE_PERIOD_MS) / GLOW_PULSE_PERIOD_MS;
  const sinValue = Math.sin(phase * 2 * Math.PI);
  const normalized = (sinValue + 1) / 2; // [0, 1]
  return GLOW_PULSE_MIN_OPACITY + normalized * (GLOW_PULSE_MAX_OPACITY - GLOW_PULSE_MIN_OPACITY);
}

describe('calculateGlowOpacity - Property 5: Reduced motion static glow', () => {
  /**
   * **Validates: Requirements 8.3**
   */

  it('returns exactly 0.7 for any small integer elapsed time with reducedMotion enabled', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10_000 }),
        (elapsedMs) => {
          const result = calculateGlowOpacity(elapsedMs, true);
          expect(result).toBe(0.7);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns exactly 0.7 for any large integer elapsed time with reducedMotion enabled', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 100_000_000 }),
        (elapsedMs) => {
          const result = calculateGlowOpacity(elapsedMs, true);
          expect(result).toBe(0.7);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns exactly 0.7 for any float elapsed time with reducedMotion enabled', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        (elapsedMs) => {
          const result = calculateGlowOpacity(elapsedMs, true);
          expect(result).toBe(0.7);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns exactly 0.7 for boundary and edge-case elapsed times with reducedMotion enabled', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(0),
          fc.constant(1),
          fc.constant(999),
          fc.constant(1000),
          fc.constant(1001),
          fc.constant(Number.MAX_SAFE_INTEGER),
          fc.double({ min: 0, max: Number.MAX_SAFE_INTEGER, noNaN: true, noDefaultInfinity: true })
        ),
        (elapsedMs) => {
          const result = calculateGlowOpacity(elapsedMs, true);
          expect(result).toBe(0.7);
        }
      ),
      { numRuns: 200 }
    );
  });
});
