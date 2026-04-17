/**
 * Type-level convergence assertion for @sittir/python (spec 008 SC-010).
 */

import { describe, it } from 'vitest';
import type {
    FunctionDefinition,
    Module,
    ConfigFor,
    FluentFor,
    LooseFor,
    TreeFor,
    NamespaceMap,
} from '../src/index.ts';

type Equals<A, B> =
    (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

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
});
