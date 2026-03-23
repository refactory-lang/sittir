import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MatchPattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class MatchPatternBuilder extends BaseBuilder<MatchPattern> {
  private _condition?: Child;
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  condition(value: Child): this {
    this._condition = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('match');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MatchPattern {
    return {
      kind: 'match_pattern',
      condition: this._condition ? this.renderChild(this._condition, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as MatchPattern;
  }

  override get nodeKind(): string { return 'match_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'match' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function match_pattern(children: Child): MatchPatternBuilder {
  return new MatchPatternBuilder(children);
}
