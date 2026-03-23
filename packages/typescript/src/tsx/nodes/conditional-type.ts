import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConditionalType } from '../types.js';


class ConditionalTypeBuilder extends Builder<ConditionalType> {
  private _alternative!: Builder;
  private _consequence!: Builder;
  private _left: Builder;
  private _right!: Builder;

  constructor(left: Builder) {
    super();
    this._left = left;
  }

  alternative(value: Builder): this {
    this._alternative = value;
    return this;
  }

  consequence(value: Builder): this {
    this._consequence = value;
    return this;
  }

  right(value: Builder): this {
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
      alternative: this._alternative?.build(ctx),
      consequence: this._consequence?.build(ctx),
      left: this._left.build(ctx),
      right: this._right?.build(ctx),
    } as ConditionalType;
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

export type { ConditionalTypeBuilder };

export function conditional_type(left: Builder): ConditionalTypeBuilder {
  return new ConditionalTypeBuilder(left);
}

export interface ConditionalTypeOptions {
  alternative: Builder;
  consequence: Builder;
  left: Builder;
  right: Builder;
}

export namespace conditional_type {
  export function from(options: ConditionalTypeOptions): ConditionalTypeBuilder {
    const b = new ConditionalTypeBuilder(options.left);
    if (options.alternative !== undefined) b.alternative(options.alternative);
    if (options.consequence !== undefined) b.consequence(options.consequence);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
