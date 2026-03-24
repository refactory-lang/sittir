import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Constraint, Type } from '../types.js';


class ConstraintBuilder extends Builder<Constraint> {
  private _children: Builder<Type>[] = [];

  constructor(children: Builder<Type>) {
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
      children: this._children[0]!.build(ctx),
    } as Constraint;
  }

  override get nodeKind(): 'constraint' { return 'constraint'; }

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

export function constraint(children: Builder<Type>): ConstraintBuilder {
  return new ConstraintBuilder(children);
}

export interface ConstraintOptions {
  nodeKind: 'constraint';
  children: Builder<Type> | (Builder<Type>)[];
}

export namespace constraint {
  export function from(input: Omit<ConstraintOptions, 'nodeKind'> | Builder<Type> | (Builder<Type>)[]): ConstraintBuilder {
    const options: Omit<ConstraintOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ConstraintOptions, 'nodeKind'>
      : { children: input } as Omit<ConstraintOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ConstraintBuilder(_ctor);
    return b;
  }
}
