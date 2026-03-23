import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, Label, LoopExpression } from '../types.js';


class LoopExpressionBuilder extends Builder<LoopExpression> {
  private _body: Builder<Block>;
  private _children: Builder<Label>[] = [];

  constructor(body: Builder<Block>) {
    super();
    this._body = body;
  }

  children(...value: Builder<Label>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('loop');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LoopExpression {
    return {
      kind: 'loop_expression',
      body: this._body.build(ctx),
      children: this._children[0]?.build(ctx),
    } as LoopExpression;
  }

  override get nodeKind(): string { return 'loop_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'loop', type: 'loop' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { LoopExpressionBuilder };

export function loop_expression(body: Builder<Block>): LoopExpressionBuilder {
  return new LoopExpressionBuilder(body);
}

export interface LoopExpressionOptions {
  body: Builder<Block>;
  children?: Builder<Label> | (Builder<Label>)[];
}

export namespace loop_expression {
  export function from(options: LoopExpressionOptions): LoopExpressionBuilder {
    const b = new LoopExpressionBuilder(options.body);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
