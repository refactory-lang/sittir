import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TokenRepetition } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TokenRepetitionBuilder extends BaseBuilder<TokenRepetition> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TokenRepetition {
    return {
      kind: 'token_repetition',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TokenRepetition;
  }

  override get nodeKind(): string { return 'token_repetition'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function token_repetition(): TokenRepetitionBuilder {
  return new TokenRepetitionBuilder();
}
