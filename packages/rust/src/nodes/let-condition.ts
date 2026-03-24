import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayExpression, AssignmentExpression, AsyncBlock, AwaitExpression, BinaryExpression, Block, BooleanLiteral, BreakExpression, CallExpression, CapturedPattern, CharLiteral, ClosureExpression, CompoundAssignmentExpr, ConstBlock, ContinueExpression, FieldExpression, FloatLiteral, ForExpression, GenBlock, GenericFunction, GenericPattern, Identifier, IfExpression, IndexExpression, IntegerLiteral, LetCondition, LoopExpression, MacroInvocation, MatchExpression, Metavariable, MutPattern, NegativeLiteral, OrPattern, ParenthesizedExpression, RangeExpression, RangePattern, RawStringLiteral, RefPattern, ReferenceExpression, ReferencePattern, RemainingFieldPattern, ReturnExpression, ScopedIdentifier, Self, SlicePattern, StringLiteral, StructExpression, StructPattern, TryBlock, TryExpression, TupleExpression, TuplePattern, TupleStructPattern, TypeCastExpression, UnaryExpression, UnitExpression, UnsafeBlock, WhileExpression, YieldExpression } from '../types.js';
import { string_literal } from './string-literal.js';
import type { StringLiteralOptions } from './string-literal.js';
import { raw_string_literal } from './raw-string-literal.js';
import type { RawStringLiteralOptions } from './raw-string-literal.js';
import { negative_literal } from './negative-literal.js';
import type { NegativeLiteralOptions } from './negative-literal.js';
import { scoped_identifier } from './scoped-identifier.js';
import type { ScopedIdentifierOptions } from './scoped-identifier.js';
import { generic_pattern } from './generic-pattern.js';
import type { GenericPatternOptions } from './generic-pattern.js';
import { tuple_pattern } from './tuple-pattern.js';
import type { TuplePatternOptions } from './tuple-pattern.js';
import { tuple_struct_pattern } from './tuple-struct-pattern.js';
import type { TupleStructPatternOptions } from './tuple-struct-pattern.js';
import { struct_pattern } from './struct-pattern.js';
import type { StructPatternOptions } from './struct-pattern.js';
import { ref_pattern } from './ref-pattern.js';
import type { RefPatternOptions } from './ref-pattern.js';
import { slice_pattern } from './slice-pattern.js';
import type { SlicePatternOptions } from './slice-pattern.js';
import { captured_pattern } from './captured-pattern.js';
import type { CapturedPatternOptions } from './captured-pattern.js';
import { reference_pattern } from './reference-pattern.js';
import type { ReferencePatternOptions } from './reference-pattern.js';
import { mut_pattern } from './mut-pattern.js';
import type { MutPatternOptions } from './mut-pattern.js';
import { range_pattern } from './range-pattern.js';
import type { RangePatternOptions } from './range-pattern.js';
import { or_pattern } from './or-pattern.js';
import type { OrPatternOptions } from './or-pattern.js';
import { const_block } from './const-block.js';
import type { ConstBlockOptions } from './const-block.js';
import { macro_invocation } from './macro-invocation.js';
import type { MacroInvocationOptions } from './macro-invocation.js';
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
import { range_expression } from './range-expression.js';
import type { RangeExpressionOptions } from './range-expression.js';


class LetConditionBuilder extends Builder<LetCondition> {
  private _pattern: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation>;
  private _value!: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression>;

  constructor(pattern: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation>) {
    super();
    this._pattern = pattern;
  }

  value(value: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression>): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('let');
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    parts.push('=');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LetCondition {
    return {
      kind: 'let_condition',
      pattern: this._pattern.build(ctx),
      value: this._value ? this._value.build(ctx) : undefined,
    } as LetCondition;
  }

  override get nodeKind(): 'let_condition' { return 'let_condition'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'let', type: 'let' });
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { LetConditionBuilder };

export function let_condition(pattern: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation>): LetConditionBuilder {
  return new LetConditionBuilder(pattern);
}

export interface LetConditionOptions {
  nodeKind: 'let_condition';
  pattern: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation> | StringLiteralOptions | RawStringLiteralOptions | NegativeLiteralOptions | ScopedIdentifierOptions | GenericPatternOptions | TuplePatternOptions | TupleStructPatternOptions | StructPatternOptions | RefPatternOptions | SlicePatternOptions | CapturedPatternOptions | ReferencePatternOptions | MutPatternOptions | RangePatternOptions | OrPatternOptions | ConstBlockOptions | MacroInvocationOptions;
  value: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression> | UnaryExpressionOptions | ReferenceExpressionOptions | TryExpressionOptions | BinaryExpressionOptions | AssignmentExpressionOptions | CompoundAssignmentExprOptions | TypeCastExpressionOptions | CallExpressionOptions | ReturnExpressionOptions | YieldExpressionOptions | StringLiteralOptions | RawStringLiteralOptions | ScopedIdentifierOptions | GenericFunctionOptions | AwaitExpressionOptions | FieldExpressionOptions | ArrayExpressionOptions | TupleExpressionOptions | MacroInvocationOptions | BreakExpressionOptions | ContinueExpressionOptions | IndexExpressionOptions | ClosureExpressionOptions | ParenthesizedExpressionOptions | StructExpressionOptions | UnsafeBlockOptions | AsyncBlockOptions | GenBlockOptions | TryBlockOptions | BlockOptions | IfExpressionOptions | MatchExpressionOptions | WhileExpressionOptions | LoopExpressionOptions | ForExpressionOptions | ConstBlockOptions | RangeExpressionOptions;
}

export namespace let_condition {
  export function from(options: Omit<LetConditionOptions, 'nodeKind'>): LetConditionBuilder {
    const _raw = options.pattern;
    let _ctor: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'string_literal': _ctor = string_literal.from(_raw); break;
        case 'raw_string_literal': _ctor = raw_string_literal.from(_raw); break;
        case 'negative_literal': _ctor = negative_literal.from(_raw); break;
        case 'scoped_identifier': _ctor = scoped_identifier.from(_raw); break;
        case 'generic_pattern': _ctor = generic_pattern.from(_raw); break;
        case 'tuple_pattern': _ctor = tuple_pattern.from(_raw); break;
        case 'tuple_struct_pattern': _ctor = tuple_struct_pattern.from(_raw); break;
        case 'struct_pattern': _ctor = struct_pattern.from(_raw); break;
        case 'ref_pattern': _ctor = ref_pattern.from(_raw); break;
        case 'slice_pattern': _ctor = slice_pattern.from(_raw); break;
        case 'captured_pattern': _ctor = captured_pattern.from(_raw); break;
        case 'reference_pattern': _ctor = reference_pattern.from(_raw); break;
        case 'mut_pattern': _ctor = mut_pattern.from(_raw); break;
        case 'range_pattern': _ctor = range_pattern.from(_raw); break;
        case 'or_pattern': _ctor = or_pattern.from(_raw); break;
        case 'const_block': _ctor = const_block.from(_raw); break;
        case 'macro_invocation': _ctor = macro_invocation.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new LetConditionBuilder(_ctor);
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
    return b;
  }
}
