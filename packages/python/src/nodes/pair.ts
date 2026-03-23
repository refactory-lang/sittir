import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, Pair } from '../types.js';


class PairBuilder extends Builder<Pair> {
  private _key: Builder<Expression>;
  private _value!: Builder<Expression>;

  constructor(key: Builder<Expression>) {
    super();
    this._key = key;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._key) parts.push(this.renderChild(this._key, ctx));
    parts.push(':');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Pair {
    return {
      kind: 'pair',
      key: this._key.build(ctx),
      value: this._value?.build(ctx),
    } as Pair;
  }

  override get nodeKind(): string { return 'pair'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._key) parts.push({ kind: 'builder', builder: this._key, fieldName: 'key' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { PairBuilder };

export function pair(key: Builder<Expression>): PairBuilder {
  return new PairBuilder(key);
}

export interface PairOptions {
  key: Builder<Expression>;
  value: Builder<Expression>;
}

export namespace pair {
  export function from(options: PairOptions): PairBuilder {
    const b = new PairBuilder(options.key);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
