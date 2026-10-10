import { describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { allGrammars, grammarPackage } from '../../grammars.ts';
import { evaluatePackage } from '../evaluate-package.ts';
import { fieldContentsOf, judgeFields, type FieldContents } from '../../__tests__/helpers/reauthored-fields.ts';

const symbolsOf = (rule: unknown, out = new Set<string>()): Set<string> => {
	if (Array.isArray(rule)) rule.forEach((r) => symbolsOf(r, out));
	else if (rule !== null && typeof rule === 'object') {
		const r = rule as Record<string, unknown>;
		if (r.type === 'SYMBOL') out.add(r.name as string);
		Object.values(r).forEach((v) => symbolsOf(v, out));
	}
	return out;
};

describe('a reauthored rule', () => {
	for (const grammar of allGrammars()) {
		it(`${grammar}: keeps every field its upstream rule declares, in itself or the rules it mints`, async () => {
			const raw = await evaluatePackage(grammarPackage(grammar));
			const upstream = raw.stages?.raw.grammar.rules ?? {};
			const dropped = Object.entries(raw.ruleCauses ?? {}).flatMap(([name, declaration]) => {
				if (declaration.kind !== 'reauthored' || !(name in upstream)) return [];
				const kept: FieldContents = new Map();
				const pending = [name];
				const seen = new Set(pending);
				for (let rule = pending.pop(); rule !== undefined; rule = pending.pop()) {
					fieldContentsOf(raw.rules[rule], kept);
					for (const ref of symbolsOf(raw.rules[rule])) {
						if (seen.has(ref) || ref in upstream || !(ref in raw.rules)) continue;
						seen.add(ref);
						pending.push(ref);
					}
				}
				return judgeFields(fieldContentsOf(upstream[name]), kept).dropped.map((field) => `${name}.${field}`);
			});
			expect(dropped).toEqual([]);
		}, FULL_PIPELINE_TIMEOUT);
	}
});
