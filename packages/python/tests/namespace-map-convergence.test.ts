/**
 * Type-level convergence assertion for @sittir/python (spec 008 SC-010).
 */

import { describe, it } from 'vitest';
import type {
	FunctionDefinition,
	Module,
	Suite,
	ConfigFor,
	FluentFor,
	LooseFor,
	TreeFor,
	NamespaceMap
} from '../src/index.ts';
import type { FunctionDefinitionBuilt } from '../src/factories.ts';
import type { FluentNodeOf } from '@sittir/types';

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

function expectTrue<_T extends true>(): void {}

describe('python NamespaceMap access-path convergence', () => {
	it('FunctionDefinition three-path convergence', () => {
		expectTrue<Equals<FunctionDefinition.Config, ConfigFor<'function_definition'>>>();
		expectTrue<Equals<ConfigFor<'function_definition'>, NamespaceMap['function_definition']['Config']>>();
		expectTrue<Equals<FunctionDefinition.Config, NamespaceMap['function_definition']['Config']>>();
	});

	it('Fluent / Loose / Tree / Kind each converge', () => {
		expectTrue<Equals<FunctionDefinition.Fluent, FluentFor<'function_definition'>>>();
		expectTrue<Equals<FunctionDefinition.Loose, LooseFor<'function_definition'>>>();
		expectTrue<Equals<FunctionDefinition.Tree, TreeFor<'function_definition'>>>();
		expectTrue<Equals<FunctionDefinition.Kind, 'function_definition'>>();
	});

	it('Module (root kind) converges', () => {
		expectTrue<Equals<Module.Config, ConfigFor<'module'>>>();
		expectTrue<Equals<Module.Tree, NamespaceMap['module']['Tree']>>();
	});

	it('Fluent is the factory-emitted Built alias for factory-backed kinds', () => {
		// Every Fluent access path resolves to the factory's EXACT return
		// type — not a re-derived generic projection.
		expectTrue<Equals<FunctionDefinition.Fluent, FunctionDefinitionBuilt>>();
		expectTrue<Equals<FluentFor<'function_definition'>, FunctionDefinitionBuilt>>();
		expectTrue<Equals<NamespaceMap['function_definition']['Fluent'], FunctionDefinitionBuilt>>();
	});

	it('factory-less kinds keep the FluentNodeOf fallback', () => {
		// suite has no emitted factory (no Built alias exists), so NodeNs'
		// default Fluent projection remains in effect.
		expectTrue<Equals<Suite.Fluent, FluentNodeOf<Suite>>>();
	});
});
