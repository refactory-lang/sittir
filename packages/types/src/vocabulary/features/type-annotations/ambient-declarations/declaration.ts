import type { GrammarContext } from '../../../context.ts';
import type { SubKindOf } from '../../../utils.ts';
import type * as V from '../../../index.ts';
export namespace Declaration {
	export interface Ambient<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.ambient';
		readonly content: G['slots']['declaration.ambient']['content'];
	}
	export interface Field<G extends GrammarContext<G>> {
		readonly declare?: boolean;
	}
	export interface ModuleProperty<G extends GrammarContext<G>> extends SubKindOf<V.Declaration<G>> {
		readonly $kind: 'declaration.module_property';
		readonly name: V.Identifier.Property<G>;
		readonly type: G['slots']['declaration.module_property']['type'];
	}
}
