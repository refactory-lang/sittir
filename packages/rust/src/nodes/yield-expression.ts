import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayExpression, AssignmentExpression, AsyncBlock, AwaitExpression, BinaryExpression, Block, BooleanLiteral, BreakExpression, CallExpression, CharLiteral, ClosureExpression, CompoundAssignmentExpr, ConstBlock, ContinueExpression, FieldExpression, FloatLiteral, ForExpression, GenBlock, GenericFunction, Identifier, IfExpression, IndexExpression, IntegerLiteral, LoopExpression, MacroInvocation, MatchExpression, Metavariable, ParenthesizedExpression, RangeExpression, RawStringLiteral, ReferenceExpression, ReturnExpression, ScopedIdentifier, Self, StringLiteral, StructExpression, TryBlock, TryExpression, TupleExpression, TypeCastExpression, UnaryExpression, UnitExpression, UnsafeBlock, WhileExpression, YieldExpression } from '../types.js';
import { unary_expression } from './unary-expression.js';
import type { UnaryExpressionOptions } from './unary-expression.js';
import { reference_expression } from './reference-expression.js';
import type { ReferenceExpressionOptions } from './reference-expression.js';
import { try_expression } from './try-expression.js';
import type { TryExpressionOptions } from './try-expression.js';
import { binary_expression } from './binary-expression.js';
import type { BinaryExpressionOptions } from './binary-expression.js';
import { assignment_expression } from './assignment-expression.js';
import type { AssignmentExpressionOptions } from './assignment-expression.js';
import { compound_assignment_expr } from './compound-assignment-expr.js';
import type { CompoundAssignmentExprOptions } from './compound-assignment-expr.js';
import { type_cast_expression } from './type-cast-expression.js';
import type { TypeCastExpressionOptions } from './type-cast-expression.js';
import { call_expression } from './call-expression.js';
import type { CallExpressionOptions } from './call-expression.js';
import { return_expression } from './return-expression.js';
import type { ReturnExpressionOptions } from './return-expression.js';
import { string_literal } from './string-literal.js';
import type { StringLiteralOptions } from './string-literal.js';
import { raw_string_literal } from './raw-string-literal.js';
import type { RawStringLiteralOptions } from './raw-string-literal.js';
import { scoped_identifier } from './scoped-identifier.js';
import type { ScopedIdentifierOptions } from './scoped-identifier.js';
import { generic_function } from './generic-function.js';
import type { GenericFunctionOptions } from './generic-function.js';
import { await_expression } from './await-expression.js';
import type { AwaitExpressionOptions } from './await-expression.js';
import { field_expression } from './field-expression.js';
import type { FieldExpressionOptions } from './field-expression.js';
import { array_expression } from './array-expression.js';
import type { ArrayExpressionOptions } from './array-expression.js';
import { tuple_expression } from './tuple-expression.js';
import type { TupleExpressionOptions } from './tuple-expression.js';
import { macro_invocation } from './macro-invocation.js';
import type { MacroInvocationOptions } from './macro-invocation.js';
import { break_expression } from './break-expression.js';
import type { BreakExpressionOptions } from './break-expression.js';
import { continue_expression } from './continue-expression.js';
import type { ContinueExpressionOptions } from './continue-expression.js';
import { index_expression } from './index-expression.js';
import type { IndexExpressionOptions } from './index-expression.js';
import { closure_expression } from './closure-expression.js';
import type { ClosureExpressionOptions } from './closure-expression.js';
import { parenthesized_expression } from './parenthesized-expression.js';
import type { ParenthesizedExpressionOptions } from './parenthesized-expression.js';
import { struct_expression } from './struct-expression.js';
import type { StructExpressionOptions } from './struct-expression.js';
import { unsafe_block } from './unsafe-block.js';
import type { UnsafeBlockOptions } from './unsafe-block.js';
import { async_block } from './async-block.js';
import type { AsyncBlockOptions } from './async-block.js';
import { gen_block } from './gen-block.js';
import type { GenBlockOptions } from './gen-block.js';
import { try_block } from './try-block.js';
import type { TryBlockOptions } from './try-block.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';
import { if_expression } from './if-expression.js';
import type { IfExpressionOptions } from './if-expression.js';
import { match_expression } from './match-expression.js';
import type { MatchExpressionOptions } from './match-expression.js';
import { while_expression } from './while-expression.js';
import type { WhileExpressionOptions } from './while-expression.js';
import { loop_expression } from './loop-expression.js';
import type { LoopExpressionOptions } from './loop-expression.js';
import { for_expression } from './for-expression.js';
import type { ForExpressionOptions } from './for-expression.js';
import { const_block } from './const-block.js';
import type { ConstBlockOptions } from './const-block.js';
import { range_expression } from './range-expression.js';
import type { RangeExpressionOptions } from './range-expression.js';


