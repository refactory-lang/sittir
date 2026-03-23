import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldDeclarationList, TypeIdentifier, TypeParameters, UnionItem, VisibilityModifier, WhereClause } from '../types.js';


class UnionBuilder extends Builder<UnionItem> {
  private _body!: Builder<FieldDeclarationList>;
  private _name: Builder<TypeIdentifier>;
  private _typeParameters?: Builder<TypeParameters>;
  private _children: Builder<VisibilityModifier | WhereClause>[] = [];

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  body(value: Builder<FieldDeclarationList>): this {
    this._body = value;
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
    parts.push('union');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UnionItem {
    return {
      kind: 'union_item',
      body: this._body?.build(ctx),
      name: this._name.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as UnionItem;
  }

  override get nodeKind(): string { return 'union_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'union', type: 'union' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { UnionBuilder };

export function union(name: Builder<TypeIdentifier>): UnionBuilder {
  return new UnionBuilder(name);
}

export interface UnionItemOptions {
  body: Builder<FieldDeclarationList>;
  name: Builder<TypeIdentifier> | string;
  typeParameters?: Builder<TypeParameters>;
  children?: Builder<VisibilityModifier | WhereClause> | (Builder<VisibilityModifier | WhereClause>)[];
}

export namespace union {
  export function from(options: UnionItemOptions): UnionBuilder {
    const _ctor = options.name;
    const b = new UnionBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.body !== undefined) b.body(options.body);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
