import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Regex } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class RegexBuilder extends BaseBuilder<Regex> {
  private _flags?: Child;
  private _pattern: Child;

  constructor(pattern: Child) {
    super();
    this._pattern = pattern;
  }

  flags(value: Child): this {
    this._flags = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    if (this._flags) parts.push(this.renderChild(this._flags, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Regex {
    return {
      kind: 'regex',
      flags: this._flags ? this.renderChild(this._flags, ctx) : undefined,
      pattern: this.renderChild(this._pattern, ctx),
    } as unknown as Regex;
  }

  override get nodeKind(): string { return 'regex'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    if (this._flags) parts.push({ kind: 'builder', builder: this._flags, fieldName: 'flags' });
    return parts;
  }
}

export function regex(pattern: Child): RegexBuilder {
  return new RegexBuilder(pattern);
}
