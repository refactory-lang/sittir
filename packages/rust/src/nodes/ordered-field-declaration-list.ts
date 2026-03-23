import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { OrderedFieldDeclarationList } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class OrderedFieldDeclarationListBuilder extends BaseBuilder<OrderedFieldDeclarationList> {
  private _type: Child[] = [];
  private _children: Child[] = [];

  constructor() { super(); }

  type(value: Child[]): this {
    this._type = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._type.length > 0) {
      if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
      if (this._type.length > 0) parts.push(this.renderChildren(this._type, ', ', ctx));
      parts.push(',');
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
      for (const child of this._children) {
        parts.push({ kind: 'builder', builder: child });
      }
      for (const child of this._type) {
        parts.push({ kind: 'builder', builder: child, fieldName: 'type' });
      }
      parts.push({ kind: 'token', text: ',', type: ',' });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export function ordered_field_declaration_list(): OrderedFieldDeclarationListBuilder {
  return new OrderedFieldDeclarationListBuilder();
}
