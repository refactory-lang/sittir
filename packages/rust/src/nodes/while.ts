import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { WhileExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class WhileBuilder extends BaseBuilder<WhileExpression> {
  private _body: Child;
  private _condition!: Child;
  private _children: Child[] = [];

  constructor(body: Child) {
    super();
    this._body = body;
  }

  condition(value: Child): this {
    this._condition = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('while');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WhileExpression {
    return {
      kind: 'while_expression',
      body: this.renderChild(this._body, ctx),
      condition: this._condition ? this.renderChild(this._condition, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as WhileExpression;
  }

  override get nodeKind(): string { return 'while_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'while', type: 'while' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export function while_(body: Child): WhileBuilder {
  return new WhileBuilder(body);
}
