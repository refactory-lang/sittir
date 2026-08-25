/**
 * Type-level convergence assertion (spec 008 SC-010):
 * the three access paths into the rust grammar's type family all
 * resolve to the same concrete type.
 *
 * Paths tested per kind:
 *   1. Namespace sugar: FunctionItem.Config
 *   2. Generic accessor: ConfigFor<'function_item'>
 *   3. Direct map index: NamespaceMap['function_item']['Config']
 *
 * If the three diverge, NamespaceMap is broken. This is a type-level
 * test — tsc --noEmit failure IS the failure. The runtime body is empty.
 */

import { describe, it } from 'vitest';
import type {
	FunctionItem,
	Comment,
	ParametersElements,
	ConfigFor,
	FluentFor,
	LooseFor,
	TreeFor,
	NamespaceMap
} from '../src/index.ts';
import type {
	FunctionItemBuilt,
	FunctionItemBuildArgs,
	FunctionItemLooseArgs,
	ParametersElementsBuildArgs,
	ParametersElementsLooseArgs,
	AttributeItemBuildArgs,
	AttributeItemLooseArgs,
	ExpressionStatementBuildArgs,
	ExpressionStatementLooseArgs,
	DeclarationListBuildArgs,
	DeclarationListLooseArgs,
	buildParametersElements
} from '../src/factories.ts';
import type { FluentNodeOf } from '@sittir/types';

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

function expectTrue<_T extends true>(): void {}

describe('rust NamespaceMap access-path convergence', () => {
	it('three paths resolve to same Config type', () => {
		expectTrue<Equals<FunctionItem.Config, ConfigFor<'function_item'>>>();
		expectTrue<Equals<ConfigFor<'function_item'>, NamespaceMap['function_item']['Config']>>();
		expectTrue<Equals<FunctionItem.Config, NamespaceMap['function_item']['Config']>>();
	});

	it('Fluent / Loose / Tree / Kind each converge', () => {
		expectTrue<Equals<FunctionItem.Fluent, FluentFor<'function_item'>>>();
		expectTrue<Equals<FunctionItem.Loose, LooseFor<'function_item'>>>();
		expectTrue<Equals<FunctionItem.Tree, TreeFor<'function_item'>>>();
		expectTrue<Equals<FunctionItem.Kind, 'function_item'>>();
	});

	it('Fluent is the factory-emitted Built alias for factory-backed kinds', () => {
		// Every Fluent access path resolves to the factory's EXACT return
		// type — not a re-derived generic projection.
		expectTrue<Equals<FunctionItem.Fluent, FunctionItemBuilt>>();
		expectTrue<Equals<FluentFor<'function_item'>, FunctionItemBuilt>>();
		expectTrue<Equals<NamespaceMap['function_item']['Fluent'], FunctionItemBuilt>>();
	});

	it('factory-less kinds keep the FluentNodeOf fallback', () => {
		// comment has no emitted factory (no Built alias exists), so
		// NodeNs' default Fluent projection remains in effect.
		expectTrue<Equals<Comment.Fluent, FluentNodeOf<Comment>>>();
	});

	// The pre-008 `FunctionItemConfig` / `LooseFunctionItem` flat aliases
	// are no longer emitted (spec 008 US7 landing). Consumers use namespace
	// sugar (`FunctionItem.Config`, `FunctionItem.Loose`) or the generic
	// accessors (`ConfigFor<'function_item'>`, `LooseFor<'function_item'>`).
	// `FunctionItemTree` INTERFACE is still emitted — factories use it for
	// `replace(target: T.FunctionItemTree)` signatures.

	it("BuildArgs is the builder's own parameter list, and Config is its first element", () => {
		// ARITY comes from the factory, CONTENT from the interface: the alias
		// element REFERENCES `Config`, so the dependency runs one way only.
		expectTrue<Equals<FunctionItem.Config, FunctionItemBuildArgs[0]>>();
		expectTrue<Equals<FunctionItem.BuildArgs, FunctionItemBuildArgs>>();
		expectTrue<Equals<FunctionItem.LooseArgs, FunctionItemLooseArgs>>();
		expectTrue<Equals<FunctionItem.Loose, FunctionItemLooseArgs[0]>>();
	});

	it('BuildArgs is NOT Parameters<typeof build...> on an overloaded kind', () => {
		// `Parameters<>` resolves to the LAST overload — here the
		// options-leading form of a separated list, which is not the
		// canonical call shape. A regression to `Parameters<>` must fail the
		// type gate rather than silently retype the public surface.
		expectTrue<Equals<Equals<ParametersElementsBuildArgs, Parameters<typeof buildParametersElements>>, false>>();
		expectTrue<Equals<ParametersElements.BuildArgs, ParametersElementsBuildArgs>>();
	});

	it('LooseArgs widens every parameter, on every factory shape', () => {
		// One kind per calling convention. A `LooseArgs` that still named the
		// STRICT element type would make these equal — which is exactly how
		// the widening went missing on four of the six shapes while the
		// config-shaped pins stayed green.
		// single-field
		expectTrue<Equals<Equals<AttributeItemBuildArgs, AttributeItemLooseArgs>, false>>();
		// container-single
		expectTrue<Equals<Equals<ExpressionStatementBuildArgs, ExpressionStatementLooseArgs>, false>>();
		// container-multiple
		expectTrue<Equals<Equals<DeclarationListBuildArgs, DeclarationListLooseArgs>, false>>();
		// separated list
		expectTrue<Equals<Equals<ParametersElementsBuildArgs, ParametersElementsLooseArgs>, false>>();
	});

	it('a factory-less kind falls back to the NodeNs defaults', () => {
		// The defaults must be MUTABLE tuples like every emitted alias,
		// otherwise a factory-less kind's BuildArgs is not comparable with a
		// factory-carrying kind's.
		expectTrue<Equals<Comment.BuildArgs, [Comment.Config]>>();
		expectTrue<Equals<Comment.LooseArgs, [Comment.Loose]>>();
		expectTrue<Equals<FunctionItem.BuildArgs, [FunctionItem.Config]>>();
	});
});
