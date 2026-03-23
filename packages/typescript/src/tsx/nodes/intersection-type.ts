import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { IntersectionType } from '../types.js';


class IntersectionTypeBuilder extends Builder<IntersectionType> {
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length === 1) {
      parts.push('&');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' & ', ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): IntersectionType {
    return {
      kind: 'intersection_type',
      children: this._children.map(c => c.build(ctx)),
    } as IntersectionType;
  }

  override get nodeKind(): string { return 'intersection_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: '&', type: '&' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { IntersectionTypeBuilder };

export function intersection_type(...children: Builder[]): IntersectionTypeBuilder {
  return new IntersectionTypeBuilder(...children);
}

export interface IntersectionTypeOptions {
  children: Builder | (Builder)[];
}

export namespace intersection_type {
  export function from(options: IntersectionTypeOptions): IntersectionTypeBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new IntersectionTypeBuilder(..._arr);
    return b;
  }
}
