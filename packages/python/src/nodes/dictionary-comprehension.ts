import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DictionaryComprehension, ForInClause, IfClause, Pair } from '../types.js';


class DictionaryComprehensionBuilder extends Builder<DictionaryComprehension> {
  private _body: Builder<Pair>;
  private _children: Builder<ForInClause | IfClause>[] = [];

  constructor(body: Builder<Pair>) {
    super();
    this._body = body;
  }

  children(...value: Builder<ForInClause | IfClause>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DictionaryComprehension {
    return {
      kind: 'dictionary_comprehension',
      body: this._body.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as DictionaryComprehension;
  }

  override get nodeKind(): string { return 'dictionary_comprehension'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { DictionaryComprehensionBuilder };

export function dictionary_comprehension(body: Builder<Pair>): DictionaryComprehensionBuilder {
  return new DictionaryComprehensionBuilder(body);
}

export interface DictionaryComprehensionOptions {
  body: Builder<Pair>;
  children?: Builder<ForInClause | IfClause> | (Builder<ForInClause | IfClause>)[];
}

export namespace dictionary_comprehension {
  export function from(options: DictionaryComprehensionOptions): DictionaryComprehensionBuilder {
    const b = new DictionaryComprehensionBuilder(options.body);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
