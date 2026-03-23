import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Constraint } from '../types.js';


class ConstraintBuilder extends Builder<Constraint> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
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

export type { ConstraintBuilder };

export function constraint(children: Builder): ConstraintBuilder {
  return new ConstraintBuilder(children);
}

export interface ConstraintOptions {
  children: Builder | (Builder)[];
}

export namespace constraint {
  export function from(options: ConstraintOptions): ConstraintBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ConstraintBuilder(_ctor);
    return b;
  }
}
