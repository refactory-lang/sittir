import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ReturnExpression } from '../types.js';


class ReturnBuilder extends Builder<ReturnExpression> {
  private _children: Builder<Expression>[] = [];

  constructor() { super(); }

  children(...value: Builder<Expression>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('return');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ReturnExpression {
    return {
      kind: 'return_expression',
      children: this._children[0]?.build(ctx),
    } as ReturnExpression;
  }

  override get nodeKind(): string { return 'return_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'return', type: 'return' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ReturnBuilder };

export function return_(): ReturnBuilder {
  return new ReturnBuilder();
}

export interface ReturnExpressionOptions {
  children?: Builder<Expression> | (Builder<Expression>)[];
}

export namespace return_ {
  export function from(options: ReturnExpressionOptions): ReturnBuilder {
    const b = new ReturnBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
