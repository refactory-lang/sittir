import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayType, BoundedType, DynamicType, FunctionType, GenericType, Lifetime, MacroInvocation, Metavariable, NeverType, PointerType, PrimitiveType, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, TupleType, TypeIdentifier, UnitType, UseBounds } from '../types.js';
import { lifetime } from './lifetime.js';
import type { LifetimeOptions } from './lifetime.js';
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
import { removed_trait_bound } from './removed-trait-bound.js';
import type { RemovedTraitBoundOptions } from './removed-trait-bound.js';
import { use_bounds } from './use-bounds.js';
import type { UseBoundsOptions } from './use-bounds.js';


class BoundedTypeBuilder extends Builder<BoundedType> {
  private _children: Builder<Lifetime | AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | UseBounds>[] = [];

  constructor(...children: Builder<Lifetime | AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | UseBounds>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('+');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): BoundedType {
    return {
      kind: 'bounded_type',
      children: this._children.map(c => c.build(ctx)),
    } as BoundedType;
  }

  override get nodeKind(): 'bounded_type' { return 'bounded_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: '+', type: '+' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { BoundedTypeBuilder };

export function bounded_type(...children: Builder<Lifetime | AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | UseBounds>[]): BoundedTypeBuilder {
  return new BoundedTypeBuilder(...children);
}

export interface BoundedTypeOptions {
  nodeKind: 'bounded_type';
  children?: Builder<Lifetime | AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | UseBounds> | LifetimeOptions | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | RemovedTraitBoundOptions | UseBoundsOptions | (Builder<Lifetime | AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | UseBounds> | LifetimeOptions | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | RemovedTraitBoundOptions | UseBoundsOptions)[];
}

export namespace bounded_type {
  export function from(input: Omit<BoundedTypeOptions, 'nodeKind'> | Builder<Lifetime | AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | UseBounds> | LifetimeOptions | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | RemovedTraitBoundOptions | UseBoundsOptions | (Builder<Lifetime | AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType | UseBounds> | LifetimeOptions | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | RemovedTraitBoundOptions | UseBoundsOptions)[]): BoundedTypeBuilder {
    const options: Omit<BoundedTypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<BoundedTypeOptions, 'nodeKind'>
      : { children: input } as Omit<BoundedTypeOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new BoundedTypeBuilder(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'lifetime': return lifetime.from(_v);   case 'abstract_type': return abstract_type.from(_v);   case 'reference_type': return reference_type.from(_v);   case 'pointer_type': return pointer_type.from(_v);   case 'generic_type': return generic_type.from(_v);   case 'scoped_type_identifier': return scoped_type_identifier.from(_v);   case 'tuple_type': return tuple_type.from(_v);   case 'array_type': return array_type.from(_v);   case 'function_type': return function_type.from(_v);   case 'macro_invocation': return macro_invocation.from(_v);   case 'dynamic_type': return dynamic_type.from(_v);   case 'removed_trait_bound': return removed_trait_bound.from(_v);   case 'use_bounds': return use_bounds.from(_v); } throw new Error('unreachable'); }));
    return b;
  }
}
