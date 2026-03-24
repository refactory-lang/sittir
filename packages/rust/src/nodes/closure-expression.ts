import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayExpression, ArrayType, AssignmentExpression, AsyncBlock, AwaitExpression, BinaryExpression, Block, BooleanLiteral, BoundedType, BreakExpression, CallExpression, CharLiteral, ClosureExpression, ClosureParameters, CompoundAssignmentExpr, ConstBlock, ContinueExpression, DynamicType, FieldExpression, FloatLiteral, ForExpression, FunctionType, GenBlock, GenericFunction, GenericType, Identifier, IfExpression, IndexExpression, IntegerLiteral, LoopExpression, MacroInvocation, MatchExpression, Metavariable, NeverType, ParenthesizedExpression, PointerType, PrimitiveType, RangeExpression, RawStringLiteral, ReferenceExpression, ReferenceType, RemovedTraitBound, ReturnExpression, ScopedIdentifier, ScopedTypeIdentifier, Self, StringLiteral, StructExpression, TryBlock, TryExpression, TupleExpression, TupleType, TypeCastExpression, TypeIdentifier, UnaryExpression, UnitExpression, UnitType, UnsafeBlock, WhileExpression, YieldExpression } from '../types.js';
import { closure_parameters } from './closure-parameters.js';
import type { ClosureParametersOptions } from './closure-parameters.js';
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


class ClosureExpressionBuilder extends Builder<ClosureExpression> {
  private _parameters: Builder<ClosureParameters>;
  private _returnType?: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;
  private _body!: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression>;

  constructor(parameters: Builder<ClosureParameters>) {
    super();
    this._parameters = parameters;
  }

  returnType(value: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>): this {
    this._returnType = value;
    return this;
  }

  body(value: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) {
      parts.push('->');
      if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    }
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ClosureExpression {
    return {
      kind: 'closure_expression',
      parameters: this._parameters.build(ctx),
      returnType: this._returnType ? this._returnType.build(ctx) : undefined,
      body: this._body ? this._body.build(ctx) : undefined,
    } as ClosureExpression;
  }

  override get nodeKind(): 'closure_expression' { return 'closure_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) {
      parts.push({ kind: 'token', text: '->', type: '->' });
      if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    }
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ClosureExpressionBuilder };

export function closure_expression(parameters: Builder<ClosureParameters>): ClosureExpressionBuilder {
  return new ClosureExpressionBuilder(parameters);
}

export interface ClosureExpressionOptions {
  nodeKind: 'closure_expression';
  parameters: Builder<ClosureParameters> | Omit<ClosureParametersOptions, 'nodeKind'>;
  returnType?: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions;
  body: Builder<UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression> | UnaryExpressionOptions | ReferenceExpressionOptions | TryExpressionOptions | BinaryExpressionOptions | AssignmentExpressionOptions | CompoundAssignmentExprOptions | TypeCastExpressionOptions | CallExpressionOptions | ReturnExpressionOptions | YieldExpressionOptions | StringLiteralOptions | RawStringLiteralOptions | ScopedIdentifierOptions | GenericFunctionOptions | AwaitExpressionOptions | FieldExpressionOptions | ArrayExpressionOptions | TupleExpressionOptions | MacroInvocationOptions | BreakExpressionOptions | ContinueExpressionOptions | IndexExpressionOptions | ParenthesizedExpressionOptions | StructExpressionOptions | UnsafeBlockOptions | AsyncBlockOptions | GenBlockOptions | TryBlockOptions | BlockOptions | IfExpressionOptions | MatchExpressionOptions | WhileExpressionOptions | LoopExpressionOptions | ForExpressionOptions | ConstBlockOptions | RangeExpressionOptions;
}

