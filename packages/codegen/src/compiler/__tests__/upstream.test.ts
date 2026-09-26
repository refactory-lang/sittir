import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate } from '../evaluate.ts';
import { compileUpstream } from '../upstream.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixture = (name: string) => resolve(__dirname, '../../__tests__/fixtures', name);

describe('upstream evaluation and compile', () => {
	it('a wired grammar with rules: carries its base evaluated with no wire config', async () => {
		const raw = await evaluate(fixture('rule-cause-grammar.ts'));
		expect(raw.upstream).toBeDefined();
		const upstream = compileUpstream(raw.upstream!);
		expect(upstream.failure).toBeUndefined();
		expect([...upstream.ruleNames].sort()).toEqual(['a', 'b', 'c']);
		expect(Array.isArray(upstream.diagnostics)).toBe(true);
	});

	it('a grammar with no wire config has no upstream', async () => {
		const raw = await evaluate(fixture('test-grammar.js'));
		expect(raw.upstream).toBeUndefined();
	});

	it('an upstream evaluation failure becomes a failure record, not a throw', () => {
		const upstream = compileUpstream({ failure: 'boom' });
		expect(upstream.failure).toBe('evaluate: boom');
		expect(upstream.diagnostics).toEqual([]);
		expect(upstream.ruleNames.size).toBe(0);
	});
});
