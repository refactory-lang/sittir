import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ReferenceExpression } from '../types.js';


class ReferenceBuilder extends BaseBuilder<ReferenceExpression> {
  private _value: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(value: BaseBuilder) {
    super();
    this._value = value;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('&');
    parts.push('raw');
    parts.push('const');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ReferenceExpression {
    return {
      kind: 'reference_expression',
      value: this.renderChild(this._value, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ReferenceExpression;
  }

  override get nodeKind(): string { return 'reference_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '&', type: '&' });
    parts.push({ kind: 'token', text: 'raw', type: 'raw' });
    parts.push({ kind: 'token', text: 'const', type: 'const' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export function reference(value: BaseBuilder): ReferenceBuilder {
  return new ReferenceBuilder(value);
}
