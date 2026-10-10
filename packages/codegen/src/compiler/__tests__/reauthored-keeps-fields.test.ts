import { describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { allGrammars, grammarPackage } from '../../grammars.ts';
import { evaluatePackage } from '../evaluate-package.ts';

const fieldsOf = (rule: unknown, out = new Set<string>()): Set<string> => {
	if (Array.isArray(rule)) rule.forEach((r) => fieldsOf(r, out));
	else if (rule !== null && typeof rule === 'object') {
		const r = rule as Record<string, unknown>;
		if (r.type === 'FIELD') out.add(r.name as string);
		Object.values(r).forEach((v) => fieldsOf(v, out));
	}
	return out;
};

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
				const kept = new Set<string>();
				const pending = [name];
				const seen = new Set(pending);
				for (let rule = pending.pop(); rule !== undefined; rule = pending.pop()) {
					fieldsOf(raw.rules[rule], kept);
					for (const ref of symbolsOf(raw.rules[rule])) {
						if (seen.has(ref) || ref in upstream || !(ref in raw.rules)) continue;
						seen.add(ref);
						pending.push(ref);
					}
				}
				return [...fieldsOf(upstream[name])].filter((field) => !kept.has(field)).map((field) => `${name}.${field}`);
			});
			expect(dropped).toEqual([]);
		}, FULL_PIPELINE_TIMEOUT);
	}
});
