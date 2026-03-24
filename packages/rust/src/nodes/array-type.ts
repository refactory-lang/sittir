import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayExpression, ArrayType, AssignmentExpression, AsyncBlock, AwaitExpression, BinaryExpression, Block, BooleanLiteral, BoundedType, BreakExpression, CallExpression, CharLiteral, ClosureExpression, CompoundAssignmentExpr, ConstBlock, ContinueExpression, DynamicType, FieldExpression, FloatLiteral, ForExpression, FunctionType, GenBlock, GenericFunction, GenericType, Identifier, IfExpression, IndexExpression, IntegerLiteral, LoopExpression, MacroInvocation, MatchExpression, Metavariable, NeverType, ParenthesizedExpression, PointerType, PrimitiveType, RangeExpression, RawStringLiteral, ReferenceExpression, ReferenceType, RemovedTraitBound, ReturnExpression, ScopedIdentifier, ScopedTypeIdentifier, Self, StringLiteral, StructExpression, TryBlock, TryExpression, TupleExpression, TupleType, TypeCastExpression, TypeIdentifier, UnaryExpression, UnitExpression, UnitType, UnsafeBlock, WhileExpression, YieldExpression } from '../types.js';
import { abstract_type } from './abstract-type.js';
import type { AbstractTypeOptions } from './abstract-type.js';
import { reference_type } from './reference-type.js';
import type { ReferenceTypeOptions } from './reference-type.js';
import { pointer_type } from './pointer-type.js';
import type { PointerTypeOptions } from './pointer-type.js';
import { generic_type } from './generic-type.js';
import type { GenericTypeOptions } from './generic-type.js';
import { scoped_type_identifier } from './scoped-type-identifier.js';
import type { ScopedTypeIdentifierOptions } from './scoped-type-identifier.js';
import { tuple_type } from './tuple-type.js';
import type { TupleTypeOptions } from './tuple-type.js';
import { function_type } from './function-type.js';
import type { FunctionTypeOptions } from './function-type.js';
import { macro_invocation } from './macro-invocation.js';
import type { MacroInvocationOptions } from './macro-invocation.js';
import { dynamic_type } from './dynamic-type.js';
import type { DynamicTypeOptions } from './dynamic-type.js';
import { bounded_type } from './bounded-type.js';
import type { BoundedTypeOptions } from './bounded-type.js';
import { removed_trait_bound } from './removed-trait-bound.js';
import type { RemovedTraitBoundOptions } from './removed-trait-bound.js';
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


class ArrayTypeBuilder extends Builder<ArrayType> {
  private _element: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;
  private _length?: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression>;

  constructor(element: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>) {
    super();
    this._element = element;
  }

  length(value: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression>): this {
    this._length = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._element) parts.push(this.renderChild(this._element, ctx));
    if (this._length) {
      parts.push(';');
      if (this._length) parts.push(this.renderChild(this._length, ctx));
    }
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ArrayType {
    return {
      kind: 'array_type',
      element: this._element.build(ctx),
      length: this._length ? this._length.build(ctx) : undefined,
    } as ArrayType;
  }

