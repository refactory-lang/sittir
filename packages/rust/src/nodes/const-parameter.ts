import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayType, Block, BooleanLiteral, BoundedType, CharLiteral, ConstParameter, DynamicType, FloatLiteral, FunctionType, GenericType, Identifier, IntegerLiteral, MacroInvocation, Metavariable, NegativeLiteral, NeverType, PointerType, PrimitiveType, RawStringLiteral, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, StringLiteral, TupleType, TypeIdentifier, UnitType } from '../types.js';
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
import { string_literal } from './string-literal.js';
import type { StringLiteralOptions } from './string-literal.js';
import { raw_string_literal } from './raw-string-literal.js';
import type { RawStringLiteralOptions } from './raw-string-literal.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';
import { negative_literal } from './negative-literal.js';
import type { NegativeLiteralOptions } from './negative-literal.js';


class ConstParameterBuilder extends Builder<ConstParameter> {
  private _name: Builder<Identifier>;
  private _type!: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;
  private _value?: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Block | Identifier | NegativeLiteral>;

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
  }

  type(value: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>): this {
    this._type = value;
    return this;
  }

  value(value: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Block | Identifier | NegativeLiteral>): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('const');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push(':');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._value) {
      parts.push('=');
      if (this._value) parts.push(this.renderChild(this._value, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ConstParameter {
    return {
      kind: 'const_parameter',
      name: this._name.build(ctx),
      type: this._type ? this._type.build(ctx) : undefined,
      value: this._value ? this._value.build(ctx) : undefined,
    } as ConstParameter;
  }

  override get nodeKind(): 'const_parameter' { return 'const_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'const', type: 'const' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    return parts;
  }
}

export type { ConstParameterBuilder };

export function const_parameter(name: Builder<Identifier>): ConstParameterBuilder {
  return new ConstParameterBuilder(name);
}

export interface ConstParameterOptions {
  nodeKind: 'const_parameter';
  name: Builder<Identifier> | string;
  type: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions;
  value?: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Block | Identifier | NegativeLiteral> | StringLiteralOptions | RawStringLiteralOptions | BlockOptions | NegativeLiteralOptions;
}

export namespace const_parameter {
  export function from(options: Omit<ConstParameterOptions, 'nodeKind'>): ConstParameterBuilder {
    const _ctor = options.name;
    const b = new ConstParameterBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
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
    if (options.value !== undefined) {
      const _v = options.value;
      if (_v instanceof Builder) {
        b.value(_v);
      } else {
        switch (_v.nodeKind) {
          case 'string_literal': b.value(string_literal.from(_v)); break;
          case 'raw_string_literal': b.value(raw_string_literal.from(_v)); break;
          case 'block': b.value(block.from(_v)); break;
          case 'negative_literal': b.value(negative_literal.from(_v)); break;
        }
      }
    }
    return b;
  }
}
