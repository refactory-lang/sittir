import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayType, GenericType, HigherRankedTraitBound, Lifetime, PointerType, PrimitiveType, ReferenceType, ScopedTypeIdentifier, TraitBounds, TupleType, TypeIdentifier, WherePredicate } from '../types.js';
import { lifetime } from './lifetime.js';
import type { LifetimeOptions } from './lifetime.js';
import { scoped_type_identifier } from './scoped-type-identifier.js';
import type { ScopedTypeIdentifierOptions } from './scoped-type-identifier.js';
import { generic_type } from './generic-type.js';
import type { GenericTypeOptions } from './generic-type.js';
import { reference_type } from './reference-type.js';
import type { ReferenceTypeOptions } from './reference-type.js';
import { pointer_type } from './pointer-type.js';
import type { PointerTypeOptions } from './pointer-type.js';
import { tuple_type } from './tuple-type.js';
import type { TupleTypeOptions } from './tuple-type.js';
import { array_type } from './array-type.js';
import type { ArrayTypeOptions } from './array-type.js';
import { higher_ranked_trait_bound } from './higher-ranked-trait-bound.js';
import type { HigherRankedTraitBoundOptions } from './higher-ranked-trait-bound.js';
import { trait_bounds } from './trait-bounds.js';
import type { TraitBoundsOptions } from './trait-bounds.js';


class WherePredicateBuilder extends Builder<WherePredicate> {
  private _left: Builder<TypeIdentifier | Lifetime | ScopedTypeIdentifier | GenericType | ReferenceType | PointerType | TupleType | ArrayType | HigherRankedTraitBound | PrimitiveType>;
  private _bounds!: Builder<TraitBounds>;

  constructor(left: Builder<TypeIdentifier | Lifetime | ScopedTypeIdentifier | GenericType | ReferenceType | PointerType | TupleType | ArrayType | HigherRankedTraitBound | PrimitiveType>) {
    super();
    this._left = left;
  }

  bounds(value: Builder<TraitBounds>): this {
    this._bounds = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    if (this._bounds) parts.push(this.renderChild(this._bounds, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WherePredicate {
    return {
      kind: 'where_predicate',
      left: this._left.build(ctx),
      bounds: this._bounds ? this._bounds.build(ctx) : undefined,
    } as WherePredicate;
  }

  override get nodeKind(): 'where_predicate' { return 'where_predicate'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._bounds) parts.push({ kind: 'builder', builder: this._bounds, fieldName: 'bounds' });
    return parts;
  }
}

export type { WherePredicateBuilder };

export function where_predicate(left: Builder<TypeIdentifier | Lifetime | ScopedTypeIdentifier | GenericType | ReferenceType | PointerType | TupleType | ArrayType | HigherRankedTraitBound | PrimitiveType>): WherePredicateBuilder {
  return new WherePredicateBuilder(left);
}

export interface WherePredicateOptions {
  nodeKind: 'where_predicate';
  left: Builder<TypeIdentifier | Lifetime | ScopedTypeIdentifier | GenericType | ReferenceType | PointerType | TupleType | ArrayType | HigherRankedTraitBound | PrimitiveType> | LifetimeOptions | ScopedTypeIdentifierOptions | GenericTypeOptions | ReferenceTypeOptions | PointerTypeOptions | TupleTypeOptions | ArrayTypeOptions | HigherRankedTraitBoundOptions;
  bounds: Builder<TraitBounds> | Omit<TraitBoundsOptions, 'nodeKind'>;
}

export namespace where_predicate {
  export function from(options: Omit<WherePredicateOptions, 'nodeKind'>): WherePredicateBuilder {
    const _raw = options.left;
    let _ctor: Builder<TypeIdentifier | Lifetime | ScopedTypeIdentifier | GenericType | ReferenceType | PointerType | TupleType | ArrayType | HigherRankedTraitBound | PrimitiveType>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'lifetime': _ctor = lifetime.from(_raw); break;
        case 'scoped_type_identifier': _ctor = scoped_type_identifier.from(_raw); break;
        case 'generic_type': _ctor = generic_type.from(_raw); break;
        case 'reference_type': _ctor = reference_type.from(_raw); break;
        case 'pointer_type': _ctor = pointer_type.from(_raw); break;
        case 'tuple_type': _ctor = tuple_type.from(_raw); break;
        case 'array_type': _ctor = array_type.from(_raw); break;
        case 'higher_ranked_trait_bound': _ctor = higher_ranked_trait_bound.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new WherePredicateBuilder(_ctor);
    if (options.bounds !== undefined) {
      const _v = options.bounds;
      b.bounds(_v instanceof Builder ? _v : trait_bounds.from(_v));
    }
    return b;
  }
}
