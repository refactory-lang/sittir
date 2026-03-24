import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { ArrayExpression, AssignmentExpression, AsyncBlock, AttributeItem, AwaitExpression, BinaryExpression, Block, BooleanLiteral, BreakExpression, CallExpression, CharLiteral, ClosureExpression, CompoundAssignmentExpr, ConstBlock, ContinueExpression, FieldExpression, FieldIdentifier, FieldInitializer, FloatLiteral, ForExpression, GenBlock, GenericFunction, Identifier, IfExpression, IndexExpression, IntegerLiteral, LoopExpression, MacroInvocation, MatchExpression, Metavariable, ParenthesizedExpression, RangeExpression, RawStringLiteral, ReferenceExpression, ReturnExpression, ScopedIdentifier, Self, StringLiteral, StructExpression, TryBlock, TryExpression, TupleExpression, TypeCastExpression, UnaryExpression, UnitExpression, UnsafeBlock, WhileExpression, YieldExpression } from '../types.js';
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
import { attribute } from './attribute-item.js';
import type { AttributeItemOptions } from './attribute-item.js';


class FieldInitializerBuilder extends Builder<FieldInitializer> {
  private _field: Builder<FieldIdentifier | IntegerLiteral>;
  private _value!: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression>;
  private _children: Builder<AttributeItem>[] = [];

  constructor(field: Builder<FieldIdentifier | IntegerLiteral>) {
    super();
    this._field = field;
  }

  value(value: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression>): this {
    this._value = value;
    return this;
  }

  children(...value: Builder<AttributeItem>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._field) parts.push(this.renderChild(this._field, ctx));
    parts.push(':');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FieldInitializer {
    return {
      kind: 'field_initializer',
      field: this._field.build(ctx),
      value: this._value ? this._value.build(ctx) : undefined,
      children: this._children.map(c => c.build(ctx)),
    } as FieldInitializer;
  }

  override get nodeKind(): 'field_initializer' { return 'field_initializer'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._field) parts.push({ kind: 'builder', builder: this._field, fieldName: 'field' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { FieldInitializerBuilder };

export function field_initializer(field: Builder<FieldIdentifier | IntegerLiteral>): FieldInitializerBuilder {
  return new FieldInitializerBuilder(field);
}

export interface FieldInitializerOptions {
  nodeKind: 'field_initializer';
  field: Builder<FieldIdentifier | IntegerLiteral> | LeafOptions<'field_identifier'> | LeafOptions<'integer_literal'>;
  value: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression> | UnaryExpressionOptions | ReferenceExpressionOptions | TryExpressionOptions | BinaryExpressionOptions | AssignmentExpressionOptions | CompoundAssignmentExprOptions | TypeCastExpressionOptions | CallExpressionOptions | ReturnExpressionOptions | YieldExpressionOptions | StringLiteralOptions | RawStringLiteralOptions | ScopedIdentifierOptions | GenericFunctionOptions | AwaitExpressionOptions | FieldExpressionOptions | ArrayExpressionOptions | TupleExpressionOptions | MacroInvocationOptions | BreakExpressionOptions | ContinueExpressionOptions | IndexExpressionOptions | ClosureExpressionOptions | ParenthesizedExpressionOptions | StructExpressionOptions | UnsafeBlockOptions | AsyncBlockOptions | GenBlockOptions | TryBlockOptions | BlockOptions | IfExpressionOptions | MatchExpressionOptions | WhileExpressionOptions | LoopExpressionOptions | ForExpressionOptions | ConstBlockOptions | RangeExpressionOptions;
  children?: Builder<AttributeItem> | Omit<AttributeItemOptions, 'nodeKind'> | (Builder<AttributeItem> | Omit<AttributeItemOptions, 'nodeKind'>)[];
}

export namespace field_initializer {
  export function from(options: Omit<FieldInitializerOptions, 'nodeKind'>): FieldInitializerBuilder {
    const _raw = options.field;
    let _ctor: Builder<FieldIdentifier | IntegerLiteral>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'field_identifier': _ctor = new LeafBuilder('field_identifier', (_raw as LeafOptions).text!); break;
        case 'integer_literal': _ctor = new LeafBuilder('integer_literal', (_raw as LeafOptions).text!); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new FieldInitializerBuilder(_ctor);
    if (options.value !== undefined) {
      const _v = options.value;
      if (_v instanceof Builder) {
        b.value(_v);
      } else {
        switch (_v.nodeKind) {
          case 'unary_expression': b.value(unary_expression.from(_v)); break;
          case 'reference_expression': b.value(reference_expression.from(_v)); break;
          case 'try_expression': b.value(try_expression.from(_v)); break;
          case 'binary_expression': b.value(binary_expression.from(_v)); break;
          case 'assignment_expression': b.value(assignment_expression.from(_v)); break;
          case 'compound_assignment_expr': b.value(compound_assignment_expr.from(_v)); break;
          case 'type_cast_expression': b.value(type_cast_expression.from(_v)); break;
          case 'call_expression': b.value(call_expression.from(_v)); break;
          case 'return_expression': b.value(return_expression.from(_v)); break;
          case 'yield_expression': b.value(yield_expression.from(_v)); break;
          case 'string_literal': b.value(string_literal.from(_v)); break;
          case 'raw_string_literal': b.value(raw_string_literal.from(_v)); break;
          case 'scoped_identifier': b.value(scoped_identifier.from(_v)); break;
          case 'generic_function': b.value(generic_function.from(_v)); break;
          case 'await_expression': b.value(await_expression.from(_v)); break;
          case 'field_expression': b.value(field_expression.from(_v)); break;
          case 'array_expression': b.value(array_expression.from(_v)); break;
          case 'tuple_expression': b.value(tuple_expression.from(_v)); break;
          case 'macro_invocation': b.value(macro_invocation.from(_v)); break;
          case 'break_expression': b.value(break_expression.from(_v)); break;
          case 'continue_expression': b.value(continue_expression.from(_v)); break;
          case 'index_expression': b.value(index_expression.from(_v)); break;
          case 'closure_expression': b.value(closure_expression.from(_v)); break;
          case 'parenthesized_expression': b.value(parenthesized_expression.from(_v)); break;
          case 'struct_expression': b.value(struct_expression.from(_v)); break;
          case 'unsafe_block': b.value(unsafe_block.from(_v)); break;
          case 'async_block': b.value(async_block.from(_v)); break;
          case 'gen_block': b.value(gen_block.from(_v)); break;
          case 'try_block': b.value(try_block.from(_v)); break;
          case 'block': b.value(block.from(_v)); break;
          case 'if_expression': b.value(if_expression.from(_v)); break;
          case 'match_expression': b.value(match_expression.from(_v)); break;
          case 'while_expression': b.value(while_expression.from(_v)); break;
          case 'loop_expression': b.value(loop_expression.from(_v)); break;
          case 'for_expression': b.value(for_expression.from(_v)); break;
          case 'const_block': b.value(const_block.from(_v)); break;
          case 'range_expression': b.value(range_expression.from(_v)); break;
        }
      }
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : attribute.from(_x)));
    }
    return b;
  }
}
