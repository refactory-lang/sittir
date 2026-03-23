import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Label, LoopExpression } from '../types.js';


class LoopBuilder extends Builder<LoopExpression> {
  private _body: Builder;
  private _children: Builder[] = [];

  constructor(body: Builder) {
    super();
    this._body = body;
  }

  children(...value: Builder[]): this {
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
      body: this.renderChild(this._body, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as LoopExpression;
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

export type { LoopBuilder };

export function loop(body: Builder): LoopBuilder {
  return new LoopBuilder(body);
}

export interface LoopExpressionOptions {
  body: Builder;
  children?: Builder<Label> | (Builder<Label>)[];
}

export namespace loop {
  export function from(options: LoopExpressionOptions): LoopBuilder {
    const b = new LoopBuilder(options.body);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
