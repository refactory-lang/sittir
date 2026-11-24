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
		readonly name: Slot<G, K, 'name', V.Identifier.Any<G>>;
		readonly parameters: Slot<G, K, 'parameters', V.Declaration.Parameter.AnyWithType<G> | V.Clause.Bounds.Removed<G> | string>[];
		readonly statements?: Slot<G, K, 'statements', V.Statement.Any<G>>[];
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
		readonly value?: Slot<G, K, 'value', V.Expression.Any<G> | V.Declaration.Constant<G> | V.Declaration.Variable<G> | V.Pattern.Tuple.Bare<G>>;
	}
	export namespace Parameter {
		export type AnyWithType<G extends GrammarMap> = V.Declaration.Parameter.Any<G> | V.Type.Any<G>;
	}
}
