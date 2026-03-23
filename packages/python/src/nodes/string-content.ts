import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EscapeInterpolation, EscapeSequence, StringContent } from '../types.js';


class StringContentBuilder extends Builder<StringContent> {
  private _children: Builder<EscapeInterpolation | EscapeSequence>[] = [];

  constructor() { super(); }

  children(...value: Builder<EscapeInterpolation | EscapeSequence>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): StringContent {
    return {
      kind: 'string_content',
      children: this._children.map(c => c.build(ctx)),
    } as StringContent;
  }

  override get nodeKind(): string { return 'string_content'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { StringContentBuilder };

export function string_content(): StringContentBuilder {
  return new StringContentBuilder();
}

export interface StringContentOptions {
  children?: Builder<EscapeInterpolation | EscapeSequence> | (Builder<EscapeInterpolation | EscapeSequence>)[];
}

export namespace string_content {
  export function from(options: StringContentOptions): StringContentBuilder {
    const b = new StringContentBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
