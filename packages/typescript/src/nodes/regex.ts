import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Regex, RegexFlags, RegexPattern } from '../types.js';


class RegexBuilder extends Builder<Regex> {
  private _pattern: Builder<RegexPattern>;
  private _flags?: Builder<RegexFlags>;

  constructor(pattern: Builder<RegexPattern>) {
    super();
    this._pattern = pattern;
  }

  flags(value: Builder<RegexFlags>): this {
    this._flags = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('/');
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    parts.push('/');
    if (this._flags) parts.push(this.renderChild(this._flags, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Regex {
    return {
      kind: 'regex',
      pattern: this._pattern.build(ctx),
      flags: this._flags?.build(ctx),
    } as Regex;
  }

  override get nodeKind(): string { return 'regex'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '/', type: '/' });
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    parts.push({ kind: 'token', text: '/', type: '/' });
    if (this._flags) parts.push({ kind: 'builder', builder: this._flags, fieldName: 'flags' });
    return parts;
  }
}

export type { RegexBuilder };

export function regex(pattern: Builder<RegexPattern>): RegexBuilder {
  return new RegexBuilder(pattern);
}

export interface RegexOptions {
  pattern: Builder<RegexPattern> | string;
  flags?: Builder<RegexFlags> | string;
}

export namespace regex {
  export function from(options: RegexOptions): RegexBuilder {
    const _ctor = options.pattern;
    const b = new RegexBuilder(typeof _ctor === 'string' ? new LeafBuilder('regex_pattern', _ctor) : _ctor);
    if (options.flags !== undefined) {
      const _v = options.flags;
      b.flags(typeof _v === 'string' ? new LeafBuilder('regex_flags', _v) : _v);
    }
    return b;
  }
}
