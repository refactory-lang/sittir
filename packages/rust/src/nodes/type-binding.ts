import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayType, BoundedType, DynamicType, FunctionType, GenericType, MacroInvocation, Metavariable, NeverType, PointerType, PrimitiveType, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, TupleType, TypeArguments, TypeBinding, TypeIdentifier, UnitType } from '../types.js';
import { type_arguments } from './type-arguments.js';
import type { TypeArgumentsOptions } from './type-arguments.js';
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


class TypeBindingBuilder extends Builder<TypeBinding> {
  private _name: Builder<TypeIdentifier>;
  private _typeArguments?: Builder<TypeArguments>;
  private _type!: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  typeArguments(value: Builder<TypeArguments>): this {
    this._typeArguments = value;
    return this;
  }

  type(value: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    parts.push('=');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeBinding {
    return {
      kind: 'type_binding',
      name: this._name.build(ctx),
      typeArguments: this._typeArguments ? this._typeArguments.build(ctx) : undefined,
      type: this._type ? this._type.build(ctx) : undefined,
    } as TypeBinding;
  }

  override get nodeKind(): 'type_binding' { return 'type_binding'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { TypeBindingBuilder };

export function type_binding(name: Builder<TypeIdentifier>): TypeBindingBuilder {
  return new TypeBindingBuilder(name);
}

export interface TypeBindingOptions {
  nodeKind: 'type_binding';
  name: Builder<TypeIdentifier> | string;
  typeArguments?: Builder<TypeArguments> | Omit<TypeArgumentsOptions, 'nodeKind'>;
  type: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions;
}

export namespace type_binding {
  export function from(options: Omit<TypeBindingOptions, 'nodeKind'>): TypeBindingBuilder {
    const _ctor = options.name;
    const b = new TypeBindingBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.typeArguments !== undefined) {
      const _v = options.typeArguments;
      b.typeArguments(_v instanceof Builder ? _v : type_arguments.from(_v));
    }
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
