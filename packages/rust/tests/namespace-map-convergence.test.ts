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
import type { FunctionItem, Comment, ConfigFor, FluentFor, LooseFor, TreeFor, NamespaceMap } from '../src/index.ts';
import type { FunctionItemBuilt } from '../src/factories.ts';
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
});
