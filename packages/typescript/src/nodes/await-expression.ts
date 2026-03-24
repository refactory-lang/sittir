import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AwaitExpression, Expression } from '../types.js';


class AwaitExpressionBuilder extends Builder<AwaitExpression> {
  private _children: Builder<Expression>[] = [];

  constructor(children: Builder<Expression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('await');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AwaitExpression {
    return {
      kind: 'await_expression',
      children: this._children[0]!.build(ctx),
    } as AwaitExpression;
  }

  override get nodeKind(): 'await_expression' { return 'await_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'await', type: 'await' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { AwaitExpressionBuilder };

export function await_expression(children: Builder<Expression>): AwaitExpressionBuilder {
  return new AwaitExpressionBuilder(children);
}

export interface AwaitExpressionOptions {
  nodeKind: 'await_expression';
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace await_expression {
  export function from(input: Omit<AwaitExpressionOptions, 'nodeKind'> | Builder<Expression> | (Builder<Expression>)[]): AwaitExpressionBuilder {
    const options: Omit<AwaitExpressionOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<AwaitExpressionOptions, 'nodeKind'>
      : { children: input } as Omit<AwaitExpressionOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new AwaitExpressionBuilder(_ctor);
    return b;
  }
}
