import { describe, it, expect } from 'vitest';
import { generate } from '../../src/index.ts';
import { validateTemplates } from '../../src/validate-templates.ts';
import { validateRoundTrip } from '../../src/validate-roundtrip.ts';
import { validateFactoryRoundTrip } from '../../src/validate-factory-roundtrip.ts';

const GRAMMARS = ['rust', 'typescript', 'python'] as const;

// Round-trip failure ceilings — known pre-existing gaps in template quality.
// These should only go DOWN over time, never up. Update when making improvements.
//
// NOTE: this file still drives v1 `generate()` but the validators load the
// factories.ts on disk — which is now v2 output. The ceilings therefore
// reflect v2 behavior against v1-generated templates.yaml. The authoritative
// v2 regression guard is `src/__tests__/corpus-validation.test.ts`.
const RT_CEILINGS: Record<string, { roundTrip: number; factoryRoundTrip: number }> = {
  rust:       { roundTrip: 46, factoryRoundTrip: 25 },
  typescript: { roundTrip: 0,  factoryRoundTrip: 3 },
  python:     { roundTrip: 24, factoryRoundTrip: 10 },
};

for (const grammar of GRAMMARS) {
  describe(`${grammar} e2e validation`, () => {
    const result = generate({ grammar, outputDir: 'src' });

    it('generates without errors', () => {
      expect(result.templatesYaml).toBeDefined();
      expect(result.factories).toBeDefined();
      expect(result.types).toBeDefined();
      expect(result.from).toBeDefined();
    });

    describe('template validation', () => {
      const validation = validateTemplates(grammar, result.templatesYaml);

      it('variable resolution — all template $VARs resolve to model fields', () => {
        expect(validation.stats.variableResolution.fail).toBe(0);
        expect(validation.stats.variableResolution.pass).toBeGreaterThan(0);
      });

      it('field coverage — all model fields appear in templates', () => {
        expect(validation.stats.fieldCoverage.fail).toBe(0);
        expect(validation.stats.fieldCoverage.pass).toBeGreaterThan(0);
      });

      it('override consistency — override fields match grammar structure', () => {
        expect(validation.stats.overrideConsistency.fail).toBe(0);
      });

      it('template structure — templates are well-formed', () => {
        expect(validation.stats.templateStructure.fail).toBe(0);
        expect(validation.stats.templateStructure.pass).toBeGreaterThan(0);
      });

      it('variant subtypes — named variant templates have detect tokens', () => {
        expect(validation.stats.variantSubtypes.fail).toBe(0);
      });

      it('has no validation errors', () => {
        expect(validation.errors).toEqual([]);
      });
    });

    describe('variant factory consistency', () => {
      it('variant factories reference existing types', () => {
        const variantFactoryRe = /export function (\w+)__(\w+)_\(/g;
        let m: RegExpExecArray | null;
        while ((m = variantFactoryRe.exec(result.factories)) !== null) {
          const [, base, variant] = m;
          const typeName = `${toPascalCase(base!)}${toPascalCase(variant!)}`;
          // Every variant factory must have a matching interface or type in types.ts
          expect(result.types, `missing type for ${base}__${variant}`).toContain(typeName);
        }
      });

      it('no duplicate variant factories with identical field sets', () => {
        // Known: these nodes have same-field-set variants due to keyword
        // discriminators not yet captured as override fields (needs_name).
        const KNOWN_KEYWORD_DISCRIMINATORS = new Set([
          'public_field_definition', // static/abstract/accessor
        ]);

        const variantRe = /export function (\w+)__(\w+)_\(\n  config[?]?: \w+,\n\) \{\n  const fields = \{([^}]*)\}/g;
        const byBase = new Map<string, Map<string, string>>();
        let m: RegExpExecArray | null;
        while ((m = variantRe.exec(result.factories)) !== null) {
          const [, base, variant, fieldsBlock] = m;
          const fieldNames = [...fieldsBlock!.matchAll(/^\s+(\w+):/gm)].map(f => f[1]!).sort().join(',');
          if (!byBase.has(base!)) byBase.set(base!, new Map());
          byBase.get(base!)!.set(variant!, fieldNames);
        }

        for (const [base, variants] of byBase) {
          if (KNOWN_KEYWORD_DISCRIMINATORS.has(base!)) continue;
          const byFields = new Map<string, string[]>();
          for (const [variant, fields] of variants) {
            const group = byFields.get(fields) ?? [];
            group.push(variant);
            byFields.set(fields, group);
          }
          for (const [, names] of byFields) {
            if (names.length > 1) {
              const section = extractYamlSection(result.templatesYaml, base!);
              if (!section?.includes('variants:')) {
                expect.fail(
                  `${base}: variants [${names.join(', ')}] have identical field sets without named variant templates`,
                );
              }
            }
          }
        }
      });
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

/** Match the codegen naming convention: snake_case → PascalCase, but only
 *  capitalize after underscores when the next char is a letter (not digit). */
function toPascalCase(s: string): string {
  const camel = s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function extractYamlSection(yaml: string, kind: string): string | null {
  const re = new RegExp(`^  ${kind}:`, 'm');
  const match = re.exec(yaml);
  if (!match) return null;
  const rest = yaml.slice(match.index);
  const lines = rest.split('\n');
  const section: string[] = [lines[0]!];
  for (let i = 1; i < lines.length; i++) {
    if (/^  \S/.test(lines[i]!)) break;
    section.push(lines[i]!);
  }
  return section.join('\n');
}
