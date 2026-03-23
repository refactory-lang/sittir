import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Type, TypeIdentifier, TypeItem, TypeParameters, VisibilityModifier, WhereClause } from '../types.js';


class TypeBuilder extends Builder<TypeItem> {
  private _name: Builder;
  private _type!: Builder;
  private _typeParameters?: Builder;
  private _children: Builder[] = [];

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  type(value: Builder): this {
    this._type = value;
    return this;
  }

  typeParameters(value: Builder): this {
    this._typeParameters = value;
    return this;
  }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('type');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    parts.push('=');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._children[2]) parts.push(this.renderChild(this._children[2]!, ctx));
    parts.push(';');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeItem {
    return {
      kind: 'type_item',
      name: this.renderChild(this._name, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TypeItem;
  }

  override get nodeKind(): string { return 'type_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: 'type', type: 'type' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export type { TypeBuilder };

export function type_(name: Builder): TypeBuilder {
  return new TypeBuilder(name);
}

export interface TypeItemOptions {
  name: Builder<TypeIdentifier> | string;
  type: Builder<Type>;
  typeParameters?: Builder<TypeParameters>;
  children?: Builder<VisibilityModifier | WhereClause> | (Builder<VisibilityModifier | WhereClause>)[];
}

export namespace type_ {
  export function from(options: TypeItemOptions): TypeBuilder {
    const _ctor = options.name;
    const b = new TypeBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.type !== undefined) b.type(options.type);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
