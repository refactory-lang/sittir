import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ForInClause, IfClause, ListComprehension } from '../types.js';


class ListComprehensionBuilder extends Builder<ListComprehension> {
  private _body: Builder<Expression>;
  private _children: Builder<ForInClause | IfClause>[] = [];

  constructor(body: Builder<Expression>) {
    super();
    this._body = body;
  }

  children(...value: Builder<ForInClause | IfClause>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ListComprehension {
    return {
      kind: 'list_comprehension',
      body: this._body.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as ListComprehension;
  }

  override get nodeKind(): string { return 'list_comprehension'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '[', type: '[' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { ListComprehensionBuilder };

export function list_comprehension(body: Builder<Expression>): ListComprehensionBuilder {
  return new ListComprehensionBuilder(body);
}

export interface ListComprehensionOptions {
  body: Builder<Expression>;
  children?: Builder<ForInClause | IfClause> | (Builder<ForInClause | IfClause>)[];
}

export namespace list_comprehension {
  export function from(options: ListComprehensionOptions): ListComprehensionBuilder {
    const b = new ListComprehensionBuilder(options.body);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
