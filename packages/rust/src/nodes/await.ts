import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AwaitExpression, Expression } from '../types.js';


class AwaitBuilder extends Builder<AwaitExpression> {
  private _children: Builder<Expression>[] = [];

  constructor(children: Builder<Expression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('.');
    parts.push('await');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AwaitExpression {
    return {
      kind: 'await_expression',
      children: this._children[0]?.build(ctx),
    } as AwaitExpression;
  }

  override get nodeKind(): string { return 'await_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '.', type: '.' });
    parts.push({ kind: 'token', text: 'await', type: 'await' });
    return parts;
  }
}

export type { AwaitBuilder };

export function await_(children: Builder<Expression>): AwaitBuilder {
  return new AwaitBuilder(children);
}

export interface AwaitExpressionOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace await_ {
  export function from(options: AwaitExpressionOptions): AwaitBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new AwaitBuilder(_ctor);
    return b;
  }
}
