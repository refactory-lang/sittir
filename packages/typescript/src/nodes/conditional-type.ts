import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConditionalType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ConditionalTypeBuilder extends BaseBuilder<ConditionalType> {
  private _alternative: Child;
  private _consequence!: Child;
  private _left!: Child;
  private _right!: Child;

  constructor(alternative: Child) {
    super();
    this._alternative = alternative;
  }

  consequence(value: Child): this {
    this._consequence = value;
    return this;
  }

  left(value: Child): this {
    this._left = value;
    return this;
  }

  right(value: Child): this {
    this._right = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('conditional');
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    if (this._consequence) {
      parts.push('{', this.renderChild(this._consequence, ctx), '}');
    }
    if (this._alternative) {
      const alt = this.renderChild(this._alternative, ctx);
      parts.push(alt.startsWith('if ') ? 'else ' + alt : 'else { ' + alt + ' }');
    }
    if (this._right) parts.push(this.renderChild(this._right, ctx));
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
    parts.push({ kind: 'token', text: 'conditional' });
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._consequence) parts.push({ kind: 'builder', builder: this._consequence, fieldName: 'consequence' });
    if (this._alternative) parts.push({ kind: 'builder', builder: this._alternative, fieldName: 'alternative' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export function conditional_type(alternative: Child): ConditionalTypeBuilder {
  return new ConditionalTypeBuilder(alternative);
}
