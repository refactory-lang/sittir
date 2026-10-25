import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { scopeBuilders } from '@sittir/common/engine';
import * as raw from '../src/factories/raw.ts';
import rust from '../src/index.ts';
import { TSKindId } from '../src/kinds.ts';

const findOfType = (value: unknown, type: string): unknown => {
	if (value === null || typeof value !== 'object') return undefined;
	if ((value as { $type?: unknown }).$type === type) return value;
	for (const child of Object.values(value)) {
		const found = findOfType(child, type);
		if (found !== undefined) return found;
	}
	return undefined;
};

describe('a hidden token rule whose parse holds its token', () => {
	it('stores the token the parse holds, read and built alike, and renders it', async () => {
		const rs = await createEngine(rust, { verifyStructure: 'runtime' });
		const parsed = findOfType(JSON.parse(JSON.stringify(rs.parse('fn f() { ..; }\n'))), 'range_expression_bare');
		expect(parsed).toEqual({ $type: 'range_expression_bare', rangeExpressionBare: { $type: 'dot_dot' } });
		const built = rs.build.rangeExpressionBare(TSKindId.DotDot);
		expect(JSON.parse(JSON.stringify(built))).toEqual(parsed);
		expect(rs.render(built).toString()).toBe('..');
	});
});

describe('a keyword alias display is a leaf of its own kind', () => {
	it('builds as its kind id and renders its keyword', async () => {
		const rs = await createEngine(rust, { verifyStructure: 'runtime' });
		const { buildCrateVisibilityModifier } = scopeBuilders(rs, raw);
		expect(buildCrateVisibilityModifier).toBe(TSKindId.CrateVisibilityModifier);
		expect(rs.render(rs.build.visibilityModifier(buildCrateVisibilityModifier)).toString()).toBe('crate');
	});
});