class YieldExpressionBuilder extends Builder<YieldExpression> {
  private _children: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression>[] = [];

  constructor() { super(); }

  children(...value: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('yield');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): YieldExpression {
    return {
      kind: 'yield_expression',
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as YieldExpression;
  }

  override get nodeKind(): 'yield_expression' { return 'yield_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'yield', type: 'yield' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { YieldExpressionBuilder };

export function yield_expression(): YieldExpressionBuilder {
  return new YieldExpressionBuilder();
}

export interface YieldExpressionOptions {
  nodeKind: 'yield_expression';
  children?: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression> | UnaryExpressionOptions | ReferenceExpressionOptions | TryExpressionOptions | BinaryExpressionOptions | AssignmentExpressionOptions | CompoundAssignmentExprOptions | TypeCastExpressionOptions | CallExpressionOptions | ReturnExpressionOptions | StringLiteralOptions | RawStringLiteralOptions | ScopedIdentifierOptions | GenericFunctionOptions | AwaitExpressionOptions | FieldExpressionOptions | ArrayExpressionOptions | TupleExpressionOptions | MacroInvocationOptions | BreakExpressionOptions | ContinueExpressionOptions | IndexExpressionOptions | ClosureExpressionOptions | ParenthesizedExpressionOptions | StructExpressionOptions | UnsafeBlockOptions | AsyncBlockOptions | GenBlockOptions | TryBlockOptions | BlockOptions | IfExpressionOptions | MatchExpressionOptions | WhileExpressionOptions | LoopExpressionOptions | ForExpressionOptions | ConstBlockOptions | RangeExpressionOptions | (Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression> | UnaryExpressionOptions | ReferenceExpressionOptions | TryExpressionOptions | BinaryExpressionOptions | AssignmentExpressionOptions | CompoundAssignmentExprOptions | TypeCastExpressionOptions | CallExpressionOptions | ReturnExpressionOptions | StringLiteralOptions | RawStringLiteralOptions | ScopedIdentifierOptions | GenericFunctionOptions | AwaitExpressionOptions | FieldExpressionOptions | ArrayExpressionOptions | TupleExpressionOptions | MacroInvocationOptions | BreakExpressionOptions | ContinueExpressionOptions | IndexExpressionOptions | ClosureExpressionOptions | ParenthesizedExpressionOptions | StructExpressionOptions | UnsafeBlockOptions | AsyncBlockOptions | GenBlockOptions | TryBlockOptions | BlockOptions | IfExpressionOptions | MatchExpressionOptions | WhileExpressionOptions | LoopExpressionOptions | ForExpressionOptions | ConstBlockOptions | RangeExpressionOptions)[];
}

export namespace yield_expression {
  export function from(input: Omit<YieldExpressionOptions, 'nodeKind'> | Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression> | UnaryExpressionOptions | ReferenceExpressionOptions | TryExpressionOptions | BinaryExpressionOptions | AssignmentExpressionOptions | CompoundAssignmentExprOptions | TypeCastExpressionOptions | CallExpressionOptions | ReturnExpressionOptions | StringLiteralOptions | RawStringLiteralOptions | ScopedIdentifierOptions | GenericFunctionOptions | AwaitExpressionOptions | FieldExpressionOptions | ArrayExpressionOptions | TupleExpressionOptions | MacroInvocationOptions | BreakExpressionOptions | ContinueExpressionOptions | IndexExpressionOptions | ClosureExpressionOptions | ParenthesizedExpressionOptions | StructExpressionOptions | UnsafeBlockOptions | AsyncBlockOptions | GenBlockOptions | TryBlockOptions | BlockOptions | IfExpressionOptions | MatchExpressionOptions | WhileExpressionOptions | LoopExpressionOptions | ForExpressionOptions | ConstBlockOptions | RangeExpressionOptions | (Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression> | UnaryExpressionOptions | ReferenceExpressionOptions | TryExpressionOptions | BinaryExpressionOptions | AssignmentExpressionOptions | CompoundAssignmentExprOptions | TypeCastExpressionOptions | CallExpressionOptions | ReturnExpressionOptions | StringLiteralOptions | RawStringLiteralOptions | ScopedIdentifierOptions | GenericFunctionOptions | AwaitExpressionOptions | FieldExpressionOptions | ArrayExpressionOptions | TupleExpressionOptions | MacroInvocationOptions | BreakExpressionOptions | ContinueExpressionOptions | IndexExpressionOptions | ClosureExpressionOptions | ParenthesizedExpressionOptions | StructExpressionOptions | UnsafeBlockOptions | AsyncBlockOptions | GenBlockOptions | TryBlockOptions | BlockOptions | IfExpressionOptions | MatchExpressionOptions | WhileExpressionOptions | LoopExpressionOptions | ForExpressionOptions | ConstBlockOptions | RangeExpressionOptions)[]): YieldExpressionBuilder {
    const options: Omit<YieldExpressionOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<YieldExpressionOptions, 'nodeKind'>
      : { children: input } as Omit<YieldExpressionOptions, 'nodeKind'>;
    const b = new YieldExpressionBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'unary_expression': return unary_expression.from(_v);   case 'reference_expression': return reference_expression.from(_v);   case 'try_expression': return try_expression.from(_v);   case 'binary_expression': return binary_expression.from(_v);   case 'assignment_expression': return assignment_expression.from(_v);   case 'compound_assignment_expr': return compound_assignment_expr.from(_v);   case 'type_cast_expression': return type_cast_expression.from(_v);   case 'call_expression': return call_expression.from(_v);   case 'return_expression': return return_expression.from(_v);   case 'string_literal': return string_literal.from(_v);   case 'raw_string_literal': return raw_string_literal.from(_v);   case 'scoped_identifier': return scoped_identifier.from(_v);   case 'generic_function': return generic_function.from(_v);   case 'await_expression': return await_expression.from(_v);   case 'field_expression': return field_expression.from(_v);   case 'array_expression': return array_expression.from(_v);   case 'tuple_expression': return tuple_expression.from(_v);   case 'macro_invocation': return macro_invocation.from(_v);   case 'break_expression': return break_expression.from(_v);   case 'continue_expression': return continue_expression.from(_v);   case 'index_expression': return index_expression.from(_v);   case 'closure_expression': return closure_expression.from(_v);   case 'parenthesized_expression': return parenthesized_expression.from(_v);   case 'struct_expression': return struct_expression.from(_v);   case 'unsafe_block': return unsafe_block.from(_v);   case 'async_block': return async_block.from(_v);   case 'gen_block': return gen_block.from(_v);   case 'try_block': return try_block.from(_v);   case 'block': return block.from(_v);   case 'if_expression': return if_expression.from(_v);   case 'match_expression': return match_expression.from(_v);   case 'while_expression': return while_expression.from(_v);   case 'loop_expression': return loop_expression.from(_v);   case 'for_expression': return for_expression.from(_v);   case 'const_block': return const_block.from(_v);   case 'range_expression': return range_expression.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
