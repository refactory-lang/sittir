import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LoopExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class LoopBuilder extends BaseBuilder<LoopExpression> {
  private _body: Child;
  private _children: Child[] = [];

  constructor(body: Child) {
    super();
    this._body = body;
  }

  children(value: Child[]): this {
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

export function loop(body: Child): LoopBuilder {
  return new LoopBuilder(body);
}
