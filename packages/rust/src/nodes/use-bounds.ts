import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeIdentifier, UseBounds } from '../types.js';


class UseBoundsBuilder extends Builder<UseBounds> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('use');
    parts.push('<');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push('>');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UseBounds {
    return {
      kind: 'use_bounds',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as UseBounds;
  }

  override get nodeKind(): string { return 'use_bounds'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'use', type: 'use' });
    parts.push({ kind: 'token', text: '<', type: '<' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: '>', type: '>' });
    return parts;
  }
}

export type { UseBoundsBuilder };

export function use_bounds(): UseBoundsBuilder {
  return new UseBoundsBuilder();
}

export interface UseBoundsOptions {
  children?: Builder<TypeIdentifier> | (Builder<TypeIdentifier>)[];
}

export namespace use_bounds {
  export function from(options: UseBoundsOptions): UseBoundsBuilder {
    const b = new UseBoundsBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
