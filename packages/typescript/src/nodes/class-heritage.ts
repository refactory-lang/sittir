import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClassHeritage } from '../types.js';


class ClassHeritageBuilder extends BaseBuilder<ClassHeritage> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ClassHeritage {
    return {
      kind: 'class_heritage',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ClassHeritage;
  }

  override get nodeKind(): string { return 'class_heritage'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function class_heritage(children: BaseBuilder[]): ClassHeritageBuilder {
  return new ClassHeritageBuilder(children);
}
