import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EscapeSequence, String, StringFragment } from '../types.js';


class StringBuilder extends Builder<String> {
  private _children: Builder<StringFragment | EscapeSequence>[] = [];

  constructor() { super(); }

  children(...value: Builder<StringFragment | EscapeSequence>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('"');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('"');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): String {
    return {
      kind: 'string',
      children: this._children.map(c => c.build(ctx)),
    } as String;
  }

  override get nodeKind(): string { return 'string'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '"', type: '"' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '"', type: '"' });
    return parts;
  }
}

export type { StringBuilder };

export function string(): StringBuilder {
  return new StringBuilder();
}

export interface StringOptions {
  children?: Builder<StringFragment | EscapeSequence> | (Builder<StringFragment | EscapeSequence>)[];
}

export namespace string {
  export function from(options: StringOptions): StringBuilder {
    const b = new StringBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
