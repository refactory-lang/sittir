import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssignmentExpression } from '../types.js';


class AssignmentBuilder extends BaseBuilder<AssignmentExpression> {
  private _left: BaseBuilder;
  private _right!: BaseBuilder;

  constructor(left: BaseBuilder) {
    super();
    this._left = left;
  }

  right(value: BaseBuilder): this {
    this._right = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    parts.push('=');
    if (this._right) parts.push(this.renderChild(this._right, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AssignmentExpression {
    return {
      kind: 'assignment_expression',
      left: this.renderChild(this._left, ctx),
      right: this._right ? this.renderChild(this._right, ctx) : undefined,
    } as unknown as AssignmentExpression;
  }

  override get nodeKind(): string { return 'assignment_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export function assignment(left: BaseBuilder): AssignmentBuilder {
  return new AssignmentBuilder(left);
}
