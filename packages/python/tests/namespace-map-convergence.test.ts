/**
 * Type-level convergence assertion for @sittir/python (spec 008 SC-010).
 */

import { describe, it } from 'vitest';
import { TSKindId } from '../src/index.ts';
import type {
	FunctionDefinition,
	Module,
	Suite,
	SimpleStatementsElements,
	ConfigFor,
	FluentFor,
	LooseFor,
	LooseConfigFor,
	TreeFor,
	NamespaceMap
} from '../src/index.ts';
import type {
	FunctionDefinitionBuilt,
	FunctionDefinitionBuildArgs,
	FunctionDefinitionLooseArgs,
	SimpleStatementsElementsBuildArgs,
	SimpleStatementsElementsLooseArgs,
	PassStatementBuildArgs,
	PassStatementLooseArgs,
	ChevronBuildArgs,
	ChevronLooseArgs,
	SimpleStatementsBuildArgs,
	SimpleStatementsLooseArgs,
	ModuleBuildArgs,
	ModuleLooseArgs,
	buildSimpleStatementsElements
} from '../src/factories/raw.ts';

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

function expectTrue<_T extends true>(): void {}

describe('python NamespaceMap access-path convergence', () => {
	it('FunctionDefinition three-path convergence', () => {
		expectTrue<Equals<FunctionDefinition.Config, ConfigFor<TSKindId.FunctionDefinition>>>();
		expectTrue<Equals<ConfigFor<TSKindId.FunctionDefinition>, NamespaceMap[TSKindId.FunctionDefinition]['Config']>>();
		expectTrue<Equals<FunctionDefinition.Config, NamespaceMap[TSKindId.FunctionDefinition]['Config']>>();
	});

	it('Fluent / Loose / Tree / Kind each converge', () => {
		expectTrue<Equals<FunctionDefinition.Fluent, FluentFor<TSKindId.FunctionDefinition>>>();
		expectTrue<Equals<FunctionDefinition.Loose, LooseFor<TSKindId.FunctionDefinition>>>();
		expectTrue<Equals<FunctionDefinition.Tree, TreeFor<TSKindId.FunctionDefinition>>>();
		expectTrue<Equals<FunctionDefinition.Kind, 'function_definition'>>();
	});

	it('Module (root kind) converges', () => {
		expectTrue<Equals<Module.Config, ConfigFor<TSKindId.Module>>>();
		expectTrue<Equals<Module.Tree, NamespaceMap[TSKindId.Module]['Tree']>>();
	});

	it('Fluent is the factory-emitted Built alias for factory-backed kinds', () => {
		// Every Fluent access path resolves to the factory's EXACT return
		// type — not a re-derived generic projection.
		expectTrue<Equals<FunctionDefinition.Fluent, FunctionDefinitionBuilt>>();
		expectTrue<Equals<FluentFor<TSKindId.FunctionDefinition>, FunctionDefinitionBuilt>>();
		expectTrue<Equals<NamespaceMap[TSKindId.FunctionDefinition]['Fluent'], FunctionDefinitionBuilt>>();
	});

	it('a kind the parser issues no id for takes NO namespace entry', () => {
		// `NamespaceMap` is keyed by the kind id. This kind is synthesized on
		// the sittir side — no parser symbol, built by no factory — so it has
		// no id and therefore no entry, and the per-kind family has no meaning
		// for it. Its data interface still stands, which is what reading one
		// out of a tree needs.
		expectTrue<Equals<Suite['$type'] extends keyof NamespaceMap ? true : false, false>>();
		expectTrue<Equals<Suite['$type'], '_suite'>>();
	});

	it("BuildArgs is the builder's own parameter list, and Config is its first element", () => {
		// ARITY comes from the factory, CONTENT from the interface: the alias
		// element REFERENCES `Config`, so the dependency runs one way only.
		expectTrue<Equals<FunctionDefinition.Config, FunctionDefinitionBuildArgs[0]>>();
		expectTrue<Equals<FunctionDefinition.BuildArgs, FunctionDefinitionBuildArgs>>();
		expectTrue<Equals<FunctionDefinition.LooseArgs, FunctionDefinitionLooseArgs>>();
		expectTrue<Equals<FunctionDefinition.Loose, FunctionDefinitionLooseArgs[0]>>();
	});

	it('BuildArgs is NOT Parameters<typeof build...> on an overloaded kind', () => {
		// `Parameters<>` resolves to the LAST overload — here the
		// options-leading form of a separated list, which is not the
		// canonical call shape. A regression to `Parameters<>` must fail the
		// type gate rather than silently retype the public surface.
		expectTrue<
			Equals<Equals<SimpleStatementsElementsBuildArgs, Parameters<typeof buildSimpleStatementsElements>>, false>
		>();
		expectTrue<Equals<SimpleStatementsElements.BuildArgs, SimpleStatementsElementsBuildArgs>>();
	});

	it('LooseArgs widens every parameter, on every factory shape', () => {
		// One kind per calling convention. A `LooseArgs` that still named the
		// STRICT element type would make these equal — which is exactly how
		// the widening went missing on four of the six shapes while the
		// config-shaped pins stayed green.
		// single-field
		expectTrue<Equals<Equals<ChevronBuildArgs, ChevronLooseArgs>, false>>();
		// container-single
		expectTrue<Equals<Equals<SimpleStatementsBuildArgs, SimpleStatementsLooseArgs>, false>>();
		// container-multiple
		expectTrue<Equals<Equals<ModuleBuildArgs, ModuleLooseArgs>, false>>();
		// separated list
		expectTrue<Equals<Equals<SimpleStatementsElementsBuildArgs, SimpleStatementsElementsLooseArgs>, false>>();
		// leaf — a parameterless keyword leaf, where the parameter IS the raw text and the
		// two genuinely coincide. Pinned so that stays a DECISION rather than
		// drifting back into the missing-widening it looks identical to.
		expectTrue<Equals<PassStatementBuildArgs, PassStatementLooseArgs>>();
	});

	it('BuildArgs stays a MUTABLE tuple whose element is Config', () => {
		// Comparability across kinds depends on the tuple being mutable.
		expectTrue<Equals<FunctionDefinition.BuildArgs, [FunctionDefinition.Config]>>();
	});

	it('Loose decomposes into LooseConfig plus the NodeData passthrough', () => {
		// `LooseConfig` is the config arm named at the source rather than
		// recovered downstream as `Exclude<Loose, T>`. This pin is what makes
		// the split provably semantics-free: `Loose` still admits exactly what
		// it admitted before, so the passthrough arm is untouched.
		expectTrue<Equals<FunctionDefinition.Loose, FunctionDefinition.LooseConfig | FunctionDefinition>>();
		expectTrue<Equals<FunctionDefinition.LooseConfig, LooseConfigFor<TSKindId.FunctionDefinition>>>();
	});
});
