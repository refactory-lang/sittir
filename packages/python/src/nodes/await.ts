import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Await, PrimaryExpression } from '../types.js';


class AwaitBuilder extends Builder<Await> {
  private _children: Builder<PrimaryExpression>[] = [];

  constructor(children: Builder<PrimaryExpression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('await');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Await {
    return {
      kind: 'await',
      children: this._children[0]!.build(ctx),
    } as Await;
  }

  override get nodeKind(): 'await' { return 'await'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'await', type: 'await' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { AwaitBuilder };

export function await_(children: Builder<PrimaryExpression>): AwaitBuilder {
  return new AwaitBuilder(children);
}

export interface AwaitOptions {
  nodeKind: 'await';
  children: Builder<PrimaryExpression> | (Builder<PrimaryExpression>)[];
}

export namespace await_ {
  export function from(input: Omit<AwaitOptions, 'nodeKind'> | Builder<PrimaryExpression> | (Builder<PrimaryExpression>)[]): AwaitBuilder {
    const options: Omit<AwaitOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<AwaitOptions, 'nodeKind'>
      : { children: input } as Omit<AwaitOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new AwaitBuilder(_ctor);
    return b;
  }
}
