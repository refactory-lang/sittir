import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Dictionary, DictionarySplat, Pair } from '../types.js';
import { pair } from './pair.js';
import type { PairOptions } from './pair.js';
import { dictionary_splat } from './dictionary-splat.js';
import type { DictionarySplatOptions } from './dictionary-splat.js';


class DictionaryBuilder extends Builder<Dictionary> {
  private _children: Builder<Pair | DictionarySplat>[] = [];

  constructor() { super(); }

  children(...value: Builder<Pair | DictionarySplat>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Dictionary {
    return {
      kind: 'dictionary',
      children: this._children.map(c => c.build(ctx)),
    } as Dictionary;
  }

  override get nodeKind(): 'dictionary' { return 'dictionary'; }

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
  nodeKind: 'dictionary';
  children?: Builder<Pair | DictionarySplat> | PairOptions | DictionarySplatOptions | (Builder<Pair | DictionarySplat> | PairOptions | DictionarySplatOptions)[];
}

export namespace dictionary {
  export function from(input: Omit<DictionaryOptions, 'nodeKind'> | Builder<Pair | DictionarySplat> | PairOptions | DictionarySplatOptions | (Builder<Pair | DictionarySplat> | PairOptions | DictionarySplatOptions)[]): DictionaryBuilder {
    const options: Omit<DictionaryOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<DictionaryOptions, 'nodeKind'>
      : { children: input } as Omit<DictionaryOptions, 'nodeKind'>;
    const b = new DictionaryBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'pair': return pair.from(_v);   case 'dictionary_splat': return dictionary_splat.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
