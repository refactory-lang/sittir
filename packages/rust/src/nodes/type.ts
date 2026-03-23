import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Type, TypeIdentifier, TypeItem, TypeParameters, VisibilityModifier, WhereClause } from '../types.js';


class TypeBuilder extends Builder<TypeItem> {
  private _name: Builder<TypeIdentifier>;
  private _type!: Builder<Type>;
  private _typeParameters?: Builder<TypeParameters>;
  private _children: Builder<VisibilityModifier | WhereClause>[] = [];

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  type(value: Builder<Type>): this {
    this._type = value;
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
    parts.push('type');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    parts.push('=');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    parts.push(';');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeItem {
    return {
      kind: 'type_item',
      name: this._name.build(ctx),
      type: this._type?.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as TypeItem;
  }

  override get nodeKind(): string { return 'type_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'type', type: 'type' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export type { TypeBuilder };

export function type_(name: Builder<TypeIdentifier>): TypeBuilder {
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
