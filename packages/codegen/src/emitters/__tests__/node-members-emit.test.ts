import { describe, expect, it } from 'vitest';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import { makeMinimalNodeMap, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import { nodeMemberParts } from '../node-members.ts';

const functionBody = (source: string, name: string): string => {
	const start = source.indexOf(`function ${name}(`);
	expect(start).toBeGreaterThanOrEqual(0);
	return source.slice(start, source.indexOf('\n}\n', start));
};

describe('a node writes its member objects as literals, the receiver last', () => {
	const source = emitFactories({ grammar: 'synth', ...withGeneratedIdTables((kindEntries) => makeMinimalNodeMap(kindEntries))});

	it('a text leaf holds its engine handle in its literal and shares its trivia members', () => {
		const body = functionBody(source, 'buildIdentifier');
		expect(body).toContain('const handle = currentHandle();');
		expect(body).toContain('const node = {');
		expect(body).toContain('$render: () => renderText(handle, node),');
		expect(body).toContain('$trivia: undefined as unknown as object,');
		expect(body).toContain('[HANDLE]: handle,');
		expect(body).toContain('node.$trivia = { leading: objectLeading, trailing: objectTrailing, [RECEIVER]: node };');
		expect(body).toContain('$engine: handle && (() => handle.current)');
		expect(body).toContain('$_layout: undefined,');
		expect(body).not.toMatch(/withMethods|withAccessors|defineProperty/);
	});

	it('a field-carrying kind writes readers inline, holds its config, and names one shared setter per slot', () => {
		const body = functionBody(source, 'buildCallExpression');
		expect(body).toContain('$with: undefined as unknown as object,');
		expect(body).toContain('[HANDLE]: handle,');
		expect(body).toContain('[INPUT]: config,');
		const members = body.split('\n').find((line) => line.includes('node.$with = {'))!;
		expect(members).toMatch(/^\s*node\.\$with = \{ callee: buildCallExpression\$with\$callee, [^;]*\[RECEIVER\]: node \};$/);
		expect(members).not.toContain('=>');
		expect(functionBody(source, 'buildCallExpression$with$callee')).toContain('return buildCallExpression$with(receiverOf(this, "$with.callee"), "callee", args);');
		const dispatch = functionBody(source, 'buildCallExpression$with');
		expect(dispatch).toContain('(node: Held, setter: string, args: readonly unknown[]): unknown {');
		expect(dispatch).toContain('const config = node[INPUT] as T.CallExpression.Config;');
		expect(dispatch).toMatch(/case "callee":\s+return applySetter\(args, \(value: [^)]*\) => rebuilt\(node, handle, \(\) => buildCallExpression\(\{ \.\.\.config, callee: value \}\)\)\);/);
		expect(body).toContain('callee: () => hydrateStoredSlot(node, "_callee"),');
		expect(body).toContain('$_layout: undefined,');
		expect(body).not.toMatch(/withMethods|withAccessors|defineProperty/);
	});
});

describe('nodeMemberParts', () => {
	it('adds the inner side only where the kind has one, and never a named gap', () => {
		const text = (inner: boolean): string => {
			const parts = nodeMemberParts({ accessors: [], trivia: { inner } });
			return [...parts.members, ...parts.after].join('\n');
		};
		expect(text(false)).not.toContain('inner:');
		expect(text(true)).toContain('inner: objectInner, [RECEIVER]: node');
		expect(text(true)).not.toContain('innerAt');
	});

	it('writes no $trivia for a kind that holds no trivia', () => {
		const parts = nodeMemberParts({ accessors: [], trivia: undefined });
		const text = [...parts.members, ...parts.after].join('\n');
		expect(text).not.toContain('$trivia');
		expect(text).not.toContain('objectLeading');
		expect(text).not.toContain('[HANDLE]');
		expect(text).toContain('$render: () => renderText(handle, node),');
	});

	it('holds what its setters read in the literal, and hoists one setter function per entry', () => {
		const entry = { name: 'left', params: 'value: unknown', body: 'buildPair({ ...config, left: value }, options)' };
		const held = [
			{ local: 'config', type: 'T.Pair.Config', key: 'INPUT' as const },
			{ local: 'options', type: 'T.Pair.Options', key: 'OPTIONS' as const }
		];
		const parts = nodeMemberParts({ setters: { kind: 'pair', prefix: 'buildPair', entries: [entry], held, readers: ['  const readGroup_left = () => undefined;'] }, accessors: [], trivia: undefined });
		expect(parts.members).toEqual(expect.arrayContaining(['    [HANDLE]: handle,', '    [INPUT]: config,', '    [OPTIONS]: options,']));
		expect(parts.after).toEqual(['  node.$with = { left: buildPair$with$left, [RECEIVER]: node };']);
		expect(parts.hoisted).toEqual([
			'function buildPair$with(node: Held, setter: string, args: readonly unknown[]): unknown {',
			'  const handle = node[HANDLE];',
			'  const config = node[INPUT] as T.Pair.Config;',
			'  const options = node[OPTIONS] as T.Pair.Options;',
			'  const readGroup_left = () => undefined;',
			'  switch (setter) {',
			'    case "left":',
			'      return applySetter(args, (value: unknown) => rebuilt(node, handle, () => buildPair({ ...config, left: value }, options)));',
			'  }',
			'  throw new Error(`pair has no $with.${setter}`);',
			'}',
			'function buildPair$with$left(this: Received<Held>, ...args: unknown[]): unknown {',
			'  return buildPair$with(receiverOf(this, "$with.left"), "left", args);',
			'}'
		]);
	});

	it('holds nothing for a $with with no setters', () => {
		const parts = nodeMemberParts({ setters: { kind: 'empty', prefix: 'buildEmpty', entries: [], held: [{ local: 'config', type: 'object', key: 'INPUT' }] }, accessors: [], trivia: undefined });
		expect(parts.members.join('\n')).not.toMatch(/\[(HANDLE|INPUT)\]/);
		expect(parts.after).toEqual(['  node.$with = { [RECEIVER]: node };']);
		expect(parts.hoisted).toEqual([]);
	});
});

describe('a wrapped node writes its members in its literal', () => {
	it('a plain kind holds its engine handle, data and tree, and rebuilds through a shared setter', async () => {
		const { emitWrap } = await import('../../__tests__/helpers/emit-wrap.ts');
		const wrap = emitWrap({ grammar: 'synth', ...withGeneratedIdTables((kindEntries) => makeMinimalNodeMap(kindEntries))});
		const body = functionBody(wrap, 'wrapCallExpression');
		expect(body).toContain('const handle = currentHandle();');
		expect(body).toContain('$render: () => renderText(handle, node),');
		expect(body).toContain('[HANDLE]: handle,\n    [INPUT]: data,\n    [READ_TREE]: tree,\n    [Symbol.dispose]: releaseNothing');
		const setter = functionBody(wrap, 'wrapCallExpression$with');
		expect(setter).toContain('const data = node[INPUT] as T.CallExpression;');
		expect(setter).toContain('const tree = node[READ_TREE] as TreeHandle;');
		expect(setter).toMatch(/rebuilt\(node, handle, \(\) =>\s+wrapCallExpression\(\{ \.\.\.\$edited\(data\)/);
		expect(body).not.toContain('$_layout: undefined');
		expect(body).not.toMatch(/withMethods|defineProperty/);
	});
});
