import { describe, expect, it } from 'vitest';
import type { AnyUntypedNode } from '@sittir/types';
import { inEngine, type EngineHandle } from '../src/engine-scope.ts';
import { rebuilt as rebuiltIn } from '../src/utils.ts';
import { withMembers as withMethods } from './support/members.ts';
import { detach, liveHandle, triviaFacts } from './support/fake-engine.ts';

const COMMENT = 9;

function engineHandle(label: string): EngineHandle {
	return liveHandle({
		render: () => label,
		trivia: triviaFacts((text) => withMethods({ $type: COMMENT, $text: text } as AnyUntypedNode))
	});
}

function builtIn(handle: EngineHandle, node: Record<string, unknown> = { $type: 1, $text: 'x' }): AnyUntypedNode {
	return inEngine(handle, () => withMethods(node as unknown as AnyUntypedNode));
}

type Methods = {
	$engine?(): unknown;
	$render(): string;
	$toEdit(start: number, end: number): unknown;
	$replace(target: { range(): unknown }): unknown;
	$with: { x(): AnyUntypedNode & Methods };
	$trivia: { leading(...items: unknown[]): AnyUntypedNode & Methods; leading(): readonly unknown[] };
};
const methods = (node: AnyUntypedNode): AnyUntypedNode & Methods => node as AnyUntypedNode & Methods;

describe('a node and its engine', () => {
	it('is stamped with the handle in scope', () => {
		const a = engineHandle('a');
		const node = methods(builtIn(a));
		expect(node.$engine?.()).toBe(a.current);
	});

	it('carries no engine outside a scope, so it cannot render, edit or take trivia', () => {
		const node = methods(withMethods({ $type: 1, $text: 'x' } as AnyUntypedNode));
		expect(node.$engine).toBeUndefined();
		expect(() => node.$render()).toThrow(/no engine.*engine\.render\(node\)/);
		expect(() => node.$toEdit(0, 1)).toThrow(/no engine/);
		expect(() => node.$trivia.leading('// x')).toThrow(/no engine/);
	});

	it('renders and edits through its engine, not the supplied facts', () => {
		const node = methods(builtIn(engineHandle('a')));
		expect(node.$render()).toBe('a');
		expect(node.$toEdit(0, 3)).toEqual({ startPos: 0, endPos: 3, insertedText: 'a' });
		const range = { start: { index: 1 }, end: { index: 2 } };
		expect(node.$replace({ range: () => range })).toEqual({ startPos: 1, endPos: 2, insertedText: 'a' });
	});

	it('names engine.render(node) when its engine is disposed, and leaves other engines alone', () => {
		const a = engineHandle('a');
		const b = engineHandle('b');
		const nodeA = methods(builtIn(a));
		const nodeB = methods(builtIn(b));
		const identity = detach(a);
		expect(nodeA.$engine?.()).toBe(identity);
		expect(() => nodeA.$render()).toThrow(/engine disposed.*engine\.render\(node\)/);
		expect(() => nodeA.$toEdit(0, 1)).toThrow(/engine disposed/);
		expect(nodeB.$render()).toBe('b');
	});

	it('rebuilds a $with setter under its own engine, whatever scope calls it', () => {
		const a = engineHandle('a');
		const b = engineHandle('b');
		const node: AnyUntypedNode & Methods = methods(
			builtIn(a, {
				$type: 1,
				$text: 'x',
				$with: { x: () => rebuiltIn(node, a, () => withMethods({ $type: 2, $text: 'y' } as AnyUntypedNode)) }
			})
		);
		const rebuilt = inEngine(b, () => node.$with.x());
		expect(methods(rebuilt).$engine?.()).toBe(a.current);
	});

	it('builds a comment from $trivia text under its own engine', () => {
		const a = engineHandle('a');
		const b = engineHandle('b');
		const node = methods(builtIn(a));
		inEngine(b, () => node.$trivia.leading('// x'));
		const [entry] = node.$trivia.leading() as (AnyUntypedNode & Methods)[];
		expect(entry?.$engine?.()).toBe(a.current);
	});

	it('keeps $trivia working on a node whose engine is disposed', () => {
		const a = engineHandle('a');
		const node = methods(builtIn(a));
		const identity = detach(a);
		node.$trivia.leading('// x');
		const [entry] = node.$trivia.leading() as (AnyUntypedNode & Methods)[];
		expect(entry?.$engine?.()).toBe(identity);
		expect(() => entry?.$render()).toThrow(/engine disposed/);
	});
});
