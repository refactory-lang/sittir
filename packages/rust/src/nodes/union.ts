import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldDeclarationList, TypeIdentifier, TypeParameters, UnionItem, VisibilityModifier, WhereClause } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { field_declaration_list } from './field-declaration-list.js';
import type { FieldDeclarationListOptions } from './field-declaration-list.js';
import { visibility_modifier } from './visibility-modifier.js';
import type { VisibilityModifierOptions } from './visibility-modifier.js';
import { where_clause } from './where-clause.js';
import type { WhereClauseOptions } from './where-clause.js';


class UnionBuilder extends Builder<UnionItem> {
  private _name: Builder<TypeIdentifier>;
  private _typeParameters?: Builder<TypeParameters>;
  private _body!: Builder<FieldDeclarationList>;
  private _children: Builder<VisibilityModifier | WhereClause>[] = [];

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  body(value: Builder<FieldDeclarationList>): this {
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
    parts.push('union');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UnionItem {
    return {
      kind: 'union_item',
      name: this._name.build(ctx),
      typeParameters: this._typeParameters ? this._typeParameters.build(ctx) : undefined,
      body: this._body ? this._body.build(ctx) : undefined,
      children: this._children.map(c => c.build(ctx)),
    } as UnionItem;
  }

  override get nodeKind(): 'union_item' { return 'union_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: 'union', type: 'union' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { UnionBuilder };

export function union(name: Builder<TypeIdentifier>): UnionBuilder {
  return new UnionBuilder(name);
}

export interface UnionItemOptions {
  nodeKind: 'union_item';
  name: Builder<TypeIdentifier> | string;
  typeParameters?: Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'>;
  body: Builder<FieldDeclarationList> | Omit<FieldDeclarationListOptions, 'nodeKind'>;
  children?: Builder<VisibilityModifier | WhereClause> | VisibilityModifierOptions | WhereClauseOptions | (Builder<VisibilityModifier | WhereClause> | VisibilityModifierOptions | WhereClauseOptions)[];
}

export namespace union {
  export function from(options: Omit<UnionItemOptions, 'nodeKind'>): UnionBuilder {
    const _ctor = options.name;
    const b = new UnionBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v));
    }
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : field_declaration_list.from(_v));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'visibility_modifier': return visibility_modifier.from(_v);   case 'where_clause': return where_clause.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