  override get nodeKind(): 'array_type' { return 'array_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '[', type: '[' });
    if (this._element) parts.push({ kind: 'builder', builder: this._element, fieldName: 'element' });
    if (this._length) {
      parts.push({ kind: 'token', text: ';', type: ';' });
      if (this._length) parts.push({ kind: 'builder', builder: this._length, fieldName: 'length' });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { ArrayTypeBuilder };

export function array_type(element: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>): ArrayTypeBuilder {
  return new ArrayTypeBuilder(element);
}

export interface ArrayTypeOptions {
  nodeKind: 'array_type';
  element: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions;
  length?: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression> | UnaryExpressionOptions | ReferenceExpressionOptions | TryExpressionOptions | BinaryExpressionOptions | AssignmentExpressionOptions | CompoundAssignmentExprOptions | TypeCastExpressionOptions | CallExpressionOptions | ReturnExpressionOptions | YieldExpressionOptions | StringLiteralOptions | RawStringLiteralOptions | ScopedIdentifierOptions | GenericFunctionOptions | AwaitExpressionOptions | FieldExpressionOptions | ArrayExpressionOptions | TupleExpressionOptions | MacroInvocationOptions | BreakExpressionOptions | ContinueExpressionOptions | IndexExpressionOptions | ClosureExpressionOptions | ParenthesizedExpressionOptions | StructExpressionOptions | UnsafeBlockOptions | AsyncBlockOptions | GenBlockOptions | TryBlockOptions | BlockOptions | IfExpressionOptions | MatchExpressionOptions | WhileExpressionOptions | LoopExpressionOptions | ForExpressionOptions | ConstBlockOptions | RangeExpressionOptions;
}

export namespace array_type {
  export function from(options: Omit<ArrayTypeOptions, 'nodeKind'>): ArrayTypeBuilder {
    const _raw = options.element;
    let _ctor: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'abstract_type': _ctor = abstract_type.from(_raw); break;
        case 'reference_type': _ctor = reference_type.from(_raw); break;
        case 'pointer_type': _ctor = pointer_type.from(_raw); break;
        case 'generic_type': _ctor = generic_type.from(_raw); break;
        case 'scoped_type_identifier': _ctor = scoped_type_identifier.from(_raw); break;
        case 'tuple_type': _ctor = tuple_type.from(_raw); break;
        case 'function_type': _ctor = function_type.from(_raw); break;
        case 'macro_invocation': _ctor = macro_invocation.from(_raw); break;
        case 'dynamic_type': _ctor = dynamic_type.from(_raw); break;
        case 'bounded_type': _ctor = bounded_type.from(_raw); break;
        case 'removed_trait_bound': _ctor = removed_trait_bound.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new ArrayTypeBuilder(_ctor);
    if (options.length !== undefined) {
      const _v = options.length;
      if (_v instanceof Builder) {
        b.length(_v);
      } else {
        switch (_v.nodeKind) {
          case 'unary_expression': b.length(unary_expression.from(_v)); break;
          case 'reference_expression': b.length(reference_expression.from(_v)); break;
          case 'try_expression': b.length(try_expression.from(_v)); break;
          case 'binary_expression': b.length(binary_expression.from(_v)); break;
          case 'assignment_expression': b.length(assignment_expression.from(_v)); break;
          case 'compound_assignment_expr': b.length(compound_assignment_expr.from(_v)); break;
          case 'type_cast_expression': b.length(type_cast_expression.from(_v)); break;
          case 'call_expression': b.length(call_expression.from(_v)); break;
          case 'return_expression': b.length(return_expression.from(_v)); break;
          case 'yield_expression': b.length(yield_expression.from(_v)); break;
          case 'string_literal': b.length(string_literal.from(_v)); break;
          case 'raw_string_literal': b.length(raw_string_literal.from(_v)); break;
          case 'scoped_identifier': b.length(scoped_identifier.from(_v)); break;
          case 'generic_function': b.length(generic_function.from(_v)); break;
          case 'await_expression': b.length(await_expression.from(_v)); break;
          case 'field_expression': b.length(field_expression.from(_v)); break;
          case 'array_expression': b.length(array_expression.from(_v)); break;
          case 'tuple_expression': b.length(tuple_expression.from(_v)); break;
          case 'macro_invocation': b.length(macro_invocation.from(_v)); break;
          case 'break_expression': b.length(break_expression.from(_v)); break;
          case 'continue_expression': b.length(continue_expression.from(_v)); break;
          case 'index_expression': b.length(index_expression.from(_v)); break;
          case 'closure_expression': b.length(closure_expression.from(_v)); break;
          case 'parenthesized_expression': b.length(parenthesized_expression.from(_v)); break;
          case 'struct_expression': b.length(struct_expression.from(_v)); break;
          case 'unsafe_block': b.length(unsafe_block.from(_v)); break;
          case 'async_block': b.length(async_block.from(_v)); break;
          case 'gen_block': b.length(gen_block.from(_v)); break;
          case 'try_block': b.length(try_block.from(_v)); break;
          case 'block': b.length(block.from(_v)); break;
          case 'if_expression': b.length(if_expression.from(_v)); break;
          case 'match_expression': b.length(match_expression.from(_v)); break;
          case 'while_expression': b.length(while_expression.from(_v)); break;
          case 'loop_expression': b.length(loop_expression.from(_v)); break;
          case 'for_expression': b.length(for_expression.from(_v)); break;
          case 'const_block': b.length(const_block.from(_v)); break;
          case 'range_expression': b.length(range_expression.from(_v)); break;
        }
      }
    }
    return b;
  }
}
