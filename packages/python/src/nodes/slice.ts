import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, Slice } from '../types.js';


class SliceBuilder extends Builder<Slice> {
  private _children: Builder<Expression>[] = [];

  constructor() { super(); }

  children(...value: Builder<Expression>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length === 1) {
      parts.push(':');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' : ', ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Slice {
    return {
      kind: 'slice',
      children: this._children.map(c => c.build(ctx)),
    } as Slice;
  }

  override get nodeKind(): 'slice' { return 'slice'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ':', type: ':' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { SliceBuilder };

export function slice(): SliceBuilder {
  return new SliceBuilder();
}

export interface SliceOptions {
  nodeKind: 'slice';
  children?: Builder<Expression> | (Builder<Expression>)[];
}

export namespace slice {
  export function from(input: Omit<SliceOptions, 'nodeKind'> | Builder<Expression> | (Builder<Expression>)[]): SliceBuilder {
    const options: Omit<SliceOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<SliceOptions, 'nodeKind'>
      : { children: input } as Omit<SliceOptions, 'nodeKind'>;
    const b = new SliceBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
