/**
 * Type-level convergence assertion (spec 008 SC-010):
 * the three access paths into the rust grammar's type family all
 * resolve to the same concrete type.
 *
 * Paths tested per kind:
 *   1. Namespace sugar: FunctionItem.Config
 *   2. Generic accessor: ConfigFor<TSKindId.FunctionItem>
 *   3. Direct map index: NamespaceMap[TSKindId.FunctionItem]['Config']
 *
 * If the three diverge, NamespaceMap is broken. This is a type-level
 * test — tsc --noEmit failure IS the failure. The runtime body is empty.
 */

import { describe, it } from 'vitest';
import { buildFunctionItem } from '../src/factories/raw.ts';
import { TSKindId } from '../src/index.ts';
import type {
	FunctionItem,
	ParametersElements,
	ConfigFor,
	BuiltFor,
	LooseFor,
	LooseConfigFor,
	TreeFor,
	NamespaceMap,
	AttributeItem,
	DeclarationList,
	ExpressionStatement,
	Identifier
} from '../src/index.ts';
import type { buildParametersElements } from '../src/factories/raw.ts';

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

function expectTrue<_T extends true>(): void {}

describe('rust NamespaceMap access-path convergence', () => {
	it('three paths resolve to same Config type', () => {
		expectTrue<Equals<FunctionItem.Config, ConfigFor<TSKindId.FunctionItem>>>();
		expectTrue<Equals<ConfigFor<TSKindId.FunctionItem>, NamespaceMap[TSKindId.FunctionItem]['Config']>>();
		expectTrue<Equals<FunctionItem.Config, NamespaceMap[TSKindId.FunctionItem]['Config']>>();
	});

	it('Fluent / Loose / Tree / Kind each converge', () => {
		expectTrue<Equals<FunctionItem.Built, BuiltFor<TSKindId.FunctionItem>>>();
		expectTrue<Equals<FunctionItem.Loose, LooseFor<TSKindId.FunctionItem>>>();
		expectTrue<Equals<FunctionItem.Tree, TreeFor<TSKindId.FunctionItem>>>();
		expectTrue<Equals<FunctionItem.Kind, 'function_item'>>();
	});

	it('Fluent is the factory-emitted Built alias for factory-backed kinds', () => {
		// Every Fluent access path resolves to the factory's EXACT return
		// type — not a re-derived generic projection.
		expectTrue<Equals<FunctionItem.Built, ReturnType<typeof buildFunctionItem>>>();
		expectTrue<Equals<BuiltFor<TSKindId.FunctionItem>, ReturnType<typeof buildFunctionItem>>>();
		expectTrue<Equals<NamespaceMap[TSKindId.FunctionItem]['Built'], ReturnType<typeof buildFunctionItem>>>();
	});


	// The pre-008 `FunctionItemConfig` / `LooseFunctionItem` flat aliases
	// are no longer emitted (spec 008 US7 landing). Consumers use namespace
	// sugar (`FunctionItem.Config`, `FunctionItem.Loose`) or the generic
	// accessors (`ConfigFor<TSKindId.FunctionItem>`, `LooseFor<TSKindId.FunctionItem>`).
	// `FunctionItemTree` INTERFACE is still emitted — factories use it for
	// `replace(target: T.FunctionItemTree)` signatures.

	it("BuildArgs is the builder's own parameter list, and Config is its first element", () => {
		// ARITY comes from the factory, CONTENT from the interface: the alias
		// element REFERENCES `Config`, so the dependency runs one way only.
		expectTrue<Equals<FunctionItem.Config, FunctionItem.BuildArgs[0]>>();
		expectTrue<Equals<FunctionItem.BuildArgs, FunctionItem.BuildArgs>>();
		expectTrue<Equals<FunctionItem.LooseArgs, FunctionItem.LooseArgs>>();
		expectTrue<Equals<FunctionItem.Loose, FunctionItem.LooseArgs[0]>>();
	});

	it('BuildArgs is NOT Parameters<typeof build...> on an overloaded kind', () => {
		// `Parameters<>` resolves to the LAST overload — here the
		// options-leading form of a separated list, which is not the
		// canonical call shape. A regression to `Parameters<>` must fail the
		// type gate rather than silently retype the public surface.
		expectTrue<Equals<Equals<ParametersElements.BuildArgs, Parameters<typeof buildParametersElements>>, false>>();
		expectTrue<Equals<ParametersElements.BuildArgs, ParametersElements.BuildArgs>>();
	});

	it('LooseArgs widens every parameter, on every factory shape', () => {
		// One kind per calling convention. A `LooseArgs` that still named the
		// STRICT element type would make these equal — which is exactly how
		// the widening went missing on four of the six shapes while the
		// config-shaped pins stayed green.
		// single-field
		expectTrue<Equals<Equals<AttributeItem.BuildArgs, AttributeItem.LooseArgs>, false>>();
		// container-single
		expectTrue<Equals<Equals<ExpressionStatement.BuildArgs, ExpressionStatement.LooseArgs>, false>>();
		// container-multiple
		expectTrue<Equals<Equals<DeclarationList.BuildArgs, DeclarationList.LooseArgs>, false>>();
		// separated list
		expectTrue<Equals<Equals<ParametersElements.BuildArgs, ParametersElements.LooseArgs>, false>>();
		// leaf — a free-text leaf, where the parameter IS the raw text and the
		// two genuinely coincide. Pinned so that stays a DECISION rather than
		// drifting back into the missing-widening it looks identical to.
		expectTrue<Equals<Identifier.BuildArgs, Identifier.LooseArgs>>();
	});

	it('BuildArgs stays a MUTABLE tuple whose element is Config', () => {
		// Comparability across kinds depends on the tuple being mutable; a
		// readonly alias would not be assignable to a factory-carrying kind's.
		expectTrue<Equals<FunctionItem.BuildArgs, [FunctionItem.Config]>>();
	});

	it('Loose decomposes into LooseConfig plus the NodeData passthrough', () => {
		// `LooseConfig` is the config arm named at the source rather than
		// recovered downstream as `Exclude<Loose, T>`. This pin is what makes
		// the split provably semantics-free: `Loose` still admits exactly what
		// it admitted before, so the passthrough arm is untouched.
		expectTrue<Equals<FunctionItem.Loose, FunctionItem.LooseConfig | FunctionItem>>();
		expectTrue<Equals<FunctionItem.LooseConfig, LooseConfigFor<TSKindId.FunctionItem>>>();
	});
});
