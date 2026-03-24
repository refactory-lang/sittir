import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayExpression, AssignmentExpression, AsyncBlock, AwaitExpression, BinaryExpression, Block, BooleanLiteral, BreakExpression, CallExpression, CharLiteral, ClosureExpression, CompoundAssignmentExpr, ConstBlock, ContinueExpression, FieldExpression, FloatLiteral, ForExpression, GenBlock, GenericFunction, Identifier, IfExpression, IndexExpression, IntegerLiteral, Label, LetChain, LetCondition, LoopExpression, MacroInvocation, MatchExpression, Metavariable, ParenthesizedExpression, RangeExpression, RawStringLiteral, ReferenceExpression, ReturnExpression, ScopedIdentifier, Self, StringLiteral, StructExpression, TryBlock, TryExpression, TupleExpression, TypeCastExpression, UnaryExpression, UnitExpression, UnsafeBlock, WhileExpression, YieldExpression } from '../types.js';
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
import { yield_expression } from './yield-expression.js';
import type { YieldExpressionOptions } from './yield-expression.js';
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
import { loop_expression } from './loop-expression.js';
import type { LoopExpressionOptions } from './loop-expression.js';
import { for_expression } from './for-expression.js';
import type { ForExpressionOptions } from './for-expression.js';
import { const_block } from './const-block.js';
import type { ConstBlockOptions } from './const-block.js';
import { range_expression } from './range-expression.js';
import type { RangeExpressionOptions } from './range-expression.js';
import { let_condition } from './let-condition.js';
import type { LetConditionOptions } from './let-condition.js';
import { let_chain } from './let-chain.js';
import type { LetChainOptions } from './let-chain.js';
import { label } from './label.js';
import type { LabelOptions } from './label.js';


class WhileExpressionBuilder extends Builder<WhileExpression> {
  private _condition: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression | LetCondition | LetChain>;
  private _body!: Builder<Block>;
  private _children: Builder<Label>[] = [];

  constructor(condition: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression | LetCondition | LetChain>) {
    super();
    this._condition = condition;
  }

  body(value: Builder<Block>): this {
    this._body = value;
    return this;
  }

  children(...value: Builder<Label>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('while');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WhileExpression {
    return {
      kind: 'while_expression',
      condition: this._condition.build(ctx),
      body: this._body ? this._body.build(ctx) : undefined,
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as WhileExpression;
  }

  override get nodeKind(): 'while_expression' { return 'while_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'while', type: 'while' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { WhileExpressionBuilder };

export function while_expression(condition: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression | LetCondition | LetChain>): WhileExpressionBuilder {
  return new WhileExpressionBuilder(condition);
}

export interface WhileExpressionOptions {
  nodeKind: 'while_expression';
  condition: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression | LetCondition | LetChain> | UnaryExpressionOptions | ReferenceExpressionOptions | TryExpressionOptions | BinaryExpressionOptions | AssignmentExpressionOptions | CompoundAssignmentExprOptions | TypeCastExpressionOptions | CallExpressionOptions | ReturnExpressionOptions | YieldExpressionOptions | StringLiteralOptions | RawStringLiteralOptions | ScopedIdentifierOptions | GenericFunctionOptions | AwaitExpressionOptions | FieldExpressionOptions | ArrayExpressionOptions | TupleExpressionOptions | MacroInvocationOptions | BreakExpressionOptions | ContinueExpressionOptions | IndexExpressionOptions | ClosureExpressionOptions | ParenthesizedExpressionOptions | StructExpressionOptions | UnsafeBlockOptions | AsyncBlockOptions | GenBlockOptions | TryBlockOptions | BlockOptions | IfExpressionOptions | MatchExpressionOptions | LoopExpressionOptions | ForExpressionOptions | ConstBlockOptions | RangeExpressionOptions | LetConditionOptions | LetChainOptions;
  body: Builder<Block> | Omit<BlockOptions, 'nodeKind'>;
  children?: Builder<Label> | Omit<LabelOptions, 'nodeKind'> | (Builder<Label> | Omit<LabelOptions, 'nodeKind'>)[];
}

export namespace while_expression {
  export function from(options: Omit<WhileExpressionOptions, 'nodeKind'>): WhileExpressionBuilder {
    const _raw = options.condition;
    let _ctor: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression | LetCondition | LetChain>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'unary_expression': _ctor = unary_expression.from(_raw); break;
        case 'reference_expression': _ctor = reference_expression.from(_raw); break;
        case 'try_expression': _ctor = try_expression.from(_raw); break;
        case 'binary_expression': _ctor = binary_expression.from(_raw); break;
        case 'assignment_expression': _ctor = assignment_expression.from(_raw); break;
        case 'compound_assignment_expr': _ctor = compound_assignment_expr.from(_raw); break;
        case 'type_cast_expression': _ctor = type_cast_expression.from(_raw); break;
        case 'call_expression': _ctor = call_expression.from(_raw); break;
        case 'return_expression': _ctor = return_expression.from(_raw); break;
        case 'yield_expression': _ctor = yield_expression.from(_raw); break;
        case 'string_literal': _ctor = string_literal.from(_raw); break;
        case 'raw_string_literal': _ctor = raw_string_literal.from(_raw); break;
        case 'scoped_identifier': _ctor = scoped_identifier.from(_raw); break;
        case 'generic_function': _ctor = generic_function.from(_raw); break;
        case 'await_expression': _ctor = await_expression.from(_raw); break;
        case 'field_expression': _ctor = field_expression.from(_raw); break;
        case 'array_expression': _ctor = array_expression.from(_raw); break;
        case 'tuple_expression': _ctor = tuple_expression.from(_raw); break;
        case 'macro_invocation': _ctor = macro_invocation.from(_raw); break;
        case 'break_expression': _ctor = break_expression.from(_raw); break;
        case 'continue_expression': _ctor = continue_expression.from(_raw); break;
        case 'index_expression': _ctor = index_expression.from(_raw); break;
        case 'closure_expression': _ctor = closure_expression.from(_raw); break;
        case 'parenthesized_expression': _ctor = parenthesized_expression.from(_raw); break;
        case 'struct_expression': _ctor = struct_expression.from(_raw); break;
        case 'unsafe_block': _ctor = unsafe_block.from(_raw); break;
        case 'async_block': _ctor = async_block.from(_raw); break;
        case 'gen_block': _ctor = gen_block.from(_raw); break;
        case 'try_block': _ctor = try_block.from(_raw); break;
        case 'block': _ctor = block.from(_raw); break;
        case 'if_expression': _ctor = if_expression.from(_raw); break;
        case 'match_expression': _ctor = match_expression.from(_raw); break;
        case 'loop_expression': _ctor = loop_expression.from(_raw); break;
        case 'for_expression': _ctor = for_expression.from(_raw); break;
        case 'const_block': _ctor = const_block.from(_raw); break;
        case 'range_expression': _ctor = range_expression.from(_raw); break;
        case 'let_condition': _ctor = let_condition.from(_raw); break;
        case 'let_chain': _ctor = let_chain.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new WhileExpressionBuilder(_ctor);
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : block.from(_v));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : label.from(_x)));
    }
    return b;
  }
}
