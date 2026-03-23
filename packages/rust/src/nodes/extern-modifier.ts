import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExternModifier } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ExternModifierBuilder extends BaseBuilder<ExternModifier> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExternModifier {
    return {
      kind: 'extern_modifier',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ExternModifier;
  }

  override get nodeKind(): string { return 'extern_modifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function extern_modifier(): ExternModifierBuilder {
  return new ExternModifierBuilder();
}
