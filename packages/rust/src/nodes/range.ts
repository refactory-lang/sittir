import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, RangeExpression } from '../types.js';


class RangeBuilder extends Builder<RangeExpression> {
  private _children: Builder<Expression>[] = [];

  constructor() { super(); }

  children(...value: Builder<Expression>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('..');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RangeExpression {
    return {
      kind: 'range_expression',
      children: this._children.map(c => c.build(ctx)),
    } as RangeExpression;
  }

  override get nodeKind(): string { return 'range_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '..', type: '..' });
    return parts;
  }
}

export type { RangeBuilder };

export function range(): RangeBuilder {
  return new RangeBuilder();
}

export interface RangeExpressionOptions {
  children?: Builder<Expression> | (Builder<Expression>)[];
}

export namespace range {
  export function from(options: RangeExpressionOptions): RangeBuilder {
    const b = new RangeBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
