import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AsExpression, Expression } from '../types.js';


class AsBuilder extends Builder<AsExpression> {
  private _children: Builder<Expression>[] = [];

  constructor(...children: Builder<Expression>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('as');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AsExpression {
    return {
      kind: 'as_expression',
      children: this._children.map(c => c.build(ctx)),
    } as AsExpression;
  }

  override get nodeKind(): string { return 'as_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: 'as', type: 'as' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { AsBuilder };

export function as(...children: Builder<Expression>[]): AsBuilder {
  return new AsBuilder(...children);
}

export interface AsExpressionOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace as {
  export function from(options: AsExpressionOptions): AsBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new AsBuilder(..._arr);
    return b;
  }
}
