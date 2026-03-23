import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FormatExpression, FormatSpecifier } from '../types.js';


class FormatSpecifierBuilder extends Builder<FormatSpecifier> {
  private _children: Builder<FormatExpression>[] = [];

  constructor() { super(); }

  children(...value: Builder<FormatExpression>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push(':');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FormatSpecifier {
    return {
      kind: 'format_specifier',
      children: this._children.map(c => c.build(ctx)),
    } as FormatSpecifier;
  }

  override get nodeKind(): string { return 'format_specifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: ':', type: ':' });
    return parts;
  }
}

export type { FormatSpecifierBuilder };

export function format_specifier(): FormatSpecifierBuilder {
  return new FormatSpecifierBuilder();
}

export interface FormatSpecifierOptions {
  children?: Builder<FormatExpression> | (Builder<FormatExpression>)[];
}

export namespace format_specifier {
  export function from(options: FormatSpecifierOptions): FormatSpecifierBuilder {
    const b = new FormatSpecifierBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
