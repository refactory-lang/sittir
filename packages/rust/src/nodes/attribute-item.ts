import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Attribute, AttributeItem } from '../types.js';


class AttributeBuilder extends Builder<AttributeItem> {
  private _children: Builder<Attribute>[] = [];

  constructor(children: Builder<Attribute>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('#');
    parts.push('[');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AttributeItem {
    return {
      kind: 'attribute_item',
      children: this._children[0]?.build(ctx),
    } as AttributeItem;
  }

  override get nodeKind(): string { return 'attribute_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '#', type: '#' });
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { AttributeBuilder };

export function attribute(children: Builder<Attribute>): AttributeBuilder {
  return new AttributeBuilder(children);
}

export interface AttributeItemOptions {
  children: Builder<Attribute> | (Builder<Attribute>)[];
}

export namespace attribute {
  export function from(options: AttributeItemOptions): AttributeBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new AttributeBuilder(_ctor);
    return b;
  }
}
