import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MacroInvocation } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class MacroInvocationBuilder extends BaseBuilder<MacroInvocation> {
  private _macro: Child;
  private _children: Child[] = [];

  constructor(macro: Child) {
    super();
    this._macro = macro;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._macro) parts.push(this.renderChild(this._macro, ctx));
    parts.push('!');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MacroInvocation {
    return {
      kind: 'macro_invocation',
      macro: this.renderChild(this._macro, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as MacroInvocation;
  }

  override get nodeKind(): string { return 'macro_invocation'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._macro) parts.push({ kind: 'builder', builder: this._macro, fieldName: 'macro' });
    parts.push({ kind: 'token', text: '!', type: '!' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function macro_invocation(macro: Child): MacroInvocationBuilder {
  return new MacroInvocationBuilder(macro);
}
