import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { PairPattern } from '../types.js';


class PairPatternBuilder extends BaseBuilder<PairPattern> {
  private _key: BaseBuilder;
  private _value!: BaseBuilder;

  constructor(key: BaseBuilder) {
    super();
    this._key = key;
  }

  value(value: BaseBuilder): this {
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

  build(ctx?: RenderContext): PairPattern {
    return {
      kind: 'pair_pattern',
      key: this.renderChild(this._key, ctx),
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
    } as unknown as PairPattern;
  }

  override get nodeKind(): string { return 'pair_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._key) parts.push({ kind: 'builder', builder: this._key, fieldName: 'key' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export function pair_pattern(key: BaseBuilder): PairPatternBuilder {
  return new PairPatternBuilder(key);
}
