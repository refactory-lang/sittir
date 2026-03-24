import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayType, BoundedType, DynamicType, FieldDeclaration, FieldIdentifier, FunctionType, GenericType, MacroInvocation, Metavariable, NeverType, PointerType, PrimitiveType, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, TupleType, TypeIdentifier, UnitType, VisibilityModifier } from '../types.js';
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
import { visibility_modifier } from './visibility-modifier.js';
import type { VisibilityModifierOptions } from './visibility-modifier.js';


class FieldDeclarationBuilder extends Builder<FieldDeclaration> {
  private _name: Builder<FieldIdentifier>;
  private _type!: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>;
  private _children: Builder<VisibilityModifier>[] = [];

  constructor(name: Builder<FieldIdentifier>) {
    super();
    this._name = name;
  }

  type(value: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>): this {
    this._type = value;
    return this;
  }

  children(...value: Builder<VisibilityModifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push(':');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FieldDeclaration {
    return {
      kind: 'field_declaration',
      name: this._name.build(ctx),
      type: this._type ? this._type.build(ctx) : undefined,
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as FieldDeclaration;
  }

  override get nodeKind(): 'field_declaration' { return 'field_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { FieldDeclarationBuilder };

export function field_declaration(name: Builder<FieldIdentifier>): FieldDeclarationBuilder {
  return new FieldDeclarationBuilder(name);
}

export interface FieldDeclarationOptions {
  nodeKind: 'field_declaration';
  name: Builder<FieldIdentifier> | string;
  type: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions;
  children?: Builder<VisibilityModifier> | Omit<VisibilityModifierOptions, 'nodeKind'> | (Builder<VisibilityModifier> | Omit<VisibilityModifierOptions, 'nodeKind'>)[];
}

export namespace field_declaration {
  export function from(options: Omit<FieldDeclarationOptions, 'nodeKind'>): FieldDeclarationBuilder {
    const _ctor = options.name;
    const b = new FieldDeclarationBuilder(typeof _ctor === 'string' ? new LeafBuilder('field_identifier', _ctor) : _ctor);
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
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : visibility_modifier.from(_x)));
    }
    return b;
  }
}
