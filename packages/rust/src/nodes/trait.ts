import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DeclarationList, TraitBounds, TraitItem, TypeIdentifier, TypeParameters, VisibilityModifier, WhereClause } from '../types.js';


class TraitBuilder extends Builder<TraitItem> {
  private _body!: Builder<DeclarationList>;
  private _bounds?: Builder<TraitBounds>;
  private _name: Builder<TypeIdentifier>;
  private _typeParameters?: Builder<TypeParameters>;
  private _children: Builder<VisibilityModifier | WhereClause>[] = [];

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  body(value: Builder<DeclarationList>): this {
    this._body = value;
    return this;
  }

  bounds(value: Builder<TraitBounds>): this {
    this._bounds = value;
    return this;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  children(...value: Builder<VisibilityModifier | WhereClause>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('trait');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._bounds) parts.push(this.renderChild(this._bounds, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TraitItem {
    return {
      kind: 'trait_item',
      body: this._body?.build(ctx),
      bounds: this._bounds?.build(ctx),
      name: this._name.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as TraitItem;
  }

  override get nodeKind(): string { return 'trait_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'trait', type: 'trait' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._bounds) parts.push({ kind: 'builder', builder: this._bounds, fieldName: 'bounds' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { TraitBuilder };

export function trait(name: Builder<TypeIdentifier>): TraitBuilder {
  return new TraitBuilder(name);
}

export interface TraitItemOptions {
  body: Builder<DeclarationList>;
  bounds?: Builder<TraitBounds>;
  name: Builder<TypeIdentifier> | string;
  typeParameters?: Builder<TypeParameters>;
  children?: Builder<VisibilityModifier | WhereClause> | (Builder<VisibilityModifier | WhereClause>)[];
}

export namespace trait {
  export function from(options: TraitItemOptions): TraitBuilder {
    const _ctor = options.name;
    const b = new TraitBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.body !== undefined) b.body(options.body);
    if (options.bounds !== undefined) b.bounds(options.bounds);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
