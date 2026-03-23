import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TokenBindingPattern } from '../types.js';


class TokenBindingPatternBuilder extends BaseBuilder<TokenBindingPattern> {
  private _name: BaseBuilder;
  private _type!: BaseBuilder;

  constructor(name: BaseBuilder) {
    super();
    this._name = name;
  }

  type(value: BaseBuilder): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push(':');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TokenBindingPattern {
    return {
      kind: 'token_binding_pattern',
      name: this.renderChild(this._name, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
    } as unknown as TokenBindingPattern;
  }

  override get nodeKind(): string { return 'token_binding_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export function token_binding_pattern(name: BaseBuilder): TokenBindingPatternBuilder {
  return new TokenBindingPatternBuilder(name);
}
