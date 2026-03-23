import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Attribute, InnerAttributeItem } from '../types.js';


class InnerAttributeBuilder extends Builder<InnerAttributeItem> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('#');
    parts.push('!');
    parts.push('[');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): InnerAttributeItem {
    return {
      kind: 'inner_attribute_item',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as InnerAttributeItem;
  }

  override get nodeKind(): string { return 'inner_attribute_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '#', type: '#' });
    parts.push({ kind: 'token', text: '!', type: '!' });
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { InnerAttributeBuilder };

export function inner_attribute(children: Builder): InnerAttributeBuilder {
  return new InnerAttributeBuilder(children);
}

export interface InnerAttributeItemOptions {
  children: Builder<Attribute> | (Builder<Attribute>)[];
}

export namespace inner_attribute {
  export function from(options: InnerAttributeItemOptions): InnerAttributeBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new InnerAttributeBuilder(_ctor);
    return b;
  }
}
