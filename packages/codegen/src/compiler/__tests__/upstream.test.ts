import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate } from '../evaluate.ts';
import { compileUpstream } from '../upstream.ts';
import { resolveOverridesPath } from '../resolve-grammar.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixture = (name: string) => resolve(__dirname, '../../__tests__/fixtures', name);

describe('upstream evaluation and compile', () => {
	it('a wired grammar with rules: carries its base evaluated with no wire config', async () => {
		const raw = await evaluate(fixture('rule-cause-grammar.ts'));
		expect(raw.upstream).toBeDefined();
		const upstream = compileUpstream(raw.upstream!);
		expect([...upstream.ruleNames].sort()).toEqual(['a', 'b', 'c']);
		expect(Array.isArray(upstream.diagnostics)).toBe(true);
	});

	it('the rule names are every name the base declares, including ones the catalog prunes as unreachable', async () => {
		const raw = await evaluate(resolveOverridesPath('typescript'));
		const evaluation = raw.upstream!;
		expect(Object.keys(evaluation.raw.rules)).not.toContain('_reserved_identifier');
		expect(compileUpstream(evaluation).ruleNames.has('_reserved_identifier')).toBe(true);
	}, 60_000);

	it('a grammar with no wire config has no upstream', async () => {
		const raw = await evaluate(fixture('test-grammar.js'));
		expect(raw.upstream).toBeUndefined();
	});
});
