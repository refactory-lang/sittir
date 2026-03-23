import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ComputedPropertyName, Expression, Pair, PrivatePropertyIdentifier, PropertyIdentifier } from '../types.js';


class PairBuilder extends Builder<Pair> {
  private _key: Builder;
  private _value!: Builder;

  constructor(key: Builder) {
    super();
    this._key = key;
  }

  value(value: Builder): this {
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
      key: this.renderChild(this._key, ctx),
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
    } as unknown as Pair;
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

export function pair(key: Builder): PairBuilder {
  return new PairBuilder(key);
}

export interface PairOptions {
  key: Builder<ComputedPropertyName | PrivatePropertyIdentifier | PropertyIdentifier>;
  value: Builder<Expression>;
}

export namespace pair {
  export function from(options: PairOptions): PairBuilder {
    const b = new PairBuilder(options.key);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
