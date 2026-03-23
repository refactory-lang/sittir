import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, SatisfiesExpression } from '../types.js';


class SatisfiesExpressionBuilder extends Builder<SatisfiesExpression> {
  private _children: Builder<Expression>[] = [];

  constructor(...children: Builder<Expression>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('satisfies');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SatisfiesExpression {
    return {
      kind: 'satisfies_expression',
      children: this._children.map(c => c.build(ctx)),
    } as SatisfiesExpression;
  }

  override get nodeKind(): string { return 'satisfies_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: 'satisfies', type: 'satisfies' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { SatisfiesExpressionBuilder };

export function satisfies_expression(...children: Builder<Expression>[]): SatisfiesExpressionBuilder {
  return new SatisfiesExpressionBuilder(...children);
}

export interface SatisfiesExpressionOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace satisfies_expression {
  export function from(options: SatisfiesExpressionOptions): SatisfiesExpressionBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new SatisfiesExpressionBuilder(..._arr);
    return b;
  }
}
