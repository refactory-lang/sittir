import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssertStatement, BreakStatement, ClassDefinition, ContinueStatement, DecoratedDefinition, DeleteStatement, ExecStatement, ExpressionStatement, ForStatement, FunctionDefinition, FutureImportStatement, GlobalStatement, IfStatement, ImportFromStatement, ImportStatement, MatchStatement, Module, NonlocalStatement, PassStatement, PrintStatement, RaiseStatement, ReturnStatement, TryStatement, TypeAliasStatement, WhileStatement, WithStatement } from '../types.js';
import { future_import_statement } from './future-import-statement.js';
import type { FutureImportStatementOptions } from './future-import-statement.js';
import { import_statement } from './import-statement.js';
import type { ImportStatementOptions } from './import-statement.js';
import { import_from_statement } from './import-from-statement.js';
import type { ImportFromStatementOptions } from './import-from-statement.js';
import { print_statement } from './print-statement.js';
import type { PrintStatementOptions } from './print-statement.js';
import { assert_statement } from './assert-statement.js';
import type { AssertStatementOptions } from './assert-statement.js';
import { expression_statement } from './expression-statement.js';
import type { ExpressionStatementOptions } from './expression-statement.js';
import { return_statement } from './return-statement.js';
import type { ReturnStatementOptions } from './return-statement.js';
import { delete_statement } from './delete-statement.js';
import type { DeleteStatementOptions } from './delete-statement.js';
import { raise_statement } from './raise-statement.js';
import type { RaiseStatementOptions } from './raise-statement.js';
import { global_statement } from './global-statement.js';
import type { GlobalStatementOptions } from './global-statement.js';
import { nonlocal_statement } from './nonlocal-statement.js';
import type { NonlocalStatementOptions } from './nonlocal-statement.js';
import { exec_statement } from './exec-statement.js';
import type { ExecStatementOptions } from './exec-statement.js';
import { type_alias_statement } from './type-alias-statement.js';
import type { TypeAliasStatementOptions } from './type-alias-statement.js';
import { if_statement } from './if-statement.js';
import type { IfStatementOptions } from './if-statement.js';
import { for_statement } from './for-statement.js';
import type { ForStatementOptions } from './for-statement.js';
import { while_statement } from './while-statement.js';
import type { WhileStatementOptions } from './while-statement.js';
import { try_statement } from './try-statement.js';
import type { TryStatementOptions } from './try-statement.js';
import { with_statement } from './with-statement.js';
import type { WithStatementOptions } from './with-statement.js';
import { function_definition } from './function-definition.js';
import type { FunctionDefinitionOptions } from './function-definition.js';
import { class_definition } from './class-definition.js';
import type { ClassDefinitionOptions } from './class-definition.js';
import { decorated_definition } from './decorated-definition.js';
import type { DecoratedDefinitionOptions } from './decorated-definition.js';
import { match_statement } from './match-statement.js';
import type { MatchStatementOptions } from './match-statement.js';


class ModuleBuilder extends Builder<Module> {
  private _children: Builder<FutureImportStatement | ImportStatement | ImportFromStatement | PrintStatement | AssertStatement | ExpressionStatement | ReturnStatement | DeleteStatement | RaiseStatement | PassStatement | BreakStatement | ContinueStatement | GlobalStatement | NonlocalStatement | ExecStatement | TypeAliasStatement | IfStatement | ForStatement | WhileStatement | TryStatement | WithStatement | FunctionDefinition | ClassDefinition | DecoratedDefinition | MatchStatement>[] = [];

  constructor() { super(); }

