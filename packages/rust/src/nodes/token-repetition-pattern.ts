import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TokenRepetitionPattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TokenRepetitionPatternBuilder extends BaseBuilder<TokenRepetitionPattern> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('$');
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
    parts.push('+');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TokenRepetitionPattern {
    return {
      kind: 'token_repetition_pattern',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TokenRepetitionPattern;
  }

  override get nodeKind(): string { return 'token_repetition_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '$', type: '$' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    parts.push({ kind: 'token', text: '+', type: '+' });
    return parts;
  }
}

export function token_repetition_pattern(): TokenRepetitionPatternBuilder {
  return new TokenRepetitionPatternBuilder();
}
