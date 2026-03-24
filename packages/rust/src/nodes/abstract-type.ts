import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, BoundedType, FunctionType, GenericType, RemovedTraitBound, ScopedTypeIdentifier, TupleType, TypeIdentifier, TypeParameters } from '../types.js';
import { scoped_type_identifier } from './scoped-type-identifier.js';
import type { ScopedTypeIdentifierOptions } from './scoped-type-identifier.js';
import { removed_trait_bound } from './removed-trait-bound.js';
import type { RemovedTraitBoundOptions } from './removed-trait-bound.js';
import { generic_type } from './generic-type.js';
import type { GenericTypeOptions } from './generic-type.js';
import { function_type } from './function-type.js';
import type { FunctionTypeOptions } from './function-type.js';
import { tuple_type } from './tuple-type.js';
import type { TupleTypeOptions } from './tuple-type.js';
import { bounded_type } from './bounded-type.js';
import type { BoundedTypeOptions } from './bounded-type.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';


class AbstractTypeBuilder extends Builder<AbstractType> {
  private _trait: Builder<TypeIdentifier | ScopedTypeIdentifier | RemovedTraitBound | GenericType | FunctionType | TupleType | BoundedType>;
  private _children: Builder<TypeParameters>[] = [];

  constructor(trait: Builder<TypeIdentifier | ScopedTypeIdentifier | RemovedTraitBound | GenericType | FunctionType | TupleType | BoundedType>) {
    super();
    this._trait = trait;
  }

  children(...value: Builder<TypeParameters>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('impl');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._trait) parts.push(this.renderChild(this._trait, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AbstractType {
    return {
      kind: 'abstract_type',
      trait: this._trait.build(ctx),
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as AbstractType;
  }

  override get nodeKind(): 'abstract_type' { return 'abstract_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'impl', type: 'impl' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._trait) parts.push({ kind: 'builder', builder: this._trait, fieldName: 'trait' });
    return parts;
  }
}

export type { AbstractTypeBuilder };

export function abstract_type(trait: Builder<TypeIdentifier | ScopedTypeIdentifier | RemovedTraitBound | GenericType | FunctionType | TupleType | BoundedType>): AbstractTypeBuilder {
  return new AbstractTypeBuilder(trait);
}

export interface AbstractTypeOptions {
  nodeKind: 'abstract_type';
  trait: Builder<TypeIdentifier | ScopedTypeIdentifier | RemovedTraitBound | GenericType | FunctionType | TupleType | BoundedType> | ScopedTypeIdentifierOptions | RemovedTraitBoundOptions | GenericTypeOptions | FunctionTypeOptions | TupleTypeOptions | BoundedTypeOptions;
  children?: Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'> | (Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'>)[];
}

export namespace abstract_type {
  export function from(options: Omit<AbstractTypeOptions, 'nodeKind'>): AbstractTypeBuilder {
    const _raw = options.trait;
    let _ctor: Builder<TypeIdentifier | ScopedTypeIdentifier | RemovedTraitBound | GenericType | FunctionType | TupleType | BoundedType>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'scoped_type_identifier': _ctor = scoped_type_identifier.from(_raw); break;
        case 'removed_trait_bound': _ctor = removed_trait_bound.from(_raw); break;
        case 'generic_type': _ctor = generic_type.from(_raw); break;
        case 'function_type': _ctor = function_type.from(_raw); break;
        case 'tuple_type': _ctor = tuple_type.from(_raw); break;
        case 'bounded_type': _ctor = bounded_type.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new AbstractTypeBuilder(_ctor);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : type_parameters.from(_x)));
    }
    return b;
  }
}
