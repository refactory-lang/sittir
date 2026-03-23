import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConditionalExpression, Expression } from '../types.js';


class ConditionalBuilder extends Builder<ConditionalExpression> {
  private _children: Builder<Expression>[] = [];

  constructor(...children: Builder<Expression>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('if');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    parts.push('else');
    if (this._children[2]) parts.push(this.renderChild(this._children[2]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ConditionalExpression {
    return {
      kind: 'conditional_expression',
      children: this._children.map(c => c.build(ctx)),
    } as ConditionalExpression;
  }

  override get nodeKind(): string { return 'conditional_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: 'if', type: 'if' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    parts.push({ kind: 'token', text: 'else', type: 'else' });
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    return parts;
  }
}

export type { ConditionalBuilder };

export function conditional(...children: Builder<Expression>[]): ConditionalBuilder {
  return new ConditionalBuilder(...children);
}

export interface ConditionalExpressionOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace conditional {
  export function from(options: ConditionalExpressionOptions): ConditionalBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new ConditionalBuilder(..._arr);
    return b;
  }
}
