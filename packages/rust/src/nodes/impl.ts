import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayType, BoundedType, DeclarationList, DynamicType, FunctionType, GenericType, ImplItem, MacroInvocation, Metavariable, NeverType, PointerType, PrimitiveType, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, TupleType, TypeIdentifier, TypeParameters, UnitType, WhereClause } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { scoped_type_identifier } from './scoped-type-identifier.js';
import type { ScopedTypeIdentifierOptions } from './scoped-type-identifier.js';
import { generic_type } from './generic-type.js';
import type { GenericTypeOptions } from './generic-type.js';
import { abstract_type } from './abstract-type.js';
import type { AbstractTypeOptions } from './abstract-type.js';
import { reference_type } from './reference-type.js';
import type { ReferenceTypeOptions } from './reference-type.js';
import { pointer_type } from './pointer-type.js';
import type { PointerTypeOptions } from './pointer-type.js';
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
import { declaration_list } from './declaration-list.js';
import type { DeclarationListOptions } from './declaration-list.js';
import { where_clause } from './where-clause.js';
import type { WhereClauseOptions } from './where-clause.js';


class ImplBuilder extends Builder<ImplItem> {
  private _typeParameters?: Builder<TypeParameters>;
  private _trait?: Builder<TypeIdentifier | ScopedTypeIdentifier | GenericType>;
  private _type: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;
  private _body?: Builder<DeclarationList>;
  private _children: Builder<WhereClause>[] = [];

  constructor(type_: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>) {
    super();
    this._type = type_;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  trait(value: Builder<TypeIdentifier | ScopedTypeIdentifier | GenericType>): this {
    this._trait = value;
    return this;
  }

  body(value: Builder<DeclarationList>): this {
    this._body = value;
    return this;
  }

  children(...value: Builder<WhereClause>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('impl');
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._trait) {
      parts.push('!');
      if (this._trait) parts.push(this.renderChild(this._trait, ctx));
      parts.push('for');
    }
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImplItem {
    return {
      kind: 'impl_item',
      typeParameters: this._typeParameters ? this._typeParameters.build(ctx) : undefined,
      trait: this._trait ? this._trait.build(ctx) : undefined,
      type: this._type.build(ctx),
      body: this._body ? this._body.build(ctx) : undefined,
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as ImplItem;
  }

  override get nodeKind(): 'impl_item' { return 'impl_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'impl', type: 'impl' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._trait) {
      parts.push({ kind: 'token', text: '!', type: '!' });
      if (this._trait) parts.push({ kind: 'builder', builder: this._trait, fieldName: 'trait' });
      parts.push({ kind: 'token', text: 'for', type: 'for' });
    }
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ImplBuilder };

export function impl(type_: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>): ImplBuilder {
  return new ImplBuilder(type_);
}

export interface ImplItemOptions {
  nodeKind: 'impl_item';
  typeParameters?: Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'>;
  trait?: Builder<TypeIdentifier | ScopedTypeIdentifier | GenericType> | string | ScopedTypeIdentifierOptions | GenericTypeOptions;
  type: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions;
  body?: Builder<DeclarationList> | Omit<DeclarationListOptions, 'nodeKind'>;
  children?: Builder<WhereClause> | Omit<WhereClauseOptions, 'nodeKind'> | (Builder<WhereClause> | Omit<WhereClauseOptions, 'nodeKind'>)[];
}

export namespace impl {
  export function from(options: Omit<ImplItemOptions, 'nodeKind'>): ImplBuilder {
    const _raw = options.type;
    let _ctor: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'abstract_type': _ctor = abstract_type.from(_raw); break;
        case 'reference_type': _ctor = reference_type.from(_raw); break;
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
    const b = new ImplBuilder(_ctor);
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v));
    }
    if (options.trait !== undefined) {
      const _v = options.trait;
      if (typeof _v === 'string') {
        b.trait(new LeafBuilder('type_identifier', _v));
      } else if (_v instanceof Builder) {
        b.trait(_v);
      } else {
        switch (_v.nodeKind) {
          case 'scoped_type_identifier': b.trait(scoped_type_identifier.from(_v)); break;
          case 'generic_type': b.trait(generic_type.from(_v)); break;
        }
      }
    }
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : declaration_list.from(_v));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : where_clause.from(_x)));
    }
    return b;
  }
}
