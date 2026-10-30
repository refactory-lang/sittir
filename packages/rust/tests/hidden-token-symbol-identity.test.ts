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

describe('a form whose whole body is one fixed token', () => {
	it('holds no slot, read and built alike, and renders the token on both paths', async () => {
		const rs = await createEngine(rust, { verifyStructure: 'runtime' });
		const source = 'fn f() { ..; }\n';
		const tree = rs.parse(source);
		const parsed = findOfType(JSON.parse(JSON.stringify(tree)), 'range_expression_bare');
		expect(parsed).toEqual({ $type: 'range_expression_bare' });
		const built = rs.build.rangeExpressionBare();
		expect(JSON.parse(JSON.stringify(built))).toEqual(parsed);
		expect(rs.render(built).toString()).toBe('..');
		expect(rs.render(tree).toString()).toBe(source);
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
