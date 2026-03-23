import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, LetChain, LetCondition, MatchPattern, Pattern } from '../types.js';


class MatchPatternBuilder extends Builder<MatchPattern> {
  private _condition?: Builder;
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  condition(value: Builder): this {
    this._condition = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._condition) {
      parts.push('if');
      if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    }
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._condition) {
      parts.push({ kind: 'token', text: 'if', type: 'if' });
      if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    }
    return parts;
  }
}

export type { MatchPatternBuilder };

export function match_pattern(children: Builder): MatchPatternBuilder {
  return new MatchPatternBuilder(children);
}

export interface MatchPatternOptions {
  condition?: Builder<Expression | LetChain | LetCondition>;
  children: Builder<Pattern> | (Builder<Pattern>)[];
}

export namespace match_pattern {
  export function from(options: MatchPatternOptions): MatchPatternBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new MatchPatternBuilder(_ctor);
    if (options.condition !== undefined) b.condition(options.condition);
    return b;
  }
}
