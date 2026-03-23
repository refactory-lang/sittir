import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConditionalType } from '../types.js';


class ConditionalTypeBuilder extends BaseBuilder<ConditionalType> {
  private _alternative: BaseBuilder;
  private _consequence!: BaseBuilder;
  private _left!: BaseBuilder;
  private _right!: BaseBuilder;

  constructor(alternative: BaseBuilder) {
    super();
    this._alternative = alternative;
  }

  consequence(value: BaseBuilder): this {
    this._consequence = value;
    return this;
  }

  left(value: BaseBuilder): this {
    this._left = value;
    return this;
  }

  right(value: BaseBuilder): this {
    this._right = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    parts.push('extends');
    if (this._right) parts.push(this.renderChild(this._right, ctx));
    parts.push('?');
    if (this._consequence) parts.push(this.renderChild(this._consequence, ctx));
    parts.push(':');
    if (this._alternative) parts.push(this.renderChild(this._alternative, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ConditionalType {
    return {
      kind: 'conditional_type',
      alternative: this.renderChild(this._alternative, ctx),
      consequence: this._consequence ? this.renderChild(this._consequence, ctx) : undefined,
      left: this._left ? this.renderChild(this._left, ctx) : undefined,
      right: this._right ? this.renderChild(this._right, ctx) : undefined,
    } as unknown as ConditionalType;
  }

  override get nodeKind(): string { return 'conditional_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    parts.push({ kind: 'token', text: 'extends', type: 'extends' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    parts.push({ kind: 'token', text: '?', type: '?' });
    if (this._consequence) parts.push({ kind: 'builder', builder: this._consequence, fieldName: 'consequence' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._alternative) parts.push({ kind: 'builder', builder: this._alternative, fieldName: 'alternative' });
    return parts;
  }
}

export function conditional_type(alternative: BaseBuilder): ConditionalTypeBuilder {
  return new ConditionalTypeBuilder(alternative);
}
