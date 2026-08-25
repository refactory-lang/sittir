/**
 * Type-level convergence assertion for @sittir/typescript (spec 008 SC-010).
 * See the rust package's version for the rationale.
 */

import { describe, it } from 'vitest';
import type {
	ClassDeclaration,
	Program,
	JsxElement,
	FormalParametersElements,
	ConfigFor,
	FluentFor,
	LooseFor,
	TreeFor,
	NamespaceMap
} from '../src/index.ts';
import type {
	ProgramBuilt,
	ClassDeclarationBuildArgs,
	ClassDeclarationLooseArgs,
	FormalParametersElementsBuildArgs,
	FormalParametersElementsLooseArgs,
	NamespaceImportBuildArgs,
	NamespaceImportLooseArgs,
	NamespaceExportBuildArgs,
	NamespaceExportLooseArgs,
	SwitchBodyBuildArgs,
	SwitchBodyLooseArgs,
	buildFormalParametersElements
} from '../src/factories.ts';
import type { FluentNodeOf } from '@sittir/types';

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

function expectTrue<_T extends true>(): void {}

describe('typescript NamespaceMap access-path convergence', () => {
	it('ClassDeclaration three-path convergence', () => {
		expectTrue<Equals<ClassDeclaration.Config, ConfigFor<'class_declaration'>>>();
		expectTrue<Equals<ConfigFor<'class_declaration'>, NamespaceMap['class_declaration']['Config']>>();
		expectTrue<Equals<ClassDeclaration.Config, NamespaceMap['class_declaration']['Config']>>();
	});

	it('Fluent / Loose / Tree / Kind each converge', () => {
		expectTrue<Equals<ClassDeclaration.Fluent, FluentFor<'class_declaration'>>>();
		expectTrue<Equals<ClassDeclaration.Loose, LooseFor<'class_declaration'>>>();
		expectTrue<Equals<ClassDeclaration.Tree, TreeFor<'class_declaration'>>>();
		expectTrue<Equals<ClassDeclaration.Kind, 'class_declaration'>>();
	});

	it('Program (root kind) converges', () => {
		expectTrue<Equals<Program.Config, ConfigFor<'program'>>>();
		expectTrue<Equals<Program.Tree, NamespaceMap['program']['Tree']>>();
	});

	it('Fluent is the factory-emitted Built alias for factory-backed kinds', () => {
		// Every Fluent access path resolves to the factory's EXACT return
		// type (`$with` setter record, `$`-prefixed methods, named
		// self-reference) — not a re-derived generic projection.
		expectTrue<Equals<Program.Fluent, ProgramBuilt>>();
		expectTrue<Equals<FluentFor<'program'>, ProgramBuilt>>();
		expectTrue<Equals<NamespaceMap['program']['Fluent'], ProgramBuilt>>();
	});

	it('factory-less kinds keep the FluentNodeOf fallback', () => {
		// jsx_element has no emitted factory (no Built alias exists), so
		// NodeNs' default Fluent projection remains in effect.
		expectTrue<Equals<JsxElement.Fluent, FluentNodeOf<JsxElement>>>();
	});

	it("BuildArgs is the builder's own parameter list, and Config is its first element", () => {
		// ARITY comes from the factory, CONTENT from the interface: the alias
		// element REFERENCES `Config`, so the dependency runs one way only.
		expectTrue<Equals<ClassDeclaration.Config, ClassDeclarationBuildArgs[0]>>();
		expectTrue<Equals<ClassDeclaration.BuildArgs, ClassDeclarationBuildArgs>>();
		expectTrue<Equals<ClassDeclaration.LooseArgs, ClassDeclarationLooseArgs>>();
		expectTrue<Equals<ClassDeclaration.Loose, ClassDeclarationLooseArgs[0]>>();
	});

	it('BuildArgs is NOT Parameters<typeof build...> on an overloaded kind', () => {
		// `Parameters<>` resolves to the LAST overload — here the
		// options-leading form of a separated list, which is not the
		// canonical call shape. A regression to `Parameters<>` must fail the
		// type gate rather than silently retype the public surface.
		expectTrue<
			Equals<Equals<FormalParametersElementsBuildArgs, Parameters<typeof buildFormalParametersElements>>, false>
		>();
		expectTrue<Equals<FormalParametersElements.BuildArgs, FormalParametersElementsBuildArgs>>();
	});

	it('LooseArgs widens every parameter, on every factory shape', () => {
		// One kind per calling convention. A `LooseArgs` that still named the
		// STRICT element type would make these equal — which is exactly how
		// the widening went missing on four of the six shapes while the
		// config-shaped pins stayed green.
		// single-field
		expectTrue<Equals<Equals<NamespaceImportBuildArgs, NamespaceImportLooseArgs>, false>>();
		// container-single
		expectTrue<Equals<Equals<NamespaceExportBuildArgs, NamespaceExportLooseArgs>, false>>();
		// container-multiple
		expectTrue<Equals<Equals<SwitchBodyBuildArgs, SwitchBodyLooseArgs>, false>>();
		// separated list
		expectTrue<Equals<Equals<FormalParametersElementsBuildArgs, FormalParametersElementsLooseArgs>, false>>();
	});

	it('a factory-less kind falls back to the NodeNs defaults', () => {
		// The defaults must be MUTABLE tuples like every emitted alias,
		// otherwise a factory-less kind's BuildArgs is not comparable with a
		// factory-carrying kind's.
		expectTrue<Equals<JsxElement.BuildArgs, [JsxElement.Config]>>();
		expectTrue<Equals<JsxElement.LooseArgs, [JsxElement.Loose]>>();
		expectTrue<Equals<ClassDeclaration.BuildArgs, [ClassDeclaration.Config]>>();
	});
});
