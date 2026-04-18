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
    ConfigFor,
    FluentFor,
    LooseFor,
    TreeFor,
    NamespaceMap,
} from '../src/index.ts';

type Equals<A, B> =
    (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

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

    // The pre-008 `FunctionItemConfig` / `LooseFunctionItem` flat aliases
    // are no longer emitted (spec 008 US7 landing). Consumers use namespace
    // sugar (`FunctionItem.Config`, `FunctionItem.Loose`) or the generic
    // accessors (`ConfigFor<'function_item'>`, `LooseFor<'function_item'>`).
    // `FunctionItemTree` INTERFACE is still emitted — factories use it for
    // `replace(target: T.FunctionItemTree)` signatures.
});
