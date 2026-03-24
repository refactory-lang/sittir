import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayExpression, AssignmentExpression, AsyncBlock, AwaitExpression, BinaryExpression, Block, BooleanLiteral, BreakExpression, CallExpression, CapturedPattern, CharLiteral, ClosureExpression, CompoundAssignmentExpr, ConstBlock, ContinueExpression, FieldExpression, FloatLiteral, ForExpression, GenBlock, GenericFunction, GenericPattern, Identifier, IfExpression, IndexExpression, IntegerLiteral, LetChain, LetCondition, LoopExpression, MacroInvocation, MatchExpression, MatchPattern, Metavariable, MutPattern, NegativeLiteral, OrPattern, ParenthesizedExpression, RangeExpression, RangePattern, RawStringLiteral, RefPattern, ReferenceExpression, ReferencePattern, RemainingFieldPattern, ReturnExpression, ScopedIdentifier, Self, SlicePattern, StringLiteral, StructExpression, StructPattern, TryBlock, TryExpression, TupleExpression, TuplePattern, TupleStructPattern, TypeCastExpression, UnaryExpression, UnitExpression, UnsafeBlock, WhileExpression, YieldExpression } from '../types.js';
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
import { let_condition } from './let-condition.js';
import type { LetConditionOptions } from './let-condition.js';
import { let_chain } from './let-chain.js';
import type { LetChainOptions } from './let-chain.js';
import { negative_literal } from './negative-literal.js';
import type { NegativeLiteralOptions } from './negative-literal.js';
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


class MatchPatternBuilder extends Builder<MatchPattern> {
  private _condition?: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression | LetCondition | LetChain>;
  private _children: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation>[] = [];

  constructor(children: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation>) {
    super();
    this._children = [children];
  }

  condition(value: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression | LetCondition | LetChain>): this {
    this._condition = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._condition) {
      parts.push('if');
      if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MatchPattern {
    return {
      kind: 'match_pattern',
      condition: this._condition ? this._condition.build(ctx) : undefined,
      children: this._children[0]!.build(ctx),
    } as MatchPattern;
  }

  override get nodeKind(): 'match_pattern' { return 'match_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._condition) {
      parts.push({ kind: 'token', text: 'if', type: 'if' });
      if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    }
    return parts;
  }
}

export type { MatchPatternBuilder };

export function match_pattern(children: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation>): MatchPatternBuilder {
  return new MatchPatternBuilder(children);
}

export interface MatchPatternOptions {
  nodeKind: 'match_pattern';
  condition?: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression | LetCondition | LetChain> | UnaryExpressionOptions | ReferenceExpressionOptions | TryExpressionOptions | BinaryExpressionOptions | AssignmentExpressionOptions | CompoundAssignmentExprOptions | TypeCastExpressionOptions | CallExpressionOptions | ReturnExpressionOptions | YieldExpressionOptions | StringLiteralOptions | RawStringLiteralOptions | ScopedIdentifierOptions | GenericFunctionOptions | AwaitExpressionOptions | FieldExpressionOptions | ArrayExpressionOptions | TupleExpressionOptions | MacroInvocationOptions | BreakExpressionOptions | ContinueExpressionOptions | IndexExpressionOptions | ClosureExpressionOptions | ParenthesizedExpressionOptions | StructExpressionOptions | UnsafeBlockOptions | AsyncBlockOptions | GenBlockOptions | TryBlockOptions | BlockOptions | IfExpressionOptions | MatchExpressionOptions | WhileExpressionOptions | LoopExpressionOptions | ForExpressionOptions | ConstBlockOptions | RangeExpressionOptions | LetConditionOptions | LetChainOptions;
  children: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation> | StringLiteralOptions | RawStringLiteralOptions | NegativeLiteralOptions | ScopedIdentifierOptions | GenericPatternOptions | TuplePatternOptions | TupleStructPatternOptions | StructPatternOptions | RefPatternOptions | SlicePatternOptions | CapturedPatternOptions | ReferencePatternOptions | MutPatternOptions | RangePatternOptions | OrPatternOptions | ConstBlockOptions | MacroInvocationOptions | (Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation> | StringLiteralOptions | RawStringLiteralOptions | NegativeLiteralOptions | ScopedIdentifierOptions | GenericPatternOptions | TuplePatternOptions | TupleStructPatternOptions | StructPatternOptions | RefPatternOptions | SlicePatternOptions | CapturedPatternOptions | ReferencePatternOptions | MutPatternOptions | RangePatternOptions | OrPatternOptions | ConstBlockOptions | MacroInvocationOptions)[];
}

