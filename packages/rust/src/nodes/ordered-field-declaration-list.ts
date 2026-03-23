import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AttributeItem, OrderedFieldDeclarationList, Type, VisibilityModifier } from '../types.js';


class OrderedFieldDeclarationListBuilder extends Builder<OrderedFieldDeclarationList> {
  private _type: Builder[] = [];
  private _children: Builder[] = [];

  constructor() { super(); }

  type(...value: Builder[]): this {
    this._type = value;
    return this;
  }

  children(...value: Builder[]): this {
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
      type: this._type.map(c => this.renderChild(c, ctx)),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as OrderedFieldDeclarationList;
  }

  override get nodeKind(): string { return 'ordered_field_declaration_list'; }

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
  type?: Builder<Type> | (Builder<Type>)[];
  children?: Builder<AttributeItem | VisibilityModifier> | (Builder<AttributeItem | VisibilityModifier>)[];
}

export namespace ordered_field_declaration_list {
  export function from(options: OrderedFieldDeclarationListOptions): OrderedFieldDeclarationListBuilder {
    const b = new OrderedFieldDeclarationListBuilder();
    if (options.type !== undefined) {
      const _v = options.type;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.type(..._arr);
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
