import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ContinueStatement, StatementIdentifier } from '../types.js';


class ContinueBuilder extends Builder<ContinueStatement> {
  private _label?: Builder;

  constructor() { super(); }

  label(value: Builder): this {
    this._label = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('continue');
    if (this._label) parts.push(this.renderChild(this._label, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ContinueStatement {
    return {
      kind: 'continue_statement',
      label: this._label ? this.renderChild(this._label, ctx) : undefined,
    } as unknown as ContinueStatement;
  }

  override get nodeKind(): string { return 'continue_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'continue', type: 'continue' });
    if (this._label) parts.push({ kind: 'builder', builder: this._label, fieldName: 'label' });
    return parts;
  }
}

export type { ContinueBuilder };

export function continue_(): ContinueBuilder {
  return new ContinueBuilder();
}

export interface ContinueStatementOptions {
  label?: Builder<StatementIdentifier> | string;
}

export namespace continue_ {
  export function from(options: ContinueStatementOptions): ContinueBuilder {
    const b = new ContinueBuilder();
    if (options.label !== undefined) {
      const _v = options.label;
      b.label(typeof _v === 'string' ? new LeafBuilder('statement_identifier', _v) : _v);
    }
    return b;
  }
}
