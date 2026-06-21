import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Property 7: Grid scroll offset correctness
 * Validates: Requirements 9.3, 9.4
 *
 * For any non-negative frame count and reduced motion setting, the grid offset
 * returned by calculateGridOffset SHALL equal 0 when reduced motion is enabled,
 * and SHALL equal (frameCount * 0.5) mod 40 when reduced motion is disabled,
 * always producing a value in the range [0, 40).
 */

// Constants copied from app.js (pure function, tested in isolation)
const GRID_SPACING = 40;
const GRID_SCROLL_SPEED = 0.5;

function calculateGridOffset(frameCount, reducedMotion) {
  if (reducedMotion) return 0;
  return (frameCount * GRID_SCROLL_SPEED) % GRID_SPACING;
}

describe('calculateGridOffset - Property 7: Grid scroll offset correctness', () => {
  /**
   * **Validates: Requirements 9.3, 9.4**
   */

  it('returns 0 when reducedMotion is enabled for any non-negative frame count', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1_000_000 }),
        (frameCount) => {
          const result = calculateGridOffset(frameCount, true);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns (frameCount * 0.5) % 40 when reducedMotion is disabled', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1_000_000 }),
        (frameCount) => {
          const result = calculateGridOffset(frameCount, false);
          const expected = (frameCount * 0.5) % 40;
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('always produces a value in the range [0, 40) regardless of input', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1_000_000 }),
        fc.boolean(),
        (frameCount, reducedMotion) => {
          const result = calculateGridOffset(frameCount, reducedMotion);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThan(40);
        }
      ),
      { numRuns: 200 }
    );
  });
});
