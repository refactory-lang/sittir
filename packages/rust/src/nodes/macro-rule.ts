import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MacroRule } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class MacroRuleBuilder extends BaseBuilder<MacroRule> {
  private _left: Child;
  private _right!: Child;

  constructor(left: Child) {
    super();
    this._left = left;
  }

  right(value: Child): this {
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

export function macro_rule(left: Child): MacroRuleBuilder {
  return new MacroRuleBuilder(left);
}
