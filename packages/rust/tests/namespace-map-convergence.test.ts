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
    FunctionItemConfig,
    LooseFunctionItem,
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

    it('deprecated Config/Loose aliases still resolve to the same type', () => {
        // Config and Loose are pure type aliases — they round-trip to
        // the same computed type via either old or new access path.
        expectTrue<Equals<FunctionItem.Config, FunctionItemConfig>>();
        expectTrue<Equals<FunctionItem.Loose, LooseFunctionItem>>();

        // FunctionItemTree is NOT tested against FunctionItem.Tree for
        // strict equality. XTree is emitted as an interface that extends
        // the grammar-schema-based BaseTreeNode<Grammar, K>; FunctionItem.Tree
        // is TreeNodeOf<T> (data-interface-based). The two happen to be
        // structurally isomorphic for most kinds but aren't Equals-equal.
        // Consumers migrating from XTree to X.Tree should note that the
        // two aren't literally the same type — the old form walks the
        // grammar schema, the new form walks the data interface.
    });
});
