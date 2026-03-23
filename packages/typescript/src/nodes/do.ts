import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DoStatement } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class DoBuilder extends BaseBuilder<DoStatement> {
  private _body: Child;
  private _condition!: Child;

  constructor(body: Child) {
    super();
    this._body = body;
  }

  condition(value: Child): this {
    this._condition = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('do');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    parts.push('while');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DoStatement {
    return {
      kind: 'do_statement',
      body: this.renderChild(this._body, ctx),
      condition: this._condition ? this.renderChild(this._condition, ctx) : undefined,
    } as unknown as DoStatement;
  }

  override get nodeKind(): string { return 'do_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'do', type: 'do' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    parts.push({ kind: 'token', text: 'while', type: 'while' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    return parts;
  }
}

export function do_(body: Child): DoBuilder {
  return new DoBuilder(body);
}
