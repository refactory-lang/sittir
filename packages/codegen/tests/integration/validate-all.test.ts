import { describe, it, expect, beforeAll } from 'vitest';
import { generate } from '../../src/compiler/generate.ts';
import { validateRoundTrip } from '../../src/validate-roundtrip.ts';
import { validateFactoryRoundTrip } from '../../src/validate-factory-roundtrip.ts';

const GRAMMARS = ['rust', 'typescript', 'python'] as const;

// Round-trip failure ceilings — asserted ceilings can only go DOWN
// over time. The authoritative guard is
// `src/__tests__/corpus-validation.test.ts`; this smoke-test file
// exercises the same validators against fresh generator output.
// Ceilings raised for bare-keyword-prefix pass (spec 007 T009).
// The pass wraps leading keywords as fields, but the base parser
// doesn't know about them yet — regressions expected until the
// override-compiled parser (US1) replaces the base parser.
const RT_CEILINGS: Record<string, { roundTrip: number; factoryRoundTrip: number }> = {
  rust:       { roundTrip: 55, factoryRoundTrip: 45 },
  typescript: { roundTrip: 15, factoryRoundTrip: 15 },
  python:     { roundTrip: 55, factoryRoundTrip: 40 },
};

for (const grammar of GRAMMARS) {
  describe(`${grammar} e2e validation`, () => {
    let result: Awaited<ReturnType<typeof generate>>;
    beforeAll(async () => {
      result = await generate({ grammar, outputDir: 'src' });
    });

    it('generates without errors', () => {
      expect(result.templatesYaml).toBeDefined();
      expect(result.factories).toBeDefined();
      expect(result.types).toBeDefined();
      expect(result.from).toBeDefined();
      expect(result.suggested).toBeDefined();
    });

    describe('round-trip validation', () => {
      const ceiling = RT_CEILINGS[grammar]!;

      it('parse → readNode → render → reparse preserves structure', async () => {
        const rt = await validateRoundTrip(grammar, result.templatesYaml);
        expect(rt.pass).toBeGreaterThan(0);
        // Ceiling: fail count must not regress above known baseline
        expect(rt.fail, `round-trip regressions (ceiling ${ceiling.roundTrip})`).toBeLessThanOrEqual(ceiling.roundTrip);
      }, 30_000);

      it('factory round-trip — factory → render → parse matches', async () => {
        const frt = await validateFactoryRoundTrip(grammar, result.templatesYaml);
        expect(frt.pass).toBeGreaterThan(0);
        expect(frt.fail, `factory round-trip regressions (ceiling ${ceiling.factoryRoundTrip})`).toBeLessThanOrEqual(ceiling.factoryRoundTrip);
      }, 30_000);
    });
  });
}
