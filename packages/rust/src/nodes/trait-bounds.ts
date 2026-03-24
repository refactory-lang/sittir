import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayType, BoundedType, DynamicType, FunctionType, GenericType, HigherRankedTraitBound, Lifetime, MacroInvocation, Metavariable, NeverType, PointerType, PrimitiveType, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, TraitBounds, TupleType, TypeIdentifier, UnitType } from '../types.js';
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
import { lifetime } from './lifetime.js';
import type { LifetimeOptions } from './lifetime.js';
import { higher_ranked_trait_bound } from './higher-ranked-trait-bound.js';
import type { HigherRankedTraitBoundOptions } from './higher-ranked-trait-bound.js';


class TraitBoundsBuilder extends Builder<TraitBounds> {
  private _children: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | Lifetime | HigherRankedTraitBound>[] = [];

  constructor(...children: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | Lifetime | HigherRankedTraitBound>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push(':');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' + ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TraitBounds {
    return {
      kind: 'trait_bounds',
      children: this._children.map(c => c.build(ctx)),
    } as TraitBounds;
  }

  override get nodeKind(): 'trait_bounds' { return 'trait_bounds'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: ':', type: ':' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: '+', type: '+' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { TraitBoundsBuilder };

export function trait_bounds(...children: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | Lifetime | HigherRankedTraitBound>[]): TraitBoundsBuilder {
  return new TraitBoundsBuilder(...children);
}

export interface TraitBoundsOptions {
  nodeKind: 'trait_bounds';
  children?: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | Lifetime | HigherRankedTraitBound> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions | LifetimeOptions | HigherRankedTraitBoundOptions | (Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | Lifetime | HigherRankedTraitBound> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions | LifetimeOptions | HigherRankedTraitBoundOptions)[];
}

export namespace trait_bounds {
  export function from(input: Omit<TraitBoundsOptions, 'nodeKind'> | Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | Lifetime | HigherRankedTraitBound> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions | LifetimeOptions | HigherRankedTraitBoundOptions | (Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | Lifetime | HigherRankedTraitBound> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions | LifetimeOptions | HigherRankedTraitBoundOptions)[]): TraitBoundsBuilder {
    const options: Omit<TraitBoundsOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TraitBoundsOptions, 'nodeKind'>
      : { children: input } as Omit<TraitBoundsOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new TraitBoundsBuilder(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'abstract_type': return abstract_type.from(_v);   case 'reference_type': return reference_type.from(_v);   case 'pointer_type': return pointer_type.from(_v);   case 'generic_type': return generic_type.from(_v);   case 'scoped_type_identifier': return scoped_type_identifier.from(_v);   case 'tuple_type': return tuple_type.from(_v);   case 'array_type': return array_type.from(_v);   case 'function_type': return function_type.from(_v);   case 'macro_invocation': return macro_invocation.from(_v);   case 'dynamic_type': return dynamic_type.from(_v);   case 'bounded_type': return bounded_type.from(_v);   case 'removed_trait_bound': return removed_trait_bound.from(_v);   case 'lifetime': return lifetime.from(_v);   case 'higher_ranked_trait_bound': return higher_ranked_trait_bound.from(_v); } throw new Error('unreachable'); }));
    return b;
  }
}
