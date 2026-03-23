import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssignmentPattern, ComputedPropertyName, Number, PairPattern, Pattern, PrivatePropertyIdentifier, PropertyIdentifier, String } from '../types.js';


class PairPatternBuilder extends Builder<PairPattern> {
  private _key: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
  private _value!: Builder<Pattern | AssignmentPattern>;

  constructor(key: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>) {
    super();
    this._key = key;
  }

  value(value: Builder<Pattern | AssignmentPattern>): this {
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
      key: this._key.build(ctx),
      value: this._value?.build(ctx),
    } as PairPattern;
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

export type { PairPatternBuilder };

export function pair_pattern(key: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>): PairPatternBuilder {
  return new PairPatternBuilder(key);
}

export interface PairPatternOptions {
  key: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
  value: Builder<Pattern | AssignmentPattern>;
}

export namespace pair_pattern {
  export function from(options: PairPatternOptions): PairPatternBuilder {
    const b = new PairPatternBuilder(options.key);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
