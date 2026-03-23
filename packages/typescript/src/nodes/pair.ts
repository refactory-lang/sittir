import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Pair } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class PairBuilder extends BaseBuilder<Pair> {
  private _key: Child;
  private _value!: Child;

  constructor(key: Child) {
    super();
    this._key = key;
  }

  value(value: Child): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    if (this._key) parts.push(this.renderChild(this._key, ctx));
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
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    if (this._key) parts.push({ kind: 'builder', builder: this._key, fieldName: 'key' });
    return parts;
  }
}

export function pair(key: Child): PairBuilder {
  return new PairBuilder(key);
}
