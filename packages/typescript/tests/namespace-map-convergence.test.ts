/**
 * Type-level convergence assertion for @sittir/typescript (spec 008 SC-010).
 * See the rust package's version for the rationale.
 */

import { describe, it } from 'vitest';
import type {
	ClassDeclaration,
	Program,
	JsxElement,
	ConfigFor,
	FluentFor,
	LooseFor,
	TreeFor,
	NamespaceMap
} from '../src/index.ts';
import type { ProgramBuilt } from '../src/factories.ts';
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
});
