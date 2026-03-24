import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DictionarySplat, Expression } from '../types.js';


class DictionarySplatBuilder extends Builder<DictionarySplat> {
  private _children: Builder<Expression>[] = [];

  constructor(children: Builder<Expression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('**');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DictionarySplat {
    return {
      kind: 'dictionary_splat',
      children: this._children[0]!.build(ctx),
    } as DictionarySplat;
  }

  override get nodeKind(): 'dictionary_splat' { return 'dictionary_splat'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '**', type: '**' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { DictionarySplatBuilder };

export function dictionary_splat(children: Builder<Expression>): DictionarySplatBuilder {
  return new DictionarySplatBuilder(children);
}

export interface DictionarySplatOptions {
  nodeKind: 'dictionary_splat';
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace dictionary_splat {
  export function from(input: Omit<DictionarySplatOptions, 'nodeKind'> | Builder<Expression> | (Builder<Expression>)[]): DictionarySplatBuilder {
    const options: Omit<DictionarySplatOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<DictionarySplatOptions, 'nodeKind'>
      : { children: input } as Omit<DictionarySplatOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new DictionarySplatBuilder(_ctor);
    return b;
  }
}
