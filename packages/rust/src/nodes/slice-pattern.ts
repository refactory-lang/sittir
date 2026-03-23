import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Pattern, SlicePattern } from '../types.js';


class SlicePatternBuilder extends Builder<SlicePattern> {
  private _children: Builder<Pattern>[] = [];

  constructor() { super(); }

  children(...value: Builder<Pattern>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SlicePattern {
    return {
      kind: 'slice_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as SlicePattern;
  }

  override get nodeKind(): string { return 'slice_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { SlicePatternBuilder };

export function slice_pattern(): SlicePatternBuilder {
  return new SlicePatternBuilder();
}

export interface SlicePatternOptions {
  children?: Builder<Pattern> | (Builder<Pattern>)[];
}

export namespace slice_pattern {
  export function from(options: SlicePatternOptions): SlicePatternBuilder {
    const b = new SlicePatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