export namespace closure_expression {
  export function from(options: Omit<ClosureExpressionOptions, 'nodeKind'>): ClosureExpressionBuilder {
    const _ctor = options.parameters;
    const b = new ClosureExpressionBuilder(_ctor instanceof Builder ? _ctor : closure_parameters.from(_ctor));
    if (options.returnType !== undefined) {
      const _v = options.returnType;
      if (_v instanceof Builder) {
        b.returnType(_v);
      } else {
        switch (_v.nodeKind) {
          case 'abstract_type': b.returnType(abstract_type.from(_v)); break;
          case 'reference_type': b.returnType(reference_type.from(_v)); break;
          case 'pointer_type': b.returnType(pointer_type.from(_v)); break;
          case 'generic_type': b.returnType(generic_type.from(_v)); break;
          case 'scoped_type_identifier': b.returnType(scoped_type_identifier.from(_v)); break;
          case 'tuple_type': b.returnType(tuple_type.from(_v)); break;
          case 'array_type': b.returnType(array_type.from(_v)); break;
          case 'function_type': b.returnType(function_type.from(_v)); break;
          case 'macro_invocation': b.returnType(macro_invocation.from(_v)); break;
          case 'dynamic_type': b.returnType(dynamic_type.from(_v)); break;
          case 'bounded_type': b.returnType(bounded_type.from(_v)); break;
          case 'removed_trait_bound': b.returnType(removed_trait_bound.from(_v)); break;
        }
      }
    }
    if (options.body !== undefined) {
      const _v = options.body;
      if (_v instanceof Builder) {
        b.body(_v);
      } else {
        switch (_v.nodeKind) {
          case 'unary_expression': b.body(unary_expression.from(_v)); break;
          case 'reference_expression': b.body(reference_expression.from(_v)); break;
          case 'try_expression': b.body(try_expression.from(_v)); break;
          case 'binary_expression': b.body(binary_expression.from(_v)); break;
          case 'assignment_expression': b.body(assignment_expression.from(_v)); break;
          case 'compound_assignment_expr': b.body(compound_assignment_expr.from(_v)); break;
          case 'type_cast_expression': b.body(type_cast_expression.from(_v)); break;
          case 'call_expression': b.body(call_expression.from(_v)); break;
          case 'return_expression': b.body(return_expression.from(_v)); break;
          case 'yield_expression': b.body(yield_expression.from(_v)); break;
          case 'string_literal': b.body(string_literal.from(_v)); break;
          case 'raw_string_literal': b.body(raw_string_literal.from(_v)); break;
          case 'scoped_identifier': b.body(scoped_identifier.from(_v)); break;
          case 'generic_function': b.body(generic_function.from(_v)); break;
          case 'await_expression': b.body(await_expression.from(_v)); break;
          case 'field_expression': b.body(field_expression.from(_v)); break;
          case 'array_expression': b.body(array_expression.from(_v)); break;
          case 'tuple_expression': b.body(tuple_expression.from(_v)); break;
          case 'macro_invocation': b.body(macro_invocation.from(_v)); break;
          case 'break_expression': b.body(break_expression.from(_v)); break;
          case 'continue_expression': b.body(continue_expression.from(_v)); break;
          case 'index_expression': b.body(index_expression.from(_v)); break;
          case 'parenthesized_expression': b.body(parenthesized_expression.from(_v)); break;
          case 'struct_expression': b.body(struct_expression.from(_v)); break;
          case 'unsafe_block': b.body(unsafe_block.from(_v)); break;
          case 'async_block': b.body(async_block.from(_v)); break;
          case 'gen_block': b.body(gen_block.from(_v)); break;
          case 'try_block': b.body(try_block.from(_v)); break;
          case 'block': b.body(block.from(_v)); break;
          case 'if_expression': b.body(if_expression.from(_v)); break;
          case 'match_expression': b.body(match_expression.from(_v)); break;
          case 'while_expression': b.body(while_expression.from(_v)); break;
          case 'loop_expression': b.body(loop_expression.from(_v)); break;
          case 'for_expression': b.body(for_expression.from(_v)); break;
          case 'const_block': b.body(const_block.from(_v)); break;
          case 'range_expression': b.body(range_expression.from(_v)); break;
        }
      }
    }
    return b;
  }
}
