import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ParenthesizedExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ParenthesizedBuilder extends BaseBuilder<ParenthesizedExpression> {
  private _type?: Child;
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  type(value: Child): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ParenthesizedExpression {
    return {
      kind: 'parenthesized_expression',
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ParenthesizedExpression;
  }

  override get nodeKind(): string { return 'parenthesized_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export function parenthesized(children: Child): ParenthesizedBuilder {
  return new ParenthesizedBuilder(children);
}