export namespace match_pattern {
  export function from(options: Omit<MatchPatternOptions, 'nodeKind'>): MatchPatternBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    let _resolved: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation>;
    if (_ctor instanceof Builder) {
      _resolved = _ctor;
    } else {
      switch (_ctor.nodeKind) {
        case 'string_literal': _resolved = string_literal.from(_ctor); break;
        case 'raw_string_literal': _resolved = raw_string_literal.from(_ctor); break;
        case 'negative_literal': _resolved = negative_literal.from(_ctor); break;
        case 'scoped_identifier': _resolved = scoped_identifier.from(_ctor); break;
        case 'generic_pattern': _resolved = generic_pattern.from(_ctor); break;
        case 'tuple_pattern': _resolved = tuple_pattern.from(_ctor); break;
        case 'tuple_struct_pattern': _resolved = tuple_struct_pattern.from(_ctor); break;
        case 'struct_pattern': _resolved = struct_pattern.from(_ctor); break;
        case 'ref_pattern': _resolved = ref_pattern.from(_ctor); break;
        case 'slice_pattern': _resolved = slice_pattern.from(_ctor); break;
        case 'captured_pattern': _resolved = captured_pattern.from(_ctor); break;
        case 'reference_pattern': _resolved = reference_pattern.from(_ctor); break;
        case 'mut_pattern': _resolved = mut_pattern.from(_ctor); break;
        case 'range_pattern': _resolved = range_pattern.from(_ctor); break;
        case 'or_pattern': _resolved = or_pattern.from(_ctor); break;
        case 'const_block': _resolved = const_block.from(_ctor); break;
        case 'macro_invocation': _resolved = macro_invocation.from(_ctor); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new MatchPatternBuilder(_resolved);
    if (options.condition !== undefined) {
      const _v = options.condition;
      if (_v instanceof Builder) {
        b.condition(_v);
      } else {
        switch (_v.nodeKind) {
          case 'unary_expression': b.condition(unary_expression.from(_v)); break;
          case 'reference_expression': b.condition(reference_expression.from(_v)); break;
          case 'try_expression': b.condition(try_expression.from(_v)); break;
          case 'binary_expression': b.condition(binary_expression.from(_v)); break;
          case 'assignment_expression': b.condition(assignment_expression.from(_v)); break;
          case 'compound_assignment_expr': b.condition(compound_assignment_expr.from(_v)); break;
          case 'type_cast_expression': b.condition(type_cast_expression.from(_v)); break;
          case 'call_expression': b.condition(call_expression.from(_v)); break;
          case 'return_expression': b.condition(return_expression.from(_v)); break;
          case 'yield_expression': b.condition(yield_expression.from(_v)); break;
          case 'string_literal': b.condition(string_literal.from(_v)); break;
          case 'raw_string_literal': b.condition(raw_string_literal.from(_v)); break;
          case 'scoped_identifier': b.condition(scoped_identifier.from(_v)); break;
          case 'generic_function': b.condition(generic_function.from(_v)); break;
          case 'await_expression': b.condition(await_expression.from(_v)); break;
          case 'field_expression': b.condition(field_expression.from(_v)); break;
          case 'array_expression': b.condition(array_expression.from(_v)); break;
          case 'tuple_expression': b.condition(tuple_expression.from(_v)); break;
          case 'macro_invocation': b.condition(macro_invocation.from(_v)); break;
          case 'break_expression': b.condition(break_expression.from(_v)); break;
          case 'continue_expression': b.condition(continue_expression.from(_v)); break;
          case 'index_expression': b.condition(index_expression.from(_v)); break;
          case 'closure_expression': b.condition(closure_expression.from(_v)); break;
          case 'parenthesized_expression': b.condition(parenthesized_expression.from(_v)); break;
          case 'struct_expression': b.condition(struct_expression.from(_v)); break;
          case 'unsafe_block': b.condition(unsafe_block.from(_v)); break;
          case 'async_block': b.condition(async_block.from(_v)); break;
          case 'gen_block': b.condition(gen_block.from(_v)); break;
          case 'try_block': b.condition(try_block.from(_v)); break;
          case 'block': b.condition(block.from(_v)); break;
          case 'if_expression': b.condition(if_expression.from(_v)); break;
          case 'match_expression': b.condition(match_expression.from(_v)); break;
          case 'while_expression': b.condition(while_expression.from(_v)); break;
          case 'loop_expression': b.condition(loop_expression.from(_v)); break;
          case 'for_expression': b.condition(for_expression.from(_v)); break;
          case 'const_block': b.condition(const_block.from(_v)); break;
          case 'range_expression': b.condition(range_expression.from(_v)); break;
          case 'let_condition': b.condition(let_condition.from(_v)); break;
          case 'let_chain': b.condition(let_chain.from(_v)); break;
        }
      }
    }
    return b;
  }
}
