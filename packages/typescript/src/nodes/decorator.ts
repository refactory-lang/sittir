import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Decorator } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class DecoratorBuilder extends BaseBuilder<Decorator> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Decorator {
    return {
      kind: 'decorator',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as Decorator;
  }

  override get nodeKind(): string { return 'decorator'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function decorator(children: Child): DecoratorBuilder {
  return new DecoratorBuilder(children);
}
