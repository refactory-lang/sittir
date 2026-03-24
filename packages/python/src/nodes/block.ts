import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssertStatement, Block, BreakStatement, CaseClause, ClassDefinition, ContinueStatement, DecoratedDefinition, DeleteStatement, ExecStatement, ExpressionStatement, ForStatement, FunctionDefinition, FutureImportStatement, GlobalStatement, IfStatement, ImportFromStatement, ImportStatement, MatchStatement, NonlocalStatement, PassStatement, PrintStatement, RaiseStatement, ReturnStatement, TryStatement, TypeAliasStatement, WhileStatement, WithStatement } from '../types.js';
import { case_clause } from './case-clause.js';
import type { CaseClauseOptions } from './case-clause.js';
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


class BlockBuilder extends Builder<Block> {
  private _alternative: Builder<CaseClause>[] = [];
  private _children: Builder<FutureImportStatement | ImportStatement | ImportFromStatement | PrintStatement | AssertStatement | ExpressionStatement | ReturnStatement | DeleteStatement | RaiseStatement | PassStatement | BreakStatement | ContinueStatement | GlobalStatement | NonlocalStatement | ExecStatement | TypeAliasStatement | IfStatement | ForStatement | WhileStatement | TryStatement | WithStatement | FunctionDefinition | ClassDefinition | DecoratedDefinition | MatchStatement>[] = [];

  constructor() { super(); }

  alternative(...value: Builder<CaseClause>[]): this {
    this._alternative = value;
    return this;
  }

  children(...value: Builder<FutureImportStatement | ImportStatement | ImportFromStatement | PrintStatement | AssertStatement | ExpressionStatement | ReturnStatement | DeleteStatement | RaiseStatement | PassStatement | BreakStatement | ContinueStatement | GlobalStatement | NonlocalStatement | ExecStatement | TypeAliasStatement | IfStatement | ForStatement | WhileStatement | TryStatement | WithStatement | FunctionDefinition | ClassDefinition | DecoratedDefinition | MatchStatement>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._alternative.length > 0) parts.push(this.renderChildren(this._alternative, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Block {
    return {
      kind: 'block',
      alternative: this._alternative.map(c => c.build(ctx)),
      children: this._children.map(c => c.build(ctx)),
    } as Block;
  }

  override get nodeKind(): 'block' { return 'block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    for (const child of this._alternative) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'alternative' });
    }
    return parts;
  }
}

export type { BlockBuilder };

export function block(): BlockBuilder {
  return new BlockBuilder();
}

export interface BlockOptions {
  nodeKind: 'block';
  alternative?: Builder<CaseClause> | Omit<CaseClauseOptions, 'nodeKind'> | (Builder<CaseClause> | Omit<CaseClauseOptions, 'nodeKind'>)[];
  children?: Builder<FutureImportStatement | ImportStatement | ImportFromStatement | PrintStatement | AssertStatement | ExpressionStatement | ReturnStatement | DeleteStatement | RaiseStatement | PassStatement | BreakStatement | ContinueStatement | GlobalStatement | NonlocalStatement | ExecStatement | TypeAliasStatement | IfStatement | ForStatement | WhileStatement | TryStatement | WithStatement | FunctionDefinition | ClassDefinition | DecoratedDefinition | MatchStatement> | FutureImportStatementOptions | ImportStatementOptions | ImportFromStatementOptions | PrintStatementOptions | AssertStatementOptions | ExpressionStatementOptions | ReturnStatementOptions | DeleteStatementOptions | RaiseStatementOptions | GlobalStatementOptions | NonlocalStatementOptions | ExecStatementOptions | TypeAliasStatementOptions | IfStatementOptions | ForStatementOptions | WhileStatementOptions | TryStatementOptions | WithStatementOptions | FunctionDefinitionOptions | ClassDefinitionOptions | DecoratedDefinitionOptions | MatchStatementOptions | (Builder<FutureImportStatement | ImportStatement | ImportFromStatement | PrintStatement | AssertStatement | ExpressionStatement | ReturnStatement | DeleteStatement | RaiseStatement | PassStatement | BreakStatement | ContinueStatement | GlobalStatement | NonlocalStatement | ExecStatement | TypeAliasStatement | IfStatement | ForStatement | WhileStatement | TryStatement | WithStatement | FunctionDefinition | ClassDefinition | DecoratedDefinition | MatchStatement> | FutureImportStatementOptions | ImportStatementOptions | ImportFromStatementOptions | PrintStatementOptions | AssertStatementOptions | ExpressionStatementOptions | ReturnStatementOptions | DeleteStatementOptions | RaiseStatementOptions | GlobalStatementOptions | NonlocalStatementOptions | ExecStatementOptions | TypeAliasStatementOptions | IfStatementOptions | ForStatementOptions | WhileStatementOptions | TryStatementOptions | WithStatementOptions | FunctionDefinitionOptions | ClassDefinitionOptions | DecoratedDefinitionOptions | MatchStatementOptions)[];
}

export namespace block {
  export function from(options: Omit<BlockOptions, 'nodeKind'>): BlockBuilder {
    const b = new BlockBuilder();
    if (options.alternative !== undefined) {
      const _v = options.alternative;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.alternative(..._arr.map(_v => _v instanceof Builder ? _v : case_clause.from(_v)));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'future_import_statement': return future_import_statement.from(_v);   case 'import_statement': return import_statement.from(_v);   case 'import_from_statement': return import_from_statement.from(_v);   case 'print_statement': return print_statement.from(_v);   case 'assert_statement': return assert_statement.from(_v);   case 'expression_statement': return expression_statement.from(_v);   case 'return_statement': return return_statement.from(_v);   case 'delete_statement': return delete_statement.from(_v);   case 'raise_statement': return raise_statement.from(_v);   case 'global_statement': return global_statement.from(_v);   case 'nonlocal_statement': return nonlocal_statement.from(_v);   case 'exec_statement': return exec_statement.from(_v);   case 'type_alias_statement': return type_alias_statement.from(_v);   case 'if_statement': return if_statement.from(_v);   case 'for_statement': return for_statement.from(_v);   case 'while_statement': return while_statement.from(_v);   case 'try_statement': return try_statement.from(_v);   case 'with_statement': return with_statement.from(_v);   case 'function_definition': return function_definition.from(_v);   case 'class_definition': return class_definition.from(_v);   case 'decorated_definition': return decorated_definition.from(_v);   case 'match_statement': return match_statement.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
