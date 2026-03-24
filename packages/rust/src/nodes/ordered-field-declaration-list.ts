import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractType, ArrayType, AttributeItem, BoundedType, DynamicType, FunctionType, GenericType, MacroInvocation, Metavariable, NeverType, OrderedFieldDeclarationList, PointerType, PrimitiveType, ReferenceType, RemovedTraitBound, ScopedTypeIdentifier, TupleType, TypeIdentifier, UnitType, VisibilityModifier } from '../types.js';
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
import { attribute } from './attribute-item.js';
import type { AttributeItemOptions } from './attribute-item.js';
import { visibility_modifier } from './visibility-modifier.js';
import type { VisibilityModifierOptions } from './visibility-modifier.js';


class OrderedFieldDeclarationListBuilder extends Builder<OrderedFieldDeclarationList> {
  private _type: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>[] = [];
  private _children: Builder<AttributeItem | VisibilityModifier>[] = [];

  constructor() { super(); }

  type(...value: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType>[]): this {
    this._type = value;
    return this;
  }

  children(...value: Builder<AttributeItem | VisibilityModifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._type.length > 0) {
      if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
      if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
      if (this._type.length > 0) parts.push(this.renderChildren(this._type, ', ', ctx));
      parts.push(',');
      if (this._children[2]) parts.push(this.renderChild(this._children[2]!, ctx));
      if (this._children[3]) parts.push(this.renderChild(this._children[3]!, ctx));
    }
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): OrderedFieldDeclarationList {
    return {
      kind: 'ordered_field_declaration_list',
      type: this._type.map(c => c.build(ctx)),
      children: this._children.map(c => c.build(ctx)),
    } as OrderedFieldDeclarationList;
  }

  override get nodeKind(): 'ordered_field_declaration_list' { return 'ordered_field_declaration_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._type.length > 0) {
      if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
      if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
      for (const child of this._type) {
        parts.push({ kind: 'builder', builder: child, fieldName: 'type' });
      }
      parts.push({ kind: 'token', text: ',', type: ',' });
      if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
      if (this._children[3]) parts.push({ kind: 'builder', builder: this._children[3]! });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { OrderedFieldDeclarationListBuilder };

export function ordered_field_declaration_list(): OrderedFieldDeclarationListBuilder {
  return new OrderedFieldDeclarationListBuilder();
}

export interface OrderedFieldDeclarationListOptions {
  nodeKind: 'ordered_field_declaration_list';
  type?: Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions | (Builder<AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | NeverType | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType> | AbstractTypeOptions | ReferenceTypeOptions | PointerTypeOptions | GenericTypeOptions | ScopedTypeIdentifierOptions | TupleTypeOptions | ArrayTypeOptions | FunctionTypeOptions | MacroInvocationOptions | DynamicTypeOptions | BoundedTypeOptions | RemovedTraitBoundOptions)[];
  children?: Builder<AttributeItem | VisibilityModifier> | AttributeItemOptions | VisibilityModifierOptions | (Builder<AttributeItem | VisibilityModifier> | AttributeItemOptions | VisibilityModifierOptions)[];
}

export namespace ordered_field_declaration_list {
  export function from(options: Omit<OrderedFieldDeclarationListOptions, 'nodeKind'>): OrderedFieldDeclarationListBuilder {
    const b = new OrderedFieldDeclarationListBuilder();
    if (options.type !== undefined) {
      const _v = options.type;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.type(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'abstract_type': return abstract_type.from(_v);   case 'reference_type': return reference_type.from(_v);   case 'pointer_type': return pointer_type.from(_v);   case 'generic_type': return generic_type.from(_v);   case 'scoped_type_identifier': return scoped_type_identifier.from(_v);   case 'tuple_type': return tuple_type.from(_v);   case 'array_type': return array_type.from(_v);   case 'function_type': return function_type.from(_v);   case 'macro_invocation': return macro_invocation.from(_v);   case 'dynamic_type': return dynamic_type.from(_v);   case 'bounded_type': return bounded_type.from(_v);   case 'removed_trait_bound': return removed_trait_bound.from(_v); } throw new Error('unreachable'); }));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'attribute_item': return attribute.from(_v);   case 'visibility_modifier': return visibility_modifier.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
