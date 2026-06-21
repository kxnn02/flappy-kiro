import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 4: Glow pulse opacity bounds
 * Validates: Requirements 3.6
 *
 * For any elapsed time value (in milliseconds) with reduced motion disabled,
 * the computed glow opacity returned by calculateGlowOpacity SHALL be between
 * 0.6 and 1.0 (inclusive).
 */

// Constants copied from app.js (pure function, tested in isolation)
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

describe('calculateGlowOpacity - Property 4: Glow pulse opacity bounds', () => {
  /**
   * **Validates: Requirements 3.6**
   */

  it('always returns a value between 0.6 and 1.0 (inclusive) when reducedMotion is false', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        (elapsedMs) => {
          const result = calculateGlowOpacity(elapsedMs, false);
          expect(result).toBeGreaterThanOrEqual(0.6);
          expect(result).toBeLessThanOrEqual(1.0);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('always returns a value between 0.6 and 1.0 for large integer elapsed times', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10_000_000 }),
        (elapsedMs) => {
          const result = calculateGlowOpacity(elapsedMs, false);
          expect(result).toBeGreaterThanOrEqual(0.6);
          expect(result).toBeLessThanOrEqual(1.0);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns exactly 0.7 when reducedMotion is true regardless of elapsedMs', () => {
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
});
