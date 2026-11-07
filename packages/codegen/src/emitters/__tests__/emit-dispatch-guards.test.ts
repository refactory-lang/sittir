import { describe, expect, it } from 'vitest';
import { dispatchNodeMapByTaxonomy, type NodeDispatchEmitters } from '../emit.ts';
import { collectKindEntries } from '../kind-discriminant.ts';
import { EmitCollector, emitShapeFailure } from '../../compiler/diagnostics/emit-diagnostics.ts';
import { assemblePredicted, predictedRawGrammarOf } from '../../__tests__/helpers/linked.ts';
import { EmitHaltedError, type GrammarDiagnostic } from '../../types/diagnostics.ts';

const S = (value: string) => ({ type: 'STRING', value });
const sym = (name: string) => ({ type: 'SYMBOL', name });
const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });

const failing = (code: string) => (node: { readonly kind: string }): void => {
	if (node.kind === 'left') throw emitShapeFailure({ code, ownerKind: 'left', message: `${code} on left` });
};
const inert = (): void => undefined;

describe('the dispatch guards each emitter call of an owner', () => {
	it('reports a wrap blocker and a render-module blocker of the same owner together', () => {
		const raw = predictedRawGrammarOf({
			source: { type: 'REPEAT', content: sym('left') },
			left: { type: 'SEQ', members: [S('l'), field('name', sym('word'))] },
			word: { type: 'PATTERN', value: '[a-z]+' }
		});
		const { nodeMap, generatedIdTables } = assemblePredicted(raw);
		const kindEntries = collectKindEntries(nodeMap, generatedIdTables);
		const emitters = {
			factoryEmitter: { emitLeaf: inert, emitBranch: inert, emitSeparatedList: inert, emitRefineForms: inert },
			fromEmitter: { emitLeaf: inert, emitBranch: inert, emitSeparatedList: inert },
			wrapEmitter: { emitBranch: failing('wrap-blocker'), emitSeparatedList: failing('wrap-blocker') },
			templateEmitter: { emitLeaf: inert, emitBranch: inert },
			renderModuleEmitterInst: { emitLeaf: failing('render-blocker'), emitBranch: failing('render-blocker') }
		} as unknown as NodeDispatchEmitters;
		const collector = new EmitCollector('demo');
		dispatchNodeMapByTaxonomy(emitters, { nodeMap, kindEntries, inlineKinds: undefined, synthesizedKinds: undefined }, collector);
		let halted: EmitHaltedError | undefined;
		try {
			collector.assertClear();
		} catch (error) {
			halted = error as EmitHaltedError;
		}
		const codes = (halted!.blocking as readonly GrammarDiagnostic[]).filter((d) => d.ownerKind === 'left').map((d) => d.code);
		expect(codes).toContain('wrap-blocker');
		expect(codes).toContain('render-blocker');
	});
});
