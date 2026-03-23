import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Constraint } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ConstraintBuilder extends BaseBuilder<Constraint> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('extends');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Constraint {
    return {
      kind: 'constraint',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as Constraint;
  }

  override get nodeKind(): string { return 'constraint'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'extends', type: 'extends' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function constraint(children: Child): ConstraintBuilder {
  return new ConstraintBuilder(children);
}
