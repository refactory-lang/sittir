import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConditionalType, Type } from '../types.js';


class ConditionalTypeBuilder extends Builder<ConditionalType> {
  private _left: Builder<Type>;
  private _right!: Builder<Type>;
  private _consequence!: Builder<Type>;
  private _alternative!: Builder<Type>;

  constructor(left: Builder<Type>) {
    super();
    this._left = left;
  }

  right(value: Builder<Type>): this {
    this._right = value;
    return this;
  }

  consequence(value: Builder<Type>): this {
    this._consequence = value;
    return this;
  }

  alternative(value: Builder<Type>): this {
    this._alternative = value;
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
      left: this._left.build(ctx),
      right: this._right?.build(ctx),
      consequence: this._consequence?.build(ctx),
      alternative: this._alternative?.build(ctx),
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

export function conditional_type(left: Builder<Type>): ConditionalTypeBuilder {
  return new ConditionalTypeBuilder(left);
}

export interface ConditionalTypeOptions {
  left: Builder<Type>;
  right: Builder<Type>;
  consequence: Builder<Type>;
  alternative: Builder<Type>;
}

export namespace conditional_type {
  export function from(options: ConditionalTypeOptions): ConditionalTypeBuilder {
    const b = new ConditionalTypeBuilder(options.left);
    if (options.right !== undefined) b.right(options.right);
    if (options.consequence !== undefined) b.consequence(options.consequence);
    if (options.alternative !== undefined) b.alternative(options.alternative);
    return b;
  }
}
