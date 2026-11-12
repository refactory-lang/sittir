import type { GrammarMap, Slot } from './map.ts';
import type { SubKindOf, Under } from './utils.ts';
import type * as V from './index.ts';
export interface Declaration<G extends GrammarMap, K extends Under<'declaration'> = 'declaration'> {
	readonly $path: K;
}

export interface DeclarationSynonyms {
	readonly constructor: 'initializer' | 'init';
	readonly enum_member: 'variant' | 'enumerator';
	readonly extension: 'impl';
	readonly foreign: 'extern';
	readonly index: 'indexer';
	readonly internal: 'crate';
	readonly module: 'mod';
	readonly parameters: 'param_spec';
	readonly receiver: 'self' | 'this';
	readonly special: 'dunder' | 'magic';
	readonly struct: 'record';
	readonly type_alias: 'typedef' | 'typealias';
}

export namespace Declaration {
	export interface Function<G extends GrammarMap, K extends Under<'declaration.function'> = 'declaration.function'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly body?: Slot<G, K, 'body', V.Declaration.TypeAlias<G> | V.Statement.Any<G>>;
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		readonly parameters: Slot<
			G,
			K,
			'parameters',
			| V.Clause.Bounds.Removed<G>
			| V.Expression.Call.Macro<G>
			| V.Identifier.Any<G>
			| V.Pattern.Any<G>
			| V.Declaration.Parameter.Any<G>
			| string
			| V.Type.Any<G>
		>[];
	}
	export interface Parameter<G extends GrammarMap, K extends Under<'declaration.parameter'> = 'declaration.parameter'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly name?: Slot<G, K, 'name', unknown>;
	}
	export interface Variable<G extends GrammarMap, K extends Under<'declaration.variable'> = 'declaration.variable'> extends SubKindOf<V.Declaration<G, K>> {
		// claimed by prt
		readonly $path: K;
		readonly name?: Slot<G, K, 'name', unknown>;
		readonly value?: Slot<
			G,
			K,
			'value',
			| V.Declaration.Any<G>
			| V.Expression.Any<G>
			| V.Identifier.Any<G>
			| V.Literal.Any<G>
			| V.Pattern.Any<G>
			| V.Statement.Any<G>
		>;
	}
}
