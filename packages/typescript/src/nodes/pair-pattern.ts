import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssignmentPattern, ComputedPropertyName, Number, PairPattern, Pattern, PrivatePropertyIdentifier, PropertyIdentifier, String } from '../types.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';
import { computed_property_name } from './computed-property-name.js';
import type { ComputedPropertyNameOptions } from './computed-property-name.js';
import { assignment_pattern } from './assignment-pattern.js';
import type { AssignmentPatternOptions } from './assignment-pattern.js';


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
      value: this._value ? this._value.build(ctx) : undefined,
    } as PairPattern;
  }

  override get nodeKind(): 'pair_pattern' { return 'pair_pattern'; }

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
  nodeKind: 'pair_pattern';
  key: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName> | StringOptions | ComputedPropertyNameOptions;
  value: Builder<Pattern | AssignmentPattern> | Omit<AssignmentPatternOptions, 'nodeKind'>;
}

export namespace pair_pattern {
  export function from(options: Omit<PairPatternOptions, 'nodeKind'>): PairPatternBuilder {
    const _raw = options.key;
    let _ctor: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'string': _ctor = string.from(_raw); break;
        case 'computed_property_name': _ctor = computed_property_name.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new PairPatternBuilder(_ctor);
    if (options.value !== undefined) {
      const _v = options.value;
      b.value(_v instanceof Builder ? _v : assignment_pattern.from(_v));
    }
    return b;
  }
}
