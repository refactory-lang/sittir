import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { WhileStatement } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class WhileBuilder extends BaseBuilder<WhileStatement> {
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
    parts.push('while');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    if (this._body) {
      parts.push('{');
      parts.push(this.renderChild(this._body, ctx));
      parts.push('}');
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WhileStatement {
    return {
      kind: 'while_statement',
      body: this.renderChild(this._body, ctx),
      condition: this._condition ? this.renderChild(this._condition, ctx) : undefined,
    } as unknown as WhileStatement;
  }

  override get nodeKind(): string { return 'while_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'while' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    if (this._body) {
      parts.push({ kind: 'token', text: '{', type: '{' });
      parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
      parts.push({ kind: 'token', text: '}', type: '}' });
    }
    return parts;
  }
}

export function while_(body: Child): WhileBuilder {
  return new WhileBuilder(body);
}
