import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EscapeSequence, StringContent, StringLiteral } from '../types.js';


class StringLiteralBuilder extends Builder<StringLiteral> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('"');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): StringLiteral {
    return {
      kind: 'string_literal',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as StringLiteral;
  }

  override get nodeKind(): string { return 'string_literal'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '"', type: '"' });
    return parts;
  }
}

export type { StringLiteralBuilder };

export function string_literal(): StringLiteralBuilder {
  return new StringLiteralBuilder();
}

export interface StringLiteralOptions {
  children?: Builder<EscapeSequence | StringContent> | (Builder<EscapeSequence | StringContent>)[];
}

export namespace string_literal {
  export function from(options: StringLiteralOptions): StringLiteralBuilder {
    const b = new StringLiteralBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
