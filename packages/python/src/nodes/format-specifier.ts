import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FormatExpression, FormatSpecifier } from '../types.js';
import { format_expression } from './format-expression.js';
import type { FormatExpressionOptions } from './format-expression.js';


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

  override get nodeKind(): 'format_specifier' { return 'format_specifier'; }

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
  nodeKind: 'format_specifier';
  children?: Builder<FormatExpression> | Omit<FormatExpressionOptions, 'nodeKind'> | (Builder<FormatExpression> | Omit<FormatExpressionOptions, 'nodeKind'>)[];
}

export namespace format_specifier {
  export function from(input: Omit<FormatSpecifierOptions, 'nodeKind'> | Builder<FormatExpression> | Omit<FormatExpressionOptions, 'nodeKind'> | (Builder<FormatExpression> | Omit<FormatExpressionOptions, 'nodeKind'>)[]): FormatSpecifierBuilder {
    const options: Omit<FormatSpecifierOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<FormatSpecifierOptions, 'nodeKind'>
      : { children: input } as Omit<FormatSpecifierOptions, 'nodeKind'>;
    const b = new FormatSpecifierBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : format_expression.from(_x)));
    }
    return b;
  }
}
