import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Chevron, Expression } from '../types.js';


class ChevronBuilder extends Builder<Chevron> {
  private _children: Builder<Expression>[] = [];

  constructor(children: Builder<Expression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('>>');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Chevron {
    return {
      kind: 'chevron',
      children: this._children[0]!.build(ctx),
    } as Chevron;
  }

  override get nodeKind(): 'chevron' { return 'chevron'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '>>', type: '>>' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ChevronBuilder };

export function chevron(children: Builder<Expression>): ChevronBuilder {
  return new ChevronBuilder(children);
}

export interface ChevronOptions {
  nodeKind: 'chevron';
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace chevron {
  export function from(input: Omit<ChevronOptions, 'nodeKind'> | Builder<Expression> | (Builder<Expression>)[]): ChevronBuilder {
    const options: Omit<ChevronOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ChevronOptions, 'nodeKind'>
      : { children: input } as Omit<ChevronOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ChevronBuilder(_ctor);
    return b;
  }
}
