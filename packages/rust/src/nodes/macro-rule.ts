import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MacroRule, TokenTree, TokenTreePattern } from '../types.js';
import { token_tree_pattern } from './token-tree-pattern.js';
import type { TokenTreePatternOptions } from './token-tree-pattern.js';
import { token_tree } from './token-tree.js';
import type { TokenTreeOptions } from './token-tree.js';


class MacroRuleBuilder extends Builder<MacroRule> {
  private _left: Builder<TokenTreePattern>;
  private _right!: Builder<TokenTree>;

  constructor(left: Builder<TokenTreePattern>) {
    super();
    this._left = left;
  }

  right(value: Builder<TokenTree>): this {
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
      left: this._left.build(ctx),
      right: this._right ? this._right.build(ctx) : undefined,
    } as MacroRule;
  }

  override get nodeKind(): 'macro_rule' { return 'macro_rule'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    parts.push({ kind: 'token', text: '=>', type: '=>' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export type { MacroRuleBuilder };

export function macro_rule(left: Builder<TokenTreePattern>): MacroRuleBuilder {
  return new MacroRuleBuilder(left);
}

export interface MacroRuleOptions {
  nodeKind: 'macro_rule';
  left: Builder<TokenTreePattern> | Omit<TokenTreePatternOptions, 'nodeKind'>;
  right: Builder<TokenTree> | Omit<TokenTreeOptions, 'nodeKind'>;
}

export namespace macro_rule {
  export function from(options: Omit<MacroRuleOptions, 'nodeKind'>): MacroRuleBuilder {
    const _ctor = options.left;
    const b = new MacroRuleBuilder(_ctor instanceof Builder ? _ctor : token_tree_pattern.from(_ctor));
    if (options.right !== undefined) {
      const _v = options.right;
      b.right(_v instanceof Builder ? _v : token_tree.from(_v));
    }
    return b;
  }
}
