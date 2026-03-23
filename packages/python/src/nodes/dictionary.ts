import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Dictionary, DictionarySplat, Pair } from '../types.js';


class DictionaryBuilder extends Builder<Dictionary> {
  private _children: Builder<DictionarySplat | Pair>[] = [];

  constructor() { super(); }

  children(...value: Builder<DictionarySplat | Pair>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Dictionary {
    return {
      kind: 'dictionary',
      children: this._children.map(c => c.build(ctx)),
    } as Dictionary;
  }

  override get nodeKind(): string { return 'dictionary'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { DictionaryBuilder };

export function dictionary(): DictionaryBuilder {
  return new DictionaryBuilder();
}

export interface DictionaryOptions {
  children?: Builder<DictionarySplat | Pair> | (Builder<DictionarySplat | Pair>)[];
}

export namespace dictionary {
  export function from(options: DictionaryOptions): DictionaryBuilder {
    const b = new DictionaryBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
