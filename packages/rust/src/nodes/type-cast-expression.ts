import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayExpression, ArrayType, AssignmentExpression, AsyncBlock, AwaitExpression, BinaryExpression, Block, BooleanLiteral, BoundedType, BreakExpression, CallExpression, CharLiteral, ClosureExpression, CompoundAssignmentExpr, ConstBlock, ContinueExpression, DynamicType, FieldExpression, FloatLiteral, ForExpression, FunctionType, GenBlock, GenericFunction, GenericType, Identifier, IfExpression, IndexExpression, IntegerLiteral, LoopExpression, MacroInvocation, MatchExpression, Metavariable, NeverType, ParenthesizedExpression, PointerType, PrimitiveType, RangeExpression, RawStringLiteral, ReferenceExpression, ReferenceType, RemovedTraitBound, ReturnExpression, ScopedIdentifier, ScopedTypeIdentifier, Self, StringLiteral, StructExpression, TryBlock, TryExpression, TupleExpression, TupleType, TypeCastExpression, TypeIdentifier, UnaryExpression, UnitExpression, UnitType, UnsafeBlock, WhileExpression, YieldExpression } from '../types.js';
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
import { array_type } from './array-type.js';
import type { ArrayTypeOptions } from './array-type.js';
import { function_type } from './function-type.js';
import type { FunctionTypeOptions } from './function-type.js';
import { dynamic_type } from './dynamic-type.js';
import type { DynamicTypeOptions } from './dynamic-type.js';
import { bounded_type } from './bounded-type.js';
import type { BoundedTypeOptions } from './bounded-type.js';
import { removed_trait_bound } from './removed-trait-bound.js';
import type { RemovedTraitBoundOptions } from './removed-trait-bound.js';


class TypeCastExpressionBuilder extends Builder<TypeCastExpression> {
  private _value: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression>;
  private _type!: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;

  constructor(value: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression>) {
    super();
    this._value = value;
  }

  type(value: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    parts.push('as');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeCastExpression {
    return {
      kind: 'type_cast_expression',
      value: this._value.build(ctx),
      type: this._type ? this._type.build(ctx) : undefined,
    } as TypeCastExpression;
  }

  override get nodeKind(): 'type_cast_expression' { return 'type_cast_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    parts.push({ kind: 'token', text: 'as', type: 'as' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { TypeCastExpressionBuilder };

export function type_cast_expression(value: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression>): TypeCastExpressionBuilder {
  return new TypeCastExpressionBuilder(value);
}

export interface TypeCastExpressionOptions {
  nodeKind: 'type_cast_expression';
  value: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression> | UnaryExpressionOptions | ReferenceExpressionOptions | TryExpressionOptions | BinaryExpressionOptions | AssignmentExpressionOptions | CompoundAssignmentExprOptions | CallExpressionOptions | ReturnExpressionOptions | YieldExpressionOptions | StringLiteralOptions | RawStringLiteralOptions | ScopedIdentifierOptions | GenericFunctionOptions | AwaitExpressionOptions | FieldExpressionOptions | ArrayExpressionOptions | TupleExpressionOptions | MacroInvocationOptions | BreakExpressionOptions | ContinueExpressionOptions | IndexExpressionOptions | ClosureExpressionOptions | ParenthesizedExpressionOptions | StructExpressionOptions | UnsafeBlockOptions | AsyncBlockOptions | GenBlockOptions | TryBlockOptions | BlockOptions | IfExpressionOptions | MatchExpressionOptions | WhileExpressionOptions | LoopExpressionOptions | ForExpressionOptions | ConstBlockOptions | RangeExpressionOptions;
  type: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions;
}

export namespace type_cast_expression {
  export function from(options: Omit<TypeCastExpressionOptions, 'nodeKind'>): TypeCastExpressionBuilder {
    const _raw = options.value;
    let _ctor: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression>;
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
        case 'while_expression': _ctor = while_expression.from(_raw); break;
        case 'loop_expression': _ctor = loop_expression.from(_raw); break;
        case 'for_expression': _ctor = for_expression.from(_raw); break;
        case 'const_block': _ctor = const_block.from(_raw); break;
        case 'range_expression': _ctor = range_expression.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new TypeCastExpressionBuilder(_ctor);
    if (options.type !== undefined) {
      const _v = options.type;
      if (_v instanceof Builder) {
        b.type(_v);
      } else {
        switch (_v.nodeKind) {
          case 'abstract_type': b.type(abstract_type.from(_v)); break;
          case 'reference_type': b.type(reference_type.from(_v)); break;
          case 'pointer_type': b.type(pointer_type.from(_v)); break;
          case 'generic_type': b.type(generic_type.from(_v)); break;
          case 'scoped_type_identifier': b.type(scoped_type_identifier.from(_v)); break;
          case 'tuple_type': b.type(tuple_type.from(_v)); break;
          case 'array_type': b.type(array_type.from(_v)); break;
          case 'function_type': b.type(function_type.from(_v)); break;
          case 'macro_invocation': b.type(macro_invocation.from(_v)); break;
          case 'dynamic_type': b.type(dynamic_type.from(_v)); break;
          case 'bounded_type': b.type(bounded_type.from(_v)); break;
          case 'removed_trait_bound': b.type(removed_trait_bound.from(_v)); break;
        }
      }
    }
    return b;
  }
}
