import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayType, BoundedType, DynamicType, FunctionType, GenericType, HigherRankedTraitBound, MacroInvocation, Metavariable, NeverType, PointerType, PrimitiveType, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, TupleType, TypeIdentifier, TypeParameters, UnitType } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
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


class HigherRankedTraitBoundBuilder extends Builder<HigherRankedTraitBound> {
  private _typeParameters: Builder<TypeParameters>;
  private _type!: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;

  constructor(typeParameters: Builder<TypeParameters>) {
    super();
    this._typeParameters = typeParameters;
  }

  type(value: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('for');
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): HigherRankedTraitBound {
    return {
      kind: 'higher_ranked_trait_bound',
      typeParameters: this._typeParameters.build(ctx),
      type: this._type ? this._type.build(ctx) : undefined,
    } as HigherRankedTraitBound;
  }

  override get nodeKind(): 'higher_ranked_trait_bound' { return 'higher_ranked_trait_bound'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'for', type: 'for' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { HigherRankedTraitBoundBuilder };

export function higher_ranked_trait_bound(typeParameters: Builder<TypeParameters>): HigherRankedTraitBoundBuilder {
  return new HigherRankedTraitBoundBuilder(typeParameters);
}

export interface HigherRankedTraitBoundOptions {
  nodeKind: 'higher_ranked_trait_bound';
  typeParameters: Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'>;
  type: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions;
}

export namespace higher_ranked_trait_bound {
  export function from(options: Omit<HigherRankedTraitBoundOptions, 'nodeKind'>): HigherRankedTraitBoundBuilder {
    const _ctor = options.typeParameters;
    const b = new HigherRankedTraitBoundBuilder(_ctor instanceof Builder ? _ctor : type_parameters.from(_ctor));
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
