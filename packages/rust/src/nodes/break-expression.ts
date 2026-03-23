import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BreakExpression, Expression, Label } from '../types.js';


class BreakExpressionBuilder extends Builder<BreakExpression> {
  private _children: Builder<Expression | Label>[] = [];

  constructor() { super(); }

  children(...value: Builder<Expression | Label>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('break');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): BreakExpression {
    return {
      kind: 'break_expression',
      children: this._children.map(c => c.build(ctx)),
    } as BreakExpression;
  }

  override get nodeKind(): string { return 'break_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'break', type: 'break' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { BreakExpressionBuilder };

export function break_expression(): BreakExpressionBuilder {
  return new BreakExpressionBuilder();
}

export interface BreakExpressionOptions {
  children?: Builder<Expression | Label> | (Builder<Expression | Label>)[];
}

export namespace break_expression {
  export function from(options: BreakExpressionOptions): BreakExpressionBuilder {
    const b = new BreakExpressionBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
