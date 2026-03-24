import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EnumItem, EnumVariantList, TypeIdentifier, TypeParameters, VisibilityModifier, WhereClause } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { enum_variant_list } from './enum-variant-list.js';
import type { EnumVariantListOptions } from './enum-variant-list.js';
import { visibility_modifier } from './visibility-modifier.js';
import type { VisibilityModifierOptions } from './visibility-modifier.js';
import { where_clause } from './where-clause.js';
import type { WhereClauseOptions } from './where-clause.js';


class EnumBuilder extends Builder<EnumItem> {
  private _name: Builder<TypeIdentifier>;
  private _typeParameters?: Builder<TypeParameters>;
  private _body!: Builder<EnumVariantList>;
  private _children: Builder<VisibilityModifier | WhereClause>[] = [];

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  body(value: Builder<EnumVariantList>): this {
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
    parts.push('enum');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): EnumItem {
    return {
      kind: 'enum_item',
      name: this._name.build(ctx),
      typeParameters: this._typeParameters ? this._typeParameters.build(ctx) : undefined,
      body: this._body ? this._body.build(ctx) : undefined,
      children: this._children.map(c => c.build(ctx)),
    } as EnumItem;
  }

  override get nodeKind(): 'enum_item' { return 'enum_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: 'enum', type: 'enum' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { EnumBuilder };

export function enum_(name: Builder<TypeIdentifier>): EnumBuilder {
  return new EnumBuilder(name);
}

export interface EnumItemOptions {
  nodeKind: 'enum_item';
  name: Builder<TypeIdentifier> | string;
  typeParameters?: Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'>;
  body: Builder<EnumVariantList> | Omit<EnumVariantListOptions, 'nodeKind'>;
  children?: Builder<VisibilityModifier | WhereClause> | VisibilityModifierOptions | WhereClauseOptions | (Builder<VisibilityModifier | WhereClause> | VisibilityModifierOptions | WhereClauseOptions)[];
}

export namespace enum_ {
  export function from(options: Omit<EnumItemOptions, 'nodeKind'>): EnumBuilder {
    const _ctor = options.name;
    const b = new EnumBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v));
    }
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : enum_variant_list.from(_v));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'visibility_modifier': return visibility_modifier.from(_v);   case 'where_clause': return where_clause.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
