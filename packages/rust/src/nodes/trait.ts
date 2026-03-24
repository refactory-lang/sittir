import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DeclarationList, TraitBounds, TraitItem, TypeIdentifier, TypeParameters, VisibilityModifier, WhereClause } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { trait_bounds } from './trait-bounds.js';
import type { TraitBoundsOptions } from './trait-bounds.js';
import { declaration_list } from './declaration-list.js';
import type { DeclarationListOptions } from './declaration-list.js';
import { visibility_modifier } from './visibility-modifier.js';
import type { VisibilityModifierOptions } from './visibility-modifier.js';
import { where_clause } from './where-clause.js';
import type { WhereClauseOptions } from './where-clause.js';


class TraitBuilder extends Builder<TraitItem> {
  private _name: Builder<TypeIdentifier>;
  private _typeParameters?: Builder<TypeParameters>;
  private _bounds?: Builder<TraitBounds>;
  private _body!: Builder<DeclarationList>;
  private _children: Builder<VisibilityModifier | WhereClause>[] = [];

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  bounds(value: Builder<TraitBounds>): this {
    this._bounds = value;
    return this;
  }

  body(value: Builder<DeclarationList>): this {
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
    parts.push('trait');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._bounds) parts.push(this.renderChild(this._bounds, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TraitItem {
    return {
      kind: 'trait_item',
      name: this._name.build(ctx),
      typeParameters: this._typeParameters ? this._typeParameters.build(ctx) : undefined,
      bounds: this._bounds ? this._bounds.build(ctx) : undefined,
      body: this._body ? this._body.build(ctx) : undefined,
      children: this._children.map(c => c.build(ctx)),
    } as TraitItem;
  }

  override get nodeKind(): 'trait_item' { return 'trait_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: 'trait', type: 'trait' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._bounds) parts.push({ kind: 'builder', builder: this._bounds, fieldName: 'bounds' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { TraitBuilder };

export function trait(name: Builder<TypeIdentifier>): TraitBuilder {
  return new TraitBuilder(name);
}

export interface TraitItemOptions {
  nodeKind: 'trait_item';
  name: Builder<TypeIdentifier> | string;
  typeParameters?: Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'>;
  bounds?: Builder<TraitBounds> | Omit<TraitBoundsOptions, 'nodeKind'>;
  body: Builder<DeclarationList> | Omit<DeclarationListOptions, 'nodeKind'>;
  children?: Builder<VisibilityModifier | WhereClause> | VisibilityModifierOptions | WhereClauseOptions | (Builder<VisibilityModifier | WhereClause> | VisibilityModifierOptions | WhereClauseOptions)[];
}

export namespace trait {
  export function from(options: Omit<TraitItemOptions, 'nodeKind'>): TraitBuilder {
    const _ctor = options.name;
    const b = new TraitBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v));
    }
    if (options.bounds !== undefined) {
      const _v = options.bounds;
      b.bounds(_v instanceof Builder ? _v : trait_bounds.from(_v));
    }
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : declaration_list.from(_v));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'visibility_modifier': return visibility_modifier.from(_v);   case 'where_clause': return where_clause.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
