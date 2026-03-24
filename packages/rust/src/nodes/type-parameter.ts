import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayType, BoundedType, DynamicType, FunctionType, GenericType, MacroInvocation, Metavariable, NeverType, PointerType, PrimitiveType, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, TraitBounds, TupleType, TypeIdentifier, TypeParameter, UnitType } from '../types.js';
import { trait_bounds } from './trait-bounds.js';
import type { TraitBoundsOptions } from './trait-bounds.js';
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


class TypeParameterBuilder extends Builder<TypeParameter> {
  private _name: Builder<TypeIdentifier>;
  private _bounds?: Builder<TraitBounds>;
  private _defaultType?: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  bounds(value: Builder<TraitBounds>): this {
    this._bounds = value;
    return this;
  }

  defaultType(value: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>): this {
    this._defaultType = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._bounds) parts.push(this.renderChild(this._bounds, ctx));
    if (this._defaultType) {
      parts.push('=');
      if (this._defaultType) parts.push(this.renderChild(this._defaultType, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeParameter {
    return {
      kind: 'type_parameter',
      name: this._name.build(ctx),
      bounds: this._bounds ? this._bounds.build(ctx) : undefined,
      defaultType: this._defaultType ? this._defaultType.build(ctx) : undefined,
    } as TypeParameter;
  }

  override get nodeKind(): 'type_parameter' { return 'type_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._bounds) parts.push({ kind: 'builder', builder: this._bounds, fieldName: 'bounds' });
    if (this._defaultType) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._defaultType) parts.push({ kind: 'builder', builder: this._defaultType, fieldName: 'defaultType' });
    }
    return parts;
  }
}

export type { TypeParameterBuilder };

export function type_parameter(name: Builder<TypeIdentifier>): TypeParameterBuilder {
  return new TypeParameterBuilder(name);
}

export interface TypeParameterOptions {
  nodeKind: 'type_parameter';
  name: Builder<TypeIdentifier> | string;
  bounds?: Builder<TraitBounds> | Omit<TraitBoundsOptions, 'nodeKind'>;
  defaultType?: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions;
}

export namespace type_parameter {
  export function from(options: Omit<TypeParameterOptions, 'nodeKind'>): TypeParameterBuilder {
    const _ctor = options.name;
    const b = new TypeParameterBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.bounds !== undefined) {
      const _v = options.bounds;
      b.bounds(_v instanceof Builder ? _v : trait_bounds.from(_v));
    }
    if (options.defaultType !== undefined) {
      const _v = options.defaultType;
      if (_v instanceof Builder) {
        b.defaultType(_v);
      } else {
        switch (_v.nodeKind) {
          case 'abstract_type': b.defaultType(abstract_type.from(_v)); break;
          case 'reference_type': b.defaultType(reference_type.from(_v)); break;
          case 'pointer_type': b.defaultType(pointer_type.from(_v)); break;
          case 'generic_type': b.defaultType(generic_type.from(_v)); break;
          case 'scoped_type_identifier': b.defaultType(scoped_type_identifier.from(_v)); break;
          case 'tuple_type': b.defaultType(tuple_type.from(_v)); break;
          case 'array_type': b.defaultType(array_type.from(_v)); break;
          case 'function_type': b.defaultType(function_type.from(_v)); break;
          case 'macro_invocation': b.defaultType(macro_invocation.from(_v)); break;
          case 'dynamic_type': b.defaultType(dynamic_type.from(_v)); break;
          case 'bounded_type': b.defaultType(bounded_type.from(_v)); break;
          case 'removed_trait_bound': b.defaultType(removed_trait_bound.from(_v)); break;
        }
      }
    }
    return b;
  }
}
