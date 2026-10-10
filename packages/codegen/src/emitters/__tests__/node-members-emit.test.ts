import { describe, expect, it } from 'vitest';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import { makeMinimalNodeMap } from '../../__tests__/helpers/node-map-fixtures.ts';
import { nodeMemberLines } from '../node-members.ts';

const functionBody = (source: string, name: string): string => {
	const start = source.indexOf(`function ${name}(`);
	expect(start).toBeGreaterThanOrEqual(0);
	return source.slice(start, source.indexOf('\n}\n', start));
};

describe('a node writes its members in its literal', () => {
	const source = emitFactories({ grammar: 'synth', nodeMap: makeMinimalNodeMap() });

	it('a text leaf builds its engine handle and members inline', () => {
		const body = functionBody(source, 'buildIdentifier');
		expect(body).toContain('const handle = currentHandle();');
		expect(body).toContain('const node = {');
		expect(body).toContain('$render: () => renderText(handle, node),');
		expect(body).toContain("leading: (...items: unknown[]) => triviaSide(node, handle, 'leading', items),");
		expect(body).toContain('$engine: handle && (() => handle.current)');
		expect(body).not.toMatch(/withMethods|withAccessors|defineProperty/);
	});

	it('a field-carrying kind writes readers and rebuilding setters inline', () => {
		const body = functionBody(source, 'buildCallExpression');
		expect(body).toContain('$with: {');
		expect(body).toMatch(/callee: \(value[^)]*\) =>\s+rebuilt\(node, handle, \(\) => buildCallExpression\(\{ \.\.\.config, callee: value \}/);
		expect(body).toContain('callee: () => hydrateStoredSlot(node, "_callee"),');
		expect(body).not.toMatch(/withMethods|withAccessors|defineProperty/);
	});
});

describe('nodeMemberLines', () => {
	it('adds inner positions only where the kind has them, and innerAt only where gaps are keyed', () => {
		const text = (inner: boolean, keyed: boolean) => nodeMemberLines({ accessors: [], inner: { inner, keyed } }).join('\n');
		expect(text(false, false)).not.toContain('inner:');
		expect(text(true, false)).toContain('inner: (...items: unknown[]) => triviaInner(node, handle, items),');
		expect(text(true, false)).not.toContain('innerAt');
		expect(text(true, true)).toContain('innerAt: (gap: string, ...items: unknown[]) => triviaInnerAt(node, handle, gap, items),');
	});
});

describe('a wrapped node writes its members in its literal', () => {
	it('a plain kind captures the engine handle and rebuilds through rebuilt', async () => {
		const { emitWrap } = await import('../../__tests__/helpers/emit-wrap.ts');
		const wrap = emitWrap({ grammar: 'synth', nodeMap: makeMinimalNodeMap() });
		const body = functionBody(wrap, 'wrapCallExpression');
		expect(body).toContain('const handle = currentHandle();');
		expect(body).toContain('$render: () => renderText(handle, node),');
		expect(body).toMatch(/rebuilt\(node, handle, \(\) =>\s+wrapCallExpression\(\{ \.\.\.\$edited\(data\)/);
		expect(body).not.toMatch(/withMethods|defineProperty/);
	});
});
