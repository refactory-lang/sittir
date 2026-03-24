import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Decorator, Expression } from '../types.js';


class DecoratorBuilder extends Builder<Decorator> {
  private _children: Builder<Expression>[] = [];

  constructor(children: Builder<Expression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('@');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Decorator {
    return {
      kind: 'decorator',
      children: this._children[0]!.build(ctx),
    } as Decorator;
  }

  override get nodeKind(): 'decorator' { return 'decorator'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '@', type: '@' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { DecoratorBuilder };

export function decorator(children: Builder<Expression>): DecoratorBuilder {
  return new DecoratorBuilder(children);
}

export interface DecoratorOptions {
  nodeKind: 'decorator';
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace decorator {
  export function from(input: Omit<DecoratorOptions, 'nodeKind'> | Builder<Expression> | (Builder<Expression>)[]): DecoratorBuilder {
    const options: Omit<DecoratorOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<DecoratorOptions, 'nodeKind'>
      : { children: input } as Omit<DecoratorOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new DecoratorBuilder(_ctor);
    return b;
  }
}
