import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { UnionType } from '../types.js';


class UnionTypeBuilder extends Builder<UnionType> {
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length === 1) {
      parts.push('|');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' | ', ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UnionType {
    return {
      kind: 'union_type',
      children: this._children.map(c => c.build(ctx)),
    } as UnionType;
  }

  override get nodeKind(): string { return 'union_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: '|', type: '|' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { UnionTypeBuilder };

export function union_type(...children: Builder[]): UnionTypeBuilder {
  return new UnionTypeBuilder(...children);
}

export interface UnionTypeOptions {
  children: Builder | (Builder)[];
}

export namespace union_type {
  export function from(options: UnionTypeOptions): UnionTypeBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new UnionTypeBuilder(..._arr);
    return b;
  }
}
