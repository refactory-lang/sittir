import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldDeclarationList, OrderedFieldDeclarationList, StructItem, TypeIdentifier, TypeParameters, VisibilityModifier, WhereClause } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { field_declaration_list } from './field-declaration-list.js';
import type { FieldDeclarationListOptions } from './field-declaration-list.js';
import { ordered_field_declaration_list } from './ordered-field-declaration-list.js';
import type { OrderedFieldDeclarationListOptions } from './ordered-field-declaration-list.js';
import { visibility_modifier } from './visibility-modifier.js';
import type { VisibilityModifierOptions } from './visibility-modifier.js';
import { where_clause } from './where-clause.js';
import type { WhereClauseOptions } from './where-clause.js';


class StructBuilder extends Builder<StructItem> {
  private _name: Builder<TypeIdentifier>;
  private _typeParameters?: Builder<TypeParameters>;
  private _body?: Builder<FieldDeclarationList | OrderedFieldDeclarationList>;
  private _children: Builder<VisibilityModifier | WhereClause>[] = [];

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  body(value: Builder<FieldDeclarationList | OrderedFieldDeclarationList>): this {
    this._body = value;
    return this;
  }

  children(...value: Builder<VisibilityModifier | WhereClause>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('struct');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): StructItem {
    return {
      kind: 'struct_item',
      name: this._name.build(ctx),
      typeParameters: this._typeParameters ? this._typeParameters.build(ctx) : undefined,
      body: this._body ? this._body.build(ctx) : undefined,
      children: this._children.map(c => c.build(ctx)),
    } as StructItem;
  }

  override get nodeKind(): 'struct_item' { return 'struct_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: 'struct', type: 'struct' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { StructBuilder };

export function struct_(name: Builder<TypeIdentifier>): StructBuilder {
  return new StructBuilder(name);
}

export interface StructItemOptions {
  nodeKind: 'struct_item';
  name: Builder<TypeIdentifier> | string;
  typeParameters?: Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'>;
  body?: Builder<FieldDeclarationList | OrderedFieldDeclarationList> | FieldDeclarationListOptions | OrderedFieldDeclarationListOptions;
  children?: Builder<VisibilityModifier | WhereClause> | VisibilityModifierOptions | WhereClauseOptions | (Builder<VisibilityModifier | WhereClause> | VisibilityModifierOptions | WhereClauseOptions)[];
}

export namespace struct_ {
  export function from(options: Omit<StructItemOptions, 'nodeKind'>): StructBuilder {
    const _ctor = options.name;
    const b = new StructBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v));
    }
    if (options.body !== undefined) {
      const _v = options.body;
      if (_v instanceof Builder) {
        b.body(_v);
      } else {
        switch (_v.nodeKind) {
          case 'field_declaration_list': b.body(field_declaration_list.from(_v)); break;
          case 'ordered_field_declaration_list': b.body(ordered_field_declaration_list.from(_v)); break;
        }
      }
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'visibility_modifier': return visibility_modifier.from(_v);   case 'where_clause': return where_clause.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
