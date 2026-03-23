import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MacroRule, TokenTree, TokenTreePattern } from '../types.js';


class MacroRuleBuilder extends Builder<MacroRule> {
  private _left: Builder;
  private _right!: Builder;

  constructor(left: Builder) {
    super();
    this._left = left;
  }

  right(value: Builder): this {
    this._right = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    parts.push('=>');
    if (this._right) parts.push(this.renderChild(this._right, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MacroRule {
    return {
      kind: 'macro_rule',
      left: this.renderChild(this._left, ctx),
      right: this._right ? this.renderChild(this._right, ctx) : undefined,
    } as unknown as MacroRule;
  }

  override get nodeKind(): string { return 'macro_rule'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    parts.push({ kind: 'token', text: '=>', type: '=>' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export type { MacroRuleBuilder };

export function macro_rule(left: Builder): MacroRuleBuilder {
  return new MacroRuleBuilder(left);
}

export interface MacroRuleOptions {
  left: Builder<TokenTreePattern>;
  right: Builder<TokenTree>;
}

export namespace macro_rule {
  export function from(options: MacroRuleOptions): MacroRuleBuilder {
    const b = new MacroRuleBuilder(options.left);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