  children(...value: Builder<FutureImportStatement | ImportStatement | ImportFromStatement | PrintStatement | AssertStatement | ExpressionStatement | ReturnStatement | DeleteStatement | RaiseStatement | PassStatement | BreakStatement | ContinueStatement | GlobalStatement | NonlocalStatement | ExecStatement | TypeAliasStatement | IfStatement | ForStatement | WhileStatement | TryStatement | WithStatement | FunctionDefinition | ClassDefinition | DecoratedDefinition | MatchStatement>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Module {
    return {
      kind: 'module',
      children: this._children.map(c => c.build(ctx)),
    } as Module;
  }

  override get nodeKind(): 'module' { return 'module'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ModuleBuilder };

export function module(): ModuleBuilder {
  return new ModuleBuilder();
}

export interface ModuleOptions {
  nodeKind: 'module';
  children?: Builder<FutureImportStatement | ImportStatement | ImportFromStatement | PrintStatement | AssertStatement | ExpressionStatement | ReturnStatement | DeleteStatement | RaiseStatement | PassStatement | BreakStatement | ContinueStatement | GlobalStatement | NonlocalStatement | ExecStatement | TypeAliasStatement | IfStatement | ForStatement | WhileStatement | TryStatement | WithStatement | FunctionDefinition | ClassDefinition | DecoratedDefinition | MatchStatement> | FutureImportStatementOptions | ImportStatementOptions | ImportFromStatementOptions | PrintStatementOptions | AssertStatementOptions | ExpressionStatementOptions | ReturnStatementOptions | DeleteStatementOptions | RaiseStatementOptions | GlobalStatementOptions | NonlocalStatementOptions | ExecStatementOptions | TypeAliasStatementOptions | IfStatementOptions | ForStatementOptions | WhileStatementOptions | TryStatementOptions | WithStatementOptions | FunctionDefinitionOptions | ClassDefinitionOptions | DecoratedDefinitionOptions | MatchStatementOptions | (Builder<FutureImportStatement | ImportStatement | ImportFromStatement | PrintStatement | AssertStatement | ExpressionStatement | ReturnStatement | DeleteStatement | RaiseStatement | PassStatement | BreakStatement | ContinueStatement | GlobalStatement | NonlocalStatement | ExecStatement | TypeAliasStatement | IfStatement | ForStatement | WhileStatement | TryStatement | WithStatement | FunctionDefinition | ClassDefinition | DecoratedDefinition | MatchStatement> | FutureImportStatementOptions | ImportStatementOptions | ImportFromStatementOptions | PrintStatementOptions | AssertStatementOptions | ExpressionStatementOptions | ReturnStatementOptions | DeleteStatementOptions | RaiseStatementOptions | GlobalStatementOptions | NonlocalStatementOptions | ExecStatementOptions | TypeAliasStatementOptions | IfStatementOptions | ForStatementOptions | WhileStatementOptions | TryStatementOptions | WithStatementOptions | FunctionDefinitionOptions | ClassDefinitionOptions | DecoratedDefinitionOptions | MatchStatementOptions)[];
}

export namespace module {
  export function from(input: Omit<ModuleOptions, 'nodeKind'> | Builder<FutureImportStatement | ImportStatement | ImportFromStatement | PrintStatement | AssertStatement | ExpressionStatement | ReturnStatement | DeleteStatement | RaiseStatement | PassStatement | BreakStatement | ContinueStatement | GlobalStatement | NonlocalStatement | ExecStatement | TypeAliasStatement | IfStatement | ForStatement | WhileStatement | TryStatement | WithStatement | FunctionDefinition | ClassDefinition | DecoratedDefinition | MatchStatement> | FutureImportStatementOptions | ImportStatementOptions | ImportFromStatementOptions | PrintStatementOptions | AssertStatementOptions | ExpressionStatementOptions | ReturnStatementOptions | DeleteStatementOptions | RaiseStatementOptions | GlobalStatementOptions | NonlocalStatementOptions | ExecStatementOptions | TypeAliasStatementOptions | IfStatementOptions | ForStatementOptions | WhileStatementOptions | TryStatementOptions | WithStatementOptions | FunctionDefinitionOptions | ClassDefinitionOptions | DecoratedDefinitionOptions | MatchStatementOptions | (Builder<FutureImportStatement | ImportStatement | ImportFromStatement | PrintStatement | AssertStatement | ExpressionStatement | ReturnStatement | DeleteStatement | RaiseStatement | PassStatement | BreakStatement | ContinueStatement | GlobalStatement | NonlocalStatement | ExecStatement | TypeAliasStatement | IfStatement | ForStatement | WhileStatement | TryStatement | WithStatement | FunctionDefinition | ClassDefinition | DecoratedDefinition | MatchStatement> | FutureImportStatementOptions | ImportStatementOptions | ImportFromStatementOptions | PrintStatementOptions | AssertStatementOptions | ExpressionStatementOptions | ReturnStatementOptions | DeleteStatementOptions | RaiseStatementOptions | GlobalStatementOptions | NonlocalStatementOptions | ExecStatementOptions | TypeAliasStatementOptions | IfStatementOptions | ForStatementOptions | WhileStatementOptions | TryStatementOptions | WithStatementOptions | FunctionDefinitionOptions | ClassDefinitionOptions | DecoratedDefinitionOptions | MatchStatementOptions)[]): ModuleBuilder {
    const options: Omit<ModuleOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ModuleOptions, 'nodeKind'>
      : { children: input } as Omit<ModuleOptions, 'nodeKind'>;
    const b = new ModuleBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'future_import_statement': return future_import_statement.from(_v);   case 'import_statement': return import_statement.from(_v);   case 'import_from_statement': return import_from_statement.from(_v);   case 'print_statement': return print_statement.from(_v);   case 'assert_statement': return assert_statement.from(_v);   case 'expression_statement': return expression_statement.from(_v);   case 'return_statement': return return_statement.from(_v);   case 'delete_statement': return delete_statement.from(_v);   case 'raise_statement': return raise_statement.from(_v);   case 'global_statement': return global_statement.from(_v);   case 'nonlocal_statement': return nonlocal_statement.from(_v);   case 'exec_statement': return exec_statement.from(_v);   case 'type_alias_statement': return type_alias_statement.from(_v);   case 'if_statement': return if_statement.from(_v);   case 'for_statement': return for_statement.from(_v);   case 'while_statement': return while_statement.from(_v);   case 'try_statement': return try_statement.from(_v);   case 'with_statement': return with_statement.from(_v);   case 'function_definition': return function_definition.from(_v);   case 'class_definition': return class_definition.from(_v);   case 'decorated_definition': return decorated_definition.from(_v);   case 'match_statement': return match_statement.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
