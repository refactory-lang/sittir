import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, YieldExpression } from '../types.js';


class YieldExpressionBuilder extends Builder<YieldExpression> {
  private _children: Builder<Expression>[] = [];

  constructor() { super(); }

  children(...value: Builder<Expression>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('yield');
    parts.push('*');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): YieldExpression {
    return {
      kind: 'yield_expression',
      children: this._children[0]?.build(ctx),
    } as YieldExpression;
  }

  override get nodeKind(): string { return 'yield_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'yield', type: 'yield' });
    parts.push({ kind: 'token', text: '*', type: '*' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { YieldExpressionBuilder };

export function yield_expression(): YieldExpressionBuilder {
  return new YieldExpressionBuilder();
}

export interface YieldExpressionOptions {
  children?: Builder<Expression> | (Builder<Expression>)[];
}

export namespace yield_expression {
  export function from(options: YieldExpressionOptions): YieldExpressionBuilder {
    const b = new YieldExpressionBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
