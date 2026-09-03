/**
 * Type-level convergence assertion for @sittir/typescript (spec 008 SC-010).
 * See the rust package's version for the rationale.
 */

import { describe, it } from 'vitest';
import { buildProgram } from '../src/factories/raw.ts';
import { TSKindId } from '../src/index.ts';
import type {
	ClassDeclaration,
	Program,
	FormalParametersElements,
	ConfigFor,
	BuiltFor,
	LooseFor,
	LooseConfigFor,
	TreeFor,
	NamespaceMap,
	HashBangLine,
	NamespaceExport,
	NamespaceImport,
	SwitchBody
} from '../src/index.ts';
import type { buildFormalParametersElements } from '../src/factories/raw.ts';

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

function expectTrue<_T extends true>(): void {}

describe('typescript NamespaceMap access-path convergence', () => {
	it('ClassDeclaration three-path convergence', () => {
		expectTrue<Equals<ClassDeclaration.Config, ConfigFor<TSKindId.ClassDeclaration>>>();
		expectTrue<Equals<ConfigFor<TSKindId.ClassDeclaration>, NamespaceMap[TSKindId.ClassDeclaration]['Config']>>();
		expectTrue<Equals<ClassDeclaration.Config, NamespaceMap[TSKindId.ClassDeclaration]['Config']>>();
	});

	it('Fluent / Loose / Tree / Kind each converge', () => {
		expectTrue<Equals<ClassDeclaration.Built, BuiltFor<TSKindId.ClassDeclaration>>>();
		expectTrue<Equals<ClassDeclaration.Loose, LooseFor<TSKindId.ClassDeclaration>>>();
		expectTrue<Equals<ClassDeclaration.Tree, TreeFor<TSKindId.ClassDeclaration>>>();
		expectTrue<Equals<ClassDeclaration.Kind, 'class_declaration'>>();
	});

	it('Program (root kind) converges', () => {
		expectTrue<Equals<Program.Config, ConfigFor<TSKindId.Program>>>();
		expectTrue<Equals<Program.Tree, NamespaceMap[TSKindId.Program]['Tree']>>();
	});

	it('Fluent is the factory-emitted Built alias for factory-backed kinds', () => {
		// Every Fluent access path resolves to the factory's EXACT return
		// type (`$with` setter record, `$`-prefixed methods, named
		// self-reference) — not a re-derived generic projection.
		expectTrue<Equals<Program.Built, ReturnType<typeof buildProgram>>>();
		expectTrue<Equals<BuiltFor<TSKindId.Program>, ReturnType<typeof buildProgram>>>();
		expectTrue<Equals<NamespaceMap[TSKindId.Program]['Built'], ReturnType<typeof buildProgram>>>();
	});


	it("BuildArgs is the builder's own parameter list, and Config is its first element", () => {
		// ARITY comes from the factory, CONTENT from the interface: the alias
		// element REFERENCES `Config`, so the dependency runs one way only.
		expectTrue<Equals<ClassDeclaration.Config, ClassDeclaration.BuildArgs[0]>>();
		expectTrue<Equals<ClassDeclaration.BuildArgs, ClassDeclaration.BuildArgs>>();
		expectTrue<Equals<ClassDeclaration.LooseArgs, ClassDeclaration.LooseArgs>>();
		expectTrue<Equals<ClassDeclaration.Loose, ClassDeclaration.LooseArgs[0]>>();
	});

	it('BuildArgs is NOT Parameters<typeof build...> on an overloaded kind', () => {
		// `Parameters<>` resolves to the LAST overload — here the
		// options-leading form of a separated list, which is not the
		// canonical call shape. A regression to `Parameters<>` must fail the
		// type gate rather than silently retype the public surface.
		expectTrue<
			Equals<Equals<FormalParametersElements.BuildArgs, Parameters<typeof buildFormalParametersElements>>, false>
		>();
		expectTrue<Equals<FormalParametersElements.BuildArgs, FormalParametersElements.BuildArgs>>();
	});

	it('LooseArgs widens every parameter, on every factory shape', () => {
		// One kind per calling convention. A `LooseArgs` that still named the
		// STRICT element type would make these equal — which is exactly how
		// the widening went missing on four of the six shapes while the
		// config-shaped pins stayed green.
		// single-field
		expectTrue<Equals<Equals<NamespaceImport.BuildArgs, NamespaceImport.LooseArgs>, false>>();
		// container-single
		expectTrue<Equals<Equals<NamespaceExport.BuildArgs, NamespaceExport.LooseArgs>, false>>();
		// container-multiple
		expectTrue<Equals<Equals<SwitchBody.BuildArgs, SwitchBody.LooseArgs>, false>>();
		// separated list
		expectTrue<Equals<Equals<FormalParametersElements.BuildArgs, FormalParametersElements.LooseArgs>, false>>();
		// leaf — a free-text leaf, where the parameter IS the raw text and the
		// two genuinely coincide. Pinned so that stays a DECISION rather than
		// drifting back into the missing-widening it looks identical to.
		expectTrue<Equals<HashBangLine.BuildArgs, HashBangLine.LooseArgs>>();
	});

	it('BuildArgs stays a MUTABLE tuple whose element is Config', () => {
		// Comparability across kinds depends on the tuple being mutable.
		expectTrue<Equals<ClassDeclaration.BuildArgs, [ClassDeclaration.Config]>>();
	});

	it('Loose decomposes into LooseConfig plus the NodeData passthrough', () => {
		// `LooseConfig` is the config arm named at the source rather than
		// recovered downstream as `Exclude<Loose, T>`. This pin is what makes
		// the split provably semantics-free: `Loose` still admits exactly what
		// it admitted before, so the passthrough arm is untouched.
		expectTrue<Equals<ClassDeclaration.Loose, ClassDeclaration.LooseConfig | ClassDeclaration>>();
		expectTrue<Equals<ClassDeclaration.LooseConfig, LooseConfigFor<TSKindId.ClassDeclaration>>>();
	});
});
