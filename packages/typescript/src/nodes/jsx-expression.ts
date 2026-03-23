import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, JsxExpression, SequenceExpression, SpreadElement } from '../types.js';


class JsxExpressionBuilder extends Builder<JsxExpression> {
  private _children: Builder<Expression | SequenceExpression | SpreadElement>[] = [];

  constructor() { super(); }

  children(...value: Builder<Expression | SequenceExpression | SpreadElement>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): JsxExpression {
    return {
      kind: 'jsx_expression',
      children: this._children.map(c => c.build(ctx)),
    } as JsxExpression;
  }

  override get nodeKind(): string { return 'jsx_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { JsxExpressionBuilder };

export function jsx_expression(): JsxExpressionBuilder {
  return new JsxExpressionBuilder();
}

export interface JsxExpressionOptions {
  children?: Builder<Expression | SequenceExpression | SpreadElement> | (Builder<Expression | SequenceExpression | SpreadElement>)[];
}

export namespace jsx_expression {
  export function from(options: JsxExpressionOptions): JsxExpressionBuilder {
    const b = new JsxExpressionBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
