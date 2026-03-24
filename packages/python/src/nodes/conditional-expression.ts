import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConditionalExpression, Expression } from '../types.js';


class ConditionalExpressionBuilder extends Builder<ConditionalExpression> {
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

  override get nodeKind(): 'conditional_expression' { return 'conditional_expression'; }

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

export type { ConditionalExpressionBuilder };

export function conditional_expression(...children: Builder<Expression>[]): ConditionalExpressionBuilder {
  return new ConditionalExpressionBuilder(...children);
}

export interface ConditionalExpressionOptions {
  nodeKind: 'conditional_expression';
  children?: Builder<Expression> | (Builder<Expression>)[];
}

export namespace conditional_expression {
  export function from(input: Omit<ConditionalExpressionOptions, 'nodeKind'> | Builder<Expression> | (Builder<Expression>)[]): ConditionalExpressionBuilder {
    const options: Omit<ConditionalExpressionOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ConditionalExpressionOptions, 'nodeKind'>
      : { children: input } as Omit<ConditionalExpressionOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ConditionalExpressionBuilder(..._arr);
    return b;
  }
}
