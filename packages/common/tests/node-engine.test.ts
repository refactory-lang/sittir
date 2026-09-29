import { describe, expect, it } from 'vitest';
import type { AnyNodeData, EngineIdentity, GrammarFacts, Rendered, TriviaFacts } from '@sittir/types';
import { inEngine, type EngineHandle, type LiveEngine } from '../src/engine-scope.ts';
import { withMethods } from '../src/utils.ts';

const COMMENT = 9;

function triviaFacts(comment: (text: string) => AnyNodeData): TriviaFacts {
	return {
		kindName: (type) => (type === COMMENT ? 'comment' : undefined),
		kinds: new Set(['comment']),
		innerGaps: {},
		comment
	};
}

const fallback: GrammarFacts = {
	render: () => 'fallback',
	toEdit: () => ({ startPos: 0, endPos: 0, insertedText: 'fallback' }),
	trivia: triviaFacts(() => ({ $type: COMMENT, $text: 'fallback' }) as AnyNodeData)
};

function engineHandle(label: string): EngineHandle {
	const handle: EngineHandle = { current: undefined as never };
	const trivia = triviaFacts((text) => withMethods({ $type: COMMENT, $text: text } as AnyNodeData, fallback));
	const live: LiveEngine = {
		language: { name: 'fake', load: () => Promise.reject(new Error('type-only')) },
		renderModuleHash: label,
		options: {},
		trivia,
		render: () => ({ toString: () => label }) as Rendered
	};
	handle.current = live;
	return handle;
}

function detach(handle: EngineHandle): EngineIdentity {
	const { render: _render, ...identity } = handle.current as LiveEngine;
	handle.current = identity;
	return identity;
}

function builtIn(handle: EngineHandle, node: Record<string, unknown> = { $type: 1, $text: 'x' }): AnyNodeData {
	return inEngine(handle, () => withMethods(node as unknown as AnyNodeData, fallback));
}

type Methods = {
	$engine?(): unknown;
	$render(): string;
	$toEdit(start: number, end: number): unknown;
	$replace(target: { range(): unknown }): unknown;
	$with: { x(): AnyNodeData & Methods };
	$trivia: { leading(...items: unknown[]): AnyNodeData & Methods; leading(): readonly unknown[] };
};
const methods = (node: AnyNodeData): AnyNodeData & Methods => node as AnyNodeData & Methods;

describe('a node and its engine', () => {
	it('is stamped with the handle in scope, as a non-enumerable method', () => {
		const a = engineHandle('a');
		const node = methods(builtIn(a));
		expect(node.$engine?.()).toBe(a.current);
		expect(Object.keys(node)).not.toContain('$engine');
	});

	it('carries no engine outside a scope and renders through the supplied facts', () => {
		const node = methods(withMethods({ $type: 1, $text: 'x' } as AnyNodeData, fallback));
		expect(node.$engine).toBeUndefined();
		expect(node.$render()).toBe('fallback');
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
		const node = methods(
			builtIn(a, {
				$type: 1,
				$text: 'x',
				$with: { x: () => withMethods({ $type: 2, $text: 'y' } as AnyNodeData, fallback) }
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
		const [entry] = node.$trivia.leading() as (AnyNodeData & Methods)[];
		expect(entry?.$engine?.()).toBe(a.current);
	});

	it('keeps $trivia working on a node whose engine is disposed', () => {
		const a = engineHandle('a');
		const node = methods(builtIn(a));
		const identity = detach(a);
		node.$trivia.leading('// x');
		const [entry] = node.$trivia.leading() as (AnyNodeData & Methods)[];
		expect(entry?.$engine?.()).toBe(identity);
		expect(() => entry?.$render()).toThrow(/engine disposed/);
	});
});
