import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BaseFieldInitializer } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class BaseFieldInitializerBuilder extends BaseBuilder<BaseFieldInitializer> {
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

  build(ctx?: RenderContext): BaseFieldInitializer {
    return {
      kind: 'base_field_initializer',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as BaseFieldInitializer;
  }

  override get nodeKind(): string { return 'base_field_initializer'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function base_field_initializer(children: Child): BaseFieldInitializerBuilder {
  return new BaseFieldInitializerBuilder(children);
}
