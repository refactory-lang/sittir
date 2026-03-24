import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayType, BoundedType, DynamicType, FunctionType, GenericType, Lifetime, MacroInvocation, Metavariable, MutableSpecifier, NeverType, PointerType, PrimitiveType, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, TupleType, TypeIdentifier, UnitType } from '../types.js';
import { abstract_type } from './abstract-type.js';
import type { AbstractTypeOptions } from './abstract-type.js';
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


class ReferenceTypeBuilder extends Builder<ReferenceType> {
  private _type: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;
  private _children: Builder<Lifetime | MutableSpecifier>[] = [];

  constructor(type_: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>) {
    super();
    this._type = type_;
  }

  children(...value: Builder<Lifetime | MutableSpecifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('&');
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ReferenceType {
    return {
      kind: 'reference_type',
      type: this._type.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as ReferenceType;
  }

  override get nodeKind(): 'reference_type' { return 'reference_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '&', type: '&' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { ReferenceTypeBuilder };

export function reference_type(type_: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>): ReferenceTypeBuilder {
  return new ReferenceTypeBuilder(type_);
}

export interface ReferenceTypeOptions {
  nodeKind: 'reference_type';
  type: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions;
  children?: Builder<Lifetime | MutableSpecifier> | string | Omit<LifetimeOptions, 'nodeKind'> | (Builder<Lifetime | MutableSpecifier> | string | Omit<LifetimeOptions, 'nodeKind'>)[];
}

export namespace reference_type {
  export function from(options: Omit<ReferenceTypeOptions, 'nodeKind'>): ReferenceTypeBuilder {
    const _raw = options.type;
    let _ctor: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'abstract_type': _ctor = abstract_type.from(_raw); break;
        case 'pointer_type': _ctor = pointer_type.from(_raw); break;
        case 'generic_type': _ctor = generic_type.from(_raw); break;
        case 'scoped_type_identifier': _ctor = scoped_type_identifier.from(_raw); break;
        case 'tuple_type': _ctor = tuple_type.from(_raw); break;
        case 'array_type': _ctor = array_type.from(_raw); break;
        case 'function_type': _ctor = function_type.from(_raw); break;
        case 'macro_invocation': _ctor = macro_invocation.from(_raw); break;
        case 'dynamic_type': _ctor = dynamic_type.from(_raw); break;
        case 'bounded_type': _ctor = bounded_type.from(_raw); break;
        case 'removed_trait_bound': _ctor = removed_trait_bound.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new ReferenceTypeBuilder(_ctor);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('mutable_specifier', _x) : _x instanceof Builder ? _x : lifetime.from(_x)));
    }
    return b;
  }
}
